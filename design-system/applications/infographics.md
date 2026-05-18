# Infographics

## Canvas sizes

| Use                       | Pixels       | Aspect |
| ------------------------- | ------------ | ------ |
| Blog embed                | 1200×800     | 3:2    |
| LinkedIn carousel slide   | 1200×1200    | 1:1    |
| Twitter / X image         | 1200×675     | 16:9   |
| Pinterest                 | 1000×1500    | 2:3    |
| Print one-pager           | 8.5×11 in    | letter |

## Four types

### 1. Comparison
Side-by-side table or two-column "before / after."
- Heading row in `overline brand/600`.
- Body cells in `body-md` ink/700.
- Numbers in `mono-md`.
- A single vertical hairline at `line` (#E5E3EC) divides the two columns.

### 2. Process flow (3–5 steps)
Numbered steps, top to bottom or left to right.
- Numbers rendered in `mono-xl` `brand/600`.
- Step title `h3` Geist.
- Step description `body-md` ink/700.
- **No arrows.** Gaps and numbering do the work.

### 3. Big number
A single huge stat dominates the canvas.
- `mono-xl` rendered at 200–280px, `brand/600`.
- One sentence below in `h2` ink/900.
- Source line in `caption` ink/500.
- Mark `bottom-right` 100px wide.

### 4. Breakdown / chart
A horizontal bar chart or donut showing composition.
- Lead series `brand/600`, secondary `brand/300`, tertiary `ink/200`.
- Always include axis labels and exact values.
- Title (`h3`) and subtitle (`body-sm`) at top.

## Layout rules

- **Bleed**: 64px from edges on web canvases, 24px on print.
- **One headline. One supporting visual. One data point per infographic.** If you have three insights, you have three infographics.
- **Lockup placement**: bottom-right for web, bottom-center for print.
- **Whitespace > borders.** Don't enclose every section in a rounded rectangle.

## Anti-patterns

- 3D pie charts.
- Word-clouds.
- "Cluttered infographic with 14 stats and tiny icons." Banned.
- Using emoji as data labels.
- Color-coded categories that need a legend bigger than the chart.
- Photographs of people overlaid on the data.

## Generation workflow (for Claude / AI tools)

When generating an infographic via Claude Design or any AI assistant:

1. Specify the canvas size and aspect.
2. Specify the type (comparison / process / big-number / breakdown).
3. Provide the one headline, one data point, and source.
4. Reference this design system: "Use Geist for headings, JetBrains Mono for numbers, brand/600 = #5B3FE4, paper = #FFFFFF, lockup bottom-right."
5. Specify what to omit explicitly: no decorative icons, no clip art, no gradient fills, no shadow effects.

## Example brief — blog-embedded comparison

**Title**: "Before / after X-Ray Tech"
**Type**: comparison
**Data**:
- "Time spent on monthly CE reconciliation" — Before: 2 hours, After: 5 minutes
- "Surprise lapsed credentials" — Before: 1.3 per year, After: 0
- "Tools used" — Before: 4 state-board sites + Google Sheets, After: 1 dashboard

**Style**: 1200×800 canvas, paper background, two-column with hairline divider, Geist heading, JetBrains Mono numbers in brand/600. No icons. Lockup bottom-right.
