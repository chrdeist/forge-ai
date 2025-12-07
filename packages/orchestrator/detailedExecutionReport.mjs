/**
 * DetailedExecutionReport - Comprehensive markdown reports
 * 
 * Purpose:
 * - Generate human-readable execution reports
 * - Show complete workflow with all decisions, outputs, errors
 * - Timeline visualization
 * - Agent-by-agent breakdown
 * - Not a black box - full visibility into what happened
 */

import fs from 'node:fs';
import path from 'node:path';

export class DetailedExecutionReport {
  constructor(config = {}) {
    this.logDir = config.logDir || '.';
    this.requirementName = config.requirementName || 'unknown';
    this.timestamp = config.timestamp || new Date().toISOString().replace(/[:.]/g, '-');
  }

  /**
   * Generate complete execution report
   */
  generate(stateTracker, executionLogger, agentOutputs = {}) {
    const state = stateTracker.getState();
    const logs = executionLogger.getAllLogs();
    const logSummary = executionLogger.getSummary();

    let markdown = '';

    // Header
    markdown += this._generateHeader(state);

    // Executive Summary
    markdown += this._generateSummary(state, logSummary);

    // Workflow Timeline
    markdown += this._generateTimeline(state.timeline);

    // Phase-by-Phase Breakdown
    markdown += this._generatePhaseBreakdown(state.completedPhases, agentOutputs);

    // Agent Logs
    markdown += this._generateAgentLogs(logs);

    // Errors & Warnings
    markdown += this._generateErrorsAndWarnings(state.errors, state.warnings);

    // Data Flow Diagram
    markdown += this._generateDataFlowDiagram(agentOutputs);

    // Detailed Logs (JSON)
    markdown += this._generateDetailedLogsSection(logs);

    // Raw Log File Reference
    markdown += this._generateLogFileReference();

    return markdown;
  }

  /**
   * Generate header section
   */
  _generateHeader(state) {
    return `# Forge AI - Execution Report

**Requirement:** ${state.requirementName}
**Status:** ${state.status}
**Start Time:** ${state.startTime}
**End Time:** ${state.endTime || 'In Progress'}
**Total Duration:** ${this._calculateDuration(state.startTime, state.endTime)}

---

`;
  }

  /**
   * Generate executive summary
   */
  _generateSummary(state, logSummary) {
    let md = '## 📊 Executive Summary\n\n';

    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| **Status** | ${state.status} |\n`;
    md += `| **Phases Completed** | ${state.completedPhases.length} / 9 |\n`;
    md += `| **Total Logs** | ${logSummary.totalLogs} |\n`;
    md += `| **Errors** | ${logSummary.errors.length} |\n`;
    md += `| **Warnings** | ${logSummary.warnings.length} |\n`;
    md += `| **Current Phase** | ${state.currentPhase ? `Phase ${state.currentPhase.number}` : 'Complete'} |\n`;
    md += `| **Current Agent** | ${state.currentAgent || 'None'} |\n`;
    md += '\n';

    // Log level breakdown
    md += '### Log Distribution\n\n';
    md += `| Level | Count |\n`;
    md += `|-------|-------|\n`;
    Object.entries(logSummary.byLevel).forEach(([level, count]) => {
      md += `| ${level} | ${count} |\n`;
    });
    md += '\n';

    return md;
  }

  /**
   * Generate timeline section
   */
  _generateTimeline(timeline) {
    if (!timeline || timeline.length === 0) {
      return '## ⏱️ Timeline\n\nNo timeline data available.\n\n';
    }

    let md = '## ⏱️ Timeline\n\n';
    md += '```\n';

    timeline.forEach((entry, idx) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const icon = this._getEventIcon(entry.event);
      md += `${idx + 1}. [${time}] ${icon} ${entry.event}`;

      if (entry.phase) {
        md += ` (Phase ${entry.phase})`;
      }
      if (entry.agent) {
        md += ` - ${entry.agent}`;
      }

      md += '\n';
    });

