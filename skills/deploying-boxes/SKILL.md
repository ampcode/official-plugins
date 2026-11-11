---
name: deploying-boxes
description: Deploys websites and tools as named deployments on an always-on Amp Box with `amp boxes deploy`, manages their secrets, sets a Box's daily run schedule and starts or stops it to save costs, renames a Box, shows its projected monthly cost, starts threads on a deployment's live release, makes a deployment private to the Box's owner or workspace, adds Amp's review widget to an app's pages, serves an app on the owner's own domain, and adds Sign in with Amp to an app, with a bundled SvelteKit starter. Use for first deploys, redeploys, adding another app to a Box, creating personal or workspace Boxes and choosing their size, running a Box only during certain hours, renaming a Box, failed or stuck Box deploys, live production work on a Box, building an app with Amp login, limiting who can open an app, adding the review or feedback widget to a Box app, or giving a Box app a custom domain or moving a thread portal's custom hostname to a Box. Boxes were formerly called perma-orbs.
metadata:
  feature: boxes
---

# Deploying to Boxes

A Box is an always-on Google Compute Engine machine owned by a user or a workspace. It runs one Amp runner and hosts several independently deployed apps, called deployments. Each deployment has its own repository, branch, port, secrets, data directory, and URL, `https://<deployment>--<namespace>.onamp.dev` or a hostname on one of the owner's custom domains. A router on the Box listens on port 8080 and sends each URL to its deployment's port.

A Box selector is `<namespace>/<box>`. The namespace picks the owner: the user's Amp username for a personal Box, or the name of a workspace the user belongs to for a workspace Box. `get_current_user_identity` returns the Amp username as `ampUsername`; never use a GitHub login instead. A user without an Amp username cannot create a personal Box until they have one: offer to choose one with the `manage_amp` settings key `username` (the user approves the name in a dialog, and it cannot be changed by an agent afterwards), or offer a workspace Box when they belong to a workspace that has Boxes. Choose the deployment name separately with `--name`. Deployment names share the owner's URL namespace, so a deployment name must not match any of the owner's Box names or a deployment on another of the owner's Boxes.

Boxes were called perma-orbs before they were renamed, with no compatibility aliases. `amp perma-orbs`, `.amp/perma-orb.yaml`, `.amp/perma-orb-deploy.json`, and `amp secrets --perma-orb` no longer work; use `amp boxes`, `.amp/box.yaml`, `.amp/box-deploy.json`, and `amp secrets --box`. Rename old files in a repository instead of keeping both. Hosted Apps and obelisks were removed too: `amp apps ...`, `.amp/obelisk.yaml`, and `amp secrets --app` no longer exist.

## Where work happens

- Develop, commit, push, and deploy from an ordinary orb thread on the app's repository. `amp boxes deploy` builds the release where it runs and only works on Linux x64; it refuses to run on macOS. If the CLI says this version builds on the Box and is no longer supported, run `amp update` and deploy again.
- Deploys use pushed Git code. The CLI shallow-clones the tip of the deployed branch into a temporary directory, builds there, and uploads the result. The Box unpacks it into a new release and switches to it; the Box never builds. Uncommitted or unpushed files never reach the Box, and the orb's `.amp/services.yaml` dev servers are unrelated.
- Start a thread on the Box only for live production work, such as reading service logs, inspecting or repairing live data, or an urgent fix to the running app. A live thread can change files and data for every deployment on the Box.

## Before deploying

