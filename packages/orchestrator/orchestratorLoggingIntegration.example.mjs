/**
 * Orchestrator Logging Integration Guide
 * 
 * This file shows how to integrate ExecutionLogger, WorkflowStateTracker,
 * and DetailedExecutionReport into the SoftwareLifecycleOrchestrator
 */

import ExecutionLogger from './executionLogger.mjs';
import WorkflowStateTracker from './workflowStateTracker.mjs';
import DetailedExecutionReport from './detailedExecutionReport.mjs';

// Example integration pattern:

export class OrchestratorWithLogging {
  constructor(config = {}) {
    this.config = config;
    
    // Initialize logging
    this.logger = new ExecutionLogger({
      logLevel: config.logLevel || 'DEBUG',
      outputDir: config.outputDir || './forge-ai-work',
      requirementName: config.requirementName || 'unknown',
    });

    // Initialize state tracking
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.tracker = new WorkflowStateTracker({
      outputDir: config.outputDir || './forge-ai-work',
      requirementName: config.requirementName || 'unknown',
      timestamp,
    });

    this.agentOutputs = {};
  }

  async executePhase(phaseNumber, phaseName, agentClass, input) {
    try {
      // Start logging phase
      this.logger.phaseStart(phaseNumber, phaseName);
      this.tracker.setCurrentPhase(phaseNumber, phaseName, agentClass.name);

      this.logger.debug(`Initializing ${agentClass.name}`, {
        inputKeys: Object.keys(input || {}),
      });

      // Create and configure agent
      const agent = new agentClass();
      agent.setRequirementContext(input);

      // Log agent start
      this.logger.agentStart(agentClass.name, input);
      this.tracker.setCurrentAgent(agentClass.name);

      const startTime = Date.now();

      // Execute agent
      this.logger.debug(`${agentClass.name} executing`, {
        phase: phaseNumber,
      });

      const output = await agent.execute(input);

      const duration = Date.now() - startTime;

      // Log agent complete
      this.logger.agentComplete(agentClass.name, output, duration);
      this.tracker.completeAgent(agentClass.name, output);

      // Store output for report
      this.agentOutputs[`phase${phaseNumber}`] = output;

      // Log phase complete
      this.logger.phaseComplete(phaseNumber, phaseName, {
        duration: `${duration}ms`,
        outputKeys: Object.keys(output),
      });

      this.tracker.completePhase(phaseNumber, phaseName, {
        duration: `${(duration / 1000).toFixed(2)}s`,
        itemsProcessed: Array.isArray(output) ? output.length : 1,
      });

      return output;

    } catch (error) {
      this.logger.error(`Phase ${phaseNumber} failed: ${error.message}`, {
        phase: phaseNumber,
        phaseName,
        agent: agentClass.name,
        stack: error.stack,
      });

      this.tracker.addError(agentClass.name, error.message, error.stack);

      throw error;
    }
  }

  async executeWorkflow(requirementFile) {
    this.logger.info('🚀 Starting Forge AI workflow', {
      requirementFile,
      logLevel: this.logger.logLevel,
    });

    const startTime = Date.now();

    try {
      // Phase 1: Parse Requirement
      this.logger.phaseStart(1, 'Parse Requirement');
      this.tracker.setCurrentPhase(1, 'Parse Requirement');
      
      const requirement = this._parseRequirement(requirementFile);
      
      this.logger.phaseComplete(1, 'Parse Requirement');
      this.tracker.completePhase(1, 'Parse Requirement');

      // Phase 2: Functional Requirements (example)
      const functionalOutput = await this.executePhase(
        2,
        'Extract Functional Requirements',
        FunctionalRequirementsAgent,
        requirement
      );

      // Phase 3: Technical Requirements (example)
      const technicalOutput = await this.executePhase(
        3,
        'Generate Technical Specification',
        TechnicalRequirementsAgent,
        { ...requirement, ...functionalOutput }
      );

      // ... continue for remaining phases ...

      // Mark complete
      this.tracker.markComplete('COMPLETED');
      const duration = Date.now() - startTime;

      this.logger.info('✓ Workflow completed successfully', {
        duration: `${(duration / 1000).toFixed(2)}s`,
        status: 'COMPLETED',
      });

      // Generate execution report
      return this._generateReport();

    } catch (error) {
      // Track error
      this.tracker.addError('Orchestrator', error.message, error.stack);
      this.tracker.markComplete('FAILED');

      const duration = Date.now() - startTime;

      this.logger.error('❌ Workflow failed', {
        duration: `${(duration / 1000).toFixed(2)}s`,
        status: 'FAILED',
        message: error.message,
      });

      // Generate report even on failure
      return this._generateReport();
    }
  }

  _generateReport() {
    this.logger.info('Generating execution report');

    const report = new DetailedExecutionReport({
      logDir: this.logger.getLogDir(),
      requirementName: this.config.requirementName,
      timestamp: this.tracker.timestamp,
    });

    const markdown = report.generate(
      this.tracker,
      this.logger,
      this.agentOutputs
    );

    const reportPath = report.save(markdown);

    this.logger.info('✓ Execution report generated', {
      file: reportPath,
    });

    // Display dashboard
    console.log(this.tracker.getDashboardString());

    return {
      status: this.tracker.getState().status,
      reportPath,
      logDir: this.logger.getLogDir(),
      summary: this.logger.getSummary(),
      state: this.tracker.getState(),
    };
  }

  _parseRequirement(filePath) {
    // Your parsing logic here
    return {};
  }

  // Getter for runtime log level adjustment
  setLogLevel(level) {
    this.logger.setLogLevel(level);
  }
}

// Usage example:
/*

async function main() {
  const orchestrator = new OrchestratorWithLogging({
    logLevel: process.env.LOG_LEVEL || 'DEBUG',
    requirementName: 'feature-login',
    outputDir: './forge-ai-work',
  });

  try {
    const result = await orchestrator.executeWorkflow('./requirements/feature-login.md');
    console.log('✓ Workflow complete!');
    console.log(`Report: ${result.reportPath}`);
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
    process.exit(1);
  }
}

main();

*/

export default OrchestratorWithLogging;
