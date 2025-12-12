# Incremental Feature Workflow

## Vision
Build applications incrementally, feature by feature, with human review at each checkpoint.

## Workflow: Feature 1 ✅ → Feature 2 → Feature 3 → ...

### Phase 1: Capture Requirement
Create a new Markdown file in `projects/<project>/requirements/`.
Example: `hello-world-feature-2.md`

### Phase 2: Machine Processing (Orchestrator)
```bash
npm run feature \
  --project=projects/hello-world \
  --feature=feature-2 \
  --requirements=requirements/hello-world-feature-2.md \
  --start-from-phase=functional
```

**What happens:**
1. Load existing RVD from Feature 1.
2. Run agents from specified phase onwards.
3. Merge/extend generated code.
4. Generate validation report.
5. Create checkpoint.

### Phase 3: Human Review & Testing
- Review generated code in `generated-code/hello-world/`.
- Run tests: `npm test` (in generated-code/hello-world/).
- Manual testing: `node src/index.js --help`.
- Review KPI report: `cat projects/hello-world/reports/orchestrate-*.md`.

### Phase 4: Approval & Commit
```bash
npm run feature \
  --project=projects/hello-world \
  --feature=feature-2 \
  --approve \
  --review-notes="Tested and approved by @user"
```

**Result:**
- Checkpoint marked as `approved`.
- Ready for next feature.

---

## Example: Hello World Feature Evolution

### Feature 1: Basic CLI
```
hello-world
│
├─ Outputs "Hello, World!"
├─ Accepts --name parameter
├─ Has --help flag
└─ ✅ Approved & Tested
```

### Feature 2: Logging & Verbosity
```
hello-world + feature-2
│
├─ Inherits Feature 1 (basic output)
├─ Adds --verbose flag (shows execution time)
├─ Adds --debug flag (shows environment info)
├─ Adds --quiet flag (suppresses debug output)
├─ Merges with Feature 1 code
└─ ⏳ Ready for review
```

### Feature 3: Config File (Future)
```
hello-world + feature-2 + feature-3
│
├─ Inherits Features 1 & 2
├─ Reads config from ~/.hello-world/config.json
├─ Supports custom greeting templates
├─ Caches execution stats
└─ ⏳ Queued
```

---

## Batch Mode (Future)

For multiple compatible features:
```bash
npm run batch \
  --project=projects/hello-world \
  --requirements="requirements/feature-*.md" \
  --tech-stack=javascript \
  --batch-mode=sequential
```

Runs all features sequentially with compatibility checks.

---

## Checkpoints

Each feature has a checkpoint JSON:
```
projects/hello-world/
├── checkpoints/
│   ├── feature-1.json
│   ├── feature-2.json
│   └── feature-3.json
└── rvd/
    ├── orchestrator.json (baseline)
    ├── feature-2.json
    └── feature-3.json
```

Checkpoint contains:
- Feature name
- Phases completed
- Validation results
- Review notes
- Approval timestamp
- Generated code path

---

## Resuming a Failed Feature

If phase crashes, resume from that phase:
```bash
npm run feature \
  --project=projects/hello-world \
  --feature=feature-2 \
  --requirements=requirements/hello-world-feature-2.md \
  --start-from-phase=implementation
```

Skips to implementation phase, preserving earlier phases' RVD data.

---

## Integration with Multi-Tech Stacks

Example: React + Node + Python
```
Project: full-stack-app
│
├─ Feature 1: Node API (js)
├─ Feature 2: React Frontend (js)
├─ Feature 3: Python Analytics (py)
└─ Batch Mode: Validates tech-stack compatibility
```

Each feature specifies its tech-stack in frontmatter:
```yaml
tech-stack: "javascript"
# or "python", "java", "golang", "rust", "mixed"
```

Batch orchestrator validates and warns on incompatibilities.

---

## Metrics & Reporting

After each feature run:
```
projects/hello-world/reports/
├── orchestrate-hello-world-feature-1-*.md
├── orchestrate-hello-world-feature-1-*.csv
├── orchestrate-hello-world-feature-2-*.md
├── orchestrate-hello-world-feature-2-*.csv
└── ...
```

Reports contain:
- Functional requirements count
- Technical APIs count
- Test coverage (unit/integration/e2e)
- Implementation: files, LOC, file type breakdown
- Review score & findings
- Agent execution timings
- Potential bottlenecks

---

## Quick Start: Hello World Feature 2

1. **Create requirement:**
```bash
# Already created at:
projects/hello-world/requirements/hello-world-feature-2.md
```

2. **Run orchestration:**
```bash
npm run feature \
  --project=projects/hello-world \
  --feature=feature-2 \
  --requirements=requirements/hello-world-feature-2.md \
  --start-from-phase=functional
```

3. **Review generated code:**
```bash
ls -la generated-code/hello-world/
cat projects/hello-world/reports/orchestrate-*.md
```

4. **Manual test:**
```bash
cd generated-code/hello-world
npm install
npm test
```

5. **Approve if good:**
```bash
npm run feature \
  --project=projects/hello-world \
  --feature=feature-2 \
  --approve \
  --review-notes="Tested manually: all tests pass, --verbose output correct"
```

6. **Next feature:**
Create `hello-world-feature-3.md` and repeat!
