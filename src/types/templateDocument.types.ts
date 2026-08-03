export type TemplateDocumentStatus = "UPLOADED" | "CONVERTED" | "FAILED";

export interface TemplateDocument {
  id: number;
  templateId: number;
  originalFileName: string;
  originalFileType: "PDF" | "DOCX" | "DOC";
  originalFilePath: string;
  status: TemplateDocumentStatus;
  pageCount?: number | null;
  convertedContent?: string | null;
  deletedRemarks?: string | null;
  isDeleted?: boolean;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadTemplateDocumentPayload {
  template_id: number;
  file: File;
}
