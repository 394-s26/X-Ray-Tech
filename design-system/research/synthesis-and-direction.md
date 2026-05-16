# X-Ray Tech / TechTrack — Synthesis & Proposed Direction

_Inputs: discovery interview + scraped references (benai, datadog, gsap, notion, stripe, linear) + dashboard mood board._

---

## Section 1 — What the category actually looks like

| Brand     | Primary / Accent       | Canvas         | Typeface              | Radius | Voice         |
|-----------|------------------------|----------------|-----------------------|--------|---------------|
| Datadog   | `#632CA6` (purple)     | white          | National (sans)       | 4px    | professional  |
| Stripe    | `#533AFD` (violet)     | white          | Söhne                 | 4px    | professional  |
| Linear    | `#5E6AD2` (indigo)     | white / dark   | Inter / SF Pro        | 2px    | precise       |
| Notion    | `#455DD3` (blue)       | white          | Inter (custom)        | 8px    | warm           |
| GSAP      | electric blue accent   | near-black     | Mori                  | 0/100px| bold          |
| benai     | pastel cream/mint      | warm cream     | Space Grotesk         | 12px   | modern        |

### Non-obvious patterns

- **Vivid purple/indigo (#4E–#63 range) is the unclaimed-but-credible primary for data-trust tech.** Datadog, Stripe, Linear all sit here. Healthcare-credentialing incumbents (CE Broker, MedTrainer, etc.) are stuck in teal/navy — leaving this space wide open for a healthcare product to look like a *tech* product instead of a *hospital portal*.
- **Background consensus is white.** 5 of 6 references are pure white or near-pure. Only benai and GSAP break — and they're marketing-only sites, not dashboards. For a working app: white wins.
- **Typeface clusters around modern geometric sans.** Inter (Notion, Linear), Söhne (Stripe), National (Datadog), Space Grotesk (benai). Zero serifs. Zero scripts. Zero handwritten anything.
- **Radius is tight (2–8px) for dashboard-leaning brands, generous (12px) for marketing-only.** Mixing is fine if the dashboard stays tight.
- **Motion is minimal but felt.** Count-ups, progress fills, page-fade transitions. No parallax, no scroll-jacking, no hero video.
- **Logos are simple geometric marks, not illustrations.** Datadog's dog is the outlier — and even that reads as a glyph at favicon size. Stripe/Linear/Notion all use abstract geometric marks.

### Anti-pattern (what your refs are telling you to *avoid*)

From your anti-references (dreamybedtime, americaneagle): emoji decoration, floaty unmotivated animation, undefined typography, generic stock layouts, no consistent system. Healthcare-credentialing incumbents add: stock teal/blue, dense feature lists, dated chrome, stock-photo-of-nurse-with-clipboard imagery.

---

## Section 2 — Where this brand should break from the pack, and where it should stay

### Break from the pack

1. **Lead with vivid purple in healthcare.** No serious healthcare-credentialing product does this. It instantly signals "this is a modern tech product made for techs, not a hospital admin portal."
2. **Show real numbers everywhere.** Most refs talk about "saving time" — TechTrack should always show real point totals, real percent-to-license, real days-until-expiry. The number *is* the brand.
3. **Use a monospaced face for all numeric data** (license points, dates, cert IDs). This is the "futuristic / data-precise" lever — it's distinctive without being noisy, and it matches the "astonished" feeling: numbers feel measurable, exact, alive.

### Stay with the pack

1. **One geometric sans family for everything human-readable.** Don't reinvent.
2. **White canvas, generous whitespace, tight radius on dashboard chrome.** The Linear/Stripe convention is correct.
3. **Flat components, no heavy shadows, no glassmorphism, no gradients-over-everything.** "Confident, calm, flat" — same as the non-negotiables in the design system.

---

## Section 3 — Proposed direction

### Color

- **Primary** — `#5B3FE4` (vivid electric violet). Sits between Linear's indigo and Stripe's violet. Pops on white, accessible at WCAG AA on white surfaces above 14px. Reads "futuristic" rather than "heritage."
  - 50–900 derived in HSL: `#F4F0FE`, `#E5DDFC`, `#C9B8F8`, `#A78EF3`, `#8366ED`, `#5B3FE4` (primary/600), `#4A2FCC`, `#3A23A8`, `#2C1A82`, `#1C0F5C`.
- **Heritage purple** — `#4E2A84` (your existing royal purple) retained as **`ink-purple`**: used for headings on white canvas, chart fills, dense data ink. Lets you keep equity without making the system feel "dark."
- **Paper** — `#FFFFFF` for marketing, `#FAFAFC` for dashboard chrome. Drop the lavender-tinted background — it limits how much the brand purple can sing.
- **Ink** — `#0E0B1F` (deep cool near-black, has a tiny violet undertone so it sits in the same family as the primary).
- **Semantic** — success `#22C55E`, warning `#F59E0B`, danger `#EF4444`, info `#5B3FE4`.

**What we drop from your current palette:** the 4 mid-purples (#68489A, #7660A0, #8490CC, #a78bda) — they currently fight each other. They collapse into one primary + its tints.

### Typography

**Recommendation:** all-Inter family, free, dashboard-proven.

- **Display** — Inter Display, 600–700 weight, tight letter-spacing (-0.02em).
- **Body** — Inter, 400/500, normal letter-spacing.
- **Numeric / data** — **JetBrains Mono** (free) or **Geist Mono** (free). Used for: license point totals, days-until-expiry counters, certification IDs, dates in tables, anything that should feel measurable. This is the "unique" lever.

Scale (modular, 1.25 ratio): 12 / 14 / 16 / 20 / 24 / 32 / 44 / 60 px.

### Spacing, radius, shadow

- **Spacing scale** (4px base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **Radius**: card `8px`, button `6px`, input `6px`, badge full-pill, image `12px`.
- **Shadow**: one subtle `0 1px 2px rgba(14,11,31,0.06), 0 1px 3px rgba(14,11,31,0.04)` for elevated cards. That's it. No layered drop shadows.

### Iconography

Lucide icons. 1.5px stroke. 20/24px sizes default. Never filled, never colored except primary on active state.

### Imagery

- Real photos of real X-ray suites and real technologists when possible. Soft natural light. No stock "smiling-nurse-with-clipboard."
- No AI-generated humans. No generic glowing-blue-medical-overlay shots.
- Where real photos aren't available: replace with structured data visualizations (point-progress rings, calendar-of-expirations) — the *data* is the imagery.

### Motion

- Page transitions: 240ms fade + 4px translate.
- Number count-ups on dashboards: 480ms ease-out (license point totals, %-to-renewal).
- Progress-ring fills: 480ms ease-out on mount, 240ms on update.
- Banned: parallax, hero video, scroll-jacking, confetti, bounce easing.

### Voice & tone

- **Second-person singular.** "Your license. Your points. Your team."
- **Their nouns:** ARRT, IEMA, CE credits, license points, expiration, audit, scope, modality.
- **Banned:** revolutionary, game-changing, 10x, supercharge, AI-powered, seamless, robust.
- **Headlines: sentence case.** "Stay ahead of your license renewal." Not Title Case, not ALL CAPS.
- **Every claim has a number.** Not "track your progress" — "see exactly how many of your 24 CE points you've earned this cycle."

### Logo direction

Three motif candidates, all wordmark-anchored:

1. **Radial progress arc + wordmark.** A 270° arc — reads simultaneously as an X-ray aperture, a progress ring, and a stylized "T" for TechTrack. Distinctive, dashboard-native, scales to favicon.
2. **Layered chevron stack + wordmark.** Three stacked chevrons = "credentials layered up." Reads as accumulation/progress. Less unique but very simple.
3. **Aperture iris glyph + wordmark.** 6-blade aperture — X-ray imaging optics. Most literal to the product, but harder to make feel "futuristic" rather than "medical-device-2008."

Wordmark: Inter Display 700, letter-spacing -0.03em, lowercase. ("techtrack" or "x-ray tech" — see Q4 below.)

### Output scope

Full system: tokens (JSON / CSS / Tailwind preset) + foundations docs + logo (SVG + raster) + React/Tailwind component library starter + voice + application guidance + asset templates.

---

## Section 4 — Five sign-off questions

Before I generate the system, please answer all five.

1. **Color.** Go with vivid electric violet `#5B3FE4` as primary (keeping your existing `#4E2A84` as "ink-purple" for headings/charts/equity)? Or do you want it pulled deeper (closer to your current royal), warmer (more magenta), or cooler (more indigo, Linear-direction)?

2. **Typography.** Use **Inter + Inter Display + JetBrains Mono** throughout (all free, dashboard-proven, sharp)? Or pair Inter body with a more distinctive display face — Space Grotesk (benai-direction, friendlier) or Geist (Vercel-direction, sharper)?

3. **Logo motif.** Pick one of:
   - (a) Radial progress arc / aperture hybrid + wordmark _(my recommendation — most distinctive, dashboard-native)_
   - (b) Layered chevron stack + wordmark _(simpler, less unique)_
   - (c) Aperture iris glyph + wordmark _(most literal, hardest to make feel modern)_
   - (d) Wordmark only, no glyph

4. **Name.** Your persona says "TechTrack" but the repo and your discovery answer say "X-Ray Tech." Which is the brand name going forward — **TechTrack**, **X-Ray Tech**, or something else? (My read: TechTrack reads more like a product, less like a description; it travels better. X-Ray Tech is clearer to the audience but more generic.)

5. **Output scope.** Full system (tokens + docs + logo + React/Tailwind components + voice + app guidance + asset templates)? Or just the foundation (tokens + docs + logo)?

---

Once I have your answers I'll generate the full `design-system/` folder ready to upload to Claude Design's "Set up your design system" flow.
