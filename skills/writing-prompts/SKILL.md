---
name: writing-prompts
description: "Writes and revises text a model consumes: system prompts, tool and parameter descriptions, AGENTS.md and other agent guidance, skill descriptions, and prompt templates. Use when drafting, editing, or reviewing any of these. Load FIRST, before touching model instructions."
---

# Writing Model Instructions

## What a model instruction is

A model instruction is any text a model reads to decide how to behave: a system prompt, a tool name and description, a parameter description, the text a tool returns, an AGENTS.md or other guidance file, a skill description or body, or a prompt template. The model reads all of these together with the conversation, and its attention is limited. Every line competes with every other line. Text that does not change behavior still costs attention.

Models read every text in the conversation as a possible instruction, and many follow it literally. That includes scheduled prompts, event notifications, automation texts, and messages from other agents, not only the system prompt and tool descriptions. A child agent that reports "nothing to do" can read to its parent as an order to do nothing.

The goal is behavior, not prose. A good instruction reliably produces the intended behavior across the whole range of situations it covers, with the least text that achieves that. Clarity for the model comes first; everything else follows from it.

## Principles

### Be clear and direct

Name the situation, the behavior, and the boundary. Define a term before you use it. Use concrete nouns and verbs, short sentences, and one idea per sentence. The test: a new teammate with no context should be able to follow the text without asking a question. If they would be confused, the model will be too.

Weak: "Handle git operations carefully."

Clear: "Ask before any git command that rewrites published history, such as push --force or amending a pushed commit. Run local, reversible commands without asking."

### Use the most specific word

Name each thing with the most specific word that fits, and give different things different names. Words such as message, response, reply, answer, final, and summary already name parts of the agent's own turn: the user's message, the model's text, and its final answer. Do not use them for product objects or tool calls; write "Slack message", "Space post", or "comment reply" instead. When the model posts through a tool, say who reads that post.

Ambiguous: "Deliver every response with slack_write. A normal final answer does not reach Slack."

Specific: "Post your answer to the Slack thread with slack_write; people in Slack see only that post. End your turn with a short note here as usual."

### Leave the reply and the end of the turn to the model

Do not ask the model to end a turn without text, to only call tools, or to stop right after a tool call, as in "post and stop" or "after posting, end the turn". Models handle empty turns badly, which causes retries and stuck threads, and a stop tied to a tool call ends turns that still have work left. Say what to post and when, ask for a short reply when nothing else is needed, and let the model judge when the work is done. Do not ask the model to write in `<think>` or other hidden tags or to reveal its reasoning; providers flag such requests as attempts to extract reasoning.

Empty turn: "When nothing needs saying, post nothing and stop."

Short reply: "When nothing needs saying, end with one short sentence that says so."

### Remove before you add

The default reaction to a problem is to add text. Resist it. Instructions only grow, and every added line dilutes the others. Before writing anything new, read the text that already covers the situation and look for what can go: a rule the model already follows without it, two rules that say the same thing, a special case an existing general rule already covers, or a line the motivating behavior shows nobody reads. Cut it if removing it does not change behavior the text must keep. Often the fix is to sharpen or move an existing line, not to write another.

Adding: the model sometimes skips reading a config file, so a new bullet says to read config files first.

Removing first: an existing bullet already says to read the defining file before answering; the model skips it because a later bullet about "answering quickly" contradicts it. Delete the later bullet.

### Target a general behavior, not one incident

An instruction describes a class of situations. When a bug or thread motivates a change, find the general rule that would have prevented it and write that. Do not encode the specific symptom. The test: if the triggering incident had never happened, would the rule still read as an obvious, useful rule?

Overfit: "When the user asks about the Stripe webhook retry setting, read config/stripe.ts before answering."

General: "Before answering a question about configuration, read the file that defines it instead of answering from memory."

Overfitting also blocks legitimate uses. A rule written for one case will fire on cases it was never meant for. Give the model the decision rule and let it apply it.

### Say what to do

