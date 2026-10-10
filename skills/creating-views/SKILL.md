---
name: creating-views
description: "Renders interactive HTML views inline in a reply from fenced amp-view blocks: charts, dashboards, explorable diagrams, UI mockups, prototypes, wireframes, and side-by-side design options. Use when seeing answers the question faster than reading: a trend or comparison across many values, a system or flow the reader should click through or step through, or a UI or design question; or when asked to chart, plot, visualize, mock up, prototype, sketch, or compare designs. For a standalone page that others will review and comment on, use creating-artifacts instead."
metadata:
  sandbox-only: true
---

# Creating Views

An `amp-view` block is a fenced code block with the `amp-view` language tag whose body is one
self-contained HTML document. The Amp web UI renders it inline in your reply, in a sandboxed frame
on the thread's own background that follows the reader's light or dark theme.

````markdown
Deep mode is now Amp's second most used mode.

```amp-view
<p class="title">Deep mode tripled in the six weeks since launch</p>
…
```

Most of the growth came from existing Smart users switching, not new users.
````

The reader sees the view in place. Do not announce it or restate it in your text; write only what
the view does not say.

## When to use a view

Use a view when seeing answers the question faster than reading:

- Data: a trend over time, a ranking, or a comparison across more than about six values.
- Systems: an architecture, flow, or state machine with more than about five parts, when the reader
  gains from clicking a part for detail or stepping through a sequence.
- Design: a UI mockup, an interaction prototype, a layout wireframe, or two or three design
  directions side by side.
- Any request to chart, plot, visualize, mock up, prototype, sketch, or build a dashboard.

Use Markdown instead for a short list, a table of a few rows, or one or two numbers. Use a
`diagram` block instead for a small static structure that reads clearly as text. A view adds
nothing to a code change summary; show the diff instead.

## The standard

A view must look like it shipped with Amp: calm, quiet, and precise. Readers glance at it between
other work, so it has one point, and that point is legible in one second. Everything else is gray
and small so that one thing stands out. Restraint is the style: when in doubt, remove.

Before writing code, write the one sentence the reader should take away. For a chart it becomes the
title; for a mockup it decides which state to show.

## The frame

- The view is as wide as the reply column: about 720px on desktop and 360px on phones. Design
  for both.
- Its height fits the document, up to 1200px; beyond that it scrolls, and the reader can open it
  full screen. Aim for under 600px.
- There is no network: every request is blocked. Inline all CSS, JS, images (as data URLs), and
  data. Chart libraries and web fonts cannot load.
- There are no popups, storage, or form submission. Clicks on `http(s)` links ask the reader
  first. Hover, clicks, and keys work inside the frame. Nothing can draw outside it.
- The source stays in the conversation. Keep it under 100 KB; aggregate data before embedding it.
- Wrap your script in a block (`{ … }`). Top-level `const top`, `name`, or `status` collide with
  browser globals and stop the script.

## Tokens

Amp sets these on `:root`. They update live when the reader switches theme. Use them for every
color; never write a hex value for anything Amp-colored.

| Token                                     | Use                                                    |
| ----------------------------------------- | ------------------------------------------------------ |
| `--background`                            | The thread background, also under the view             |
| `--foreground`                            | Primary text, the one thing that matters               |
| `--muted-foreground`                      | Secondary text, labels, axes                           |
| `--border`                                | Hairline rules, rings, the zero baseline               |
| `--grid`                                  | Chart gridlines, fainter than `--border`               |
| `--card`                                  | A 2–3% wash for a surface that stands for a real object |
| `--muted`                                 | A 7% wash for hover, selection, neutral fills          |
| `--chart-1` … `--chart-6`                 | Data series, in order                                  |
| `--chart-context`                         | Gray for context series                                |
| `--series-1` … `--series-10`              | The Amp team's dashboard palette, for many parts       |
| `--success`, `--warning`, `--destructive` | Status marks only                                      |
| `--link`                                  | Links                                                  |
| `--radius`                                | 8px                                                    |
| `--font-sans`, `--font-mono`              | System sans and mono                                   |

