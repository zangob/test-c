#!/usr/bin/env bun
/**
 * Development runner - runs Claude Code directly from source without building.
 *
 * Usage: bun run dev
 * Can be run from any directory - will auto-detect the project root.
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

// Get the directory where this script is located (project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;

// Change to the project directory so all relative paths work
process.chdir(projectRoot);

// Set environment variables to indicate dev mode
process.env.CLaude_CODE_DEV_MODE = 'true';

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

// Import and run the CLI entrypoint from the project root
await import(resolve(projectRoot, 'src/entrypoints/cli.tsx'));