    md += '```\n\n';
    return md;
  }

  /**
   * Generate phase-by-phase breakdown
   */
  _generatePhaseBreakdown(completedPhases, agentOutputs) {
    if (!completedPhases || completedPhases.length === 0) {
      return '## 📋 Phase Breakdown\n\nNo phases completed yet.\n\n';
    }

    let md = '## 📋 Phase Breakdown\n\n';

    completedPhases.forEach((phase) => {
      md += `### Phase ${phase.number}: ${phase.name}\n\n`;
      md += `**Status:** ${phase.status}\n\n`;
      md += `**Duration:** ${this._calculateDuration(phase.startTime, phase.endTime)}\n\n`;

      // Agent output
      const phaseKey = `phase${phase.number}`;
      if (agentOutputs[phaseKey]) {
        md += '**Output Summary:**\n\n';
        const output = agentOutputs[phaseKey];

        if (typeof output === 'object') {
          const keys = Object.keys(output).slice(0, 5); // Show first 5 keys
          md += '```json\n';
          md += JSON.stringify(
            { ...Object.fromEntries(keys.map((k) => [k, output[k]])) },
            null,
            2
          );
          md += '\n```\n\n';
        } else {
          md += `\`\`\`\n${String(output).substring(0, 500)}\n\`\`\`\n\n`;
        }
      }

      md += '---\n\n';
    });

    return md;
  }

  /**
   * Generate agent logs section
   */
  _generateAgentLogs(logs) {
    const agents = [...new Set(logs.map((l) => l.context?.agent).filter(Boolean))];

    if (agents.length === 0) {
      return '## 🤖 Agent Logs\n\nNo agent logs available.\n\n';
    }

    let md = '## 🤖 Agent Logs\n\n';

    agents.forEach((agent) => {
      const agentLogs = logs.filter((l) => l.context?.agent === agent);
      md += `### ${agent}\n\n`;
      md += `**Total Logs:** ${agentLogs.length}\n\n`;

      md += '```\n';
      agentLogs.slice(-10).forEach((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        md += `[${time}] [${log.level}] ${log.message}\n`;
      });
      md += '```\n\n';
    });

    return md;
  }

  /**
   * Generate errors and warnings section
   */
  _generateErrorsAndWarnings(errors, warnings) {
    let md = '## ⚠️ Issues\n\n';

    if (errors.length === 0 && warnings.length === 0) {
      md += '✅ No errors or warnings!\n\n';
      return md;
    }

    if (errors.length > 0) {
      md += '### 🔴 Errors\n\n';
      errors.forEach((error, idx) => {
        md += `${idx + 1}. **${error.agent}** (Phase ${error.phase})\n`;
        md += `   - **Time:** ${error.timestamp}\n`;
        md += `   - **Message:** ${error.message}\n`;
        if (error.stack) {
          md += `   - **Stack:**\n\`\`\`\n${error.stack}\n\`\`\`\n`;
        }
        md += '\n';
      });
    }

    if (warnings.length > 0) {
      md += '### 🟡 Warnings\n\n';
      warnings.forEach((warning, idx) => {
        md += `${idx + 1}. **${warning.agent}** (Phase ${warning.phase})\n`;
        md += `   - **Time:** ${warning.timestamp}\n`;
        md += `   - **Message:** ${warning.message}\n\n`;
      });
    }

    return md;
  }

  /**
   * Generate data flow diagram
   */
  _generateDataFlowDiagram(agentOutputs) {
    let md = '## 🔄 Data Flow\n\n';

    md += '```\n';
    md += 'Requirement.md\n';
    md += '    ↓\n';
    md += '[FunctionalRequirementsAgent]\n';
    md += '    ↓\n';
    md += 'functional-summary.json\n';
    md += '    ↓\n';
    md += '[TechnicalRequirementsAgent]\n';
    md += '    ↓\n';
    md += 'technical-specification.json\n';
    md += '    ↓\n';
    md += '[TestAgent] → [ImplementationAgent] ↔ (loop)\n';
    md += '    ↓\n';
    md += 'implementation/ + test-results.json\n';
    md += '    ↓\n';
    md += '[ReviewAgent]\n';
    md += '    ↓\n';
    md += '[DocumentationAgent]\n';
    md += '    ↓\n';
    md += 'documentation.md + diagrams.puml\n';
    md += '```\n\n';

    return md;
  }

  /**
   * Generate detailed logs section (JSON)
   */
  _generateDetailedLogsSection(logs) {
    let md = '## 📝 Detailed Logs (JSON)\n\n';
    md += '```json\n';
    md += JSON.stringify(logs.slice(-50), null, 2); // Last 50 logs
    md += '\n```\n\n';

    return md;
  }

  /**
   * Generate log file reference
   */
  _generateLogFileReference() {
    let md = '## 📂 Log Files\n\n';
    md += `All logs are persisted in: \`${this.logDir}\`\n\n`;
    md += '- **execution.log** - Structured JSON logs (all entries)\n';
    md += '- **workflow-state.json** - Current workflow state\n';
    md += '- **execution-report.md** - This report\n\n';

    return md;
  }

  /**
   * Helper: Get event icon
   */
  _getEventIcon(event) {
    const icons = {
      PHASE_START: '▶️',
      PHASE_COMPLETE: '✅',
      AGENT_START: '🤖',
      AGENT_COMPLETE: '✓',
      ERROR: '❌',
      WARNING: '⚠️',
      VALIDATION: '🔍',
    };
    return icons[event] || '•';
  }

  /**
   * Helper: Calculate duration
   */
  _calculateDuration(startStr, endStr) {
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
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
   * Save report to file
   */
  save(markdown, filename = 'execution-report.md') {
    const filepath = path.join(this.logDir, filename);
    fs.writeFileSync(filepath, markdown, 'utf-8');
    return filepath;
  }
}

export default DetailedExecutionReport;
