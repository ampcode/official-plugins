---
name: creating-views
description: 'Renders charts, graphs, diagrams, and quick UI experiments inline in a reply as interactive HTML in fenced amp-view blocks, with no files, build, or dev server. Use for a chart or graph of data, such as a trend, a ranking, a distribution, or a comparison; for any diagram, such as an architecture, flowchart, sequence diagram, state machine, timeline, race condition, or file or folder tree, static or one the reader can click or step through; for a calculation the reader can change; and for small UI experiments: mocking up a component or screen, prototyping an interaction, sketching a layout, or comparing two or three design directions side by side. Use when asked to chart, plot, graph, visualize, diagram, explain a race or where time goes, show how a number is computed, build a dashboard, mock up, prototype, sketch, or try out a UI idea.'
metadata:
  sandbox-only: true
---

# Creating Views

An `amp-view` block is a fenced code block with the `amp-view` language tag whose body is one self-contained HTML document. The Amp web UI renders it inline in your reply, in a sandboxed frame on the thread's own background that follows the reader's light or dark theme.

````markdown
Deep mode is now Amp's second most used mode.

```amp-view
<div class="ui-header"><p class="ui-title">Deep mode tripled in the six weeks since launch</p>…</div>
…
```

Most of the growth came from existing Smart users switching, not new users.
````

The reader sees the view in place. Do not announce it or restate it in your text; write only what the view does not say.

## When to use a view

Use a view when seeing answers the question faster than reading:

- Data: a trend over time, a ranking, a distribution, or a comparison across more than about six values.
- Systems: any diagram, such as an architecture, flowchart, sequence, state machine, timeline, race between callers, tree, or commit graph, including small static ones.
- Derivations: how a number is computed, with inputs the reader can change.
- Design: a quick UI experiment, such as a component or screen mockup, an interaction prototype, a layout wireframe, or two or three design directions side by side.
- Any request to chart, plot, graph, visualize, diagram, mock up, prototype, sketch, try out a UI idea, or build a dashboard.

Use Markdown instead for a short list, a table of a few rows, or one or two numbers. A view adds nothing to a code change summary; show the diff instead.

## The standard

A view must look like it shipped with Amp: calm, quiet, and precise. Readers glance at it between other work, so it has one point, and that point is legible in one second. Everything else is gray and small so that one thing stands out. Restraint is the style: when in doubt, remove.

Looking right is the easy part. Views fail far more often because the chart does not show what the title claims, so every view must also prove its point:

- Before writing code, write the one sentence the reader should take away. For a chart it becomes the title; for a mockup or diagram it decides which state to open on.
- Compute every number in the title from the data embedded in the view. Never quote a number the view does not contain, and never let a title rest on a default or placeholder value; in a calculator, generate the title from the current state.
- Choose the encoding the claim needs. A claim about a multiple plots the multiple, a claim about a share draws the share, and "N% within X" draws a cumulative share. `reference/charts.md` covers this.
- Make the default state show the point at 360px without any interaction. Open a stepper on the step that proves the title, color the path that matters before anyone clicks, and open a mockup on the state that decides the design. Screenshots, phones, and skimming readers only ever see the default state.
- Say in a muted subtitle or caption what was measured, over what scope, and how the measure could mislead (a partial week, a known bias in the source, an assumption).

## How to build one

1. Write the takeaway sentence.
2. Read the reference for the kind of view, in this skill's `reference/` directory:
   - `charts.md` for charts, distributions, calculations, comparison and decision matrices, tables, and dashboards.
   - `ui-explorations.md` for mockups, prototypes, design options, interactive experiments, and wireframes.
   - `diagrams.md` for architecture diagrams, flowcharts, sequence diagrams, state machines, timelines, race timelines, trees, commit graphs, and step-through explainers.
3. Start from the closest example in `examples/`. Each is a complete view that follows this guide; reuse its structure and code, and replace its placeholder subject and data with yours.
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
4. Preview and check it as described in "Check before sending".

## The frame

- The view is as wide as the reply column: about 720px on desktop and 360px on phones. Design for both.
- Its height fits the document, so the whole view shows in the reply without scrolling inside it, and the reader can open it full screen. Aim for under 600px; past that, cut or split it into two views. Never size anything from the frame's height (`vh` units, `height: 100%` on `html` or `body`): the frame grows to fit the page, so such a page keeps growing.
- There is no network: every request is blocked. Inline all CSS, JS, images (as data URLs), and data. Chart libraries and web fonts cannot load.
- There are no popups, storage, or form submission. Clicks on `http(s)` links ask the reader first. Hover, clicks, and keys work inside the frame. Nothing can draw outside it.
- The source stays in the conversation. Keep it under 100 KB; aggregate data before embedding it.
- Wrap your script in a block (`{ … }`). Top-level `const top`, `name`, or `status` collide with browser globals and stop the script.

