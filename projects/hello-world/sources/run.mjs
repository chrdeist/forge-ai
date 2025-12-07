#!/usr/bin/env node

/**
 * Hello World Project - E2E Test Wrapper
 * 
 * Simplified runner for the hello-world project that delegates to e2e.mjs
 * with automatic project detection
 * 
 * Usage:
 *   node sources/run.mjs
 *   node sources/run.mjs --auto
 *   node sources/run.mjs --interactive
 *   LOG_LEVEL=VERBOSE node sources/run.mjs --auto
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e2eScript = path.join(__dirname, 'e2e.mjs');

// Pass all arguments to e2e.mjs
const child = spawn('node', [e2eScript, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: __dirname,
});

child.on('exit', (code) => {
  process.exit(code);
});
