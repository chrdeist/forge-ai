/**
 * Architecture Agent (Generic, RVD-based)
 * 
 * Purpose:
 * - Generates architecture diagrams from technical specifications
 * - Creates PlantUML component, deployment, and sequence diagrams
 * - Reads from RVD technical section, writes to RVD architecture section
 * 
 * Input: RVD file (technical section populated)
 * Output: RVD file with architecture-section populated (PlantUML diagrams)
 * 
 * No hardcoded content - fully generic implementation
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';
import { RVDManager } from './rvd-manager.mjs';

export class ArchitectureAgent extends BaseAgent {
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

    this._log(`🏗️  Generating architecture diagrams from RVD`);

    // Load knowledge base for learning
    this.loadKnowledgeBase();

    // Load RVD file
    const rvd = await this.rvdManager.load(rvdFilePath);

    if (!rvd.technical) {
      throw new Error('Technical section not found in RVD file. Run TechnicalRequirementsAgent first.');
    }

    // Set context
    this.setRequirementContext(rvd.project || {});

    // Generate architecture diagrams from technical specifications
    const architectureDiagrams = this._generateArchitectureDiagrams(
      rvd.technical.data,
      rvd.project?.name || 'unknown'
    );

    // Write to architecture section
    rvd.architecture = {
      timestamp: new Date().toISOString(),
      generatedBy: 'ArchitectureAgent',
      data: architectureDiagrams,
    };

    // Save RVD file
    await this.rvdManager.save(rvdFilePath, rvd);
    this._log(`✓ Wrote architecture section to RVD`);

    // Learn patterns
    this._learnFromExecution(architectureDiagrams);

    return {
      success: true,
      rvdPath: rvdFilePath,
      architectureDiagrams,
    };
  }

  /**
   * Generate architecture diagrams from technical specification
   * Creates component, deployment, and sequence diagrams
   */
  _generateArchitectureDiagrams(technicalData, projectName) {
    this._log(`  ✓ Generating architecture diagrams for ${projectName}`);

    const componentDiagram = this._generateComponentDiagram(technicalData);
    const deploymentDiagram = this._generateDeploymentDiagram(technicalData);
    const sequenceDiagrams = this._generateSequenceDiagrams(technicalData);

    return {
      projectName,
      version: '1.0',
      timestamp: new Date().toISOString(),
      sourceSection: 'technical',
      component: componentDiagram,
      deployment: deploymentDiagram,
      sequences: sequenceDiagrams,
    };
  }

  /**
   * Generate PlantUML component diagram
   * Shows API endpoints, data structures, and their relationships
   */
  _generateComponentDiagram(technicalData) {
    const apis = technicalData.apis || [];
    const dataStructures = technicalData.dataStructures || [];

    let diagram = '@startuml Component Diagram\n';
    diagram += '!theme plain\n\n';

    // Add title
    diagram += `title Component Diagram - ${technicalData.projectName}\n\n`;

    // Create package for APIs
    if (apis.length > 0) {
      diagram += 'package "API Endpoints" {\n';
      apis.forEach((api, index) => {
        const componentName = `API_${index + 1}`;
        diagram += `  component [${api.method}\\n${api.path}] as ${componentName}\n`;
      });
      diagram += '}\n\n';
    }

    // Create package for data structures
    if (dataStructures.length > 0) {
      diagram += 'package "Data Models" {\n';
      dataStructures.forEach((ds, index) => {
        const componentName = `DATA_${index + 1}`;
        diagram += `  database [${ds.name}] as ${componentName}\n`;
      });
      diagram += '}\n\n';
    }

    // Add generic relationships between APIs and data
    if (apis.length > 0 && dataStructures.length > 0) {
      diagram += '-- Relationships --\n';
      apis.slice(0, Math.min(3, apis.length)).forEach((api, idx) => {
        const dataIdx = idx % dataStructures.length;
        diagram += `API_${idx + 1} --> DATA_${dataIdx + 1}\n`;
      });
    }

    diagram += '\n@enduml\n';

    return {
      type: 'component',
      format: 'plantuml',
      description: `Component diagram showing ${apis.length} API endpoints and ${dataStructures.length} data models`,
      content: diagram,
    };
  }

  /**
   * Generate PlantUML deployment diagram
   * Shows logical components and their deployment structure
   */
  _generateDeploymentDiagram(technicalData) {
    let diagram = '@startuml Deployment Diagram\n';
    diagram += '!theme plain\n\n';

    // Add title
    diagram += `title Deployment Architecture - ${technicalData.projectName}\n\n`;

    // Client tier
    diagram += 'node "Client" as client {\n';
    diagram += '  artifact "Web Browser" as browser\n';
    diagram += '}\n\n';

    // Application tier
    diagram += 'node "Application Server" as appServer {\n';
    diagram += '  component "API Gateway" as apiGateway\n';
    diagram += '  component "Business Logic" as logic\n';
    diagram += '}\n\n';

    // Data tier
    diagram += 'node "Data Layer" as dataLayer {\n';
    diagram += '  database "Primary Database" as db\n';
    diagram += '  artifact "Cache Storage" as cache\n';
    diagram += '}\n\n';

    // Connections
    diagram += 'client --> appServer\n';
    diagram += 'appServer --> dataLayer\n';
    diagram += 'apiGateway --> logic\n';
    diagram += 'logic --> db\n';
    diagram += 'logic --> cache\n';

    diagram += '\n@enduml\n';

    return {
      type: 'deployment',
      format: 'plantuml',
      description: 'Deployment diagram showing logical tiers: client, application, data',
      content: diagram,
    };
  }

  /**
   * Generate PlantUML sequence diagrams
   * Shows typical interaction flows
   */
  _generateSequenceDiagrams(technicalData) {
    const apis = technicalData.apis || [];
    const sequences = [];

    // Create a generic request-response sequence
    let diagram = '@startuml Request-Response Sequence\n';
    diagram += '!theme plain\n\n';
    diagram += 'title Typical API Request-Response Flow\n\n';

    diagram += 'participant "Client" as client\n';
    diagram += 'participant "API Server" as server\n';
    diagram += 'participant "Database" as db\n\n';

    diagram += 'client ->> server: HTTP Request\n';
    diagram += 'activate server\n';
    diagram += 'server ->> db: Query Data\n';
    diagram += 'activate db\n';
    diagram += 'db -->> server: Return Data\n';
    diagram += 'deactivate db\n';
    diagram += 'server -->> client: HTTP Response\n';
    diagram += 'deactivate server\n';

    diagram += '\n@enduml\n';

    sequences.push({
      type: 'sequence',
      name: 'Request-Response Flow',
      format: 'plantuml',
      description: 'Generic request-response interaction pattern',
      content: diagram,
    });

    // Create error handling sequence if there are error specs
    const errorHandling = technicalData.errorHandling || {};
    if (Object.keys(errorHandling).length > 0) {
      let errorDiagram = '@startuml Error Handling Sequence\n';
      errorDiagram += '!theme plain\n\n';
      errorDiagram += 'title Error Handling Flow\n\n';

      errorDiagram += 'participant "Client" as client\n';
      errorDiagram += 'participant "API Server" as server\n';
      errorDiagram += 'participant "Error Handler" as handler\n\n';

      errorDiagram += 'client ->> server: Invalid Request\n';
      errorDiagram += 'activate server\n';
      errorDiagram += 'server ->> handler: Log Error\n';
      errorDiagram += 'activate handler\n';
      errorDiagram += 'handler -->> server: Error Recorded\n';
      errorDiagram += 'deactivate handler\n';
      errorDiagram += 'server -->> client: Error Response\n';
      errorDiagram += 'deactivate server\n';

      errorDiagram += '\n@enduml\n';

      sequences.push({
        type: 'sequence',
        name: 'Error Handling Flow',
        format: 'plantuml',
        description: 'Error detection and handling pattern',
        content: errorDiagram,
      });
    }

    return sequences;
  }

  /**
   * Learn patterns from execution
   */
  _learnFromExecution(diagrams) {
    const seqCount = diagrams?.sequences?.length || 0;
    this.learnPattern({
      name: 'architecture-diagram-generation',
      category: 'generic-pattern',
      description: `Generated component, deployment and ${seqCount} sequence diagrams`,
      successRate: 0.8,
    });
  }
}

export default ArchitectureAgent;
