import { create } from "zustand";
import * as Notifications from "expo-notifications";
import SecureStore from "@/services/storage";
import {
  registerViolationListener,
  registerExitResponseListener,
  registerParkingSessionListener,
  registerPaymentProcessedListener,
} from "@/services/signalr";
import { violationService } from "@/features/violation/services/violation.service";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { userService } from "@/features/user/services/user.service";

const NOTIFS_STORAGE_KEY = "parkflow_saved_notifications_v1";
const PUSHED_KEYS_STORAGE_KEY = "parkflow_pushed_notif_keys_v1";

let pushedKeysCache: Set<string> | null = null;

async function getPushedKeys(): Promise<Set<string>> {
  if (pushedKeysCache !== null) return pushedKeysCache;
  try {
    const raw = await SecureStore.getItemAsync(PUSHED_KEYS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        pushedKeysCache = new Set(arr);
        return pushedKeysCache;
      }
    }
  } catch (e) {
    console.warn("[NotificationStore] Error loading pushed keys:", e);
  }
  pushedKeysCache = new Set();
  return pushedKeysCache;
}

async function markKeyAsPushed(key: string): Promise<void> {
  const keys = await getPushedKeys();
  keys.add(key);
  try {
    await SecureStore.setItemAsync(PUSHED_KEYS_STORAGE_KEY, JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn("[NotificationStore] Error saving pushed key:", e);
  }
}

// Configure Expo Push Notification handler for native device alerts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function triggerDevicePushNotification(title: string, body: string, data?: any) {
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
}

interface NotificationState {
  notifications: NotificationItem[];
  selectedNotification: NotificationItem | null;
  isDetailOpen: boolean;
  isSignalRSubscribed: boolean;

