"""
CLI-to-Web Bridge Server - Fixed for Qwen with Stealth Mode
"""
import asyncio
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# =============================================================================
# SELECTORS
# =============================================================================
SELECTORS = {
    "chat.qwen.ai": {
        "textarea": "textarea.message-input-textarea",
        "send_button": "button.send-button", 
        "stop_button": "button.stop-button",
        "response_container": "div.response-message-content",
        "response_text": "div.response-message-content",
    },
    "chat.openai.com": {
        "textarea": "textarea[placeholder*='Message']",
        "send_button": "button[data-testid='send-button']",
        "stop_button": "button[aria-label*='Stop']",
        "response_container": "article[data-testid='conversation-turn']",
        "response_text": "article[data-testid='conversation-turn']:last-child .prose",
    }
}

DEFAULT_CONFIG = {
    "url": "https://chat.qwen.ai/",
    "cookies_file": "cookies.json",
    "timeout_seconds": 120,
}

class MessageRequest(BaseModel):
    message: str
    platform: Optional[str] = None

class MessageResponse(BaseModel):
    response: str
    success: bool
    error: Optional[str] = None
    platform: Optional[str] = None

class BridgeServer:
    def __init__(self, config: Dict[str, Any] = None):
        self.config = {**DEFAULT_CONFIG, **(config or {})}
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self.current_url = self.config["url"]
        self.current_platform = "qwen"
        self.selectors = SELECTORS.get("chat.qwen.ai", SELECTORS["chat.openai.com"])

    def _get_selectors_for_url(self, url: str) -> Dict[str, str]:
        if "qwen" in url:
            self.current_platform = "qwen"
            return SELECTORS["chat.qwen.ai"]
        self.current_platform = "chatgpt"
        return SELECTORS["chat.openai.com"]

    # FIXED: Indented inside the class
    async def start(self):
        logger.info("Starting Playwright...")
        self.playwright = await async_playwright().start()
        
        storage_state = None
        cookies_path = Path(self.config["cookies_file"])
        if cookies_path.exists():
            try:
                with open(cookies_path, "r") as f:
                    storage_state = json.load(f)
                logger.info(f"Loaded cookies from {cookies_path}")
            except Exception as e:
                logger.error(f"Failed to load cookies: {e}")
                storage_state = None

        logger.info("Launching Chromium browser with stealth mode...")
        self.browser = await self.playwright.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ]
        )

        context_kwargs = {
            "viewport": {"width": 1280, "height": 720},
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        }
        if storage_state:
            context_kwargs["storage_state"] = storage_state

        context = await self.browser.new_context(**context_kwargs)
        self.page = await context.new_page()

        # Inject stealth scripts BEFORE navigation
        await self.page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US'] });
            window.chrome = { runtime: {} };
        """)

        logger.info(f"Navigating to {self.current_url}...")
        
        # Use 'domcontentloaded' instead of 'networkidle' to avoid waiting forever
        try:
            await self.page.goto(self.current_url, wait_until="domcontentloaded", timeout=30000)
            logger.info("Page loaded, waiting for content...")
            
            # Wait for specific element instead of network idle
            await self.page.wait_for_selector("textarea, input, [contenteditable]", timeout=15000)
            logger.info("Input field detected")
            
        except Exception as e:
            logger.warning(f"Initial load issue: {e}")
            logger.info("Taking screenshot for debugging...")
            await self.page.screenshot(path="debug_startup.png")
            # Continue anyway - user can manually refresh if needed
        
        await asyncio.sleep(2)  # Let JS fully initialize
        logger.info("Browser initialized successfully")
        logger.info("👉 If you see a CAPTCHA or login page, please solve it manually in the browser window")

    # FIXED: Indented inside the class
    async def stop(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    # =========================================================================
    # CORE METHOD: send_message
    # =========================================================================
    # =========================================================================
    # CORE METHOD: send_message (MUST BE INDENTED INSIDE CLASS)
    # =========================================================================
    async def send_message(self, message: str, platform: Optional[str] = None) -> str:
        if not self.page:
            raise RuntimeError("Browser not initialized.")

        try:
            if platform and platform != self.current_platform:
                await self.switch_platform(platform)

            logger.info(f"Sending message to {self.current_platform}: {message[:50]}...")
            self.selectors = self._get_selectors_for_url(self.current_url)
            
            # 1. Count existing responses
            response_selector = self.selectors["response_text"]
            try:
                initial_count = await self.page.locator(response_selector).count()
                logger.info(f"📊 Initial response count: {initial_count}")
            except:
                initial_count = 0

            # 2. Wait for Input
            textarea_selector = self.selectors["textarea"]
            await self.page.wait_for_selector(textarea_selector, state="visible", timeout=10000)
            
            # 3. CRITICAL: Wait a moment to ensure full message is received
            await asyncio.sleep(0.5)
            
            # 4. Focus and Clear
            await self.page.locator(textarea_selector).focus()
            await asyncio.sleep(0.3)
            
            # Clear using keyboard (more reliable than fill)
            await self.page.keyboard.press("Control+a")
            await asyncio.sleep(0.2)
            await self.page.keyboard.press("Delete")
            await asyncio.sleep(0.2)
            
            # Verify it's empty
            try:
                current_value = await self.page.locator(textarea_selector).input_value()
                if current_value:
                    logger.warning("⚠️ Input not empty, clearing again...")
                    await self.page.keyboard.press("Control+a")
                    await self.page.keyboard.press("Delete")
                    await asyncio.sleep(0.2)
            except:
                pass # Textarea might not support input_value()
            
            # 5. Type the COMPLETE message
            logger.info(f"⌨️ Typing full message ({len(message)} chars)...")
            await self.page.locator(textarea_selector).fill(message)
            
            # 6. CRITICAL: Wait to ensure all characters are typed
            await asyncio.sleep(0.5)
            
            # 7. Send
            await self.page.keyboard.press("Enter")
            logger.info("✅ Message sent. Waiting for AI state changes...")

            # 8. WAIT FOR STOP BUTTON (AI Thinking)
            stop_selector = self.selectors.get("stop_button", "button.stop-button")
            try:
                await self.page.wait_for_selector(stop_selector, state="attached", timeout=10000)
                logger.info("⏳ Stop button detected (AI is thinking)")
            except PlaywrightTimeout:
                logger.warning("⚠️ Stop button not found, checking for response directly...")

            # 9. WAIT FOR STOP BUTTON TO DISAPPEAR (AI Finished)
            try:
                await self.page.wait_for_selector(stop_selector, state="detached", timeout=90000)
                logger.info("✅ Stop button disappeared (AI finished)")
            except PlaywrightTimeout:
                logger.warning("⏰ Timeout waiting for stop button to disappear")

            # 10. EXTRA WAIT FOR NEW MESSAGE COUNT
            max_wait = 15
            start_time = asyncio.get_event_loop().time()
            while asyncio.get_event_loop().time() - start_time < max_wait:
                await asyncio.sleep(0.5)
                try:
                    current_count = await self.page.locator(response_selector).count()
                    if current_count > initial_count:
                        logger.info(f"🎉 New response detected! Count: {initial_count} -> {current_count}")
                        break
                except:
                    continue
            
            await asyncio.sleep(2)  # Final render wait

            # 11. Scrape
            response_text = await self._scrape_latest_response()
            if not response_text.strip():
                return "Error: Empty response."
            return response_text

        except Exception as e:
            logger.error(f"❌ Error: {e}")
            raise

    async def _scrape_latest_response(self) -> str:
        response_selector = self.selectors["response_text"]
        script = """
        () => {
            const elements = document.querySelectorAll('%s');
            if (elements.length === 0) return '';
            const last = elements[elements.length - 1];
            return last.innerText || last.textContent || '';
        }
        """ % response_selector
        try:
            text = await self.page.evaluate(script)
            return text.strip()
        except Exception as e:
            logger.error(f"Scraping error: {e}")
            return ""

    async def switch_platform(self, platform: str):
        urls = {"qwen": "https://chat.qwen.ai/", "chatgpt": "https://chat.openai.com/"}
        if platform not in urls: 
            raise ValueError("Unsupported platform")
        await self.page.goto(urls[platform], wait_until="domcontentloaded")
        self.current_url = urls[platform]
        self.selectors = self._get_selectors_for_url(self.current_url)
        await asyncio.sleep(3)
    async def switch_platform(self, platform: str):
        urls = {"qwen": "https://chat.qwen.ai/", "chatgpt": "https://chat.openai.com/"}
        if platform not in urls: 
            raise ValueError("Unsupported platform")
        await self.page.goto(urls[platform], wait_until="domcontentloaded")
        self.current_url = urls[platform]
        self.selectors = self._get_selectors_for_url(self.current_url)
        await asyncio.sleep(3)

# =============================================================================
# FASTAPI APP
# =============================================================================
app = FastAPI(title="CLI-to-Web Bridge")
bridge_server: Optional[BridgeServer] = None

@app.on_event("startup")
async def startup_event():
    global bridge_server
    bridge_server = BridgeServer()
    await bridge_server.start()

@app.on_event("shutdown")
async def shutdown_event():
    global bridge_server
    if bridge_server:
        await bridge_server.stop()

@app.post("/send", response_model=MessageResponse)
async def send_message_endpoint(request: MessageRequest):
    global bridge_server
    if not bridge_server or not bridge_server.page:
        raise HTTPException(status_code=503, detail="Browser not ready")
    try:
        text = await bridge_server.send_message(request.message, request.platform)
        return MessageResponse(response=text, success=True, platform=bridge_server.current_platform)
    except Exception as e:
        return MessageResponse(response="", success=False, error=str(e), platform=bridge_server.current_platform)

@app.get("/health")
async def health():
    if not bridge_server or not bridge_server.page:
        return {"status": "unhealthy"}
    return {"status": "healthy", "platform": bridge_server.current_platform}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)