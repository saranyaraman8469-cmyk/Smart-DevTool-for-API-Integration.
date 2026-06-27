import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestDocumentationAnalyzer:
    """Tests for Agent 1: Documentation Analyzer"""

    @pytest.mark.asyncio
    @patch("app.agents.doc_analyzer.DocumentationAnalyzer.call_llm")
    async def test_analyze_returns_valid_structure(self, mock_call_llm):
        mock_call_llm.return_value = '{"title":"GitHub API","description":"A REST API.","base_url":"https://api.github.com","api_type":"REST","complexity_score":70,"summary":"Comprehensive platform API."}'
        from app.agents.doc_analyzer import DocumentationAnalyzer
        agent = DocumentationAnalyzer.__new__(DocumentationAnalyzer)
        agent.llm = MagicMock()
        result = await agent.analyze("Sample documentation content.")
        assert result["title"] == "GitHub API"
        assert result["api_type"] == "REST"
        assert "complexity_score" in result

    @pytest.mark.asyncio
    @patch("app.agents.doc_analyzer.DocumentationAnalyzer.call_llm")
    async def test_analyze_handles_llm_failure_gracefully(self, mock_call_llm):
        mock_call_llm.return_value = "Not a valid JSON response at all."
        from app.agents.doc_analyzer import DocumentationAnalyzer
        agent = DocumentationAnalyzer.__new__(DocumentationAnalyzer)
        agent.llm = MagicMock()
        result = await agent.analyze("Sample documentation content.")
        # Should return fallback values
        assert "title" in result
        assert result["complexity_score"] == 50


class TestAuthenticationDetector:
    """Tests for Agent 2: Authentication Detector"""

    @pytest.mark.asyncio
    @patch("app.agents.auth_detector.AuthenticationDetector.call_llm")
    async def test_detect_returns_auth_type(self, mock_call_llm):
        mock_call_llm.return_value = '{"auth_type":"bearer","header_name":"Authorization","token_url":null,"description":"Use Bearer token.","rate_limit_limit":1000,"rate_limit_window":"hour","rate_limit_strategy":"Exponential backoff."}'
        from app.agents.auth_detector import AuthenticationDetector
        agent = AuthenticationDetector.__new__(AuthenticationDetector)
        agent.llm = MagicMock()
        result = await agent.detect("Authenticate with Bearer token in Authorization header.")
        assert result["auth_type"] == "bearer"
        assert result["header_name"] == "Authorization"


class TestEndpointExtractor:
    """Tests for Agent 3: Endpoint Extractor"""

    @pytest.mark.asyncio
    @patch("app.agents.endpoint_extractor.EndpointExtractor.call_llm")
    async def test_extract_returns_endpoint_list(self, mock_call_llm):
        mock_call_llm.return_value = '{"endpoints":[{"path":"/users","method":"GET","summary":"List users","description":"Returns all users","parameters":[],"request_schema":null,"response_schema":{"users":[]}}]}'
        from app.agents.endpoint_extractor import EndpointExtractor
        agent = EndpointExtractor.__new__(EndpointExtractor)
        agent.llm = MagicMock()
        result = await agent.extract("GET /users - Returns a list of users.")
        assert len(result) == 1
        assert result[0]["method"] == "GET"
        assert result[0]["path"] == "/users"
