#!/usr/bin/env bun
/**
 * Development runner - runs Claude Code directly from source without building.
 *
 * Usage: bun run dev
 */

// Define global macros for development
(globalThis as any).MACRO_VERSION = 'dev';
(globalThis as any).MACRO_BUILD_TIME = new Date().toISOString();
(globalThis as any).MACRO_FEEDBACK_CHANNEL = '#claude-code';
(globalThis as any).MACRO_ISSUES_EXPLAINER = 'report the issue at https://github.com/anthropics/claude-code/issues';

// Polyfill MACRO object that build replaces at compile time
(globalThis as any).MACRO = {
  VERSION: (globalThis as any).MACRO_VERSION,
  BUILD_TIME: (globalThis as any).MACRO_BUILD_TIME,
  FEEDBACK_CHANNEL: (globalThis as any).MACRO_FEEDBACK_CHANNEL,
  ISSUES_EXPLAINER: (globalThis as any).MACRO_ISSUES_EXPLAINER,
};

// Import and run the CLI entrypoint
await import('./src/entrypoints/cli.tsx');
