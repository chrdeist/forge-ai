/**
 * Documentation Agent
 * Generiert detaillierte Dokumentation und PlantUML-Diagramme
 * basierend auf der technischen Spezifikation.
 * 
 * Output:
 * - feature-documentation.md (Übersicht, User Stories, Use Cases)
 * - architecture.puml (Komponenten und Schnittstellen)
 * - sequence.puml (Execution Flow)
 * - usecases.puml (Use Case Diagramm)
 */

import fs from 'node:fs';
import path from 'node:path';

export class DocumentationAgent {
  constructor(technicalSpecPath, config = {}) {
    this.technicalSpecPath = technicalSpecPath;
    this.functionalSummaryPath = config.functionalSummaryPath;
    this.technicalSpec = null;
    this.functionalSummary = null;
  }

  /**
   * Lädt die Spezifikationen.
   */
  loadSpecifications() {
    if (!fs.existsSync(this.technicalSpecPath)) {
      throw new Error(`Technical spec not found: ${this.technicalSpecPath}`);
    }

    const techContent = fs.readFileSync(this.technicalSpecPath, 'utf-8');
    this.technicalSpec = JSON.parse(techContent);

    if (this.functionalSummaryPath && fs.existsSync(this.functionalSummaryPath)) {
      const funcContent = fs.readFileSync(this.functionalSummaryPath, 'utf-8');
      this.functionalSummary = JSON.parse(funcContent);
    }

    return { technicalSpec: this.technicalSpec, functionalSummary: this.functionalSummary };
  }

  /**
   * Generiert die Haupt-Dokumentation (Markdown).
   */
  generateFeatureDocumentation() {
    if (!this.technicalSpec) {
      this.loadSpecifications();
    }

    let md = `# ${this.technicalSpec.name} - Feature Documentation\n\n`;

    md += `**Version:** ${this.technicalSpec.version}  \n`;
    md += `**Generated:** ${new Date().toISOString()}  \n\n`;

    // User Story
    if (this.functionalSummary?.userStory) {
      md += `## User Story\n\n`;
      md += `${this.functionalSummary.userStory}\n\n`;
    }

    // Functional Requirements
    if (this.functionalSummary?.functionalRequirements) {
      md += `## Functional Requirements\n\n`;
      this.functionalSummary.functionalRequirements.forEach((req) => {
        md += `- ${req}\n`;
      });
      md += '\n';
    }

    // Acceptance Criteria
    if (this.functionalSummary?.acceptanceCriteria) {
      md += `## Acceptance Criteria\n\n`;
      this.functionalSummary.acceptanceCriteria.forEach((ac) => {
        md += `- ${ac}\n`;
      });
      md += '\n';
    }

    // Technical Overview
    md += `## Technical Overview\n\n`;

    md += `### Modules\n\n`;
    this.technicalSpec.modules.forEach((mod) => {
      md += `**${mod.name}** (\`${mod.path}\`)  \n`;
      md += `${mod.responsibility}\n\n`;
    });

    // APIs
    md += `### API Specifications\n\n`;
    this.technicalSpec.apis.forEach((api) => {
      md += `#### \`${api.name}\`\n\n`;
      md += `${api.description}\n\n`;
      md += `**Signature:**\n`;
      md += `\`\`\`typescript\n`;
      const params = api.signature.parameters.map((p) => `${p.name}: ${p.type}`).join(', ');
      md += `${api.name}(${params}): ${api.signature.returns.type}\n`;
      md += `\`\`\`\n\n`;

      md += `**Parameters:**\n\n`;
      api.signature.parameters.forEach((p) => {
        md += `- \`${p.name}\` (${p.type}): ${p.description}${p.required ? ' **[Required]**' : ' [Optional]'}\n`;
      });
      md += '\n';

      md += `**Returns:**\n\n`;
      md += `${api.signature.returns.type}: ${api.signature.returns.description}\n\n`;

      md += `**Error Cases:**\n\n`;
      api.errorCases.forEach((err) => {
        md += `- ${err}\n`;
      });
      md += '\n';
    });

    // Data Structures
    md += `### Data Structures\n\n`;
    this.technicalSpec.dataStructures.forEach((dto) => {
      md += `#### ${dto.name}\n\n`;
      md += `${dto.description}\n\n`;
      md += `| Field | Type | Required | Description |\n`;
      md += `|-------|------|----------|-------------|\n`;
      dto.fields.forEach((field) => {
        const req = field.required ? 'Yes' : 'No';
        md += `| ${field.name} | \`${field.type}\` | ${req} | ${field.description || '-'} |\n`;
      });
      md += '\n';
    });

    // Constraints
    if (this.technicalSpec.constraints.length > 0) {
      md += `### Constraints & Invariants\n\n`;
      this.technicalSpec.constraints.forEach((constraint) => {
        md += `- **${constraint.name}:** ${constraint.description}`;
        if (constraint.threshold) {
          md += ` (${constraint.threshold})`;
        }
        md += '\n';
      });
      md += '\n';
    }

    // Implementation Hints
    md += `### Implementation Guidelines\n\n`;
    this.technicalSpec.implementationHints.forEach((hint) => {
      md += `- ${hint}\n`;
    });
    md += '\n';

    return md;
  }

