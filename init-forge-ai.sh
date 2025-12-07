#!/bin/bash
#
# Forge AI Initialization Script
# Framework for Optimized Recursive Generation & Evolution
#
# Usage: ./init-forge-ai.sh [target-directory]
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Target directory (default: current directory)
TARGET_DIR="${1:-.}"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    FORGE AI INIT                           ║"
echo "║  Framework for Optimized Recursive Generation & Evolution  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Create directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
  echo -e "${YELLOW}Creating directory: $TARGET_DIR${NC}"
  mkdir -p "$TARGET_DIR"
fi

cd "$TARGET_DIR"

echo -e "${GREEN}✓ Initializing Forge AI project structure...${NC}\n"

# Create directory structure
echo "Creating directories..."
mkdir -p packages/core
mkdir -p packages/agents
mkdir -p packages/strategies/parsing
mkdir -p packages/strategies/generation
mkdir -p packages/strategies/testing
mkdir -p packages/orchestrator
mkdir -p packages/cli
mkdir -p knowledge
mkdir -p examples
mkdir -p docs
mkdir -p tests/core
mkdir -p tests/agents
mkdir -p tests/strategies

echo -e "${GREEN}✓ Directory structure created${NC}\n"

# Create package.json
echo "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "forge-ai",
  "version": "0.1.0",
  "description": "Framework for Optimized Recursive Generation & Evolution - Self-learning AI agent system",
  "type": "module",
  "main": "packages/core/index.mjs",
  "bin": {
    "forge": "./packages/cli/forge.mjs"
  },
  "scripts": {
    "init": "node packages/cli/init.mjs",
    "execute": "node packages/cli/forge.mjs execute",
    "dashboard": "node packages/cli/forge.mjs dashboard",
    "evolve": "node packages/cli/forge.mjs evolve",
    "test": "node --test tests/**/*.test.mjs",
    "dev": "node --watch packages/cli/forge.mjs"
  },
  "keywords": [
    "ai",
    "agents",
    "evolution",
    "self-learning",
    "code-generation",
    "optimization"
  ],
  "author": "chrdeist",
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

echo -e "${GREEN}✓ package.json created${NC}\n"

# Create initial knowledge base
echo "Creating knowledge base..."
cat > knowledge/experiences.json << 'EOF'
{
  "version": "1.0",
  "initialized": "{{TIMESTAMP}}",
  "experiences": [],
  "strategy_rankings": {}
}
EOF

# Replace timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i "s/{{TIMESTAMP}}/$TIMESTAMP/" knowledge/experiences.json

cat > knowledge/strategies.json << 'EOF'
{
  "version": "1.0",
  "strategies": []
}
EOF

echo -e "${GREEN}✓ Knowledge base initialized${NC}\n"

# Create README.md
echo "Creating README.md..."
cat > README.md << 'EOF'
# Forge AI

**Framework for Optimized Recursive Generation & Evolution**

A self-learning AI agent system that evolves development strategies through experience, optimizing for success rate and resource efficiency.

## Quick Start

```bash
# Install dependencies
npm install

# Initialize knowledge base
npm run init

# Execute a task
forge execute --requirements=./examples/sample.md

# View performance dashboard
npm run dashboard

# Trigger evolution
npm run evolve
```

## Documentation

See [docs/](./docs/) folder for comprehensive documentation.

## Architecture

- `packages/core/` - Core experience collection and strategy management
- `packages/agents/` - Adaptive AI agents
- `packages/strategies/` - Strategy variants (parsing, generation, testing)
- `packages/orchestrator/` - Workflow coordination
- `knowledge/` - Learned patterns and experiences

## Philosophy

Every task execution makes the system smarter and more resource-efficient.

## License

MIT
EOF

echo -e "${GREEN}✓ README.md created${NC}\n"

# Create core modules (stubs)
echo "Creating core module stubs..."

cat > packages/core/index.mjs << 'EOF'
/**
 * Forge AI - Core Module
 * Main entry point for the Forge AI system
 */

export { ExperienceCollector } from './experienceCollector.mjs';
export { StrategyManager } from './strategyManager.mjs';
export { EvolutionEngine } from './evolutionEngine.mjs';
export { FitnessCalculator } from './fitnessCalculator.mjs';
EOF

cat > packages/core/experienceCollector.mjs << 'EOF'
/**
 * Experience Collector
 * Records and manages execution experiences
 */

import fs from 'node:fs';
import path from 'node:path';

export class ExperienceCollector {
  constructor(knowledgeBasePath = './knowledge/experiences.json') {
    this.knowledgeBasePath = knowledgeBasePath;
    this.knowledgeBase = this.loadKnowledgeBase();
  }

  loadKnowledgeBase() {
    if (!fs.existsSync(this.knowledgeBasePath)) {
      return { experiences: [], strategy_rankings: {} };
    }
    return JSON.parse(fs.readFileSync(this.knowledgeBasePath, 'utf8'));
  }

  saveKnowledgeBase() {
    fs.writeFileSync(
      this.knowledgeBasePath,
      JSON.stringify(this.knowledgeBase, null, 2)
    );
  }

  async recordExperience(experience) {
    this.knowledgeBase.experiences.push(experience);
    this.saveKnowledgeBase();
    return experience;
  }

