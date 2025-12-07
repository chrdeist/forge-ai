/**
 * Functional Requirements Agent
 * Extrahiert aus der Requirements-Markdown-Datei fachliche Anforderungen:
 * - User Stories / Features
 * - Funktionale Anforderungen (detailliert)
 * - Akzeptanzkriterien
 * - Testideen
 * Erzeugt strukturierte Ausgabe (JSON) für nachgelagerte Agenten.
 */

import fs from 'node:fs';
import path from 'node:path';

export class FunctionalRequirementsAgent {
  constructor(requirementsFilePath) {
    this.requirementsFilePath = requirementsFilePath;
    this.requirements = null;
  }

  /**
   * Parst die Requirements-Markdown-Datei.
   */
  parseRequirements() {
    if (!fs.existsSync(this.requirementsFilePath)) {
      throw new Error(`Requirements file not found: ${this.requirementsFilePath}`);
    }

    const content = fs.readFileSync(this.requirementsFilePath, 'utf-8');
    const requirements = this._extractFromMarkdown(content);
    this.requirements = requirements;
    return requirements;
  }

  /**
   * Extrahiert strukturierte Daten aus dem Markdown.
   * Sucht nach spezifischen Sektionen (User Story, Funktionale Anforderungen, etc.)
   */
  _extractFromMarkdown(content) {
    const extracted = {
      metadata: this._extractYAMLMetadata(content),
      context: this._extractSection(content, '## 1. Kontext'),
      userStory: this._extractSection(content, '## 2. User Story'),
      scope: this._extractSection(content, '## 3. Scope'),
      functionalRequirements: this._extractChecklistItems(content, '## 4. Funktionale Anforderungen'),
      interfaces: this._extractSection(content, '## 5. Schnittstellen'),
      nonFunctionalRequirements: this._extractSection(content, '## 6. Nicht-funktionale Anforderungen'),
      uiInteraction: this._extractSection(content, '## 7. UI / Interaktion'),
      acceptanceCriteria: this._extractChecklistItems(content, '## 8. Akzeptanzkriterien'),
      testIdeas: this._extractSection(content, '## 9. Testideen'),
      impacts: this._extractSection(content, '## 10. Auswirkungen'),
      dod: this._extractChecklistItems(content, '## 11. Definition of Done'),
      openQuestions: this._extractSection(content, '## 12. Offene Fragen'),
    };

    return extracted;
  }

  /**
   * Extrahiert YAML-Frontmatter (Metadaten).
   */
  _extractYAMLMetadata(content) {
    const yamlRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(yamlRegex);
    if (!match) return {};

    const yaml = match[1];
    const metadata = {};
    const lines = yaml.split('\n');

    lines.forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        metadata[key.trim()] = value.replace(/^["']|["']$/g, '') || null;
      }
    });

    return metadata;
  }

  /**
   * Extrahiert Inhalte zwischen zwei Markdown-Headings.
   */
  _extractSection(content, heading) {
    const regex = new RegExp(`${heading}\\s*\n([\\s\\S]*?)(?=##|$)`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extrahiert Checklist-Items (- [ ] Item) aus einer Sektion.
   */
  _extractChecklistItems(content, heading) {
    const section = this._extractSection(content, heading);
    const itemRegex = /- \[[\sxX]\]\s+(.+)/g;
    const items = [];
    let match;

    while ((match = itemRegex.exec(section)) !== null) {
      items.push(match[1].trim());
    }

    return items;
  }

  /**
   * Generiert eine strukturierte Zusammenfassung (Fachliche Anforderungen).
   * Diese wird vom TechnicalRequirementsAgent als Input verwendet.
   */
  generateFunctionalSummary() {
    if (!this.requirements) {
      this.parseRequirements();
    }

    const summary = {
      name: this.requirements.metadata.name || 'Unknown Feature',
      version: this.requirements.metadata.version || '1.0',
      priority: this.requirements.metadata.priority || 'medium',
      userStory: this.requirements.userStory,
      inScope: this._extractListItems(this.requirements.scope, '- In Scope:'),
      outOfScope: this._extractListItems(this.requirements.scope, '- Out of Scope:'),
      functionalRequirements: this.requirements.functionalRequirements,
      acceptanceCriteria: this.requirements.acceptanceCriteria,
      interfaces: this.requirements.interfaces,
      nonFunctionalRequirements: this.requirements.nonFunctionalRequirements,
      uiInteraction: this.requirements.uiInteraction,
      testIdeas: this.requirements.testIdeas,
      affectedComponents: this._extractListItems(this.requirements.impacts, 'Betroffene Dateien'),
      artifacts: this.requirements.metadata.artifacts || [],
      successCriteria: this.requirements.metadata.success_criteria || [],
      buildCommands: this.requirements.metadata.build_test_commands || [],
    };

    return summary;
  }

  /**
   * Extrahiert Listenpunkte nach einem Stichwort aus einer Sektion.
   */
  _extractListItems(section, keyword) {
    const keywordIndex = section.indexOf(keyword);
    if (keywordIndex === -1) return [];

    const afterKeyword = section.substring(keywordIndex);
    const itemRegex = /- (.+?)(?=\n-|\n\n|$)/gs;
    const items = [];
    let match;

    while ((match = itemRegex.exec(afterKeyword)) !== null) {
      items.push(match[1].trim());
    }

    return items;
  }

  /**
   * Speichert die funktionale Zusammenfassung als JSON.
   */
  saveFunctionalSummary(outputPath) {
    const summary = this.generateFunctionalSummary();
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`✓ Functional summary saved to ${outputPath}`);
    return summary;
  }
}

export default FunctionalRequirementsAgent;
