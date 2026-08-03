import { FieldType } from "./dynamicField.types";

export type GenerationStatus = "GENERATING" | "COMPLETED" | "FAILED";

export interface GeneratedDocumentTemplate {
  id: number;
  templateCode: string;
  templateName: string;
}

export interface GeneratedDocument {
  id: number;
  templateId: number;
  templateContentId?: number | null;
  documentTypeId?: number | null;
  documentName: string;
  outputFormat: string;
  status: GenerationStatus;
  filePath?: string | null;
  fileName?: string | null;
  errorMessage?: string | null;
  generatedData?: Record<string, string> | null;
  generatedAt?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  template?: GeneratedDocumentTemplate;
}

export interface GenerateDocumentPayload {
  templateId: number;
  documentName: string;
  data: Record<string, string>;
}

export interface GeneratedDocumentFilters {
  templateId?: number | null;
  status?: GenerationStatus | "";
}

// ─── Phase 5E — Dynamic Data Auto-Fill ───────────────────────────────────────

export type DataSource = "EMPLOYEE" | "COMPANY" | "PROFILE" | "SYSTEM" | "MANUAL";

export interface ResolveDataPayload {
  templateId: number;
  employeeId?: number | null;
  companyId?: number | null;
  profileId?: number | null;
  manualData?: Record<string, string>;
}

/**
 * One resolved field entry returned by the backend resolver.
 * Shape matches dynamicDataResolver.js fieldsList push.
 */
export interface ResolvedField {
  fieldKey: string;
  fieldName: string;
  fieldType: FieldType;
  dataSource: DataSource;
  isRequired: boolean;
  value: string | null;
  source: DataSource;
  editable: boolean;
}

/**
 * Full response body from POST /api/v1/generated-documents/resolve-data (HTTP 200).
 */
export interface ResolveDataResponse {
  templateId: number;
  fields: ResolvedField[];
  /** Ready-to-use key→value map for PDF generation  */
  resolvedData: Record<string, string>;
  /** Keys that were required but could not be resolved (should be empty on 200) */
  missingFields: string[];
}

/**
 * Mock employee record — matches the in-memory MOCK_EMPLOYEES shape in dynamicDataResolver.js.
 * Used only for the Employee dropdown since no real Employee module/table exists yet.
 */
export interface MockEmployee {
  id: number;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  joining_date: string;
  email: string;
  phone: string;
  salary: string;
  address: string;
}

/** Static mock employees — mirrors the backend MOCK_EMPLOYEES object exactly. */
export const MOCK_EMPLOYEES: MockEmployee[] = [
  {
    id: 1,
    employee_name: "Kumar Adarsh",
    employee_code: "EMP001",
    designation: "Software Developer",
    department: "Engineering",
    joining_date: "02-Feb-2026",
    email: "kumar.adarsh@example.com",
    phone: "+91 99999 88888",
    salary: "7000",
    address: "Bhubaneswar, Odisha",
  },
  {
    id: 12,
    employee_name: "Rahul Kumar",
    employee_code: "EMP012",
    designation: "Software Engineer",
    department: "Engineering",
    joining_date: "2026-08-01",
    email: "rahul.kumar@example.com",
    phone: "+91 98765 43210",
    salary: "45000",
    address: "Patna, Bihar",
  },
];
