# Skills

A skill teaches a capability the model needs only for some tasks. Its description is listed on every turn; its body and reference files load only when a task matches. The `building-skills` skill covers file layout, frontmatter, and where skills live. Read this with the principles in SKILL.md.

## Decide whether it should be a skill

A skill earns its place when the model would get a recurring task wrong without it. That happens in three cases:

- The knowledge is not in its training data: internal systems and APIs, house conventions, product rules, recent versions.
- There are several valid ways to do the task and you want one, but the model does not pick it consistently. The skill fixes the choice: this format, this tool, this order.
- The task depends on rules nobody wrote down: thresholds, approvals, which source is the truth, what done means, what an earlier mistake taught.

A model already knows how to use common tools and well-documented APIs. A skill that explains how to use git or write a SQL join adds tokens and changes nothing. Test before you write: run the task a few times without the skill. If the model already does it the way you want, you need no skill. If it varies or breaks a rule, the skill states exactly the decisions it got wrong.

## Write the description

- Say what the skill does and when to use it, in third person, with the words a model would match a task against. It is the only part the model sees before loading, so it decides whether the skill loads at all.
- Name the triggers that should load it and no broader. A description that matches most tasks loads on most tasks.

## Write the body

- Lead with what the model would get wrong: the chosen way, the rules, and the facts it cannot find. Spend few words on steps it would take anyway.
- Teach the capability in full: what the concept is, when to act, how, what to set in which case, and examples. Define every term before its first use.
- Give the reason behind a rule when the model needs it to handle cases the rule does not name.
- Name only tools, commands, and skills the skill's users have.
- Do not restate system prompt rules.

## Split into reference files

- When the content divides by task, keep SKILL.md as the shared core plus a router that says which file to read for which task, and put each task's detail in its own reference file. The model then loads only the part it needs.
- Put a step that must run the same way every time in a script, and tell the model to run it, instead of describing steps it would re-derive.

## Example

Skill body, before:

    Use git carefully. Write good commit messages and make sure tests pass before you commit.

After:

    Commit subjects are plain sentences starting with a verb, such as "Fix login redirect loop". Run `pnpm fix`, then `pnpm test`, before every commit. Push to `main` only with the user's approval; never open a pull request unless asked.
