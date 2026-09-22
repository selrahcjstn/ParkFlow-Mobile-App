import { create } from "zustand";
import SecureStore from "@/services/storage";
import {
  registerViolationListener,
  registerExitResponseListener,
  registerParkingSessionListener,
  registerPaymentProcessedListener,
  getConnection,
} from "@/services/signalr";
import { notificationService, UserNotificationItem } from "@/features/notification/services/notification.service";
import { useAuthStore } from "@/features/auth/store/auth.store";

const getUserStorageKey = (userId?: string) => {
  return userId ? `parkflow_saved_notifications_user_${userId}` : "parkflow_saved_notifications_v2";
};

let Notifications: typeof import("expo-notifications") | null = null;
try {
  Notifications = require("expo-notifications");
  if (Notifications && typeof Notifications.setNotificationHandler === "function") {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.warn("[NotificationStore] Native expo-notifications not supported in Expo Go:", e);
}

async function triggerDevicePushNotification(title: string, body: string, data?: any) {
  if (!Notifications) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== "granted") {
      const res = await Notifications.requestPermissionsAsync();
      finalStatus = res.status;
    }
    if (finalStatus === "granted") {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: "default",
        },
        trigger: null,
      });
    }
  } catch (err) {
    console.warn("[LocalPushNotification] Error scheduling native alert:", err);
  }
}

export type NotificationType =
  | "approved"
  | "rejected"
  | "welcome"
  | "overdue"
  | "reminder"
  | "system";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  body: string;
  timestamp: string;
  date: string;
  unread: boolean;
  referenceCode?: string;
  vehiclePlate?: string;
  actionRoute?: string;
  actionText?: string;
  priority?: "high" | "medium" | "low";
  issuer?: string;
  driverName?: string;
  driverRole?: string;
  vehicleBrand?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  selectedNotification: NotificationItem | null;
  isDetailOpen: boolean;
  isSignalRSubscribed: boolean;
  isLoading: boolean;

  // Actions
  selectNotification: (notification: NotificationItem | null) => void;
  openNotificationDetail: (notification: NotificationItem) => void;
  closeNotificationDetail: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Omit<NotificationItem, "id" | "date" | "unread">, triggerPush?: boolean, forceNew?: boolean) => void;
  getUnreadCount: () => number;
  initRealtimeListeners: () => () => void;
  syncRealNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  clearNotifications: () => void;
}

