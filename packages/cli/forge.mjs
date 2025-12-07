#!/usr/bin/env node
/**
 * Forge AI - Command Line Interface
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SoftwareLifecycleOrchestrator } from '../orchestrator/softwareLifecycleOrchestrator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command) {
    console.log(`
Forge AI - Framework for Optimized Recursive Generation & Evolution

Usage: forge <command> [options]

Commands:
  execute --requirements=<file>  Execute a feature requirement
  dashboard                       Show performance dashboard
  evolve                          Trigger strategy evolution
  init                            Initialize knowledge base

Examples:
  forge execute --requirements=./examples/01-hello-world/requirements.md
  forge dashboard
`);
    process.exit(0);
  }

  if (command === 'execute') {
    const reqsArg = args.find((arg) => arg.startsWith('--requirements='));
    if (!reqsArg) {
      console.error('❌ Error: --requirements=<file> is required');
      process.exit(1);
    }

    const requirementsFile = reqsArg.split('=')[1];
    console.log(`\n🚀 Starting Forge AI Execution...`);
    console.log(`📄 Requirements: ${requirementsFile}\n`);

    const orchestrator = new SoftwareLifecycleOrchestrator({
      projectRoot,
      requirementsFile,
    });

    try {
      await orchestrator.executeWorkflow(requirementsFile);
      process.exit(0);
    } catch (error) {
      console.error(`\n❌ Execution failed: ${error.message}`);
      process.exit(1);
    }
  } else if (command === 'init') {
    console.log('Initializing Forge AI...');
    // TODO: init logic
  } else if (command === 'dashboard') {
    console.log('Dashboard (not yet implemented)');
  } else if (command === 'evolve') {
    console.log('Evolution (not yet implemented)');
  } else {
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
