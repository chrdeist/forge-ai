/**
 * Technical Requirements Agent
 * Transformiert die funktionalen Anforderungen in detaillierte technische Spezifikationen:
 * - Module / Komponenten
 * - APIs (Signaturen, Input/Output, Fehlerfälle)
 * - Datenstrukturen / DTOs
 * - Invarianten / Constraints
 * - Mapping zwischen Anforderungen und Tests
 * 
 * Output: JSON-Datei mit technischen Spezifikationen (maschinenlesbar für Implementation Agent).
 */

import fs from 'node:fs';
import path from 'node:path';

export class TechnicalRequirementsAgent {
  constructor(functionalSummaryPath) {
    this.functionalSummaryPath = functionalSummaryPath;
    this.functionalRequirements = null;
    this.technicalSpec = null;
  }

  /**
   * Lädt die funktionale Zusammenfassung.
   */
  loadFunctionalSummary() {
    if (!fs.existsSync(this.functionalSummaryPath)) {
      throw new Error(`Functional summary not found: ${this.functionalSummaryPath}`);
    }

    const content = fs.readFileSync(this.functionalSummaryPath, 'utf-8');
    this.functionalRequirements = JSON.parse(content);
    return this.functionalRequirements;
  }

  /**
   * Generiert technische Spezifikationen aus funktionalen Anforderungen.
   * Nutzt Heuristiken und Templates für API-Signaturen, DTOs, etc.
   */
  generateTechnicalSpec() {
    if (!this.functionalRequirements) {
      this.loadFunctionalSummary();
    }

    const spec = {
      name: this.functionalRequirements.name,
      version: this.functionalRequirements.version,
      timestamp: new Date().toISOString(),
      
      // Module und Komponenten (abgeleitet aus functionalRequirements)
      modules: this._deriveModules(),
      
      // APIs / Funktionssignaturen
      apis: this._deriveAPIs(),
      
      // Datenstrukturen / DTOs
      dataStructures: this._deriveDataStructures(),
      
      // Constraints und Invarianten
      constraints: this._deriveConstraints(),
      
      // Error Handling
      errorCases: this._deriveErrorCases(),
      
      // Mapping: Requirement → Technical Spec → Tests
      requirementMapping: this._mapRequirementsToTests(),
      
      // Implementierungshinweise
      implementationHints: this._generateImplementationHints(),
    };

    this.technicalSpec = spec;
    return spec;
  }

  /**
   * Leitet Module/Komponenten ab (einfache Heuristik: nach Schlüsselwörtern).
   */
  _deriveModules() {
    const modules = [];
    const keywords = ['Frontend', 'Backend', 'API', 'Database', 'Service'];

    // Basis: aus den Affected Components
    const components = this.functionalRequirements.affectedComponents || [];
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
   * Leitet APIs (Funktionssignaturen) ab.
   * Analysiert functionalRequirements und erzeugt Vorlagen.
   */
  _deriveAPIs() {
    const apis = [];
    const funcReqs = this.functionalRequirements.functionalRequirements || [];

    // Heuristik: Jede funktionale Anforderung könnte eine Funktion sein.
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
              description: 'Input parameters for this function',
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
        examples: {
          validInput: { /* TODO: fill based on acceptance criteria */ },
          expectedOutput: { /* TODO: fill based on acceptance criteria */ },
        },
      });
    });

    return apis;
  }

  /**
   * Leitet Datenstrukturen ab.
   */
  _deriveDataStructures() {
    const dtos = [];

    // Standard DTOs für Input/Output
    dtos.push({
      name: 'RequestPayload',
      description: 'Standard request input',
      fields: [
        { name: 'id', type: 'string', required: false },
        { name: 'data', type: 'object', required: true },
        { name: 'metadata', type: 'object', required: false },
      ],
    });

    dtos.push({
      name: 'ResponsePayload',
      description: 'Standard response output',
      fields: [
        { name: 'success', type: 'boolean', required: true },
        { name: 'data', type: 'object', required: false },
        { name: 'errors', type: 'string[]', required: false },
      ],
    });

    return dtos;
  }

  /**
   * Leitet Constraints/Invarianten ab.
   */
  _deriveConstraints() {
    const constraints = [];

    const nfReqs = this.functionalRequirements.nonFunctionalRequirements || '';
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
   * Leitet Fehlerfälle ab.
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
      {
        name: 'UnauthorizedError',
        description: 'User is not authorized',
        statusCode: 401,
      },
    ];
  }

  /**
   * Erstellt ein Mapping: Requirement → Technical Spec → Tests
   * Hilft dem TestAgent und Implementation Agent, zusammenhängend zu arbeiten.
   */
  _mapRequirementsToTests() {
    const mapping = [];
    const funcReqs = this.functionalRequirements.functionalRequirements || [];
    const acceptanceCriteria = this.functionalRequirements.acceptanceCriteria || [];

    funcReqs.forEach((req, idx) => {
      const matchingACs = acceptanceCriteria.filter(
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
   * Generiert Implementierungshinweise.
   */
  _generateImplementationHints() {
    return [
      'Follow the API signatures and data structures exactly',
      'Implement input validation for all APIs',
      'Handle all documented error cases',
      'Write tests for each API function',
      'Do not hardcode values; use configuration/parameters',
      'Ensure code is generic and reusable',
    ];
  }

  /**
   * Konvertiert einen String in camelCase.
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
   * Speichert die technische Spezifikation als JSON.
   */
  saveTechnicalSpec(outputPath) {
    const spec = this.generateTechnicalSpec();
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    console.log(`✓ Technical specification saved to ${outputPath}`);
    return spec;
  }

  /**
   * Generiert eine lesbare Dokumentation aus der technischen Spezifikation.
   */
  generateMarkdownSpec(outputPath) {
    const spec = this.technicalSpec || this.generateTechnicalSpec();
    let markdown = `# Technical Specification: ${spec.name}\n\n`;

    markdown += `**Version:** ${spec.version}  \n`;
    markdown += `**Generated:** ${spec.timestamp}\n\n`;

    markdown += `## Modules\n\n`;
    spec.modules.forEach((mod) => {
      markdown += `- **${mod.name}** (${mod.path}): ${mod.responsibility}\n`;
    });

    markdown += `\n## APIs\n\n`;
    spec.apis.forEach((api) => {
      markdown += `### ${api.name}\n`;
      markdown += `${api.description}\n\n`;
      markdown += `**Signature:**\n\`\`\`typescript\n`;
      markdown += `${api.name}(${api.signature.parameters.map((p) => `${p.name}: ${p.type}`).join(', ')}): ${api.signature.returns.type}\n`;
      markdown += `\`\`\`\n\n`;
      markdown += `**Errors:** ${api.errorCases.join(', ')}\n\n`;
    });

    markdown += `\n## Data Structures\n\n`;
    spec.dataStructures.forEach((dto) => {
      markdown += `### ${dto.name}\n`;
      markdown += `${dto.description}\n\n`;
      markdown += `| Field | Type | Required |\n`;
      markdown += `|-------|------|----------|\n`;
      dto.fields.forEach((field) => {
        markdown += `| ${field.name} | ${field.type} | ${field.required ? 'Yes' : 'No'} |\n`;
      });
      markdown += `\n`;
    });

    markdown += `\n## Implementation Hints\n\n`;
    spec.implementationHints.forEach((hint) => {
      markdown += `- ${hint}\n`;
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdown);
    console.log(`✓ Markdown specification saved to ${outputPath}`);

    return markdown;
  }
}

export default TechnicalRequirementsAgent;
