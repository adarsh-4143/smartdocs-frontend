import type {
  DesignerDocument,
  DesignerObject,
  DesignerPage,
  ImageObject,
  LineObject,
  PageBand,
  PageBackground,
  ShapeObject,
  TableCell,
  TableObject,
  TextObject,
  WatermarkObject,
} from "@/types/documentDesigner.types";
import { DESIGNER_VERSION } from "@/types/documentDesigner.types";
import { createId } from "./constants";

export function defaultBackground(): PageBackground {
  return {
    color: "#ffffff",
    image: null,
    imageFit: "cover",
    imageOpacity: 1,
  };
}

export function defaultBand(enabled = false, height = 72): PageBand {
  return { enabled, height, image: null, imageFit: "cover" };
}

export function normalizeBand(band?: Partial<PageBand> | null, fallbackHeight = 72): PageBand {
  const base = defaultBand(false, fallbackHeight);
  if (!band) return base;
  const fit = band.imageFit;
  return {
    enabled: typeof band.enabled === "boolean" ? band.enabled : Boolean(band.image),
    height: typeof band.height === "number" && band.height > 0 ? band.height : base.height,
    image: band.image || null,
    imageFit: fit === "contain" || fit === "fill" || fit === "cover" ? fit : "cover",
  };
}

export function copyPageBands(from: DesignerPage, to: DesignerPage): DesignerPage {
  return {
    ...to,
    header: { ...normalizeBand(from.header, 80) },
    footer: { ...normalizeBand(from.footer, 56) },
  };
}

export function nextZIndex(objects: DesignerObject[]): number {
  return objects.reduce((max, obj) => Math.max(max, obj.zIndex), 0) + 1;
}

export function emptyCell(): TableCell {
  return {
    html: "",
    colspan: 1,
    rowspan: 1,
    skipped: false,
    background: null,
    color: null,
    align: "left",
    vAlign: "middle",
    fontSize: 12,
    bold: false,
    padding: 8,
    borderWidth: null,
    borderColor: null,
  };
}

export function createTableCells(rows: number, cols: number): TableCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => emptyCell())
  );
}

export function createBlankPage(): DesignerPage {
  return {
    id: createId("page"),
    background: defaultBackground(),
    header: defaultBand(false, 80),
    footer: defaultBand(false, 56),
    objects: [],
    flowHtml: "",
  };
}

export function createBlankDocument(): DesignerDocument {
  return {
    version: DESIGNER_VERSION,
    orientation: "portrait",
    pages: [createBlankPage()],
  };
}

function baseProps(
  type: DesignerObject["type"],
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number
) {
  return {
    id: createId(type),
    type,
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex,
    band: "body" as const,
  };
}

export function createTextObject(
  x: number,
  y: number,
  zIndex: number,
  html = ""
): TextObject {
  return {
    ...baseProps("text", "Text", x, y, 280, 72, zIndex),
    type: "text",
    html: html || "",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: 14,
    color: "#0f172a",
    background: null,
    align: "left",
    lineHeight: 1.5,
    letterSpacing: 0,
    padding: 4,
  };
}

export function createImageObject(
  x: number,
  y: number,
  zIndex: number,
  src: string,
  name = "Image"
): ImageObject {
  return {
    ...baseProps("image", name, x, y, 180, 120, zIndex),
    type: "image",
    src,
    fit: "contain",
    borderWidth: 0,
    borderColor: "#0f172a",
    borderRadius: 0,
  };
}

export function createTableObject(
  x: number,
  y: number,
  zIndex: number,
  rows: number,
  cols: number
): TableObject {
  const safeRows = Math.max(1, Math.min(20, rows));
  const safeCols = Math.max(1, Math.min(12, cols));
  return {
    ...baseProps("table", "Table", x, y, Math.min(520, 90 * safeCols), 36 + 32 * safeRows, zIndex),
    type: "table",
    rows: safeRows,
    cols: safeCols,
    cells: createTableCells(safeRows, safeCols),
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderStyle: "solid",
    headerRow: true,
    headerBold: true,
    headerBackground: "#f1f5f9",
  };
}

export function createShapeObject(
  x: number,
  y: number,
  zIndex: number,
  shape: ShapeObject["shape"] = "rectangle"
): ShapeObject {
  const size = shape === "circle" ? 96 : 160;
  return {
    ...baseProps("shape", shape === "circle" ? "Circle" : "Shape", x, y, size, shape === "circle" ? size : 48, zIndex),
    type: "shape",
    shape,
    fill: shape === "rectangle" || shape === "rounded-rect" ? "#e2e8f0" : "transparent",
    stroke: "#334155",
    strokeWidth: 1.5,
  };
}

export function createLineObject(
  x: number,
  y: number,
  zIndex: number,
  orientation: LineObject["orientation"] = "horizontal"
): LineObject {
  return {
    ...baseProps(
      "line",
      "Line",
      x,
      y,
      orientation === "horizontal" ? 280 : 2,
      orientation === "horizontal" ? 2 : 180,
      zIndex
    ),
    type: "line",
    orientation,
    stroke: "#334155",
    strokeWidth: 2,
    strokeStyle: "solid",
  };
}

export function createWatermarkObject(
  pageWidth: number,
  pageHeight: number,
  zIndex: number,
  mode: WatermarkObject["mode"] = "text"
): WatermarkObject {
  return {
    ...baseProps("watermark", "Watermark", pageWidth / 2 - 180, pageHeight / 2 - 40, 360, 80, zIndex),
    type: "watermark",
    mode,
    text: "CONFIDENTIAL",
    src: null,
    color: "#94a3b8",
    fontSize: 36,
    opacity: 0.18,
    rotation: -28,
    zIndex: 0,
  };
}

export function createDivider(x: number, y: number, zIndex: number): LineObject {
  return createLineObject(x, y, zIndex, "horizontal");
}

export function duplicateObject(obj: DesignerObject, offset = 16): DesignerObject {
  return {
    ...cloneObject(obj),
    id: createId(obj.type),
    name: `${obj.name} copy`,
    x: obj.x + offset,
    y: obj.y + offset,
    locked: false,
  };
}

export function cloneObject(obj: DesignerObject): DesignerObject {
  return JSON.parse(JSON.stringify(obj)) as DesignerObject;
}

export function findObject(
  doc: DesignerDocument,
  objectId: string
): { pageIndex: number; objectIndex: number; object: DesignerObject } | null {
  for (let pageIndex = 0; pageIndex < doc.pages.length; pageIndex += 1) {
    const objectIndex = doc.pages[pageIndex].objects.findIndex((o) => o.id === objectId);
    if (objectIndex >= 0) {
      return { pageIndex, objectIndex, object: doc.pages[pageIndex].objects[objectIndex] };
    }
  }
  return null;
}

export function objectLabel(obj: DesignerObject): string {
  if (obj.name && obj.name.trim()) return obj.name;
  switch (obj.type) {
    case "text": {
      const text = obj.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return text ? text.slice(0, 28) : "Text";
    }
    case "image":
      return "Image";
    case "table":
      return `Table ${obj.rows}×${obj.cols}`;
    case "shape":
      return obj.shape === "circle" ? "Circle" : "Shape";
    case "line":
      return "Line";
    case "watermark":
      return "Watermark";
    default:
      return "Object";
  }
}
