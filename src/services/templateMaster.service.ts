import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import {
  TemplateMaster,
  CreateTemplateMasterDto,
  UpdateTemplateMasterDto,
  TemplateMasterStatus,
} from "@/types/templateMaster.types";

export const templateMasterService = {
  /**
   * Get all active template master records from backend
   */
  async getAllTemplates(): Promise<TemplateMaster[]> {
    const res = await apiClient.get<TemplateMaster[]>(
      API_CONFIG.ENDPOINTS.TEMPLATE_MASTERS
    );
    return res.data || [];
  },

  /**
   * Get template master by ID
   */
  async getTemplateById(id: number | string): Promise<TemplateMaster> {
    const res = await apiClient.get<TemplateMaster>(
      API_CONFIG.ENDPOINTS.TEMPLATE_MASTER_BY_ID(id)
    );
    return res.data;
  },

  /**
   * Create a new template master definition
   */
  async createTemplate(
    payload: CreateTemplateMasterDto
  ): Promise<TemplateMaster> {
    const res = await apiClient.post<TemplateMaster>(
      API_CONFIG.ENDPOINTS.TEMPLATE_MASTERS,
      payload
    );
    return res.data;
  },

  /**
   * Update template master by ID
   */
  async updateTemplate(
    id: number | string,
    payload: UpdateTemplateMasterDto
  ): Promise<TemplateMaster> {
    const res = await apiClient.put<TemplateMaster>(
      API_CONFIG.ENDPOINTS.TEMPLATE_MASTER_BY_ID(id),
      payload
    );
    return res.data;
  },

  /**
   * Update template master status
   */
  async updateTemplateStatus(
    id: number | string,
    status: TemplateMasterStatus,
    remark?: string
  ): Promise<TemplateMaster> {
    const res = await apiClient.patch<TemplateMaster>(
      API_CONFIG.ENDPOINTS.TEMPLATE_MASTER_STATUS(id),
      { status, remark }
    );
    return res.data;
  },

  /**
   * Soft-delete single template master
   */
  async deleteTemplate(
    id: number | string,
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.delete<any>(
      API_CONFIG.ENDPOINTS.TEMPLATE_MASTER_BY_ID(id),
      { deletedRemarks }
    );
    return res.data;
  },

  /**
   * Bulk soft-delete template masters
   */
  async bulkDeleteTemplates(
    ids: number[],
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.post<any>(
      API_CONFIG.ENDPOINTS.TEMPLATE_MASTER_BULK_DELETE,
      { ids, deletedRemarks }
    );
    return res.data;
  },
};
