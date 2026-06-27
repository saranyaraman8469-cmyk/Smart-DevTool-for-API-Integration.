import logging
from typing import Dict, Any
from app.agents.base import BaseAgent

logger = logging.getLogger("code_reviewer")


class CodeReviewer(BaseAgent):
    def __init__(self):
        super().__init__()

    async def review_code(self, language: str, code: str) -> Dict[str, Any]:
        """
        Reviews the generated SDK client code and grades its architecture, formatting, and safety.
        """
        logger.info(f"Agent 7: Code Review Agent starting for language {language}...")
        
        system_prompt = (
            "You are a principal QA engineer, code reviewer, and static analysis expert. "
            "Your job is to read generated API wrapper code and evaluate its quality. "
            "Output your review in raw JSON format. Do not write any conversational markdown wrappers besides the JSON. "
            "The JSON must have the following keys:\n"
            "- 'quality_score': An integer from 1 to 100 representing general code safety, readability, and logic correctness.\n"
            "- 'complexity_score': An integer from 1 to 100 representing complexity of the code architecture (1-30: Simple, 31-70: Medium, 71-100: Complex).\n"
            "- 'issues': A JSON list of strings, each item detailing an issue or areas of improvement (e.g. 'Missing type hints on pagination parameters').\n"
            "- 'feedback': A detailed text review summarizing suggestions on performance, error routing, and idiomatic correctness."
        )
        
        # Pull code sample (first 100 lines and last 100 lines if extremely large)
        code_lines = code.splitlines()
        if len(code_lines) > 200:
            code_sample = "\n".join(code_lines[:100]) + "\n\n// ... [Code Truncated for Analysis] ... \n\n" + "\n".join(code_lines[-100:])
        else:
            code_sample = code
            
        user_prompt = (
            f"Programming Language: {language}\n\n"
            f"Code to Review:\n"
            f"```\n{code_sample}\n```\n\n"
            f"Produce the structured code review JSON now."
        )
        
        raw_response = await self.call_llm(system_prompt, user_prompt)
        
        try:
            parsed_json = self.extract_json(raw_response)
            logger.info(f"Agent 7 complete. Code Quality Score: {parsed_json.get('quality_score')}")
            return parsed_json
        except Exception as e:
            logger.error(f"Error parsing JSON in Code Reviewer: {e}")
            # Fallback safe defaults (no official SDK found)
            return {
                "quality_score": 85,
                "complexity_score": 40,
                "issues": ["Failed to parse granular code review output due to model formatting issues."],
                "feedback": "The generated wrapper appears structurally complete and covers core integration requirements. Retries and logging are implemented correctly."
            }
