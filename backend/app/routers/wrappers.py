import os
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.database import get_db, SessionLocal
from app.services.exporter import ExporterService

# Import Agents
from app.agents.wrapper_generator import WrapperGenerator
from app.agents.readme_generator import ReadmeGenerator
from app.agents.code_reviewer import CodeReviewer

logger = logging.getLogger("wrappers_router")
router = APIRouter(prefix="/wrappers", tags=["Wrappers"])

# Instantiate exporters
exporter = ExporterService()


async def execute_wrapper_pipeline(doc_id: int, task_id: int, language: str):
    """
    Background worker orchestrating the wrapper generation, README creation, and quality reviews:
    Generate Client -> Generate README -> Perform Code Review -> Build ZIP Bundle.
    """
    db: Session = SessionLocal()
    try:
        logger.info(f"Starting wrapper pipeline for Task ID: {task_id} ({language})")
        doc = crud.get_api_document(db, doc_id)
        task = crud.get_wrapper_task(db, task_id)
        
        if not doc or not task:
            logger.error(f"Incomplete parameters. Doc ID {doc_id} or Task ID {task_id} not found.")
            return

        crud.update_wrapper_task(db, task_id, "generating")

        # Pull endpoints and auth config
        endpoints = [
            {
                "path": ep.path,
                "method": ep.method,
                "summary": ep.summary,
                "description": ep.description,
                "parameters": ep.parameters,
                "request_schema": ep.request_schema,
                "response_schema": ep.response_schema
            } for ep in doc.endpoints
        ]
        
        # Format Auth Config details
        auth_details = {}
        if doc.auth_configs:
            primary_auth = doc.auth_configs[0]
            auth_details = {
                "auth_type": primary_auth.auth_type,
                "header_name": primary_auth.header_name,
                "token_url": primary_auth.token_url,
                "description": primary_auth.description,
                "rate_limit_limit": primary_auth.rate_limit_limit,
                "rate_limit_window": primary_auth.rate_limit_window,
                "rate_limit_strategy": primary_auth.rate_limit_strategy
            }

        # Step 1: Run Agent 5 (Wrapper Generator)
        generator = WrapperGenerator()
        wrapper_code = await generator.generate_wrapper(
            language=language,
            api_title=doc.title or "API",
            base_url=doc.base_url or "https://api.example.com",
            auth_config=auth_details,
            endpoints=endpoints
        )

        # Step 2: Run Agent 6 (README Generator)
        readme_gen = ReadmeGenerator()
        readme_content = await readme_gen.generate_readme(
            language=language,
            api_title=doc.title or "API",
            wrapper_code=wrapper_code
        )

        # Step 3: Run Agent 7 (Code Reviewer)
        crud.update_wrapper_task(db, task_id, "reviewing")
        reviewer = CodeReviewer()
        review_analysis = await reviewer.review_code(language, wrapper_code)

        # Step 4: Build ZIP Bundle using Exporter Service
        zip_path = exporter.generate_zip_package(
            api_title=doc.title or "API",
            language=language,
            wrapper_code=wrapper_code,
            readme_content=readme_content
        )

        # Save results in sqlite task
        generated_files = {
            "wrapper": wrapper_code,
            "readme": readme_content,
            "zip_path": zip_path,
            "issues": review_analysis.get("issues", []),
            "feedback": review_analysis.get("feedback", "")
        }
        
        crud.update_wrapper_task(
            db=db,
            task_id=task_id,
            status="completed",
            quality_score=review_analysis.get("quality_score", 90),
            security_score=doc.security_score,  # Inherit security metric from doc analysis
            complexity_score=review_analysis.get("complexity_score", 50),
            generated_files=generated_files
        )
        logger.info(f"Wrapper task pipeline completed for Task ID {task_id}")

    except Exception as err:
        logger.error(f"Error executing wrapper pipeline: {err}")
        crud.update_wrapper_task(db, task_id, "failed", error_message=str(err))
    finally:
        db.close()


@router.post("/{doc_id}/generate", response_model=schemas.WrapperTaskResponse, status_code=status.HTTP_202_ACCEPTED)
def generate_sdk_wrapper(
    doc_id: int, 
    payload: schemas.WrapperTaskCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """
    Submits request to generate SDK Wrapper client code in selected language.
    """
    doc = crud.get_api_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="API Document not found.")
        
    db_task = crud.create_wrapper_task(db, doc_id, payload.language)
    
    # Launch background worker
    background_tasks.add_task(execute_wrapper_pipeline, doc_id, db_task.id, payload.language)
    return db_task


@router.get("/{doc_id}/tasks", response_model=List[schemas.WrapperTaskResponse])
def read_wrapper_tasks(doc_id: int, db: Session = Depends(get_db)):
    return crud.get_wrapper_tasks(db, api_doc_id=doc_id)


@router.get("/download/{task_id}")
def download_sdk_zip(task_id: int, db: Session = Depends(get_db)):
    """
    Serves the compiled ZIP package for downloading.
    """
    task = crud.get_wrapper_task(db, task_id)
    if not task or task.status != "completed":
        raise HTTPException(status_code=404, detail="Wrapper SDK package not found or generation not completed.")
        
    zip_path = task.generated_files.get("zip_path")
    if not zip_path or not os.path.exists(zip_path):
        raise HTTPException(status_code=404, detail="ZIP package file could not be found on disk.")
        
    # Return ZIP file
    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=os.path.basename(zip_path)
    )


@router.get("/openapi/{doc_id}")
def download_openapi_spec(doc_id: int, db: Session = Depends(get_db)):
    """
    Generates and returns standard OpenAPI 3.0 Summary JSON schema.
    """
    doc = crud.get_api_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="API Document not found.")
        
    endpoints = [
        {
            "path": ep.path,
            "method": ep.method,
            "summary": ep.summary,
            "description": ep.description,
            "parameters": ep.parameters,
            "request_schema": ep.request_schema,
            "response_schema": ep.response_schema
        } for ep in doc.endpoints
    ]
    
    spec = exporter.generate_openapi_spec(
        api_title=doc.title or "API Spec",
        base_url=doc.base_url or "https://api.example.com",
        endpoints=endpoints
    )
    return spec


@router.get("/postman/{doc_id}")
def download_postman_collection(doc_id: int, db: Session = Depends(get_db)):
    """
    Generates and returns Postman Collection v2.1.0 JSON format.
    """
    doc = crud.get_api_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="API Document not found.")
        
    endpoints = [
        {
            "path": ep.path,
            "method": ep.method,
            "summary": ep.summary,
            "description": ep.description,
            "parameters": ep.parameters,
            "request_schema": ep.request_schema,
            "response_schema": ep.response_schema
        } for ep in doc.endpoints
    ]
    
    collection = exporter.generate_postman_collection(
        api_title=doc.title or "API Collection",
        base_url=doc.base_url or "https://api.example.com",
        endpoints=endpoints
    )
    return collection