- Run `amp boxes list` to check access and find existing Boxes. `amp --help` does not list `amp boxes`; run `amp boxes --help` to see its commands. If it reports that Boxes are not enabled for the account, tell the user; do not deploy somewhere else instead.
- Reuse an existing Box when one fits. One Box hosts many deployments, so add another app as a new deployment unless the user wants a separate Box, for example to keep its files and secrets apart from other apps.
- A Box costs credits for every minute it runs, separately from inference. Its size sets its CPU, memory, and price: `b1.tiny` (0.5 vCPU (bursts to 2), 2 GB), `b1.small` (1 vCPU (bursts to 2), 4 GB), `b1.medium` (2 vCPU, 8 GB), and `b1.large` (4 vCPU, 16 GB). `b1.tiny` suits a small internal tool or static site; a larger size is worth it only when the user's apps need the memory or CPU, such as heavy builds or several busy services; a Box's size cannot be changed later. A personal Box is paid by its owner, through the owner's workspace when they belong to one; a workspace Box is paid by the workspace. Creating one needs the orb minimum credit balance, and a Box whose payer has had no credits for 24 hours is stopped until credits return. Create a Box only with `manage_amp` topic `boxes`, operation `create`, as soon as the user wants one; never with `amp boxes create` or `amp boxes deploy --create`. Its dialogs let the user choose the owner and the size, show what each size costs their payer and who pays, and have the user confirm the name, so do not ask about these or quote prices in chat first. Pass a `name` that fits what the Box will host, and pass `namespace` or `size` only when the user already chose them. In a multiplayer thread, `manage_amp` creates only a Box owned by the thread's workspace, after the thread owner or a workspace admin allows it in a dialog; when the user wants a personal Box there, or `manage_amp` refuses, tell them they can create it from their own thread that is not multiplayer. A Box that is only needed part of the day can run on a schedule (see "Run on a schedule"); stopped time is free.
- Workspace Boxes (owned by a workspace namespace) need a paid workspace plan that allows service accounts. Their runner acts as a service account created for the Box and shared with the workspace, never as the member who created it. Every member can see the Box, deploy to it, and run threads on it, so keep nothing there a member should not see. Only the creator or a workspace admin can delete it. A workspace admin can turn off **Allow Users to Create Boxes**, which blocks new workspace Boxes and members' personal Boxes.
- The pilot limits how many Boxes each owner (each user and each workspace) can have and how many machines exist in total; when this was written the limits were 5 Boxes per owner and 50 machines overall. The server enforces the live limits, so trust its error over these numbers.
- Work from the app's Git checkout. A thread started from **New Box** on the web Boxes pages asks for a new Box and has no repository: ask what the user wants to host, and get that app's repository or create a new one before creating the Box. Deploy clones the checkout's HTTPS `origin`, or `--repo <https-url>`, with the Git credentials of the machine running the CLI. For a checkout without a remote, use `amp projects create --help` to choose the ownership and `--push` options for a new Amp-hosted repository.
- For a new app that needs Amp login, start from this skill's `template/` as described in `reference/sign-in-with-amp.md`.
- Read the app's start command and use its existing framework and package manager. The public HTTP server must listen on `0.0.0.0` at the `PORT` environment variable.

## Configure `.amp/box.yaml`

Put the production build and services in `.amp/box.yaml` on the deployed branch. For a new app, ship only what it runs: list everything the services need at runtime under `artifacts` and set `source: false`.

```yaml
build: pnpm install --frozen-lockfile && pnpm build
source: false
artifacts: [build, package.json]
services:
  web:
    command: node build/index.js
```

Replace these with the app's actual commands. Dependency-free apps may omit `build`.

