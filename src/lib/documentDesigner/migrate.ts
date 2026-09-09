import type { DesignerDocument } from "@/types/documentDesigner.types";
import { createBlankDocument, createTextObject, defaultBand } from "./model";
import { isDesignerHtml, parseDesignerJson } from "./serialize";
import { cleanHtmlContent, isBlankHtml } from "./cleanHtml";

function stripMovableBlockMarkup(html: string): { html: string; blocks: Array<{ text: string; x: number; y: number; width: number }> } {
  const blocks: Array<{ text: string; x: number; y: number; width: number }> = [];
  if (typeof window === "undefined") return { html, blocks };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll(".pdf-line").forEach((el) => {
      const style = (el as HTMLElement).style;
      blocks.push({
        text: el.textContent || "",
        x: parseFloat(style.left) || 40,
        y: parseFloat(style.top) || 40,
        width: parseFloat(style.width) || 220,
      });
      el.remove();
    });
    return { html: doc.body.innerHTML, blocks };
  } catch {
    return { html, blocks };
  }
}

/**
 * Loads saved template HTML into the designer model.
 * New designer documents round-trip via the embedded JSON.
 * Legacy Tiptap HTML is wrapped as flow content so existing templates remain editable.
 */
export function htmlToDocument(
  html: string | null | undefined,
  extras?: { headerImage?: string | null; footerImage?: string | null }
): DesignerDocument {
  const raw = html || "";

  if (isDesignerHtml(raw)) {
    const parsed = parseDesignerJson(raw);
    if (parsed && parsed.pages?.length) {
      return parsed;
    }
  }

  const cleaned = cleanHtmlContent(raw);
  const { html: bodyHtml, blocks } = stripMovableBlockMarkup(cleaned);
  const doc = createBlankDocument();
  const page = doc.pages[0];

  if (!isBlankHtml(bodyHtml)) {
    page.flowHtml = bodyHtml;
  }

  let z = 1;
  if (extras?.headerImage) {
    page.header = { ...defaultBand(true, 88), image: extras.headerImage, imageFit: "cover" };
  }

  blocks.forEach((block) => {
    const text = createTextObject(block.x, block.y, z, `<p>${block.text}</p>`);
    text.width = block.width;
    page.objects.push(text);
    z += 1;
  });

  if (extras?.footerImage) {
    page.footer = { ...defaultBand(true, 64), image: extras.footerImage, imageFit: "cover" };
  }

  return doc;
}
