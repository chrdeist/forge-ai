#!/usr/bin/env node

/**
 * Integration Test: Full 8-Agent Pipeline
 * 
 * Tests the complete Forge AI workflow:
 * 1. FunctionalRequirementsAgent - Extract requirements
 * 2. TechnicalRequirementsAgent - Generate technical specs
 * 3. ArchitectureAgent - Generate architecture diagrams
 * 4. TestAgent - Generate test specifications
 * 5. ImplementationAgent - Generate code
 * 6. ReviewAgent - Review generated code
 * 7. DocumentationAgent - Generate documentation
 * 8. DeploymentAgent - Generate deployment config
 */

import fs from 'node:fs';
import path from 'node:path';
import { FunctionalRequirementsAgent } from './packages/agents/functional-requirements-agent-refactored.mjs';
import { TechnicalRequirementsAgent } from './packages/agents/technical-requirements-agent-refactored.mjs';
import { ArchitectureAgent } from './packages/agents/architecture-agent-refactored.mjs';
import { TestAgent } from './packages/agents/test-agent-refactored.mjs';
import { ImplementationAgent } from './packages/agents/implementation-agent-refactored.mjs';
import { ReviewAgent } from './packages/agents/review-agent-refactored.mjs';
import { DocumentationAgent } from './packages/agents/documentation-agent-refactored.mjs';
import { DeploymentAgent } from './packages/agents/deployment-agent-refactored.mjs';

class PipelineTest {
  constructor() {
    this.testDir = './test-8-agent-pipeline';
    this.requirementsFile = path.join(this.testDir, 'test-requirements.md');
    this.rvdFile = path.join(this.testDir, 'pipeline-test.json');
    this.results = [];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  ensureTestDir() {
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
      this.log(`✓ Created test directory: ${this.testDir}`);
    }
  }

  createTestRequirements() {
    const content = `# Test Project API

## Functional Requirements

### User Management
- [ ] Create new user with email and password
- [ ] Authenticate user with credentials
- [ ] Update user profile information
- [ ] Delete user account
- [ ] List all users

### Product Management
- [ ] Create product with name and price
- [ ] Update product details
- [ ] Delete product
- [ ] Search products by name
- [ ] Filter products by price range

### Order Processing
- [ ] Create new order
- [ ] View order status
- [ ] Cancel order
- [ ] Get order history
- [ ] Calculate total price

## Technical Requirements

### Performance
- [ ] Response time < 200ms
- [ ] Support 1000 concurrent users
- [ ] Database query optimization

### Security
- [ ] Encrypt passwords with bcrypt
- [ ] Implement JWT authentication
- [ ] Rate limiting on endpoints
- [ ] Input validation

### Reliability
- [ ] 99.9% uptime SLA
- [ ] Automatic backup daily
- [ ] Error logging and monitoring
`;

    fs.writeFileSync(this.requirementsFile, content);
    this.log(`✓ Created test requirements file: ${this.requirementsFile}`);
  }

  async runAgent(agent, agentName, ...args) {
    this.log(`\n${'='.repeat(60)}`);
    this.log(`PHASE: ${agentName}`);
    this.log(`${'='.repeat(60)}`);

    try {
      const startTime = Date.now();
      const result = await agent.execute(...args);
      const duration = Date.now() - startTime;

      this.log(`✓ ${agentName} completed in ${duration}ms`, 'success');
      
      this.results.push({
        agent: agentName,
        status: 'success',
        duration,
        result,
      });

      return result;
    } catch (error) {
      this.log(`✗ ${agentName} failed: ${error.message}`, 'error');
      
      this.results.push({
        agent: agentName,
        status: 'failed',
        error: error.message,
      });

      throw error;
    }
  }

  validateRVD(stage) {
    if (!fs.existsSync(this.rvdFile)) {
      throw new Error(`RVD file not found: ${this.rvdFile}`);
    }

    const rvdContent = fs.readFileSync(this.rvdFile, 'utf-8');
    const rvd = JSON.parse(rvdContent);

    // Validate structure
    if (!rvd.project) throw new Error('Missing project metadata');
    if (!rvd.executionLog) throw new Error('Missing execution log');

    const sectionMap = {
      1: 'functional',
      2: 'technical',
      3: 'architecture',
      4: 'testing',
      5: 'implementation',
      6: 'review',
      7: 'documentation',
      8: 'deployment',
    };

    const section = sectionMap[stage];
    if (!rvd[section]) {
      throw new Error(`Missing section: ${section}`);
    }

    this.log(`  ✓ RVD structure valid for stage ${stage}`, 'debug');
    return rvd;
  }

