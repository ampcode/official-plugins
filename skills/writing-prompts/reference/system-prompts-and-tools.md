# System Prompts, Guidance Files, and Tools

These texts reach the model on every turn of every thread that uses them, so a mistake here repeats everywhere and every line costs attention. Read this with the principles in SKILL.md.

## System prompts

- A system prompt sets the role, the decision rules, and the boundaries. It is not a task recipe and not a reference manual.
- Describe the outcome you want, what counts as success, and when to stop, such as how much evidence is enough before answering. Give a process only where the exact path matters.
- Say which instruction wins when two sources disagree, such as the user over AGENTS.md, and a nested AGENTS.md over its parent.
- Tune each model's prompt for that model. Models differ in strengths and habits; use them instead of forcing one way of working on every model. When a prompt moves to a newer model, remove scaffolding the older one needed, such as extra verification steps or "think step by step", which make newer models overdo it.
- Leave a default to the tool that owns it. Repeating a tool's default in the system prompt gives the model two places to disagree.
- Prefer general instructions over prescriptive step lists; the model's own plan is usually better than a hand-written one.
- Every line must change useful behavior on most tasks. Background, motivation that does not generalize, restated default behavior, and occasional-use detail are cuts or moves to a skill.
- Name a tool only when the mode has it. Gate tool-specific text on the tool's presence.
- Put long-lived instructions first and per-request facts last so the stable part can be cached. A fact that changes between requests breaks the cache for everything after it, so cache dynamic data for a time window, sort it the same way every time, and keep the last good value when a fetch fails instead of dropping it or showing a wrong fallback.
- Check each new rule against the whole prompt and the tool descriptions the mode sends with it, not only the paragraph you edit. Most contradictions come from a later addition that disagrees with an earlier rule in another section.

## AGENTS.md and other guidance files

- Record what the model cannot infer from the code: commands, invariants, decision rules, non-obvious environment steps, and product constraints. General engineering advice is a cut.
- Write bullets, not paragraphs. State what to do; state why only when it changes the decision.
- Prefer durable rules over current implementation details.
- Keep one concern per file and link to the source of truth instead of copying procedures.
- Scope guidance to the directory it governs; a rule for one subtree goes in that subtree's file.

## Tool descriptions

- The first sentence says what the tool does and when to use it. Write it as you would explain the tool to a new teammate: make implicit context explicit, such as query formats, niche terms, and how this tool relates to sibling tools.
- Add "Do not use for X" only for false positives that actually occur, and name the tool to use instead.
- Cover what the model needs to call it safely: side effects, whether a retry is safe, the common errors, and what the tool does not return. Leave out marketing and restated parameter lists.
- Keep tools from overlapping. If a person could not say which of two tools fits a task, the model cannot either; merge them or split their jobs cleanly.
- Prevent mistakes in the schema rather than in prose: use enums for fixed choices, require absolute paths, and let structured output enforce a format instead of describing it.
- List required parameters first, and include a complete example call for each case that matters.
- Name parameters unambiguously (`user_id`, not `user`). Describe each parameter's format with one example value.
- The schema is an instruction too. Mark a parameter required when the model should send it in almost every call, and let it pass an empty value for the rare case; weaker models often skip optional parameters even when the description asks for them. Leave out parameters the call does not use, such as a label only the UI shows, and do not ask the model to make up IDs such as UUIDs.
- A tool that several modes share names only the tools, skills, and commands that every one of those modes has.
- Say what the result looks like when the model needs it to decide its next step, such as whether a call returns at once and reports later.

## Tool results and errors

- Say concretely what happened: what was attempted, what actually happened, and where. On success, name the outcome, such as "Posted to #support in thread 1717000000.111111", not "Done", so the model sees the work is finished and does not repeat it. On failure, name what failed and the next step the model can take, not "unknown error".
- Never return a generic message that can be false, such as "nothing has been posted yet" from a check that missed a post; the model then repeats work it already did.
- A refusal says why and what the model can do instead, such as which tool or which person can do it.
- An error about arguments names each unknown argument, lists the missing required ones, and lists the valid arguments, such as "get_thread_status does not take thread_id. Missing required: thread. Its arguments are thread, relay_dialogs."
- Return fields under the same names the tool takes as arguments, so the model can pass them back without renaming. Show readable names next to opaque IDs.
- When you cut long output, say what was cut and how to get the rest, such as the next page or a narrower query.
- Results are read as instructions too. Write the next step as a fact about the situation, such as "The thread is still running; its report arrives here when it finishes", not as an order that can fire in the wrong context.

## Examples

Tool description, before:

    Search tool. Use this to find things in the codebase. Very powerful. ALWAYS use it before editing.

After:

    Searches file contents with a regular expression and returns matching lines with paths and line numbers. Use for exact strings or symbols. For questions about behavior or flows that span files, use finder instead. Parameter `pattern`: a regular expression such as `handleAuth\(`.

AGENTS.md entry, before:

    We had an incident where the agent ran the test suite without the timeout and it looked like it hung, so please remember that tests can take a long time in this repo and be patient.

After:

    - Run `pnpm test` with a 60 second tool timeout; the suite takes about 3 minutes. Poll with the status tool instead of rerunning it.

System prompt rule, before:

    NEVER ask the user clarifying questions. Always make assumptions and proceed.

After:

    For small, well-defined tasks, pick sensible defaults and proceed; state the defaults you chose. Ask before acting only when a wrong guess would be expensive to reverse, such as a schema migration or a destructive command.
