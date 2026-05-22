import AuthLayout from "@/features/auth/AuthLayout";
import { AppButton } from "@/components/ui";
import { Body, Caption, Title } from "@/components/ui/Typography";
import { useRouter } from "expo-router";
import { ChevronLeft, CircleCheckBig, Download, QrCode } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

export default function Verified() {
  const router = useRouter();

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        /* Pure white top bar with back button and centered title */
        <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface">
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Centered Step Label */}
          <Title
            numberOfLines={1}
            className="text-light-text text-[17px] font-heavy text-center flex-1"
          >
            Account Verified
          </Title>

          {/* Empty balancing spacer */}
          <View className="w-10" />
        </View>
      }
    >
      <View className="flex-1 bg-light-surface items-center justify-center px-6 py-8">
        <View className="w-32 h-32 rounded-full bg-light-success/10 items-center justify-center mb-4">
          <View className="w-24 h-24 rounded-full bg-light-success/20 items-center justify-center">
            <CircleCheckBig size={56} color="#10B981" strokeWidth={1.8} />
          </View>
        </View>

        <Title className="text-light-success text-2xl text-center mt-2 mb-3">
          Account Verified!
        </Title>

        <Body className="text-light-muted text-center px-4 leading-6">
          Your account has been approved! Download your QR code below for
          quick parking access.
        </Body>

        <View className="w-44 h-44 rounded-2xl bg-light-surface border-2 border-light-border items-center justify-center mt-6 shadow-sm">
          <QrCode size={84} color="#FDB813" strokeWidth={1.2} />
          <Caption className="mt-2.5 font-medium">Your QR Code</Caption>
        </View>

        <View className="w-full mt-10 px-2">
          <AppButton
            label="Download QR"
            variant="primary"
            size="lg"
            icon={<Download size={20} color="#FFFFFF" strokeWidth={2} />}
          />
        </View>
      </View>
    </AuthLayout>
  );
}
