# Documents

A document is rich text that people read, edit, and comment on from the thread page. You write it as Markdown with the `artifact` tool; the tool's description lists the syntax, including Amp's checklists, mentions, and chips.

Most readers read the opening, scan the headings, and read the detail only where they disagree or must act. Write for that reader.

## Shape

- Open with two to four lines that stand alone: the takeaway (the answer, the recommendation, or the current state) and what you need from the reader, such as a decision, a review, or nothing. A reader who stops there knows both.
- Write headings that state the takeaway of their section, such as "Write to both stores first, then switch reads", not its topic, such as "Migration strategy". Fixed section names such as "Risks" and "Steps" stay as they are.
- Put one idea in each paragraph, carry the point in its first sentence, and keep it to three sentences.
- Choose the form by the content: a numbered list for a sequence, a checklist for steps someone will tick off, a table to compare several things on the same attributes, a code block for code, commands, and exact text, and an embedded visual for behavior, structure, and amounts.
- Use the same word for the same thing throughout, and put file paths, commands, and identifiers in code formatting.
- Size the document to its content. A short document is the opening and two or three sections; delete a section that would be empty instead of filling it.

## What goes in

These rules hold for plans, proposals, investigations, reviews, comparisons, and status reports: documents a reader acts on.

- Give one answer. State one conclusion or recommend one option, and put the others under "Alternatives", each with the specific reason it lost.
- Ask only what the reader must decide: questions whose answer changes what happens next and that neither the code nor the request settles. Give each question its options, your recommendation, and the default you will use without an answer. Decide everything else yourself and state the choice.
- List each assumption that may be false under "Risks", with the earliest signal that it is false.
- Say what the document leaves out under "Out of scope" when a reader could assume it is covered.

Start from the sections that fit the kind of document, and drop the ones it has no content for:

- Plan: goal, approach, steps as a checklist, and what done means.
- Investigation, research, or review: the answer and your confidence in it, findings with the most important first, and the evidence for each.
- Comparison of options: the recommendation and one table that compares the options on the same attributes.
- Status report: the current state, what changed since the last update, and what comes next.
- Meeting notes: one heading per meeting with a date chip, then the decisions and the action items, each with its owner mentioned.

## Pictures

When a section explains a mechanism, a change, or a set of numbers the reader would otherwise assemble from prose, draw it as a visual and embed its image line where the prose refers to it. A change gets a before and after diagram; a comparison of designs draws what differs between them; a trend or ranking gets a chart. If a sentence says it faster, write the sentence. Each visual follows `reference/views.md` and makes one point; the prose around it carries only what the picture cannot: the reason, the edge cases, and the risks.

Put screenshots in with their file:// URL, as the tool's description says.

## State the reader acts on

Use Amp's interactive Markdown where it holds state that a reader reads or changes:

- A checklist for steps and action items. Tick items as the work completes.
- A dropdown chip for an item's status, such as `{{dropdown:Todo|*Doing:blue|Done:green}}`, one per item, so readers change it in place.
- A date or time chip for a deadline, a meeting, or an event, instead of a date written as text.
- A mention of the person who owns an item or must answer a question.

While the work a document describes goes on, update its checklists and chips so the document shows the real state.

## Comments and revisions

Comments sit on the text they quote, and rewording or deleting that text removes the comment and its replies. When a question is settled, keep it in place and record the outcome next to it, such as "Decided: B", instead of deleting it. When you address a comment, change every part of the document the change affects, not only the quoted text.
