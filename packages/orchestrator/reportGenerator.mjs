/**
 * Report Generator
 * Erzeugt detaillierte Markdown-Reports für jede Forge-AI-Ausführung.
 * 
 * Format:
 * - Markdown für menschliche Lesbarkeit
 * - Eingebetteter JSON-Block (`<!-- JSON ... -->`) für maschinenverarbeitung
 * - Sections: Input → Phases → Artifacts → Metrics → Issues → Diagrams → JSON-Block
 */

import fs from 'node:fs';
import path from 'node:path';

export class ReportGenerator {
  constructor(executionLog, config = {}) {
    this.executionLog = executionLog;
    this.projectRoot = config.projectRoot || process.cwd();
    this.workDir = config.workDir || path.join(this.projectRoot, 'forge-ai-work');
    this.timestamp = config.timestamp || new Date().toISOString().replace(/:/g, '-').split('.')[0];
  }

  /**
   * Generiert einen kompletten Report aus dem Execution Log.
   */
  generateMarkdownReport() {
    let md = '';

    md += this._generateHeader();
    md += this._generateMetadata();
    md += this._generateInputSection();
    md += this._generatePhasesSection();
    md += this._generateArtifactsSection();
    md += this._generateMetricsSection();
    md += this._generateIssuesSection();
    md += this._generateDiagramsSection();
    md += this._generateJSONBlock();
    md += this._generateFooter();

    return md;
  }

  _generateHeader() {
    return `# Forge AI - Execution Report

**Generated:** ${new Date().toISOString()}  
**Status:** ${this.executionLog.errors.length === 0 ? '✅ SUCCESS' : '❌ FAILED'}

---

`;
  }

  _generateMetadata() {
    const { startTime, endTime, phases } = this.executionLog;
    const durationMs = new Date(endTime) - new Date(startTime);
    const durationSec = (durationMs / 1000).toFixed(2);

    return `## Execution Summary

| Property | Value |
|----------|-------|
| Start Time | ${startTime} |
| End Time | ${endTime} |
| Duration | ${durationSec}s |
| Total Phases | ${phases.length} |
| Errors | ${this.executionLog.errors.length} |
| Success | ${this.executionLog.errors.length === 0 ? 'Yes' : 'No'} |

`;
  }

  _generateInputSection() {
    const { requirementFile } = this.executionLog;

    let md = `## Input

**Requirement File:** \`${requirementFile || 'N/A'}\`

`;

    // Hier könnten wir das Requirements-Dokument zusammenfassen
    // (Kurze Zusammenfassung, nicht das ganze Dokument)

    return md;
  }

  _generatePhasesSection() {
    const { phases } = this.executionLog;

    let md = `## Execution Phases

| Phase | Status | Duration | Artifacts |
|-------|--------|----------|-----------|
`;

    phases.forEach((phase) => {
      const status = phase.status === 'completed' ? '✅' : '❌';
      const artifacts = phase.artifactPath ? `[${path.basename(phase.artifactPath)}](${phase.artifactPath})` : '-';
      md += `| ${phase.name} | ${status} ${phase.status} | - | ${artifacts} |\n`;
    });

    md += '\n';

    // Detaillierte Phase-Beschreibungen
    md += `### Phase Details\n\n`;
    phases.forEach((phase) => {
      md += `#### ${phase.name}\n`;
      md += `**Status:** ${phase.status}  \n`;
      md += `**Timestamp:** ${phase.timestamp}  \n`;

      if (phase.artifactPath) {
        md += `**Artifact:** \`${phase.artifactPath}\`  \n`;
      }

      if (phase.markdownPath) {
        md += `**Markdown Spec:** \`${phase.markdownPath}\`  \n`;
      }

      md += '\n';
    });

    return md;
  }

  _generateArtifactsSection() {
    const artifacts = this._collectArtifacts();

    let md = `## Generated Artifacts\n\n`;

    if (artifacts.length === 0) {
      md += `No artifacts generated in this execution.\n\n`;
      return md;
    }

    md += `| File | Type | Path |\n`;
    md += `|------|------|------|\n`;

    artifacts.forEach((artifact) => {
      const type = path.extname(artifact).replace('.', '').toUpperCase() || 'FILE';
      md += `| ${path.basename(artifact)} | ${type} | \`${artifact}\` |\n`;
    });

    md += '\n';

    return md;
  }

