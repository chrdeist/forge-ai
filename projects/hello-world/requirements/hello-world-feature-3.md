---
name: "hello-world-feature-3"
priority: "high"
owner: "Forge AI Team"
featureNumber: 3
---

# Feature-Anforderung: Hello World CLI Tool - Feature 3: Configuration File Support

## 1. Kontext / Motivation
- Hintergrund: Nach der erfolgreichen Implementierung von Logging & Verbosity (Feature 2) benötigen Benutzer die Möglichkeit, ihre bevorzugten Einstellungen persistent zu speichern.
- Problem heute: Benutzer müssen bei jedem Aufruf die gleichen Flags übergeben (z.B. `--verbose --timestamps --lang=de`).
- Warum jetzt wichtig: 
  - Validierung von File-I/O in der Orchestration-Pipeline
  - Test des Error-Handling für ungültige Konfigurationen
  - Praxisnahes Feature für echte CLI-Tools
  - Demonstration der inkrementellen Feature-Entwicklung

## 2. User Story
Als CLI-Benutzer möchte ich eine Konfigurationsdatei (`.hellorc`) erstellen können,
DAMIT ich meine bevorzugten Einstellungen nicht bei jedem Aufruf manuell angeben muss.

## 3. Scope
- In Scope:
  - Support für `.hellorc` Datei im aktuellen Verzeichnis und Home-Verzeichnis
  - YAML und JSON Format-Unterstützung
  - Environment-Variable-Overrides (z.B. `HELLO_VERBOSE=true`)
  - Validierung der Konfiguration mit aussagekräftigen Fehlermeldungen
  - `--config <path>` Flag für custom Config-Pfad
  - `--no-config` Flag zum Ignorieren aller Configs
  - `init` Command zum Erstellen einer Standard-Config
- Out of Scope:
  - GUI-basierter Config-Editor
  - Remote Config-Download
  - Verschlüsselte Konfiguration

## 4. Funktionale Anforderungen

### FR-3.1: Config File Discovery
**Beschreibung:** Das Tool sucht automatisch nach Konfigurationsdateien in definierter Reihenfolge.
**Priorität:** HIGH
**Suchpfade (in Reihenfolge):**
1. `--config <path>` (wenn angegeben)
2. `./.hellorc` (aktuelles Verzeichnis)
3. `./.hellorc.json` (aktuelles Verzeichnis)
4. `./.hellorc.yaml` (aktuelles Verzeichnis)
5. `~/.hellorc` (Home-Verzeichnis)
6. `~/.hellorc.json` (Home-Verzeichnis)
7. `~/.hellorc.yaml` (Home-Verzeichnis)

### FR-3.2: YAML Format Support
**Beschreibung:** Unterstützung für YAML-basierte Konfiguration.
**Priorität:** HIGH
**Beispiel `.hellorc.yaml`:**
```yaml
# Hello World CLI Configuration
greeting:
  message: "Guten Tag"
  language: "de"
  
logging:
  verbose: true
  debug: false
  quiet: false
  timestamps: true
  
output:
  format: "text"  # text, json, xml
  color: true
```

### FR-3.3: JSON Format Support
**Beschreibung:** Unterstützung für JSON-basierte Konfiguration.
**Priorität:** HIGH
**Beispiel `.hellorc.json`:**
```json
{
  "greeting": {
    "message": "Hello",
    "language": "en"
  },
  "logging": {
    "verbose": false,
    "debug": false,
    "quiet": false,
    "timestamps": false
  },
  "output": {
    "format": "text",
    "color": true
  }
}
```

### FR-3.4: Environment Variable Support
**Beschreibung:** Environment-Variablen überschreiben Config-Datei-Werte.
**Priorität:** MEDIUM
**Unterstützte Variablen:**
- `HELLO_VERBOSE=true|false`
- `HELLO_DEBUG=true|false`
- `HELLO_QUIET=true|false`
- `HELLO_TIMESTAMPS=true|false`
- `HELLO_LANGUAGE=en|de|fr|es`
- `HELLO_FORMAT=text|json|xml`
- `HELLO_CONFIG=<path>` (alternative zu --config)

**Präzedenz (höchste zuerst):**
1. Command-line Flags
2. Environment Variables
3. Config File
4. Default Values

### FR-3.5: Config Validation
**Beschreibung:** Validierung der Konfigurationsdatei mit klaren Fehlermeldungen.
**Priorität:** HIGH
**Validierungsregeln:**
- `language`: Muss einer der Werte sein: `en`, `de`, `fr`, `es`
- `format`: Muss einer der Werte sein: `text`, `json`, `xml`
- `verbose`, `debug`, `quiet`, `timestamps`, `color`: Müssen boolean sein
- Unbekannte Felder werden gewarnt, aber nicht abgelehnt

