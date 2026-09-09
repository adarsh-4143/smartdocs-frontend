import type {
  DesignerDocument,
  DesignerObject,
  DesignerPage,
  ImageObject,
  LineObject,
  ShapeObject,
  TableCell,
  TableObject,
  TextObject,
  WatermarkObject,
} from "@/types/documentDesigner.types";
import { DESIGNER_MARKER, DESIGNER_VERSION } from "@/types/documentDesigner.types";
import { pageSize, pxToMm, mmToPx, GOOGLE_FONTS_HREF } from "./constants";
import { isBlankHtml } from "./cleanHtml";
import { normalizeBand } from "./model";

function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

type LayoutUnit = "mm" | "px";

function styleAttr(styles: Record<string, string | number | null | undefined>): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function layoutDim(
  px: number,
  axis: "x" | "y",
  orientation: DesignerDocument["orientation"],
  unit: LayoutUnit
): string {
  if (unit === "px") return `${Math.round(px)}px`;
  return `${pxToMm(px, axis, orientation)}mm`;
}

function applyPagePlaceholders(html: string, pageIndex: number, pageCount: number): string {
  return html
    .replace(/\{\{page_number\}\}/g, String(pageIndex + 1))
    .replace(/\{\{page_count\}\}/g, String(pageCount));
}

function cellHtml(cell: TableCell, table: TableObject, isHeader: boolean): string {
  if (cell.skipped) return "";
  const tag = isHeader ? "th" : "td";
  const borderW = cell.borderWidth ?? table.borderWidth;
  const borderC = cell.borderColor ?? table.borderColor;
  const bg =
    cell.background ||
    (isHeader && table.headerBackground ? table.headerBackground : "transparent");
  const weight = isHeader && table.headerBold ? "700" : cell.bold ? "700" : "400";
  const css = styleAttr({
    "background-color": bg,
    color: cell.color || "inherit",
    "text-align": cell.align,
    "vertical-align": cell.vAlign,
    "font-size": `${cell.fontSize}px`,
    "font-weight": weight,
    padding: `${cell.padding}px`,
    border: table.borderWidth === 0 && borderW === 0 ? "none" : `${borderW}px ${table.borderStyle} ${borderC}`,
    "word-break": "break-word",
  });
  const span = `${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ""}${
    cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ""
  }`;
  return `<${tag}${span} style="${css}">${cell.html || ""}</${tag}>`;
}

function renderObject(
  obj: DesignerObject,
  pageIndex: number,
  pageCount: number,
  orientation: DesignerDocument["orientation"],
  unit: LayoutUnit
): string {
  if (!obj.visible) return "";

  const box = styleAttr({
    position: "absolute",
    left: layoutDim(obj.x, "x", orientation, unit),
    top: layoutDim(obj.y, "y", orientation, unit),
    width: layoutDim(obj.width, "x", orientation, unit),
    height: layoutDim(obj.height, "y", orientation, unit),
    opacity: obj.opacity,
    transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
    "transform-origin": "center center",
    "z-index": obj.zIndex,
    "box-sizing": "border-box",
    overflow: obj.type === "text" || obj.type === "table" ? "visible" : "hidden",
    "pointer-events": "none",
  });

  const inner = renderObjectInner(obj, pageIndex, pageCount);
  return `<div class="hrms-obj" data-id="${obj.id}" data-type="${obj.type}" style="${box}">${inner}</div>`;
}

function renderObjectInner(obj: DesignerObject, pageIndex: number, pageCount: number): string {
  switch (obj.type) {
    case "text":
      return renderText(obj, pageIndex, pageCount);
    case "image":
      return renderImage(obj);
    case "table":
      return renderTable(obj, pageIndex, pageCount);
    case "shape":
      return renderShape(obj);
    case "line":
      return renderLine(obj);
    case "watermark":
      return renderWatermark(obj, pageIndex, pageCount);
    default:
      return "";
  }
}

