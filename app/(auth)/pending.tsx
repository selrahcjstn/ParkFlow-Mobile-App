import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { LinkText } from "../../components/ui";
import { Clock } from "lucide-react-native";

export default function Pending() {
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
        {/* Centered status content */}
        <View className="flex-1 items-center justify-center py-16">
          {/* Clock icon inside a soft circle */}
          <View className="w-28 h-28 rounded-full bg-stone-200 items-center justify-center mb-8">
            <Clock size={56} color="#1E3A5F" strokeWidth={1.5} />
          </View>

          <Text className="text-light-accent text-2xl font-extrabold text-center leading-8">
            Pending Account{"\n"}Approval
          </Text>

          <Text className="text-light-muted text-sm text-center mt-4 px-6 leading-5">
            Your registration has been submitted. Please wait for the admin to
            review and approve your account.
          </Text>
        </View>
      </FormCard>
    </AuthLayout>
  );
}
