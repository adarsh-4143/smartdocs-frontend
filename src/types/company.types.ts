export type CompanyStatus = "active" | "inactive" | "pending" | "suspended";

export interface Company {
  id: number;
  companyCode: string;
  companyName: string;
  legalName?: string;
  displayName?: string;
  companyType?: string;
  industry?: string;
  description?: string;

  // Tax & Registration Identifiers
  registrationNumber?: string;
  cinNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  tanNumber?: string;
  taxIdentificationNumber?: string;

  // Contacts
  officialEmail?: string;
  hrEmail?: string;
  accountsEmail?: string;
  supportEmail?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  website?: string;

  // Registered Address
  registeredAddressLine1?: string;
  registeredAddressLine2?: string;
  registeredCity?: string;
  registeredState?: string;
  registeredCountry?: string;
  registeredPostalCode?: string;

  // Office Address
  officeAddressLine1?: string;
  officeAddressLine2?: string;
  officeCity?: string;
  officeState?: string;
  officeCountry?: string;
  officePostalCode?: string;

  // Branding
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  letterheadUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;

  // Defaults & Localization
  defaultCurrency?: string;
  defaultTimezone?: string;
  defaultDateFormat?: string;
  defaultLanguage?: string;

  // System & Meta Fields
  status: CompanyStatus;
  remark?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyDto {
  companyCode: string;
  companyName: string;
  legalName?: string;
  displayName?: string;
  companyType?: string;
  industry?: string;
  description?: string;

  // Tax & Registration
  registrationNumber?: string;
  cinNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  tanNumber?: string;
  taxIdentificationNumber?: string;

  // Contacts
  officialEmail?: string;
  hrEmail?: string;
  accountsEmail?: string;
  supportEmail?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  website?: string;

  // Registered Address
  registeredAddressLine1?: string;
  registeredAddressLine2?: string;
  registeredCity?: string;
  registeredState?: string;
  registeredCountry?: string;
  registeredPostalCode?: string;

  // Office Address
  officeAddressLine1?: string;
  officeAddressLine2?: string;
  officeCity?: string;
  officeState?: string;
  officeCountry?: string;
  officePostalCode?: string;

  // Branding & Media
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  letterheadUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;

  // Defaults & Settings
  defaultCurrency?: string;
  defaultTimezone?: string;
  defaultDateFormat?: string;
  defaultLanguage?: string;

  status?: CompanyStatus;
  remark?: string;
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}
