import logging
from typing import Dict, Any
from app.agents.base import BaseAgent

logger = logging.getLogger("auth_detector")


class AuthenticationDetector(BaseAgent):
    def __init__(self):
        super().__init__()

    async def detect(self, auth_context_text: str) -> Dict[str, Any]:
        """
        Scans retrieved authentication text chunks to extract the security protocol, rate limits, and header keys.
        """
        logger.info("Agent 2: Authentication Detector starting...")
        
        system_prompt = (
            "You are a cyber security auditor and integrations expert. "
            "Analyze the documentation text focused on API Authentication and Rate Limits, "
            "and output a raw JSON object detailing the security parameters. "
            "Your output must be a single valid JSON object. Do not wrap it in anything other than the JSON itself. "
            "The JSON must have the following keys:\n"
            "- 'auth_type': The category. Must be one of: 'apiKey', 'oauth2', 'bearer', 'basic', 'none'.\n"
            "- 'header_name': The exact HTTP header name containing credentials (e.g. 'Authorization', 'X-API-Key', or null if none).\n"
            "- 'token_url': The URL where users request a token (OAuth2 grant or login endpoint), or null if not applicable.\n"
            "- 'description': A brief explanation of how a client must supply credentials (e.g., Bearer token in header, api-key in query).\n"
            "- 'rate_limit_limit': An integer indicating the rate limit capacity (e.g., 5000, 60, or null if unknown).\n"
            "- 'rate_limit_window': The time window for the rate limit (e.g., 'hour', 'minute', 'day', or null if unknown).\n"
            "- 'rate_limit_strategy': A recommended programmatic solution for handling rate limits (e.g., 'exponential backoff', 'token bucket buffering')."
        )
        
        user_prompt = f"Analyze this API Authentication/Limits documentation section:\n\n{auth_context_text}"
        
        raw_response = await self.call_llm(system_prompt, user_prompt)
        
        try:
            parsed_json = self.extract_json(raw_response)
            logger.info(f"Agent 2 successfully parsed auth scheme: {parsed_json.get('auth_type')}")
            return parsed_json
        except Exception as e:
            logger.error(f"Error parsing JSON in Auth Detector: {e}")
            # Fallback safe defaults
            return {
                "auth_type": "bearer",
                "header_name": "Authorization",
                "token_url": None,
                "description": "Authentication details could not be parsed. Assuming Bearer token header.",
                "rate_limit_limit": 60,
                "rate_limit_window": "minute",
                "rate_limit_strategy": "Implement linear backoff on 429 status code."
            }
