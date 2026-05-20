import { Body, Title } from "@/components/ui/Typography";
import { useAuthStore } from "@/store/useAuthStore";
import { Image, View } from "react-native";

export default function UserProfileCard() {
  const user = useAuthStore((s) => s.user);
  const fullName = user?.name || "Guest User";
  const role = user?.profileType || "Student";
  const profileImageUrl = "https://i.pravatar.cc/150?img=11";

  return (
    <View className="pt-5 pb-3">
      <View className="flex-row items-center justify-between">
        {/* ── Left: Avatar + Name + Role ── */}
        <View className="flex-row items-center gap-x-3 flex-1 pr-4">
          {/* Avatar — ring uses your primary color */}
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              borderWidth: 2,
              borderColor: "#D22730",
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

          {/* Text */}
          <View className="justify-center flex-1">
            <Title
              className="text-light-text font-black tracking-tight"
              style={{ fontSize: 15, lineHeight: 18 }}
              numberOfLines={1}
            >
              {fullName}
            </Title>
            <Body
              className="text-light-muted font-heavy uppercase tracking-widest"
              style={{ fontSize: 8, lineHeight: 13, marginTop: 2 }}
            >
              {role}
            </Body>
          </View>
        </View>

        {/* ── Right: Verified pill — borderless ── */}
        <View
          className="flex-row items-center gap-x-1.5 px-2.5 rounded-full"
          style={{
            paddingVertical: 5,
            backgroundColor: "rgba(16, 185, 129, 0.09)",
          }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: "#10B981",
            }}
          />
          <Body
            style={{
              fontSize: 9,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "#065F46",
            }}
          >
            BulSU Verified
          </Body>
        </View>
      </View>
    </View>
  );
}
