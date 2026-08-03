import { DocumentType } from "./documentType.types";

// Enum-aligned types — must match backend Phase 4A exactly
export type FieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "CURRENCY"
  | "EMAIL"
  | "PHONE"
  | "BOOLEAN";

export type DataSource =
  | "EMPLOYEE"
  | "COMPANY"
  | "PROFILE"
  | "SYSTEM"
  | "MANUAL";

export interface DynamicField {
  id: number;
  fieldKey: string;
  fieldName: string;
  fieldType: FieldType;
  dataSource: DataSource;
  documentTypeId?: number | null;
  documentType?: DocumentType;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isSystem?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  options?: any;
  validationRules?: any;
  remark?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDynamicFieldPayload {
  fieldKey: string;
  fieldName: string;
  fieldType: FieldType;
  dataSource: DataSource;
  documentTypeId?: number | null;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isSystem?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  options?: any;
  validationRules?: any;
  remark?: string;
}

export interface UpdateDynamicFieldPayload extends Partial<CreateDynamicFieldPayload> {}

export interface DynamicFieldFilters {
  search?: string;
  field_type?: FieldType | "";
  data_source?: DataSource | "";
  document_type_id?: number | null;
  is_active?: boolean | null;
}

// Legacy aliases kept for backward-compat with any existing imports
export type CreateDynamicFieldDto = CreateDynamicFieldPayload;
export type UpdateDynamicFieldDto = UpdateDynamicFieldPayload;
