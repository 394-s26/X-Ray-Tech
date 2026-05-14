# Imagery

## The single most important rule

**Real photography of real X-ray technologists in real imaging suites.** Soft natural light, no production gloss, no staged poses. If you can't show a real photo, show data — never default to stock or AI-generated.

## Photography

### What we shoot

- A tech at an X-ray console mid-shift.
- A tech reviewing a scan on a monitor.
- A manager walking the floor of an imaging department.
- A close-up of hands inputting into a control panel — not a phone.
- The physical surfaces of the job: lead aprons hanging, a clean modality bay, a workstation lit by monitor glow.

### How we shoot

- **Light**: natural, slightly cool. Hospital fluorescents are an honest part of the environment — don't filter them out.
- **Crop**: tighter than feels comfortable. The hand on the console matters more than the wide-angle of the room.
- **People**: real people doing real work. No fake smiling at the camera. Looking-at-the-work shots beat looking-at-the-camera shots.
- **Negative space**: leave generous space on one side for type overlay.

### What we don't use

- **Stock photography of "a healthcare professional with a tablet."** Especially with arms crossed. Especially in front of a window.
- **Stock photography of "diverse team around a laptop."** Banned.
- **AI-generated humans.** Banned — and especially banned in healthcare, where any cue of fakery torches credibility.
- **Generic "AI" visuals:** glowing orbs, neural meshes, wireframe globes, data streams shooting toward a brain silhouette. None of it.
- **Light leaks, lens flares, vignettes.** No film simulation.
- **Black-and-white** unless the photograph was originally captured that way for a reason.

### Image treatments

- **None by default.** Photos render at their natural color.
- **Radius**: `lg` (12px) for photos on marketing pages. `none` for in-product photo previews (e.g., the OCR'd scan of a certificate).
- **Aspect ratios**: 4:5 (portrait, default), 16:9 (landscape, hero), 1:1 (square, social).

## Illustration

### Style

If illustration is needed (and it usually isn't):

- **Flat, single-color** in `brand/600` line art on `paper`. 1.5px stroke. Geometric shapes only — no organic curves trying to look "human."
- Or **two-tone**: `brand/200` fills, `brand/600` strokes on `paper`.
- Lucide-icon-style proportions scaled up.

### What we never illustrate

- **People.** No corporate-memphis blob figures with floating limbs. No "diverse smiling avatar" sets. No isometric humans. If you need a human in an illustration, use a real photograph instead.
- **3D isometric anything.** Banned.
- **Memphis-style** (squiggles, dots, grids in five colors). Banned.
- **AI tropes** — glowing circuits, brain-with-gear, robot hand reaching toward human hand. Banned forever.

## OG / social image (1200×630)

Standard structure for share images:

- Background: `paper` with subtle `assets/patterns/grid.svg` overlay at 30% opacity.
- Type: `display-lg` headline (Geist, ink/900), max 3 lines, top-left, 64px inset.
- Mark: `lockup-horizontal.svg` bottom-right, 200px wide, 48px inset.
- Optional accent: a single `brand/600` arrow-right icon to the right of the headline.

No photographs in OG images. The headline is the imagery.

## Patterns & backgrounds

| File                              | Use                                                          |
| --------------------------------- | ------------------------------------------------------------ |
| `assets/patterns/grid.svg`        | Subtle 16×16 dot grid. Background of OG images, hero washes. |
| `assets/patterns/brand-wash.svg`  | Soft radial wash from `brand/50` → `paper`. Hero backdrop.   |

**Banned**: animated backgrounds, particle systems, aurora gradients, mesh gradients, scrolling backgrounds, parallax textures.

## Fallback order when photography isn't available

1. **Data visualization** — show the actual progress ring, the actual point counter, the actual renewal calendar. *The data is the imagery.* This is the brand's strongest default.
2. **Plain `paper` background with the headline as the entire visual.** Quiet, confident, on-brand. Always allowed.
3. **`brand/50` wash with a single Lucide icon in `brand/600`** — only if 1 and 2 don't fit the layout.
4. **Two-tone illustration** (per spec above) — last resort, requires a designer.
5. **Never**: a stock photo or an AI image. Even as a temporary placeholder.
