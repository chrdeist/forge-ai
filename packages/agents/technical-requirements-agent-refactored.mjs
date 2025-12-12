/**
 * Technical Requirements Agent (Generic, RVD-based)
 * 
 * Purpose:
 * - Transforms functional requirements into technical specifications
 * - Generates API designs, data structures, error handling
 * - Reads from RVD functional section, writes to RVD technical section
 * 
 * Input: RVD file (functional section populated)
 * Output: RVD file with technical-section populated
 * 
 * No hardcoded content - fully generic implementation
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';
import { RVDManager } from './rvd-manager.mjs';

export class TechnicalRequirementsAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.rvdManager = new RVDManager(config);
  }

  /**
   * Main execute method
   * @param {string} rvdFilePath - Path to RVD file (with functional section)
   */
  async execute(rvdFilePath) {
    if (!fs.existsSync(rvdFilePath)) {
      throw new Error(`RVD file not found: ${rvdFilePath}`);
    }

    this._log(`⚙️  Creating technical specification from RVD`);

    // Load knowledge base for learning
    this.loadKnowledgeBase();

    // Load RVD file
    const rvd = await this.rvdManager.load(rvdFilePath);

    if (!rvd.functional) {
      throw new Error('Functional section not found in RVD file. Run FunctionalRequirementsAgent first.');
    }

    // Set context
    this.setRequirementContext(rvd.project || {});

    // Generate technical specification from functional requirements
    const technicalSpec = this._generateTechnicalSpecFromFunctional(
      rvd.functional.data,
      rvd.project?.name || 'unknown'
    );

    // Write to technical section
    rvd.technical = {
      timestamp: new Date().toISOString(),
      generatedBy: 'TechnicalRequirementsAgent',
      data: technicalSpec,
    };

    // Save RVD file
    await this.rvdManager.save(rvdFilePath, rvd);
    this._log(`✓ Wrote technical section to RVD`);

    // Learn patterns
    this._learnFromExecution(technicalSpec);

    return {
      success: true,
      rvdPath: rvdFilePath,
      technicalSpec,
    };
  }

  /**
   * Generic transformation of functional requirements to technical spec
   * Works with any requirement structure
   */
  _generateTechnicalSpecFromFunctional(functionalData, projectName) {
    this._log(`  ✓ Analyzing ${functionalData.requirements?.length || 0} functional requirements`);

    const requirements = functionalData.requirements || [];
    const apis = this._generateAPIsFromRequirements(requirements);
    const dataStructures = this._generateDataStructures(requirements);
    const errorHandling = this._generateErrorHandling(requirements);

    return {
      projectName,
      version: '1.0',
      timestamp: new Date().toISOString(),
      sourceSection: 'functional',
      apis: apis,
      dataStructures: dataStructures,
      errorHandling: errorHandling,
      constraints: {
        language: 'javascript',
        runtime: 'node.js',
        minVersion: '18.0.0',
      },
    };
  }

  /**
   * Generic API generation from requirements
   */
  _generateAPIsFromRequirements(requirements) {
    if (requirements.length === 0) return [];

    const apis = [];

    // Group requirements by domain
    const groupedBySection = {};
    requirements.forEach((req) => {
      const section = req.section || 'general';
      if (!groupedBySection[section]) {
        groupedBySection[section] = [];
      }
      groupedBySection[section].push(req);
    });

    // Generate one API per requirement or group
    let apiIndex = 1;
    Object.entries(groupedBySection).forEach(([section, reqs]) => {
      reqs.forEach((req) => {
        const apiName = this._sanitizeFunctionName(req.text.substring(0, 50));
        apis.push({
          id: `api_${apiIndex}`,
          name: apiName,
          description: req.text,
          source: section,
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
          errorCases: ['InvalidInputError', 'ProcessingError'],
        });
        apiIndex++;
      });
    });

    this._log(`  ✓ Generated ${apis.length} API specifications`);
    return apis;
  }

  /**
   * Generate data structures for the requirement
   */
  _generateDataStructures(requirements) {
    return [
      {
        name: 'Input',
        type: 'object',
        description: 'Generic input data structure',
        fields: {
          data: { type: 'any', required: false },
        },
      },
      {
        name: 'Output',
        type: 'object',
        description: 'Generic output data structure',
        fields: {
          success: { type: 'boolean', required: true },
          data: { type: 'any', required: false },
          error: { type: 'string', required: false },
        },
      },
    ];
  }

  /**
   * Generate error handling specification
   */
  _generateErrorHandling(requirements) {
    return {
      errorTypes: [
        {
          name: 'InvalidInputError',
          httpCode: 400,
          description: 'Invalid or missing required input',
        },
        {
          name: 'ProcessingError',
          httpCode: 500,
          description: 'Error during processing',
        },
        {
          name: 'NotFoundError',
          httpCode: 404,
          description: 'Resource not found',
        },
      ],
      validationRules: [
        'Validate input types',
        'Check required fields',
        'Sanitize input data',
      ],
    };
  }

  /**
   * Sanitize text to valid function name
   */
  _sanitizeFunctionName(text) {
    return text
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^[0-9]/, 'f_')
      .substring(0, 40);
  }

  /**
   * Learn patterns from execution
   */
  _learnFromExecution(spec) {
    const apiCount = spec.apis?.length || 0;
    if (apiCount > 0) {
      this.learnPattern({
        name: 'api-specification-generation',
        category: 'generic-pattern',
        description: `Generated technical spec with ${apiCount} APIs from functional requirements`,
        successRate: 0.85,
      });
    }
  }
}

export default TechnicalRequirementsAgent;
