import { api } from "@/services/axios";

export interface SystemAnnouncementDto {
  id: string;
  title?: string;
  message: string;
  iconType: "caution" | "good_news" | "info" | "maintenance" | "urgent";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message?: string;
  data?: T;
}

export async function getActiveSystemAnnouncement(): Promise<SystemAnnouncementDto | null> {
  try {
    const res = (await api.get("/system-announcement/active")) as ApiResponse<SystemAnnouncementDto>;
    if (res?.isSuccess && res?.data) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.error("[SystemAnnouncementService] Error fetching announcement:", error);
    return null;
  }
}
