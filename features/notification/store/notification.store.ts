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

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-overdue-1",
    type: "overdue",
    title: "Overdue Parking Duration Alert!",
    subtitle: "Exceeded Max Campus Allowance",
    body: "DAILY REMINDER & URGENT WARNING: Vehicle [ABC 1234] has remained parked at Main Entrance Parking Lot for over 8 consecutive hours, exceeding standard campus allowance. Please relocate your vehicle immediately to avoid citations.",
    timestamp: "Just now",
    date: "Today, 05:10 PM",
    unread: true,
    referenceCode: "OVD-9921-LOT",
    vehiclePlate: "ABC 1234",
    priority: "high",
    issuer: "ParkFlow Gate Patrol & Safety",
    actionRoute: "/(settings)/violations",
    actionText: "View Active Violation",
  },
  {
    id: "notif-approved-1",
    type: "approved",
    title: "Schedule & Access Approved",
    subtitle: "Weekly Parking Pass Verified",
    body: "Your weekly parking schedule application and COR document have been verified and approved by ParkFlow Security Admin. Your gate entry QR pass is now active for all scheduled campus hours.",
    timestamp: "2 hours ago",
    date: "Today, 03:15 PM",
    unread: true,
    referenceCode: "SCH-2026-8902",
    issuer: "ParkFlow Office of Security & Safety",
    actionRoute: "/(settings)/schedule",
    actionText: "View Active Schedule",
  },
  {
    id: "notif-rejected-1",
    type: "rejected",
    title: "Vehicle Document Resubmission Required",
    subtitle: "OR/CR Photo Declined",
    body: "Your uploaded Official Receipt / Certificate of Registration (OR/CR) photo was unreadable or missing clarity. Please re-upload a clear high-resolution photo or PDF to re-trigger verification.",
    timestamp: "Yesterday",
    date: "Yesterday, 04:30 PM",
    unread: true,
    referenceCode: "VEH-2026-4410",
    vehiclePlate: "ABC 1234",
    issuer: "ParkFlow Verification Desk",
    actionRoute: "/(settings)/vehicle",
    actionText: "Resubmit Vehicle Documents",
  },
  {
    id: "notif-reminder-1",
    type: "reminder",
    title: "Daily Parking Duty Reminder",
    subtitle: "Active Schedule Window Today",
    body: "Good morning! You have an active parking window scheduled for today (07:00 AM - 05:00 PM). Ensure your vehicle QR code is ready for scanning at the entry gate sensor.",
    timestamp: "7:00 AM",
    date: "Today, 07:00 AM",
    unread: false,
    referenceCode: "REM-2026-0906",
    issuer: "ParkFlow Automated Alert System",
    actionRoute: "/(settings)/schedule",
    actionText: "View Gate QR Pass",
  },
  {
    id: "notif-welcome-1",
    type: "welcome",
    title: "Welcome to ParkFlow System!",
    subtitle: "Account Ready & Security Pass Active",
    body: "Welcome to ParkFlow! Your account has been initialized. You can now register vehicles, submit weekly schedules, view active entry passes, and receive real-time campus parking alerts.",
    timestamp: "2 days ago",
    date: "04 Sep 2026",
    unread: false,
    issuer: "ParkFlow Administration",
    actionText: "Explore Features",
  },
  {
    id: "notif-system-1",
    type: "system",
    title: "System Maintenance Notice",
    subtitle: "Routine Security Optimization",
    body: "ParkFlow campus database registers will undergo routine service optimization on Sunday between 02:00 AM and 04:00 AM. Entry sensors will remain operational in offline fallback mode.",
    timestamp: "3 days ago",
    date: "03 Sep 2026",
    unread: false,
    issuer: "ParkFlow IT Operations",
  },
];

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
        if (cor.status === 2 || cor.verificationStatus === 2) {
          // Verified / Approved
          const refCode = `COR-VERIFIED-${cor.id || "PASSED"}`;
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
          const refCode = `COR-REJECTED-${cor.id || "DECLINED"}`;
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
