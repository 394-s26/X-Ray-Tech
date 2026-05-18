# Web

## Global primitives

- **Max width**: 1200px (`max-w-container`).
- **Gutter**: 24px desktop, 16px mobile.
- **Reading column**: 680px for paragraphs (`max-w-reading`).
- **Page background**: `paper` (#FFFFFF) for marketing. `surface` (#FAFAFC) for the in-app dashboard.
- **Section padding**: 96px top/bottom desktop, 64px mobile.

## Navigation bar

- Height 64px desktop, 56px mobile.
- Sticky, with `shadow-sm` once the page scrolls more than 8px.
- Lockup horizontal, left-aligned.
- Center links (max 5): For technologists / For managers / Pricing / About.
- Right: secondary "Log in" (ghost) + primary "Try free" (filled pill, brand/600).
- Mobile: drawer from the right, full-screen on open, links stacked at `text-h3`.

## Hero rules

1. **One headline. 6–12 words.** Sentence case.
2. **One subhead. Max 28 words. Max width 520px.**
3. **Primary CTA + at most one secondary.** Primary is pill (`rounded-full`), secondary is ghost.
4. **Optional photograph on the right** — 4:5 aspect, `radius-lg` (12px). Real photo of a tech / imaging suite only.
5. **No hero video. No animated background. No floating UI mockups.**

### Hero JSX template

```tsx
<Hero
  overline="FOR TECHNOLOGISTS"
  headline="Stay ahead of your IEMA renewal."
  subhead="See exactly how many of your 24 CE points you've earned this cycle — and how many days until your next renewal — in one screen."
  primaryCta={{ label: 'Log your first certification', href: '/signup' }}
  secondaryCta={{ label: 'How it works', href: '/how' }}
  image={{ src: '/img/console.jpg', alt: 'Technologist at an X-ray console' }}
/>
```

## Six section patterns

1. **Why** — three feature cards, `brand/100` chips + `brand/600` icons, 3-column on desktop, 1-column mobile.
2. **How** — three numbered steps, with the number rendered in `font-mono mono-lg brand/600`. No connecting lines/arrows — gaps do the work.
3. **Case** — one testimonial block, quote on the left, `mono-xl` outcome number on the right ("2 hours saved per Monday").
4. **Feature highlight** — left/right alternating: 50% text, 50% product screenshot. Screenshot in a 12px-radius container, no fake browser chrome.
5. **Pricing** — single-plan focus. One number, one unit, three included-feature bullets. Pill CTA.
6. **Final CTA band** — full-bleed `brand/900` background, white headline, single white pill CTA with `ink/900` text.

## Footer spec

- 4 columns desktop, 2 mobile.
- Columns: Product (For techs, For managers, Pricing, Security), Company (About, Hiring, Press kit), Resources (Help center, ARRT/IEMA guides, Changelog), Legal (Privacy, Terms, Contact).
- Logo bottom-left, copyright bottom-right. `caption` text. `ink/500` text on `paper` background.
- Single hairline `border-line` above the column block.

## Pages every brand should have

- `/` Home
- `/for-technologists`
- `/for-managers`
- `/pricing`
- `/about`
- `/security` (or `/compliance`)
- `/changelog`
- `/help` (or link to support docs)
- `/login` and `/signup`
- 404

## What we never do on the web

- Hero video, looping background video, parallax scroll.
- Cookie banner that takes up 40% of the viewport.
- Stock photos of "diverse team around a laptop."
- A second primary CTA in the hero.
- A typing animation in the headline.
- Three pricing tiers when we only offer one.

## Accessibility baseline

- Every interactive element has a visible focus ring (`brand/600` @ 40% alpha, 2px ring, 2px offset).
- Color contrast meets WCAG AA at 16px and AAA at 24px+.
- All photographs have meaningful `alt` text (not "image of person").
- Heading order is semantic (one h1 per page; no skipping h2 → h4).
- `prefers-reduced-motion: reduce` honored everywhere (see motion.md).
- Forms have labels above the input, never placeholder-only.
