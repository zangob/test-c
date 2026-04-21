#!/usr/bin/env python3
"""
Ehab's Code - Qwen Bridge Login & Cookie Manager

This script handles the login process for Qwen AI and saves cookies
for persistent sessions. It should be run before starting the bridge server.

Usage:
    python save.py
    
The script will:
1. Open a browser window
2. Navigate to chat.qwen.ai
3. Wait for you to log in manually
4. Save the session cookies to cookies.json
5. Exit when you press Enter
"""

import json
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("❌ Playwright not installed. Run: pip install playwright")
    print("   Then run: playwright install chromium")
    sys.exit(1)


def save_cookies():
    """Launch browser, let user log in, then save cookies."""
    print("=" * 60)
    print("🔐 Ehab's Code - Qwen AI Login Manager")
    print("=" * 60)
    print()
    print("📝 Instructions:")
    print("   1. A browser window will open")
    print("   2. Log in to https://chat.qwen.ai/")
    print("   3. Once logged in, come back here and press Enter")
    print("   4. Cookies will be saved to cookies.json")
    print()
    
    input("Press Enter to open the browser...")
    
    try:
        with sync_playwright() as p:
            print("🌐 Launching browser...")
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            
            print("🔗 Navigating to Qwen AI...")
            page.goto("https://chat.qwen.ai/", wait_until="networkidle")
            
            print()
            print("✅ Please log in now in the browser window...")
            print("   (Complete any CAPTCHA or 2FA if required)")
            print()
            
            # Wait for user to complete login
            input("Press Enter after you've successfully logged in...")
            
            # Small delay to ensure all tokens are loaded
            import time
            time.sleep(2)
            
            # Get storage state (includes cookies + localStorage + sessionStorage)
            print("💾 Saving session data...")
            storage_state = context.storage_state()
            
            # Save to file
            cookies_file = Path("cookies.json")
            with open(cookies_file, "w", encoding="utf-8") as f:
                json.dump(storage_state, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Successfully saved to {cookies_file}")
            print()
            print("📊 Session info:")
            print(f"   - Cookies: {len(storage_state.get('cookies', []))} items")
            print(f"   - Local Storage origins: {len(storage_state.get('origins', []))} items")
            print()
            print("🎉 You can now start the bridge server!")
            print("   Run: python bridge_server.py")
            print()
            
            browser.close()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Troubleshooting tips:")
        print("   1. Make sure Playwright is installed: pip install playwright")
        print("   2. Install browsers: playwright install chromium")
        print("   3. Check your internet connection")
        print("   4. Try running as administrator if on Windows")
        sys.exit(1)


if __name__ == "__main__":
    save_cookies()
