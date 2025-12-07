/**
 * WorkflowStateTracker - Real-time tracking of execution state
 * 
 * Purpose:
 * - Track current phase, agent, status
 * - Maintain timeline of what happened
 * - Quick visibility into "where are we now?"
 * - Support for resuming interrupted workflows
 */

import fs from 'node:fs';
import path from 'node:path';

export class WorkflowStateTracker {
  constructor(config = {}) {
    this.outputDir = config.outputDir || path.join(process.cwd(), 'forge-ai-work');
    this.requirementName = config.requirementName || 'unknown';
    this.timestamp = config.timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    
    this.workDir = path.join(this.outputDir, `execution-${this.timestamp}`);
    this.stateFile = path.join(this.workDir, 'workflow-state.json');
    
    this.state = {
      requirementName: this.requirementName,
      status: 'INITIATED', // INITIATED, IN_PROGRESS, PAUSED, COMPLETED, FAILED
      startTime: new Date().toISOString(),
      endTime: null,
      currentPhase: null,
      currentAgent: null,
      completedPhases: [],
      timeline: [],
      errors: [],
      warnings: [],
    };

    this._ensureDir();
  }

  /**
   * Update current phase
   */
  setCurrentPhase(phaseNumber, phaseName, agentName = null) {
    this.state.status = 'IN_PROGRESS';
    this.state.currentPhase = {
      number: phaseNumber,
      name: phaseName,
      startTime: new Date().toISOString(),
      status: 'RUNNING',
    };
    this.state.currentAgent = agentName;

    this._addTimeline('PHASE_START', phaseNumber, phaseName, agentName);
    this._persist();
  }

  /**
   * Mark phase as complete
   */
  completePhase(phaseNumber, phaseName, result = {}) {
    const phase = {
      number: phaseNumber,
      name: phaseName,
      startTime: this.state.currentPhase?.startTime,
      endTime: new Date().toISOString(),
      status: 'COMPLETED',
      result,
    };

    this.state.completedPhases.push(phase);
    this.state.currentPhase = null;
    this._addTimeline('PHASE_COMPLETE', phaseNumber, phaseName, null, result);
    this._persist();
  }

  /**
   * Update current agent
   */
  setCurrentAgent(agentName) {
    this.state.currentAgent = agentName;
    this._addTimeline('AGENT_START', null, agentName);
    this._persist();
  }

  /**
   * Mark agent as complete
   */
  completeAgent(agentName, output = {}) {
    this._addTimeline('AGENT_COMPLETE', null, agentName, {
      outputKeys: Object.keys(output),
    });
    this.state.currentAgent = null;
    this._persist();
  }

  /**
   * Add error to tracking
   */
  addError(agentName, errorMessage, stack = null) {
    const error = {
      timestamp: new Date().toISOString(),
      agent: agentName,
      phase: this.state.currentPhase?.number,
      message: errorMessage,
      stack,
    };

    this.state.errors.push(error);
    this._addTimeline('ERROR', null, agentName, {
      message: errorMessage,
      hasStack: !!stack,
    });
    this._persist();
  }

  /**
   * Add warning to tracking
   */
  addWarning(agentName, warningMessage) {
    const warning = {
      timestamp: new Date().toISOString(),
      agent: agentName,
      phase: this.state.currentPhase?.number,
      message: warningMessage,
    };

    this.state.warnings.push(warning);
    this._addTimeline('WARNING', null, agentName, {
      message: warningMessage,
    });
    this._persist();
  }

  /**
   * Mark workflow as complete
   */
  markComplete(finalStatus = 'COMPLETED') {
    this.state.status = finalStatus; // COMPLETED or FAILED
    this.state.endTime = new Date().toISOString();
    this._persist();
  }

  /**
   * Get current state summary
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Get workflow status as single-line summary
   */
  getStatusSummary() {
    const phase = this.state.currentPhase
      ? `Phase ${this.state.currentPhase.number}: ${this.state.currentPhase.name}`
      : 'N/A';
    
    const agent = this.state.currentAgent || 'N/A';
    const status = this.state.status;
    const completed = this.state.completedPhases.length;
    const errors = this.state.errors.length;

    return {
      status,
      currentPhase: phase,
      currentAgent: agent,
      phasesCompleted: completed,
      errors,
      startTime: this.state.startTime,
      duration: this._calculateDuration(),
    };
  }

  /**
   * Generate status dashboard string for console
   */
  getDashboardString() {
    const summary = this.getStatusSummary();
    const lines = [
      '\n╔════════════════════════════════════════════════════════════╗',
      '║          FORGE AI WORKFLOW STATUS                           ║',
      '╠════════════════════════════════════════════════════════════╣',
      `║ Status:         ${summary.status.padEnd(47)} ║`,
      `║ Current Phase:  ${summary.currentPhase.padEnd(47)} ║`,
      `║ Current Agent:  ${summary.currentAgent.padEnd(47)} ║`,
      `║ Completed:      ${summary.phasesCompleted} / 9 phases                  ${' '.repeat(Math.max(0, 30 - String(summary.phasesCompleted).length))}║`,
      `║ Errors:         ${summary.errors} ${' '.repeat(47 - String(summary.errors).length)} ║`,
      `║ Duration:       ${summary.duration}${' '.repeat(Math.max(0, 47 - summary.duration.length))} ║`,
      '╠════════════════════════════════════════════════════════════╣',
    ];

    // Add recent timeline
    const recent = this.state.timeline.slice(-5);
    if (recent.length > 0) {
      lines.push('║ Recent Activity:                                             ║');
      recent.forEach((entry) => {
        const line = `║   ${entry.event} @ ${entry.timestamp.substring(11, 19)}${' '.repeat(Math.max(0, 53 - entry.event.length))} ║`;
        lines.push(line);
      });
    }

    lines.push('╚════════════════════════════════════════════════════════════╝\n');

    return lines.join('\n');
  }

  /**
   * Private: Add timeline entry
   */
  _addTimeline(event, phase, agent, context = {}, result = {}) {
    this.state.timeline.push({
      timestamp: new Date().toISOString(),
      event,
      phase,
      agent,
      context,
      result,
    });
  }

  /**
   * Private: Calculate duration
   */
  _calculateDuration() {
    const start = new Date(this.state.startTime);
    const end = this.state.endTime ? new Date(this.state.endTime) : new Date();
    const diff = end - start;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Private: Ensure directory exists
   */
  _ensureDir() {
    if (!fs.existsSync(this.workDir)) {
      fs.mkdirSync(this.workDir, { recursive: true });
    }
  }

  /**
   * Private: Persist state to file
   */
  _persist() {
    this._ensureDir();
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  /**
   * Load existing state (for resuming workflows)
   */
  static loadState(stateFile) {
    if (!fs.existsSync(stateFile)) {
      return null;
    }
    const content = fs.readFileSync(stateFile, 'utf-8');
    return JSON.parse(content);
  }
}

export default WorkflowStateTracker;
