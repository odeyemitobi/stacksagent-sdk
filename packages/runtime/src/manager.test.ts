import { describe, it, expect, beforeEach } from 'vitest';
import { AgentManager } from './manager';
import { AgentConfig } from '@stackagent/types';

describe('AgentManager', () => {
  let manager: AgentManager;

  const mockConfig: AgentConfig = {
    name: 'Test Agent',
    role: 'Treasury Manager',
    systemPrompt: 'You are a test agent.',
    allowedProtocols: ['alex'],
  };

  beforeEach(() => {
    manager = new AgentManager();
  });

  it('creates an agent successfully', async () => {
    const result = await manager.createAgent(mockConfig);
    expect(result.ok).toBe(true);

    if (result.ok) {
      const agentState = result.value.getState();
      expect(agentState.id).toBeDefined();
      expect(agentState.config).toEqual(mockConfig);
      expect(agentState.status).toBe('IDLE');
    }
  });

  it('retrieves an agent by ID', async () => {
    const createResult = await manager.createAgent(mockConfig);
    if (!createResult.ok) throw new Error('Failed to create');
    
    const id = createResult.value.getState().id;
    const getResult = await manager.getAgent(id);
    
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      expect(getResult.value.getState().id).toBe(id);
    }
  });

  it('returns an error when getting a non-existent agent', async () => {
    const getResult = await manager.getAgent('non-existent-id');
    expect(getResult.ok).toBe(false);
  });

  it('lists all agents', async () => {
    await manager.createAgent(mockConfig);
    await manager.createAgent({ ...mockConfig, name: 'Agent 2' });

    const agents = await manager.listAgents();
    expect(agents).toHaveLength(2);
  });

  it('handles agent lifecycle state transitions', async () => {
    const createResult = await manager.createAgent(mockConfig);
    if (!createResult.ok) throw new Error('Failed to create');
    
    const agent = createResult.value;
    
    expect(agent.getState().status).toBe('IDLE');
    
    agent.start();
    expect(agent.getState().status).toBe('RUNNING');
    
    agent.pause();
    expect(agent.getState().status).toBe('PAUSED');
    
    agent.stop();
    expect(agent.getState().status).toBe('STOPPED');
  });
});
