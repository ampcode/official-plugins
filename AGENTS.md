# Official plugins

- Keep `official-modes/index.ts` as the single plugin entrypoint.
- Keep each model's prompt and tool list in its own file under `official-modes/modes/`.
- Keep `@amp-agent-mode` directives and literal `createAgent` model and effort values in the entrypoint so server metadata parsing works.
- Keep each official skill in `skills/<name>/` with its `SKILL.md` and reference files; the directory name must equal the frontmatter `name`. Do not put plugin code under `skills/`; Amp never loads it as a plugin.
- The Amp CLI ships no skill content of its own; every skill Amp provides lives here. Gate a skill in its SKILL.md frontmatter `metadata` map: `feature: <flag>` (the user must have that feature flag or rollout) and `sandbox-only: true` (advertised only on Amp-managed sandbox executors). The Puck skill list is keyed by skill name in `core/src/inference/agent-modes.ts` in ampcode/amp, so land that change first when Puck should see a new skill.
- Run format checks before committing.
- Treat GitHub `main` as the source of truth. The mirror workflow must only fast-forward Pierre.
