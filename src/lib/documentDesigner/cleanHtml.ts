/**
 * Fixes pasted base64/JSON image blobs so they become real <img> tags.
 * Preserved from the original Template Builder.
 */
export function cleanHtmlContent(html: string): string {
  if (!html || typeof window === "undefined") return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    let modified = false;

    const allElements = doc.body.querySelectorAll("*");
    allElements.forEach((el) => {
      if (el.children.length === 0 && el.textContent) {
        const text = el.textContent.trim();
        if (text.includes("data:image/") || (text.includes('"src"') && text.includes("base64"))) {
          const srcMatch =
            text.match(/"src"\s*:\s*"([^"]+)"/) ||
            text.match(/(data:image\/[a-zA-Z0-9+/=;,-]+)/);
          if (srcMatch && srcMatch[1]) {
            const alignMatch = text.match(/"align"\s*:\s*"([^"]+)"/);
            const align = alignMatch ? alignMatch[1] : "left";
            const img = doc.createElement("img");
            img.src = srcMatch[1];
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            img.style.display = "block";
            if (align === "center") img.style.margin = "0 auto";
            else if (align === "right") img.style.margin = "0 0 0 auto";
            el.innerHTML = "";
            el.appendChild(img);
            modified = true;
          }
        }
      }
    });

    return modified ? doc.body.innerHTML : html;
  } catch {
    return html;
  }
}

export function isBlankHtml(html?: string | null): boolean {
  if (!html) return true;
  const trimmed = html.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return (
    trimmed === "" ||
    trimmed === "<p></p>" ||
    trimmed === "<p><br></p>" ||
    trimmed === "<p><br/></p>" ||
    trimmed === "Loading document content..." ||
    trimmed === "<p>Loading document content...</p>"
  );
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Collapse contentEditable artifacts like `Hello<p>Hello</p>` down to one copy. */
export function normalizeEditableHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;
    const nodes = Array.from(body.childNodes);
    const textNodes = nodes.filter((n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim());
    const elementNodes = nodes.filter((n) => n.nodeType === Node.ELEMENT_NODE) as Element[];
    if (textNodes.length && elementNodes.length) {
      const loose = textNodes.map((n) => (n.textContent || "").replace(/\s+/g, " ").trim()).join("");
      const nested = elementNodes.map((n) => (n.textContent || "").replace(/\s+/g, " ").trim()).join("");
      if (loose && nested && (loose === nested || nested.startsWith(loose) || loose.startsWith(nested))) {
        textNodes.forEach((n) => n.parentNode?.removeChild(n));
      }
    }
    elementNodes.forEach((el) => {
      if (el.tagName === "P" && elementNodes.length === 1) {
        const inner = el.innerHTML.replace(/<br\s*\/?>/gi, "").trim();
        const text = (el.textContent || "").trim();
        if (inner === text && text && el.childNodes.length > 1) {
          const copies = Array.from(el.childNodes).filter((n) => (n.textContent || "").trim() === text);
          if (copies.length > 1) copies.slice(1).forEach((n) => n.parentNode?.removeChild(n));
        }
      }
    });
    const out = body.innerHTML.replace(/&nbsp;/g, " ").trim();
    return isBlankHtml(out) ? "" : out;
  } catch {
    return html;
  }
}
