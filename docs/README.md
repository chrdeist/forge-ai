# Forge AI Documentation

Complete documentation for the Forge AI Framework - A generic agent-based software lifecycle automation platform.

## 📚 Documentation Structure

### [Architecture](./architecture/)
High-level design and architectural decisions.

- **[01-agent-data-flow.md](./architecture/01-agent-data-flow.md)** - Agent interaction and data flow patterns
- **[02-generic-architecture.md](./architecture/02-generic-architecture.md)** - Generic architecture design principles

### [Implementation](./implementation/)
Technical implementation details and roadmap.

- **[01-rvd-implementation-status.md](./implementation/01-rvd-implementation-status.md)** - RVD (Requirement Versioning & Distribution) implementation status
- **[02-refactoring-checklist.md](./implementation/02-refactoring-checklist.md)** - Agent refactoring checklist
- **[03-summary.md](./implementation/03-summary.md)** - Project summary and milestones

### [Guides](./guides/)
How-to guides and tutorials (coming soon).

- Quickstart Guide
- Agent Development Guide
- RVD File Format Guide

### [Reference](./reference/)
API reference and technical specifications (coming soon).

- RVD Schema Reference
- Agent Interface Documentation
- CLI Command Reference

## 🚀 Quick Start

### Running the RVD Workflow Test

```bash
cd /workspaces/forge-ai
node test-rvd-workflow.mjs
```

This tests the complete workflow:
1. Parse requirements.md
2. Execute FunctionalRequirementsAgent → RVD.functional
3. Execute TechnicalRequirementsAgent → RVD.technical
4. Verify RVD file structure

### Key Files

| File | Purpose |
|------|---------|
| `packages/agents/rvd-manager.mjs` | RVD file operations |
| `packages/agents/functional-requirements-agent-refactored.mjs` | Parse requirements |
| `packages/agents/technical-requirements-agent-refactored.mjs` | Generate technical specs |
| `test-rvd-workflow.mjs` | Integration tests |
| `test-rvd-output.json` | RVD file example (86 KB) |

## 📊 Current Status

| Component | Status | Progress |
|-----------|--------|----------|
| RVDManager | ✅ Complete | 100% |
| FunctionalRequirementsAgent | ✅ Refactored | 100% |
| TechnicalRequirementsAgent | ✅ Refactored | 100% |
| ArchitectureAgent | 📋 Todo | 0% |
| TestAgent | 📋 Todo | 0% |
| ImplementationAgent | 📋 Todo | 0% |
| ReviewAgent | 📋 Todo | 0% |
| DocumentationAgent | 📋 Todo | 0% |
| DeploymentAgent | 📋 Todo | 0% |

**Overall Progress:** 25% (2 of 8 agents)

## 🎯 Architecture Principles

✅ **GENERIC** - No hardcoded project-specific code
✅ **DATA FLOW** - RVD as single source of truth
✅ **PIPELINE** - Sequential agent execution with dependencies
✅ **TRACEABILITY** - Full execution logging and metadata

## 📖 Reading Order

For new contributors:
1. Start with [Architecture Overview](./architecture/02-generic-architecture.md)
2. Understand [RVD Implementation](./implementation/01-rvd-implementation-status.md)
3. Check [Refactoring Checklist](./implementation/02-refactoring-checklist.md)
4. Run [tests locally](../test-rvd-workflow.mjs)

## 🔗 Related Resources

- **Main README:** [../README.md](../README.md)
- **Test Suite:** [../test-rvd-workflow.mjs](../test-rvd-workflow.mjs)
- **Agent Packages:** [../packages/agents/](../packages/agents/)
- **Project Examples:** [../projects/](../projects/)

## 📝 Contributing

To contribute to the documentation:
1. Follow the naming convention: `NN-descriptive-name.md`
2. Place files in the appropriate directory
3. Update this README with links
4. Use clear headings and examples

---

**Last Updated:** 2025-12-12  
**Documentation Version:** 1.0  
**Status:** 🟡 In Progress (25% complete)
