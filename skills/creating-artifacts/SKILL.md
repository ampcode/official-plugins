---
name: creating-artifacts
description: 'Creates artifacts, the documents and visuals attached to a thread that people open, comment on, and share. A document is rich Markdown: a report, plan, proposal, write-up, comparison, status update, notes, or checklist. A visual, also called a view, is an interactive HTML page rendered inline in a reply: a chart, graph, diagram, dashboard, calculator, or UI mockup. Use for a document someone will review or keep; for a chart of data, such as a trend, ranking, distribution, or comparison; for any diagram, such as an architecture, flowchart, sequence diagram, state machine, timeline, race condition, or file tree; for a calculation the reader can change; and for UI experiments: mocking up a component or screen, prototyping an interaction, sketching a layout, or comparing design directions. Use when asked to write something up, chart, plot, graph, visualize, diagram, explain a race or where time goes, show how a number is computed, build a dashboard, mock up, prototype, or sketch.'
metadata:
  web-ui-only: true
---

# Creating Artifacts

An artifact is content attached to this thread that people open, comment on, and share from the thread page. It is one of two kinds, chosen with the `artifact` tool's `kind`:

- A document (`kind: "document"`) is rich text you write as Markdown. People read it, edit it, and comment on its text in place. Use it for reports, plans, proposals, investigation and research write-ups, comparisons, status reports, notes, and checklists.
- A visual (`kind: "visual"`), also called a view, is one self-contained HTML page that the Amp web UI renders inline in your reply and inside documents. Use it for charts, diagrams, dashboards, calculators, and UI mockups.

The `artifact` tool's description covers publishing, revisions, edits, comments, folders, and embeds. This skill covers which kind to make and how to make it good.

## Choose the kind

- Prose the reader reads, edits, or comments on is a document. Write it as Markdown, not as a visual: people comment only on a document's text, and a visual cannot be edited in place.
- Make a visual when seeing answers the question faster than reading:
  - Data: a trend over time, a ranking, a distribution, or a comparison across more than about six values.
  - Systems: any diagram, such as an architecture, flowchart, sequence, state machine, timeline, race between callers, tree, or commit graph, including small static ones.
  - Derivations: how a number is computed, with inputs the reader can change.
  - Design: a quick UI experiment, such as a component or screen mockup, an interaction prototype, a layout wireframe, or two or three design directions side by side.
  - Any request to chart, plot, graph, visualize, diagram, mock up, prototype, sketch, try out a UI idea, or build a dashboard.
- A document that needs a picture is a document with visuals embedded in it. Publish each visual on its own and put its image line in the document where the prose refers to it. Do not build one large visual that carries the prose.
- A short answer, a short list, a table of a few rows, or one or two numbers stays in your reply as Markdown. A code change summary shows the diff, not a visual.

## Rules for every artifact

- Write the takeaway first. Before writing anything else, write the one sentence the reader should take away: the answer, the recommendation, or the claim. It opens a document and is the heading of a visual.
- Ground every claim in something you read, ran, or computed, and name it: the file, the command, the query, the source. Compute every number you state from the data the artifact contains. Label what you could not verify as an assumption.
- Use real content: real names, file paths, numbers, error messages, and copy. Never use lorem ipsum or invented figures; when a mockup or calculator needs sample data, mark it as an example.
- Name the artifact like a product, not a caption. Its `title` is its name in the thread's artifact list and on its page: a short noun phrase, usually two to four words, specific enough to pick it out among the thread's other artifacts, such as "Checkout timeout investigation" or "Deep mode growth". Use the name the user already has for the thing. Do not use a bare category such as "Report" or "Diagram", and do not append an explanation after a dash or colon; the takeaway goes inside the artifact. Keep the title the same across revisions.
- Make it complete at rest. The first screen, before any scrolling or clicking, shows the point: a document's summary, a visual's default state. Screenshots, phones, and skimming readers see only that.
- Make structure carry information. Numbering, headings, chips, and labels must say something true about the content. Number only a real sequence, and give a heading only to a real section.
- Write the copy plainly. Name things by what readers recognize, not by how the system is built. Use active voice and short, specific sentences. Avoid asides set off by dashes, "not X, but Y" framing, a colon followed by a reveal, scare quotes around invented labels, and stock phrases such as "worth noting" or "honest caveat".
- Revise in place. After feedback, and while the work an artifact describes goes on, publish the same artifact again so its link always shows the current state. Publish a new artifact only when the reader should keep the earlier version.
- Do not restate the artifact in your reply. An embedded visual is seen in place; write only what it does not say. After publishing a document, link it and say in one to three lines what you need from the reader and its main point.

## How to build one

- For a document, read `reference/documents.md`.
- For a visual, read `reference/views.md` first: it covers the frame the page renders in, Amp's color tokens, the view kit, and the house style. Then read the reference for the kind of visual:
  - `reference/charts.md` for charts, distributions, calculations, comparison and decision matrices, tables, and dashboards.
  - `reference/diagrams.md` for architecture diagrams, flowcharts, sequence diagrams, state machines, timelines, race timelines, trees, commit graphs, and step-through explainers. In an architecture diagram, flowchart, sequence diagram, or state machine, draw each part as a box or lane and each call, message, or transition as an SVG line with an arrowhead, so the reader can trace the flow. Words or chips joined by → characters are a list, not a diagram.
  - `reference/ui-explorations.md` for mockups, prototypes, design options, interactive experiments, and wireframes.
- Start a visual from the closest example in `examples/`. Each is a complete view that follows these references; reuse its structure and code, and replace its placeholder subject and data with yours.
  - `indexed-lines.html`: a line chart whose title states a multiple, plotted against each series' own baseline.
  - `highlighted-bars.html`: a ranking with one highlighted bar, a gray tail row, and shares at the bar ends.
  - `cumulative-share.html`: a hand-drawn distribution (cumulative share on a log axis) with a pointer and keyboard readout.
  - `calculation.html`: a derivation ledger, one term per row, with inputs to change, a computed title, and the marginal cost.
  - `decision-matrix.html`: a weighted decision with sliders, a title computed from state, and the smallest change that flips the pick.
  - `design-options.html`: a UI exploration with today's behavior as a baseline, three directions, a stress condition, and working actions.
  - `flowchart.html`: a flowchart or state diagram that colors the path the title is about and reflows from a row to a column on phones.
  - `sequence.html`: a sequence diagram with a synced ledger of who holds what after each step.
  - `race-timeline.html`: a timeline of two concurrent callers on one time axis, with the moment the race breaks marked and the fix behind a switch.
  - `tree.html`: a file tree as an indented outline that opens only the path to the files the title names, with WAI-ARIA tree keys.
