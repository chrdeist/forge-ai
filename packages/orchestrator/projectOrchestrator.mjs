#!/usr/bin/env node

/**
 * ProjectOrchestrator - Base class for project-specific workflow execution
 * 
 * This is a generic orchestrator that can be reused for any project.
 * It accepts a projectName parameter and automatically configures paths.
 * 
 * Usage:
 *   const orchestrator = new ProjectOrchestrator({
 *     projectName: 'hello-world',
 *     interactive: false,
 *     logLevel: 'DEBUG'
 *   });
 *   await orchestrator.execute();
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExecutionLogger from './executionLogger.mjs';
import WorkflowStateTracker from './workflowStateTracker.mjs';
import DetailedExecutionReport from './detailedExecutionReport.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class ProjectOrchestrator {
  constructor(options = {}) {
    // Validate required parameters
    if (!options.projectName) {
      throw new Error('ProjectOrchestrator requires projectName parameter');
    }

    this.projectName = options.projectName;
    this.interactive = options.interactive !== false;
    this.logLevel = options.logLevel || 'DEBUG';
    
    // Calculate project root based on projectName
    this.projectRoot = path.join(
      __dirname,
      '../../projects',
      this.projectName
    );

    // Validate project exists
    if (!fs.existsSync(this.projectRoot)) {
      throw new Error(
        `Project directory not found: ${this.projectRoot}\n` +
        `Available projects: ${this.getAvailableProjects().join(', ')}`
      );
    }

    // Set up file paths based on project structure
    this.requirementFile = path.join(
      this.projectRoot,
      'requirements',
      `${this.projectName}-requirements.md`
    );

    // Main source directory (where generated code goes)
    this.sourcesDir = path.join(this.projectRoot, 'sources');

    // Initialize logging systems
    this.logger = new ExecutionLogger({
      logLevel: this.logLevel,
      outputDir: path.join(this.projectRoot, 'reports'),
      requirementName: this.projectName,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.tracker = new WorkflowStateTracker({
      outputDir: path.join(this.projectRoot, 'reports'),
      requirementName: this.projectName,
      timestamp,
    });

    this.timestamp = timestamp;
    this.reportGenerator = new DetailedExecutionReport({
      projectName: this.projectName,
      timestamp,
      outputDir: path.join(this.projectRoot, 'reports'),
    });

    this.logger.info('ProjectOrchestrator initialized', {
      projectName: this.projectName,
      projectRoot: this.projectRoot,
      requirementFile: this.requirementFile,
      interactive: this.interactive,
    });
  }

  /**
   * Get list of available projects
   */
  getAvailableProjects() {
    const projectsDir = path.join(__dirname, '../../projects');
    if (!fs.existsSync(projectsDir)) {
      return [];
    }
    
    return fs.readdirSync(projectsDir)
      .filter(name => {
        const fullPath = path.join(projectsDir, name);
        return fs.statSync(fullPath).isDirectory();
      })
      .sort();
  }

  /**
   * Validate that requirement file exists
   */
  validateRequirementFile() {
    if (!fs.existsSync(this.requirementFile)) {
      throw new Error(
        `Requirement file not found: ${this.requirementFile}\n` +
        `Expected structure: ${this.projectName}/requirements/${this.projectName}-requirements.md`
      );
    }
    this.logger.debug('Requirement file validated', {
      file: this.requirementFile,
    });
  }

  /**
   * Read and return requirement file content
   */
  readRequirement() {
    this.validateRequirementFile();
    const content = fs.readFileSync(this.requirementFile, 'utf-8');
    this.logger.debug('Requirement file loaded', {
      size: content.length,
      lines: content.split('\n').length,
    });
    return content;
  }

  /**
   * Get absolute path for project subdirectory
   */
  getProjectPath(subdir) {
    return path.join(this.projectRoot, subdir);
  }

  /**
   * Get project configuration
   */
  getProjectConfig() {
    return {
      projectName: this.projectName,
      projectRoot: this.projectRoot,
      requirementFile: this.requirementFile,
      paths: {
        requirements: this.getProjectPath('requirements'),
        sources: this.getProjectPath('sources'),
        testResults: this.getProjectPath('test-results'),
        docs: this.getProjectPath('docs'),
        reports: this.getProjectPath('reports'),
        deployment: this.getProjectPath('deployment'),
      },
      logging: {
        logger: this.logger,
        tracker: this.tracker,
        reportGenerator: this.reportGenerator,
      },
    };
  }

  /**
   * Create output directories if they don't exist
   */
  ensureOutputDirectories() {
    const dirs = [
      this.getProjectPath('sources'),
      this.getProjectPath('test-results'),
      this.getProjectPath('docs'),
      this.getProjectPath('reports'),
      this.getProjectPath('deployment'),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.debug('Created output directory', { dir });
      }
    }
  }

  /**
   * Display project information
   */
  displayProjectInfo() {
    console.log('\n' + '='.repeat(70));
    console.log(`Project: ${this.projectName}`);
    console.log(`Root: ${this.projectRoot}`);
    console.log(`Mode: ${this.interactive ? 'INTERACTIVE' : 'AUTOMATIC'}`);
    console.log(`Log Level: ${this.logLevel}`);
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Get timestamp for this execution
   */
  getTimestamp() {
    return this.timestamp;
  }
}
