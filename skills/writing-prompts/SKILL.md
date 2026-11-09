---
name: writing-prompts
description: "Writes and revises text a model consumes: system prompts, tool descriptions, schemas, and results, AGENTS.md and other agent guidance, skills, and prompts sent to another model, such as subagent briefs, new thread prompts, scheduled prompts, and event texts. Use when drafting, editing, or reviewing any of these. Load FIRST, before touching model instructions."
---

# Writing Model Instructions

## What a model instruction is

A model instruction is any text a model reads to decide how to behave: a system prompt, a tool name and description, a parameter description, the text a tool returns, an AGENTS.md or other guidance file, a skill description or body, or a prompt template. The model reads all of these together with the conversation, and its attention is limited. Every line competes with every other line. Text that does not change behavior still costs attention.

Models read every text in the conversation as a possible instruction, and many follow it literally. That includes scheduled prompts, event notifications, automation texts, and messages from other agents, not only the system prompt and tool descriptions. A child agent that reports "nothing to do" can read to its parent as an order to do nothing.

A model already knows how to do most things: how to use git, call a well-known API, or operate a common app, because it has read their documentation many times. What it lacks is the what: the facts and decisions specific to this situation that are in no training data and that the person writing the instruction finds too obvious to mention. Examples are which of several valid ways to do a task you want every time, which source is the truth, what counts as done, who must approve, and which rule an earlier mistake taught. Spend the words on that, and cut what the model would do the same way without being told.

The goal is behavior, not prose. A good instruction reliably produces the intended behavior across the whole range of situations it covers, with the least text that achieves that. Clarity for the model comes first; everything else follows from it.

## Principles

### Be clear and direct

Name the situation, the behavior, and the boundary. Define a term before you use it. Use concrete nouns and verbs, short sentences, and one idea per sentence. The test: a new teammate with no context should be able to follow the text without asking a question. If they would be confused, the model will be too.

Every phrase must point at an action. Words such as "real complexity", "meaningful duplication", "consequential", or "definition of done" sound precise but leave the model to guess what to do; replace them with the action or the threshold they stand for. Explain a term from another field in plain words, with an example, where it first appears.

Weak: "Handle git operations carefully."

Clear: "Ask before any git command that rewrites published history, such as push --force or amending a pushed commit. Run local, reversible commands without asking."

### Use the most specific word

Name each thing with the most specific word that fits, and give different things different names. Words such as message, response, reply, answer, final, and summary already name parts of the agent's own turn: the user's message, the model's text, and its final answer. Do not use them for product objects or tool calls; write "Slack message", "Space post", or "comment reply" instead. When the model posts through a tool, say who reads that post. Use the name the product already has for a thing instead of coining a new one, such as "thread" rather than "job".

Ambiguous: "Deliver every response with slack_write. A normal final answer does not reach Slack."

Specific: "Post your answer to the Slack thread with slack_write; people in Slack see only that post. End your turn with a short note here as usual."

### Find the load-bearing phrase

A few words often do most of the work. "Irrefutable proof" makes a model verify exhaustively; "big pictures, simple words" gets a plain explainer. Look for the short phrase that triggers the behavior you want, test it, and cut the paragraph it replaces. Put the key words of one rule together in one sentence instead of one bullet each, so the model reads them as one group.

### Leave the reply and the end of the turn to the model

Do not ask the model to end a turn without text, to only call tools, or to stop right after a tool call, as in "post and stop" or "after posting, end the turn". Models handle empty turns badly, which causes retries and stuck threads, and a stop tied to a tool call ends turns that still have work left. Say what to post and when, ask for a short reply when nothing else is needed, and let the model judge when the work is done. Do not ask the model to write in `<think>` or other hidden tags or to reveal its reasoning; providers flag such requests as attempts to extract reasoning.

Empty turn: "When nothing needs saying, post nothing and stop."

Short reply: "When nothing needs saying, end with one short sentence that says so."

### Remove before you add

Do not write what the model would do anyway. Generic advice on debugging, abstraction, or writing style, and rules the model already follows, cost attention and can restrict it more than you meant. Prompt for the specific behavior it does not show on its own.

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
- Skill: a capability the model needs only occasionally and would get wrong without help, because the knowledge is not in its training data or because it does not consistently pick the one way you want among several valid ones. Examples are a tool with non-obvious rules, a multi-step workflow, or a domain format. It loads only when the task matches, so it can afford detail and examples.
- AGENTS.md: facts and rules specific to one repository or one directory. The model cannot infer them from the code, and they do not apply anywhere else.
- Tool description: when to call this tool, how to call it, and what comes back. Nothing about the broader task.
- Prompt to another model: everything one task needs that the receiver cannot find on its own. It reaches only that receiver, once.

To place an instruction, ask two questions. Does it apply to every task in the mode? If not, it is not a system prompt rule. Does it apply outside this repository? If not, it belongs in AGENTS.md. What remains is either a tool's own contract or an occasional capability, which is a skill.

Misplaced: a system prompt paragraph on how to write RRULE strings for schedules. Most turns never schedule anything, and the model gets the syntax wrong without examples, so this is a skill.

Misplaced: an AGENTS.md bullet saying "ask before destructive git commands". That applies to every repository, so it is a system prompt rule and is already there.

## Reference files

Read the file for the kind of text you are writing, in this skill's `reference/` directory. Each one applies the principles above to its kind of text and adds the rules and footguns specific to it.

- `reference/user-prompts.md`: a prompt one model writes for another, such as a subagent or Task brief, the first prompt of a new thread, a message to another thread, a scheduled or automation prompt, an event notification, or an eval prompt.
- `reference/system-prompts-and-tools.md`: system prompts, AGENTS.md and other guidance files, tool and parameter descriptions and schemas, and the text tools return.
- `reference/skills.md`: deciding whether something should be a skill, and writing its description, body, and reference files. The `building-skills` skill covers file layout, frontmatter, and where skills live.

## Process

1. Start from observed behavior. One case is an anecdote, two are a signal, three are a pattern. Write down the cases, then a short behavior spec of what the model should do in each, before you read or write any instruction text, so the current wording does not define what correct means.
2. Read the existing instructions that cover the situation. First look for what to remove or sharpen without breaking behavior the text must keep. Only then decide whether anything must be added, and where it belongs.
3. Write the smallest change that produces the behavior on the observed cases.
4. Review the change against the principles above: clear, specific words, nothing added that a removal would have fixed, general, positive, calibrated, one home, examples that earn their place, ordered for the reader, and no request for an empty reply or a stop after a tool call.
5. Offer an eval; do not run it without explicit approval. The plan names the motivating positive case, one negative control (a case the change must not affect), the model, the thread count (default at most 12), and what it does not cover. Run it through the real agent with the real system prompt and tools, in fresh threads, using prompts people actually sent where you have them. Keep eval threads temporary, and report per-case pass rates for old and new text on the same model. "Reads better" is not a result.
