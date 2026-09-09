export const DESIGNER_VERSION = 1;
export const DESIGNER_MARKER = "data-hrms-designer";

export type PageOrientation = "portrait" | "landscape";
export type TextAlign = "left" | "center" | "right" | "justify";
export type VerticalAlign = "top" | "middle" | "bottom";
export type ImageFit = "contain" | "cover" | "fill";
export type ShapeKind = "rectangle" | "rounded-rect" | "circle";
export type LineOrientation = "horizontal" | "vertical";
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type ObjectType = "text" | "image" | "table" | "shape" | "line" | "watermark";
export type ObjectBand = "body" | "header" | "footer";

export interface PageBackground {
  color: string;
  image: string | null;
  imageFit: "cover" | "contain";
  imageOpacity: number;
}

export interface PageBand {
  enabled: boolean;
  height: number;
  image: string | null;
  imageFit: ImageFit;
}

export interface ObjectBase {
  id: string;
  type: ObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  band: ObjectBand;
}

export interface TextObject extends ObjectBase {
  type: "text";
  html: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  background: string | null;
  align: TextAlign;
  lineHeight: number;
  letterSpacing: number;
  padding: number;
}

export interface ImageObject extends ObjectBase {
  type: "image";
  src: string;
  fit: ImageFit;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
}

export interface TableCell {
  html: string;
  colspan: number;
  rowspan: number;
  skipped: boolean;
  background: string | null;
  color: string | null;
  align: TextAlign;
  vAlign: VerticalAlign;
  fontSize: number;
  bold: boolean;
  padding: number;
  borderWidth: number | null;
  borderColor: string | null;
}

export interface TableObject extends ObjectBase {
  type: "table";
  rows: number;
  cols: number;
  cells: TableCell[][];
  borderWidth: number;
  borderColor: string;
  borderStyle: StrokeStyle;
  headerRow: boolean;
  headerBold: boolean;
  headerBackground: string | null;
}

export interface ShapeObject extends ObjectBase {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineObject extends ObjectBase {
  type: "line";
  orientation: LineOrientation;
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
}

export interface WatermarkObject extends ObjectBase {
  type: "watermark";
  mode: "text" | "image";
  text: string;
  src: string | null;
  color: string;
  fontSize: number;
}

export type DesignerObject =
  | TextObject
  | ImageObject
  | TableObject
  | ShapeObject
  | LineObject
  | WatermarkObject;

export interface DesignerPage {
  id: string;
  background: PageBackground;
  header: PageBand;
  footer: PageBand;
  objects: DesignerObject[];
  flowHtml: string;
}

export interface DesignerDocument {
  version: number;
  orientation: PageOrientation;
  pages: DesignerPage[];
}

export type RightPanelTab = "fields" | "properties" | "layers" | "page";
export type InteractionMode = "idle" | "dragging" | "resizing" | "rotating";
export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
