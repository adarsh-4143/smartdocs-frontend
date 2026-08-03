import { Company } from "./company.types";

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern" | "freelance";

export interface Profile {
  id: number;
  companyId: number;
  company?: Company;
  profileCode: string;
  profileName: string;
  jobTitle?: string;
  department?: string;
  designation?: string;
  jobLevel?: string;
  employmentType?: EmploymentType;
  description?: string;
  remark?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProfileDto {
  companyId: number;
  profileCode: string;
  profileName: string;
  jobTitle?: string;
  department?: string;
  designation?: string;
  jobLevel?: string;
  employmentType?: EmploymentType;
  description?: string;
  remark?: string;
}

export interface UpdateProfileDto extends Partial<CreateProfileDto> {}
