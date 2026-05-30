import { Check, ChevronRight } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface AccountHeaderProps {
  profileData: any;
  profilePictureUrl?: string | null;
  user:
    | {
        name?: string;
        email?: string;
      }
    | null
    | undefined;
  onPress: () => void;
}

function getInitials(profileData: any, user: AccountHeaderProps["user"]) {
  if (profileData?.firstName && profileData?.lastName) {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
  }

  if (user?.name) {
    const parts = user.name.split(" ");
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  }

  return "PF";
}

export default function AccountHeader({
  profileData,
  profilePictureUrl,
  user,
  onPress,
}: AccountHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="px-1 mb-8 flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-4 flex-1">
        <View className="w-14 h-14 rounded-full bg-light-primary/10 items-center justify-center overflow-hidden border border-light-border dark:border-dark-border">
          {profilePictureUrl ? (
            <Image
              source={{ uri: profilePictureUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-light-primary font-black text-lg">
              {getInitials(profileData, user)}
            </Text>
          )}
        </View>

        <View className="flex-1 items-start justify-center">
          <Text className="text-light-text dark:text-dark-text font-black text-[16px] leading-5">
            {profileData?.firstName && profileData?.lastName
              ? `${profileData.firstName} ${profileData.lastName}`
              : user?.name || "User"}
          </Text>
          <Text
            className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5"
            numberOfLines={1}
          >
            {user?.email || "N/A"}
          </Text>

          <View className="flex-row items-center gap-1.5 mt-2">
            <View className="w-3.5 h-3.5 rounded-full bg-light-success items-center justify-center">
              <Check size={8} color="#FFF" strokeWidth={4} />
            </View>
            <Text className="text-light-success font-heavy text-[9px] uppercase tracking-wider">
              Verified
            </Text>
          </View>
        </View>
      </View>

      <ChevronRight size={20} color={colors.muted} strokeWidth={2.2} />
    </TouchableOpacity>
  );
}
