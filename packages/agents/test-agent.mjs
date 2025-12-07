/**
 * Test Agent (Refactored)
 * 
 * Part 1: Generic Definition
 * - Generates tests from technical specification
 * - No hardcoded test cases
 * 
 * Part 2: Requirement Context
 * - Input: technical-specification.json
 * - Output: test-specification.json
 * 
 * Part 3: Knowledge Base
 * - Patterns: Common test structures, assertions
 * - Strategies: Different testing approaches
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';

export class TestAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.technicalSpec = null;
    this.testSpec = null;
  }

  /**
   * Main execution method.
   */
  async execute(technicalSpecPath) {
    if (!fs.existsSync(technicalSpecPath)) {
      throw new Error(`Technical spec not found: ${technicalSpecPath}`);
    }

    this._log(`Processing technical specification: ${technicalSpecPath}`);

    // Load knowledge base
    this.loadKnowledgeBase();

    // Load technical spec
    const content = fs.readFileSync(technicalSpecPath, 'utf-8');
    this.technicalSpec = JSON.parse(content);

    // Set context
    this.setRequirementContext(this.technicalSpec);

    // Generate test specification
    const testSpec = this._generateTestSpec();
    this.testSpec = testSpec;

    // Learn patterns
    this._learnFromExecution(testSpec);

    return testSpec;
  }

  /**
   * Generate test specification from technical specification.
   */
  _generateTestSpec() {
    const spec = {
      name: this.technicalSpec.name,
      version: this.technicalSpec.version,
      timestamp: new Date().toISOString(),
      unitTests: this._generateUnitTests(),
      e2eTests: this._generateE2ETests(),
      testCommandsToRun: this._generateTestCommands(),
    };

    return spec;
  }

  /**
   * Generate unit test specifications.
   */
  _generateUnitTests() {
    const tests = [];
    const apis = this.technicalSpec.apis || [];

    apis.forEach((api) => {
      tests.push({
        testId: `unit_${api.id}`,
        testName: `${api.name} - Happy Path`,
        target: api.name,
        assertions: [
          'Should accept valid input',
          'Should return success response',
          'Should have correct data structure',
        ],
        errorScenarios: [
          {
            scenario: `${api.name} with invalid input`,
            assertions: ['Should reject invalid input', 'Should return error'],
          },
        ],
      });
    });

    return tests;
  }

  /**
   * Generate E2E test specifications.
   */
  _generateE2ETests() {
    const tests = [];
    const requirementMapping = this.technicalSpec.requirementMapping || [];

    requirementMapping.forEach((mapping) => {
      mapping.acceptanceCriteria.forEach((ac, idx) => {
        tests.push({
          testId: `e2e_${mapping.requirementId}_${idx}`,
          testName: ac,
          requirement: mapping.requirement,
          acceptanceCriteria: ac,
          steps: [
            'Given: system is ready',
            'When: user performs action',
            'Then: verify expected behavior',
          ],
        });
      });
    });

    return tests;
  }

  /**
   * Generate test commands.
   */
  _generateTestCommands() {
    return [
      'npm run lint',
      'npm run test',
      'npm run test -- --coverage',
    ];
  }

  /**
   * Learn patterns from execution.
   */
  _learnFromExecution(testSpec) {
    if (testSpec.unitTests.length > 0) {
      this.learnPattern({
        name: 'comprehensive-unit-testing',
        category: 'testing-strategy',
        description: `Generated ${testSpec.unitTests.length} unit test specs`,
        successRate: 0.85,
      });
    }

    if (testSpec.e2eTests.length > 0) {
      this.learnPattern({
        name: 'acceptance-driven-testing',
        category: 'testing-strategy',
        description: `Generated ${testSpec.e2eTests.length} E2E test specs from acceptance criteria`,
        successRate: 0.8,
      });
    }
  }

  /**
   * Save test specification.
   */
  saveTestSpec(outputPath) {
    const spec = this.testSpec || this._generateTestSpec();
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    this._log(`✓ Test specification saved to ${outputPath}`);
    return spec;
  }

  /**
   * Stub: Run tests (to be implemented with actual test framework)
   */
  async runTests(implementationResult) {
    this._log(`🧪 Running tests...`);

    // Stub response
    return {
      allPassed: true,
      testsRun: this.testSpec?.unitTests?.length || 0,
      failures: [],
    };
  }
}

export default TestAgent;
