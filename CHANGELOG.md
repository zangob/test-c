# Changelog

All notable changes to this project will be documented in this file.

---

## [2.1.88.4] - 2026-04-04

### Added

#### New Commands Available to All Users

- **`/version`** — Display the current version and build timestamp. Previously restricted to Anthropic employees only.
  - **Usage:** Type `/version` in the command prompt
  - **Output:** `2.1.88.4 (built 2026-04-04T...)`
  - **When to use:** Verify you are running the correct build or when reporting issues

- **`/commit`** — Create a safe git commit with an intelligent auto-generated message.
  - **Usage:** `/commit` or `/commit with additional instructions`
  - **How it works:**
    1. Analyzes changes via `git status`, `git diff`, and `git log`
    2. Crafts an appropriate commit message following repo conventions
    3. Executes `git add` and `git commit` safely
  - **When to use:** Quick commits without manually writing messages

- **`/commit-push-pr`** — Complete Git + GitHub workflow in a single command.
  - **Usage:** `/commit-push-pr` or `/commit-push-pr with additional instructions`
  - **How it works:**
    1. Creates a new branch (prefixed with your username if on a main branch)
    2. Creates a commit with an appropriate message
    3. Pushes changes to origin (`git push`)
    4. Creates a Pull Request with a structured body (summary + test checklist + changelog section)
    5. Returns the PR URL when done
  - **Undercover Mode:** Automatically activates in public repositories to prevent leaking internal information
  - **When to use:** Automate the full workflow from commit to PR in one step

- **`/init-verifiers`** — Set up automated code quality verifiers.
  - **Usage:** `/init-verifiers`
  - **How it works:**
    1. Scans the project and detects its type (web app, CLI, API)
    2. Configures appropriate testing tools (Playwright for browsers, Tmux for CLI, curl for APIs)
    3. Creates `SKILL.md` files in `.claude/skills/` with verification instructions
  - **When to use:** Set up automatic change verification before every commit

#### New Features Available to All Users

- **Auto Permission Mode** — ML-powered classifier that automatically allows or denies tool actions without prompting the user.
  - **How to enable:**
    - Via settings: Add `"defaultMode": "auto"` to `.claude/settings.json`
    - Via CLI: `claude --permission-mode auto`
    - Via UI: `Ctrl+Shift+A` or from the status bar
  - **How it works:**
    1. On each tool action, sends a fast side-classification (stage 1 without thinking)
    2. If allowed → executes immediately
    3. If blocked → escalates to stage 2 with chain-of-thought to reduce false positives
    4. Leverages conversation context and CLAUDE.md files for intelligent decisions
  - **Mode cycling:** `Default → Accept Edits → Plan → Bypass Permissions → Auto → Default`
  - **When to use:** For a seamless experience without constant permission prompts, especially in trusted projects

- **Plan Mode Interview Phase** — Adds a clarifying questions phase to the 5-phase plan mode workflow.
  - **How to enable:** `/plan` or switch to Plan mode from the status bar
  - **How it works:** Adds an "interview phase" as stage 2 in the workflow:
    1. Understand requirements
    2. **Interview phase:** Ask clarifying questions to the user (new)
    3. Explore current codebase
    4. Write a detailed plan
    5. Execute after approval
  - **When to use:** For more precise planning with an opportunity to ask clarifying questions before starting

- **Persistent effort=max** — Allow saving the maximum effort level permanently in settings.
  - **Usage:** `/effort max` then choose to save permanently
  - **How it works:** Previously `max` was session-scoped only. Now it can be persisted to `settings.json` to remain active across sessions
  - **Effort levels:** `low` (fast) → `medium` (balanced) → `high` (detailed) → `max` (maximum quality)
  - **When to use `max`:** For complex tasks requiring deep analysis and thorough reasoning

