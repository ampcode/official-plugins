# Diagrams, flowcharts, and explainers

A diagram shows how parts relate: what calls what, what happens in which order, which states lead where. Like a chart, it makes one point, and its default state shows that point before anyone clicks.

## Choose the medium

- Draw every diagram as a view, including a small static one of three boxes. A view reflows to the reader's width, colors the path that matters, and draws durations to scale; box-drawing text in a code block scrolls sideways on phones and does none of these.
- A small diagram needs no interaction: a few nodes on one row that becomes a column on phones, with the path that matters in `--chart-1`.
- Add interaction when the reader gains from clicking a part for detail or stepping through a sequence.
- Use a table, not a diagram, for a list of parts with attributes and no relationships.
- Write Mermaid only when the user asks for it; Amp shows Mermaid as code, not as a diagram.

## Choose the diagram by the question

- What talks to what (architecture): boxes for components, edges for calls or data flow, grouped by boundary (process, network, trust).
- What happens in which order between parties (a protocol, a request across services): a sequence diagram. See `examples/sequence.html`.
- Which states lead where, and on what event: a state machine or flowchart. See `examples/flowchart.html`.
- How a decision branches: a flowchart with every branch labeled by its condition.
- Where the time goes, or what ran in parallel: a timeline. See `examples/race-timeline.html`.
- Why two concurrent callers broke something: a race timeline with one lane per caller. See `examples/race-timeline.html`.
- Where something lives in a hierarchy (files, routes, docs, components, layers): a tree. See `examples/tree.html`.
- Which commits are where (branches, rebases, what is pushed): a commit graph.
- What changed between two versions of a structure: a before and after diagram.
- How a piece of code works: a step-through explainer anchored to the source.

## Make the default state prove the title

- The title states the rule the diagram explains ("A deploy reaches everyone only after a healthy canary"), not its subject ("Deploy pipeline").
- Draw the path the title is about in `--chart-1` at full ink from the first frame. Draw other paths in `--muted-foreground`, dashed when they are exceptions or failures, and label them.
- A stepper or detail panel opens on the step that proves the title, not on step one. In a sequence diagram, that is the step after which the claim is visible.
- Keep every part at full ink. Do not dim parts the reader has not reached; mark "not yet" with dashes or outlines.
- Add a second view of the same state when it answers the title more directly, such as a ledger of what each party holds after the selected step.

## Nodes and edges

- Nodes: 12px name in `--foreground`, an optional 11px muted subtitle (the type or one fact), in a `var(--background)` box with a `var(--border)` ring and 6px corners. Size nodes from their labels and keep one size per row.
- Align nodes to a grid, with equal gaps along the main flow. The main flow runs left to right on desktop and top to bottom on phones.
- Edges: 1px `--muted-foreground` (1.5–2px for the highlighted path), orthogonal or straight, never curved spaghetti. One small arrowhead at the target, drawn with a `<marker>` that uses `markerUnits="userSpaceOnUse"` so it does not scale with the stroke.
- Label every branch with its condition ("healthy", "error rate above 1%"), in 11px muted text with a halo: `paint-order: stroke; stroke: var(--background); stroke-width: 3px`.
- Group by boundary with a hairline outline and a muted 11px label at its top left, not with tinted backgrounds.
- When the question is what runs inside what (a machine, a process, a sandbox), nest the boxes, at most two levels deep, and draw connections that cross a boundary through its edge so the crossing is visible.
- Use icons only where they identify a real thing (a database, a provider logo), never as decoration on every node.

## Layout for both widths

- Compute positions from the measured width in one `layout(width)` function, and redraw from a `ResizeObserver`. Never set a `min-width` that makes the view scroll sideways.
- Below about 560px, turn a row into a column and move side branches to the right of the column. Keep every label; shorten subtitles before dropping them.
- When a structure cannot fit 360px as one diagram, split it into two views or collapse a group into one node with a detail panel.

## Sequence diagrams

- Parties are columns with a name at the top and a hairline lifeline below. Messages are numbered rows, top to bottom, with requests solid and responses dashed.
- Color the messages the title is about, such as the ones carrying a secret, in `--chart-1` from the first frame.
- Selecting a row (click, tap, arrow keys) shows its raw message or payload in a panel below, in 11px mono that wraps.
- A synced ledger beside or below shows the state after the selected step: who holds what, which records exist.
- On phones, shorten party names and keep rows at least 28px tall so they stay tappable.

