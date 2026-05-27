export type ManualRegisterRequest = {
  email: string;
  password: string;
};

export type AuthTokenResponseData = {
  token: string;
  isNewAccount?: boolean;
};

export type AuthResponse = {
  token: string;
  isNewAccount?: boolean;
  currentOnboardingStep?: number | string;
};

export function mapOnboardingStep(
  step: number | string | undefined | null
): "profile" | "role" | "vehicle" | "complete" | null {
  if (step === undefined || step === null) return null;

  // C# enum: Profile=0, Student=1, Vehicle=2, Schedule=3, Done=4
  if (typeof step === "number") {
    if (step === 0) return "profile";
    if (step === 1) return "role";
    if (step === 2) return "vehicle";
    if (step >= 3) return "complete";
    return null;
  }

  // If the backend serializes the enum as its string name
  const lower = String(step).toLowerCase();
  if (lower === "profile") return "profile";
  if (lower === "student") return "role";
  if (lower === "vehicle") return "vehicle";
  if (lower === "schedule" || lower === "done") return "complete";

  return null;
}