  _generateMetricsSection() {
    let md = `## Metrics & Quality\n\n`;

    md += `| Metric | Value | Status |\n`;
    md += `|--------|-------|--------|\n`;

    const metrics = this.executionLog.metrics || {};

    // Beispiel-Metriken
    const metricsArray = [
      { name: 'Tests Passed', value: metrics.testsPassed ?? 'N/A', threshold: '>0' },
      { name: 'Tests Failed', value: metrics.testsFailed ?? 'N/A', threshold: '= 0' },
      { name: 'Coverage', value: metrics.coverage ?? 'N/A', threshold: '>80%' },
      { name: 'Lint Errors', value: metrics.lintErrors ?? 'N/A', threshold: '= 0' },
      { name: 'Iterations to Success', value: metrics.iterations ?? 'N/A', threshold: '<5' },
    ];

    metricsArray.forEach((m) => {
      const status = m.value !== 'N/A' ? '✅' : '⏳';
      md += `| ${m.name} | ${m.value} | ${status} (${m.threshold}) |\n`;
    });

    md += '\n';

    return md;
  }

  _generateIssuesSection() {
    const { errors } = this.executionLog;

    let md = `## Issues & Errors\n\n`;

    if (errors.length === 0) {
      md += `✅ No errors encountered.\n\n`;
      return md;
    }

    md += `⚠️ **${errors.length} error(s) encountered:**\n\n`;

    errors.forEach((error, idx) => {
      md += `${idx + 1}. ${error}\n`;
    });

    md += '\n';

    return md;
  }

