# Forge AI Knowledge Base - Rule-Based System

## Überblick

Die Knowledge Base wurde von einem Pattern-basierten System auf ein **regelbasiertes WENN-DANN System** umgestellt.

### Vorher (Pattern-basiert)
- ❌ 138+ redundante Pattern-Einträge
- ❌ Keine klare Struktur
- ❌ Schwer zu warten
- ❌ Token-ineffizient

### Nachher (Regelbasiert)
- ✅ 20 präzise Regeln
- ✅ WENN-DANN Logik
- ✅ Maschinenlesbar UND menschenlesbar
- ✅ Einfach erweiterbar
- ✅ Automatisch validierbar

---

## Struktur

```
knowledge/
├── rules/                          # WENN-DANN Regeln
│   ├── rule-schema.json            # JSON Schema für Regeln
│   ├── code-generation-rules.json  # Regeln für Code-Generierung
│   ├── validation-rules.json       # Automatische Validierungs-Checks
│   └── error-resolution-rules.json # Fehler → Lösung Mappings
│
├── templates/                      # Wiederverwendbare Code-Templates
│   ├── esm-app-template.js         # Express App (ESM)
│   ├── commonjs-app-template.js    # Express App (CommonJS)
│   ├── api-route-template.js       # API Route Handler
│   └── esm-router-index-template.js
│
├── rule-engine.mjs                 # Rule Engine Implementierung
├── test-rule-engine.mjs            # Test-Script
│
└── legacy/                         # Alte Pattern-Dateien (archiviert)
    └── (alte *-knowledge.json werden hierhin verschoben)
```

---

## Rule Format

Jede Regel folgt diesem Schema:

```json
{
  "id": "rule-esm-001",
  "name": "ESM Import Consistency",
  "description": "When package.json has 'type: module', enforce ESM import syntax only",
  "category": "code-generation",
  "phase": ["implementation"],
  "severity": "CRITICAL",
  "enabled": true,
  
  "condition": {
    "type": "package-config",
    "trigger": "package.json contains 'type: module'",
    "check": {
      "file": "package.json",
      "field": "type",
      "value": "module"
    }
  },
  
  "action": {
    "type": "enforce-pattern",
    "enforce": "USE_ESM_IMPORTS_ONLY",
    "template": "templates/esm-app-template.js",
    "forbidden": ["require(", "module.exports"],
    "required": ["import", "export default"]
  },
  
  "validation": {
    "check": "grep -r \"require(\" src/ || echo 'OK'",
    "expect": "OK",
    "message": "Found require() in ESM package - use import instead"
  },
  
  "examples": [
    {
      "wrong": "app.use('/api', require('./routes/index.js').default);",
      "correct": "import routes from './routes/index.js';\napp.use('/api', routes.default || routes);",
      "explanation": "ESM packages must use import at top of file"
    }
  ],
  
  "metadata": {
    "created": "2025-12-12T22:40:00Z",
    "success_rate": 1.0
  }
}
```

---

## Regel-Typen

### 1. Code Generation Rules (`code-generation-rules.json`)

**Zweck:** Steuern, WIE Code generiert wird

**Beispiele:**
- `rule-esm-001`: ESM Import Konsistenz
- `rule-esm-002`: CommonJS Konsistenz
- `rule-template-001`: Template Literal Escaping
- `rule-structure-001`: Standard Verzeichnisstruktur
- `rule-api-001`: API Route Handler Pattern

### 2. Validation Rules (`validation-rules.json`)

**Zweck:** Automatische Checks NACH Code-Generierung

**Beispiele:**
- `rule-val-001`: Package.json Validität
- `rule-val-002`: Syntax Check (node --check)
- `rule-val-003`: ESM Module Konsistenz Check
- `rule-val-004`: Test-Dateien vorhanden
- `rule-val-006`: NPM Test Ausführung
- `rule-val-007`: Server Startup Check

### 3. Error Resolution Rules (`error-resolution-rules.json`)

**Zweck:** WENN Fehler X auftritt, DANN wende Lösung Y an

