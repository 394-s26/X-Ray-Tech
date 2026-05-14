# Shadow

X-Ray Tech is flat. Shadows are a tool for spatial layering — modals above the page, dropdowns above the page, hovered cards lifted just enough to feel touchable. That's it.

## The scale

All shadows use low-opacity `ink/900` (#0E0B1F at 4–10%).

| Token  | Value                                                                                 | Use                                               |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `none` | `none`                                                                                | Default. Most elements have no shadow.            |
| `xs`   | `0 1px 2px rgba(14, 11, 31, 0.04)`                                                    | Hover state on cards                              |
| `sm`   | `0 1px 3px rgba(14, 11, 31, 0.06), 0 1px 2px rgba(14, 11, 31, 0.04)`                  | Sticky nav after scroll                           |
| `md`   | `0 4px 12px rgba(14, 11, 31, 0.06), 0 2px 4px rgba(14, 11, 31, 0.04)`                 | Dropdown menu, popover, toast                     |
| `lg`   | `0 12px 32px rgba(14, 11, 31, 0.08), 0 4px 8px rgba(14, 11, 31, 0.04)`                | Modal dialog, command palette                     |
| `xl`   | `0 24px 48px rgba(14, 11, 31, 0.10), 0 8px 16px rgba(14, 11, 31, 0.06)`               | Floating panel that hovers over a page region     |

## The five rules

1. **Default is `none`.** Cards on the dashboard have no shadow. They have a `line` border or live in a gap-defined grid. Reaching for a shadow first is a habit to break.
2. **Add `xs` on hover.** A card with no shadow at rest, `xs` on hover, gives just enough lift to feel touchable without bouncing the layout.
3. **Reserve `md` and bigger for things that *float above* the page.** Dropdowns, popovers, modals, command palettes — these are spatially above. Static dashboard cards are not.
4. **No colored shadows.** Never a purple shadow under a purple button. Shadows are ink-tinted only.
5. **No inner shadows. No multi-layer "soft UI."** Neumorphism is banned everywhere in the brand.

## Anti-patterns

- Three nested shadowed cards inside a section. Pick one elevation — usually `none` — and let the structure speak.
- A shadow + a border on the same element. Pick one. Cards on the dashboard use a `line` border; cards on marketing surfaces use `xs` hover only.
- "Glow" effects under CTAs. The CTA is purple. Purple is the emphasis. A glow on top is hype.
- A shadow on the wordmark. The wordmark never has a shadow.
