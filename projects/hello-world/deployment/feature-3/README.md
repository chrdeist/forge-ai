# feature-3 Deployment

Deployment-Artefakte für hello-world feature-3.

## Inhalt

- `Dockerfile` - Multi-stage Docker Build
- `docker-compose.yml` - Service Orchestrierung
- `build.sh` - Build und Deploy Script

## Quick Start

```bash
# Build Docker Image
./build.sh build

# Run Tests
./build.sh test

# Deploy mit Docker Compose
./build.sh deploy

# Stop Deployment
./build.sh stop
```

## Docker Build

```bash
docker build -t hello-world-feature-3 -f Dockerfile ../../../generated-code/hello-world-feature-3
```

## Docker Compose

```bash
docker-compose up -d
docker-compose ps
docker-compose logs -f
docker-compose down
```

## Manueller Test

```bash
# Health Check
curl http://localhost:3000/health
```

## Deployment Targets

- **Local Development**: `./build.sh run`
- **Integration Testing**: `./build.sh test`
- **Production**: `./build.sh deploy` (docker-compose)

## Artefakte-Quelle

Generierter Code: `/workspaces/forge-ai/generated-code/hello-world-feature-3/`

Deployment-Konfiguration ist Teil des feature-3 Ordners, damit alle Feature-Artefakte an einer Stelle liegen.
