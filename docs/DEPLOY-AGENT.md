# DeployAgent - Container & Deployment Configuration

**Phase 10 of the Forge AI workflow**

## Overview

The `DeployAgent` automates containerization and deployment configuration for generated applications. It receives implementation artifacts from the ImplementationAgent and produces:

- ✅ Multi-stage Dockerfile with security best practices
- ✅ docker-compose.yml with health checks and resource limits
- ✅ Kubernetes deployment manifests (production-ready)
- ✅ systemd service unit (direct Linux deployment)
- ✅ CI/CD pipeline templates (GitHub Actions, GitLab CI)
- ✅ Environment configuration templates
- ✅ Deployment readiness assessment

## Input Requirements

DeployAgent expects input from **ImplementationAgent** containing:

```javascript
{
  requirement: {
    name: string,        // Project/app name
    // ... other metadata
  },
  files: [
    { path: string, content: string },  // Implementation files
    // ...
  ],
  testResults: {
    passed: number,      // Tests that passed
    failed: number,      // Tests that failed (must be 0)
    coverage: string,    // e.g., "94%"
  },
  lintResults: {
    errors: number,      // Must be 0
    warnings: number,
  },
}
```

**Critical validations:**
- ❌ Cannot deploy if tests are failing
- ❌ Cannot deploy if linting has errors
- ❌ Requires implementation files to exist

## Output Structure

```javascript
{
  status: 'DEPLOYMENT_CONFIGURED',
  requirement: { name, priority, owner },
  
  dockerfile: {
    content: string,        // Multi-stage Dockerfile
    path: 'Dockerfile',
    size: number,          // Bytes
    layerCount: number,    // Docker layers
  },

  dockerCompose: {
    content: string,       // docker-compose.yml
    path: 'docker-compose.yml',
    services: ['app-name'], // Service names
  },

  manifests: {
    kubernetes: string,    // K8s deployment.yaml
    systemd: string,       // systemd .service file
  },

  environment: {
    template: string,      // .env.template
    variables: {           // Defined env vars
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      // ...
    },
  },

  cicd: {
    github: string,        // GitHub Actions workflow
    gitlab: string,        // GitLab CI config
  },

  readiness: {
    score: number,         // 0-100
    status: string,        // 'READY_FOR_DEPLOYMENT' or 'NEEDS_ATTENTION'
    checks: {              // Individual check results
      testsPassing: boolean,
      codeCoverage: boolean,
      lintResults: boolean,
      dockerfileGenerated: boolean,
      composeDefined: boolean,
      deploymentManifest: boolean,
    },
    issues: [              // Any blocking issues
      { name: string, severity: 'critical' | 'warning' },
    ],
    recommendations: [
      string,              // Deployment recommendations
    ],
  },

  metadata: {
    agent: 'DeployAgent',
    timestamp: ISO8601,
    containerRuntime: 'docker',
    orchestrator: 'docker-compose', // or 'kubernetes', 'systemd'
    baseImage: 'node:20-alpine',
  },
}
```

## Generated Artifacts

### 1. Dockerfile (Multi-Stage Build)

```dockerfile
# Build stage - compiles and tests
FROM node:20-alpine as builder
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm test -- --coverage

# Runtime stage - minimal final image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
USER nodejs
EXPOSE 3000
HEALTHCHECK ...
CMD ["node", "src/index.js"]
```

**Features:**
- Multi-stage build for minimal image size
- Security: non-root user (nodejs)
- Health checks for container orchestration
- Layer optimization for build caching

### 2. docker-compose.yml

```yaml
version: '3.9'

services:
  app-name:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "node", "-e", "..."]
      interval: 30s
      retries: 3
    restart: unless-stopped
```

**Features:**
- Resource limits and reservations
- Health checks
- Automatic restart on failure
- Volume management for data persistence
- JSON file logging with rotation

### 3. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-name
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app-name
        image: registry.example.com/app-name:latest
        ports:
        - containerPort: 3000
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: app-name-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
```

**Features:**
- 3 replicas for high availability
- Health probes (liveness + readiness)
- Resource requests and limits
- Service for load balancing

### 4. systemd Service Unit

```ini
[Unit]
Description=app-name - Generated by Forge AI
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
ExecStart=/usr/bin/docker run --rm \
  --name app-name \
  --net host \
  myregistry/app-name:latest
ExecStop=/usr/bin/docker stop app-name
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

**Usage:**
```bash
# Install
sudo cp app-name.service /etc/systemd/system/
sudo systemctl daemon-reload

# Start
sudo systemctl start app-name
sudo systemctl enable app-name

# Monitor
sudo systemctl status app-name
sudo journalctl -u app-name -f
```

### 5. .env.template

```bash
# Application
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# Database (if applicable)
# DATABASE_URL=postgresql://...

# API Keys
# API_KEY=...

# Monitoring
# SENTRY_DSN=...

# Timeouts
HEALTH_CHECK_INTERVAL=30000
GRACEFUL_SHUTDOWN_TIMEOUT=30000
```

### 6. CI/CD Pipelines

#### GitHub Actions (.github/workflows/build-deploy.yml)

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm test
      - run: docker build -t ghcr.io/${{ github.repository }}:latest .
      - run: docker push ghcr.io/${{ github.repository }}:latest
