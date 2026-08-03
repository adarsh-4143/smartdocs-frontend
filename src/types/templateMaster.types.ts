import { Company } from "./company.types";
import { DocumentType } from "./documentType.types";
import { Profile } from "./profile.types";

export type TemplateMasterStatus = "draft" | "active" | "inactive" | "archived";

export interface TemplateMaster {
  id: number;
  companyId: number;
  company?: Company;
  documentTypeId: number;
  documentType?: DocumentType;
  profileId?: number | null;
  profile?: Profile | null;
  templateCode: string;
  templateName: string;
  description?: string;
  version?: string;
  status: TemplateMasterStatus;
  isDefault?: boolean;
  remark?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemplateMasterDto {
  companyId: number;
  documentTypeId: number;
  profileId?: number | null;
  templateCode: string;
  templateName: string;
  description?: string;
  version?: string;
  status?: TemplateMasterStatus;
  isDefault?: boolean;
  remark?: string;
}

export interface UpdateTemplateMasterDto extends Partial<CreateTemplateMasterDto> {}
