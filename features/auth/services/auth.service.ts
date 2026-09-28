import type {
  ManualRegisterRequest,
  AuthResponse,
  SendEmailOtpRequest,
  VerifyEmailOtpRequest,
  LinkManualRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyResetCodeRequest,
} from "@/features/auth/types/auth.types";
import type {
  MicrosoftAuthRequest,
  MicrosoftAuthResponseData,
} from "@/features/auth/types/microsoft.types";

import { SecureStore } from "@/services/storage";
import { apiRequest } from "../../../services/common.service";

type LoginPayload = {
  email: string;
  password: string;
};

export const authService = {
  login: async (email: string, password: string) => {
    const res = await apiRequest<AuthResponse, LoginPayload>(
      "post",
      "/users/login",
      {
        email,
        password,
      },
    );

    const token = res?.data?.token;

    if (res?.isSuccess && token) {
      await SecureStore.setItemAsync("token", token);
    }

    return res;
  },

  register: async (payload: ManualRegisterRequest) => {
    const res = await apiRequest<any, ManualRegisterRequest>(
      "post",
      "/auth/register",
      payload,
    );

    const token = typeof res?.data === "string" ? res.data : res?.data?.token;

    if (res?.isSuccess && token) {
      await SecureStore.setItemAsync("token", token);
    }

    return res;
  },

  microsoftAuth: async (payload: MicrosoftAuthRequest) => {
    const res = await apiRequest<
      MicrosoftAuthResponseData,
      MicrosoftAuthRequest
    >("post", "/auth/microsoft", payload);

    const token = res?.data?.token;

    if (res?.isSuccess && token) {
      await SecureStore.setItemAsync("token", token);
    }

    return res;
  },

  linkMicrosoft: async (payload: MicrosoftAuthRequest) => {
    return await apiRequest<any, MicrosoftAuthRequest>(
      "post",
      "/auth/link/microsoft",
      payload,
    );
  },

  checkEmailAvailability: async (email: string) => {
    try {
      const res = await apiRequest<boolean>(
        "get",
        `/auth/check-email?email=${encodeURIComponent(email)}`,
      );
      return res;
    } catch (err: any) {
      if (
        err?.response?.status === 409 ||
        err?.response?.data?.message?.toLowerCase().includes("already")
      ) {
        return {
          isSuccess: false,
          message:
            err?.response?.data?.message ||
            "This email is already in use. Please sign in or use a different email.",
        };
      }
      return { isSuccess: true, data: true };
    }
  },

  sendEmailOtp: async (email: string) => {
    return await apiRequest<boolean, SendEmailOtpRequest>(
      "post",
      "/auth/send-email-otp",
      { email },
    );
  },

  verifyEmailOtp: async (email: string, otpCode: string) => {
    return await apiRequest<boolean, VerifyEmailOtpRequest>(
      "post",
      "/auth/verify-email-otp",
      { email, otpCode },
    );
  },

  linkManual: async (payload: LinkManualRequest) => {
    return await apiRequest<any, LinkManualRequest>(
      "post",
      "/auth/link/manual",
      payload,
    );
  },

  updateManualLink: async (payload: { newEmail: string }) => {
    return await apiRequest<boolean, { newEmail: string }>(
      "put",
      "/auth/link/manual",
      payload,
    );
  },

  updateMicrosoftLink: async (payload: {
    newEmail: string;
    newExternalProviderId: string;
  }) => {
    return await apiRequest<
      boolean,
      { newEmail: string; newExternalProviderId: string }
    >("put", "/auth/link/microsoft", payload);
  },

  unlinkProvider: async (provider: string) => {
    return await apiRequest<boolean, void>(
      "delete",
      `/auth/link/${provider.toLowerCase()}`,
    );
  },

  setPrimaryProvider: async (provider: string) => {
    return await apiRequest<boolean, void>(
      "post",
      `/auth/link/${provider.toLowerCase()}/primary`,
    );
  },

  forgotPassword: async (email: string) => {
    console.log(`[authService] forgotPassword called with email: "${email}"`);
    try {
      const res = await apiRequest<string, ForgotPasswordRequest>(
        "post",
        "/users/forgot-password",
        { email },
      );
      console.log(`[authService] forgotPassword response:`, JSON.stringify(res));
      return res;
    } catch (err) {
      console.error(`[authService] forgotPassword error:`, err);
      throw err;
    }
  },

  verifyResetCode: async (email: string, code: string) => {
    console.log(`[authService] verifyResetCode called with email: "${email}", code: "${code}"`);
    try {
      const res = await apiRequest<string, VerifyResetCodeRequest>(
        "post",
        "/users/verify-reset-code",
        { email, code },
      );
      console.log(`[authService] verifyResetCode response:`, JSON.stringify(res));
      return res;
    } catch (err) {
      console.error(`[authService] verifyResetCode error:`, err);
      throw err;
    }
  },

  resetPassword: async (payload: ResetPasswordRequest) => {
    // Do not log this payload: it contains a single-use token and a password.
    return await apiRequest<string, ResetPasswordRequest>(
      "post",
      "/users/reset-password",
      payload,
    );
  },
};

