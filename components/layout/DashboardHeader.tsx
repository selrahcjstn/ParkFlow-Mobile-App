import { Text, TouchableOpacity, View } from "react-native";
import { Bell, LogOut } from "lucide-react-native";

interface DashboardHeaderProps {
  /** Brand name shown at the top */
  title?: string;
  /** Callback fired when the notification bell is pressed */
  onNotificationPress?: () => void;
  /** Callback fired when the logout icon is pressed */
  onLogoutPress?: () => void;
  /** Whether to show a badge dot on the notification bell */
  hasNotification?: boolean;
}

/**
 * Top header bar for authenticated dashboard screens.
 * Displays the brand name centred between a notification bell and logout icon.
 */
export default function DashboardHeader({
  title = "ParkFlow",
  onNotificationPress,
  onLogoutPress,
  hasNotification = false,
}: DashboardHeaderProps) {
  return (
    <View className="bg-light-primary flex-row items-center justify-between px-5 pt-3 pb-4">
      {/* Brand */}
      <Text className="text-white text-xl font-extrabold tracking-wider italic">
        {title}
      </Text>

      {/* Right-side actions */}
      <View className="flex-row items-center gap-4">
        {/* Notification bell */}
        <TouchableOpacity
          onPress={onNotificationPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View>
            <Bell size={22} color="#FFFFFF" strokeWidth={2} />
            {hasNotification && (
              <View className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-light-warning border border-white" />
            )}
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={onLogoutPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <LogOut size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
