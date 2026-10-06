---
name: presenting-artifacts
description: "Presents plans, proposals, research and investigation write-ups, comparisons, status reports, and other documents as skimmable, self-contained HTML pages with before-and-after drawings, serves them from the orb, and shares portal links where readers can comment on any block. Use when asked for a plan or a proposal, when asked to write up findings or a report for review, or when asked for a page, an artifact, or a link to share."
metadata:
  sandbox-only: true
---

# Presenting Artifacts

An artifact here is a document for a person to read, written as one self-contained HTML page. A
reader can skim it in two minutes, comment on any block, and open the same link again after
each revision. This skill covers when to make a page, what goes in it, how to write it, how to
make it easy to comment on, and how to share it.

`<skill>` below is this skill's base directory. Run commands from the workspace root.

## When to Make a Page

Make a page when the user asks for one, or when the result is a document that someone will
review, share, or come back to:

- a plan, a proposal, or a design
- a write-up of research, of an investigation, or of a review
- a comparison of options
- a status report
- an explanation of a system or of a change that needs drawings

Answer in the chat instead when the result fits in a short message and nobody needs to comment
on its parts. A page costs the reader a click, so it must save more reading than that.

## Workflow

1. **Investigate.** Read the code, docs, and data the page depends on before writing. A page
   written from memory sends the reader to review guesses.
2. **Create the page** from the template. `<slug>` names the topic in kebab-case, such as
   `redis-sessions`. Keep the file name for the life of the document so the link never changes.

   ```bash
   mkdir -p .amp/in/artifacts/pages
   cp <skill>/reference/page-template.html .amp/in/artifacts/pages/<slug>.html
   ```

   Replace every `⟦…⟧` placeholder; each one says what belongs there. Delete the sections the
   document does not need. Keep the template's styles and script unchanged.

3. **Check and share.** The script checks every page in the directory, starts or reuses a
   supervised static server, and prints each page's title and portal URL. It stops on leftover
   placeholders and repeated ids. Fix what it reports and run it again.

   ```bash
   node <skill>/scripts/share.mjs
   ```

   Use `--check` to check without sharing and `--dir DIR` for another directory. Outside an orb
   there is no portal; the script prints file URLs to link instead.

4. **Look at the page** when it has a drawing, a wide table, or markup the template does not
   have: take a screenshot with `agent-browser` and inspect it. Every drawing must line up, and
   nothing may run out of its block.
5. **Reply** with the link first, then at most five lines: what you need from the reader by tag
   and name, the main point of the page, and how to comment. For a plan, the main point is the
   recommendation with what done looks like. The page holds the document; do not repeat it in
   the reply.
6. **Stop or continue.** When the user asked for the document, the page is the deliverable:
   share it and end the turn. A plan that the user asked for ends the turn before its first
   step. When the user asked for the work and you planned first, share the page and continue
   with the steps that no open decision affects.
7. **Keep the page current.** Revise the same file after each comment or decision. While you
   execute a plan, update the step chips and the header chip, so the link always shows the real
   state.

Example reply:

```markdown
[Plan: Move session storage to Redis](https://t-abc-p3000.onamp.dev/redis-sessions.html "amp-portal")

I need two answers before S3: **Q1** (who hosts Redis) and **Q2** (session lifetime). Without
them I will use option A for both.

I recommend writing to both stores first and switching reads after a day of matching results.
The work is done when all reads come from Redis and the `sessions` table is dropped. There are
5 steps; only S5, which drops the table, cannot be undone.

To comment, use the review button in the corner of the page and select any block.
```

## What Goes in a Page

A page lets the reader act: approve, redirect, decide, or take the result and move on. These
rules hold for every kind of page.

- **Ground each claim in something you read.** Name the files, functions, commands, and
  sources. Label anything you could not verify as an assumption.
- **Ask only what the reader must decide.** A question belongs under Decisions needed when its
  answer changes what happens next and neither the code nor the request settles it. Give each
  question options, a recommendation, and the default you will use without an answer. Decide
  everything else yourself and state the choice on the page.
