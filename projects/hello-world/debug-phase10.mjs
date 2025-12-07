#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the E2E test class
import { HelloWorldE2E } from './sources/e2e-full.mjs';

// Create instance
const e2e = new HelloWorldE2E({ interactive: false, logLevel: 'DEBUG' });

console.log('\n=== DEBUGGING PHASE 10 LOGGER ===\n');

console.log('e2e.logger type:', typeof e2e.logger);
console.log('e2e.logger class:', e2e.logger?.constructor?.name);
console.log('e2e.logger methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(e2e.logger || {})));
console.log('e2e.logger.info type:', typeof e2e.logger?.info);
console.log('e2e.tracker type:', typeof e2e.tracker);
console.log('e2e.tracker class:', e2e.tracker?.constructor?.name);

// Check if logger has the required methods
if (e2e.logger) {
  console.log('\nLogger methods:');
  console.log('  - info:', !!e2e.logger.info);
  console.log('  - debug:', !!e2e.logger.debug);
  console.log('  - error:', !!e2e.logger.error);
  console.log('  - phaseComplete:', !!e2e.logger.phaseComplete);
}

console.log('\n=== Testing DeployAgent instantiation ===\n');

// Try to import DeployAgent directly
import DeployAgent from '/workspaces/forge-ai/packages/agents/deploy-agent.mjs';

try {
  const deployAgent = new DeployAgent(e2e.logger, e2e.tracker, {
    projectRoot: e2e.projectRoot,
    containerRuntime: 'docker',
    orchestrator: 'docker-compose',
    baseImage: 'node:22-alpine',
  });
  
  console.log('DeployAgent created successfully');
  console.log('deployAgent.logger type:', typeof deployAgent.logger);
  console.log('deployAgent.logger.info type:', typeof deployAgent.logger?.info);
  
} catch (error) {
  console.error('Failed to create DeployAgent:', error.message);
}
