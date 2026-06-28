from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime


# Common Base Schemas

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True

class EndpointBase(BaseModel):
    path: str
    method: str
    summary: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[List[Dict[str, Any]]] = None
    request_schema: Optional[Dict[str, Any]] = None
    response_schema: Optional[Dict[str, Any]] = None
    is_healthy: str = "unknown"
    response_time_ms: Optional[int] = None
    last_checked: Optional[datetime] = None


class EndpointResponse(EndpointBase):
    id: int
    api_doc_id: int

    class Config:
        from_attributes = True


class AuthConfigBase(BaseModel):
    auth_type: str
    header_name: Optional[str] = None
    token_url: Optional[str] = None
    description: Optional[str] = None
    rate_limit_limit: Optional[int] = None
    rate_limit_window: Optional[str] = None
    rate_limit_strategy: Optional[str] = None


class AuthConfigResponse(AuthConfigBase):
    id: int
    api_doc_id: int

    class Config:
        from_attributes = True


class APIDocumentBase(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    base_url: Optional[str] = None
    api_type: str = "REST"
    target_language: Optional[str] = None
    status: str = "pending"
    error_log: Optional[str] = None
    complexity_score: int = 0
    quality_score: int = 0
    security_score: int = 0

class APIDocumentCreate(BaseModel):
    url: str
    target_language: Optional[str] = None


class APIDocumentResponse(APIDocumentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class APIDocumentDetailResponse(APIDocumentResponse):
    endpoints: List[EndpointResponse] = []
    auth_configs: List[AuthConfigResponse] = []

    class Config:
        from_attributes = True


class WrapperTaskBase(BaseModel):
    language: str
    status: str = "pending"
    quality_score: int = 0
    security_score: int = 0
    complexity_score: int = 0
    generated_files: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class WrapperTaskCreate(BaseModel):
    language: str


class WrapperTaskResponse(WrapperTaskBase):
    id: int
    api_doc_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    role: str
    content: str


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(ChatMessageBase):
    id: int
    api_doc_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Input payload for ingestion
class IngestRequest(BaseModel):
    url: str
    language: Optional[str] = None


class HealthCheckRequest(BaseModel):
    headers: Optional[Dict[str, str]] = None



# Chat request/response payloads
class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    history: List[ChatMessageResponse] = []


# Analytics data structures
class AnalyticsDashboardResponse(BaseModel):
    endpoint_count: int
    methods_distribution: Dict[str, int]
    avg_complexity_score: float
    avg_security_score: float
    avg_quality_score: float
    healthy_endpoints_count: int
    unhealthy_endpoints_count: int
    unknown_endpoints_count: int
