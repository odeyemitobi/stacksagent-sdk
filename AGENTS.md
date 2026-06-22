# StackAgent SDK — AGENTS.md

> This file is the engineering constitution for StackAgent SDK. It governs how
> humans and AI coding agents (Claude Code, Cursor, Antigravity, Codex, Devin, or any other
> agent operating in this repository) plan, write, review, and ship code here.
>
> If a request conflicts with this file, the agent should follow this file and
> flag the conflict rather than silently choosing one or the other.

---

## 1. Mission

Build production-grade, open-source infrastructure for AI-powered Bitcoin
Finance applications on Stacks.

StackAgent SDK is **not** a single application. It is the standard
infrastructure layer — Agent Runtime, Protocol Registry, Wallet Abstraction
Layer, Security Engine, and Developer SDK — that other teams build AI-powered
Bitcoin DeFi products on top of.

### 1.1 Non-Goals

- This is not a wallet product, an exchange, or a single consumer app.
- This is not a place to hardcode support for one protocol's quirks; protocol
  behavior belongs in the Registry, not scattered through the Runtime or SDK.
- Do not build speculative features outside of the defined roadmap unless explicitly instructed.
  Infrastructure projects rot when speculative generality is built before the
  primitives it depends on are stable.

---

## 1.2 Tools
https://docs.stacks.co/

## 2. Tech Stack & Version Policy

Use the **latest stable** release of every dependency at the time code is
written. Never pin to a deprecated, abandoned, or unmaintained package.
Before adding any new dependency, an agent must state in the PR description
why it's needed and confirm it is actively maintained (commits within the
last 6 months, no open critical CVEs).

| Layer | Stack |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Hook Form, Zod, Framer Motion |
| Backend | NestJS, PostgreSQL, Prisma, Redis |
| Blockchain | `@stacks/connect`, `@stacks/transactions`, `@stacks/network` |
| AI | OpenAI Responses API, Anthropic SDK |
| Testing | Vitest, Playwright, Clarinet (contracts) |
| Tooling | pnpm workspaces, Turborepo, Changesets, ESLint, Prettier |

Rules:

- TypeScript everywhere. `strict: true` in every `tsconfig.json`. No `any`.
  Use `unknown` plus narrowing, or generics, when the type is genuinely
  unknown at the call site.
- SOLID principles. Small, composable, reusable units over large
  do-everything modules.
- Self-documenting code: names explain intent. Comments explain *why*, not
  *what* — if a comment restates the code, delete the comment or rewrite the
  code.

---

## 3. Monorepo Conventions

### 3.1 Tooling

- **pnpm workspaces** for dependency management. Never mix package managers;
  `pnpm-lock.yaml` is the only lockfile committed.
- **Turborepo** for task orchestration and caching (`turbo.json` defines
  `build`, `lint`, `test`, `dev`, `typecheck` pipelines with correct
  `dependsOn` graphs so packages build before the apps that consume them).
- **Changesets** for versioning and changelogs across independently
  published packages.

### 3.2 Structure

```
apps/
  dashboard/        # Next.js demo dashboard — consumes packages, owns no business logic
  docs/             # Documentation portal (Next.js or dedicated docs framework)

packages/
  sdk/              # Public-facing SDK — the only package external consumers import directly
  runtime/           # Agent lifecycle, workflow execution, task orchestration
  registry/          # Protocol metadata, supported actions, contract references, risk profiles
  wallet/             # Wallet abstraction, authentication, signing
  security/           # Policy engine, risk engine, transaction simulation
  ui/                 # Shared shadcn/ui-based component library
  types/              # Pure TypeScript types/interfaces shared across packages — zero runtime deps
  config/             # Shared eslint/tsconfig/prettier/tailwind base configs

contracts/           # Clarity smart contracts (if/when on-chain logic is owned by this repo)
examples/            # Minimal, runnable, single-concept example apps
docs/                # Architecture notes, ADRs, RFCs (source content for apps/docs)
```

### 3.3 Naming

