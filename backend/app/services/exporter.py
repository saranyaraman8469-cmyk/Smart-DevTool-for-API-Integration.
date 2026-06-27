import os
import json
import shutil
import tempfile
import zipfile
import logging
from typing import Dict, List, Any
from app.config import settings

logger = logging.getLogger("exporter")


class ExporterService:
    def __init__(self):
        self.exports_dir = settings.EXPORTS_DIR
        os.makedirs(self.exports_dir, exist_ok=True)

    def generate_zip_package(
        self, 
        api_title: str, 
        language: str, 
        wrapper_code: str, 
        readme_content: str,
        test_code: str = ""
    ) -> str:
        """
        Creates a ZIP archive containing the generated SDK, README, and unit tests.
        Returns the absolute path of the generated ZIP.
        """
        safe_title = "".join(c for c in api_title if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_").lower()
        lang_ext = self._get_file_extension(language)
        
        # Create a temp directory to organize files
        with tempfile.TemporaryDirectory() as temp_dir:
            package_dir = os.path.join(temp_dir, f"{safe_title}_sdk")
            os.makedirs(package_dir, exist_ok=True)
            
            # File names
            client_filename = f"client{lang_ext}"
            if language.lower() in ("java", "c#", "kotlin"):
                client_filename = f"ApiClient{lang_ext}"
                
            readme_filename = "README.md"
            test_filename = f"test_client{lang_ext}"
            
            # Write files
            with open(os.path.join(package_dir, client_filename), "w", encoding="utf-8") as f:
                f.write(wrapper_code)
                
            with open(os.path.join(package_dir, readme_filename), "w", encoding="utf-8") as f:
                f.write(readme_content)
                
            if test_code:
                with open(os.path.join(package_dir, test_filename), "w", encoding="utf-8") as f:
                    f.write(test_code)
            else:
                # Write a standard placeholder test file
                with open(os.path.join(package_dir, test_filename), "w", encoding="utf-8") as f:
                    f.write(self._generate_dummy_test(language))
                    
            # Compress the files to ZIP
            zip_filename = f"{safe_title}_{language.lower()}_sdk"
            zip_out_path = os.path.join(self.exports_dir, zip_filename)
            
            # shutil.make_archive returns the path with .zip extension appended
            zip_file_path = shutil.make_archive(zip_out_path, 'zip', temp_dir, f"{safe_title}_sdk")
            logger.info(f"ZIP package created successfully at: {zip_file_path}")
            return zip_file_path

    def generate_postman_collection(self, api_title: str, base_url: str, endpoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generates a Postman Collection JSON structure (v2.1.0 format).
        """
        logger.info(f"Generating Postman Collection for {api_title}...")
        
        items = []
        for ep in endpoints:
            path_vars = []
            # Extract path variables to represent in Postman
            path_matches = re.findall(r"\{([a-zA-Z0-9_-]+)\}", ep["path"])
            for match in path_matches:
                path_vars.append({
                    "key": match,
                    "value": f"<{match}>",
                    "description": f"URL path parameter: {match}"
                })
                
            query_params = []
            if ep.get("parameters"):
                for param in ep["parameters"]:
                    if param.get("location") == "query":
                        query_params.append({
                            "key": param["name"],
                            "value": f"<{param['name']}>",
                            "description": param.get("description", ""),
                            "disabled": not param.get("required", False)
                        })
                        
            # Format path segment list (split paths)
            path_segments = [seg for seg in ep["path"].split("/") if seg]
            
            request_body = {}
            if ep.get("request_schema") and ep["method"].upper() in ("POST", "PUT", "PATCH"):
                request_body = {
                    "mode": "raw",
                    "raw": json.dumps(ep["request_schema"], indent=2),
                    "options": {
                        "raw": {
                            "language": "json"
                        }
                    }
                }
                
            item = {
                "name": ep.get("summary") or f"{ep['method']} {ep['path']}",
                "request": {
                    "method": ep["method"].upper(),
                    "header": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ],
                    "body": request_body if request_body else None,
                    "url": {
                        "raw": base_url.rstrip("/") + ep["path"],
                        "host": [base_url.replace("https://", "").replace("http://", "").split("/")[0]],
                        "path": path_segments,
                        "query": query_params if query_params else None,
                        "variable": path_vars if path_vars else None
                    },
                    "description": ep.get("description", "")
                },
                "response": []
            }
            items.append(item)
            
        collection = {
            "info": {
                "_postman_id": f"devtool-generated-{int(time.time())}",
                "name": f"{api_title} Collection",
                "description": "Generated by Smart DevTool for API Integration using AI.",
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            "item": items
        }
        return collection

    def generate_openapi_spec(self, api_title: str, base_url: str, endpoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generates an OpenAPI 3.0.0 JSON specification.
        """
        logger.info(f"Generating OpenAPI Summary Spec for {api_title}...")
        
        paths = {}
        for ep in endpoints:
            path_key = ep["path"]
            # Convert OpenAPI bracket styling if mismatch occurs (e.g. :id to {id})
            path_key = re.sub(r"\:([a-zA-Z0-9_-]+)", r"{\1}", path_key)
            
            if path_key not in paths:
                paths[path_key] = {}
                
            method_key = ep["method"].lower()
            
            openapi_params = []
            if ep.get("parameters"):
                for param in ep["parameters"]:
                    openapi_params.append({
                        "name": param["name"],
                        "in": param["location"],  # path, query, header
                        "required": param.get("required", False),
                        "description": param.get("description", ""),
                        "schema": {
                            "type": param.get("type", "string")
                        }
                    })
                    
            request_body = {}
            if ep.get("request_schema") and method_key in ("post", "put", "patch"):
                request_body = {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": ep["request_schema"]
                            }
                        }
                    }
                }
                
            paths[path_key][method_key] = {
                "summary": ep.get("summary", ""),
                "description": ep.get("description", ""),
                "parameters": openapi_params,
                "requestBody": request_body if request_body else None,
                "responses": {
                    "200": {
                        "description": "Successful request.",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": ep.get("response_schema") or {}
                                }
                            }
                        }
                    }
                }
            }
            
        spec = {
            "openapi": "3.0.0",
            "info": {
                "title": api_title,
                "version": "1.0.0",
                "description": "OpenAPI Spec generated by Smart DevTool for API Integration using AI."
            },
            "servers": [
                {
                    "url": base_url
                }
            ],
            "paths": paths
        }
        return spec

    def _get_file_extension(self, language: str) -> str:
        lang = language.lower()
        extensions = {
            "python": ".py",
            "typescript": ".ts",
            "javascript": ".js",
            "go": ".go",
            "rust": ".rs",
            "java": ".java",
            "c#": ".cs",
            "csharp": ".cs",
            "php": ".php",
            "kotlin": ".kt"
        }
        return extensions.get(lang, ".txt")

    def _generate_dummy_test(self, language: str) -> str:
        lang = language.lower()
        if lang == "python":
            return (
                "import unittest\n"
                "from client import ApiClient\n\n"
                "class TestApiClient(unittest.TestCase):\n"
                "    def setUp(self):\n"
                "        self.client = ApiClient(api_key='test_key')\n\n"
                "    def test_initialization(self):\n"
                "        self.assertIsNotNone(self.client)\n\n"
                "if __name__ == '__main__':\n"
                "    unittest.main()\n"
            )
        elif lang in ("typescript", "javascript"):
            return (
                "import { ApiClient } from './client';\n\n"
                "describe('ApiClient', () => {\n"
                "    it('should initialize correctly', () => {\n"
                "        const client = new ApiClient({ apiKey: 'test_key' });\n"
                "        expect(client).toBeDefined();\n"
                "    });\n"
                "});\n"
            )
        else:
            return "// Standard SDK client integration unit test placeholder\n"


import re
import time
