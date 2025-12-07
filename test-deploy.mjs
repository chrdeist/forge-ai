import DeployAgent from './packages/agents/deploy-agent.mjs';
import ExecutionLogger from './packages/logging/executionLogger.mjs';
import WorkflowStateTracker from './packages/orchestrator/workflowStateTracker.mjs';

const logger = new ExecutionLogger('test');
const tracker = new WorkflowStateTracker();

const agent = new DeployAgent(logger, tracker, {
  projectRoot: '/tmp/test-deploy',
});

const mockOutput = {
  requirement: { name: 'test-app', description: 'Test' },
  files: [{ path: 'src/index.js', content: '' }],
  testResults: { passed: 5, failed: 0, coverage: '90%' },
  lintResults: { errors: 0 },
};

try {
  const result = await agent.execute(mockOutput);
  console.log('✅ Execute completed');
  console.log('Files written:', result.filesWritten || result.files || 'unknown');
} catch (e) {
  console.error('❌ Error:', e.message);
}
