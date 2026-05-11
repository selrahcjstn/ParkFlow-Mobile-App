export type ProfileRequest = {
  userId: string;
  firstName: string;
  lastName: string;

  idCardNumber: string;
  profilePictureUrl?: string;

  course?: string;
  section?: string;
  yearLevel?: number;

  office?: string;
};