```

#### GitLab CI (.gitlab-ci.yml)

```yaml
stages:
  - test
  - build
  - deploy

test:
  image: node:20
  script:
    - npm ci && npm test

build:
  image: docker:latest
  script:
    - docker build -t $REGISTRY/$CI_PROJECT_NAME:latest .
    - docker push $REGISTRY/$CI_PROJECT_NAME:latest
```

## Deployment Readiness Assessment

The `readiness` property provides a deployment readiness score (0-100):

| Check | Weight | Status | Comment |
|-------|--------|--------|---------|
| Tests Passing | 25% | ✅ | All unit/E2E tests pass |
| Code Coverage | 20% | ✅ | Coverage >= threshold |
| Lint Results | 15% | ✅ | No eslint/prettier errors |
| Dockerfile | 15% | ✅ | Generated successfully |
| Compose | 10% | ✅ | Orchestration configured |
| Manifests | 15% | ✅ | K8s/systemd ready |

**Scores:**
- **90-100:** READY_FOR_DEPLOYMENT ✅
- **70-89:** NEEDS_ATTENTION ⚠️
- **<70:** NOT_READY ❌

## Deployment Process

### Local Development (docker-compose)

```bash
# Build and run locally
docker-compose up --build

# Check container
docker ps
docker logs <container-id>

# Deploy update
docker-compose down
docker-compose up -d
```

### Production (Kubernetes)

```bash
# Create namespace
kubectl create namespace app-namespace

# Deploy
kubectl apply -f kubernetes-deployment.yaml -n app-namespace

# Check rollout
kubectl rollout status deployment/app-name -n app-namespace

# Monitor
kubectl logs -f deployment/app-name -n app-namespace
```

### Production (systemd)

```bash
# Install and enable
sudo systemctl enable app-name.service
sudo systemctl start app-name.service

# Monitor
sudo systemctl status app-name.service
sudo journalctl -u app-name -f --lines=100
```

## Configuration Options

When instantiating DeployAgent:

```javascript
const deployAgent = new DeployAgent(logger, tracker, {
  containerRuntime: 'docker',        // 'docker', 'podman'
  orchestrator: 'docker-compose',    // 'docker-compose', 'kubernetes', 'systemd'
  registry: 'ghcr.io/myorg',         // Docker registry URL
  imageName: 'myorg/app:latest',     // Full image name
  baseImage: 'node:20-alpine',       // Base image to use
  exposePorts: [3000],               // Ports to expose
  healthCheck: true,                 // Enable health checks
});
```

## Learning & Patterns

DeployAgent learns deployment patterns and registers them:

```javascript
{
  name: 'deployment-pattern',
  category: 'deployment',
  successRate: 0.95,
  description: 'Containerization pattern for [project-name]',
  baseImage: 'node:20-alpine',
  orchestrator: 'docker-compose',
  includedArtifacts: [
    'Dockerfile',
    'docker-compose.yml',
    'kubernetes-deployment.yaml',
    'systemd-service.unit',
    '.env.template',
  ],
}
```

These patterns are persisted to the knowledge base for reuse in future projects.

## Best Practices

### Security
- ✅ Use specific base image versions (not `latest`)
- ✅ Run as non-root user
- ✅ Use multi-stage builds to minimize image size
- ✅ Scan images for vulnerabilities
- ✅ Don't commit secrets in .env files

### Performance
- ✅ Order Dockerfile commands by change frequency
- ✅ Use .dockerignore to exclude unnecessary files
- ✅ Set resource limits appropriately
- ✅ Use Alpine Linux for smaller images

### Reliability
- ✅ Implement health checks
- ✅ Set restart policies
- ✅ Use readiness/liveness probes (K8s)
- ✅ Log aggregation (ELK, DataDog, etc.)

### Maintainability
- ✅ Use docker-compose for local development
- ✅ Keep environment-specific configs separate
- ✅ Document deployment procedures
- ✅ Test deployments in staging first

## Troubleshooting

### Build Fails
```bash
# Check Dockerfile syntax
docker build --progress=plain .

# View layer history
docker history <image-id>
```

### Container Won't Start
```bash
# Check logs
docker logs <container-id>

# Inspect image
docker inspect <image-id>

# Test locally
docker run -it <image> /bin/sh
```

### Health Checks Failing
```bash
# Manual health check test
curl -v http://localhost:3000/health

# Add debug logging
ENV DEBUG=* before CMD
```

## Integration with E2E Tests

The E2E test includes Phase 10 deployment:

```bash
# Run full workflow including deployment
node examples/01-hello-world/e2e.mjs

# Check generated Docker artifacts
ls -la forge-ai-work/*/
```

The test validates:
- ✅ Dockerfile generated correctly
- ✅ docker-compose.yml includes all services
- ✅ Deployment readiness score >= 90
- ✅ All deployment artifacts present

## Next Steps

1. **Push to Registry:** Docker images to container registry (DockerHub, GHCR, ECR)
2. **Deploy:** Use generated manifests to deploy to target environment
3. **Monitor:** Set up observability (logs, metrics, traces)
4. **Iterate:** Apply updates and redeploy
5. **Scale:** Adjust replica counts and resources based on demand

---

**Status:** ✅ Implemented and tested  
**Version:** 1.0  
**Location:** `packages/agents/deploy-agent.mjs`  
**Phase:** 10 (Deployment & Containerization)
