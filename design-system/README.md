# X-Ray Tech — Design System

**Stay ahead of your license.**

The single source of truth for how X-Ray Tech looks, sounds, and feels — across the web app, marketing site, presentations, social posts, emails, and any other surface the brand ships to.

## File tree

```
design-system/
├── README.md                       ← you are here
├── CLAUDE.md                       — load-order + non-negotiables for any LLM consuming this system
├── BRAND-SUMMARY.md                — one-page snapshot
├── foundations/
│   ├── brand.md                    — mission, positioning, audience, archetype
│   ├── voice.md                    — how we sound
│   ├── vocabulary.md               — words we prefer / avoid
│   ├── color.md                    — the palette + usage rules
│   ├── typography.md               — Geist + Inter + JetBrains Mono
│   ├── spacing.md                  — 4px scale, section rhythm
│   ├── radius.md                   — tight on dashboard, pill on marketing CTAs
│   ├── shadow.md                   — flat by default
│   ├── motion.md                   — minimal, earned
│   ├── iconography.md              — Lucide only
│   └── imagery.md                  — real photos of real techs
├── tokens/
│   ├── tokens.json                 — W3C-ish design tokens (machine-readable)
│   ├── tokens.css                  — CSS custom properties
│   └── tailwind.preset.js          — drop-in Tailwind preset
├── logo/
│   ├── mark.svg / .png / .jpg      — radial iris / aperture mark (ring + 6 blades + pupil)
│   ├── mark-inverse.svg            — white version for dark backgrounds
│   ├── wordmark.svg                — Geist 700 wordmark, ink/900
│   ├── lockup-horizontal.svg/.png/.jpg
│   ├── lockup-stacked.svg/.png/.jpg
│   ├── favicon.svg
│   └── usage.md
├── components/                     — React + Tailwind starters
│   ├── README.md, utils.ts
│   └── button, input, card, feature-card, badge, nav, hero, testimonial, cta-section, stat, animated
├── voice/
│   ├── examples.md                 — do/don't pairs across every surface
│   └── homepage-copy.md            — drop-in hero / CTA / pricing / boilerplate
├── applications/
│   ├── web.md
│   ├── presentations.md
│   ├── social-instagram.md
│   ├── social-linkedin.md
│   ├── email.md
│   ├── infographics.md
│   └── ads.md
└── assets/
    ├── patterns/grid.svg, brand-wash.svg
    └── templates/
        ├── og-image, instagram-carousel-{cover,body,closer}, linkedin-post (synthetic drafts — replace with real shipped versions)
        └── marp-theme.css
```

## Quick start — by task

| If you're…                                | Start here                                        |
| ----------------------------------------- | ------------------------------------------------- |
| Adding a marketing landing page           | [applications/web.md](applications/web.md) → [voice/homepage-copy.md](voice/homepage-copy.md) |
| Building a new React component            | [components/README.md](components/README.md)      |
| Wiring tokens into a fresh Tailwind app   | [tokens/tailwind.preset.js](tokens/tailwind.preset.js) |
| Writing a marketing email                 | [applications/email.md](applications/email.md) → [voice/examples.md](voice/examples.md) |
| Making a deck or pitch                    | [applications/presentations.md](applications/presentations.md) (uses `assets/templates/marp-theme.css`) |
| Writing an Instagram carousel             | [applications/social-instagram.md](applications/social-instagram.md) |
| Posting on LinkedIn                       | [applications/social-linkedin.md](applications/social-linkedin.md) |
| Designing a static ad                     | [applications/ads.md](applications/ads.md)        |
| Hiring or about-us copy                   | [voice/examples.md](voice/examples.md) → [foundations/brand.md](foundations/brand.md) |
| Picking a color value                     | [foundations/color.md](foundations/color.md)      |
| Logo, mark, or favicon question           | [logo/usage.md](logo/usage.md)                    |

## Eight principles

1. **One primary color.** Electric violet `#5B3FE4`. Everything else is shades of ink and semantic feedback.
2. **One typeface family per role.** Geist for headings, Inter for body, JetBrains Mono for numbers. Never two display faces.
3. **One canvas choice.** Pure white for marketing, `#FAFAFC` for dashboard chrome.
4. **Sentence case for all headlines.** Not Title Case, not ALL CAPS (overlines ≤3 words excepted).
5. **No hype vocabulary.** Banned everywhere: *revolutionary, game-changing, supercharge, leverage, seamless, AI-powered.*
6. **Second-person singular, name their world.** *You* and *your team*. ARRT, IEMA, CE points, modality.
7. **Real photography of real X-ray techs.** No stock, no AI humans.
8. **Every claim has a number or a name.** "Save time" is banned. "18 of 24 CE points" is required.

## Versioning

This is `v1.0.0`. Material changes go through the team and get reflected in `tokens/tokens.json` first; downstream files follow.