  async runPipeline() {
    this.log('🚀 Starting 8-Agent Pipeline Test\n');

    try {
      // Setup
      this.ensureTestDir();
      this.createTestRequirements();

      // Phase 1: Functional Requirements
      this.log('\n📝 PHASE 1: Functional Requirements Agent');
      await this.runAgent(
        new FunctionalRequirementsAgent(),
        'FunctionalRequirementsAgent',
        this.requirementsFile,
        this.rvdFile
      );
      const rvd1 = this.validateRVD(1);
      this.log(`  ✓ Extracted ${rvd1.functional.data.requirements?.length || 0} requirements`);

      // Phase 2: Technical Requirements
      this.log('\n⚙️  PHASE 2: Technical Requirements Agent');
      await this.runAgent(
        new TechnicalRequirementsAgent(),
        'TechnicalRequirementsAgent',
        this.rvdFile
      );
      const rvd2 = this.validateRVD(2);
      this.log(`  ✓ Generated ${rvd2.technical.data.apis?.length || 0} API endpoints`);

      // Phase 3: Architecture
      this.log('\n🏗️  PHASE 3: Architecture Agent');
      await this.runAgent(
        new ArchitectureAgent(),
        'ArchitectureAgent',
        this.rvdFile
      );
      const rvd3 = this.validateRVD(3);
      this.log(`  ✓ Generated architecture diagrams`);
      this.log(`    - Component diagram: ${rvd3.architecture.data.component?.content?.length || 0} bytes`);
      this.log(`    - Deployment diagram: ${rvd3.architecture.data.deployment?.content?.length || 0} bytes`);
      this.log(`    - ${rvd3.architecture.data.sequences?.length || 0} sequence diagrams`);

      // Phase 4: Testing
      this.log('\n🧪 PHASE 4: Test Agent');
      await this.runAgent(
        new TestAgent(),
        'TestAgent',
        this.rvdFile
      );
      const rvd4 = this.validateRVD(4);
      this.log(`  ✓ Generated test specifications`);
      this.log(`    - Unit tests: ${rvd4.testing.data.unitTests?.count || 0} suites`);
      this.log(`    - Integration tests: ${rvd4.testing.data.integrationTests?.count || 0} tests`);
      this.log(`    - E2E tests: ${rvd4.testing.data.e2eTests?.count || 0} tests`);

      // Phase 5: Implementation
      this.log('\n💻 PHASE 5: Implementation Agent');
      await this.runAgent(
        new ImplementationAgent(),
        'ImplementationAgent',
        this.rvdFile
      );
      const rvd5 = this.validateRVD(5);
      this.log(`  ✓ Generated code files`);
      this.log(`    - Files created: ${rvd5.implementation.data.filesGenerated || 0}`);
      this.log(`    - Output directory: ${rvd5.implementation.outputDirectory}`);

      // Phase 6: Review
      this.log('\n🔍 PHASE 6: Review Agent');
      await this.runAgent(
        new ReviewAgent(),
        'ReviewAgent',
        this.rvdFile
      );
      const rvd6 = this.validateRVD(6);
      this.log(`  ✓ Code review completed`);
      this.log(`    - Overall score: ${rvd6.review.data.overallScore}/100`);
      this.log(`    - Code quality: ${rvd6.review.data.codeQuality?.score}/100`);
      this.log(`    - Architecture: ${rvd6.review.data.architecture?.score}/100`);
      this.log(`    - Security: ${rvd6.review.data.security?.score}/100`);
      this.log(`    - Performance: ${rvd6.review.data.performance?.score}/100`);

      // Phase 7: Documentation
      this.log('\n📚 PHASE 7: Documentation Agent');
      await this.runAgent(
        new DocumentationAgent(),
        'DocumentationAgent',
        this.rvdFile
      );
      const rvd7 = this.validateRVD(7);
      this.log(`  ✓ Documentation generated`);
      this.log(`    - API endpoints documented: ${rvd7.documentation.data.apiDocs?.endpoints?.length || 0}`);
      this.log(`    - Guides created: ${rvd7.documentation.data.guides?.length || 0}`);
      this.log(`    - Code examples: ${Object.keys(rvd7.documentation.data.examples || {}).join(', ')}`);

      // Phase 8: Deployment
      this.log('\n🚀 PHASE 8: Deployment Agent');
      await this.runAgent(
        new DeploymentAgent(),
        'DeploymentAgent',
        this.rvdFile
      );
      const rvd8 = this.validateRVD(8);
      this.log(`  ✓ Deployment configuration generated`);
      this.log(`    - Docker config: ${Object.keys(rvd8.deployment.data.docker || {}).join(', ')}`);
      this.log(`    - Kubernetes config: ${Object.keys(rvd8.deployment.data.kubernetes || {}).join(', ')}`);
      this.log(`    - CI/CD config: ${Object.keys(rvd8.deployment.data.cicd || {}).join(', ')}`);
      this.log(`    - Deployment targets: ${rvd8.deployment.data.deploymentTargets?.join(', ')}`);

      // Summary
      this.printSummary(rvd8);

    } catch (error) {
      this.log(`\n❌ Pipeline failed: ${error.message}`, 'error');
      this.log(error.stack, 'error');
      process.exit(1);
    }
  }

  printSummary(finalRvd) {
    this.log('\n' + '='.repeat(60));
    this.log('PIPELINE SUMMARY');
    this.log('='.repeat(60));

    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;

    this.log(`\nResults: ${successful} succeeded, ${failed} failed`);
    this.log(`Total duration: ${this.results.reduce((sum, r) => sum + (r.duration || 0), 0)}ms`);

    this.log('\nAgent Results:');
    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✓' : '✗';
      this.log(`  ${icon} ${result.agent}: ${result.status}${result.duration ? ` (${result.duration}ms)` : ''}`);
    });

    this.log('\nRVD File Information:');
    this.log(`  Location: ${this.rvdFile}`);
    this.log(`  Size: ${(fs.statSync(this.rvdFile).size / 1024).toFixed(2)} KB`);
    this.log(`  Sections: ${Object.keys(finalRvd).filter(k => typeof finalRvd[k] === 'object' && finalRvd[k].generatedBy).length}`);

    this.log('\nGenerated Files:');
    const generatedDir = path.join(this.testDir, 'generated-code');
    if (fs.existsSync(generatedDir)) {
      const files = this._countFiles(generatedDir);
      this.log(`  Directory: ${generatedDir}`);
      this.log(`  Total files: ${files}`);
    }

    this.log('\n✅ Pipeline test completed successfully!\n');
  }

  _countFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      if (item.isDirectory()) {
        count += this._countFiles(path.join(dir, item.name));
      } else {
        count++;
      }
    });

    return count;
  }
}

// Run the test
const test = new PipelineTest();
await test.runPipeline();
