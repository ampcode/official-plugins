# Charts, tables, and dashboards

A chart is a claim drawn from data. Decide each layer in this order, and let each decision follow from the one before it:

1. Claim: the sentence the reader should take away. It becomes the title.
2. Data: the rows the claim rests on, aggregated before embedding. Note the scope and how the source could mislead.
3. Transform: the quantity the claim is about, computed from the rows (a ratio, a share, a cumulative share, a rate).
4. Form: the mark that shows that quantity (line, bar, dot, rule).
5. Encoding: which visual channel carries the quantity, and which single thing gets color.
6. Scales: zero or not, linear or log, shared across panels.
7. Guides: labels, keys, gridlines, and annotations, only those the reader needs to check the claim.

Most failed charts plot the raw data in a default form and then write a title the chart does not show. Work down the list instead.

## Transform the data to the claim

Plot the quantity the title states, not the inputs it was computed from:

- "X tripled" or "grew 4×": index each series to its own start (value ÷ first value) and plot multiples, with a rule at 1×. Raw values on one axis hide the smaller series' growth. See `examples/indexed-lines.html`.
- "X is 38% of all Y": draw the share, as bars with `share: true` or one stacked bar, so 38% is visible as a length. Raw counts make the reader divide.
- "Half of threads finish within 2 weeks" or any "N% within X": draw the cumulative share against X, with a rule at the N% the title quotes and a labeled point where the curve crosses it. A histogram makes the reader add up bins. See `examples/cumulative-share.html`.
- Comparing groups of different sizes: plot a rate per unit (per user, per 1,000 requests), and say the denominator in the subtitle.
- Growth over uneven periods: state a compounded rate per period, not a total over periods of different lengths.
- A partial period (this week so far): draw its point or bar hollow or dashed and label it "so far", or leave it out. Never let a partial period read as a drop.
- Before and after a change: plot the difference, or both series indexed to the change, not two absolute series on different scales.

## Pick the form by the question

- Change over time: a line chart. With one or two points per series, use a sentence or a slope chart instead.
- Comparing or ranking categories: horizontal bars, sorted by value. See `examples/highlighted-bars.html`.
- Shares of a whole with at most four parts: one stacked bar. With more parts, ranked bars with shares.
- A distribution: dots (a strip plot) when there are fewer than about 30 values, so every value shows; a histogram or a cumulative share when there are more. Do not draw percentile lines or box plots for a handful of values.
- Two measures per item: a scatter plot with the items the claim names labeled directly.
- How a number is derived (a cost, a capacity, a conversion): a calculation ledger. See `examples/calculation.html` and "Show how a number is computed" below.
- One or two numbers: a sentence, not a chart. A few exact values: a table.
- Two measures over time on different units: index both, or draw two small charts one above the other with a shared x axis. Never use two y axes on one chart.
- Never let area, bubble size, or angle carry the point: no pie or donut charts, no bubble charts, no treemaps for comparison, no area fills under lines.

## Encode by accuracy

Readers judge position most accurately, then length, then angle and area, then color. Put the quantity the claim compares on position or length:

- Values the reader compares go on a common baseline (bars from zero, dots on one axis), not in separate stacks or panels with different scales.
- Use color to pick out the one thing the title names, not to carry a value. When color must carry a value (a heatmap), add the number as text.
- In stacked bars, only the bottom part has a common baseline. Put the part the claim is about at the bottom, or use side-by-side bars.

## Scales

- Bars always start at zero. Lines may start elsewhere when the range matters more than the level; say so with labeled gridlines.
- Use a log scale when values span more than about two orders of magnitude or the claim is about ratios. Label it with human ticks (1, 10, 100, 1k, or 1 day, 1 week, 1 month), never exponents, and say "log scale" in the subtitle.
- Small multiples share one scale, and label axes only on the outer edges. If the panels need different scales to be readable, the claim is probably about shape; index them instead.
- Leave headroom so the top value does not touch the edge, and round the top tick to a value that reads naturally.
- Set `max` on `ui.bars` when the values have a natural ceiling, such as 100 for scores, so bars do not look full when they are not.

## Labels, keys, and legends

