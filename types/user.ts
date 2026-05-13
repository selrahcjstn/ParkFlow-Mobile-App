export type NewUserRegisterRequest = {
  account: {
    email: string;
    password: string;
    phoneNumber: string;
    role: number;
  };
  profile: {
    idCardNumber: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    course?: string;
    section?: string;
    yearLevel?: number;
    office?: string;
  };
  corSubmission: {
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

// Response shape for user/profile endpoints (previously in types/user.ts)

export type UserProfileResponse = {
  id: string;
  userAccountId: string;
  phoneNumber: string;
  role: number;
  idCardNumber: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  course: string;
  section: string;
  yearLevel: number;
  office: string;
};
