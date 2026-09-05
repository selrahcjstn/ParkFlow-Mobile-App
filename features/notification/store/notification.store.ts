import { create } from "zustand";

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

  // Actions
  selectNotification: (notification: NotificationItem | null) => void;
  openNotificationDetail: (notification: NotificationItem) => void;
  closeNotificationDetail: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<NotificationItem, "id" | "date" | "unread">) => void;
  getUnreadCount: () => number;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-overdue-1",
    type: "overdue",
    title: "Overdue Parking Duration Alert!",
    subtitle: "Exceeded Max Campus Allowance",
    body: "DAILY REMINDER & URGENT WARNING: Vehicle [ABC 1234] has remained parked at Main Entrance Plaza for over 8 consecutive hours, exceeding standard campus allowance. Please relocate your vehicle immediately to avoid citations.",
    timestamp: "Just now",
    date: "Today, 05:10 PM",
    unread: true,
    referenceCode: "OVD-9921-PLAZA",
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

  selectNotification: (notification) =>
    set({ selectedNotification: notification }),

  openNotificationDetail: (notification) => {
    // Automatically mark as read when opened
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
      id: `notif-custom-${Date.now()}`,
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
}));
