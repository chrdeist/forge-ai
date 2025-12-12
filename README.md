# Forge AI

**Framework for Optimized Recursive Generation & Evolution**

A self-learning AI agent system that automates and improves software development through continuous learning and adaptation.

## 🎯 What Forge AI Does

Transforms **requirements** → **production-ready containerized applications** in 10 automated phases:

```
Requirements.md
    ↓
Phase 1-2: Parse & Extract Functional Requirements
    ↓
Phase 3: Generate Technical Specifications
    ↓
Phase 4: Design Architecture
    ↓
Phase 5: Plan Tests
    ↓
Phase 6: Generate & Test Code
    ↓
Phase 7: Code Review
    ↓
Phase 8: Generate Documentation
    ↓
Phase 9: Learn & Persist Patterns
    ↓
Phase 10: Docker + K8s + CI/CD (NEW) ✅
    ↓
Production Ready 🚀
```

**Total time:** ~7.4 seconds | **All automated**

## 📚 Documentation

Complete documentation is available in the [docs/](./docs/) directory:

- **[Architecture](./docs/architecture/)** - Design principles and data flow
- **[Implementation](./docs/implementation/)** - Technical details and roadmap  
- **[Guides](./docs/guides/)** - How-to tutorials (coming soon)
- **[Reference](./docs/reference/)** - API documentation (coming soon)

**Quick links:**
- [RVD Implementation Status](./docs/implementation/01-rvd-implementation-status.md)
- [Refactoring Checklist](./docs/implementation/02-refactoring-checklist.md)
- [Agent Data Flow](./docs/architecture/01-agent-data-flow.md)

## 🧪 Test the Framework Immediately

### Option 1: Full Workflow (with Docker - Phase 10)

```bash
cd forge-ai
node projects/hello-world/sources/e2e-full.mjs --auto
```

Generiert Code → Tests lokal mit npm → Docker artifacts

### Option 2: Local Only (without Docker)

```bash
cd forge-ai
node projects/hello-world/sources/e2e-full.mjs --auto --local-only
```

Schneller Loop: Generiert Code → Tests lokal → DONE (kein Docker)

### Option 3: Original E2E (Schema-Only Test)

```bash
cd forge-ai
node projects/hello-world/sources/e2e.mjs --auto

# With verbose logging
LOG_LEVEL=VERBOSE node projects/hello-world/sources/e2e.mjs --auto
```

**Alle 3 Optionen sind schnell:**
- 🟢 Local Only: ~2 Sekunden (Code gen + npm test)
- 🟡 Full Workflow: ~7 Sekunden (+ Docker gen)
- 🔵 Schema Test: ~0.5 Sekunden (Workflow validation only)

**Output:**
- ✅ All 10 phases execute successfully
- ✅ Logs saved to `projects/hello-world/reports/`
- ✅ Execution report generated
- ✅ Docker artifacts ready for deployment
- ✅ Deployment readiness score calculated

## 📚 Documentation

- ✅ **[LOCAL-DEVELOPMENT-WORKFLOW.md](./docs/LOCAL-DEVELOPMENT-WORKFLOW.md)** - How to test generated code locally (npm test, no Docker needed)
- ✅ **10-Phase Workflow:** Complete development pipeline from requirements to deployment
- ✅ **Docker/K8s Ready:** Automatic containerization and orchestration configs (Phase 10)
- ✅ **Zero Hardcoding:** Generic agents work with any project through 3-part architecture
- ✅ **Data Isolation:** Strict validation between phases, fail-fast error handling
- ✅ **Complete Transparency:** Comprehensive logging, state tracking, execution reports
- ✅ **Self-Learning:** Patterns learned from successes, persisted to knowledge base
- ✅ **Interactive Demo Mode:** Step-by-step walkthrough for presentations
- ✅ **Production Validated:** E2E tests prove all systems work end-to-end

## 🚀 Quick Start (As a Framework User)

```bash
# 1. Clone the framework
git clone https://github.com/your-org/forge-ai.git my-project
cd my-project
npm install
npm run init

# 2. Create your project structure
cp -r PROJECT-TEMPLATE my-app
cd my-app

# 3. Write a requirement
cat > requirements/first-feature.md << 'EOF'
---
name: "my-feature"
priority: "high"
...
---
# Feature: My Awesome Feature
...
EOF

# 4. Let Forge AI work
cd ..
node packages/cli/forge.mjs execute --requirements=my-app/requirements/first-feature.md

# 5. Review the generated artifacts
cat forge-ai-work/<timestamp>/execution-report.md

# 6. Integrate code, share learnings
git add knowledge/
git push
```

## 📋 Framework Capabilities Checklist

### Development Phases (1-6)
- ✅ Parse requirements from markdown
- ✅ Extract functional requirements
- ✅ Generate technical specifications
- ✅ Design system architecture
- ✅ Plan comprehensive tests
- ✅ Generate working code with 100% test coverage

