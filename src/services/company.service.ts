import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import {
  Company,
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyStatus,
  ApiResponse,
} from "@/types/company.types";

export const companyService = {
  /**
   * Get all active companies from backend
   */
  async getAllCompanies(): Promise<Company[]> {
    const res = await apiClient.get<Company[]>(API_CONFIG.ENDPOINTS.COMPANIES);
    return res.data || [];
  },

  /**
   * Get single company details by ID
   */
  async getCompanyById(id: number | string): Promise<Company> {
    const res = await apiClient.get<Company>(
      API_CONFIG.ENDPOINTS.COMPANY_BY_ID(id)
    );
    return res.data;
  },

  /**
   * Create a new company record
   */
  async createCompany(payload: CreateCompanyDto): Promise<Company> {
    const res = await apiClient.post<Company>(
      API_CONFIG.ENDPOINTS.COMPANIES,
      payload
    );
    return res.data;
  },

  /**
   * Update existing company by ID
   */
  async updateCompany(
    id: number | string,
    payload: UpdateCompanyDto
  ): Promise<Company> {
    const res = await apiClient.put<Company>(
      API_CONFIG.ENDPOINTS.COMPANY_BY_ID(id),
      payload
    );
    return res.data;
  },

  /**
   * Update company status (active | inactive | pending | suspended)
   */
  async updateCompanyStatus(
    id: number | string,
    status: CompanyStatus,
    remark?: string
  ): Promise<Company> {
    const res = await apiClient.patch<Company>(
      API_CONFIG.ENDPOINTS.COMPANY_STATUS(id),
      { status, remark }
    );
    return res.data;
  },

  /**
   * Soft-delete a single company by ID
   */
  async deleteCompany(
    id: number | string,
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.delete<any>(
      API_CONFIG.ENDPOINTS.COMPANY_BY_ID(id),
      { deletedRemarks }
    );
    return res.data;
  },

  /**
   * Bulk soft-delete multiple companies
   */
  async bulkDeleteCompanies(
    ids: number[],
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.post<any>(
      API_CONFIG.ENDPOINTS.COMPANY_BULK_DELETE,
      { ids, deletedRemarks }
    );
    return res.data;
  },
};