## Tokens

Amp sets these on `:root`. They update live when the reader switches theme. Use them for every color; never write a hex value for anything Amp-colored.

| Token                                     | Use                                                     |
| ----------------------------------------- | ------------------------------------------------------- |
| `--background`                            | The thread background, also under the view              |
| `--foreground`                            | Primary text, the one thing that matters                |
| `--muted-foreground`                      | Secondary text, labels, axes                            |
| `--border`                                | Hairline rules, rings, the zero baseline                |
| `--grid`                                  | Chart gridlines, fainter than `--border`                |
| `--card`                                  | A 2–3% wash for a surface that stands for a real object |
| `--muted`                                 | A 7% wash for hover, selection, neutral fills           |
| `--chart-1` … `--chart-6`                 | Data series, in order                                   |
| `--chart-context`                         | Gray for context series                                 |
| `--series-1` … `--series-10`              | The Amp team's dashboard palette, for many parts        |
| `--success`, `--warning`, `--destructive` | Status marks only                                       |
| `--link`                                  | Links                                                   |
| `--radius`                                | 8px                                                     |
| `--font-sans`, `--font-mono`              | System sans and mono                                    |

The base stylesheet sets the background, `--foreground` text, `--font-sans` at 13px/20px, and `body { margin: 0 }`. It does not restyle `a`, `b`, `strong`, or `h1` to `h4`, which render as browser blue links, bold, and large headings; use the kit's text classes instead of these elements.

## The kit

Every view loads Amp's view kit: Amp's own components as CSS classes, Lucide icons, and `window.ui` for charts and motion. Build with it first; write your own CSS only for what it lacks. It is what makes a view look like Amp instead of a generic web page.

Text and layout:

- `.ui-header` wraps `.ui-title` (13px, 500) and `.ui-sub` (12px muted) with 16px below. Every view opens with one, prototypes included.
- `.ui-label` (12px muted), `.ui-caption` (11px muted), `.ui-muted`, `.ui-num` (tabular), `.ui-big` (20px headline number), `.ui-mono`, `code`.
- `.ui-stack` (grid, gap from `--gap`, default 12px; empty children collapse), `.ui-row` (flex, centered, gap 8px), `.ui-rule` (hairline).

Controls:

- `.ui-btn` with `.primary`, `.outline`, `.danger`, `.sm`, `.icon`, `.circle`. Press feedback, hover, and focus rings are built in.
- `.ui-seg` with `<button data-value="…" aria-selected="true">` children: a segmented control with a sliding thumb. It emits `change` with `event.detail.value`. It does not wrap, so keep its labels short enough to fit 360px.
- `.ui-range` on `<input type="range">`: a slider whose track fills up to the thumb.

Surfaces, for things that stand for real objects:

- `.ui-pane` with `.ui-pane-header` and `.ui-pane-body`: a window or pane.
- `.ui-float`: a menu, popover, or floating panel, with its shadow.
- `.ui-surface`: a 2–3% wash with a hairline ring.
- `.ui-menu` with `.ui-menu-item` (an optional `.ui-hint` on the right) and `.ui-menu-sep`.
- `.ui-table` with `th`, `td`, `.num` for numeric cells.

Small marks:

- `.ui-chip`, `.ui-kbd`, `.ui-avatar`, `.ui-dot`.
- `.ui-status` (a dot and text), `.ui-delta`, and `.ui-dot` take `data-tone="success|warning|danger|info"`.

Amp's transcript, for mockups of Amp:

