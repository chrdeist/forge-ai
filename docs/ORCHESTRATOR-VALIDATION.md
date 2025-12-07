# Orchestrator Agent Handoff Protocol

## Overview

The SoftwareLifecycleOrchestrator is responsible for:
1. ✅ Running agents in correct sequence
2. ✅ Validating agent outputs before next agent consumes
3. ✅ Throwing clear errors if data is incomplete
4. ✅ NO manual interventions or fixes

## Agent Handoff Rules

### Rule 1: Validate Output Before Passing

```javascript
// After each agent executes:
const output = await agent.execute(input);

// IMMEDIATELY validate before next agent
const validation = AgentInputValidator.validateAgentOutput(
  output,
  agent.constructor.name
);

if (!validation.isValid) {
  const report = AgentInputValidator.generateDetailedErrorReport(
    validation,
    agent.constructor.name,
    'previous agent output'
  );
  throw new Error(report);
}

// Only if validation passes: save and continue
this.saveOutput(agent.constructor.name, output);
```

### Rule 2: Validate Input Before Consuming

```javascript
// Before each agent executes:
const validation = AgentInputValidator.validateRequirementForAgent(
  requirement,
  nextAgent.constructor.name
);

if (!validation.isValid) {
  const report = AgentInputValidator.generateDetailedErrorReport(
    validation,
    nextAgent.constructor.name,
    'previous agent output or requirement template'
  );
  throw new Error(report);
}

// Only if validation passes: execute
const output = await nextAgent.execute(requirement);
```

### Rule 3: Never Skip Validation

```javascript
// ❌ WRONG:
try {
  const output = await agent.execute(input);
  // Continue even if output is bad
} catch (error) {
  // Catch and continue - BAD!
}

// ✅ CORRECT:
const output = await agent.execute(input);
// Validate
const validation = AgentInputValidator.validateAgentOutput(output, agentName);
if (!validation.isValid) throw new Error(...);
// Only then continue
```

### Rule 4: No Downstream Agent Fixes Input

```javascript
// ❌ In ImplementationAgent:
if (!requirement.apis) {
  // Don't add fallback APIs
  requirement.apis = [{ name: 'default' }];
}

// ✅ In ImplementationAgent:
// If APIs missing, assert fails and throws helpful error
this.assertRequiredInputFields(['apis']);
// This error tells developer to fix TechnicalRequirementsAgent or template
```

## Error Handling Flow

```
Agent Executes
    ↓
Output Validation Fails
    ↓
AgentInputValidator.generateDetailedErrorReport()
    ↓
Error shows:
  - What's missing
  - Root cause analysis
  - Where to fix (template? previous agent?)
  - Steps to resolve
    ↓
Developer fixes ROOT CAUSE
  (template + agent logic, not this agent)
    ↓
Orchestrator re-runs workflow
```

## Example: Complete Handoff

```javascript
// ============================================
// Phase 2: Functional Requirements Agent
// ============================================

// Input: requirement.md
const functionalReq = new FunctionalRequirementsAgent();
functionalReq.setRequirementContext(parsedRequirement);

// Execute
const functionalOutput = await functionalReq.execute(requirementPath);

// Validate output BEFORE passing to next agent
let validation = AgentInputValidator.validateAgentOutput(
  functionalOutput,
  'FunctionalRequirementsAgent'
);
if (!validation.isValid) {
  throw new Error(
    AgentInputValidator.generateDetailedErrorReport(
      validation,
      'FunctionalRequirementsAgent'
    )
  );
}

// Save for reporting
this.executionLog.functionalSummary = functionalOutput;

// ============================================
// Phase 3: Technical Requirements Agent
// ============================================

// Validate input for next agent
const requirement3 = {
  ...parsedRequirement,
  ...functionalOutput,
};

validation = AgentInputValidator.validateRequirementForAgent(
  requirement3,
  'TechnicalRequirementsAgent'
);
if (!validation.isValid) {
  throw new Error(
    AgentInputValidator.generateDetailedErrorReport(
      validation,
      'TechnicalRequirementsAgent',
      'FunctionalRequirementsAgent output'
    )
  );
}

// Only then execute
const technicalReq = new TechnicalRequirementsAgent();
technicalReq.setRequirementContext(requirement3);
const technicalOutput = await technicalReq.execute(functionalOutput);

// Validate output BEFORE passing to next agent
validation = AgentInputValidator.validateAgentOutput(
  technicalOutput,
  'TechnicalRequirementsAgent'
);
if (!validation.isValid) {
  throw new Error(
    AgentInputValidator.generateDetailedErrorReport(
      validation,
      'TechnicalRequirementsAgent'
    )
  );
}

// Save for reporting
this.executionLog.technicalSpecification = technicalOutput;

// ... continue for each phase ...
```

