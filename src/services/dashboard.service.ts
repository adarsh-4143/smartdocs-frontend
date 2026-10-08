import { apiClient } from "./apiClient";

export interface DashboardStatsData {
  kpi: {
    totalCompanies: number;
    activeCompanies: number;
    totalProfiles: number;
    activeProfiles: number;
    totalGeneratedDocs: number;
    completedDocs: number;
    pendingDocs: number;
    failedDocs: number;
    totalTemplates: number;
    totalDocumentTypes: number;
  };
  companiesList: string[];
  recentActivity: Array<{
    id: number;
    documentName: string;
    companyName: string;
    profileName: string;
    templateName: string;
    status: string;
    createdAt: string;
  }>;
  monthlyStats: Array<{
    month: string;
    count: number;
  }>;
  documentTypeDistribution: Array<{
    name: string;
    count: number;
  }>;
  templateUsage: Array<{
    name: string;
    count: number;
  }>;
  statusDistribution: {
    completed: number;
    pending: number;
    failed: number;
  };
}

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStatsData> {
    const res = await apiClient.get<any>("/dashboard/stats");
    const payload = res?.data?.kpi ? res.data : (res as any)?.kpi ? res : res?.data;
    return payload as DashboardStatsData;
  },
};
