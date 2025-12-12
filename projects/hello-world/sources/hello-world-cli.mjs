#!/usr/bin/env node

// Simple Hello World CLI to validate requirement
// Usage:
//   node projects/hello-world/sources/hello-world-cli.mjs
//   node projects/hello-world/sources/hello-world-cli.mjs --name=Alice
//   node projects/hello-world/sources/hello-world-cli.mjs --help

function parseArgs(argv) {
  const args = {};
  for (const a of argv) {
    if (a === '--help') args.help = true;
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

function formatGreeting(name) {
  if (!name) return 'Hello, World!';
  return `Hello, ${name}!`;
}

(function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: hello-world [--name=<string>]');
    process.exit(0);
  }
  const name = (args.name || '').trim();
  console.log(formatGreeting(name));
  process.exit(0);
})();