- `build` runs in the temporary clone, with the orb's environment plus `AMP_DEPLOYMENT_URL`, `AMP_DEPLOYMENT_NAME`, `AMP_DEPLOYMENT_BOX`, and `CI=true`. It never sees deployment secrets, so read secrets at runtime, not at build time. A non-zero exit fails the deploy.
- With `source: false`, the release holds only the `artifacts`: no source and no Git history. Include runtime dependencies the build does not bundle, such as `node_modules` for packages listed under `dependencies`, and static files the app serves. Every service `cwd` must be inside an artifact. Threads on the Box still read and change the app's data, logs, and services, but code changes happen in an orb followed by a deploy. The release gets a generated `AGENTS.md` that tells those threads where the data and the source are, followed by the app folder's own `AGENTS.md`. Describe the app's data there, such as its tables and common changes, so live requests from the review widget can be handled as data changes. Keep what users add, such as list entries, in the data rather than in code.
- Without `source: false`, the release also holds the source and its Git history, so threads on the Box can change the running code: the whole build directory with `node_modules`, or, with `artifacts`, the tracked files plus the listed outputs. Keep an existing app's choice unless the user asks to change it. The packed release must be at most 1 GiB.
- Native Node addons (`*.node`) must be built with the Node major version the Box runs, which matches the orb's default Node. A release built with another major is refused.
- `services` must define at least one service. Each name is 1 to 32 lowercase letters, digits, and hyphens. Each service runs in a systemd unit that restarts when it exits and starts at boot. A service may set `cwd`, relative to the release, and extra `env` variables.
- Services run as the deployment's own Linux account (`ampd-...`), not as `user`. They cannot use sudo, cannot see `/home/user` or `/run/amp`, and cannot read other deployments' files. The release is read-only to them; they can write only under `AMP_DEPLOYMENT_DATA_DIRECTORY` and `HOME`. `node`, `npm`, and `pnpm` in `/usr/local/bin` work, but the Box's `amp` binary does not, so an app that needs a tool must install it as a dependency during `build`.
- Amp sets `PORT`, `AMP_DEPLOYMENT_URL`, `AMP_DEPLOYMENT_NAME`, `AMP_DEPLOYMENT_BOX` (`<namespace>/<box>`), `AMP_DEPLOYMENT_DATA_DIRECTORY`, and `NODE_ENV=production`. Services cannot override them.
- Store databases and uploads under `AMP_DEPLOYMENT_DATA_DIRECTORY` (`/home/user/deployments/<deployment-id>/data`). It survives redeploys but not deletion of the Box.
- Never put secrets in the YAML.

### Several apps in one repository

Each app is a folder with its own `.amp/box.yaml`; the repository root can be an app too. `build` runs in the app's folder, and service `cwd` and `artifacts` are relative to it. Run the first deploy of each app from inside its folder: `amp boxes deploy` deploys the nearest `.amp/box.yaml` and saves a target named after the folder, with the folder as `root`, in the root `.amp/box-deploy.json`. Later, `amp boxes deploy <target>` works from anywhere in the checkout, and plain `amp boxes deploy` inside the folder picks its target. The build sees only the app's folder and the files at the repository root, so list other folders it needs, such as shared workspace packages, under `include`, relative to the app's folder (`../../packages/ui`). Never write a dispatch script that picks the app from the deployment name.

Run the app's checks, then commit and push. Pushing does not deploy, and a request to prepare or push a change is not a request to deploy it.

## First deploy

From the checkout, run:

```sh
amp boxes deploy --on <namespace>/<box> --name <deployment>
```

- The Box must exist before the first deploy; create it as described in "Before deploying". If creating reports that Amp's Box capacity is full, the pilot is at its total machine limit, so tell the user. If it reports that the machine quota is reached, the owner is at the per-owner limit: deploy to an existing Box, or ask the user whether to delete a Box they no longer need, which destroys its data.
- Add `--branch <branch>` to deploy a branch other than the remote's default. `--port <port>` picks a specific local port; otherwise Amp allocates one starting at 3001.
- To add another app to the same Box, run the same command from that app's checkout or folder with a different `--name`.
- A deployment keeps the repository and folder it was first deployed from. To move it, for example into a monorepo, deploy from the new checkout or folder with `--move`; it keeps its URL, port, data, secrets, and privacy. Never undeploy and recreate a deployment to move it, because undeploy deletes its secrets and a new deployment gets a new data directory.

The command builds and uploads the release, has the Box unpack it, switches the deployment to it, restarts the services, waits for the port, and prints the deployment as JSON. A new Box starts its runner up to 30 seconds after creation, and the first deploy waits up to 3 minutes for it before publishing. Check `"status": "ready"` and `deployedCommitSHA`, then open its `url` and verify the real page or health endpoint. A listening port is not proof that the app works, and a successful push or exit code is not proof of a deployment. On redeploys, also check that existing data remains.

A successful deploy saves the target in `.amp/box-deploy.json`. Commit and push this non-secret file so later deploys and other checkouts reuse the Box, deployment name, and branch.

Report the deployment URL, the Box, the deployed commit, and what you verified. Tell the user the app keeps running after the thread ends, and that they can find it under **Boxes** in the sidebar.

## Secrets and environment variables

Deployment secrets need an existing deployment. For an app that needs secrets before it can start, run the first deploy (it may fail), set the secrets, then deploy again.

