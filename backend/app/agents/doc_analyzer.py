import logging
from typing import Dict, Any
from app.agents.base import BaseAgent

logger = logging.getLogger("doc_analyzer")


class DocumentationAnalyzer(BaseAgent):
    def __init__(self):
        super().__init__()

    async def analyze(self, doc_text: str, target_language: str = None) -> Dict[str, Any]:
        """
        Analyzes the API documentation text to extract basic metadata and structure.
        """
        logger.info("Agent 1: Documentation Analyzer starting...")
        
        system_prompt = (
            "You are an expert technical API architect and documentation analyzer. "
            "Your job is to read raw text from an API documentation webpage and extract the basic metadata. "
            "You must return your response in raw JSON format. Do not add any markup besides a valid JSON object. "
            "The JSON must have the following keys:\n"
            "- 'title': The official name of the API (e.g., 'GitHub REST API', 'Stripe API').\n"
            "- 'description': A concise 2-3 sentence overview of the API's purpose.\n"
            "- 'base_url': The root endpoint URL (e.g., 'https://api.github.com', 'https://api.stripe.com/v1'). If multiple, return the primary production one.\n"
            "- 'api_type': The style of the API. Must be one of: 'REST', 'GraphQL', 'SOAP', 'RPC', 'Swagger/OpenAPI', or 'Unknown'.\n"
            "- 'complexity_score': An integer score from 1 to 100 estimating how difficult this API is to integrate based on documentation volume, depth of headers, auth complexity, and data structures. (1-30: Easy, 31-70: Medium, 71-100: Complex).\n"
            "- 'summary': A comprehensive paragraph summary of the API offerings."
        )

        if target_language:
            system_prompt += f"\n\nIMPORTANT: The user specifically wants to generate an SDK for the {target_language} programming language. If the documentation includes code examples, types, or syntax specifically for {target_language}, prioritize that information in your understanding and summary."
        
        # Take a subset of the document text if it's extremely long to avoid token overflows
        doc_sample = doc_text[:15000]
        
        user_prompt = f"Analyze the following API documentation text:\n\n{doc_sample}"
        
        raw_response = await self.call_llm(system_prompt, user_prompt)
        
        try:
            parsed_json = self.extract_json(raw_response)
            logger.info(f"Agent 1 successfully extracted metadata: {parsed_json.get('title')}")
            return parsed_json
        except Exception as e:
            logger.error(f"Error parsing json in doc analyzer: {e}")
            # Return safe default values
            return {
                "title": "API Documentation",
                "description": "Scraped API documentation, parsing failed.",
                "base_url": "https://api.example.com",
                "api_type": "REST",
                "complexity_score": 50,
                "summary": "AI parsing failed. Default values loaded."
            }
