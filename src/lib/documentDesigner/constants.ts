import type { PageOrientation } from "@/types/documentDesigner.types";

export const PX_PER_MM = 96 / 25.4;

export const A4 = {
  portrait: { widthMm: 210, heightMm: 297, widthPx: 794, heightPx: 1123 },
  landscape: { widthMm: 297, heightMm: 210, widthPx: 1123, heightPx: 794 },
} as const;

export const ZOOM_PRESETS = [50, 75, 100, 125, 150] as const;

export type FontGroup = "sans" | "serif" | "mono" | "display" | "indic";

export interface DesignerFont {
  label: string;
  name: string;
  value: string;
  group: FontGroup;
  google?: boolean;
}

export const FONT_FAMILIES: DesignerFont[] = [
  { label: "Arial", name: "Arial", value: "Arial, Helvetica, sans-serif", group: "sans" },
  { label: "Calibri", name: "Calibri", value: "Calibri, 'Segoe UI', sans-serif", group: "sans" },
  { label: "Geist", name: "Geist", value: "var(--font-geist-sans), Geist, sans-serif", group: "sans" },
  { label: "Inter", name: "Inter", value: "Inter, system-ui, sans-serif", group: "sans", google: true },
  { label: "Roboto", name: "Roboto", value: "Roboto, sans-serif", group: "sans", google: true },
  { label: "Open Sans", name: "Open Sans", value: "'Open Sans', sans-serif", group: "sans", google: true },
  { label: "Lato", name: "Lato", value: "Lato, sans-serif", group: "sans", google: true },
  { label: "Poppins", name: "Poppins", value: "Poppins, sans-serif", group: "sans", google: true },
  { label: "Montserrat", name: "Montserrat", value: "Montserrat, sans-serif", group: "sans", google: true },
  { label: "Nunito", name: "Nunito", value: "Nunito, sans-serif", group: "sans", google: true },
  { label: "Source Sans 3", name: "Source Sans 3", value: "'Source Sans 3', sans-serif", group: "sans", google: true },
  { label: "Noto Sans", name: "Noto Sans", value: "'Noto Sans', sans-serif", group: "sans", google: true },
  { label: "Segoe UI", name: "Segoe UI", value: "'Segoe UI', Tahoma, sans-serif", group: "sans" },
  { label: "Tahoma", name: "Tahoma", value: "Tahoma, Geneva, sans-serif", group: "sans" },
  { label: "Trebuchet MS", name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif", group: "sans" },
  { label: "Verdana", name: "Verdana", value: "Verdana, Geneva, sans-serif", group: "sans" },
  { label: "Helvetica", name: "Helvetica", value: "Helvetica, Arial, sans-serif", group: "sans" },
  { label: "Comic Sans MS", name: "Comic Sans MS", value: "'Comic Sans MS', cursive, sans-serif", group: "sans" },

  { label: "Times New Roman", name: "Times New Roman", value: "'Times New Roman', Times, serif", group: "serif" },
  { label: "Georgia", name: "Georgia", value: "Georgia, serif", group: "serif" },
  { label: "Garamond", name: "Garamond", value: "Garamond, 'Times New Roman', serif", group: "serif" },
  { label: "Palatino", name: "Palatino Linotype", value: "'Palatino Linotype', Palatino, serif", group: "serif" },
  { label: "Cambria", name: "Cambria", value: "Cambria, Georgia, serif", group: "serif" },
  { label: "Book Antiqua", name: "Book Antiqua", value: "'Book Antiqua', Palatino, serif", group: "serif" },
  { label: "Noto Serif", name: "Noto Serif", value: "'Noto Serif', serif", group: "serif", google: true },
  { label: "Merriweather", name: "Merriweather", value: "Merriweather, serif", group: "serif", google: true },

  { label: "Playfair Display", name: "Playfair Display", value: "'Playfair Display', serif", group: "display", google: true },
  { label: "Impact", name: "Impact", value: "Impact, Haettenschweiler, sans-serif", group: "display" },

  { label: "Courier New", name: "Courier New", value: "'Courier New', Courier, monospace", group: "mono" },
  { label: "Geist Mono", name: "Geist Mono", value: "var(--font-geist-mono), 'Geist Mono', monospace", group: "mono" },
  { label: "Consolas", name: "Consolas", value: "Consolas, 'Courier New', monospace", group: "mono" },
  { label: "Roboto Mono", name: "Roboto Mono", value: "'Roboto Mono', monospace", group: "mono", google: true },

  { label: "Noto Sans Devanagari", name: "Noto Sans Devanagari", value: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif", group: "indic", google: true },
  { label: "Noto Serif Devanagari", name: "Noto Serif Devanagari", value: "'Noto Serif Devanagari', serif", group: "indic", google: true },
  { label: "Nirmala UI", name: "Nirmala UI", value: "'Nirmala UI', 'Segoe UI', sans-serif", group: "indic" },
  { label: "Mangal", name: "Mangal", value: "Mangal, 'Nirmala UI', sans-serif", group: "indic" },
  { label: "Kokila", name: "Kokila", value: "Kokila, 'Nirmala UI', serif", group: "indic" },
];

export const FONT_GROUP_LABELS: Record<FontGroup, string> = {
  sans: "Sans serif",
  serif: "Serif",
  mono: "Monospace",
  display: "Display",
  indic: "Hindi / Indian",
};

export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;1,400&family=Lato:ital,wght@0,400;0,700;1,400&family=Merriweather:wght@400;700&family=Montserrat:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;700&family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:ital,wght@0,400;0,600;0,700;1,400&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Roboto+Mono:wght@400;700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Sans:ital,wght@0,400;0,700;1,400&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Serif+Devanagari:wght@400;700&display=swap";

export function matchFontFamily(value?: string | null): DesignerFont {
  if (!value) return FONT_FAMILIES[0];
  const exact = FONT_FAMILIES.find((font) => font.value === value || font.name === value);
  if (exact) return exact;
  const lower = value.toLowerCase();
  return (
    FONT_FAMILIES.find((font) => lower.includes(font.name.toLowerCase()) || lower.includes(font.label.toLowerCase())) ||
    FONT_FAMILIES[0]
  );
}

export function ensureDesignerFontsLoaded() {
  if (typeof document === "undefined") return;
  const id = "hrms-designer-google-fonts";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
}

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72];

export const PRESET_COLORS = [
  "#000000",
  "#0f172a",
  "#334155",
  "#64748b",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f1f5f9",
  "#dbeafe",
  "#fef3c7",
  "#dcfce7",
  "#fee2e2",
];

export const SNAP_THRESHOLD = 6;
export const HISTORY_LIMIT = 60;
export const AUTOSAVE_MS = 2500;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export function pageSize(orientation: PageOrientation) {
  return A4[orientation];
}

function roundMm(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Map canvas px onto exact A4 mm so a full page is 210×297, not ~210.08×297.09. */
export function pxToMm(
  px: number,
  axis: "x" | "y" = "x",
  orientation: PageOrientation = "portrait"
): number {
  const size = A4[orientation];
  const ratio = axis === "y" ? size.heightMm / size.heightPx : size.widthMm / size.widthPx;
  return roundMm(px * ratio);
}

export function mmToPx(
  mm: number,
  axis: "x" | "y" = "x",
  orientation: PageOrientation = "portrait"
): number {
  const size = A4[orientation];
  const ratio = axis === "y" ? size.heightPx / size.heightMm : size.widthPx / size.widthMm;
  return Math.round(mm * ratio);
}

export function createId(prefix = "obj"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
