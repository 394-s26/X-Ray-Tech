# Logo — usage

## File inventory

| File                       | When to use                                                                    |
| -------------------------- | ------------------------------------------------------------------------------ |
| `lockup-horizontal.svg`    | **Default.** Navigation bar, footer, business cards, slide title-bars.         |
| `lockup-stacked.svg`       | Square or near-square spaces — Instagram avatar, OG image, deck title slides.  |
| `mark.svg`                 | App icons, favicons (large), product UI corners, social-post mark stamps.      |
| `mark-inverse.svg`         | Mark on `brand/600` or `ink/900` backgrounds — never on photos without scrim.  |
| `wordmark.svg`             | Single-color contexts that can't render the mark cleanly (fax, embroidery, ≤16px). |
| `favicon.svg`              | 16–32px favicons only. Stroke and core sized down proportionally.              |

Rasters (`.png` + `.jpg`) live alongside each SVG: `mark`, `lockup-horizontal`, `lockup-stacked`.

## Construction

The mark is a **radial iris / aperture** in three layers. It reads as an X-ray lens, a radiation-emission pattern, and a precision instrument all at once.

- **Layer 1 — outer ring (the lens boundary).** Circle at `(32, 32)`, radius 24, `2.5px` stroke, no fill, color `#5B3FE4`.
- **Layer 2 — six emission blades (the radial rays).** Six short strokes at angles `30°, 90°, 150°, 210°, 270°, 330°` (compass points on a 6-tick dial). Each blade runs from inner radius 12 to outer radius 20, `3.5px` stroke, rounded line-caps, color `#5B3FE4`. The blades **float inside the ring** — there is a deliberate gap between the blade tips and the ring.
- **Layer 3 — central pupil (the scan source).** Filled circle at the center, radius 6, color `#5B3FE4`. There is a deliberate gap between the pupil and the inner ends of the blades.

### Simplifying choices — do not "improve"

- The mark has **exactly six blades**. Not four. Not eight. Six, evenly spaced.
- The blades sit at the `30°/90°/150°/210°/270°/330°` rotation, not at the cardinal `0°/90°/180°/270°` positions. This offset is intentional — it gives the mark a less "compass-y" feel.
- **There is air on both sides of every blade** — between the blade and the pupil (inside), and between the blade and the ring (outside). Don't close those gaps. They're what makes the mark feel like an aperture rather than a gear or a sun-burst.
- There are **no inner teeth, no second ring, no rotation arrow, no scan-line cutting across the ring, no glow, no shadow, no gradient**.
- All three layers are the **same color** at 100% opacity. Don't fade the blades or tint the pupil.
- The wordmark uses **Geist 700, letter-spacing −0.025em, sentence-case "X-Ray Tech"** with the capital X and capital R-T retained (the hyphen is a real hyphen, not an en-dash).

### Favicon simplification

At 32×32, the mark drops to **outer ring + 4 cardinal blades + center pupil** — six blades become illegible at small sizes. The favicon SVG handles this automatically. Below 16px, render the mark as the pupil-only (a filled `brand/600` circle) and rely on the wordmark for identification.

## Clear space

Minimum clear space on every side of the mark or lockup = **the length of one emission blade** (8px in the source viewBox, scaled proportionally at render size). Treat this as inviolable padding — nothing else (no text, no border, no other logo) lives inside this zone.

## Minimum sizes

| Asset             | Web minimum | Print minimum |
| ----------------- | ----------- | ------------- |
| Horizontal lockup | 120 px wide | 30 mm wide    |
| Stacked lockup    | 100 px wide | 25 mm wide    |
| Mark              | 24 px       | 8 mm          |
| Favicon           | 16 px       | n/a           |

Below 16px, render just the pupil (a small `brand/600` filled circle) and rely on the wordmark for identification — the ring and blades stop being legible at that size.

## Color variants

| Background          | Use                                                                              |
| ------------------- | -------------------------------------------------------------------------------- |
| `paper` (`#FFFFFF`) | `mark.svg` — full radial aperture in `brand/600`.                                |
| `surface` (`#FAFAFC`) | `mark.svg` — same.                                                             |
| `brand/600`         | `mark-inverse.svg` — full radial aperture in white.                              |
| `brand/900` / `ink/900` | `mark-inverse.svg`.                                                          |
| Photo               | Apply a 60% ink-900 scrim under the lockup. Otherwise don't.                     |
| Single-color (fax, embroidery, debossing) | Full aperture in solid `ink/900`. The three layers (ring, blades, pupil) hold up well in single-color reproduction. |

## What NOT to do

- **No stretching.** Maintain aspect ratio always.
- **No rotation.** The mark is upright — top blade at 12 o'clock. Not rotated 30°, not "spinning."
- **No color changes** outside the table above. The mark is purple or it is white. Never green, never orange, never the gradient.
- **No drop shadows, no glows, no bevels, no 3D.**
- **No animation of the mark itself.** Animating the mark "drawing in" stroke-by-stroke is acceptable only on a splash screen or the first page-load — never on a logo placement in nav/footer.
- **No backgrounds.** The mark does not need to live inside a box or square. The outer ring already gives it a contained shape.
- **No "adding features that aren't in the source mark."** No eyes. No extra blades (always six, never eight or twelve). No second concentric ring. No teeth on the inside of the ring. No directional arrow indicating rotation. No subtitle text below the wordmark. Outer ring + six blades + pupil + wordmark — that is everything.
- **No emoji adjacent to the wordmark.** Ever.

## Usage examples per surface

- **Web nav** — `lockup-horizontal` at 32px tall on white, left-aligned, 24px gutter.
- **Footer** — `lockup-horizontal` at 28px tall on white, with copyright caption directly below.
- **Slide title page** — `lockup-stacked` centered, 240px wide, mark at top.
- **OG image** — `lockup-stacked` bottom-left at 200px wide, 48px inset from edges.
- **Favicon** — `favicon.svg`, 32px.
- **Slack/avatar contexts** — `mark.svg` on `brand/600` background, 64px round-corner container.
- **Email signature** — `lockup-horizontal` PNG, 120px wide.
