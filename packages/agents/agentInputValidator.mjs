/**
 * Agent Input Validator
 * 
 * CRITICAL: Ensures agents ONLY work with:
 * 1. Input data from previous agent
 * 2. Knowledge base patterns
 * 3. NO manual interventions or external data
 * 
 * If critical data is missing:
 * - Agent throws error with detailed feedback
 * - Error suggests improvements to PREVIOUS agent or REQUIREMENT TEMPLATE
 * - No agent code changes, no manual fixes
 */

export class AgentInputValidator {
  /**
   * Validates that a requirement has all critical fields for downstream agents.
   * 
   * @param {Object} requirement - Extracted requirement from FunctionalRequirementsAgent
   * @param {String} agentName - Which agent will consume this (for targeted feedback)
   * @throws {Error} With detailed feedback if critical fields missing
   */
  static validateRequirementForAgent(requirement, agentName) {
    const validation = {
      isValid: true,
      missingFields: [],
      warnings: [],
      feedback: '',
    };

    // Critical fields for ALL agents
    if (!requirement.metadata?.name) {
      validation.missingFields.push('metadata.name');
      validation.isValid = false;
    }

    // Agent-specific validations
    switch (agentName) {
      case 'FunctionalRequirementsAgent':
        // This is first; just validate basic structure
        if (!requirement.userStory?.trim()) {
          validation.warnings.push(
            'userStory is empty - TechnicalRequirementsAgent will have less context'
          );
        }
        if (!requirement.functionalRequirements?.length) {
          validation.missingFields.push('functionalRequirements');
          validation.isValid = false;
        }
        if (!requirement.acceptanceCriteria?.length) {
          validation.warnings.push(
            'acceptanceCriteria is empty - TestAgent will struggle to define test cases'
          );
        }
        break;

      case 'TechnicalRequirementsAgent':
        // Input: functionalSummary from FunctionalRequirementsAgent
        if (!requirement.functionalRequirements?.length) {
          validation.missingFields.push('functionalRequirements (from FunctionalRequirementsAgent)');
          validation.isValid = false;
        }
        if (!requirement.userStory?.trim()) {
          validation.missingFields.push('userStory');
          validation.isValid = false;
        }
        break;

      case 'TestAgent':
        // Input: technical spec from TechnicalRequirementsAgent
        if (!requirement.apis?.length && !requirement.components?.length) {
          validation.warnings.push(
            'No APIs or components defined - TestAgent will generate generic test structure'
          );
        }
        if (!requirement.acceptanceCriteria?.length) {
          validation.warnings.push(
            'No acceptance criteria - tests will be less targeted'
          );
        }
        break;

      case 'ImplementationAgent':
        // Input: technical spec + test spec
        if (!requirement.apis?.length && !requirement.components?.length) {
          validation.missingFields.push(
            'APIs or components (from TechnicalRequirementsAgent)'
          );
          validation.isValid = false;
        }
        if (!requirement.testCases?.length) {
          validation.warnings.push(
            'No test cases - ImplementationAgent will generate code without test guidance'
          );
        }
        break;

      case 'ReviewAgent':
        // Input: implementation + tests + documentation
        if (!requirement.implementation?.code) {
          validation.missingFields.push('implementation.code');
          validation.isValid = false;
        }
        if (!requirement.testResults?.passed) {
          validation.warnings.push(
            'Tests not yet passing - ReviewAgent will flag these issues'
          );
        }
        break;

      case 'DocumentationAgent':
        // Input: all previous agent outputs
        if (!requirement.functionalRequirements?.length) {
          validation.warnings.push(
            'No functional requirements - documentation will be generic'
          );
        }
        if (!requirement.implementation?.code) {
          validation.warnings.push(
            'No implementation code - documentation cannot show code examples'
          );
        }
        break;
    }

    return validation;
  }

