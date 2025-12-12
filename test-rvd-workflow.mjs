#!/usr/bin/env node

/**
 * Test RVD Workflow
 * 
 * Tests the complete data flow:
 * requirements.md → FunctionalRequirementsAgent → RVD
 * RVD → TechnicalRequirementsAgent → RVD (extended)
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { FunctionalRequirementsAgent } from './packages/agents/functional-requirements-agent-refactored.mjs';
import { TechnicalRequirementsAgent } from './packages/agents/technical-requirements-agent-refactored.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║          RVD Workflow Test                                     ║
║  requirements.md → Functional → Technical → RVD File          ║
╚════════════════════════════════════════════════════════════════╝
`);

  try {
    // Test paths
    const requirementsFile = path.join(
      __dirname,
      'projects/hello-world/requirements/hello-world-requirements.md'
    );
    const rvdFile = path.join(__dirname, 'test-rvd-output.json');
    const projectName = 'hello-world-test';

    console.log('📋 Setup:');
    console.log(`  Requirements: ${requirementsFile}`);
    console.log(`  RVD Output: ${rvdFile}`);
    console.log(`  Project: ${projectName}\n`);

    // Check if requirements file exists
    if (!fs.existsSync(requirementsFile)) {
      throw new Error(`Requirements file not found: ${requirementsFile}`);
    }

    // ========================================
    // PHASE 1: FunctionalRequirementsAgent
    // ========================================
    console.log('─'.repeat(64));
    console.log('PHASE 1: Functional Requirements Agent');
    console.log('─'.repeat(64));

    const funcAgent = new FunctionalRequirementsAgent({
      projectRoot: __dirname,
    });

    const funcResult = await funcAgent.execute(requirementsFile, rvdFile);
    console.log(`\n✅ Functional phase completed:`);
    console.log(`  - Project: ${funcResult.projectName}`);
    console.log(`  - Requirements extracted: ${funcResult.functionalData.requirements.length}`);
    console.log(`  - RVD path: ${funcResult.rvdPath}`);

    // Display first few requirements
    console.log(`\n  Sample requirements:`);
    funcResult.functionalData.requirements.slice(0, 3).forEach((req, i) => {
      console.log(`    ${i + 1}. "${req.text.substring(0, 60)}..."`);
    });

    // ========================================
    // PHASE 2: TechnicalRequirementsAgent
    // ========================================
    console.log(`\n${'─'.repeat(64)}`);
    console.log('PHASE 2: Technical Requirements Agent');
    console.log('─'.repeat(64));

    const techAgent = new TechnicalRequirementsAgent({
      projectRoot: __dirname,
    });

    const techResult = await techAgent.execute(rvdFile);
    console.log(`\n✅ Technical phase completed:`);
    console.log(`  - APIs generated: ${techResult.technicalSpec.apis.length}`);
    console.log(`  - Data structures: ${techResult.technicalSpec.dataStructures.length}`);
    console.log(`  - Error types: ${techResult.technicalSpec.errorHandling.errorTypes.length}`);

    console.log(`\n  Sample APIs:`);
    techResult.technicalSpec.apis.slice(0, 3).forEach((api, i) => {
      console.log(`    ${i + 1}. ${api.name}`);
      console.log(`       └─ ${api.description.substring(0, 50)}`);
    });

    // ========================================
    // VERIFY RVD FILE
    // ========================================
    console.log(`\n${'─'.repeat(64)}`);
    console.log('PHASE 3: RVD File Verification');
    console.log('─'.repeat(64));

    if (!fs.existsSync(rvdFile)) {
      throw new Error(`RVD file was not created: ${rvdFile}`);
    }

    const rvdContent = JSON.parse(fs.readFileSync(rvdFile, 'utf-8'));

    console.log(`\n✅ RVD file structure:`);
    console.log(`  - Project: ${rvdContent.project?.name || 'N/A'}`);
    console.log(`  - Has functional section: ${!!rvdContent.functional}`);
    console.log(`  - Has technical section: ${!!rvdContent.technical}`);

    if (rvdContent.functional) {
      console.log(`\n  Functional section:`);
      console.log(`    - Timestamp: ${rvdContent.functional.timestamp}`);
      console.log(`    - Requirements: ${rvdContent.functional.data.requirements.length}`);
      console.log(`    - Extracted by: ${rvdContent.functional.extractedBy}`);
    }

    if (rvdContent.technical) {
      console.log(`\n  Technical section:`);
      console.log(`    - Timestamp: ${rvdContent.technical.timestamp}`);
      console.log(`    - APIs: ${rvdContent.technical.data.apis.length}`);
      console.log(`    - Generated by: ${rvdContent.technical.generatedBy}`);
    }

    // ========================================
    // FULL RVD FILE DISPLAY (Formatted)
    // ========================================
    console.log(`\n${'─'.repeat(64)}`);
    console.log('PHASE 4: Full RVD File Content');
    console.log('─'.repeat(64));
    console.log(`\n${JSON.stringify(rvdContent, null, 2)}`);

    // ========================================
    // SUCCESS SUMMARY
    // ========================================
    console.log(`\n${'═'.repeat(64)}`);
    console.log('✅ TEST PASSED - RVD Workflow is working!');
    console.log('═'.repeat(64));

    console.log(`\n📊 Data Flow Summary:`);
    console.log(`  1. requirements.md`);
    console.log(`     ↓ (FunctionalRequirementsAgent)`);
    console.log(`  2. RVD file - functional section`);
    console.log(`     ↓ (TechnicalRequirementsAgent)`);
    console.log(`  3. RVD file - technical section`);
    console.log(`\n✅ All phases working correctly!`);
    console.log(`\n📁 RVD file location: ${rvdFile}\n`);

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ TEST FAILED:`);
    console.error(`   ${error.message}\n`);
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();
