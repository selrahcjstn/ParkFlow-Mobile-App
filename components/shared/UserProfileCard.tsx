import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuthStore";
import { Bell } from "lucide-react-native";
import { Image, TouchableOpacity, View } from "react-native";

export default function UserProfileCard() {
  const user = useAuthStore((s) => s.user);
  const fullName = user?.name || "Guest User";
  const profileImageUrl = "https://i.pravatar.cc/150?img=11";

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning 👋";
    if (hour < 18) return "Good afternoon 👋";
    return "Good evening 👋";
  };

  return (
    <View className="px-6 pt-5 pb-3">
      <View className="flex-row items-center justify-between">
        {/* ── Left Side: Unified Identity Block (Avatar + Name) ── */}
        <View className="flex-row items-center gap-x-3.5 flex-1 pr-4">
          {/* Avatar with BulSU Red ring */}
          <View
            className="w-12 h-12 rounded-full overflow-hidden"
            style={{
              borderWidth: 2,
              borderColor: lightColors.primary, // Uses your new #D22730
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
            <Body
              className="text-light-muted font-heavy uppercase tracking-widest mb-0.5"
              style={{ fontSize: 9 }}
            >
              {greeting()}
            </Body>

            <Title
              className="text-light-text font-black tracking-tight"
              style={{ fontSize: 20, lineHeight: 24 }}
              numberOfLines={1}
            >
              {fullName}
            </Title>

            {/* BulSU-branded verified pill */}
            <View
              className="flex-row items-center gap-x-1.5 self-start px-2 rounded-full mt-0.5"
              style={{
                paddingVertical: 3,
                backgroundColor: `${lightColors.accent}20`, // 20% opacity Gold
                borderWidth: 0.5,
                borderColor: `${lightColors.accent}60`,
              }}
            >
              {/* Red Dot */}
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: lightColors.primary,
                }}
              />
              <Body
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "#92600A", // Hardcoded dark gold to ensure it is readable on white
                }}
              >
                BulSU Verified
              </Body>
            </View>
          </View>
        </View>

        {/* ── Right Side: Standalone Action (Notification Bell) ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-11 h-11 rounded-full bg-white items-center justify-center relative"
          style={{
            borderWidth: 0.5,
            borderColor: "rgba(0,0,0,0.08)",
            shadowColor: "#000",
            shadowOpacity: 0.03,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Bell size={18} color={lightColors.text} strokeWidth={2} />

          {/* BulSU Red notification dot */}
          <View
            className="absolute"
            style={{
              top: 10,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: lightColors.primary,
              borderWidth: 1.5,
              borderColor: "#fff",
            }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
