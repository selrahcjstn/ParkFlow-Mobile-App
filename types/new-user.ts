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
