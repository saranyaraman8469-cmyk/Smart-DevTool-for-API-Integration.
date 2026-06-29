import re
import json
import logging
from typing import Any, Dict, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from app.config import settings

logger = logging.getLogger("base_agent")


class BaseAgent:
    def __init__(self):
        self.llm = self._init_llm()

    def _init_llm(self):
        """
        Initializes the configured LLM client wrapper from LangChain.
        """
        provider = settings.LLM_PROVIDER.lower()
        model = settings.LLM_MODEL
        
        logger.info(f"Initializing LLM Provider: {provider} (Model: {model})")
        
        if provider == "mock":
            return "mock"
            
        if provider == "gemini":
            if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY in ("your_gemini_api_key_here", ""):
                logger.error("GOOGLE_API_KEY is not set or is a placeholder. Cannot initialize Gemini LLM.")
                return "no_api_key"
            return ChatGoogleGenerativeAI(
                model=model,
                google_api_key=settings.GOOGLE_API_KEY,
                temperature=0.2,
                max_tokens=4096,
            )
        elif provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is required for OpenAI provider.")
            return ChatOpenAI(
                model=model,
                openai_api_key=settings.OPENAI_API_KEY,
                openai_api_base=settings.OPENAI_API_BASE,
                temperature=0.2,
            )
        elif provider == "ollama":
            return ChatOllama(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                temperature=0.2,
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    def _get_mock_response(self, system_prompt: str, is_fallback: bool = False) -> str:
        """
        Returns a generic mock JSON response for the pipeline to succeed.
        """
        label = " (Fallback)" if is_fallback else ""
        if "Documentation Analyzer" in system_prompt or "title" in system_prompt:
            return f'{{"title": "Mock API{label}", "description": "This is a mock API{label}", "base_url": "https://api.mock.com", "api_type": "REST", "complexity_score": 50, "summary": "Mock summary{label}"}}'
        elif "Authentication Detector" in system_prompt or "auth_type" in system_prompt:
            return f'{{"auth_type": "apiKey", "header_name": "Authorization", "token_url": null, "description": "Mock Auth{label}", "rate_limit_limit": 100, "rate_limit_window": "per minute", "rate_limit_strategy": "fixed"}}'
        elif "Endpoint Extractor" in system_prompt or "endpoints" in system_prompt:
            return f'[{{\"path\": \"/mock\", \"method\": \"GET\", \"summary\": \"Mock Endpoint{label}\", \"description\": \"Returns mock data{label}\", \"parameters\": [], \"request_schema\": {{}}, \"response_schema\": {{}}}}]'
        elif "Security Analyzer" in system_prompt or "security_score" in system_prompt:
            return '{"security_score": 85}'
        elif "Code Review" in system_prompt or "Quality scoring" in system_prompt:
            return '{"quality_score": 90, "complexity_score": 30}'
        return '{"status": "success", "mock": true}'

    async def call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """
        Executes a call to the LLM with system and user messages.
        Returns the real LLM response, or a clear human-readable error string.
        """
        if self.llm == "mock":
            logger.info("Using mock LLM response")
            return self._get_mock_response(system_prompt, is_fallback=False)

        if self.llm == "no_api_key":
            logger.error("Cannot call LLM: GOOGLE_API_KEY is not configured.")
            return (
                "⚠️ **AI is not configured yet.**\n\n"
                "The `GOOGLE_API_KEY` environment variable is missing or invalid on the server. "
                "Please set a valid Gemini API key in the Render dashboard under **Environment → GOOGLE_API_KEY** "
                "and redeploy the backend service."
            )
            
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        import asyncio
        
        max_retries = 3
        base_delay = 5  # Start with a 5-second delay for rate limits
        
        for attempt in range(max_retries):
            try:
                response = await self.llm.ainvoke(messages)
                return response.content
            except Exception as e:
                error_str = str(e)
                # Hard quota exceeded — no point retrying
                if ("429" in error_str or "RESOURCE_EXHAUSTED" in error_str) and (
                    "quota" in error_str.lower() or "exceeded" in error_str.lower()
                ):
                    logger.error(f"Gemini API daily quota exceeded: {error_str}")
                    return (
                        "⚠️ **Gemini API quota exceeded.**\n\n"
                        "The free-tier Gemini API daily limit has been reached. "
                        "Please check your [Google AI Studio quota](https://aistudio.google.com/) "
                        "or upgrade to a paid API plan and redeploy."
                    )
                # Transient rate limit — retry with backoff
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(f"Rate limit hit. Retrying in {delay}s... (Attempt {attempt+1}/{max_retries})")
                        await asyncio.sleep(delay)
                        continue
                # Invalid API key
                if "API_KEY_INVALID" in error_str or "invalid api key" in error_str.lower() or "401" in error_str:
                    logger.error(f"Invalid Gemini API key: {error_str}")
                    return (
                        "⚠️ **Invalid API Key.**\n\n"
                        "The `GOOGLE_API_KEY` set on the server is not valid. "
                        "Please get a valid key from [Google AI Studio](https://aistudio.google.com/app/apikey) "
                        "and update it in the Render dashboard under **Environment → GOOGLE_API_KEY**."
                    )
                logger.error(f"LLM call failed on attempt {attempt+1}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                    continue
                break

        # Final fallback — return a readable error, NOT silent mock JSON
        logger.error("All LLM call attempts failed.")
        return (
            "⚠️ **AI response failed.**\n\n"
            "The AI model could not generate a response after multiple attempts. "
            "This may be a temporary issue. Please try again in a moment."
        )

    def extract_json(self, text: str) -> Dict[str, Any]:
        """
        Helper method to extract and parse JSON from Markdown-fenced code blocks or raw text.
        """
        # Search for ```json ... ``` blocks
        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
        if json_match:
            json_str = json_match.group(1).strip()
        else:
            # Fallback: look for generic code block or outer brackets
            json_match = re.search(r"```\s*([\s\S]*?)\s*```", text)
            if json_match:
                json_str = json_match.group(1).strip()
            else:
                json_str = text.strip()
                
        # Clean up common non-JSON artifacts
        json_str = re.sub(r"//.*", "", json_str)  # Remove comments
        
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as err:
            logger.error(f"JSON parsing error: {err}. Raw text:\n{text}")
            # Try to fix basic JSON structures or raise
            raise ValueError(f"Failed to parse JSON response from agent: {err}")
class BaseAgentException(Exception):
    pass
