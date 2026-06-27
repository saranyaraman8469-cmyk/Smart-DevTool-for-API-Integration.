import time
import httpx
import logging
import datetime
from sqlalchemy.orm import Session
from app import crud, models

logger = logging.getLogger("health_checker")


class APIHealthChecker:
    def __init__(self):
        self.timeout = 5.0  # seconds

    async def check_endpoint(self, db: Session, endpoint_id: int, base_url: str) -> models.Endpoint:
        """
        Runs a mock HTTP ping against the endpoint, calculates response times, and saves the outcome.
        """
        endpoint = crud.get_endpoint(db, endpoint_id)
        if not endpoint:
            raise ValueError(f"Endpoint with ID {endpoint_id} not found.")
            
        full_url = self._build_test_url(base_url, endpoint.path)
        logger.info(f"Checking health for {endpoint.method} {full_url}...")
        
        start_time = time.time()
        is_healthy = "unhealthy"
        response_time_ms = 0
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = None
                # Limit test pings to safe operations or basic checks
                if endpoint.method.upper() == "GET":
                    response = await client.get(full_url)
                elif endpoint.method.upper() == "POST":
                    response = await client.post(full_url, json={})
                elif endpoint.method.upper() == "PUT":
                    response = await client.put(full_url, json={})
                elif endpoint.method.upper() == "DELETE":
                    response = await client.delete(full_url)
                else:
                    response = await client.request(endpoint.method, full_url)
                
                latency = (time.time() - start_time) * 1000
                response_time_ms = int(latency)
                
                # Check status code (e.g., 5xx indicates server issues/unhealthy, others are generally reachable)
                if response is not None and response.status_code < 500:
                    is_healthy = "healthy"
                else:
                    is_healthy = "unhealthy"
                    
        except httpx.RequestError as e:
            logger.warning(f"Connection failed for endpoint {full_url}: {e}")
            is_healthy = "unhealthy"
            response_time_ms = int((time.time() - start_time) * 1000)
            
        # Update database with health metrics
        updated_endpoint = crud.update_endpoint_health(
            db=db,
            endpoint_id=endpoint_id,
            is_healthy=is_healthy,
            response_time_ms=response_time_ms,
            last_checked=datetime.datetime.utcnow()
        )
        return updated_endpoint

    def _build_test_url(self, base_url: str, path: str) -> str:
        """
        Replaces route params (e.g. {userId}, :id) with default test values.
        """
        # Ensure base URL is clean
        base = base_url.rstrip("/")
        clean_path = path
        
        # Replace standard Swagger/OpenAPI style params: {param_name}
        clean_path = re.sub(r"\{[a-zA-Z0-9_-]+\}", "1", clean_path)
        
        # Replace Express/router style params: :param_name
        clean_path = re.sub(r"\:[a-zA-Z0-9_-]+", "1", clean_path)
        
        if not clean_path.startswith("/"):
            clean_path = "/" + clean_path
            
        return base + clean_path


import re
