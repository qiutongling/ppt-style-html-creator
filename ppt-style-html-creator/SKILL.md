---
name: ppt-style-html-creator
description: Create deployable PPT-style HTML presentation projects and editable PPTX exports. Use only when the user explicitly invokes this skill/workflow, or asks to "生成一份PPT风格的HTML", "做一个PPT风格HTML页面", "create a PPT-style HTML", "slide-like HTML deck", or a similar presentation-as-HTML deliverable. Do not trigger for ordinary HTML pages, ordinary PPTX edits, or generic web work unless the user frames it as a PPT-style HTML presentation project.
---

# PPT Style HTML Creator

## Overview

Create a complete static project for a PPT-style HTML deck that can be deployed anywhere and opened offline. When requested, also generate an editable `.pptx` using native PowerPoint objects through PptxGenJS, not full-slide screenshots.

## First Interaction

After this skill triggers, do not start generating files immediately. First ask the user to choose one intake mode:

- **Direct prompt mode**: the user submits one complete prompt; ask only for blocking gaps.
- **Interview mode**: ask targeted questions before designing or generating the project.

Before writing files, always confirm the output directory. If the user has not specified one, propose a short kebab-case project folder under the current workspace and wait for confirmation.

## Required Requirements

Collect or infer these requirements before implementation:

- Topic and core message
- Audience and usage context
- Slide count
- Aspect ratio
- Visual style
- Page-turning mode
- Save location
- Whether an editable `.pptx` export is required

Page-turning modes include keyboard navigation, button navigation, scroll sections, auto-play, static page sequence, or a PPTX-friendly no-interaction variant. If exporting to PPTX, preserve the static page order even when the HTML has richer interactions.

## Output Project Contract

The final deliverable is a complete deployable static project. Use this default structure:

```text
project-name/
├── index.html
├── README.md
├── package.json
└── tools/
    └── html_to_editable_pptx.js
```

`index.html` must be self-contained and portable:

- No CDN dependencies
- No remote images
- No external fonts
- No external CSS or JavaScript
- No build step required to open the presentation
- Inline CSS, JavaScript, SVG, and data URI/base64 assets inside `index.html`

The project may use `package.json` only for local PPTX export tooling. The deployable presentation must work without running `npm install`.

This skill also includes its own `package.json` so the PPTX exporter dependency is part of the skill package instead of being an implicit dependency of the surrounding workspace.

## Workflow

1. Establish the intake mode and save location.
2. Gather the required requirements.
3. Draft a unified deck spec before writing HTML or PPTX.
4. Generate `index.html` from the deck spec as the visual source of truth.
5. Copy `scripts/html_to_editable_pptx.js` into the generated project's `tools/` directory when PPTX export is requested or likely useful.
6. Generate `package.json` with `pptxgenjs` and a script such as `npm run export:pptx`.
7. Generate `README.md` with offline open, static deployment, and PPTX export instructions.
8. Verify portability and, if requested, run the editable PPTX export.

If the user provides arbitrary HTML, do not attempt blind CSS-to-PPTX conversion. First normalize it into this skill's controlled `.slide` structure and embedded `deck-spec` JSON, then export PPTX from that spec.

## HTML Requirements

Use one top-level `.slide` element per slide:

```html
<main class="deck" aria-label="Presentation deck">
  <section class="slide" data-slide-id="cover">...</section>
  <section class="slide" data-slide-id="agenda">...</section>
</main>
```

Include one embedded deck spec:

```html
<script type="application/json" id="deck-spec">
{
  "title": "Presentation Title",
  "layout": "LAYOUT_16x9",
  "slides": []
}
</script>
```

Use coordinates in percentages in the deck spec (`x`, `y`, `w`, `h` from `0` to `100`) so the same model can render HTML and editable PPTX.

## Editable PPTX Requirements

Use PptxGenJS to create native PowerPoint objects:

- `addText` for titles, labels, body copy, and bullets
- `addShape` for cards, panels, rules, circles, and decorative geometry
- `addTable` for tables
- `addChart` for native charts
- `addImage` only for actual image assets or generated icons, not for full-slide screenshots

Follow these constraints from the local `pptx` skill:

- Use hex colors without `#`
- Do not use 8-character hex colors for opacity
- Use `opacity` or `transparency` fields where supported
- Do not use Unicode bullet characters; use PptxGenJS bullet options
- Set text box `margin: 0` when precise alignment matters
- Do not reuse mutable option objects across multiple PptxGenJS calls

## Resources

- `assets/static-project-template/`: minimal deployable project skeleton to copy when starting a new deck.
- `scripts/html_to_editable_pptx.js`: reads `index.html`, extracts the embedded `deck-spec`, and writes an editable `.pptx`.
- `references/project-contract.md`: deck spec schema, project rules, and verification checklist.
- `package.json`: declares the PptxGenJS export dependency and local exporter check/export scripts.

## Verification

Always verify:

- Output directory matches the user's confirmed save location.
- `index.html` can be opened directly after copying it away from the project folder.
- The project can be deployed as static files without a build step.
- If `.pptx` is exported, text is extractable with `python -m markitdown output.pptx`.
- If `.pptx` is exported, visual QA checks for cropping, overflow, overlap, low contrast, and placeholder leftovers.

If PPTX export is not possible because dependencies are missing, report the missing dependency and leave the project with clear `npm install` and export instructions.
