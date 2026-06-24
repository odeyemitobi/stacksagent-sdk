# StackAgent SDK

**Open infrastructure for AI-powered Bitcoin Finance on Stacks**

StackAgent SDK is the shared infrastructure layer for building AI agents that safely interact with Bitcoin DeFi on Stacks — wallet abstraction, policy enforcement, transaction simulation, human approval workflows, and audit logging.

> **Status:** Working prototype (MVP). Core packages and a demo dashboard are functional on Stacks testnet. See [Grant Demo](#grant-demo) below.

## Features

- **Agent Runtime** — LLM-powered task parsing into structured `ExecutionIntent`s
- **Protocol Registry** — Plugin system for ALEX, Zest, and custom protocols
- **Security Engine** — Policy evaluation (allowlist, spending limits, approval thresholds) + simulation
- **Wallet Layer** — Non-custodial connect/sign via `@stacks/connect`
- **Treasury Automation** — Approval queue with on-chain signing through a Clarity vault
- **Developer SDK** — `@stackagent/sdk` public API composing runtime, registry, security, and wallet
- **Agent Marketplace** — Publish and clone agent templates

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run unit tests
pnpm test
```

### Local Demo (Dashboard + API)

```bash
# 1. Start PostgreSQL (Docker)
docker compose up -d

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env.local

# 3. Seed database + start API (terminal 1)
pnpm --filter api seed
pnpm --filter api start:dev

# 4. Create a demo pending approval (terminal 2)
pnpm --filter api demo:propose

# 5. Start dashboard (terminal 3)
pnpm --filter dashboard dev
```

Open `http://localhost:3000`, connect a Stacks testnet wallet (Leather/Xverse), and approve the execution under **Treasury**.

## Architecture

```
packages/
  types/       Shared interfaces (Result<T,E>, policies, intents)
  registry/    Protocol plugins (ALEX, Zest)
  security/    Policy engine + transaction simulator
  runtime/     Agent lifecycle + OpenAI orchestration
  wallet/      @stacks/connect wrappers
  sdk/         Public API for external developers

apps/
  api/         NestJS REST API (agents, executions, marketplace)
  dashboard/   Next.js demo UI
  docs/        Documentation portal

contracts/     Clarity treasury vault (Phase 5)
```

## SDK Usage

```typescript
import { StackAgentClient, NetworkMode } from '@stackagent/sdk';

const client = new StackAgentClient({ networkMode: NetworkMode.Testnet });

const agent = await client.createAgent({
  name: 'Treasury Bot',
  role: 'Treasury Manager',
  allowedProtocols: ['alex', 'zest'],
});

const protocols = client.listProtocols();

const result = await client.proposeExecution(
  {
    actionId: 'swap',
    protocolId: 'alex',
    parameters: { amount: 50 },
    reasoning: 'Rebalance treasury',
  },
  [{ id: 'pol-1', type: 'ALLOWLIST', parameters: { protocols: ['alex'] } }],
);
```

## Grant Demo

This project targets the [Stacks Endowment Getting Started grant](https://stacksendowment.co/grants-docs/getting-started-program-track).

**Full application draft:** [docs/grant-application-getting-started.md](docs/grant-application-getting-started.md)  
**Dashboard hosting:** [apps/dashboard/DEPLOY.md](apps/dashboard/DEPLOY.md)

The demo path:

1. **Agent** proposes a high-value DeFi intent via the security pipeline
2. **Policy engine** flags it for human approval (threshold exceeded)
3. **Simulator** produces a human-readable diff via registry plugins
4. **Dashboard** shows the pending execution with network + fee visible
5. **Wallet** signs the treasury vault contract call on testnet
6. **API** verifies the on-chain transaction before marking broadcasted

## Contributing

See `AGENTS.md` for engineering conventions.

## License

MIT License
