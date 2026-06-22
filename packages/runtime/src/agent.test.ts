import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from './agent';
import { AgentConfig } from '@stackagent/types';

// Mock OpenAI
vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            actionId: 'swap',
            protocolId: 'alex',
            parameters: { amount: 100 },
            reasoning: 'Testing swap execution',
          }),
        },
      },
    ],
  });

  const OpenAI = class {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  };

  return {
    default: OpenAI,
  };
});

describe('Agent Execution', () => {
  const config: AgentConfig = {
    name: 'Execution Test Agent',
    role: 'Trader',
    systemPrompt: 'You are a test agent.',
    allowedProtocols: ['alex'],
  };

  let agent: Agent;

  beforeEach(() => {
    agent = new Agent(config);
  });

  it('fails to execute if agent is not RUNNING', async () => {
    // Agent is IDLE initially
    const result = await agent.executeTask('Swap 100 STX for ALEX');
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('must be in RUNNING state');
    }
  });

  it('successfully parses an execution intent when RUNNING', async () => {
    agent.start();
    const result = await agent.executeTask('Swap 100 STX for ALEX');
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
      expect(result.value.intent).toBeDefined();
      expect(result.value.intent?.actionId).toBe('swap');
      expect(result.value.intent?.protocolId).toBe('alex');
      expect(result.value.intent?.parameters).toEqual({ amount: 100 });
    }
  });
});