In an orb, Amp refuses `amp secrets set` and other CLI commands that change the owner's account, so set values with `manage_amp`:

- A secret: topic `secrets`, operation `set`, with `scope: box`, `box: <namespace>/<box>`, `deployment: <deployment>`, and `name`. For a value the user or a third party provides, omit `generated_value`; the user enters it in a masked dialog and it never enters the thread. For a value you generate, such as a session key, pass it as `generated_value`.
- A non-secret value: topic `environment_variables`, operation `set`, with the same scope fields plus `value`.
- `list` on either topic shows the names stored at that scope.

In a multiplayer thread, these work only on Boxes owned by the thread's workspace, and the thread owner or a workspace admin must allow each call in a dialog. Tell the user to expect those dialogs, and set values in as few calls as you can.

On the user's own machine, the CLI does the same:

```sh
amp secrets set <NAME> --box <namespace>/<box> --deployment <deployment> --secret --data-file <path>
```

Omit the deployment (`deployment` or `--deployment`) to set a Box value that every deployment on the Box receives. A deployment on a workspace Box also receives the workspace's secrets. Deployment values override Box values, which override workspace values; sibling deployments do not share values, so set an app's values on its deployment. Changes take effect on the next deploy. `amp secrets list` and `amp secrets history` take the same flags. Pass CLI values through a file or standard input, and never commit or print secret values.

## Private deployments

A deployment URL is public: anyone on the internet can open it. Add `--private` to `amp boxes deploy` so that only the Box's owner can open it, or, on a workspace Box, its current members. Visitors sign in to Amp in their browser and then land on the page they asked for; a visitor signed in to an account without access sees a page that names that account and asks them to sign in as the owner or a workspace member. Later deploys keep the setting, and `--public` makes the URL public again. The target in `.amp/box-deploy.json` records `"private": true`, so a new deployment of that target from a fresh checkout is private too. The change applies when the deploy starts, even if the deploy then fails.

- Use `--private` for personal tools, internal dashboards, and other apps only the owner or the workspace should reach. The app needs no code for it.
- A private URL does not tell the app who the visitor is. Add Sign in with Amp as well when the app needs the user's identity or per-user data.
- Requests without an Amp browser session, such as webhooks, API clients, and other servers, cannot reach a private URL. Keep such an app public and authenticate requests in the app.
- Check that `amp boxes deploy --help` lists `--private`; if it does not, run `amp update`.
- Verify with `amp boxes deployments <namespace>/<box>`, which shows `"private": true`, and with `curl -sI <deployment-url>`, which returns 303 to `https://ampcode.com/boxes/<box-id>/open`. Only the user's browser can check the signed-in page, so ask the user to open the URL.

## Review widget

Amp's review widget is a button on an app's pages: a visitor selects part of the page and writes a comment, and the comment starts an Amp thread that works on it, either on the Box (for changes to live data) or in an orb (for code changes). Add `--widget` to `amp boxes deploy` and Amp adds the widget to every page of the deployment; the app needs no script tag or code for it. Later deploys keep the setting, the target in `.amp/box-deploy.json` records `"widget": true`, and `--no-widget` removes the widget. Only named deployments can have it.

- On a private deployment the widget shows to everyone who can open the URL, since all of them have access to the Box.
- On a public deployment it starts hidden, and Cmd+. on a keyboard or three quick taps on a touch screen show it. Sending a comment asks the visitor to sign in to Amp and works only for the Box's owner or, on a workspace Box, its members.
- An app that already loads a project's feedback widget script (`<script src="https://ampcode.com/w/<client ID>.js">`) can keep it: on a deployment with `--widget`, that script leaves the page to the Box widget. Apps that load `/jellyware/widget.js` with `AMP_BOX` themselves keep working; `--widget` replaces that code, so remove it when turning the widget on.
- Check that `amp boxes deploy --help` lists `--widget`; if it does not, run `amp update`.

## Custom domains

A named deployment can serve at a hostname on its Box owner's own domain instead of its `onamp.dev` URL. Add `--domain <hostname>` to `amp boxes deploy`. The hostname must be the domain itself or one level below it, such as `example.com` or `app.example.com` for the domain `example.com`, and the domain must be Active on the Box owner's account: the user's for a personal Box, the workspace's for a workspace Box.

