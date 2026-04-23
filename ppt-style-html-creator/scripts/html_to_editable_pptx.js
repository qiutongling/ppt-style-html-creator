#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const LAYOUTS = {
  LAYOUT_16x9: { w: 10, h: 5.625 },
  LAYOUT_16x10: { w: 10, h: 6.25 },
  LAYOUT_4x3: { w: 10, h: 7.5 },
  LAYOUT_WIDE: { w: 13.333333, h: 7.5 },
};

function usage() {
  console.error("Usage: node tools/html_to_editable_pptx.js [index.html] [output.pptx]");
}

function normalizeColor(value, fallback = "111827") {
  if (!value) return fallback;
  return String(value).trim().replace(/^#/, "").slice(0, 6).toUpperCase();
}

function pct(value, total, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  return (Number(value) / 100) * total;
}

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#x22;/gi, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function extractDeckSpec(html) {
  const match = html.match(/<script\b(?=[^>]*\bid\s*=\s*["']deck-spec["'])[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) {
    throw new Error('Missing <script type="application/json" id="deck-spec"> block.');
  }
  return JSON.parse(decodeEntities(match[1].trim()));
}

function freshShadow(shadow) {
  if (!shadow) return undefined;
  return {
    type: shadow.type || "outer",
    color: normalizeColor(shadow.color, "000000"),
    opacity: shadow.opacity === undefined ? 0.14 : Number(shadow.opacity),
    blur: shadow.blur === undefined ? 4 : Number(shadow.blur),
    angle: shadow.angle === undefined ? 45 : Number(shadow.angle),
    offset: shadow.offset === undefined ? 1 : Math.max(0, Number(shadow.offset)),
  };
}

function box(element, dims) {
  return {
    x: pct(element.x, dims.w),
    y: pct(element.y, dims.h),
    w: pct(element.w, dims.w, dims.w),
    h: pct(element.h, dims.h, dims.h),
  };
}

function addText(slide, element, dims) {
  const baseOptions = {
    ...box(element, dims),
    fontFace: element.fontFace || "Aptos",
    fontSize: Number(element.fontSize || 18),
    color: normalizeColor(element.color, "111827"),
    bold: Boolean(element.bold),
    italic: Boolean(element.italic),
    align: element.align || "left",
    valign: element.valign || "top",
    margin: element.margin === undefined ? 0 : Number(element.margin),
    fit: element.fit || "shrink",
  };

  if (element.bullets && Array.isArray(element.bullets)) {
    const runs = element.bullets.map((item, index) => ({
      text: String(item),
      options: { bullet: true, breakLine: index < element.bullets.length - 1 },
    }));
    slide.addText(runs, baseOptions);
    return;
  }

  slide.addText(String(element.text || ""), baseOptions);
}

function addShape(pres, slide, element, dims) {
  const shapeMap = {
    rect: pres.ShapeType.rect,
    rectangle: pres.ShapeType.rect,
    roundRect: pres.ShapeType.roundRect,
    roundedRect: pres.ShapeType.roundRect,
    ellipse: pres.ShapeType.ellipse,
    oval: pres.ShapeType.ellipse,
    line: pres.ShapeType.line,
  };
  const shapeType = shapeMap[element.shape || "rect"] || pres.ShapeType.rect;

  slide.addShape(shapeType, {
    ...box(element, dims),
    fill: element.fill === false ? { transparency: 100 } : {
      color: normalizeColor(element.fill || element.color || "FFFFFF"),
      transparency: element.transparency === undefined ? 0 : Number(element.transparency),
    },
    line: element.line === false ? { transparency: 100 } : {
      color: normalizeColor(element.lineColor || "FFFFFF"),
      width: element.lineWidth === undefined ? 0 : Number(element.lineWidth),
      transparency: element.lineTransparency === undefined ? 0 : Number(element.lineTransparency),
    },
    shadow: freshShadow(element.shadow),
  });
}

function addImage(slide, element, dims) {
  const source = element.data || element.src || element.path;
  if (!source) throw new Error("Image element is missing data/src/path.");
  const imageArgs = source.startsWith("data:") ? { data: source } : { path: source };
  slide.addImage({
    ...imageArgs,
    ...box(element, dims),
    transparency: element.transparency,
    altText: element.altText || element.alt || "",
  });
}

function addTable(slide, element, dims) {
  slide.addTable(element.rows || [], {
    ...box(element, dims),
    border: { type: "solid", color: normalizeColor(element.borderColor, "CBD5E1"), pt: element.borderPt || 0.75 },
    fill: { color: normalizeColor(element.fill, "FFFFFF") },
    color: normalizeColor(element.color, "111827"),
    fontFace: element.fontFace || "Aptos",
    fontSize: element.fontSize || 12,
    margin: element.margin === undefined ? 0.04 : Number(element.margin),
  });
}

function addChart(pres, slide, element, dims) {
  const chartType = pres.ChartType[String(element.chart || "bar").toLowerCase()] || pres.ChartType.bar;
  slide.addChart(chartType, element.data || [], {
    ...box(element, dims),
    showLegend: element.showLegend === undefined ? false : Boolean(element.showLegend),
    showTitle: Boolean(element.title),
    title: element.title,
    chartColors: (element.colors || ["2563EB", "14B8A6", "F97316"]).map((c) => normalizeColor(c)),
    valGridLine: { color: normalizeColor(element.gridColor, "E5E7EB"), size: 0.5 },
    catAxisLabelColor: normalizeColor(element.axisColor, "64748B"),
    valAxisLabelColor: normalizeColor(element.axisColor, "64748B"),
    showValue: element.showValue === undefined ? true : Boolean(element.showValue),
  });
}

function addElement(pres, slide, element, dims) {
  switch (element.type) {
    case "text":
      addText(slide, element, dims);
      break;
    case "shape":
      addShape(pres, slide, element, dims);
      break;
    case "image":
      addImage(slide, element, dims);
      break;
    case "table":
      addTable(slide, element, dims);
      break;
    case "chart":
      addChart(pres, slide, element, dims);
      break;
    default:
      throw new Error(`Unsupported element type: ${element.type}`);
  }
}

async function main() {
  const input = process.argv[2] || "index.html";
  const output = process.argv[3] || "deck.pptx";
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    usage();
    return;
  }

  const html = fs.readFileSync(input, "utf8");
  const spec = extractDeckSpec(html);
  const layout = spec.layout || "LAYOUT_16x9";
  const dims = LAYOUTS[layout] || LAYOUTS.LAYOUT_16x9;

  const pres = new pptxgen();
  pres.layout = layout;
  pres.author = spec.author || "";
  pres.subject = spec.subject || "";
  pres.title = spec.title || path.basename(output, ".pptx");
  pres.company = spec.company || "";
  pres.lang = spec.lang || "zh-CN";
  pres.theme = {
    headFontFace: spec.headFontFace || "Aptos Display",
    bodyFontFace: spec.bodyFontFace || "Aptos",
    lang: spec.lang || "zh-CN",
  };

  if (!Array.isArray(spec.slides) || spec.slides.length === 0) {
    throw new Error("deck-spec.slides must contain at least one slide.");
  }

  for (const slideSpec of spec.slides) {
    const slide = pres.addSlide();
    if (slideSpec.background && slideSpec.background.color) {
      slide.background = { color: normalizeColor(slideSpec.background.color, "FFFFFF") };
    }
    for (const element of slideSpec.elements || []) {
      addElement(pres, slide, element, dims);
    }
    if (slideSpec.notes) {
      slide.addNotes(String(slideSpec.notes));
    }
  }

  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  await pres.writeFile({ fileName: output });
  console.log(`Created editable PPTX: ${path.resolve(output)}`);
}

main().catch((error) => {
  console.error(`PPTX export failed: ${error.message}`);
  process.exit(1);
});
