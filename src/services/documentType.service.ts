import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import {
  DocumentType,
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
  DocumentTypeStatus,
} from "@/types/documentType.types";

export const documentTypeService = {
  /**
   * Get all active document types from backend
   */
  async getAllDocumentTypes(): Promise<DocumentType[]> {
    const res = await apiClient.get<DocumentType[]>(
      API_CONFIG.ENDPOINTS.DOCUMENT_TYPES
    );
    return res.data || [];
  },

  /**
   * Get document type by ID
   */
  async getDocumentTypeById(id: number | string): Promise<DocumentType> {
    const res = await apiClient.get<DocumentType>(
      API_CONFIG.ENDPOINTS.DOCUMENT_TYPE_BY_ID(id)
    );
    return res.data;
  },

  /**
   * Create a new document type
   */
  async createDocumentType(
    payload: CreateDocumentTypeDto
  ): Promise<DocumentType> {
    const res = await apiClient.post<DocumentType>(
      API_CONFIG.ENDPOINTS.DOCUMENT_TYPES,
      payload
    );
    return res.data;
  },

  /**
   * Update document type by ID
   */
  async updateDocumentType(
    id: number | string,
    payload: UpdateDocumentTypeDto
  ): Promise<DocumentType> {
    const res = await apiClient.put<DocumentType>(
      API_CONFIG.ENDPOINTS.DOCUMENT_TYPE_BY_ID(id),
      payload
    );
    return res.data;
  },

  /**
   * Update document type status
   */
  async updateDocumentTypeStatus(
    id: number | string,
    status: DocumentTypeStatus,
    remark?: string
  ): Promise<DocumentType> {
    const res = await apiClient.patch<DocumentType>(
      API_CONFIG.ENDPOINTS.DOCUMENT_TYPE_STATUS(id),
      { status, remark }
    );
    return res.data;
  },

  /**
   * Soft-delete single document type
   */
  async deleteDocumentType(
    id: number | string,
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.delete<any>(
      API_CONFIG.ENDPOINTS.DOCUMENT_TYPE_BY_ID(id),
      { deletedRemarks }
    );
    return res.data;
  },

  /**
   * Bulk soft-delete document types
   */
  async bulkDeleteDocumentTypes(
    ids: number[],
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.post<any>(
      API_CONFIG.ENDPOINTS.DOCUMENT_TYPE_BULK_DELETE,
      { ids, deletedRemarks }
    );
    return res.data;
  },
};
