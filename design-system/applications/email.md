# Email

## Technical

- **Width**: 600px container, centered. Mobile fluid.
- **Fonts**: web-safe stack with web-font fallback. `font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;`
- **Heading font**: web-font Geist if the client supports it; otherwise falls back to Inter.
- **Dark mode**: opt in. Provide `prefers-color-scheme: dark` CSS that swaps `paper` → `ink/900` and `ink/900` text → `paper`.
- **Image-to-text ratio**: text-heavy. Most emails are text + the lockup. No "design-heavy hero image" emails.

## Marketing email structure

```
┌───────────────────────────────────────────────┐
│ [lockup-horizontal — 28px tall, left]         │  Header (32px padding)
├───────────────────────────────────────────────┤
│                                               │
│  Heads up — IEMA renewal in 90 days           │  Headline (h2, ink/900, Geist)
│                                               │
│  Quick one: your IEMA license renews on       │
│  March 14, 2026. You're at 18 of 24 CE        │  Body (body-md, ink/700)
│  points. Six to go.                           │
│                                               │
│  Most techs get the last 6 done in their      │
│  modality (CT, MR, etc) — those count         │
│  toward the Category-A requirement too.       │
│                                               │
│   [Open my dashboard]                         │  Primary CTA (pill, brand/600)
│                                               │
│  — The X-Ray Tech team                        │  Signature (body-sm, ink/500)
│                                               │
├───────────────────────────────────────────────┤
│ X-Ray Tech · Stay ahead of your license       │
│ [Manage email preferences] · [Unsubscribe]    │  Footer (caption, ink/500)
└───────────────────────────────────────────────┘
```

## Voice

Marketing emails sound like a **one-to-one note**, not a newsletter. We write as if Michelle is emailing one of her techs. No "Dear valued customer." No "We hope this email finds you well." Open with the relevant fact.

## Subject lines

- **Under 40 characters.**
- **Specific.** Use the number, the name, or the deadline.
- **No emoji.**
- **No "Re:" or "Fwd:" fakery.** No clickbait questions ("Are you ready?").

| Yes                                  | No                                          |
| ------------------------------------ | ------------------------------------------- |
| `IEMA renewal in 90 days`            | `Important Information About Your License` |
| `18 / 24 CE points logged`           | `Your Progress Update!`                     |
| `New: bulk-upload certificates`      | `🎉 BIG NEWS from X-Ray Tech`               |
| `2 of your techs renew in March`     | `Action Required`                           |

## Pre-header rules

- 40–80 characters. The first sentence of the email or a complement to the subject line.
- Never duplicate the subject. Never "View in browser."
- Never leave it as the default `[View this email in your browser]`.

## Transactional email template

Transactional emails (password reset, certificate uploaded, license-renewal reminder) are even quieter:

```
Hi [first name],

Your certification has been logged:

  — Cert: Advanced CT Imaging
  — Issuer: ARRT
  — Date completed: March 10, 2026
  — Counts toward: 2 CE points (Category A)

You're now at 20 of 24 CE points for this renewal cycle.

[View dashboard]

— X-Ray Tech
```

No marketing copy. No "Did you know we also…" appends. Transactional is transactional.

## Types we send

- **License-renewal reminder** at 90 days, 30 days, 14 days, 7 days, 1 day.
- **Certification logged confirmation** (transactional).
- **Weekly digest for managers** (Mondays, summarizing the team's status).
- **Product update** when we ship something the user will feel in their workflow.
- **Founder note** (rare, ≤4 per year) — written by a human, in plain text.

## What we never send

- Birthday emails.
- "We miss you" reactivation campaigns.
- A/B-tested clickbait subject lines.
- Newsletters that round up "industry trends" without our own data behind them.
- "Take this survey" without explaining what we'll do with the answers.
