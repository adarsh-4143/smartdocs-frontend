import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";

export interface AdminProfileData {
  id: number;
  username: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface AdminSessionItem {
  id: number;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export const adminService = {
  /**
   * Get current admin profile
   */
  async getProfile(): Promise<AdminProfileData> {
    const res = await apiClient.get<AdminProfileData>(`${API_CONFIG.BASE_URL}/admin/profile`);
    return res.data;
  },

  /**
   * Update admin profile
   */
  async updateProfile(payload: { username?: string; email?: string; fullName?: string; avatarUrl?: string }): Promise<AdminProfileData> {
    const res = await apiClient.put<AdminProfileData>(`${API_CONFIG.BASE_URL}/admin/profile`, payload);
    return res.data;
  },

  /**
   * Change password
   */
  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean }> {
    const res = await apiClient.put<{ success: boolean }>(`${API_CONFIG.BASE_URL}/admin/change-password`, payload);
    return res.data;
  },

  /**
   * Get active logged in device sessions
   */
  async getSessions(): Promise<AdminSessionItem[]> {
    const res = await apiClient.get<AdminSessionItem[]>(`${API_CONFIG.BASE_URL}/admin/sessions`);
    return res.data || [];
  },

  /**
   * Revoke single device session
   */
  async revokeSession(id: number): Promise<void> {
    await apiClient.delete(`${API_CONFIG.BASE_URL}/admin/sessions/${id}`);
  },

  /**
   * Revoke all other device sessions
   */
  async revokeOtherSessions(): Promise<void> {
    await apiClient.post(`${API_CONFIG.BASE_URL}/admin/sessions/revoke-others`, {});
  },
};
