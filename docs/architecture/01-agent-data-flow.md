# Forge AI - Generische Agent-Architektur & Datenaustausch

## Problem mit der aktuellen Implementierung

Die aktuellen Agenten generieren **spezialisierte Outputs** für jedes Feature, aber:
- Jeder Agent speichert in separate Dateien
- Keine zentrale Struktur für den Datenaustausch
- Implementation-Agent nutzt nicht die Outputs der vorherigen Agenten

## Lösung: Zentrale Requirement-Verarbeitungsdatei (RVD)

Jedes Feature hat eine zentrale **Requirement-Verarbeitungsdatei (RVD)**, in die alle Agenten schreiben:

```
projects/hello-world/
├── requirements/
│   ├── hello-world-requirements.md      (Input)
│   └── hello-world-rvd.json             (Zentrale Datei für alle Agent-Outputs!)
└── deployment/
    └── Dockerfile (nutzt generierte Outputs)
```

## Architektur der RVD (Requirement-Verarbeitungsdatei)

```json
{
  "metadata": {
    "requirementId": "hello-world",
    "version": "1.0",
    "createdAt": "2025-12-12T21:02:13Z",
    "orchestrator": "SoftwareLifecycleOrchestrator"
  },
  
  "phases": {
    "1-parse-requirements": {
      "status": "completed",
      "timestamp": "2025-12-12T21:02:13Z",
      "agent": "Orchestrator",
      "output": {
        "name": "hello-world",
        "priority": "high",
        "content": "..."
      }
    },
    
    "2-functional-requirements": {
      "status": "completed",
      "timestamp": "2025-12-12T21:02:13Z",
      "agent": "FunctionalRequirementsAgent",
      "output": {
        "functionalRequirements": [...],
        "acceptanceCriteria": [...],
        "patterns": ["clear-user-story"]
      }
    },
    
    "3-technical-specification": {
      "status": "completed",
      "timestamp": "2025-12-12T21:02:13Z",
      "agent": "TechnicalRequirementsAgent",
      "input": "phases['2-functional-requirements'].output",
      "output": {
        "apis": [
          {
            "name": "formatGreeting",
            "description": "Formats a greeting message",
            "signature": {
              "parameters": [{"name": "name", "type": "string"}],
              "returns": {"type": "string"}
            },
            "implementation": {
              "language": "javascript",
              "template": "function-with-validation"
            }
          }
        ],
        "dataStructures": [...],
        "errorHandling": [...],
        "patterns": ["api-design", "comprehensive-error-handling"]
      }
    },
    
    "4-architecture-design": {
      "status": "completed",
      "timestamp": "2025-12-12T21:02:13Z",
      "agent": "ArchitectureAgent",
      "input": "phases['3-technical-specification'].output",
      "output": {
        "components": [...],
        "diagrams": {
          "architecture": "...",
          "sequence": "...",
          "usecases": "..."
        }
      }
    },
    
    "5-test-generation": {
      "status": "completed",
      "timestamp": "2025-12-12T21:02:13Z",
      "agent": "TestAgent",
      "input": "phases['3-technical-specification'].output",
      "output": {
        "testCases": [
          {
            "id": "test-1",
            "api": "formatGreeting",
            "scenario": "formatGreeting('Alice')",
            "expectedOutput": "'Hello, Alice!'",
            "testCode": "const result = formatGreeting('Alice'); assert.equal(result, 'Hello, Alice!');"
          }
        ],
        "testFramework": "node:test",
        "testCommand": "npm test"
      }
    },
    
    "6-implementation": {
      "status": "pending",
      "timestamp": null,
      "agent": "ImplementationAgent",
      "input": [
        "phases['3-technical-specification'].output",
        "phases['5-test-generation'].output"
      ],
      "output": {
        "sourceCode": {
          "files": [
            {
              "path": "src/helloWorld.js",
              "content": "// Generated implementation code based on technical spec",
              "template": "function-with-validation",
              "apis": ["formatGreeting", "parseArgs"]
            }
          ],
          "packageJson": {
            "name": "hello-world",
            "version": "1.0.0",
            "scripts": {"test": "node --test test/**/*.test.js"}
          }
        },
        "testCode": {
          "files": [
            {
              "path": "test/helloWorld.test.js",
              "content": "// Generated test code based on test specification",
              "framework": "node:test"
            }
          ]
        }
      }
    },
    
    "7-code-review": {
      "status": "pending",
      "timestamp": null,
      "agent": "ReviewAgent",
      "input": "phases['6-implementation'].output",
      "output": {
        "feedback": [...],
        "approved": false,
        "revisionsNeeded": [...]
      }
    },
    
    "8-documentation": {
      "status": "pending",
      "timestamp": null,
      "agent": "DocumentationAgent",
      "input": [
        "phases['3-technical-specification'].output",
        "phases['6-implementation'].output"
      ],
      "output": {
        "documentation": {
          "readme": "# Hello World...",
          "apiDocs": "...",
          "examples": "..."
        },
        "diagrams": {
          "architecture": "@startuml...",
          "sequence": "@startuml...",
          "usecases": "@startuml..."
        }
      }
    },
    
    "9-deployment": {
      "status": "pending",
      "timestamp": null,
      "agent": "DeploymentAgent",
      "input": [
        "phases['6-implementation'].output",
        "phases['8-documentation'].output"
      ],
      "output": {
        "docker": {
          "dockerfile": "FROM node:18-alpine\nWORKDIR /app\n...",
          "dockerCompose": "version: '3.9'\nservices:\n..."
        },
        "deployment": {
          "scripts": ["deploy.sh", "rollback.sh"],
          "documentation": "DEPLOYMENT.md"
        }
      }
    }
  },
  
  "globalPatterns": ["clear-user-story", "api-design", "comprehensive-error-handling"],
  "qualityMetrics": {
    "totalPhases": 9,
    "completedPhases": 5,
    "failedPhases": 0
  }
}
```

