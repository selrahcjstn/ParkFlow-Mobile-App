import type { UserProfileResponse, UserCredentialsResponse } from "@/features/user/types/user.types";
import { apiRequest } from "../../../services/common.service";
import { api } from "@/services/axios";
import type { ApiResponse } from "@/types/api-response.types";

export type ProfilePictureUploadResponse = {
  secureUrl: string;
  publicId: string;
};

export type CorSubmissionDto = {
  id: string;
  userAccountId: string;
  academicTerm: string;
  corDocumentUrl: string;
  orcrDocumentUrl?: string;
  motorPictureUrl?: string;
  verificationStatus: number;
  fullName: string;
  email: string;
  vehiclePlate: string;
  vehicleType: string;
  createdAt: string;
};

export const userService = {
  getProfile: async () => {
    return apiRequest<UserProfileResponse>("get", "/profiles/me");
  },
  getMyCorSubmission: async () => {
    return apiRequest<CorSubmissionDto>("get", "/cor-submissions/my-submission");
  },
  updatePhoneNumber: async (phoneNumber: string) => {
    return apiRequest<string, { phoneNumber: string }>(
      "patch",
      "/users/phone-number",
      { phoneNumber },
    );
  },
  /**
   * Uploads a profile picture to the backend, which handles the Cloudinary upload
   * and returns the secure URL and public ID.
   *
   * @param localUri The local file URI from Expo DocumentPicker / ImagePicker
   * @param fileName The file name
   * @param userId The user's UUID
   * @returns secureUrl and publicId from Cloudinary via the backend
   */
  uploadProfilePicture: async (
    localUri: string,
    fileName: string,
    userId: string,
  ): Promise<ApiResponse<ProfilePictureUploadResponse>> => {
    const formData = new FormData();

    const fileExtension = localUri
      .substring(localUri.lastIndexOf(".") + 1)
      .toLowerCase();
    const mimeType = fileExtension === "jpg" || fileExtension === "jpeg"
      ? "image/jpeg"
      : fileExtension === "png"
      ? "image/png"
      : "image/jpeg";

    formData.append("File", {
      uri: localUri,
      type: mimeType,
      name: fileName || `profile_${Date.now()}.${fileExtension}`,
    } as any);

    formData.append("UserId", userId);

    const response = await api.post<ApiResponse<ProfilePictureUploadResponse>>(
      "/files/upload/profile-picture",
      formData,
      {
        transformRequest: (data) => data,
      },
    );

    return response as unknown as ApiResponse<ProfilePictureUploadResponse>;
  },

  /**
   * Uploads a COR / Employee ID document to the backend.
   *
   * @param localUri The local file URI from DocumentPicker
   * @param fileName The file name
   * @param corSubmissionId UUID for the COR submission
   * @returns secureUrl and publicId from the backend
   */
  uploadCorDocument: async (
    localUri: string,
    fileName: string,
    corSubmissionId: string,
  ): Promise<ApiResponse<ProfilePictureUploadResponse>> => {
    const formData = new FormData();

    const fileExtension = (
      fileName?.substring(fileName.lastIndexOf(".") + 1) ||
      localUri?.substring(localUri.lastIndexOf(".") + 1) ||
      "pdf"
    ).toLowerCase();

    const mimeType =
      fileExtension === "pdf"
        ? "application/pdf"
        : fileExtension === "jpg" || fileExtension === "jpeg"
        ? "image/jpeg"
        : fileExtension === "png"
        ? "image/png"
        : "application/pdf";

    const safeFileName = fileName
      ? fileName
      : `cor_${Date.now()}.${fileExtension}`;

    formData.append("File", {
      uri: localUri,
      type: mimeType,
      name: safeFileName,
    } as any);

    if (corSubmissionId && corSubmissionId.trim() !== "") {
      formData.append("CorSubmissionId", corSubmissionId);
    }

    const response = await api.post<ApiResponse<ProfilePictureUploadResponse>>(
      "/files/upload/cor",
      formData,
      {
        transformRequest: (data) => data,
      },
    );

    return response as unknown as ApiResponse<ProfilePictureUploadResponse>;
  },

  /**
   * Uploads an OR/CR document to the backend.
   */
  uploadOrcrDocument: async (
    localUri: string,
    fileName: string,
    corSubmissionId: string,
  ): Promise<ApiResponse<ProfilePictureUploadResponse>> => {
    const formData = new FormData();

    const fileExtension = localUri
      .substring(localUri.lastIndexOf(".") + 1)
      .toLowerCase();
    const mimeType =
      fileExtension === "pdf"
        ? "application/pdf"
        : fileExtension === "jpg" || fileExtension === "jpeg"
        ? "image/jpeg"
        : fileExtension === "png"
        ? "image/png"
        : "application/octet-stream";

    formData.append("File", {
      uri: localUri,
      type: mimeType,
      name: fileName || `orcr_${Date.now()}.${fileExtension}`,
    } as any);

    if (corSubmissionId && corSubmissionId.trim() !== "") {
      formData.append("CorSubmissionId", corSubmissionId);
    }

    const response = await api.post<ApiResponse<ProfilePictureUploadResponse>>(
      "/files/upload/orcr",
      formData,
      {
        transformRequest: (data) => data,
      },
    );

    return response as unknown as ApiResponse<ProfilePictureUploadResponse>;
  },

  /**
   * Uploads a motor picture to the backend.
   */
  uploadMotorPicture: async (
    localUri: string,
    fileName: string,
    corSubmissionId: string,
  ): Promise<ApiResponse<ProfilePictureUploadResponse>> => {
    const formData = new FormData();

    const fileExtension = localUri
      .substring(localUri.lastIndexOf(".") + 1)
      .toLowerCase();
    const mimeType =
      fileExtension === "jpg" || fileExtension === "jpeg"
        ? "image/jpeg"
        : fileExtension === "png"
        ? "image/png"
        : "image/jpeg";

    formData.append("File", {
      uri: localUri,
      type: mimeType,
      name: fileName || `motor_${Date.now()}.${fileExtension}`,
    } as any);

    if (corSubmissionId && corSubmissionId.trim() !== "") {
      formData.append("CorSubmissionId", corSubmissionId);
    }

    const response = await api.post<ApiResponse<ProfilePictureUploadResponse>>(
      "/files/upload/motor-picture",
      formData,
      {
        transformRequest: (data) => data,
      },
    );

    return response as unknown as ApiResponse<ProfilePictureUploadResponse>;
  },

  /**
   * Fetches user credentials and social identity linking status from the backend.
   *
   * @returns UserCredentialsResponse listing linked providers and verification status
   */
  getUserCredentials: async () => {
    return apiRequest<UserCredentialsResponse>("get", "/users/credentials");
  },

  updatePrimaryEmail: async (email: string) => {
    return apiRequest<boolean, { email: string }>(
      "put",
      "/users/primary-email",
      { email },
    );
  },
};
