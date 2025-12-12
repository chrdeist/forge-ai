# Local Development Workflow

## Überblick

Generierte Projekte laufen **lokal im Dev Container ohne Docker**. Docker ist optional nur für Deployment Phase 10.

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1-9: Generate & Test Locally                         │
├─────────────────────────────────────────────────────────────┤
│  Requirement → Code Generation → Local npm test             │
│                                                             │
│  generated-code/                    sources/                │
│  ├── package.json                   ├── e2e.mjs             │
│  ├── src/                           ├── e2e-full.mjs        │
│  │   ├── index.js (entrypoint)      └── run.mjs             │
│  │   ├── greeting.js                                        │
│  │   └── cli.js                                             │
│  ├── test/                                                  │
│  │   ├── index.test.js                                      │
│  │   └── greeting.test.js                                   │
│  └── docs/                                                  │
│      ├── README.md                                          │
│      └── API.md                                             │
│                                                             │
│  npm install → npm test ✅                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 10: Optional - Docker/Deployment                     │
├─────────────────────────────────────────────────────────────┤
│  deployment/                                                │
│  ├── Dockerfile                                             │
│  ├── docker-compose.yml                                     │
│  ├── kubernetes-deployment.yaml                             │
│  └── .env.template                                          │
│                                                             │
│  docker build → docker run ✅                               │
└─────────────────────────────────────────────────────────────┘
```

## Lokal Testen (ohne Docker)

### 1. E2E Test mit lokalem npm

```bash
# Generiert Code und testet lokal
cd /workspaces/forge-ai
node projects/hello-world/sources/e2e-full.mjs --auto --local-only
```

**Was passiert:**
1. ✅ Phases 1-6: Code generieren
2. ✅ Code in `generated-code/` schreiben
3. ✅ `npm install` in generated-code/
4. ✅ `npm test` - alle Tests müssen passen
5. ✅ Phases 7-9: Code Review, Docs, Learning
6. 🚫 Phase 10: Docker skipped (--local-only)

**Output:**
```
generated-code/
├── package.json              ← npm install liest das
├── src/index.js             ← node src/index.js
├── src/greeting.js
├── src/cli.js
├── test/index.test.js       ← npm test führt aus
├── test/greeting.test.js
├── node_modules/            ← npm install erstellt das
└── .gitignore
```

### 2. Manuell arbeiten mit generiertem Code

```bash
# In den generierten Code wechseln
cd projects/hello-world/generated-code

# Dependencies installieren (nur beim ersten Mal)
npm install

# Tests ausführen
npm test

# Entwicklung (Watch Mode)
npm run dev

# Oder direkt ausführen
npm start
node src/index.js --name Alice
node src/index.js --name Bob --formal
```

### 3. Lokalen Code editieren

Nachdem Code generiert wurde, kannst du direkt editieren:

```
projects/hello-world/
├── generated-code/
│   ├── src/
│   │   └── greeting.js      ← Edit hier!
│   └── test/
│       └── greeting.test.js ← Add tests hier!
```

Dann Tests ausführen:
```bash
cd generated-code
npm test
```

## Mit Docker Testen (Phase 10)

Nur wenn lokale Tests ✅ bestanden haben:

```bash
# Generiert Code + Docker Artifacts
node projects/hello-world/sources/e2e-full.mjs --auto

# (ohne --local-only, so Phase 10 läuft)
```

**Dann lokal testen:**
```bash
cd projects/hello-world/deployment
docker-compose up

# In anderer Shell:
curl http://localhost:3000/greet?name=Alice
```

## Typischer Workflow

### Für den Framework-Owner (deine Abteilung):

```bash
# 1. Anforderung schreiben
echo "# My App" > projects/my-app/requirements/my-app-requirements.md

# 2. E2E Test generiert Code lokal
cd /workspaces/forge-ai
node e2e-runner.mjs --project my-app --auto --local-only

# 3. Code reviewen
ls -la projects/my-app/generated-code/
cat projects/my-app/generated-code/src/index.js

# 4. Lokal testen
cd projects/my-app/generated-code
npm test

# 5. Wenn zufrieden: Docker generieren
cd /workspaces/forge-ai
node e2e-runner.mjs --project my-app --auto
```

### Für React Frontend + Node Backend:

Die gleiche Struktur funktioniert auch für komplexere Projekte:

```
generated-code/
├── package.json              ← Node.js Backend
├── src/
│   ├── server.js             ← Express API
│   └── routes/
│       └── api.js
├── frontend/                 ← React
│   ├── package.json
│   ├── src/
│   │   └── App.jsx
│   └── public/
└── test/
    ├── server.test.js
    └── integration.test.js
```

Dann:
```bash
npm install                    # Installiert Backend + Frontend deps
npm test                      # Testet alles
npm run dev                   # Startet Backend + Frontend Dev Server
npm start                     # Startet für Production
```

## Wichtig!

⚠️ **Generated Code ist in `.gitignore`:**
```bash
# projects/hello-world/.gitignore
generated-code/              # Wird regeneriert, nicht committen!
test-results/               # Output, nicht committen
deployment/                 # Output, nicht committen
```

✅ **Committed werden nur:**
```bash
requirements/               # Input (requirement file)
sources/                   # Framework artifacts (e2e.mjs)
reports/                   # (optional) für Analyse
```

## Zusammenfassung

| Phase | Wo? | Was? | Lokal? |
|-------|-----|------|--------|
| 1-6 | sources/e2e.mjs | Code generieren | ✅ npm test |
| 7-9 | sources/e2e.mjs | Review, Docs, Learning | ✅ Reports |
| 10 | sources/e2e.mjs | Docker/Deployment | ✅ docker-compose up |

**Default:** Alles lokal ohne Docker  
**Mit Docker:** Nach erfolgreichem lokalem Test  
**Keine Hürden:** Schneller Feedback Loop 🚀
