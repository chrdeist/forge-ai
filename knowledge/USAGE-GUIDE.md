# Forge AI Knowledge Base - Verwendungsanleitung für Agenten

## 📖 Überblick

Die Knowledge Base speichert **Experiences** (Was wir gelernt haben) und **Strategies** (Wie wir diese Learnings anwenden).

### Struktur

```
experiences.json       = Dokumentierte Erkenntnisse aus früheren Workflows
├─ 7 Experiences (exp-001 bis exp-007)
├─ quality_metrics (Global: Workflow, Code-Effizienz, Features, Tests, Ressourcen)
├─ strategy_rankings (Was ist wichtig?)
└─ critical_success_factors (Was darf NIEMALS vergessen werden?)

strategies.json        = Systematische Strategien zur Problemlösung
├─ 4 Strategies (strat-001 bis strat-004)
└─ quality_threshold (Mindeststandards)
```

---

## 🎯 Wie Agenten diese Knowledge Base NUTZEN

### Phase 2: Functional Requirements Agent

**Diese Experiences beachten:**
- `exp-001`: Entry Point MUSS explizit definiert werden
- `critical_success_factor`: Entry points must flow through all phases

**Aktion:**
```javascript
// In Functional Requirements immer definieren:
{
  entryPoint: 'src/index.js',  // NICHT optional!
  acceptanceCriteria: [
    'Application starts from src/index.js',
    'All phases propagate this value'
  ]
}
```

### Phase 3: Technical Specification Agent

**Diese Experiences beachten:**
- `exp-001`: Technische Specs müssen Entry Point enthalten
- `exp-005`: Agent Collaboration: Specs → Phase 6 → Phase 10

**Aktion:**
```javascript
// Immer im Output enthalten:
technicalRequirements: {
  apis: [
    {
      name: 'main',
      path: 'src/index.js',  // Aus Phase 2 extrahiert
      type: 'CLI'
    }
  ],
  nodeVersion: '22',
  // ... weitere Specs
}
```

### Phase 6: Implementation Agent

**Diese Experiences beachten:**
- `exp-007`: Template literals MÜSSEN mit ` arbeiten, nicht \`
- `strat-004`: Vor Datei-Output MUSS Syntax-Check erfolgen

**Aktion:**
```javascript
// IMMER vor fs.writeFileSync():
const syntaxCheck = require('node -c');
try {
  execSync(`node -c ${generatedFilePath}`);
} catch (e) {
  throw new SyntaxError(`Generated code has syntax error: ${e.message}`);
}
```

### Phase 10: Deploy Agent

**Diese Experiences beachten:**
- `exp-002`: Single-Stage Dockerfile > Multi-Stage (0.92 vs 0.78)
- `exp-003`: Services aus technicalRequirements
- `exp-004`: Artifact Writing with validation
- `exp-006`: Dockerfile Gotchas (Alpine missing curl, etc.)
- `strat-002`: Node.js Alpine ist IMMER erste Wahl
- `strat-003`: 6 Artifacts in richtiger Reihenfolge

**Aktion:**
```javascript
// 1. Entry Point aus Phase 3 extrahieren
const entryPoint = output.technicalRequirements?.apis[0]?.path;

// 2. Single-Stage Dockerfile generieren
const dockerfile = `
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
RUN npm test  // WICHTIG: Tests im Build!
ENTRYPOINT ["node", "${entryPoint}"]
`;

// 3. Validation VOR Output
validateDeploymentArtifacts(dockerfile, compose);

// 4. Schreiben + Logging
writeAndLog(files);
```

---

## 🔍 Quality Metrics - Was ist WIRKLICH wichtig?

```
RANKING der Importance:

Rank 1 (APPLY_ALWAYS - 100% Workflow blocker):
  ✅ exp-001: Entry Point Propagation
  ✅ exp-005: Agent Collaboration Patterns
  ✅ exp-007: Template Literal Syntax
  ✅ strat-001: Entry Point Propagation Strategy
  ✅ strat-002: Dockerfile Generation
  ✅ strat-004: Code Generation Syntax Validation

