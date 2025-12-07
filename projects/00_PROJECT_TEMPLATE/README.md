# PROJECT-TEMPLATE

Dies ist ein Template-Ordner für neue Projekte, die Forge AI nutzen.

## Setup

1. **Copy this folder** zu deinem Projekt-Namen:
   ```bash
   cp -r PROJECT-TEMPLATE my-awesome-app
   ```

2. **Configure it**:
   - Ändere `DEVELOPMENT.md`
   - Füge dein `README.md` hinzu
   - Erstelle erste Requirements unter `requirements/`

3. **Start developing**:
   ```bash
   cd my-awesome-app
   cat > requirements/first-feature.md << 'EOF'
   ---
   name: "first-feature"
   ...
   EOF
   
   node ../packages/cli/forge.mjs execute --requirements=requirements/first-feature.md
   ```

## Folder Structure

```
my-awesome-app/
├── requirements/           ← Deine Requirement-Dateien
│   └── README.md          ← Guideline für Requirements schreiben
├── src/                   ← Generated + Modified Source Code
│   └── .gitkeep
├── tests/                 ← Generated + Modified Tests
│   └── .gitkeep
├── docs/                  ← Generated + Modified Documentation
│   └── .gitkeep
├── DEVELOPMENT.md         ← Dein spezifisches Setup Guide
└── README.md              ← Dein Projekt-README

forge-ai-work/            ← Generierte Outputs pro Run
├── <timestamp>/
│   ├── execution-report.md
│   ├── technical-specification.json
│   └── ...
```

## Gitignore

```bash
# In .gitignore am root:
my-awesome-app/src/
my-awesome-app/tests/
my-awesome-app/docs/
forge-ai-work/
```

Oder: Keep only Requirements in Git, rest locally.

## First Steps

1. Write a requirement in `requirements/`
2. Run Forge AI
3. Review the output in `forge-ai-work/<timestamp>/execution-report.md`
4. Adapt generated code to your needs
5. Share learnings with framework
