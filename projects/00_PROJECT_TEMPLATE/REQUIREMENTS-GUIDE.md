# Requirements Schreib-Anleitung

Für Anforderer / Product Owner / Stakeholder

## YAML Frontmatter (Minimal!)

Fül nur diese 3 Felder aus:

```yaml
---
name: "my-feature"
priority: "high"  # high, medium, low
owner: "Team/Person"
---
```

**Das ist alles!** Folgende Felder werden von Forge AI automatisch befüllt:
- `version`, `status`, `created`, `deadline` → Forge AI generiert
- `target_components`, `artifacts` → Forge AI befüllt aus technischer Spec
- `build_test_commands`, `success_criteria` → Forge AI generiert

## Struktur (Markdown)

Verwende folgende Sections (alle optional, aber je mehr desto besser):

### 1. Kontext / Motivation (optional aber hilfreich)
```markdown
- Hintergrund: [Wer hat das Problem?]
- Problem heute: [Wie ist der Status Quo?]
- Warum jetzt wichtig: [Dringlichkeit?]
```

### 2. User Story (wichtig!)
```markdown
Als [Rolle] möchte ich [Ziel],
DAMIT ich [Nutzen].
```

Beispiel:
```markdown
Als Benutzer möchte ich mich mit E-Mail registrieren,
DAMIT ich die App nutzen kann.
```

### 3. Scope (optional)
Was gehört dazu, was nicht?
```markdown
- In Scope:
  - Feature 1
  - Feature 2
- Out of Scope:
  - Nicht geplant
```

### 4. Funktionale Anforderungen (wichtig!)
Was soll das System tun?
```markdown
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3
```

Beispiel:
```markdown
- [ ] System acceptiert E-Mail und Passwort
- [ ] System validiert E-Mail-Format
- [ ] System hasht Passwort vor dem Speichern
- [ ] System versendet Bestätigungs-E-Mail
```

### 5. Schnittstellen / APIs / Datenstrukturen (optional)
Falls du bereits Ideen hast:
```markdown
- APIs:
  - POST /auth/register
  - POST /auth/verify
- Datenstrukturen:
  - User: { email, hashedPassword, verified }
```

### 6. Nicht-funktionale Anforderungen (optional)
```markdown
- Performance: Registrierung < 2 Sekunden
- Security: Passwort nur gehashed speichern
- Usability: Klar erklärt, warum E-Mail nötig
```

### 7. UI / Interaktion (optional)
Falls UI relevant:
```markdown
- Seiten:
  - Registrierungs-Formular
  - Bestätigungs-Email-Seite
- Komponenten:
  - Email-Input
  - Password-Input
  - Registrierungs-Button
```

### 8. Akzeptanzkriterien (hilfreich!)
Konkrete, testbare Bedingungen:
```markdown
- [ ] GIVEN leeres Registrierungs-Formular
  WHEN Benutzer gültige Daten eingibt
  THEN wird Account erstellt

- [ ] GIVEN ungültige E-Mail
  WHEN Benutzer Submit drückt
  THEN Fehler-Message angezeigt
```

### 9. Testideen (optional)
Denkbare Test-Szenarien:
```markdown
- E2E: Volle Registrierungs-Flow (Email bestätigen, Login)
- Unit: Email-Validierung
- Unit: Password-Hashing
- Integration: Datenbank + Email-Service
```

### 10. Auswirkungen (optional)
```markdown
- Betroffene Dateien: src/auth/register.ts, db/migrations/
- Seiteneffekte: Neue Email-Service-Integration nötig
```

### 11. Offene Fragen
Falls Unsicherheiten:
```markdown
- Sollen wir OAuth unterstützen oder nur Email?
- Wie lange ist Bestätigungs-Link gültig?
```

## ✅ Vollständiges Minimal-Beispiel

```markdown
---
name: "user-registration"
priority: "high"
owner: "Product Team"
---

# Feature: User Registration

## 1. Kontext
- Problem: Neue Benutzer können sich nicht anmelden
- Wichtig: Muss bis Quartal Q1 live sein

## 2. User Story
Als neuer Benutzer möchte ich mich mit E-Mail registrieren,
DAMIT ich die App nutzen kann.

## 3. Funktionale Anforderungen
- [ ] Registrierungs-Formular mit Email + Passwort
- [ ] Email-Validierung (Format + Unique)
- [ ] Passwort-Validierung (min. 8 Zeichen)
- [ ] Bestätigungs-Email versenden
- [ ] Account erst aktiv nach Email-Bestätigung

## 4. Akzeptanzkriterien
- [ ] GIVEN leeres Form WHEN ich gültige Daten eingebe THEN Account erstellt
- [ ] GIVEN ungültige Email WHEN ich Submit drücke THEN Error angezeigt
- [ ] GIVEN Account erstellt THEN Email versendet

## 5. Offene Fragen
- Sollen wir Social Login (Google/GitHub) unterstützen?
```

## 🚀 Tipps

1. **Je konkriter, desto besser** - Akzeptanzkriterien sind Gold wert
2. **Du musst keine Technologie vorschreiben** - Forge AI macht das
3. **Bilder helfen** - Falls UI relevant, sketches/Wireframes anhängen
4. **Iterativ OK** - Requirement kann sich entwickeln während Forge AI arbeitet
5. **Auf Deutsch OK** - Der Framework verarbeitet jede Sprache

## ⚠️ Was Forge AI von hier aus macht

Nach deinem Requirement lädt Forge AI folgende 9 Phasen:

```
📋 Dein Requirement
       ↓
1️⃣  Parse: Struktur verstehen
       ↓
2️⃣  Funktionale Anforderungen: Detaillierung
       ↓
3️⃣  Technische Specification: Architektur planen
       ↓
4️⃣  Tests: Testplan generieren
       ↓
5️⃣  Implementierung: Code generieren (iterativ)
       ↓
6️⃣  Code Review: Überprüfung
       ↓
7️⃣  Dokumentation: Markdowns + Diagramme
       ↓
8️⃣  Persistierung: Learnings speichern
       ↓
📊 Execution Report + Artifacts
```

Du siehst alles im `forge-ai-work/<timestamp>/execution-report.md`.

---

**Fragen?** Siehe [../DEVELOPMENT.md](../DEVELOPMENT.md) für weitere Infos.
