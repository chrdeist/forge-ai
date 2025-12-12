# Architecture - Design and Architectural Decisions

This directory contains high-level architecture and design documentation.

## Available Architecture Documents

### [01-agent-data-flow.md](./01-agent-data-flow.md)
Agent interaction patterns and data flow between components.

### [02-generic-architecture.md](./02-generic-architecture.md)
Core design principles for generic, reusable agent architecture.

## Architecture Overview

The Forge AI Framework uses a **pipeline-based agent architecture**:

```
Requirements Input
      ↓
┌─────────────────────────────────┐
│   Agent 1: Parse Requirements   │
└─────────────┬───────────────────┘
              ↓ (RVD.functional)
┌─────────────────────────────────┐
│   Agent 2: Technical Spec       │
└─────────────┬───────────────────┘
              ↓ (RVD.technical)
┌─────────────────────────────────┐
│   Agent 3: Architecture Design  │
└─────────────┬───────────────────┘
              ↓ (RVD.architecture)
         [... continue ...]
              ↓
       Final Artifacts
```

## Key Principles

- **Generic** - No hardcoded project-specific code
- **Data-Driven** - All data flows through RVD files
- **Modular** - Each agent is independent
- **Traceable** - Full execution history in RVD
- **Extensible** - Easy to add new agents

## Contributing Architecture Docs

1. Use numbering prefix: `NN-descriptive-name.md`
2. Include diagrams (PlantUML or ASCII)
3. Explain design decisions
4. Provide examples
5. Update this README
