# Typography

X-Ray Tech runs on three faces, three jobs.

| Family                 | Job                                                         |
| ---------------------- | ----------------------------------------------------------- |
| **Geist**              | Headings — h1 through h3, hero display, deck titles.        |
| **Inter**              | Body, UI labels, paragraphs, h4, everything text-shaped.    |
| **JetBrains Mono**     | Numbers — license points, days-until-expiry, cert IDs, dates in tables. |

All three are free, open-source, and rendered crisp at every size.

## The scale

| Token        | Family   | Size  | Line height | Weight | Tracking  | Use                                       |
| ------------ | -------- | ----- | ----------- | ------ | --------- | ----------------------------------------- |
| `display-xl` | Geist    | 72px  | 80px        | 600    | −0.02em   | Marketing hero (desktop)                  |
| `display-lg` | Geist    | 56px  | 64px        | 600    | −0.02em   | Hero (tablet) / section hero              |
| `h1`         | Geist    | 40px  | 48px        | 600    | −0.015em  | Section opener                            |
| `h2`         | Geist    | 32px  | 40px        | 600    | −0.015em  | Subsection                                |
| `h3`         | Geist    | 24px  | 32px        | 600    | −0.015em  | Card title, modal title                   |
| `h4`         | Inter    | 20px  | 28px        | 600    | −0.015em  | Inline heading, list-section title         |
| `body-lg`    | Inter    | 18px  | 28px        | 400    | normal    | Lead paragraph, marketing body            |
| `body-md`    | Inter    | 16px  | 24px        | 400    | normal    | Default body, UI text                     |
| `body-sm`    | Inter    | 14px  | 20px        | 400    | normal    | Dense tables, secondary copy              |
| `caption`    | Inter    | 12px  | 16px        | 500    | normal    | Metadata, timestamps                      |
| `overline`   | Inter    | 11px  | 16px        | 600    | +0.06em / UPPERCASE | Section eyebrow (≤3 words)      |
| `mono-xl`    | JBM      | 48px  | 52px        | 600    | −0.02em   | Big-number stat (license point total, days-until) |
| `mono-lg`    | JBM      | 24px  | 32px        | 500    | normal    | Card-level stat                            |
| `mono-md`    | JBM      | 14px  | 20px        | 400    | normal    | Cert IDs, dates in tables                  |
| `mono-sm`    | JBM      | 12px  | 16px        | 400    | normal    | Cert codes inline with body text          |

## Weights actually used

- **400 (regular)** — body, captions, mono table values
- **500 (medium)** — buttons, caption, mono headers
- **600 (semibold)** — all headings, hero display, big-number stats, overlines
- **700 (bold)** — wordmark and logo only

Never use weight 300 (thin) — it's illegible at small sizes. Never use weight 800/900 — feels like ad copy.

## The seven typography rules

1. **Sentence case for all headlines.** Not Title Case. Not ALL CAPS (except overlines ≤3 words).
2. **Max three distinct sizes in any single section.** A hero is `display-lg` + `body-lg` + `caption`. Adding a fourth size breaks the rhythm.
3. **Line length: 45–80 characters.** Use `max-w-reading` (680px) for any paragraph longer than two sentences.
4. **One weight per role.** Headings are 600. Body is 400. Don't mix 500 body and 600 body in adjacent paragraphs.
5. **Italics are reserved for foreign terms, book titles, and the persona-name *Michelle*** in case-study copy. Never use italics for emphasis — use weight or color.
6. **No text shadows. No text glows. No gradients on text.** The brand is calm.
7. **Heading spacing**: every heading gets at least `space-3` (12px) above and `space-2` (8px) below its body. Crowded headings are anxious headings.

## Pairings for common contexts

| Context                          | Pairing                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Marketing hero (desktop)**     | overline (brand/600) → `display-xl` (ink/900, Geist) → `body-lg` (ink/700, max 520px) → primary CTA  |
| **Marketing section**            | overline → `h1` (Geist) → `body-lg` → content                                                       |
| **Dashboard stat card**          | `caption` label (ink/500) → `mono-xl` value (brand/600 if "good", warn/600 if "watch", danger/600 if "act now") → `body-sm` sub |
| **Dashboard table row**          | `body-sm` (ink/900) for primary cell → `mono-md` for date/ID cells                                  |
| **Slide title**                  | `overline` (brand/600) → `display-lg` (ink/900, Geist) → `body-lg` (ink/600)                       |
| **Carousel cover (IG/LI)**       | `caption` brand → `h1` headline (ink/900, Geist) → mark bottom-right                                |
| **Case study**                   | overline → `h2` quote (ink-purple, italic only here) → `mono-xl` number → `caption` source         |

## Font loading (web)

```html
<!-- Inter + Geist + JetBrains Mono via Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

For Vite/Next.js, prefer `@next/font` or the `unplugin-fonts` vite plugin so fonts are self-hosted (faster + no third-party dependency).

## When NOT to use the primary fonts

- **Embedded code blocks** — already JetBrains Mono. Good.
- **System UI in chrome extensions** — fall back to `system-ui` so the popup blends in.
- **Long-form legal / contract PDFs** — the `font.family.serif` token (system serif fallback stack) is allowed here, and only here.

## Anti-patterns

- Two display faces on one page. Pick Geist for the heading and stop.
- Geist used for body. Geist is a display face. Body is Inter.
- Numbers in Inter when they're part of a metric. License points, days, IDs, dates → JetBrains Mono. Always.
- Mixing weights 500 and 600 in adjacent buttons. Pick one.
- Tracking changes within a single composition. Tracking is set by the size token.
