#!/usr/bin/env node

/**
 * Generic Project E2E Test Runner
 * 
 * This script can be used for ANY project by passing --project parameter
 * It uses the ProjectOrchestrator base class to automatically configure paths
 * 
 * Project Structure:
 *   projects/{projectName}/
 *   ├── sources/                (Framework artifacts, this runner, e2e tests)
 *   ├── requirements/           (Project requirements)
 *   ├── generated-code/         (Output: generated source code)
 *   ├── test-results/           (Output: test execution results)
 *   ├── docs/                   (Output: documentation)
 *   ├── reports/                (Output: execution reports)
 *   └── deployment/             (Output: deployment configs)
 * 
 * Usage:
 *   node projects/hello-world/sources/e2e.mjs
 *   node e2e-runner.mjs --project hello-world
 *   node e2e-runner.mjs --project hello-world --interactive
 *   LOG_LEVEL=VERBOSE node e2e-runner.mjs --project hello-world
 */

import ProjectOrchestrator from './packages/orchestrator/projectOrchestrator.mjs';

// Parse command line arguments
const args = process.argv.slice(2);
let projectName = 'hello-world'; // default
let interactive = true;
let logLevel = process.env.LOG_LEVEL || 'DEBUG';
let autoRun = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    projectName = args[i + 1];
    i++;
  } else if (args[i] === '--auto') {
    autoRun = true;
    interactive = false;
  } else if (args[i] === '--interactive') {
    interactive = true;
  } else if (args[i] === '--log-level' && args[i + 1]) {
    logLevel = args[i + 1];
    i++;
  }
}

// Initialize orchestrator
let orchestrator;
try {
  orchestrator = new ProjectOrchestrator({
    projectName,
    interactive,
    logLevel,
  });
} catch (error) {
  console.error('\n❌ Failed to initialize ProjectOrchestrator:');
  console.error(error.message);
  process.exit(1);
}

// Display project info
orchestrator.displayProjectInfo();

// Get project configuration
const config = orchestrator.getProjectConfig();
console.log('📁 Project Configuration:');
console.log(`   Name: ${config.projectName}`);
console.log(`   Root: ${config.projectRoot}`);
console.log(`   Requirements: ${config.paths.requirements}`);
console.log(`   Reports: ${config.paths.reports}`);
console.log(`   Deployment: ${config.paths.deployment}`);
console.log('');

// Validate and load requirement
try {
  orchestrator.validateRequirementFile();
  const requirement = orchestrator.readRequirement();
  console.log(`✅ Requirement loaded (${requirement.length} bytes)`);
} catch (error) {
  console.error('\n❌ Failed to load requirement:');
  console.error(error.message);
  process.exit(1);
}

// Ensure output directories exist
orchestrator.ensureOutputDirectories();
console.log('✅ Output directories ready');

// Display available projects
const availableProjects = orchestrator.getAvailableProjects();
console.log(`\n📦 Available Projects: ${availableProjects.join(', ')}`);

console.log(`\n✅ ProjectOrchestrator ready for project: ${projectName}`);
console.log(`   Mode: ${interactive ? 'INTERACTIVE' : 'AUTOMATIC'}`);
console.log(`   Timestamp: ${orchestrator.getTimestamp()}`);
console.log('');

if (!autoRun) {
  console.log('ℹ️  To run the full workflow, use: --auto flag');
  console.log('');
}
