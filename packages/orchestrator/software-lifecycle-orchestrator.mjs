#!/usr/bin/env node
/**
 * SoftwareLifecycleOrchestrator (RVD-based)
 * 
 * Runs the full 8-agent pipeline sequentially using the RVD file
 * - Reads requirements.md → Functional → Technical → Architecture → Testing → Implementation → Review → Documentation → Deployment
 * - Logs execution to RVD.executionLog and tracks agents in RVD.agents
 * - Robust error handling: logs failures and stops unless `--continue-on-error` is passed
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { RVDManager } from '../agents/rvd-manager.mjs';
import { FunctionalRequirementsAgent } from '../agents/functional-requirements-agent-refactored.mjs';
import { TechnicalRequirementsAgent } from '../agents/technical-requirements-agent-refactored.mjs';
import { ArchitectureAgent } from '../agents/architecture-agent-refactored.mjs';
import { TestAgent } from '../agents/test-agent-refactored.mjs';
import { ImplementationAgent } from '../agents/implementation-agent-refactored.mjs';
import { ReviewAgent } from '../agents/review-agent-refactored.mjs';
import { DocumentationAgent } from '../agents/documentation-agent-refactored.mjs';
import { DeploymentAgent } from '../agents/deployment-agent-refactored.mjs';
import { validateRVD, validateSection } from '../rvd/rvd-validator.mjs';

export class SoftwareLifecycleOrchestrator {
  constructor(config = {}) {
    this.config = config;
    this.rvdManager = new RVDManager(config);
    this.agents = {
      functional: new FunctionalRequirementsAgent(config),
      technical: new TechnicalRequirementsAgent(config),
      architecture: new ArchitectureAgent(config),
      testing: new TestAgent(config),
      implementation: new ImplementationAgent(config),
      review: new ReviewAgent(config),
      documentation: new DocumentationAgent(config),
      deployment: new DeploymentAgent(config),
    };
  }

  log(msg) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${msg}`);
  }

  async run({ requirementsFile, rvdFile, continueOnError = false }) {
    // Ensure RVD exists or create it with project name from requirements
    let projectName = 'unknown-project';
    if (requirementsFile && fs.existsSync(requirementsFile)) {
      const content = fs.readFileSync(requirementsFile, 'utf-8');
      const match = content.match(/^#\s+(.+?)$/m);
      if (match) projectName = match[1];
    }

    let rvd = await this.rvdManager.loadOrCreate(rvdFile, projectName);
    const orchestrationStart = Date.now();
    rvd.kpis = rvd.kpis || { timings: {}, counts: {}, orchestration: {}, tokensUsed: 0 };
    // Initial validation (non-fatal): ensure top-level shape
    const initialValidation = validateRVD(rvd);
    if (!initialValidation.valid) {
      this.log(`RVD validation warnings: ${JSON.stringify(initialValidation.errors)}`);
    }
    
    // Optional cleanup/reset before run
    const cleanArtifacts = !!this.config.cleanArtifacts;
    const resetSectionsArg = this.config.resetSections || null; // 'downstream' | 'all' | 'functional,technical,...'
    
    // Derive project name from RVD if present
    let effectiveProject = rvd.project?.name || projectName;
    if (['unknown', 'unknown-project', undefined, null, ''].includes(effectiveProject)) {
      effectiveProject = projectName;
    }
    
    if (cleanArtifacts) {
      await this._cleanArtifacts(effectiveProject);
    }
    
    if (resetSectionsArg) {
      rvd = await this._load(rvdFile);
      this._resetRVDSections(rvd, resetSectionsArg);
      await this._save(rvdFile, rvd);
      this.log(`Reset RVD sections using mode "${resetSectionsArg}"`);
    }

    const steps = [
      {
        key: 'functional',
        run: async () => this.agents.functional.execute(requirementsFile, rvdFile),
      },
      {
        key: 'technical',
        run: async () => this.agents.technical.execute(rvdFile),
      },
      {
        key: 'architecture',
        run: async () => this.agents.architecture.execute(rvdFile),
      },
      {
        key: 'testing',
        run: async () => this.agents.testing.execute(rvdFile),
      },
      {
        key: 'implementation',
        run: async () => this.agents.implementation.execute(rvdFile),
      },
      {
        key: 'review',
        run: async () => this.agents.review.execute(rvdFile),
      },
      {
        key: 'documentation',
        run: async () => this.agents.documentation.execute(rvdFile),
      },
      {
        key: 'deployment',
        run: async () => this.agents.deployment.execute(rvdFile),
      },
    ];

    const attemptsPerAgent = {};
    for (const step of steps) {
      const agentName = `${step.key[0].toUpperCase()}${step.key.slice(1)}Agent`;
      this.log(`==> Starting ${agentName}`);
      rvd = await this._load(rvdFile);
      rvd.kpis = rvd.kpis || { timings: {}, counts: {}, orchestration: {}, tokensUsed: 0 };
      this.rvdManager.logExecution(rvd, agentName, 'started', `Running ${agentName}`);
      this.rvdManager.trackAgent(rvd, agentName, { version: '1.0' });
      await this._save(rvdFile, rvd);
      const stepStart = Date.now();
      attemptsPerAgent[step.key] = (attemptsPerAgent[step.key] || 0) + 1;

      try {
        const result = await step.run();
        rvd = await this._load(rvdFile);
        rvd.kpis = rvd.kpis || { timings: {}, counts: {}, orchestration: {}, tokensUsed: 0 };
        this.rvdManager.logExecution(rvd, agentName, 'completed', `${agentName} completed`);
        rvd.lastUpdated = new Date().toISOString();
        await this._save(rvdFile, rvd);
        // Validate written section
        const sectionValidation = validateSection(step.key, rvd[step.key]);
        if (!sectionValidation.valid) {
          this.log(`Section ${step.key} failed validation: ${JSON.stringify(sectionValidation.errors)}`);
          if (!continueOnError) {
            throw new Error(`Validation failed for section ${step.key}`);
          }
        }
        // KPI: timings
        const durationMs = Date.now() - stepStart;
        rvd.kpis.timings[step.key] = durationMs;
        // KPI: counts by section
        this._updateKpiCounts(rvd, step.key);
        await this._save(rvdFile, rvd);
        this.log(`✓ ${agentName} done`);
      } catch (error) {
        rvd = await this._load(rvdFile);
        this.rvdManager.logExecution(rvd, agentName, 'failed', `${agentName} failed: ${error.message}`);
        await this._save(rvdFile, rvd);
        this.log(`✗ ${agentName} failed: ${error.message}`);
        if (!continueOnError) {
          throw error;
        }
      }
    }

    // Final summary
    rvd = await this._load(rvdFile);
    rvd.kpis.orchestration = {
      totalDurationMs: Date.now() - orchestrationStart,
      startedAt: new Date(orchestrationStart).toISOString(),
      finishedAt: new Date().toISOString(),
      attemptsPerAgent,
      tokensUsed: rvd.kpis.tokensUsed || 0
    };
    await this._save(rvdFile, rvd);
    const summary = this.rvdManager.getSummary(rvd);
    this.log(`Pipeline complete. Sections: ${summary.sectionsCompleted}/${summary.totalSections}`);
    this.log(`KPIs: ${JSON.stringify(rvd.kpis)}`);
    // Write KPI report if enabled
    const doReport = this.config.report !== false; // default on
    if (doReport) {
      try {
        await this._writeKpiReport(rvd, rvdFile);
      } catch (e) {
        this.log(`KPI report failed: ${e.message}`);
      }
    }
    return summary;
  }

  async _load(rvdFile) {
    return await this.rvdManager.load(rvdFile).catch(async () => {
      return await this.rvdManager.loadOrCreate(rvdFile, 'unknown');
    });
  }

  /**
   * Update KPI counts per section.
   */
  _updateKpiCounts(rvd, sectionKey) {
    rvd.kpis = rvd.kpis || { timings: {}, counts: {}, orchestration: {}, tokensUsed: 0 };
    const counts = rvd.kpis.counts;
    if (sectionKey === 'functional') {
      counts.functionalRequirements = rvd.functional?.data?.requirements?.length || 0;
    }
    if (sectionKey === 'technical') {
      counts.technicalApis = rvd.technical?.data?.apis?.length || 0;
    }
    if (sectionKey === 'testing') {
      counts.tests = {
        unit: rvd.testing?.data?.unitTests?.count || 0,
        integration: rvd.testing?.data?.integrationTests?.count || 0,
        e2e: rvd.testing?.data?.e2eTests?.count || 0
      };
    }
    if (sectionKey === 'implementation') {
      const files = rvd.implementation?.data?.files || [];
      let bytes = 0;
      let locTotal = 0;
      const byType = {};
      try {
        files.forEach(f => {
          if (f.path && fs.existsSync(f.path)) {
            const stat = fs.statSync(f.path);
            bytes += stat.size || 0;
            const content = fs.readFileSync(f.path, 'utf-8');
            const loc = content.split(/\r?\n/).length;
            locTotal += loc;
          }
          const t = (f.type || 'other');
          byType[t] = (byType[t] || 0) + 1;
        });
      } catch {}
      counts.implementation = {
        files: rvd.implementation?.data?.filesGenerated || files.length || 0,
        bytes,
        loc: {
          total: locTotal,
          avgPerFile: (files.length ? Math.round(locTotal / files.length) : 0)
        },
        byType
      };
    }
    if (sectionKey === 'review') {
      const review = rvd.review?.data || {};
      const findingsCount = (review.codeQuality?.findings?.length || 0) + (review.architecture?.findings?.length || 0);
      const issuesCount = review.security?.issues?.length || 0;
      const recommendationsCount = (review.recommendations?.length || 0);
      counts.review = {
        overallScore: review.overallScore || 0,
        findings: findingsCount,
        issues: issuesCount,
        recommendations: recommendationsCount
      };
    }
  }

  /**
   * Write KPI report (Markdown + CSV) to report directory.
   */
  async _writeKpiReport(rvd, rvdFile) {
    const reportDir = this.config.reportDir || 'test-results';
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const slug = (rvd.project?.name || 'project').toString().toLowerCase().replace(/\s+/g, '-');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const mdPath = path.join(reportDir, `orchestrate-${slug}-${ts}.md`);
    const csvPath = path.join(reportDir, `orchestrate-${slug}-${ts}.csv`);

    const k = rvd.kpis || {};
    const c = k.counts || {};
    const t = k.timings || {};

    const md = [
      `# Orchestration KPIs - ${rvd.project?.name || 'Project'}`,
      '',
      `- Date: ${new Date().toISOString()}`,
      `- RVD: ${rvdFile}`,
      '',
      '## Counts',
      `- Functional Requirements: ${c.functionalRequirements ?? 0}`,
      `- Technical APIs: ${c.technicalApis ?? 0}`,
      `- Tests: unit=${c.tests?.unit ?? 0}, integration=${c.tests?.integration ?? 0}, e2e=${c.tests?.e2e ?? 0}`,
      `- Implementation Files: ${c.implementation?.files ?? 0}`,
      `- Implementation Size: ${(c.implementation?.bytes ?? 0)} bytes`,
      `- Implementation LOC: total=${c.implementation?.loc?.total ?? 0}, avgPerFile=${c.implementation?.loc?.avgPerFile ?? 0}`,
      `- Review Score: ${c.review?.overallScore ?? 0}`,
      `- Review Findings: ${c.review?.findings ?? 0}`,
      `- Review Issues: ${c.review?.issues ?? 0}`,
      `- Review Recommendations: ${c.review?.recommendations ?? 0}`,
      '',
      '## Timings (ms)',
      `- Functional: ${t.functional ?? 0}`,
      `- Technical: ${t.technical ?? 0}`,
      `- Architecture: ${t.architecture ?? 0}`,
      `- Testing: ${t.testing ?? 0}`,
      `- Implementation: ${t.implementation ?? 0}`,
      `- Review: ${t.review ?? 0}`,
      `- Documentation: ${t.documentation ?? 0}`,
      `- Deployment: ${t.deployment ?? 0}`,
      '',
      '## Orchestration',
      `- Total Duration: ${k.orchestration?.totalDurationMs ?? 0} ms`,
      `- Tokens Used: ${k.tokensUsed ?? 0}`,
      '',
      '## Implementation Breakdown',
      ...Object.entries(c.implementation?.byType || {}).map(([type, count]) => `- ${type}: ${count}`)
    ].join('\n');

    fs.writeFileSync(mdPath, md);

    const csvRows = [
      ['metric','value'],
      ['functionalRequirements', c.functionalRequirements ?? 0],
      ['technicalApis', c.technicalApis ?? 0],
      ['tests.unit', c.tests?.unit ?? 0],
      ['tests.integration', c.tests?.integration ?? 0],
      ['tests.e2e', c.tests?.e2e ?? 0],
      ['implementation.files', c.implementation?.files ?? 0],
      ['implementation.bytes', c.implementation?.bytes ?? 0],
      ['implementation.loc.total', c.implementation?.loc?.total ?? 0],
      ['implementation.loc.avgPerFile', c.implementation?.loc?.avgPerFile ?? 0],
      ['review.overallScore', c.review?.overallScore ?? 0],
      ['review.findings', c.review?.findings ?? 0],
      ['review.issues', c.review?.issues ?? 0],
      ['review.recommendations', c.review?.recommendations ?? 0],
      ['timings.functional', t.functional ?? 0],
      ['timings.technical', t.technical ?? 0],
      ['timings.architecture', t.architecture ?? 0],
      ['timings.testing', t.testing ?? 0],
      ['timings.implementation', t.implementation ?? 0],
      ['timings.review', t.review ?? 0],
      ['timings.documentation', t.documentation ?? 0],
      ['timings.deployment', t.deployment ?? 0],
      ['orchestration.totalDurationMs', k.orchestration?.totalDurationMs ?? 0],
      ['orchestration.tokensUsed', k.tokensUsed ?? 0]
    ];
    const csv = csvRows.map(r => r.join(',')).join('\n');
    fs.writeFileSync(csvPath, csv);
    this.log(`KPI report written: ${mdPath}`);
    this.log(`KPI CSV written: ${csvPath}`);
  }

  async _save(rvdFile, rvd) {
    await this.rvdManager.save(rvdFile, rvd);
  }
    
  /**
   * Remove generated artifacts for a fresh run while keeping knowledge base.
   */
  async _cleanArtifacts(projectName) {
    const safeName = (projectName || 'unknown').toString().toLowerCase().replace(/\s+/g, '-');
    const outDir = path.join(process.cwd(), 'generated-code', safeName);
    try {
      if (fs.existsSync(outDir)) {
        fs.rmSync(outDir, { recursive: true, force: true });
        this.log(`Cleaned generated artifacts: ${outDir}`);
      } else {
        this.log(`No artifacts to clean: ${outDir}`);
      }
    } catch (err) {
      this.log(`Cleanup failed for ${outDir}: ${err.message}`);
    }
  }
  
  /**
   * Reset RVD sections according to mode.
   * - 'downstream': clears technical..deployment (keeps functional)
   * - 'all': clears functional..deployment
   * - comma list: clears specific sections
   */
  _resetRVDSections(rvd, mode) {
    const allSections = [
      'functional',
      'technical',
      'architecture',
      'testing',
      'implementation',
      'review',
      'documentation',
      'deployment',
    ];
    
    let toClear = [];
    if (mode === 'downstream') {
      toClear = allSections.slice(1); // everything after functional
    } else if (mode === 'all') {
      toClear = allSections;
    } else {
      toClear = mode.split(',').map((s) => s.trim()).filter(Boolean);
    }
    
    toClear.forEach((sec) => {
      if (allSections.includes(sec)) {
        rvd[sec] = null;
      }
    });
    
    // Optionally keep execution log to preserve history; update timestamp
    rvd.lastUpdated = new Date().toISOString();
  }
}

// If executed directly as a CLI
if (process.argv[1] && process.argv[1].endsWith('software-lifecycle-orchestrator.mjs')) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [k, v] = arg.includes('=') ? arg.split('=') : [arg.replace(/^--/, ''), true];
      return [k.replace(/^--/, ''), v];
    })
  );

  const requirementsFile = args.requirements || 'test-8-agent-pipeline/test-requirements.md';
  const rvdFile = args.rvd || 'test-8-agent-pipeline/pipeline-orchestrator.json';
  const continueOnError = !!args['continue-on-error'];
  const cleanArtifacts = !!args['clean-artifacts'];
  const resetSections = args['reset-sections'] || null;

  const report = args['report'] !== 'false';
  const reportDir = args['report-dir'] || 'test-results';
  const orchestrator = new SoftwareLifecycleOrchestrator({ cleanArtifacts, resetSections, report, reportDir });
  orchestrator
    .run({ requirementsFile, rvdFile, continueOnError })
    .then((summary) => {
      console.log('Summary:', JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Orchestrator failed:', err);
      process.exit(1);
    });
}