**Beispiele:**
- `rule-err-001`: ReferenceError: require is not defined → ESM Import Fix
- `rule-err-002`: module.exports in ESM → export default Fix
- `rule-err-003`: Template Literal Syntax Error → Escaping Fix
- `rule-err-006`: Port already in use → Alternative Port Suggestion

---

## Rule Engine API

### Initialisierung

```javascript
import RuleEngine from './knowledge/rule-engine.mjs';

const engine = new RuleEngine('./knowledge');
console.log(`Loaded ${engine.getTotalRulesCount()} rules`);
```

### Regeln für Phase abrufen

```javascript
const implRules = engine.getRulesForPhase('implementation');
console.log(`${implRules.length} rules for implementation phase`);
```

### Regeln anwenden

```javascript
const context = {
  projectPath: './generated-code/my-project',
};

const results = await engine.applyRules('implementation', context);
console.log(`Applied: ${results.rulesApplied}, Failed: ${results.rulesFailed}`);
```

### Fehler-Fix vorschlagen

```javascript
const errorMsg = 'ReferenceError: require is not defined in ES module scope';
const fix = engine.suggestFix(errorMsg);

if (fix) {
  console.log(`Fix: ${fix.fix.search} → ${fix.fix.replace}`);
  console.log(`Example: ${fix.examples[0].correct}`);
}
```

### Template laden

```javascript
const template = engine.loadTemplate('templates/esm-app-template.js', {
  PROJECT_NAME: 'my-api',
  PORT: '3000',
});
```

---

## Integration in Agenten

### Vorher (Pattern-basiert)

```javascript
// ImplementationAgent - OLD
const patterns = JSON.parse(fs.readFileSync('implementation-knowledge.json'));
// ... komplexe Pattern-Matching Logik ...
```

### Nachher (Regelbasiert)

```javascript
// ImplementationAgent - NEW
import RuleEngine from '../knowledge/rule-engine.mjs';

class ImplementationAgent {
  constructor() {
    this.ruleEngine = new RuleEngine('./knowledge');
  }

  async generateCode(technicalData, outputDir) {
    const context = {
      projectPath: outputDir,
      technicalData,
    };

    // 1. Prüfe Regeln
    const rules = this.ruleEngine.getRulesForPhase('implementation', 'code-generation');
    
    // 2. Wende Regeln an
    for (const rule of rules) {
      if (this.ruleEngine.evaluateCondition(rule, context)) {
        const result = await this.ruleEngine.executeAction(rule, context);
        
        if (result.data?.template) {
          // Template aus Rule Engine verwenden
          const code = result.data;
          fs.writeFileSync(path.join(outputDir, 'src/index.js'), code);
        }
      }
    }

    // 3. Validiere generiertes Code
    const validation = await this.ruleEngine.validateGeneratedCode(outputDir);
    if (validation.rulesFailed > 0) {
      console.warn(`⚠️  ${validation.rulesFailed} validation checks failed`);
    }
  }
}
```

---

## Condition Types

| Type | Beschreibung | Beispiel |
|------|--------------|----------|
| `always` | Immer true | Standard-Struktur erstellen |
| `file-exists` | Prüft ob Datei existiert | `package.json` vorhanden |
| `package-config` | Prüft package.json Feld | `type: "module"` |
| `file-contains` | Regex-Match in Datei | `require(` in src/ |
| `context-match` | Pattern in Kontext | "generating route" |
| `custom` | Error-Pattern-Match | ReferenceError |

## Action Types

| Type | Beschreibung | Beispiel |
|------|--------------|----------|
| `use-template` | Template laden | esm-app-template.js |
| `enforce-pattern` | Pattern erzwingen | USE_ESM_IMPORTS_ONLY |
| `run-validation` | Command ausführen | `npm test` |
| `apply-fix` | Automatischer Fix | require → import |
| `abort-with-error` | Workflow stoppen | Kritischer Fehler |

---

## Severity Levels

