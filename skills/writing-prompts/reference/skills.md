# Skills

A skill teaches a capability the model needs only for some tasks. Its description is listed on every turn; its body and reference files load only when a task matches. The `building-skills` skill covers file layout, frontmatter, and where skills live. Read this with the principles in SKILL.md.

## Decide whether it should be a skill

A skill earns its place when the model would get a recurring task wrong without it. That happens in three cases:

- The knowledge is not in its training data: internal systems and APIs, house conventions, product rules, recent versions.
- There are several valid ways to do the task and you want one, but the model does not pick it consistently. The skill fixes the choice: this format, this tool, this order.
- The task depends on rules nobody wrote down: thresholds, approvals, which source is the truth, what done means, what an earlier mistake taught.

A model already knows how to use common tools and well-documented APIs. A skill that explains how to use git or write a SQL join adds tokens and changes nothing. A skill that teaches a behavior, such as a writing style or how to report results, usually fits in a paragraph: one or two load-bearing phrases plus the specific ways the model still gets it wrong. Skills about tools, environments, and facts of one organization or system do not compress that way; they need their commands, paths, and facts. Test before you write: run the task a few times without the skill. If the model already does it the way you want, you need no skill. If it varies or breaks a rule, the skill states exactly the decisions it got wrong.

## Write the description

- Say what the skill does and when to use it, in third person, with the words a model would match a task against. It is the only part the model sees before loading, so it decides whether the skill loads at all.
- Put the main use case and trigger words first; hosts shorten long descriptions when many skills are installed.
- Name the user's intents, including requests that never use the domain's words, then name the nearest tasks it is not for. Models tend to skip skills, but a description that matches most tasks loads on most tasks.

## Write the body

- Lead with what the model would get wrong: the chosen way, the rules, and the facts it cannot find. Spend few words on steps it would take anyway. Put the most important instructions near the top; some hosts keep only the start of a loaded skill after compaction.
- Keep a short list of gotchas in SKILL.md, each one a mistake the model actually made, so it reads them before it meets the situation.
- Give one default instead of a menu of options, and match how strict each instruction is to how fragile the step is.
- Teach the capability in full: what the concept is, when to act, how, what to set in which case, and examples. Define every term before its first use.
- Give the reason behind a rule when the model needs it to handle cases the rule does not name.
- Name only tools, commands, and skills the skill's users have.
- Do not restate system prompt rules.

## Split into reference files

- When the content divides by task, keep SKILL.md as the shared core plus a router that says when to read each file, such as "Read `reference/api-errors.md` when the API returns an error", and put each task's detail in its own reference file. The model then loads only the part it needs. Link reference files directly from SKILL.md, not from each other, and open a long one with a short table of contents.
- Put a step that must run the same way every time in a script, and tell the model to run it, instead of describing steps it would re-derive. When test runs show the model writing the same helper every time, bundle that helper.
- Say whether the model should run a script or read it. Write scripts for agents: support `--help`, never wait for interactive input, print errors that say what to try next, and keep output to a predictable size.

## Test a skill

- Test triggering and output separately. For triggering, run about 20 requests, half of them near misses that should not load the skill; use requests substantial enough to need a skill, because simple ones rarely load any. For output, compare runs with the skill against runs without it or with the old version, and drop checks that pass either way.
- Improve a skill from the runs that loaded it. Check which files the model read and in what order: a reference file nobody reads is unneeded or badly linked, and one read on every run belongs in SKILL.md. Cut parts that cost time without improving results, ship the helper runs keep rewriting, and quote the excuses agents gave for skipping a step; an excuse that repeats points at the sentence that allows it.
- Re-test a skill when the model changes. A skill written for an older model can be too prescriptive for a newer one and make its output worse.

## Example

Skill body, before:

    Use git carefully. Write good commit messages and make sure tests pass before you commit.

After:

    Commit subjects are plain sentences starting with a verb, such as "Fix login redirect loop". Run `pnpm fix`, then `pnpm test`, before every commit. Push to `main` only with the user's approval; never open a pull request unless asked.
