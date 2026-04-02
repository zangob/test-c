@echo off
:: claude-dev.bat - Development runner for Open Claude Code
:: Usage: claude-dev [args...]
:: Can be run from any directory

set "SCRIPT_DIR=%~dp0"
bun "%SCRIPT_DIR%dev.ts" %*
