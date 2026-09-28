---
name: building-plugins
description: "Use when asked to list, build, change, remove, or migrate Amp plugins."
---

# Building Plugins

Amp supports extension through plugins written in TypeScript.

The docs show the most recent version of the Plugin API and examples at: https://ampcode.com/docs/plugin-api

The amp plugins subcommand allows you to exercise plugin code.

The amp plugins show-docs commands tells you the exact plugin API supported by
this version of Amp.

When the `load_plugin` tool is available, use it to load a new plugin or reload one
plugin after changing it. When the `reload_plugins` tool is available, use it to
reload all plugins — including re-fetching global User/Workspace plugins after a
push — without restarting Amp. Otherwise, tell the user they may need to restart
Amp before plugin changes are active.

## Listing installed plugins

Amp plugins are TypeScript/JavaScript extension files. They are not agent modes,
built-in tools, or MCP servers; when asked what plugins are installed, enumerate
actual plugins rather than listing those. To enumerate:
- Run `amp plugins list` for project-local plugins (`.amp/plugins/`).
- List `~/.config/amp/plugins/` for user-local plugins.
- Run `amp plugins repositories` for the global User/Workspace scopes, then list
  the root plugin files and plugin directories in each repository it names.

A global scope reported with no plugins yet is simply empty — tell the user they
have no global plugins there. No repository exists until the first push creates
it, so do not present that as a problem or a missing repository.

## Plugin locations

There are three kinds of location:
- Project-local: `.amp/plugins/` in the workspace (this repo only).
- User-local: `~/.config/amp/plugins/` (this machine only, all repos).
- Global: User/Workspace Plugins repositories, shared across all of the user's
  machines and threads.

Discover global repositories first with `amp plugins repositories`. It lists each
scope (User/Workspace) with its clone URL and `amp clone` command, whether it
has any plugins yet, and whether the user can write it. If the command is
unavailable or lists no repositories, only the two local directories are
available.

Pick the location:
- If the user names a location (e.g. "project", "just on this machine", "my user
  plugins"), use it.
- Repository- or app-specific plugins belong project-local, checked in with the
  project's code.
- In an Amp sandbox/orb, user-local directories do not outlive the sandbox, so a
  persistent plugin belongs in a global repository (or project-local when it is
  repo-specific). Default an unqualified request to the User Plugins scope.
- Elsewhere, when global repositories are available, also default an unqualified
  request to the User Plugins scope (available everywhere the user runs Amp,
  across machines), briefly mentioning the alternatives so the user can redirect
  you: project-local (version-controlled with the repo; this project only),
  user-local (this machine only), and — when its scope is listed and writable —
  workspace (shared with the whole team). Push mechanics are
  your job during the writing workflow, not a concern to surface here.
- Global repositories are unavailable only when `amp plugins repositories` is
  missing or lists nothing (the feature is not enabled); a scope with no plugins
  yet is still available and writable. When unavailable, default an unqualified
  request to user-local, and if the project already has plugins ask whether they
  want project-local or user-local.

## Importing an Amp plugin URL

Inspect an Amp personal plugin URL with `read_web_page`. If it is inaccessible, say
it may be private or unavailable. If the current user message explicitly asks to
import it, clone the requested User or Workspace Plugins repository. Then run
`amp plugins import <url> --repository <clone-directory>`.
This downloads and verifies the revision-pinned files but does not commit or push.
For an explicit update request, run `amp plugins update <name>` in the clone, never
to check or compare.
Use `--force` only when explicitly asked to replace committed changes.
Review the imported files, then use the signed global repository commit and push
workflow below. Only a workspace admin can push a Workspace import, and the
Workspace scope must be writable. A personal plugin with the same name continues
to take precedence for that user until it is deleted.

For a named member, use `list_workspace_members`, then
`find_shared_plugins_and_skills` with their `userID`, the kind, and the name.

## Writing a new plugin

1. Pick the location using "Plugin locations" above before running
   `amp plugins show-docs`, inspecting plugin directories, or writing any files.
2. Get the plugin API understood by this version of amp with `amp plugins show-docs`.
3. Write the plugin in the selected location. Include the optional
   `export const description = '...'` named export (a static string literal of at
   most 300 characters) summarizing what the plugin adds; listings show it.
4. For local plugin directories, call `load_plugin` with the plugin path when the
   tool is available; otherwise ask the user to reload.
5. Test the plugin's behavior.

## Bundling skills

When a plugin needs workflow guidance, use a directory plugin and put each
standard skill package under `skills/<skill-name>/SKILL.md`. Register it
when the plugin loads:

```ts
export default async function (amp) {
	await amp.registerSkill({ path: 'skills/<skill-name>' })
}
```

Amp does not scan `skills/` automatically. The path is relative to the plugin
directory, and the skill frontmatter name must match its directory name. Amp
lists the skill as `<plugin-name>:<skill-name>`; there is no bare alias.
Single-file plugins cannot register skills. Put the registration after any
enablement check when the skill should only be available with the plugin's tools.
After loading the plugin, verify the qualified name with
`amp skill info <plugin-name>:<skill-name>` and test that the skill can read any
bundled resources it uses.

When a plugin registers many tools, gate them behind a bundled skill so they do
not occupy context in unrelated threads. List the tool names in the skill's
`builtin-tools` frontmatter field; those tools stay hidden until the skill is
loaded, which also documents their full schemas in the skill content. Only the
plugin's own tools can be gated, and tools not listed in any of the plugin's
skills stay always visible. The skill's description is then the discovery
surface for the whole toolset, so make it state when to use the tools.

## Writing to a global repository

- Only offer a scope whose `amp plugins repositories` entry is writable. If the
  Workspace scope is read-only for you, write to your User scope instead and
  suggest that a workspace admin copy or import it into the workspace scope.
- A global plugin is a root `.ts`/`.js` file or a `<name>/` directory with
  `index.ts` or `index.js` and its supporting files.
- Work in the canonical clone directory, never in the repo root:
  `~/.cache/amp/repositories/<host>-<scope>-plugins` (host from the clone URL,
  e.g. `~/.cache/amp/repositories/ampcode.com-user-plugins`). If the directory
  already holds a clone, reuse it: fetch and reset to the remote's main branch
  instead of re-cloning.
  - If the repository exists, clone it there with the `amp clone` command that
    `amp plugins repositories` prints, passing the cache directory as the target
    (it handles authentication); add the plugin and commit.
  - If the scope has no plugins yet (no repository to clone), `git init` the cache
    directory, run `git config credential.helper '!amp git-credential-helper'`,
    add the plugin, commit, then add the clone URL as the `origin`
    remote (create-on-first-write creates it on the first push).
- Do not push unless the user explicitly asks or confirms. A new plugin or a
  change to an existing one only takes effect after a push, so after committing,
  offer to push, naming the destination repository (for example "Ready to
  push this to your global user plugins repository so it takes effect?") —
  never a bare "Want me to push it?", a destination-less "committed" or "not
  pushed", or git mechanics.
  After a confirmed push, say where it was published. Explain that new threads
  load the new version automatically, but existing threads do not. Offer
  `reload_plugins` (when available) to update the current thread.
- Never mix local and global plugins for the same scope in one request.
