"""
CLI-to-Web Bridge Server
FastAPI backend that automates browser interactions with AI chat interfaces.

This server uses Playwright to control a real browser instance, allowing
commands sent via API to be typed into web-based AI interfaces (ChatGPT,
Gemini, Claude) and responses scraped back to the caller.

Selectors Note: Web UI selectors change frequently. Update the SELECTORS
dictionary below if the automation fails due to UI changes.
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION & SELECTORS
# =============================================================================
# These selectors target common AI chat interfaces. Update them if the website
# changes its DOM structure. Test selectors using browser DevTools.
# =============================================================================

SELECTORS = {
    "chat.openai.com": {
        "textarea": "textarea[placeholder*='Message']",
        "send_button": "button[data-testid='send-button']",
        "response_container": "article[data-testid='conversation-turn']",
        "response_text": "article[data-testid='conversation-turn']:last-child .prose",
        "loading_indicator": "button[aria-label*='Stop']",
    },
    "gemini.google.com": {
        "textarea": "div[contenteditable='true'][role='textbox']",
        "send_button": "button[aria-label*='Send']",
        "response_container": "re-chat-content",
        "response_text": "re-chat-content:last-child .markdown-content",
        "loading_indicator": "re-circular-progress",
    },
    "claude.ai": {
        "textarea": "div[contenteditable='true'][data-placeholder*='Message']",
        "send_button": "button[aria-label*='Send']",
        "response_container": "article",
        "response_text": "article:last-child .prose",
        "loading_indicator": ".streaming-indicator",
    },
}

# Default configuration
DEFAULT_CONFIG = {
    "url": "https://chat.openai.com/",
    "cookies_file": "cookies.json",
    "timeout_seconds": 120,
    "response_wait_timeout": 60,
}


class MessageRequest(BaseModel):
    """Request model for the /send endpoint."""
    message: str
    platform: Optional[str] = None  # Optional: "chatgpt", "gemini", "claude"


class MessageResponse(BaseModel):
    """Response model for the /send endpoint."""
    response: str
    success: bool
    error: Optional[str] = None
    platform: Optional[str] = None  # Returns which platform was used


class BridgeServer:
    """Manages browser instance and handles chat interactions."""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = {**DEFAULT_CONFIG, **(config or {})}
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self.current_url = self.config["url"]
        self.current_platform = "chatgpt"  # Track current platform
        self.selectors = self._get_selectors_for_url(self.current_url)

    def _get_selectors_for_url(self, url: str) -> Dict[str, str]:
        """Get appropriate selectors based on the target URL."""
        if "chat.openai.com" in url or "openai.com" in url:
            self.current_platform = "chatgpt"
            return SELECTORS["chat.openai.com"]
        elif "gemini" in url:
            self.current_platform = "gemini"
            return SELECTORS["gemini.google.com"]
        elif "claude" in url:
            self.current_platform = "claude"
            return SELECTORS["claude.ai"]
        else:
            # Default to ChatGPT selectors as fallback
            logger.warning(f"Unknown URL '{url}', using ChatGPT selectors as fallback")
            self.current_platform = "chatgpt"
            return SELECTORS["chat.openai.com"]

    async def switch_platform(self, platform: str) -> str:
        """
        Switch to a different AI platform.
        
        Args:
            platform: Platform name ("chatgpt", "gemini", "claude")
            
        Returns:
            The URL of the new platform
        """
        platform_urls = {
            "chatgpt": "https://chat.openai.com/",
            "gemini": "https://gemini.google.com/",
            "claude": "https://claude.ai/",
        }
        
        if platform not in platform_urls:
            raise ValueError(f"Unsupported platform: {platform}. Supported: {list(platform_urls.keys())}")
        
        url = platform_urls[platform]
        await self.navigate_to(url)
        logger.info(f"Switched to platform: {platform} ({url})")
        return url

    async def start(self):
        """Initialize Playwright and launch browser."""
        try:
            logger.info("Starting Playwright...")
            self.playwright = await async_playwright().start()

            # Load cookies if available
            storage_state = None
            cookies_path = Path(self.config["cookies_file"])
            if cookies_path.exists():
                try:
                    with open(cookies_path, "r") as f:
                        storage_state = json.load(f)
                    logger.info(f"Loaded cookies from {cookies_path}")
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON in cookies file: {e}")
                except Exception as e:
                    logger.error(f"Error reading cookies file: {e}")

            # Launch browser in visible mode (headless=False for demo)
            logger.info("Launching Chromium browser (visible mode)...")
            self.browser = await self.playwright.chromium.launch(
                headless=False,  # Visible for demo purposes
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ]
            )

            # Create context with storage state if available
            context_kwargs = {
                "viewport": {"width": 1280, "height": 720},
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
            if storage_state:
                context_kwargs["storage_state"] = storage_state

            context = await self.browser.new_context(**context_kwargs)
            self.page = await context.new_page()

            # Navigate to target URL
            logger.info(f"Navigating to {self.current_url}")
            await self.page.goto(self.current_url, wait_until="domcontentloaded", timeout=60000)

            # Wait for initial page load
            await asyncio.sleep(3)  # Allow any login redirects or JS to initialize

            logger.info("Browser initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize browser: {e}")
            await self.stop()
            raise

    async def stop(self):
        """Clean up browser resources."""
        try:
            if self.browser:
                await self.browser.close()
                logger.info("Browser closed")
            if self.playwright:
                await self.playwright.stop()
                logger.info("Playwright stopped")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    async def send_message(self, message: str, platform: Optional[str] = None) -> str:
        """
        Send a message to the chat interface and wait for response.

        Args:
            message: The text message to send
            platform: Optional platform override ("chatgpt", "gemini", "claude")

        Returns:
            The AI's response text

        Raises:
            TimeoutError: If response takes too long
            Exception: If selectors fail or page is not ready
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call start() first.")

        try:
            # Switch platform if requested
            if platform and platform != self.current_platform:
                await self.switch_platform(platform)

            logger.info(f"Sending message to {self.current_platform}: {message[:50]}...")

            # Refresh selectors in case URL changed
            self.selectors = self._get_selectors_for_url(self.current_url)

            # Wait for textarea to be visible and enabled
            textarea_selector = self.selectors["textarea"]
            await self.page.wait_for_selector(textarea_selector, state="visible", timeout=10000)
            await self.page.wait_for_selector(textarea_selector, state="enabled", timeout=10000)

            # Clear textarea and fill with new message
            await self.page.fill(textarea_selector, "")
            await self.page.type(textarea_selector, message, delay=50)  # Simulate human typing

            # Press Enter to send (more reliable than clicking send button)
            await self.page.press(textarea_selector, "Enter")
            logger.info("Message sent, waiting for response...")

            # Wait for loading indicator to appear (shows AI is thinking)
            try:
                loading_selector = self.selectors.get("loading_indicator")
                if loading_selector:
                    await self.page.wait_for_selector(loading_selector, state="visible", timeout=10000)
                    logger.info("AI is typing...")
            except PlaywrightTimeout:
                # Loading indicator might not appear for very fast responses
                logger.info("Loading indicator not detected, proceeding...")

            # Wait for loading indicator to disappear (AI finished typing)
            try:
                if loading_selector:
                    await self.page.wait_for_selector(loading_selector, state="hidden", timeout=self.config["response_wait_timeout"] * 1000)
                    logger.info("AI finished typing")
            except PlaywrightTimeout:
                logger.warning("Timeout waiting for loading indicator to disappear")

            # Additional wait to ensure all content is rendered
            await asyncio.sleep(2)

            # Scrape the latest response
            response_text = await self._scrape_latest_response()

            if not response_text.strip():
                logger.warning("Scraped empty response")
                return "Error: Received empty response from AI"

            logger.info(f"Received response ({len(response_text)} chars)")
            return response_text

        except PlaywrightTimeout as e:
            logger.error(f"Timeout during message exchange: {e}")
            raise TimeoutError(f"Operation timed out: {e}")
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise

    async def _scrape_latest_response(self) -> str:
        """
        Extract the latest AI response from the page.

        Uses JavaScript to find and extract text from the most recent
        response container in the chat interface.
        """
        response_selector = self.selectors["response_text"]

        # Use JavaScript to get the text content of the latest response
        script = f"""
        () => {{
            const elements = document.querySelectorAll('{response_selector}');
            if (elements.length === 0) return '';
            const latest = elements[elements.length - 1];
            return latest.innerText || latest.textContent || '';
        }}
        """

        try:
            response = await self.page.evaluate(script)
            return response.strip() if response else ""
        except Exception as e:
            logger.error(f"Error scraping response: {e}")
            return ""

    async def navigate_to(self, url: str):
        """Navigate to a different URL and update selectors."""
        if not self.page:
            raise RuntimeError("Browser not initialized")

        logger.info(f"Navigating to {url}")
        await self.page.goto(url, wait_until="domcontentloaded", timeout=60000)
        self.current_url = url
        self.selectors = self._get_selectors_for_url(url)
        await asyncio.sleep(2)  # Allow page initialization


