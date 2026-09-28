---
name: building-skills
description: "Use when creating, editing, installing, moving, pushing, or deleting any skill/agent skill/amp skill. Load FIRST—before researching existing skills or touching SKILL.md files or skill locations. Provides required structure, naming conventions, and frontmatter format."
---

# Building Skills

Creates well-structured Agent Skills following best practices.

## Skill Structure

Every skill needs a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: my-skill-name
description: Does X when Y happens. Use for Z tasks.
---

# Skill Title

Instructions go here.
```

## Frontmatter Requirements

### name (required)
- Maximum 64 characters
- Lowercase letters (a-z), numbers (0-9), and hyphens only
- Must not start or end with a hyphen
- No consecutive hyphens (`my--skill` is invalid)
- Must match parent directory name exactly
- Use gerund form (verb + -ing): `processing-pdfs`, `analyzing-data`, `managing-deployments`
- Avoid vague names: `helper`, `utils`, `tools`

### description (required)
- Maximum 1024 characters (should be much shorter than 1024 characters)
- Write in third person ("Processes files" not "I process files")
- Include BOTH what the skill does AND when to use it
- Be specific with key terms for discovery
- **Quote the value** if it contains colons, special YAML characters, or "Triggers on:" patterns:
  ```yaml
  description: "Fetches tasks from Notion. Triggers on: my tasks, show work."
  ```

**Good descriptions:**
- "Extracts text and tables from PDF files, fills forms, merges documents. Use when working with PDF files or asked to read/edit PDFs."
- "Queries BigQuery datasets using the bq CLI. Use for data analytics, SQL queries, or Google Cloud data warehouse tasks."
- "Reviews pull requests for code quality, security, and test coverage. Use when asked to review a PR or diff."

**Bad descriptions:**
- "Helps with files" (too vague)
- "I can help you with data" (wrong POV)
- "PDF tool" (no trigger context)

### Optional fields
- `license`: License identifier (e.g., "MIT", "Apache-2.0")
- `compatibility`: Max 500 characters describing compatibility requirements
- `metadata`: Arbitrary metadata object
- `allowed-tools`: List of tools the skill can use
- `argument-hint`: Hint for skill arguments
- `model`: Preferred model for the skill
- `mode`: Agent mode override
- `isolatedContext`: Run skill in isolated context
- `mcpServers`: Inline MCP server config for skills, especially single-file skills (see Bundling MCP Servers)

## Directory Structure

### Simple Skill (instructions only)
```
.agents/skills/my-skill/
└── SKILL.md
```

### Skill with Scripts
```
.agents/skills/my-skill/
├── SKILL.md
└── scripts/
    └── my-script.sh
```

### Complex Skill (progressive disclosure)
```
.agents/skills/my-skill/
├── SKILL.md           # Overview, under 500 lines
├── reference/
│   ├── api.md         # Detailed API docs
│   └── examples.md    # Code examples
└── scripts/
    └── validate.py    # Executable scripts
```

## Progressive Disclosure

Skills load in stages to save context:

1. **Level 1 - Metadata**: Name + description loaded at startup (~100 tokens)
2. **Level 2 - Instructions**: SKILL.md body loaded when triggered (<5k tokens)
3. **Level 3 - Resources**: Additional files loaded only when needed

Keep SKILL.md under 500 lines. Split large content into separate files.

## Writing Effective Instructions

### Do
- Start with a clear one-line summary
- List specific capabilities
- Provide step-by-step workflows
- Include concrete examples
- Reference scripts with execution intent: "Run `scripts/validate.py` to check..."

### Don't
- Explain concepts the model already knows
- Add lengthy introductions or summaries
- Include time-sensitive information in main sections
- Use abstract examples

## Executable Scripts

Place scripts in a `scripts/` subdirectory and reference them in SKILL.md:

```
.agents/skills/my-skill/
├── SKILL.md
└── scripts/
    └── run-task.sh
