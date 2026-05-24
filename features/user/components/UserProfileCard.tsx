import { useAuthStore } from "@/features/auth/store/auth.store";
import { useHistoryStore } from "@/features/history/store/history.store";
import { Bell } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function UserProfileCard() {
  const user = useAuthStore((s) => s.user);
  const fullName = user?.name || "Guest User";
  const profileImageUrl = "https://i.pravatar.cc/150?img=11";

  // Dynamic greeting based on parking logs in history
  const { parkingHistory } = useHistoryStore();
  const isFirstTime = parkingHistory.length === 0;
  const greeting = isFirstTime ? "Welcome" : "Welcome back";

  return (
    <View className="pb-0">
      <View className="flex-row items-center justify-between">
        {/* ── Left: Avatar + Greeting & Name ── */}
        <View className="flex-row items-center gap-x-3.5 flex-1 pr-4">
          {/* Avatar — border removed */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: "#F4F4F5",
            }}
          >
            <Image
              source={{ uri: profileImageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>

          {/* Greeting & Name */}
          <View className="justify-center flex-1">
            <Text
              className="text-light-muted font-regular"
              style={{ fontSize: 13, lineHeight: 16 }}
            >
              {greeting},
            </Text>
            <Text
              className="text-light-text font-black tracking-tight"
              style={{ fontSize: 16, lineHeight: 20, marginTop: 1 }}
              numberOfLines={1}
            >
              {fullName}
            </Text>
          </View>
        </View>

        {/* ── Right: Bell icon with solid surface background ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-10 h-10 rounded-2xl bg-light-surface items-center justify-center"
        >
          <Bell size={18} className="text-light-text" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
