# Forge AI Framework - Development Guide

## Was ist Forge AI?

**Forge AI** ist ein selbstlernendes Framework für den agentiellen Software-Entwicklungsprozess.

Ein Entwickler gibt Requirements als strukturiertes Markdown-Dokument ein, und Forge AI orchestriert automatisch:
- Fachliche Anforderungen extrahieren
- Technische Spezifikationen generieren
- Tests definieren
- Code implementieren (iterativ)
- Code reviewen
- Dokumentation schreiben

Mit jeder Ausführung lernt Forge AI aus Erfolgsmuster und Fehlern.

---

## Für Projekt-Teams: Framework als Template

### Workflow

1. **Basis Setup (einmalig)**
   ```bash
   git clone https://github.com/your-org/forge-ai.git my-project
   cd my-project
   npm install
   npm run init
   ```

2. **Projekt konfigurieren**
   ```
   my-project/
   ├── packages/                    # ← Unverändert (Framework-Code)
   ├── knowledge/                   # ← Shared learnings (gits synced)
   ├── examples/                    # ← Forge-AI test examples
   ├── my-app/                      # ← YOUR PROJECT (neu)
   │   ├── requirements/
   │   │   ├── feature-1.md
   │   │   └── feature-2.md
   │   ├── src/
   │   ├── tests/
   │   └── docs/
   ├── .gitignore                   # ← Exclude my-app/src, my-app/tests
   └── DEVELOPMENT.md               # ← Dein spezifisches Setup
   ```

3. **Feature umsetzen**
   ```bash
   # 1. Requirement schreiben
   cat > my-app/requirements/feature-new.md << 'EOF'
   ---
   name: "my-awesome-feature"
   ...
   EOF

   # 2. Forge AI ausführen
   node packages/cli/forge.mjs execute --requirements=my-app/requirements/feature-new.md

   # 3. Report reviewen
   cat forge-ai-work/<timestamp>/execution-report.md

   # 4. Knowledge aktualisieren (optional)
   # Knowledge Base wird automatisch gesynced
   ```

4. **Knowledge zurück in Framework geben**
   ```bash
   git add knowledge/
   git commit -m "Learn: pattern XYZ from my-app"
   git push  # → Forge AI Framework repo gets updated
   ```

---

## Framework-Struktur (Do not modify)

```
packages/
├── agents/                     ← Framework Agenten (generic)
│   ├── baseAgent.mjs           ← Abstraktion
│   ├── functional-requirements-agent.mjs
│   ├── technical-requirements-agent.mjs
│   ├── test-agent.mjs
│   ├── implementation-agent.mjs
│   └── ...
├── orchestrator/               ← Orchestrator + Reports
│   ├── softwareLifecycleOrchestrator.mjs
│   ├── reportGenerator.mjs
│   └── ...
├── cli/                        ← CLI Entrypoint
│   └── forge.mjs
├── core/                       ← Core modules
│   └── ...
└── strategies/                 ← Strategien (später)
```

**Diese Ordner sind shared und synced via Git.**

---

## ⚠️ KRITISCH: Agent Data Isolation

Jeder Agent arbeitet NUR mit:
1. ✅ Output des vorherigen Agenten
2. ✅ Patterns aus Knowledge Base
3. ❌ KEINE manuellen Daten
4. ❌ KEINE Framework-Interventionen
5. ❌ KEINE Hardcodes

**Wenn ein Agent fehlende Daten meldet:**
- ❌ NICHT: "Ich füge einen Default hinzu"
- ✅ RICHTIG: Error wirft und zeigt ROOT CAUSE
  - Ist die Requirement-Template unvollständig?
  - Hat der vorherige Agent nicht extrahiert?
  
**Dann:** Template oder vorheriger Agent wird verbessert, nicht dieser Agent.

Siehe: [docs/AGENT-DATA-FLOW.md](docs/AGENT-DATA-FLOW.md) und [docs/ORCHESTRATOR-VALIDATION.md](docs/ORCHESTRATOR-VALIDATION.md)

---

## Dein Projekt-Setup

```
my-app/                         ← Dein Application Folder
├── requirements/               ← Requirement-Dateien (Template-konform)
│   ├── feature-login.md
│   ├── feature-tasks.md
│   └── ...
├── src/                        ← Generated + modified code
├── tests/                      ← Generated + modified tests
├── docs/                       ← Generated + modified docs
└── README.md                   ← Dein Projekt-README
```

**Diese Ordner sind lokal und in Gitignore (oder separate branch).**

---

## Workflow für Team-Mitglieder

### Setup (einmalig)
```bash
# 1. Clone Framework
git clone https://github.com/your-org/forge-ai.git my-project
cd my-project

# 2. Install dependencies
npm install

# 3. Initialize knowledge base
npm run init

# 4. Create your project structure
mkdir -p my-app/requirements
mkdir -p my-app/src
mkdir -p my-app/tests
```

### Feature entwickeln
```bash
# 1. Write requirement
cat > my-app/requirements/new-feature.md << 'EOF'
---
name: "feature-name"
version: "1.0"
priority: "high"
...
EOF

# 2. Execute Forge AI
node packages/cli/forge.mjs execute --requirements=my-app/requirements/new-feature.md

# 3. Review generated artifacts
ls -la forge-ai-work/*/

# 4. Integrate with your project
# - Copy generated files to my-app/src/
# - Adapt as needed
# - Run your own tests
# - Commit to your project repo (or branch)

# 5. Share learning (optional)
git add knowledge/
git commit -m "chore: update knowledge from feature-X"
git push origin main  # Back to framework repo
```