**Fehlerbeispiele:**
```
Error: Invalid configuration in .hellorc.yaml
  - greeting.language: "xyz" is not a valid language. Valid: en, de, fr, es
  - logging.verbose: "yes" is not a boolean. Use: true or false
  - output.format: "pdf" is not supported. Valid: text, json, xml
```

### FR-3.6: Init Command
**Beschreibung:** `init` Command erstellt eine Standard-Konfigurationsdatei.
**Priorität:** MEDIUM
**Verhalten:**
```bash
$ hello init
Created .hellorc.yaml with default configuration

$ hello init --json
Created .hellorc.json with default configuration

$ hello init --global
Created ~/.hellorc.yaml with default configuration

$ hello init --force
Warning: .hellorc.yaml already exists. Overwriting...
Created .hellorc.yaml with default configuration
```

### FR-3.7: Config Command (Info & Validation)
**Beschreibung:** `config` Command zeigt die aktuelle Konfiguration und deren Quelle.
**Priorität:** LOW
**Verhalten:**
```bash
$ hello config
Configuration loaded from: ./.hellorc.yaml

greeting:
  message: "Guten Tag" (from config)
  language: "de" (from config)
  
logging:
  verbose: true (from ENV: HELLO_VERBOSE)
  debug: false (default)
  quiet: false (default)
  timestamps: true (from config)

output:
  format: "text" (default)
  color: true (from config)

$ hello config --validate
✓ Configuration is valid
Loaded from: ./.hellorc.yaml
No warnings
```

### FR-3.8: No-Config Flag
**Beschreibung:** `--no-config` Flag ignoriert alle Konfigurationsdateien und Environment-Variablen.
**Priorität:** LOW
**Verhalten:**
```bash
$ hello --no-config
# Verwendet nur Default-Werte, ignoriert .hellorc und ENV vars
```

### FR-3.9: Custom Config Path
**Beschreibung:** `--config <path>` Flag lädt Konfiguration von custom Pfad.
**Priorität:** MEDIUM
**Verhalten:**
```bash
$ hello --config /path/to/custom.yaml
$ hello --config ./configs/production.json
```

### FR-3.10: Config Merge Strategy
**Beschreibung:** Mehrere Config-Quellen werden intelligent gemerged.
**Priorität:** HIGH
**Merge-Logik:**
1. Start mit Default-Werten
2. Merge mit Config-Datei (falls vorhanden)
3. Override mit Environment-Variablen
4. Override mit Command-Line-Flags

**Beispiel:**
- Default: `verbose: false`
- Config File: `verbose: true`
- ENV: `HELLO_VERBOSE=false`
- CLI: `--verbose`
- **Result:** `verbose: true` (CLI hat höchste Priorität)

## 5. Nicht-funktionale Anforderungen

### NFR-3.1: Performance
- Config-Datei-Loading < 50ms für Dateien < 1MB
- Config-Validierung < 10ms
- Keine spürbare Verzögerung beim Tool-Start

### NFR-3.2: Error Handling
- Klare Fehlermeldungen mit Dateiname und Zeilennummer (bei YAML/JSON Syntax-Fehlern)
- Graceful degradation: Bei ungültiger Config Default-Werte verwenden + Warning
- Exit Code 0 bei Warnings, Exit Code 1 bei kritischen Config-Fehlern

### NFR-3.3: Backward Compatibility
- Tool funktioniert ohne Config-Datei (wie bisher)
- Alte Flags funktionieren weiterhin
- Keine Breaking Changes zu Feature 1 & 2

### NFR-3.4: Security
- Config-Dateien werden nur im aktuellen User-Kontext gelesen
- Keine Execution von Code aus Config-Dateien
- Path-Traversal-Prevention bei `--config` Flag

### NFR-3.5: Documentation
- README-Update mit Config-Beispielen
- Inline-Help für `init` und `config` Commands
- Beispiel-Configs im Repo

## 6. Akzeptanzkriterien

### AC-3.1: Config File Loading
```bash
# GIVEN: .hellorc.yaml mit verbose: true existiert
# WHEN: hello wird ohne Flags aufgerufen
# THEN: Tool läuft im verbose mode
$ echo "logging:\n  verbose: true" > .hellorc.yaml
$ hello
# Erwartung: Verbose output wird angezeigt
```

### AC-3.2: Precedence
```bash
# GIVEN: Config hat verbose: true, ENV hat HELLO_VERBOSE=false
# WHEN: hello --verbose wird aufgerufen
# THEN: CLI-Flag gewinnt (verbose = true)
$ export HELLO_VERBOSE=false
$ hello --verbose
# Erwartung: Verbose output wird angezeigt
```