function renderText(obj: TextObject, pageIndex: number, pageCount: number): string {
  const html = applyPagePlaceholders(obj.html || "", pageIndex, pageCount);
  const css = styleAttr({
    width: "100%",
    height: "100%",
    "font-family": obj.fontFamily,
    "font-size": `${obj.fontSize}px`,
    color: obj.color,
    "background-color": obj.background || "transparent",
    "text-align": obj.align,
    "line-height": String(obj.lineHeight),
    "letter-spacing": `${obj.letterSpacing}px`,
    padding: `${obj.padding}px`,
    "white-space": "normal",
    "word-break": "break-word",
    "box-sizing": "border-box",
  });
  return `<div class="hrms-text" style="${css}">${html}</div>`;
}

function renderImage(obj: ImageObject): string {
  if (!obj.src) return "";
  const css = styleAttr({
    width: "100%",
    height: "100%",
    "object-fit": obj.fit,
    "border-width": `${obj.borderWidth}px`,
    "border-style": obj.borderWidth ? "solid" : "none",
    "border-color": obj.borderColor,
    "border-radius": `${obj.borderRadius}px`,
    display: "block",
  });
  return `<img src="${obj.src}" alt="" style="${css}" />`;
}

function renderTable(obj: TableObject, pageIndex: number, pageCount: number): string {
  const tableCss = styleAttr({
    width: "100%",
    height: "100%",
    "border-collapse": "collapse",
    "table-layout": "fixed",
    "border-style": obj.borderStyle,
  });
  const rowsHtml = obj.cells
    .map((row, rowIndex) => {
      const cells = row
        .map((cell) => {
          return applyPagePlaceholders(
            cellHtml(cell, obj, obj.headerRow && rowIndex === 0),
            pageIndex,
            pageCount
          );
        })
        .join("");
      return `<tr>${cells}</tr>`;
    });
  const head = obj.headerRow && rowsHtml.length ? `<thead style="display:table-header-group">${rowsHtml[0]}</thead>` : "";
  const body = `<tbody>${(obj.headerRow ? rowsHtml.slice(1) : rowsHtml).join("")}</tbody>`;
  return `<table class="hrms-table" style="${tableCss}">${head}${body}</table>`;
}

function renderShape(obj: ShapeObject): string {
  const radius = obj.shape === "circle" ? "50%" : obj.shape === "rounded-rect" ? "12px" : "0";
  const css = styleAttr({
    width: "100%",
    height: "100%",
    "background-color": obj.fill,
    border: `${obj.strokeWidth}px solid ${obj.stroke}`,
    "border-radius": radius,
    "box-sizing": "border-box",
  });
  return `<div class="hrms-shape" data-shape="${obj.shape}" style="${css}"></div>`;
}

function renderLine(obj: LineObject): string {
  const css = styleAttr({
    width: "100%",
    height: "100%",
    "background-color": obj.orientation === "horizontal" || obj.orientation === "vertical" ? "transparent" : obj.stroke,
    "border-top":
      obj.orientation === "horizontal"
        ? `${obj.strokeWidth}px ${obj.strokeStyle} ${obj.stroke}`
        : "none",
    "border-left":
      obj.orientation === "vertical" ? `${obj.strokeWidth}px ${obj.strokeStyle} ${obj.stroke}` : "none",
    "box-sizing": "border-box",
  });
  return `<div class="hrms-line" style="${css}"></div>`;
}

function renderWatermark(obj: WatermarkObject, pageIndex: number, pageCount: number): string {
  if (obj.mode === "image" && obj.src) {
    const css = styleAttr({
      width: "100%",
      height: "100%",
      "object-fit": "contain",
      display: "block",
    });
    return `<img src="${obj.src}" alt="" style="${css}" />`;
  }
  const text = applyPagePlaceholders(obj.text || "", pageIndex, pageCount);
  const css = styleAttr({
    width: "100%",
    height: "100%",
    display: "flex",
    "align-items": "center",
    "justify-content": "center",
    "font-family": "Arial, Helvetica, sans-serif",
    "font-size": `${obj.fontSize}px`,
    "font-weight": 700,
    color: obj.color,
    "letter-spacing": "0.18em",
    "text-transform": "uppercase",
    "user-select": "none",
  });
  return `<div class="hrms-watermark" style="${css}">${text}</div>`;
}

