# Forge AI - Logging & Visibility System

## Overview

Forge AI Orchestrator ist ein **komplexes, multi-Agent-System**. Um nicht in eine Black Box zu verwandeln, haben wir ein umfassendes Logging- und Reporting-System:

```
User starts workflow
    ↓
ExecutionLogger logs EVERYTHING in real-time
    ↓
WorkflowStateTracker tracks CURRENT STATUS
    ↓
DetailedExecutionReport generates READABLE MARKDOWN report
    ↓
Human reviews: "Ah, Phase 3 Agent X failed bei..."
```

---

## Log Levels

Das System unterstützt 5 Log-Level - konfigurierbar zur Laufzeit:

### 🔤 VERBOSE (Level 5)
- **Wann:** Während Debugging, Initial Development
- **Was:** Alle Details - Data Structures, Context, Decisions
- **Beispiel:** "Prompt template loaded", "Variable injected: {{REQUIREMENT_NAME}}"
- **Menge:** Sehr viel Output, aber maximale Sichtbarkeit

### 🔹 DEBUG (Level 4)  
- **Wann:** Standard für Development
- **Was:** Agent Internals, Validation Results, Data Flow
- **Beispiel:** "→ TechnicalRequirementsAgent starting", "← Validation: ✓ VALID"
- **Menge:** Moderat, fokussiert auf relevante Entscheidungen

### ℹ️ INFO (Level 3)
- **Wann:** Standard für Production
- **Was:** Phase Transitions, Major Milestones
- **Beispiel:** "PHASE 2: Extract Functional Requirements", "✓ PHASE 2 COMPLETE"
- **Menge:** Übersichtlich, nur wichtige Events

### ⚠️ WARN (Level 2)
- **Wann:** Immer aktiv
- **Was:** Issues, Potential Problems, Validation Warnings
- **Beispiel:** "Missing section in requirement", "Pattern success rate below threshold"
- **Menge:** Gering (hoffentlich), aber critical

### 🔴 ERROR (Level 1)
- **Wann:** Immer aktiv
- **Was:** Critical Failures
- **Beispiel:** "TechnicalRequirementsAgent: Missing required input fields"
- **Menge:** Idealerweise null, aber wenn vorhanden: wichtig!

---

## Components

### 1. ExecutionLogger (`executionLogger.mjs`)

**Verantwortlichkeiten:**
- Real-time console output mit Farben
- Strukturierte JSON Logs auf Disk
- Konfigurierbare Log Levels

**Nutzung:**

```javascript
import ExecutionLogger from './executionLogger.mjs';

const logger = new ExecutionLogger({
  logLevel: 'DEBUG',           // VERBOSE, DEBUG, INFO, WARN, ERROR
  outputDir: './forge-ai-work',
  requirementName: 'feature-login',
});

// Log at various levels
logger.verbose('Detailed debugging info', { data: 'context' });
logger.debug('Agent decision point', { agent: 'TechSpec' });
logger.info('Phase transition', { phase: 2, name: 'Functional Requirements' });
logger.warn('Potential issue', { field: 'apis', status: 'empty' });
logger.error('Critical failure', { agent: 'TestAgent', reason: 'No test cases' });

// Structured logging for phases
logger.phaseStart(2, 'Functional Requirements', { inputFile: 'req.md' });
logger.phaseComplete(2, 'Functional Requirements', { duration: '2.3s' });

// Structured logging for agents
logger.agentStart('TechnicalRequirementsAgent', { input: {...} });
logger.agentComplete('TechnicalRequirementsAgent', { output: {...} }, 1234);

// Get statistics
const summary = logger.getSummary();
console.log(summary);
// → { totalLogs: 156, byLevel: {...}, errors: [...], warnings: [...] }

// Change log level at runtime
logger.setLogLevel('INFO');
```

### 2. WorkflowStateTracker (`workflowStateTracker.mjs`)

**Verantwortlichkeiten:**
- Track current phase, agent, status
- Maintain timeline of events
- Quick status dashboard
- Persist state for resumable workflows

**Nutzung:**

