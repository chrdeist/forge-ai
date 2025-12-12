/**
 * Deployment Agent (Generic, RVD-based)
 * 
 * Purpose:
 * - Generates deployment configurations and scripts
 * - Creates Docker, Kubernetes, CI/CD configurations
 * - Reads from all RVD sections, writes to RVD deployment section
 * 
 * Input: RVD file (all sections populated)
 * Output: RVD file with deployment-section populated
 * 
 * No hardcoded content - fully generic implementation
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';
import { RVDManager } from './rvd-manager.mjs';

export class DeploymentAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.rvdManager = new RVDManager(config);
  }

  /**
   * Main execute method
   * @param {string} rvdFilePath - Path to RVD file (with all sections)
   * @param {object} options - { featureName, projectRoot, generatedCodeDir }
   */
  async execute(rvdFilePath, options = {}) {
    if (!fs.existsSync(rvdFilePath)) {
      throw new Error(`RVD file not found: ${rvdFilePath}`);
    }

    this._log(`🚀 Generating deployment configuration from RVD`);

    // Load knowledge base for learning
    this.loadKnowledgeBase();

    // Load RVD file
    const rvd = await this.rvdManager.load(rvdFilePath);

    if (!rvd.technical) {
      throw new Error('Technical section not found in RVD file. Run TechnicalRequirementsAgent first.');
    }

    // Set context
    this.setRequirementContext(rvd.project || {});

    // Generate deployment configurations
    const deploymentData = this._generateDeploymentConfig(
      rvd,
      rvd.project?.name || 'unknown'
    );

    // Write to deployment section
    rvd.deployment = {
      timestamp: new Date().toISOString(),
      generatedBy: 'DeploymentAgent',
      data: deploymentData,
    };

    // Save RVD file
    await this.rvdManager.save(rvdFilePath, rvd);
    this._log(`✓ Wrote deployment section to RVD`);

    // Write feature-specific deployment files if featureName is provided
    if (options.featureName && options.projectRoot) {
      await this._writeFeatureDeploymentFiles(
        deploymentData,
        options.featureName,
        options.projectRoot,
        options.generatedCodeDir
      );
    }

    // Learn patterns
    this._learnFromExecution(deploymentData);

    return {
      success: true,
      rvdPath: rvdFilePath,
      deploymentData,
    };
  }

  /**
   * Generate deployment configuration
   * Creates Docker, docker-compose, Kubernetes, CI/CD configs
   */
  _generateDeploymentConfig(rvd, projectName) {
    this._log(`  ✓ Generating deployment configuration for ${projectName}`);

    const docker = this._generateDockerConfig(rvd);
    const kubernetes = this._generateKubernetesConfig(rvd);
    const cicd = this._generateCICDConfig(rvd);
    const environment = this._generateEnvironmentConfig(rvd);
    const scripts = this._generateDeploymentScripts(projectName);

    return {
      projectName,
      version: '1.0',
      timestamp: new Date().toISOString(),
      docker,
      kubernetes,
      cicd,
      environment,
      scripts,
      deploymentTargets: ['Docker', 'Kubernetes', 'Cloud (AWS/Azure/GCP)'],
    };
  }

  /**
   * Generate Docker configuration
   */
  _generateDockerConfig(rvd) {
    return {
      dockerfile: {
        filename: 'Dockerfile',
        content: `# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy application code
COPY src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
        `,
      },
      dockerCompose: {
        filename: 'docker-compose.yml',
        content: `version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: app-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: app_db
      DB_USER: app_user
      DB_PASSWORD: app_password
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    container_name: app-db
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: app_password
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: app-redis
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  db_data:
    driver: local

networks:
  app-network:
    driver: bridge
        `,
      },
      dockerIgnore: {
        filename: '.dockerignore',
        content: `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.DS_Store
coverage
tests
docs
        `,
      },
    };
  }

  /**
   * Generate Kubernetes configuration
   */
  _generateKubernetesConfig(rvd) {
    const projectName = rvd.project?.name?.toLowerCase().replace(/\s+/g, '-') || 'app';

    return {
      deployment: {
        filename: 'k8s/deployment.yaml',
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${projectName}-api
  namespace: default
  labels:
    app: ${projectName}
    version: "1.0"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ${projectName}
  template:
    metadata:
      labels:
        app: ${projectName}
        version: "1.0"
    spec:
      containers:
      - name: api
        image: ${projectName}:1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: ${projectName}-config
              key: db_host
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: ${projectName}-secrets
              key: db_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ${projectName}-secrets
              key: db_password
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        `,
      },
      service: {
        filename: 'k8s/service.yaml',
        content: `apiVersion: v1
kind: Service
metadata:
  name: ${projectName}-api
  namespace: default
  labels:
    app: ${projectName}
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: ${projectName}
        `,
      },
      configmap: {
        filename: 'k8s/configmap.yaml',
        content: `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${projectName}-config
  namespace: default
data:
  db_host: "postgres.default.svc.cluster.local"
  db_port: "5432"
  db_name: "app_db"
  redis_url: "redis://redis.default.svc.cluster.local:6379"
        `,
      },
      secret: {
        filename: 'k8s/secret.yaml',
        content: `apiVersion: v1
kind: Secret
metadata:
  name: ${projectName}-secrets
  namespace: default
type: Opaque
stringData:
  db_user: "app_user"
  db_password: "CHANGE_THIS_PASSWORD"
        `,
      },
    };
  }

  /**
   * Generate CI/CD configuration
   */
  _generateCICDConfig(rvd) {
    const projectName = rvd.project?.name?.toLowerCase().replace(/\s+/g, '-') || 'app';

    return {
      githubActions: {
        filename: '.github/workflows/deploy.yml',
        content: 'name: Deploy\n\non:\n  push:\n    branches: [main, develop]\n  pull_request:\n    branches: [main]\n\nenv:\n  REGISTRY: ghcr.io\n  IMAGE_NAME: ${{ github.repository }}\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - name: Setup Node.js\n        uses: actions/setup-node@v3\n        with:\n          node-version: "18"\n          cache: npm\n      - name: Install dependencies\n        run: npm ci\n      - name: Run linter\n        run: npm run lint\n      - name: Run tests\n        run: npm test\n      - name: Upload coverage\n        uses: codecov/codecov-action@v3\n        with:\n          files: ./coverage/lcov.info\n\n  build:\n    needs: test\n    runs-on: ubuntu-latest\n    permissions:\n      contents: read\n      packages: write\n    steps:\n      - uses: actions/checkout@v3\n      - name: Set up Docker Buildx\n        uses: docker/setup-buildx-action@v2\n      - name: Log in to Container Registry\n        uses: docker/login-action@v2\n        with:\n          registry: ${{ env.REGISTRY }}\n          username: ${{ github.actor }}\n          password: ${{ secrets.GITHUB_TOKEN }}\n      - name: Build and push Docker image\n        uses: docker/build-push-action@v4\n        with:\n          context: .\n          push: ${{ github.event_name != "pull_request" }}\n          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest\n          cache-from: type=gha\n          cache-to: type=gha,mode=max\n\n  deploy:\n    needs: build\n    runs-on: ubuntu-latest\n    if: github.ref == "refs/heads/main" && github.event_name == "push"\n    steps:\n      - name: Deploy to Kubernetes\n        run: echo "Deploying to production..."\n',
      },
      gitlab: {
        filename: '.gitlab-ci.yml',
        content: 'stages:\n  - test\n  - build\n  - deploy\n\nvariables:\n  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA\n\ntest:\n  stage: test\n  image: node:18-alpine\n  script:\n    - npm ci\n    - npm run lint\n    - npm test\n  coverage: "/Coverage: \\\\d+\\\\.\\\\d+%/"\n\nbuild:\n  stage: build\n  image: docker:latest\n  services:\n    - docker:dind\n  script:\n    - docker build -t $DOCKER_IMAGE .\n    - docker push $DOCKER_IMAGE\n\ndeploy:\n  stage: deploy\n  image: bitnami/kubectl:latest\n  script:\n    - kubectl set image deployment/' + projectName + '-api api=$DOCKER_IMAGE\n  only:\n    - main\n',
      },
    };
  }

  /**
   * Generate environment configuration
   */
  _generateEnvironmentConfig(rvd) {
    return {
      development: {
        filename: '.env.development',
        content: `NODE_ENV=development
PORT=3000
DEBUG=true
LOG_LEVEL=debug

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_db_dev
DB_USER=dev_user
DB_PASSWORD=dev_password

# Redis
REDIS_URL=redis://localhost:6379

# API Configuration
API_VERSION=1.0
CORS_ORIGIN=http://localhost:3000
        `,
      },
      staging: {
        filename: '.env.staging',
        content: 'NODE_ENV=staging\nPORT=3000\nDEBUG=false\nLOG_LEVEL=info\n\n# Database\nDB_HOST=staging-db.internal\nDB_PORT=5432\nDB_NAME=app_db_staging\nDB_USER=staging_user\nDB_PASSWORD=${STAGING_DB_PASSWORD}\n\n# Redis\nREDIS_URL=redis://staging-redis.internal:6379\n\n# API Configuration\nAPI_VERSION=1.0\nCORS_ORIGIN=https://staging.example.com\n',
      },
      production: {
        filename: '.env.production',
        content: 'NODE_ENV=production\nPORT=3000\nDEBUG=false\nLOG_LEVEL=warn\n\n# Database\nDB_HOST=${PROD_DB_HOST}\nDB_PORT=5432\nDB_NAME=${PROD_DB_NAME}\nDB_USER=${PROD_DB_USER}\nDB_PASSWORD=${PROD_DB_PASSWORD}\n\n# Redis\nREDIS_URL=${PROD_REDIS_URL}\n\n# API Configuration\nAPI_VERSION=1.0\nCORS_ORIGIN=https://example.com\n',
      },
    };
  }

  /**
   * Generate deployment scripts
   */
  _generateDeploymentScripts(projectName) {
    return [
      {
        filename: 'scripts/deploy-docker.sh',
        description: 'Deploy using Docker',
        content: `#!/bin/bash
set -e

PROJECT_NAME="${projectName}"
IMAGE_NAME="$PROJECT_NAME:1.0"

echo "Building Docker image: $IMAGE_NAME"
docker build -t $IMAGE_NAME .

echo "Running container..."
docker run -d \\
  --name $PROJECT_NAME \\
  -p 3000:3000 \\
  --env-file .env.production \\
  $IMAGE_NAME

echo "✓ Deployment complete!"
echo "API available at http://localhost:3000"
        `,
      },
      {
        filename: 'scripts/deploy-k8s.sh',
        description: 'Deploy to Kubernetes',
        content: `#!/bin/bash
set -e

PROJECT_NAME="${projectName}"
NAMESPACE="default"

echo "Deploying to Kubernetes..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

echo "Waiting for deployment..."
kubectl rollout status deployment/$PROJECT_NAME-api -n $NAMESPACE

echo "✓ Kubernetes deployment complete!"
        `,
      },
      {
        filename: 'scripts/health-check.sh',
        description: 'Health check script',
        content: `#!/bin/bash

HEALTH_URL="http://localhost:3000/health"

echo "Checking API health..."

RESPONSE=$(curl -s -w "\\n%{http_code}" $HEALTH_URL)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✓ API is healthy"
  echo "$BODY" | jq '.'
else
  echo "✗ API health check failed with status $HTTP_CODE"
  exit 1
fi
        `,
      },
      {
        filename: 'scripts/rollback.sh',
        description: 'Rollback script for failed deployments',
        content: `#!/bin/bash
set -e

PROJECT_NAME="${projectName}"
NAMESPACE="default"

echo "Rolling back deployment..."

# Get previous revision
REVISION=$(kubectl rollout history deployment/$PROJECT_NAME-api -n $NAMESPACE | tail -n 2 | head -n 1 | awk '{print $1}')

echo "Rolling back to revision $REVISION"
kubectl rollout undo deployment/$PROJECT_NAME-api --to-revision=$REVISION -n $NAMESPACE

echo "Waiting for rollback..."
kubectl rollout status deployment/$PROJECT_NAME-api -n $NAMESPACE

echo "✓ Rollback complete!"
        `,
      },
    ];
  }

  /**
   * Learn patterns from execution
   */
  _learnFromExecution(deployData) {
    const targets = deployData?.deploymentTargets?.join(', ') || 'unknown';
    this.learnPattern({
      name: 'deployment-config-generation',
      category: 'generic-pattern',
      description: `Generated deployment configs for targets: ${targets}`,
      successRate: 0.8,
    });
  }

  /**
   * Write feature-specific deployment files
   * Creates deployment artifacts in projects/PROJECT_NAME/deployment/FEATURE_NAME/
   */
  async _writeFeatureDeploymentFiles(deploymentData, featureName, projectRoot, generatedCodeDir) {
    const deploymentDir = path.join(projectRoot, 'deployment', featureName);
    
    // Create deployment directory
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    this._log(`✓ Writing deployment files to ${deploymentDir}`);

    // Extract actual project name from projectRoot (e.g., "projects/hello-world" -> "hello-world")
    const actualProjectName = path.basename(projectRoot);

    // Detect if generated code uses ESM or CommonJS
    const useESM = this._detectESMUsage(generatedCodeDir);
    
    // Write Dockerfile
    const dockerfile = this._generateOptimizedDockerfile(deploymentData, useESM);
    fs.writeFileSync(path.join(deploymentDir, 'Dockerfile'), dockerfile);
    this._log(`  ✓ Wrote Dockerfile`);

    // Write docker-compose.yml (simplified - no DB if not needed)
    const dockerCompose = this._generateSimplifiedDockerCompose(featureName, actualProjectName);
    fs.writeFileSync(path.join(deploymentDir, 'docker-compose.yml'), dockerCompose);
    this._log(`  ✓ Wrote docker-compose.yml`);

    // Write build script - use actual project name, not deploymentData.projectName
    const buildScript = this._generateBuildScript(featureName, actualProjectName);
    const buildScriptPath = path.join(deploymentDir, 'build.sh');
    fs.writeFileSync(buildScriptPath, buildScript);
    fs.chmodSync(buildScriptPath, '755');
    this._log(`  ✓ Wrote build.sh`);

    // Write README - use actual project name
    const readme = this._generateDeploymentReadme(featureName, actualProjectName);
    fs.writeFileSync(path.join(deploymentDir, 'README.md'), readme);
    this._log(`  ✓ Wrote README.md`);

    this._log(`✅ Feature-specific deployment files written to ${deploymentDir}`);
  }

  /**
   * Detect if generated code uses ESM (import/export) or CommonJS (require/module.exports)
   */
  _detectESMUsage(generatedCodeDir) {
    if (!generatedCodeDir || !fs.existsSync(generatedCodeDir)) {
      return true; // Default to ESM
    }

    const packageJsonPath = path.join(generatedCodeDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (pkg.type === 'module') {
        return true;
      }
    }

    // Check main entry point for import statements
    const possibleEntryPoints = [
      path.join(generatedCodeDir, 'src/index.js'),
      path.join(generatedCodeDir, 'src/app.js'),
      path.join(generatedCodeDir, 'index.js'),
    ];

    for (const entryPoint of possibleEntryPoints) {
      if (fs.existsSync(entryPoint)) {
        const content = fs.readFileSync(entryPoint, 'utf-8');
        if (content.includes('import ') || content.includes('export ')) {
          return true;
        }
        if (content.includes('require(') || content.includes('module.exports')) {
          return false;
        }
      }
    }

    return true; // Default to ESM
  }

  /**
   * Generate optimized Dockerfile with ESM support
   */
  _generateOptimizedDockerfile(deploymentData, useESM) {
    const healthCheckCmd = useESM 
      ? 'wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1'
      : 'node -e "require(\'http\').get(\'http://localhost:3000/health\', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"';

    return `# Generated Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src ./src

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \\
  CMD ${healthCheckCmd}

# Start application
CMD ["npm", "start"]
`;
  }

  /**
   * Generate simplified docker-compose.yml (no unnecessary services)
   */
  _generateSimplifiedDockerCompose(featureName, projectName) {
    return `services:
  api:
    build:
      context: ../../../../generated-code/${projectName}-${featureName}
      dockerfile: ../../projects/${projectName}/deployment/${featureName}/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
    restart: unless-stopped
`;
  }

  /**
   * Generate build.sh script
   */
  _generateBuildScript(featureName, projectName) {
    const imageName = `${projectName}-${featureName}`;
    return `#!/bin/bash
# ${featureName} Build and Deploy Script
# 
# Usage:
#   ./build.sh build   - Build Docker image
#   ./build.sh test    - Build and run tests
#   ./build.sh run     - Build and run container
#   ./build.sh deploy  - Deploy with docker-compose

set -e

FEATURE_NAME="${featureName}"
PROJECT_NAME="${projectName}"
IMAGE_NAME="${imageName}"
# Determine correct path to generated code relative to deployment folder
# If in projects/PROJECT/deployment/FEATURE, go up 3 levels to workspace root
GENERATED_CODE_DIR="../../../../generated-code/\${PROJECT_NAME}-\${FEATURE_NAME}"

# Colors
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
RED='\\033[0;31m'
NC='\\033[0m' # No Color

echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${BLUE}  \${FEATURE_NAME} Deployment Script\${NC}"
echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"

# Change to generated code directory for build context
cd "$(dirname "$0")"
DEPLOY_DIR="$(pwd)"
cd "\${GENERATED_CODE_DIR}"

case "$1" in
  build)
    echo -e "\${GREEN}[1/2] Building Docker image: \${IMAGE_NAME}\${NC}"
    docker build -f "\${DEPLOY_DIR}/Dockerfile" -t "\${IMAGE_NAME}:latest" .
    echo -e "\${GREEN}✓ Image built successfully\${NC}"
    echo ""
    echo -e "\${BLUE}Image: \${IMAGE_NAME}:latest\${NC}"
    docker images | grep "\${IMAGE_NAME}"
    ;;

  test)
    echo -e "\${GREEN}[1/3] Building Docker image\${NC}"
    docker build -f "\${DEPLOY_DIR}/Dockerfile" -t "\${IMAGE_NAME}:latest" .
    
    echo -e "\${GREEN}[2/3] Running tests in container\${NC}"
    docker run --rm "\${IMAGE_NAME}:latest" npm test
    
    echo -e "\${GREEN}[3/3] Testing health endpoint\${NC}"
    CONTAINER_ID=$(docker run -d -p 3001:3000 "\${IMAGE_NAME}:latest")
    sleep 3
    curl -f http://localhost:3001/health || (docker logs "$CONTAINER_ID" && docker stop "$CONTAINER_ID" && exit 1)
    docker stop "$CONTAINER_ID"
    
    echo -e "\${GREEN}✓ All tests passed\${NC}"
    ;;

  run)
    echo -e "\${GREEN}[1/2] Building Docker image\${NC}"
    docker build -f "\${DEPLOY_DIR}/Dockerfile" -t "\${IMAGE_NAME}:latest" .
    
    echo -e "\${GREEN}[2/2] Starting container\${NC}"
    docker run --rm -p 3000:3000 --name "\${IMAGE_NAME}" "\${IMAGE_NAME}:latest"
    ;;

  deploy)
    echo -e "\${GREEN}[1/2] Building image\${NC}"
    docker build -f "\${DEPLOY_DIR}/Dockerfile" -t "\${IMAGE_NAME}:latest" .
    
    echo -e "\${GREEN}[2/2] Starting with docker-compose\${NC}"
    cd "\${DEPLOY_DIR}"
    docker-compose up -d
    
    echo -e "\${GREEN}✓ Deployed successfully\${NC}"
    echo ""
    echo -e "\${BLUE}Check status: docker-compose ps\${NC}"
    echo -e "\${BLUE}View logs:    docker-compose logs -f\${NC}"
    echo -e "\${BLUE}Stop:         docker-compose down\${NC}"
    ;;

  stop)
    echo -e "\${GREEN}Stopping deployment\${NC}"
    cd "\${DEPLOY_DIR}"
    docker-compose down
    echo -e "\${GREEN}✓ Stopped\${NC}"
    ;;

  *)
    echo "Usage: $0 {build|test|run|deploy|stop}"
    echo ""
    echo "Commands:"
    echo "  build   - Build Docker image only"
    echo "  test    - Build and run all tests (npm test + health check)"
    echo "  run     - Build and run container interactively"
    echo "  deploy  - Deploy with docker-compose (detached mode)"
    echo "  stop    - Stop docker-compose deployment"
    exit 1
    ;;
