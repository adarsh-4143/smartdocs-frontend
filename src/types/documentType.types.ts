import { Company } from "./company.types";

export type DocumentTypeStatus = "active" | "inactive" | "draft" | "archived";

export interface DocumentType {
  id: number;
  companyId: number;
  company?: Company;
  documentTypeCode: string;
  documentTypeName: string;
  description?: string;
  category?: string;
  status: DocumentTypeStatus;
  remark?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDocumentTypeDto {
  companyId: number;
  documentTypeCode: string;
  documentTypeName: string;
  description?: string;
  category?: string;
  status?: DocumentTypeStatus;
  remark?: string;
}

export interface UpdateDocumentTypeDto extends Partial<CreateDocumentTypeDto> {}
