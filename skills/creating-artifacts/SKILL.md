---
name: creating-artifacts
description: "Creates artifacts: plans, proposals, research and investigation write-ups, comparisons, status reports, explanations, and other documents for a person to read. Writes each one as a skimmable, self-contained HTML page that shows its content in diagrams, charts, and before-and-after pictures, serves it from the orb, and shares a portal link where readers can comment on any block. Use when asked for an artifact, a plan, a proposal, a write-up of findings, a report, or a page or link to share, and before writing any standalone HTML page that presents results to the user."
metadata:
  sandbox-only: true
---

# Creating Artifacts

An artifact here is a document for a person to read, written as one self-contained HTML page
and shared by its portal link. A reader can skim it in two minutes, comment on any block, and
open the same link again after each revision. This skill covers when to make a page, what goes
in it, how to write it, how to make it easy to comment on, and how to share it.

`<skill>` below is this skill's base directory. Run commands from the workspace root.

## When to Make a Page

Make a page when the user asks for an artifact or a page, or when the result is a document
that someone will review, share, or come back to:

- a plan, a proposal, or a design
- a write-up of research, of an investigation, or of a review
- a comparison of options
- a status report
- an explanation of a system or of a change that needs pictures

Share every standalone HTML page that you write for the user this way, also when it does not
use the template. A link to the file gives the reader no review button and no link to pass on.

Screenshots, recordings, and data files are not pages. This skill does not change how you save
and link them.

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
   document does not need. Keep the template's styles and script as they are; a picture may
   bring its own.

3. **Check and share.** The script checks every page in the directory, starts or reuses a
   supervised static server, and prints each page's title and portal URL. It stops on leftover
   placeholders and repeated ids. Fix what it reports and run it again.

   ```bash
   node <skill>/scripts/share.mjs
   ```

   Use `--check` to check without sharing and `--dir DIR` for another directory. Outside an orb
   there is no portal; the script prints file URLs to link instead.

4. **Look at the page.** Take a screenshot of each picture and each wide table with
   `agent-browser` and inspect it. Parts must not overlap, text must not be cut off, and
   nothing may run out of its block. A picture with motion builds for about two seconds after
   it scrolls into view; take the screenshot after that. Look at a narrow screen too when you
   built a picture of your own.
5. **Reply** with the link first, then at most five lines: what you need from the reader by tag
   and name, the main point of the page, and how to comment. The page holds the document; do
   not repeat it in the reply.
6. **Stop or continue.** When the user asked for the document, the page is the deliverable:
   share it and end the turn. When the user asked for work and the page describes it, share
   the page and continue with the parts that no open decision affects.
7. **Keep the page current.** Revise the same file after each comment or decision. While the
   work that a page describes goes on, update its chips, so the link always shows the real
   state.

Example reply:

```markdown
[Investigation: Why checkout requests time out](https://t-abc-p3000.onamp.dev/checkout-timeouts.html "amp-portal")

I need one answer: **Q1** (may the handler return before the charge completes). Without it I
will assume that it may not.

The handler waits for the payment provider inside the request, and its retries push the
slowest requests past the 30 second limit. **F1** has the measurements. **F3** is the one
finding that I could not reproduce.

To comment, use the review button in the corner of the page and select any block.
```

## What Goes in a Page

A page lets the reader act: approve, redirect, decide, or take the result and move on. These
rules hold for every kind of page.

- **Ground each claim in something you read.** Name the files, functions, commands, and
  sources. Label anything you could not verify as an assumption.
- **Give one answer.** State one conclusion or recommend one option. The reader should not have
  to choose between options that look equal. Put the others under Alternatives, each with the
  specific reason it lost.
- **Ask only what the reader must decide.** A question belongs under Decisions needed when its
  answer changes what happens next and neither the code nor the request settles it. Give each
  question options, a recommendation, and the default you will use without an answer. Decide
  everything else yourself and state the choice on the page.
- **Write down what is still open.** A part of the topic goes under Not yet specified when it
  belongs on the page but you cannot yet state it as a precise claim or question, usually
  because it waits for an answer or for more work. Name the area and what it waits for. The
  test is whether you can state the question now, not whether you can answer it: a question
  that you can state goes under Decisions needed. When an item becomes clear, replace it with
  a block that takes the next free tag.
- **Say what could prove the page wrong.** Put each assumption that may be false under Risks,
  with the earliest signal that it is false.
- **Say what the page leaves out** under Out of scope when a reader could assume that it is
  covered.