- `.ui-user-msg` (the user bubble), `.ui-tool-row` (muted text with `code`; Amp's tool rows have no icon), `.ui-composer` with `.ui-composer-input`, `.ui-composer-footer`, `.ui-spacer`, `.ui-send`, `.ui-caret`.

Wireframes:

- `.ui-wire` (a gray text bar; set its width), `.ui-wire-box` (a hairline container), `.ui-note` (a numbered marker).

Dashboards, after the Amp team's own pages:

- `.ui-section`: a mono uppercase section label (Amp's section label style).
- `.ui-stats` holding `.ui-stat` tiles with `.ui-stat-label`, `.ui-stat-value` (mono), and `.ui-stat-sub`.
- `.ui-legend` with `<span><i style="--c: var(--series-1)"></i>Name</span>` items: square swatches with mono uppercase names.

Motion:

- `.ui-enter` (fade and rise in, 200ms) for content that appears after an action.
- `.ui-spin` for a spinning loader icon.
- Reduced motion is handled for you.

Icons: write `<i data-icon="name"></i>` (classes `sm` 14px and `xs` 12px; inline styles carry over), or `ui.icon('name', 'sm')` in scripts; icons added later by script render too. Available: check, x, circle-check, circle-x, circle-alert, triangle-alert, info, loader-circle, clock, arrow-up, arrow-right, arrow-down, arrow-up-right, chevron-right, chevron-down, chevron-left, ellipsis, plus, minus, search, terminal, file, file-code, folder, git-branch, git-pull-request, git-commit-horizontal, git-merge, rocket, copy, external-link, paperclip, mic, settings, user, users, lock, shield-check, zap, cpu, database, server, cloud, globe, message-square, code, eye, play, pause, square, panel-right, list, bell, sparkle, activity. Provider logos: logo-openai, logo-anthropic, logo-google, logo-xai, logo-grok.

`window.ui`:

- `ui.line(el, options)` draws a line chart with nice ticks, light gridlines, labels on the gridlines, direct end labels that never collide, a draw-in when it scrolls into view, a crosshair and tooltip on hover, and arrow keys when focused. Options: `x` (labels), `series` (`[{ name, values, highlight, color }]`; highlighted series get `--chart-1`, `--chart-2`, … in order and the rest gray), `format(v)`, `unit`, `height` (200), `min`, `max`, `xTicks` (indices), `labels: false` (no end labels), `tooltipTitle(i)`, `annotations` (`{ type: 'band', from, to, label }`, `{ type: 'rule', y, label }`, `{ type: 'marker', at, label }`, `{ type: 'point', series, at, label }`). It returns `{ update(partialOptions) }`, which animates to new values or annotations.
- `ui.bars(el, options)` draws sorted horizontal bars with values at their ends, staggered growth on first view, and hover detail. Options: `items` (`[{ label, value }]` or `[{ label, values: [a, b] }]` with `keys` for stacked parts; `highlight` and `muted` per item: with any highlight the other bars turn gray, and muted rows stay last in gray), `format(v)`, `share` (adds the percent of the total), `max` (a fixed scale, such as 100 for scores), `mono` (monospace labels for paths), `sort: false`. It returns `{ update(partialOptions) }`, which redraws without replaying the growth.
- `ui.stack(el, options)` draws composition columns the way Amp's model usage page does: one stacked column per day, the first series at the bottom, dashed gridlines, mono labels, columns that grow in, and a hover panel listing every part with its logo. Options: `x`, `series` (`[{ name, values, icon, color }]`; colors follow `--series-*` in order), `percent` (true: each column sums to 100%), `height` (200), `legend` (true), `format(v)`, `tooltipTitle(i)`.
- `ui.leaderboard(el, options)` draws Amp's ranked cards: a colored block with the rank and a logo, the name and maker, the value, and the change. Options: `items` (`[{ name, sub, value, delta, icon, color }]`; `delta: null` shows "new"), `format(v)` (default percent), `deltaUnit` ('pts').
- `ui.sparkline(el, values, { color })` draws a 64×18 trend with an end dot.
- `ui.tween(el, value, { format })` animates a number in place, for readouts that follow a control.
- `ui.format(value, { compact, digits, unit, prefix, percent })` formats numbers with a real minus.

## Layout

- Put content straight on the thread background. The outermost element has no background, border, padding, or card. The view is part of your reply.
- Structure with space first, hairline rules second, and surfaces last. A `1px solid var(--border)` rule between groups beats a box around each one.
- Use a surface (`var(--card)` with a `0 0 0 1px var(--border)` ring and `var(--radius)` corners) only when it stands for a real object: a mocked window, a menu, a code panel. Never wrap text or a chart in a card, never put a box inside a box, and use `.ui-stat` tiles only on dashboards, where each states a named fact.
- Space on a 4px scale. Use 4–8px within a group and at least twice that between groups; put more space above a heading than below it. Pad any surface by 12–16px.
- Left-align everything, on a few shared edges. Do not center text or layouts.
- Nest radii concentrically: an inner element's radius is the outer radius minus the padding.
- Use no shadows, except one on a mocked floating element such as a menu: `box-shadow: 0 0 0 1px var(--border), 0 4px 12px -4px rgb(0 0 0 / 0.16)`.
- At 360px, nothing scrolls sideways or gets clipped. Give grid and flex children `min-width: 0`, let rows wrap, and reflow wide structures into one column instead of setting a `min-width`.

## Type

- Use Amp's sizes only: 11px for ticks, captions, and code in a view, 12px for secondary text, 13px for body and titles, and 15px or 20px for one headline number when a number really is the point.
- Use weights 400 and 500 only. Build hierarchy with size and the two text colors, `--foreground` and `--muted-foreground`, not weight.
- Set `font-variant-numeric: tabular-nums` on every number that lines up. Right-align numeric columns. Write `1.2k`, `3.4M`, `412 ms`, `+12%`, `−3` (a real minus), with the same precision across a set.
- Use `--font-mono` only for code, commands, paths, IDs, and diff stats such as `+763 −40`, not for labels.
- Write the view's own labels in sentence case, short and specific. No eyebrow labels above titles, no all caps, no letter-spacing, no emoji, no "A · B · C" metadata strings, no trailing "→". Copy inside a mockup follows the mocked product's rules instead.
- Use `text-wrap: balance` on titles and `pretty` on prose, and keep prose under 65 characters a line.

## Color

Most of a good view is `--foreground`, `--muted-foreground`, `--border`, and `--grid`.

1. Draw everything in grays first.
2. Color only what your takeaway names: one thing in `--chart-1`; when it names two or three, give them `--chart-1`, `--chart-2`, `--chart-3`, never the same color twice. Keep the rest in `--chart-context`.
3. One hue means one thing across the whole view. If blue is the highlighted service in one chart, it cannot mean a different category in the next.
4. Use status colors only on small marks (a dot, a delta, a badge), always next to text. A status color means good or bad, never an event or a category.
5. Never put text on a saturated fill. Never add gradients, glows, tinted backgrounds, or colored side borders. When mocking another product, use its real colors from its code.
6. Do not fade text the reader must read below `--muted-foreground`. Mark "not yet" or "not taken" with `--chart-context`, dashes, or an outline, not with opacity.

`reference/charts.md` covers color for many categories, ordered values, and diverging values.

## Interaction and motion

Add interaction when it answers a question the reader would otherwise ask: exact values (hover), which option feels right (a clickable prototype), what happens if (a slider or toggle), where something is (hover-linked notes). The view must make its point before anyone touches it.

- Use the kit's controls (`.ui-btn`, `.ui-seg`, `.ui-range`) so hover, press, and focus behave like Amp. For custom controls, use real `<button>` and `<input>` elements.
- Gate hover styles with `@media (hover: hover)`, and make the hover state higher contrast than rest. Change hover colors instantly, without transitions. Anything hover reveals must also work by tap and keyboard: listen to `pointerover` and `click`, not only `mouseenter`.
- Show keyboard focus with `outline: 2px solid var(--link); outline-offset: 1px`. Support the obvious keys for the main action (Enter, Esc, arrows to step; arrows on sliders come free). When a re-render replaces the focused element, move focus back to its replacement.
- Animate only to explain a change: an element arriving, a value moving. Use 150–200ms `ease-out` on `transform` and `opacity` only; enter from a 2px offset with a fade; press feedback is `transform: scale(0.97)`. Turn it all off under `prefers-reduced-motion: reduce`. Never animate the whole view in, loop, or pulse.
- Keep interactive state in one plain object and re-render from it. Let the reader try again: reset after a short pause or offer a Reset control.

## Never

- Cards around text or charts; rows of identical tiles outside a dashboard; a big number with a small label and a colored delta as the default way to show data.
- Bold or semibold text, more than four text sizes, all caps labels, eyebrow labels (except `.ui-section` labels and the kit's mono chart labels).
- Information only visible on hover, dark tooltip boxes, entrance animations of the whole view, pulsing dots, `transition: all`, hover effects on every element.
- Gradients, glows, emoji, icon tiles above headings, colored left borders, hard-coded hex colors for anything Amp-colored.

## Check before sending

1. In an orb, save the draft and run the bundled preview script. It frames the document the way Amp does, screenshots it at 720px and 360px in light and dark themes, prints script errors, and prints a `check:` line for each rule a draft commonly breaks: hard-coded colors, heavy weights, bold or heading elements, frame-height sizing, inner scrolling, content wider than the frame, a view taller than 800px, a missing title, and the numbers the title states.

   ```bash
   node <skill-dir>/scripts/preview.mjs /tmp/view.html
   ```

2. Fix every error and every `check:` line, unless you are sure the exception applies (hex colors in a mockup of another product). For each number the title states, find where the view computes it.
3. Look at every screenshot. Fix overflow, clipped or overlapping text, and anything unreadable in either theme. Confirm the 360px light screenshot alone makes the point.
4. Critique it against the standard: Is the point legible in one second? Does the encoding fit the claim? Is there at most one accent color? Any bold, any card, any legend that could go? Remove one more thing, then check again.