- Name each line at its right end in its own color. `ui.line` does this; hand-drawn charts must too.
- With more than three series, put a one-line key above the plot in colored text, not swatches. Where a series has an answer the reader wants (its final value, its multiple), the key line states it: "Deep 3.1×".
- Group a long tail into one muted row ("Seven others") last, and list its members in its hover detail or in the caption. Name the count, not "Other".
- Use a swatch legend (`.ui-legend`) only on dashboards, where many parts share a color system and a leaderboard or hover panel names them.
- Label values at the end of bars and drop the value axis. Put labels outside short bars instead of truncating them.
- Write axis labels only when the title and subtitle do not already say the unit.

## Annotations

- Label every value the title quotes, at the mark it comes from. If the title says "54% by 2 weeks", the chart has a point labeled 54% at 2 weeks.
- Name the cause of a change where it happens: a band or marker labeled "Retry fix shipped", not an unexplained jump.
- Use at most three annotations. More turns the chart into a document; move the rest to the caption.
- Show a reference (target, average, last period) as a 1px dashed `--chart-context` rule with a short label.
- Show events as a band of `var(--foreground)` at 4% opacity with an 11px label at its top.

## Color for many values

The main guide's Color section covers the default: grays plus one accent. When the data needs more:

- Categories that must be told apart: `--chart-1`, `--chart-2`, … in order, at most four. Group the rest as "Seven others" in `--chart-context`, or use small multiples. The palette is tuned so the first four stay distinguishable for colorblind readers.
- Ordered values (a heatmap, intensity): one hue from faint to strong, from `color-mix(in oklab, var(--chart-1) 15%, var(--background))` up to `var(--chart-1)`.
- Values that diverge from a midpoint: `--chart-1` for one side, `--chart-2` for the other, and `--chart-context` for the middle.
- A delta's color means good or bad, not up or down: a drop in errors is `--success`.

## Anatomy

Modeled on Datawrapper and The Economist. `ui.line` and `ui.bars` already follow these; follow them yourself for anything you draw by hand.

- Title: the takeaway as a sentence ("Errors fell 40% after the retry fix"), 13px weight 500. Under it, a 12px muted subtitle with the measure, unit, period, and scope. No other heading.
- Plot: 160–240px tall. No frame, no background, no axis lines.
- Gridlines: only across the value axis (horizontal for a line chart, vertical for time in a timeline), 1px `var(--grid)`, 3–5 at round values. Draw zero as a `var(--border)` baseline when it is in range.
- Y labels: 11px muted, tabular, left-aligned just above their gridline, with no tick marks. Put the unit on the top label only.
- X labels: 11px muted, 3–5 of them, never rotated. Thin them to first and last on phones.
- Lines: 1.5px for context and 2px for the highlight, with round joins and caps and no smoothing. Mark only the highlighted line's last point (r = 3), plus any point an annotation names.
- Bars: about 30% gap between bars, square ends, and a value label at the end of each bar.
- Text over marks gets a halo: `paint-order: stroke; stroke: var(--background); stroke-width: 3px`. Draw text after lines so the halo works.
- Hover: a 1px `var(--border)` crosshair at the nearest point, rings on the hovered points, and a small tooltip in `var(--background)` with the floating-element shadow, 12px tabular text, the measure named. Flip it at the frame's edges. The chart must read fully without hover.
- Never: chart frames, both axis lines, vertical gridlines, tick marks, rotated labels, dots on every point, smoothed curves, gradient or opaque area fills, rounded or pill-shaped bars, 3D, rainbow series.

## Drawing a chart by hand

When the kit has no chart for the form (dots, a cumulative share, a scatter, a log axis, a slope chart), draw an inline SVG. `examples/cumulative-share.html` is the pattern:

- Keep the data in one array and compute every number the title and labels state from it.
- Write small scale functions (`x(v)`, `y(v)`) from the domain to pixels, with a margin object for labels.
- Measure the SVG with `getBoundingClientRect().width` (`clientWidth` is 0 for inline SVG), build the markup in one `draw()`, and call it from a `ResizeObserver`.
- Thin labels and shrink margins by width, so the 360px version keeps every label it needs.
- For a readout, find the nearest point to the pointer, update one line of text above or beside the plot, and step through points with arrow keys when the SVG has focus (`tabindex="0"`). The default readout shows the point the title quotes.

