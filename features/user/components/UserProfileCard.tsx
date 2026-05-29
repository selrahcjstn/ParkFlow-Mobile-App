import { useAuthStore } from "@/features/auth/store/auth.store";
import { useHistoryStore } from "@/features/history/store/history.store";
import { Image, Text, View } from "react-native";

export default function UserProfileCard() {
  const user = useAuthStore((s) => s.user);
  const profilePictureUrl = useAuthStore((s) => s.profilePictureUrl);
  const fullName = user?.name || "Guest User";

  // Derive initials from name as fallback
  const initials = (() => {
    if (!user?.name) return "PF";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0]?.toUpperCase() || "PF";
  })();

  // Dynamic greeting based on parking logs in history
  const { parkingHistory } = useHistoryStore();
  const isFirstTime = parkingHistory.length === 0;
  const greeting = isFirstTime ? "Welcome" : "Welcome back";

  return (
    <View className="pb-0">
      <View className="flex-row items-center justify-between">
        {/* ── Left: Avatar + Greeting & Name ── */}
        <View className="flex-row items-center gap-x-3.5 flex-1 pr-4">
          {/* Avatar */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: "#F4F4F5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profilePictureUrl ? (
              <Image
                source={{ uri: profilePictureUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "900",
                  color: "#D22730",
                  letterSpacing: 1,
                }}
              >
                {initials}
              </Text>
            )}
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
      </View>
    </View>
  );
}
