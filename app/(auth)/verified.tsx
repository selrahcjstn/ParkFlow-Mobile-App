import { AuthLayout, CompactHeader, FormCard } from "@/components/layout";
import { AppButton } from "@/components/ui";
import { Body, Caption, Title } from "@/components/ui/Typography";
import { useRouter } from "expo-router";
import { CircleCheckBig, Download, QrCode } from "lucide-react-native";
import { View } from "react-native";

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
          <View className="w-36 h-36 rounded-full bg-light-success/10 items-center justify-center mb-2">
            <View className="w-28 h-28 rounded-full bg-light-success/20 items-center justify-center">
              <CircleCheckBig size={64} color="#10B981" strokeWidth={1.6} />
            </View>
          </View>

          <Title className="text-light-success text-2xl text-center mt-4">
            Account Verified
          </Title>

          <Body className="text-light-muted text-center mt-3 px-4 leading-6">
            Your account has been approved! Download your QR code below for
            quick parking access.
          </Body>

          <View className="w-40 h-40 rounded-2xl bg-light-surface border-2 border-light-border items-center justify-center mt-6 shadow-sm">
            <QrCode size={80} color="#FDB813" strokeWidth={1.2} />
            <Caption className="mt-2 font-medium">Your QR Code</Caption>
          </View>

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
