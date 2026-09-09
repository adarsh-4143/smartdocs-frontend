import { isBlankHtml } from "./cleanHtml";

const PAGE_BREAK_MARKER = 'data-page-break="true"';

export function insertPageBreakHtml(): string {
  return `<p class="page-break" ${PAGE_BREAK_MARKER} style="page-break-after:always;break-after:page;">&nbsp;</p>`;
}

function unitCost(el: Element): number {
  const textLen = el.textContent?.length || 0;
  const tagName = el.tagName.toLowerCase();
  if (tagName.startsWith("h1")) return 2.6;
  if (tagName.startsWith("h2")) return 2.1;
  if (tagName.startsWith("h3")) return 1.6;
  if (tagName === "ul" || tagName === "ol") return Math.max(1, el.children.length * 0.85);
  if (tagName === "table") return Math.max(2, el.querySelectorAll("tr").length * 1.15);
  return Math.max(1, Math.ceil(textLen / 150));
}

function isBreak(el: Element): boolean {
  return el.getAttribute("data-page-break") === "true" || el.classList.contains("page-break");
}

/**
 * Splits flowing HTML into page-sized chunks using explicit page breaks
 * and estimated block height. Used to auto-continue long body content.
 */
export function splitFlowHtml(html: string, maxUnits = 20): string[] {
  if (isBlankHtml(html) || typeof window === "undefined") {
    return isBlankHtml(html) ? [""] : [html];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const children = Array.from(doc.body.children);
    if (children.length === 0) return [html];

    const pages: string[] = [];
    let current = "";
    let units = 0;

    children.forEach((child) => {
      if (isBreak(child)) {
        pages.push(current);
        current = "";
        units = 0;
        return;
      }
      const cost = unitCost(child);
      if (units + cost > maxUnits && current.trim()) {
        pages.push(current);
        current = child.outerHTML;
        units = cost;
      } else {
        current += child.outerHTML;
        units += cost;
      }
    });

    if (current.trim()) pages.push(current);
    return pages.length ? pages : [html];
  } catch {
    return [html];
  }
}
