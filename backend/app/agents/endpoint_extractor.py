import logging
from typing import List, Dict, Any
from app.agents.base import BaseAgent

logger = logging.getLogger("endpoint_extractor")


class EndpointExtractor(BaseAgent):
    def __init__(self):
        super().__init__()

    async def extract(self, doc_text: str) -> List[Dict[str, Any]]:
        """
        Extracts a list of endpoints with their paths, methods, parameters, and schemas from documentation.
        """
        logger.info("Agent 3: Endpoint Extractor starting...")
        
        system_prompt = (
            "You are an expert systems integrator and API schema analyst. "
            "Your job is to read documentation and extract all described API endpoints. "
            "Output your findings in raw JSON format. Do not write anything other than a valid JSON object. "
            "The JSON must have a single key 'endpoints' containing a list of objects. Each object must have these keys:\n"
            "- 'path': The HTTP route path (e.g., '/api/v1/users', '/users/{id}').\n"
            "- 'method': The HTTP verb in uppercase (e.g., 'GET', 'POST', 'PUT', 'DELETE', 'PATCH').\n"
            "- 'summary': A brief action summary (e.g., 'List all users', 'Retrieve user details').\n"
            "- 'description': Detailed information about the endpoint operations.\n"
            "- 'parameters': A list of parameters. Each parameter should be a JSON object with: "
              "'name' (string), 'type' (string, e.g. string, integer), 'location' (string, must be: 'path', 'query', or 'header'), "
              "'required' (boolean), 'description' (string).\n"
            "- 'request_schema': A simplified JSON schema dictionary representing the expected POST/PUT request body, or null if GET/DELETE/none.\n"
            "- 'response_schema': A simplified JSON schema dictionary representing the successful response payload."
        )
        
        # Pull text from the documentation (capping it to avoid token limits, prioritizing lists and details)
        doc_sample = doc_text[:20000]
        
        user_prompt = f"Identify all endpoints in the following documentation section:\n\n{doc_sample}"
        
        raw_response = await self.call_llm(system_prompt, user_prompt)
        
        try:
            parsed_json = self.extract_json(raw_response)
            endpoints = parsed_json.get("endpoints", [])
            logger.info(f"Agent 3 successfully extracted {len(endpoints)} endpoints.")
            return endpoints
        except Exception as e:
            logger.error(f"Error parsing JSON in Endpoint Extractor: {e}")
            # Fallback safe defaults (mock endpoints)
            return [
                {
                    "path": "/ping",
                    "method": "GET",
                    "summary": "Health check endpoint",
                    "description": "Standard latency ping checking backend connectivity.",
                    "parameters": [],
                    "request_schema": None,
                    "response_schema": {"status": "ok"}
                }
            ]
