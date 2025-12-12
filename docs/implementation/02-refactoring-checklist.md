# Refaktoring Checkliste - RVD-basierte Agent-Architektur

## 📋 Status

Die neue generische Agent-Architektur ist implementiert mit:
- ✅ `RVDManager` (zentrale Verwaltung)
- ✅ `ImplementationAgent` (refaktoriert & getestet)
- ✅ Automatische Code-Generierung
- ✅ Test-Suite zur Validierung

## 🔧 Agenten zum Refaktorieren

Jeder Agent sollte folgendes Pattern implementieren:

```javascript
export class XyzAgent extends BaseAgent {
  async execute(rvdPath) {
    // 1. Lade RVD
    this.rvd = RVDManager.loadRVD(rvdPath);
    
    // 2. Hole Input aus RVD (Output von Phase N-1)
    const input = RVDManager.getPhaseInput(this.rvd, '<this-phase>');
    
    // 3. Verarbeite generisch (keine Hardcodes!)
    const output = await this.processGeneric(input);
    
    // 4. Lerne Patterns
    this.learnPattern({...});
    
    // 5. Speichere Output in RVD
    RVDManager.updatePhase(this.rvd, '<this-phase>', output);
    RVDManager.saveRVD(this.rvdPath, this.rvd);
    
    return output;
  }
}
```

### Phase 1: Parse Requirements
- **Agent:** Orchestrator (nicht refaktorieren)
- **Input:** `requirements.md` (Datei)
- **Output:** Parsed Requirement Object
- **RVD Phase:** `1-parse-requirements`

### Phase 2: Functional Requirements
- **Status:** ⏳ Zu refaktorieren
- **Agent:** `FunctionalRequirementsAgent` in `packages/agents/functional-requirements-agent.mjs`
- **Input:** Phase 1 Output (Requirement metadata)
- **Output:**
  ```json
  {
    "functionalRequirements": ["req1", "req2", ...],
    "acceptanceCriteria": [...],
    "userStories": [...],
    "patterns": ["clear-user-story", ...]
  }
  ```
- **RVD Phase:** `2-functional-requirements`
- **Aufgaben:**
  - [ ] Lösche alte hardcodierte Outputs
  - [ ] Ändere Input-Quelle: `rvdPath` statt einzelne Dateien
  - [ ] Verwende `RVDManager.getPhaseInput()` für Input
  - [ ] Verwende `RVDManager.updatePhase()` für Output
  - [ ] Teste mit hello-world Requirement

### Phase 3: Technical Specification
- **Status:** ⏳ Zu refaktorieren
- **Agent:** `TechnicalRequirementsAgent` in `packages/agents/technical-requirements-agent.mjs`
- **Input:** Phase 2 Output (Functional Requirements)
- **Output:**
  ```json
  {
    "apis": [
      {
        "name": "functionName",
        "description": "...",
        "signature": {
          "parameters": [...],
          "returns": {...}
        },
        "validation": [...],
        "implementation": {
          "template": "function-with-validation|transform-function|cli-handler"
        }
      }
    ],
    "dataStructures": [...],
    "errorHandling": [...],
    "patterns": [...]
  }
  ```
- **RVD Phase:** `3-technical-specification`
- **Aufgaben:**
  - [ ] Lösche alte Outputs
  - [ ] Ändere Input-Quelle
  - [ ] Generiere APIs mit "template" Feld (für ImplementationAgent)
  - [ ] Teste mit hello-world

### Phase 4: Architecture & Design
- **Status:** ⏳ Zu refaktorieren (Optional für v1)
- **Agent:** `ArchitectureAgent`
- **Input:** Phase 3 Output (Technical Spec)
- **Output:**
  ```json
  {
    "components": [...],
    "diagrams": {
      "architecture": "@startuml...",
      "sequence": "@startuml..."
    }
  }
  ```
- **RVD Phase:** `4-architecture-design`

### Phase 5: Test Generation
- **Status:** ⏳ Zu refaktorieren
- **Agent:** `TestAgent` in `packages/agents/test-agent.mjs`
- **Input:** Phase 3 Output (Technical Spec)
- **Output:**
  ```json
  {
    "testCases": [
      {
        "id": "test-1",
        "api": "apiName",
        "description": "...",
        "scenario": "...",
        "expectedOutput": "...",
        "testCode": "const result = api(); assert.equal(...);"
      }
    ],
    "testFramework": "node:test|jest|mocha",
    "testCommand": "npm test"
  }
  ```
- **RVD Phase:** `5-test-generation`
- **Aufgaben:**
  - [ ] Lösche alte Outputs
  - [ ] Ändere Input-Quelle
  - [ ] Generiere `testCode` Feld mit echtem Test-Code
  - [ ] Teste mit hello-world

