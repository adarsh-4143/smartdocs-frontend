import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import {
  TemplateContentRecord,
  CreateTemplateContentDto,
  UpdateTemplateContentDto,
} from "@/types/templateBuilder.types";

export const templateBuilderService = {
  /**
   * Get template content by template ID (GET /api/v1/template-contents/template/:templateId)
   */
  async getContentByTemplateId(
    templateId: number | string
  ): Promise<TemplateContentRecord | null> {
    const res = await apiClient.get<TemplateContentRecord | null>(
      API_CONFIG.ENDPOINTS.TEMPLATE_CONTENT_BY_TEMPLATE_ID(templateId)
    );
    return res.data;
  },

  /**
   * Create template content record (POST /api/v1/template-contents)
   */
  async createContent(
    payload: CreateTemplateContentDto
  ): Promise<TemplateContentRecord> {
    const res = await apiClient.post<TemplateContentRecord>(
      API_CONFIG.ENDPOINTS.TEMPLATE_CONTENTS,
      payload
    );
    return res.data;
  },

  /**
   * Update template content record by ID (PUT /api/v1/template-contents/:id)
   */
  async updateContent(
    id: number | string,
    payload: UpdateTemplateContentDto
  ): Promise<TemplateContentRecord> {
    const res = await apiClient.put<TemplateContentRecord>(
      API_CONFIG.ENDPOINTS.TEMPLATE_CONTENT_BY_ID(id),
      payload
    );
    return res.data;
  },

  /**
   * Delete template content record (DELETE /api/v1/template-contents/:id)
   */
  async deleteContent(id: number | string): Promise<any> {
    const res = await apiClient.delete<any>(
      API_CONFIG.ENDPOINTS.TEMPLATE_CONTENT_BY_ID(id)
    );
    return res.data;
  },

  /**
   * Upload Header or Footer Image (POST /api/v1/template-contents/:id/upload)
   */
  async uploadImage(
    id: number | string,
    type: "header" | "footer",
    file: File
  ): Promise<TemplateContentRecord> {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);

    const baseUrl = API_CONFIG.BASE_URL;
    const url = `${baseUrl}${API_CONFIG.ENDPOINTS.TEMPLATE_CONTENT_UPLOAD_IMAGE(id)}`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = "Image upload failed";
      try {
        const json = JSON.parse(errText);
        msg = json.message || msg;
      } catch { }
      throw new Error(msg);
    }

    const resJson = await response.json();
    return resJson.data;
  },

  /**
   * Remove Header or Footer Image (DELETE /api/v1/template-contents/:id/image)
   */
  async removeImage(
    id: number | string,
    type: "header" | "footer"
  ): Promise<TemplateContentRecord> {
    const res = await apiClient.delete<TemplateContentRecord>(
      API_CONFIG.ENDPOINTS.TEMPLATE_CONTENT_REMOVE_IMAGE(id),
      { type }
    );
    return res.data;
  },
};
