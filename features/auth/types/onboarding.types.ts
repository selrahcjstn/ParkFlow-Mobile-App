export type OnboardingProfileRequest = {
  phoneNumber: string;
  firstName: string;
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
};

export type OnboardingVehicleRequest = {
  plateNumber: string;
  brand: string;
  vehicleType: number;
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
};