- **Size the page to the content.** A short page needs the summary and two or three blocks.
  Delete an empty section instead of filling it.

The template has more sections than one document needs. Keep the parts that fit the document,
and name the summary rows to fit. "Needs from you" stays the first row on every page.

| Document                            | Other summary rows              | Main sections                                      |
| ----------------------------------- | ------------------------------- | -------------------------------------------------- |
| Plan                                | Goal, Approach, Done when, Size | Approach, Steps                                    |
| Proposal or design                  | Goal, Approach, Size            | Approach                                           |
| Research, investigation, or review  | Answer, Confidence              | Findings with the most important first, Evidence   |
| Comparison of options               | Recommendation, Compared on     | Findings with one table that compares the options  |
| Status report                       | State, Next                     | What changed, Steps with current chips             |
| Explanation of a system or a change | Main point                      | Approach with its pictures, Findings for the parts |

Every kind of page also keeps Decisions needed, Risks, Not yet specified, Out of scope, and
Alternatives when it has content for them. For a document that is not in the table, start from
the summary and Findings.

## Pictures

A reader takes in a structure, a change, or a set of numbers faster from a picture than from
prose. A page is HTML, so it can show what a chat message cannot: real diagrams, charts, motion,
and controls that the reader can try. Use that. Before you write a section, ask what shape its
content has, and when it has one, draw the shape first. The prose then carries only what a
picture cannot hold: the reason, the edge cases, and the risks.

Give every page at least one picture of its main point. A page that proposes or explains a
change shows Before and After in its Approach section; the template has the markup. Leave
pictures out only when the page has nothing with a shape, such as a rename or a list of
unrelated facts.

### Choose the picture by the content

| Content                                                            | Picture                                   | Markup                                                       |
| ------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------ |
| A request path, a pipeline, states, or connected parts             | Flow                                      | `.flow` with `.node` and `.edge`                             |
| Work that runs in parallel, or parts that belong together          | Flow with a group                         | `.group` inside a `.flow`                                    |
| A change                                                           | Two flows with the same layout            | `.compare` with one `.viz` in each pane                      |
| An order of events, or the path that the data takes                | Motion                                    | `.seq` on a `.flow`, `.live` on an `.edge`                   |
| One text made of parts: a request, a prompt, a command, a config   | Labelled parts                            | `<dl class="parts">`                                         |
| Amounts to compare                                                 | Bars on one scale                         | `<ul class="bars">`                                          |
| A trend, a loop, a state machine, or lines that cross              | Chart or diagram                          | Inline `<svg>`                                               |
| A screen or an output that the user will see                       | Mockup                                    | Your own HTML and CSS                                        |
| A relation the reader should try, such as a setting and its result | A control that changes the picture        | An `<input>` or `<button>` and a short script                |
| The order of calls, logic, file ownership, or exact text           | Call tree, pseudocode, file tree, or diff | `<pre>`, and `<pre class="diff">` for lines with `+` and `-` |

The first six rows are ready in the template. This markup shows them; replace the content and
keep the classes:

```html
<figure id="fig-order-jobs">
  <div class="viz">
    <div class="flow row seq">
      <div class="node">Order placed</div>
      <div class="edge live"><span>event</span></div>
      <div class="group" data-label="In parallel">
        <div class="node">Reserve stock</div>
        <div class="node hot">Charge card<small>slowest, 1.2 s</small></div>
      </div>
      <div class="edge"><span>all done</span></div>
      <div class="node ok">Order confirmed</div>
    </div>
  </div>
  <figcaption>
    Both jobs start together, so the charge sets the total time.
  </figcaption>
</figure>

<!-- Each of these also goes in its own figure and .viz. -->
<dl class="parts code">
  <div>
    <dt>Method and path</dt>
    <dd>POST /v1/charges</dd>
  </div>
  <div class="hot">
    <dt>Idempotency key</dt>
    <dd>Idempotency-Key: order-8841</dd>
  </div>
</dl>

<ul class="bars">
  <li class="hot" style="--v: 100"><span>Charge card</span><b>1200 ms</b></li>
  <li style="--v: 26"><span>Reserve stock</span><b>310 ms</b></li>
</ul>
```

- `.viz` frames one picture. Put each `.flow`, `.parts`, `.bars`, `<svg>`, or mockup in one.
- `.flow` runs top to bottom. Add `row` for left to right; a narrow screen turns it back into a
  column. Its children are `.node`, `.edge`, and `.group`, in the order in which things happen.
