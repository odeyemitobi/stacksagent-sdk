# Plugin Authoring Example

This example demonstrates how third-party protocol developers can author a custom plugin for the **StackAgent Plugin System**.

## What This Shows

1. **Define protocol metadata** — name, risk profile, supported actions, contract references.
2. **Extend `BasePlugin`** — implement `buildTransaction()` to construct an unsigned Stacks transaction with strict post-conditions.
3. **Register dynamically** — load the plugin into a `ProtocolRegistry` at runtime.

## Running

```bash
pnpm install
pnpm start
```

## Key Concepts

- **`BasePlugin`**: Abstract class from `@stackagent/registry` that standardizes error handling and provides `rejectUnsupportedAction()`.
- **`IPlugin`**: Interface from `@stackagent/types` defining the contract every plugin must fulfill.
- **`TransactionPayload`**: The return type of `buildTransaction()`, containing the unsigned `StacksTransactionWire` and its `PostCondition[]`.
- **Post-conditions are mandatory** — every plugin must define exactly which assets can move and by how much.