1. **CRITICAL**: Verhindert Server-Start oder Deployment (z.B. ESM require() Fehler)
2. **HIGH**: Beeinträchtigt Funktionalität (z.B. fehlende Tests)
3. **MEDIUM**: Code-Qualität (z.B. fehlende try-catch)
4. **LOW**: Best Practice (z.B. Naming Convention)
5. **INFO**: Hinweise (z.B. Performance-Tipps)

---

## Test ausführen

```bash
cd /workspaces/forge-ai
node knowledge/test-rule-engine.mjs
```

**Erwartete Ausgabe:**
```
✓ Loaded 20 rules total
✓ Found 17 rules for implementation phase
✓ ESM rule condition match: true
✓ Applied: 8, Failed: 0
✓ Suggested fix: ESM Require Error Fix
✓ Loaded ESM template (1265 chars)
```

---

## Neue Regel hinzufügen

1. **Kategorie wählen**: code-generation, validation oder error-resolution
2. **Regel erstellen** in entsprechender JSON-Datei:

```json
{
  "id": "rule-xyz-001",
  "name": "Meine neue Regel",
  "description": "Was diese Regel macht",
  "category": "code-generation",
  "phase": ["implementation"],
  "severity": "HIGH",
  "enabled": true,
  "condition": {
    "type": "file-exists",
    "trigger": "Wenn X existiert",
    "check": {"file": "path/to/file"}
  },
  "action": {
    "type": "enforce-pattern",
    "enforce": "MY_PATTERN"
  },
  "validation": {
    "check": "command to verify",
    "expect": "expected result"
  },
  "metadata": {
    "created": "2025-12-12T23:00:00Z",
    "success_rate": 0.95
  }
}
```

3. **Rule Engine neu laden** (automatisch bei nächstem Start)

---

## Migration von Legacy Patterns

**Status:** 138 alte Patterns → 20 präzise Regeln

**Verbleibende Legacy-Dateien:**
- `*-knowledge.json` (werden nach `legacy/` verschoben)
- `experiences.json` (bleibt, wird für Dokumentation genutzt)
- `strategies.json` (bleibt, wird für High-Level Strategien genutzt)

**Migration-Script** (TODO):
```bash
npm run migrate-knowledge
```

---

## Vorteile

### Für AI-Agenten
- ✅ Klare WENN-DANN Logik statt Pattern-Matching
- ✅ Reduzierter Token-Verbrauch (20 statt 138 Patterns)
- ✅ Deterministisches Verhalten
- ✅ Automatische Fehler-Resolution

### Für Menschen
- ✅ Verständliche Regel-Struktur
- ✅ Leicht erweiterbar
- ✅ Versionierbar in Git
- ✅ Testbar (test-rule-engine.mjs)

### Für das System
- ✅ Schnelleres Laden
- ✅ Weniger Speicher
- ✅ Validierbar mit JSON Schema
- ✅ Parallele Regel-Evaluierung möglich

---

## Nächste Schritte

1. ✅ Rule Engine implementiert
2. ✅ 20 Basis-Regeln definiert
3. ✅ Templates extrahiert
4. ⏳ Agenten auf Rule Engine umstellen (ImplementationAgent zuerst)
5. ⏳ Legacy Patterns archivieren
6. ⏳ Vollständige Test-Suite
7. ⏳ Dokumentation für alle Regeln

---

## Fragen & Antworten

**Q: Kann ich Regeln deaktivieren?**  
A: Ja, setze `"enabled": false` in der Regel.

**Q: Wie füge ich eigene Templates hinzu?**  
A: Template-Datei in `knowledge/templates/` erstellen, dann in Regel referenzieren.

**Q: Werden alte Patterns gelöscht?**  
A: Nein, sie werden nach `legacy/` verschoben für Referenz.

**Q: Kann die Rule Engine Fehler automatisch fixen?**  
A: Teilweise - sie schlägt Fixes vor, die manuell oder automatisiert angewendet werden können.

---

**Version:** 1.0  
**Erstellt:** 2025-12-12  
**Autor:** Forge AI Team
