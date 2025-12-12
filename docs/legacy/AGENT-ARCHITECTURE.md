# Forge AI - Agent Architecture (Refactored)

## Überblick

Alle Agenten folgen jetzt einer einheitlichen 3-Teil-Architektur:

```
Agent = Generic Definition + Requirement Context + Knowledge Base
```

Dadurch sind Agenten:
- ✅ **Wiederverwendbar** über beliebige Requirements hinweg
- ✅ **Lernfähig** (speichern Patterns und Strategien)
- ✅ **Keine Hardcodes** (generic + context-driven)
- ✅ **Debugbar** (klare Trennung von Logik und Daten)
- ✅ **Data-Isolated** (nur Input + Knowledge Base)

---

## ⚠️ KRITISCH: Agent Data Isolation

Ein Agent arbeitet AUSSCHLIESSLICH mit:

1. **Input:** Output aus vorherigem Agenten
2. **Knowledge Base:** Gelernte Patterns und Strategien
3. **NICHT:** Manuelle Daten, Framework-Fixes, Hardcodes

**Wenn ein Agent unvollständige Daten erhält:**

```javascript
// ❌ FALSCH: Fallback hinzufügen
const apis = requirement.apis || [{ name: 'default' }];

// ✅ RICHTIG: Strict Validation
this.assertRequiredInputFields(['apis', 'components']);
// → Wirft Error mit ROOT CAUSE Analysis
```

Der Error zeigt:
- Was fehlt
- Wo es fehlt (Requirement-Template oder vorheriger Agent)
- Wie es zu beheben ist (Template verbessern oder Agent-Logik)

**Dann:** Developer behebt ROOT CAUSE, nicht dieser Agent.

Siehe: [AGENT-DATA-FLOW.md](./AGENT-DATA-FLOW.md) und [ORCHESTRATOR-VALIDATION.md](./ORCHESTRATOR-VALIDATION.md)

---

## Architektur-Komponenten

### 1. BaseAgent (Abstraktion)

**Datei:** `packages/agents/baseAgent.mjs`

**Verantwortlichkeiten:**
- Prompt-Template Loading
- Context-Injection (Requirement-Daten in Prompts)
- Knowledge Base Management (Patterns, Strategien)
- **Data Validation** (assertRequiredInputFields)
- Logging und Telemetrie

**Methoden:**
```javascript
loadKnowledgeBase()                    // Lade gelernte Patterns
setRequirementContext(requirement)     // Speichere aktuelle Anforderung
loadPromptTemplate(key)                // Lade Prompt aus .prompt.txt
injectContext(prompt, vars)            // Injiziere Variablen in Prompt
buildFullPrompt(key, vars)             // Kombiniere: Prompt + Context + Patterns
learnPattern(pattern)                  // Speichere neues Muster
registerStrategy(strategy)             // Speichere neue Strategie
updatePatternSuccessRate(id, success)  // Aktualisiere Erfolgsrate
assertRequiredInputFields(fields)      // 🆕 Validierung mit ROOT CAUSE Feedback
```

### 2. Konkrete Agenten

Alle erben von `BaseAgent` und implementieren `execute()`:

#### **FunctionalRequirementsAgent**
```
functionalRequirementsAgent.mjs (Generic Definition)
├── Parst Requirements-Markdown
├── Extrahiert strukturierte Daten (keine Hardcodes)
├── Validiert gegen Requirements-Template
├── Lernt Patterns: "clear-user-story", "good-acceptance-coverage"
└── Output: functional-summary.json
```

#### **TechnicalRequirementsAgent**
```
technicalRequirementsAgent.mjs (Generic Definition)
├── Input: Output aus FunctionalRequirementsAgent
├── Validiert: functionalRequirements[], acceptanceCriteria[]
├── Transformiert fachliche in technische Anforderungen
├── Nutzt Prompts aus ./technical-requirements-agent/prompts/
├── Lernt Patterns: "api-design", "comprehensive-error-handling"
└── Output: technical-specification.json
```