## Agent-Implementierungsmuster

### Generischer Agent-Code-Struktur

```javascript
export class MyAgent extends BaseAgent {
  /**
   * Main execution method
   * @param {string} rvdPath - Path to central RVD file
   * @returns {object} Agent output for this phase
   */
  async execute(rvdPath) {
    // 1. Lade die RVD
    const rvd = this.loadRVD(rvdPath);
    
    // 2. Finde deinen Input (Output des vorherigen Agenten)
    const myInput = this.extractInputFromRVD(rvd);
    
    // 3. Verarbeite die Daten
    const myOutput = await this.processData(myInput);
    
    // 4. Lerne Patterns
    this.learnPatterns(myOutput);
    
    // 5. Schreibe Output in RVD
    this.writeOutputToRVD(rvd, myOutput);
    
    return myOutput;
  }
  
  loadRVD(rvdPath) {
    return JSON.parse(fs.readFileSync(rvdPath, 'utf-8'));
  }
  
  extractInputFromRVD(rvd) {
    // Z.B. TechnicalRequirementsAgent nimmt:
    // rvd.phases['2-functional-requirements'].output
    const inputPhase = rvd.phases[this.getInputPhaseName()];
    if (!inputPhase) throw new Error(`Input phase not found in RVD`);
    return inputPhase.output;
  }
  
  async processData(input) {
    // Spezifische Agenten-Logik hier
    // Keine hardcodierten Daten!
    return {
      /* genererter Output */
    };
  }
  
  writeOutputToRVD(rvd, output) {
    const phaseName = this.getPhaseName(); // z.B. '3-technical-specification'
    rvd.phases[phaseName] = {
      status: 'completed',
      timestamp: new Date().toISOString(),
      agent: this.constructor.name,
      output: output
    };
    fs.writeFileSync(this.rvdPath, JSON.stringify(rvd, null, 2));
  }
}
```

## Implementierungsschritte

### 1. Erstelle einen RVDManager
```javascript
export class RVDManager {
  static createRVD(requirementId, requirementsFile) {
    return {
      metadata: {
        requirementId,
        version: '1.0',
        createdAt: new Date().toISOString(),
        orchestrator: 'SoftwareLifecycleOrchestrator'
      },
      phases: {
        '1-parse-requirements': { status: 'pending', output: null },
        '2-functional-requirements': { status: 'pending', output: null },
        // ... etc
      }
    };
  }
  
  static loadRVD(rvdPath) {
    return JSON.parse(fs.readFileSync(rvdPath, 'utf-8'));
  }
  
  static saveRVD(rvdPath, rvd) {
    fs.writeFileSync(rvdPath, JSON.stringify(rvd, null, 2));
  }
}
```

### 2. Refaktoriere Agenten
- Alle Agenten erhalten den `rvdPath` statt einzelner Input-Dateien
- Agenten lesen ihren Input aus der RVD
- Agenten schreiben ihren Output in die RVD
- Keine hardcodierten Pfade mehr

### 3. Aktualisiere die Orchestrierung
```javascript
async executeWorkflow(requirementsFile) {
  // Erstelle zentrale RVD
  const rvdPath = path.join(this.projectDir, 'hello-world-rvd.json');
  const rvd = RVDManager.createRVD('hello-world', requirementsFile);
  RVDManager.saveRVD(rvdPath, rvd);
  
  // Rufe Agenten auf mit RVD
  await functionalAgent.execute(rvdPath);
  await technicalAgent.execute(rvdPath);
  await testAgent.execute(rvdPath);
  await implementationAgent.execute(rvdPath); // Liest tech-spec, generiert Code
  // ... etc
}
```

## Vorteile dieser Architektur

✅ **Generisch**: Kein Agent hat Feature-spezifischen Code  
✅ **Zustandsgestützt**: Gesamter Workflow ist in einer Datei sichtbar  
✅ **Nachverolgbar**: Wer hat was wann geändert  
✅ **Erweiterbar**: Neue Agenten können einfach Phasen einfügen  
✅ **Debuggbar**: Inspect RVD für jeden Step  
✅ **Versionierbar**: RVD kann gespeichert/wiederhergestellt werden  

## Nächste Schritte

1. Erstelle `RVDManager` Klasse
2. Refaktoriere existierende Agenten
3. Teste mit hello-world Requirement
4. Verifiziere, dass echter Code generiert wird