- Package names: `@stackagent/<package>` (e.g. `@stackagent/sdk`).
- Files: `kebab-case.ts` for modules, `PascalCase.tsx` for React components.
- Folders: `kebab-case`.
- Branches: `type/short-description` (e.g. `feat/policy-engine-allowlist`,
  `fix/nonce-race-condition`).
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`, `chore:`, `security:`). `security:` is its own type so
  security-relevant changes are searchable in history.

### 3.4 Per-Package Hygiene

Every package in `packages/` must have:

- `package.json` with `build`, `lint`, `test`, `typecheck` scripts.
- Its own `tsconfig.json` extending the shared base in `packages/config`.
- A `README.md` (see §11).
- No dependency on anything in `apps/`. Dependencies flow one direction:
  apps → packages, never the reverse.

---

## 4. Package Boundaries & Dependency Rules

Each package owns a single responsibility. An agent adding code must place it
in the package that owns that responsibility — not wherever is convenient.

| Package | Owns | Must NOT contain |
|---|---|---|
| `types` | Shared interfaces, enums, branded types | Any runtime logic or I/O |
| `registry` | Protocol metadata, supported actions, contract addresses, risk profiles | Wallet signing, execution logic |
| `wallet` | Connecting wallets, requesting signatures, account/network state | Business logic about *what* to sign |
| `security` | Policy engine, risk engine, transaction simulation, audit logging | UI, protocol-specific knowledge |
| `runtime` | Agent lifecycle, workflow/task orchestration, calling security + wallet + registry | Direct wallet signing, direct protocol calls — it orchestrates, it doesn't reach around the abstractions |
| `sdk` | Public API surface composing `runtime` + `registry` + `wallet` for external developers | Internal implementation details that aren't part of the public contract |
| `ui` | Presentational shadcn/ui-based components | Business logic, blockchain calls |

### 4.1 Dependency Graph Rules

- No circular dependencies between packages — enforced via
  `dependency-cruiser` or equivalent in CI.
- `types` depends on nothing else in the workspace.
- `security` does not depend on `ui` or `sdk`.
- `sdk` is the only package most external dependency graphs should ever
  touch; internal packages are implementation details and may be marked
  `private: true` if they should never be published independently.
- Public API surface of `sdk` is defined explicitly via a single
  `index.ts` barrel — anything not re-exported there is not public, even if
  technically importable.

---

## 5. TypeScript & Code Style Standards

- `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` all enabled.
- No `any`. No `// eslint-disable` for the `no-explicit-any` rule without a
  comment justifying it and a linked follow-up issue.
- Prefer `interface` for public object shapes (better error messages, can be
  extended); use `type` for unions, intersections, and mapped types.
- Exhaustive `switch` statements must end in a `default` branch that asserts
  `never`, so adding a new case anywhere in the codebase becomes a compile
  error everywhere it isn't handled.
- Expected failure paths (invalid input, policy rejection, simulation
  failure) return a typed `Result<T, E>`-style value rather than throwing.
  Reserve `throw` for truly exceptional, unrecoverable states.
- No default exports except for Next.js pages/layouts where the framework
  requires it.
- One exported "thing" of consequence per file where reasonable; co-locate
  small private helpers.

---

## 6. API Design Standards

### 6.1 SDK (`@stackagent/sdk`)

- Method naming: `verbNoun` (`createAgent`, `simulateExecution`,
  `listProtocols`), consistent across the whole public surface.
- Every public async method accepts an optional `AbortSignal`.
- Errors are typed subclasses of a single `StackAgentError` base, each with a
  stable `code` (e.g. `POLICY_REJECTED`, `SIMULATION_FAILED`,
  `INSUFFICIENT_BALANCE`) so consumers can branch on `error.code`, not on
  message text.
- No breaking changes to a public method's signature without a major version
  bump (Changesets) and a deprecation note in the changelog.

### 6.2 Backend (NestJS)

- REST, versioned under `/v1/...`. Breaking changes ship as `/v2/...`
  alongside the old version for a deprecation window, never as a silent
  in-place change.
- All inputs validated at the controller boundary with Zod or
  `class-validator` DTOs — never trust a request body past that boundary.
- Mutating endpoints that trigger on-chain execution require an
  `Idempotency-Key` header; repeated requests with the same key return the
  original result rather than re-executing.