```javascript
import WorkflowStateTracker from './workflowStateTracker.mjs';

const tracker = new WorkflowStateTracker({
  outputDir: './forge-ai-work',
  requirementName: 'feature-login',
  timestamp: '2025-12-07T10-30-45-123',
});

// Track phase transitions
tracker.setCurrentPhase(2, 'Extract Functional Requirements', 'FunctionalRequirementsAgent');
// ... phase executes ...
tracker.completePhase(2, 'Extract Functional Requirements', {
  duration: '2.3s',
  itemsProcessed: 12,
});

// Track agent execution
tracker.setCurrentAgent('TechnicalRequirementsAgent');
tracker.completeAgent('TechnicalRequirementsAgent', { apis: [...], dataStructures: [...] });

// Track issues
tracker.addError('TestAgent', 'No test cases generated', stackTrace);
tracker.addWarning('ImplementationAgent', 'Pattern success rate 65% < threshold 75%');

// Get status
const status = tracker.getStatusSummary();
console.log(status);
// → { status: 'IN_PROGRESS', currentPhase: 'Phase 3: ...', currentAgent: '...', ... }

// Display dashboard
console.log(tracker.getDashboardString());
// → ASCII art dashboard with current status
```

**Ausgabe Example:**

```
╔════════════════════════════════════════════════════════════╗
║          FORGE AI WORKFLOW STATUS                           ║
╠════════════════════════════════════════════════════════════╣
║ Status:         IN_PROGRESS                                 ║
║ Current Phase:  Phase 3: Generate Technical Specification  ║
║ Current Agent:  TechnicalRequirementsAgent                  ║
║ Completed:      2 / 9 phases                                ║
║ Errors:         0                                           ║
║ Duration:       5m 23s                                      ║
╠════════════════════════════════════════════════════════════╣
║ Recent Activity:                                             ║
║   PHASE_COMPLETE @ 10:35:42                                ║
║   AGENT_START @ 10:35:45                                   ║
║   VALIDATION @ 10:35:47                                    ║
╚════════════════════════════════════════════════════════════╝
```

### 3. DetailedExecutionReport (`detailedExecutionReport.mjs`)

**Verantwortlichkeiten:**
- Generate comprehensive markdown reports
- Timeline visualization
- Phase-by-phase breakdown
- Error/Warning summary
- Data flow diagram
- Full transparency

**Nutzung:**

```javascript
import DetailedExecutionReport from './detailedExecutionReport.mjs';

const report = new DetailedExecutionReport({
  logDir: './forge-ai-work/execution-2025-12-07...',
  requirementName: 'feature-login',
  timestamp: '2025-12-07...',
});

// Generate complete report
const markdown = report.generate(
  stateTracker,        // WorkflowStateTracker instance
  logger,              // ExecutionLogger instance
  agentOutputs         // { phase1: {...}, phase2: {...}, ... }
);

// Save to file
const filepath = report.save(markdown);
console.log(`Report saved: ${filepath}`);
```

**Ausgabe enthält:**

1. **Header** - Requirement Name, Status, Duration
2. **Executive Summary** - Metrics Table, Log Distribution
3. **Timeline** - Event log mit Timestamps
4. **Phase Breakdown** - Detail zu jedem Phase mit Agent Output
5. **Agent Logs** - Pro-Agent Log Summary
6. **Issues** - Alle Errors und Warnings
7. **Data Flow** - ASCII Diagram der Agent Pipeline
8. **Detailed Logs** - Raw JSON (last 50 entries)
9. **File References** - Wo die Raw Logs sind

---

## Workflow Integration

Im Orchestrator würde es so aussehen:

```javascript
import ExecutionLogger from './executionLogger.mjs';
import WorkflowStateTracker from './workflowStateTracker.mjs';
import DetailedExecutionReport from './detailedExecutionReport.mjs';

class SoftwareLifecycleOrchestrator {
  async executeWorkflow(requirementsFile) {
    // Initialize logging
    const logger = new ExecutionLogger({
      logLevel: process.env.LOG_LEVEL || 'DEBUG',
      requirementName: 'my-feature',
    });

    const tracker = new WorkflowStateTracker({
      requirementName: 'my-feature',
      timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
    });

    const agentOutputs = {};

    try {
      // Parse requirement
      logger.info('Starting workflow execution');
      tracker.setCurrentPhase(1, 'Parse Requirement');
      
      const requirement = parseRequirement(requirementsFile);
      
      tracker.completePhase(1, 'Parse Requirement');
      logger.info('✓ Requirement parsed');

      // Phase 2: Functional Requirements
      logger.phaseStart(2, 'Extract Functional Requirements');
      tracker.setCurrentPhase(2, 'Extract Functional Requirements', 'FunctionalRequirementsAgent');
      
      const functionalAgent = new FunctionalRequirementsAgent();
      functionalAgent.setRequirementContext(requirement);
      
      logger.agentStart('FunctionalRequirementsAgent', { input: requirement });
      const functionalOutput = await functionalAgent.execute(requirementsFile);
      logger.agentComplete('FunctionalRequirementsAgent', functionalOutput);
      
      agentOutputs.phase2 = functionalOutput;
      tracker.completePhase(2, 'Extract Functional Requirements', {
        duration: '2.3s',
        itemsProcessed: 12,
      });
      logger.phaseComplete(2, 'Extract Functional Requirements');

      // Phase 3: Technical Requirements
      logger.phaseStart(3, 'Generate Technical Specification');
      tracker.setCurrentPhase(3, 'Technical Spec', 'TechnicalRequirementsAgent');
      
      // ... continue for all phases ...

      // Mark complete
      tracker.markComplete('COMPLETED');
      logger.info('✓ Workflow completed successfully');

    } catch (error) {
      logger.error(`Workflow failed: ${error.message}`, { stack: error.stack });
      tracker.addError('Orchestrator', error.message, error.stack);
      tracker.markComplete('FAILED');
      
      // Generate report even on failure
      const report = new DetailedExecutionReport({
        logDir: logger.getLogDir(),
        requirementName: 'my-feature',
      });
      const markdown = report.generate(tracker, logger, agentOutputs);
      report.save(markdown);
      
      throw error;
    }

    // Generate final report
    const report = new DetailedExecutionReport({
      logDir: logger.getLogDir(),
      requirementName: 'my-feature',
    });
    const markdown = report.generate(tracker, logger, agentOutputs);
    const reportPath = report.save(markdown);

    logger.info(`Execution report saved: ${reportPath}`);
    
    return {
      status: 'success',
      reportPath,
      logDir: logger.getLogDir(),
    };
  }
}
```

