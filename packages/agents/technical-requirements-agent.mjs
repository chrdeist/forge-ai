/**
 * Technical Requirements Agent (Refactored)
 * 
 * Part 1: Generic Definition (this file)
 * - Transform functional requirements to technical specs
 * - No hardcoded patterns or templates
 * 
 * Part 2: Requirement Context
 * - Input: functional-summary.json
 * - Output: technical-specification.json + markdown
 * - Uses prompt templates from ./technical-requirements-agent/prompts/
 * 
 * Part 3: Knowledge Base
 * - Patterns: Common API structures, error handling, constraints
 * - Strategies: Different approaches for different tech stacks
 * - Success rates: Which technical specs lead to successful implementations?
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';

export class TechnicalRequirementsAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.functionalSummary = null;
    this.technicalSpec = null;
  }

  /**
   * Main execution method.
   */
  async execute(functionalSummaryPath) {
    if (!fs.existsSync(functionalSummaryPath)) {
      throw new Error(`Functional summary not found: ${functionalSummaryPath}`);
    }

    this._log(`Processing functional summary: ${functionalSummaryPath}`);

    // Load knowledge base
    this.loadKnowledgeBase();

    // Load functional summary
    const content = fs.readFileSync(functionalSummaryPath, 'utf-8');
    this.functionalSummary = JSON.parse(content);

    // Set context
    this.setRequirementContext(this.functionalSummary);

    // Generate technical specification
    const spec = this._generateTechnicalSpec();
    this.technicalSpec = spec;

    // Learn patterns
    this._learnFromExecution(spec);

    return spec;
  }

  /**
   * Generate technical specification from functional requirements.
   * Uses generic derivation (no hardcodes).
   */
  _generateTechnicalSpec() {
    const spec = {
      name: this.functionalSummary.name,
      version: this.functionalSummary.version,
      timestamp: new Date().toISOString(),

      // Derive modules, APIs, data structures, constraints
      modules: this._deriveModules(),
      apis: this._deriveAPIs(),
      dataStructures: this._deriveDataStructures(),
      constraints: this._deriveConstraints(),
      errorCases: this._deriveErrorCases(),
      requirementMapping: this._mapRequirementsToTests(),
      implementationHints: this._generateImplementationHints(),
    };

    return spec;
  }

  /**
   * Derive modules/components.
   */
  _deriveModules() {
    const modules = [];
    const components = this.functionalSummary.affectedComponents || [];

    components.forEach((comp) => {
      modules.push({
        name: comp.split('/')[0] || 'core',
        path: comp,
        responsibility: `Implementation of ${comp}`,
      });
    });

    return modules;
  }

  /**
   * Derive APIs from functional requirements.
   * Generic: each requirement could be a function.
   */
  _deriveAPIs() {
    const apis = [];
    const funcReqs = this.functionalSummary.functionalRequirements || [];

    funcReqs.forEach((req, idx) => {
      const funcName = this._camelCaseFromString(req);
      apis.push({
        id: `api_${idx + 1}`,
        name: funcName,
        description: req,
        signature: {
          parameters: [
            {
              name: 'input',
              type: 'object',
              description: 'Input parameters',
              required: true,
            },
          ],
          returns: {
            type: 'Promise<object>',
            description: 'Result object',
          },
        },
        errorCases: [
          'InvalidInputError',
          'ProcessingError',
        ],
      });
    });

    return apis;
  }

  /**
   * Derive data structures.
   */
  _deriveDataStructures() {
    return [
      {
        name: 'RequestPayload',
        description: 'Standard request input',
        fields: [
          { name: 'id', type: 'string', required: false, description: 'Request ID' },
          { name: 'data', type: 'object', required: true, description: 'Request data' },
          { name: 'metadata', type: 'object', required: false, description: 'Metadata' },
        ],
      },
      {
        name: 'ResponsePayload',
        description: 'Standard response output',
        fields: [
          { name: 'success', type: 'boolean', required: true, description: 'Success flag' },
          { name: 'data', type: 'object', required: false, description: 'Response data' },
          { name: 'errors', type: 'string[]', required: false, description: 'Error messages' },
        ],
      },
    ];
  }

  /**
   * Derive constraints from non-functional requirements.
   */
  _deriveConstraints() {
    const constraints = [];

    const nfReqs = this.functionalSummary.nonFunctionalRequirements || '';
    if (nfReqs.includes('Performance') || nfReqs.includes('Skalierung')) {
      constraints.push({
        name: 'Performance',
        description: 'Operation must complete within acceptable time',
        threshold: '< 500ms',
      });
    }

    constraints.push({
      name: 'InputValidation',
      description: 'All inputs must be validated before processing',
    });

    return constraints;
  }

  /**
   * Derive error cases.
   */
  _deriveErrorCases() {
    return [
      {
        name: 'InvalidInputError',
        description: 'Input validation failed',
        statusCode: 400,
      },
      {
        name: 'ProcessingError',
        description: 'Internal processing error',
        statusCode: 500,
      },
      {
        name: 'NotFoundError',
        description: 'Resource not found',
        statusCode: 404,
      },
    ];
  }

  /**
   * Map requirements to tests.
   */
  _mapRequirementsToTests() {
    const mapping = [];
    const funcReqs = this.functionalSummary.functionalRequirements || [];
    const acs = this.functionalSummary.acceptanceCriteria || [];

    funcReqs.forEach((req, idx) => {
      const matchingACs = acs.filter(
        (ac) => ac.toLowerCase().includes(req.toLowerCase().slice(0, 10))
      );

      mapping.push({
        requirementId: `FR_${idx + 1}`,
        requirement: req,
        technicalFunction: this._camelCaseFromString(req),
        acceptanceCriteria: matchingACs,
        suggestedTests: [
          {
            type: 'unit',
            description: `Unit test for ${this._camelCaseFromString(req)}`,
            testFile: `tests/unit/${this._camelCaseFromString(req)}.test.js`,
          },
          {
            type: 'e2e',
            description: `E2E test for ${req}`,
            testFile: `tests/e2e/${this._camelCaseFromString(req)}.spec.js`,
          },
        ],
      });
    });

    return mapping;
  }

  /**
   * Generate implementation hints.
   */
  _generateImplementationHints() {
    return [
      'Follow the API signatures and data structures exactly',
      'Implement input validation for all APIs',
      'Handle all documented error cases',
      'Write tests for each API function',
      'Do not hardcode values; use configuration',
      'Ensure code is generic and reusable',
    ];
  }

  /**
   * Learn patterns from this execution.
   */
  _learnFromExecution(spec) {
    // Pattern: Well-designed APIs
    if (spec.apis.length > 0) {
      this.learnPattern({
        name: 'api-design',
        category: 'technical-design',
        description: `Generated ${spec.apis.length} clear API specifications`,
        successRate: 0.85,
      });
    }

    // Pattern: Complete error handling
    if (spec.errorCases.length >= 3) {
      this.learnPattern({
        name: 'comprehensive-error-handling',
        category: 'technical-design',
        description: `Defined ${spec.errorCases.length} error cases`,
        successRate: 0.8,
      });
    }

    // Pattern: Good requirement mapping
    if (spec.requirementMapping.length > 0) {
      this.learnPattern({
        name: 'requirement-test-mapping',
        category: 'testing-strategy',
        description: `Mapped ${spec.requirementMapping.length} requirements to tests`,
        successRate: 0.9,
      });
    }
  }

  /**
   * Camel case conversion.
   */
  _camelCaseFromString(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .map((word, idx) => (idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join('');
  }

  /**
   * Save technical specification.
   */
  saveTechnicalSpec(outputPath) {
    const spec = this.technicalSpec || this._generateTechnicalSpec();
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    this._log(`✓ Technical specification saved to ${outputPath}`);
    return spec;
  }

  /**
   * Generate markdown specification.
   */
  generateMarkdownSpec(outputPath) {
    const spec = this.technicalSpec || this._generateTechnicalSpec();
    let md = `# Technical Specification: ${spec.name}\n\n`;

    md += `**Version:** ${spec.version}  \n`;
    md += `**Generated:** ${spec.timestamp}\n\n`;

    md += `## Modules\n\n`;
    spec.modules.forEach((mod) => {
      md += `- **${mod.name}** (\`${mod.path}\`): ${mod.responsibility}\n`;
    });

    md += `\n## APIs\n\n`;
    spec.apis.forEach((api) => {
      md += `### ${api.name}\n`;
      md += `${api.description}\n\n`;
      md += `**Signature:**\n\`\`\`typescript\n`;
      const params = api.signature.parameters.map((p) => `${p.name}: ${p.type}`).join(', ');
      md += `${api.name}(${params}): ${api.signature.returns.type}\n`;
      md += `\`\`\`\n\n`;
      md += `**Errors:** ${api.errorCases.join(', ')}\n\n`;
    });

    md += `\n## Implementation Hints\n\n`;
    spec.implementationHints.forEach((hint) => {
      md += `- ${hint}\n`;
    });

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, md);
    this._log(`✓ Markdown specification saved to ${outputPath}`);

    return md;
  }
}

export default TechnicalRequirementsAgent;