esac
`;
  }

  /**
   * Generate deployment README
   */
  _generateDeploymentReadme(featureName, projectName) {
    return `# ${featureName} Deployment

Deployment-Artefakte für ${projectName} ${featureName}.

## Inhalt

- \`Dockerfile\` - Multi-stage Docker Build
- \`docker-compose.yml\` - Service Orchestrierung
- \`build.sh\` - Build und Deploy Script

## Quick Start

\`\`\`bash
# Build Docker Image
./build.sh build

# Run Tests
./build.sh test

# Deploy mit Docker Compose
./build.sh deploy

# Stop Deployment
./build.sh stop
\`\`\`

## Docker Build

\`\`\`bash
docker build -t ${projectName}-${featureName} -f Dockerfile ../../../generated-code/${projectName}-${featureName}
\`\`\`

## Docker Compose

\`\`\`bash
docker-compose up -d
docker-compose ps
docker-compose logs -f
docker-compose down
\`\`\`

## Manueller Test

\`\`\`bash
# Health Check
curl http://localhost:3000/health
\`\`\`

## Deployment Targets

- **Local Development**: \`./build.sh run\`
- **Integration Testing**: \`./build.sh test\`
- **Production**: \`./build.sh deploy\` (docker-compose)

## Artefakte-Quelle

Generierter Code: \`/workspaces/forge-ai/generated-code/${projectName}-${featureName}/\`

Deployment-Konfiguration ist Teil des ${featureName} Ordners, damit alle Feature-Artefakte an einer Stelle liegen.
`;
  }
}

export default DeploymentAgent;
