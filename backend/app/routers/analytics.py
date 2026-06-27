import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from collections import Counter

from app import crud, schemas
from app.database import get_db

logger = logging.getLogger("analytics_router")
router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard/{doc_id}", response_model=schemas.AnalyticsDashboardResponse)
def get_document_analytics(doc_id: int, db: Session = Depends(get_db)):
    """
    Returns aggregated endpoint analytics metrics for a processed API document.
    """
    doc = crud.get_api_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="API Document not found.")

    endpoints = crud.get_endpoints(db, api_doc_id=doc_id)

    # Compute method distribution counts
    methods = [ep.method.upper() for ep in endpoints]
    methods_distribution = dict(Counter(methods))

    # Compute health counts
    health_statuses = [ep.is_healthy for ep in endpoints]
    healthy_count = health_statuses.count("healthy")
    unhealthy_count = health_statuses.count("unhealthy")
    unknown_count = health_statuses.count("unknown")

    return schemas.AnalyticsDashboardResponse(
        endpoint_count=len(endpoints),
        methods_distribution=methods_distribution,
        avg_complexity_score=float(doc.complexity_score),
        avg_security_score=float(doc.security_score),
        avg_quality_score=float(doc.quality_score),
        healthy_endpoints_count=healthy_count,
        unhealthy_endpoints_count=unhealthy_count,
        unknown_endpoints_count=unknown_count,
    )


@router.get("/overview")
def get_global_overview(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns a global overview of all processed API documents for the main analytics dashboard page.
    """
    all_docs = crud.get_api_documents(db, skip=0, limit=500)

    total = len(all_docs)
    if total == 0:
        return {
            "total_apis": 0,
            "completed_apis": 0,
            "failed_apis": 0,
            "avg_complexity": 0,
            "avg_security": 0,
            "avg_quality": 0,
            "api_type_distribution": {},
            "status_distribution": {}
        }

    completed = [d for d in all_docs if d.status == "completed"]
    failed = [d for d in all_docs if d.status == "failed"]

    avg_complexity = round(sum(d.complexity_score for d in completed) / len(completed), 1) if completed else 0
    avg_security = round(sum(d.security_score for d in completed) / len(completed), 1) if completed else 0
    avg_quality = round(sum(d.quality_score for d in completed) / len(completed), 1) if completed else 0

    api_types = [d.api_type for d in all_docs if d.api_type]
    api_type_distribution = dict(Counter(api_types))

    statuses = [d.status for d in all_docs]
    status_distribution = dict(Counter(statuses))

    return {
        "total_apis": total,
        "completed_apis": len(completed),
        "failed_apis": len(failed),
        "avg_complexity": avg_complexity,
        "avg_security": avg_security,
        "avg_quality": avg_quality,
        "api_type_distribution": api_type_distribution,
        "status_distribution": status_distribution
    }


@router.get("/wrappers/summary")
def get_wrappers_analytics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns a summary of all wrapper generation tasks grouped by language and status.
    """
    from app.models import WrapperTask
    all_tasks = db.query(WrapperTask).all()

    total = len(all_tasks)
    if total == 0:
        return {"total_tasks": 0, "language_distribution": {}, "status_distribution": {}, "avg_quality_score": 0}

    languages = [t.language for t in all_tasks]
    statuses = [t.status for t in all_tasks]

    completed = [t for t in all_tasks if t.status == "completed"]
    avg_quality = round(sum(t.quality_score for t in completed) / len(completed), 1) if completed else 0

    return {
        "total_tasks": total,
        "language_distribution": dict(Counter(languages)),
        "status_distribution": dict(Counter(statuses)),
        "avg_quality_score": avg_quality
    }
