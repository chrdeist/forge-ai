# Forge AI - Interactive Demo Quick Start

Möchtest du Forge AI zeigen und vorstellen? Hier die schnellste Anleitung:

## 🚀 30 Sekunden Setup

```bash
# 1. Clone & Install
git clone https://github.com/your-org/forge-ai.git
cd forge-ai
npm install
npm run init

# 2. Run Demo
node packages/orchestrator/demo-interactive.mjs --interactive

# 3. Press ENTER after each phase to see what happened
```

Das's it! 🎉

---

## 💡 Was du zeigst

1. **Phase 1: Parse Requirement**
   - System liest deine Anforderung
   - Strukturiert die Daten

2. **Phase 2: Extract Functional Requirements**
   - Agent extrahiert Was-ist-zu-tun?
   - Generiert strukturierte funktionale Anforderungen

3. **Phase 3: Technical Specification**
   - Agent sagt Wie-ist-es-zu-bauen?
   - Generiert APIs, Datenstrukturen, Constraints

4. **Phase 4: Design Architecture**
   - Agent plant die Struktur
   - Generiert Komponenten, Interfaces

5. **Phase 5: Test Specifications**
   - Agent generiert Testplan
   - Unit Tests, E2E Tests, Security Tests

6. **Phase 6: Implementation**
   - Agent generiert Code!
   - TypeScript, 94% Test Coverage

7. **Phase 7: Code Review**
   - Agent reviewed den Code
   - Gibt Feedback und Approval

8. **Phase 8: Documentation**
   - Agent schreibt Dokumentation
   - README, API Docs, Architecture Diagramme (PlantUML)

9. **Phase 9: Persist Learning**
   - System speichert was es gelernt hat
   - Nächste Anforderung wird besser!

---

## 🎯 Demo Talking Points

Während der Demo kannst du erklären:

### Phase 1 + 2
**"Was hätte früher ein Requirements-Analyst gemacht, macht jetzt ein Agent."**
- Manuell Requirements strukturieren? Jetzt automatisch.
- Input: Unstrukturiertes Markdown
- Output: JSON mit 50 Datenpunkten

### Phase 3
**"Was hätte früher ein Senior Dev gemacht, macht jetzt ein Agent."**
- APIs designen
- Datenstrukturen planen
- Constraints definieren

### Phase 4
**"Architektur-Decisions automatisch."**
- Komponenten planen
- Interfaces definieren
- Skalierbarkeit überlegen

### Phase 5 + 6
**"Das komplexeste: Tests + Code."**
- Automatisch Test-Cases generieren
- Automatisch Code schreiben
- Tests gegen Code validieren (iterativ)

### Phase 7 + 8
**"Code Review + Dokumentation automatisch."**
- Code überprüft
- Feedback gegeben
- Dokumentation geschrieben
- Diagramme generiert (PlantUML)

### Phase 9
**"Das System wird besser!"**
- Patterns gelernt
- Strategien registriert
- Nächste Anforderung profitiert

---

## 📊 Was zeigt die Demo

Nach Completion siehst du:

```
╔════════════════════════════════════════════════════════════╗
║          FORGE AI WORKFLOW STATUS                           ║
╠════════════════════════════════════════════════════════════╣
║ Status:         COMPLETED                                   ║
║ Current Phase:  Phase 9                                     ║
║ Completed:      9 / 9 phases                                ║
║ Errors:         0                                           ║
║ Duration:       7.5s                                        ║
╚════════════════════════════════════════════════════════════╝
```

Und einen Link zur **execution-report.md** mit:
- Timeline aller Events
- Phase-by-Phase Breakdown
- Agent Logs
- Errors & Warnings (hoffentlich keine!)
- Data Flow Diagram
- Raw Logs für Debugging

---

## 🎓 Learning Demo

Wenn du möchtest dass Zuschauer mehr verstehen:

```bash
# VERBOSE mode zeigt ALLES
LOG_LEVEL=VERBOSE node packages/orchestrator/demo-interactive.mjs --interactive
```

Dann können sie sehen:
- Prompt Templates werden geladen
- Context wird injiziert
- Patterns werden abgerufen
- Output wird generiert
- Alles mit Timestamps und Details

---

## 💬 Possible Fragen & Antworten

**Q: Aber das ist ja fake, oder? Die Phasen sind simuliert?**
A: Ja! Das ist ein Demo um das System zu zeigen. Mit echtem LLM-Integration (Claude/GPT) wird es echte Code generieren statt Simulation.

