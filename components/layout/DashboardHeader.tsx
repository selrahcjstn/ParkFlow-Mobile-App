import { Title } from "@/components/ui/Typography";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { Bell, LogOut } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

interface DashboardHeaderProps {
  title?: string;
  onNotificationPress?: () => void;
  hasNotification?: boolean;
}

export default function DashboardHeader({
  title = "ParkFlow",
  onNotificationPress,
  hasNotification = false,
}: DashboardHeaderProps) {
  const logout = useAuthStore((s) => s.logout);

  function handleLogoutPress() {
    logout();
    router.replace("/(auth)/login");
  }

  return (
    <View className="bg-light-primary flex-row items-center justify-between px-5 pt-3">
      <Title className="text-white text-xl tracking-wider">{title}</Title>

      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={onNotificationPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View>
            <Bell size={22} color="#FFFFFF" strokeWidth={2} />
            {hasNotification ? (
              <View className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-light-warning border border-white" />
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogoutPress}>
          <LogOut size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
