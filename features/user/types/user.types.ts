export type NewUserRegisterRequest = {
  account: {
    email: string;
    password: string;
    phoneNumber: string;
  };

  profile: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };

  student?: {
    studentNumber: string;
    course: string;
    section: string;
    yearLevel: number;
  };

  personnel?: {
    idCardNumber: string;
    department: string;
  };

  corSubmission?: {
    academicTerm: string;
    corDocumentUrl: string;
  };

  parkingSchedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];

  vehicles: {
    plateNumber: string;
    brand: string;
  }[];
};

export type UserProfileResponse = {
  id: string;
  userAccountId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  onboardingStep?: number | string;
  studentNumber?: string;
  employeeIdNumber?: string;
  course?: string;
  yearLevel?: number;
  section?: string;
  department?: string;
};

export type LinkedIdentity = {
  provider: string;
  email: string;
  providerId: string;
  isVerified: boolean;
};

export type UserCredentialsResponse = {
  email: string;
  primaryProvider: string;
  externalProviderId: string;
  linkedIdentities: LinkedIdentity[];
};
