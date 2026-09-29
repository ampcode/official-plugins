---
name: building-agents
description: "Creates, edits, lists, and deletes custom agents (personal or workspace) with the manage_custom_agents tool: writes their instructions, picks their MCP servers, tools, and runtime, and saves drafts as it goes. Use when asked to build, set up, change, or remove a custom agent, or when the request comes from the agent builder page. Load FIRST, before calling manage_custom_agents."
builtin-tools:
  - manage_custom_agents
metadata:
  feature: custom-agents
---

# Building Custom Agents

## What a custom agent is

A custom agent is a saved agent mode a person or workspace owns. It is a directory
`agents/<key>/` in their plugins repository with two files: `agent.ts` (the config: label,
description, color, runtime, MCP servers, tools) and `instructions.md` (its system prompt,
layered on top of Amp's base prompt). Once saved and not a draft, it shows up in the agent picker
of every new thread, and threads that run it get its instructions plus a generated list of its MCP
servers and how to call them.

The `manage_custom_agents` tool reads and writes those files. It has four actions:

- `list`: every agent the person can see, whether they may write workspace agents, the workspace
  name, and the MCP servers configured for them (`id`, `name`, `scope`, `connected`).
- `get`: one agent's full config and instructions.
- `put`: create or fully replace one agent. Send the complete agent every time, not a diff.
- `delete`: remove one agent. Only after the person explicitly asks.

## Workflow

1. Call `list` first. It tells you which keys are taken, which MCP servers exist and whether the
   person is signed in to them, and whether you may write to the workspace scope.
2. Load the `writing-prompts` skill before writing `instructions`; it is the house style for
   text a model reads, and the rules below only add what is specific to agents.
3. Draft the whole agent from the description, then `put` it with `draft: true`. Do this before
   asking any question: a draft on screen is easier to react to than a question. Ask at most one
   question per turn, and only when the description leaves out something you cannot pick a
   sensible default for.
4. When the person asks for a change, `put` the complete agent again under the same key. Every
   `put` replaces the saved files; the agent builder page beside the chat shows the saved state.
5. When the person says it is done, `put` once more with `draft` omitted so the agent appears in
   the picker. If they add it from the builder page instead, that page clears the draft flag
   itself; do not repeat the save.

Sign-in to MCP servers happens on the builder page, which shows a Connect button for each
server the agent uses that the person has not connected. Never ask the person to connect a
server or paste credentials; just attach the server and, if it is not connected, mention that the
page offers sign-in.

If `manage_custom_agents` is unavailable, the person is not in the builder flow: edit
`agents/<key>/agent.ts` and `agents/<key>/instructions.md` in their plugins repository instead.

## Fields

- `key`: the directory name and the stable ID. Lowercase letters, digits, and hyphens, such as
  `release-notes`. Derive it from the label. Never reuse a key from `list` unless you mean to
  replace that agent.
- `scope`: `personal` unless the person asked for a workspace agent or the request says
  workspace. Workspace writes need admin rights; `list` reports `viewerCanManageWorkspace`.
  Pass `workspace` (name or ID) when the person is in more than one workspace.
- `label`: two or three words in title case, at most 24 characters. Shown in the picker.
- `description`: one sentence under 120 characters on what the agent does, in the third
  person. Shown under the label in the picker.
- `color`: a hex color such as `#059669`. Pick one that fits the job; leave it out to use the
  default.
- `serverOnly`: `true` runs the agent on Amp's servers with web access, MCP servers, and
  server-side tools, and starts instantly; there are no files and no shell. Omit it (or set
  `false`) only when the agent must read or change files, run commands, or work in a repository
  checkout; those agents run in an orb or on the person's runner.
- `mcpServers`: the `id` values from `list`. Attach only what the agent's steps use. If the job
  needs a system that is not listed, leave it out and say so in your reply.
- `tools`: the built-in tool selection. Omit it for almost every agent; see Tools below.
- `draft`: `true` until the person says the agent is finished.
- `instructions`: the system prompt, as markdown. See below.

## Tools

An agent's tools come from three places. Built-in tools are Amp's own and are what `tools`
selects. MCP tools come from the servers in `mcpServers` and are reached through `tool_search`
and `code_exec`; they are never listed one by one. Custom tools are `tools/<name>.ts` files in
the agent directory that a person writes by hand; they are always available to the agent and this
tool does not create them.

Where a tool runs decides the agent's runtime. A `server` tool runs on Amp's servers: web
search and reading (`web_search`, `read_web_page`), other Amp threads (`read_thread`,
`find_thread`, `create_thread`), Slack, email, images, MCP servers, and the Librarian for
code on GitHub. An `executor` tool needs the thread's orb or runner: the shell, file reading
and editing, code search (`finder`), subagents (`Task`), the Oracle, and anything that
touches a checkout. A `serverOnly` agent never gets executor tools, so never name one in its
`tools`. So: if every step of the job is covered by server tools and MCP servers, set
`serverOnly: true`; the moment one step needs a file or a command, leave it out.

Leave `tools` out unless the person asks to limit or extend what the agent can do. Without it
the agent gets the default set of the mode it runs in, which already matches the model. When you
do set it, prefer `{ "exclude": [...] }` or `{ "add": [...] }` over an exact list: the
default set stays and only your change applies. Reasons to set it:

- The agent must not do something its default set allows, such as a read-only reviewer that
  should never run `shell_command` or edit files: `{ "exclude": ["shell_command",
  "shell_command_status", "shell_command_kill", "apply_patch", "create_file", "edit_file"] }`.
- The agent needs a tool no built-in mode includes by default, such as `Read`:
  `{ "add": ["Read"] }`.

Only built-in tool names, MCP tool names (`mcp__<server>__<tool>`), and wildcards like
`"mcp__*"` may appear in `tools`; `put` rejects anything else and names the closest match.
Amp tools reached through `tool_search` and `code_exec`, such as Slack, Gmail, schedules, and
thread file transfer, cannot be added or excluded by name, so do not try to turn them off through
`tools`; forbid them in the instructions instead.

File editing is the one place the model family matters. OpenAI models edit with `apply_patch`;
Anthropic models, and every other family, edit with `create_file` and `edit_file`. When
`tools` is omitted or an object, Amp swaps the right pair in for the agent's model, so never add
or exclude one editing tool without its counterparts. An exact list turns that off: it is used as
written, so it must name the editing tools for the model the agent will run on, and it must
include `"mcp__*"` to keep the agent's MCP servers. Avoid exact lists unless the person insists.

Do not describe built-in tools in the instructions; the agent sees their descriptions itself. Name
a tool there only to require or forbid a step, such as "post the summary with `slack_write`" or
"never run `shell_command` on the main branch".

## Writing the instructions

Amp already knows how to code, use tools, and be helpful. Spend every sentence on what is
specific to this agent. Follow the `writing-prompts` skill for wording; these rules cover what
belongs in an agent's instructions.

- Describe outcomes, not adjectives. "Reply with the root cause, a severity, and one next step"
  gives the model a target; "be thorough" does not.
- Name the systems and where things live: which repository, channel, project, or board, and how
  to recognize the right one. Where only the person knows the answer, leave a bracketed
  placeholder such as `[team channel]` and list the placeholders in your reply so they can fill
  them in.
- Say when to stop and ask: anything irreversible, visible to customers, or outside the agent's
  scope. Everything else the agent should finish on its own.
- Refer to MCP servers by their `id` and tie each one to a step: "read the ticket from `linear`
  before you start; post the summary to `slack` when done". Say what to do when a server is
  missing or a call fails. Do not list the servers again or explain how to call them; Amp
  appends that after the instructions.
- End with one short worked example: a typical request and the ideal reply. It steers format
  and tone better than more rules.
- Keep it under a page. Cut any line the agent would follow without it.

## Example

Description from the person: "Something that writes our daily standup from Linear and Slack."

```json
{
  "action": "put",
  "scope": "personal",
  "key": "standup-scribe",
  "agent": {
    "label": "Standup Scribe",
    "description": "Turns yesterday's Linear updates and Slack threads into a short standup",
    "color": "#059669",
    "serverOnly": true,
    "mcpServers": ["linear", "slack"],
    "draft": true,
    "instructions": "You write the daily standup for [team].\n\n## Each run\n1. In `linear`, list issues in [project] updated in the last 24 hours. Group them by person.\n2. In `slack`, read [team channel] for the same window and pull out decisions and blockers.\n3. Reply with three sections: Done, In progress, Blocked. One line per item, each with its Linear key. Skip empty sections.\n\nIf either server returns nothing, say so in one line and continue with the other.\n\n## Example\nRequest: standup for today\nReply:\n**Done**\n- ENG-412 Retry queue backoff (Mara)\n**Blocked**\n- ENG-430 Waiting on design for the invoice page (Jon)"
  }
}
```

Reply after the call: two or three sentences on what you drafted, the placeholders to fill in
(`[team]`, `[project]`, `[team channel]`), and a question about what to change or whether it
is done.
