# Motion

Motion in X-Ray Tech earns its keep when it tells the user something they couldn't see in a still: a number climbing, a card entering the viewport, a progress ring filling. Everything else is decoration — and decoration is banned.

## Duration tokens

| Token   | Value | Use                                                       |
| ------- | ----- | --------------------------------------------------------- |
| `xs`    | 80ms  | Micro-interactions: button press, badge pop                |
| `sm`    | 160ms | Hover state, focus ring, color change                     |
| `md`    | 240ms | Default — page-transition fade, card entrance, modal open |
| `lg`    | 480ms | Number count-up, progress ring fill, hero entrance        |
| `xl`    | 720ms | Hero stagger choreography (rare)                          |

## Easing tokens

| Token        | Curve                                  | Use                                              |
| ------------ | -------------------------------------- | ------------------------------------------------ |
| `out`        | `cubic-bezier(0.22, 1, 0.36, 1)`       | Default — entrances, count-ups, fills            |
| `in-out`     | `cubic-bezier(0.4, 0, 0.2, 1)`         | Symmetric movements (modal in & out, expand/collapse) |
| `standard`   | same as `in-out`                       | Alias for clarity in code                         |
| `linear`     | `linear`                               | Progress loaders, never anything else            |

## Standard animations

| Animation              | Spec                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **Button press**       | `scale(0.98)` on `:active`, `dur-xs` (80ms), `ease-out`. No bounce-back.                       |
| **Input focus**        | Border `ink/300` → `brand/600`, focus ring `brand/600 @ 40%` fade in. `dur-sm` (160ms).        |
| **Card hover**         | Shadow `none` → `xs`, optional `translate-y(-1px)`. `dur-sm` (160ms).                          |
| **Menu / popover open**| Opacity 0 → 1, `translate-y(-4px)` → 0. `dur-md` (240ms), `ease-out`.                          |
| **Modal open**         | Backdrop opacity 0 → 1 over `dur-md`. Dialog opacity 0 → 1, `scale(0.97)` → 1 over `dur-md`, `ease-in-out`. |
| **Scroll reveal**      | Opacity 0 → 1, `translate-y(8px)` → 0. `dur-md` (240ms), `ease-out`. Triggered at 20% in view.  |
| **Page transition**    | Outgoing: opacity 1 → 0 over `dur-sm`. Incoming: 0 → 1 over `dur-md`. No slide.                |
| **Number count-up**    | Lerp from 0 (or prev value) to target over `dur-lg`, `ease-out`. Used for license point totals, days-until-expiry, percent-to-renewal. |
| **Progress ring fill** | Stroke-dashoffset animation from full to target over `dur-lg`, `ease-out`. Use on dashboard mount. |
| **Mark draw-in**       | (Splash screen only) Outer iris ring sweeps in via stroke-dashoffset (0 → full, ease-out, 320ms), then the six emission blades stagger-fade in (40ms apart), then the central pupil scales from 0 → 1. Total ~600ms. Never on logo placements in nav/footer. |

## We do not do

- **Parallax.** Ever.
- **Looping hero video.** Heroes are still.
- **Marquees** anywhere except optionally on a logo-band ("trusted by") at very low contrast and slow speed (>30s loop).
- **Scroll-jacking** — overriding scroll behavior. Never.
- **Entrance animations that block reading.** Headlines fade in fast (240ms) or not at all; never stagger letter-by-letter.
- **Shake, bounce, wobble, jelly, spring-overshoot.** No physics theater.
- **Confetti.** Even when a tech finishes all 24 CE points. Especially then. The number reaching 24 is the celebration.
- **Typewriter effects.** Banned.
- **Text shimmer / shine.** Banned.
- **Animated gradients moving across the hero.** Banned.

## Acceptable "21st.dev-style" motion components

- **Number counter** — yes. This is core to the brand.
- **Scroll reveal** — yes, with the spec above.
- **Spotlight on hover** — sparingly, on hero CTAs only.
- **Magic-card-border** — sparingly, on the "featured" card in a 3-up grid.
- **Quiet marquee** — only for a logo-trust band, very slow, very low contrast.
- **Stagger entrance** — yes, for a 3-up feature grid on first reveal.

Banned: typewriter, text shimmer, glow trails, mouse-follower particles.

## Reduced motion

Every animation respects `prefers-reduced-motion: reduce`. The global stylesheet contains:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

JavaScript-driven animations (count-ups, progress fills, GSAP-driven choreographies) must check the same:

```ts
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) {
  // Skip the count — set the final value immediately.
  el.textContent = String(targetValue);
} else {
  // Run the lerp.
}
```