  // Actions
  selectNotification: (notification: NotificationItem | null) => void;
  openNotificationDetail: (notification: NotificationItem) => void;
  closeNotificationDetail: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<NotificationItem, "id" | "date" | "unread">, triggerPush?: boolean, forceNew?: boolean) => void;
  getUnreadCount: () => number;
  initRealtimeListeners: () => () => void;
  syncRealNotifications: () => Promise<void>;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: INITIAL_NOTIFICATIONS,
  selectedNotification: null,
  isDetailOpen: false,
  isSignalRSubscribed: false,

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

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n
      );
      SecureStore.setItemAsync(NOTIFS_STORAGE_KEY, JSON.stringify(updated.slice(0, 50))).catch(() => {});
      return {
        notifications: updated,
        selectedNotification:
          state.selectedNotification?.id === id
            ? { ...state.selectedNotification, unread: false }
            : state.selectedNotification,
      };
    }),

  markAllAsRead: () =>
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, unread: false }));
      SecureStore.setItemAsync(NOTIFS_STORAGE_KEY, JSON.stringify(updated.slice(0, 50))).catch(() => {});
      return {
        notifications: updated,
        selectedNotification: state.selectedNotification
          ? { ...state.selectedNotification, unread: false }
          : null,
      };
    }),

  deleteNotification: (id) =>
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      SecureStore.setItemAsync(NOTIFS_STORAGE_KEY, JSON.stringify(updated.slice(0, 50))).catch(() => {});
      return {
        notifications: updated,
        isDetailOpen:
          state.selectedNotification?.id === id ? false : state.isDetailOpen,
        selectedNotification:
          state.selectedNotification?.id === id ? null : state.selectedNotification,
      };
    }),

  addNotification: async (notif, triggerPush = true, forceNew = false) => {
    // Safety check: Avoid adding exact duplicate title/body within the store only if NOT a real-time event
    const current = get().notifications;
    if (!triggerPush && !forceNew) {
      const isDuplicate = current.some(
        (n) =>
          n.title === notif.title &&
          (n.body === notif.body || (Boolean(n.referenceCode) && n.referenceCode === notif.referenceCode))
      );
      if (isDuplicate) {
        console.log(`[NotificationStore] Suppressed duplicate notification: "${notif.title}"`);
        return;
      }
    }

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-real-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: timeString,
      unread: true,
    };

    if (triggerPush) {
      // Always trigger device push notification alert for real-time events
      await triggerDevicePushNotification(newNotif.title, newNotif.body, { id: newNotif.id });
    }

    set((state) => {
      const updated = [newNotif, ...state.notifications];
      SecureStore.setItemAsync(NOTIFS_STORAGE_KEY, JSON.stringify(updated.slice(0, 50))).catch(() => {});
      return { notifications: updated };
    });
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => n.unread).length;
  },

  initRealtimeListeners: () => {
    if (get().isSignalRSubscribed) return () => {};
    set({ isSignalRSubscribed: true });

    // 1. Listen for real-time violations / overdue parking alerts (issued via guard scanner or system)
    const unSubViolation = registerViolationListener((data: any) => {
      console.log("[NotificationStore] Real-time violation alert received:", data);
      const violationType = data?.violationType || data?.ViolationType || "Overstay Citation";
      const fineAmount = Number(data?.amount || data?.penaltyFee || data?.Amount || 100).toFixed(2);
      const plate = data?.plateNumber || data?.PlateNumber || "Registered Vehicle";
      const issuerName = data?.issuedBy || data?.IssuedBy || "ParkFlow Guard Patrol";
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      get().addNotification({
        type: "overdue",
        title: "Parking Violation Issued",
        subtitle: `${violationType} (Guard Scanner)`,
        body: `A parking citation [${violationType}] was recorded for vehicle [${plate}] (${timeStr}). Fine: ₱${fineAmount}. Issued by ${issuerName}.`,
        timestamp: timeStr,
        referenceCode: `violation-${plate}-${Date.now()}`,
        vehiclePlate: plate,
        priority: "high",
        issuer: issuerName,
        actionRoute: "/(settings)/violations",
        actionText: "View Citation",
      }, true, true);
    });

    // 2. Listen for exit response (exiting parking lot via guard scanner)
    const unSubExit = registerExitResponseListener((data: any) => {
      console.log("[NotificationStore] Real-time exit response received:", data);
      const isViolation = Boolean(data?.isViolation || data?.IsViolation);
      const plate = data?.plateNumber || data?.PlateNumber || "Registered Vehicle";
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isViolation) {
        const violationType = data?.violationType || data?.ViolationType || "Overstay Citation";
        const fineAmount = Number(data?.amount || data?.penaltyFee || data?.Amount || 100).toFixed(2);
        const issuerName = data?.issuedBy || data?.IssuedBy || "ParkFlow Gate Patrol";

        get().addNotification({
          type: "overdue",
          title: "Parking Violation Issued on Exit",
          subtitle: `${violationType} (Guard Scanner)`,
          body: `A citation [${violationType}] was recorded for vehicle [${plate}] upon exit scan (${timeStr}). Fine: ₱${fineAmount}. Issued by ${issuerName}.`,
          timestamp: timeStr,
          referenceCode: `exit-violation-${plate}-${Date.now()}`,
          vehiclePlate: plate,
          priority: "high",
          issuer: issuerName,
          actionRoute: "/(settings)/violations",
          actionText: "Pay Citation",
        }, true, true);
      } else {
        get().addNotification({
          type: "approved",
          title: "Vehicle Exit Recorded",
          subtitle: "Parking Lot Exit Confirmed",
          body: `Vehicle [${plate}] has successfully logged exit at ${data?.locationName || "Main Entrance Parking Lot"} (${timeStr}).`,
          timestamp: timeStr,
          referenceCode: `exit-${plate}-${Date.now()}`,
          vehiclePlate: plate,
          issuer: "ParkFlow Gate Scanner",
          actionRoute: "/(users)/(tabs)/history",
          actionText: "View Log History",
        }, true, true);
      }
    });

    // 3. Listen for parking session updates (parking entry/exit via guard scanner)
    const unSubSession = registerParkingSessionListener((data: any) => {
      console.log("[NotificationStore] Real-time parking session updated:", data);
      const plate = data?.plateNumber || data?.PlateNumber || "Registered Vehicle";
      const status = data?.status || data?.Status || "Updated";
      const isExited = status === "Completed" || status === "Exited" || status === "Closed" || Boolean(data?.exitTime || data?.ExitTime);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isExited) {
        get().addNotification({
          type: "approved",
          title: "Vehicle Exit Recorded",
          subtitle: "Exit Pass Validated",
          body: `Vehicle [${plate}] has successfully logged exit at campus gates (${timeStr}).`,
          timestamp: timeStr,
          referenceCode: `session-exit-${plate}-${Date.now()}`,
          vehiclePlate: plate,
          issuer: "ParkFlow Gate Scanner",
          actionRoute: "/(users)/(tabs)/history",
          actionText: "View Log History",
        }, true, true);
      } else {
        get().addNotification({
          type: "reminder",
          title: "Parking Entry Recorded",
          subtitle: "Parked Successfully",
          body: `Vehicle [${plate}] has successfully entered Main Entrance Parking Lot (${timeStr}). Guard scanner pass validated.`,
          timestamp: timeStr,
          referenceCode: `session-entry-${plate}-${Date.now()}`,
          vehiclePlate: plate,
          issuer: "ParkFlow Gate Scanner",
          actionRoute: "/(users)/(tabs)/home",
          actionText: "View Session Status",
        }, true, true);
      }
    });

    // 4. Listen for payment processed
    const unSubPayment = registerPaymentProcessedListener((data: any) => {
      console.log("[NotificationStore] Real-time payment processed:", data);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      get().addNotification({
        type: "approved",
        title: "Violation Citation Paid",
        subtitle: "Account Status Cleared",
        body: `Payment of ₱${data?.amount || "0.00"} for citation [${data?.referenceNumber || "Violation"}] was processed (${timeStr}). Clearance verified.`,
        timestamp: timeStr,
        referenceCode: `payment-${data?.referenceNumber || Date.now()}-${Date.now()}`,
        issuer: "ParkFlow Financial Desk",
        actionRoute: "/(settings)/violations",
        actionText: "View Violations History",
      }, true, true);
    });

    // Automatically trigger initial live sync
    get().syncRealNotifications();

    return () => {
      unSubViolation();
      unSubExit();
      unSubSession();
      unSubPayment();
      set({ isSignalRSubscribed: false });
    };
  },

  syncRealNotifications: async () => {
    try {
      // Hydrate saved notifications on first load if current list is empty
      if (get().notifications.length === 0) {
        try {
          const saved = await SecureStore.getItemAsync(NOTIFS_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              set({ notifications: parsed });
            }
          }
        } catch (e) {
          console.warn("[NotificationStore] Failed to restore saved notifications:", e);
        }
      }

      // 1. Sync live active violations from backend API (pass triggerPush = false for startup sync)
      const resViolations = await violationService.getActiveViolations();
      if (resViolations?.isSuccess && Array.isArray(resViolations.data)) {
        resViolations.data.forEach((v: any) => {
          const backendRefCode = v.referenceNumber || v.violationNumber || undefined;
          if (backendRefCode) {
            const exists = get().notifications.some((n) => n.referenceCode === backendRefCode);
            if (!exists) {
              get().addNotification({
                type: "overdue",
                title: "Overdue Parking Citation Active",
                subtitle: v.violationType || "Campus Parking Violation",
                body: `Active unpaid citation recorded for vehicle [${v.plateNumber}]. Fine Amount: ₱${v.penaltyFee || "0.00"}.`,
                timestamp: v.issuedAt ? new Date(v.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
                referenceCode: backendRefCode,
                vehiclePlate: v.plateNumber,
                priority: "high",
                issuer: "ParkFlow Enforcement Division",
                actionRoute: "/(settings)/violations",
                actionText: "Pay Citation",
              }, false);
            }
          }
        });
      }

      // 2. Sync live active session from backend API (pass triggerPush = false for startup sync)
      const resSession = await parkingLogService.getActiveSession();
      if (resSession?.isSuccess && resSession.data) {
        const active = resSession.data as any;
        const backendRefCode = active.referenceNumber || active.sessionNumber || undefined;
        if (active.plateNumber) {
          const exists = get().notifications.some(
            (n) => (backendRefCode && n.referenceCode === backendRefCode) || n.title === "Active Parked Session Logged"
          );
          if (!exists) {
            get().addNotification({
              type: "reminder",
              title: "Active Parked Session Logged",
              subtitle: "Currently Parked on Campus",
              body: `Vehicle [${active.plateNumber}] is currently parked at Main Entrance Parking Lot (Entry: ${active.entryTime ? new Date(active.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}).`,
              timestamp: "Live",
              referenceCode: backendRefCode,
              vehiclePlate: active.plateNumber,
              issuer: "ParkFlow Gate Entry Sensor",
              actionRoute: "/(users)/(tabs)/home",
              actionText: "View Active Pass",
            }, false);
          }
        }
      }

      // 3. Sync live COR / Schedule submission status from user profile (pass triggerPush = false for startup sync)
      const resCor = await userService.getMyCorSubmission();
      if (resCor?.isSuccess && resCor.data) {
        const cor = resCor.data as any;
        const backendRefCode = cor.referenceNumber || cor.submissionId || undefined;

        if (cor.status === 1 || cor.verificationStatus === 1) {
          // Pending Approval
          const exists = get().notifications.some(
            (n) => (backendRefCode && n.referenceCode === backendRefCode) || n.title === "COR Submission Pending Approval"
          );
          if (!exists) {
            get().addNotification({
              type: "reminder",
              title: "COR Submission Pending Approval",
              subtitle: "Under Security Admin Review",
              body: "Your Certificate of Registration (COR) and duty schedule submission have been received and are currently under review by security administration.",
              timestamp: "Pending Review",
              referenceCode: backendRefCode,
              issuer: "ParkFlow Verification Desk",
              actionRoute: "/(settings)/schedule",
              actionText: "Check Submission Status",
            }, false);
          }
        } else if (cor.status === 2 || cor.verificationStatus === 2) {
          // Verified / Approved
          const exists = get().notifications.some(
            (n) => (backendRefCode && n.referenceCode === backendRefCode) || n.title === "Schedule & COR Verified"
          );
          if (!exists) {
            get().addNotification({
              type: "approved",
              title: "Schedule & COR Verified",
              subtitle: "Pass Activated",
              body: "Your submitted Certificate of Registration (COR) and duty schedule have been verified by security administration.",
              timestamp: "Verified",
              referenceCode: backendRefCode,
              issuer: "ParkFlow Office of Safety",
              actionRoute: "/(settings)/schedule",
              actionText: "View Pass Details",
            }, false);
          }
        } else if (cor.status === 3 || cor.verificationStatus === 3) {
          // Rejected
          const exists = get().notifications.some(
            (n) => (backendRefCode && n.referenceCode === backendRefCode) || n.title === "Schedule & COR Verification Declined"
          );
          if (!exists) {
            get().addNotification({
              type: "rejected",
              title: "Schedule & COR Verification Declined",
              subtitle: "Resubmission Required",
              body: cor.rejectionReason || "Your COR document was declined by security administration. Please re-upload clear documentation.",
              timestamp: "Action Needed",
              referenceCode: backendRefCode,
              issuer: "ParkFlow Document Desk",
              actionRoute: "/(settings)/setup-schedule",
              actionText: "Resubmit COR Document",
            }, false);
          }
        }
      }
    } catch (err) {
      console.warn("[NotificationStore] Error syncing real notifications from API:", err);
    }
  },
}));