1. Run `amp domains list --workspace` (or `--user` for a personal Box) and look for the domain with status Active. If it is missing, `amp domains add <domain> --workspace` adds it and prints the DNS records to create; the user creates them at their DNS provider, and `amp domains check <domain> --workspace` rechecks. Certificates can take a while, so tell the user and deploy once the domain is Active. If adding the domain is refused for the account's plan, tell the user.
2. Deploy with `amp boxes deploy --domain <hostname>`. Later deploys keep the hostname, the target in `.amp/box-deploy.json` records `"domain"`, and `--no-domain` serves the app at its `onamp.dev` URL again.
3. Verify: `amp boxes deployments <namespace>/<box>` shows `"domain"` and a `url` on that hostname, `curl -sI https://<hostname>/` reaches the app, and `curl -sI https://<deployment>--<namespace>.onamp.dev/` returns 308 to the hostname.

Once the domain is set, the app has one origin. `AMP_DEPLOYMENT_URL` is the custom URL from the deploy that sets it, so an app that builds absolute links or callbacks from it needs no change. Private deployments, the review widget, and the app's pane in Amp work on the custom hostname. An app with Sign in with Amp needs a redirect URI on the new hostname on its OAuth client (see "Sign in with Amp").

### Move a hostname from a thread portal

A hostname a thread portal uses (`amp orb portal --hostname`) is refused until it is moved. Deploy the app once without `--domain`, verify it on its `onamp.dev` URL, then run `amp boxes deploy --domain <hostname> --take-over`. The hostname switches to the live app when the deploy starts, so people who have the link never reach an empty app; the thread portal stops answering on it. A deployment that has never been deployed cannot take a hostname, and a thread portal cannot take one back from a deployment. Before the move, replace the app's uses of the orb's portal URL, such as `$PUBLIC_URL`, with `AMP_DEPLOYMENT_URL`, and copy data the portal kept in the orb into the deployment with `amp boxes cp`.

Check that `amp boxes deploy --help` lists `--domain`; if it does not, run `amp update`.

## Sign in with Amp

Sign in with Amp is a separate OAuth client owned by an Amp workspace, not part of the deployment. Register a client whose redirect URI is under the deployment URL, store the client ID and secret as deployment secrets, and redeploy. A new deployment name, Box, or custom domain changes the URL, so update the redirect URIs to match. Any Amp account can sign in to such an app; to limit who can use it, make the deployment private or allow only listed users in the app, as the template does with `APP_ALLOWED_USER_IDS`.

In an orb, create the client with `manage_amp` topic `oauth_clients`, operation `create`. After the user approves in a dialog, it creates the client and stores its ID and secret on the deployment without returning the secret. When the app calls the Amp API for the signed-in user, such as listing the workspace's members, pass the Amp API scopes it needs in `scopes`, such as `amp.api:workspace.members:view`, and have the app request them when it sends the user to sign in. Operation `update` changes its redirect URIs or scopes. `scripts/configure-sign-in.sh` does the same with the CLI and runs only on the user's own machine.

Read `reference/sign-in-with-amp.md` before adding it. It covers the bundled `template/` (a tested SvelteKit starter), registering the client, manual setup, and verification.

## Redeploy

Push the new code, then run `amp boxes deploy`. With several saved targets, run `amp boxes deploy <target>`; never guess which target the user means. To add a named target, pass it with the first deploy for that target, for example `amp boxes deploy staging --on <namespace>/<box> --name site-staging --branch develop`. Explicit flags override the saved target and are saved only after a successful deploy.

If the deployment's services do not listen on the port after the switch, or anything else fails or the deploy is interrupted before it is published, the deploy switches back to the previous release, which keeps serving, and fails. The Box keeps the live release and the two before it.

A deploy is refused, with nothing changed, when it would drop changes made in the live release, usually by a thread on the Box: tracked files with uncommitted changes (the refusal lists them), or a commit made there that the deployed branch does not contain (the refusal names it). Never discard live changes to make a deploy pass; reconcile them with the user:

