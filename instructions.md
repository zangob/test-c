# CLI-to-Web Bridge - Complete Instructions

This document provides comprehensive instructions for setting up and using the CLI-to-Web Bridge solution that automates real web browsers to interact with AI chat interfaces.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [How Platform Selection Works](#how-platform-selection-works)
- [Cookie Export Guide](#cookie-export-guide)
- [Running the Application](#running-the-application)
- [Using the CLI Client](#using-the-cli-client)
- [API Reference](#api-reference)
- [Updating CSS Selectors](#updating-css-selectors)
- [Troubleshooting](#troubleshooting)

## Overview

This bridge allows you to:
- Send commands from your terminal to real AI web interfaces (ChatGPT, Gemini, Claude)
- See the browser automation in real-time (visible mode for demos)
- Switch between different AI platforms seamlessly
- Persist login sessions using cookies

**Architecture:**
```
Terminal (cli_client.py) → FastAPI Server (bridge_server.py) → Playwright Browser → AI Website
```

## Installation

### Prerequisites
- Python 3.7 or higher
- pip package manager

### Install Dependencies

```bash
# Install Python packages
pip install fastapi uvicorn playwright click requests pydantic

# Install Playwright browsers (Chromium for visible automation)
playwright install chromium

# Optional: Install other browsers if needed
playwright install firefox
```

## How Platform Selection Works

The bridge supports **three AI platforms** with automatic selector switching:

| Platform | URL | Command |
|----------|-----|---------|
| ChatGPT | https://chat.openai.com/ | `-p chatgpt` |
| Gemini | https://gemini.google.com/ | `-p gemini` |
| Claude | https://claude.ai/ | `-p claude` |

### Ways to Select a Platform:

1. **Per-message selection:**
   ```bash
   python cli_client.py "Hello" -p chatgpt
   python cli_client.py "Hi there" --platform gemini
   ```

2. **Switch platform globally:**
   ```bash
   python cli_client.py --switch-platform claude
   ```

3. **In interactive mode:**
   ```bash
   python cli_client.py -i
   # Then type: platform gemini
   ```

4. **Via API:**
   ```bash
   curl -X POST http://127.0.0.1:8000/switch-platform \
     -H "Content-Type: application/json" \
     -d '{"platform": "gemini"}'
   ```

When you switch platforms, the browser automatically:
1. Navigates to the new platform's URL
2. Loads the appropriate CSS selectors
3. Updates the internal state

## Cookie Export Guide

To avoid logging in every time, export your session cookies:

### Method 1: Using EditThisCookie (Chrome/Edge)

1. Install the **EditThisCookie** extension from Chrome Web Store
2. Navigate to your AI platform (e.g., https://chat.openai.com/)
3. Log in to your account
4. Click the EditThisCookie icon
5. Click "Export" (JSON format)
6. Save as `cookies.json` in the project directory

### Method 2: Using Playwright Script

Create `save_cookies.py`:

```python
from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Navigate to the site
    page.goto("https://chat.openai.com/")
    
    print("👉 Please log in manually in the browser window")
    input("Press Enter after logging in...")
    
    # Get and save cookies
    cookies = page.context.cookies()
    with open("cookies.json", "w") as f:
        json.dump(cookies, f, indent=2)
    
    print("✅ Cookies saved to cookies.json")
    browser.close()
```

Run it:
```bash
python save_cookies.py
```

### Method 3: Manual JSON Format

Create `cookies.json` manually with this structure:

```json
[
  {
    "name": "session_token",
    "value": "your_session_value",
    "domain": ".chat.openai.com",
    "path": "/",
    "expires": 1234567890,
    "httpOnly": true,
    "secure": true
  }
]
```

## Running the Application

### Step 1: Start the Bridge Server

```bash
python bridge_server.py
```

You'll see:
```
============================================================
🌐 CLI-to-Web Bridge Server
============================================================
📍 Server starting on http://127.0.0.1:8000
🔧 Supported platforms: chatgpt, gemini, claude
👁️  Browser will open visibly for demo purposes
============================================================
```

A Chromium browser window will open automatically:
- If `cookies.json` exists: You'll be logged in
- If not: You'll need to log in manually

### Step 2: Verify Server is Running

```bash
python cli_client.py --health
```

Expected output:
```
Checking server health...
✅ Server is healthy and running!
   Platform: chatgpt
   URL: https://chat.openai.com/
```

### Step 3: List Available Platforms

```bash
python cli_client.py --list-platforms
```

## Using the CLI Client

### Basic Usage

**Send a single message:**
```bash
python cli_client.py "What is quantum computing?"
```

**Send with specific platform:**
```bash
python cli_client.py "Explain relativity" -p gemini
python cli_client.py "Hello Claude" --platform claude
```

### Interactive Mode

```bash
python cli_client.py --interactive
# or
python cli_client.py -i
```

In interactive mode:
- Type messages and press Enter
- Use `platform <name>` to switch platforms mid-session
- Type `quit` or `exit` to leave

Example session:
```
🤖 CLI-to-Web Bridge - Interactive Mode
============================================================
Type your messages and press Enter to send.
Type 'quit' or 'exit' to stop.
Type 'platform <name>' to switch (chatgpt, gemini, claude)
------------------------------------------------------------

📝 You: Hello
⏳ Waiting for AI response...
------------------------------------------------------------
🤖 AI Response (chatgpt):
Hello! How can I help you today?
------------------------------------------------------------

📝 You: platform gemini
✅ Switched to gemini: https://gemini.google.com/

📝 You: What's the weather like?
⏳ Waiting for AI response...
------------------------------------------------------------
🤖 AI Response (gemini):
I don't have access to real-time weather data...
------------------------------------------------------------
```

### Switch Platforms

```bash
# Switch to Gemini
python cli_client.py --switch-platform gemini

# Switch to Claude
python cli_client.py --switch-platform claude

# Switch back to ChatGPT
python cli_client.py --switch-platform chatgpt
```

### Check Health

```bash
python cli_client.py --health
```

### Custom Server URL

```bash
python cli_client.py "Hello" --server-url http://localhost:8000
```

## API Reference

### Endpoints

#### GET `/health`
Check server status.

```bash
curl http://127.0.0.1:8000/health
```

Response:
```json
{
  "status": "healthy",
  "url": "https://chat.openai.com/",
  "platform": "chatgpt"
}
```

#### GET `/platforms`
List supported platforms.

```bash
curl http://127.0.0.1:8000/platforms
```

#### POST `/switch-platform`
Switch to a different platform.

```bash
curl -X POST http://127.0.0.1:8000/switch-platform \
  -H "Content-Type: application/json" \
  -d '{"platform": "gemini"}'
```

#### POST `/send`
Send a message and get AI response.

```bash
curl -X POST http://127.0.0.1:8000/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "platform": "chatgpt"}'
```

Response:
```json
{
  "response": "Hello! How can I assist you?",
  "success": true,
  "error": null,
  "platform": "chatgpt"
}
```

## Updating CSS Selectors

Websites change their HTML structure frequently. Here's how to update selectors:

### Finding Selectors

1. Open the target website in Chrome
2. Right-click on the input textarea → **Inspect**
3. Look for unique attributes:
   - `data-testid="..."`
   - `aria-label="..."`
   - `id="..."`
   - Unique class names

### Testing Selectors

In browser DevTools Console:
```javascript
// Test if selector finds the element
document.querySelector('textarea[data-testid="prompt-textarea"]')
```

### Updating in Code

Edit `bridge_server.py`, find the `SELECTORS` dictionary:

```python
SELECTORS = {
    "chat.openai.com": {
        "textarea": "textarea[placeholder*='Message']",
        "send_button": "button[data-testid='send-button']",
        "response_container": "article[data-testid='conversation-turn']",
        "response_text": "article[data-testid='conversation-turn']:last-child .prose",
        "loading_indicator": "button[aria-label*='Stop']",
    },
    # ... other platforms
}
```

### Common Selector Patterns

| Element | Selector Pattern |
|---------|-----------------|
| Textarea | `textarea[placeholder*='Message']` |
| Send Button | `button[aria-label*='Send']` |
| Response | `article:last-child .prose` |
| Loading | `button[aria-label*='Stop']` |

## Troubleshooting

### Server Won't Start

**Error:** `Browser not initialized`
- Ensure Playwright is installed: `playwright install chromium`
- Check if port 8000 is already in use

### Connection Refused

**Error:** `Could not connect to bridge server`
- Make sure `bridge_server.py` is running
- Check firewall settings
- Verify URL: `http://127.0.0.1:8000`

### Login Issues

**Problem:** Browser shows login page every time
- Ensure `cookies.json` is in the same directory
- Check cookie expiration
- Re-export fresh cookies

### Selectors Not Working

**Error:** `Timeout waiting for selector`
- Website UI may have changed
- Update selectors in `bridge_server.py`
- Use browser DevTools to find new selectors

### Slow Responses

**Problem:** Takes too long to get response
- Increase timeout in `bridge_server.py`:
  ```python
  DEFAULT_CONFIG = {
      "response_wait_timeout": 120,
  }
  ```

### Browser Automation Blocked

Some websites detect automation. The code includes anti-detection flags:
```python
args=["--disable-blink-features=AutomationControlled"]
```

If still blocked:
- Use a real user profile
- Add more realistic delays
- Rotate user agents

---

**For University Demo:** 
1. Pre-login and export cookies
2. Run server in visible mode (`headless=False`)
3. Show both terminal and browser windows side-by-side
4. Demonstrate platform switching feature
