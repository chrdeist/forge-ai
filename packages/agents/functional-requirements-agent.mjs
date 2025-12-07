/**
 * Functional Requirements Agent (Refactored)
 * 
 * Part 1: Generic Definition (this file)
 * - Parses requirement markdown
 * - Extracts structured functional data
 * - No hardcoded content
 * 
 * Part 2: Requirement Context
 * - Input: requirements.md file
 * - Output: functionalSummary.json
 * 
 * Part 3: Knowledge Base
 * - Learned patterns: What makes requirements clear?
 * - Strategies: How to structure functional specs?
 * - Success rates: Which extraction patterns work best?
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';

export class FunctionalRequirementsAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.requirements = null;
  }

  /**
   * Parse the requirement markdown file.
   */
  async execute(requirementsFilePath) {
    if (!fs.existsSync(requirementsFilePath)) {
      throw new Error(`Requirements file not found: ${requirementsFilePath}`);
    }

    this._log(`Processing requirements file: ${requirementsFilePath}`);

    // Load knowledge base
    this.loadKnowledgeBase();

    // Create context
    const content = fs.readFileSync(requirementsFilePath, 'utf-8');
    const requirementName = path.basename(requirementsFilePath, '.md');
    this.setRequirementContext({
      name: requirementName,
      filePath: requirementsFilePath,
    });

    // Parse requirements
    const requirements = this._extractFromMarkdown(content);
    this.requirements = requirements;

    // Learn patterns from this execution
    this._learnFromExecution(requirements);

    return requirements;
  }

  /**
   * Extract structured data from markdown.
   * Uses generic parsing logic, no hardcodes.
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
   * Extract YAML frontmatter.
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
   * Extract section content between headings.
   */
  _extractSection(content, heading) {
    const regex = new RegExp(`${heading}\\s*\n([\\s\\S]*?)(?=##|$)`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extract checklist items (- [ ] Item).
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
   * Learn patterns from this execution.
   * What made this requirement clear? What was missing?
   */
  _learnFromExecution(requirements) {
    // Pattern 1: Clarity of user story
    if (requirements.userStory && requirements.userStory.length > 50) {
      this.learnPattern({
        name: 'clear-user-story',
        category: 'requirement-clarity',
        description: 'Well-defined user story helps downstream processing',
        example: requirements.userStory.substring(0, 100),
        successRate: 0.9,
      });
    }

    // Pattern 2: Acceptance criteria coverage
    const acCount = requirements.acceptanceCriteria?.length || 0;
    const frCount = requirements.functionalRequirements?.length || 0;
    if (acCount >= frCount * 0.8) {
      this.learnPattern({
        name: 'good-acceptance-coverage',
        category: 'requirement-completeness',
        description: `Good coverage: ${acCount} ACs for ${frCount} FRs`,
        successRate: 0.85,
      });
    }

    // Pattern 3: Metadata completeness
    const metadataKeys = Object.keys(requirements.metadata).length;
    if (metadataKeys >= 8) {
      this.learnPattern({
        name: 'complete-metadata',
        category: 'requirement-structure',
        description: `Complete metadata with ${metadataKeys} fields`,
        successRate: 0.8,
      });
    }
  }

  /**
   * Generate a summary for downstream agents.
   */
  generateFunctionalSummary() {
    if (!this.requirements) {
      throw new Error('Requirements not parsed yet. Call execute() first.');
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
   * Extract list items after a keyword.
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
   * Save functional summary.
   */
  saveFunctionalSummary(outputPath) {
    const summary = this.generateFunctionalSummary();
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    this._log(`✓ Functional summary saved to ${outputPath}`);
    return summary;
  }
}

export default FunctionalRequirementsAgent;
