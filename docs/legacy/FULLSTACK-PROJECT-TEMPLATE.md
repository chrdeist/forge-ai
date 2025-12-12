# Project Template for Full-Stack Applications

## Struktur für React + Node.js Projekt

```
projects/my-fullstack-app/
├── requirements/
│   └── my-fullstack-app-requirements.md
│
├── sources/
│   ├── e2e.mjs                    # Schema test (fast)
│   ├── e2e-full.mjs               # Full workflow with local npm test
│   └── run.mjs                    # Wrapper
│
├── generated-code/                # Wird generiert
│   ├── package.json               # Main (Node.js)
│   ├── src/
│   │   ├── index.js               # Express server
│   │   ├── routes/
│   │   │   └── api.js
│   │   └── middleware/
│   ├── test/                      # Backend tests
│   │   └── api.test.js
│   │
│   ├── frontend/                  # React app
│   │   ├── package.json           # React deps
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   └── components/
│   │   ├── public/
│   │   └── test/
│   │
│   ├── docs/
│   │   ├── README.md
│   │   └── API.md
│   │
│   └── .gitignore
│
├── test-results/                  # Output
│   └── (wird generiert)
│
├── reports/                       # Output
│   └── (execution logs)
│
└── deployment/                    # Output (Phase 10)
    ├── Dockerfile
    ├── docker-compose.yml
    └── kubernetes-deployment.yaml
```

## Wie das funktioniert

### 1. Requirement schreiben

```markdown
# My FullStack App Requirements

## Functional Requirements
- React frontend with login form
- Express backend with JWT auth
- PostgreSQL database
- REST API for todo items

## Technical Requirements
- Node.js 18+
- React 18+
- Express 4.x
- PostgreSQL 14+

## Test Requirements
- Unit tests for backend (70%+ coverage)
- Integration tests for API
- Frontend component tests
```

### 2. Code generieren + lokal testen

```bash
cd /workspaces/forge-ai

# Generiert Code und testet lokal (kein Docker)
node e2e-runner.mjs --project my-fullstack-app --auto --local-only
```

### 3. Was Forge AI macht

**Generated Code:**
```javascript
// backend: src/index.js
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

// JWT middleware, routes, etc.
```

```jsx
// frontend: frontend/src/App.jsx
import React, { useState } from 'react';

export function App() {
  const [token, setToken] = useState(null);
  
  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const { token } = await res.json();
    setToken(token);
  }
  
  return (
    <div>
      {/* Login form, etc. */}
    </div>
  );
}
```

```json
// package.json
{
  "name": "my-fullstack-app",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "node --test test/**/*.test.js",
    "frontend": "cd frontend && npm start"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.0"
  }
}
```

### 4. Lokal testen (npm)

```bash
cd projects/my-fullstack-app/generated-code

# Installiere Backend + Frontend deps
npm install

# Teste Backend
npm test
# ✅ Backend: 15/15 tests passing
# ✅ Frontend: 8/8 component tests passing
# ✅ Integration: 5/5 API tests passing

# Starte Development
npm run dev              # Backend läuft auf :3000
npm run frontend        # Frontend läuft auf :3001
```

### 5. Browser öffnen

```
http://localhost:3001   # React Frontend
  └─> calls API on :3000
```

### 6. Wenn alles funktioniert: Docker generieren

```bash
cd /workspaces/forge-ai

# Mit Phase 10 Docker generation
node e2e-runner.mjs --project my-fullstack-app --auto

# (ohne --local-only)
```

**Generated Docker artifacts:**
```bash
projects/my-fullstack-app/deployment/
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Backend + Frontend + DB
└── kubernetes/
    ├── deployment.yaml
    └── service.yaml
```

```bash
# Lokal mit Docker testen
cd projects/my-fullstack-app/deployment
docker-compose up

# Browser
http://localhost:3000   # Über reverse proxy auf Frontend
```

## Zusammenfassung

| Schritt | Befehl | Zeit | Output |
|---------|--------|------|--------|
| 1. Requirements | Schreibe MD | 5min | requirements.md |
| 2. Code gen | `e2e-runner ... --local-only` | 2sec | generated-code/ |
| 3. npm test | `npm test` | 1sec | ✅ Tests pass |
| 4. Dev run | `npm run dev` | instant | localhost:3000 |
| 5. Edit code | Code ändern | instant | Hot reload ✅ |
| 6. Docker | `e2e-runner ...` (ohne --local-only) | 5sec | Dockerfile + docker-compose |
| 7. Deploy | `docker-compose up` | instant | Production ready |

## Keine Docker-Hürde!

✅ **Lokal entwickeln ist die Default**  
✅ **Schnelles Feedback** (Code gen + test = 2-3 Sekunden)  
✅ **Kein Docker-Overhead** beim Testen  
⚠️ **Docker nur für Deployment** (Phase 10, optional)

Das ist viel besser für deine Abteilung: Schnelle Iterationen, schnelle Tests, keine Docker-Komplexität wenn nicht nötig!
