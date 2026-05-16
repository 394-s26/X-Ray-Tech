# Iconography

## The library

**Lucide.** That's the rule. Not Heroicons, not Material, not custom one-off SVGs scraped from Dribbble. Lucide is the only icon source.

```bash
npm install lucide-react
```

```tsx
import { Calendar, CheckCircle2, AlertTriangle, Upload, FileText } from 'lucide-react';
```

## Defaults

- **Stroke**: 1.5px. Never thinner (illegible), never thicker (too heavy).
- **Style**: outline only. Never filled. The brand has one filled element — the mark — and that's it.
- **Rounding**: default Lucide rounding (matches `stroke-linecap="round"`).
- **Color**: `currentColor` — icons inherit their text color. Don't set icon color explicitly except in the feature-chip pattern below.

## Size table

| Context                             | Size  | Notes                                  |
| ----------------------------------- | ----- | -------------------------------------- |
| Inline with `body-sm` (14px text)   | 14px  |                                         |
| Inline with `body-md` (16px text)   | 16px  |                                         |
| Inline with `body-lg` (18px text)   | 18px  |                                         |
| Button (with text)                  | 16px  | 8px gap to label                       |
| Icon-only button                    | 20px  | Min target 40×40                        |
| Nav link                            | 20px  |                                         |
| Feature card chip                   | 24px  | Inside 40×40 chip (see pattern)         |
| Empty-state hero                    | 32px  | Centered above headline                 |
| Section-marker (rare)               | 48px  |                                         |

## Color rules

- Default — `currentColor`. So a `body-md ink/700` paragraph's inline icon is `ink/700`. A primary button's icon is white. A success badge's icon is `success/600`. This keeps icons in their parent's voice automatically.
- Feature card chip — see pattern below.
- Status icons in dashboards:
  - On track (≥ goal): `success/600`
  - Watch (within 90 days of renewal): `warn/600`
  - Action needed (< 30 days or expired): `danger/600`
  - Default: `ink/500`

## The "feature icon" pattern

Used on marketing feature cards and dashboard summary cards.

```tsx
<div className="w-10 h-10 rounded-md bg-brand-100 flex items-center justify-center">
  <Calendar size={24} className="text-brand-600" strokeWidth={1.5} />
</div>
```

- 40×40 chip
- Radius `md` (8px)
- Background `brand/100`
- Icon `brand/600` at 24px

Never put a feature icon on a `brand/600` background (loses contrast hierarchy). Never put one inside a circle — the chip is a rounded square.

## What the brand doesn't use

- **Emoji** anywhere in marketing, product UI, or transactional copy.
- **Heroicons, Material Icons, Font Awesome, Feather, Tabler, Iconify.** Lucide only — mixing libraries makes the system feel sloppy.
- **3D / isometric icons.** Banned.
- **Gradient-filled icons.** Banned.
- **Hand-drawn / sketchy icons.** Banned.
- **Animated icons that loop.** Microinteractions on tap (heart pop) are fine; ambient loops are not.

## Custom-icon fallback order

If Lucide doesn't have what you need:

1. **Restate the noun.** Are you sure you need a custom icon? Often a Lucide synonym exists (Lucide's `FileBadge` covers a lot of "certificate" use cases).
2. **Compose two Lucide icons.** Stack/overlay if a meaningful combination exists (e.g., `FileText` + `CheckCircle2` for "verified document").
3. **Draw it in the Lucide style.** 1.5px stroke, 24×24 viewBox, rounded caps/joins, no fill. Save to `design-system/logo/custom-icons/`.
4. **Only after the above three fail**, consider a different library — and discuss before adding to the system.
