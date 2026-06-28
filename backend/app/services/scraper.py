import re
import httpx
import logging
import asyncio
from urllib.parse import urlparse
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scraper")

# Map of common API base domains → their documentation URLs
KNOWN_DOC_URLS = {
    "api.stripe.com": "https://stripe.com/docs/api",
    "api.github.com": "https://docs.github.com/en/rest",
    "api.twitter.com": "https://developer.twitter.com/en/docs",
    "api.slack.com": "https://api.slack.com/web",
    "api.twilio.com": "https://www.twilio.com/docs/api",
    "api.sendgrid.com": "https://docs.sendgrid.com/api-reference",
    "graph.facebook.com": "https://developers.facebook.com/docs/graph-api",
    "api.openai.com": "https://platform.openai.com/docs/api-reference",
    "generativelanguage.googleapis.com": "https://ai.google.dev/api",
    "api.anthropic.com": "https://docs.anthropic.com/api",
}


class APIScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }

    def _resolve_doc_url(self, url: str) -> str:
        """
        Try to redirect well-known API base URLs to their documentation pages.
        For example, https://api.stripe.com → https://stripe.com/docs/api
        """
        parsed = urlparse(url)
        host = parsed.netloc.lower()

        if host in KNOWN_DOC_URLS:
            doc_url = KNOWN_DOC_URLS[host]
            logger.info(f"Redirecting {url} → documentation at {doc_url}")
            return doc_url

        # Auto-detect: if path is empty or just "/" and host starts with "api.",
        # try the corresponding docs subdomain
        if parsed.path in ("", "/") and host.startswith("api."):
            base_domain = host[len("api."):]
            candidates = [
                f"https://docs.{base_domain}",
                f"https://{base_domain}/docs",
                f"https://{base_domain}/docs/api",
                f"https://developer.{base_domain}",
            ]
            logger.info(f"Bare API endpoint detected. Will try doc candidates: {candidates}")
            return candidates[0]  # Return first candidate; full fallback in scrape_url

        return url

    async def scrape_url(self, url: str) -> str:
        """
        Scrapes a URL. Auto-redirects known API endpoints to their docs page.
        Tries Playwright first (for JS-rendered pages), falls back to httpx.
        """
        resolved_url = self._resolve_doc_url(url)
        logger.info(f"Scraping URL: {resolved_url}")

        # Try Playwright first (in a thread to avoid blocking the event loop)
        try:
            text = await asyncio.wait_for(
                self._scrape_with_playwright(resolved_url),
                timeout=45.0
            )
            if text and len(text.strip()) > 100:
                return text
            raise RuntimeError("Playwright returned empty/too-short content")
        except Exception as e:
            logger.warning(f"Playwright failed for {resolved_url}: {e}. Falling back to httpx...")

        # Fallback: plain HTTP request (works for REST API docs, JSON endpoints, etc.)
        try:
            text = await asyncio.wait_for(
                self._scrape_with_httpx(resolved_url),
                timeout=20.0
            )
            return text
        except Exception as httpx_err:
            logger.error(f"httpx also failed for {resolved_url}: {httpx_err}")
            raise RuntimeError(
                f"Could not fetch documentation from '{resolved_url}'. "
                f"Please use the actual documentation page URL (e.g. "
                f"https://stripe.com/docs/api, https://docs.github.com/rest). "
                f"Error: {httpx_err}"
            )

    async def _scrape_with_playwright(self, url: str) -> str:
        """Run Playwright in a subprocess-safe way."""
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            raise RuntimeError("Playwright not installed")

        async with async_playwright() as p:
            logger.info("Launching headless Chromium...")
            browser = await p.chromium.launch(headless=True)
            try:
                context = await browser.new_context(user_agent=self.headers["User-Agent"])
                page = await context.new_page()

                logger.info(f"Navigating to {url}...")
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)

                content = await page.content()
                return self._clean_html(content)
            finally:
                await browser.close()

    async def _scrape_with_httpx(self, url: str) -> str:
        """Fetch page via plain HTTP — works for JSON APIs and static docs."""
        async with httpx.AsyncClient(
            headers=self.headers,
            follow_redirects=True,
            timeout=20.0
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                # It's a JSON API — extract meaningful text from the JSON
                logger.info("Detected JSON response — converting to readable text...")
                return self._json_to_text(response.text)
            else:
                logger.info("Extracting text from static HTML...")
                return self._clean_html(response.text)

    def _json_to_text(self, json_text: str) -> str:
        """Convert a JSON API response to readable plain text for the LLM."""
        import json
        try:
            data = json.loads(json_text)
            lines = []
            self._flatten_json(data, lines, prefix="")
            return "\n".join(lines)
        except Exception:
            return json_text[:5000]

    def _flatten_json(self, obj, lines: list, prefix: str, depth: int = 0):
        """Recursively flatten JSON into readable key: value lines."""
        if depth > 6:
            return
        if isinstance(obj, dict):
            for k, v in obj.items():
                key = f"{prefix}.{k}" if prefix else k
                if isinstance(v, (dict, list)):
                    self._flatten_json(v, lines, key, depth + 1)
                else:
                    lines.append(f"{key}: {v}")
        elif isinstance(obj, list):
            for i, item in enumerate(obj[:20]):  # limit list items
                self._flatten_json(item, lines, f"{prefix}[{i}]", depth + 1)

    def _clean_html(self, html_content: str) -> str:
        soup = BeautifulSoup(html_content, "html.parser")

        # Remove navigation, headers, footers, scripts, styles
        for element in soup(["script", "style", "noscript", "iframe", "svg", "nav", "footer", "header", "aside"]):
            element.decompose()

        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines()]
        cleaned_chunks = [line for line in lines if line]
        cleaned_text = "\n".join(cleaned_chunks)
        cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
        return cleaned_text