State the desired behavior. Add what to avoid only when the model actually does it. A prohibition alone leaves the model guessing what to do instead.

Negative only: "Do not use markdown."

Positive: "Write the response as plain paragraphs. Use inline code for identifiers."

When a rule covers every action of a kind, tie it to that action as a direct instruction instead of a condition or a ban. Models follow the direct form more often, smaller models most of all. Keep rules that apply only in some cases conditional.

Ban: "Do not read code, URLs, or tables aloud unless the user asks."

Direct: "Describe code, URLs, and tables in a few words instead of reading them out, unless the user asks to hear them."

### Give the reason when it helps the model generalize

A short reason lets the model handle cases the rule does not name. Cut a reason that does not change behavior.

Rule only: "Never use ellipses."

With reason: "The response is read aloud by a text-to-speech engine, so never use ellipses; the engine cannot pronounce them."

### Calibrate strength

Hedges ("prefer", "usually", "consider", "when appropriate") make an instruction optional. Use them only when optional is intended. Reserve MUST, NEVER, and ALWAYS for real invariants and for behavior the model has been shown to get wrong. Current models follow instructions literally and respond strongly to emphasis; capitalized warnings and "if in doubt, do X" cause overtriggering. When a behavior shows up too often, remove the emphasis instead of adding a counter-rule.

Overtriggers: "CRITICAL: If in doubt, load the skill."

Calibrated: "Load the skill when the task matches its description."

### One home per instruction, no contradictions

Every rule lives in exactly one place. Before adding text, read the surrounding instructions and clarify, merge, or replace an existing rule rather than adding another. Two rules that pull in different directions cost the model reasoning on every turn as it tries to reconcile them, and the outcome is unpredictable. Repeat an instruction only when an eval shows the model ignores the single statement. When a rule needs an exception, write the exception into the rule it overrides, so the model never sees two rules that disagree.

### Use examples deliberately

One concrete example often replaces paragraphs of abstract instruction, and it is the most reliable way to steer format, tone, and structure. Make examples relevant to the real use, varied enough that the model does not learn an accidental pattern, and clearly marked as examples. Cut an example that does not measurably help.

Models copy examples closely, so write each one exactly as the model should produce it. An example placed inside a code fence teaches the model to wrap its own output in that fence. Use the real tool and parameter names, and gate an example on its tool the same way as the rule it shows. Use neutral placeholders, never a real user's, customer's, or workspace's name or ID; models copy those into other people's work. To teach when and how to call a tool, a short mocked flow often works better than a rule: the user asks X, the agent calls tool Y with these arguments, then ends with Z.

### Organize for the reader

Order sections by what the model needs first: what the thing is, when to act, how to act, what to set in which case, then examples. Group related rules under one heading. Use headings or tags with consistent names so the model can find and reference a section. Put stable text before text that changes per request.

Write standard Markdown that a viewer wraps: each paragraph and each list item on one line, a blank line between paragraphs, and no line breaks inside a sentence. Hard-wrapping at a fixed column makes every edit reflow the paragraph and bury the real change in the diff.

## Where an instruction belongs

The artifacts form levels. Each level holds one kind of instruction, and an instruction at the wrong level either costs attention on every turn or is missing when needed.

- System prompt: general behavior and rules that apply to every task in that mode. It is always in context, so it is the most expensive place to add text.
- Skill: a capability the model needs only occasionally and would get wrong without help, such as a tool with non-obvious rules, a multi-step workflow, or a domain format. It loads only when the task matches, so it can afford detail and examples.
- AGENTS.md: facts and rules specific to one repository or one directory. The model cannot infer them from the code, and they do not apply anywhere else.
- Tool description: when to call this tool, how to call it, and what comes back. Nothing about the broader task.

To place an instruction, ask two questions. Does it apply to every task in the mode? If not, it is not a system prompt rule. Does it apply outside this repository? If not, it belongs in AGENTS.md. What remains is either a tool's own contract or an occasional capability, which is a skill.

