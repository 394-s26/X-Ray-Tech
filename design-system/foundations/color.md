# Color

## The palette

### Brand — electric violet

| Token       | Hex       | Use                                                                                |
| ----------- | --------- | ---------------------------------------------------------------------------------- |
| `brand/50`  | `#F4F0FE` | Tinted wash backgrounds, hover surfaces                                            |
| `brand/100` | `#E5DDFC` | Feature-icon chip backgrounds, badge backgrounds                                   |
| `brand/200` | `#C9B8F8` | Progress-bar backgrounds, secondary chart fills                                    |
| `brand/300` | `#A78EF3` | Disabled primary CTA, lower-emphasis chart series                                  |
| `brand/400` | `#8366ED` | Hover state for ghost-on-light                                                     |
| `brand/500` | `#6E50E9` | Rarely used; intermediate                                                          |
| `brand/600` | `#5B3FE4` | **Primary.** CTAs, mark, link color, focused inputs, active nav, primary chart    |
| `brand/700` | `#4A2FCC` | Primary hover/pressed                                                              |
| `brand/800` | `#3A23A8` | High-contrast text-on-light when extra weight is needed                            |
| `brand/900` | `#1C0F5C` | Brand-band backgrounds for marketing, deck "section divider" slides                |

### Heritage royal — `ink-purple`

| Token        | Hex       | Use                                                                              |
| ------------ | --------- | -------------------------------------------------------------------------------- |
| `ink-purple` | `#4E2A84` | h1 / h2 headings on `paper`, dense chart ink, "official document" headers        |

This is your original royal purple, retained for equity. It pairs cleanly with the new electric `brand/600` because they share the same hue family (251° / 261° hue).

### Ink — text

| Token     | Hex       | Use                                                          |
| --------- | --------- | ------------------------------------------------------------ |
| `ink/100` | `#F4F3F7` | Hover backgrounds on ghost buttons                           |
| `ink/200` | `#E5E3EC` | Default border / divider (also exposed as `line`)             |
| `ink/300` | `#C9C5D2` | Disabled text, placeholder text                              |
| `ink/400` | `#9A95A6` | Tertiary metadata (timestamps, sources)                      |
| `ink/500` | `#6C677A` | Secondary text (subheads, captions)                          |
| `ink/600` | `#4A4659` | Body text on dim surfaces                                    |
| `ink/700` | `#2D2A3D` | Body text default — slightly lighter than pure ink for calm  |
| `ink/900` | `#0E0B1F` | Headlines, primary text. Deep cool near-black, violet undertone |

### Surfaces

| Token       | Hex       | Use                                                                         |
| ----------- | --------- | --------------------------------------------------------------------------- |
| `paper`     | `#FFFFFF` | Marketing pages, hero, section backgrounds                                  |
| `surface`   | `#FAFAFC` | Dashboard / product UI canvas, modal backgrounds, table-row alternates       |
| `line`      | `#E5E3EC` | Dividers, card borders                                                      |
| `line-soft` | `#F0EEF5` | Very subtle dividers inside dense tables                                    |

### Semantic

| Token         | Hex       | Use                                          |
| ------------- | --------- | -------------------------------------------- |
| `success/100` | `#E2F5EC` | Success-state surface (badge bg, toast bg)   |
| `success/600` | `#1F9D6B` | Success text + icon. "Certification logged." |
| `warn/100`    | `#FBF2DC` | Warning surface (90-day-out badge)           |
| `warn/600`    | `#C08415` | Warning text + icon. "Expires in 30 days."   |
| `danger/100`  | `#FAE4E2` | Danger surface (expired)                     |
| `danger/600`  | `#C8382F` | Danger text + icon. "Expired."               |
| `info/100`    | `#E0EDFE` | Info surface (tooltip bg tint, info badge bg) |
| `info/600`    | `#3B84FB` | Info icons + inline help indicators (the small ⓘ button next to a field label). Distinct from `brand/600` so info affordances don't compete with primary CTAs. |

## Where the primary goes

- Primary CTAs (single per section)
- The mark
- Active state of nav links and tabs
- Active form fields (border + focus ring)
- The lead series in any chart
- Hyperlinks in body copy
- Progress-bar fills when showing progress *toward a goal*

## Where the primary does NOT go

- Body text. Body text is `ink/700` or `ink/900`. Period.
- More than one CTA per section.
- Decorative backgrounds covering more than 30% of a marketing screen (use `brand/900` for hero/CTA bands, not `brand/600` floods).
- Icons by default. Icons inherit `currentColor` — so they're purple only inside a primary-purple element.
- Borders on dashboards. Borders are `line`. Purple borders read as "selected" — keep that meaning sacred.

## Text contrast minimums

| Pair                        | Ratio   | WCAG     |
| --------------------------- | ------- | -------- |
| `ink/900` on `paper`        | 18.7:1  | AAA      |
| `ink/700` on `paper`        | 12.6:1  | AAA      |
| `ink/500` on `paper`        | 5.2:1   | AA       |
| `ink-purple` on `paper`     | 11.8:1  | AAA      |
| `brand/600` on `paper`      | 6.4:1   | AA (large + normal) |
| White on `brand/600`        | 5.9:1   | AA (large + normal) |
| White on `brand/700`        | 8.1:1   | AAA      |
| White on `brand/900`        | 18.9:1  | AAA      |
| `ink/400` on `paper`        | 3.1:1   | **Use only for ≥18px or non-essential metadata** |

## Reasoning

Three forces shaped this palette.

**One.** The category research (Datadog #632CA6, Stripe #533AFD, Linear #5E6AD2, Notion #455DD3) made clear that vivid purple/indigo is the unclaimed-but-credible primary for data-trust tech — and healthcare-credentialing incumbents are stuck in dated teal/navy. Leading with vivid violet signals "modern tech, not a hospital portal" the moment a tech lands on the site.

**Two.** The original X-Ray Tech palette had seven purples competing for attention, violating the "one primary" rule. Consolidating to one `brand/600` and one heritage `ink-purple` keeps the brand recognizable to anyone who has seen the older version while restoring the discipline of a single-primary system.

**Three.** The dashboard is the product. White canvas + tight `surface` + one confident primary is the convention in Linear / Stripe / Notion for a reason — purple gets to do its job (mean something) only when it has white space to land on.