Rank 2 (APPLY_ALWAYS - 90% Efficiency):
  ✅ exp-002: Dockerfile Structure
  ✅ exp-003: Docker Compose Generation
  ✅ exp-004: Deployment Artifact Writing
  ✅ exp-006: Dockerfile Gotchas (8 Fallstricke)
  ✅ strat-003: Deployment Coordination

Rank 3 (APPLY_CONDITIONALLY - 80%+):
  ⚠️ Optimierungen für spezifische Use-Cases

Rank 4 (APPLY_RARELY - Optional):
  ⚠️ Nicht-kritische Verbesserungen
```

---

## 💾 Token-Effizienz: Was kostet was?

```
DOCKERFILE ANSÄTZE:
  Single-Stage:    1500 tokens, 0.92 success → USE THIS
  Multi-Stage:     2800 tokens, 0.78 success → 87% MORE TOKENS!
  
ALPINE VARIANTS:
  node:22-alpine:  800 tokens, 0.95 success  → ALWAYS
  node:22:         1400 tokens, 0.65 success → RARELY

DOCKER COMPOSE:
  Simple Service:  400 tokens, 0.90 success  → ALWAYS
  Complex Multi:   1200 tokens, 0.75 success → RARELY
```

**RULE**: Wenn Success-Rate < 0.85, NICHT verwenden außer für edge-cases.

---

## 🚨 Critical Success Factors - DARF NICHT VERGESSEN WERDEN

Diese 5 Faktoren sind NICHT optional:

1. **Entry points must flow through all phases**
   - Phase 2: Definieren
   - Phase 3: Specs
   - Phase 6: Generate
   - Phase 10: Deploy
   - Impact: 100% Workflow

2. **Technical specs propagated to Phase 10**
   - Phase 6 output MUSS technicalRequirements enthalten
   - Impact: 90% Code Correctness

3. **Tests run during Docker build**
   - `RUN npm test` in Dockerfile
   - Impact: 100% Test Quality

4. **Dockerfile references correct entry point**
   - `ENTRYPOINT ["node", "src/index.js"]` (aus Phase 3!)
   - Impact: 100% Phase 10 Success

5. **Template literals use backticks NOT escaped backticks**
   - Richtig: `${variable}`
   - Falsch: \`${variable}\`
   - Impact: 100% Prevents SyntaxError

---

## 📋 Wie Agents die Knowledge Base UPDATING

Nach jedem Workflow:

1. **Fehler protokollieren**
   ```javascript
   newExperience = {
     id: 'exp-NNN',
     context: 'Phase X error: ...',
     solution: '...',
     success_rate: 0.XX,
     quality_assessment: { /* 5 metrics */ }
   }
   ```

2. **Pattern erkennen**
   - Tritt Fehler wiederholt auf?
   - Gilt die Lösung für mehrere Fälle?
   - → Neue Experience oder Update bestehender

3. **Strategien weiterentwickeln**
   - Funktioniert eine Strategie weniger gut als erwartet?
   - Token-Kosten optimieren
   - Success-Rate verbessern

---

## ✅ Verifizierungs-Checkliste

Vor jedem Workflow-Start:

- [ ] Knowledge Base ist aktuell (last_updated < 1 Tag)
- [ ] Alle Rank-1 Experiences sind Agenten bekannt
- [ ] Critical Success Factors sind in Phase-Code integriert
- [ ] Template Literal Syntax wird validiert
- [ ] Deployment Artifacts werden vor Writing validiert

Nach jedem Workflow:

- [ ] Alle 10 Phasen erfolgreich (9.67s ist Baseline)
- [ ] Tests 100% bestanden
- [ ] Code Review APPROVED
- [ ] Keine SyntaxErrors
- [ ] Knowledge Base aktualisiert

---

## 📞 Kontakt & Feedback

Bei Fragen zu Experiences oder Strategies:

1. **Suche** in experiences.json nach relevanten IDs
2. **Lese** quality_assessment für Importance
3. **Prüfe** critical_success_factors
4. **Nutze** ranking_rules für Prioritäten

**Letzter Workflow:** 2025-12-07, 9.67s, 100% erfolgreich ✅
