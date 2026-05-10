import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton } from "../../components/ui";
import { CheckCircle, Download } from "lucide-react-native";

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
        {/* Centered success content */}
        <View className="flex-1 items-center justify-center py-12">
          {/* Green checkmark inside a soft circle */}
          <View className="w-28 h-28 rounded-full bg-emerald-50 items-center justify-center mb-8 border-4 border-emerald-400">
            <CheckCircle size={56} color="#10B981" strokeWidth={1.8} />
          </View>

          <Text className="text-light-success text-2xl font-extrabold text-center">
            Account Verified
          </Text>

          <Text className="text-light-muted text-sm text-center mt-3 px-6 leading-5">
            Your account has been approved! Download your QR code for quick
            parking access.
          </Text>

          {/* Download QR button */}
          <View className="w-full mt-8 px-4">
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