## Validation Points in Orchestrator

```
Phase 1: Parse Requirement
  ↓ [no validation needed, just parsing]

Phase 2: FunctionalRequirementsAgent
  ↓ VALIDATE OUTPUT
  - functionalRequirements[]
  - acceptanceCriteria[]
  - userStory
  ↓ [if validation fails: throw with root cause]

Phase 3: TechnicalRequirementsAgent
  ↓ VALIDATE INPUT (from phase 2)
  ↓ VALIDATE OUTPUT
  - apis[] or components[]
  - dataStructures[]
  - constraints
  ↓ [if validation fails: throw with root cause]

Phase 4: ArchitectureAgent
  ↓ VALIDATE INPUT (from phase 3)
  ↓ VALIDATE OUTPUT
  - architecture{}
  - designDecisions[]
  ↓ [if validation fails: throw with root cause]

Phase 5: TestAgent
  ↓ VALIDATE INPUT (from phases 3+4)
  ↓ VALIDATE OUTPUT
  - testCases[]
  - testStrategy
  ↓ [if validation fails: throw with root cause]

Phase 6: ImplementationAgent ↔ TestAgent Loop
  ↓ VALIDATE INPUT (from phases 3, 4, 5)
  ↓ [iterative]
  ↓ VALIDATE OUTPUT
  - code
  - artifacts[]
  ↓ [if validation fails: throw with root cause]

Phase 7: ReviewAgent
  ↓ VALIDATE INPUT (from all phases)
  ↓ VALIDATE OUTPUT
  - reviewFeedback
  - issues[]
  ↓ [if validation fails: throw with root cause]

Phase 8: DocumentationAgent
  ↓ VALIDATE INPUT (from all phases)
  ↓ VALIDATE OUTPUT
  - documentation
  - diagrams[]
  ↓ [if validation fails: throw with root cause]

Phase 9: Persist Learning
  ↓ [extract patterns, update knowledge base]
```

## Implementing Validation in Orchestrator

```javascript
import AgentInputValidator from './agentInputValidator.mjs';

class SoftwareLifecycleOrchestrator {
  async executeWorkflow(requirementsFile) {
    // ... setup ...

    // Phase 2
    const functionalAgent = new FunctionalRequirementsAgent();
    const functionalOutput = await functionalAgent.execute(requirementsFile);
    
    this._validateOrThrow(
      functionalOutput,
      'FunctionalRequirementsAgent',
      ['functionalRequirements', 'acceptanceCriteria']
    );

    // Phase 3
    this._validateOrThrow(
      requirement,
      'TechnicalRequirementsAgent',
      ['functionalRequirements', 'userStory', 'acceptanceCriteria']
    );
    
    const technicalAgent = new TechnicalRequirementsAgent();
    const technicalOutput = await technicalAgent.execute(functionalOutput);
    
    this._validateOrThrow(
      technicalOutput,
      'TechnicalRequirementsAgent',
      ['apis', 'dataStructures']
    );

    // ... continue ...
  }

  _validateOrThrow(data, agentName, requiredFields) {
    const missing = [];
    requiredFields.forEach((field) => {
      const value = this._getNestedValue(data, field);
      if (!value || (Array.isArray(value) && value.length === 0)) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      const report =
        `${agentName} output missing: ${missing.join(', ')}\n` +
        `This indicates:\n` +
        `1. Requirement template missing sections\n` +
        `2. Previous agent not extracting/generating fields\n` +
        `Fix: Improve template or previous agent logic, then re-run`;
      throw new Error(report);
    }
  }

  _getNestedValue(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      current = current?.[part];
    }
    return current;
  }
}
```

## Summary

**The orchestrator ensures:**
- ✅ Agents receive complete, validated input
- ✅ Agent output is validated before downstream use
- ✅ Errors point to ROOT CAUSE (template or previous agent)
- ✅ NO manual interventions
- ✅ Workflow can only continue with valid data

**When data is missing:**
- Agent throws clear error
- Error guides to FIX LOCATION
- Developer improves template or agent LOGIC
- Workflow re-runs with complete data

**Result:** Closed feedback loop for continuous improvement.
