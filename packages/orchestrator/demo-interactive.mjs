/**
 * Demo - Interactive Step-by-Step Workflow
 * 
 * This example shows how to use InteractiveOrchestrator
 * to execute a workflow with pauses between phases.
 * 
 * Perfect for:
 * - Demos and presentations
 * - Learning how Forge AI works
 * - Understanding agent interactions
 * - Debugging issues
 * 
 * Usage:
 *   node packages/orchestrator/demo-interactive.mjs --interactive
 *   node packages/orchestrator/demo-interactive.mjs --auto      (skip pauses)
 */

import InteractiveOrchestrator from './interactiveOrchestrator.mjs';

// Example phases for demo
const DEMO_PHASES = [
  {
    number: 1,
    name: 'Parse Requirement',
    description: 'Read and validate requirement.md file',
    execute: async function () {
      // Simulate parsing
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        name: 'example-feature',
        priority: 'high',
        owner: 'Team/Person',
        sections: {
          context: 'User wants to login',
          userStory: 'As a user, I want to login securely',
          functionalRequirements: ['Email input', 'Password input', 'Submit button'],
          acceptanceCriteria: [
            'Valid credentials → logged in',
            'Invalid credentials → error shown',
          ],
        },
      };
    },
  },

  {
    number: 2,
    name: 'Extract Functional Requirements',
    description: 'FunctionalRequirementsAgent extracts structured data',
    execute: async function () {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        functionalRequirements: [
          {
            id: 'FR-1',
            title: 'Email Input Validation',
            description: 'System validates email format before submission',
            priority: 'high',
          },
          {
            id: 'FR-2',
            title: 'Password Encryption',
            description: 'System encrypts password before storage',
            priority: 'high',
          },
          {
            id: 'FR-3',
            title: 'Session Management',
            description: 'System creates secure session after login',
            priority: 'medium',
          },
        ],
        acceptanceCriteria: [
          'GIVEN user enters valid email and password, WHEN user clicks submit, THEN user is logged in',
          'GIVEN user enters invalid email, WHEN user clicks submit, THEN error message shown',
          'GIVEN user logged in, WHEN user refreshes page, THEN session persists',
        ],
      };
    },
  },

  {
    number: 3,
    name: 'Generate Technical Specification',
    description: 'TechnicalRequirementsAgent creates detailed technical specs',
    execute: async function () {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 1200));

      return {
        apis: [
          {
            method: 'POST',
            path: '/auth/login',
            description: 'Authenticate user',
            requestBody: {
              email: 'string',
              password: 'string',
            },
            responses: {
              200: 'Success with session token',
              401: 'Invalid credentials',
              400: 'Validation error',
            },
          },
          {
            method: 'POST',
            path: '/auth/logout',
            description: 'End user session',
          },
          {
            method: 'GET',
            path: '/auth/verify',
            description: 'Check if user is authenticated',
          },
        ],
        dataStructures: [
          {
            name: 'User',
            fields: {
              id: 'UUID',
              email: 'string (unique)',
              passwordHash: 'string (bcrypt)',
              createdAt: 'timestamp',
              lastLogin: 'timestamp',
            },
          },
          {
            name: 'Session',
            fields: {
              token: 'string (JWT)',
              userId: 'UUID',
              expiresAt: 'timestamp',
            },
          },
        ],
        nonFunctionalRequirements: [
          'Authentication response < 500ms',
          'Password must be bcrypt encrypted with cost factor 12',
          'Sessions expire after 24 hours',
          'Support 10,000 concurrent sessions',
        ],
      };
    },
  },

  {
    number: 4,
    name: 'Design Architecture',
    description: 'ArchitectureAgent plans system design',
    execute: async function () {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        architecture: {
          frontend: {
            component: 'LoginForm',
            framework: 'React',
            features: ['Email input validation', 'Password strength meter'],
          },
          backend: {
            framework: 'Node.js/Express',
            layers: ['Routes', 'Controllers', 'Services', 'Database'],
            database: 'PostgreSQL',
          },
          security: [
            'HTTPS only',
            'CORS configured',
            'Rate limiting on /auth/login',
            'JWT tokens',
          ],
        },
        components: [
          { name: 'AuthController', responsibility: 'Handle auth routes' },
          { name: 'UserService', responsibility: 'User operations' },
          { name: 'CryptoService', responsibility: 'Password hashing' },
          { name: 'SessionService', responsibility: 'Session management' },
        ],
      };
    },
  },

  {
    number: 5,
    name: 'Generate Test Specifications',
    description: 'TestAgent creates test plan',
    execute: async function () {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 900));

      return {
        testCases: [
          {
            id: 'TC-1',
            title: 'Valid login',
            steps: [
              'Enter valid email',
              'Enter valid password',
              'Click submit',
            ],
            expectedResult: 'Logged in, redirected to dashboard',
            type: 'e2e',
          },
          {
            id: 'TC-2',
            title: 'Invalid email format',
            steps: ['Enter invalid email', 'Click submit'],
            expectedResult: 'Error: "Invalid email format"',
            type: 'unit',
          },
          {
            id: 'TC-3',
            title: 'SQL injection attempt',
            steps: ["Enter: ' OR '1'='1", 'Click submit'],
            expectedResult: 'Request rejected, error logged',
            type: 'security',
          },
        ],
        coverage: {
          unitTests: ['Email validation', 'Password hashing', 'Token generation'],
          e2eTests: ['Happy path login', 'Logout flow', 'Session persistence'],
          securityTests: ['SQL injection', 'XSS attempts', 'CSRF protection'],
        },
      };
    },
  },

  {
    number: 6,
    name: 'Generate Implementation',
    description: 'ImplementationAgent generates code',
    execute: async function () {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return {
        files: [
          {
            path: 'src/routes/auth.ts',
            type: 'TypeScript',
            lines: 45,
            coverage: '92%',
          },
          {
            path: 'src/services/CryptoService.ts',
            type: 'TypeScript',
            lines: 28,
            coverage: '100%',
          },
          {
            path: 'src/services/SessionService.ts',
            type: 'TypeScript',
            lines: 35,
            coverage: '95%',
          },
          {
            path: 'tests/auth.test.ts',
            type: 'TypeScript',
            lines: 120,
            coverage: 'N/A',
          },
        ],
        testResults: {
          passed: 18,
          failed: 0,
          skipped: 0,
          coverage: '94%',
        },
      };
    },
  },

  {
    number: 7,
    name: 'Code Review',
    description: 'ReviewAgent evaluates generated code',
    execute: async function () {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        issues: [
          {
            severity: 'info',
            file: 'src/routes/auth.ts',
            line: 12,
            message: 'Consider adding request logging',
          },
        ],
        improvements: [
          'Code follows TypeScript best practices',
          'Test coverage excellent (94%)',
          'Security measures properly implemented',
        ],
        status: 'APPROVED',
      };
    },
  },

  {
    number: 8,
    name: 'Generate Documentation',
    description: 'DocumentationAgent creates docs and diagrams',
    execute: async function () {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 700));

      return {
        documentation: {
          'README.md': 'Project overview and setup instructions',
          'API.md': 'API endpoint documentation',
          'ARCHITECTURE.md': 'System design and decisions',
          'TESTING.md': 'Test strategy and coverage',
        },
        diagrams: [
          'architecture-component.puml',
          'auth-sequence.puml',
          'data-model.puml',
        ],
      };
    },
  },

  {
    number: 9,
    name: 'Persist Learning & Metrics',
    description: 'System learns and stores patterns for future use',
    execute: async function () {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 400));

      return {
        patterns: [
          {
            name: 'secure-authentication-flow',
            category: 'security',
            successRate: 0.98,
            description: 'Email + password authentication with JWT sessions',
          },
          {
            name: 'comprehensive-test-coverage',
            category: 'testing',
            successRate: 0.95,
            description: 'Unit + E2E + Security tests for auth systems',
          },
        ],
        metrics: {
          totalDuration: '7.5s',
          phasesCompleted: 9,
          codeGenerated: 228,
          testsGenerated: 18,
          documentation: 4,
        },
      };
    },
  },
];

/**
 * Run demo
 */
async function runDemo() {
  const args = process.argv.slice(2);
  const interactive = !args.includes('--auto');

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                  FORGE AI - INTERACTIVE DEMO                ║
║                                                             ║
║  This demo shows Forge AI processing a feature requirement  ║
║  step-by-step with pauses between phases.                   ║
╚════════════════════════════════════════════════════════════╝

Mode: ${interactive ? 'INTERACTIVE (pause after each phase)' : 'AUTOMATIC (no pauses)'}

`);

  const orchestrator = new InteractiveOrchestrator({
    interactive,
    logLevel: 'INFO',
    requirementName: 'demo-login-feature',
  });

  try {
    // Define phases
    orchestrator.definePhases(DEMO_PHASES);

    // Execute workflow
    const result = await orchestrator.executeWorkflow('./demo-requirement.md');

    console.log('\n✓ Demo completed successfully!\n');
    console.log('Summary:');
    console.log(`  Status: ${result.status}`);
    console.log(`  Duration: ${result.duration}`);
    console.log(`  Report: ${result.reportPath}`);
    console.log(`  Logs: ${result.logDir}\n`);

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  } finally {
    orchestrator.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DEMO_PHASES, runDemo };
