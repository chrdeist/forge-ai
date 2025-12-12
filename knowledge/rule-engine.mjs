/**
 * Forge AI Rule Engine
 * Evaluates WHEN-THEN rules and executes actions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class RuleEngine {
  constructor(knowledgeBasePath = './knowledge') {
    this.knowledgeBasePath = knowledgeBasePath;
    this.rules = {
      codeGeneration: [],
      validation: [],
      errorResolution: [],
    };
    this.loadRules();
  }

  /**
   * Load all rule files from knowledge/rules/
   */
  loadRules() {
    const rulesDir = path.join(this.knowledgeBasePath, 'rules');
    
    try {
      // Load code generation rules
      const codeGenRules = JSON.parse(
        fs.readFileSync(path.join(rulesDir, 'code-generation-rules.json'), 'utf8')
      );
      this.rules.codeGeneration = codeGenRules.rules.filter(r => r.enabled);

      // Load validation rules
      const validationRules = JSON.parse(
        fs.readFileSync(path.join(rulesDir, 'validation-rules.json'), 'utf8')
      );
      this.rules.validation = validationRules.rules.filter(r => r.enabled);

      // Load error resolution rules
      const errorRules = JSON.parse(
        fs.readFileSync(path.join(rulesDir, 'error-resolution-rules.json'), 'utf8')
      );
      this.rules.errorResolution = errorRules.rules.filter(r => r.enabled);

      console.log(`[RuleEngine] Loaded ${this.getTotalRulesCount()} rules`);
    } catch (error) {
      console.error('[RuleEngine] Failed to load rules:', error.message);
    }
  }

  getTotalRulesCount() {
    return this.rules.codeGeneration.length + 
           this.rules.validation.length + 
           this.rules.errorResolution.length;
  }

  /**
   * Get rules applicable to a specific phase
   */
  getRulesForPhase(phase, category = null) {
    let allRules = [
      ...this.rules.codeGeneration,
      ...this.rules.validation,
      ...this.rules.errorResolution,
    ];

    // Filter by phase
    allRules = allRules.filter(rule => 
      rule.phase && rule.phase.includes(phase)
    );

    // Filter by category if specified
    if (category) {
      allRules = allRules.filter(rule => rule.category === category);
    }

    return allRules.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Evaluate a rule condition against context
   */
  evaluateCondition(rule, context) {
    const { condition } = rule;
    
    switch (condition.type) {
      case 'always':
        return true;

      case 'file-exists':
        return fs.existsSync(path.join(context.projectPath || '.', condition.check.file));

      case 'package-config':
        return this.checkPackageConfig(context, condition.check);

      case 'file-contains':
        return this.checkFileContains(context, condition.check);

      case 'context-match':
        return this.checkContextMatch(context, condition.check);

      case 'custom':
        // For error resolution - check if error pattern matches
        if (context.error) {
          const pattern = new RegExp(condition.check.pattern, 'i');
          return pattern.test(context.error);
        }
        return false;

      default:
        console.warn(`[RuleEngine] Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Check package.json configuration
   */
  checkPackageConfig(context, check) {
    const pkgPath = path.join(context.projectPath || '.', 'package.json');
    
    if (!fs.existsSync(pkgPath)) {
      return false;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const fieldParts = check.field.split('.');
      let value = pkg;
      
      for (const part of fieldParts) {
        value = value?.[part];
      }

      // Handle negation (e.g., "!module")
      if (String(check.value).startsWith('!')) {
        const expectedValue = check.value.substring(1);
        return value !== expectedValue;
      }

      return value === check.value;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if file contains pattern
   */
  checkFileContains(context, check) {
    const filePath = path.join(context.projectPath || '.', check.file);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const pattern = new RegExp(check.pattern);
      return pattern.test(content);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if context matches rule requirements
   */
  checkContextMatch(context, check) {
    if (typeof check === 'string') {
      // Simple string match in context
      return JSON.stringify(context).toLowerCase().includes(check.toLowerCase());
    }
    
    // Pattern-based matching
    if (check.pattern) {
      const pattern = new RegExp(check.pattern, 'i');
      return pattern.test(JSON.stringify(context));
    }

    return false;
  }

  /**
   * Execute rule action
   */
  async executeAction(rule, context) {
    const { action } = rule;
    const results = {
      ruleId: rule.id,
      success: false,
      message: '',
      data: null,
    };

    try {
      switch (action.type) {
        case 'use-template':
          results.data = this.loadTemplate(action.template, context);
          results.success = true;
          results.message = `Template ${action.template} loaded`;
          break;

        case 'enforce-pattern':
          results.data = {
            enforce: action.enforce,
            forbidden: action.forbidden || [],
            required: action.required || [],
          };
          results.success = true;
          results.message = `Pattern enforcement: ${action.enforce}`;
          break;

        case 'run-validation':
          results.data = this.runValidation(action, context);
          results.success = results.data.exitCode === 0;
          results.message = results.success ? 'Validation passed' : 'Validation failed';
          break;

        case 'apply-fix':
          results.data = action.fix;
          results.success = true;
          results.message = `Fix pattern available: ${action.fix.search} → ${action.fix.replace}`;
          break;

        case 'abort-with-error':
          throw new Error(action.message || 'Rule triggered abort');

        default:
          results.message = `Unknown action type: ${action.type}`;
      }
    } catch (error) {
      results.success = false;
      results.message = error.message;
    }

    return results;
  }

  /**
   * Load template file
   */
  loadTemplate(templatePath, context) {
    const fullPath = path.join(this.knowledgeBasePath, templatePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    let template = fs.readFileSync(fullPath, 'utf8');

    // Replace placeholders with context values
    Object.keys(context).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(placeholder, context[key] || '');
    });

    return template;
  }

  /**
   * Run validation command
   */
  runValidation(action, context) {
    const cwd = context.projectPath || process.cwd();
    
    try {
      const output = execSync(action.command, {
        cwd,
        encoding: 'utf8',
        timeout: 30000, // 30s timeout
      });

      return {
        exitCode: 0,
        output,
      };
    } catch (error) {
      return {
        exitCode: error.status || 1,
        output: error.stdout || error.message,
        error: error.stderr || error.message,
      };
    }
  }

  /**
   * Apply applicable rules for a given phase and context
   */
  async applyRules(phase, context = {}) {
    const rules = this.getRulesForPhase(phase);
    const results = {
      phase,
      rulesChecked: 0,
      rulesApplied: 0,
      rulesFailed: 0,
      details: [],
    };

    for (const rule of rules) {
      results.rulesChecked++;

      if (this.evaluateCondition(rule, context)) {
        const actionResult = await this.executeAction(rule, context);
        
        results.details.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          ...actionResult,
        });

        if (actionResult.success) {
          results.rulesApplied++;
        } else {
          results.rulesFailed++;
        }
      }
    }

    return results;
  }

  /**
   * Get rule by ID
   */
  getRuleById(ruleId) {
    const allRules = [
      ...this.rules.codeGeneration,
      ...this.rules.validation,
      ...this.rules.errorResolution,
    ];

    return allRules.find(rule => rule.id === ruleId);
  }

  /**
   * Validate generated code using validation rules
   */
  async validateGeneratedCode(projectPath) {
    const context = { projectPath };
    return await this.applyRules('implementation', context);
  }

  /**
   * Suggest fix for an error
   */
  suggestFix(errorMessage, context = {}) {
    context.error = errorMessage;
    
    const errorRules = this.rules.errorResolution.filter(rule =>
      this.evaluateCondition(rule, context)
    );

    if (errorRules.length === 0) {
      return null;
    }

    // Return highest priority matching rule
    const rule = errorRules.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })[0];

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      fix: rule.action.fix,
      examples: rule.examples,
      message: `Suggested fix for: ${rule.name}`,
    };
  }
}

export default RuleEngine;