### Knowledge synchronization
```bash
# Pull latest learnings from framework
git pull origin main

# Your changes automatically use improved patterns
```

---

## Best Practices

### Requirements schreiben
- ✅ Sei detailliert und spezifisch
- ✅ Nutze das Template aus `docs/requirements/feature-template.md`
- ✅ Schreibe User Stories in korrekter Form
- ✅ Definiere klare Akzeptanzkriterien
- ✅ Liste Schnittstellen/APIs auf

### Code integrieren
- ✅ Generated Code ist ein Startwert (Stubs)
- ✅ Review Code quality manuell
- ✅ Adapt für dein spezifisches Setup
- ✅ Schreibe zusätzliche Test-Cases bei Bedarf
- ✅ Commit mit aussagekräftigen Messages

### Knowledge teilen
- ✅ Nach erfolgreichen Features: `knowledge/` updaten
- ✅ Push zu Forge AI Framework
- ✅ Andere Teams profitieren von deinen Learnings

### Issues tracken
Wenn Agenten nicht gut funktionieren:
1. Dokumentiere das Requirement
2. Check execution report in `forge-ai-work/<timestamp>/`
3. Review Knowledge Base Patterns
4. Öffne Issue im Framework Repo

---

## Commands

```bash
# Execute a requirement
node packages/cli/forge.mjs execute --requirements=path/to/req.md

# View dashboard (later)
node packages/cli/forge.mjs dashboard

# Trigger evolution (later)
node packages/cli/forge.mjs evolve

# Initialize knowledge (usually only once)
npm run init
```

---

## Struktur der Ausführung

```
my-app/requirements/feature.md
    ↓
forge execute
    ↓
  Phase 1: Parse Requirements
  Phase 2: Extract Functional Requirements
  Phase 3: Generate Technical Specification
  Phase 4: Architecture & Design
  Phase 5: Test Generation
  Phase 6: Implementation (iterative)
  Phase 7: Code Review
  Phase 8: Documentation
  Phase 9: Persist Metrics
    ↓
forge-ai-work/<timestamp>/
├── execution-report.md          ← Detaillierter Report (READ THIS!)
├── functional-summary.json
├── technical-specification.json
├── technical-specification.md
├── feature-documentation.md
├── architecture.puml            ← PlantUML Diagramme
├── sequence.puml
└── usecases.puml
    ↓
knowledge/
├── experiences.json             ← Alle Ausführungen + Metriken
├── strategies.json
├── functional-requirements-agent-knowledge.json
├── technical-requirements-agent-knowledge.json
└── ...
```

---

## Repository Management

### Forge AI Repo (Main Framework)
- **Location:** `github.com/your-org/forge-ai`
- **Branch:** `main`
- **Protection:** Nur Framework-Code + Knowledge Base
- **CI/CD:** (später) Test suites für Agent-Qualität

```
forge-ai/
├── packages/                    ← Framework Agenten & Core
├── knowledge/                   ← Shared Knowledge Base
├── examples/                    ← Test Examples (Hello World, etc.)
├── docs/                        ← Framework Documentation
└── .github/                     ← GitHub Actions (später)
```

### Dein Projekt Repo (optional, später)
```
my-project/
├── requirements/                ← Deine Requirements
├── src/                         ← Dein Code
├── tests/                       ← Deine Tests
└── DEVELOPMENT.md
```

Oder als **Branch** im Fork:
```
fork of forge-ai
├── main               ← Keep synced with upstream
├── my-project         ← Dein Feature Branch
└── ...
```

---

## Häufige Fragen

### Q: Wie versioniere ich mein Projekt Code?
**A:** Es gibt mehrere Optionen:
1. **Separate Repo:** `my-project` als eigenständiges Repo
2. **Branch:** `my-project` Branch im Fork von forge-ai
3. **Subfolder:** `my-app/` im Forge-AI Repo (mit `.gitignore`)

Wir empfehlen zunächst Option 3 (einfach) → später zu Option 1 (sauberer).

### Q: Wie teile ich Knowledge mit anderen Teams?
**A:** Pushe `knowledge/` zum Forge-AI Framework:
```bash
git add knowledge/
git commit -m "Learn: pattern X from project Y"
git push origin main
# Other teams: git pull → get your improvements
```

### Q: Was mache ich mit generated Code, der nicht passt?
**A:** 
1. Review den Report
2. Optimize das Requirement (klarer schreiben)
3. Adapt den generierten Code manuell
4. Report ein Issue zum Framework

### Q: Kann ich Agents customizen?
**A:** Nein (noch nicht). Agents sind Framework-Code.
- Aber: Du kannst Prompts verbessern via Knowledge Base
- Später: Custom Agents in eigenem Repo

---

## Next Steps

1. **Fork oder Clone** Forge AI Framework
2. **Setup** dein `my-app/` Verzeichnis
3. **Schreib dein erstes Requirement**
4. **Run Forge AI** und review den Output
5. **Share Learnings** via Knowledge Base
