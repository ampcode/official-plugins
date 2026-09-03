# Official plugins

- Keep `official-modes/index.ts` as the single plugin entrypoint.
- Keep each model's prompt and tool list in its own file under `official-modes/modes/`.
- Keep `@amp-agent-mode` directives and literal `createAgent` model and effort values in the entrypoint so server metadata parsing works.
- Run format checks before committing.
- Treat GitHub `main` as the source of truth. The mirror workflow must only fast-forward Pierre.
