import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.database import get_db, SessionLocal
from app.services.scraper import APIScraper
from app.services.vector_store import VectorStoreService
from app.services.health_checker import APIHealthChecker

# Import agents
from app.agents.doc_analyzer import DocumentationAnalyzer
from app.agents.auth_detector import AuthenticationDetector
from app.agents.endpoint_extractor import EndpointExtractor
from app.agents.security_analyzer import SecurityAnalyzer

logger = logging.getLogger("api_docs_router")
router = APIRouter(prefix="/api-docs", tags=["API Documents"])

# Instantiate helper services
scraper = APIScraper()
vector_store = VectorStoreService()
health_checker = APIHealthChecker()


async def execute_ingestion_pipeline(doc_id: int):
    """
    Background worker orchestrating the multi-agent AI ingestion pipeline:
    Scrape -> Vector Index -> Doc Analyzer -> Auth Detector -> Endpoint Extractor -> Security Analyzer.
    """
    db: Session = SessionLocal()
    try:
        logger.info(f"Starting pipeline for API Document ID: {doc_id}")
        doc = crud.get_api_document(db, doc_id)
        if not doc:
            logger.error(f"API Document with ID {doc_id} not found in DB.")
            return

        # Step 1: Scrape documentation
        crud.update_api_document_status(db, doc_id, "crawling")
        text = await scraper.scrape_url(doc.url)
        
        # Step 2: Index text into FAISS vector database
        crud.update_api_document_status(db, doc_id, "chunking")
        vector_store.index_document(doc_id, text)

        # Step 3: Run Agent 1 (Documentation Analyzer)
        crud.update_api_document_status(db, doc_id, "analyzing")
        analyzer = DocumentationAnalyzer()
        doc_analysis = await analyzer.analyze(text, target_language=doc.target_language)

        # Step 4: Run Agent 2 (Authentication Detector)
        # Query FAISS for security/credentials blocks
        auth_context_chunks = vector_store.query_context(doc_id, "authentication authorize api key oauth oauth2 rate limit", top_k=4)
        auth_context_text = "\n\n".join(auth_context_chunks)
        
        detector = AuthenticationDetector()
        auth_analysis = await detector.detect(auth_context_text)

        # Step 5: Run Agent 3 (Endpoint Extractor)
        # Query FAISS for endpoint definitions
        endpoint_context_chunks = vector_store.query_context(doc_id, "endpoints routes GET POST PUT DELETE API path paths parameters schema", top_k=6)
        endpoint_context_text = "\n\n".join(endpoint_context_chunks)
        
        extractor = EndpointExtractor()
        endpoints_list = await extractor.extract(endpoint_context_text)

        # Step 6: Run Agent 8 (Security Analyzer)
        sec_analyzer = SecurityAnalyzer()
        security_report = await sec_analyzer.analyze_security(
            base_url=doc_analysis.get("base_url") or "https://api.example.com",
            auth_config=auth_analysis,
            endpoints=endpoints_list
        )

        # Step 7: Update records in SQLite Database
        # Create Auth Config
        auth_schema = schemas.AuthConfigBase(
            auth_type=auth_analysis.get("auth_type", "none"),
            header_name=auth_analysis.get("header_name"),
            token_url=auth_analysis.get("token_url"),
            description=auth_analysis.get("description"),
            rate_limit_limit=auth_analysis.get("rate_limit_limit"),
            rate_limit_window=auth_analysis.get("rate_limit_window"),
            rate_limit_strategy=auth_analysis.get("rate_limit_strategy"),
        )
        crud.create_auth_config(db, auth_schema, doc_id)

        # Create Endpoint list
        for ep_data in endpoints_list:
            ep_schema = schemas.EndpointBase(
                path=ep_data.get("path", "/"),
                method=ep_data.get("method", "GET"),
                summary=ep_data.get("summary", ""),
                description=ep_data.get("description", ""),
                parameters=ep_data.get("parameters", []),
                request_schema=ep_data.get("request_schema"),
                response_schema=ep_data.get("response_schema")
            )
            crud.create_endpoint(db, ep_schema, doc_id)

        # Finalize APIDocument details
        crud.update_api_document_details(
            db=db,
            doc_id=doc_id,
            title=doc_analysis.get("title") or "Parsed API Document",
            description=doc_analysis.get("description") or "Automatically generated documentation summary.",
            base_url=doc_analysis.get("base_url") or "https://api.example.com",
            api_type=doc_analysis.get("api_type", "REST"),
            complexity_score=doc_analysis.get("complexity_score", 50),
            quality_score=security_report.get("security_score", 75),  # Map to security and review metrics
            security_score=security_report.get("security_score", 75)
        )
        
        logger.info(f"Pipeline successfully completed for API Document ID {doc_id}")

    except Exception as err:
        logger.error(f"Error executing ingestion pipeline for Doc ID {doc_id}: {err}")
        crud.update_api_document_status(db, doc_id, "failed", error_log=str(err))
    finally:
        db.close()


@router.post("/ingest", response_model=schemas.APIDocumentResponse, status_code=status.HTTP_201_CREATED)
async def ingest_api_documentation(
    payload: schemas.IngestRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """
    Submits a documentation URL, stores it as pending, and launches the AI analysis in the background.
    """
    # Check if URL was already processed
    existing_doc = crud.get_api_document_by_url(db, payload.url)
    if existing_doc:
        # Re-run pipeline if failed, else return cached
        if existing_doc.status == "failed":
            crud.update_api_document_status(db, existing_doc.id, "pending")
            background_tasks.add_task(execute_ingestion_pipeline, existing_doc.id)
        return existing_doc

    # Create new document record
    doc_create = schemas.APIDocumentCreate(url=payload.url, target_language=payload.language)
    db_doc = crud.create_api_document(db, doc_create)
    
    # Run the ingestion script asynchronously in background task
    background_tasks.add_task(execute_ingestion_pipeline, db_doc.id)
    return db_doc


@router.get("/", response_model=List[schemas.APIDocumentResponse])
def read_all_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_api_documents(db, skip=skip, limit=limit)


@router.get("/{doc_id}", response_model=schemas.APIDocumentDetailResponse)
def read_document_detail(doc_id: int, db: Session = Depends(get_db)):
    doc = crud.get_api_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="API Document not found.")
    return doc


@router.get("/{doc_id}/endpoints", response_model=List[schemas.EndpointResponse])
def read_document_endpoints(doc_id: int, db: Session = Depends(get_db)):
    return crud.get_endpoints(db, api_doc_id=doc_id)


@router.post("/{doc_id}/endpoints/{endpoint_id}/check-health", response_model=schemas.EndpointResponse)
async def check_single_endpoint_health(doc_id: int, endpoint_id: int, db: Session = Depends(get_db)):
    """
    Triggers a live connection check against the specific endpoint.
    """
    doc = crud.get_api_document(db, doc_id)
    if not doc or not doc.base_url:
        raise HTTPException(status_code=404, detail="API Document or associated Base URL not found.")
        
    try:
        updated_endpoint = await health_checker.check_endpoint(db, endpoint_id, doc.base_url)
        return updated_endpoint
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Health check execution failed: {err}")