The base stylesheet sets the background, `--foreground` text, `--font-sans` at 13px/20px, and
`body { margin: 0 }`.

## The kit

Every view loads Amp's view kit: Amp's own components as CSS classes, Lucide icons, and `window.ui`
for charts and motion. Build with it first; write your own CSS only for what it lacks. It is what
makes a view look like Amp instead of a generic web page.

Text and layout:

- `.ui-header` wraps `.ui-title` (13px, 500) and `.ui-sub` (12px muted) with 16px below.
- `.ui-label` (12px muted), `.ui-caption` (11px muted), `.ui-muted`, `.ui-num` (tabular),
  `.ui-big` (20px headline number), `.ui-mono`, `code`.
- `.ui-stack` (grid, gap from `--gap`, default 12px; empty children collapse), `.ui-row` (flex,
  centered, gap 8px), `.ui-rule` (hairline).

Controls:

- `.ui-btn` with `.primary`, `.outline`, `.danger`, `.sm`, `.icon`, `.circle`. Press feedback,
  hover, and focus rings are built in.
- `.ui-seg` with `<button data-value="…" aria-selected="true">` children: a segmented control with
  a sliding thumb. It emits `change` with `event.detail.value`.
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

- `.ui-user-msg` (the user bubble), `.ui-tool-row` (icon, muted text, `code`), `.ui-composer`
  with `.ui-composer-input`, `.ui-composer-footer`, `.ui-spacer`, `.ui-send`, `.ui-caret`.

Wireframes:

- `.ui-wire` (a gray text bar; set its width), `.ui-wire-box` (a hairline container),
  `.ui-note` (a numbered marker).

Dashboards, after the Amp team's own pages:

