import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuthStore";
import { Image, View } from "react-native";

export default function UserProfileCard() {
  const user = useAuthStore((s) => s.user);
  const fullName = user?.name || "Guest User";
  const role = user?.profileType || "Student";
  const profileImageUrl = "https://i.pravatar.cc/150?img=11";

  return (
    <View className="px-6 pt-5 pb-3">
      {/* Added justify-between to push the left block and right pill apart */}
      <View className="flex-row items-center justify-between">
        {/* ── Left Side: Identity Block (Avatar + Name + Role) ── */}
        <View className="flex-row items-center gap-x-3.5 flex-1 pr-4">
          {/* Avatar with BulSU Red ring */}
          <View
            className="w-12 h-12 rounded-full overflow-hidden"
            style={{
              borderWidth: 2,
              borderColor: lightColors.primary,
              backgroundColor: lightColors.surface,
            }}
          >
            <Image
              source={{ uri: profileImageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>

          {/* Text Stack */}
          <View className="justify-center flex-1">
            <Title
              className="text-light-text font-black tracking-tight"
              style={{ fontSize: 20, lineHeight: 24 }}
              numberOfLines={1}
            >
              {fullName}
            </Title>

            {/* Role under the name */}
            <Body
              className="text-light-muted font-heavy uppercase tracking-widest mt-0.5"
              style={{ fontSize: 9 }}
            >
              {role}
            </Body>
          </View>
        </View>

        {/* ── Right Side: BulSU Verified Pill (Green) ── */}
        <View
          className="flex-row items-center gap-x-1.5 px-2.5 rounded-full"
          style={{
            paddingVertical: 4,
            backgroundColor: "rgba(34, 197, 94, 0.12)", // Light Green BG
            borderWidth: 0.5,
            borderColor: "rgba(34, 197, 94, 0.4)", // Green border
          }}
        >
          {/* Green Dot */}
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: "#22C55E", // Solid Green
            }}
          />
          <Body
            style={{
              fontSize: 9,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "#15803D", // Dark Green for text contrast
            }}
          >
            BulSU Verified
          </Body>
        </View>
      </View>
    </View>
  );
}