Misplaced: a system prompt paragraph on how to write RRULE strings for schedules. Most turns never schedule anything, and the model gets the syntax wrong without examples, so this is a skill.

Misplaced: an AGENTS.md bullet saying "ask before destructive git commands". That applies to every repository, so it is a system prompt rule and is already there.

## By artifact

### System prompts

- A system prompt sets the role, the decision rules, and the boundaries. It is not a task recipe and not a reference manual.
- Prefer general instructions over prescriptive step lists; the model's own plan is usually better than a hand-written one.
- Every line must change useful behavior on most tasks. Background, motivation that does not generalize, restated default behavior, and occasional-use detail are cuts or moves to a skill.
- Name a tool only when the mode has it. Gate tool-specific text on the tool's presence.
- Put long-lived instructions first and per-request facts last so the stable part can be cached. A fact that changes between requests breaks the cache for everything after it, so cache dynamic data for a time window, sort it the same way every time, and keep the last good value when a fetch fails instead of dropping it or showing a wrong fallback.

### Skills

- The description says what the skill does and when to use it, in third person, with the key terms a model would match on. It is the only part the model sees before loading, so it decides whether the skill loads at all.
- The body teaches the capability in full: what the concept is, when to act, how, what to set in which case, examples. Define every term before its first use.
- A skill body may be long. It still must not restate system prompt rules.

### AGENTS.md and other guidance files

- Record what the model cannot infer from the code: commands, invariants, decision rules, non-obvious environment steps, and product constraints. General engineering advice is a cut.
- Write bullets, not paragraphs. State what to do; state why only when it changes the decision.
- Prefer durable rules over current implementation details.
- Keep one concern per file and link to the source of truth instead of copying procedures.
- Scope guidance to the directory it governs; a rule for one subtree goes in that subtree's file.

### Tool descriptions

- The first sentence says what the tool does and when to use it. Write it as you would explain the tool to a new teammate: make implicit context explicit, such as query formats, niche terms, and how this tool relates to sibling tools.
- Add "Do not use for X" only for false positives that actually occur, and name the tool to use instead.
- Name parameters unambiguously (`user_id`, not `user`). Describe each parameter's format with one example value.
- The schema is an instruction too. Mark a parameter required when the model should send it in almost every call, and let it pass an empty value for the rare case; weaker models often skip optional parameters even when the description asks for them. Leave out parameters the call does not use, such as a label only the UI shows, and do not ask the model to make up IDs such as UUIDs.
- A tool that several modes share names only the tools, skills, and commands that every one of those modes has.

### Tool results and errors

- Say concretely what happened: what was attempted, what actually happened, and where. On success, name the outcome, such as "Posted to #support in thread 1717000000.111111", not "Done", so the model sees the work is finished and does not repeat it. On failure, name what failed and the next step the model can take, not "unknown error".
- Never return a generic message that can be false, such as "nothing has been posted yet" from a check that missed a post; the model then repeats work it already did.

### Event texts and messages to other agents

- Write them as facts about what happened, then say plainly what the receiver should do next, such as "The lint step failed. Follow the current task if there is one; otherwise say so in one short sentence."
- Do not tell the receiver to summarize or restate the event; it restates instead of acting.

## Process

1. Start from observed behavior. One case is an anecdote, two are a signal, three are a pattern. Write down the cases before writing any text.
2. Read the existing instructions that cover the situation. First look for what to remove or sharpen without breaking behavior the text must keep. Only then decide whether anything must be added, and where it belongs.
3. Write the smallest change that produces the behavior on the observed cases.
4. Review the change against the principles above: clear, specific words, nothing added that a removal would have fixed, general, positive, calibrated, one home, examples that earn their place, ordered for the reader, and no request for an empty reply or a stop after a tool call.
5. Offer an eval; do not run it without explicit approval. The plan names the motivating positive case, one negative control (a case the change must not affect), the model, the thread count (default at most 12), and what it does not cover. Run it through the real agent with the real system prompt and tools, keep eval threads temporary, and report per-case pass rates for old and new text. "Reads better" is not a result.

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
