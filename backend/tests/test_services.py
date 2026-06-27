import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app import models, schemas, crud


# Use in-memory SQLite for isolated test environment
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Provides a clean test database session per test function."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


class TestCRUD:
    """Tests for CRUD database operations."""

    def test_create_api_document(self, db):
        doc = crud.create_api_document(db, schemas.APIDocumentCreate(url="https://api.example.com/docs"))
        assert doc.id is not None
        assert doc.url == "https://api.example.com/docs"
        assert doc.status == "pending"

    def test_get_api_document(self, db):
        created = crud.create_api_document(db, schemas.APIDocumentCreate(url="https://api.test.com/docs"))
        fetched = crud.get_api_document(db, created.id)
        assert fetched is not None
        assert fetched.url == "https://api.test.com/docs"

    def test_get_api_document_by_url(self, db):
        crud.create_api_document(db, schemas.APIDocumentCreate(url="https://api.uniqueurl.com/docs"))
        doc = crud.get_api_document_by_url(db, "https://api.uniqueurl.com/docs")
        assert doc is not None
        assert doc.url == "https://api.uniqueurl.com/docs"

    def test_update_api_document_status(self, db):
        doc = crud.create_api_document(db, schemas.APIDocumentCreate(url="https://status.test.com/docs"))
        updated = crud.update_api_document_status(db, doc.id, "crawling")
        assert updated.status == "crawling"

    def test_create_and_get_endpoint(self, db):
        doc = crud.create_api_document(db, schemas.APIDocumentCreate(url="https://endpoint.test.com/docs"))
        ep_schema = schemas.EndpointBase(
            path="/users",
            method="GET",
            summary="List users",
            description="Returns a list of all users"
        )
        endpoint = crud.create_endpoint(db, ep_schema, doc.id)
        assert endpoint.id is not None
        assert endpoint.path == "/users"
        assert endpoint.method == "GET"

        endpoints = crud.get_endpoints(db, api_doc_id=doc.id)
        assert len(endpoints) == 1

    def test_create_wrapper_task(self, db):
        doc = crud.create_api_document(db, schemas.APIDocumentCreate(url="https://wrapper.test.com/docs"))
        task = crud.create_wrapper_task(db, doc.id, "Python")
        assert task.id is not None
        assert task.language == "Python"
        assert task.status == "pending"
