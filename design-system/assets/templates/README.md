# Asset templates

Every file in this folder is a **draft template I (Claude) generated from the design system tokens**. They are not real shipped X-Ray Tech assets — yet. The whole point of this folder is to give the team something to ship from on day one, then **replace each draft with the real version as it ships**.

When a real one-pager, real carousel, or real OG image is produced, drop it in here and delete (or archive) the synthetic version. The real shipped artifact is always preferred over a synthetic recreation.

## Inventory

| File                                  | Type                       | Status                                            |
| ------------------------------------- | -------------------------- | ------------------------------------------------- |
| `og-image.svg` / `.png` / `.jpg`      | OG / social share image    | **Draft — replace once a real OG image ships.**   |
| `instagram-carousel-cover.svg/.png/.jpg`   | IG carousel cover (4:5)    | **Draft — replace with first real carousel.**     |
| `instagram-carousel-body.svg/.png/.jpg`    | IG carousel body slide     | **Draft — replace with first real carousel.**     |
| `instagram-carousel-closer.svg/.png/.jpg`  | IG carousel CTA slide      | **Draft — replace with first real carousel.**     |
| `linkedin-post.svg/.png/.jpg`         | LinkedIn 1:1 post template | **Draft — replace with first real LinkedIn post.** |
| `marp-theme.css`                      | Marp slide theme           | **Active.** Not a recreation — this is the actual theme used to render markdown decks. Keep as-is. |

## How to pick a template

- **Pitch deck or markdown-based deck?** Use `marp-theme.css` (load it in your Marp setup, reference `theme: xraytech` in the slide front-matter).
- **Need to share a marketing link on social?** Start from `og-image.svg`.
- **Need to post a 3–8-frame teaching thread on Instagram?** Start from the `instagram-carousel-*` templates — open the cover SVG, modify the hook text, then duplicate for body slides.
- **Need to publish a thought-leadership post on LinkedIn?** Start from `linkedin-post.svg`.

## How to use the SVG templates

Each SVG is parameterized — open it in any text editor, edit the headline / number / subhead, then re-render to PNG via:

```bash
node /Users/nannyhabers/.claude/skills/design-system-creator/scripts/render.mjs <file.svg> --bg "#FFFFFF"
```

(or install `playwright` locally in this project and use a relative copy of the script).

## Flag for replacement — please review

I drafted every file here based on the X-Ray Tech design system, but I have not seen real shipped versions of any of these. **Let me know which ones look off**, and **send back any real shipped assets** (a one-pager PDF, a real social carousel, a real OG image) and I'll swap them in here as the canonical templates. Real shipped assets always beat synthetic recreations.

## What never goes in this folder

- Stock-photo backgrounds.
- AI-generated humans.
- Templates for surfaces we don't actually ship to.
- Multiple alternate versions of the same template. One canonical per surface.
