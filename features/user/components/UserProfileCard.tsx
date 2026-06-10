import { Check } from "lucide-react-native";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useHistoryStore } from "@/features/history/store/history.store";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Image, Text, View } from "react-native";

export default function UserProfileCard() {
  const { colors } = useAppTheme();
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
            className="w-12 h-12 rounded-full overflow-hidden bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center border border-light-border dark:border-dark-border"
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
                  color: colors.primary,
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
              className="text-light-muted dark:text-dark-muted font-regular"
              style={{ fontSize: 13, lineHeight: 16 }}
            >
              {greeting},
            </Text>
            <Text
              className="text-light-text dark:text-dark-text font-black tracking-tight"
              style={{ fontSize: 16, lineHeight: 20, marginTop: 1 }}
              numberOfLines={1}
            >
              {fullName}
            </Text>
          </View>
        </View>

        {/* ── Right: Verification Status Badge ── */}
        {(() => {
          if (user?.profileType === "guard") {
            return (
              <View className="flex-row items-center gap-1.5">
                <View className="w-3.5 h-3.5 rounded-full bg-light-success dark:bg-dark-success items-center justify-center">
                  <Check size={8} color="#FFF" strokeWidth={4} />
                </View>
                <Text className="text-light-success dark:text-dark-success font-heavy text-[9px] uppercase tracking-wider">
                  Verified
                </Text>
              </View>
            );
          }

          const status = user?.corVerificationStatus;
          if (status === 2) {
            return (
              <View className="flex-row items-center gap-1.5">
                <View className="w-3.5 h-3.5 rounded-full bg-light-success dark:bg-dark-success items-center justify-center">
                  <Check size={8} color="#FFF" strokeWidth={4} />
                </View>
                <Text className="text-light-success dark:text-dark-success font-heavy text-[9px] uppercase tracking-wider">
                  Verified
                </Text>
              </View>
            );
          } else if (status === 1) {
            return (
              <View className="flex-row items-center gap-1.5">
                <View className="w-3.5 h-3.5 rounded-full bg-light-warning dark:bg-dark-warning items-center justify-center">
                  <Check size={8} color="#FFF" strokeWidth={4} />
                </View>
                <Text className="text-light-warning dark:text-dark-warning font-heavy text-[9px] uppercase tracking-wider">
                  Pending
                </Text>
              </View>
            );
          } else if (status === 3) {
            return (
              <View className="flex-row items-center gap-1.5">
                <View className="w-3.5 h-3.5 rounded-full bg-light-danger dark:bg-dark-danger items-center justify-center">
                  <Check size={8} color="#FFF" strokeWidth={4} />
                </View>
                <Text className="text-light-danger dark:text-dark-danger font-heavy text-[9px] uppercase tracking-wider">
                  Rejected
                </Text>
              </View>
            );
          } else {
            return (
              <View className="flex-row items-center gap-1.5">
                <View className="w-3.5 h-3.5 rounded-full bg-light-muted dark:bg-dark-muted items-center justify-center">
                  <Check size={8} color="#FFF" strokeWidth={4} />
                </View>
                <Text className="text-light-muted dark:text-dark-muted font-heavy text-[9px] uppercase tracking-wider">
                  Unverified
                </Text>
              </View>
            );
          }
        })()}
      </View>
    </View>
  );
}