- **Size the page to the content.** A small plan needs the summary and two or three steps.
  Delete an empty section instead of filling it.

The template has the sections of a plan and a Findings section for the other documents. Keep
the parts that fit the document, and name the summary rows to fit. "Needs from you" stays the
first row on every page.

| Document                            | Other summary rows              | Sections to keep                                       |
| ----------------------------------- | ------------------------------- | ------------------------------------------------------ |
| Plan                                | Goal, Approach, Done when, Size | Decisions needed, Approach, Steps, Risks, and the rest |
| Proposal or design                  | Goal, Approach, Size            | Decisions needed, Approach, Risks, Alternatives        |
| Research, investigation, or review  | Answer, Confidence              | Findings with the most important first, Evidence       |
| Comparison of options               | Recommendation, Compared on     | Findings with one table that compares the options      |
| Status report                       | State, Next                     | What changed, Steps with current chips, Risks          |
| Explanation of a system or a change | Main point                      | Approach with its drawings, Findings for the parts     |

For a document that is not in the table, start from the summary and Findings.

## What Goes in a Plan

A plan lets the reader approve, redirect, or stop the work before it becomes expensive. Every
part of the page serves that decision.

- **State what done looks like.** Fill the summary's "Done when" row with the state that ends
  the work, written so that someone can check it: "All reads come from Redis, the `sessions`
  table is dropped, and `pnpm test` passes." The Verify line of the last step proves it. When
  you cannot state it, the goal is not yet clear: make that the first question under Decisions
  needed.
- **Recommend one approach.** The reader should not have to choose between options that look
  equal. Put the others under Alternatives, each with the specific reason it lost.
- **Put what would disprove an assumption under Risks**, with the earliest signal that it is
  false.
- **Write down what you cannot plan yet.** A part of the work goes under Not yet specified when
  it is in scope but you cannot yet state it as a precise question or step, usually because it
  waits for an answer or for the result of an earlier step. Name the area and what it waits
  for, and leave it coarse: one item may later become several steps or none. The test is
  whether you can state the question now, not whether you can answer it. A question you can
  state goes under Decisions needed, even when nothing can act on it yet. When an item becomes
  clear, replace it with a question or a step that takes the next free tag.
- **Make each step a result someone can check.** Name the step by what is true afterwards
  ("Sessions are written to both stores"), list what it touches, and say how to verify it. A
  step that cannot be verified is too vague. A step that touches unrelated areas is two steps.
- **Order the steps to learn early.** Start with a thin slice that runs end to end. Put the
  largest unknown near the start. Put changes that are hard to undo, such as data migrations,
  deletions, and published interfaces, near the end and say that they are hard to undo.
- **Say what is out of scope** when a reader could assume it is included. Out of scope is work
  that the goal does not cover; it never moves into the plan the way a Not yet specified item
  does.

## Drawings

A reader takes in a structure or a change faster from a drawing than from prose. Put a Before
and After drawing in the Approach section of every page that proposes or explains a change; the
template has the markup. Leave it out only when there is nothing to draw, such as a rename or a
new constant value.

Draw what the system does, not which files change: the path a request takes, the states an
object moves through, the order of calls, or who owns the data.

- Use the same view, layout, and labels in both panes, so that only the difference moves.
- Draw unchanged parts with light lines (`─│┌┐└┘→↓`) and changed parts with heavy glyphs
  (`━┃┏┓┗┛▶▼●`). The page colors the heavy glyphs, so the eye lands on the change first.
- Write a consequence that matters, such as a latency, a count, or an error, next to the part
  that causes it.
- When the behavior is new and Before would be empty, show the result alone.
- Say in the caption what the reader should notice.

In the other sections, and in pages that do not describe a change, add a view where it carries
information that the prose does not. Use the smallest view that fits:

| To show                                                        | View                        | Markup                  |
| -------------------------------------------------------------- | --------------------------- | ----------------------- |
| A flow, states, or connected parts                             | Box drawing                 | `<pre class="diagram">` |
| The order of calls at run time                                 | Indented call tree          | `<pre>`                 |
| Logic or an algorithm                                          | Pseudocode                  | `<pre>`                 |
| Which files or components own what                             | Shallow tree with comments  | `<pre>`                 |
| A change inside such a tree, or exact text such as a signature | Lines that start `+` or `-` | `<pre class="diff">`    |

