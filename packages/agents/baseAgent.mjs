/**
 * BaseAgent - Abstract Base Class for all Forge AI Agents
 * 
 * Architecture:
 * 1. Generic Definition: Core agent logic (parsing, processing, validation)
 * 2. Requirement Context: Input-specific data (current requirement, parameters)
 * 3. Knowledge Base: Learned patterns from previous executions
 * 
 * This structure ensures agents are:
 * - Reusable across different requirements
 * - Lernfähig (improving from experience)
 * - Keine hardcoded Inhalte
 */

import fs from 'node:fs';
import path from 'node:path';

export class BaseAgent {
  constructor(loggerOrConfig = {}, tracker = null, agentName = null) {
    // Support both old style (config object) and new style (logger, tracker, agentName)
    let logger, config;
    
    if (loggerOrConfig && typeof loggerOrConfig === 'object' && loggerOrConfig.info && typeof loggerOrConfig.info === 'function') {
      // New style: logger passed as first argument
      logger = loggerOrConfig;
      config = tracker && typeof tracker === 'object' && !tracker.setCurrentPhase ? tracker : {};
    } else {
      // Old style: config object passed
      logger = null;
      config = loggerOrConfig || {};
    }

    this.logger = logger;
    this.tracker = tracker && typeof tracker === 'object' && tracker.setCurrentPhase ? tracker : null;
    this.agentName = agentName || this.constructor.name;
    this.projectRoot = config.projectRoot || process.cwd();
    this.knowledgeDir = config.knowledgeDir || path.join(this.projectRoot, 'knowledge');
    this.agentsDir = config.agentsDir || path.join(this.projectRoot, 'packages', 'agents');
    
    // Directories für diesen Agent
    this.agentBaseDir = path.join(this.agentsDir, this._getAgentDirName());
    this.promptsDir = path.join(this.agentBaseDir, 'prompts');
    this.knowledgeBaseFile = path.join(this.knowledgeDir, `${this._getAgentDirName()}-knowledge.json`);
    
    // Runtime context
    this.currentRequirement = null;
    this.currentContext = {};
    this.knowledgeBase = null;
    this.verbose = config.verbose !== false;
  }

  /**
   * Konvertiert Agent-Namen zu Verzeichnisnamen (z.B. TechnicalRequirementsAgent → technical-requirements-agent)
   */
  _getAgentDirName() {
    return this.agentName
      .replace(/Agent$/, '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }

  /**
   * Speichert das aktuelle Requirement-Context.
   */
  setRequirementContext(requirement) {
    this.currentRequirement = requirement;
    this.currentContext = {
      timestamp: new Date().toISOString(),
      requirement: requirement,
    };
    this._log(`Context set: ${this.agentName} processing "${requirement.name || 'unknown'}"`);
  }

  /**
   * Lädt die Knowledge Base für diesen Agent.
   */
  loadKnowledgeBase() {
    if (fs.existsSync(this.knowledgeBaseFile)) {
      const content = fs.readFileSync(this.knowledgeBaseFile, 'utf-8');
      this.knowledgeBase = JSON.parse(content);
      this._log(`✓ Knowledge base loaded (${this.knowledgeBase.patterns?.length || 0} patterns)`);
    } else {
      this.knowledgeBase = {
        version: '1.0',
        agentName: this.agentName,
        createdAt: new Date().toISOString(),
        patterns: [],
        strategies: [],
      };
      this._log(`ℹ️  No knowledge base found, initialized empty`);
    }

    return this.knowledgeBase;
  }

  /**
   * Lädt ein Prompt-Template basierend auf einem Key.
   * Sucht in: prompts/<key>.prompt.txt
   */
  loadPromptTemplate(promptKey) {
    const promptPath = path.join(this.promptsDir, `${promptKey}.prompt.txt`);

    if (!fs.existsSync(promptPath)) {
      this._log(`⚠️  Prompt template not found: ${promptKey}`);
      return null;
    }

    const prompt = fs.readFileSync(promptPath, 'utf-8');
    this._log(`✓ Prompt loaded: ${promptKey}`);
    return prompt;
  }

  /**
   * Injiziert Context-Variablen in ein Prompt-Template.
   * Ersetzt {{VARIABLE}} durch aktuelle Werte.
   */
  injectContext(promptTemplate, customVars = {}) {
    let prompt = promptTemplate;

    const vars = {
      AGENT_NAME: this.agentName,
      TIMESTAMP: new Date().toISOString(),
      ...this.currentContext,
      ...customVars,
    };

    // Requirement-spezifische Variablen
    if (this.currentRequirement) {
      vars.REQUIREMENT_NAME = this.currentRequirement.name || 'Unknown';
      vars.REQUIREMENT_DESCRIPTION = this.currentRequirement.description || '';
      vars.REQUIREMENT_PRIORITY = this.currentRequirement.priority || 'medium';
      vars.FUNCTIONAL_REQUIREMENTS = JSON.stringify(
        this.currentRequirement.functionalRequirements || [],
        null,
        2
      );
      vars.ACCEPTANCE_CRITERIA = JSON.stringify(
        this.currentRequirement.acceptanceCriteria || [],
        null,
        2
      );
    }

    // Ersetze alle {{VARIABLE}}
    Object.entries(vars).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replaceAll(placeholder, String(value));
    });

    return prompt;
  }

