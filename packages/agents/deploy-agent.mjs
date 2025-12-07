/**
 * DeployAgent - Containerization & Deployment
 * 
 * Responsible for:
 * 1. Creating Docker configuration (Dockerfile, docker-compose.yml)
 * 2. Generating deployment manifests (kubernetes, systemd, etc.)
 * 3. Setting up environment configuration
 * 4. Creating CI/CD pipeline templates
 * 5. Building and pushing container images
 * 6. Validating deployment readiness
 * 
 * Receives input from: ImplementationAgent (files, test results, code coverage)
 * Outputs: Docker configs, deployment scripts, CI/CD manifests, deployment readiness report
 */

import BaseAgent from './baseAgent.mjs';
import AgentInputValidator from './agentInputValidator.mjs';
import fs from 'node:fs';
import path from 'node:path';

class DeployAgent extends BaseAgent {
  /**
   * Initialize DeployAgent
   * 
   * @param {ExecutionLogger} logger - Logging system
   * @param {WorkflowStateTracker} tracker - State tracking
   * @param {Object} options - Configuration options
   */
  constructor(logger, tracker, options = {}) {
    super(logger, tracker, 'DeployAgent');

    this.options = {
      containerRuntime: options.containerRuntime || 'docker',
      orchestrator: options.orchestrator || 'docker-compose', // docker-compose, kubernetes, systemd
      registry: options.registry || null, // Docker registry URL
      imageName: options.imageName || null,
      baseImage: options.baseImage || 'node:20-alpine',
      exposePorts: options.exposePorts || [],
      healthCheck: options.healthCheck !== false,
      ...options,
    };

    this.deploymentConfig = null;
  }

