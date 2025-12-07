# Forge AI Examples

Hier findest du schrittweise Beispiele, um das Forge-AI-Framework zu lernen und zu testen.

## Struktur

Jedes Beispiel ist in einem eigenen Ordner organisiert mit:
- `requirements.md` - Das Feature-Anforderungsdokument (Template-konform mit YAML-Metadaten)
- `README.md` - Kurze Beschreibung und Ziele
- `output/` - Generierte Artefakte nach Ausführung

## Beispiele (nach Komplexität geordnet)

### 1. Hello World (`01-hello-world/`)
**Ziel:** Validierung der gesamten Forge-AI-Pipeline mit minimalem Feature.

**Was wird getestet:**
- ✅ Requirement-Parsing
- ✅ Functional Requirements Extraction
- ✅ Technical Specification Generation
- ✅ Documentation & PlantUML-Diagramme
- ✅ Report-Generierung (Markdown + JSON)
- ✅ Knowledge Base Persistence

**Ausführung:**
```bash
cd /workspaces/forge-ai
npm run init  # Initialize knowledge base
node packages/cli/forge.mjs execute --requirements=examples/01-hello-world/requirements.md
```

**Erwartete Output:**
- ✅ `forge-ai-work/<timestamp>/` Verzeichnis mit:
  - `functional-summary.json`
  - `technical-specification.json`
  - `feature-documentation.md`
  - `architecture.puml`, `sequence.puml`, `usecases.puml`
  - `execution-report.md` (detailliert mit PlantUML-Diagrammen)
- ✅ Eintrag in `knowledge/experiences.json`

---

### 2. Simple CLI (`02-simple-cli/`)
**Status:** Placeholder (wird nach Hello World implementiert)

**Ziel:** Etwas komplexeres CLI-Tool mit mehreren Funktionen und erweiterten Tests.

---

## Workflow pro Beispiel

1. **Review Requirements:** Öffne `requirements.md` und verstehe die Anforderungen.
2. **Execute Pipeline:** Laufe `forge execute --requirements=...`
3. **Review Report:** Öffne den generierten `execution-report.md` im `forge-ai-work/<timestamp>/`
4. **Check Artifacts:** Schau dir die generierten Dateien (Spezifikationen, Diagramme) an.
5. **Manual Curation:** Falls nötig, bearbeite manuell `knowledge/experiences.json` (z.B. `approved: true/false`).

## Report-Struktur

Jeder Execution-Report enthält:
- **Execution Summary:** Status, Dauer, Phasen
- **Phase Details:** Was jeder Agent gemacht hat
- **Generated Artifacts:** Liste aller Outputs
- **Metrics & Quality:** Testergebnisse, Linting, Coverage
- **Issues & Errors:** Allfällige Probleme
- **Architecture Diagrams:** PlantUML-Komponenten und Sequenzen
- **JSON Data:** Strukturierte Daten für maschinelle Verarbeitung

## Knowledge Base Management

Nach jeder Ausführung wird ein Eintrag in `knowledge/experiences.json` gespeichert:

```json
{
  "id": "exp_1733591234567",
  "timestamp": "2025-12-07T10:00:34Z",
  "requirementFile": "01-hello-world/requirements.md",
  "success": true,
  "approved": null,        // Du setzt das manuell
  "curator_notes": "",     // Deine Notizen
  "deleted": false         // Statt zu löschen, markieren
}
```

### Curation-Beispiele
```bash
# Noch nicht implementiert - placeholder für CLI-commands:
forge curate --id=exp_123 --approve=true --note="Clear requirement, good execution"
forge curate --id=exp_456 --delete  # Markiert als gelöscht
```

## Nächste Schritte

1. **Hello World durchfahren** → Verstehen der Pipeline
2. **Feedback geben** → Was funktioniert, was nicht?
3. **Agents implementieren** → TestAgent, ImplementationAgent
4. **Größere Beispiele hinzufügen** → Task Manager, Web App, etc.

---

**Fragen?** Schaue in die Orchestrator- und Agent-Quellcode für Details.
