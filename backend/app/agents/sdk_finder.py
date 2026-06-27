import logging
from typing import Dict, Any
from app.agents.base import BaseAgent

logger = logging.getLogger("sdk_finder")


class SDKFinder(BaseAgent):
    def __init__(self):
        super().__init__()

    async def find_sdk(self, doc_text: str, language: str) -> Dict[str, Any]:
        """
        Scans documentation text to locate mention of official/community libraries for the preferred language.
        """
        logger.info(f"Agent 4: SDK Finder starting for language {language}...")
        
        system_prompt = (
            "You are a developer relations engineer and dependency coordinator. "
            "Your job is to read documentation and determine if an official SDK exists for the API "
            f"in the preferred programming language: {language}. "
            "Output your findings in raw JSON format. Do not write anything other than a valid JSON object. "
            "The JSON must have these exact keys:\n"
            "- 'sdk_exists': A boolean indicating if an official or highly popular community library/SDK was identified in the text.\n"
            "- 'sdk_package_name': The package name or coordinates (e.g. '@stripe/stripe-node', 'stripe-python', or null if none).\n"
            "- 'installation_command': The terminal command to install it (e.g. 'npm install stripe', 'pip install stripe', or null if none).\n"
            "- 'recommendation': A clear recommendation. Suggest whether to use the official SDK or a custom generated client "
              "(e.g., 'Use the official SDK because it handles auth refresh automatically' or 'Build a custom wrapper since no official SDK exists for Go').\n"
            "- 'confidence_score': A float from 0.0 to 1.0 representing your confidence in this recommendation."
        )
        
        # Pull text from the documentation (first part of doc where install/SDK info is usually located)
        doc_sample = doc_text[:12000]
        
        user_prompt = f"Identify SDK details for {language} in this API documentation:\n\n{doc_sample}"
        
        raw_response = await self.call_llm(system_prompt, user_prompt)
        
        try:
            parsed_json = self.extract_json(raw_response)
            logger.info(f"Agent 4 complete. SDK exists: {parsed_json.get('sdk_exists')}")
            return parsed_json
        except Exception as e:
            logger.error(f"Error parsing JSON in SDK Finder: {e}")
            # Fallback safe defaults (no official SDK found)
            return {
                "sdk_exists": False,
                "sdk_package_name": None,
                "installation_command": None,
                "recommendation": f"Generate a custom client wrapper for {language} since no official SDK is explicitly documented.",
                "confidence_score": 0.5
            }
