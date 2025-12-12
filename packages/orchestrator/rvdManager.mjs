/**
 * RVDManager - Requirement Verarbeitungs Datei Manager
 * 
 * Zentrale Verwaltung der Datenstrukturen für den Datenaustausch zwischen Agenten.
 * Jedes Requirement hat eine zentrale RVD (JSON), in die alle Agenten schreiben.
 * 
 * Architektur:
 * - Phase 1-9 Output → RVD
 * - Phase N+1 Input ← RVD (Output von Phase N)
 * - Keine separaten Dateien pro Agent
 * - Ein Workflow-State für das gesamte Projekt
 */

import fs from 'node:fs';
import path from 'node:path';

export class RVDManager {
  /**
   * Erstelle eine neue RVD für ein Requirement
   */
  static createRVD(requirementId, projectDir = null) {
    return {
      metadata: {
        requirementId,
        version: '1.0',
        createdAt: new Date().toISOString(),
        projectDir: projectDir || process.cwd(),
        orchestrator: 'SoftwareLifecycleOrchestrator',
        status: 'in-progress',
      },
      
      phases: {
        '1-parse-requirements': {
          status: 'pending',
          timestamp: null,
          agent: 'Orchestrator',
          input: null,
          output: null,
          errors: [],
        },
        
        '2-functional-requirements': {
          status: 'pending',
          timestamp: null,
          agent: 'FunctionalRequirementsAgent',
          input: '1-parse-requirements', // Referenz zur Vorgänger-Phase
          output: null,
          errors: [],
        },
        
        '3-technical-specification': {
          status: 'pending',
          timestamp: null,
          agent: 'TechnicalRequirementsAgent',
          input: '2-functional-requirements',
          output: null,
          errors: [],
        },
        
        '4-architecture-design': {
          status: 'pending',
          timestamp: null,
          agent: 'ArchitectureAgent',
          input: '3-technical-specification',
          output: null,
          errors: [],
        },
        
        '5-test-generation': {
          status: 'pending',
          timestamp: null,
          agent: 'TestAgent',
          input: '3-technical-specification', // Inputs können mehrere Phasen referenzieren
          output: null,
          errors: [],
        },
        
        '6-implementation': {
          status: 'pending',
          timestamp: null,
          agent: 'ImplementationAgent',
          input: ['3-technical-specification', '5-test-generation'],
          output: null,
          errors: [],
        },
        
        '7-code-review': {
          status: 'pending',
          timestamp: null,
          agent: 'ReviewAgent',
          input: '6-implementation',
          output: null,
          errors: [],
        },
        
        '8-documentation': {
          status: 'pending',
          timestamp: null,
          agent: 'DocumentationAgent',
          input: ['3-technical-specification', '6-implementation'],
          output: null,
          errors: [],
        },
        
        '9-deployment': {
          status: 'pending',
          timestamp: null,
          agent: 'DeploymentAgent',
          input: ['6-implementation', '8-documentation'],
          output: null,
          errors: [],
        },
      },
      
      patterns: [],
      knowledge: {
        learnedPatterns: [],
        strategies: [],
        successRates: {},
      },
      
      metrics: {
        totalPhases: 9,
        completedPhases: 0,
        failedPhases: 0,
        totalDuration: 0,
        startTime: null,
        endTime: null,
      },
    };
  }

  /**
   * Lade RVD aus einer Datei
   */
  static loadRVD(rvdPath) {
    if (!fs.existsSync(rvdPath)) {
      throw new Error(`RVD file not found: ${rvdPath}`);
    }
    try {
      return JSON.parse(fs.readFileSync(rvdPath, 'utf-8'));
    } catch (error) {
      throw new Error(`Failed to parse RVD file ${rvdPath}: ${error.message}`);
    }
  }

