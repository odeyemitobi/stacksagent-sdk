import { describe, expect, it, vi } from 'vitest';
import { StackAgentClient } from './client';
import { PolicyRejectedError } from './errors';
import { NetworkMode } from '@stackagent/types';

describe('StackAgentClient', () => {
  it('lists preloaded protocols from the registry', () => {
    const client = new StackAgentClient();
    const protocols = client.listProtocols();
    expect(protocols.length).toBeGreaterThanOrEqual(2);
    expect(protocols.some((p) => p.id === 'alex')).toBe(true);
    expect(protocols.some((p) => p.id === 'zest')).toBe(true);
  });

  it('creates and retrieves an agent', async () => {
    const client = new StackAgentClient();
    const agent = await client.createAgent({
      name: 'Test Agent',
      role: 'Treasury Manager',
      allowedProtocols: ['alex'],
    });
    const state = agent.getState();
    expect(state.config.name).toBe('Test Agent');

    const fetched = await client.getAgent(state.id);
    expect(fetched.getState().id).toBe(state.id);
  });

  it('rejects intents that fail policy evaluation', async () => {
    const client = new StackAgentClient();
    await expect(
      client.proposeExecution(
        {
          actionId: 'swap',
          protocolId: 'unknown-protocol',
          parameters: { amount: 10 },
          reasoning: 'test',
        },
        [
          {
            id: 'pol-1',
            type: 'ALLOWLIST',
            parameters: { protocols: ['alex'] },
          },
        ],
      ),
    ).rejects.toBeInstanceOf(PolicyRejectedError);
  });

  it('simulates a valid alex intent', async () => {
    const client = new StackAgentClient({ networkMode: NetworkMode.Testnet });
    const result = await client.proposeExecution(
      {
        actionId: 'swap',
        protocolId: 'alex',
        parameters: { amount: 50 },
        reasoning: 'Swap STX for yield',
      },
      [
        {
          id: 'pol-1',
          type: 'ALLOWLIST',
          parameters: { protocols: ['alex'] },
        },
      ],
    );

    expect(result.simulation.success).toBe(true);
    expect(result.simulation.humanReadableDiff.length).toBeGreaterThan(0);
  });

  it('throws AgentNotFoundError for missing agents', async () => {
    const client = new StackAgentClient();
    await expect(client.getAgent('nonexistent-id')).rejects.toMatchObject({ code: 'AGENT_NOT_FOUND' });
  });
});