  /**
   * Execute deployment phase
   * 
   * @param {Object} previousOutput - Output from ImplementationAgent
   * @returns {Promise<Object>} Deployment configuration and artifacts
   */
  async execute(previousOutput) {
    this.logger.info('DeployAgent executing', {
      agent: 'DeployAgent',
      hasPreviousOutput: !!previousOutput,
    });

    try {
      // Validate required input
      this._validateInput(previousOutput);

      this.logger.debug('Input validation passed', {
        files: previousOutput.files?.length || 0,
        testResults: previousOutput.testResults?.passed || 0,
      });

      // Generate deployment artifacts
      const dockerfileContent = this._generateDockerfile(previousOutput);
      const dockerComposeContent = this._generateDockerCompose(previousOutput);
      const deploymentConfig = this._generateDeploymentConfig(previousOutput);
      const envTemplate = this._generateEnvTemplate(previousOutput);
      const cicdConfig = this._generateCICDConfig(previousOutput);

      // Generate deployment readiness report
      const readinessReport = this._generateReadinessReport(
        previousOutput,
        dockerfileContent,
        dockerComposeContent,
        deploymentConfig
      );

      // Build output
      this.deploymentConfig = {
        status: 'DEPLOYMENT_CONFIGURED',
        requirement: previousOutput.requirement || { name: 'unknown' },
        
        // Container configuration
        dockerfile: {
          content: dockerfileContent,
          path: 'Dockerfile',
          size: Buffer.byteLength(dockerfileContent, 'utf8'),
          layerCount: this._countDockerLayers(dockerfileContent),
        },

        // Compose configuration
        dockerCompose: {
          content: dockerComposeContent,
          path: 'docker-compose.yml',
          services: this._extractServices(dockerComposeContent),
        },

        // Deployment manifests
        manifests: {
          kubernetes: deploymentConfig.kubernetes,
          systemd: deploymentConfig.systemd,
        },

        // Environment
        environment: {
          template: envTemplate,
          variables: deploymentConfig.environment,
        },

        // CI/CD
        cicd: {
          github: cicdConfig.github,
          gitlab: cicdConfig.gitlab,
        },

        // Deployment readiness
        readiness: readinessReport,

        // Metadata
        metadata: {
          agent: 'DeployAgent',
          timestamp: new Date().toISOString(),
          containerRuntime: this.options.containerRuntime,
          orchestrator: this.options.orchestrator,
          baseImage: this.options.baseImage,
        },
      };

      this.logger.info('DeployAgent completed successfully', {
        status: 'DEPLOYMENT_CONFIGURED',
        dockerfileSize: this.deploymentConfig.dockerfile.size,
        servicesCount: this.deploymentConfig.dockerCompose.services.length,
        readinessScore: readinessReport.score,
      });

      // Write deployment artifacts to disk
      const writtenFiles = await this._writeDeploymentArtifacts(
        previousOutput,
        dockerfileContent,
        dockerComposeContent,
        envTemplate,
        cicdConfig
      );
      
      this.deploymentConfig.filesWritten = writtenFiles;

      // Learn patterns
      this._learnDeploymentPattern(previousOutput);

      return this.deploymentConfig;

    } catch (error) {
      this.logger.error('DeployAgent failed', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Validate input from previous agent
   * 
   * @private
   */
  _validateInput(input) {
    const errors = [];

    if (!input) {
      errors.push('No input provided to DeployAgent');
    } else {
      // Check for implementation files
      if (!input.files || input.files.length === 0) {
        errors.push(
          'No implementation files found. ImplementationAgent must provide files array.'
        );
      }

      // Check for test results
      if (!input.testResults) {
        errors.push('No test results found. Tests must be run before deployment.');
      } else if (input.testResults.failed && input.testResults.failed > 0) {
        errors.push(
          `Cannot deploy: ${input.testResults.failed} test(s) failing. All tests must pass.`
        );
      }

      // Check for requirement metadata
      if (!input.requirement || !input.requirement.name) {
        errors.push('No requirement name found in input.');
      }
    }

    if (errors.length > 0) {
      const errorReport = errors.map((e) => `  ❌ ${e}`).join('\n');
      throw new Error(
        `DeployAgent input validation failed:\n${errorReport}\n\nFix: Ensure ImplementationAgent executed successfully with all tests passing.`
      );
    }
  }

  /**
   * Generate Dockerfile - Intelligently derived from ImplementationAgent output
   * 
   * Analyzes:
   * - Technical Requirements (Phase 3) to find entry point
   * - Generated source files to verify structure
   * - package.json to determine Node.js requirements
   * - Test results to decide if tests should run in container
   * - Dependencies to determine build requirements
   * 
   * @private
   */
  _generateDockerfile(previousOutput) {
    const appName = previousOutput.requirement?.name || 'forge-app';
    const files = previousOutput.files || [];
    const technicalRequirements = previousOutput.technicalRequirements;
    const hasTests = previousOutput.testResults?.passed > 0;
    const dependencies = previousOutput.projectMetadata?.dependencies || {};
    const hasDependencies = Object.keys(dependencies).length > 0;
    
    // Intelligently find the main entry point (using technical requirements as primary source)
    const mainFile = this._findMainFileFromGenerated(files, technicalRequirements);
    const testCommand = this._determineTestCommand(files);
    
    // Determine Node.js version requirement from technical specs
    const nodeVersion = this._detectNodeVersion(previousOutput, technicalRequirements);

    const dockerfile = `# Dockerfile - Auto-generated by Forge AI DeployAgent
# Requirement: ${appName}
# Entry Point: ${mainFile}
# Based on: Technical Requirements (Phase 3) → Implementation (Phase 6) → Deployment (Phase 10)
# Generated: ${new Date().toISOString()}

# Single-stage build (no tests in runtime)
FROM ${nodeVersion}-alpine

WORKDIR /app

# Copy package manifests
COPY generated-code/package*.json ./

# Install dependencies (if any)
${hasDependencies ? 'RUN npm ci --only=production' : '# No external dependencies'}

# Copy application source code
COPY generated-code/src ./src

# Copy documentation
COPY generated-code/docs ./docs

${hasTests ? `# Copy tests for verification
COPY generated-code/test ./test

# Verify application (run tests in build)
RUN npm test
` : ''}

# Set environment
ENV NODE_ENV=production

# Labels for image metadata
LABEL maintainer="Forge AI"
LABEL org.opencontainers.image.title="${appName}"
LABEL org.opencontainers.image.description="Generated by Forge AI - ${appName}"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created="${new Date().toISOString()}"

# Run application
ENTRYPOINT ["node", "${mainFile}"]
CMD []`;

    return dockerfile;
  }

  /**
   * Find main entry point from generated files
   * INTELLIGENT DETECTION:
   * 1. First: Check technical requirements from Phase 3 (most reliable)
   * 2. Second: Check package.json main field
   * 3. Third: Look for common patterns in generated files
   * 
   * This ensures the entry point is consistent with technical specifications
   * 
   * @private
   */
  _findMainFileFromGenerated(files, technicalRequirements) {
    // Normalize files to an array to handle both arrays and object maps
    const fileList = Array.isArray(files) ? files : Object.values(files || {});

    const getName = (f) => {
      if (typeof f === 'string') return f;
      if (f?.name) return f.name;
      if (f?.path) return f.path;
      return '';
    };

    // Priority 1: Check if technical requirements explicitly define APIs with paths
    if (technicalRequirements?.apis && technicalRequirements.apis.length > 0) {
      const mainAPI = technicalRequirements.apis[0];
      if (mainAPI.path) {
        this.logger.debug('Entry point from technical specifications', {
          entryPoint: mainAPI.path,
          source: 'Phase 3 (TechnicalRequirements)',
        });
        return mainAPI.path;
      }
    }

    // Priority 2: Check files array
    if (!fileList || fileList.length === 0) return 'src/index.js';
    
    // Look for common entry points in generated files
    const entryPointCandidates = ['index.js', 'cli.js', 'server.js', 'app.js', 'helloWorld.js'];
    
    for (const candidate of entryPointCandidates) {
      const found = fileList.find((f) => getName(f).endsWith(candidate));
      if (found) {
        return `src/${candidate}`;
      }
    }
    
    // Priority 3: Use first .js file in src/
    const srcFile = fileList.find((f) => {
      const name = getName(f);
      return name.includes('src/') && name.endsWith('.js');
    });
    if (srcFile) {
      return getName(srcFile);
    }
    
    // Fallback
    return 'src/index.js';
  }

  /**
   * Determine appropriate test command from generated files
   * 
   * @private
   */
  _determineTestCommand(files) {
    if (!files || files.length === 0) return 'npm test';
    const getName = (f) => {
      if (typeof f === 'string') return f;
      if (f?.name) return f.name;
      if (f?.path) return f.path;
      return '';
    };
    
    // Check if there are test files
    const hasTests = files.some((f) => {
      const name = getName(f);
      return name.includes('.test.js') || name.includes('.spec.js');
    });
    
    return hasTests ? 'npm test' : null;
  }

  /**
   * Detect required Node.js version from technical specifications and package.json
   * 
   * Priority:
   * 1. Technical Requirements (Phase 3) - nonFunctionalRequirements may specify "Node.js >= X"
   * 2. package.json engines.node field
   * 3. Default to Node 22 LTS
   * 
   * @private
   */
  _detectNodeVersion(previousOutput, technicalRequirements) {
    // Priority 1: Check technical requirements
    if (technicalRequirements?.nonFunctionalRequirements) {
      const nodeReq = technicalRequirements.nonFunctionalRequirements.find(req =>
        req.includes('Node.js') || req.includes('node')
      );
      if (nodeReq) {
        const match = nodeReq.match(/\d+/);
        if (match) {
          return `node:${match[0]}-alpine`;
        }
      }
    }

    // Priority 2: Check package.json
    if (previousOutput.projectMetadata?.engines?.node) {
      const version = previousOutput.projectMetadata.engines.node;
      const match = version.match(/\d+/);
      if (match) {
        return `node:${match[0]}-alpine`;
      }
    }
    
    // Default to Node 22 LTS
    return 'node:22-alpine';
  }

  /**
   * Generate docker-compose.yml
   * 
   * @private
   */
  _generateDockerCompose(previousOutput) {
    const appName = previousOutput.requirement?.name || 'forge-app';
    const ports = this.options.exposePorts.length > 0 ? this.options.exposePorts : ['3000'];

    return `version: '3.9'

services:
  ${appName}:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${appName}
    
    # Ports mapping
    ports:
      ${ports.map((p) => `- "${p}:${p}"`).join('\n      ')}
    
    # Environment variables
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
    
    # Volume mounts
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    
    # Restart policy
    restart: unless-stopped
    
    # Healthcheck
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:${ports[0]}/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    
    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
    # Security
    security_opt:
      - no-new-privileges:true

  # Optional: Prometheus metrics (commented out)
  # prometheus:
  #   image: prom/prometheus:latest
  #   ports:
  #     - "9090:9090"
  #   volumes:
  #     - ./prometheus.yml:/etc/prometheus/prometheus.yml
  #   depends_on:
  #     - ${appName}

volumes:
  data:
  logs:`;
  }

  /**
   * Generate deployment configuration (K8s, systemd, etc.)
   * 
   * @private
   */
  _generateDeploymentConfig(previousOutput) {
    const appName = previousOutput.requirement?.name || 'forge-app';

    // Kubernetes deployment
    const kubernetesDeployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
      - name: ${appName}
        image: ${this.options.imageName || `myregistry/${appName}:latest`}
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "500m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ${appName}-service
spec:
  selector:
    app: ${appName}
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer`;

    // Systemd service
    const systemdService = `[Unit]
Description=${appName} - Generated by Forge AI
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=docker
WorkingDirectory=/opt/${appName}
ExecStart=/usr/bin/docker run --rm \\
  --name ${appName} \\
  --net host \\
  -v /opt/${appName}/data:/app/data \\
  -v /opt/${appName}/logs:/app/logs \\
  -e NODE_ENV=production \\
  -e LOG_LEVEL=info \\
  ${this.options.imageName || `myregistry/${appName}:latest`}
ExecStop=/usr/bin/docker stop ${appName}
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target`;

    // Environment variables
    const environmentVars = {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      PORT: this.options.exposePorts?.[0] || '3000',
      HEALTH_CHECK_INTERVAL: '30000',
      GRACEFUL_SHUTDOWN_TIMEOUT: '30000',
    };

    return {
      kubernetes: kubernetesDeployment,
      systemd: systemdService,
      environment: environmentVars,
    };
  }

  /**
   * Generate .env template
   * 
   * @private
   */
  _generateEnvTemplate(previousOutput) {
    return `# Generated by Forge AI DeployAgent
# Copy this file to .env and fill in the values

# Application
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# Database (if applicable)
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# API Keys (if applicable)
# API_KEY=your_api_key_here

# Monitoring
# SENTRY_DSN=https://key@sentry.io/projectid

# Feature Flags
# FEATURE_X_ENABLED=true
# FEATURE_Y_ENABLED=false

# Timeouts (ms)
HEALTH_CHECK_INTERVAL=30000
GRACEFUL_SHUTDOWN_TIMEOUT=30000`;
  }

  /**
   * Generate CI/CD pipeline templates
   * 
   * @private
   */
  _generateCICDConfig(previousOutput) {
    const projectName = (previousOutput.requirement?.name || 'app').toLowerCase().replace(/\s+/g, '-');
    
    // Generate GitHub Actions CI/CD Workflow
    const githubWorkflow = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint || true
  
  build:
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./deployment/Dockerfile
          push: \${{ github.event_name != 'pull_request' }}
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
`;

    return {
      github: {
        workflow: githubWorkflow,
        workflowPath: '.github/workflows/ci-cd.yml',
      },
      gitlab: {
        config: null,
      },
    };
  }

  /**
   * Generate deployment shell script
   * 
   * @private
   */
  _generateDeployScript(previousOutput) {
    const projectName = (previousOutput.requirement?.name || 'app').toLowerCase().replace(/\s+/g, '-');
    const entryPoint = this._findMainFileFromGenerated(previousOutput);
    
    return `#!/bin/bash
set -e

# Deployment Script for ${projectName}
# Generated by Forge AI - Phase 10

PROJECT_NAME="${projectName}"
IMAGE_TAG="\${IMAGE_TAG:-1.0.0}"
REGISTRY="\${REGISTRY:-ghcr.io}"
CONTAINER_NAME="\${CONTAINER_NAME:-\$PROJECT_NAME}"
PORT="\${PORT:-3000}"

echo "🚀 Deploying \$PROJECT_NAME..."

# Build image
echo "📦 Building Docker image..."
docker build -f deployment/Dockerfile -t \$REGISTRY/\$PROJECT_NAME:\$IMAGE_TAG .

# Stop existing container
echo "🛑 Stopping existing container..."
docker stop \$CONTAINER_NAME || true
docker rm \$CONTAINER_NAME || true

# Run new container
echo "🏃 Starting container..."
docker run -d \\
  --name \$CONTAINER_NAME \\
  -p \$PORT:3000 \\
  --restart unless-stopped \\
  \$REGISTRY/\$PROJECT_NAME:\$IMAGE_TAG

echo "✅ Deployment complete!"
echo "📍 Container: \$CONTAINER_NAME"
echo "🌐 Access at: http://localhost:\$PORT"

# Health check
echo "🔍 Running health check..."
sleep 2
if docker ps | grep -q \$CONTAINER_NAME; then
  echo "✅ Container is running"
else
  echo "❌ Container failed to start"
  docker logs \$CONTAINER_NAME
  exit 1
fi
`;
  }

  /**
   * Generate rollback shell script
   * 
   * @private
   */
  _generateRollbackScript(previousOutput) {
    const projectName = (previousOutput.requirement?.name || 'app').toLowerCase().replace(/\s+/g, '-');
    
    return `#!/bin/bash
set -e

# Rollback Script for ${projectName}
# Generated by Forge AI - Phase 10

CONTAINER_NAME="\${CONTAINER_NAME:-${projectName}}"
BACKUP_IMAGE="\${BACKUP_IMAGE}"

if [ -z "\$BACKUP_IMAGE" ]; then
  echo "❌ Error: BACKUP_IMAGE not specified"
  echo "Usage: BACKUP_IMAGE=ghcr.io/project/app:old-tag ./rollback.sh"
  exit 1
fi

echo "⏮️  Rolling back to: \$BACKUP_IMAGE"

# Stop current
echo "🛑 Stopping current container..."
docker stop \$CONTAINER_NAME || true

# Restart with backup image
echo "🏃 Starting backup image..."
docker run -d \\
  --name \$CONTAINER_NAME \\
  --restart unless-stopped \\
  \$BACKUP_IMAGE

echo "✅ Rollback complete!"
`;
  }

  /**
   * Generate deployment readiness report
   * 
   * @private
   */
  _generateReadinessReport(previousOutput, dockerfile, dockerCompose, deploymentConfig) {
    const checks = {
      testsPassing: {
        status: previousOutput.testResults?.failed === 0,
        message: `${previousOutput.testResults?.passed || 0}/${previousOutput.testResults?.passed || 0} tests passing`,
        weight: 25,
      },
      codeCoverage: {
        status: (previousOutput.testResults?.coverage || '0%').includes('100'),
        message: `Code coverage: ${previousOutput.testResults?.coverage || 'unknown'}`,
        weight: 20,
      },
      lintResults: {
        status: (previousOutput.lintResults?.errors || 0) === 0,
        message: `Linting: ${previousOutput.lintResults?.errors || 0} errors`,
        weight: 15,
      },
      dockerfileGenerated: {
        status: !!dockerfile,
        message: 'Dockerfile generated',
        weight: 15,
      },
      composeDefined: {
        status: !!dockerCompose,
        message: 'docker-compose.yml defined',
        weight: 10,
      },
      deploymentManifest: {
        status: !!deploymentConfig,
        message: 'Deployment manifests ready',
        weight: 15,
      },
    };

    const scorePoints = Object.values(checks)
      .filter((c) => c.status)
      .reduce((sum, c) => sum + c.weight, 0);

    const issues = Object.entries(checks)
      .filter(([, check]) => !check.status)
      .map(([name, check]) => ({
        name,
        message: check.message,
        severity: name === 'testsPassing' ? 'critical' : 'warning',
      }));

    return {
      score: Math.round(scorePoints),
      status: scorePoints >= 90 ? 'READY_FOR_DEPLOYMENT' : 'NEEDS_ATTENTION',
      checks,
      issues,
      recommendations: this._generateRecommendations(scorePoints, previousOutput),
    };
  }

  /**
   * Generate deployment recommendations
   * 
   * @private
   */
  _generateRecommendations(score, previousOutput) {
    const recs = [];

    if ((previousOutput.testResults?.coverage || '0%') !== '100%') {
      recs.push('Increase code coverage to 100% for production readiness');
    }

    if (!this.options.registry) {
      recs.push('Configure container registry for image distribution');
    }

    // Handle both string paths and file descriptor objects
    // Normalize file descriptors to a comparable string to avoid calling includes on non-strings
    const hasDockerfile = (previousOutput.files || []).some((f) => {
      const candidate =
        typeof f === 'string'
          ? f
          : typeof f?.path === 'string'
            ? f.path
            : typeof f?.name === 'string'
              ? f.name
              : '';
      return typeof candidate === 'string' && candidate.includes('Dockerfile');
    });

    if (!hasDockerfile) {
      recs.push('Review generated Dockerfile for security best practices');
    }

    recs.push('Test deployment in staging environment before production');
    recs.push('Set up monitoring and alerting for deployed containers');
    recs.push('Configure log aggregation and centralized logging');
    recs.push('Implement automated backups for persistent data');

    return recs;
  }

  /**
   * Count Docker layers
   * 
   * @private
   */
  _countDockerLayers(dockerfile) {
    return dockerfile
      .split('\n')
      .filter((line) => /^(FROM|RUN|COPY|ADD|ENV|WORKDIR|EXPOSE)/.test(line.trim()))
      .length;
  }

  /**
   * Extract services from docker-compose
   * 
   * @private
   */
  _extractServices(dockerCompose) {
    const serviceMatches = dockerCompose.match(/^  \w+:/gm) || [];
    return serviceMatches.map((s) => s.trim().replace(':', ''));
  }

  /**
   * Find main file from implementation
   * 
   * @private
   */
  _findMainFile(files) {
    const mainFiles = [
      'src/index.js',
      'src/main.js',
      'src/app.js',
      'index.js',
      'main.js',
      'app.js',
    ];

    for (const mainFile of mainFiles) {
      if (files?.some((f) => f.path?.endsWith(mainFile))) {
        return mainFile;
      }
    }

    return files?.[0]?.path || 'src/index.js';
  }

  /**
   * Learn deployment patterns
   * 
   * @private
   */
  _learnDeploymentPattern(previousOutput) {
    if (!previousOutput.requirement?.name) return;

    const pattern = {
      name: 'deployment-pattern',
      category: 'deployment',
      successRate: 0.95,
      description: `Containerization pattern for ${previousOutput.requirement.name}`,
      baseImage: this.options.baseImage,
      orchestrator: this.options.orchestrator,
      includedArtifacts: [
        'Dockerfile',
        'docker-compose.yml',
        'kubernetes-deployment.yaml',
        'systemd-service.unit',
        '.env.template',
      ],
    };

    this.registerStrategy(pattern.name, pattern);
  }

  /**
   * Write deployment artifacts to disk
   * 
   * @param {Object} previousOutput - Output from ImplementationAgent
   * @param {string} dockerfileContent - Generated Dockerfile content
   * @param {string} dockerComposeContent - Generated docker-compose.yml content
   * @param {string} envTemplate - Generated .env.template content
   * @param {Object} cicdConfig - CI/CD configuration
   * @returns {Promise<Array>} List of written files
   */
  async _writeDeploymentArtifacts(previousOutput, dockerfileContent, dockerComposeContent, envTemplate, cicdConfig) {
    try {
      // Determine project root from context or use provided path
      const projectRoot = this.options.projectRoot || previousOutput.projectRoot;
      const deploymentDir = path.join(projectRoot, 'deployment');
      
      // Create deployment directory if it doesn't exist
      if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
      }

      const writtenFiles = [];

      // 1. Write Dockerfile
      const dockerfilePath = path.join(deploymentDir, 'Dockerfile');
      fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf8');
      writtenFiles.push('Dockerfile');
      this.logger.debug('Wrote Dockerfile', { path: dockerfilePath, size: dockerfileContent.length });

      // 2. Write docker-compose.yml
      const dockerComposePath = path.join(deploymentDir, 'docker-compose.yml');
      fs.writeFileSync(dockerComposePath, dockerComposeContent, 'utf8');
      writtenFiles.push('docker-compose.yml');
      this.logger.debug('Wrote docker-compose.yml', { path: dockerComposePath, size: dockerComposeContent.length });

      // 3. Write .dockerignore
      const dockerignoreContent = this._generateDockerignore(previousOutput);
      const dockerignorePath = path.join(deploymentDir, '.dockerignore');
      fs.writeFileSync(dockerignorePath, dockerignoreContent, 'utf8');
      writtenFiles.push('.dockerignore');
      this.logger.debug('Wrote .dockerignore', { path: dockerignorePath });

      // 4. Write deployment guide
      const deploymentGuide = this._generateDeploymentGuide(previousOutput);
      const deploymentGuidePath = path.join(deploymentDir, 'DEPLOYMENT.md');
      fs.writeFileSync(deploymentGuidePath, deploymentGuide, 'utf8');
      writtenFiles.push('DEPLOYMENT.md');
      this.logger.debug('Wrote DEPLOYMENT.md', { path: deploymentGuidePath });

      // 5. Write .env.template
      const envTemplatePath = path.join(deploymentDir, '.env.template');
      fs.writeFileSync(envTemplatePath, envTemplate, 'utf8');
      writtenFiles.push('.env.template');
      this.logger.debug('Wrote .env.template', { path: envTemplatePath });

      // 6. Write GitHub Actions workflow if CI/CD is enabled
      if (cicdConfig?.github?.workflow) {
        const cicdDir = path.join(projectRoot, '.github', 'workflows');
        fs.mkdirSync(cicdDir, { recursive: true });
        
        const githubWorkflowPath = path.join(cicdDir, 'ci-cd.yml');
        fs.writeFileSync(githubWorkflowPath, cicdConfig.github.workflow, 'utf8');
        writtenFiles.push('.github/workflows/ci-cd.yml');
        this.logger.debug('Wrote GitHub Actions workflow', { path: githubWorkflowPath });
      }

      // 7. Write deployment script
      const deployScript = this._generateDeployScript(previousOutput);
      const deployScriptPath = path.join(deploymentDir, 'deploy.sh');
      fs.writeFileSync(deployScriptPath, deployScript, 'utf8');
      fs.chmodSync(deployScriptPath, 0o755); // Make executable
      writtenFiles.push('deploy.sh');
      this.logger.debug('Wrote deploy.sh', { path: deployScriptPath });

      // 8. Write rollback script
      const rollbackScript = this._generateRollbackScript(previousOutput);
      const rollbackScriptPath = path.join(deploymentDir, 'rollback.sh');
      fs.writeFileSync(rollbackScriptPath, rollbackScript, 'utf8');
      fs.chmodSync(rollbackScriptPath, 0o755); // Make executable
      writtenFiles.push('rollback.sh');
      this.logger.debug('Wrote rollback.sh', { path: rollbackScriptPath });

      // 9. Write deployment checklist
      const checklistContent = this._generateDeploymentChecklist(previousOutput);
      const checklistPath = path.join(deploymentDir, 'CHECKLIST.md');
      fs.writeFileSync(checklistPath, checklistContent, 'utf8');
      writtenFiles.push('CHECKLIST.md');
      this.logger.debug('Wrote CHECKLIST.md', { path: checklistPath });

      this.logger.info('Deployment artifacts written successfully', {
        deploymentDir,
        filesWritten: writtenFiles.length,
        files: writtenFiles,
      });

      return writtenFiles;

    } catch (error) {
      this.logger.error('Failed to write deployment artifacts', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Generate .dockerignore content
   * 
   * @param {Object} previousOutput - Previous output
   * @returns {string} .dockerignore content
   */
  _generateDockerignore(previousOutput) {
    return `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.template
test/
.eslintrc.json
deployment/
reports/
docs/
*.md
.DS_Store
.vscode
.idea
coverage/
dist/
build/
`;
  }

  /**
   * Generate deployment guide
   * 
   * @param {Object} previousOutput - Previous output
   * @returns {string} Deployment guide content
   */
  _generateDeploymentGuide(previousOutput) {
    const projectName = previousOutput.requirement?.name || 'Application';
    const description = previousOutput.requirement?.description || 'Generated application';

    return `# Docker Deployment Guide

Generated by **Forge AI - Phase 10: Deployment & Containerization**

## Project Information

- **Name**: ${projectName}
- **Description**: ${description}
- **Generated**: ${new Date().toISOString()}

## Quick Start

### Option 1: Using Deployment Script (Recommended)

\`\`\`bash
cd deployment
chmod +x deploy.sh
./deploy.sh
\`\`\`

### Option 2: Manual Docker Build & Run

\`\`\`bash
cd deployment
docker build -t ${projectName.toLowerCase()}:1.0.0 -f Dockerfile ../generated-code
docker run --rm ${projectName.toLowerCase()}:1.0.0
\`\`\`

### Option 3: Using Docker Compose

\`\`\`bash
cd deployment
docker-compose up --build
\`\`\`

## Files

- **Dockerfile** - Container definition
- **docker-compose.yml** - Orchestration configuration  
- **.dockerignore** - Files to exclude from Docker build
- **deploy.sh** - Automated deployment script
- **rollback.sh** - Rollback to previous version
- **DEPLOYMENT.md** - This file
- **CHECKLIST.md** - Deployment readiness checklist
- **.env.template** - Environment variables template
- **.github/workflows/ci-cd.yml** - GitHub Actions pipeline

## Deployment Scripts

### deploy.sh
Automated deployment with health checks:

\`\`\`bash
./deploy.sh                          # Uses default settings
IMAGE_TAG=2.0.0 ./deploy.sh          # Deploy specific version
PORT=8080 ./deploy.sh                # Use custom port
\`\`\`

Environment variables:
- \`IMAGE_TAG\` - Docker image tag (default: 1.0.0)
- \`REGISTRY\` - Registry URL (default: ghcr.io)
- \`CONTAINER_NAME\` - Container name (default: ${projectName.toLowerCase()})
- \`PORT\` - Published port (default: 3000)

### rollback.sh
Rollback to previous version:

\`\`\`bash
BACKUP_IMAGE=ghcr.io/project/app:old-tag ./rollback.sh
\`\`\`

## CI/CD Pipeline

GitHub Actions workflow automatically:
1. Runs tests on push/PR
2. Builds Docker image
3. Pushes to registry
4. Can trigger deployments

View workflow: \`.github/workflows/ci-cd.yml\`

## Image Details

- **Base Image**: node:22-alpine
- **Working Directory**: /app
- **Entry Point**: Configured in Dockerfile
- **Environment**: NODE_ENV=production

## Environment Variables

Set via docker-compose.yml or deploy script:

\`\`\`bash
docker run -e NODE_ENV=production ${projectName.toLowerCase()}:1.0.0
\`\`\`

## Troubleshooting

**Container exits immediately?**
- This may be expected behavior for CLI applications
- Add \`-it\` flags for interactive mode

**Build fails?**
- Check Docker daemon is running
- Verify generated-code/ directory exists
- Run \`docker build --no-cache\` to rebuild

**Permission denied on deploy.sh?**
\`\`\`bash
chmod +x deployment/deploy.sh
\`\`\`

**Permission issues?**
- Run with \`--user node\` for security
- Check file permissions in generated-code/

## Next Steps

1. Review CHECKLIST.md for deployment readiness
2. Customize docker-compose.yml for your environment
3. Build and test locally with docker-compose
4. Push to registry (if needed)
5. Deploy to your target environment

---

*Generated by Forge AI orchestrator*
*Date: ${new Date().toISOString()}*
`;
  }

  /**
   * Generate deployment checklist
   * 
   * @param {Object} previousOutput - Previous output
   * @returns {string} Deployment checklist content
   */
  _generateDeploymentChecklist(previousOutput) {
    return `# Deployment Readiness Checklist

Generated by **Forge AI - Phase 10: Deployment & Containerization**

## Pre-Deployment

- [ ] Code has been tested locally (\`npm test\`)
- [ ] All dependencies are documented in package.json
- [ ] Environment variables are defined in .env.template
- [ ] Docker is installed and running
- [ ] docker-compose is installed (version 3.8+)
- [ ] Dockerfile has been reviewed and validated
- [ ] .dockerignore contains appropriate patterns
- [ ] Docker image builds successfully: \`docker build\`
- [ ] Container runs correctly: \`docker run\`

## Security Checks

- [ ] No hardcoded secrets in Dockerfile or configs
- [ ] Base image is from official sources (node:22-alpine)
- [ ] Container runs as non-root user (node)
- [ ] Network exposure is intentional
- [ ] Health checks are configured (if needed)
- [ ] Logging is configured appropriately
- [ ] Environment variables don't leak sensitive data

## Performance Validation

- [ ] Docker image size is reasonable (< 500MB)
- [ ] Build time is acceptable (< 5 minutes)
- [ ] Container startup time is reasonable (< 5s)
- [ ] Memory usage is appropriate
- [ ] CPU usage is appropriate
- [ ] No unused layers in Dockerfile
- [ ] Multi-stage builds are used (if applicable)

## Documentation

- [ ] DEPLOYMENT.md is complete and accurate
- [ ] README.md has deployment instructions
- [ ] Environment variables are documented
- [ ] Port mappings are documented
- [ ] Volume mappings are documented (if any)
- [ ] Troubleshooting guide is included

## Testing

- [ ] Container runs in isolation
- [ ] All tests pass in container
- [ ] CLI works with all parameters
- [ ] Environment variables are respected
- [ ] Error handling is correct
- [ ] Logging output is correct
- [ ] Clean shutdown works

## Deployment

- [ ] Target environment is prepared
- [ ] Resource limits are set
- [ ] Networking is configured
- [ ] Storage/volumes are configured
- [ ] Secrets are securely managed
- [ ] Monitoring is configured
- [ ] Logging/collection is configured
- [ ] Backup strategy is defined

## Post-Deployment

- [ ] Application is running
- [ ] All health checks pass
- [ ] Logging is working
- [ ] Monitoring alerts are active
- [ ] Rollback plan is tested
- [ ] Performance is acceptable
- [ ] Security scanning is enabled

## Sign-Off

- [ ] Developer: _________________ Date: _______
- [ ] QA: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______
- [ ] Product: _________________ Date: _______

---

*Generated by Forge AI orchestrator*
*Date: ${new Date().toISOString()}*
`;
  }
}

export default DeployAgent;