# Create FastAPI app
app = FastAPI(
    title="CLI-to-Web Bridge",
    description="Automate AI chat interfaces via browser automation",
    version="1.0.0",
)

# Global server instance
bridge_server: Optional[BridgeServer] = None


@app.on_event("startup")
async def startup_event():
    """Initialize browser on server startup."""
    global bridge_server
    try:
        bridge_server = BridgeServer()
        await bridge_server.start()
        logger.info("Bridge server started successfully")
    except Exception as e:
        logger.error(f"Failed to start bridge server: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up browser on server shutdown."""
    global bridge_server
    if bridge_server:
        await bridge_server.stop()
        bridge_server = None


@app.post("/send", response_model=MessageResponse)
async def send_message(request: MessageRequest):
    """
    Send a message to the AI chat interface and return the response.

    Expects JSON: {"message": "your question here", "platform": "chatgpt|gemini|claude"}
    Returns JSON: {"response": "AI answer", "success": true/false, "error": null, "platform": "used"}
    
    Platform Selection:
    - If platform is specified in request, switches to that platform first
    - If no platform specified, uses the current platform (default: chatgpt)
    - Supported platforms: chatgpt, gemini, claude
    """
    global bridge_server

    if not bridge_server or not bridge_server.page:
        raise HTTPException(status_code=503, detail="Browser not initialized")

    if not request.message or not request.message.strip():
        return MessageResponse(
            response="",
            success=False,
            error="Empty message provided",
            platform=bridge_server.current_platform
        )

    try:
        # Use platform from request or default to current
        platform = request.platform if request.platform else None
        
        response_text = await bridge_server.send_message(request.message, platform=platform)
        return MessageResponse(
            response=response_text,
            success=True,
            error=None,
            platform=bridge_server.current_platform
        )
    except TimeoutError as e:
        logger.error(f"Timeout error: {e}")
        return MessageResponse(
            response="",
            success=False,
            error=f"Timeout: {str(e)}",
            platform=bridge_server.current_platform
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return MessageResponse(
            response="",
            success=False,
            error=f"Server error: {str(e)}",
            platform=bridge_server.current_platform
        )


@app.get("/health")
async def health_check():
    """Check if the server and browser are healthy."""
    global bridge_server

    if not bridge_server:
        return {"status": "unhealthy", "message": "Server not initialized"}

    if not bridge_server.page:
        return {"status": "unhealthy", "message": "Browser page not available"}

    try:
        # Quick check if page is responsive
        await bridge_server.page.evaluate("1")
        return {
            "status": "healthy", 
            "url": bridge_server.current_url,
            "platform": bridge_server.current_platform
        }
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


@app.get("/platforms")
async def list_platforms():
    """List all supported platforms and current selection."""
    global bridge_server
    
    return {
        "supported_platforms": ["chatgpt", "gemini", "claude"],
        "current_platform": bridge_server.current_platform if bridge_server else None,
        "current_url": bridge_server.current_url if bridge_server else None,
        "selectors_info": {
            "chatgpt": "https://chat.openai.com/",
            "gemini": "https://gemini.google.com/",
            "claude": "https://claude.ai/"
        }
    }


@app.post("/switch-platform")
async def switch_platform(request: dict):
    """Switch to a different AI platform."""
    global bridge_server

    if not bridge_server:
        raise HTTPException(status_code=503, detail="Server not initialized")

    platform = request.get("platform")
    if not platform:
        raise HTTPException(status_code=400, detail="Platform required (chatgpt, gemini, or claude)")

    try:
        url = await bridge_server.switch_platform(platform)
        return {
            "status": "success", 
            "platform": platform,
            "url": url
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/navigate")
async def navigate(request: dict):
    """Navigate to a different URL."""
    global bridge_server

    if not bridge_server:
        raise HTTPException(status_code=503, detail="Server not initialized")

    url = request.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL required")

    try:
        await bridge_server.navigate_to(url)
        return {"status": "success", "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    # Run with: python bridge_server.py
    # Or use: uvicorn bridge_server:app --reload --host 0.0.0.0 --port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
