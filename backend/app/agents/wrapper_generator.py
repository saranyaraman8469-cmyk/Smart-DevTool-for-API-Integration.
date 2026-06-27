import json
import logging
from typing import Dict, List, Any
from app.agents.base import BaseAgent

logger = logging.getLogger("wrapper_generator")


class WrapperGenerator(BaseAgent):
    def __init__(self):
        super().__init__()

    async def generate_wrapper(
        self, 
        language: str, 
        api_title: str, 
        base_url: str, 
        auth_config: Dict[str, Any], 
        endpoints: List[Dict[str, Any]]
    ) -> str:
        """
        Generates a robust client SDK wrapper in the requested language for the parsed endpoints and auth schema.
        """
        logger.info(f"Agent 5: Wrapper Generator starting. Target language: {language}...")
        
        system_prompt = (
            "You are a principal software engineer and expert developer tools architect. "
            f"Your job is to generate a complete, production-ready, clean-code SDK wrapper in {language} for an API. "
            "The generated code must be robust, fully-implemented, and must contain NO placeholder comments or TODOs. "
            "You must structure the wrapper class to support:\n"
            "1. Authentication: Handle the credentials as configured (headers, query, etc.).\n"
            "2. Error Handling: Custom exception classes, proper status code handling.\n"
            "3. Retry Strategy: Implement exponential backoff, especially for HTTP 429 (Rate Limit) and 5xx statuses.\n"
            "4. Timeout Settings: Set reasonable request timeouts and expose them in the configurations.\n"
            "5. Pagination: If endpoints support pagination (e.g. offset, page, cursor), build loop helper arguments or methods.\n"
            "6. Logging: Integrate the standard logging capabilities for the language.\n\n"
            "Respond ONLY with the source code inside a single markdown code block. Do not add conversational text."
        )
        
        user_prompt = (
            f"API Details:\n"
            f"- Title: {api_title}\n"
            f"- Base URL: {base_url}\n"
            f"- Auth Strategy: {json.dumps(auth_config, indent=2)}\n\n"
            f"Endpoints to Implement:\n"
            f"{json.dumps(endpoints, indent=2)}\n\n"
            f"Generate the SDK class wrapper code for {language} now."
        )
        
        raw_response = await self.call_llm(system_prompt, user_prompt)
        
        # We return the code block string directly.
        # The base class or the router can strip the ```lang ... ``` if needed, but we keep it clean.
        cleaned_code = self._sanitize_response_code(raw_response, language)
        logger.info("Agent 5 wrapper generation completed successfully.")
        return cleaned_code

    def _sanitize_response_code(self, raw_text: str, language: str) -> str:
        """
        Extracts code from code blocks if present, otherwise returns raw text.
        """
        lang_str = language.lower()
        if lang_str == "c#":
            lang_str = "csharp"
            
        pattern = rf"```(?:{lang_str})?\s*([\s\S]*?)\s*```"
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
            
        # Generic block check
        match_generic = re.search(r"```\s*([\s\S]*?)\s*```", raw_text)
        if match_generic:
            return match_generic.group(1).strip()
            
        return raw_text.strip()


import re
