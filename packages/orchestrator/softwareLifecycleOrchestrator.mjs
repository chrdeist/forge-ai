/**
 * Forge AI Orchestrator - Software Lifecycle Workflow
 * 
 * Steuert den end-to-end Flow von Requirements bis Deployment:
 * Parse → Functional → Technical → Architecture/Design → Tests → Implement (Loop) → Review → Documentation → Metrics
 * 
 * Jede Phase persistiert ihre Outputs, damit nachgelagerte Agenten
 * sie verwenden und das System lernfähig ist.
 */

import fs from 'node:fs';
import path from 'node:path';
import { FunctionalRequirementsAgent } from '../agents/functional-requirements-agent.mjs';
import { TechnicalRequirementsAgent } from '../agents/technical-requirements-agent.mjs';
import { TestAgent } from '../agents/test-agent.mjs';
import { ImplementationAgent } from '../agents/implementation-agent.mjs';
import { DocumentationAgent } from '../agents/documentationAgent.mjs';
import { AgentInteractionManager, DeadlockFeedbackHandler } from '../agents/agentInteractionManager.mjs';
import { ReportGenerator } from './reportGenerator.mjs';

export class SoftwareLifecycleOrchestrator {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.workDir = path.join(this.projectRoot, 'forge-ai-work');
    this.knowledgeDir = path.join(this.projectRoot, 'knowledge');
    this.requirementsFile = config.requirementsFile;
    this.verbose = config.verbose !== false;

    this.executionLog = {
      startTime: new Date().toISOString(),
      phases: [],
      metrics: {},
      errors: [],
    };

