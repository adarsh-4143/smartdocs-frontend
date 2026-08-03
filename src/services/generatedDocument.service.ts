import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import {
  GeneratedDocument,
  GenerateDocumentPayload,
  GeneratedDocumentFilters,
  ResolveDataPayload,
  ResolveDataResponse,
} from "@/types/generatedDocument.types";

/**
 * Build query string for filter params — omits null/undefined/"" values.
 */
const buildQuery = (filters: GeneratedDocumentFilters): string => {
  const params = new URLSearchParams();
  if (filters.templateId != null) params.set("templateId", String(filters.templateId));
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const generatedDocumentService = {
  /**
   * Generate a new document PDF.
   * POST /api/v1/generated-documents
   */
  async generateDocument(payload: GenerateDocumentPayload): Promise<GeneratedDocument> {
    const res = await apiClient.post<GeneratedDocument>(
      API_CONFIG.ENDPOINTS.GENERATED_DOCUMENTS,
      payload
    );
    return res.data;
  },

  /**
   * Get all generated documents with optional filters.
   * GET /api/v1/generated-documents
   */
  async getDocuments(filters?: GeneratedDocumentFilters): Promise<GeneratedDocument[]> {
    const qs = filters ? buildQuery(filters) : "";
    const res = await apiClient.get<GeneratedDocument[]>(
      `${API_CONFIG.ENDPOINTS.GENERATED_DOCUMENTS}${qs}`
    );
    return res.data || [];
  },

  /**
   * Get a single generated document by ID.
   * GET /api/v1/generated-documents/:id
   */
  async getDocumentById(id: number | string): Promise<GeneratedDocument> {
    const res = await apiClient.get<GeneratedDocument>(
      API_CONFIG.ENDPOINTS.GENERATED_DOCUMENT_BY_ID(id)
    );
    return res.data;
  },

  /**
   * Soft-delete a generated document record.
   * DELETE /api/v1/generated-documents/:id
   */
  async deleteDocument(id: number | string, deletedRemarks?: string): Promise<any> {
    const res = await apiClient.delete<any>(
      API_CONFIG.ENDPOINTS.GENERATED_DOCUMENT_BY_ID(id),
      { deletedRemarks }
    );
    return res.data;
  },

  /**
   * Re-render PDF using stored generatedData.
   * POST /api/v1/generated-documents/:id/regenerate
   */
  async regenerateDocument(id: number | string): Promise<GeneratedDocument> {
    const res = await apiClient.post<GeneratedDocument>(
      API_CONFIG.ENDPOINTS.GENERATED_DOCUMENT_REGENERATE(id),
      {}
    );
    return res.data;
  },

  /**
   * Returns the direct URL for inline PDF preview (<iframe src={...}>).
   * GET /api/v1/generated-documents/:id/preview
   */
  getPreviewUrl(id: number | string): string {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATED_DOCUMENT_PREVIEW(id)}`;
  },

  /**
   * Triggers a native browser download of the generated PDF.
   * GET /api/v1/generated-documents/:id/download
   */
  async triggerDownload(id: number | string, fileName: string): Promise<void> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATED_DOCUMENT_DOWNLOAD(id)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to download the generated document.");
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName || "document.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  },

  /**
   * Phase 5E — Resolve all dynamic field values from backend sources.
   * POST /api/v1/generated-documents/resolve-data
   *
   * Special handling:
   * - HTTP 200 → success, returns ResolveDataResponse
   * - HTTP 400 with missingFields → returns the partial response so the UI can
   *   highlight missing fields rather than throwing a generic error.
   */
  async resolveDocumentData(payload: ResolveDataPayload): Promise<ResolveDataResponse> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATED_DOCUMENT_RESOLVE_DATA}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => null);

    // Backend returns 400 when required fields are missing; we want to surface
    // missingFields to the UI, not throw a generic error.
    if (response.status === 400 && json?.data?.missingFields) {
      // Return as a "partial" response — fields + missingFields populated.
      return {
        templateId: payload.templateId,
        fields: json.data.fields || [],
        resolvedData: json.data.resolvedData || {},
        missingFields: json.data.missingFields,
      } as ResolveDataResponse;
    }

    if (!response.ok) {
      const msg =
        json?.message ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(msg);
    }

    return json.data as ResolveDataResponse;
  },
};
