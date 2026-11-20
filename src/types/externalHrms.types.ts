export interface ExternalEmployee {
  id: number;
  empRegId: number;
  fullName: string;
  dob: string | null;
  gender: string | null;
  bloodGroup: string | null;
  fatherorHusbandName: string | null;
  maritalStatus: string | null;
  mobileNo: string | null;
  email: string | null;
  profileImage: string | null;
  isActive: boolean;
  department: string;
  designation: string;
  joiningDate: string | null;
  probationEndDate: string | null;
  dateofPermanecy: string | null;
  officeLocation: string;
  role: string;
  workShift: string;
  workType: string;
  employeeCode: string;
  aadharNumber: string;
  panNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  rawDetails: Record<string, any>;
  dynamicFieldMapping: Record<string, string>;
}

export interface EmployeeFieldMappingResponse {
  matchedFields: Record<string, string>;
  unmappedHrmsFields: Record<string, any>;
  employeeSummary: {
    id: number;
    fullName: string;
    designation: string;
    department: string;
    employeeCode: string;
    profileImage: string | null;
  };
}