### Quality Phases (7-9)
- ✅ Automated code review
- ✅ Generate API documentation
- ✅ Create architecture diagrams
- ✅ Learn and persist patterns
- ✅ Calculate success metrics

### Deployment Phase (10) - NEW ✅
- ✅ Generate multi-stage Dockerfile
- ✅ Create docker-compose.yml (local dev)
- ✅ Generate Kubernetes manifests (production)
- ✅ Create systemd service unit (simple Linux)
- ✅ Generate CI/CD pipelines (GitHub Actions, GitLab CI)
- ✅ Create .env.template configuration
- ✅ Assess deployment readiness (validation gates)

### Framework Features
- ✅ End-to-end E2E test (10 phases in ~7.4 seconds)
- ✅ Interactive demo mode (step-by-step with pauses)
- ✅ Comprehensive logging (5 levels: VERBOSE to ERROR)
- ✅ Real-time state tracking with ASCII dashboard
- ✅ Detailed execution reports (markdown + JSON)
- ✅ Self-learning system (patterns, strategies, experiences)
- ✅ Strict data isolation (no fallbacks, clear errors)
- ✅ Non-interactive CLI ready for automation

## 📖 Documentation (Complete Guide)

### Getting Started
- **[docs/LOCAL-DEVELOPMENT-WORKFLOW.md](./docs/LOCAL-DEVELOPMENT-WORKFLOW.md)** - ⭐ **START HERE** - Test generated code locally without Docker
- **[docs/FULLSTACK-PROJECT-TEMPLATE.md](./docs/FULLSTACK-PROJECT-TEMPLATE.md)** - Example: React + Node.js fullstack app
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Framework Usage for Project Teams

### Architecture & Design
- **[docs/WORKFLOW-OVERVIEW.md](./docs/WORKFLOW-OVERVIEW.md)** - Complete 10-Phase Workflow Architecture
- **[docs/AGENT-ARCHITECTURE.md](./docs/AGENT-ARCHITECTURE.md)** - How Agents Work (3-Part Architecture)
- **[docs/AGENT-DATA-FLOW.md](./docs/AGENT-DATA-FLOW.md)** - Data Isolation & Validation
- **[docs/ORCHESTRATOR-VALIDATION.md](./docs/ORCHESTRATOR-VALIDATION.md)** - Agent Handoff Protocol

### Execution & Monitoring
- **[docs/LOGGING-AND-VISIBILITY.md](./docs/LOGGING-AND-VISIBILITY.md)** - Real-time Execution Tracking
- **[docs/INTERACTIVE-MODE.md](./docs/INTERACTIVE-MODE.md)** - Step-by-Step Demo Mode
- **[docs/E2E-VALIDATION-REPORT.md](./docs/E2E-VALIDATION-REPORT.md)** - E2E Test Results

### Deployment (Phase 10)
- **[docs/DEPLOY-AGENT.md](./docs/DEPLOY-AGENT.md)** - Container & Deployment Configuration
- **[docs/DEPLOY-AGENT-SUMMARY.md](./docs/DEPLOY-AGENT-SUMMARY.md)** - DeployAgent Implementation
- **[docs/PHASE-10-DEPLOYMENT.md](./docs/PHASE-10-DEPLOYMENT.md)** - Phase 10 Overview
- **[docs/PHASE-10-IMPLEMENTATION-SUMMARY.md](./docs/PHASE-10-IMPLEMENTATION-SUMMARY.md)** - Phase 10 Details

### Examples
- **[projects/hello-world/README.md](./projects/hello-world/README.md)** - ✅ Example Project & E2E Test
- **[projects/hello-world/DEMO-GUIDE.md](./projects/hello-world/DEMO-GUIDE.md)** - Step-by-Step Demo Script

## Creating New Projects

Use the `00_PROJECT_TEMPLATE` as a base:

```bash
# 1. Copy template
cp -r projects/00_PROJECT_TEMPLATE projects/my-new-project

# 2. Update requirements
echo "# My New Project Requirements" > projects/my-new-project/requirements/my-new-project-requirements.md

# 3. Run workflow with project parameter
node e2e-runner.mjs --project my-new-project --auto
```

Or directly run an E2E test from sources/:

```bash
node projects/my-new-project/sources/e2e.mjs --auto
```

## 🏗️ Architecture

### Framework Components (Shared, in `packages/`)

