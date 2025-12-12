#!/usr/bin/env node

/**
 * Incremental Feature Workflow CLI
 * 
 * Usage:
 *   node packages/orchestrator/incremental-workflow-cli.mjs \
 *     --project=projects/hello-world \
 *     --feature=feature-2 \
 *     --requirements=requirements/hello-world-feature-2.md \
 *     --start-from-phase=functional
 * 
 *   node packages/orchestrator/incremental-workflow-cli.mjs \
 *     --project=projects/hello-world \
 *     --feature=feature-2 \
 *     --approve
 */

import { IncrementalWorkflow } from './incremental-workflow.mjs';
import process from 'node:process';

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [k, v] = arg.includes('=') ? arg.split('=') : [arg.replace(/^--/, ''), true];
      return [k.replace(/^--/, ''), v];
    })
  );

  const project = args.project || 'projects/hello-world';
  const feature = args.feature;
  const requirements = args.requirements;
  const startFromPhase = args['start-from-phase'] || 'functional';
  const approve = !!args.approve;
  const dryRun = !!args['dry-run'];
  const validate = args.validate !== 'false';

  if (!feature) {
    console.error('❌ Missing --feature flag');
    process.exit(1);
  }

  if (approve) {
    const workflow = new IncrementalWorkflow({ projectRoot: project });
    const notes = args['review-notes'] || 'Approved by human review';
    await workflow.approveFeature(feature, notes);
    process.exit(0);
  }

  if (!requirements) {
    console.error('❌ Missing --requirements flag');
    process.exit(1);
  }

  try {
    const workflow = new IncrementalWorkflow({ projectRoot: project });
    const checkpoint = await workflow.runFeature(feature, requirements, {
      startFromPhase,
      validate,
      dryRun
    });

    console.log(`\n[Checkpoint] Status: ${checkpoint.status}`);
    if (checkpoint.validation) {
      console.log('[Validation Results]');
      checkpoint.validation.checks.forEach(c => {
        const icon = c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌';
        console.log(`  ${icon} ${c.name}: ${c.message}`);
      });
    }

    if (checkpoint.status === 'ready-for-review') {
      console.log(`\n[Next Step] Human review required. Then run:`);
      console.log(`  node packages/orchestrator/incremental-workflow-cli.mjs \\`);
      console.log(`    --project=${project} \\`);
      console.log(`    --feature=${feature} \\`);
      console.log(`    --approve \\`);
      console.log(`    --review-notes="Approved and tested manually"`);
    }

    process.exit(checkpoint.status === 'ready-for-review' ? 0 : 1);
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
    process.exit(1);
  }
}

main();
