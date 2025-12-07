/**
 * ExecutionLogger - Structured Logging System for Forge AI
 * 
 * Purpose:
 * - Detailed visibility into workflow execution
 * - Track each agent, phase, decision
 * - Configurable log levels (VERBOSE, DEBUG, INFO, WARN, ERROR)
 * - Real-time console output + persistent file logging
 * - Easy debugging when things go wrong
 * 
 * Log Levels:
 * - VERBOSE: Everything (initial development, debugging)
 * - DEBUG: Agent internals, context, decisions
 * - INFO: Phase transitions, major milestones
 * - WARN: Issues, warnings, potential problems
 * - ERROR: Critical failures
 */

import fs from 'node:fs';
import path from 'node:path';

export class ExecutionLogger {
  constructor(config = {}) {
    this.logLevel = config.logLevel || 'INFO'; // VERBOSE, DEBUG, INFO, WARN, ERROR
    this.outputDir = config.outputDir || path.join(process.cwd(), 'forge-ai-work');
    this.requirementName = config.requirementName || 'unknown';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    this.logDir = path.join(
      this.outputDir,
      `execution-${this.timestamp}`
    );
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    this.logFile = path.join(this.logDir, 'execution.log');
    this.logsJson = [];
    
    // Color codes for console output
    this.colors = {
      RESET: '\x1b[0m',
      BRIGHT: '\x1b[1m',
      DIM: '\x1b[2m',
      RED: '\x1b[31m',
      GREEN: '\x1b[32m',
      YELLOW: '\x1b[33m',
      BLUE: '\x1b[34m',
      MAGENTA: '\x1b[35m',
      CYAN: '\x1b[36m',
    };
    
    this.levelColors = {
      VERBOSE: this.colors.DIM,
      DEBUG: this.colors.CYAN,
      INFO: this.colors.BLUE,
      WARN: this.colors.YELLOW,
      ERROR: this.colors.RED,
    };
    
    this.levelValues = {
      VERBOSE: 5,
      DEBUG: 4,
      INFO: 3,
      WARN: 2,
      ERROR: 1,
    };
  }

  /**
   * Log a message at appropriate level.
   */
  log(level, message, context = {}) {
    if (this.levelValues[level] > this.levelValues[this.logLevel]) {
      return; // Skip this log level
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context,
    };

    // Store for JSON output
    this.logsJson.push(logEntry);

    // Console output with colors
    const color = this.levelColors[level] || this.colors.RESET;
    const prefix = `[${timestamp}] [${level}]`;
    const output = `${color}${prefix}${this.colors.RESET} ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      console.log(output);
      console.log(`${this.colors.DIM}  Context: ${JSON.stringify(context, null, 2)}${this.colors.RESET}`);
    } else {
      console.log(output);
    }

    // Persist to file
    this._persistLog(logEntry);
  }

  /**
   * VERBOSE - For extremely detailed debugging
   */
  verbose(message, context = {}) {
    this.log('VERBOSE', message, context);
  }

  /**
   * DEBUG - For agent internals, data structures, decisions
   */
  debug(message, context = {}) {
    this.log('DEBUG', message, context);
  }

  /**
   * INFO - Phase transitions, major milestones
   */
  info(message, context = {}) {
    this.log('INFO', message, context);
  }

  /**
   * WARN - Issues, warnings, potential problems
   */
  warn(message, context = {}) {
    this.log('WARN', message, context);
  }

  /**
   * ERROR - Critical failures
   */
  error(message, context = {}) {
    this.log('ERROR', message, context);
  }

  /**
   * Phase Start - Structured logging for phase transitions
   */
  phaseStart(phaseNumber, phaseName, config = {}) {
    this.info(`[${'='.repeat(60)}]`, {});
    this.info(`PHASE ${phaseNumber}: ${phaseName}`, {
      timestamp: new Date().toISOString(),
      ...config,
    });
    this.info(`[${'='.repeat(60)}]`, {});
  }

  /**
   * Phase Complete - Structured logging for phase completion
   */
  phaseComplete(phaseNumber, phaseName, result = {}) {
    this.info(`[${'-'.repeat(60)}]`, {});
    this.info(`✓ PHASE ${phaseNumber} COMPLETE: ${phaseName}`, {
      duration: result.duration,
      itemsProcessed: result.itemsProcessed,
      status: 'success',
    });
    this.info(`[${'-'.repeat(60)}]`, {});
  }

  /**
   * Agent Start - Log when agent begins execution
   */
  agentStart(agentName, input = {}) {
    this.debug(`→ ${agentName} starting`, {
      agent: agentName,
      inputKeys: Object.keys(input),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Agent Complete - Log when agent finishes
   */
  agentComplete(agentName, output = {}, duration = 0) {
    this.debug(`← ${agentName} completed`, {
      agent: agentName,
      outputKeys: Object.keys(output),
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Validation Result - Log validation outcomes
   */
  validation(isValid, context = {}) {
    const status = isValid ? '✓ VALID' : '✗ INVALID';
    const level = isValid ? 'DEBUG' : 'WARN';
    this.log(level, `Validation: ${status}`, context);
  }

  /**
   * Data Flow - Log data moving between agents
   */
  dataFlow(source, target, fields = []) {
    this.verbose(`Data flow: ${source} → ${target}`, {
      fieldsTransferred: fields,
      count: fields.length,
    });
  }

  /**
   * Persist log entry to file
   */
  _persistLog(logEntry) {
    const line = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFile, line);
  }

  /**
   * Get all logs as structured data
   */
  getAllLogs() {
    return this.logsJson;
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level) {
    return this.logsJson.filter((log) => log.level === level);
  }

  /**
   * Get logs by context (e.g., agent name)
   */
  getLogsByContext(contextKey, contextValue) {
    return this.logsJson.filter((log) => log.context?.[contextKey] === contextValue);
  }

  /**
   * Summary statistics
   */
  getSummary() {
    const summary = {
      totalLogs: this.logsJson.length,
      byLevel: {},
      logFile: this.logFile,
      startTime: this.logsJson[0]?.timestamp,
      endTime: this.logsJson[this.logsJson.length - 1]?.timestamp,
      errors: this.logsJson.filter((l) => l.level === 'ERROR'),
      warnings: this.logsJson.filter((l) => l.level === 'WARN'),
    };

    ['VERBOSE', 'DEBUG', 'INFO', 'WARN', 'ERROR'].forEach((level) => {
      summary.byLevel[level] = this.logsJson.filter((l) => l.level === level).length;
    });

    return summary;
  }

  /**
   * Generate timeline visualization
   */
  generateTimeline() {
    const timeline = [];
    let lastTime = null;

    this.logsJson.forEach((log) => {
      const time = new Date(log.timestamp);
      let duration = 0;

      if (lastTime) {
        duration = time - lastTime;
      }
      lastTime = time;

      timeline.push({
        time: log.timestamp,
        level: log.level,
        message: log.message,
        durationSinceLastMs: duration,
      });
    });

    return timeline;
  }

  /**
   * Set log level (for runtime adjustment)
   */
  setLogLevel(level) {
    if (this.levelValues[level] !== undefined) {
      this.logLevel = level;
      this.info(`Log level changed to: ${level}`);
    }
  }

  /**
   * Get log directory path
   */
  getLogDir() {
    return this.logDir;
  }

  /**
   * Get log file path
   */
  getLogFile() {
    return this.logFile;
  }
}

export default ExecutionLogger;
