import { AlertTriangle, Bell, CheckSquare, Info } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

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
    title: "Security Scan Alert",
    body: "An entry attempt was recorded using an inactive secondary vehicle plate (XYZ-7890). Permissions are only active for your primary vehicle.",
    time: "1 day ago",
    category: "security",
    unread: true,
  },
  {
    id: "3",
    title: "System Maintenance Notice",
    body: "ParkFlow campus databases will undergo security patching on Sunday at 02:00 AM. Mobile app services will remain fully online.",
    time: "2 days ago",
    category: "system",
    unread: false,
  },
  {
    id: "4",
    title: "New Vehicle Verified",
    body: "Your vehicle Toyota Vios (ABC-1234) has been added to your account center and set as your primary active vehicle.",
    time: "4 days ago",
    category: "activity",
    unread: false,
  },
];

interface NotificationListProps {
  activeTab: "all" | "system" | "activity";
}

export default function NotificationList({ activeTab }: NotificationListProps) {
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
          <View className="w-8 h-8 rounded-full bg-light-accent/10 items-center justify-center">
            <Info size={15} color="#D22730" strokeWidth={2.2} />
          </View>
        );
      case "security":
        return (
          <View className="w-8 h-8 rounded-full bg-light-danger/10 items-center justify-center">
            <AlertTriangle size={15} color="#EF4444" strokeWidth={2.2} />
          </View>
        );
      case "activity":
      default:
        return (
          <View className="w-8 h-8 rounded-full bg-light-success/10 items-center justify-center">
            <CheckSquare size={15} color="#10B981" strokeWidth={2.2} />
          </View>
        );
    }
  };

  return (
    <View className="gap-3">
      {filteredNotifications.length === 0 ? (
        <View className="py-14 items-center justify-center px-6 border border-dashed border-light-border rounded-card bg-light-surface shadow-soft">
          <Bell size={24} color="#71717A" strokeWidth={1.5} />
          <Text className="font-heavy text-sm text-light-text mt-2.5 mb-1">
            No Notifications Found
          </Text>
          <Text className="font-regular text-xs text-light-muted text-center">
            Your filtered alerts history is empty.
          </Text>
        </View>
      ) : (
        filteredNotifications.map((notif) => (
          <View
            key={notif.id}
            className={`bg-light-surface rounded-card border ${
              notif.unread ? "border-light-primary/30" : "border-light-border/40"
            } p-4.5 flex-row gap-3.5 shadow-soft relative overflow-hidden`}
          >
            {/* Unread strip indicator */}
            {notif.unread && (
              <View className="absolute left-0 top-0 bottom-0 w-[3px] bg-light-primary" />
            )}

            {/* Icon Column */}
            <View className="mt-0.5">{getCategoryIcon(notif.category)}</View>

            {/* Content Column */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between gap-1 mb-1">
                <Text
                  className={`text-[13px] flex-1 leading-tight ${
                    notif.unread ? "font-black text-light-text" : "font-heavy text-light-text/80"
                  }`}
                  numberOfLines={1}
                >
                  {notif.title}
                </Text>
                <Text className="text-light-muted font-regular text-[10px]">
                  {notif.time}
                </Text>
              </View>
              <Text className="text-light-muted font-regular text-[11.5px] leading-relaxed">
                {notif.body}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
