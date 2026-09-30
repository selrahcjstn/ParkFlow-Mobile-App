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
        profileType?: string;
        corVerificationStatus?: number;
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
        <View className="w-14 h-14 rounded-full bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center overflow-hidden border border-light-border dark:border-dark-border">
          {profilePictureUrl ? (
            <Image
              source={{ uri: profilePictureUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text
              className="font-bold text-lg"
              style={{ color: colors.primary }}
            >
              {getInitials(profileData, user)}
            </Text>
          )}
        </View>

        <View className="flex-1 items-start justify-center">
          <Text className="text-light-text dark:text-dark-text font-bold text-[16px] leading-5">
            {profileData?.firstName && profileData?.lastName
              ? `${profileData.firstName} ${profileData.lastName}`
              : user?.name || "User"}
          </Text>
          <Text
            className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5"
            numberOfLines={1}
          >
            {profileData?.email || user?.email || "N/A"}
          </Text>

          {(() => {
            if (user?.profileType === "guard") {
              return (
                <View className="flex-row items-center gap-1.5 mt-2">
                  <View className="w-3.5 h-3.5 rounded-full bg-light-success dark:bg-dark-success items-center justify-center">
                    <Check size={8} color="#FFF" strokeWidth={4} />
                  </View>
                  <Text className="text-light-success dark:text-dark-success font-bold text-[9px] uppercase tracking-wider">
                    Verified
                  </Text>
                </View>
              );
            }

            const status = user?.corVerificationStatus;
            if (status === 2) {
              return (
                <View className="flex-row items-center gap-1.5 mt-2">
                  <View className="w-3.5 h-3.5 rounded-full bg-light-success dark:bg-dark-success items-center justify-center">
                    <Check size={8} color="#FFF" strokeWidth={4} />
                  </View>
                  <Text className="text-light-success dark:text-dark-success font-bold text-[9px] uppercase tracking-wider">
                    Verified
                  </Text>
                </View>
              );
            } else if (status === 1) {
              return (
                <View className="flex-row items-center gap-1.5 mt-2">
                  <View className="w-3.5 h-3.5 rounded-full bg-light-warning dark:bg-dark-warning items-center justify-center">
                    <Check size={8} color="#FFF" strokeWidth={4} />
                  </View>
                  <Text className="text-light-warning dark:text-dark-warning font-bold text-[9px] uppercase tracking-wider">
                    Pending
                  </Text>
                </View>
              );
            } else if (status === 3) {
              return (
                <View className="flex-row items-center gap-1.5 mt-2">
                  <View className="w-3.5 h-3.5 rounded-full bg-light-danger dark:bg-dark-danger items-center justify-center">
                    <Check size={8} color="#FFF" strokeWidth={4} />
                  </View>
                  <Text className="text-light-danger dark:text-dark-danger font-bold text-[9px] uppercase tracking-wider">
                    Rejected
                  </Text>
                </View>
              );
            } else {
              return (
                <View className="flex-row items-center gap-1.5 mt-2">
                  <View className="w-3.5 h-3.5 rounded-full bg-light-muted dark:bg-dark-muted items-center justify-center">
                    <Check size={8} color="#FFF" strokeWidth={4} />
                  </View>
                  <Text className="text-light-muted dark:text-dark-muted font-bold text-[9px] uppercase tracking-wider">
                    Unverified
                  </Text>
                </View>
              );
            }
          })()}
        </View>
      </View>

      <ChevronRight size={20} color={colors.muted} strokeWidth={2.2} />
    </TouchableOpacity>
  );
}
