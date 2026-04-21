# Ehab's Code - Qwen Bridge for Open Claude

## Overview

This bridge allows **Open Claude** to communicate with **Qwen AI** through browser automation. When you select the model `qwen/from Ehab` in Open Claude, requests are routed through this bridge to Qwen's web interface.

## Files

- `save.py` - Login manager (saves session cookies)
- `bridge_server.py` - FastAPI bridge server
- `README.md` - This file

## Quick Start

### Step 1: Install Dependencies

```bash
pip install fastapi uvicorn playwright pydantic
playwright install chromium
```

### Step 2: Login and Save Session

```bash
python save.py
```

This will:
1. Open a browser window
2. Navigate to https://chat.qwen.ai/
3. Wait for you to log in manually
4. Save your session to `cookies.json`

### Step 3: Start the Bridge Server

```bash
python bridge_server.py
```

The server will:
- Launch a visible browser with your saved session
- Run at `http://127.0.0.1:8000`
- Wait for requests from Open Claude

### Step 4: Use in Open Claude

In Open Claude, select the model: **`qwen/from Ehab`**

Your messages will now be sent to Qwen AI through the bridge!

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ Open Claude │────▶│ Bridge Server    │────▶│ Qwen AI     │
│ (TS/Bun)    │     │ (Python/FastAPI) │     │ (Browser)   │
└─────────────┘     └──────────────────┘     └─────────────┘
      │                     │                      │
      │  Model: qwen/       │  POST /send          │  Automates
      │  from Ehab          │  {message}           │  chat.qwen.ai
      │                     │                      │
      │◀────────────────────┼──────────────────────┤
      │  Response           │  {response}          │  Scrapes HTML
```

## Features

✅ **Session Persistence** - Login once, cookies saved forever  
✅ **Visible Browser** - See automation happening (great for demos)  
✅ **Multi-turn Support** - Conversation tracking via `conversation_id`  
✅ **Robust Detection** - Uses stop button state to detect AI thinking/finished  
✅ **Error Handling** - Graceful fallbacks for timeouts and failures  
✅ **Open Claude Integration** - Fully compatible with existing architecture  

## API Endpoints

### POST /send

Send a message to Qwen AI.

**Request:**
```json
{
  "message": "Hello, how are you?",
  "conversation_id": "optional-id"
}
```

**Response:**
```json
{
  "response": "I'm doing well! How can I help you today?",
  "success": true,
  "conversation_id": "optional-id"
}
```

### GET /health

Check if the bridge is healthy.

**Response:**
```json
{
  "status": "healthy",
  "url": "https://chat.qwen.ai/",
  "platform": "qwen/from Ehab"
}
```

## Troubleshooting

### "cookies.json not found"
Run `python save.py` to login and create the file.

### "Browser not initialized"
Make sure the bridge server is running before using Open Claude.

### "Timeout waiting for response"
- Check your internet connection
- Ensure you're logged in to Qwen
- The website selectors may have changed (update in `bridge_server.py`)

### "Empty response"
- Check the browser window for errors
- Ensure the page is fully loaded
- Try refreshing the page manually

## Advanced Usage

### Custom Selectors

If Qwen changes their UI, update the `SELECTORS` dictionary in `bridge_server.py`:

```python
SELECTORS = {
    "textarea": "textarea.message-input-textarea",  # Update this
    "stop_button": "button.stop-button",            # Update this
    "response_text": "div.response-message-content", # Update this
}
```

### Multiple Conversations

The bridge supports multiple concurrent conversations via `conversation_id`:

```python
# In your request
{"message": "Hello", "conversation_id": "user-123"}
{"message": "Hi again", "conversation_id": "user-123"}  # Same conversation
{"message": "New topic", "conversation_id": "user-456"}  # New conversation
```

## Integration with Open Claude

To add this bridge to Open Claude:

1. Add `qwen_bridge` provider in `src/utils/model/providers.ts`
2. Add model entry in `src/utils/model/model.ts`
3. Create HTTP client in `src/services/` to call `http://127.0.0.1:8000/send`
4. Set `CLAUDE_CODE_USE_QWEN_BRIDGE=true` to enable

## License

Part of the Ehab's Code project for Open Claude integration.

## Author

Created for seamless Qwen AI integration with Open Claude.
