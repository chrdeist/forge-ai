#!/usr/bin/env node

/**
 * Test-Skript für die neue RVD-basierte Agent-Architektur
 * 
 * Demonstriert:
 * 1. RVD-Erstellung
 * 2. Generische Agenten, die mit RVD arbeiten
 * 3. Datenaustausch zwischen Agenten
 * 4. Code-Generierung basierend auf Spezifikationen
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RVDManager } from './packages/orchestrator/rvdManager.mjs';
import { ImplementationAgent } from './packages/agents/implementation-agent-rvd.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Erstelle eine Mock-RVD für Testing
 */
function createMockRVD() {
  const rvd = RVDManager.createRVD('hello-world', process.cwd());

  // Simuliere Phase 1: Parse Requirements
  rvd.phases['1-parse-requirements'].output = {
    name: 'hello-world',
    priority: 'high',
    content: 'CLI Tool that outputs Hello World message',
  };
  rvd.phases['1-parse-requirements'].status = 'completed';

  // Simuliere Phase 2: Functional Requirements
  rvd.phases['2-functional-requirements'].output = {
    functionalRequirements: [
      'Das Tool gibt bei Aufruf ohne Parameter "Hello, World!" aus.',
      'Das Tool akzeptiert einen optionalen --name Parameter.',
      'Bei Übergabe von --name=XYZ gibt das Tool "Hello, XYZ!" aus.',
      'Bei Übergabe eines leeren Namens (--name=) wird "Hello, World!" ausgegeben.',
      'Das Tool gibt eine Hilfemeldung bei --help aus.',
      'Der Exit-Code ist 0 bei erfolgreichem Durchlauf.',
    ],
    acceptanceCriteria: [
      'Output without params is "Hello, World!"',
      'Output with --name=Alice is "Hello, Alice!"',
      '--help shows help message',
      'Exit code is 0 on success',
    ],
    patterns: ['clear-user-story'],
  };
  rvd.phases['2-functional-requirements'].status = 'completed';

  // Simuliere Phase 3: Technical Specification
  rvd.phases['3-technical-specification'].output = {
    name: 'hello-world',
    version: '1.0.0',
    description: 'Hello World CLI Tool',
    keywords: ['cli', 'hello-world'],
    entryPoint: 'src/index.js',
    
    apis: [
      {
        name: 'formatGreeting',
        description: 'Formats a greeting message based on optional name parameter',
        category: 'core-function',
        signature: {
          parameters: [
            {
              name: 'name',
              type: 'string',
              description: 'Optional name to include in greeting',
              required: false,
            },
          ],
          returns: {
            type: 'string',
            description: 'Formatted greeting message',
          },
        },
        validation: [
          {
            rule: 'name is empty string or undefined',
            condition: 'name === "" || name === undefined',
            errorMessage: 'Name parameter is empty',
          },
        ],
        implementation: {
          template: 'function-with-validation',
          description: 'Takes optional name, returns formatted greeting',
        },
      },
      {
        name: 'parseArgs',
        description: 'Parses command line arguments',
        category: 'utility',
        signature: {
          parameters: [
            {
              name: 'argv',
              type: 'array',
              description: 'Array of command line arguments',
              required: true,
            },
          ],
          returns: {
            type: 'object',
            description: 'Parsed arguments object { name, help, ... }',
          },
        },
        implementation: {
          template: 'cli-handler',
          description: 'Parses --name=value --help flags',
        },
      },
      {
        name: 'main',
        description: 'Main CLI entry point',
        category: 'entry-point',
        signature: {
          parameters: [
            {
              name: 'argv',
              type: 'array',
              description: 'Process arguments',
              required: true,
            },
          ],
          returns: {
            type: 'number',
            description: 'Exit code',
          },
        },
        implementation: {
          template: 'cli-handler',
          description: 'Orchestrates parsing and greeting output',
        },
      },
    ],

    dataStructures: [
      {
        name: 'ParsedArgs',
        fields: [
          { name: 'name', type: 'string', description: 'Name parameter from CLI' },
          { name: 'help', type: 'boolean', description: 'Help flag' },
        ],
      },
    ],

    errorHandling: [
      {
        error: 'InvalidArgumentError',
        cause: 'Invalid argument format',
        handling: 'Log error and show help message',
      },
    ],

    dependencies: [],
  };
  rvd.phases['3-technical-specification'].status = 'completed';

  // Simuliere Phase 5: Test Generation
  rvd.phases['5-test-generation'].output = {
    testCases: [
      {
        id: 'test-greeting-default',
        api: 'formatGreeting',
        description: 'Default greeting without name',
        scenario: 'formatGreeting()',
        expectedOutput: '"Hello, World!"',
        testCode: 'const result = formatGreeting(); assert.equal(result, "Hello, World!");',
      },
      {
        id: 'test-greeting-with-name',
        api: 'formatGreeting',
        description: 'Greeting with name',
        scenario: 'formatGreeting("Alice")',
        expectedOutput: '"Hello, Alice!"',
        testCode: 'const result = formatGreeting("Alice"); assert.equal(result, "Hello, Alice!");',
      },
      {
        id: 'test-parse-args-name',
        api: 'parseArgs',
        description: 'Parse name argument',
        scenario: 'parseArgs(["--name=Bob"])',
        expectedOutput: '{ name: "Bob" }',
        testCode: 'const result = parseArgs(["--name=Bob"]); assert.equal(result.name, "Bob");',
      },
      {
        id: 'test-parse-args-help',
        api: 'parseArgs',
        description: 'Parse help flag',
        scenario: 'parseArgs(["--help"])',
        expectedOutput: '{ help: true }',
        testCode: 'const result = parseArgs(["--help"]); assert.equal(result.help, true);',
      },
    ],
    testFramework: 'node:test',
    testCommand: 'npm test',
  };
  rvd.phases['5-test-generation'].status = 'completed';

  return rvd;
}