const mapBackendToItem = (item: UserNotificationItem): NotificationItem => {
  const dateObj = new Date(item.createdAt);
  const timeString = isNaN(dateObj.getTime())
    ? "Recent"
    : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateString = isNaN(dateObj.getTime())
    ? "Today"
    : dateObj.toLocaleDateString([], { month: "short", day: "numeric" });

  return {
    id: item.id,
    type: (item.type as NotificationType) || "system",
    title: item.title,
    subtitle: item.subtitle || "",
    body: item.body,
    timestamp: timeString,
    date: dateString,
    unread: !item.isRead,
    referenceCode: item.referenceCode,
    vehiclePlate: item.vehiclePlate,
    actionRoute: item.actionRoute,
    actionText: item.actionText,
    priority: item.priority as any,
    issuer: item.issuer,
    driverName: item.driverName,
    driverRole: item.driverRole,
    vehicleBrand: item.vehicleBrand,
  };
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  selectedNotification: null,
  isDetailOpen: false,
  isSignalRSubscribed: false,
  isLoading: false,

  selectNotification: (notification) =>
    set({ selectedNotification: notification }),

  openNotificationDetail: (notification) => {
    get().markAsRead(notification.id);
    set({
      selectedNotification: notification,
      isDetailOpen: true,
    });
  },

  closeNotificationDetail: () =>
    set({
      isDetailOpen: false,
      selectedNotification: null,
    }),

  markAsRead: async (id) => {
    // 1. Update memory state immediately
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n
      );
      const user = useAuthStore.getState().user;
      SecureStore.setItemAsync(getUserStorageKey(user?.id), JSON.stringify(updated.slice(0, 50))).catch(() => {});
      return {
        notifications: updated,
        selectedNotification:
          state.selectedNotification?.id === id
            ? { ...state.selectedNotification, unread: false }
            : state.selectedNotification,
      };
    });

    // 2. Persist read status to backend database
    try {
      if (!id.startsWith("notif-local-")) {
        await notificationService.markAsRead(id);
      }
    } catch (err) {
      console.warn("[NotificationStore] Error marking notification as read in DB:", err);
    }
  },

  markAllAsRead: async () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, unread: false }));
      const user = useAuthStore.getState().user;
      SecureStore.setItemAsync(getUserStorageKey(user?.id), JSON.stringify(updated.slice(0, 50))).catch(() => {});
      return {
        notifications: updated,
        selectedNotification: state.selectedNotification
          ? { ...state.selectedNotification, unread: false }
          : null,
      };
    });

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn("[NotificationStore] Error marking all notifications as read in DB:", err);
    }
  },

  deleteNotification: async (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      const user = useAuthStore.getState().user;
      SecureStore.setItemAsync(getUserStorageKey(user?.id), JSON.stringify(updated.slice(0, 50))).catch(() => {});
      return {
        notifications: updated,
        isDetailOpen:
          state.selectedNotification?.id === id ? false : state.isDetailOpen,
        selectedNotification:
          state.selectedNotification?.id === id ? null : state.selectedNotification,
      };
    });

    try {
      if (!id.startsWith("notif-local-")) {
        await notificationService.deleteNotification(id);
      }
    } catch (err) {
      console.warn("[NotificationStore] Error deleting notification from DB:", err);
    }
  },

  addNotification: async (notif, triggerPush = true, forceNew = false) => {
    const current = get().notifications;
    if (!triggerPush && !forceNew) {
      const isDuplicate = current.some(
        (n) =>
          n.title === notif.title &&
          (n.body === notif.body || (Boolean(n.referenceCode) && n.referenceCode === notif.referenceCode))
      );
      if (isDuplicate) {
        return;
      }
    }

    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: timeString,
      unread: true,
    };

    if (triggerPush) {
      await triggerDevicePushNotification(newNotif.title, newNotif.body, { id: newNotif.id });
    }

    set((state) => {
      const updated = [newNotif, ...state.notifications];
      const user = useAuthStore.getState().user;
      SecureStore.setItemAsync(getUserStorageKey(user?.id), JSON.stringify(updated.slice(0, 50))).catch(() => {});
      return { notifications: updated };
    });
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => n.unread).length;
  },

  clearNotifications: () => {
    set({
      notifications: [],
      selectedNotification: null,
      isDetailOpen: false,
      isSignalRSubscribed: false,
    });
  },

  fetchNotifications: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoading: true });
    try {
      const res = await notificationService.getMyNotifications(50);
      if (res?.isSuccess && Array.isArray(res.data)) {
        const items = res.data.map(mapBackendToItem);
        set({ notifications: items });
        SecureStore.setItemAsync(getUserStorageKey(user.id), JSON.stringify(items)).catch(() => {});
      }
    } catch (err) {
      console.warn("[NotificationStore] Failed to fetch notifications from backend API:", err);
      // Fallback to user-scoped cached notifications
      try {
        const cached = await SecureStore.getItemAsync(getUserStorageKey(user.id));
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            set({ notifications: parsed });
          }
        }
      } catch (_e) {}
    } finally {
      set({ isLoading: false });
    }
  },

  initRealtimeListeners: () => {
    if (get().isSignalRSubscribed) return () => {};
    set({ isSignalRSubscribed: true });

    const connection = getConnection();

    // Listen for direct UserNotification events pushed from backend via SignalR
    const handleReceiveNotification = (data: any) => {
      console.log("[NotificationStore] Real-time UserNotification received:", data);
      if (data) {
        const item: NotificationItem = data.id ? mapBackendToItem(data) : {
          id: `notif-real-${Date.now()}`,
          type: (data.type as NotificationType) || "system",
          title: data.title || "New Notification",
          subtitle: data.subtitle || "",
          body: data.body || "",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: "Today",
          unread: true,
          referenceCode: data.referenceCode,
          vehiclePlate: data.vehiclePlate,
          actionRoute: data.actionRoute,
          actionText: data.actionText,
          priority: data.priority,
          issuer: data.issuer,
          driverName: data.driverName,
          driverRole: data.driverRole,
          vehicleBrand: data.vehicleBrand,
        };

        triggerDevicePushNotification(item.title, item.body, { id: item.id });

        set((state) => {
          const exists = state.notifications.some((n) => n.id === item.id);
          if (exists) return state;
          const updated = [item, ...state.notifications];
          const user = useAuthStore.getState().user;
          SecureStore.setItemAsync(getUserStorageKey(user?.id), JSON.stringify(updated.slice(0, 50))).catch(() => {});
          return { notifications: updated };
        });
      }
    };

    connection.on("ReceiveNotification", handleReceiveNotification);
    connection.on("receivenotification", handleReceiveNotification);

    // Also sync live notifications from backend API
    get().fetchNotifications();

    return () => {
      connection.off("ReceiveNotification", handleReceiveNotification);
      connection.off("receivenotification", handleReceiveNotification);
      set({ isSignalRSubscribed: false });
    };
  },

  syncRealNotifications: async () => {
    await get().fetchNotifications();
  },
}));
