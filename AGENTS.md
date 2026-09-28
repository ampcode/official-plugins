# Official plugins

- Keep `official-modes/index.ts` as the single plugin entrypoint.
- Keep each model's prompt and tool list in its own file under `official-modes/modes/`.
- Keep `@amp-agent-mode` directives and literal `createAgent` model and effort values in the entrypoint so server metadata parsing works.
- Keep each official skill in `skills/<name>/` with its `SKILL.md` and reference files; the directory name must equal the frontmatter `name`. Do not put plugin code under `skills/`; Amp never loads it as a plugin.
- Do not add a skill whose name collides with a builtin skill in the Amp CLI (`core/src/skills/builtin/` in ampcode/amp); the builtin would mask it.
- Run format checks before committing.
- Treat GitHub `main` as the source of truth. The mirror workflow must only fast-forward Pierre.