- `.node` holds a name, and a `<small>` for a consequence. `hot` marks the part the reader must
  look at, `ok` a good end, `bad` a failure, and `gone` a part that was removed.
- `.edge` is an arrow. Its `<span>` holds the label, `hot` colors it, and `live` sends a dot
  along it.
- `.seq` makes the children appear in order when the picture scrolls into view. The page adds
  a Replay link to the caption.
- `.parts` takes one `<div>` for each part. Add `code` when the parts are code or exact text;
  it keeps line breaks and spaces, so start the text directly after `<dd>`.
- `.bars` takes `--v` on each row: its length in percent of the longest bar. The bars grow when
  the picture scrolls into view.

### Draw it well

- **Draw what the system does**, not which files change: the path a request takes, the states
  an object moves through, the order of calls, or who owns the data.
- **Mark only what matters.** One accent in a picture: `hot` on the changed or the important
  parts, and nothing else colored unless it is a good or a bad outcome.
- **In Before and After, use the same layout and labels in both panes**, so that only the
  difference moves. When the behavior is new and Before would be empty, show the result alone.
- **Write a consequence that matters**, such as a latency, a count, or an error, on the part
  that causes it.
- **Use real names and numbers** from the code and the data. A picture with invented numbers
  is a claim that you cannot support.
- **Use motion when order or direction is the point**: the steps appear in the order in which
  they happen, a dot follows the data, a bar grows to its value. Motion that carries no
  meaning only delays the reader.
- **Make the picture complete when it stands still.** It must read correctly in a screenshot,
  in print, and for a reader who turned motion off. The template's motion does this. Put your
  own inside `@media (prefers-reduced-motion: no-preference)`.
- **Say in the caption what the reader should notice.**

Wrap each picture in `<figure id="fig-…">` with a `<figcaption>`, so that a reader can comment
on it.

### Your own pictures

When the template has no picture for the content, build one. An inline `<svg>` with a
`viewBox`, a mockup made of HTML and CSS, and a control with a short script are all fine. Put
the picture's `<style>` inside its `<figure>` and its `<script>` directly after it, and start
each selector with the figure's id, so that nothing else on the page changes. Take every color
from the page's variables, so that the picture works in light and dark mode: `--text`,
`--muted`, `--border`, `--line`, `--surface`, `--bg`, `--accent`, `--accent-soft`, `--ok`,
`--bad`, and `--warn`. A picture with a control shows a useful state before the reader touches
it.

### Code as text

A call tree, pseudocode, a file tree, and a diff stay text, because their content is code. Use
`<pre>` inside a `<figure>`, and start each line at the first column of the file. Write `&` as
`&amp;` and `<` as `&lt;`; a raw `<` can start a tag and swallow the rest of the page. The
`explaining-code` skill has a worked example of each of these views. `<pre class="diagram">`
still renders a box drawing made of text. Use it only to carry over a drawing that already
exists, and keep tabs, `&`, `<`, `>`, and emoji out of it.

## Writing a Page That Can Be Skimmed

Most readers read the header and the summary, scan the headings and tags, and open the detail
only where they disagree. Write for that reader.

- **The header and summary stand alone.** The summary opens with "Needs from you", because that
  is the row the reader must act on; write "Nothing, this is for your information" when that is
  true. A reader who stops after the summary knows what you need from them and the main point.
- **Headings state the takeaway.** Write "Write to both stores first, then switch reads", not
  "Migration strategy". The fixed section names, such as Steps and Risks, stay as they are.
- **One idea per block, and its first sentence carries the point.** Keep paragraphs to three
  sentences.
- **Choose the form by the content.** Use numbered items for a sequence, a table to compare
  several things on the same attributes, a picture for behavior, structure, and amounts, and
  `<details>` for proof and long code.
- **Keep the main path short.** Put material the reader needs only to check your work into
  `<details>` under Evidence or Alternatives. Never put a decision or a risk inside `<details>`.
- **Use the same word for the same thing** on the whole page. Put file paths, commands, and
  identifiers in `<code>`.
- **Keep the page self-contained.** Keep every style and script inline, and load nothing from
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
- **Leave the review button working.** Controls inside a picture do not disturb it. Add no
  fixed or full-page element, because one can cover the button in the corner.

When a comment arrives:

1. Find the block from the `id` in the selector and the quoted text.
2. Change that block and every other block the change affects.
3. Record the change under "What changed" with the tags involved, and raise the version in the
   header.
4. Keep a settled question in place and add a `done` chip that reads "Decided: A". Deleting it
   would break the tags readers already quoted.
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
