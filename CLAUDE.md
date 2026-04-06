# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

This project uses **Bun** as the runtime and package manager.

```bash
# Install dependencies
bun install

# Build the project (creates dist/cli.js)
bun run build

# Run in development mode (runs directly from source without building)
bun run dev

# Type check without emitting
bun run typecheck

# Start the built CLI
bun start
```

**Entrypoint**: `src/entrypoints/cli.tsx` → builds to `dist/cli.js`

## High-Level Architecture

Open Claude Code is a terminal-based AI coding assistant built with React (Ink) that provides an interactive REPL for Claude AI interactions.

### Core Components

**Entrypoint (`src/entrypoints/cli.tsx`)**
- Bootstrap CLI with fast-paths for common flags (--version, --help)
- Handles special modes: daemon, bridge/remote-control, background sessions
- Feature-flag-gated imports for dead code elimination

**Main CLI (`src/main.tsx`)**
- Commander.js argument parsing
- OAuth authentication flow
- GrowthBook feature flagging
- Telemetry initialization
- REPL launch via `launchRepl()`

**QueryEngine (`src/QueryEngine.ts`)**
- Core conversation engine managing the LLM query lifecycle
- Handles message processing, tool invocations, and context management
- Integrates with Anthropic API (and other providers)
- Supports max turns, budget limits, and abort handling

**Commands (`src/commands.ts`)**
- Slash command registry (~50 commands)
- Commands are of types: `prompt` (AI-invokable), `local` (CLI output), `local-jsx` (Interactive UI)
- Lazy-loaded with feature-flag-based dead code elimination

**Tools (`src/tools.ts` + `src/tools/*/`)**
- ~40 tool implementations for AI agent use
- Core tools: BashTool, FileReadTool, FileEditTool, FileWriteTool, GlobTool, GrepTool
- Advanced tools: AgentTool (subagents), TaskCreate/Update/List tools, MCP tools, NotebookEditTool
- Each tool has a prompt.ts defining its schema and behavior

**State Management (`src/state/`)**
- React-based state with custom store in `store.ts`
- AppState in `AppState.tsx` tracks conversation, tools, permissions
- bootstrap/state.ts for session-level configuration

### Directory Structure

```
src/
├── entrypoints/
│   ├── cli.tsx          # Main CLI entrypoint with fast-path routing
│   └── sdk/             # SDK-specific entrypoints
├── main.tsx             # Full CLI initialization with auth/telemetry
├── QueryEngine.ts       # Core conversation engine
├── commands.ts          # Slash command registry
├── tools.ts             # Tool registry and assembly
├── context.ts           # System/user context collection
├── commands/            # Slash command implementations (~50 files)
├── tools/               # Tool implementations (~40 subdirectories)
├── services/            # External service integrations
│   ├── api/             # Claude API client
│   ├── analytics/       # Telemetry (GrowthBook, Datadog)
│   ├── mcp/             # MCP (Model Context Protocol)
│   ├── oauth/           # OAuth authentication
│   ├── lsp/             # LSP client support
│   └── compact/         # Context compaction
├── utils/               # Utilities (~100+ modules)
│   ├── model/           # Model selection and resolution
│   ├── permissions/     # Permission system
│   ├── plugins/         # Plugin management
│   └── settings/        # User settings
├── components/          # React/Ink UI components
├── screens/             # Full-screen UIs (REPL, Doctor)
├── skills/              # Skill system (bundled + user skills)
├── plugins/             # Plugin system (bundled + user plugins)
└── constants/           # Prompts, OAuth config, etc.
```

### Key Technical Patterns

**Feature Flags & Dead Code Elimination**
```typescript
import { feature } from 'bun:bundle'

// Conditional imports based on build-time feature flags
const SomeTool = feature('SOME_FEATURE')
  ? require('./tools/SomeTool.js').SomeTool
  : null
```

**Tool Definition Pattern**
```typescript
// src/tools/SomeTool/SomeTool.ts
export const SomeTool: Tool = {
  name: 'tool_name',
  description: 'What the tool does',
  inputSchema: {...},
  isEnabled: () => boolean,
  async *call(...) { ... }
}
```

**Command Definition Pattern**
```typescript
// Commands can be: prompt, local (text), local-jsx (interactive)
export const myCommand: Command = {
  type: 'local', // or 'prompt' or 'local-jsx'
  name: 'mycommand',
  description: 'Description',
  async action(args) { ... }
}
```

**Model Resolution**
- Model aliases supported (e.g., 'claude-opus-4-6' → actual model name)
- Provider support: Anthropic (first-party), OpenRouter, Z.ai
- Environment-based overrides: `ANTHROPIC_MODEL`, `--model` flag
- see `src/utils/model/model.ts` and `src/utils/model/aliases.ts`

**Permission System**
- Permission modes: `ask`, `acceptEdits`, `acceptAll`, `autoEdit`, `autoAll`
- Policy limits via remote management
- Tool-specific deny rules
- see `src/utils/permissions/`

### Provider Configuration

The application supports multiple AI providers:

**Anthropic (default)**
- `ANTHROPIC_API_KEY` or OAuth

**Z.ai**
- `CLAUDE_CODE_USE_ZAI=1`
- `ZAI_API_KEY=your-key`
- Routes to `https://api.z.ai/api/anthropic`

**OpenRouter**
- `CLAUDE_CODE_USE_OPENROUTER=1`
- `OPENROUTER_API_KEY=sk-or-v1-...`
- Routes to `https://openrouter.ai/api`

### Development Notes

- **Macros**: Build-time constants defined in `build.ts` (VERSION, BUILD_TIME, etc.)
- **Dev Mode**: `dev.ts` polyfills MACRO globals and sets `CLAUDE_CODE_DEV_MODE=true`
- **Tests**: Test files use `*.test.ts` pattern, run with `bun test`
- **Type Checking**: Strict TypeScript with path mapping (src/* → ./src/*)
- **Native TS**: Some native modules ported to pure TypeScript in `native-ts/`

### Important Environment Variables

```bash
# Disable telemetry
DISABLE_TELEMETRY=1

# Privacy (disable non-essential traffic)
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# Simple mode (reduced features)
CLAUDE_CODE_SIMPLE=1

# Override API endpoint
ANTHROPIC_BASE_URL=https://custom.endpoint.com

# Model selection
ANTHROPIC_MODEL=claude-sonnet-4-6
```

### Key Files for Understanding Flow

1. `src/entrypoints/cli.tsx` → Entry routing
2. `src/main.tsx` → CLI initialization
3. `src/replLauncher.tsx` → REPL initialization
4. `src/QueryEngine.ts` → Core conversation loop
5. `src/tools.ts` → Tool assembly (`getTools()`, `assembleToolPool()`)
6. `src/commands.ts` → Command loading (`getCommands()`, `loadAllCommands()`)