---

## Log Level Guidance

### Anfang (Development)
- **Empfohlener Level:** `VERBOSE`
- **Grund:** Maximale Sichtbarkeit, um System zu verstehen
- **Output:** Viel, aber sehr hilfreich

### Middle Phase (Testing)
- **Empfohlener Level:** `DEBUG`
- **Grund:** Gutes Balance zwischen Detail und Lesbarkeit
- **Output:** Übersichtlich, alle wichtigen Entscheidungen sichtbar

### Production (Stable)
- **Empfohlener Level:** `INFO`
- **Grund:** Nur relevante Events
- **Output:** Kurz und prägnant

### Einstellen per Environment Variable

```bash
# Verbose für Debugging
LOG_LEVEL=VERBOSE node packages/cli/forge.mjs execute ...

# Debug für Development
LOG_LEVEL=DEBUG node packages/cli/forge.mjs execute ...

# Info für Production
LOG_LEVEL=INFO node packages/cli/forge.mjs execute ...
```

---

## Output Structure

Nach jeder Workflow-Execution:

```
forge-ai-work/
├── execution-2025-12-07T10-30-45-123/
│   ├── execution.log                    ← Raw JSON logs
│   ├── workflow-state.json              ← Current state snapshot
│   └── execution-report.md              ← Human-readable markdown
│
├── execution-2025-12-07T14-20-10-456/
│   ├── execution.log
│   ├── workflow-state.json
│   └── execution-report.md
│
└── ... (mehr Executions)
```

---

## Debugging Tips

### "Ich weiß nicht was in Phase 3 falsch gelaufen ist"

```bash
# 1. Öffne execution-report.md
cat forge-ai-work/execution-2025-12-07.../execution-report.md

# 2. Suche nach "Phase 3" Section
# 3. Schau "Agent Logs" → welche Agent lief?
# 4. Schau "Issues" → gibt es Errors/Warnings?
```

### "Ich brauch mehr Details"

```bash
# 1. Öffne execution.log (JSON)
cat forge-ai-work/execution-2025-12-07.../execution.log | jq '.[] | select(.level=="DEBUG")'

# 2. Oder nutze Log queries in Python/Node
const logs = JSON.parse(fs.readFileSync('execution.log'));
const agentLogs = logs.filter(l => l.context?.agent === 'TechnicalRequirementsAgent');
```

### "Ich brauche ALLES detailliert"

```bash
# Setze log level auf VERBOSE beim nächsten Run
LOG_LEVEL=VERBOSE node packages/cli/forge.mjs execute ...
```

---

## Summary

Das Logging-System macht Forge AI **transparent, nicht opak**:

✅ **Echtzeit-Sichtbarkeit** - Wir sehen was gerade läuft
✅ **Strukturierte Logs** - JSON für Maschinen, Markdown für Menschen
✅ **Konfigurierbar** - Anpassbar an Development/Production Bedarf
✅ **Aussagekräftig** - Wenn's kaputt geht, sehen wir genau wo
✅ **Scalable** - Log Level Down je eingefahren das System ist

**Ergebnis:** Kein mysteriöses "der Agent hat es gemacht", sondern genaue Sichtbarkeit in jeden Schritt.
