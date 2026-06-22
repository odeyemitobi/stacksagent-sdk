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

      // 3. Perform actual on-chain simulation via Hiro API
      try {
        // We use any to bypass strict type checking for the mock transaction objects 
        // that might not implement serialize() natively in the demo.
        const txHex = (payload.transaction as any).serialize 
          ? (payload.transaction as any).serialize().toString('hex')
          : '00'; // fallback mock hex

        if (txHex !== '00') {
          const simulateRes = await fetch('https://api.testnet.hiro.so/v2/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction_hex: txHex }),
          });

          if (simulateRes.ok) {
            const simulateData = await simulateRes.json();
            if (simulateData.success === false) {
              return err(new Error(`Transaction simulation failed on-chain: ${simulateData.error}`));
            }
          }
        }
      } catch (simErr) {
        console.warn('Simulation network call failed, falling back to plugin prediction:', simErr);
      }

      return ok({
        success: true,
        predictedFee: payload.estimatedFee,
        postConditions: payload.postConditions,
        humanReadableDiff: payload.humanReadableDiff,
        stxCallParams: payload.stxCallParams,
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Unknown simulation error occurred'));
    }
  }
}

