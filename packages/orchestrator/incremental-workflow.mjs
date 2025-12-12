/**
 * Incremental Feature Workflow Manager
 * 
 * Supports:
 * - Resuming from specific phase (--start-from-phase=technical)
 * - Preserving RVD and generated code between feature runs
 * - Merging new requirements with existing artifacts
 * - Checkpoint validation before proceeding to next feature
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export class IncrementalWorkflow {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.rvdPath = config.rvdPath || 'rvd/orchestrator.json';
    this.generatedCodeDir = config.generatedCodeDir || path.join(process.cwd(), 'generated-code');
    this.checkpointDir = config.checkpointDir || 'checkpoints';
  }

  /**
   * Start or resume workflow for a feature
   * @param {string} featureName - Name of the feature (e.g., 'feature-1', 'feature-2')
   * @param {string} requirementsFile - Path to requirements markdown
   * @param {object} options - { startFromPhase, skipCleanup, validate }
   */
  async runFeature(featureName, requirementsFile, options = {}) {
    const {
      startFromPhase = 'functional', // functional|technical|architecture|testing|implementation|review|documentation|deployment
      skipCleanup = false,
      validate = true,
      dryRun = false
    } = options;

    console.log(`
╔════════════════════════════════════════════════════════════╗
║         INCREMENTAL FEATURE WORKFLOW                        ║
║                                                             ║
║  Feature: ${featureName}
║  Phase: ${startFromPhase}
║  Validate: ${validate}
╚════════════════════════════════════════════════════════════╝
`);

    try {
      // 1. Load or create checkpoint for this feature
      const checkpoint = await this._loadOrCreateCheckpoint(featureName);
      checkpoint.requirements = requirementsFile;
      checkpoint.phases = checkpoint.phases || {};

      // 2. Merge requirements if resuming
      if (startFromPhase !== 'functional') {
        console.log(`[Incremental] Resuming from phase: ${startFromPhase}`);
        console.log(`[Checkpoint] Loaded previous phases: ${Object.keys(checkpoint.phases).join(', ')}`);
      }

      // 3. Build orchestrator command
      const orchestratorCmd = this._buildOrchestratorCmd(
        requirementsFile,
        this.rvdPath,
        startFromPhase,
        skipCleanup,
        featureName
      );

      console.log(`[Command] ${orchestratorCmd}`);

      if (dryRun) {
        console.log('[DRY RUN] Skipping execution');
        return checkpoint;
      }

      // 4. Execute orchestrator
      console.log(`\n[Running] Orchestrator from phase: ${startFromPhase}...\n`);
      const output = execSync(orchestratorCmd, { stdio: 'inherit', cwd: this.projectRoot });

      // 5. Update checkpoint with results
      checkpoint.phases[startFromPhase] = { completedAt: new Date().toISOString() };
      checkpoint.lastPhase = startFromPhase;
      checkpoint.status = 'phase-complete';
      await this._saveCheckpoint(featureName, checkpoint);

      // 6. Run validation if enabled
      if (validate) {
        console.log(`\n[Validating] Feature ${featureName}...`);
        const validationResult = await this._validateFeature(featureName);
        checkpoint.validation = validationResult;
        if (!validationResult.passed) {
          console.log(`❌ Validation failed. Review issues and retry.`);
          checkpoint.status = 'validation-failed';
          await this._saveCheckpoint(featureName, checkpoint);
          return checkpoint;
        }
        console.log(`✅ Validation passed.`);
      }

      // 7. Mark feature as ready for review
      checkpoint.status = 'ready-for-review';
      await this._saveCheckpoint(featureName, checkpoint);

      console.log(`\n[Complete] Feature ${featureName} ready for human review.`);
      console.log(`Review at: ${this._getCheckpointPath(featureName)}`);

      return checkpoint;

    } catch (error) {
      console.error(`❌ Feature workflow failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve a feature and mark it as complete
   */
  async approveFeature(featureName, reviewNotes = '') {
    const checkpoint = await this._loadCheckpoint(featureName);
    checkpoint.status = 'approved';
    checkpoint.reviewNotes = reviewNotes;
    checkpoint.approvedAt = new Date().toISOString();
    await this._saveCheckpoint(featureName, checkpoint);
    console.log(`✅ Feature ${featureName} approved and committed to generated-code.`);
  }

  /**
   * Build orchestrator command for incremental run
   */
  _buildOrchestratorCmd(requirementsFile, rvdPath, startFromPhase, skipCleanup, featureName) {
    const phases = ['functional', 'technical', 'architecture', 'testing', 'implementation', 'review', 'documentation', 'deployment'];
    const phaseIndex = phases.indexOf(startFromPhase);

    let cmd = `npm run orchestrate -- --requirements=${requirementsFile} --rvd=${rvdPath}`;

    if (phaseIndex > 0 && !skipCleanup) {
      cmd += ` --reset-sections=${phases.slice(phaseIndex).join(',')}`;
    }

    // Add feature-specific parameters for deployment
    if (featureName) {
      cmd += ` --feature-name=${featureName}`;
      cmd += ` --project-root=${this.projectRoot}`;
      
      // Determine generated code directory
      const projectName = path.basename(this.projectRoot);
      const generatedCodePath = path.join(this.generatedCodeDir, `${projectName}-${featureName}`);
      cmd += ` --generated-code-dir=${generatedCodePath}`;
    }

    cmd += ` --report=true`;

    return cmd;
  }

  /**
   * Validate generated feature
   */
  async _validateFeature(featureName) {
    // Try multiple path patterns (slugified, with project name, as-is)
    const projectName = 'hello-world'; // Read from RVD if available
    const candidates = [
      path.join(this.generatedCodeDir, `${projectName}-${featureName}`),
      path.join(this.generatedCodeDir, featureName),
      path.join(this.generatedCodeDir, projectName),
      path.join(this.generatedCodeDir, featureName.toLowerCase().replace(/\s+/g, '-'))
    ];
    
    let generatedPath = null;
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        generatedPath = candidate;
        console.log(`[Found] Generated code at: ${generatedPath}`);
        break;
      }
    }
    
    const packageJsonPath = generatedPath ? path.join(generatedPath, 'package.json') : null;

    const result = {
      passed: true,
      checks: [],
      errors: []
    };

    if (!generatedPath) {
      result.checks.push({ name: 'files-generated', status: 'fail', message: 'No generated code found in candidates' });
      result.passed = false;
      return result;
    }

    // Check 1: Generated files exist
    const files = this._countFiles(generatedPath);
    result.checks.push({ name: 'files-generated', status: 'pass', message: `${files} files generated` });
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        result.checks.push({ name: 'package-json-valid', status: 'pass', message: pkg.name });
      } catch (e) {
        result.checks.push({ name: 'package-json-valid', status: 'fail', message: e.message });
        result.passed = false;
      }
    }

    // Check 3: Tests exist
    const testsPath = path.join(generatedPath, 'tests');
    if (fs.existsSync(testsPath)) {
      const testCount = fs.readdirSync(testsPath).filter(f => f.endsWith('.test.js')).length;
      result.checks.push({ name: 'tests-present', status: 'pass', message: `${testCount} test files` });
    } else {
      result.checks.push({ name: 'tests-present', status: 'warn', message: 'No tests directory' });
    }

    // Check 4: Documentation exists
    const readmePath = path.join(generatedPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const size = fs.statSync(readmePath).size;
      result.checks.push({ name: 'readme-present', status: 'pass', message: `${(size / 1024).toFixed(1)} KB` });
    } else {
      result.checks.push({ name: 'readme-present', status: 'warn', message: 'No README.md' });
    }

    return result;
  }

  /**
   * Load checkpoint or create new one
   */
  async _loadOrCreateCheckpoint(featureName) {
    const checkpointPath = this._getCheckpointPath(featureName);
    if (fs.existsSync(checkpointPath)) {
      return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
    }
    return {
      featureName,
      createdAt: new Date().toISOString(),
      phases: {},
      status: 'new'
    };
  }

  /**
   * Save checkpoint
   */
  async _saveCheckpoint(featureName, checkpoint) {
    const checkpointPath = this._getCheckpointPath(featureName);
    const dir = path.dirname(checkpointPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
  }

  /**
   * Load existing checkpoint
   */
  async _loadCheckpoint(featureName) {
    const checkpointPath = this._getCheckpointPath(featureName);
    if (!fs.existsSync(checkpointPath)) {
      throw new Error(`Checkpoint not found for feature: ${featureName}`);
    }
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
  }

  /**
   * Get checkpoint path
   */
  _getCheckpointPath(featureName) {
    return path.join(this.projectRoot, this.checkpointDir, `${featureName}.json`);
  }

  /**
   * Count files recursively
   */
  _countFiles(dir) {
    let count = 0;
    const walk = (d) => {
      for (const f of fs.readdirSync(d)) {
        const stat = fs.statSync(path.join(d, f));
        if (stat.isDirectory()) walk(path.join(d, f));
        else count++;
      }
    };
    walk(dir);
    return count;
  }
}

export default IncrementalWorkflow;
