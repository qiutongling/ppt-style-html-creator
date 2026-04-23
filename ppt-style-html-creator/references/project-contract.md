# PPT-Style HTML Project Contract

Use this reference when generating a deployable PPT-style HTML project and optional editable PPTX export.

## Required Project Shape

```text
project-name/
├── index.html
├── README.md
├── package.json
└── tools/
    └── html_to_editable_pptx.js
```

The deployable artifact is `index.html`. It must remain usable if copied alone to another computer.

`package.json` is for editable PPTX export tooling only. It must declare `pptxgenjs` and an `export:pptx` script, but the HTML deck must not depend on Node or npm at runtime.

## Self-Contained HTML Rules

- Inline all CSS and JavaScript.
- Use inline SVG or data URI/base64 for graphics and images.
- Do not use CDN scripts, web fonts, remote images, external CSS, or external JS.
- Do not require Node, npm, Python, a local server, or build tools to view the deck.
- Keep one top-level `.slide` per slide.
- Include the embedded deck spec as `<script type="application/json" id="deck-spec">`.

## Deck Spec Schema

Use percentage coordinates (`0` to `100`) for all elements:

```json
{
  "title": "Deck title",
  "author": "Optional author",
  "layout": "LAYOUT_16x9",
  "slides": [
    {
      "id": "cover",
      "background": { "color": "111827" },
      "elements": [
        {
          "type": "text",
          "text": "Main title",
          "x": 8,
          "y": 16,
          "w": 64,
          "h": 16,
          "fontSize": 38,
          "bold": true,
          "color": "FFFFFF"
        }
      ]
    }
  ]
}
```

Supported element types for editable PPTX export:

- `text`
- `shape`
- `image`
- `table`
- `chart`

## Editable PPTX Rules

- Generate PPTX from the deck spec, not from screenshots.
- Use PptxGenJS native objects for text, shapes, tables, charts, and images.
- Do not export a full-slide screenshot as the slide body.
- Use images only for actual images, icons, or decorative raster assets.
- Keep HTML interactions separate from PPTX static slide order.

## Verification Checklist

- Confirm output path was user-selected or explicitly confirmed.
- Open `index.html` locally without network.
- Copy `index.html` to another folder and open it again.
- Run `npm install` only when exporting PPTX.
- Run `npm run export:pptx`.
- Confirm PPTX text is extractable with `python -m markitdown output.pptx`.
- Inspect rendered PPTX for cropping, overlap, low contrast, and placeholder text.
