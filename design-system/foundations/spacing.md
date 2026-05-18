# Spacing

A 4px base unit. Every gap, padding, and margin in the system resolves to one of these tokens.

## The scale

| Token   | Value | Use                                              |
| ------- | ----- | ------------------------------------------------ |
| `0`     | 0px   | flush                                            |
| `0_5`   | 2px   | hairline offsets                                 |
| `1`     | 4px   | icon-to-text inside a tight badge                |
| `1_5`   | 6px   | tight chip padding                                |
| `2`     | 8px   | gap between adjacent inline elements             |
| `3`     | 12px  | input/button vertical padding (sm)                |
| `4`     | 16px  | default gutter, card padding (sm)                 |
| `5`     | 20px  | between heading and body                          |
| `6`     | 24px  | card padding (md), section internal gap          |
| `8`     | 32px  | between subsections                              |
| `10`    | 40px  | hero subcopy → CTA                                |
| `12`    | 48px  | hero → next section (tight)                      |
| `16`    | 64px  | section padding mobile                            |
| `20`    | 80px  | section padding desktop                           |
| `24`    | 96px  | hero padding desktop                              |
| `32`    | 128px | between major page sections (marketing)           |
| `40`    | 160px | rare — hero block with photography               |

## Section rhythm template (marketing)

```
[overline]              → mb-3   (12px)
[h1 / h2]               → mb-5   (20px)
[body-lg]               → mb-10  (40px)
[content / CTA]
─────────────────────── → mb-24 desktop / mb-16 mobile  (96 / 64px)
[next section overline]
```

## Grid & container

- **Outer container**: `max-w-container` = 1200px, horizontally centered.
- **Gutter**: 24px desktop, 16px mobile.
- **Reading column**: `max-w-reading` = 680px for long-form paragraphs (about, case studies, blog).
- **Hero subcopy max width**: 520px (`max-w-hero-subcopy`).
- **Dashboard grid**: 12-column with 24px gutters; cards span 4 / 6 / 8 / 12 columns.

## Internal padding per element

| Element            | Padding (X × Y)               |
| ------------------ | ----------------------------- |
| Button sm          | 16 × 8                        |
| Button md          | 24 × 12                       |
| Button lg          | 32 × 14                       |
| Input              | 14 × 10                       |
| Card (sm)          | 16                            |
| Card (md)          | 24                            |
| Card (lg)          | 32                            |
| Badge              | 8 × 4                         |
| Modal              | 32                            |
| Nav (desktop)      | 24 × 16                       |
| Toast              | 16 × 12                       |
| Table cell         | 16 × 12 (header), 16 × 10 (row) |

## Gap conventions

| Context                              | Gap          |
| ------------------------------------ | ------------ |
| Buttons in a row                     | `space-3` (12px) |
| Form fields                          | `space-5` (20px) |
| Dashboard stat cards                 | `space-6` (24px) |
| Dashboard sections (vertical)        | `space-12` (48px) |
| Marketing section internals          | `space-8` (32px)  |
| Marketing section-to-section         | `space-24` (96px) / `space-16` (64px) mobile |

## The four core rules

1. **Round everything to the scale.** No `padding: 18px`. If 16 is too tight and 24 is too loose, pick which side of "wrong" you can live with.
2. **Whitespace > borders.** Reach for a gap before reaching for a divider line. A dashboard with 24px gaps between cards needs no card borders.
3. **One gap rhythm per composition.** A section that uses `space-6` between cards uses `space-6` between cards everywhere in that section. Don't alternate 24/32/24.
4. **Section-to-section spacing is bigger than you think.** 96px between marketing sections is the default. The instinct is to shrink it — resist. Generous spacing is what makes the page feel calm and confident.
