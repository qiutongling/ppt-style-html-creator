# ppt-style-html-creator

`ppt-style-html-creator` is a Codex/Claude skill for creating deployable PPT-style HTML presentation projects with optional editable PowerPoint export.

It is used to generate PPT-style HTML and can convert the generated deck into editable PPTX format.

The skill is designed for requests such as:

- "生成一份 PPT 风格的 HTML"
- "做一个 PPT 风格 HTML 页面"
- "create a PPT-style HTML"
- "build a slide-like HTML deck"

It should not trigger for ordinary HTML pages, ordinary PPTX edits, or generic web work unless the user frames the task as a PPT-style HTML presentation project.

## What It Creates

The generated deliverable is a complete static project:

```text
project-name/
├── index.html
├── README.md
├── package.json
└── tools/
    └── html_to_editable_pptx.js
```

`index.html` is the deployable artifact. It must be self-contained, portable, and openable on any computer without external network access, CDN files, external CSS, external JavaScript, remote images, or a build step.

## Editable PPTX Export

The included exporter uses PptxGenJS to create native editable PowerPoint objects:

- Text boxes
- Shapes
- Tables
- Charts
- Images or icons as real image objects

It does not generate PowerPoint slides by placing full-slide screenshots.

To export a PPTX from a generated project:

```powershell
npm install
npm run export:pptx
```

The export script reads the embedded `deck-spec` JSON from `index.html` and generates `deck.pptx`.

## Skill Workflow

When triggered, the skill first asks the user to choose one input mode:

- Direct prompt mode: the user provides a complete prompt, and the agent asks only for blocking gaps.
- Interview mode: the agent asks structured questions before generating files.

Before creating files, the skill must confirm the save location. If the user has not specified one, it proposes a short kebab-case project folder under the current workspace and waits for confirmation.

The requirements collected by the skill include:

- Topic and core message
- Audience and usage context
- Slide count
- Aspect ratio
- Visual style
- Page-turning mode
- Save location
- Whether editable PPTX export is required

## Repository Contents

```text
ppt-style-html-creator/
├── SKILL.md
├── package.json
├── package-lock.json
├── assets/
│   └── static-project-template/
├── references/
│   └── project-contract.md
└── scripts/
    └── html_to_editable_pptx.js

dist/
└── ppt-style-html-creator.skill
```

## Installing The Skill

Use the packaged skill file:

```text
dist/ppt-style-html-creator.skill
```

Alternatively, use the source directory `ppt-style-html-creator/` directly in a local skills folder.

## Development Checks

Validate the skill:

```powershell
python path\to\skill-creator\scripts\quick_validate.py .\ppt-style-html-creator
```

Check the exporter syntax:

```powershell
cd .\ppt-style-html-creator
npm install
npm run check:exporter
```

Package the skill:

```powershell
python path\to\skill-creator\scripts\package_skill.py .\ppt-style-html-creator .\dist
```

## Release Artifact

The current packaged release artifact is:

```text
dist/ppt-style-html-creator.skill
```
