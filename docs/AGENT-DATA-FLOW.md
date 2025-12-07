# Agent Data Flow & Isolation Rules

## 🎯 Critical Principle

**Each agent ONLY receives:**
1. ✅ Output from PREVIOUS agent
2. ✅ Patterns from own Knowledge Base
3. ❌ NO manual data
4. ❌ NO external info
5. ❌ NO framework code interventions

## 📊 Data Flow Chain

```
1. REQUIREMENT.MD
   ↓
   [FunctionalRequirementsAgent]
   Input: requirement.md
   Output: functional-summary.json
   ↓
2. FUNCTIONAL-SUMMARY.JSON
   ↓
   [TechnicalRequirementsAgent]
   Input: functional-summary.json
   Output: technical-specification.json
   ↓
3. TECHNICAL-SPECIFICATION.JSON
   ↓
   [TestAgent]
   Input: technical-specification.json
   Output: test-specification.json
   ↓
4. TECHNICAL-SPEC + TEST-SPEC
   ↓
   [ImplementationAgent]
   Input: technical-specification.json + test-specification.json
   Output: generated-code/ (iterative with TestAgent)
   ↓
5. IMPLEMENTATION + TESTS
   ↓
   [ReviewAgent]
   Input: generated-code/ + test-results.json
   Output: review-feedback.md
   ↓
6. ALL ABOVE
   ↓
   [DocumentationAgent]
   Input: all above outputs
   Output: documentation.md + diagrams.puml
   ↓
7. COMPLETE
   ↓
   [Knowledge Base Updated]
   Patterns & strategies learned
```

## ⚠️ What to Do When Data is Missing

### ❌ WRONG:
```javascript
// Agent: "I need more info, let me add it manually"
const apis = requirement.apis || []; // ← BAD! Adding fallback
const components = requirement.components || { name: 'default' }; // ← BAD!

// Agent gets incomplete input, continues anyway
// Result: Garbage output, no learning, problem hidden
```

### ✅ CORRECT:
```javascript
// Agent validates input strictly
AgentInputValidator.validatePreviousAgentOutput(
  inputData,
  'TechnicalRequirementsAgent',
  ['apis', 'components', 'acceptanceCriteria']
);

// If validation fails:
// → Agent throws error with detailed feedback
// → Error tells WHERE to fix (requirement template or previous agent)
// → Developer fixes requirement or agent LOGIC (not this agent)
// → Workflow re-runs with complete data
```

## 🔧 How to Fix Missing Data

### Problem: TechnicalRequirementsAgent gets empty APIs

**Root Cause:** FunctionalRequirementsAgent didn't extract them

**Fix Path (NOT in ImplementationAgent or here):**

1. **Check Requirement Template**
   - Is "## 5. Schnittstellen / APIs" section present?
   - If NO: Add it to template
   - Result: Requirements writer includes API details

2. **Check FunctionalRequirementsAgent Logic**
   - Does it extract section "## 5. Schnittstellen"?
   - If NO: Add extraction logic
   - Result: APIs get passed downstream

3. **Test Again**
   - Run orchestrator with improved template/agent
   - APIs now extracted → TechnicalRequirementsAgent receives them

### Problem: ImplementationAgent gets vague components

**Root Cause:** TechnicalRequirementsAgent wasn't detailed enough

**Fix Path (NOT in ImplementationAgent):**

1. **Improve TechnicalRequirementsAgent Prompt**
   - Current prompt too generic?
   - Add better examples/guidance in prompt template
   - Result: TechnicalRequirementsAgent generates more detail

2. **Check Input Quality**
   - Did FunctionalRequirementsAgent extract enough?
   - If NO: improve FunctionalRequirementsAgent or template
   - If YES but TechnicalAgent still vague: improve TechnicalAgent prompt

3. **Test Again**
   - Run orchestrator with improved agent
   - Now ImplementationAgent gets detailed specs

## 📋 Requirements Template Evolution

As data flows through agents, we discover what's needed:

1. **First Run:** Agent reports missing data
   - "acceptanceCriteria is empty"
   - "APIs section not in requirement"

2. **Fix Template**
   - Add section: "## 8. Akzeptanzkriterien (testbar)"
   - Add section: "## 5. Schnittstellen / APIs"
   - Add guidance: "Be specific about endpoints, data structures"

3. **Update Agent**
   - Add extraction logic for new sections
   - Add validation for data quality

4. **Rerun**
   - More complete data flows through pipeline
   - Agents can do better work

5. **Repeat**
   - Each iteration discovers gaps
   - Template and agents improve together

## 🚨 Validation Points

### Each Agent Validates Input:

```javascript
// Agent receives output from previous agent
const input = await loadPreviousAgentOutput();

// Strict validation (not fallbacks)
AgentInputValidator.validatePreviousAgentOutput(
  input,
  'PreviousAgentName',
  [
    'functionalRequirements',
    'acceptanceCriteria',
    'userStory',
  ]
);

// If validation fails: Throw with helpful error
// Error guides developer to ROOT CAUSE

// Only if validation passes: Continue
const output = await processInput(input);
```

### Validation Error Example:

```
======================================================================
ERROR: TechnicalRequirementsAgent cannot proceed
======================================================================

Missing Fields:
  ❌ functionalRequirements
  ❌ acceptanceCriteria

Root Cause:
  Input source: functional-summary.json
  The required data was not provided by the previous agent.

FIX (No Manual Intervention):
  1. Check FunctionalRequirementsAgent output
  2. If incomplete:
     → Add "## 4. Funktionale Anforderungen" to requirement template
     → Improve FunctionalRequirementsAgent extraction logic
  3. Re-run orchestrator

======================================================================
```

## 💡 Knowledge Base Learning

Agents ALSO learn from patterns:

```javascript
// Load learned patterns (if any exist from previous runs)
this.loadKnowledgeBase();

// Get top patterns
const patterns = this.getRelevantPatterns({
  minSuccessRate: 0.7,
  topN: 5,
});

// Use in this execution
const prompt = this.buildFullPrompt('generic-prompt', {
  learnedPatterns: this.formatPatternsForPrompt(patterns),
});

// After execution: Learn what worked
this.learnPattern({
  name: 'api-design-detailed',
  category: 'technical-spec',
  description: 'Detailed API specs lead to 95% test pass rate',
  successRate: 0.95,
});
```

## 🎓 Summary: Strict Data Isolation

| What | Source | When |
|------|--------|------|
| **Agent Logic** | Agent code file | Always |
| **Requirement Context** | Previous agent output | Each run |
| **Patterns** | Knowledge base | Each run |
| **External Data** | ❌ NEVER | ❌ |
| **Manual Fixes** | ❌ NEVER | ❌ |
| **Hardcoded Content** | ❌ NEVER | ❌ |

**When data is missing:**
- ❌ Don't add fallbacks in this agent
- ❌ Don't intervene manually
- ✅ Throw clear error pointing to ROOT CAUSE
- ✅ Fix requirement template or previous agent LOGIC
- ✅ Re-run orchestrator

**Result:** System learns and improves instead of hiding problems.
