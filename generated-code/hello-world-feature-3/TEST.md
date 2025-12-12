# Feature 3 Test Guide

## Start Server

```bash
npm start
# Server läuft auf http://localhost:3000
```

## Test Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/health
```

**Erwartete Antwort:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-12T23:15:00.000Z",
  "uptime": 1.234
}
```

### 2. API Endpoints (Beispiele)

Der Server hat 92 generierte API-Endpoints unter `/api/*`:

```bash
# Beispiel: API-1
curl -X POST http://localhost:3000/api/_FeatureAnforderung_Hello_World_CLI_Tool \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Erwartete Antwort:**
```json
{
  "status": "success",
  "method": "POST",
  "path": "/_FeatureAnforderung_Hello_World_CLI_Tool",
  "timestamp": "2025-12-12T23:15:00.000Z",
  "data": {"test": "data"}
}
```

### 3. Alle verfügbaren Routes anzeigen

```bash
# Liste aller generierten Routes
ls -1 src/routes/api-*.js | wc -l
# Zeigt: 92 API Files
```

### 4. Test mit curl in separatem Terminal

**Terminal 1 (Server starten):**
```bash
cd /workspaces/forge-ai/generated-code/hello-world-feature-3
npm start
```

**Terminal 2 (Testen):**
```bash
# Health Check
curl http://localhost:3000/health

# 404 Test
curl http://localhost:3000/nonexistent

# POST Request
curl -X POST http://localhost:3000/api/_FeatureAnforderung_Hello_World_CLI_Tool \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "value": 123}'
```

## Automatische Tests

```bash
# Unit & Integration Tests
npm test

# Erwartung: 278 Tests PASS
```

## Debug Mode

```bash
# Mit Nodemon (Auto-Reload)
npm run dev
```

## Hinweis

⚠️ **Wichtig:** Der generierte Code ist ein **REST API Server**, nicht ein CLI Tool wie in den Requirements beschrieben. Die Technical Requirements haben aus den funktionalen Anforderungen automatisch 92 API-Endpoints erstellt.

Für ein echtes CLI-Tool müsste die Architektur anders sein (kein Express, sondern z.B. `commander` oder `yargs` für CLI-Parsing).