  /**
   * Speichere RVD in eine Datei
   */
  static saveRVD(rvdPath, rvd) {
    const dir = path.dirname(rvdPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(rvdPath, JSON.stringify(rvd, null, 2));
  }

  /**
   * Hole den Output einer spezifischen Phase
   */
  static getPhaseOutput(rvd, phaseName) {
    if (!rvd.phases[phaseName]) {
      throw new Error(`Phase not found in RVD: ${phaseName}`);
    }
    const phase = rvd.phases[phaseName];
    if (phase.status !== 'completed') {
      throw new Error(`Phase ${phaseName} is not completed yet (status: ${phase.status})`);
    }
    return phase.output;
  }

  /**
   * Hole die Input-Daten für eine Phase
   */
  static getPhaseInput(rvd, phaseName) {
    const phase = rvd.phases[phaseName];
    if (!phase) {
      throw new Error(`Phase not found in RVD: ${phaseName}`);
    }

    const inputRef = phase.input;
    
    // Input kann eine einzelne Phase oder ein Array von Phasen sein
    if (Array.isArray(inputRef)) {
      return inputRef.map(ref => this.getPhaseOutput(rvd, ref));
    } else if (typeof inputRef === 'string') {
      return this.getPhaseOutput(rvd, inputRef);
    } else if (inputRef === null) {
      return null; // Erste Phase hat keinen Input
    }

    throw new Error(`Invalid input reference for phase ${phaseName}`);
  }

  /**
   * Aktualisiere eine Phase mit Output
   */
  static updatePhase(rvd, phaseName, agentOutput, agentName = null) {
    if (!rvd.phases[phaseName]) {
      throw new Error(`Phase not found in RVD: ${phaseName}`);
    }

    const now = new Date().toISOString();
    rvd.phases[phaseName] = {
      ...rvd.phases[phaseName],
      status: 'completed',
      timestamp: now,
      agent: agentName || rvd.phases[phaseName].agent,
      output: agentOutput,
      errors: [],
    };

    // Update metrics
    rvd.metrics.completedPhases += 1;
    if (!rvd.metrics.startTime) {
      rvd.metrics.startTime = now;
    }
    rvd.metrics.endTime = now;

    return rvd;
  }

  /**
   * Markiere eine Phase als fehlgeschlagen
   */
  static markPhaseError(rvd, phaseName, error, agentName = null) {
    if (!rvd.phases[phaseName]) {
      throw new Error(`Phase not found in RVD: ${phaseName}`);
    }

    rvd.phases[phaseName] = {
      ...rvd.phases[phaseName],
      status: 'failed',
      timestamp: new Date().toISOString(),
      agent: agentName || rvd.phases[phaseName].agent,
      errors: [
        ...(rvd.phases[phaseName].errors || []),
        {
          timestamp: new Date().toISOString(),
          message: error.message || error,
          stack: error.stack,
        },
      ],
    };

    rvd.metrics.failedPhases += 1;
    rvd.metadata.status = 'failed';

    return rvd;
  }

  /**
   * Lerne ein Pattern und speichere es in der RVD
   */
  static learnPattern(rvd, pattern) {
    rvd.patterns.push({
      ...pattern,
      learnedAt: new Date().toISOString(),
    });

    rvd.knowledge.learnedPatterns.push(pattern.name);

    return rvd;
  }

  /**
   * Hole alle gelernten Patterns
   */
  static getPatterns(rvd) {
    return rvd.patterns || [];
  }

  /**
   * Erhalte einen Workflow-Summary
   */
  static getSummary(rvd) {
    const phases = rvd.phases;
    const completed = Object.entries(phases)
      .filter(([_, p]) => p.status === 'completed')
      .map(([name, _]) => name);

    const failed = Object.entries(phases)
      .filter(([_, p]) => p.status === 'failed')
      .map(([name, _]) => name);

    const pending = Object.entries(phases)
      .filter(([_, p]) => p.status === 'pending')
      .map(([name, _]) => name);

    return {
      requirementId: rvd.metadata.requirementId,
      status: rvd.metadata.status,
      completed: completed.length,
      failed: failed.length,
      pending: pending.length,
      total: Object.keys(phases).length,
      completedPhases: completed,
      failedPhases: failed,
      pendingPhases: pending,
      duration: rvd.metrics.totalDuration,
      startTime: rvd.metrics.startTime,
      endTime: rvd.metrics.endTime,
    };
  }

  /**
   * Validiere die RVD-Struktur
   */
  static validate(rvd) {
    const errors = [];

    if (!rvd.metadata || !rvd.metadata.requirementId) {
      errors.push('Missing metadata.requirementId');
    }

    if (!rvd.phases || typeof rvd.phases !== 'object') {
      errors.push('Missing or invalid phases');
    }

    if (!rvd.metrics || typeof rvd.metrics !== 'object') {
      errors.push('Missing or invalid metrics');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Exportiere RVD als Markdown Report
   */
  static exportAsMarkdown(rvd) {
    let markdown = `# Requirement Verarbeitungs Report\n\n`;
    markdown += `**Requirement ID:** ${rvd.metadata.requirementId}\n`;
    markdown += `**Status:** ${rvd.metadata.status}\n`;
    markdown += `**Created:** ${rvd.metadata.createdAt}\n\n`;

    markdown += `## Phases\n\n`;

    Object.entries(rvd.phases).forEach(([phaseName, phase]) => {
      markdown += `### ${phaseName}\n`;
      markdown += `- **Status:** ${phase.status}\n`;
      markdown += `- **Agent:** ${phase.agent}\n`;
      if (phase.timestamp) markdown += `- **Timestamp:** ${phase.timestamp}\n`;
      if (phase.errors.length > 0) {
        markdown += `- **Errors:**\n`;
        phase.errors.forEach(err => {
          markdown += `  - ${err.message}\n`;
        });
      }
      markdown += `\n`;
    });

    markdown += `## Metrics\n\n`;
    markdown += `- **Total Phases:** ${rvd.metrics.totalPhases}\n`;
    markdown += `- **Completed:** ${rvd.metrics.completedPhases}\n`;
    markdown += `- **Failed:** ${rvd.metrics.failedPhases}\n`;
    markdown += `- **Start Time:** ${rvd.metrics.startTime}\n`;
    markdown += `- **End Time:** ${rvd.metrics.endTime}\n`;

    if (rvd.patterns.length > 0) {
      markdown += `\n## Learned Patterns\n\n`;
      rvd.patterns.forEach(p => {
        markdown += `- **${p.name}** (${p.category}): ${p.description}\n`;
      });
    }

    return markdown;
  }
}

export default RVDManager;