  /**
   * Sammelt relevante Patterns aus der Knowledge Base.
   * Filtered nach bestimmten Kriterien (z.B. ähnliche Requirements, erfolgreiche Patterns).
   */
  getRelevantPatterns(filterCriteria = {}) {
    if (!this.knowledgeBase || !this.knowledgeBase.patterns) {
      return [];
    }

    let relevant = [...this.knowledgeBase.patterns];

    // Filtere nach Erfolgs-Rate
    if (filterCriteria.minSuccessRate !== undefined) {
      relevant = relevant.filter(
        (p) => (p.successRate || 0) >= filterCriteria.minSuccessRate
      );
    }

    // Filtere nach Tags/Category
    if (filterCriteria.category) {
      relevant = relevant.filter((p) => p.category === filterCriteria.category);
    }

    // Sortiere nach neuesten zuerst
    relevant.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limite auf Top N
    if (filterCriteria.topN) {
      relevant = relevant.slice(0, filterCriteria.topN);
    }

    return relevant;
  }

  /**
   * Konvertiert gesammelte Patterns in einen Kontext-String für das Prompt.
   */
  formatPatternsForPrompt(patterns) {
    if (patterns.length === 0) {
      return '';
    }

    let patternText = '## Learned Patterns from Previous Executions\n\n';

    patterns.forEach((pattern, idx) => {
      patternText += `### Pattern ${idx + 1}: ${pattern.name}\n`;
      patternText += `- Category: ${pattern.category}\n`;
      patternText += `- Success Rate: ${(pattern.successRate * 100).toFixed(1)}%\n`;
      patternText += `- Description: ${pattern.description}\n`;
      if (pattern.example) {
        patternText += `- Example: \`${pattern.example}\`\n`;
      }
      patternText += '\n';
    });

    return patternText;
  }

  /**
   * Erstellt einen vollständigen Prompt mit:
   * 1. Generic prompt template
   * 2. Requirement-specific context
   * 3. Knowledge base patterns
   */
  buildFullPrompt(promptKey, customVars = {}) {
    const basePrompt = this.loadPromptTemplate(promptKey);
    if (!basePrompt) {
      throw new Error(`Cannot build prompt: template "${promptKey}" not found`);
    }

    // Injiziere Requirement Context
    let fullPrompt = this.injectContext(basePrompt, customVars);

    // Füge Patterns aus Knowledge Base hinzu (wenn vorhanden)
    const patterns = this.getRelevantPatterns({
      minSuccessRate: 0.7,
      topN: 5,
    });

    if (patterns.length > 0) {
      const patternText = this.formatPatternsForPrompt(patterns);
      fullPrompt += '\n\n' + patternText;
    }

    return fullPrompt;
  }

