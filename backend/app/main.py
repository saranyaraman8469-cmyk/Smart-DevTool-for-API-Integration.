import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import api_docs, wrappers, chat, analytics, auth

# Configure root logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

logger = logging.getLogger("main")

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart DevTool for API Integration using AI",
    description=(
        "A production-ready multi-agent AI system that crawls, understands, "
        "and generates SDK wrappers for any API documentation automatically."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware — Next.js proxies all requests server-side, so allow all origins.
# The browser never hits FastAPI directly, so CORS is not an issue.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register all API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(api_docs.router)
app.include_router(wrappers.router)
app.include_router(chat.router)
app.include_router(analytics.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "running",
        "service": "Smart DevTool for API Integration using AI",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