- `.ui-section`: a mono uppercase section label (Amp's section label style).
- `.ui-stats` holding `.ui-stat` tiles with `.ui-stat-label`, `.ui-stat-value` (mono), and
  `.ui-stat-sub`.
- `.ui-legend` with `<span><i style="--c: var(--series-1)"></i>Name</span>` items: square
  swatches with mono uppercase names.

Motion:

- `.ui-enter` (fade and rise in, 200ms) for content that appears after an action.
- `.ui-spin` for a spinning loader icon.
- Reduced motion is handled for you.

Icons: write `<i data-icon="name"></i>` (classes `sm` 14px and `xs` 12px; inline styles carry
over), or `ui.icon('name', 'sm')` in scripts. Available: check, x, circle-check, circle-x,
circle-alert, triangle-alert, info, loader-circle, clock, arrow-up, arrow-right, arrow-down,
arrow-up-right, chevron-right, chevron-down, chevron-left, ellipsis, plus, minus, search,
terminal, file, file-code, folder, git-branch, git-pull-request, git-commit-horizontal, git-merge,
rocket, copy, external-link, paperclip, mic, settings, user, users, lock, shield-check, zap, cpu,
database, server, cloud, globe, message-square, code, eye, play, pause, square, panel-right, list,
bell, sparkle, activity. Provider logos: logo-openai, logo-anthropic, logo-google, logo-xai,
logo-grok.

`window.ui`:

- `ui.line(el, options)` draws a line chart that follows every chart rule below: nice ticks,
  light gridlines, labels on the gridlines, direct end labels that never collide, a draw-in when
  it scrolls into view, a crosshair and tooltip on hover, and arrow keys when focused. Options:
  `x` (labels), `series` (`[{ name, values, highlight, color }]`), `format(v)`, `unit`, `height`
  (200), `min`, `max`, `xTicks` (indices), `labels: false` (no end labels), `tooltipTitle(i)`,
  `annotations` (`{ type: 'band', from, to, label }`, `{ type: 'rule', y, label }`,
  `{ type: 'marker', at, label }`, `{ type: 'point', series, at, label }`). It returns
  `{ update(partialOptions) }`, which animates to new values or annotations.
- `ui.bars(el, options)` draws sorted horizontal bars with values at their ends, staggered growth
  on first view, and hover detail. Options: `items` (`[{ label, value }]` or
  `[{ label, values: [a, b] }]` with `keys` for stacked parts; `highlight` and `muted` per item,
  muted rows stay last in gray), `format(v)`, `share` (adds the percent of the total), `mono`
  (monospace labels for paths), `sort: false`.
- `ui.stack(el, options)` draws composition columns the way Amp's model usage page does: one
  stacked column per day, the first series at the bottom, dashed gridlines, mono labels, columns
  that grow in, and a hover panel listing every part with its logo. Options: `x`, `series`
  (`[{ name, values, icon, color }]`; colors follow `--series-*` in order), `percent` (true: each
  column sums to 100%), `height` (200), `legend` (true), `format(v)`, `tooltipTitle(i)`.
- `ui.leaderboard(el, options)` draws Amp's ranked cards: a colored block with the rank and a
  logo, the name and maker, the value, and the change. Options: `items`
  (`[{ name, sub, value, delta, icon, color }]`; `delta: null` shows "new"), `format(v)`
  (default percent), `deltaUnit` ('pts').
- `ui.sparkline(el, values, { color })` draws a 64×18 trend with an end dot.
- `ui.tween(el, value, { format })` animates a number in place, for readouts that follow a control.
- `ui.format(value, { compact, digits, unit, prefix, percent })` formats numbers with a real minus.

## Layout

- Put content straight on the thread background. The outermost element has no background, border,
  padding, or card. The view is part of your reply.
- Structure with space first, hairline rules second, and surfaces last. A `1px solid var(--border)`
  rule between groups beats a box around each one.
- Use a surface (`var(--card)` with a `0 0 0 1px var(--border)` ring and `var(--radius)` corners)
  only when it stands for a real object: a mocked window, a menu, a code panel. Never wrap stats,
  text, or a chart in a card, and never put a box inside a box.
- Space on a 4px scale. Use 4–8px within a group and at least twice that between groups; put more
  space above a heading than below it. Pad any surface by 12–16px.
- Left-align everything, on a few shared edges. Do not center text or layouts.
- Nest radii concentrically: an inner element's radius is the outer radius minus the padding.
- Use no shadows, except one on a mocked floating element such as a menu:
  `box-shadow: 0 0 0 1px var(--border), 0 4px 12px -4px rgb(0 0 0 / 0.16)`.

## Type

- Use Amp's sizes only: 11px for ticks and captions, 12px for secondary text, 13px for body and
  titles, and 15px or 20px for one headline number when a number really is the point.
- Use weights 400 and 500 only. Amp never uses semibold or bold. Build hierarchy with size and the
  two text colors, `--foreground` and `--muted-foreground`, not weight.
- Set `font-variant-numeric: tabular-nums` on every number that lines up. Right-align numeric
  columns. Write `1.2k`, `3.4M`, `412 ms`, `+12%`, `−3` (a real minus), with the same precision
  across a set.
- Use `--font-mono` only for code, commands, paths, IDs, and diff stats such as `+763 −40`, not
  for labels.
- Write labels in sentence case, short and specific. No eyebrow labels above titles, no all caps,
  no letter-spacing, no emoji, no "A · B · C" metadata strings, no trailing "→".
- Use `text-wrap: balance` on titles and `pretty` on prose, and keep prose under 65 characters a
  line.

## Color

Most of a good view is `--foreground`, `--muted-foreground`, `--border`, and `--grid`. Pick colors in
this order:

1. Draw everything in grays first.
2. Color only what your takeaway names: one series in `--chart-1`; when it names two or three,
   give them `--chart-1`, `--chart-2`, `--chart-3`, never the same color twice. Keep the rest in
   `--chart-context`.
3. When several categories must be told apart, use `--chart-1`, `--chart-2`, … in order, at most
   four. Group the rest as "Other" in `--chart-context`, or use small multiples. The palette is
   tuned so the first four stay distinguishable for colorblind readers.
4. For ordered values (a heatmap, intensity), use one hue from faint to strong:
   `color-mix(in oklab, var(--chart-1) 15%, var(--background))` up to `var(--chart-1)`.
5. For values that diverge from a midpoint, use `--chart-1` for one side, `--chart-2` for the
   other, and `--chart-context` for the middle.
6. Use status colors only on small marks (a dot, a delta, a badge), always next to text. A delta's
   color means good or bad, not up or down.
7. Never put text on a saturated fill. Never add gradients, glows, tinted backgrounds, or colored
   side borders. When mocking another product, use its real colors from its code.

## Charts

Use `ui.line` and `ui.bars` when they fit; they already follow these rules. Follow the rules
yourself for anything you draw by hand. Pick the form by the question:

- Change over time: a line chart.
- Comparing or ranking categories: horizontal bars, sorted by value.
- Shares of a whole with at most four parts: one stacked bar.
- A distribution: dots or a histogram.
- One or two numbers: a sentence, not a chart. A few exact values: a table.

Anatomy, modeled on Datawrapper and The Economist:

- Title: the takeaway as a sentence ("Errors fell 40% after the retry fix"), 13px weight 500.
  Under it, a 12px muted subtitle with the measure, unit, and period. No other heading.
- Plot: 160–240px tall. No frame, no background, no axis lines.
- Gridlines: horizontal only, 1px `var(--grid)`, 3–5 at round values. Draw zero as a
  `var(--border)` baseline when it is in range.
- Y labels: 11px muted, tabular, left-aligned just above their gridline, with no tick marks. Put
  the unit on the top label only.
- X labels: 11px muted, 3–5 of them, never rotated. Thin them to first and last on phones.
- Lines: 1.5px for context and 2px for the highlight, with round joins and caps and no smoothing.
  Mark only the highlighted line's last point (r = 3).
- Labels: name each line at its right end in its own color, and drop the legend. With more than
  three series, put a one-line key above the plot in colored text, not swatches.
- Bars: about 30% gap between bars, square ends, and a value label at the end of each bar. When
  every bar is labeled, drop the axis. Bars always start at zero; lines may not.
- Context: a reference line (target, average, last period) as a 1px dashed `--chart-context`
  rule with a short label. Show events as a band of `var(--foreground)` at 4% opacity with an 11px
  label at its top. Use at most three annotations.
- Text over marks gets a halo: `paint-order: stroke; stroke: var(--background); stroke-width: 3px`.
  Draw text after lines so the halo works.
- Small multiples share one scale and label axes only on the outer edges.
- Hover: a 1px `var(--border)` crosshair at the nearest point, rings on the hovered points, and a
  small tooltip in `var(--background)` with the floating-element shadow, 12px tabular text, the
  measure named. Flip it at the frame's edges. The chart must read fully without hover.
- Draw from data with small scale functions. Measure the SVG with `getBoundingClientRect().width`
  (`clientWidth` is 0 for inline SVG) and redraw from a `ResizeObserver`.

## Tables, diagrams, and mockups

- Tables: a header row in 12px muted text, a hairline rule under it, hairline rules between rows,
  28–32px rows, no vertical rules, no zebra stripes, numbers right-aligned and tabular. For
  magnitude, add a thin inline bar in `--chart-1` behind or beside the number.
- Diagrams: nodes are 12px text in a `var(--background)` box with a `var(--border)` ring and 6px
  corners. Connectors are 1px `--muted-foreground`, orthogonal, with small arrowheads. Color only
  the path that matters, in `--chart-1`. Align nodes to a grid.
- Mockups of Amp: read `server/src/routes/(app)/DESIGN.md` and the real components first, and
  reuse Amp's anatomy: 13px text, ghost buttons, one black pill for the primary action,
  `rounded-md` chips, hairline rules, no cards. Use real copy, not placeholders.
- Crop a mockup to the region that matters, inside one surface for the window. Show the state
  that decides the design, such as an open menu, an error, or a long title.
- Design options: two or three, each different on a named axis (placement, density, interaction
  model). If two options differ only in color or copy, they are one option. Name each by its
  direction ("Docked above the composer"), not "Option A", and put one muted line of trade-off
  under it. Stack full-screen options vertically; place small components side by side.

## Dashboards

When the view is a dashboard (many parts tracked over time, a ranking, a few headline facts),
follow the Amp team's dashboard language from its model usage and mode usage pages instead of the
single-takeaway chart style:

- Show composition over time with `ui.stack` in the `--series` palette. Put the largest part at
  the bottom and gather the long tail into one "Other" series in `--chart-context`.
- Rank the parts with `ui.leaderboard`, in the same order as the stack's series so each part
  keeps its color, with provider logos where they exist and the change in points.
- State headline facts in `.ui-stat` tiles: the measure and its qualifier as the label
  ("Fastest first token, p50"), the mono value, and the entity it belongs to. A tile is a named
  fact, never decoration.
- Label sections with `.ui-section`, and use a `.ui-legend` when no leaderboard names the parts.
- Here more than four colors is fine, because the hover panel and the leaderboard name every
  part. Keep the title a takeaway sentence.

## Interaction and motion

Add interaction when it answers a question the reader would otherwise ask: exact values (hover),
which option feels right (a clickable prototype), what happens if (a slider or toggle), where
something is (hover-linked notes). The view must make its point before anyone touches it.

- Use the kit's controls (`.ui-btn`, `.ui-seg`, `.ui-range`) so hover, press, and focus behave
  like Amp. For custom controls, use real `<button>` and `<input>` elements.
- Gate hover styles with `@media (hover: hover)`, and make the hover state higher contrast than
  rest. Change hover colors instantly, without transitions. Anything hover reveals must also work by
  tap and keyboard: listen to `pointerover` and `click`, not only `mouseenter`.
- Show keyboard focus with `outline: 2px solid var(--link); outline-offset: 1px`. Support the obvious
  keys for the main action (Enter, Esc, arrows on sliders come free).
- Animate only to explain a change: an element arriving, a value moving. Use 150–200ms `ease-out`
  on `transform` and `opacity` only; enter from a 2px offset with a fade; press feedback is
  `transform: scale(0.97)`. Turn it all off under `prefers-reduced-motion: reduce`. Never animate
  the whole view in, loop, or pulse.
- Keep prototype state in one plain object and re-render from it. Let the reader try again: reset
  after a short pause or offer a Reset control.
- Clickable prototypes: put two or three directions behind a switcher, show each direction's
  one-line trade-off under it, and make the action that decides the design actually work.

## Sketches and wireframes

When the question is layout or flow rather than visual detail, draw a wireframe instead of a
polished mockup:

- Content is gray bars (`.ui-wire`); containers are hairline rings (`.ui-wire-box`). Write real
  text only where it matters (button names, file names, the label that is in question).
- Color only what carries meaning in the sketch, such as diff green and red or the primary
  button.
- Number the decisions with `.ui-note` markers, list the notes beside or below
  the sketches, and highlight a note's region in every variant on hover.
- Show two or three variants side by side at the same scale, each with a short name.
- Keep the geometry crisp. No hand-drawn wobble, handwriting fonts, or fake paper textures.

## Never

- Cards around stats; rows of identical tiles; a big number with a small label and a colored delta
  as the default way to show data. (Dashboard stat tiles that state a named fact are fine.)
- Bold or semibold text, more than four text sizes, all caps labels, eyebrow labels (except
  `.ui-section` labels and the kit's mono chart labels).
- Legends with color squares where direct labels fit; rainbow series; more than four colors
  outside dashboards.
- Chart frames, both axis lines, vertical gridlines, tick marks, rotated labels, dots on every
  point, smoothed curves, gradient or opaque area fills, rounded or pill-shaped bars, 3D, pie
  charts.
- Dark tooltip boxes, information only visible on hover, entrance animations, pulsing dots,
  `transition: all`, hover effects on every element.
- Gradients, glows, emoji, icon tiles above headings, colored left borders, hard-coded hex colors.

## Check before sending

1. In an orb, save the draft and run the bundled preview script. It frames the document the way
   Amp does and screenshots it at 720px and 360px in light and dark themes, and prints script
   errors:

   ```bash
   node <skill-dir>/scripts/preview.mjs /tmp/view.html
   ```

2. Look at every screenshot. Fix errors, overflow, clipped or overlapping text, and anything
   unreadable in either theme.
3. Critique it against the standard: Is the point legible in one second? Is there at most one
   accent color? Any bold, any card, any legend that could go? Remove one more thing, then check
   again.

## Examples

A chart: the kit does the drawing, so the view is the takeaway and the data.

```html
<div class="ui-header">
  <p class="ui-title">Deep mode tripled in the six weeks since launch</p>
  <p class="ui-sub">Threads per week by agent mode</p>
</div>
<div id="chart"></div>
<script>
{
  ui.line(document.getElementById('chart'), {
    x: ['Aug 18','Aug 25','Sep 1','Sep 8','Sep 15','Sep 22','Sep 29','Oct 6','Oct 13','Oct 20','Oct 27','Nov 3'],
    series: [
      { name: 'Smart', values: [1480,1520,1490,1560,1610,1580,1600,1640,1620,1660,1690,1710] },
      { name: 'Rush', values: [620,640,610,650,660,640,630,650,660,640,650,660] },
      { name: 'Deep', values: [310,320,300,330,340,360,520,680,770,850,930,1010], highlight: true },
    ],
    annotations: [{ type: 'band', from: 5, to: 11, label: 'Since launch' }, { type: 'point', series: 'Deep', at: 5, label: '360' }],
    format: (v) => ui.format(v),
  })
}
</script>
```

A clickable prototype: real Amp pieces from the kit, one state object, a switcher, and an action
that runs through its states.

```html
<div class="ui-row" style="justify-content: space-between; margin-bottom: 12px">
  <div class="ui-seg" id="dir">
    <button data-value="inline" aria-selected="true">Inline at the call</button>
    <button data-value="docked">Docked above composer</button>
  </div>
  <button class="ui-btn sm" id="replay"><i data-icon="play" class="sm"></i>Replay</button>
</div>
<div class="ui-pane">
  <div class="ui-pane-header"><span style="color: var(--foreground)">Retry backoff</span><span class="ui-chip"><i data-icon="git-branch" class="xs"></i>fix/retry</span></div>
  <div class="ui-pane-body ui-stack">
    <div class="ui-user-msg">Push once the flaky test passes.</div>
    <div id="call"></div>
    <div class="ui-composer"><div class="ui-composer-input">Message Amp</div><div class="ui-composer-footer"><span class="ui-spacer"></span><span class="ui-send"><i data-icon="arrow-up"></i></span></div></div>
  </div>
</div>
<script>
{
  const state = { dir: 'inline', phase: 'pending' };
  const cmd = '<code>git push -u origin fix/retry</code>';
  const render = () => {
    const rows = {
      pending: `<div class="ui-tool-row"><i data-icon="terminal"></i>${cmd}<span class="ui-status" data-tone="warning"><span class="ui-dot"></span>needs approval</span></div>
        <div class="ui-row ui-enter" style="margin-top: 8px"><button class="ui-btn primary sm" data-act="approve">Approve</button><button class="ui-btn sm" data-act="deny">Deny</button></div>`,
      running: `<div class="ui-tool-row ui-enter"><i data-icon="loader-circle" class="ui-spin"></i>Pushing ${cmd}</div>`,
      done: `<div class="ui-tool-row ui-enter"><i data-icon="circle-check" style="color: var(--success)"></i>Pushed ${cmd}</div>`,
      denied: `<div class="ui-tool-row ui-enter"><i data-icon="circle-x"></i>Denied ${cmd}</div>`,
    };
    document.getElementById('call').innerHTML = rows[state.phase];
  };
  document.getElementById('dir').addEventListener('change', (e) => { state.dir = e.detail.value; state.phase = 'pending'; render(); });
  document.getElementById('replay').addEventListener('click', () => { state.phase = 'pending'; render(); });
  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act || state.phase !== 'pending') return;
    state.phase = act === 'deny' ? 'denied' : 'running';
    render();
    if (act === 'approve') setTimeout(() => { state.phase = 'done'; render(); }, 900);
  });
  render();
}
</script>
```
