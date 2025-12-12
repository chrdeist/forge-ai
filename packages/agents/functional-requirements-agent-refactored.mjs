/**
 * Functional Requirements Agent (Generic, RVD-based)
 * 
 * Purpose:
 * - Parses requirement markdown files generically
 * - Extracts structured functional data
 * - Writes results to RVD file (functional section)
 * 
 * Input: requirements.md file path
 * Output: RVD file with functional-section populated
 * 
 * No hardcoded content - fully generic implementation
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';
import { RVDManager } from './rvd-manager.mjs';

export class FunctionalRequirementsAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.rvdManager = new RVDManager(config);
  }

  /**
   * Main execute method - generic interface
   * @param {string} requirementsFilePath - Path to requirements markdown
   * @param {string} rvdFilePath - Path to RVD file (will create if not exists)
   */
  async execute(requirementsFilePath, rvdFilePath) {
    if (!fs.existsSync(requirementsFilePath)) {
      throw new Error(`Requirements file not found: ${requirementsFilePath}`);
    }

    this._log(`📖 Parsing requirements: ${path.basename(requirementsFilePath)}`);

    // Load knowledge base for learning
    this.loadKnowledgeBase();

    // Read requirements markdown
    const content = fs.readFileSync(requirementsFilePath, 'utf-8');
    const projectName = this._extractProjectName(content);

    // Set generic context
    this.setRequirementContext({
      name: projectName,
      filePath: requirementsFilePath,
    });

    // Extract functional requirements generically
    const functionalData = this._parseRequirementsGeneric(content);

    // Initialize or load RVD file
    const rvd = await this.rvdManager.loadOrCreate(rvdFilePath, projectName);

    // Write to functional section
    rvd.functional = {
      timestamp: new Date().toISOString(),
      sourceFile: requirementsFilePath,
      extractedBy: 'FunctionalRequirementsAgent',
      data: functionalData,
    };

    // Save RVD file
    await this.rvdManager.save(rvdFilePath, rvd);
    this._log(`✓ Wrote functional section to RVD`);

    // Learn patterns from this execution
    this._learnFromExecution(functionalData);

    return {
      success: true,
      projectName,
      rvdPath: rvdFilePath,
      functionalData,
    };
  }

  /**
   * Generic markdown parsing - works with any requirements file
   * Extracts common sections without hardcoding structure
   */
  _parseRequirementsGeneric(content) {
    // Split by markdown headings
    const sections = this._splitByHeadings(content);
    
    // Extract YAML metadata
    const metadata = this._extractYAMLMetadata(content);

    // Build generic structure
    const result = {
      metadata,
      sections: {},
      requirements: [],
    };

    // Extract requirements from various section formats
    const requirementPatterns = [
      { prefix: '- [ ]', type: 'checkbox' },  // Checkbox lists
      { prefix: '- ', type: 'bullet' },       // Bullet lists
    ];

    // Scan for requirement items (typically checkboxes or bullets)
    const lines = content.split('\n');
    let currentSection = 'general';

    lines.forEach((line) => {
      // Detect section headers
      if (line.match(/^##+ /)) {
        currentSection = line.replace(/^#+\s+/, '').toLowerCase();
        result.sections[currentSection] = [];
      }

      // Detect requirement items
      requirementPatterns.forEach((pattern) => {
        if (line.includes(pattern.prefix)) {
          const text = line.replace(pattern.prefix, '').trim();
          if (text.length > 0) {
            result.requirements.push({
              text,
              type: pattern.type,
              section: currentSection,
            });
          }
        }
      });
    });

    this._log(`  ✓ Extracted ${result.requirements.length} requirements`);

    return result;
  }

  /**
   * Split content by markdown headings
   */
  _splitByHeadings(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = 'preamble';
    let currentContent = [];

    lines.forEach((line) => {
      if (line.match(/^##+ /)) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
        }
        currentSection = line.replace(/^#+\s+/, '').toLowerCase();
        currentContent = [line];
      } else {
        currentContent.push(line);
      }
    });

    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }

    return sections;
  }

  /**
   * Extract YAML metadata from front matter
   */
  _extractYAMLMetadata(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const yaml = match[1];
    const metadata = {};

    yaml.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        metadata[key.trim()] = value.replace(/^"(.*)"$/, '$1');
      }
    });

    return metadata;
  }

  /**
   * Extract project name from content
   */
  _extractProjectName(content) {
    const yamlMatch = content.match(/^---\n[\s\S]*?name:\s*"([^"]+)"/m);
    if (yamlMatch) return yamlMatch[1];

    const headingMatch = content.match(/^#\s+(.+?)$/m);
    if (headingMatch) return headingMatch[1];

    return 'unknown-project';
  }

  /**
   * Learn patterns from extraction
   */
  _learnFromExecution(data) {
    const requirementCount = data.requirements?.length || 0;

    if (requirementCount > 0) {
      this.learnPattern({
        name: 'functional-requirements-extraction',
        category: 'generic-pattern',
        description: `Successfully extracted ${requirementCount} functional requirements`,
        successRate: 0.9,
      });
    }
  }
}

export default FunctionalRequirementsAgent;
