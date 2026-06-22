/**
 * StackAgent SDK — Plugin Authoring Example
 *
 * This example demonstrates how a third-party protocol developer
 * would author a custom plugin for the StackAgent Plugin System.
 *
 * A plugin teaches StackAgent how to interact with a specific
 * Clarity smart contract by:
 *   1. Declaring protocol metadata (name, risk profile, actions).
 *   2. Implementing `buildTransaction()` to construct an unsigned
 *      Stacks transaction with strict post-conditions.
 */

import { Protocol, ExecutionIntent, TransactionPayload, Result, ok, err } from '@stackagent/types';
import { BasePlugin, ProtocolRegistry } from '@stackagent/registry';
import { makeUnsignedContractCall, Pc, uintCV } from '@stacks/transactions';

// ─── Step 1: Define Your Protocol Metadata ──────────────────────────────────

const velarProtocol: Protocol = {
  id: 'velar',
  name: 'Velar',
  description: 'Velar DEX — a decentralized exchange on the Stacks blockchain.',
  website: 'https://velar.co',
  contracts: {
    router: {
      address: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A',
      contractName: 'velar-router-v1',
    },
  },
  actions: [
    {
      id: 'swap',
      name: 'Swap',
      description: 'Swap one token for another via Velar DEX.',
    },
  ],
  riskProfile: {
    auditStatus: 'AUDITED',
    tvlUsd: 12_000_000,
    ageInDays: 365,
    priorIncidents: false,
  },
};

// ─── Step 2: Implement Your Plugin ──────────────────────────────────────────

class VelarPlugin extends BasePlugin {
  public readonly protocol = velarProtocol;

  public async buildTransaction(
    intent: ExecutionIntent
  ): Promise<Result<TransactionPayload, Error>> {
    // Guard: only support "swap" action
    if (intent.actionId !== 'swap') {
      return this.rejectUnsupportedAction(intent.actionId);
    }

    const amount = Number(intent.parameters['amount'] ?? 0);
    if (amount <= 0) {
      return err(new Error('Swap amount must be greater than zero.'));
    }

    // Build the unsigned contract call
    // NOTE: In production, you would use real function args and a real public key.
    const transaction = await makeUnsignedContractCall({
      contractAddress: this.protocol.contracts['router']!.address,
      contractName: this.protocol.contracts['router']!.contractName,
      functionName: 'swap-exact-tokens-for-tokens',
      functionArgs: [uintCV(amount)],
      network: 'mainnet',
      publicKey: '0000000000000000000000000000000000000000000000000000000000000000', // placeholder
      fee: 5000,
    });

    // Define strict post-conditions
    const postConditions = [
      Pc.principal('STX_ADDRESS_PLACEHOLDER').willSendEq(amount).ustx(),
    ];

    return ok({ 
      transaction, 
      postConditions,
      estimatedFee: 5000,
      humanReadableDiff: [
        { asset: 'STX', amount, direction: 'OUT' as const }
      ]
    });
  }
}

// ─── Step 3: Register and Use ───────────────────────────────────────────────

async function main(): Promise<void> {
  // Create a fresh registry and register our plugin
  const registry = new ProtocolRegistry();
  const plugin = new VelarPlugin();

  const registerResult = registry.registerPlugin(plugin);
  if (!registerResult.ok) {
    console.error('❌ Failed to register plugin:', registerResult.error.message);
    return;
  }
  console.log(`✅ Registered plugin: ${plugin.protocol.name}`);

  // List available protocols
  const protocols = registry.listProtocols();
  console.log(`📋 Available protocols: ${protocols.map(p => p.name).join(', ')}`);

  // Simulate an intent by building the transaction via the plugin
  const intent: ExecutionIntent = {
    actionId: 'swap',
    protocolId: 'velar',
    parameters: { amount: 1000, token: 'STX' },
    reasoning: 'User wants to swap 1000 micro-STX on Velar.',
  };

  const pluginResult = registry.getPlugin('velar');
  if (!pluginResult.ok) {
    console.error('❌ Plugin not found:', pluginResult.error.message);
    return;
  }

  const txResult = await pluginResult.value.buildTransaction(intent);
  if (!txResult.ok) {
    console.error('❌ Failed to build transaction:', txResult.error.message);
    return;
  }

  console.log('🔗 Transaction built successfully!');
  console.log(`   Post-conditions: ${txResult.value.postConditions.length} constraint(s)`);

  // Test unsupported action
  const badIntent: ExecutionIntent = {
    actionId: 'lend',
    protocolId: 'velar',
    parameters: {},
    reasoning: 'Attempt unsupported action.',
  };
  const badResult = await pluginResult.value.buildTransaction(badIntent);
  if (!badResult.ok) {
    console.log(`🚫 Correctly rejected: ${badResult.error.message}`);
  }
}

main().catch(console.error);