```

Reference with execution intent: "Run `scripts/run-task.sh` to execute the task"

## Bundling MCP Servers

Skills can bundle MCP servers. The MCP starts at Amp startup but its tools stay hidden until the skill loads. There are two ways to declare servers.

### Inline in frontmatter (default)

Prefer this. Declare servers under an `mcpServers` key in SKILL.md frontmatter, keyed by server name. It keeps the skill a single self-contained file — the simplest to move, import, and review.

```markdown
---
name: web-browser
description: Automates a Chrome browser. Use for navigating pages and taking screenshots.
mcpServers:
  chrome-devtools:
    command: npx
    args: ["-y", "chrome-devtools-mcp@latest"]
    includeTools: ["navigate_page", "take_screenshot"]
---
```

### Sibling mcp.json (multi-file skills)

Use a separate `mcp.json` only when the skill already needs a directory of resources (`scripts/`, `reference/`). If an `mcpServers` key is present it takes precedence over a sibling `mcp.json` — even when empty or containing no valid specs — and the two are never merged, so do not leave a stale `mcp.json` behind after moving config inline.

```
.agents/skills/web-browser/
├── SKILL.md
└── mcp.json
```

**Example mcp.json:**
```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": ["-y", "chrome-devtools-mcp@latest"],
    "includeTools": ["navigate_page", "take_screenshot"]
  }
}
```

Both forms use the same server-spec fields, so folding an `mcp.json` into inline frontmatter is a direct copy of the server map.

### ALWAYS Filter MCP Tools

**This is critical.** MCP servers often expose many tools (chrome-devtools has 26 tools = 17,700 tokens). Always use `includeTools` to expose only what the skill needs.

Ask the user: "Which tools from this MCP do you actually need?"

```json
{
  "includeTools": ["navigate_page", "take_screenshot", "click"]
}
```

This reduces token cost by 90%+ and keeps the skill focused.

The same gating exists for plugin tools: a plugin's bundled skill can list the
plugin's own tools in `builtin-tools` frontmatter to hide them until the skill
loads. See the building-plugins skill.

### MCP server fields

- `command`: Command to run for stdio servers (required unless `url` is set)
- `args`: Array of arguments for stdio servers
- `env`: Environment variables for stdio servers
- `url`: HTTP MCP server URL (required unless `command` is set)
- `headers`: HTTP request headers
- `transport`: HTTP transport (`http`, `sse`, or `http-first`)
- `includeTools`: **Always set this.** Glob patterns for which tools to expose. Do not guess tool names; use web search to find the tool names if in doubt.

## Importing or Moving Skills

When importing a skill (from another repo, a teammate, or the internet) or moving one between locations:

- Prefer collapsing it to a single SKILL.md. Fold any sibling `mcp.json` into inline `mcpServers` frontmatter and delete the `mcp.json`.
- A skill that ships `scripts/` or `reference/` must keep its directory layout; move the whole directory intact.
- Preserve `includeTools` filters; if missing, add them before use.
- Rename the frontmatter `name` and its parent directory to match your conventions.

### Untrusted skills from the internet

Treat internet-sourced skills as untrusted until reviewed:

- MCP `command` servers run arbitrary local processes when Amp discovers the skill at startup, before the skill is triggered. Read every server spec before adding the skill.
- Inspect `command`, `args`, `env`, and any bundled scripts for anything unexpected (network calls, credential access, install steps).
- Always set `includeTools` to the minimum the skill needs.

## Skill Locations

Skills are discovered from:
- `.agents/skills/` in the workspace (project-specific)
- `~/.config/agents/skills/` globally (user-wide)
- `~/.agents/skills/` globally (legacy user-wide)
- `~/.config/amp/skills/` globally for backwards compatibility
- Global User/Workspace Skills repositories (managed, loaded from the server)

Repository- or app-specific skills belong in `.agents/skills/`, checked in with
the project's code. Global skills may bundle text files (`scripts/`,
`reference/`) alongside `SKILL.md`; binary files are not served, so skills
with binary assets stay in a project repo.

In an Amp sandbox/orb, local skill directories do not outlive the sandbox, so a
persistent skill belongs in a global repository (or `.agents/skills/` when it is
repo-specific).

To install a skill into the local global directory from an existing source, use
`amp skill add --global <source>` where the source is `@user/skill`,
`owner/repo`, a git URL, or a local path (`--name`, `--overwrite`). Global
User/Workspace skills are managed through their repository instead.

Inspect an Amp personal skill URL with `read_web_page`. If it is inaccessible, say
it may be private or unavailable. If the current user message explicitly asks to
import it, clone the requested User or Workspace Skills repository. Then run
`amp skills import <url> --repository <clone-directory>`.
This downloads and verifies the revision-pinned files but does not commit or push.
For an explicit update request, run `amp skills update <name>` in the clone, never
to check or compare.
Use `--force` only when explicitly asked to replace committed changes.
Review the imported files, then use the signed global repository commit and push
workflow below. Only a workspace admin can push a Workspace import, and the
Workspace scope must be writable. A personal skill with the same name continues
to take precedence for that user until it is deleted.

For a named member, use `list_workspace_members`, then
`find_shared_plugins_and_skills` with their `userID`, the kind, and the name.

## Global User/Workspace Skills

Discover global repositories with `amp skills repositories`. It lists each scope
(User/Workspace) with its clone URL and `amp clone` command, whether it has any
skills yet, and whether the user can write it. If the command is unavailable or
lists no repositories, only the local directories are available. A scope with no
skills yet is simply empty — do not present it as a missing or uncreated
repository; the repository is created automatically on the first push.

Writing to a global skills repository:
- Each skill is a top-level `<skill-name>/` directory with `SKILL.md` directly
  inside it; the directory name must match the frontmatter `name`. Text files
  bundled under the skill directory (`scripts/`, `reference/`) are served too.
  Binary files are not: a skill containing one is not loaded. A skill that
  needs MCP tools can use inline `mcpServers` frontmatter or a sibling
  `mcp.json`.
- Default an unqualified request to the User Skills scope; use a Workspace scope
  only when the user asks for it and its repository entry is writable. Workspace
  pushes affect all teammates and require workspace admin permission.
- Work in the canonical clone directory, never in the repo root:
  `~/.cache/amp/repositories/<host>-<scope>-skills` (host from the clone URL,
  e.g. `~/.cache/amp/repositories/ampcode.com-user-skills`). If the directory
  already holds a clone, reuse it: fetch and reset to the remote's main branch
  instead of re-cloning. Otherwise clone the repository there with the
  `amp clone` command that `amp skills repositories` prints, passing the cache
  directory as the target (it handles authentication), add the skill, and
  commit. If the scope has no skills yet (no repository to clone), `git init`
  the directory, run
  `git config credential.helper '!amp git-credential-helper'`, commit, then add
  the clone URL as the `origin` remote (create-on-first-write creates it on
  the first push).
- Do not push unless the user explicitly asks or confirms; a push makes the
  skill visible to other threads, users, or workspaces. A new skill or a change
  to an existing one only takes effect after a push (Amp loads global skills
  from the server, not the local clone), so after committing, offer to push,
  naming the destination repository (for example "Ready to push this to your
  global user skills repository so it takes effect?") — never a bare "Want me
  to push it?", a destination-less "committed" or "not pushed", or git
  mechanics. After a confirmed push, tell the user where the skill was pushed
  and when it takes effect (new threads pick it up automatically; the current
  session after `reload_skills`).
- Updating or deleting a global skill works the same way: change or remove its
  `<skill-name>/` directory in the repository clone, commit, and (with
  confirmation) push. Never edit or delete `~/.cache/amp/global-skills/`; it is
  a read-only materialized cache that re-syncs from the server, so changes there
  are silently undone.

## Reloading Skills

After creating, editing, deleting, or (for global skills) pushing a skill, use
the `reload_skills` tool so the running session picks up the change — no Amp
restart needed. It rescans local skill directories and re-syncs global skills
from the server. Shell commands like `amp skills list` do not reload the
running session.
