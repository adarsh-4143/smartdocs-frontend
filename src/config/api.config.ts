export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1",
  TIMEOUT: 10000,
  ENDPOINTS: {
    // Companies
    COMPANIES: "/companies",
    COMPANY_BY_ID: (id: number | string) => `/companies/${id}`,
    COMPANY_STATUS: (id: number | string) => `/companies/${id}/status`,
    COMPANY_BULK_DELETE: "/companies/bulk-delete",

    // Profiles
    PROFILES: "/profiles",
    PROFILE_BY_ID: (id: number | string) => `/profiles/${id}`,
    PROFILE_BULK_DELETE: "/profiles/bulk-delete",

    // Document Types
    DOCUMENT_TYPES: "/document-types",
    DOCUMENT_TYPE_BY_ID: (id: number | string) => `/document-types/${id}`,
    DOCUMENT_TYPE_STATUS: (id: number | string) => `/document-types/${id}/status`,
    DOCUMENT_TYPE_BULK_DELETE: "/document-types/bulk-delete",

    // Dynamic Fields
    DYNAMIC_FIELDS: "/dynamic-fields",
    DYNAMIC_FIELD_BY_ID: (id: number | string) => `/dynamic-fields/${id}`,
    DYNAMIC_FIELDS_BY_DOC_TYPE: (docTypeId: number | string) => `/dynamic-fields/document-type/${docTypeId}`,
    DYNAMIC_FIELD_BULK_DELETE: "/dynamic-fields/bulk-delete",

    // Template Masters
    TEMPLATE_MASTERS: "/template-masters",
    TEMPLATE_MASTER_BY_ID: (id: number | string) => `/template-masters/${id}`,
    TEMPLATE_MASTER_STATUS: (id: number | string) => `/template-masters/${id}/status`,
    TEMPLATE_MASTER_BULK_DELETE: "/template-masters/bulk-delete",

    // Template Contents (Phase 1 & Phase 3 Backend APIs)
    TEMPLATE_CONTENTS: "/template-contents",
    TEMPLATE_CONTENT_BY_TEMPLATE_ID: (templateId: number | string) => `/template-contents/template/${templateId}`,
    TEMPLATE_CONTENT_BY_ID: (id: number | string) => `/template-contents/${id}`,
    TEMPLATE_CONTENT_UPLOAD_IMAGE: (id: number | string) => `/template-contents/${id}/upload`,
    TEMPLATE_CONTENT_REMOVE_IMAGE: (id: number | string) => `/template-contents/${id}/image`,

    // Template Documents (Phase 4C Existing Document Import)
    TEMPLATE_DOCUMENTS_UPLOAD: "/template-documents/upload",
    TEMPLATE_DOCUMENT_BY_ID: (id: number | string) => `/template-documents/${id}`,
    TEMPLATE_DOCUMENTS_BY_TEMPLATE_ID: (templateId: number | string) => `/template-documents/template/${templateId}`,
    TEMPLATE_DOCUMENT_CONVERT: (id: number | string) => `/template-documents/${id}/convert`,
    TEMPLATE_DOCUMENT_ORIGINAL: (id: number | string) => `/template-documents/${id}/original`,

    // Generated Documents (Phase 5C Document Generation)
    GENERATED_DOCUMENTS: "/generated-documents",
    GENERATED_DOCUMENT_BY_ID: (id: number | string) => `/generated-documents/${id}`,
    GENERATED_DOCUMENT_DOWNLOAD: (id: number | string) => `/generated-documents/${id}/download`,
    GENERATED_DOCUMENT_PREVIEW: (id: number | string) => `/generated-documents/${id}/preview`,
    GENERATED_DOCUMENT_REGENERATE: (id: number | string) => `/generated-documents/${id}/regenerate`,
    // Phase 5E — resolve-data MUST be registered before /:id to avoid Express route conflict
    GENERATED_DOCUMENT_RESOLVE_DATA: "/generated-documents/resolve-data",
  },
};
