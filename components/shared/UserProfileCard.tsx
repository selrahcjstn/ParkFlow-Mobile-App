import { useAuthStore } from "@/store/useAuthStore";
import { ShieldCheck, User } from "lucide-react-native";
import { Text, View } from "react-native";

export default function UserProfileCard() {
  const user = useAuthStore((s) => s.user);

  return (
    <View className="px-5 py-4">
      <View className="flex-row items-center gap-x-3">
        {/* Avatar */}
        <View className="w-11 h-11 rounded-full bg-light-accent/10 border border-light-accent/20 items-center justify-center">
          <User size={20} color="#1E3A5F" strokeWidth={1.8} />
        </View>

        {/* User info */}
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="font-black text-light-text text-[15px] tracking-tight"
          >
            {user?.name}
          </Text>

          <Text
            numberOfLines={1}
            className="font-book text-light-muted text-xs mt-0.5"
          >
            {user?.phoneNumber}
          </Text>
        </View>

        {/* Verified badge */}
        <View className="flex-row items-center bg-light-success/10 border border-light-success/20 px-2.5 py-1 rounded-full gap-x-1">
          <ShieldCheck size={11} color="#10B981" strokeWidth={2.5} />

          <Text className="font-light text-light-success text-[10px] tracking-wide uppercase">
            Verified
          </Text>
        </View>
      </View>

      {/* Bottom divider */}
      <View className="h-[1px] bg-light-border mt-4" />
    </View>
  );
}