  /**
   * Speichert ein neu gelernte Pattern in der Knowledge Base.
   */
  learnPattern(pattern) {
    if (!this.knowledgeBase) {
      this.loadKnowledgeBase();
    }

    const fullPattern = {
      id: `pattern_${Date.now()}`,
      timestamp: new Date().toISOString(),
      requirementName: this.currentRequirement?.name || 'unknown',
      ...pattern,
    };

    this.knowledgeBase.patterns.push(fullPattern);
    this._persistKnowledgeBase();

    this._log(`✓ Pattern learned: ${pattern.name}`);
    return fullPattern;
  }

  /**
   * Speichert eine neue Strategie in der Knowledge Base.
   * Strategien sind wiederkehrende Ansätze/Prompts, die funktionieren.
   */
  registerStrategy(strategy) {
    if (!this.knowledgeBase) {
      this.loadKnowledgeBase();
    }

    const fullStrategy = {
      id: `strategy_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...strategy,
    };

    this.knowledgeBase.strategies.push(fullStrategy);
    this._persistKnowledgeBase();

    this._log(`✓ Strategy registered: ${strategy.name}`);
    return fullStrategy;
  }

  /**
   * Aktualisiert die Success-Rate eines Patterns.
   */
  updatePatternSuccessRate(patternId, successful) {
    if (!this.knowledgeBase) {
      this.loadKnowledgeBase();
    }

    const pattern = this.knowledgeBase.patterns.find((p) => p.id === patternId);
    if (!pattern) {
      this._log(`⚠️  Pattern not found: ${patternId}`);
      return;
    }

    pattern.executionCount = (pattern.executionCount || 0) + 1;
    pattern.successCount = (pattern.successCount || 0) + (successful ? 1 : 0);
    pattern.successRate = pattern.successCount / pattern.executionCount;

    this._persistKnowledgeBase();

    this._log(`✓ Pattern success rate updated: ${pattern.name} (${(pattern.successRate * 100).toFixed(1)}%)`);
  }

  /**
   * Speichert Knowledge Base persistent.
   */
  _persistKnowledgeBase() {
    if (!this.knowledgeBase) {
      return;
    }

    if (!fs.existsSync(this.knowledgeDir)) {
      fs.mkdirSync(this.knowledgeDir, { recursive: true });
    }

    fs.writeFileSync(this.knowledgeBaseFile, JSON.stringify(this.knowledgeBase, null, 2));
  }

  /**
   * Logging (kann über-written werden für custom logging).
   */
  _log(message) {
    if (this.verbose) {
      console.log(`[${this.agentName}] ${message}`);
    }
  }

  /**
   * CRITICAL: Asserts that required input fields exist.
   * If missing, throws error with guidance on ROOT CAUSE.
   * 
   * Use this in execute() BEFORE processing:
   * 
   *   this.assertRequiredInputFields([
   *     'functionalRequirements',
   *     'acceptanceCriteria',
   *   ]);
   */
  assertRequiredInputFields(requiredFields) {
    const missing = [];

    requiredFields.forEach((field) => {
      const parts = field.split('.');
      let current = this.currentContext;

      for (const part of parts) {
        current = current?.[part];
      }

      // Check if field exists and has substance
      if (
        current === undefined ||
        current === null ||
        current === '' ||
        (Array.isArray(current) && current.length === 0)
      ) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      const error = new Error(
        `${this.agentName} missing required input fields: ${missing.join(', ')}\n\n` +
          `This means required data was not provided by the PREVIOUS agent.\n` +
          `Fix options (NOT in this agent code):\n` +
          `1. Check if requirement template is missing sections\n` +
          `2. Check if previous agent extracts/generates those fields\n` +
          `3. If missing in template: add new section\n` +
          `4. If missing in agent: improve agent's extraction logic\n` +
          `5. Re-run workflow with improved template/agent\n\n` +
          `DO NOT add fallbacks, defaults, or manual fixes in this agent.`
      );
      error.missingFields = missing;
      error.agentName = this.agentName;
      throw error;
    }
  }

  /**
   * Zu implementieren von subclasses.
   */
  async execute() {
    throw new Error('execute() must be implemented by subclass');
  }
}

export default BaseAgent;
