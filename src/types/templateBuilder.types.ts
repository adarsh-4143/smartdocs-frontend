import { TemplateMaster } from "./templateMaster.types";

export type TemplateContentType = "EDITOR" | "PDF";
export type TemplateContentStatus = "draft" | "active" | "inactive";

export interface TemplateContentRecord {
  id: number;
  templateId: number;
  template?: TemplateMaster;
  contentType: TemplateContentType;
  content: string | null;
  headerImage?: string | null;
  footerImage?: string | null;
  status: TemplateContentStatus;
  isActive?: boolean;
  isDeleted?: boolean;
  createdBy?: number | null;
  updatedBy?: number | null;
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemplateContentDto {
  templateId: number;
  contentType: TemplateContentType;
  content: string;
  headerImage?: string | null;
  footerImage?: string | null;
  status?: TemplateContentStatus;
}

export interface UpdateTemplateContentDto {
  content?: string;
  headerImage?: string | null;
  footerImage?: string | null;
  status?: TemplateContentStatus;
}
