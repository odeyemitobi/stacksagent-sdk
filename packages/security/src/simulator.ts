import { ExecutionIntent, SimulationResult, IPlugin, Result, ok, err } from '@stackagent/types';

/**
 * Minimal interface so the simulator doesn't depend on the full ProtocolRegistry class.
 * Any object that can resolve a plugin by protocol ID satisfies this contract.
 */
export interface PluginResolver {
  getPlugin(id: string): Result<IPlugin, Error>;
}

export class TransactionSimulator {
  private readonly resolver: PluginResolver;

  constructor(resolver: PluginResolver) {
    this.resolver = resolver;
  }

  /**
   * Simulates the exact transaction based on an ExecutionIntent.
   * Defers to the Plugin System to generate the precise unsigned payload and post-conditions.
   */
  public async simulate(intent: ExecutionIntent): Promise<Result<SimulationResult, Error>> {
    try {
      if (typeof intent.parameters !== 'object' || intent.parameters === null) {
        return err(new Error('Invalid parameters in ExecutionIntent'));
      }

      // 1. Fetch the plugin from the injected resolver
      const pluginResult = this.resolver.getPlugin(intent.protocolId);
      if (!pluginResult.ok) {
        return err(pluginResult.error);
      }
      const plugin = pluginResult.value;

      // 2. Delegate transaction, post-condition, diff, and fee generation to the plugin
      const payloadResult = await plugin.buildTransaction(intent);
      if (!payloadResult.ok) {
        return err(payloadResult.error);
      }

      const payload = payloadResult.value;

      return ok({
        success: true,
        predictedFee: payload.estimatedFee,
        postConditions: payload.postConditions,
        humanReadableDiff: payload.humanReadableDiff,
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Unknown simulation error occurred'));
    }
  }
}