**Q: Wie lang dauert ein echtes Workflow?**
A: Mit LLM-Calls: ~30-60 Sekunden pro Anforderung (je nach Länge).

**Q: Kann man die Outputs speichern?**
A: Ja! Mit dem `save` Command während der Demo kannst du Phase-Outputs als JSON speichern.

**Q: Was macht der Agent wenn was falsch läuft?**
A: Wirft einen klaren Error mit Feedback wo Problem ist. Der Error hat Logs damit man debuggen kann.

**Q: Kann ich das System nutzen für mein Projekt?**
A: Ja! Clone forge-ai, copy PROJECT-TEMPLATE/, schreib Requirements, führe aus. Fertig!

---

## 🎬 Presentation Script (3 min)

```
0:00 - "Das hier ist Forge AI - ein Framework für automatische Software-Entwicklung"
0:05 - "Ihr schreibt eine Anforderung in Markdown - das System macht alles andere"
0:10 - [Start Demo]

0:15 - Phase 1: "Schritt 1: Anforderung wird geparst und strukturiert"
0:20 - Phase 2: "Schritt 2: Ein Agent extrahiert die funktionalen Anforderungen"
0:25 - Phase 3: "Schritt 3: Ein anderer Agent macht die technische Spez"
0:30 - Phase 4: "Schritt 4: Architektur wird geplant"
0:35 - Phase 5: "Schritt 5: Tests werden generiert"
0:40 - Phase 6: "Schritt 6: Code wird geschrieben - validiert gegen Tests!"
0:45 - Phase 7: "Schritt 7: Code wird reviewed"
0:50 - Phase 8: "Schritt 8: Dokumentation und Diagramme werden generiert"
0:55 - Phase 9: "Schritt 9: System lernt aus dieser Anforderung"

1:00 - [Demo Complete] "Und fertig! 9 Phasen, 7 Sekunden, komplett automated"

1:10 - "Das interessante: Das System wird besser mit jeder Anforderung"
1:15 - "Die Patterns und Strategien aus dieser werden in der Knowledge Base gespeichert"
1:20 - "Die nächste Anforderung profitiert automatisch"

1:30 - "Lasst uns die Execution Report anschauen..."
1:45 - "Hier seht ihr die komplette Timeline, Phase für Phase"
2:00 - "Alle Agent-Interaktionen, Logs, alles transparent"
2:15 - "Wenn was schiefgeht, sehen wir genau wo"

2:30 - "Das System ist keine Black Box"
2:40 - "Fragen?"
```

---

## 📱 Social Media Ready

Perfekt für Screenshots/Videos:

```bash
# Auto mode für Video (schneller)
node packages/orchestrator/demo-interactive.mjs --auto
```

Dann:
- Alles läuft automatisch
- Schnell und beeindruckend
- Kurzes Video (15 Sekunden)
- GIF-worthy 🎬

---

## 🎓 Next Steps nach Demo

Wenn Audience interessiert ist:

1. **Zeige die Ausführungs-Report**
   - `execution-report.md` öffnen
   - Timeline zeigen
   - Logs zeigen

2. **Zeige den Code**
   - `phase-6-output.json` - der generierte Code
   - `packages/agents/` - wie Agents funktionieren

3. **Frage Fragen**
   - "Wie würdet ihr das erweitern?"
   - "Welche Anforderungen würde euer Team nutzen?"

4. **Zeige die Dokumentation**
   - `docs/AGENT-ARCHITECTURE.md`
   - `docs/LOGGING-AND-VISIBILITY.md`
   - Wie das System transparent ist

---

## ✅ Checkliste vor Demo

- [ ] Repository geklont
- [ ] `npm install` gelaufen
- [ ] `npm run init` gelaufen
- [ ] Demo einmal getestet (damit Überraschungen ausbleiben)
- [ ] Terminal größer gemacht (für bessere Sicht)
- [ ] Internet-Verbindung stabil? (falls LLM-Integration)
- [ ] Backup Plan? (Demo-Video falls was schief läuft)

---

## 🎯 Erfolgs-Kriterium

Demo ist erfolgreich wenn Zuschauer am Ende sagen:

> **"Wow, also das System macht nicht nur Code, sondern auch Tests und Dokumentation? Und es lernt??"**

Bingo! 🎯

---

**Viel Spaß beim Zeigen!** 🚀
