import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import {
  DynamicField,
  CreateDynamicFieldPayload,
  UpdateDynamicFieldPayload,
  DynamicFieldFilters,
} from "@/types/dynamicField.types";

/**
 * Build query string from filter object — omits null/undefined/"" values.
 */
const buildQuery = (filters: DynamicFieldFilters): string => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.field_type) params.set("field_type", filters.field_type);
  if (filters.data_source) params.set("data_source", filters.data_source);
  if (filters.document_type_id != null)
    params.set("document_type_id", String(filters.document_type_id));
  if (filters.is_active != null)
    params.set("is_active", String(filters.is_active));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const dynamicFieldService = {
  /**
   * Get all dynamic fields — supports optional server-side filters.
   */
  async getDynamicFields(filters?: DynamicFieldFilters): Promise<DynamicField[]> {
    const qs = filters ? buildQuery(filters) : "";
    const res = await apiClient.get<DynamicField[]>(
      `${API_CONFIG.ENDPOINTS.DYNAMIC_FIELDS}${qs}`
    );
    return res.data || [];
  },

  /**
   * Get dynamic field by ID.
   */
  async getDynamicFieldById(id: number | string): Promise<DynamicField> {
    const res = await apiClient.get<DynamicField>(
      API_CONFIG.ENDPOINTS.DYNAMIC_FIELD_BY_ID(id)
    );
    return res.data;
  },

  /**
   * Get dynamic fields by Document Type ID.
   */
  async getFieldsByDocumentTypeId(
    documentTypeId: number | string
  ): Promise<DynamicField[]> {
    const res = await apiClient.get<DynamicField[]>(
      API_CONFIG.ENDPOINTS.DYNAMIC_FIELDS_BY_DOC_TYPE(documentTypeId)
    );
    return res.data || [];
  },

  /**
   * Create a new dynamic field.
   */
  async createDynamicField(
    payload: CreateDynamicFieldPayload
  ): Promise<DynamicField> {
    const res = await apiClient.post<DynamicField>(
      API_CONFIG.ENDPOINTS.DYNAMIC_FIELDS,
      payload
    );
    return res.data;
  },

  /**
   * Update dynamic field by ID.
   */
  async updateDynamicField(
    id: number | string,
    payload: UpdateDynamicFieldPayload
  ): Promise<DynamicField> {
    const res = await apiClient.put<DynamicField>(
      API_CONFIG.ENDPOINTS.DYNAMIC_FIELD_BY_ID(id),
      payload
    );
    return res.data;
  },

  /**
   * Soft-delete single dynamic field.
   */
  async deleteDynamicField(
    id: number | string,
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.delete<any>(
      API_CONFIG.ENDPOINTS.DYNAMIC_FIELD_BY_ID(id),
      { deletedRemarks }
    );
    return res.data;
  },

  /**
   * Bulk soft-delete dynamic fields.
   */
  async bulkDeleteDynamicFields(
    ids: number[],
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.post<any>(
      API_CONFIG.ENDPOINTS.DYNAMIC_FIELD_BULK_DELETE,
      { ids, deletedRemarks }
    );
    return res.data;
  },

  // Legacy alias kept for any existing callers
  async getAllDynamicFields(): Promise<DynamicField[]> {
    return this.getDynamicFields();
  },
};
