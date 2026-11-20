import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import { ExternalEmployee, EmployeeFieldMappingResponse } from "@/types/externalHrms.types";

export const externalHrmsService = {
  /**
   * Get all employees from live External HRMS
   */
  async getEmployees(filters: { search?: string; department?: string; status?: string } = {}): Promise<ExternalEmployee[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.department) params.append("department", filters.department);
    if (filters.status !== undefined && filters.status !== "") params.append("status", String(filters.status));

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<any>(`${API_CONFIG.ENDPOINTS.EXTERNAL_HRMS_EMPLOYEES}${qs}`);

    if (Array.isArray(res.data)) return res.data;
    if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  },

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: number | string): Promise<ExternalEmployee | null> {
    const res = await apiClient.get<any>(API_CONFIG.ENDPOINTS.EXTERNAL_HRMS_EMPLOYEE_BY_ID(id));
    return res.data || null;
  },

  /**
   * Get field mapping for auto-fill in document generation
   */
  async getFieldMapping(id: number | string): Promise<EmployeeFieldMappingResponse | null> {
    const res = await apiClient.get<any>(API_CONFIG.ENDPOINTS.EXTERNAL_HRMS_FIELD_MAPPING(id));
    return res.data || null;
  },
};
