import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Info,
  Bell,
  ChevronRight,
  ShieldAlert,
} from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  NotificationItem,
  NotificationType,
  useNotificationStore,
} from "@/features/notification/store/notification.store";
import NotificationDetailModal from "./NotificationDetailModal";

interface NotificationListProps {
  activeTab: "all" | "unread" | "approvals" | "overdue";
}

export default function NotificationList({ activeTab }: NotificationListProps) {
  const { colors, isDark } = useAppTheme();
  const {
    notifications,
    openNotificationDetail,
    hasMore,
    isLoadingMore,
    loadMoreNotifications,
  } = useNotificationStore();

  // Filter notifications based on tab selection
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return item.unread;
    if (activeTab === "approvals")
      return item.type === "approved" || item.type === "rejected" || item.type === "welcome";
    if (activeTab === "overdue")
      return item.type === "overdue" || item.type === "reminder";
    return true;
  });

  const getCategoryIcon = (type: NotificationType) => {
    switch (type) {
      case "approved":
        return (
          <View className="w-11 h-11 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 items-center justify-center border border-emerald-500/30">
            <CheckCircle2 size={22} color={isDark ? "#34D399" : "#059669"} strokeWidth={2.2} />
          </View>
        );

      case "rejected":
        return (
          <View className="w-11 h-11 rounded-full bg-red-500/15 dark:bg-red-500/20 items-center justify-center border border-red-500/30">
            <XCircle size={22} color={isDark ? "#F87171" : "#DC2626"} strokeWidth={2.2} />
          </View>
        );

      case "overdue":
        return (
          <View className="w-11 h-11 rounded-full bg-amber-500/15 dark:bg-amber-500/20 items-center justify-center border border-amber-500/30">
            <AlertTriangle size={22} color={isDark ? "#FBBF24" : "#D97706"} strokeWidth={2.2} />
          </View>
        );

      case "welcome":
        return (
          <View className="w-11 h-11 rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 items-center justify-center border border-indigo-500/30">
            <Sparkles size={22} color={isDark ? "#818CF8" : "#4F46E5"} strokeWidth={2.2} />
          </View>
        );

      case "reminder":
        return (
          <View className="w-11 h-11 rounded-full bg-sky-500/15 dark:bg-sky-500/20 items-center justify-center border border-sky-500/30">
            <Clock size={22} color={isDark ? "#38BDF8" : "#0284C7"} strokeWidth={2.2} />
          </View>
        );

      case "system":
      default:
        return (
          <View className="w-11 h-11 rounded-full bg-slate-500/15 dark:bg-slate-500/20 items-center justify-center border border-slate-500/30">
            <Info size={22} color={isDark ? "#CBD5E1" : "#475569"} strokeWidth={2.2} />
          </View>
        );
    }
  };

  const getPillBadge = (type: NotificationType, priority?: string) => {
    if (priority === "high" || type === "overdue") {
      return (
        <View className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 flex-row items-center gap-1">
          <ShieldAlert size={10} color={isDark ? "#FBBF24" : "#D97706"} />
          <Text className="text-[9.5px] font-bold uppercase text-amber-600 dark:text-amber-400">
            URGENT ALERT
          </Text>
        </View>
      );
    }

    switch (type) {
      case "approved":
        return (
          <View className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
            <Text className="text-[9.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
              APPROVED
            </Text>
          </View>
        );
      case "rejected":
        return (
          <View className="px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30">
            <Text className="text-[9.5px] font-bold uppercase text-red-600 dark:text-red-400">
              ACTION NEEDED
            </Text>
          </View>
        );
      case "welcome":
        return (
          <View className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30">
            <Text className="text-[9.5px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
              WELCOME
            </Text>
          </View>
        );
      case "reminder":
        return (
          <View className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30">
            <Text className="text-[9.5px] font-bold uppercase text-sky-600 dark:text-sky-400">
              REMINDER
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (filteredNotifications.length === 0) {
    return (
      <View
        style={{ flex: 1, flexGrow: 1, justifyContent: "center", alignItems: "center" }}
        className="flex-1 justify-center items-center py-20 px-6"
      >
        <Bell size={42} color={colors.muted} strokeWidth={1.5} />
        <Text className="font-bold text-[16px] text-light-text dark:text-dark-text mt-3.5 mb-1.5 text-center">
          No Notifications Found
        </Text>
        <Text className="font-regular text-[13px] text-light-muted dark:text-dark-muted text-center max-w-[260px] leading-relaxed">
          Your alert log is currently clear under this tab filter.
        </Text>
        <NotificationDetailModal />
      </View>
    );
  }

  return (
    <View className="gap-3">
      {filteredNotifications.map((notif) => (
          <TouchableOpacity
            key={notif.id}
            activeOpacity={0.75}
            onPress={() => openNotificationDetail(notif)}
            className={`rounded-2xl border p-4 flex-row gap-3.5 shadow-soft relative overflow-hidden ${
              notif.unread
                ? "bg-light-surface dark:bg-dark-surface border-blue-500/40 dark:border-blue-500/40"
                : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border opacity-90"
            }`}
          >
            {/* Unread Left Border Accent */}
            {notif.unread && (
              <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl" />
            )}

            {/* Icon Column */}
            <View className="mt-0.5">{getCategoryIcon(notif.type)}</View>

            {/* Content Column */}
            <View className="flex-1 justify-center">
              {/* Header row with badges */}
              <View className="flex-row items-center justify-between mb-1 gap-2">
                <View className="flex-row items-center gap-1.5 flex-wrap flex-1">
                  {getPillBadge(notif.type, notif.priority)}
                  {notif.vehiclePlate && (
                    <View className="px-1.5 py-0.5 rounded bg-light-surfaceMuted dark:bg-dark-surfaceMuted border border-light-border dark:border-dark-border">
                      <Text className="text-[9px] font-bold text-light-primary dark:text-dark-primary font-mono">
                        {notif.vehiclePlate}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Unread Dot */}
                {notif.unread && (
                  <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                )}
              </View>

              {/* Title */}
              <Text className="text-[13.5px] font-bold text-light-text dark:text-dark-text mb-0.5 leading-snug">
                {notif.title}
              </Text>

              {/* Body summary */}
              <Text
                className="text-light-muted dark:text-dark-muted font-regular text-[11.5px] leading-relaxed"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {notif.body}
              </Text>

              {/* Footer Timestamp */}
              <View className="flex-row items-center justify-between mt-2 pt-1 border-t border-light-border/40 dark:border-dark-border/30">
                <Text className="text-light-muted/70 dark:text-dark-muted/70 font-medium text-[10px]">
                  {notif.date} • {notif.timestamp}
                </Text>

                <View className="flex-row items-center gap-0.5">
                  <Text className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400">
                    Details
                  </Text>
                  <ChevronRight size={13} color="#3B82F6" strokeWidth={2.2} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      }

      {/* Load More Pagination */}
      {hasMore && (
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={isLoadingMore}
          onPress={() => loadMoreNotifications()}
          className="w-full py-3.5 mt-2 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex-row items-center justify-center gap-2"
        >
          {isLoadingMore ? (
            <>
              <ActivityIndicator size="small" color={isDark ? "#93C5FD" : "#2563EB"} />
              <Text className="text-[12px] font-bold text-blue-600 dark:text-blue-400">
                Loading more notifications...
              </Text>
            </>
          ) : (
            <Text className="text-[11.5px] font-bold text-light-text dark:text-dark-text uppercase tracking-wider">
              Load More Notifications
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Global Notification Detail Modal */}
      <NotificationDetailModal />
    </View>
  );
}
