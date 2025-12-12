/**
 * Test script for Rule Engine
 */

import RuleEngine from './rule-engine.mjs';
import fs from 'fs';
import path from 'path';

console.log('='.repeat(60));
console.log('Rule Engine Test');
console.log('='.repeat(60));

const engine = new RuleEngine('./knowledge');

console.log(`\n✓ Loaded ${engine.getTotalRulesCount()} rules total`);

// Test 1: Get rules for implementation phase
console.log('\n--- Test 1: Implementation Phase Rules ---');
const implRules = engine.getRulesForPhase('implementation');
console.log(`Found ${implRules.length} rules for implementation phase:`);
implRules.slice(0, 5).forEach(rule => {
  console.log(`  - ${rule.id}: ${rule.name} [${rule.severity}]`);
});

// Test 2: Evaluate ESM condition
console.log('\n--- Test 2: ESM Module Detection ---');
const testContext = {
  projectPath: './generated-code/hello-world-feature-2',
};

const esmRule = engine.getRuleById('rule-esm-001');
if (esmRule) {
  const matches = engine.evaluateCondition(esmRule, testContext);
  console.log(`ESM rule condition match: ${matches}`);
}

// Test 3: Apply validation rules
console.log('\n--- Test 3: Apply Validation Rules ---');
const valResults = await engine.applyRules('implementation', testContext);
console.log(`Checked: ${valResults.rulesChecked}, Applied: ${valResults.rulesApplied}, Failed: ${valResults.rulesFailed}`);
valResults.details.slice(0, 3).forEach(detail => {
  console.log(`  ${detail.success ? '✓' : '✗'} ${detail.ruleName}: ${detail.message}`);
});

// Test 4: Error resolution
console.log('\n--- Test 4: Error Resolution ---');
const errorMsg = 'ReferenceError: require is not defined in ES module scope';
const fix = engine.suggestFix(errorMsg);
if (fix) {
  console.log(`Suggested fix: ${fix.ruleName}`);
  console.log(`  Fix pattern: ${fix.fix.search} → ${fix.fix.replace}`);
  if (fix.examples && fix.examples[0]) {
    console.log(`  Example:`);
    console.log(`    Wrong: ${fix.examples[0].wrong}`);
    console.log(`    Correct: ${fix.examples[0].correct}`);
  }
} else {
  console.log('No fix found for error');
}

// Test 5: Load template
console.log('\n--- Test 5: Template Loading ---');
try {
  const template = engine.loadTemplate('templates/esm-app-template.js', {
    PROJECT_NAME: 'test-project',
  });
  console.log(`✓ Loaded ESM template (${template.length} chars)`);
  console.log(`  First line: ${template.split('\n')[0]}`);
} catch (error) {
  console.log(`✗ Failed to load template: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('Test Complete');
console.log('='.repeat(60));
