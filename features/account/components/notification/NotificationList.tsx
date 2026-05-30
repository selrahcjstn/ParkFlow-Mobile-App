import { AlertTriangle, Bell, CheckSquare, Info } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  category: "system" | "security" | "activity";
  unread: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Schedule Verified Successfully",
    body: "Your weekly duty schedule updates and COR document have been approved by the admin. Grace entry details are active.",
    time: "2 hours ago",
    category: "activity",
    unread: true,
  },
  {
    id: "2",
    title: "Account Login Detected",
    body: "A new login was detected on a Windows Chrome environment at 10:14 AM. If this wasn't you, reset your password.",
    time: "1 day ago",
    category: "security",
    unread: false,
  },
  {
    id: "3",
    title: "Monthly Parking Summary",
    body: "Your comprehensive parking logs and duration usage summary report for April 2026 is now ready to download.",
    time: "3 days ago",
    category: "system",
    unread: false,
  },
  {
    id: "4",
    title: "System Maintenance Alert",
    body: "ParkFlow campus database registers will undergo routine service optimization on Sunday, 2:00 AM - 4:00 AM.",
    time: "5 days ago",
    category: "system",
    unread: false,
  },
];

interface NotificationListProps {
  activeTab: "all" | "system" | "activity";
}

export default function NotificationList({ activeTab }: NotificationListProps) {
  const { colors } = useAppTheme();

  // Filter notifications based on tab selection
  const filteredNotifications = MOCK_NOTIFICATIONS.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "system") return item.category === "system";
    if (activeTab === "activity")
      return item.category === "activity" || item.category === "security";
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "system":
        return (
          <View className="w-11 h-11 rounded-full bg-light-accent/10 dark:bg-dark-accent/15 items-center justify-center">
            <Info size={20} color={colors.accent} strokeWidth={2.2} />
          </View>
        );
      case "security":
        return (
          <View className="w-11 h-11 rounded-full bg-light-danger/10 dark:bg-dark-danger/15 items-center justify-center">
            <AlertTriangle size={20} color={colors.danger} strokeWidth={2.2} />
          </View>
        );
      case "activity":
      default:
        return (
          <View className="w-11 h-11 rounded-full bg-light-success/10 dark:bg-dark-success/15 items-center justify-center">
            <CheckSquare size={20} color={colors.success} strokeWidth={2.2} />
          </View>
        );
    }
  };

  return (
    <View className="gap-3">
      {filteredNotifications.length === 0 ? (
        <View className="py-14 items-center justify-center px-6 border border-dashed border-light-border dark:border-dark-border rounded-card bg-light-surface dark:bg-dark-surface shadow-soft">
          <Bell size={24} color={colors.muted} strokeWidth={1.5} />
          <Text className="font-heavy text-sm text-light-text dark:text-dark-text mt-2.5 mb-1">
            No Notifications Found
          </Text>
          <Text className="font-regular text-xs text-light-muted dark:text-dark-muted text-center">
            Your filtered alerts history is empty.
          </Text>
        </View>
      ) : (
        filteredNotifications.map((notif) => (
          <View
            key={notif.id}
            className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 flex-row gap-3.5 shadow-soft"
          >
            {/* Icon Column */}
            <View className="mt-0.5">{getCategoryIcon(notif.category)}</View>

            {/* Content Column */}
            <View className="flex-1 justify-center">
              <Text className="text-[13.5px] font-black text-light-text dark:text-dark-text mb-0.5">
                {notif.title}
              </Text>
              <Text
                className="text-light-muted dark:text-dark-muted font-regular text-[11.5px] leading-normal"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {notif.body}
              </Text>
              <Text className="text-light-muted/70 dark:text-dark-muted/70 font-book text-[9.5px] mt-1.5">
                {notif.time}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
