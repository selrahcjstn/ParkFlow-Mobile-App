export type ManualRegisterRequest = {
  email: string;
  password: string;
};

export type AuthTokenResponseData = {
  token: string;
  isNewAccount?: boolean;
};
