import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import { TemplateDocument } from "@/types/templateDocument.types";

export const templateDocumentService = {
  /**
   * Upload an existing document (PDF/DOCX/DOC) (POST /api/v1/template-documents/upload)
   */
  async uploadDocument(
    templateId: number,
    file: File
  ): Promise<TemplateDocument> {
    const formData = new FormData();
    formData.append("template_id", String(templateId));
    formData.append("file", file);

    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}${API_CONFIG.ENDPOINTS.TEMPLATE_DOCUMENTS_UPLOAD}`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = "Document upload failed";
      try {
        const json = JSON.parse(errText);
        msg = json.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const resJson = await response.json();
    return resJson.data;
  },

  /**
   * Get documents for a Template Master (GET /api/v1/template-documents/template/:templateId)
   */
  async getDocumentsByTemplateId(
    templateId: number | string
  ): Promise<TemplateDocument[]> {
    const res = await apiClient.get<TemplateDocument[]>(
      API_CONFIG.ENDPOINTS.TEMPLATE_DOCUMENTS_BY_TEMPLATE_ID(templateId)
    );
    return res.data || [];
  },

  /**
   * Get dynamic field by ID (GET /api/v1/template-documents/:id)
   */
  async getDocumentById(id: number | string): Promise<TemplateDocument> {
    const res = await apiClient.get<TemplateDocument>(
      API_CONFIG.ENDPOINTS.TEMPLATE_DOCUMENT_BY_ID(id)
    );
    return res.data;
  },

  /**
   * Trigger / retry manual document conversion (POST /api/v1/template-documents/:id/convert)
   */
  async convertDocument(id: number | string): Promise<TemplateDocument> {
    const res = await apiClient.post<TemplateDocument>(
      API_CONFIG.ENDPOINTS.TEMPLATE_DOCUMENT_CONVERT(id),
      {}
    );
    return res.data;
  },

  /**
   * Soft delete template document (DELETE /api/v1/template-documents/:id)
   */
  async deleteDocument(
    id: number | string,
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.delete<any>(
      API_CONFIG.ENDPOINTS.TEMPLATE_DOCUMENT_BY_ID(id),
      { deletedRemarks }
    );
    return res.data;
  },

  /**
   * Get direct absolute url for original document download/view
   */
  getOriginalUrl(id: number | string): string {
    const baseUrl = API_CONFIG.BASE_URL;
    return `${baseUrl}${API_CONFIG.ENDPOINTS.TEMPLATE_DOCUMENT_ORIGINAL(id)}`;
  },
};