#### **TestAgent**
```
testAgent.mjs (Generic Definition)
├── Input: Output aus TechnicalRequirementsAgent
├── Validiert: apis[], dataStructures[]
├── Generiert Tests aus technischer Spezifikation
├── Nutzt Prompts aus ./test-agent/prompts/
├── Lernt Patterns: "comprehensive-unit-testing"
└── Output: test-specification.json
```

#### **ImplementationAgent**
```
implementationAgent.mjs (Generic Definition)
├── Input: technical-spec.json + test-spec.json
├── Validiert: apis[], testCases[]
├── Generiert Code iterativ, validiert gegen Tests
├── Nutzt Prompts aus ./implementation-agent/prompts/
├── Lernt Patterns: "api-code-structure", aus Testfehlern
└── Output: Implementation files
```

---

## 3-Teil-Struktur pro Agent

### **Teil 1: Generic Definition** (Agent-Datei)

```javascript
// technicalRequirementsAgent.mjs

export class TechnicalRequirementsAgent extends BaseAgent {
  async execute(functionalSummaryPath) {
    // 1. Generische Logik, NO HARDCODES
    this.loadKnowledgeBase();
    const functionalSummary = loadJSON(functionalSummaryPath);
    this.setRequirementContext(functionalSummary);
    
    // 2. VALIDIERE Input (kein Fallback!)
    this.assertRequiredInputFields([
      'functionalRequirements',
      'acceptanceCriteria',
      'userStory',
    ]);
    
    // 3. Generiere mit generic algorithm
    const spec = this._generateTechnicalSpec();  // Generic, datengetrieben
    this._learnFromExecution(spec);              // Store patterns

    
    return spec;
  }
}
```

**Wichtig:** Nur generische Logik, keine Hardcodes!

### **Teil 2: Requirement Context**

Eingaben pro Ausführung:
```json
{
  "name": "hello-world",
  "version": "1.0",
  "priority": "high",
  "functionalRequirements": [
    "The tool outputs 'Hello, World!' without parameters"
  ],
  "acceptanceCriteria": [
    "GIVEN no parameters WHEN tool is called THEN 'Hello, World!' is printed"
  ]
}
```

Der Agent injiziert diese automatisch in seine Prompts via:
```javascript
agent.setRequirementContext(requirement);
// Später:
const fullPrompt = agent.buildFullPrompt('generic', {
  // Requirement context wird automatisch injiziert
});
```

### **Teil 3: Knowledge Base**

**Pro Agent eine Datei:** `knowledge/<agent-dir>-knowledge.json`

```json
{
  "version": "1.0",
  "agentName": "TechnicalRequirementsAgent",
  "patterns": [
    {
      "id": "pattern_1733591234567",
      "name": "api-design",
      "category": "technical-design",
      "description": "Generated 3 clear API specifications",
      "successRate": 0.85,
      "executionCount": 5,
      "successCount": 4,
      "timestamp": "2025-12-07T10:00:00Z"
    }
  ],
  "strategies": [
    {
      "id": "strategy_xxx",
      "name": "nodejs-rest-api",
      "prompt": "Design REST APIs with...",
      "successRate": 0.9
    }
  ]
}
```

**Patterns werden gelernt durch:**
- Erfolgreiche Ausführungen → Pattern speichern
- Testergebnisse → Success-Rate aktualisieren
- Feedback vom nächsten Agent → Muster erkennen

---

## Orchestrator Integration

Der Orchestrator nutzt die Agenten in dieser Reihenfolge:

```javascript
// Phase 2: Functional Requirements
const functionalAgent = new FunctionalRequirementsAgent({ projectRoot });
const funcSummary = await functionalAgent.execute(requirementsFile);

// Phase 3: Technical Requirements
const technicalAgent = new TechnicalRequirementsAgent({ projectRoot });
const techSpec = await technicalAgent.execute(functionalSummaryPath);

// Phase 5: Test Generation
const testAgent = new TestAgent({ projectRoot });
const testSpec = await testAgent.execute(technicalSpecPath);

// Phase 6: Implementation
const implAgent = new ImplementationAgent({ projectRoot });
const implResult = await implAgent.execute(technicalSpecPath, testSpecPath);
```

**Wichtig:** Jeder Agent lädt seine eigene Knowledge Base und aktualisiert sie nach der Ausführung.

---

## Prompt Templates

