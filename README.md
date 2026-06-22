# StackAgent SDK

**Open Infrastructure for AI-Powered Bitcoin Finance on Stacks**

StackAgent SDK is an open-source infrastructure framework that enables developers to build AI-powered Bitcoin Finance applications on the Stacks ecosystem.

There is no standard infrastructure for AI agents to safely interact with Bitcoin DeFi on Stacks. Every team building AI-powered finance on Stacks must solve wallet abstraction, policy enforcement, and transaction simulation from scratch. StackAgent SDK is the shared infrastructure layer that solves this once.

## Features

- **Agent Runtime**: Lifecycle, workflow execution, and task orchestration.
- **Protocol Registry**: Protocol metadata, supported actions, contract references, and risk profiles.
- **Wallet Abstraction Layer**: Wallet abstraction, authentication, and signing.
- **Security Engine**: Policy engine, risk engine, transaction simulation, and audit logging.
- **Developer SDK**: Public API surface composing runtime, registry, and wallet for external developers.
- **Treasury Automation**: Multi-sig style execution queue for agents.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start the dashboard
pnpm --filter dashboard dev
```

## Architecture

StackAgent SDK is built as a turborepo monorepo:

- `apps/dashboard`: Next.js demo dashboard
- `apps/api`: NestJS backend for execution orchestration
- `packages/sdk`: Public-facing SDK
- `packages/runtime`: Agent lifecycle and orchestration
- `packages/registry`: Protocol metadata and routing
- `packages/security`: Security engine and simulation
- `packages/wallet`: Wallet connection and abstraction
- `contracts/`: On-chain Clarity smart contracts

## Contributing

See `AGENTS.md` for our engineering constitution and development rules.

## License

MIT License
