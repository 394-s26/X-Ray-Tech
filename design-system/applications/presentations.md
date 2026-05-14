# Presentations

## The standard

- **Aspect**: 16:9 (1920 × 1080).
- **Background**: `paper` (#FFFFFF) for content slides. `ink/900` (#0E0B1F) for section dividers. `brand/900` (#1C0F5C) for closing CTA.
- **Type**: Geist for titles, Inter for body, JetBrains Mono for any number.
- **Margins**: 80px on every side. The lockup-horizontal lives bottom-left at 32px tall on every slide except the title.
- **Slide numbering**: bottom-right, `caption` (12px), `ink/400`, format `04 / 18`.

## Seven slide templates

### 1. Title slide
- Stacked lockup, centered, 280px wide.
- Title in `display-lg` Geist, ink/900, centered, max 8 words.
- Subtitle below in `body-lg`, ink/600, max 14 words.
- No footer chrome.

### 2. Section divider
- Background `ink/900`.
- Overline (brand/300, uppercase) centered: "PART TWO".
- Section name in `display-xl` Geist, white, centered.

### 3. Big number
- One huge `mono-xl` (rendered at 240–320px on slide) in `brand/600`.
- One sentence below in `h3` ink/700 explaining what the number means.
- Source caption in `caption` ink/500.

### 4. Three-column
- Three feature cards, equal width.
- Each has a 48×48 `brand/100` chip with `brand/600` Lucide icon.
- Title `h3`, body `body-md`.

### 5. Chart / stat
- Chart fills the right two-thirds of the slide.
- Left third: callout — `overline`, `h2` headline, `body-md` insight.
- Chart styling: `brand/600` lead series, `brand/300` secondary, `ink/200` axis.

### 6. Quote / case
- Quote in `h1` Geist, ink/900, left-aligned, max 18 words, with an em-dash break for emphasis.
- Below: name (`body-md` semibold), role and location (`body-sm` ink/500).
- Optional photograph 4:5, right third of slide.

### 7. Closing CTA
- Background `brand/900`.
- Headline `display-lg` Geist, white, max 8 words.
- One pill CTA with `ink/900` text on white background.
- Lockup `mark-inverse` bottom-right.

## Footer on every slide (except title)

- Lockup bottom-left, 28px tall.
- Slide number bottom-right.
- Footer baseline 32px from bottom.

## Exceptions

- The title and closing CTA slides have no slide number.
- Section dividers have no slide number.

## Marp theme CSS

Save as `design-system/assets/templates/marp-theme.css`. Reference in your slide deck markdown front-matter: `theme: xraytech`.

```css
/* @theme xraytech */
@import 'default';

:root {
  --paper:    #FFFFFF;
  --ink-900:  #0E0B1F;
  --ink-700:  #2D2A3D;
  --ink-500:  #6C677A;
  --ink-200:  #E5E3EC;
  --ink-100:  #F4F3F7;
  --brand:    #5B3FE4;
  --brand-100:#E5DDFC;
  --brand-300:#A78EF3;
  --brand-900:#1C0F5C;
  --font-display: 'Geist', 'Inter', sans-serif;
  --font-sans:    'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}

section {
  background: var(--paper);
  color: var(--ink-900);
  font-family: var(--font-sans);
  font-size: 28px;
  line-height: 1.4;
  padding: 80px;
}

h1, h2 { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.02em; color: var(--ink-900); }
h1 { font-size: 56px; line-height: 64px; }
h2 { font-size: 40px; line-height: 48px; }
h3 { font-family: var(--font-display); font-size: 24px; line-height: 32px; font-weight: 600; }
strong { color: var(--brand); font-weight: 600; }
code, .mono { font-family: var(--font-mono); }

section.dark         { background: var(--ink-900); color: white; }
section.dark h1      { color: white; }
section.dark .overline { color: var(--brand-300); }
section.brand        { background: var(--brand-900); color: white; }
section.brand h1     { color: white; }

section.big-number .number {
  font-family: var(--font-mono);
  font-size: 220px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--brand);
  line-height: 1;
}

section.title { text-align: center; }

section::after {
  content: 'X-Ray Tech';
  position: absolute;
  bottom: 32px;
  left: 80px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: var(--ink-900);
  letter-spacing: -0.02em;
}
section.dark::after, section.brand::after { color: white; }
section.title::after { content: ''; }
```

## What we never do in decks

- **Bullet-point parades.** Three is the max per slide. If you have nine bullets, you have three slides.
- **Stock photos of business handshakes.**
- **Animated slide transitions.** Use Marp's default (none / fade only).
- **Clip art.**
- **Watermarks.** The lockup in the footer is enough.
- **Background patterns or textures.** Slides are flat.
- **Outlines / drop shadows on text.**
- **Multiple typefaces.** Geist + Inter + JetBrains Mono. Period.
