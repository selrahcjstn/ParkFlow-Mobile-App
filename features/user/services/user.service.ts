import type { UserProfileResponse } from "@/features/user/types/user.types";
import { apiRequest } from "../../../services/common.service";
import { api } from "@/services/axios";
import type { ApiResponse } from "@/types/api-response.types";

export type ProfilePictureUploadResponse = {
  secureUrl: string;
  publicId: string;
};

export const userService = {
  getProfile: async () => {
    return apiRequest<UserProfileResponse>("get", "/profiles/me");
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response as unknown as ApiResponse<ProfilePictureUploadResponse>;
  },
};

