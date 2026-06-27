import re
import httpx
import logging
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

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
        Uses Playwright first to render JS, falls back to httpx if it fails.
        """
        # Resolve known API endpoints to their documentation URLs
        resolved_url = self._resolve_doc_url(url)

        logger.info(f"Scraping URL: {resolved_url}")
        try:
            return await self._scrape_with_playwright(resolved_url)
        except Exception as e:
            logger.warning(f"Playwright scraping failed for {resolved_url}: {e}. Retrying with HTTP client...")
            try:
                return await self._scrape_with_httpx(resolved_url)
            except Exception as httpx_err:
                logger.error(f"HTTPX scraping also failed: {httpx_err}")
                # Give a helpful error message with the expected docs URL
                raise RuntimeError(
                    f"Could not fetch documentation from '{resolved_url}'. "
                    f"Please use the actual documentation page URL (e.g. "
                    f"https://stripe.com/docs/api, https://docs.github.com/rest). "
                    f"Error: {httpx_err}"
                )

    async def _scrape_with_playwright(self, url: str) -> str:
        async with async_playwright() as p:
            logger.info("Launching headless Chromium...")
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=self.headers["User-Agent"])
            page = await context.new_page()

            # Navigate with a generous 30s timeout
            logger.info(f"Navigating to page {url}...")
            await page.goto(url, wait_until="networkidle", timeout=30000)

            # Wait for content to render
            await page.wait_for_timeout(2000)

            content = await page.content()
            await browser.close()

            logger.info("Extracting text from rendered HTML...")
            return self._clean_html(content)

    async def _scrape_with_httpx(self, url: str) -> str:
        async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=20.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            logger.info("Extracting text from static HTML...")
            return self._clean_html(response.text)

    def _clean_html(self, html_content: str) -> str:
        soup = BeautifulSoup(html_content, "html.parser")

        # Remove navigation, headers, footers, scripts, styles to prevent noise in vector store
        for element in soup(["script", "style", "noscript", "iframe", "svg", "nav", "footer", "header", "aside"]):
            element.decompose()

        # Get raw text
        text = soup.get_text(separator="\n")

        # Clean up spacing issues
        lines = [line.strip() for line in text.splitlines()]

        # Remove empty lines
        cleaned_chunks = [line for line in lines if line]

        cleaned_text = "\n".join(cleaned_chunks)

        # Remove excessive newlines
        cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
        return cleaned_text