- List endpoints are cursor-paginated, not offset-paginated, to stay stable
  under concurrent writes.
- Every endpoint that can trigger spending must pass through the full
  Security Flow in §7 before touching the wallet package — no shortcuts for
  "internal" or "trusted" callers.

---

## 7. Security Architecture

Security is the most important property of this codebase. When in doubt,
choose the more conservative, more auditable, more explicit option.

### 7.1 Key Management

- **Never** store private keys.
- **Never** store seed phrases.
- All signing happens in the user's connected wallet (via `@stacks/connect`).
  StackAgent SDK is non-custodial by construction — there is no code path
  where the backend or runtime holds key material, even transiently.

### 7.2 Security Flow (mandatory, in order, no skipping steps)

1. **Permission validation** — does this agent/user have permission to take
   this category of action at all?
2. **Policy validation** — does this specific action satisfy spending
   limits, allowlists/denylists, and time-based limits configured for this
   agent?
3. **Transaction simulation** — simulate the exact transaction and produce a
   human-readable diff of predicted state changes before anything is signed.
4. **Audit log creation** — write an immutable audit record *before*
   requesting a signature, not after, so attempted-but-rejected actions are
   still recorded.
5. **Approval workflow** — actions above a configured risk/value threshold
   require explicit human approval; this gate cannot be bypassed
   programmatically.
6. **Execution** — broadcast only after steps 1–5 pass, with the exact
   post-conditions shown to the user during simulation.

An agent implementing a new "agent action" must wire all six steps. A PR that
adds an execution path without all six is incomplete, not "fast-followed."

### 7.3 Policy & Risk Engine

- Policies are data, not code: stored in `policies`, evaluated by a generic
  policy engine in `@stackagent/security`. Adding a new policy type should
  not require new TypeScript logic in `runtime`.
- Risk profiles live in the Registry per-protocol (e.g. audit status, TVL,
  age, prior incidents) and feed into the risk engine's scoring — the
  runtime asks "what's the risk score" rather than knowing protocol details.

### 7.4 Transaction Simulation & Post-Conditions

- Every transaction submitted via `@stacks/transactions` must include
  explicit **post-conditions** that constrain exactly which assets may move
  and by how much. Submitting a transaction with no post-conditions, or with
  `PostConditionMode.Allow`, requires an explicit, logged justification.
- Simulation results (predicted balance changes, contract calls, fees) are
  shown to the user in the same UI step where they approve the action — not
  buried in a separate log.

### 7.5 Audit Logs

- Append-only. No update/delete path on `audit_logs` rows, enforced at the
  database level (revoke `UPDATE`/`DELETE` grants for the app role on that
  table, or use a trigger that rejects them).
- Every audit row records: actor (user/agent), action, inputs, policy
  decision, simulation result, outcome, and timestamp.

### 7.6 Secrets

- All secrets via environment variables, never committed. Every package/app
  that needs secrets ships a `.env.example` with placeholder values and a
  short comment on where to obtain real ones.

---

## 8. Stacks & Bitcoin-Specific Development Rules

- **Network configuration is explicit and never hardcoded.** Mainnet,
  testnet, and devnet are selected via config/env, and the active network is
  always visible in the UI (no silent fallback to mainnet).
- **Wallet connection** goes through `@stacks/connect`; support whichever
  wallets implement that standard (e.g. Leather, Xverse) rather than
  building bespoke integrations per wallet.
- **Nonce handling**: always fetch the account's current nonce before
  building a transaction; handle the case of a pending unconfirmed
  transaction (use the "next possible nonce," not just the last confirmed
  one) to avoid stuck/conflicting transactions.
- **Fee estimation**: always estimate and surface the fee before requesting
  a signature; never submit with a guessed flat fee.
- **Idempotent broadcasting**: guard against double-broadcasting the same
  transaction on retry — track broadcast attempts by a deterministic key
  (e.g. unsigned tx hash) before resubmitting.
