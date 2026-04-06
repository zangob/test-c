<h1 align="center">Open Claude Code</h1>

<p align="center">
  <img src="screenshot.png" alt="free-code" width="720" />
</p>

## Quick Start

**Prerequisites:** [Bun](https://bun.sh) v1.1+

```bash
git clone https://gitlab.com/khaled7535043/open-claude-code.git
cd open-claude-code
bun install
bun run build
bun link
bun dist/cli.js
```

That's it. The CLI will launch and prompt you to authenticate via OAuth (same flow as the official Claude Code).

## Updating

To update Open Claude Code to the latest version, use one of the following methods:

### Method 1: Using the built-in update command (Recommended)

Run the update command from any terminal:

```bash
open-claude update
# or
/update
```

This command will automatically:
- Pull the latest changes from the main repository
- Rebuild the project
- Restart with the latest version

### Method 2: Manual update

If you prefer to update manually, run these commands in the project directory:

```bash
cd open-claude-code
git pull origin main
bun run build
```

## Commands

```bash
open-claude                    # Launch interactive REPL
open-claude --help             # Show all options
open-claude --version          # Show version
open-claude -p "your prompt"   # Non-interactive mode
open-claude auth login         # Authenticate
open-claude --model z-ai/glm5  # Use specify model

```

## To run Open Claude Code for free using a custom API, follow these steps:

**1. Register on [BlazeAI](https://blazeai.boxu.dev/) and obtain your API key.**

**2. Open a terminal (Command Prompt or PowerShell) and set the required environment variables:**

```bash
setx ANTHROPIC_BASE_URL "https://blazeai.boxu.dev/"
setx ANTHROPIC_API_KEY "sk-blaze-your-key-here"
setx ANTHROPIC_AUTH_TOKEN "sk-blaze-your-key-here"
```

**Replace `sk-blaze-your-key-here` with the API key you received from BlazeAI.**

**3. After the environment variables are set, start the application by running:** `open-claude`
   
**4. If prompted with “Do you want to use this API key,” select “Yes.”**

> **The project will now use the custom BlazeAI API endpoint for Open Claude Code.**

> **Note:** For alternative free model access, see the OpenRouter setup below — it provides free models via a simple API key without requiring BlazeAI registration.

---

## Using Z.ai / GLM Models

Open Claude Code now supports **Z.ai** as a first-class provider, allowing you to use GLM models through their Anthropic-compatible API.

### Available Models

When using Z.ai, the following models are available:
- **GLM 5** (default) - Most capable model for complex tasks
- **GLM 4.7** - Previous generation model

### Setup Instructions

#### Method 1: Using CLAUDE_CODE_USE_ZAI (Recommended)

1. **Get your Z.ai API Key** from [Z.AI Open Platform](https://z.ai/model-api):
   - Register or log in to your Z.ai account
   - Navigate to [API Keys](https://z.ai/manage-apikey/apikey-list) management page
   - Create a new API key and copy it

2. **Configure environment variables:**

   **Windows (Command Prompt):**
   ```cmd
   setx CLAUDE_CODE_USE_ZAI "1"
   setx ZAI_API_KEY "your-zai-api-key-here"
   ```

#### Method 2: Using settings.json

Create or edit `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_USE_ZAI": "1",
    "ZAI_API_KEY": "your-zai-api-key-here"
  }
}
```

#### Method 3: Using ANTHROPIC-compatible variables

If you prefer, you can also use the standard Anthropic environment variables:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-zai-api-key-here",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic"
  }
}
```

### Verifying Z.ai Connection

After starting Open Claude Code with Z.ai configured:

1. Run `/models` to see available models (should show GLM 5 and GLM 4.7)
2. The default model will be GLM 5
3. All requests are routed through `https://api.z.ai/api/anthropic`

### Notes

- When `CLAUDE_CODE_USE_ZAI=1` is set, OAuth is automatically disabled and API key authentication is used
- The `ZAI_API_KEY` takes priority over `ANTHROPIC_AUTH_TOKEN` when using the Z.ai provider
- GLM models will appear as the only available options when using Z.ai (Claude/GPT/Kimi models are filtered out)

---

## Using OpenRouter

Open Claude Code supports **OpenRouter** as a first-class provider, allowing you to use hundreds of models through their Anthropic-compatible API.

### Setup Instructions

#### Method 1: Environment Variables (Recommended)

1. **Get your API Key** from [OpenRouter](https://openrouter.ai/settings/keys):
   - Register or log in to your OpenRouter account
   - Generate an API key and copy it

2. **Configure environment variables:**

   **Windows (Command Prompt):**
   ```cmd
   setx CLAUDE_CODE_USE_OPENROUTER "1"
   setx OPENROUTER_API_KEY "sk-or-v1-your-key-here"
   ```

   Then **restart your terminal** for the environment variables to take effect.

3. **Start the application:**
   ```
   open-claude
   ```

#### Method 2: Using settings.json

Create or edit `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_USE_OPENROUTER": "1",
    "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
  }
}
```

Or with a custom base URL:
```json
{
  "env": {
    "CLAUDE_CODE_USE_OPENROUTER": "1",
    "OPENROUTER_API_KEY": "sk-or-v1-your-key-here",
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api"
  }
}
```

### Free Models Available

When using OpenRouter, the following free models are available:
- **Qwen 3.6 Plus (Free)** (default) — `qwen/qwen3.6-plus:free`
- **GLM 4.5 Air (Free)** — `z-ai/glm-4.5-air:free`
- **MiniMax M2.5 (Free)** — `minimax/minimax-m2.5:free`

### Model Selection

```bash
# Full model IDs
/model qwen/qwen3.6-plus:free    # Use Qwen 3.6 Plus (Free)
/model z-ai/glm-4.5-air:free     # Use GLM 4.5 Air (Free)
/model minimax/minimax-m2.5:free # Use MiniMax M2.5 (Free)
/model anthropic/claude-sonnet-4-6  # Use Claude Sonnet 4.6 via OpenRouter
/model openai/gpt5.3-codex          # Use GPT 5.3 Codex via OpenRouter

# Quick aliases
/model or_free      # Qwen 3.6 Plus (Free)
/model or_qwen      # Same as or_free
/model or_glm45air  # GLM 4.5 Air (Free)
/model or_minimax   # MiniMax M2.5 (Free)
```

### Features & Behavior

- **Automatic OAuth disablement**: When `CLAUDE_CODE_USE_OPENROUTER=1` is set, the Anthropic OAuth login is automatically skipped — no Anthropic account needed
- **Default model**: `qwen/qwen3.6-plus:free` — the model picker shows only free-tier models when OpenRouter is active
- **API routing**: All requests are routed through `https://openrouter.ai/api/`
- **API key priority**: `OPENROUTER_API_KEY` takes precedence, falling back to `ANTHROPIC_AUTH_TOKEN`, then `ANTHROPIC_API_KEY`

---

## Supported Models

Open Claude Code supports the following AI models from various providers:

| Model ID | Provider | Description |
|----------|----------|-------------|
| claude-sonnet-4-6 | Anthropic | Best for everyday tasks |
| claude-opus-4-6 | Anthropic | Most capable for complex work |
| claude-haiku-4-5 | Anthropic | Fastest for quick answers |
| openai/gpt5.3-codex | OpenAI | Specialized for coding tasks |
| openai/gpt-5.4 | OpenAI | Latest GPT model |
| openai/gpt-5.1 | OpenAI | Efficient GPT model |
| openai/gpt-oss-120b | OpenAI | Open source 120B parameter model |
| z-ai/glm5 | Z-AI / GLM | General language model |
| glm-5 | Z-AI / GLM | General language model |
| glm-5-turbo | Z-AI / GLM | Fast and efficient model |
| glm-4.7 | Z-AI / GLM | Previous generation model |
| moonshotai/kimi-k2.5 | Moonshot AI | Most capable for complex coding |
| minimaxai/minimax-m2.5 | MiniMax | Efficient language model |
| qwen/qwen3.6-plus:free | OpenRouter | Free model for everyday tasks |
| z-ai/glm-4.5-air:free | OpenRouter | Free language model |
| minimax/minimax-m2.5:free | OpenRouter | Free language model |
| anthropic/claude-sonnet-4-6 | OpenRouter | Via OpenRouter proxy |
| anthropic/claude-opus-4-6 | OpenRouter | Via OpenRouter proxy |

### Model Selection

Use the `/model` command in the REPL to switch between models:

```
/model claude-sonnet-4-6    # Use Claude Sonnet
/model openai/gpt-5.1	    # Use GPT 5.1
/model z-ai/glm5            # Use GLM 5
/model moonshotai/kimi-k2.5	# Use Kimi K2.5 
```

---

### Architecture

```
src/
├── main.tsx                 # Entrypoint (Commander.js CLI parser)
├── commands.ts              # Command registry
├── tools.ts                 # Tool registry (~40 tools)
├── QueryEngine.ts           # LLM query engine (Anthropic API)
├── context.ts               # System/user context collection
├── ink/                     # Custom Ink fork (terminal React renderer)
├── commands/                # Slash command implementations
├── tools/                   # Agent tool implementations
├── components/              # React UI components
├── services/                # API, MCP, OAuth, telemetry
├── screens/                 # Full-screen UIs (REPL, Doctor)
├── native-ts/               # Pure TS ports of native modules
│   ├── yoga-layout/         # Flexbox layout engine
│   ├── color-diff/          # Syntax-highlighted diffs
│   └── file-index/          # Fuzzy file search
└── vim/                     # Vim mode implementation
```

## Telemetry

By default, Claude Code sends telemetry to Anthropic (event logging, Datadog, GrowthBook). To disable all telemetry:

```bash
DISABLE_TELEMETRY=1 bun dist/cli.js
```

Or for maximum privacy:

```bash
DISABLE_TELEMETRY=1 CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 bun dist/cli.js
```

## Disclaimer

This repository contains proprietary source code that was unintentionally made public by Anthropic through their npm package distribution. It is provided here for educational and research purposes only.

- This project is **not affiliated with Anthropic**
- No warranty is provided, express or implied
- Users are responsible for their own compliance with applicable laws
- This repository may be subject to takedown at Anthropic's request
- **Do not use this for commercial purposes**