function renderBand(
  kind: "header" | "footer",
  band: DesignerPage["header"],
  orientation: DesignerDocument["orientation"],
  unit: LayoutUnit
): string {
  const normalized = normalizeBand(band, kind === "header" ? 80 : 56);
  if (!normalized.enabled) return "";
  const pos = kind === "header" ? "top:0;" : "bottom:0;";
  const img = normalized.image
    ? `<img src="${normalized.image}" alt="" style="width:100%;height:100%;object-fit:${normalized.imageFit};object-position:center;display:block;" />`
    : "";
  return `<div class="hrms-${kind}-band" style="position:absolute;left:0;${pos}width:100%;height:${layoutDim(
    normalized.height,
    "y",
    orientation,
    unit
  )};overflow:hidden;pointer-events:none;">${img}</div>`;
}

function renderPage(
  page: DesignerPage,
  orientation: DesignerDocument["orientation"],
  pageIndex: number,
  pageCount: number,
  unit: LayoutUnit
): string {
  const size = pageSize(orientation);
  const bgImage = page.background.image
    ? `url(${page.background.image})`
    : "none";
  const pageW = unit === "px" ? `${size.widthPx}px` : `${size.widthMm}mm`;
  const pageH = unit === "px" ? `${size.heightPx}px` : `${size.heightMm}mm`;
  const sidePad = unit === "px" ? `${mmToPx(12, "x", orientation)}px` : "12mm";
  const css = styleAttr({
    width: pageW,
    height: pageH,
    position: "relative",
    overflow: "hidden",
    "box-sizing": "border-box",
    "background-color": page.background.color || "#ffffff",
    "background-image": bgImage,
    "background-size": page.background.imageFit,
    "background-repeat": "no-repeat",
    "background-position": "center",
  });

  const bgOverlay =
    page.background.image && page.background.imageOpacity < 1
      ? `<div class="hrms-bg-dim" style="position:absolute;inset:0;background:${page.background.color};opacity:${
          1 - page.background.imageOpacity
        };pointer-events:none;"></div>`
      : "";

  const headerBand = normalizeBand(page.header, 80);
  const footerBand = normalizeBand(page.footer, 56);
  const header = renderBand("header", headerBand, orientation, unit);
  const footer = renderBand("footer", footerBand, orientation, unit);

  const flowPadTop = headerBand.enabled ? headerBand.height : 16;
  const flowPadBottom = footerBand.enabled ? footerBand.height : 16;
  const flow = !isBlankHtml(page.flowHtml)
    ? `<div class="hrms-flow" style="position:relative;z-index:1;padding:${layoutDim(flowPadTop, "y", orientation, unit)} ${sidePad} ${layoutDim(
        flowPadBottom,
        "y",
        orientation,
        unit
      )};box-sizing:border-box;width:100%;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:1.5;color:#0f172a;">${applyPagePlaceholders(
        page.flowHtml,
        pageIndex,
        pageCount
      )}</div>`
    : "";

  const objects = [...page.objects]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((obj) => renderObject(obj, pageIndex, pageCount, orientation, unit))
    .join("");

  return `<section class="hrms-a4-page" data-page-id="${page.id}" style="${css}">${bgOverlay}${header}${flow}${objects}${footer}</section>`;
}

