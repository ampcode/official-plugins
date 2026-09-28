---
name: creating-charts
description: "Renders interactive charts inline in replies from fenced flint code blocks. Use when visualizing data such as comparisons, trends, distributions, or breakdowns."
---

# Creating Charts

Embed an interactive chart in a reply by writing a fenced code block with the `flint` language
tag whose body is a JSON Flint chart spec (https://microsoft.github.io/flint-chart/). The Amp web
UI compiles the spec and renders it inline in the conversation.

## Spec Format

```flint
{
  "data": { "values": [ { "month": "2026-01", "revenue": 120 }, { "month": "2026-02", "revenue": 150 } ] },
  "semantic_types": { "month": "YearMonth", "revenue": "Amount" },
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": { "x": "month", "y": "revenue" }
  }
}
```

- `data` (required): exactly one of:
  - `data.values`: inline array of row objects (up to 10,000 rows). Preferred for
    aggregated data you computed yourself.
  - `data.url`: an Amp attachment or artifact URL
    (`https://ampcode.com/user-content/attachments/…` or `…/user-content/artifacts/…`).
    The viewer's browser fetches the file when the chart renders, so the rows never enter the
    conversation. The file must be a JSON array of row objects (up to 50,000 rows / 10 MB).
    Any other URL is rejected. Use this when the user attached a data file or you already have
    an Amp attachment URL for the dataset; you cannot chart arbitrary web URLs or local file
    paths this way.
- `semantic_types` (optional but recommended): maps field names to semantic types that drive axis
  formatting, color schemes, and zero-baseline decisions. Common types: `Quantity`, `Count`,
  `Amount`, `Price`, `Percentage`, `PercentageChange`, `Profit`, `Rank`, `Score`,
  `Category`, `Name`, `Status`, `Boolean`, `Date`, `Year`, `YearMonth`, `Quarter`,
  `Month`, `Week`, `Day`, `Hour`, `Duration`, `Country`, `State`, `City`, `Region`.
- `chart_spec.chartType` (required): template name. Available: `Scatter Plot`, `Regression`,
  `Connected Scatter Plot`, `Ranged Dot Plot`, `Strip Plot`, `Bar Chart`,
  `Grouped Bar Chart`, `Stacked Bar Chart`, `Lollipop Chart`, `Waterfall Chart`,
  `Gantt Chart`, `Bullet Chart`, `Histogram`, `Density Plot`, `ECDF Plot`, `Violin Plot`,
  `Boxplot`, `Pyramid Chart`, `Candlestick Chart`, `Line Chart`, `Sparkline`,
  `Bump Chart`, `Slope Chart`, `Area Chart`, `Streamgraph`, `Range Area Chart`,
  `Pie Chart`, `Donut Chart`, `Rose Chart`, `Radar Chart`, `Heatmap`, `Bar Table`,
  `KPI Card`.
- `chart_spec.encodings` (required): channel → field map. A bare string is shorthand for
  `{ "field": "name" }`. Most templates take `x`, `y`, `color`, and `column`/`row`
  (facets). Channels a template does not support are **silently ignored**, which can produce a
  misleading aggregate — use the template's exact channels:
  - `Grouped Bar Chart` groups by `group`, not `color`
  - `Pie Chart`/`Donut Chart` take the value as `size` and the category as `color`
  - `Scatter Plot` also takes `size` and `shape`; `Line Chart` also takes `strokeDash`
  - `Gantt Chart` spans `x`→`x2`; `Range Area Chart` spans `y`→`y2`;
    `Candlestick Chart` takes `open`, `high`, `low`, `close`;
    `Bullet Chart` takes `goal`; `KPI Card` takes `metric`, `value`, `goal`
  Encoding objects accept:
  - `field`: the column name
  - `aggregate`: `count`, `sum`, or `mean`
  - `sortOrder`: `ascending`/`descending` — sorts by the field's own values
  - `sortBy`: either another channel name (`"x"`, `"y"`, `"color"`) to sort this axis by
    that channel's value, or a JSON array string of explicit values, e.g.
    `"sortBy": "[\"Low\", \"Medium\", \"High\"]"`. **Not** a field name.
  - `scheme`: a Vega color scheme name (see Style Rules)
- To plot several measure columns as one series legend, pass an array of fields on a measure
  channel: `"y": ["revenue", "costs"]` folds them into colored series automatically.
- `chart_spec.chartProperties` (optional): per-template options, e.g. Line Chart:
  `interpolate`, `showPoints`, `includeZero_y`; Bar Chart: `cornerRadius`; Pie/Donut:
  `innerRadius`, `sortSlices`; Heatmap: `showTextLabels`; Scatter: `opacity`,
  `logScale`; Grouped Bar: `dodge`.
- `chart_spec.baseSize` (optional): `{ "width": 400, "height": 320 }` target size in pixels.

## Choosing the Right Chart

Readers decode position most accurately, then length, then angle, area, and color (the
Cleveland–McGill hierarchy). Put the comparison that matters on a position channel and pick the
template from the question the chart answers:

- Trend over time → `Line Chart` (`Area Chart` when the magnitude itself matters;
  `Sparkline` for a tiny inline trend)
- Compare categories → `Bar Chart` sorted by value; use horizontal bars (category on `y`,
  value on `x`) when labels are long or there are more than ~7 categories
- Compare categories across a second dimension → `Grouped Bar Chart` (few groups) or facet
  bars with `column`
- Composition over time → `Stacked Bar Chart` or `Area Chart`
- Part-to-whole snapshot → `Donut Chart` only with ≤5 slices that sum to a meaningful whole;
  otherwise a sorted `Bar Chart` (a bar chart is almost always the better answer)
- Distribution of one variable → `Histogram`; comparing distributions across groups →
  `Boxplot` or `Violin Plot`
- Relationship between two quantities → `Scatter Plot` (`Regression` to show a fit)
- Change between exactly two periods → `Slope Chart`; rank changes over time → `Bump Chart`
- Dense two-dimensional matrix → `Heatmap`
- One headline number vs. a target → `KPI Card` or `Bullet Chart`
- Avoid `Radar Chart` and `Rose Chart`: angle and area readings are inaccurate; use sorted
  bars or small multiples instead

## Style Rules

- **Sort bars by value, not alphabetically**: on the category encoding, set
  `"sortBy": "x"` (or `"y"`, whichever channel holds the measure) with
  `"sortOrder": "descending"`. Keep data order only for inherently ordered axes (time,
  Low/Medium/High); use the JSON-array `sortBy` for those.
- **Maximize data-ink**: no decorative extras. `showPoints` only when points are few enough to
  read; `showTextLabels` only on small heatmaps.
- **Color must mean something**. Do not add a `color` channel that repeats what position
  already encodes. Match the scheme to the data:
  - Categories → categorical scheme; the default `tableau10` is colorblind-aware, keep it
  - Magnitudes (Count, Amount, Quantity) → sequential scheme: `"scheme": "blues"` or
    `"viridis"`
  - Values with a meaningful midpoint (Profit, PercentageChange, Correlation, Sentiment,
    Temperature) → diverging scheme: `"scheme": "redblue"` or `"blueorange"`
- **At most 6–8 colored series**. Aggregate the long tail into an `"Other"` row, or facet with
  `column`/`row` (small multiples) instead of cramming series into one plot. Never use dual
  axes.
- **Let semantic types do the styling**: they set zero baselines for bars, axis number/date
  formats, and weekday/month ordering (e.g. `Day` orders Mon–Sun automatically). Always
  declare them.
- **State the takeaway** in one sentence of prose next to the chart; the chart shows the
  evidence, the sentence gives the conclusion.

## Examples

Comparison — horizontal bars sorted by value, largest first:

```flint
{
  "data": { "values": [
    { "endpoint": "/api/search", "p95_ms": 840 },
    { "endpoint": "/api/threads", "p95_ms": 310 },
    { "endpoint": "/api/login", "p95_ms": 95 },
    { "endpoint": "/api/upload", "p95_ms": 1250 },
    { "endpoint": "/api/settings", "p95_ms": 62 }
  ] },
  "semantic_types": { "endpoint": "Category", "p95_ms": "Duration" },
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": {
      "y": { "field": "endpoint", "sortBy": "x", "sortOrder": "descending" },
      "x": "p95_ms"
    }
  }
}
```

Trend — two measures folded into one legend with the static-series array:

```flint
{
  "data": { "values": [
    { "month": "2026-01", "revenue": 118, "costs": 74 },
    { "month": "2026-02", "revenue": 132, "costs": 78 },
    { "month": "2026-03", "revenue": 141, "costs": 90 },
    { "month": "2026-04", "revenue": 139, "costs": 88 },
    { "month": "2026-05", "revenue": 160, "costs": 92 },
    { "month": "2026-06", "revenue": 178, "costs": 97 }
  ] },
  "semantic_types": { "month": "YearMonth", "revenue": "Amount", "costs": "Amount" },
  "chart_spec": {
    "chartType": "Line Chart",
    "encodings": { "x": "month", "y": ["revenue", "costs"] },
    "chartProperties": { "showPoints": true }
  }
}
```

Matrix density — heatmap with a sequential scheme; the `Day` semantic type orders weekdays:

```flint
{
  "data": { "values": [
    { "day": "Mon", "hour": 0, "deploys": 1 }, { "day": "Mon", "hour": 6, "deploys": 4 },
    { "day": "Mon", "hour": 12, "deploys": 9 }, { "day": "Mon", "hour": 18, "deploys": 5 },
    { "day": "Tue", "hour": 0, "deploys": 0 }, { "day": "Tue", "hour": 6, "deploys": 6 },
    { "day": "Tue", "hour": 12, "deploys": 11 }, { "day": "Tue", "hour": 18, "deploys": 7 },
    { "day": "Wed", "hour": 0, "deploys": 2 }, { "day": "Wed", "hour": 6, "deploys": 5 },
    { "day": "Wed", "hour": 12, "deploys": 10 }, { "day": "Wed", "hour": 18, "deploys": 4 }
  ] },
  "semantic_types": { "day": "Day", "hour": "Hour", "deploys": "Count" },
  "chart_spec": {
    "chartType": "Heatmap",
    "encodings": {
      "x": "hour",
      "y": "day",
      "color": { "field": "deploys", "scheme": "blues" }
    },
    "chartProperties": { "showTextLabels": true }
  }
}
```

## Data Guidance

- Keep inline data small: aggregate to at most ~200 rows before charting. Use shell tools
  (`jq`, `awk`, `sort | uniq -c`, SQL, a short script) to group and summarize raw data first;
  never inline raw event-level datasets.
- To chart the output of a command (`bq`, `psql`, an API call, a log scan), write the raw
  result to a temporary file first, then aggregate that file down and inline the aggregated
  rows in `data.values`. Do not paste raw command output into the chart block. For example:
  - `bq query --format=json 'SELECT day, COUNT(*) AS n FROM t GROUP BY day' > /tmp/rows.json`
  - `psql -At -c "SELECT json_agg(r) FROM (SELECT status, COUNT(*) AS n FROM jobs GROUP BY status) r" > /tmp/rows.json`
  - `jq '[group_by(.service)[] | {service: .[0].service, p95: (map(.ms) | sort | .[length*95/100 | floor])}]' /tmp/raw.json > /tmp/rows.json`

  Prefer pushing the aggregation into the query itself (`GROUP BY`, window functions) so the
  temporary file is already small; reshape with `jq` or a short script only when the source
  cannot aggregate.
- Reserve `data.url` for data files the user attached (an
  `ampcode.com/user-content/attachments/…` URL) whose rows are already chart-ready; reference
  such a file directly instead of reading and inlining it. Files you created on disk have no
  URL — inline their aggregated rows instead.
- Chart already-aggregated rows. Prefer computing sums/means yourself over relying on
  `aggregate` encodings with many raw rows.
- Emit compact JSON (no pretty-printing) for larger datasets to save tokens.
- One chart per code block. Add a one-line takeaway in prose next to the chart; do not repeat the
  data as a table unless asked.

## When to Chart

- Comparisons, distributions, trends over time, and part-to-whole breakdowns benefit from a chart.
- A handful of values reads better as a sentence or small table; do not chart fewer than ~4 data
  points unless asked.
