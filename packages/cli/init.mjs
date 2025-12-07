#!/usr/bin/env node
/**
 * Forge AI - Initialization Script
 * Sets up knowledge base and core infrastructure
 */

import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.join(__dirname, '..', '..');

console.log('Initializing Forge AI...\n');

// Ensure knowledge directory exists
const knowledgeDir = path.join(projectRoot, 'knowledge');
if (!fs.existsSync(knowledgeDir)) {
  fs.mkdirSync(knowledgeDir, { recursive: true });
  console.log('✓ Created knowledge directory');
}

// Initialize experiences.json if not exists
const experiencesFile = path.join(knowledgeDir, 'experiences.json');
if (!fs.existsSync(experiencesFile)) {
  const initialData = {
    version: '1.0',
    initialized: new Date().toISOString(),
    experiences: [],
    strategy_rankings: {}
  };
  fs.writeFileSync(experiencesFile, JSON.stringify(initialData, null, 2));
  console.log('✓ Created experiences.json');
} else {
  console.log('✓ experiences.json already exists');
}

// Initialize strategies.json if not exists
const strategiesFile = path.join(knowledgeDir, 'strategies.json');
if (!fs.existsSync(strategiesFile)) {
  const initialData = {
    version: '1.0',
    strategies: []
  };
  fs.writeFileSync(strategiesFile, JSON.stringify(initialData, null, 2));
  console.log('✓ Created strategies.json');
} else {
  console.log('✓ strategies.json already exists');
}

console.log('\n✅ Forge AI initialized successfully!\n');
console.log('Next steps:');
console.log('  1. Create a requirements file in examples/');
console.log('  2. Run: forge execute --requirements=examples/your-task.md');
console.log('  3. View results: forge dashboard\n');
