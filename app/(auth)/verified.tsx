import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton } from "../../components/ui";
import { CircleCheckBig, Download, QrCode } from "lucide-react-native";

export default function Verified() {
  const router = useRouter();

  return (
    <AuthLayout>
      <CompactHeader />

      <FormCard
        back={{
          label: "Back to Log In Page",
          onPress: () => router.replace("/(auth)/login"),
        }}
      >
        <View className="flex-1 items-center justify-center py-10">
          {/* Success badge — layered circles with a checkmark */}
          <View className="w-36 h-36 rounded-full bg-emerald-50 items-center justify-center mb-2">
            <View className="w-28 h-28 rounded-full bg-emerald-100 items-center justify-center">
              <CircleCheckBig size={64} color="#10B981" strokeWidth={1.6} />
            </View>
          </View>

          <Text className="text-light-success text-2xl font-extrabold text-center mt-4">
            Account Verified
          </Text>

          <Text className="text-light-muted text-sm text-center mt-3 px-4 leading-5">
            Your account has been approved! Download your QR code below for
            quick parking access.
          </Text>

          {/* QR preview placeholder */}
          <View className="w-40 h-40 rounded-2xl bg-white border-2 border-light-border items-center justify-center mt-6 shadow-sm">
            <QrCode size={80} color="#1E3A5F" strokeWidth={1.2} />
            <Text className="text-light-muted text-xs mt-2 font-medium">
              Your QR Code
            </Text>
          </View>

          {/* Download button */}
          <View className="w-full mt-8 px-2">
            <AppButton
              label="Download QR"
              variant="primary"
              size="lg"
              icon={<Download size={20} color="#FFFFFF" strokeWidth={2} />}
            />
          </View>
        </View>
      </FormCard>
    </AuthLayout>
  );
}
