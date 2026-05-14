# CLAUDE.md — read this first

If you (an LLM, an agent, or a designer's automation tool) are about to produce *any* asset for X-Ray Tech, read this file before anything else. It tells you what to load, what the non-negotiables are, and what to assume when the brief is silent.

---

## Load order

Read these files in this sequence:

1. **`BRAND-SUMMARY.md`** — the one-page picture of the brand.
2. **`foundations/brand.md`** — positioning, audience, archetype.
3. **`foundations/voice.md`** + **`foundations/vocabulary.md`** — how we sound, what words to use.
4. **`foundations/color.md`** + **`foundations/typography.md`** — the visual core.
5. **`tokens/tokens.json`** — the machine-readable source of truth for every value.
6. The specific **`applications/<surface>.md`** for the asset you're producing.
7. **`voice/examples.md`** before you write any copy.

If the asset is a deck → also `applications/presentations.md` + `assets/templates/marp-theme.css`. If it's a logo placement → also `logo/usage.md`. If it's a component → also `components/README.md`.

---

## Non-negotiables (do not violate these)

1. **One primary color.** `#5B3FE4` electric violet. No second "primary." Everything else is ink, semantic, or tints of brand.
2. **One typeface per role.** Geist (display), Inter (body), JetBrains Mono (numbers). Never two display faces. Never serif (except long-form legal/contract PDFs).
3. **Pure white canvas for marketing, `#FAFAFC` for dashboard chrome.** No tinted-lavender backgrounds.
4. **Sentence case for all headlines.** No Title Case. No ALL CAPS over 3 words.
5. **No hype vocabulary.** *revolutionary, game-changing, 10x, cutting-edge, supercharge, unleash, leverage, transform, synergy, seamless, robust, AI-powered* — banned everywhere.
6. **Second-person singular voice.** *You*, *your team*. Never "users." Never "professionals."
7. **Name the technologist's world.** *ARRT, IEMA, CE points / credits, modality, scope, expiry, renewal cycle, Category A/B.* Not "compliance items."
8. **Real photography of real X-ray techs and imaging suites.** Never stock. Never AI-generated humans. Never generic glowing-circuit "AI" visuals.
9. **Motion is minimal.** Fade + small translate. 160 / 240 / 480ms. No parallax, no scroll-jacking, no looping video, no confetti.
10. **Every claim has a number or a name.** "Saves time" is banned. "Saves 2 hours per Monday" is required.

If a brief asks you to violate any of these, push back and propose the on-brand alternative.

---

## Defaults when the brief is ambiguous

| Question                                        | Default                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Background color?                               | `paper` (#FFFFFF) for marketing, `surface` (#FAFAFC) for dashboard. |
| Title case?                                     | Sentence case.                                                    |
| Body text size?                                 | `body-md` (16px) — `body-lg` (18px) only for hero lead paragraphs. |
| CTA shape?                                      | Marketing = `rounded-full` (pill). Product UI = `rounded-sm` (6px). |
| Section vertical padding?                       | 96px desktop / 64px mobile.                                       |
| IG carousel aspect?                             | 4:5 (1080×1350).                                                  |
| LinkedIn carousel aspect?                       | 1:1 (1200×1200).                                                  |
| Slide deck aspect?                              | 16:9 (1920×1080).                                                 |
| Email width?                                    | 600px container.                                                  |
| Number style (license points, days, IDs)?       | JetBrains Mono (`font-mono`). Always.                             |
| Icon library?                                   | Lucide. 1.5px stroke, outline only.                               |
| Heading font?                                   | Geist 600.                                                        |

---

## Asset-type → file cheat sheet

| User asks for…                            | Read this                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| "A landing page"                          | `applications/web.md` + `voice/homepage-copy.md` + `components/`                |
| "A pitch deck" / "a slide deck"           | `applications/presentations.md` + `assets/templates/marp-theme.css`             |
| "An Instagram carousel"                   | `applications/social-instagram.md` + `assets/templates/instagram-carousel-*`    |
| "A LinkedIn post" / "LinkedIn carousel"   | `applications/social-linkedin.md` + `assets/templates/linkedin-post.svg`        |
| "A marketing email" / "transactional email" | `applications/email.md` + `voice/examples.md`                                |
| "An infographic" / "a one-pager"          | `applications/infographics.md`                                                  |
| "An ad" / "paid creative"                 | `applications/ads.md`                                                            |
| "An OG image" / "social share image"      | `assets/templates/og-image.svg` + `foundations/imagery.md`                      |
| "Add the brand to my CSS / Tailwind"      | `tokens/tokens.css` + `tokens/tailwind.preset.js`                                |
| "A React component"                       | `components/README.md` + the specific component file                            |
| "A button" / "a hero" / "a card"          | `components/<name>.tsx` + the component's docstring                              |
| "Logo on a dark background"               | `logo/usage.md` + `logo/mark-inverse.svg`                                       |
| "Help me write copy"                      | `voice/voice.md` + `voice/vocabulary.md` + `voice/examples.md`                  |

---

## Quality bar — self-check before delivering

Before handing back any asset, ask yourself these six questions:

1. **Would this sit comfortably next to a Stripe / Linear / Notion page**, or does it look like generic healthcare SaaS?
2. **Could this exact copy ship for a competitor without changing the brand name?** If yes, rewrite — it's not specific enough to X-Ray Tech.
3. **Is there a number or a real name in every claim?** If not, find one or cut the claim.
4. **Is the primary color used only where the brand earns it** (CTA, mark, active state, lead chart series), or has it bled into headlines, borders, and backgrounds?
5. **Are headlines sentence-case, no emoji, no ALL CAPS, no hype words?**
6. **If this is a logo placement** — does the mark have exactly the outer iris ring, six radial emission blades (at the 30°/90°/150°/210°/270°/330° positions), and the central pupil dot? No added blades, no enclosing square, no inner gear teeth, no rotated orientation.

If you fail any of the six, fix it before shipping.
