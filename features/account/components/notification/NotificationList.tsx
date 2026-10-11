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
} from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  NotificationType,
  useNotificationStore,
} from "@/features/notification/store/notification.store";
import NotificationDetailModal from "./NotificationDetailModal";

interface NotificationListProps {
  activeTab: "all" | "unread" | "approvals" | "overdue";
}

export default function NotificationList({ activeTab }: NotificationListProps) {
  const { colors } = useAppTheme();
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
          <View className="w-10 h-10 rounded-full bg-light-success/15 dark:bg-dark-success/20 items-center justify-center border border-light-success/30 dark:border-dark-success/30">
            <CheckCircle2 size={20} color={colors.success} strokeWidth={2.2} />
          </View>
        );

      case "rejected":
        return (
          <View className="w-10 h-10 rounded-full bg-light-danger/15 dark:bg-dark-danger/20 items-center justify-center border border-light-danger/30 dark:border-dark-danger/30">
            <XCircle size={20} color={colors.danger} strokeWidth={2.2} />
          </View>
        );

      case "overdue":
        return (
          <View className="w-10 h-10 rounded-full bg-light-warning/15 dark:bg-dark-warning/20 items-center justify-center border border-light-warning/30 dark:border-dark-warning/30">
            <AlertTriangle size={20} color={colors.warning} strokeWidth={2.2} />
          </View>
        );

      case "welcome":
        return (
          <View className="w-10 h-10 rounded-full bg-light-primary/15 dark:bg-dark-primary/20 items-center justify-center border border-light-primary/30 dark:border-dark-primary/30">
            <Sparkles size={20} color={colors.primary} strokeWidth={2.2} />
          </View>
        );

      case "reminder":
        return (
          <View className="w-10 h-10 rounded-full bg-light-primary/15 dark:bg-dark-primary/20 items-center justify-center border border-light-primary/30 dark:border-dark-primary/30">
            <Clock size={20} color={colors.primary} strokeWidth={2.2} />
          </View>
        );

      case "system":
      default:
        return (
          <View className="w-10 h-10 rounded-full bg-slate-500/15 dark:bg-slate-500/20 items-center justify-center border border-slate-500/30">
            <Info size={20} color={colors.text} strokeWidth={2.2} />
          </View>
        );
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
          className={`rounded-2xl border p-4 flex-row gap-3.5 relative overflow-hidden ${
            notif.unread
              ? "bg-light-surface dark:bg-dark-surface border-light-primary/40 dark:border-dark-primary/40"
              : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border opacity-90"
          }`}
        >
          {/* Unread Left Border Accent */}
          {notif.unread && (
            <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-light-primary dark:bg-dark-primary rounded-l-2xl" />
          )}

          {/* Icon Column */}
          <View className="mt-0.5">{getCategoryIcon(notif.type)}</View>

          {/* Content Column */}
          <View className="flex-1 justify-center">
            {/* Header row: Title + Plate tag + Unread dot */}
            <View className="flex-row items-start justify-between mb-1 gap-2">
              <View className="flex-1 flex-row items-center gap-1.5 flex-wrap">
                <Text className="text-[13.5px] font-bold text-light-text dark:text-dark-text leading-snug">
                  {notif.title}
                </Text>
                {Boolean(notif.vehiclePlate) && (
                  <View className="px-1.5 py-0.5 rounded bg-light-surfaceMuted dark:bg-dark-surfaceMuted border border-light-border dark:border-dark-border">
                    <Text className="text-[9px] font-bold text-light-primary dark:text-dark-primary font-mono">
                      {notif.vehiclePlate}
                    </Text>
                  </View>
                )}
              </View>

              {/* Unread Dot */}
              {notif.unread && (
                <View className="w-2.5 h-2.5 rounded-full bg-light-primary dark:bg-dark-primary mt-1" />
              )}
            </View>

            {/* Body summary */}
            <Text
              className="text-light-muted dark:text-dark-muted font-regular text-[11.5px] leading-relaxed mb-2"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {notif.body}
            </Text>

            {/* Footer Timestamp & Detail Action */}
            <View className="flex-row items-center justify-between pt-1.5 border-t border-light-border/40 dark:border-dark-border/30">
              <Text className="text-light-muted/70 dark:text-dark-muted/70 font-medium text-[10px]">
                {notif.date} • {notif.timestamp}
              </Text>

              <View className="flex-row items-center gap-0.5">
                <Text className="text-[10.5px] font-bold text-light-primary dark:text-dark-primary">
                  Details
                </Text>
                <ChevronRight size={13} color={colors.primary} strokeWidth={2.2} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}

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
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-[12px] font-bold text-light-primary dark:text-dark-primary">
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
