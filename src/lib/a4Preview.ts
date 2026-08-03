/**
 * Shared A4 rendering utilities — extracted from the Template Builder.
 * Used by both the Template Builder preview and the Document Generation preview.
 */

/**
 * Converts a relative image path from the API into an absolute URL.
 * Handles paths that are already absolute (http/https).
 */
export function getImageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
  const origin = new URL(baseUrl).origin;
  return `${origin}${path}`;
}

/**
 * Splits an HTML string into A4 page chunks based on element height cost estimates
 * and explicit [data-page-break="true"] markers.
 *
 * Returns an array of HTML strings — one per page.
 */
export function getPaginatedPages(html: string): string[] {
  if (!html || html.trim() === "" || html === "<p></p>") {
    return ["<p></p>"];
  }

  if (typeof window === "undefined") {
    return [html];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const children = Array.from(doc.body.children);

    if (children.length === 0) {
      return [html];
    }

    const pages: string[] = [];
    let currentPageHtml = "";
    let currentHeightUnits = 0;
    const MAX_PAGE_UNITS = 18; // Standard A4 body height capacity

    children.forEach((child) => {
      const textLen = child.textContent?.length || 0;
      const tagName = child.tagName.toLowerCase();
      const isExplicitPageBreak =
        child.getAttribute("data-page-break") === "true" ||
        child.classList.contains("page-break");

      if (isExplicitPageBreak) {
        if (currentPageHtml.trim() !== "") {
          pages.push(currentPageHtml);
        }
        currentPageHtml = "";
        currentHeightUnits = 0;
        return;
      }

      let unitCost = 1;
      if (tagName.startsWith("h1")) unitCost = 3;
      else if (tagName.startsWith("h2")) unitCost = 2.5;
      else if (tagName.startsWith("h3")) unitCost = 2;
      else if (tagName === "ul" || tagName === "ol")
        unitCost = Math.max(1.5, child.children.length * 1.2);
      else if (tagName === "table")
        unitCost = Math.max(4, child.querySelectorAll("tr").length * 1.5);
      else unitCost = Math.max(1, Math.ceil(textLen / 120));

      if (
        currentHeightUnits + unitCost > MAX_PAGE_UNITS &&
        currentPageHtml.trim() !== ""
      ) {
        pages.push(currentPageHtml);
        currentPageHtml = child.outerHTML;
        currentHeightUnits = unitCost;
      } else {
        currentPageHtml += child.outerHTML;
        currentHeightUnits += unitCost;
      }
    });

    if (currentPageHtml.trim() !== "") {
      pages.push(currentPageHtml);
    }

    return pages.length > 0 ? pages : [html];
  } catch {
    return [html];
  }
}

/**
 * Replaces {{field_key}} placeholders in HTML content with provided values.
 * Safe — does not use eval; does not destroy surrounding HTML structure.
 * Unknown placeholders (keys not in data) are left unchanged.
 */
export function replacePlaceholders(
  html: string,
  data: Record<string, string>
): string {
  if (!html) return "";
  return html.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined && value !== null && value !== ""
      ? String(value)
      : match; // leave the placeholder visible if no value entered yet
  });
}

/**
 * Extracts all unique {{field_key}} placeholder keys from an HTML string.
 */
export function extractPlaceholderKeys(html: string): string[] {
  if (!html) return [];
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  const keys = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}
