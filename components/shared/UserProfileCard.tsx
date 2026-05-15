import { Body, Caption } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuthStore";
import { ShieldCheck, User } from "lucide-react-native";
import { View } from "react-native";

export default function UserProfileCard() {
  const user = useAuthStore((s) => s.user);

  return (
    <View className="px-5 py-4">
      <View className="flex-row items-center gap-x-3">
        <View className="w-11 h-11 rounded-full bg-light-accent/10 border border-light-accent/20 items-center justify-center">
          <User size={20} color={lightColors.accent} strokeWidth={1.8} />
        </View>

        <View className="flex-1">
          <Body numberOfLines={1} className="font-black">
            {user?.name}
          </Body>
          <Caption numberOfLines={1} className="mt-0.5">
            {user?.phoneNumber}
          </Caption>
        </View>

        <View className="flex-row items-center bg-light-success/10 border border-light-success/20 px-2.5 py-1 rounded-full gap-x-1">
          <ShieldCheck
            size={12}
            color={lightColors.success}
            strokeWidth={2.5}
          />
          <Caption className="font-light text-light-success tracking-wide uppercase">
            Verified
          </Caption>
        </View>
      </View>

      <View className="h-px bg-light-border mt-4" />
    </View>
  );
}