  getBestStrategy(taskType) {
    const rankings = this.knowledgeBase.strategy_rankings[taskType];
    if (!rankings || rankings.length === 0) return null;
    
    return rankings
      .filter(s => s.status !== 'deprecated')
      .sort((a, b) => b.avg_fitness - a.avg_fitness)[0];
  }
}
EOF

cat > packages/core/strategyManager.mjs << 'EOF'
/**
 * Strategy Manager
 * Selects optimal strategies based on task signatures
 */

export class StrategyManager {
  constructor(experienceCollector) {
    this.experienceCollector = experienceCollector;
    this.strategies = new Map();
  }

  registerStrategy(strategy) {
    this.strategies.set(strategy.id, strategy);
  }

  async selectStrategy(taskSignature) {
    const taskType = this.classifyTask(taskSignature);
    const bestKnown = this.experienceCollector.getBestStrategy(taskType);
    
    if (bestKnown && bestKnown.avg_fitness > 0.7) {
      console.log(`✓ Using proven strategy: ${bestKnown.strategy_id}`);
      return this.strategies.get(bestKnown.strategy_id);
    }
    
    console.log(`⚠ No proven strategy for ${taskType}, exploring...`);
    return this.exploreStrategies(taskSignature);
  }

  classifyTask(requirements) {
    // TODO: Implement task classification
    return 'generic';
  }

  async exploreStrategies(taskSignature) {
    // TODO: Implement strategy exploration
    return null;
  }
}
EOF

cat > packages/core/evolutionEngine.mjs << 'EOF'
/**
 * Evolution Engine
 * Optimizes strategies through evolutionary selection
 */

export class EvolutionEngine {
  constructor(experienceCollector) {
    this.experienceCollector = experienceCollector;
  }

  async evolve() {
    console.log('[EvolutionEngine] Starting evolutionary optimization...');
    
    // TODO: Implement evolution logic
    // - Prune low-fitness strategies
    // - Mutate high-performers
    // - Generate variants
    
    console.log('[EvolutionEngine] Evolution complete');
  }
}
EOF

cat > packages/core/fitnessCalculator.mjs << 'EOF'
/**
 * Fitness Calculator
 * Computes fitness scores for strategies
 */

export class FitnessCalculator {
  static calculate(metrics) {
    const weights = {
      success: 0.4,
      tokens: 0.3,
      quality: 0.2,
      speed: 0.1
    };

    const success_score = metrics.success ? 1.0 : 0.0;
    const token_score = 1.0 - Math.min(metrics.tokens_used / 10000, 1.0);
    const quality_score = metrics.output_quality || 0.5;
    const speed_score = 1.0 - Math.min(metrics.execution_time_ms / 5000, 1.0);

    return (
      weights.success * success_score +
      weights.tokens * token_score +
      weights.quality * quality_score +
      weights.speed * speed_score
    );
  }
}
EOF

echo -e "${GREEN}✓ Core modules created${NC}\n"

# Create CLI stub
echo "Creating CLI..."
cat > packages/cli/forge.mjs << 'EOF'
#!/usr/bin/env node
/**
 * Forge AI - Command Line Interface
 */

const command = process.argv[2];

switch (command) {
  case 'execute':
    console.log('Executing task...');
    // TODO: Implement execute
    break;
  case 'dashboard':
    console.log('Performance Dashboard');
    console.log('=====================');
    console.log('No experiences recorded yet.');
    break;
  case 'evolve':
    console.log('Triggering evolution...');
    // TODO: Implement evolution
    break;
  default:
    console.log('Forge AI - Framework for Optimized Recursive Generation & Evolution');
    console.log('');
    console.log('Commands:');
    console.log('  forge execute --requirements=<file>   Execute a task');
    console.log('  forge dashboard                        View performance metrics');
    console.log('  forge evolve                           Trigger evolution');
}
EOF

chmod +x packages/cli/forge.mjs

echo -e "${GREEN}✓ CLI created${NC}\n"

# Create .gitignore
echo "Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Logs
*.log
logs/

# Knowledge base (optional - remove if you want to commit experiences)
knowledge/experiences.json

# Test artifacts
test-results/
coverage/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build artifacts
dist/
build/
EOF

echo -e "${GREEN}✓ .gitignore created${NC}\n"

# Create example requirements file
echo "Creating example..."
mkdir -p examples
cat > examples/sample-requirement.md << 'EOF'
# Sample Requirement: Extract Utility Function

## Overview
Extract a utility function from existing code.

## Requirements
- Create `utils/helpers.js`
- Move `formatDate()` function from `App.js` to `utils/helpers.js`
- Update imports in `App.js`

## Success Criteria
- Function works identically
- All tests pass
- No functionality changes
EOF

echo -e "${GREEN}✓ Example created${NC}\n"

# Initialize git
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  echo -e "${GREEN}✓ Git repository initialized${NC}\n"
else
  echo -e "${YELLOW}⚠ Git repository already exists${NC}\n"
fi

# Create initial commit structure
cat > .forge-ai-init << 'EOF'
Forge AI initialized successfully!
EOF

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  INITIALIZATION COMPLETE!                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "\n${GREEN}Next steps:${NC}"
echo "  1. cd $TARGET_DIR"
echo "  2. npm install (if you have dependencies)"
echo "  3. Create your first agent in packages/agents/"
echo "  4. Run: ./packages/cli/forge.mjs dashboard"
echo ""
echo -e "${BLUE}Happy forging! 🔥${NC}\n"
