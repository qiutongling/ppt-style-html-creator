# PPT-Style HTML Deck

This project is a deployable static PPT-style HTML presentation.

## Open Locally

Open `index.html` directly in any modern browser. The file is self-contained and does not require a local server, internet access, Node, npm, or a build step.

## Deploy

Upload the project folder to any static host, including GitHub Pages, Netlify, Vercel, Nginx, or a normal file server.

## Export Editable PPTX

The editable PPTX exporter uses PptxGenJS. This dependency is declared in `package.json`.

Install the local export dependency:

```powershell
npm install
```

Generate a PowerPoint file:

```powershell
npm run export:pptx
```

The export script reads the embedded `deck-spec` JSON in `index.html` and creates native PowerPoint text, shape, table, chart, and image objects. It does not create full-slide screenshots.
