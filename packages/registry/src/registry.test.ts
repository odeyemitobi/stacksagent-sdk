import { describe, it, expect, beforeEach } from 'vitest';
import { ProtocolRegistry } from './registry';
import { Protocol, IPlugin, err } from '@stackagent/types';

describe('ProtocolRegistry', () => {
  let registry: ProtocolRegistry;

  const mockProtocol1: Protocol = {
    id: 'test1',
    name: 'Test Protocol 1',
    description: 'A test protocol',
    website: 'https://test1.com',
    contracts: {},
    actions: [],
    riskProfile: {
      auditStatus: 'AUDITED',
      tvlUsd: 1000,
      ageInDays: 30,
      priorIncidents: false,
    },
  };

  const mockProtocol2: Protocol = {
    id: 'test2',
    name: 'Test Protocol 2',
    description: 'Another test protocol',
    website: 'https://test2.com',
    contracts: {},
    actions: [],
    riskProfile: {
      auditStatus: 'UNAUDITED',
      tvlUsd: 0,
      ageInDays: 1,
      priorIncidents: true,
    },
  };

  const mockPlugin1: IPlugin = {
    protocol: mockProtocol1,
    buildTransaction: async () => err(new Error('Not implemented')),
  };

  const mockPlugin2: IPlugin = {
    protocol: mockProtocol2,
    buildTransaction: async () => err(new Error('Not implemented')),
  };

  beforeEach(() => {
    registry = new ProtocolRegistry([mockPlugin1]);
  });

  it('lists initially registered protocols', () => {
    const protocols = registry.listProtocols();
    expect(protocols).toHaveLength(1);
    expect(protocols[0]).toEqual(mockProtocol1);
  });

  it('retrieves an existing plugin by id', () => {
    const result = registry.getPlugin('test1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.protocol.name).toBe('Test Protocol 1');
    }
  });

  it('returns an error when retrieving a non-existent plugin', () => {
    const result = registry.getPlugin('nonexistent');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('not found');
    }
  });

  it('registers a new plugin successfully', () => {
    const result = registry.registerPlugin(mockPlugin2);
    expect(result.ok).toBe(true);

    const protocols = registry.listProtocols();
    expect(protocols).toHaveLength(2);
    
    const retrieved = registry.getProtocol('test2');
    expect(retrieved.ok).toBe(true);
  });

  it('fails to register a duplicate plugin', () => {
    const result = registry.registerPlugin(mockPlugin1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('already registered');
    }

    const protocols = registry.listProtocols();
    expect(protocols).toHaveLength(1);
  });

  it('unregisters an existing plugin', () => {
    const result = registry.unregisterPlugin('test1');
    expect(result.ok).toBe(true);

    const protocols = registry.listProtocols();
    expect(protocols).toHaveLength(0);

    const lookup = registry.getPlugin('test1');
    expect(lookup.ok).toBe(false);
  });

  it('fails to unregister a non-existent plugin', () => {
    const result = registry.unregisterPlugin('nonexistent');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('not registered');
    }
  });

  it('allows re-registering after unregister (hot-swap)', () => {
    registry.unregisterPlugin('test1');
    const result = registry.registerPlugin(mockPlugin2);
    expect(result.ok).toBe(true);

    const protocols = registry.listProtocols();
    expect(protocols).toHaveLength(1);
    expect(protocols[0]?.id).toBe('test2');
  });
});