    this._ensureDirs();
  }

  _ensureDirs() {
    [this.workDir, this.knowledgeDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  _log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  /**
   * Haupteinstieg: Führt den gesamten Workflow aus.
   */
  async executeWorkflow(requirementsFile) {
    this._log(`\n${'='.repeat(70)}`);
    this._log('🚀 FORGE AI - Software Lifecycle Orchestrator');
    this._log(`${'='.repeat(70)}\n`);

    this.requirementsFile = requirementsFile;

    try {
      // Phase 1: Parse Requirements
      await this.phaseParseRequirements();

      // Phase 2: Extract Functional Requirements
      await this.phaseFunctionalRequirements();

      // Phase 3: Generate Technical Specification
      await this.phaseTechnicalRequirements();

      // Phase 4: Architecture & Design (Stub für später)
      await this.phaseArchitectureDesign();

      // Phase 5: Test Generation
      await this.phaseTestGeneration();

      // Phase 6: Implementation Loop (mit Test-Feedback)
      await this.phaseImplementation();

      // Phase 7: Code Review
      await this.phaseCodeReview();

      // Phase 8: Documentation
      await this.phaseDocumentation();

      // Phase 9: Persist Metrics & Learning
      await this.phasePersistMetrics();

      this._log(`\n✅ Workflow completed successfully!`);
      return this.executionLog;
    } catch (error) {
      this._log(`\n❌ Workflow failed: ${error.message}`);
      this.executionLog.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Phase 1: Parse & Validate Requirements
   */
  async phaseParseRequirements() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('📖 Phase 1: Parse Requirements');
    this._log(`${'─'.repeat(70)}`);

    if (!fs.existsSync(this.requirementsFile)) {
      throw new Error(`Requirements file not found: ${this.requirementsFile}`);
    }

    this._log(`✓ Requirements file found: ${this.requirementsFile}`);
    this.executionLog.phases.push({
      name: 'ParseRequirements',
      status: 'completed',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Phase 2: Functional Requirements Extraction
   */
  async phaseFunctionalRequirements() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('🎯 Phase 2: Functional Requirements Extraction');
    this._log(`${'─'.repeat(70)}`);

    const functionalAgent = new FunctionalRequirementsAgent({
      projectRoot: this.projectRoot,
      verbose: this.verbose,
    });

    const functionalSummary = await functionalAgent.execute(this.requirementsFile);
    
    const outputPath = path.join(this.workDir, 'functional-summary.json');
    functionalAgent.saveFunctionalSummary(outputPath);

    this._log(`✓ Extracted ${functionalSummary.functionalRequirements.length} functional requirements`);
    this._log(`✓ Identified ${functionalSummary.acceptanceCriteria.length} acceptance criteria`);

    this.executionLog.phases.push({
      name: 'FunctionalRequirements',
      status: 'completed',
      artifactPath: outputPath,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Phase 3: Technical Requirements Specification
   */
  async phaseTechnicalRequirements() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('⚙️  Phase 3: Technical Requirements Specification');
    this._log(`${'─'.repeat(70)}`);

    const functionalPath = path.join(this.workDir, 'functional-summary.json');
    
    const technicalAgent = new TechnicalRequirementsAgent({
      projectRoot: this.projectRoot,
      verbose: this.verbose,
    });
    
    const technicalSpec = await technicalAgent.execute(functionalPath);
    const specJsonPath = path.join(this.workDir, 'technical-specification.json');
    const specMarkdownPath = path.join(this.workDir, 'technical-specification.md');
    
    technicalAgent.saveTechnicalSpec(specJsonPath);
    technicalAgent.generateMarkdownSpec(specMarkdownPath);

    this._log(`✓ Generated ${technicalSpec.apis.length} API specifications`);
    this._log(`✓ Defined ${technicalSpec.dataStructures.length} data structures`);
    this._log(`✓ Mapped ${technicalSpec.requirementMapping.length} requirements to tests`);

    this.executionLog.phases.push({
      name: 'TechnicalRequirements',
      status: 'completed',
      artifactPath: specJsonPath,
      markdownPath: specMarkdownPath,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Phase 4: Architecture & Design (Stub)
   */
  async phaseArchitectureDesign() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('🏗️  Phase 4: Architecture & Design');
    this._log(`${'─'.repeat(70)}`);

    this._log(`✓ Architecture review (stub - placeholder for ArchitectureAgent)`);

    this.executionLog.phases.push({
      name: 'ArchitectureDesign',
      status: 'completed',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Phase 5: Test Generation
   */
  async phaseTestGeneration() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('🧪 Phase 5: Test Generation');
    this._log(`${'─'.repeat(70)}`);

    const specPath = path.join(this.workDir, 'technical-specification.json');

    if (!fs.existsSync(specPath)) {
      this._log(`⚠️  Technical specification not found, skipping test generation.`);
      return;
    }

    const testAgent = new TestAgent({
      projectRoot: this.projectRoot,
      verbose: this.verbose,
    });

    const testSpec = await testAgent.execute(specPath);
    const testSpecPath = path.join(this.workDir, 'test-specification.json');
    testAgent.saveTestSpec(testSpecPath);

    this._log(`✓ Generated ${testSpec.unitTests.length} unit test specs`);
    this._log(`✓ Generated ${testSpec.e2eTests.length} E2E test specs`);

    this.executionLog.phases.push({
      name: 'TestGeneration',
      status: 'completed',
      artifactPath: testSpecPath,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Phase 6: Implementation (mit Test-Loop)
   */
  async phaseImplementation() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('💻 Phase 6: Implementation (with Test Loop)');
    this._log(`${'─'.repeat(70)}`);

    const specPath = path.join(this.workDir, 'technical-specification.json');
    const testSpecPath = path.join(this.workDir, 'test-specification.json');

    if (!fs.existsSync(specPath)) {
      this._log(`⚠️  Technical specification not found, skipping implementation.`);
      return;
    }

    const implAgent = new ImplementationAgent({
      projectRoot: this.projectRoot,
      verbose: this.verbose,
    });

    const result = await implAgent.execute(specPath, testSpecPath);

    this._log(`✓ Generated ${result.generatedFiles.length} implementation files (stubs)`);

    this.executionLog.phases.push({
      name: 'Implementation',
      status: 'completed',
      generatedFiles: result.generatedFiles.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Phase 7: Code Review
   */
  async phaseCodeReview() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('👀 Phase 7: Code Review');
    this._log(`${'─'.repeat(70)}`);

    this._log(`✓ Code review (stub - placeholder for ReviewAgent)`);

    this.executionLog.phases.push({
      name: 'CodeReview',
      status: 'completed',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Phase 8: Documentation
   */
  async phaseDocumentation() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('📚 Phase 8: Documentation');
    this._log(`${'─'.repeat(70)}`);

    const specPath = path.join(this.workDir, 'technical-specification.json');
    const functionalPath = path.join(this.workDir, 'functional-summary.json');

    if (!fs.existsSync(specPath)) {
      this._log(`⚠️  Technical specification not found, skipping documentation.`);
      this.executionLog.phases.push({
        name: 'Documentation',
        status: 'skipped',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const docAgent = new DocumentationAgent(specPath, {
      functionalSummaryPath: fs.existsSync(functionalPath) ? functionalPath : null,
    });

    docAgent.loadSpecifications();
    const docs = docAgent.saveDocumentation(this.workDir);

    this._log(`✓ Feature documentation generated`);
    this._log(`✓ Architecture, Sequence, and Use Case diagrams generated`);

    this.executionLog.phases.push({
      name: 'Documentation',
      status: 'completed',
      artifacts: docs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Phase 9: Persist Metrics & Learning Points
   */
  async phasePersistMetrics() {
    this._log(`\n${'─'.repeat(70)}`);
    this._log('💾 Phase 9: Persist Metrics & Learning Points');
    this._log(`${'─'.repeat(70)}`);

    this.executionLog.endTime = new Date().toISOString();

    const experiencesPath = path.join(this.knowledgeDir, 'experiences.json');
    let experiences = { version: '1.0', experiences: [], strategy_rankings: {} };

    if (fs.existsSync(experiencesPath)) {
      experiences = JSON.parse(fs.readFileSync(experiencesPath, 'utf-8'));
    }

    experiences.experiences.push({
      id: `exp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      requirementFile: path.basename(this.requirementsFile),
      executionLog: this.executionLog,
      success: this.executionLog.errors.length === 0,
      approved: null, // ← Du kannst das manuell setzen
      curator_notes: '',
      deleted: false,
    });

    fs.writeFileSync(experiencesPath, JSON.stringify(experiences, null, 2));

    this._log(`✓ Execution metrics persisted to ${experiencesPath}`);
    this._log(`✓ Total phases: ${this.executionLog.phases.length}`);
    this._log(`✓ Errors: ${this.executionLog.errors.length}`);

    // Generiere detaillierten Report
    const reportGen = new ReportGenerator(this.executionLog, {
      projectRoot: this.projectRoot,
      workDir: this.workDir,
    });

    const reportInfo = reportGen.saveReport(this.workDir);

    this._log(`✓ Execution report saved to ${reportInfo.reportPath}`);

    this.executionLog.phases.push({
      name: 'PersistMetrics',
      status: 'completed',
      reportPath: reportInfo.reportPath,
      timestamp: new Date().toISOString(),
    });
  }
}

export default SoftwareLifecycleOrchestrator;