  /**
   * Validates that agent output has correct structure.
   * Each agent must output specific data for downstream agents.
   */
  static validateAgentOutput(output, agentName) {
    const validation = {
      isValid: true,
      missingFields: [],
      feedback: '',
    };

    switch (agentName) {
      case 'FunctionalRequirementsAgent':
        // Must provide this for TechnicalRequirementsAgent
        if (!output.functionalRequirements?.length) {
          validation.missingFields.push('functionalRequirements');
          validation.isValid = false;
          validation.feedback =
            'FunctionalRequirementsAgent MUST extract at least one functional requirement. ' +
            'Fix: Improve requirement template to include "## 4. Funktionale Anforderungen" section';
        }
        if (!output.metadata?.name) {
          validation.missingFields.push('metadata.name');
          validation.isValid = false;
        }
        break;

      case 'TechnicalRequirementsAgent':
        // Must provide this for TestAgent + ImplementationAgent
        if (!output.apis?.length && !output.components?.length) {
          validation.missingFields.push('apis or components');
          validation.isValid = false;
          validation.feedback =
            'TechnicalRequirementsAgent MUST generate API/component specifications. ' +
            'Fix: Improve FunctionalRequirementsAgent to extract more detail from "## 5. Schnittstellen" section';
        }
        break;

      case 'TestAgent':
        // Must provide this for ImplementationAgent + Review
        if (!output.testCases?.length) {
          validation.missingFields.push('testCases');
          validation.isValid = false;
          validation.feedback =
            'TestAgent MUST generate test cases. ' +
            'Fix: Ensure TechnicalRequirementsAgent provides clear acceptance criteria';
        }
        break;

      case 'ImplementationAgent':
        // Must provide this for Review + Documentation
        if (!output.code?.trim()) {
          validation.missingFields.push('code');
          validation.isValid = false;
          validation.feedback =
            'ImplementationAgent MUST generate code. ' +
            'Fix: Check TechnicalRequirementsAgent output for completeness';
        }
        break;

      case 'DocumentationAgent':
        // Must provide markdown documentation
        if (!output.markdown?.trim()) {
          validation.missingFields.push('markdown');
          validation.isValid = false;
          validation.feedback =
            'DocumentationAgent MUST generate markdown documentation. ' +
            'Fix: Ensure all previous agents provided complete output';
        }
        break;
    }

    return validation;
  }

  /**
   * Generates a detailed error report with actionable feedback.
   */
  static generateDetailedErrorReport(validation, agentName, inputSource = '') {
    let report = `\n${'='.repeat(70)}\n`;
    report += `ERROR: ${agentName} cannot proceed\n`;
    report += `${'='.repeat(70)}\n\n`;

    report += `Missing Fields:\n`;
    validation.missingFields.forEach((field) => {
      report += `  ❌ ${field}\n`;
    });

    if (validation.warnings.length > 0) {
      report += `\nWarnings:\n`;
      validation.warnings.forEach((warning) => {
        report += `  ⚠️  ${warning}\n`;
      });
    }

    report += `\nRoot Cause:\n`;
    if (inputSource) {
      report += `  Input source: ${inputSource}\n`;
    }
    report += `  The required data was not provided by the previous agent.\n`;
    report += `  OR the requirement template is missing this information.\n`;

    report += `\nFIX (No Manual Intervention):\n`;
    report += `  1. Check output of PREVIOUS agent (not this agent)\n`;
    report += `  2. If previous agent output is incomplete:\n`;
    report += `     → Improve the REQUIREMENT TEMPLATE to include missing sections\n`;
    report += `     → Update FunctionalRequirementsAgent to extract that section\n`;
    report += `  3. Re-run the entire workflow\n`;

    if (validation.feedback) {
      report += `\nDetailed Feedback:\n  ${validation.feedback}\n`;
    }

    report += `\n${'='.repeat(70)}\n`;

    return report;
  }

  /**
   * Assert that required fields exist, throw with helpful error if not.
   */
  static assertFieldsExist(obj, requiredFields, context = '') {
    const missing = [];

    requiredFields.forEach((field) => {
      // Handle nested fields like "requirement.metadata.name"
      const parts = field.split('.');
      let current = obj;

      for (const part of parts) {
        if (current?.[part] === undefined || current?.[part] === null) {
          missing.push(field);
          break;
        }
        current = current[part];
      }
    });

    if (missing.length > 0) {
      const error = new Error(
        `Missing required fields: ${missing.join(', ')}\nContext: ${context}`
      );
      error.missingFields = missing;
      error.context = context;
      throw error;
    }
  }

  /**
   * Check that data from previous agent exists and has substance.
   */
  static validatePreviousAgentOutput(agentOutput, previousAgentName, expectedFields) {
    if (!agentOutput) {
      throw new Error(
        `${previousAgentName} output is empty or undefined. ` +
          `Fix: Ensure ${previousAgentName} executed successfully.`
      );
    }

    const missing = [];
    expectedFields.forEach((field) => {
      const parts = field.split('.');
      let current = agentOutput;

      for (const part of parts) {
        current = current?.[part];
      }

      if (!current || (Array.isArray(current) && current.length === 0)) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      throw new Error(
        `${previousAgentName} output missing critical fields: ${missing.join(', ')}\n` +
          `This means either:\n` +
          `1. Input requirement was incomplete (fix template)\n` +
          `2. ${previousAgentName} logic needs improvement\n` +
          `3. Requirements need more detail in relevant section\n`
      );
    }
  }
}

export default AgentInputValidator;
