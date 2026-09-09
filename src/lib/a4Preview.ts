/**
 * Shared A4 rendering utilities — extracted from the Template Builder.
 * Used by both the Template Builder preview and the Document Generation preview.
 */

import { extractDesignerPageHtml, isDesignerHtml, parseDesignerJson, refreshDesignerHtml } from "./documentDesigner/serialize";
import { pageSize } from "./documentDesigner/constants";

export { isDesignerHtml, extractDesignerPageHtml };

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

  if (isDesignerHtml(html)) {
    return extractDesignerPageHtml(html);
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
 * Opens the browser Save-as-PDF dialog with the designed A4 pages.
 * Layout uses exact 210×297 mm so the saved file matches the designer.
 */
export function downloadHtmlDocument(
  docName: string,
  htmlContent: string,
  headerSrc?: string | null,
  footerSrc?: string | null
) {
  const printWindow = window.open("", "_blank");
  const titleStr = docName || "Generated Document";
  const designer = isDesignerHtml(htmlContent);
  const printHtml = designer ? refreshDesignerHtml(htmlContent) : htmlContent;
  const parsed = designer ? parseDesignerJson(printHtml) : null;
  const size = pageSize(parsed?.orientation || "portrait");
  const pageSizeCss =
    parsed?.orientation === "landscape" ? "297mm 210mm" : "210mm 297mm";

  const fallbackBody = designer
    ? printHtml
    : `${headerSrc ? `<img src="${headerSrc}" style="width:100%;max-height:160px;object-fit:cover;" />` : ""}${htmlContent}${
        footerSrc ? `<img src="${footerSrc}" style="width:100%;max-height:160px;object-fit:cover;" />` : ""
      }`;

  if (!printWindow) {
    const blob = new Blob(
      [`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titleStr}</title></head><body>${fallbackBody}</body></html>`],
      { type: "text/html" }
    );
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

  const printReadyScript = `
    <script>
      function waitForAssets() {
        var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        var images = Array.prototype.slice.call(document.images || []).map(function(img) {
          if (img.complete) return Promise.resolve();
          return new Promise(function(resolve) {
            img.onload = resolve;
            img.onerror = resolve;
          });
        });
        return Promise.all([fonts].concat(images));
      }
      function runPrint() {
        waitForAssets().then(function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 250);
        });
      }
      window.onload = runPrint;
      window.onafterprint = function() { window.close(); };
    </script>
  `;

  const fullDocHtml = designer
    ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleStr}</title>
  <style>
    @page { size: ${pageSizeCss}; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${size.widthMm}mm;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hrms-a4-document, .hrms-a4-page { margin: 0 !important; box-shadow: none !important; }
  </style>
</head>
<body>${printHtml}
${printReadyScript}
</body>
</html>`
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleStr}</title>
  <style>
    @page { size: ${pageSizeCss}; margin: 0; }
    @media print {
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
      width: ${size.widthMm}mm;
      min-height: ${size.heightMm}mm;
      margin: 0 auto;
      background: #fff;
      box-sizing: border-box;
      position: relative;
    }
    .header-img, .footer-img {
      width: 100%;
      max-height: 160px;
      object-fit: cover;
      display: block;
    }
    .content-body { padding: 20mm 15mm; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f5f9; }
  </style>
</head>
<body>
  <div class="page-container">
    ${headerSrc ? `<img src="${headerSrc}" class="header-img" />` : ""}
    <div class="content-body">${htmlContent}</div>
    ${footerSrc ? `<img src="${footerSrc}" class="footer-img" />` : ""}
  </div>
${printReadyScript}
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullDocHtml);
  printWindow.document.close();
}
