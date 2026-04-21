from playwright.sync_api import sync_playwright
import json
import subprocess
import sys
import time
import requests
from pathlib import Path

def check_bridge_health():
    """Check if bridge server is already running."""
    try:
        response = requests.get("http://127.0.0.1:8000/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def start_bridge_server():
    """Start the FastAPI bridge server."""
    bridge_server = Path(__file__).parent / "bridge_server.py"
    
    if not bridge_server.exists():
        print("❌ Error: bridge_server.py not found!")
        return False
    
    print("🚀 Starting bridge server...")
    
    # Start server in background
    process = subprocess.Popen(
        [sys.executable, str(bridge_server)],
        cwd=str(Path(__file__).parent),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for server to be ready
    max_wait = 30
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            response = requests.get("http://127.0.0.1:8000/health", timeout=2)
            if response.status_code == 200:
                print("✅ Bridge server is running!")
                return True
        except:
            pass
        time.sleep(0.5)
    
    print("❌ Timeout waiting for bridge server to start")
    return False

print("🌐 Opening browser...")
print("👉 Step 1: Log in to chat.qwen.ai in the browser window")
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
    
    browser.close()

# Check if bridge is already running
if check_bridge_health():
    print("✅ Bridge server already running!")
else:
    # Start bridge server
    if start_bridge_server():
        print("🎉 Setup complete! Bridge is ready.")
    else:
        print("⚠️  Cookies saved but bridge server failed to start.")
        print("   You can manually start it with: python bridge_server.py")