## State machines and flowcharts

- States are nodes; transitions are labeled edges. When the reader should explore, make transitions buttons that move a current-state marker, and list the events available from the current state.
- Mark start and terminal states clearly (a filled dot, a double ring, or the words "start" and "done").
- Clicking or focusing a node opens its detail below the diagram: what happens in this state, how long it lasts, what leaves it.

## Timelines and waterfalls

- Put time on one shared horizontal axis and give each step its own row, so bar length is duration and position is when it happened. Label rows at the left; group them under a heading per process, caller, or service.
- Draw bars as square rectangles, 8–10px tall. Color the steps the title names in `--chart-1` (the critical path, the slow step, the refreshes that collide) and the rest in `--chart-context`. Draw waiting or blocked time as a dashed outline, not a filled bar.
- Draw vertical gridlines at round times with 11px labels at the top and the unit on the last label. Use real units (ms, s, min) and start at 0 or at the triggering event.
- Put each step's outcome at its bar's end: a status dot with text ("401", "200", "timed out"), or a muted note.
- Mark the moment that explains the title with one labeled rule: the deploy, the revoke, the lock being taken.
- Show the fix on the same axis behind a switch, so the reader compares the two timelines at the same scale, and compute the title from the selected one.
- With many steps (a trace), collapse the steps that do not matter into one gray row per group, and say how many it holds.

## Race timelines

- Give each concurrent caller its own lane, and draw both on one time axis. The reader must see the overlap: the second caller's check landing before the first caller's write.
- Name the shared resource in the steps that touch it ("check lock", "set lock", "refresh token"), and color those steps.
- Label the moment the invariant breaks with a rule, and put the failure at the end of the victim's lane.
- Say the real gap in the title ("40 ms apart"), computed from the data, so the reader knows how narrow the window is.
- Show the fixed ordering on the same axis behind a switch.

## Trees

- Draw a tree as an indented outline, one row per node with 16px of indent per level and hairline guides, not as boxes joined by lines. An outline fits any width and stays readable at 360px.
- Open only the branches on the path to what the title names, and collapse the rest with a count ("3 files"). Color the nodes the title names; leave the folders on the path neutral, since expansion already shows it.
- Put names in mono for paths and identifiers, followed by a muted one-line role that truncates with an ellipsis on phones. Mark new, changed, and removed nodes with `+`, `~`, and `−` glyphs.
- Show detail for the selected node beside the tree on desktop and below it on phones.
- Follow the WAI-ARIA tree pattern: `role="tree"` and `treeitem` with `aria-level` and `aria-expanded`, one tab stop, Up and Down to move, Right to open or enter, Left to close or go to the parent, Home and End.
- For a decision tree, label each branch with its condition and color the branch the title is about; when it has more than about three levels, use a flowchart instead.

## Commit graphs

- One row per commit, newest at the top, each with a short hash in mono, the subject, and a muted tag for where it is (`main`, `origin/main`, `local`, `HEAD`).
- Draw branches as vertical lanes at the left, with merges and rebases as short diagonals. Color the commits the title is about; gray the rest.
- Mark boundaries the reader needs (pushed versus local, a shallow-clone cut, a force push) with a labeled hairline across the rows.
- Collapse long runs of commits that do not matter into one row ("17 more commits").

## Before and after

- Draw both versions at the same scale and in the same positions, so only the changes move.
- Mark added parts with `+` in `--success`, changed with `~` in `--warning`, removed with `−` in `--destructive`, always as a glyph next to the name, never as color alone. Draw removed parts dashed.
- Name the change in the title: "The cache moves from the API to the edge".

## Code explainers

- Anchor each step to its source as `file.ts:120`, in mono, and show the few lines that matter in 11px mono that wraps instead of scrolling.
- Step with Prev and Next buttons and arrow keys; highlight the active part of the diagram and the active lines together.
- Keep the code real; trim it with `…` rather than paraphrasing it.

## Keyboard and focus

- Make each node or row reachable: either each one is a focusable `<g tabindex="0" role="button">`, or the SVG is focusable and arrow keys move a selection.
- Arrows move to the next or previous part, Home and End jump to the ends, Enter or Space opens detail, and Esc closes it.
- When a redraw replaces the focused element, focus its replacement.
- Show focus with `outline: 2px solid var(--link)` on the node's box.