- **agents/** - Generic, reusable AI agents
  - `BaseAgent` - Abstract base class for all agents
  - `FunctionalRequirementsAgent` - Extracts functional specs
  - `TechnicalRequirementsAgent` - Generates technical specs
  - `TestAgent` - Defines tests
  - `ImplementationAgent` - Generates code (iteratively)
  - `DocumentationAgent` - Creates docs & diagrams

- **orchestrator/** - Software lifecycle orchestrator
  - 9-phase workflow: Parse → Functional → Technical → Arch → Tests → Implement → Review → Docs → Persist
  - `ReportGenerator` - Detailed markdown + JSON reports
  
- **cli/** - Command-line interface
  - `forge execute --requirements=...`
  - `forge dashboard`, `forge evolve` (coming soon)

- **core/** - Core modules (future)

### Knowledge Base (Shared, in `knowledge/`)

Every agent learns from execution:

```json
{
  "patterns": [
    {
      "name": "api-design",
      "category": "technical-design",
      "successRate": 0.85,
      "description": "Generated 3 clear API specs",
      "timestamp": "2025-12-07T10:00:00Z"
    }
  ],
  "strategies": [...]
}
```

**Updates flow back to framework → other teams benefit automatically.**

## 🎯 How It Works

```
your-requirement.md
       ↓
Forge AI (9 phases)
       ↓
Phase 1: Parse Requirements
Phase 2: Extract Functional Requirements
Phase 3: Generate Technical Specification
Phase 4: Architecture & Design
Phase 5: Test Generation
Phase 6: Implementation (iterative)
Phase 7: Code Review
Phase 8: Documentation (with PlantUML diagrams)
Phase 9: Persist Metrics & Learning
       ↓
forge-ai-work/<timestamp>/
├── execution-report.md          ← Detailed human-readable report
├── functional-summary.json
├── technical-specification.json
├── test-specification.json
├── feature-documentation.md
├── architecture.puml            ← PlantUML diagrams
├── sequence.puml
└── usecases.puml
       ↓
knowledge/ updated
       ↓
Next execution uses improved patterns
```

## 🧠 Learning System

Every execution teaches Forge AI:

1. **Successful patterns** → Stored in Knowledge Base
2. **Failed patterns** → Marked as unsuccessful
3. **Success rates** → Updated for each pattern
4. **Next execution** → Uses best patterns from experience

Example:
```
Run 1 (hello-world): API design pattern succeeds → 100%
Run 2 (new-feature): Uses that pattern → 85% success
Run 3 (another-app): Inherited pattern → 90% success
```

## 📋 Project Structure (As Team Member)

```
forge-ai/                        ← Framework (shared)
├── packages/                    ← Agent code (git synced)
├── knowledge/                   ← Learned patterns (git synced)
├── examples/                    ← Framework test cases

my-app/                          ← Your Project (local)
├── requirements/                ← Your feature specs
├── src/                         ← Generated + modified code
├── tests/                       ← Generated + modified tests
└── docs/                        ← Generated + modified docs
```

## 🔄 Workflow for Teams

### For each feature:

1. **Write Requirement** (template in `PROJECT-TEMPLATE/requirements/`)
2. **Run Forge AI** - generates everything
3. **Review & Adapt** - integrate with your project
4. **Share Learnings** - push to framework's knowledge base
5. **Next feature** - benefits from your improvements

### Share Knowledge with Team

```bash
git add knowledge/
git commit -m "Learn: pattern X from project Y"
git push
# Other teams automatically get these improvements
```

## 🛠️ Commands

```bash
# Execute a requirement (automatic mode)
node packages/cli/forge.mjs execute --requirements=path/to/requirement.md

# Execute with interactive step-by-step mode (perfect for demos!)
node packages/cli/forge.mjs execute --requirements=path/to/requirement.md --interactive

# Run interactive demo
node packages/orchestrator/demo-interactive.mjs --interactive

# View dashboard (future)
node packages/cli/forge.mjs dashboard

# Trigger evolution (future)
node packages/cli/forge.mjs evolve

# Initialize knowledge base (usually once)
npm run init
```

## 🎓 Agent Architecture (Key Concept)

Every agent has 3 parts:

1. **Generic Definition** - Reusable logic (in agent file)
2. **Requirement Context** - Input-specific data (injected at runtime)
3. **Knowledge Base** - Learned patterns (stored & reused)

This prevents hardcoding and enables true learning.

See [docs/AGENT-ARCHITECTURE.md](./docs/AGENT-ARCHITECTURE.md) for details.

## 📊 Examples

- **hello-world** - Minimal "print hello world" example
- **02-simple-cli** - Slightly more complex CLI tool
- Add your own in `examples/`

Run examples to validate the framework:
```bash
node packages/cli/forge.mjs execute --requirements=examples/01-hello-world/requirements.md
```

## 🤝 Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for team setup and contribution guidelines.

## 📈 Roadmap

- ✅ Core framework & orchestrator
- ✅ Agent architecture (3-part model)
- ✅ Knowledge base persistence
- ✅ Report generation (Markdown + PlantUML)
- 🔄 LLM integration (Claude/GPT for agents)
- 🔄 Feedback loops (test failures → learning)
- 🔄 Evolution engine (strategy ranking)
- 📋 Dashboard (metrics visualization)
- 📋 GitHub Actions CI/CD

## 📝 License

MIT