Wrap each view in `<figure id="fig-…">` with a `<figcaption>`, and start each line of a view at
the first column of the file. A box drawing lines up only when every character takes one
column: use spaces, and keep tabs, `&`, `<`, `>`, and emoji out. In the other views, which hold
code, write `&` as `&amp;` and `<` as `&lt;`; a raw `<` can start a tag and swallow the rest of
the page. Keep each pane of a Before and After pair within 38 columns and a single drawing
within 80. When text cannot carry the drawing, use an inline `<svg>` that takes its colors from
`currentColor`, so that it works in light and dark mode.

The `explaining-code` skill has a worked example of each view.

## Writing a Page That Can Be Skimmed

Most readers read the header and the summary, scan the headings and tags, and open the detail
only where they disagree. Write for that reader.

- **The header and summary stand alone.** The summary opens with "Needs from you", because that
  is the row the reader must act on; write "Nothing, this is for your information" when that is
  true. A reader who stops after the summary knows what you need from them and the main point.
  For a plan, that reader also knows what done looks like and the size of the work.
- **Headings state the takeaway.** Write "Write to both stores first, then switch reads", not
  "Migration strategy". The fixed section names, such as Steps and Risks, stay as they are.
- **One idea per block, and its first sentence carries the point.** Keep paragraphs to three
  sentences.
- **Choose the form by the content.** Use numbered items for a sequence, a table to compare
  several things on the same attributes, a drawing for behavior and structure, and `<details>`
  for proof and long code.
- **Keep the main path short.** Put material the reader needs only to check your work into
  `<details>` under Evidence or Alternatives. Never put a decision or a risk inside `<details>`.
- **Use the same word for the same thing** on the whole page. Put file paths, commands, and
  identifiers in `<code>`.
- **Keep the page self-contained.** Use the template's inline styles and load nothing from
  another site.

## Making the Page Easy to Comment On

Amp adds a review button to every portal page. The reader selects an element and writes a
comment. The comment arrives in this thread as a user message that starts with "Portal page
comment from" and carries the page URL, a CSS selector for the element, and the first 200
characters of its text. The selector starts at the nearest `id`, so ids decide how precisely you
can tell what the reader pointed at.

- **Give every block a reader may comment on a unique `id`** that names its content, such as
  `step-dual-write`, not its position, such as `step-2`. Keep ids unchanged across revisions.
- **Give each decision, finding, step, and risk a visible tag**: Q1, F1, S1, R1. Readers quote tags in chat
  and by voice ("Q2: take B"). After the page is shared, never renumber or reuse a tag; a new
  block takes the next free number.
- **Put one decision, finding, step, or risk in each element**, so a comment has one possible target.
- **Start each block with words that identify it**, because you see only its first 200
  characters.
- **Leave the review button working.** Add no click handlers, overlays, or fixed elements.

When a comment arrives:

1. Find the block from the `id` in the selector and the quoted text.
2. Change that block and every other block the change affects.
3. Record the change under "What changed" with the tags involved, and raise the version in the
   header.
4. Keep a settled question in place: add a `done` chip that reads "Decided: A" and move the
   consequence into Approach and Steps. Deleting it would break the tags readers already quoted.
5. Run the share script again and reply with what changed in one or two lines and the same link.

Answer a comment that only asks a question in the thread. Also add the answer to the page when
other readers would ask the same thing.

## Sharing

- People who can view the thread can open its portal links. To reach anyone else, the user
  changes the thread's visibility or selects Make Public under Portal Options in the Portal
  tab, which opens the link for a limited time without the review button. Tell the user about
  these options when they ask to share more widely; do not change access yourself.
- The page is served from this thread's orb, and opening the link wakes a paused orb. When the
  user wants a copy that does not depend on the thread, offer to commit the HTML file to the
  repository. Do not commit it otherwise.
