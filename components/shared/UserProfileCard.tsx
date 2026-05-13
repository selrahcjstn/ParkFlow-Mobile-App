import { useAuthStore } from "@/store/useAuthStore";
import { User } from "lucide-react-native";
import { Text, View } from "react-native";

export default function UserProfileCard() {
  const user = useAuthStore((s) => s.user);

  return (
    <View className="flex-row items-center gap-4 px-5 py-4">
      <View className="w-12 h-12 rounded-full bg-light-border items-center justify-center">
        <User size={24} color="#475569" strokeWidth={1.8} />
      </View>

      <View>
        <Text className="text-light-text text-base font-bold">
          {user?.name}
        </Text>

        <Text className="text-light-muted text-sm font-medium">
          {user?.phoneNumber}
        </Text>
      </View>
    </View>
  );
}
