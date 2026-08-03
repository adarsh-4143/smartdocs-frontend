import { apiClient } from "./apiClient";
import { API_CONFIG } from "@/config/api.config";
import {
  Profile,
  CreateProfileDto,
  UpdateProfileDto,
} from "@/types/profile.types";

export const profileService = {
  /**
   * Get all active profiles from backend
   */
  async getAllProfiles(): Promise<Profile[]> {
    const res = await apiClient.get<Profile[]>(API_CONFIG.ENDPOINTS.PROFILES);
    return res.data || [];
  },

  /**
   * Get profile by ID
   */
  async getProfileById(id: number | string): Promise<Profile> {
    const res = await apiClient.get<Profile>(
      API_CONFIG.ENDPOINTS.PROFILE_BY_ID(id)
    );
    return res.data;
  },

  /**
   * Create a new profile
   */
  async createProfile(payload: CreateProfileDto): Promise<Profile> {
    const res = await apiClient.post<Profile>(
      API_CONFIG.ENDPOINTS.PROFILES,
      payload
    );
    return res.data;
  },

  /**
   * Update profile by ID
   */
  async updateProfile(
    id: number | string,
    payload: UpdateProfileDto
  ): Promise<Profile> {
    const res = await apiClient.put<Profile>(
      API_CONFIG.ENDPOINTS.PROFILE_BY_ID(id),
      payload
    );
    return res.data;
  },

  /**
   * Soft-delete single profile
   */
  async deleteProfile(
    id: number | string,
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.delete<any>(
      API_CONFIG.ENDPOINTS.PROFILE_BY_ID(id),
      { deletedRemarks }
    );
    return res.data;
  },

  /**
   * Bulk soft-delete profiles
   */
  async bulkDeleteProfiles(
    ids: number[],
    deletedRemarks?: string
  ): Promise<any> {
    const res = await apiClient.post<any>(
      API_CONFIG.ENDPOINTS.PROFILE_BULK_DELETE,
      { ids, deletedRemarks }
    );
    return res.data;
  },
};