- **Undercover Mode for Everyone** — Protection against leaking internal information when contributing to public repositories.
  - **Automatic activation:** Enabled automatically in public repositories (detected from remote URL)
  - **Manual activation:** `export CLAUDE_CODE_UNDERCOVER=1`
  - **How it works:**
    1. Adds safety instructions to commit and PR prompts
    2. Prevents inclusion of internal model codenames (Capybara, Tengu, etc.)
    3. Prevents mentioning "Claude Code" or any AI references
    4. Prevents Co-Authored-By lines or any attribution
    5. Writes commit messages as a human developer would
  - **Automatic activation rules:**

    | Scenario | Undercover |
    |----------|-----------|
    | Public repo (GitHub public) | Enabled |
    | Anthropic internal repo | Disabled |
    | Regular folder without git | Enabled (safe default) |
    | `/tmp` or temporary folder | Enabled |

### Fixed

- **Context Window Management:** Fixed rapid context window exhaustion by increasing autocompact safety buffer from 13,000 to 30,000 tokens
- **Autocompact Circuit Breaker:** Raised consecutive failure threshold from 3 to 10, preventing premature permanent disablement during transient API instability
- **Post-Compact Context Bloat:** Reduced post-compaction file restoration from 5 files / 50K tokens to 3 files / 25K tokens; skills budget from 25K to 15K tokens
- **Token Estimation Accuracy:** Added automatic detection of dense structured content (JSON, XML) that tokenizes at ~2 bytes/token instead of the default ~4 bytes/token
- **Tool Result Size Limits:** Reduced per-tool limit from 50K to 30K characters; per-message aggregate from 200K to 120K characters
- **CLAUDE.md Size Caps:** Added per-file limit of 10K characters and aggregate limit of 30K characters for CLAUDE.md files
- **SDK PermissionModeSchema:** Updated to include `'auto'` mode for API compatibility

---

## [2.1.88.3] - 2026-04-03

### Added
- **Z.ai Provider Integration**: Added Z.ai as a main AI provider with full model support, authentication, and configuration
- **Additional Model Support**: Expanded model configurations and options across multiple providers
- **Enhanced README**: Added comprehensive list of supported models and providers

### Changed
- Updated version from 2.1.88.1 to 2.1.88.3
- Updated API client to support Z.ai provider endpoints
- Enhanced model aliases and provider routing logic

---

## [2.1.88.1] - 2026-04-02

### Added
- **Initial Official Release**: Full open-source release of Claude Code CLI with complete feature set including:
  - Interactive terminal interface with React/Ink-based rendering
  - Multi-provider AI support (Anthropic, AWS Bedrock, Google Vertex, Azure, and more)
  - Comprehensive tool system (file read/write, bash execution, web fetch, grep, and more)
  - Plugin architecture with marketplace support
  - MCP (Model Context Protocol) server integration
  - Agent/worker system with parallel task execution
  - Session management with resume, branch, and teleport capabilities
  - Permission system with granular file, bash, and tool access controls
  - Memory system with auto-memory, project memory, and team memory
  - Skills system for extensible capabilities
  - Hooks system (pre-tool, post-tool, pre-compact, post-compact, session start)
  - Conversation compaction (auto-compact, manual compact, partial compact)
  - IDE integration (VS Code, JetBrains)
  - Remote session support via SSE and WebSocket transports
  - Voice mode support
  - Vim mode support
  - Theme and output style customization
  - Cost tracking and usage reporting
  - Update system with automatic update checking

### Changed
- Restructured project layout and removed outdated documentation
- Added mock implementations for native modules (color-diff-napi, modifiers-napi)

---

## Version History Summary

| Version | Date | Key Changes |
|---------|------|-------------|
| 2.1.88.4 | 2026-04-04 | 8 new features unlocked for all users + 6 context window fixes |
| 2.1.88.3 | 2026-04-03 | Z.ai provider, expanded model support |
| 2.1.88.1 | 2026-04-02 | Initial official release |
