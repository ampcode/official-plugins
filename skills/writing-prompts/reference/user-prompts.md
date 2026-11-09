# Prompts to Another Model

A user prompt here is a message one model writes for another model to act on: a subagent or Task brief, the first prompt of a new thread, a message to another thread, a scheduled or automation prompt, an event notification, or an eval prompt. The receiver reads it as its instructions for one task. Read this with the principles in SKILL.md.

## Write what the receiver cannot know

The receiver has not seen your conversation, your files, or what you already tried. It knows how to do the work; what it lacks is the context that makes one answer right here. Before you send a prompt, ask what a colleague who had been in the conversation would know that the receiver does not, and write that down:

- The goal and who it is for: what the person asking wants and why, not only the next step.
- What done looks like: a finding, a draft, a tested change, or a shipped change, and who must review or approve it.
- What is off limits: files, shared state, and actions it must not touch or take, such as pushing or messaging people.
- Where things live: paths, URLs, IDs, branch names, and which source is the truth when two disagree.
- What is already known: evidence you gathered and approaches you ruled out, so it does not repeat them.
- How to verify and report: the check that proves the work, the evidence you want back (exact quotes, paths, numbers), and where to send the result.

Do the understanding yourself. Put in the file paths, line numbers, findings, and decisions you reached; never write "based on your findings, fix it", which hands the receiver the work of understanding without the evidence.

Put each fact in the prompt or point to where the receiver can find it. When the right answer depends on a fact that exists nowhere the receiver can reach, the receiver guesses, and its result looks confident and is wrong.

When the receiver is a fork that inherits your conversation, it already has the background. Give it only its scope and what to return.

## Keep facts, guesses, and choices apart

- Pass the user's request and stated preferences in their own words. What you learned from code, threads, or docs is context, not requirements; add no requirement the user did not state. A brief that turns earlier design notes into hard rules makes the receiver build all of them. Leave implementation choices to the receiver unless the task requires one.
- Mark what you observed, what you suspect, and what you decided. A hypothesis written as a fact becomes the receiver's conclusion.
- Give a reviewer the change and what it is meant to do, not your verdict on it. A reviewer told the change works hands that verdict back.

## Brief the goal, not every step

The receiver is a capable agent with its own tools. Give it the goal, the constraints, and the check, and let it plan. For a lookup, hand over the exact command or query; for an investigation, hand over the question, because prescribed steps lead it astray when your premise is wrong. Write steps only when their order matters and the receiver would get it wrong, such as a migration that must run before a deploy.

- Say whether it should change things or only research, and how long its report may be.
- Scale the effort to the task, such as "a few searches" for a fact or a full investigation for a root cause.
- When several agents work in parallel, give each a distinct part, say what the others are doing, say they share the workspace and must not undo each other's work, and say whether each may start agents of its own.
- Ask for the evidence behind its claims. A report describes what the agent meant to do, not always what it did.
- Have it save large output to a file or artifact and return the reference, not the whole content.
- Write in plain, complete sentences. People read messages between agents too.

## Event texts, scheduled prompts, and messages between agents

These arrive without a person in the loop, often many times, and the receiver reads them literally.

- Write what happened as facts, then say plainly what the receiver should do next. "The lint step failed in build 412. Follow the current task if there is one; otherwise say in one short sentence that the build is red."
- Do not tell the receiver to summarize or restate the event; it restates instead of acting.
- Report results as facts about the work, not as orders. A child agent's "nothing to do" can read to its parent as an order to do nothing; write "The child thread found nothing to change" and let the parent decide.
- A scheduled prompt runs again and again in a thread that keeps its history. Write it to be correct on the tenth run as well as the first: name where to read the state from and what to do when nothing changed. When the work should get better over time, have each run read the feedback people gave, keep a log of what it did and what worked, and adjust from that log.

## Example

Brief, before:

    Look into the flaky login test and fix it.

After:

    The test "redirects after login" in web/src/auth/login.test.ts fails about one run in five on CI (builds 401, 405, 409) and never locally. I suspect the redirect races the session cookie write, but I have not confirmed it. Find the cause, fix it in the code under test rather than by adding retries or sleeps, and run the test 20 times to show it passes. Do not push. Report the cause with the lines that show it, the diff, and the 20-run result.
