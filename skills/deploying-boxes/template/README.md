# Guestbook — an Amp Box app starter

A small SvelteKit app that runs as a deployment on an Amp Box. Signed-in Amp users can leave
notes. It shows the two pieces an app with Amp login needs:

- **Sign in with Amp** (`src/lib/server/oauth.ts`, `src/lib/server/auth.ts`, `src/routes/auth/`):
  OAuth authorization code flow with PKCE, verified RS256 ID tokens, sealed HttpOnly session
  cookies, and refresh.
- **Box deployment** (`.amp/box.yaml`): how the app is built and run on the Box. The SQLite
  database lives in `AMP_DEPLOYMENT_DATA_DIRECTORY`, so it survives deploys.

There are no runtime dependencies: SQLite comes from `node:sqlite` and crypto from `node:crypto`.

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `AMP_OAUTH_CLIENT_ID` | `amp secrets set … --box … --deployment … --env` | Sign in with Amp client ID |
| `AMP_OAUTH_CLIENT_SECRET` | `amp secrets set … --box … --deployment … --secret` | Sign in with Amp client secret |
| `APP_SESSION_SECRET` | `amp secrets set … --box … --deployment … --secret` | ≥32 random characters; encrypts cookies |
| `DATABASE_PATH` | optional | Defaults to `$AMP_DEPLOYMENT_DATA_DIRECTORY/app.sqlite`, or `data/app.sqlite` locally |
| `AMP_OAUTH_REDIRECT_URI` | local `.env` only | Defaults to `<AMP_DEPLOYMENT_URL>/auth/callback` |
| `APP_ALLOWED_USER_IDS` | optional | Comma-separated Amp user IDs; empty allows all Amp users |

`PORT`, `AMP_DEPLOYMENT_URL`, `AMP_DEPLOYMENT_DATA_DIRECTORY`, and `NODE_ENV` are set by the Box.

## Commands

```sh
pnpm install
pnpm check   # svelte-check
pnpm test    # builds, then runs tests/*.test.mjs against the production build
pnpm dev     # local dev server; copy .env.example to .env first
```

## Where to change things

- Add pages under `src/routes/`. Everything except `/login`, `/health`, and `/auth/*` requires a
  session; see `src/hooks.server.ts`.
- Add tables and queries in `src/lib/server/db.ts`. The schema uses `CREATE TABLE IF NOT EXISTS`,
  so additive changes apply on the next deploy.
- Restrict who may use the app with `APP_ALLOWED_USER_IDS`. This never grants access to the Box.