- **sBTC specifics**: peg-in/peg-out flows have different finality
  characteristics than native STX transfers (Bitcoin-anchored finality vs.
  Stacks block finality). Any UI representing sBTC balances or transfers
  must reflect pending vs. confirmed state distinctly — never present a
  pending peg-in as a spendable balance.
- **No silent retries on signing failures.** A rejected or failed signature
  surfaces to the user; the agent does not loop and re-prompt without
  explicit user-initiated retry.

---

## 9. Smart Contract Guidelines (Clarity)

Applies to anything in `contracts/`.

- Clarity is decidable by design (no unbounded loops, no dynamic dispatch
  surprises) — lean into that. Avoid workarounds that try to simulate
  patterns from other VMs; write idiomatic Clarity.
- Every contract requires, before merge:
  - A short spec comment block at the top of the file describing purpose,
    invariants, and trust assumptions.
  - A full Clarinet test suite covering both expected and adversarial calls
    (wrong principal, insufficient balance, double-spend attempts on the
    same call).
  - A security checklist covering: principal/`tx-sender` checks on every
    state-mutating public function, explicit post-condition compatibility,
    trait conformance where the contract implements a shared interface, and
    checks for integer overflow/underflow on arithmetic.
- No upgradeable-contract pattern is introduced without a written migration
  plan reviewed separately from the feature PR.
- No new contract is deployed to mainnet without an external audit. This is
  a hard gate, not a recommendation.

---

## 10. Documentation Requirements

Every package and app must contain:

- **README.md** — what it is, install, quick start, link to API docs.
- **Examples** — at least one runnable example demonstrating the package in
  isolation, mirrored (or linked) in `examples/`.
- **API docs** — generated from TSDoc comments on every exported symbol;
  exported functions/classes without a doc comment fail CI lint.
- **Architecture notes** — a short `ARCHITECTURE.md` explaining the
  package's role in the system, its dependency boundaries (per §4), and any
  non-obvious design decisions.

`examples/` apps follow a strict "one concept per example" rule — an example
demonstrating agent creation should not also demonstrate custom policy
authoring; split it into two examples instead of one that does everything.

---

## 11. Testing Standards

- **Unit tests**: Vitest, co-located as `*.test.ts` next to the code they
  cover. Mock blockchain calls; unit tests never hit a real network.
- **Integration tests**: run against Stacks devnet (via Clarinet's devnet or
  an equivalent local environment), exercised separately from unit tests in
  CI.
- **E2E tests**: Playwright, covering `apps/dashboard` user flows including
  wallet connect, agent creation, and the full execution-with-approval flow.
- **Coverage**: minimum 80% across the repo. `packages/security` is held to
  a higher bar — target ~100% branch coverage, since this is the package
  where an untested branch is a security gap, not a missing feature.
- **Naming**: `describe('UnitOfWork')` / `it('does X when Y')` — test names
  should read as a sentence describing behavior, not implementation.
- Contract tests live alongside contracts and run via Clarinet's test
  runner, separately from the TS test suites.

---

## 12. CI/CD Workflows

Pipeline stages, in order, all required to pass before merge to `main`:

1. **Install** — `pnpm install --frozen-lockfile`.
2. **Lint** — ESLint + Prettier check across all packages.
3. **Typecheck** — `tsc --noEmit` per package via Turborepo.
4. **Unit test** — Vitest, with coverage thresholds enforced (§11).
5. **Build** — Turborepo build graph, packages before apps.
6. **E2E** (on PRs touching `apps/dashboard` or `packages/wallet`/`security`)
   — Playwright against a preview deployment or local build.
7. **Contract test** (on PRs touching `contracts/`) — Clarinet test suite.

On merge to `main`:

- **Changesets** determines version bumps and publishes changed packages.
- **Preview deployments** are generated for `apps/dashboard` and
  `apps/docs` on every PR; production deploys only from `main`.

No agent or human pushes directly to `main`. All changes land via PR with
the checks above green.

---

## 13. Code Review Rules

- PR description must state: what changed, why, and — for anything touching
  `security`, `wallet`, or `contracts/` — the security impact explicitly,
  even if the answer is "none, because X."
