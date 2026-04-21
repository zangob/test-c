from playwright.sync_api import sync_playwright
import json

print("🌐 Opening browser...")
print("👉 Step 1: Log in to chat.openai.com in the browser window")
print("👉 Step 2: Once logged in, come back here and press Enter")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    
    page.goto("https://chat.qwen.ai/")
    
    input("\n✅ Press Enter after you've logged in...")
    
    # Save full storage state (not just cookies)
    storage_state = context.storage_state()
    
    with open("cookies.json", "w") as f:
        json.dump(storage_state, f, indent=2)
    
    print("💾 Storage state saved to cookies.json")
    print("🔄 Now you can run: python bridge_server.py")
    
    browser.close()