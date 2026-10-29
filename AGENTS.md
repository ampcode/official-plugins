# Official plugins

- Keep each official skill in `skills/<name>/` with its `SKILL.md` and reference files; the directory name must equal the frontmatter `name`. Do not put plugin code under `skills/`; Amp never loads it as a plugin.
- The Amp CLI ships no skill content of its own; every skill Amp provides lives here. Gate a skill in its SKILL.md frontmatter `metadata` map: `feature: <flag>` (the user must have that feature flag or rollout), `sandbox-only: true` (advertised only on Amp-managed sandbox executors), and `subagent-only: true` (advertised only to Task subagents and listed in their system prompt as a kind of task to load first). The Puck skill list is keyed by skill name in `core/src/inference/agent-modes.ts` in ampcode/amp, so land that change first when Puck should see a new skill.
- Run format checks before committing.
- Treat GitHub `main` as the source of truth. The mirror workflow must only fast-forward Pierre.
