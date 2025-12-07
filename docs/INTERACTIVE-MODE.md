# Interactive Step-by-Step Mode

## Overview

Forge AI kann im **Interactive Mode** ausgeführt werden, bei dem nach jedem Phasenschritt pausiert wird, damit der Benutzer:

1. ✅ **Outputs sehen** - Was der Agent gerade gemacht hat
2. ✅ **Verstehen** - Wie die Daten fließen
3. ✅ **Debuggen** - Auf Details schauen wenn nötig
4. ✅ **Lernen** - Verstehen wie das System funktioniert

Perfect für:
- 🎓 **Demos** - Zeigen wie Forge AI funktioniert
- 📚 **Training** - Teams lernen das System
- 🐛 **Debugging** - Finden wo Probleme sind
- 🔍 **Verständnis** - Sehen jede Agent-Interaktion

---

## Two Modes

### 🎯 Interactive Mode (Default)
```bash
forge execute --requirements=my-feature.md --interactive
# ODER
node packages/orchestrator/demo-interactive.mjs --interactive
```

**Nach jedem Phasenschritt:**
- Outputs anzeigen
- User fragt: "Press ENTER to continue..."
- Optional: Logs anschauen, Outputs speichern

### ⚡ Automatic Mode
```bash
forge execute --requirements=my-feature.md
# ODER
node packages/orchestrator/demo-interactive.mjs --auto
```

**Durchlauft ohne Pausen** - schnell, für Production

---

## Usage - Interactive Mode

### Start mit Demo

```bash
node packages/orchestrator/demo-interactive.mjs --interactive
```

**Workflow:**
1. System zeigt Phase-Header
2. Agent führt Arbeit aus
3. System zeigt Output-Preview
4. User sieht Prompt:
   ```
   Press ENTER to continue, or:
     'log'  - Show detailed logs
     'save' - Save output to file
     'exit' - Stop execution
   ```
5. User kann:
   - **ENTER** drücken → zum nächsten Phase
   - **'log'** eingeben → detaillierte Logs dieser Phase
   - **'save'** eingeben → Phase-Output als JSON speichern
   - **'exit'** eingeben → Execution stoppen

---

## Example Output

### Phase Start

```
══════════════════════════════════════════════════════════
PHASE 2: Extract Functional Requirements
Status: STARTING
══════════════════════════════════════════════════════════
```

### Phase Complete

```
──────────────────────────────────────────────────────────
✓ PHASE 2 COMPLETED: Extract Functional Requirements
Duration: 0.82s
──────────────────────────────────────────────────────────

Output Preview:
  functionalRequirements:
    • FR-1: Email Input Validation
    • FR-2: Password Encryption
    • FR-3: Session Management
  acceptanceCriteria:
    • GIVEN user enters valid email and password...
    • GIVEN user enters invalid email...
    ... and 1 more items
```

### Interactive Pause

```
══════════════════════════════════════════════════════════
PHASE PHASE 2 OUTPUT PREVIEW
══════════════════════════════════════════════════════════
  functionalRequirements:
    • FR-1: Email Input Validation
    • FR-2: Password Encryption
    ...

══════════════════════════════════════════════════════════
Press ENTER to continue to next phase, or type a command:
  'log'  - Show detailed logs from this phase
  'save' - Save phase output to file
  'exit' - Stop execution
══════════════════════════════════════════════════════════
_
```

---

## Commands During Pause

### `ENTER` - Continue to Next Phase
```bash
(just press ENTER)
```
→ Workflow continues to next phase

### `log` - Show Detailed Logs
```bash
log
```

Shows:
```
──────────────────────────────────────────────────────────
DETAILED LOGS - PHASE 2
──────────────────────────────────────────────────────────

[10:35:42.123] [DEBUG] Initializing FunctionalRequirementsAgent
[10:35:42.456] [DEBUG] Context set: Processing "feature-login"
[10:35:42.789] [DEBUG] Loading prompt template: parse-functional-reqs
[10:35:43.012] [DEBUG] Injecting context variables
[10:35:43.345] [DEBUG] ← FunctionalRequirementsAgent completed
  Context: { agent: "FunctionalRequirementsAgent", outputKeys: [...] }
```

Then:
```
Press ENTER to continue...
(you can choose another command)
```

### `save` - Save Phase Output
```bash
save
```

Output:
```
✓ Phase 2 output saved to: 
  forge-ai-work/execution-2025-12-07.../phase-2-output.json
```

Then shows output preview again.

### `exit` - Stop Execution
```bash
exit
```

Output:
```
⚠️  Execution stopped by user
```

---

## Output Structure

Nach Interactive Execution:

```
forge-ai-work/
├── execution-2025-12-07T10-30-45-123/
│   ├── execution.log                    ← All logs (JSON)
│   ├── workflow-state.json              ← State snapshot
│   ├── execution-report.md              ← Full report
│   ├── phase-1-output.json              ← Phase 1 (if user saved)
│   ├── phase-2-output.json              ← Phase 2 (if user saved)
│   └── ...
```

---

## Typical Demo Flow

```
1. Start
   ↓
2. Parse Requirement
   [User presses ENTER]
   ↓
3. Extract Functional Requirements
   [User sees: 3 requirements extracted]
   [User presses ENTER]
   ↓
4. Technical Specification
   [User sees: 3 APIs designed]
   [User types: 'save' to save output]
   [Then presses ENTER]
   ↓
5. Design Architecture
   [User sees: Component diagram]
   [User presses ENTER]
   ↓
... (continue for remaining phases)
   ↓
9. Final Report
   [Shows summary dashboard]
   [Shows link to full report]
```

---

## For Presentations

Perfect for live demos:

### Setup
```bash
cd forge-ai
npm install
npm run init
```

### Run Demo
```bash
node packages/orchestrator/demo-interactive.mjs --interactive
```

### Walk Through
1. Start demo
2. After each phase, explain what happened
3. Use `log` command to show details if needed
4. Use `save` command to show file being created
5. At end, show the execution-report.md

---

## Configuration

```javascript
const orchestrator = new InteractiveOrchestrator({
  interactive: true,           // Enable interactive mode
  logLevel: 'DEBUG',          // Log detail level
  requirementName: 'my-feature', // For output naming
  outputDir: './forge-ai-work', // Where to save
});
```

---

## Log Levels in Interactive Mode

### VERBOSE
```
Most detailed - see every decision
Perfect for: Learning, deep debugging
Output: Very much
```

### DEBUG (Recommended)
```
Agent internals, validation results
Perfect for: Understanding what happened
Output: Moderate
```

### INFO
```
Only major milestones
Perfect for: Just seeing progress
Output: Minimal
```

---

## Tips

### For Learning
```bash
# Use VERBOSE to see everything
LOG_LEVEL=VERBOSE node packages/orchestrator/demo-interactive.mjs --interactive
```

### For Debugging
```bash
# Use the 'log' and 'save' commands to inspect details
```

### For Demos
```bash
# Use INFO level, pauses let you explain each phase
LOG_LEVEL=INFO node packages/orchestrator/demo-interactive.mjs --interactive
```

---

## Summary

**Interactive Mode macht Forge AI transparent und educational:**

✅ Schrittweise Ausführung
✅ Outputs sichtbar nach jedem Phase
✅ Zeit zum Verstehen zwischen Phasen
✅ Debugging möglich (logs, saves)
✅ Perfect für Demos und Training

**Result:** Nicht einfach nur "das System machte etwas", sondern **man sieht genau was und warum**! 🎯