### Phase 6: Implementation ✅ (DONE)
- **Status:** ✅ Bereits refaktoriert
- **Agent:** `ImplementationAgent` in `packages/agents/implementation-agent-rvd.mjs`
- **Input:** Phase 3 + Phase 5 Outputs
- **Output:** Generierte Source Code & Test Dateien
- **RVD Phase:** `6-implementation`

### Phase 7: Code Review
- **Status:** ⏳ Zu refaktorieren
- **Agent:** `ReviewAgent`
- **Input:** Phase 6 Output (Implementation)
- **Output:**
  ```json
  {
    "feedback": [...],
    "issues": [...],
    "approved": true|false,
    "suggestedChanges": [...]
  }
  ```
- **RVD Phase:** `7-code-review`

### Phase 8: Documentation
- **Status:** ⏳ Zu refaktorieren
- **Agent:** `DocumentationAgent` in `packages/agents/documentationAgent.mjs`
- **Input:** Phase 3 + Phase 6 Outputs
- **Output:**
  ```json
  {
    "documentation": {
      "readme": "# ...",
      "apiDocs": "...",
      "examples": "..."
    },
    "diagrams": {
      "architecture": "@startuml...",
      "usecases": "@startuml..."
    }
  }
  ```
- **RVD Phase:** `8-documentation`

### Phase 9: Deployment
- **Status:** ⏳ Zu refaktorieren
- **Agent:** `DeploymentAgent` in `packages/agents/deploy-agent.mjs`
- **Input:** Phase 6 + Phase 8 Outputs
- **Output:**
  ```json
  {
    "docker": {
      "dockerfile": "...",
      "dockerCompose": "..."
    },
    "deployment": {
      "scripts": ["deploy.sh", "rollback.sh"],
      "documentation": "DEPLOYMENT.md"
    }
  }
  ```
- **RVD Phase:** `9-deployment`

## 🧪 Test-Strategie

Für jede Phase:

1. **Unit Tests für den Agent:**
   ```bash
   npm test -- packages/agents/<agent-name>.test.js
   ```

2. **Integration Test mit RVD:**
   ```javascript
   // Erstelle Mock-RVD
   const rvd = RVDManager.createRVD('test-feature');
   RVDManager.updatePhase(rvd, 'N-1', mockOutput);
   
   // Führe Agent aus
   const agent = new MyAgent();
   const output = await agent.execute(rvdPath);
   
   // Validiere Output
   assert(output.someField === expectedValue);
   ```

3. **End-to-End mit hello-world:**
   ```bash
   node test-rvd-architecture.mjs
   ```

## 📊 Migrationsplan

1. **Woche 1:** Functional + Technical Requirements Agenten
2. **Woche 2:** Test + Review + Documentation Agenten
3. **Woche 3:** Deployment Agent + Orchestrator Update
4. **Woche 4:** Integration Tests + Validation

## ✅ Akzeptanzkriterien pro Agent

- [ ] Agent akzeptiert `rvdPath` als Eingabe
- [ ] Agent ruft `RVDManager.getPhaseInput()` auf
- [ ] Agent hat keine hardcodierten Feature-Codes
- [ ] Agent ruft `RVDManager.updatePhase()` auf
- [ ] Agent speichert RVD mit `RVDManager.saveRVD()`
- [ ] Agent funktioniert mit hello-world Requirement
- [ ] Unit Tests bestehen
- [ ] Integration Tests bestehen
- [ ] Dokuement ist aktualisiert

## 🚀 Wie man anfängt

### 1. Backup erstellen
```bash
cd /workspaces/forge-ai
git commit -am "Backup before RVD refactoring"
```

### 2. Wähle einen Agent aus
```bash
# Z.B. FunctionalRequirementsAgent
cp packages/agents/functional-requirements-agent.mjs \
   packages/agents/functional-requirements-agent-rvd.mjs
```

### 3. Refaktoriere
- Öffne die neue Datei
- Benutze das `ImplementationAgent` als Template
- Ersetze hardcodierte Outputs durch generische Verarbeitung
- Verwende `RVDManager` API

### 4. Teste
```bash
node test-rvd-architecture.mjs
```

## 📞 Hilfreiche Links

- [RVD Manager API](./packages/orchestrator/rvdManager.mjs)
- [Implementation Agent Template](./packages/agents/implementation-agent-rvd.mjs)
- [Test & Demo](./test-rvd-architecture.mjs)
- [Architektur-Dokumentation](./ARCHITECTURE-AGENT-DATA-FLOW.md)

---

**Ziel:** Alle Agenten folgen dem gleichen generischen Muster = Skalierbar, Wartbar, Erweiterbar
