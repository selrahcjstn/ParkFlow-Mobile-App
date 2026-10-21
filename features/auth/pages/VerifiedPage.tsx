import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { useRouter } from "expo-router";
import {
    ChevronLeft,
    CircleCheckBig,
    Download,
    QrCode,
} from "lucide-react-native";
import { Text, TouchableOpacity, View, Linking, Share, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

export default function VerifiedPage() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const handleDownloadQr = async () => {
    const qrData = "PARKFLOW-ACCOUNT-ACCESS-PASS";
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrData)}`;
    try {
      if (Platform.OS === "web") {
        await Linking.openURL(url);
      } else {
        await WebBrowser.openBrowserAsync(url).catch(async () => {
          await Share.share({
            title: "ParkFlow Account QR Code",
            message: `ParkFlow Account QR Code: ${url}`,
            url: url,
          });
        });
      }
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <AuthLayout
      background="bg-light-surface dark:bg-dark-surface"
      header={
        /* Pure white top bar with back button and centered title */
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
            className="text-light-text text-[17px] font-bold text-center flex-1 dark:text-dark-text"
          >
            Account Verified
          </Text>

          {/* Empty balancing spacer */}
          <View className="w-10" />
        </View>
      }
    >
      <View className="flex-1 bg-light-surface items-center justify-center px-6 py-8 dark:bg-dark-surface">
        <View className="w-32 h-32 rounded-full bg-light-success/10 items-center justify-center mb-4 dark:bg-dark-success/10">
          <View className="w-24 h-24 rounded-full bg-light-success/20 items-center justify-center dark:bg-dark-success/20">
            <CircleCheckBig size={56} color="#10B981" strokeWidth={1.8} />
          </View>
        </View>

        <Text className="text-light-text font-bold text-2xl text-center mt-2 mb-3 dark:text-dark-text">
          Account Verified!
        </Text>

        <Text className="text-light-muted font-regular text-center px-4 leading-6 text-base dark:text-dark-muted">
          Your account has been approved! Download your QR code below for quick
          parking access.
        </Text>

        <View className="w-44 h-44 rounded-2xl bg-light-surface border-2 border-light-border items-center justify-center mt-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
          <QrCode size={84} color="#FDB813" strokeWidth={1.2} />
          <Text className="mt-2.5 font-book text-base leading-5 text-light-text dark:text-dark-text">Your QR Code</Text>
        </View>

        <View className="w-full mt-10 px-2">
          <AppButton
            label="Download QR"
            variant="primary"
            size="lg"
            onPress={handleDownloadQr}
            icon={<Download size={20} color="#FFFFFF" strokeWidth={2} />}
          />
        </View>
      </View>
    </AuthLayout>
  );
}

