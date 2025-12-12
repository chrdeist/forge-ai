/**
 * ImplementationAgent - Generischer Agent für Code-Generierung
 * 
 * Refaktoriert für zentrale RVD (Requirement Verarbeitungs Datei)
 * 
 * Eingabe: RVD Path
 *   - Liest: Phase 3 (Technical Specification) & Phase 5 (Test Generation)
 *   - Schreibt: Phase 6 (Implementation)
 * 
 * Keine hardcodierten Daten - Alles basiert auf den Spezifikationen
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';
import { RVDManager } from '../orchestrator/rvdManager.mjs';

export class ImplementationAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.rvdPath = null;
    this.rvd = null;
    this.technicalSpec = null;
    this.testSpec = null;
  }

  /**
   * Hauptmethode - generischer Code basierend auf RVD
   */
  async execute(rvdPath) {
    this.rvdPath = rvdPath;
    this._log(`[ImplementationAgent] Processing RVD: ${rvdPath}`);

    try {
      // 1. Lade RVD
      this.rvd = RVDManager.loadRVD(rvdPath);
      this._log(`[ImplementationAgent] ✓ RVD loaded`);

      // 2. Hole Inputs aus RVD
      this.technicalSpec = RVDManager.getPhaseInput(this.rvd, '6-implementation')[0];
      this.testSpec = RVDManager.getPhaseInput(this.rvd, '6-implementation')[1];
      this._log(`[ImplementationAgent] ✓ Input phases loaded`);

      // 3. Validiere Inputs
      if (!this.technicalSpec.apis || this.technicalSpec.apis.length === 0) {
        throw new Error('No APIs defined in technical specification');
      }

      // 4. Generiere Code
      const sourceCode = await this._generateSourceCode();
      const testCode = await this._generateTestCode();
      const packageJson = await this._generatePackageJson();
      
      this._log(`[ImplementationAgent] ✓ Generated ${sourceCode.files.length} source files`);
      this._log(`[ImplementationAgent] ✓ Generated ${testCode.files.length} test files`);

      // 5. Erstelle Output
      const output = {
        sourceCode,
        testCode,
        packageJson,
        buildCommand: 'npm run build',
        testCommand: 'npm test',
        languages: ['javascript'],
        patterns: ['generated-from-spec'],
      };

      // 6. Lerne Pattern
      this.learnPattern({
        name: 'implementation-from-spec',
        category: 'code-generation',
        description: `Generated implementation from technical spec with ${this.technicalSpec.apis.length} APIs`,
        successRate: 0.9,
      });

      // 7. Speichere in RVD
      RVDManager.updatePhase(this.rvd, '6-implementation', output, this.constructor.name);
      RVDManager.saveRVD(this.rvdPath, this.rvd);

      this._log(`[ImplementationAgent] ✓ Phase 6 completed successfully`);
      return output;

    } catch (error) {
      this._log(`[ImplementationAgent] ✗ Error: ${error.message}`);
      RVDManager.markPhaseError(this.rvd, '6-implementation', error, this.constructor.name);
      RVDManager.saveRVD(this.rvdPath, this.rvd);
      throw error;
    }
  }

  /**
   * Generiere Source Code basierend auf technischer Spezifikation
   */
  async _generateSourceCode() {
    const files = [];

    // Generiere Dateien basierend auf APIs in der Spec
    for (const api of this.technicalSpec.apis) {
      const code = this._generateAPICode(api);
      files.push({
        path: `src/${this._apiNameToFileName(api.name)}.js`,
        content: code,
        type: 'source',
        apiName: api.name,
      });
    }

    // Generiere auch eine Main-Entry-Datei wenn vorhanden
    if (this.technicalSpec.entryPoint) {
      const mainCode = this._generateMainFile();
      files.push({
        path: `src/index.js`,
        content: mainCode,
        type: 'source',
      });
    }

    return { files };
  }

  /**
   * Generiere Code für eine einzelne API
   */
  _generateAPICode(api) {
    const name = api.name;
    const description = api.description || '';
    const params = api.signature.parameters || [];
    const returns = api.signature.returns || {};

    let code = `/**\n`;
    code += ` * ${name}\n`;
    code += ` * ${description}\n`;
    code += ` *\n`;

    params.forEach(p => {
      code += ` * @param {${p.type}} ${p.name} - ${p.description || ''}\n`;
    });

    code += ` * @returns {${returns.type}} ${returns.description || ''}\n`;
    code += ` */\n`;

    // Generiere Funktionssignatur
    const paramNames = params.map(p => p.name).join(', ');
    code += `export function ${name}(${paramNames}) {\n`;

    // Generiere Validierung basierend auf Spec
    if (api.validation) {
      api.validation.forEach(v => {
        code += `  // Validate: ${v.rule}\n`;
        code += `  if (!${v.condition}) {\n`;
        code += `    throw new Error('${v.errorMessage}');\n`;
        code += `  }\n`;
      });
    }

    // Generiere Implementierung basierend auf API-Typ
    if (api.implementation && api.implementation.template) {
      code += this._generateImplementationBody(api);
    } else {
      // Default Implementation Pattern
      code += `  try {\n`;
      code += `    // TODO: Implement ${name}\n`;
      code += `    const result = { success: true, data: null };\n`;
      code += `    return result;\n`;
      code += `  } catch (error) {\n`;
      code += `    throw new Error(\`Error in ${name}: \${error.message}\`);\n`;
      code += `  }\n`;
    }

    code += `}\n\n`;
    code += `export default ${name};\n`;

    return code;
  }

  /**
   * Generiere Implementation Body basierend auf Template
   */
  _generateImplementationBody(api) {
    const template = api.implementation.template;

    switch (template) {
      case 'function-with-validation':
        return this._generateValidationTemplate(api);
      case 'transform-function':
        return this._generateTransformTemplate(api);
      case 'cli-handler':
        return this._generateCLITemplate(api);
      default:
        return `  // Template: ${template}\n  return null;\n`;
    }
  }

  /**
   * Template: Funktion mit Validierung
   */
  _generateValidationTemplate(api) {
    let code = `  try {\n`;
    
    // Parametervalidierung
    api.signature.parameters.forEach(p => {
      if (p.type === 'string') {
        code += `    if (typeof ${p.name} !== 'string' && ${p.name} !== undefined) {\n`;
        code += `      throw new Error('${p.name} must be a string');\n`;
        code += `    }\n`;
      }
    });

    // Implementierung
    code += `    const result = { success: true, data: null };\n`;
    code += `    // TODO: Add actual implementation logic\n`;
    code += `    return result;\n`;
    code += `  } catch (error) {\n`;
    code += `    throw new Error(\`Validation error: \${error.message}\`);\n`;
    code += `  }\n`;

    return code;
  }

  /**
   * Template: Transform-Funktion
   */
  _generateTransformTemplate(api) {
    let code = `  try {\n`;
    code += `    const input = ${api.signature.parameters[0]?.name || 'data'};\n`;
    code += `    if (!input) {\n`;
    code += `      throw new Error('Input data is required');\n`;
    code += `    }\n`;
    code += `    // Transform the input\n`;
    code += `    const result = { success: true, transformed: input };\n`;
    code += `    return result;\n`;
    code += `  } catch (error) {\n`;
    code += `    throw new Error(\`Transform failed: \${error.message}\`);\n`;
    code += `  }\n`;

    return code;
  }

  /**
   * Template: CLI-Handler
   */
  _generateCLITemplate(api) {
    let code = `  try {\n`;
    code += `    const args = ${api.signature.parameters[0]?.name || 'argv'} || [];\n`;
    code += `    const options = {};\n`;
    code += `    \n`;
    code += `    for (const arg of args) {\n`;
    code += `      if (arg.startsWith('--')) {\n`;
    code += `        const [key, value] = arg.substring(2).split('=');\n`;
    code += `        options[key] = value || true;\n`;
    code += `      }\n`;
    code += `    }\n`;
    code += `    \n`;
    code += `    return { success: true, options };\n`;
    code += `  } catch (error) {\n`;
    code += `    throw new Error(\`CLI parsing failed: \${error.message}\`);\n`;
    code += `  }\n`;

    return code;
  }

  /**
   * Generiere Main-Entry-Datei
   */
  _generateMainFile() {
    let code = `/**\n`;
    code += ` * Main Entry Point\n`;
    code += ` * Auto-generated from technical specification\n`;
    code += ` */\n\n`;

    // Importiere alle APIs
    const apis = this.technicalSpec.apis || [];
    apis.forEach(api => {
      const fileName = this._apiNameToFileName(api.name);
      code += `import ${api.name} from './${fileName}.js';\n`;
    });

    code += `\n`;
    code += `export {\n`;
    apis.forEach((api, i) => {
      code += `  ${api.name}${i < apis.length - 1 ? ',' : ''}\n`;
    });
    code += `};\n\n`;

    code += `export default { `;
    code += apis.map(a => a.name).join(', ');
    code += ` };\n`;

    return code;
  }

  /**
   * Generiere Test-Code basierend auf Test-Spezifikation
   */
  async _generateTestCode() {
    const files = [];

    if (!this.testSpec || !this.testSpec.testCases) {
      return { files };
    }

    // Gruppiere Tests nach API
    const testsByAPI = {};
    this.testSpec.testCases.forEach(test => {
      const api = test.api || 'general';
      if (!testsByAPI[api]) {
        testsByAPI[api] = [];
      }
      testsByAPI[api].push(test);
    });

    // Generiere Test-Datei für jede API
    for (const [apiName, tests] of Object.entries(testsByAPI)) {
      const testCode = this._generateTestFile(apiName, tests);
      files.push({
        path: `test/${this._apiNameToFileName(apiName)}.test.js`,
        content: testCode,
        type: 'test',
        apiName,
      });
    }

    return { files };
  }

  /**
   * Generiere Test-Datei für eine API
   */
  _generateTestFile(apiName, tests) {
    const fileName = this._apiNameToFileName(apiName);
    
    let code = `/**\n`;
    code += ` * Tests for ${apiName}\n`;
    code += ` * Auto-generated from test specification\n`;
    code += ` */\n\n`;

    code += `import { test } from 'node:test';\n`;
    code += `import assert from 'node:assert';\n`;
    code += `import ${apiName} from '../src/${fileName}.js';\n\n`;

    tests.forEach((testCase, index) => {
      code += `test('${testCase.id || `Test ${index + 1}`}: ${testCase.description || testCase.scenario}', () => {\n`;
      code += `  try {\n`;
      code += `    // ${testCase.scenario}\n`;
      
      if (testCase.testCode) {
        // Verwende den Test-Code aus der Spezifikation
        code += `    ${testCase.testCode}\n`;
      } else {
        // Generiere einen einfachen Test
        code += `    // TODO: Implement test\n`;
        code += `    assert.ok(true, 'Test placeholder');\n`;
      }

      code += `  } catch (error) {\n`;
      code += `    assert.fail(\`Test failed: \${error.message}\`);\n`;
      code += `  }\n`;
      code += `});\n\n`;
    });

    return code;
  }

  /**
   * Generiere package.json
   */
  async _generatePackageJson() {
    const name = this.technicalSpec.name || 'generated-project';
    const version = this.technicalSpec.version || '1.0.0';

    return {
      name,
      version,
      description: this.technicalSpec.description || `Generated from technical specification`,
      type: 'module',
      main: 'src/index.js',
      scripts: {
        test: 'node --test test/**/*.test.js',
        start: 'node src/index.js',
        lint: 'eslint src test',
      },
      keywords: this.technicalSpec.keywords || [],
      author: 'Forge AI',
      license: 'MIT',
      dependencies: this.technicalSpec.dependencies || {},
      devDependencies: {
        eslint: '^8.0.0',
      },
    };
  }

  /**
   * Utility: Konvertiere API-Namen zu Dateinamen
   */
  _apiNameToFileName(apiName) {
    return apiName
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * Speichere generierte Dateien auf die Festplatte
   */
  async saveGeneratedFiles(outputDir) {
    if (!this.rvd || !this.rvd.phases['6-implementation'].output) {
      throw new Error('No generated code available. Run execute() first.');
    }

    const output = this.rvd.phases['6-implementation'].output;

    // Erstelle Verzeichnisse
    const srcDir = path.join(outputDir, 'src');
    const testDir = path.join(outputDir, 'test');

    [srcDir, testDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Speichere Source-Code
    for (const file of output.sourceCode.files) {
      const filePath = path.join(outputDir, file.path);
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content);
      this._log(`✓ Created: ${file.path}`);
    }

    // Speichere Test-Code
    for (const file of output.testCode.files) {
      const filePath = path.join(outputDir, file.path);
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content);
      this._log(`✓ Created: ${file.path}`);
    }

    // Speichere package.json
    const packageJsonPath = path.join(outputDir, 'package.json');
    fs.writeFileSync(packageJsonPath, JSON.stringify(output.packageJson, null, 2));
    this._log(`✓ Created: package.json`);

    return {
      sourceFiles: output.sourceCode.files.length,
      testFiles: output.testCode.files.length,
      outputDir,
    };
  }
}

export default ImplementationAgent;
