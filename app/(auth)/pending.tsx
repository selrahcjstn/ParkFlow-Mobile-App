import { AuthLayout, CompactHeader, FormCard } from "@/components/layout";
import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import { View } from "react-native";

export default function Pending() {
  const router = useRouter();

  return (
    <AuthLayout>
      <CompactHeader />

      <FormCard
        back={{
          onPress: () => router.replace("/(auth)/login"),
        }}
      >
        <View className="flex-1 items-center justify-center py-16">
          <View className="w-28 h-28 rounded-full bg-light-background items-center justify-center mb-8 border border-light-border">
            <Clock size={56} color={lightColors.primary} strokeWidth={1.5} />
          </View>

          <Title className="text-2xl text-center leading-8">
            Pending Account{"\n"}Approval
          </Title>

          <Body className="text-light-muted text-center mt-4 px-6 leading-6">
            Your registration has been submitted. Please wait for the admin to
            review and approve your account.
          </Body>
        </View>
      </FormCard>
    </AuthLayout>
  );
}
