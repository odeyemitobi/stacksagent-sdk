# Deploying the Dashboard (Vercel)

The dashboard is a static Next.js app. Production build:

```bash
pnpm --filter dashboard build
```

## Vercel project settings

| Setting | Value |
|---------|--------|
| Root directory | `apps/dashboard` |
| Build command | `cd ../.. && pnpm install && pnpm --filter dashboard build` |
| Output | Next.js default |
| Install command | `pnpm install` (from monorepo root if using root as project) |

**Recommended:** Set Vercel **Root Directory** to the repo root and override:

- **Build Command:** `pnpm --filter dashboard build`
- **Install Command:** `pnpm install --frozen-lockfile`

## Required environment variables

Set these in Vercel → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS=ST37H9QBWEG9NEC1Y9MW82YFH8Y4GB3SPTPSN38GG.treasury-vault-v2
```

## Important: API + CORS

The dashboard calls the NestJS API for agents, treasury, and marketplace. If you **only** host the frontend:

- Treasury, agents, and marketplace pages will show errors until the API is reachable.
- Set `CORS_ORIGIN` on the API to your Vercel URL (e.g. `https://your-app.vercel.app`).

For the **grant demo video**, a local stack (Docker + API + dashboard) is sufficient. Public hosting is optional for submission.

## Wallet connect on production

- Users must use a **testnet** wallet (Leather/Xverse) matching `NEXT_PUBLIC_STACKS_NETWORK`.
- Hiro balance fetch uses the public testnet API (no key required).