- To keep them, get them committed in the live release and pushed to the deployed branch, then redeploy. A pushed commit passes even when later commits are on top of it.
- To drop them, get the user's explicit agreement, run the `amp boxes exec ... 'git reset -q --soft <commit> && git read-tree --reset -u <tree>'` command the refusal prints, which resets the live release to what it shipped, then redeploy.

If the refusal instead says the files "differ from what was deployed", the local CLI is outdated: run `amp update` and deploy again.

## Investigate a failed or stuck deploy

- If a deploy or `amp boxes exec` fails because the Box is stopped, its message says why (its schedule, someone stopped it, or its payer ran out of credits). Do not change or clear the user's schedule to get around it. Ask the user whether to run `amp boxes start <namespace>/<box>`, wait about a minute, and retry.

- Run `amp boxes deployments <namespace>/<box>` to see each deployment's status, error, ID, port, and deployed commit.
- Run one deploy of a deployment at a time; a second deploy or an undeploy is refused while an attempt is active. Ctrl+C cancels a running deploy: it stops after the current step, switches back to the previous release if the Box already switched, and records the attempt as failed; a second Ctrl+C exits at once. A deploy whose CLI was killed stops blocking about 2 minutes after the CLI last checked in, and the refusal says how long is left. To end a deploy sooner, including one still running elsewhere, run `amp boxes cancel-deploy <namespace>/<box> <deployment>`.
- After a CLI update, a deploy restarts the Box's runner into the new version and waits up to 3 minutes for it before publishing. If it still fails with `box-runner-not-ready`, run it again.
- `amp boxes exec <namespace>/<box> --deployment <deployment> '<command>'` runs a command as `user` in that deployment's live release for at most 60 seconds, without the deployment's environment variables.
- Service units are named `amp-box-deploy-<deployment-id>-svc-<service>.service`. Read their logs with `sudo journalctl -u <unit> -n 200 --no-pager`.

## Run on a schedule

A Box runs all the time unless it has a daily run window. Outside the window Amp stops the VM, and the payer pays only while it runs. The disk and data are kept, but deployments stop serving, the runner goes offline, and threads on the Box stop until it starts again. Set a schedule only when the user asks for one or agrees to it.

```sh
amp boxes schedule <namespace>/<box> --on 05:00 --off 23:00 --tz Europe/Berlin
amp boxes schedule <namespace>/<box> --clear
amp boxes stop <namespace>/<box>
amp boxes start <namespace>/<box>
```

- `--on` and `--off` are 24-hour local times in the IANA time zone `--tz`, so the window follows daylight saving time. Use the user's own time zone; an orb's clock is UTC, so ask the user when you do not know theirs. An `--off` earlier than `--on` runs overnight. There is one window per Box, the same every day.
- A new schedule applies within a minute: a Box outside its window stops right away. Clearing the schedule starts a Box the schedule stopped, and it then runs all the time.
- `stop` and `start` act at once and hold until the schedule's next start or stop, so a Box started at night runs until the next stop time. Starting takes about a minute before deploys and `amp boxes exec` work again. A Box stopped because its payer ran out of credits starts only after credits are added.
- At a scheduled stop, Amp waits up to 30 minutes for running threads and deploys on the Box, then stops it anyway.
- For a workspace Box, only its creator or a workspace admin can set the schedule or start and stop it.
- `amp boxes show <namespace>/<box>` and `amp boxes list` return `schedule` (`start`, `stop`, `timeZone`, `nextStart`, `nextStop`) and `stopped` (`reason` is `schedule`, `manual`, or `credits`; null while it runs). Report the next start and stop in the user's time zone.
- In a thread without a shell, such as Puck, use `manage_amp` with topic `boxes` instead: operations `list`, `set-schedule` (`box`, `start`, `stop`, `time_zone`), `clear-schedule`, `start`, and `stop`, with the same rules.
- Each Box's page under **Boxes** shows, in its About panel, the schedule, the Box's size, why the Box is stopped, this month's charges, and the cost projected for the month under the schedule. Its menu lets a manager choose **Start Box** or **Stop Box**; the page does not edit the schedule. Point the user there for the projected cost.

## Run app commands and move files

Use these for one-off production tasks such as a migration, a data import, or a database restore. Check that `amp boxes --help` lists `cp`; otherwise run `amp update`.