### AC-3.3: Validation Error
```bash
# GIVEN: .hellorc.yaml mit ungültigem language: "xyz"
# WHEN: hello wird aufgerufen
# THEN: Validation-Error mit klarer Message
$ echo "greeting:\n  language: xyz" > .hellorc.yaml
$ hello
Error: Invalid configuration in .hellorc.yaml
  - greeting.language: "xyz" is not valid. Valid: en, de, fr, es
```

### AC-3.4: Init Command
```bash
# WHEN: hello init wird aufgerufen
# THEN: .hellorc.yaml wird mit Defaults erstellt
$ hello init
Created .hellorc.yaml with default configuration
$ cat .hellorc.yaml
# Erwartung: Vollständige YAML-Config mit Defaults
```

### AC-3.5: Config Info
```bash
# GIVEN: Config-Datei und ENV-Vars gesetzt
# WHEN: hello config wird aufgerufen
# THEN: Zeigt alle Werte mit Quellen
$ hello config
# Erwartung: Tabelle mit Werten und Quellen (config/env/default)
```

## 7. Technische Details

### Abhängigkeiten
- `js-yaml` (^4.1.0) - YAML parsing
- `ajv` (^8.12.0) - JSON schema validation
- `dotenv` (^16.3.1) - .env file support (optional)

### Config Schema (JSON Schema)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "greeting": {
      "type": "object",
      "properties": {
        "message": {"type": "string"},
        "language": {"type": "string", "enum": ["en", "de", "fr", "es"]}
      }
    },
    "logging": {
      "type": "object",
      "properties": {
        "verbose": {"type": "boolean"},
        "debug": {"type": "boolean"},
        "quiet": {"type": "boolean"},
        "timestamps": {"type": "boolean"}
      }
    },
    "output": {
      "type": "object",
      "properties": {
        "format": {"type": "string", "enum": ["text", "json", "xml"]},
        "color": {"type": "boolean"}
      }
    }
  }
}
```

### File Structure
```
src/
  config/
    config-loader.js       # Lädt und merged Configs
    config-validator.js    # Validiert gegen Schema
    default-config.js      # Default-Werte
  commands/
    init.js               # init command
    config.js             # config command
```

## 8. Test-Strategie

### Unit Tests
- Config-Loader für YAML/JSON
- Merge-Logik (Config + ENV + CLI)
- Validation-Logic
- Default-Werte

### Integration Tests
- End-to-End mit verschiedenen Config-Kombinationen
- Environment-Variable-Overrides
- File-Not-Found-Handling
- Invalid-Config-Handling

### Edge Cases
- Leere Config-Datei
- Korrupte YAML/JSON
- Circular references (sollte nicht möglich sein, aber testen)
- Sehr große Config-Dateien (> 1MB)
- Gleichzeitig .hellorc.yaml UND .hellorc.json (erste gefundene gewinnt)

## 9. Rollout-Plan

### Phase 1: Core Implementation
- Config-Loader (YAML + JSON)
- Merge-Logik
- Basic Validation

### Phase 2: Commands
- `init` command
- `config` command

### Phase 3: Polish
- Error Messages verbessern
- Documentation
- Examples

## 10. Metriken / Erfolgs-KPIs
- Config-Validierung läuft ohne Fehler
- Tool startet < 100ms mit Config-Datei
- 100% Test-Coverage für Config-Module
- Keine Regression zu Feature 1 & 2
- Documentation vollständig

## 11. Risiken & Mitigations

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| YAML Parsing-Fehler | MEDIUM | HIGH | Try-Catch mit klarer Error-Message |
| Config-Präzedenz unklar | LOW | MEDIUM | Klare Doku + `config` Command zeigt Quellen |
| Performance bei großen Configs | LOW | LOW | Lazy-Loading + Size-Limit (1MB) |
| Breaking Changes | LOW | HIGH | Backward-Compatibility-Tests |

## 12. Offene Fragen
- ✅ YAML vs JSON: Beide unterstützen
- ✅ Config-Location: Current dir + Home dir
- ✅ Validation: Schema-basiert mit Ajv
- ⏳ Environment-Variable-Prefix: `HELLO_*` (festgelegt)

## 13. Referenzen
- Feature 1: Hello-World-Basis
- Feature 2: Logging & Verbosity
- Industry-Standard: `.rc` Dateien (z.B. `.npmrc`, `.eslintrc`)
- Config-Präzedenz: Inspiriert von npm, git, eslint
