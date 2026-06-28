from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from app import models, schemas

from app.services.security import get_password_hash

# User Queries
def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# APIDocument Queries
def get_api_document(db: Session, doc_id: int) -> Optional[models.APIDocument]:
    return db.query(models.APIDocument).filter(models.APIDocument.id == doc_id).first()


def get_api_document_by_url(db: Session, url: str) -> Optional[models.APIDocument]:
    return db.query(models.APIDocument).filter(models.APIDocument.url == url).first()


def get_api_documents(db: Session, skip: int = 0, limit: int = 100) -> List[models.APIDocument]:
    return db.query(models.APIDocument).order_by(models.APIDocument.created_at.desc()).offset(skip).limit(limit).all()


def create_api_document(db: Session, doc: schemas.APIDocumentCreate) -> models.APIDocument:
    db_doc = models.APIDocument(url=doc.url, target_language=doc.target_language)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc


def update_api_document_status(db: Session, doc_id: int, status: str, error_log: Optional[str] = None) -> Optional[models.APIDocument]:
    db_doc = get_api_document(db, doc_id)
    if db_doc:
        db_doc.status = status
        if error_log:
            db_doc.error_log = error_log
        db.commit()
        db.refresh(db_doc)
    return db_doc


def update_api_document_details(
    db: Session, 
    doc_id: int, 
    title: str, 
    description: str, 
    base_url: str, 
    api_type: str, 
    complexity_score: int, 
    quality_score: int, 
    security_score: int
) -> Optional[models.APIDocument]:
    db_doc = get_api_document(db, doc_id)
    if db_doc:
        db_doc.title = title
        db_doc.description = description
        db_doc.base_url = base_url
        db_doc.api_type = api_type
        db_doc.complexity_score = complexity_score
        db_doc.quality_score = quality_score
        db_doc.security_score = security_score
        db_doc.status = "completed"
        db.commit()
        db.refresh(db_doc)
    return db_doc


# AuthConfig Queries
def create_auth_config(db: Session, auth: schemas.AuthConfigBase, api_doc_id: int) -> models.AuthConfig:
    db_auth = models.AuthConfig(**auth.model_dump(), api_doc_id=api_doc_id)
    db.add(db_auth)
    db.commit()
    db.refresh(db_auth)
    return db_auth


def get_auth_configs(db: Session, api_doc_id: int) -> List[models.AuthConfig]:
    return db.query(models.AuthConfig).filter(models.AuthConfig.api_doc_id == api_doc_id).all()


# Endpoint Queries
def create_endpoint(db: Session, endpoint: schemas.EndpointBase, api_doc_id: int) -> models.Endpoint:
    db_endpoint = models.Endpoint(
        api_doc_id=api_doc_id,
        path=endpoint.path,
        method=endpoint.method,
        summary=endpoint.summary,
        description=endpoint.description,
        parameters=endpoint.parameters,
        request_schema=endpoint.request_schema,
        response_schema=endpoint.response_schema,
    )
    db.add(db_endpoint)
    db.commit()
    db.refresh(db_endpoint)
    return db_endpoint


def get_endpoints(db: Session, api_doc_id: int) -> List[models.Endpoint]:
    return db.query(models.Endpoint).filter(models.Endpoint.api_doc_id == api_doc_id).all()


def get_endpoint(db: Session, endpoint_id: int) -> Optional[models.Endpoint]:
    return db.query(models.Endpoint).filter(models.Endpoint.id == endpoint_id).first()


def update_endpoint_health(db: Session, endpoint_id: int, is_healthy: str, response_time_ms: int, last_checked: datetime) -> Optional[models.Endpoint]:
    db_endpoint = get_endpoint(db, endpoint_id)
    if db_endpoint:
        db_endpoint.is_healthy = is_healthy
        db_endpoint.response_time_ms = response_time_ms
        db_endpoint.last_checked = last_checked
        db.commit()
        db.refresh(db_endpoint)
    return db_endpoint


# WrapperTask Queries
def create_wrapper_task(db: Session, api_doc_id: int, language: str) -> models.WrapperTask:
    db_task = models.WrapperTask(api_doc_id=api_doc_id, language=language, status="pending")
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def get_wrapper_task(db: Session, task_id: int) -> Optional[models.WrapperTask]:
    return db.query(models.WrapperTask).filter(models.WrapperTask.id == task_id).first()


def get_wrapper_tasks(db: Session, api_doc_id: int) -> List[models.WrapperTask]:
    return db.query(models.WrapperTask).filter(models.WrapperTask.api_doc_id == api_doc_id).order_by(models.WrapperTask.created_at.desc()).all()


def update_wrapper_task(
    db: Session, 
    task_id: int, 
    status: str, 
    quality_score: int = 0, 
    security_score: int = 0, 
    complexity_score: int = 0, 
    generated_files: Optional[Dict[str, Any]] = None, 
    error_message: Optional[str] = None
) -> Optional[models.WrapperTask]:
    db_task = get_wrapper_task(db, task_id)
    if db_task:
        db_task.status = status
        db_task.quality_score = quality_score
        db_task.security_score = security_score
        db_task.complexity_score = complexity_score
        if generated_files:
            db_task.generated_files = generated_files
        if error_message:
            db_task.error_message = error_message
        db.commit()
        db.refresh(db_task)
    return db_task


# ChatMessage Queries
def create_chat_message(db: Session, msg: schemas.ChatMessageBase, api_doc_id: int) -> models.ChatMessage:
    db_msg = models.ChatMessage(role=msg.role, content=msg.content, api_doc_id=api_doc_id)
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg


def get_chat_messages(db: Session, api_doc_id: int, limit: int = 50) -> List[models.ChatMessage]:
    return db.query(models.ChatMessage).filter(models.ChatMessage.api_doc_id == api_doc_id).order_by(models.ChatMessage.created_at.asc()).limit(limit).all()
