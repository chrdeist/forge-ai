/**
 * Test Agent (Generic, RVD-based)
 * 
 * Purpose:
 * - Generates test specifications from technical requirements
 * - Creates unit tests, integration tests, E2E test specifications
 * - Reads from RVD technical section, writes to RVD testing section
 * 
 * Input: RVD file (technical section populated)
 * Output: RVD file with testing-section populated
 * 
 * No hardcoded content - fully generic implementation
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';
import { RVDManager } from './rvd-manager.mjs';

export class TestAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.rvdManager = new RVDManager(config);
  }

  /**
   * Main execute method
   * @param {string} rvdFilePath - Path to RVD file (with technical section)
   */
  async execute(rvdFilePath) {
    if (!fs.existsSync(rvdFilePath)) {
      throw new Error(`RVD file not found: ${rvdFilePath}`);
    }

    this._log(`🧪 Generating test specifications from RVD`);

    // Load knowledge base for learning
    this.loadKnowledgeBase();

    // Load RVD file
    const rvd = await this.rvdManager.load(rvdFilePath);

    if (!rvd.technical) {
      throw new Error('Technical section not found in RVD file. Run TechnicalRequirementsAgent first.');
    }

    // Set context
    this.setRequirementContext(rvd.project || {});

    // Generate test specifications from technical requirements
    const testSpecifications = this._generateTestSpecifications(
      rvd.technical.data,
      rvd.project?.name || 'unknown'
    );

    // Write to testing section
    rvd.testing = {
      timestamp: new Date().toISOString(),
      generatedBy: 'TestAgent',
      data: testSpecifications,
    };

    // Save RVD file
    await this.rvdManager.save(rvdFilePath, rvd);
    this._log(`✓ Wrote testing section to RVD`);

    // Learn patterns
    this._learnFromExecution(testSpecifications);

    return {
      success: true,
      rvdPath: rvdFilePath,
      testSpecifications,
    };
  }

  /**
   * Generate test specifications from technical requirements
   * Creates unit, integration, and E2E test specs
   */
  _generateTestSpecifications(technicalData, projectName) {
    this._log(`  ✓ Generating test specifications for ${projectName}`);

    const unitTests = this._generateUnitTests(technicalData);
    const integrationTests = this._generateIntegrationTests(technicalData);
    const e2eTests = this._generateE2ETests(technicalData);

    return {
      projectName,
      version: '1.0',
      timestamp: new Date().toISOString(),
      sourceSection: 'technical',
      unitTests: unitTests,
      integrationTests: integrationTests,
      e2eTests: e2eTests,
      testCoverage: {
        targetCoverage: 80,
        requiredCoverage: 70,
      },
    };
  }

  /**
   * Generate unit test specifications
   * One test suite per API endpoint
   */
  _generateUnitTests(technicalData) {
    const apis = technicalData.apis || [];
    const unitTests = [];

    apis.forEach((api, index) => {
      const testSuite = {
        id: `unit-test-${index + 1}`,
        name: `${api.method} ${api.path}`,
        endpoint: api.path,
        method: api.method,
        testCases: [
          {
            name: 'should return success with valid input',
            description: `Valid request to ${api.method} ${api.path}`,
            input: {
              method: api.method,
              path: api.path,
              headers: { 'Content-Type': 'application/json' },
              body: this._generateSampleInput(api.inputStructure),
            },
            expectedOutput: {
              statusCode: 200,
              body: this._generateSampleOutput(api.outputStructure),
            },
          },
          {
            name: 'should validate required fields',
            description: 'Missing required fields should return 400',
            input: {
              method: api.method,
              path: api.path,
              headers: { 'Content-Type': 'application/json' },
              body: {},
            },
            expectedOutput: {
              statusCode: 400,
              errorType: 'ValidationError',
            },
          },
          {
            name: 'should handle errors gracefully',
            description: 'Server errors should return 500 with error details',
            input: {
              method: api.method,
              path: api.path,
              headers: { 'Content-Type': 'application/json' },
              body: this._generateInvalidInput(api.inputStructure),
            },
            expectedOutput: {
              statusCode: 500,
              errorType: 'InternalServerError',
            },
          },
        ],
      };

      unitTests.push(testSuite);
    });

    return {
      count: unitTests.length,
      suites: unitTests,
      framework: 'jest',
      description: `Unit test specifications for ${apis.length} API endpoints`,
    };
  }

  /**
   * Generate integration test specifications
   * Tests API interactions and data flows
   */
  _generateIntegrationTests(technicalData) {
    const apis = technicalData.apis || [];
    const dataStructures = technicalData.dataStructures || [];

    const integrationTests = [
      {
        id: 'integration-test-1',
        name: 'Create and Retrieve Flow',
        description: 'Test workflow: create resource → retrieve resource',
        steps: [
          {
            step: 1,
            action: 'Create',
            endpoint: apis.length > 0 ? apis[0].path : '/api/resource',
            method: 'POST',
            data: dataStructures.length > 0 ? `Create ${dataStructures[0].name}` : 'Create new resource',
          },
          {
            step: 2,
            action: 'Retrieve',
            endpoint: apis.length > 0 ? apis[0].path : '/api/resource/:id',
            method: 'GET',
            data: 'Fetch created resource by ID',
          },
        ],
        expectedResult: 'Resource successfully created and retrieved',
      },
      {
        id: 'integration-test-2',
        name: 'Update and Verify Flow',
        description: 'Test workflow: update resource → verify changes',
        steps: [
          {
            step: 1,
            action: 'Update',
            endpoint: apis.length > 1 ? apis[1].path : '/api/resource/:id',
            method: 'PUT',
            data: 'Update resource fields',
          },
          {
            step: 2,
            action: 'Verify',
            endpoint: apis.length > 0 ? apis[0].path : '/api/resource/:id',
            method: 'GET',
            data: 'Verify updated data matches',
          },
        ],
        expectedResult: 'Resource updates reflected in retrieval',
      },
    ];

    return {
      count: integrationTests.length,
      tests: integrationTests,
      framework: 'jest',
      description: `Integration test specifications covering data flows`,
    };
  }

  /**
   * Generate E2E test specifications
   * Tests complete user workflows
   */
  _generateE2ETests(technicalData) {
    const e2eTests = [
      {
        id: 'e2e-test-1',
        name: 'Complete User Workflow',
        description: 'Full end-to-end user interaction flow',
        preconditions: [
          'User is authenticated',
          'System is running',
          'Database is accessible',
        ],
        steps: [
          {
            step: 1,
            action: 'User initiates request',
            description: 'User sends initial request to system',
          },
          {
            step: 2,
            action: 'System processes',
            description: 'System validates and processes request',
          },
          {
            step: 3,
            action: 'User receives response',
            description: 'User receives result with success confirmation',
          },
        ],
        postconditions: [
          'Data is persisted',
          'User receives confirmation',
          'System state is consistent',
        ],
        expectedOutcome: 'Workflow completes successfully with expected results',
      },
      {
        id: 'e2e-test-2',
        name: 'Error Handling Workflow',
        description: 'System handles errors gracefully in E2E flow',
        preconditions: [
          'System is running',
          'Invalid request scenarios are possible',
        ],
        steps: [
          {
            step: 1,
            action: 'User sends invalid request',
            description: 'User sends malformed or invalid data',
          },
          {
            step: 2,
            action: 'System detects error',
            description: 'System identifies and logs error',
          },
          {
            step: 3,
            action: 'User receives feedback',
            description: 'User gets informative error message',
          },
        ],
        postconditions: [
          'Error is logged',
          'System remains stable',
          'User can retry',
        ],
        expectedOutcome: 'Error is handled gracefully and user is informed',
      },
    ];

    return {
      count: e2eTests.length,
      tests: e2eTests,
      framework: 'playwright',
      description: `E2E test specifications for complete user workflows`,
    };
  }

  /**
   * Generate sample input data based on structure
   */
  _generateSampleInput(structure) {
    if (!structure) {
      return { id: 1, name: 'sample', description: 'sample data' };
    }

    const sample = {};
    Object.entries(structure).forEach(([key, type]) => {
      if (type === 'string') sample[key] = 'sample-value';
      if (type === 'number') sample[key] = 42;
      if (type === 'boolean') sample[key] = true;
      if (type === 'array') sample[key] = ['item1', 'item2'];
      if (type === 'object') sample[key] = { nested: 'value' };
    });

    return sample;
  }

  /**
   * Generate sample output data based on structure
   */
  _generateSampleOutput(structure) {
    if (!structure) {
      return { id: 1, status: 'success', timestamp: new Date().toISOString() };
    }

    const sample = { id: 1, status: 'success', timestamp: new Date().toISOString() };
    Object.entries(structure).forEach(([key, type]) => {
      if (type === 'string') sample[key] = 'output-value';
      if (type === 'number') sample[key] = 100;
      if (type === 'boolean') sample[key] = true;
      if (type === 'array') sample[key] = ['result1', 'result2'];
      if (type === 'object') sample[key] = { result: 'value' };
    });

    return sample;
  }

  /**
   * Generate invalid input for negative test cases
   */
  _generateInvalidInput(structure) {
    if (!structure) {
      return null;
    }

    const invalid = {};
    Object.entries(structure).forEach(([key]) => {
      invalid[key] = null;
    });

    return invalid;
  }

  /**
   * Learn patterns from execution
   */
  _learnFromExecution(testSpecs) {
    const unitCount = testSpecs?.unitTests?.count || 0;
    const intCount = testSpecs?.integrationTests?.count || 0;
    const e2eCount = testSpecs?.e2eTests?.count || 0;
    this.learnPattern({
      name: 'test-spec-generation',
      category: 'generic-pattern',
      description: `Generated ${unitCount} unit, ${intCount} integration, ${e2eCount} e2e specs`,
      successRate: 0.8,
    });
  }
}

export default TestAgent;
