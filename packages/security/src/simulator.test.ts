import { describe, it, expect, vi } from 'vitest';
import { TransactionSimulator, PluginResolver } from './simulator';
import { ExecutionIntent, IPlugin, TransactionPayload, ok, err } from '@stackagent/types';

/** Helper: creates a PluginResolver that returns the given plugin for any ID. */
function resolverOf(plugin: IPlugin): PluginResolver {
  return { getPlugin: () => ok(plugin) };
}

/** Helper: creates a PluginResolver that always fails lookup. */
function failingResolver(message: string): PluginResolver {
  return { getPlugin: () => err(new Error(message)) };
}

/** Helper: creates a fake plugin with a controlled buildTransaction response. */
function fakePlugin(
  overrides: Partial<IPlugin> & { buildResult: ReturnType<IPlugin['buildTransaction']> }
): IPlugin {
  return {
    protocol: { id: 'test', name: 'Test', description: '', website: '', contracts: {}, actions: [], riskProfile: { auditStatus: 'AUDITED', tvlUsd: 0, ageInDays: 0, priorIncidents: false } },
    buildTransaction: vi.fn().mockReturnValue(overrides.buildResult),
    ...overrides,
  };
}

describe('TransactionSimulator', () => {
  it('simulates an intent with valid amount and token parameters', async () => {
    const plugin = fakePlugin({
      buildResult: Promise.resolve(ok({
        transaction: {} as TransactionPayload['transaction'],
        postConditions: [],
        estimatedFee: 2500,
        humanReadableDiff: [{ asset: 'sBTC', amount: 500, direction: 'OUT' as const }],
      })),
    });
    const simulator = new TransactionSimulator(resolverOf(plugin));

    const intent: ExecutionIntent = {
      actionId: 'swap',
      protocolId: 'alex',
      parameters: { amount: 500, token: 'sBTC' },
      reasoning: 'Testing valid simulation',
    };

    const result = await simulator.simulate(intent);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
      expect(result.value.predictedFee).toBe(2500);
      expect(result.value.humanReadableDiff).toHaveLength(1);
      const diff = result.value.humanReadableDiff[0];
      expect(diff).toBeDefined();
      if (diff) {
        expect(diff.amount).toBe(500);
        expect(diff.asset).toBe('sBTC');
        expect(diff.direction).toBe('OUT');
      }
    }
    expect(plugin.buildTransaction).toHaveBeenCalledWith(intent);
  });

  it('uses the plugin-provided fee instead of a hardcoded value', async () => {
    const plugin = fakePlugin({
      buildResult: Promise.resolve(ok({
        transaction: {} as TransactionPayload['transaction'],
        postConditions: [],
        estimatedFee: 7777,
        humanReadableDiff: [],
      })),
    });
    const simulator = new TransactionSimulator(resolverOf(plugin));

    const intent: ExecutionIntent = {
      actionId: 'lend',
      protocolId: 'zest',
      parameters: {},
      reasoning: 'Testing fee passthrough',
    };

    const result = await simulator.simulate(intent);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.predictedFee).toBe(7777);
    }
  });

  it('passes plugin-generated diffs through without modification', async () => {
    const expectedDiffs = [
      { asset: 'STX', amount: 100, direction: 'OUT' as const },
      { asset: 'sBTC', amount: 50, direction: 'IN' as const },
    ];
    const plugin = fakePlugin({
      buildResult: Promise.resolve(ok({
        transaction: {} as TransactionPayload['transaction'],
        postConditions: [],
        estimatedFee: 3000,
        humanReadableDiff: expectedDiffs,
      })),
    });
    const simulator = new TransactionSimulator(resolverOf(plugin));

    const intent: ExecutionIntent = {
      actionId: 'swap',
      protocolId: 'alex',
      parameters: { amount: 100 },
      reasoning: 'Testing multi-diff passthrough',
    };

    const result = await simulator.simulate(intent);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.humanReadableDiff).toEqual(expectedDiffs);
    }
  });

  it('fails if parameters are not an object', async () => {
    const simulator = new TransactionSimulator(failingResolver('should not be called'));

    const intent: ExecutionIntent = {
      actionId: 'swap',
      protocolId: 'zest',
      parameters: null as unknown as Record<string, unknown>,
      reasoning: 'Testing invalid params',
    };

    const result = await simulator.simulate(intent);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Invalid parameters in ExecutionIntent');
    }
  });

  it('fails if the plugin is not found in the resolver', async () => {
    const simulator = new TransactionSimulator(
      failingResolver("Plugin for Protocol ID 'unknown' not found.")
    );

    const intent: ExecutionIntent = {
      actionId: 'swap',
      protocolId: 'unknown',
      parameters: { amount: 100 },
      reasoning: 'Testing unknown plugin',
    };

    const result = await simulator.simulate(intent);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('not found');
    }
  });

  it('fails if the plugin rejects the action', async () => {
    const plugin = fakePlugin({
      buildResult: Promise.resolve(err(new Error("Action 'stake' is not supported"))),
    });
    const simulator = new TransactionSimulator(resolverOf(plugin));

    const intent: ExecutionIntent = {
      actionId: 'stake',
      protocolId: 'alex',
      parameters: { amount: 100 },
      reasoning: 'Testing rejected action',
    };

    const result = await simulator.simulate(intent);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('not supported');
    }
  });
});

