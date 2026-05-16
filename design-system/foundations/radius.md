# Radius

X-Ray Tech runs **tight on the dashboard, soft on marketing**, never round-and-soft everywhere.

## The scale

| Token  | Value   | Use                                                                 |
| ------ | ------- | ------------------------------------------------------------------- |
| `none` | 0px     | Tables, structural dividers, full-bleed bands                       |
| `xs`   | 4px     | Tooltips, small inline tags                                          |
| `sm`   | 6px     | Buttons in product UI, inputs                                       |
| `md`   | 8px     | Cards, modals (default radius for the whole dashboard)              |
| `lg`   | 12px    | Hero images, illustration containers, marketing-feature thumbnails  |
| `xl`   | 20px    | Avatar group containers, hero photographs                            |
| `full` | 9999px  | Pills — marketing CTAs, status badges, avatars                       |

## The two rules

1. **Marketing CTA = `full` (pill).** Every primary CTA on a landing page, hero, or pricing page is a pill. This is the brand's signature CTA shape.
2. **Product UI button = `sm` (6px).** Inside the dashboard, buttons are 6px radius — they sit in a denser grid with tighter spacing and pills feel out-of-rhythm with adjacent inputs and table actions.

## Consistency within a composition

If a card has `md` (8px) radius, then anything *inside* that card stays equal or tighter:
- Buttons inside: `sm` (6px) — slightly tighter than the parent.
- Input fields inside: `sm` (6px).
- Inline pills/badges: `full` — exception, because pills are a semantic shape, not a radius choice.

Never put `lg` (12px) elements inside a `sm` card. The inner shape always nests under the outer.

## Exceptions

- **Avatar** → `full` always.
- **Logo / mark** → 0 radius. The mark is the mark. Do not put it inside a rounded square unless the surface requires it (app icon, Slack avatar) — and even then use the platform's required radius, not an arbitrary one.
- **Images on marketing pages** → `lg` (12px). Soft, but not pill.
- **Status badge ("Expired," "Expires in 30 days," "On track")** → `full`. These are pills.
- **Toast / snackbar** → `md` (8px).
- **Dropdown / popover menu** → `md` (8px).

## Anti-patterns

- Mixed radii in the same row (a `lg` button next to a `sm` input). Pick one rhythm and hold it.
- `xl` (20px) used on dashboard cards. The dashboard is tight — `md` is the home base.
- Pills used for *every* button. Pills are CTA shapes; secondary actions on marketing can still be `md`.
- Adding `2xl` or `3xl`. The scale stops at `xl`. If you need bigger, you need `full`.
