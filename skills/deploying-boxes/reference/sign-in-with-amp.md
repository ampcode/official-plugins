# Sign in with Amp

Sign in with Amp is optional and is not part of a deployment. It is an OAuth client owned by an Amp workspace. The starter in `template/` and the helper in `scripts/configure-sign-in.sh` sit next to `SKILL.md` in this skill's directory.

## Start a new app from the template

The template is a small SvelteKit guestbook with Sign in with Amp, a `node:sqlite` database, and a `.amp/box.yaml`. Copy it out of the skill directory, including dotfiles:

```sh
mkdir <dir> && cp -R "<skill-dir>/template/." <dir>/ && cd <dir>
git init -b main && pnpm install && pnpm check && pnpm test
```

`pnpm test` builds the app and runs `tests/*.test.mjs` against the production build with a mocked Amp. All tests must pass before a deploy. Commit `pnpm-lock.yaml` whenever it changes; the deploy builds with `--frozen-lockfile`.

| Path | Role |
| --- | --- |
| `src/lib/server/oauth.ts`, `auth.ts`, `src/routes/auth/*` | Sign in with Amp: PKCE, verified RS256 ID token, sealed HttpOnly cookies, refresh |
| `src/hooks.server.ts` | Requires a session except for `/login`, `/health`, and `/auth/*`; blocks cross-origin form posts |
| `src/lib/server/db.ts` | SQLite at `$AMP_DEPLOYMENT_DATA_DIRECTORY/app.sqlite`, schema created on start |
| `.amp/box.yaml` | Build command and `web` service |
| `tests/app.test.mjs` | Anonymous routing, OAuth URL shape, callback state check, per-user notes, CSRF |

Then:

1. Rename the app: `"name"` in `package.json`, the `<title>` and `<h1>` in `src/routes/+page.svelte` and `src/routes/login/+page.svelte`, and the heading in `README.md`. Keep the auth and database modules.
2. Commit, give the repository an HTTPS remote, and push. For a new repository, `amp projects create --push` creates an Amp-hosted repository and an Amp project for it. Run `amp projects create --help` to choose the ownership options.
3. Run the first deploy as described in `SKILL.md`. Without credentials the app still starts: `/health` returns `{"ok":true}`, `/` redirects to `/login`, and the login page says Sign in with Amp is not configured yet.

## Register Sign in with Amp

Creating a Sign in with Amp client needs workspace admin in the workspace that will own the client. Users who sign in to the app do not need to belong to that workspace. If the user is not an admin of any workspace, stop and tell them; use "Manual credentials" only with a client someone else created.

After the first deploy, run:

```sh
bash "<skill-dir>/scripts/configure-sign-in.sh" <namespace>/<box> <deployment> <workspace>
```

The script checks that the deployment exists, creates a `server` (confidential) OAuth client whose redirect URI is `https://<deployment>--<namespace>.onamp.dev/auth/callback`, and stores three deployment variables: `AMP_OAUTH_CLIENT_ID` (env), `AMP_OAUTH_CLIENT_SECRET` (secret), and a generated `APP_SESSION_SECRET` (secret). It prints only the client ID, redirect URI, and manage URL. For a deployment with a custom domain, pass its `url` from `amp boxes deployments` as a fourth argument. Never print, log, or paste the client secret; Amp cannot show it again. If the script fails after it created the client, do not create a second client; finish with "Manual credentials".

Check `amp secrets list --box <namespace>/<box> --deployment <deployment>` shows the three names, then redeploy with `amp boxes deploy` so the service receives them.

### Manual credentials

Create the client at `https://ampcode.com/workspaces/<workspace>/applications` (server-side web app, redirect URI exactly `<deployment url>/auth/callback`, using the `url` from `amp boxes deployments`). Store values from files or standard input so they never appear in a command line or transcript:

```sh
printf '%s' '<client id>' | amp secrets set AMP_OAUTH_CLIENT_ID --box <namespace>/<box> --deployment <deployment> --env --data-file -
amp secrets set AMP_OAUTH_CLIENT_SECRET --box <namespace>/<box> --deployment <deployment> --secret --data-file <file>
head -c 48 /dev/urandom | base64 | tr -d '\n' | amp secrets set APP_SESSION_SECRET --box <namespace>/<box> --deployment <deployment> --secret --data-file -
```

### Existing apps and changed URLs

- An app not built from the template needs the same flow. Use `template/src/lib/server/oauth.ts` as the reference: issuer `https://auth.ampcode.com` with its `/oauth2/authorize`, `/oauth2/token`, and `/oauth2/jwks` endpoints, PKCE with S256, scopes `openid profile email offline_access`, and `resource=https://ampcode.com/api/v2`. Amp accepts the access token only when that resource was requested. Verify the ID token, keep tokens on the server, and refresh them.
- The redirect URI must match the deployment URL exactly. A new deployment name, Box, or custom domain changes the URL; the `onamp.dev` URL of a deployment with a custom domain redirects to it, so register only the custom one. Update the client with `amp oauth-clients edit <id> --workspace <workspace> --redirect-uri <uri>`, which replaces the list, so repeat `--redirect-uri` for every URI to keep. `amp oauth-clients list --workspace <workspace>` shows names and IDs only, and fails without `--workspace`. To see a client's redirect URIs, use `manage_amp` with topic `oauth_clients` and operation `list` where it is available, or the workspace's applications page at `https://ampcode.com/workspaces/<workspace>/applications`.
- For local development, copy `.env.example` to `.env` and add `http://localhost:3000/auth/callback` as an additional redirect URI on the same client. Keep the production URI first.
- Undeploying or deleting a Box does not delete the OAuth client.

### Verify sign-in

First check what you can without the user's session. Request `<deployment-url>/auth/signin` without a session (`curl -sI`) and confirm the `Location` header goes to `https://auth.ampcode.com/oauth2/authorize` with the registered `client_id`, the `redirect_uri` registered on that client, and `resource=https://ampcode.com/api/v2`. Confirm `amp secrets list --box <namespace>/<box> --deployment <deployment>` shows the credential names. Then ask the user to open the deployment URL, click "Sign in with Amp", approve the consent screen, and confirm they land back on the app signed in. Only a browser with the user's own Amp session can do this; do not try it with the agent's credentials.
