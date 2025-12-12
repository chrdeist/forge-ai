/**
 * RVD Manager (Requirement Versioning & Distribution)
 * 
 * Central utility for managing RVD files
 * - RVD = Requirement Versioning & Distribution file
 * - Single JSON file per requirement that tracks all agent outputs
 * - Each agent writes to its own section
 * - Enables dependency-based execution and data flow
 */

import fs from 'node:fs';
import path from 'node:path';

export class RVDManager {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
  }

  /**
   * Load existing RVD file or create new one
   */
  async loadOrCreate(rvdFilePath, projectName = 'unknown') {
    if (fs.existsSync(rvdFilePath)) {
      return this.load(rvdFilePath);
    }

    // Create new RVD structure
    return {
      version: '1.0',
      created: new Date().toISOString(),
      project: {
        name: projectName,
        path: path.dirname(rvdFilePath),
      },
      // Sections will be added by each agent
      functional: null,
      technical: null,
      architecture: null,
      testing: null,
      implementation: null,
      review: null,
      documentation: null,
      deployment: null,
      // Metadata
      agents: [],
      executionLog: [],
    };
  }

  /**
   * Load existing RVD file
   */
  async load(rvdFilePath) {
    if (!fs.existsSync(rvdFilePath)) {
      throw new Error(`RVD file not found: ${rvdFilePath}`);
    }

    const content = fs.readFileSync(rvdFilePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save RVD file
   */
  async save(rvdFilePath, rvdData) {
    // Ensure directory exists
    const dir = path.dirname(rvdFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(rvdFilePath, JSON.stringify(rvdData, null, 2), 'utf-8');
  }

  /**
   * Get section from RVD
   */
  getSection(rvdData, sectionName) {
    return rvdData[sectionName] || null;
  }

  /**
   * Set section in RVD
   */
  setSection(rvdData, sectionName, sectionData) {
    rvdData[sectionName] = sectionData;
    return rvdData;
  }

  /**
   * Log agent execution
   */
  logExecution(rvdData, agentName, status, message) {
    if (!rvdData.executionLog) {
      rvdData.executionLog = [];
    }

    rvdData.executionLog.push({
      timestamp: new Date().toISOString(),
      agent: agentName,
      status: status, // 'started', 'completed', 'failed'
      message: message,
    });

    return rvdData;
  }

  /**
   * Track agent in RVD
   */
  trackAgent(rvdData, agentName, config = {}) {
    if (!rvdData.agents) {
      rvdData.agents = [];
    }

    rvdData.agents.push({
      name: agentName,
      executed: new Date().toISOString(),
      config: config,
    });

    return rvdData;
  }

  /**
   * Generate summary of RVD status
   */
  getSummary(rvdData) {
    const sections = [
      'functional',
      'technical',
      'architecture',
      'testing',
      'implementation',
      'review',
      'documentation',
      'deployment',
    ];

    const summary = {
      project: rvdData.project?.name || 'unknown',
      created: rvdData.created,
      lastUpdated: rvdData.lastUpdated || null,
      sectionsCompleted: sections.filter((s) => rvdData[s] !== null).length,
      totalSections: sections.length,
      sections: {},
    };

    sections.forEach((section) => {
      summary.sections[section] = {
        completed: rvdData[section] !== null,
        timestamp: rvdData[section]?.timestamp || null,
        generatedBy: rvdData[section]?.generatedBy || null,
      };
    });

    summary.agents = rvdData.agents?.length || 0;
    summary.executionLog = rvdData.executionLog?.length || 0;

    return summary;
  }
}

export default RVDManager;