function printCss(doc: DesignerDocument, unit: LayoutUnit = "mm"): string {
  const size = pageSize(doc.orientation);
  const pageSizeCss = doc.orientation === "landscape" ? "A4 landscape" : "A4 portrait";
  const pageW = unit === "px" ? `${size.widthPx}px` : `${size.widthMm}mm`;
  const pageH = unit === "px" ? `${size.heightPx}px` : `${size.heightMm}mm`;
  const breakCss =
    unit === "px"
      ? ""
      : "page-break-after:always;break-after:page;page-break-inside:avoid;break-inside:avoid;";
  const lastBreakCss = unit === "px" ? "" : ".hrms-a4-page:last-child{page-break-after:auto;break-after:auto;}";
  return `
@import url('${GOOGLE_FONTS_HREF}');
.hrms-a4-document{width:${pageW};margin:0 auto;background:#fff;color:#0f172a;}
.hrms-a4-page{width:${pageW};height:${pageH};max-width:${pageW};max-height:${pageH};position:relative;overflow:hidden;box-sizing:border-box;background:#fff;${breakCss}}
${lastBreakCss}
.hrms-obj{position:absolute;box-sizing:border-box;}
.hrms-text p, .hrms-flow p{margin:0 0 0.4em;}
.hrms-text ul, .hrms-flow ul, .hrms-text ol, .hrms-flow ol{margin:0.3em 0 0.3em 1.2em;padding:0;}
.hrms-text h1, .hrms-flow h1{font-size:1.6em;margin:0 0 0.35em;}
.hrms-text h2, .hrms-flow h2{font-size:1.3em;margin:0 0 0.3em;}
.hrms-text h3, .hrms-flow h3{font-size:1.15em;margin:0 0 0.25em;}
.hrms-table{border-collapse:collapse;width:100%;}
.hrms-designer-model{display:none !important;}
@page{size:${pageSizeCss};margin:0;}
@media print{
  html,body{width:${pageW};margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .hrms-a4-document{width:${pageW};margin:0;}
  .hrms-a4-page{margin:0;box-shadow:none !important;}
}
`.replace(/\s+/g, " ").trim();
}

export function serializeDocument(doc: DesignerDocument, options?: { unit?: LayoutUnit }): string {
  const unit = options?.unit || "mm";
  const payload = escapeJsonForScript(JSON.stringify(doc));
  const pages = doc.pages
    .map((page, index) => renderPage(page, doc.orientation, index, doc.pages.length, unit))
    .join("");
  return `<div class="hrms-a4-document" ${DESIGNER_MARKER}="${DESIGNER_VERSION}" data-orientation="${doc.orientation}"><script type="application/json" class="hrms-designer-model">${payload}</script><style>${printCss(
    doc,
    unit
  )}</style>${pages}</div>`;
}

export function isDesignerHtml(html?: string | null): boolean {
  if (!html) return false;
  return html.includes(`${DESIGNER_MARKER}=`) || html.includes("hrms-a4-document") || html.includes("hrms-designer-model");
}

function normalizeDocument(data: DesignerDocument): DesignerDocument {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      header: normalizeBand(page.header, 80),
      footer: normalizeBand(page.footer, 56),
    })),
  };
}

export function parseDesignerJson(html: string): DesignerDocument | null {
  if (!html) return null;
  try {
    if (typeof window === "undefined") {
      const match = html.match(/<script[^>]*class="hrms-designer-model"[^>]*>([\s\S]*?)<\/script>/i);
      if (!match?.[1]) return null;
      const data = JSON.parse(match[1]) as DesignerDocument;
      if (!data || !Array.isArray(data.pages)) return null;
      return normalizeDocument(data);
    }
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, "text/html");
    const script = parsed.querySelector("script.hrms-designer-model");
    if (!script?.textContent) return null;
    const data = JSON.parse(script.textContent) as DesignerDocument;
    if (!data || !Array.isArray(data.pages)) return null;
    return normalizeDocument(data);
  } catch {
    return null;
  }
}

/** Re-render saved designer HTML with current print CSS and exact A4 mm mapping. */
export function refreshDesignerHtml(html: string): string {
  const parsed = parseDesignerJson(html);
  return parsed ? serializeDocument(parsed) : html;
}

export function extractDesignerPageHtml(html: string): string[] {
  const fresh = refreshDesignerHtml(html);
  if (typeof window === "undefined") return [fresh];
  try {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(fresh, "text/html");
    const pages = Array.from(parsed.querySelectorAll(".hrms-a4-page"));
    if (pages.length === 0) return [fresh];
    const style = parsed.querySelector(".hrms-a4-document style")?.outerHTML || "";
    return pages.map((page) => {
      page.style.removeProperty("page-break-after");
      page.style.removeProperty("break-after");
      page.style.removeProperty("page-break-before");
      page.style.removeProperty("break-before");
      return `${style}${page.outerHTML}`;
    });
  } catch {
    return [fresh];
  }
}
