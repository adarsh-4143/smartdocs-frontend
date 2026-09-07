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
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
  try {
    const origin = new URL(baseUrl).origin;
    return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
  } catch {
    return path;
  }
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
    const MAX_PAGE_UNITS = 22; // Precise A4 body height capacity for automatic Page 2 creation

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
      if (tagName.startsWith("h1")) unitCost = 2.5;
      else if (tagName.startsWith("h2")) unitCost = 2;
      else if (tagName.startsWith("h3")) unitCost = 1.5;
      else if (tagName === "ul" || tagName === "ol")
        unitCost = Math.max(1, child.children.length * 0.8);
      else if (tagName === "table")
        unitCost = Math.max(2, child.querySelectorAll("tr").length * 1.1);
      else unitCost = Math.max(1, Math.ceil(textLen / 160));

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

/**
 * Direct browser print and PDF download utility for documents.
 * Opens an A4 print preview window allowing user to save as PDF or print.
 */
export function downloadHtmlDocument(
  docName: string,
  htmlContent: string,
  headerSrc?: string | null,
  footerSrc?: string | null
) {
  const printWindow = window.open("", "_blank");
  const titleStr = docName || "Generated Document";

  if (!printWindow) {
    // Blob fallback download if popups blocked
    const blob = new Blob([
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titleStr}</title><style>body{font-family:sans-serif;padding:20px;}</style></head><body>${headerSrc ? `<img src="${headerSrc}" style="width:100%;max-height:160px;object-fit:cover;" />` : ''}${htmlContent}${footerSrc ? `<img src="${footerSrc}" style="width:100%;max-height:160px;object-fit:cover;" />` : ''}</body></html>`
    ], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titleStr.replace(/[^a-zA-Z0-9_\-]/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const fullDocHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleStr}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .page-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      box-sizing: border-box;
      position: relative;
    }
    .header-img {
      width: 100%;
      max-height: 160px;
      object-fit: cover;
      display: block;
    }
    .footer-img {
      width: 100%;
      max-height: 160px;
      object-fit: cover;
      display: block;
    }
    .content-body {
      padding: 20mm 15mm;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${headerSrc ? `<img src="${headerSrc}" class="header-img" />` : ""}
    <div class="content-body">
      ${htmlContent}
    </div>
    ${footerSrc ? `<img src="${footerSrc}" class="footer-img" />` : ""}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullDocHtml);
  printWindow.document.close();
}
