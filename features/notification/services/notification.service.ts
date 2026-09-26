import { apiRequest } from "@/services/common.service";

export interface UserNotificationItem {
  id: string;
  userAccountId: string;
  title: string;
  subtitle?: string;
  body: string;
  type: string;
  referenceCode?: string;
  vehiclePlate?: string;
  actionRoute?: string;
  actionText?: string;
  priority?: "high" | "medium" | "low";
  issuer?: string;
  driverName?: string;
  driverRole?: string;
  vehicleBrand?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export const notificationService = {
  getMyNotifications: async (limit: number = 20, skip: number = 0) => {
    return apiRequest<UserNotificationItem[]>("get", `/notifications?limit=${limit}&skip=${skip}`);
  },

  getUnreadCount: async () => {
    return apiRequest<number>("get", "/notifications/unread-count");
  },

  markAsRead: async (notificationId: string) => {
    return apiRequest<boolean>("put", `/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    return apiRequest<boolean>("put", "/notifications/read-all");
  },

  deleteNotification: async (notificationId: string) => {
    return apiRequest<boolean>("delete", `/notifications/${notificationId}`);
  },
};
