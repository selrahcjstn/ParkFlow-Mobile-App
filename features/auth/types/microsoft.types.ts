export interface MicrosoftAuthRequest {
  externalProviderId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export interface MicrosoftAuthResponseData {
  userId: string;
  email: string;
  authProvider: string;
  externalProviderId: string;
  token: string;
  isNewAccount: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  currentOnboardingStep?: number | string;
}