- UI-affecting PRs include before/after screenshots or a short clip.
- `packages/security` and `contracts/` require review from someone (or, in
  an AI-agent-assisted workflow, a second independent agent pass plus human
  sign-off) other than the original author — no self-approval on
  security-critical paths.
- A PR that adds a new public SDK method without doc comments, a test, and
  an example is not mergeable, regardless of how small it seems.
- Conventional Commit messages required; squash-merge with the PR title as
  the final commit message.

---

## 14. Performance Budgets

- **Dashboard (`apps/dashboard`)**: Core Web Vitals targets — LCP < 2.5s,
  INP < 200ms, CLS < 0.1 on a throttled mobile profile.
- **SDK bundle**: `packages/sdk` must remain tree-shakeable; no single
  top-level import should pull in unrelated subsystems. Track bundle size in
  CI and fail on regressions beyond an agreed threshold per release.
- **Backend API**: p95 latency budget defined per endpoint class (e.g. reads
  < 200ms, simulation calls < 1.5s acknowledging external RPC latency) and
  tracked via the audit/metrics pipeline.
- **Database**: no N+1 query patterns from Prisma — use `include`/`select`
  deliberately; flag any loop that issues a query per iteration in review.

---

## 15. Design System Guidelines

Visual and interaction design is inspired by Stripe, Linear, Vercel, and
Datadog: dense-but-calm information design, restrained color use, strong
typographic hierarchy, and confidence-inspiring micro-interactions (this
project is, after all, asking people to trust it with Bitcoin).

Requirements:

- **Responsive** across mobile, tablet, desktop breakpoints.
- **Accessible**: WCAG 2.1 AA minimum — keyboard navigation, focus states,
  sufficient contrast, semantic HTML under the shadcn/ui components.
- **Dark mode** as a first-class theme via CSS variables/Tailwind, not an
  afterthought bolted on with manual class overrides.
- **Enterprise-grade**: every screen that can move funds should make the
  current network (mainnet/testnet), simulated outcome, and risk level
  visually unambiguous before the user signs anything.

---

## 16. Database & Data Conventions

Core tables: `users`, `wallets`, `agents`, `executions`, `protocols`,
`policies`, `audit_logs`.

- Prisma schema is the single source of truth; no manual SQL migrations
  edited by hand in a way that diverges from `prisma migrate`.
- Every table has `createdAt`/`updatedAt`; tables representing user actions
  (`executions`, `audit_logs`) are insert-only — see §7.5.
- Soft-delete (`deletedAt`) over hard delete for anything that could matter
  to an audit trail (`agents`, `policies`); `audit_logs` itself is never
  deleted, soft or otherwise.
- Foreign keys enforced at the database level, not just application logic.

---

## 17. Roadmap Awareness

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | SDK + Registry + Runtime | ✅ COMPLETE |
| Phase 2 | Plugin System | ✅ COMPLETE |
| Phase 3 | Agent Marketplace | ✅ COMPLETE |
| Phase 4 | Institutional Treasury Automation | ✅ COMPLETE |
| Phase 5 | Smart Contracts (Clarity treasury vault) | IN PROGRESS |

We are building Phase 5. Code, APIs, and database schemas should not
preemptively bend themselves around imagined future requirements — extend
later, with real requirements in hand, rather than guessing now.

---

## 18. Rules of Engagement for AI Coding Agents

1. Read this file in full before generating code in this repository.
2. If a request is ambiguous about which package owns new logic (§4), ask
   before guessing.
3. Never weaken or skip a step of the Security Flow (§7.2) to make a feature
   "work" faster. If a step seems unnecessary for a given action, say so
   explicitly and ask for confirmation rather than omitting it silently.
4. Never add a new dependency without naming it and its justification in the
   PR description (§2).
5. Any change to `packages/security`, `packages/wallet`, or `contracts/`
   must update or add tests in the same change — not as a follow-up.
6. When a change is non-obvious (a security trade-off, a deviation from a
   convention in this file, a perf compromise), state the deviation and the
   reasoning explicitly in code comments or the PR description rather than
   leaving it for a reviewer to discover.
7. Prefer the smallest correct change that satisfies the requirement and
   this file's conventions over a larger, more "complete" change that
   wasn't asked for.
