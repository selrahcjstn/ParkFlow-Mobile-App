import { create } from "zustand";
import {
  registerViolationListener,
  registerExitResponseListener,
  registerParkingSessionListener,
  registerPaymentProcessedListener,
} from "@/services/signalr";
import { violationService } from "@/features/violation/services/violation.service";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { userService } from "@/features/user/services/user.service";

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
  addNotification: (notification: Omit<NotificationItem, "id" | "date" | "unread">) => void;
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
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n
      ),
      selectedNotification:
        state.selectedNotification?.id === id
          ? { ...state.selectedNotification, unread: false }
          : state.selectedNotification,
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, unread: false })),
      selectedNotification: state.selectedNotification
        ? { ...state.selectedNotification, unread: false }
        : null,
    })),

  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      isDetailOpen:
        state.selectedNotification?.id === id ? false : state.isDetailOpen,
      selectedNotification:
        state.selectedNotification?.id === id ? null : state.selectedNotification,
    })),

  addNotification: (notif) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-real-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: "Just now",
      unread: true,
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => n.unread).length;
  },

  initRealtimeListeners: () => {
    if (get().isSignalRSubscribed) return () => {};
    set({ isSignalRSubscribed: true });

    // 1. Listen for real-time violations / overdue parking alerts
    const unSubViolation = registerViolationListener((data: any) => {
      console.log("[NotificationStore] Real-time violation alert received:", data);
      get().addNotification({
        type: "overdue",
        title: "Overdue Parking Duration Alert!",
        subtitle: data?.violationType || "Campus Parking Allowance Exceeded",
        body: `Vehicle [${data?.plateNumber || data?.PlateNumber || "Registered"}] has exceeded maximum campus parking time allowance at Main Entrance Parking Lot. Please move vehicle immediately.`,
        timestamp: "Just now",
        referenceCode: data?.referenceNumber || data?.ReferenceNumber || `OVD-${Date.now().toString().slice(-4)}`,
        vehiclePlate: data?.plateNumber || data?.PlateNumber,
        priority: "high",
        issuer: "ParkFlow Gate Patrol & Safety",
        actionRoute: "/(settings)/violations",
        actionText: "View Active Violation",
      });
    });

    // 2. Listen for exit response
    const unSubExit = registerExitResponseListener((data: any) => {
      console.log("[NotificationStore] Real-time exit response received:", data);
      get().addNotification({
        type: "approved",
        title: "Vehicle Exit Confirmed",
        subtitle: "Campus Parking Pass Completed",
        body: `Vehicle [${data?.plateNumber || "Registered"}] has successfully logged exit at ${data?.locationName || "Main Entrance Parking Lot"}.`,
        timestamp: "Just now",
        referenceCode: `EXT-${Date.now().toString().slice(-4)}`,
        vehiclePlate: data?.plateNumber,
        issuer: "ParkFlow Gate Operations",
        actionRoute: "/(users)/(tabs)/history",
        actionText: "View History Logs",
      });
    });

    // 3. Listen for parking session updates
    const unSubSession = registerParkingSessionListener((data: any) => {
      console.log("[NotificationStore] Real-time parking session updated:", data);
      if (data?.status === "Active" || data?.entryTime) {
        get().addNotification({
          type: "reminder",
          title: "Parked Session Active",
          subtitle: "Vehicle Entry Recorded",
          body: `Vehicle [${data?.plateNumber || "Registered"}] entered Main Entrance Parking Lot. Daily duty QR pass logged.`,
          timestamp: "Just now",
          referenceCode: `ENT-${Date.now().toString().slice(-4)}`,
          vehiclePlate: data?.plateNumber,
          issuer: "ParkFlow Gate Sensor",
          actionRoute: "/(users)/(tabs)/home",
          actionText: "View Session Status",
        });
      }
    });

    // 4. Listen for payment processed
    const unSubPayment = registerPaymentProcessedListener((data: any) => {
      console.log("[NotificationStore] Real-time payment processed:", data);
      get().addNotification({
        type: "approved",
        title: "Violation Citation Paid",
        subtitle: "Account Status Cleared",
        body: `Payment of ₱${data?.amount || "0.00"} for citation [${data?.referenceNumber || "Violation"}] was processed successfully. Clearance verified.`,
        timestamp: "Just now",
        referenceCode: data?.referenceNumber || `PAY-${Date.now().toString().slice(-4)}`,
        issuer: "ParkFlow Financial Desk",
        actionRoute: "/(settings)/violations",
        actionText: "View Violations History",
      });
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
      // 1. Sync live active violations from backend API
      const resViolations = await violationService.getActiveViolations();
      if (resViolations?.isSuccess && Array.isArray(resViolations.data)) {
        resViolations.data.forEach((v: any) => {
          const refCode = v.referenceNumber || v.violationId || "VIOLATION-ACTIVE";
          const exists = get().notifications.some((n) => n.referenceCode === refCode);
          if (!exists) {
            get().addNotification({
              type: "overdue",
              title: "Overdue Parking Citation Active",
              subtitle: v.violationType || "Campus Parking Violation",
              body: `Active unpaid citation recorded for vehicle [${v.plateNumber}]. Fine Amount: ₱${v.penaltyFee || "0.00"}.`,
              timestamp: v.issuedAt ? new Date(v.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
              referenceCode: refCode,
              vehiclePlate: v.plateNumber,
              priority: "high",
              issuer: "ParkFlow Enforcement Division",
              actionRoute: "/(settings)/violations",
              actionText: "Pay Citation",
            });
          }
        });
      }

      // 2. Sync live active session from backend API
      const resSession = await parkingLogService.getActiveSession();
      if (resSession?.isSuccess && resSession.data) {
        const active = resSession.data;
        const refCode = `SESS-${active.plateNumber}-${active.entryTime}`;
        const exists = get().notifications.some((n) => n.referenceCode === refCode);
        if (!exists && active.plateNumber) {
          get().addNotification({
            type: "reminder",
            title: "Active Parked Session Logged",
            subtitle: "Currently Parked on Campus",
            body: `Vehicle [${active.plateNumber}] is currently parked at Main Entrance Parking Lot (Entry: ${active.entryTime ? new Date(active.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}).`,
            timestamp: "Live",
            referenceCode: refCode,
            vehiclePlate: active.plateNumber,
            issuer: "ParkFlow Gate Entry Sensor",
            actionRoute: "/(users)/(tabs)/home",
            actionText: "View Active Pass",
          });
        }
      }

      // 3. Sync live COR / Schedule submission status from user profile
      const resCor = await userService.getMyCorSubmission();
      if (resCor?.isSuccess && resCor.data) {
        const cor = resCor.data as any;
        const rawId = (cor.id || cor.submissionId || "PASSED").toString().replace(/-/g, "");
        const shortId = rawId.slice(0, 8).toUpperCase();

        if (cor.status === 2 || cor.verificationStatus === 2) {
          // Verified / Approved
          const refCode = `SCH-${shortId}`;
          const exists = get().notifications.some((n) => n.referenceCode === refCode);
          if (!exists) {
            get().addNotification({
              type: "approved",
              title: "Schedule & COR Verified",
              subtitle: "Pass Activated",
              body: "Your submitted Certificate of Registration (COR) and duty schedule have been verified by security administration.",
              timestamp: "Verified",
              referenceCode: refCode,
              issuer: "ParkFlow Office of Safety",
              actionRoute: "/(settings)/schedule",
              actionText: "View Pass Details",
            });
          }
        } else if (cor.status === 3 || cor.verificationStatus === 3) {
          // Rejected
          const refCode = `SCH-${shortId}-REJ`;
          const exists = get().notifications.some((n) => n.referenceCode === refCode);
          if (!exists) {
            get().addNotification({
              type: "rejected",
              title: "Schedule & COR Verification Declined",
              subtitle: "Resubmission Required",
              body: cor.rejectionReason || "Your COR document was declined by security administration. Please re-upload clear documentation.",
              timestamp: "Action Needed",
              referenceCode: refCode,
              issuer: "ParkFlow Document Desk",
              actionRoute: "/(settings)/setup-schedule",
              actionText: "Resubmit COR Document",
            });
          }
        }
      }
    } catch (err) {
      console.warn("[NotificationStore] Error syncing real notifications from API:", err);
    }
  },
}));
