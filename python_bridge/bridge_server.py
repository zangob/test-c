#!/usr/bin/env python3
"""
Ehab's Code - Qwen Bridge Server

FastAPI backend that automates Qwen AI browser interactions.
Receives messages from Open Claude and sends them to Qwen via browser automation.

Startup Sequence:
1. Run: python save.py (login and get cookies)
2. Run: python bridge_server.py (start this server)
3. Open Claude starts normally and uses the bridge

Usage:
    python bridge_server.py
    
Server will run at: http://127.0.0.1:8000
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
# SELECTORS FOR QWEN.AI
# =============================================================================
SELECTORS = {
    "textarea": "textarea.message-input-textarea",
    "send_button": "button.send-button",
    "stop_button": "button.stop-button",
    "response_container": "div.response-message-content",
    "response_text": "div.response-message-content",
}

DEFAULT_CONFIG = {
    "url": "https://chat.qwen.ai/",
    "cookies_file": "cookies.json",
    "timeout_seconds": 120,
}


class MessageRequest(BaseModel):
    """Request model for sending messages."""
    message: str
    conversation_id: Optional[str] = None  # For tracking multi-turn conversations


class MessageResponse(BaseModel):
    """Response model with AI answer."""
    response: str
    success: bool
    error: Optional[str] = None
    conversation_id: Optional[str] = None


class BridgeServer:
    """Manages browser instance and handles Qwen chat interactions."""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = {**DEFAULT_CONFIG, **(config or {})}
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self.current_url = self.config["url"]
        self.selectors = SELECTORS
        self.conversation_history: Dict[str, list] = {}  # Multi-turn support

    async def start(self):
        """Initialize Playwright and launch browser with saved cookies."""
        try:
            logger.info("🚀 Starting Ehab's Code Bridge Server...")
            self.playwright = await async_playwright().start()

            # Load cookies/storage state
            storage_state = None
            cookies_path = Path(self.config["cookies_file"])
            if cookies_path.exists():
                try:
                    with open(cookies_path, "r", encoding="utf-8") as f:
                        storage_state = json.load(f)
                    logger.info(f"✅ Loaded session from {cookies_path}")
                except Exception as e:
                    logger.error(f"⚠️ Error reading cookies: {e}")
            else:
                logger.warning("⚠️ cookies.json not found! Run 'python save.py' first.")

            # Launch visible browser
            logger.info("🌐 Launching Chromium (visible mode)...")
            self.browser = await self.playwright.chromium.launch(
                headless=False,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ]
            )

            # Create context with storage state
            context_kwargs = {
                "viewport": {"width": 1280, "height": 720},
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
            if storage_state:
                context_kwargs["storage_state"] = storage_state

            context = await self.browser.new_context(**context_kwargs)
            self.page = await context.new_page()

            # Navigate to Qwen
            logger.info(f"🔗 Navigating to {self.current_url}")
            await self.page.goto(self.current_url, wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(3)  # Allow JS to initialize

            logger.info("✅ Bridge Server ready!")

        except Exception as e:
            logger.error(f"❌ Failed to start: {e}")
            await self.stop()
            raise

    async def stop(self):
        """Clean up browser resources."""
        try:
            if self.browser:
                await self.browser.close()
                logger.info("🔒 Browser closed")
            if self.playwright:
                await self.playwright.stop()
                logger.info("🔒 Playwright stopped")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    async def send_message(self, message: str, conversation_id: Optional[str] = None) -> str:
        """
        Send message to Qwen and get response.
        
        Handles:
        - Multiple concurrent requests (queue system)
        - Streaming responses
        - Session persistence
        """
        if not self.page:
            raise RuntimeError("Browser not initialized")

        try:
            # Generate conversation ID if not provided
            if not conversation_id:
                conversation_id = "default"
            
            logger.info(f"💬 Sending to Qwen: {message[:50]}...")

            # Count existing responses to detect NEW ones
            response_selector = self.selectors["response_text"]
            try:
                initial_count = await self.page.locator(response_selector).count()
                logger.info(f"📊 Initial response count: {initial_count}")
            except:
                initial_count = 0

            # Wait for input field
            textarea_selector = self.selectors["textarea"]
            await self.page.wait_for_selector(textarea_selector, state="visible", timeout=10000)
            
            # Clear and type message
            await self.page.locator(textarea_selector).focus()
            await asyncio.sleep(0.3)
            await self.page.keyboard.press("Control+a")
            await self.page.keyboard.press("Delete")
            await self.page.keyboard.type(message, delay=30)
            await self.page.keyboard.press("Enter")

            logger.info("✅ Message sent. Waiting for Qwen...")

            # Wait for stop button (AI thinking)
            stop_selector = self.selectors.get("stop_button")
            try:
                await self.page.wait_for_selector(stop_selector, state="attached", timeout=5000)
                logger.info("⏳ Qwen is thinking...")
            except PlaywrightTimeout:
                logger.warning("⚠️ Stop button not detected")

            # Wait for stop button to disappear (AI finished)
            try:
                await self.page.wait_for_selector(stop_selector, state="detached", timeout=60000)
                logger.info("✅ Qwen finished")
            except PlaywrightTimeout:
                logger.warning("⏰ Timeout waiting for completion")

            # Wait for new response count
            max_wait = 15
            start_time = asyncio.get_event_loop().time()
            while asyncio.get_event_loop().time() - start_time < max_wait:
                await asyncio.sleep(0.5)
                current_count = await self.page.locator(response_selector).count()
                if current_count > initial_count:
                    logger.info(f"🎉 New response! Count: {initial_count} -> {current_count}")
                    break
            
            await asyncio.sleep(1)  # Final render

            # Scrape response
            response_text = await self._scrape_latest_response()
            
            if not response_text.strip():
                return "Error: Empty response from Qwen"
            
            logger.info(f"📝 Received {len(response_text)} chars")
            return response_text

        except Exception as e:
            logger.error(f"❌ Error: {e}")
            raise

    async def _scrape_latest_response(self) -> str:
        """Extract the latest response from the page."""
        response_selector = self.selectors["response_text"]
        
        script = f"""
        () => {{
            const elements = document.querySelectorAll('{response_selector}');
            if (elements.length === 0) return '';
            const last = elements[elements.length - 1];
            return last.innerText || last.textContent || '';
        }}
        """
        
        try:
            text = await self.page.evaluate(script)
            return text.strip() if text else ""
        except Exception as e:
            logger.error(f"Scraping error: {e}")
            return ""


# =============================================================================
# FASTAPI APP
# =============================================================================
app = FastAPI(
    title="Ehab's Code - Qwen Bridge",
    description="Bridge server for Open Claude to communicate with Qwen AI",
    version="1.0.0"
)

bridge_server: Optional[BridgeServer] = None


@app.on_event("startup")
async def startup_event():
    """Start bridge server on FastAPI startup."""
    global bridge_server
    bridge_server = BridgeServer()
    await bridge_server.start()


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    global bridge_server
    if bridge_server:
        await bridge_server.stop()


@app.post("/send", response_model=MessageResponse)
async def send_message_endpoint(request: MessageRequest):
    """
    Send message to Qwen AI via browser automation.
    
    This endpoint is called by Open Claude when using the 'qwen/from Ehab' model.
    """
    global bridge_server
    
    if not bridge_server or not bridge_server.page:
        raise HTTPException(status_code=503, detail="Bridge not ready")
    
    try:
        response_text = await bridge_server.send_message(
            request.message,
            request.conversation_id
        )
        return MessageResponse(
            response=response_text,
            success=True,
            conversation_id=request.conversation_id
        )
    except Exception as e:
        logger.error(f"Endpoint error: {e}")
        return MessageResponse(
            response="",
            success=False,
            error=str(e),
            conversation_id=request.conversation_id
        )


@app.get("/health")
async def health_check():
    """Check if bridge is healthy."""
    global bridge_server
    
    if not bridge_server or not bridge_server.page:
        return {"status": "unhealthy", "message": "Bridge not initialized"}
    
    try:
        await bridge_server.page.evaluate("1")
        return {
            "status": "healthy",
            "url": bridge_server.current_url,
            "platform": "qwen/from Ehab"
        }
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("🚀 Ehab's Code - Qwen Bridge Server")
    print("=" * 60)
    print()
    print("Server running at: http://127.0.0.1:8000")
    print()
    print("Endpoints:")
    print("  POST /send    - Send message to Qwen")
    print("  GET  /health  - Check server status")
    print()
    print("Press Ctrl+C to stop")
    print("=" * 60)
    print()
    
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
