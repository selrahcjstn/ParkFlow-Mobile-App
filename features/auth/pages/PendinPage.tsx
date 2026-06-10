import AuthLayout from "@/features/auth/components/AuthLayout";
import { useRouter } from "expo-router";
import { ChevronLeft, Clock, Home } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { StatusBar } from "expo-status-bar";
import { AppButton } from "@/components/ui";

export default function PendingPage() {
  const router = useRouter();
  const { isDark, colors } = useAppTheme();

  return (
    <AuthLayout
      background={isDark ? "bg-dark-surface" : "bg-light-surface"}
      header={
        <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface dark:bg-dark-surface">
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background dark:active:bg-dark-background"
          >
            <ChevronLeft size={24} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Centered Step Label */}
          <Text
            numberOfLines={1}
            className="text-light-text dark:text-dark-text text-[17px] font-black text-center flex-1"
          >
            Registration Status
          </Text>

          {/* Empty balancing spacer */}
          <View className="w-10" />
        </View>
      }
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <View className="flex-1 bg-light-surface dark:bg-dark-surface items-center justify-center px-6 py-12">
        <View className="w-28 h-28 rounded-full bg-light-background dark:bg-dark-background items-center justify-center mb-8 border border-light-border dark:border-dark-border shadow-sm">
          <Clock size={56} color={colors.primary} strokeWidth={1.5} />
        </View>

        <Text className="font-black text-2xl text-center leading-8 mb-4 text-light-text dark:text-dark-text">
          Pending Account{"\n"}Approval
        </Text>

        <Text className="text-light-muted dark:text-dark-muted font-regular text-center px-6 leading-6 text-base">
          Your registration has been submitted. Please wait for the admin to
          review and approve your account.
        </Text>

        <View className="w-full px-6 mt-10">
          <AppButton
            label="Go to Home"
            variant="primary"
            size="lg"
            icon={<Home size={18} color="#FFF" />}
            onPress={() => router.replace("/")}
          />
        </View>
      </View>
    </AuthLayout>
  );
}
