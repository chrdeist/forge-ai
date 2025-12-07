/**
 * InteractiveOrchestrator - Step-by-step workflow execution
 * 
 * Purpose:
 * - Pause after each phase/agent
 * - User sees outputs and understands what happened
 * - Perfect for demos and learning
 * - Can be used in automation mode (no pauses) for production
 * 
 * Usage:
 *   Interactive:  forge execute --requirements=req.md --interactive
 *   Automatic:    forge execute --requirements=req.md
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import ExecutionLogger from './executionLogger.mjs';
import WorkflowStateTracker from './workflowStateTracker.mjs';
import DetailedExecutionReport from './detailedExecutionReport.mjs';

export class InteractiveOrchestrator {
  constructor(config = {}) {
    this.config = config;
    this.interactive = config.interactive !== false;
    this.outputDir = config.outputDir || './forge-ai-work';
    this.requirementName = config.requirementName || 'unknown';

    // Initialize logging
    this.logger = new ExecutionLogger({
      logLevel: config.logLevel || 'DEBUG',
      outputDir: this.outputDir,
      requirementName: this.requirementName,
    });

    // Initialize state tracking
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.tracker = new WorkflowStateTracker({
      outputDir: this.outputDir,
      requirementName: this.requirementName,
      timestamp,
    });

    this.timestamp = timestamp;
    this.agentOutputs = {};
    this.phases = [];
    this.currentPhaseIndex = -1;

    // Setup readline for interactive mode
    if (this.interactive) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    }
  }

  /**
   * Define all phases upfront
   */
  definePhases(phases) {
    this.phases = phases;
    this.logger.info(`Defined ${phases.length} phases`, {
      phases: phases.map((p) => `${p.number}: ${p.name}`),
    });
  }

  /**
   * Execute workflow step by step
   */
  async executeWorkflow(requirementFile) {
    this.logger.info('🚀 Starting interactive workflow execution', {
      interactive: this.interactive,
      totalPhases: this.phases.length,
    });

    const startTime = Date.now();

    try {
      // Phase 1: Parse Requirement
      await this._executePhase(1, 'Parse Requirement', async () => {
        this.logger.info('Parsing requirement file', { file: requirementFile });
        const content = fs.readFileSync(requirementFile, 'utf-8');
        return JSON.parse(content); // Simplified parsing
      });

      // Execute remaining phases
      for (let i = 1; i < this.phases.length; i++) {
        const phase = this.phases[i];
        await this._executePhase(
          phase.number,
          phase.name,
          phase.execute.bind(this)
        );
      }

      // Mark complete
      this.tracker.markComplete('COMPLETED');
      const duration = Date.now() - startTime;

      this.logger.info('✓ Workflow completed successfully', {
        duration: `${(duration / 1000).toFixed(2)}s`,
        status: 'COMPLETED',
      });

      // Generate and show final report
      return await this._generateAndShowReport(duration);

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
      await this._generateAndShowReport(duration);

      throw error;
    }
  }

  /**
   * Execute a single phase with optional pause
   */
  async _executePhase(phaseNumber, phaseName, executeFunc) {
    this.currentPhaseIndex = phaseNumber;

    // Show phase start
    this._printPhaseHeader(phaseNumber, phaseName, 'STARTING');
    this.logger.phaseStart(phaseNumber, phaseName);
    this.tracker.setCurrentPhase(phaseNumber, phaseName);

    const startTime = Date.now();

    try {
      // Execute the phase
      this.logger.debug(`Executing phase ${phaseNumber}`, { name: phaseName });
      const output = await executeFunc();

      // Store output
      this.agentOutputs[`phase${phaseNumber}`] = output;

      // Show results
      const duration = Date.now() - startTime;
      this._printPhaseResults(phaseNumber, phaseName, output, duration);

      // Log completion
      this.logger.phaseComplete(phaseNumber, phaseName, {
        duration: `${(duration / 1000).toFixed(2)}s`,
        itemsProcessed: Array.isArray(output) ? output.length : 1,
      });

      this.tracker.completePhase(phaseNumber, phaseName, {
        duration: `${(duration / 1000).toFixed(2)}s`,
        itemsProcessed: Array.isArray(output) ? output.length : 1,
      });

      // Pause for user review (if interactive)
      if (this.interactive) {
        await this._pauseForReview(phaseNumber, phaseName, output);
      }

      return output;

    } catch (error) {
      const duration = Date.now() - startTime;

      this._printPhaseError(phaseNumber, phaseName, error);

      this.logger.error(`Phase ${phaseNumber} failed: ${error.message}`, {
        phase: phaseNumber,
        phaseName,
        duration: `${(duration / 1000).toFixed(2)}s`,
        stack: error.stack,
      });

      this.tracker.addError(phaseName, error.message, error.stack);

      throw error;
    }
  }

  /**
   * Pause and let user review phase output
   */
  async _pauseForReview(phaseNumber, phaseName, output) {
    return new Promise((resolve) => {
      const outputPreview = this._generateOutputPreview(output);

      const prompt = `
${'═'.repeat(70)}
PHASE ${phaseNumber} OUTPUT PREVIEW
${'═'.repeat(70)}
${outputPreview}

${'═'.repeat(70)}
Press ENTER to continue to next phase, or type a command:
  'log'  - Show detailed logs from this phase
  'save' - Save phase output to file
  'exit' - Stop execution
${'═'.repeat(70)}
`;

      this.rl.question(prompt, async (answer) => {
        switch (answer.toLowerCase().trim()) {
          case 'log':
            this._showDetailedLogs(phaseNumber);
            return this._pauseForReview(phaseNumber, phaseName, output);

          case 'save':
            this._savePhaseOutput(phaseNumber, output);
            return this._pauseForReview(phaseNumber, phaseName, output);

          case 'exit':
            console.log('\n⚠️  Execution stopped by user');
            process.exit(0);

          default:
            resolve();
        }
      });
    });
  }

  /**
   * Generate output preview for console
   */
  _generateOutputPreview(output) {
    if (!output) {
      return '(No output)';
    }

    if (typeof output === 'string') {
      return output.substring(0, 500) + (output.length > 500 ? '\n...' : '');
    }

    if (Array.isArray(output)) {
      const preview = output.slice(0, 5).map((item) => `  • ${JSON.stringify(item)}`);
      const remaining = output.length > 5 ? `\n  ... and ${output.length - 5} more items` : '';
      return preview.join('\n') + remaining;
    }

    if (typeof output === 'object') {
      const keys = Object.keys(output).slice(0, 10);
      const preview = keys.map((k) => {
        const val = String(output[k]).substring(0, 50);
        return `  ${k}: ${val}`;
      });
      const remaining = Object.keys(output).length > 10 ? `\n  ... and ${Object.keys(output).length - 10} more fields` : '';
      return preview.join('\n') + remaining;
    }

    return JSON.stringify(output, null, 2).substring(0, 500);
  }

  /**
   * Print phase header
   */
  _printPhaseHeader(number, name, status) {
    const colors = {
      STARTING: '\x1b[36m', // Cyan
      COMPLETE: '\x1b[32m', // Green
      ERROR: '\x1b[31m',    // Red
      RESET: '\x1b[0m',
    };

    const color = colors[status] || colors.RESET;

    console.log(`\n${color}${'═'.repeat(70)}`);
    console.log(`PHASE ${number}: ${name}`);
    console.log(`Status: ${status}`);
    console.log(`${'═'.repeat(70)}${colors.RESET}\n`);
  }

  /**
   * Print phase results
   */
  _printPhaseResults(number, name, output, duration) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`✓ PHASE ${number} COMPLETED: ${name}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`${'─'.repeat(70)}\n`);

    if (output) {
      const preview = this._generateOutputPreview(output);
      console.log('Output Preview:');
      console.log(preview);
      console.log('');
    }
  }

  /**
   * Print phase error
   */
  _printPhaseError(number, name, error) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`❌ PHASE ${number} FAILED: ${name}`);
    console.log(`Error: ${error.message}`);
    console.log(`${'═'.repeat(70)}\n`);
  }

  /**
   * Show detailed logs from current phase
   */
  _showDetailedLogs(phaseNumber) {
    const logs = this.logger.getAllLogs();
    const phaseLogs = logs.filter((log) => {
      // Logs from this phase (based on message or context)
      return log.message.includes(`Phase ${phaseNumber}`) || 
             log.context?.phase === phaseNumber;
    });

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`DETAILED LOGS - PHASE ${phaseNumber}`);
    console.log(`${'─'.repeat(70)}\n`);

    phaseLogs.forEach((log) => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      console.log(`[${time}] [${log.level}] ${log.message}`);
      if (log.context && Object.keys(log.context).length > 0) {
        console.log(`  Context: ${JSON.stringify(log.context)}`);
      }
    });

    console.log('');
  }

  /**
   * Save phase output to file
   */
  _savePhaseOutput(phaseNumber, output) {
    const logDir = this.logger.getLogDir();
    const filename = path.join(logDir, `phase-${phaseNumber}-output.json`);

    fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`\n✓ Phase ${phaseNumber} output saved to: ${filename}\n`);
  }

  /**
   * Generate and show final report
   */
  async _generateAndShowReport(duration) {
    this.logger.info('Generating execution report');

    const report = new DetailedExecutionReport({
      logDir: this.logger.getLogDir(),
      requirementName: this.requirementName,
      timestamp: this.timestamp,
    });

    const markdown = report.generate(
      this.tracker,
      this.logger,
      this.agentOutputs
    );

    const reportPath = report.save(markdown);

    // Show summary
    console.log('\n' + this.tracker.getDashboardString());

    console.log(`\n✓ Execution report saved: ${reportPath}\n`);

    // Log summary
    this.logger.info('✓ Execution report generated', {
      file: reportPath,
    });

    return {
      status: this.tracker.getState().status,
      reportPath,
      logDir: this.logger.getLogDir(),
      duration: `${(duration / 1000).toFixed(2)}s`,
      summary: this.logger.getSummary(),
      state: this.tracker.getState(),
    };
  }

  /**
   * Close readline (if interactive)
   */
  close() {
    if (this.rl) {
      this.rl.close();
    }
  }

  /**
   * Get current phase index
   */
  getCurrentPhaseIndex() {
    return this.currentPhaseIndex;
  }

  /**
   * Get log directory
   */
  getLogDir() {
    return this.logger.getLogDir();
  }
}

export default InteractiveOrchestrator;