Agenten laden Prompts aus strukturierten Dateien (keine Hardcodes):

```
packages/agents/
├── technical-requirements-agent/
│   └── prompts/
│       ├── generic.prompt.txt              # Fallback template
│       ├── nodejs-api.prompt.txt           # Node.js-spezifisch
│       ├── react-component.prompt.txt      # React-spezifisch
│       └── generic-cli.prompt.txt          # CLI-Tools
├── test-agent/
│   └── prompts/
│       ├── unit-test.prompt.txt
│       └── e2e-test.prompt.txt
└── implementation-agent/
    └── prompts/
        ├── nodejs.prompt.txt
        └── react.prompt.txt
```

**Wie es funktioniert:**
1. Agent erkennt Tech-Stack aus Requirement (z.B. "Node.js CLI")
2. Lädt passenden Prompt (z.B. `generic-cli.prompt.txt`)
3. Injiziert Requirement Context
4. Fügt gelernte Patterns hinzu
5. Schickt zum LLM

---

## Lernprozess

### **Beispiel: TechnicalRequirementsAgent lernt**

```
Iteration 1 (hello-world):
├── Nutzt generic.prompt.txt
├── Generiert: 1 API, 2 DTOs, 3 error cases
├── Success-Rate: 1.0 (als neues Pattern gespeichert)
└── Knowledge Base: +1 Pattern "api-design" (80% success)

Iteration 2 (another-requirement):
├── Lädt Knowledge Base: findet "api-design" Pattern
├── buildFullPrompt() kombiniert:
│   ├── generic.prompt.txt
│   ├── Requirement Context
│   └── + "api-design" Pattern (80% success rate)
├── LLM hat jetzt Kontext von erfolgreicher Ausführung
└── Kann bessere API-Specs erzeugen
```

### **Feedback Loop (bei Test-Fehlschlägen)**

```
ImplementationAgent generiert Code
     ↓
TestAgent führt Tests aus
     ↓
Tests FAIL → Failures zurück an ImplementationAgent
     ↓
ImplementationAgent.learnFromTestFailures()
     ├── Analysiert failure patterns
     ├── Speichert: "failure-pattern-xyz" (0% success)
     └── Knowledge Base weiß: "Dieser Ansatz funktioniert nicht"
     ↓
Nächste Iteration nutzt dieses Wissen
```

---

## Wichtig: Keine Hardcodes!

❌ **FALSCH** (hardcoded):
```javascript
const apis = [
  { name: 'formatGreeting', ... },
  { name: 'parseArgs', ... }
];
```

✅ **RICHTIG** (generic + context):
```javascript
const apis = this.functionalSummary.functionalRequirements.map((req) => ({
  name: this._camelCaseFromString(req),
  description: req,
  // ...
}));
```

---

## Nächste Schritte

1. **Hello-World durchfahren** → Testen ob Agent-Architektur funktioniert
2. **Prompt-Templates schreiben** → Erste konkrete Prompts
3. **LLM-Integration** → Agents können jetzt Claude/GPT aufrufen
4. **Feedback-Loops** → Learning bei Testfehlern
5. **Dashboard** → Sehen wie Patterns sich verbessern

---

## File Structure

```
packages/agents/
├── baseAgent.mjs                    # Abstract Base Class
├── functional-requirements-agent.mjs
├── technical-requirements-agent.mjs
├── test-agent.mjs
├── implementation-agent.mjs
├── documentationAgent.mjs
├── agentInteractionManager.mjs
├── functional-requirements-agent/
│   └── prompts/
│       └── generic.prompt.txt
├── technical-requirements-agent/
│   └── prompts/
│       ├── generic.prompt.txt
│       ├── nodejs-api.prompt.txt
│       └── ...
├── test-agent/
│   └── prompts/
│       └── generic.prompt.txt
└── implementation-agent/
    └── prompts/
        └── generic.prompt.txt

knowledge/
├── functional-requirements-agent-knowledge.json
├── technical-requirements-agent-knowledge.json
├── test-agent-knowledge.json
└── implementation-agent-knowledge.json
```

Jeder Agent hat eigene Knowledge Base → unabhängiges Lernen, keine gegenseitigen Abhängigkeiten.