/**
 * Haupttest-Funktion
 */
async function runTest() {
  console.log('🧪 Testing RVD-based Agent Architecture\n');
  console.log('═'.repeat(70));

  // 1. Erstelle Mock-RVD
  console.log('\n1️⃣  Creating Mock RVD...');
  const rvd = createMockRVD();
  const rvdPath = '/tmp/test-hello-world-rvd.json';
  RVDManager.saveRVD(rvdPath, rvd);
  console.log(`   ✓ RVD created: ${rvdPath}`);

  // 2. Zeige RVD-Summary
  console.log('\n2️⃣  RVD Summary:');
  const summary = RVDManager.getSummary(rvd);
  console.log(`   - Requirement ID: ${summary.requirementId}`);
  console.log(`   - Completed Phases: ${summary.completed}/${summary.total}`);
  console.log(`   - Status: ${summary.status}`);

  // 3. Führe ImplementationAgent aus
  console.log('\n3️⃣  Executing ImplementationAgent...');
  const implAgent = new ImplementationAgent();
  
  try {
    const output = await implAgent.execute(rvdPath);
    console.log(`   ✓ Agent execution completed`);
    console.log(`   - Generated Source Files: ${output.sourceCode.files.length}`);
    console.log(`   - Generated Test Files: ${output.testCode.files.length}`);

    // Zeige generierte Dateien
    console.log('\n   Generated Source Files:');
    output.sourceCode.files.forEach(file => {
      const preview = file.content.split('\n').slice(0, 3).join('\n   ');
      console.log(`     📄 ${file.path}`);
      console.log(`        ${preview}...`);
    });

    console.log('\n   Generated Test Files:');
    output.testCode.files.forEach(file => {
      console.log(`     🧪 ${file.path}`);
    });

    // 4. Speichere generierte Dateien
    console.log('\n4️⃣  Saving Generated Files...');
    const outputDir = '/tmp/generated-hello-world';
    const result = await implAgent.saveGeneratedFiles(outputDir);
    console.log(`   ✓ Files saved to: ${result.outputDir}`);
    console.log(`   - Source files: ${result.sourceFiles}`);
    console.log(`   - Test files: ${result.testFiles}`);

    // 5. Zeige generierten Code
    console.log('\n5️⃣  Generated Code Examples:\n');
    output.sourceCode.files.forEach(file => {
      console.log(`   📝 ${file.path}:`);
      console.log('   ' + '-'.repeat(60));
      console.log(file.content.split('\n').map(line => '   ' + line).join('\n'));
      console.log('   ' + '-'.repeat(60));
    });

    // 6. Zeige aktualisierte RVD
    console.log('\n6️⃣  Updated RVD Summary:\n');
    const updatedRvd = RVDManager.loadRVD(rvdPath);
    const phase6 = updatedRvd.phases['6-implementation'];
    console.log(`   Phase 6 Status: ${phase6.status}`);
    console.log(`   Timestamp: ${phase6.timestamp}`);
    console.log(`   Output Files: ${phase6.output.sourceCode.files.length}`);

    // 7. Markdown Export
    console.log('\n7️⃣  Markdown Export:\n');
    const markdown = RVDManager.exportAsMarkdown(updatedRvd);
    console.log(markdown);

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Test completed successfully!\n');

  } catch (error) {
    console.error(`\n   ✗ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Führe Test aus
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
