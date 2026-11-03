export type OnboardingProfileRequest = {
  phoneNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  profilePictureUrl: string;
};

export type OnboardingStudentRequest = {
  studentNumber: string;
  course: string;
  section: string;
  yearLevel: number;
};

export type OnboardingPersonnelRequest = {
  idCardNumber: string;
  department: string;
  role?: string | number;
};

export type OnboardingVehicleRequest = {
  plateNumber?: string | null;
  brand: string;
  vehicleType: number;
};

export type OnboardingRoleRequest = {
  role: number;
};

export type OnboardingScheduleItem = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type OnboardingScheduleRequest = {
  items: OnboardingScheduleItem[];
};

export type OnboardingCorRequest = {
  academicTerm: string;
  corDocumentUrl: string;
  orcrDocumentUrl?: string;
  motorPictureUrl?: string;
};