- `amp boxes exec <namespace>/<box> --deployment <deployment> --as-app -- <command> <args>` runs a command the way the deployment's services run: as its `ampd-...` account, in its live release (or as `user` in `repo` for a deployment built on the Box that has not been redeployed since), with its secrets and environment variables as of the last deploy, and with the same sandbox (read-only release, writable `AMP_DEPLOYMENT_DATA_DIRECTORY` and `HOME`, no sudo). It stops after 60 seconds unless you pass `--timeout <seconds>` (at most 3600), and its output and errors arrive together on standard output. Pass one quoted string instead of words after `--` to use shell syntax. Never make the command print secret values.
- `amp boxes cp <local-file> <namespace>/<box>:<path> --deployment <deployment>` copies a file of up to 10 GiB into the deployment's data directory; `<path>` is relative to it, and a path ending in `/` keeps the file's name. Copied files belong to the deployment's account, so both the app and threads on the Box can read and write them. Swap the arguments to copy a file out. Without `--deployment`, Box paths are relative to `/home/user/workspace`. Copy a directory as a tar archive.

For example, to restore a Postgres dump into the app's database:

```sh
amp boxes cp ./crm.dump <namespace>/<box>:crm.dump --deployment <deployment>
amp boxes exec <namespace>/<box> --deployment <deployment> --as-app --timeout 1800 'pg_restore --no-owner --no-acl -d "$DATABASE_URL" "$AMP_DEPLOYMENT_DATA_DIRECTORY/crm.dump"'
```

App commands can use tools installed on the Box and in the release, such as `node_modules/.bin`; the example needs `pg_restore` on the Box.

## Start a thread on a live deployment

In the web app, open **Boxes** in the sidebar (`https://ampcode.com/boxes`), open the Box, choose **New Thread in <deployment>** on the deployment's row (with a mouse, it appears when the pointer is over the row), and confirm the live-access warning with **Start Thread**. Amp selects the Box's runner and the deployment's live release. **New Thread on Box** in the Box's title bar starts a thread on the whole machine instead.

From an agent, call `list_runners` and pick the Box's runner (its ID is `box-<box-id>`; use the ID exactly as returned). Call `create_thread` with `executor: "runner"`, that runner ID, and `working_directory` set to the deployment's `workingDirectory` from `amp boxes deployments`, which is `/home/user/deployments/<deployment-id>/current`. If those tools are unavailable, direct the user to the web app.

- The thread opens in the code that is running, with its Git history. Services pick up edits only when they restart. Uncommitted edits and commits not pushed to the deployed branch block the next deploy until reconciled as described under "Redeploy".
- The thread runs as `user` and can read and write each deployment's data directory and `home` without sudo. A file created after the last deploy, such as a new SQLite database, may stay writable only by whoever created it, the app or the thread, until the next deploy; redeploy, or use sudo, when the other side needs to write it.
- The thread does not get deployment secrets in its environment. They are in the deployment's `environmentFile`; never print them.

## Rename a Box

`amp boxes rename <namespace>/<box> <new-name>` renames a Box within its namespace. Only its owner, or for a workspace Box its creator or a workspace admin, can rename it. The Box keeps its deployments with their URLs, data, and secrets, its runner, schedule, and threads. The old name is free at once and does not redirect, and a Box cannot move to another namespace. The new name must not match another of the owner's Boxes or deployments, and a rename is refused while a deploy runs. If `amp boxes --help` does not list `rename`, run `amp update`.

Run it from the app's checkout. It rewrites the targets in `.amp/box-deploy.json` that named the old Box and lists other files that still name it, such as `AMP_BOX` for the review widget; update those, then commit and push. Each app sees the new name in `AMP_DEPLOYMENT_BOX` after its next deploy.

## Remove deployments and Boxes

- `amp boxes undeploy <namespace>/<box> <deployment> --yes` stops one deployment and removes its URL and stored secrets. Its releases and data stay on disk.
- `amp boxes delete <namespace>/<box> --yes` destroys the Box with every deployment's data and secrets. Run it only when the user explicitly agrees to lose that data, never to recover from a failed deploy.
