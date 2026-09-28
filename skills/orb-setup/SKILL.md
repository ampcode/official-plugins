---
name: orb-setup
description: "Prepare a repository to run in Amp orbs. Use when creating or updating .agents/setup, .agents/resume, or a project's pre-setup script, or when debugging orb environment setup."
---

# Orb Setup

Prepares a repository to run well in Amp orbs (Amp's cloud sandboxes) by creating or updating
its orb lifecycle files. See https://ampcode.com/docs/orbs for the authoritative reference.

## Lifecycle Files

| File | When it runs | Purpose |
|------|--------------|---------|
| Project pre-clone script | Before Amp clones or updates repositories | Install prerequisites required for repository access |
| Project pre-setup script | Immediately before `.agents/setup` whenever setup runs | Install prerequisites when setup cannot be committed to the repository |
| `.agents/setup` | Once for a fresh orb unless Amp activates an exact project snapshot | Install toolchains, dependencies, databases, and other prerequisites |
| `.agents/resume` | After initial activation and every time an orb wakes, before Amp continues | Fast, idempotent authentication, reconnect, or repair steps |

Key invariants:

- For a fresh project orb without a cached snapshot, Amp creates the orb from its base template,
  runs `.agents/setup`, snapshots the configured orb, and starts work from that fresh snapshot.
  Amp may reuse the snapshot for new orbs for up to 72 hours.
- Project pre-clone and pre-setup scripts are stored in project settings, outside the repository.
  Pre-clone runs from `/home/user/workspace` before any repository exists; use it only for clone
  prerequisites. Pre-setup runs immediately before `.agents/setup` whenever setup runs. Read both
  with `amp projects get <project>`, or update them with `amp projects update <project>
  --pre-clone-script-file <path>` and `--pre-setup-script-file <path>`. Changing either script
  changes the snapshot identity, so the next new orb reruns setup with the new script; do not tell
  the user to clear the snapshot.
- An exact project snapshot skips setup. A stale snapshot preserves installed packages and caches,
  but Amp updates the repository and runs setup again before starting work. Setup must therefore
  be non-interactive, idempotent, and fast on a warm filesystem.
- If an exact snapshot itself is broken, inspect it with `amp projects snapshots list <project>`.
  Delete one size with `amp projects snapshots delete <project> --resource <size>`, or omit
  `--resource` to delete every snapshot for the project. Do not delete snapshots only to apply a
  normal setup script change.
- Amp stops `.agents/setup` after 20 minutes and continues startup without it. A separate executor
  connection warning appears after 5 minutes even if setup is still running. Treat 20 minutes as a
  failure limit, not a target. Aim to finish in under 2 minutes.
- A failed or timed-out setup prevents publication of a refreshed project snapshot, so later fresh
  orbs may repeat the same expensive setup.
- Setup output can be reused across project members and threads. Never authenticate a user or
  thread service during setup. Install its client in setup and authenticate it during resume.
- Amp runs `.agents/resume` after initial activation and whenever an existing paused orb wakes.
- Amp waits at most 10 seconds for `.agents/resume`. If it is still running, Amp continues and
  leaves it running. Keep it fast and idempotent; never install dependencies there. If it exits
  non-zero within the window, Amp surfaces the failure.
- Both scripts must be committed with the executable bit set: `chmod +x .agents/setup .agents/resume`.
- Orbs are ephemeral Debian 12 sandboxes. Install system packages with
  `apt-get install -y`. Tune databases for speed over durability (e.g. Postgres
  `fsync = off`, `synchronous_commit = off`).

## Workflow

Choose where setup lives before writing files. If the user asks to avoid committing Amp-specific
files or avoid repository changes, follow the project-setting path below and skip steps 2–6.

### Project-setting path: no committed Amp files

- Investigate the repository as described in step 1.
- Find the project ref with `amp projects list`; pass it as `namespace/name` without a leading `@`.
  If a project command fails, fix the ref and retry. Never fall back to writing repository files.
- If setup must install something before Amp can clone the repository, put only that prerequisite
  in a pre-clone script and store it with
  `amp projects update <project> --pre-clone-script-file <temporary-file>`.
- Write the complete, idempotent setup script to a temporary file outside the repository. Put
  setup work directly in this script. If the project needs `.agents/resume` or
  `.amp/services.yaml`, have the script create those files in the orb at runtime and append their
  paths to `.git/info/exclude` so they stay out of `git status` and later commits.
- Keep tokens, hostnames, and other configuration values out of the script. Read them from
  project environment variables or secrets (`amp secrets --help`).
- Run `bash -n` on the temporary script, then run it twice from the repository root and verify the
  warm run.
- Store it with
  `amp projects update <project> --pre-setup-script-file <temporary-file>`.
- Confirm it with `amp projects get <project>`, then remove the temporary file.
- Report that setup is active for future orbs and no repository push is needed.
- Do not create, modify, or commit repository files.

### 1. Investigate the repository

Before writing anything, determine what a fresh machine needs to build, test, and run this repo:

- Package managers and lockfiles (`package.json`/`pnpm-lock.yaml`, `Cargo.toml`, `go.mod`,
  `requirements.txt`/`pyproject.toml`, `Gemfile`, ...)
- Toolchain version pins (`mise.toml`, `.tool-versions`, `.nvmrc`, `rust-toolchain.toml`,
  `packageManager` field, corepack)
- Environment files (`.env.example` and similar) and required secrets
- Databases, caches, and other backing services the tests or dev server need
- Shell-managed development environments (Nix flakes, devenv, direnv, etc.) and how their full
  environment reaches non-interactive Amp and supervised service processes
- Existing setup docs: README, CONTRIBUTING, AGENTS.md, CI workflows (CI install steps are a
  reliable inventory of prerequisites)
- Existing `.agents/setup` and `.agents/resume` — update rather than replace, and preserve
  behavior you cannot verify

### 2. Write or update `.agents/setup`

A bash script starting with `#!/usr/bin/env bash` and `set -euo pipefail` that typically:

- Installs missing system packages via `apt-get`. Check packages first so a stale snapshot does not
  run `apt-get update` or reinstall packages it already has.
- Installs the pinned toolchain (e.g. `mise install --locked`, `corepack enable`)
- Sources an installer's profile script when the rest of setup needs a tool just installed; an
  installer cannot update the environment of the already-running setup process
- Installs dependencies from lockfiles (e.g. `pnpm install --frozen-lockfile`)
- Starts and seeds databases the repo needs, tuned for speed over durability
- Copies env templates without clobbering: `[ -f .env.local ] || cp -- .env.example .env.local`
  (avoid `cp -n` in scripts; its exit status on skip varies across coreutils versions)
- Optionally writes orb-specific agent guidance to `~/.config/amp/AGENTS.md` (login hints,
  seeded test users, toolchain notes agents need inside the orb)

Idempotence is required: run `.agents/setup` at least twice and verify that repeated runs converge
without duplicating configuration, corrupting seeded data, or failing because resources already
exist. Every command must terminate. Never run a foreground server, watcher, interactive prompt,
or other long-lived process. Processes still running when the script exits, including backgrounded
commands and daemons that tools autolaunch, are stopped and never reach the snapshot. Define
long-lived services in `.amp/services.yaml` instead. Print and time major steps so
`~/.cache/amp/logs/setup.log` shows which command is slow or failed.

Use files restored from a stale snapshot instead of rebuilding them without need. Before adding a
custom dependency fingerprint or cache marker, time the warm install path. Add one only when the
package manager cannot cheaply confirm that the restored dependencies still match the lockfiles
and tool versions.

Do not test persisted toolchain or profile changes by sourcing them into or otherwise modifying the
current shell. Start a new non-interactive login shell with the repository root as its working
directory and verify the environment there; that is the environment Amp and supervised services
must receive later.

### 3. Persist complete development environments

Installing a tool or making the current setup process work is not enough: Amp starts afterward,
and supervised orb services start in separate non-interactive login shells. If the repository
depends on a development shell, make its complete environment available there too (including
variables such as `NODE_PATH` and build-tool paths), not just a few symlinked binaries.

Use an idempotent, repository-scoped, recursion-guarded hook in `~/.bash_profile` when the
environment manager supports exporting its environment. Prefer injecting exports into the current
login shell over wrapping Amp or every service in another supervisor process. For Nix, use
`nix print-dev-env` rather than `nix develop` in the hook so activation does not spawn a nested
shell or supervisor process. For example:

```bash
nix_profile="$HOME/.nix-profile"
# The installer cannot update this running script's environment.
# shellcheck disable=SC1091
source "$nix_profile/etc/profile.d/nix.sh"

repo_root="$(cd "$(dirname "$BASH_SOURCE")/.." && pwd)"
profile_marker="# my-project Nix development shell"
if ! grep -Fqx "$profile_marker" "$HOME/.bash_profile" 2>/dev/null; then
  cat >> "$HOME/.bash_profile" <<EOF

$profile_marker
if [[ -z "\${IN_NIX_SHELL:-}" && "\${PWD}" == "$repo_root" ]]; then
  eval "\$("$nix_profile/bin/nix" print-dev-env "$repo_root")"
fi
EOF
fi
```

### 4. Write or update `.agents/resume`

Same bash preamble. Only fast, idempotent authentication, reconnect, or repair work: authenticate
tunnels with the current thread workload identity and re-check that databases are up. Target
completion within 10 seconds. Keep work in the foreground — Amp stops waiting after 10 seconds and
leaves the script running, so do not background slow steps (that hides failures); write progress to
a log file if work may exceed the window.

### 5. Make executable and verify

- `chmod +x .agents/setup .agents/resume`
- If you are running inside an orb, run `.agents/setup` and `.agents/resume` directly and fix
  failures. Run setup twice and time both runs. The warm run should avoid package downloads and
  unnecessary installs. Setup should finish in under 2 minutes; resume must finish in seconds.
- Inspect `~/.cache/amp/logs/setup.log` when diagnosing an existing slow or failed setup. Add
  per-command timing before adding cache logic so the change addresses the measured slow step.
- Verify persisted shell environments from a clean non-interactive login shell started with the
  repository root as its working directory. Do not source profile changes into or otherwise modify
  the current shell as a substitute. Start the new shell with a minimal environment, run
  `/bin/bash -lc`, and check only the expected marker variables and `command -v` paths; do not dump
  an environment that may contain secrets.
- For supervised services, run `amp orb services ensure`, inspect service status, and check only
  expected entries in the service process's `/proc/<pid>/environ`. Confirm activation happened
  exactly once.
- Do not restart `amp-headless` to test profile changes during a live thread; that terminates the
  running thread. Use a clean login shell and let the profile apply on the next normal restart.

### 6. Finalize repository files

- Ensure the repository's `.gitignore` ignores `.amp/portals/*`. Preserve existing rules and do
  not add a duplicate when an existing pattern such as `.amp/*` already covers it.
- Commit both scripts with the executable bit set and include any `.gitignore` update.
- A local commit does not configure future orbs until it reaches the project's default branch. If
  the commit is not there, say setup is only committed locally and is not active for future orbs.
  Ask whether to ship or push it when a remote is available. Otherwise, tell the user to add a
  remote or use the project-setting path. Do not call setup complete until the files are on the
  default branch.
- Link a commit only after confirming the remote contains it.

## Examples

- "Set up this repository for Amp orbs"
- "Set up orbs for this project. Don't commit anything."
- "Set up this project for orbs without committing any Amp-specific files"
- "Create .agents/setup and .agents/resume for this project"
- "Why is my orb missing dependencies after it wakes up?"
