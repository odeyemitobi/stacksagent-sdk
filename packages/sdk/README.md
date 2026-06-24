# @stackagent/sdk

Public-facing SDK for StackAgent — the only package external developers should import directly.

## Install

```bash
pnpm add @stackagent/sdk
```

(In this monorepo: `"@stackagent/sdk": "workspace:*"`)

## Quick Start

```typescript
import { StackAgentClient, NetworkMode, PolicyRejectedError } from '@stackagent/sdk';

const client = new StackAgentClient({ networkMode: NetworkMode.Testnet });

// Create an agent
const agent = await client.createAgent({
  name: 'Yield Agent',
  role: 'Treasury Manager',
  allowedProtocols: ['alex', 'zest'],
});

// List supported protocols
const protocols = client.listProtocols();

// Run policy + simulation locally before signing
try {
  const result = await client.proposeExecution(
    {
      actionId: 'swap',
      protocolId: 'alex',
      parameters: { amount: 500 },
      reasoning: 'Swap STX on ALEX',
    },
    [
      { id: 'pol-1', type: 'ALLOWLIST', parameters: { protocols: ['alex'] } },
      { id: 'pol-2', type: 'APPROVAL_THRESHOLD', parameters: { thresholdAmount: 100 } },
    ],
  );
  console.log(result.simulation.humanReadableDiff);
} catch (err) {
  if (err instanceof PolicyRejectedError) {
    console.error('Blocked by policy:', err.message);
  }
}
```

## Public API

| Method | Description |
|--------|-------------|
| `createAgent(config)` | Create and persist a new agent |
| `getAgent(id)` | Retrieve agent by ID |
| `listAgents()` | List all agents |
| `listProtocols()` | List registered protocol metadata |
| `getProtocol(id)` | Get protocol by ID |
| `proposeExecution(intent, policies)` | Policy check + simulation |
| `simulateExecution(intent)` | Simulation only |
| `connectWallet(options)` | Connect via `@stacks/connect` |
| `signContractCall(options)` | Sign a contract call |

## Errors

All errors extend `StackAgentError` with a stable `code`:

- `POLICY_REJECTED`
- `SIMULATION_FAILED`
- `AGENT_NOT_FOUND`
- `PROTOCOL_NOT_FOUND`
- `WALLET_CONNECTION_FAILED`

## Examples

See `examples/agent-creation` and `examples/policy-engine` in the repo root.