  /**
   * Generiert ein Architecture-Diagramm (PlantUML).
   */
  generateArchitectureDiagram() {
    let puml = `@startuml\n`;
    puml += `!include <C4/C4_Component>\n\n`;

    puml += `title ${this.technicalSpec.name} - Component Architecture\n\n`;

    // Container
    puml += `Container_Boundary(c1, "System") {\n`;

    // Components aus Modules
    this.technicalSpec.modules.forEach((mod, idx) => {
      puml += `  Component(comp${idx}, "${mod.name}", "${mod.path}", "${mod.responsibility}")\n`;
    });

    puml += `}\n\n`;

    // Beziehungen (vereinfacht)
    puml += `Rel(comp0, comp1, "depends on")\n`;

    puml += `@enduml\n`;

    return puml;
  }

  /**
   * Generiert ein Sequence-Diagramm für den typischen Execution Flow.
   */
  generateSequenceDiagram() {
    let puml = `@startuml\n`;
    puml += `title ${this.technicalSpec.name} - Execution Flow\n\n`;

    puml += `actor Client\n`;
    puml += `participant "Main Module" as Main\n`;

    // Aus den APIs Sequenz-Schritte ableiten
    this.technicalSpec.apis.forEach((api, idx) => {
      puml += `participant "${api.name}" as API${idx}\n`;
    });

    puml += `\n`;
    puml += `Client -> Main: invoke\n`;
    puml += `activate Main\n`;

    this.technicalSpec.apis.forEach((api, idx) => {
      puml += `Main -> API${idx}: ${api.name}()\n`;
      puml += `activate API${idx}\n`;
      puml += `API${idx} --> Main: result\n`;
      puml += `deactivate API${idx}\n`;
    });

    puml += `Main --> Client: output\n`;
    puml += `deactivate Main\n`;

    puml += `@enduml\n`;

    return puml;
  }

  /**
   * Generiert ein Use Case Diagramm.
   */
  generateUseCaseDiagram() {
    let puml = `@startuml\n`;
    puml += `title ${this.technicalSpec.name} - Use Cases\n\n`;

    puml += `left to right direction\n\n`;

    puml += `actor User\n`;
    puml += `rectangle System {\n`;

    // Use Cases aus funktionalen Anforderungen
    if (this.functionalSummary?.functionalRequirements) {
      this.functionalSummary.functionalRequirements.forEach((req) => {
        const ucName = req.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
        puml += `  usecase "${req}" as UC_${ucName}\n`;
      });
    } else {
      // Fallback: Use APIs als Use Cases
      this.technicalSpec.apis.forEach((api) => {
        puml += `  usecase "Execute ${api.name}" as UC_${api.id}\n`;
      });
    }

    puml += `}\n\n`;

    if (this.functionalSummary?.functionalRequirements) {
      this.functionalSummary.functionalRequirements.forEach((req) => {
        const ucName = req.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
        puml += `User --> UC_${ucName}\n`;
      });
    } else {
      this.technicalSpec.apis.forEach((api) => {
        puml += `User --> UC_${api.id}\n`;
      });
    }

    puml += `\n@enduml\n`;

    return puml;
  }

  /**
   * Speichert alle generierten Dokumente und Diagramme.
   */
  saveDocumentation(outputDir) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = {};

    // Feature Documentation (Markdown)
    const featureDocPath = path.join(outputDir, 'feature-documentation.md');
    const featureDoc = this.generateFeatureDocumentation();
    fs.writeFileSync(featureDocPath, featureDoc);
    console.log(`✓ Feature documentation saved to ${featureDocPath}`);
    results.featureDoc = featureDocPath;

    // Architecture Diagram
    const archPath = path.join(outputDir, 'architecture.puml');
    const archDiagram = this.generateArchitectureDiagram();
    fs.writeFileSync(archPath, archDiagram);
    console.log(`✓ Architecture diagram saved to ${archPath}`);
    results.architecture = archPath;

    // Sequence Diagram
    const seqPath = path.join(outputDir, 'sequence.puml');
    const seqDiagram = this.generateSequenceDiagram();
    fs.writeFileSync(seqPath, seqDiagram);
    console.log(`✓ Sequence diagram saved to ${seqPath}`);
    results.sequence = seqPath;

    // Use Case Diagram
    const ucPath = path.join(outputDir, 'usecases.puml');
    const ucDiagram = this.generateUseCaseDiagram();
    fs.writeFileSync(ucPath, ucDiagram);
    console.log(`✓ Use case diagram saved to ${ucPath}`);
    results.usecases = ucPath;

    return results;
  }
}

export default DocumentationAgent;
