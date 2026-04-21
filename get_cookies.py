
from playwright.sync_api import sync_playwright
import json
import os

def main():
    print("🚀 Launching browser to export cookies...")
    
    with sync_playwright() as p:
        # Launch browser visibly so you can log in
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        # Navigate to ChatGPT
        target_url = "https://chat.qwen.ai"
        print(f"🌐 Navigating to {target_url}...")
        page.goto(target_url)
        
        print("\n👉 ACTION REQUIRED:")
        print("1. Log in to your account in the browser window.")
        print("2. Wait until you see the chat interface loaded.")
        print("3. Come back to this terminal and press ENTER when ready.\n")
        
        input("Press ENTER to save cookies and exit...")
        
        # Extract cookies
        cookies = context.cookies()
        
        if not cookies:
            print("⚠️  Warning: No cookies found. Did you log in successfully?")
        else:
            print(f"✅ Found {len(cookies)} cookies.")
            
            # Save to file
            output_file = "cookies.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(cookies, f, indent=2)
            
            print(f"💾 Cookies saved successfully to '{output_file}'")
            print("   You can now run 'python bridge_server.py'")
        
        browser.close()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Error: {e}")
        input("Press Enter to exit...")