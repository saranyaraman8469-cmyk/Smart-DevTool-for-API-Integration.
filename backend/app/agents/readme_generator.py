import logging
from app.agents.base import BaseAgent

logger = logging.getLogger("readme_generator")


class ReadmeGenerator(BaseAgent):
    def __init__(self):
        super().__init__()

    async def generate_readme(
        self, 
        language: str, 
        api_title: str, 
        wrapper_code: str
    ) -> str:
        """
        Generates a comprehensive integration markdown README for the generated client SDK.
        """
        logger.info(f"Agent 6: README Generator starting for language {language}...")
        
        system_prompt = (
            "You are a professional technical writer and developer advocate. "
            "Your job is to read a generated client SDK wrapper code, and write a high-quality Markdown README.md file. "
            "The README must contain the following sections:\n"
            "1. Title & Brief Description of the SDK client.\n"
            "2. Prerequisites & Installation guide (e.g. commands for npm, pip, maven etc.).\n"
            "3. Initialization & Authentication guide showing clearly how to pass the API credentials.\n"
            "4. Quick Start Example code snippet in the target language showing how to call the primary endpoints.\n"
            "5. Advanced Usage showing pagination handling, custom request timeouts, and error retry strategies.\n"
            "6. Error Handling guide detailing custom exceptions thrown by the wrapper.\n\n"
            "Respond ONLY with the markdown text. Do not add conversational sentences outside the markdown block."
        )
        
        # Pull code sample (first 100 lines and last 100 lines if extremely large)
        code_lines = wrapper_code.splitlines()
        if len(code_lines) > 200:
            code_sample = "\n".join(code_lines[:100]) + "\n\n// ... [Code Truncated for Analysis] ... \n\n" + "\n".join(code_lines[-100:])
        else:
            code_sample = wrapper_code
            
        user_prompt = (
            f"API Title: {api_title}\n"
            f"Target Language: {language}\n\n"
            f"SDK Wrapper Code:\n"
            f"```\n{code_sample}\n```\n\n"
            f"Generate the comprehensive integration README.md now."
        )
        
        raw_response = await self.call_llm(system_prompt, user_prompt)
        
        # Clean any wrapping backticks if the model accidentally double-blocks it
        cleaned_markdown = raw_response.strip()
        if cleaned_markdown.startswith("```markdown"):
            cleaned_markdown = cleaned_markdown[11:]
        if cleaned_markdown.startswith("```"):
            cleaned_markdown = cleaned_markdown[3:]
        if cleaned_markdown.endswith("```"):
            cleaned_markdown = cleaned_markdown[:-3]
            
        logger.info("Agent 6 README generation completed successfully.")
        return cleaned_markdown.strip()