## Check the claim

- Every number in the title appears in the chart as a labeled mark, and the code computes it from the embedded data.
- The title's verb matches the shape: "tripled" needs a multiple near 3, "fell" needs a drop the eye sees, "most" needs a share above 50%.
- A calculator or what-if view opens on the observed values, not on round placeholders, and its title is computed from the current state so it never claims something the controls contradict.
- Name what the data cannot show: sampling, a partial period, a proxy measure.

## Tables

Use a table when the reader will look up or verify exact values, or when each row has several attributes.

- A header row in 12px muted text, a hairline rule under it, hairline rules between rows, 28–32px rows, no vertical rules, no zebra stripes, numbers right-aligned and tabular.
- Sort by the column the title is about, and put a thin inline bar in `--chart-1` beside that column only, so magnitude reads without the reader comparing digits.
- A verification table backs a chart: the same numbers, the source per row, and the rows the chart grouped as "others". Put it below the chart, collapsed behind a `.ui-btn` when it is long.
- On phones, drop or merge columns instead of scrolling sideways; shorten headers.
- A filterable catalogue (models, plugins, endpoints) is a table with a search field and a `.ui-seg` filter above it; show the count that matches, and open on the filter the conversation is about.

## Show how a number is computed

When the claim is a computed number (a monthly cost, a capacity limit, a converted balance), show the derivation so the reader can check every step. See `examples/calculation.html`.

- Write it as a ledger, one term per row: the operator, the value right-aligned and tabular, and what the term is in muted text. Put each intermediate result on its own `=` row under a hairline, and the final result last at 15px.
- Say where each constant comes from in its row ("measured on one snapshot", "list price"), and mark which terms are assumptions.
- Put each input's control in its own row, so the reader sees which term it changes. Open on the observed values.
- Compute the title from the result, and follow the ledger with one sentence that answers the next question: the marginal cost of one more unit, the break-even point, or the cheapest alternative.
- When two formulas are compared (before and after a price change), show both ledgers side by side with the same rows, so only the changed terms differ.

## Comparison matrices

When options differ on several yes/no or short-text attributes (which steps each approach skips, what each plan includes):

- Options are columns, at most four, with today's option first; attributes are rows in the order a reader would ask about them.
- Show only the rows where the options differ, and say how many identical rows were left out. Rows where every option says yes teach nothing.
- Write cells as short words ("yes", "no", "on the user path", "done ahead"), and color only the cells that make the title's point: `--chart-1` text for the winning cell, never filled cells.
- Put one sentence above or below that states the trade-off the matrix shows.

## Decision matrices

When the reader must choose between options scored on several criteria, see `examples/decision-matrix.html`:

- Options are columns or rows, criteria the other axis, with each score as a number and a short reason.
- Weights are sliders the reader can move; the totals update with `ui.bars(...).update()`, never by recreating the chart.
- The title names the current pick and is computed from the state.
- One sentence names the smallest change that flips the pick ("Weighting cost 15 points higher picks Postgres"), because that is what the reader is really deciding.
- Open on the weights the conversation agreed on.

## Dashboards

When the view is a dashboard (many parts tracked over time, a ranking, a few headline facts), follow the Amp team's dashboard language from its model usage and mode usage pages instead of the single-takeaway chart style:

- Show composition over time with `ui.stack` in the `--series` palette. Put the largest part at the bottom and gather the long tail into one "Other" series in `--chart-context`.
- Rank the parts with `ui.leaderboard`, in the same order as the stack's series so each part keeps its color, with provider logos where they exist and the change in points.
- State headline facts in `.ui-stat` tiles: the measure and its qualifier as the label ("Fastest first token, p50"), the mono value, and the entity it belongs to. A tile is a named fact, never decoration.
- Label sections with `.ui-section`, and use a `.ui-legend` when no leaderboard names the parts.
- Here more than four colors is fine, because the hover panel and the leaderboard name every part. Keep the title a takeaway sentence.
- A personal recap (a year in review, a person's activity) is a dashboard about one person: lead with the one fact they would repeat to someone else, then two or three supporting charts, each titled with its own takeaway. Keep it to facts from the data; no superlatives the numbers do not support.