  _generateDiagramsSection() {
    let md = `## Architecture & Design Diagrams\n\n`;

    md += `### Component Diagram\n\n`;
    md += `\`\`\`plantuml\n`;
    md += `@startuml\n`;
    md += `!define COMPONENT_COLOR #E1F5FE\n`;
    md += `!define MODULE_COLOR #F3E5F5\n`;
    md += `!define SERVICE_COLOR #E8F5E9\n`;
    md += `\n`;
    md += `skinparam backgroundColor #FAFAFA\n`;
    md += `skinparam rectangle {\n`;
    md += `  BackgroundColor<<component>> COMPONENT_COLOR\n`;
    md += `  BackgroundColor<<module>> MODULE_COLOR\n`;
    md += `  BackgroundColor<<service>> SERVICE_COLOR\n`;
    md += `}\n`;
    md += `\n`;
    md += `rectangle "Forge AI Framework" {\n`;
    md += `  rectangle "CLI Layer" <<component>> {\n`;
    md += `    component "CLI Handler" as CLI\n`;
    md += `  }\n`;
    md += `  rectangle "Orchestrator" <<component>> {\n`;
    md += `    component "SoftwareLifecycleOrchestrator" as Orch\n`;
    md += `  }\n`;
    md += `  rectangle "Agents" <<module>> {\n`;
    md += `    component "FunctionalReqAgent" as FuncReq\n`;
    md += `    component "TechnicalReqAgent" as TechReq\n`;
    md += `    component "TestAgent" as TestA\n`;
    md += `    component "ImplementationAgent" as ImplA\n`;
    md += `    component "ReviewAgent" as RevA\n`;
    md += `    component "DocumentationAgent" as DocA\n`;
    md += `  }\n`;
    md += `  rectangle "Knowledge Base" <<service>> {\n`;
    md += `    component "Experiences" as Exp\n`;
    md += `    component "Strategies" as Strat\n`;
    md += `  }\n`;
    md += `}\n`;
    md += `\n`;
    md += `CLI --> Orch\n`;
    md += `Orch --> FuncReq\n`;
    md += `FuncReq --> TechReq\n`;
    md += `TechReq --> TestA\n`;
    md += `TestA --> ImplA\n`;
    md += `ImplA --> RevA\n`;
    md += `RevA --> DocA\n`;
    md += `DocA --> Exp\n`;
    md += `TechReq --> Strat\n`;
    md += `\n`;
    md += `@enduml\n`;
    md += `\`\`\`\n\n`;

    md += `### Execution Flow Sequence\n\n`;
    md += `\`\`\`plantuml\n`;
    md += `@startuml\n`;
    md += `participant CLI\n`;
    md += `participant Orchestrator as Orch\n`;
    md += `participant FunctionalReqAgent as FuncReq\n`;
    md += `participant TechnicalReqAgent as TechReq\n`;
    md += `participant TestAgent\n`;
    md += `participant ImplementationAgent as ImplAgent\n`;
    md += `participant ReviewAgent\n`;
    md += `participant DocumentationAgent as DocAgent\n`;
    md += `participant Knowledge\n`;
    md += `\n`;
    md += `CLI -> Orch: executeWorkflow(requirementsFile)\n`;
    md += `activate Orch\n`;
    md += `Orch -> FuncReq: parseRequirements()\n`;
    md += `activate FuncReq\n`;
    md += `FuncReq --> Orch: functionalSummary.json\n`;
    md += `deactivate FuncReq\n`;
    md += `Orch -> TechReq: generateTechnicalSpec()\n`;
    md += `activate TechReq\n`;
    md += `TechReq --> Orch: technical-spec.json\n`;
    md += `deactivate TechReq\n`;
    md += `Orch -> TestAgent: generateTests()\n`;
    md += `activate TestAgent\n`;
    md += `TestAgent --> Orch: test-spec.json\n`;
    md += `deactivate TestAgent\n`;
    md += `loop Until Tests Pass or Deadlock\n`;
    md += `  Orch -> ImplAgent: generateImplementation()\n`;
    md += `  activate ImplAgent\n`;
    md += `  ImplAgent --> Orch: implementation files\n`;
    md += `  deactivate ImplAgent\n`;
    md += `  Orch -> TestAgent: runTests()\n`;
    md += `  activate TestAgent\n`;
    md += `  TestAgent --> Orch: test results\n`;
    md += `  deactivate TestAgent\n`;
    md += `end\n`;
    md += `Orch -> ReviewAgent: review()\n`;
    md += `activate ReviewAgent\n`;
    md += `ReviewAgent --> Orch: review report\n`;
    md += `deactivate ReviewAgent\n`;
    md += `Orch -> DocAgent: generateDocumentation()\n`;
    md += `activate DocAgent\n`;
    md += `DocAgent --> Orch: docs + diagrams\n`;
    md += `deactivate DocAgent\n`;
    md += `Orch -> Knowledge: persistMetrics()\n`;
    md += `activate Knowledge\n`;
    md += `Knowledge --> Orch: ack\n`;
    md += `deactivate Knowledge\n`;
    md += `Orch --> CLI: execution report\n`;
    md += `deactivate Orch\n`;
    md += `\n`;
    md += `@enduml\n`;
    md += `\`\`\`\n\n`;

    return md;
  }

  _generateJSONBlock() {
    // Eingebetteter JSON für maschinelle Verarbeitung
    const jsonData = {
      timestamp: this.timestamp,
      executionLog: this.executionLog,
      reportGeneratedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(jsonData, null, 2);
    const base64 = Buffer.from(jsonStr).toString('base64');

    let md = `---

## Data (JSON)

\`\`\`json
${jsonStr}
\`\`\`

`;

    return md;
  }

  _generateFooter() {
    return `---

**Report Generated by Forge AI Report Generator**  
For questions or manual curation, contact your team.
`;
  }

  /**
   * Sammelt alle generierten Artefakte aus der executionLog.
   */
  _collectArtifacts() {
    const artifacts = [];

    this.executionLog.phases.forEach((phase) => {
      if (phase.artifactPath) {
        artifacts.push(phase.artifactPath);
      }
      if (phase.markdownPath) {
        artifacts.push(phase.markdownPath);
      }
    });

    return artifacts;
  }

  /**
   * Speichert den Report als Markdown-Datei.
   */
  saveReport(outputDir) {
    const reportDir = path.join(outputDir, this.timestamp);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'execution-report.md');
    const markdown = this.generateMarkdownReport();

    fs.writeFileSync(reportPath, markdown);

    console.log(`✓ Execution report saved to ${reportPath}`);

    return {
      reportPath,
      reportDir,
      timestamp: this.timestamp,
    };
  }
}

export default ReportGenerator;
