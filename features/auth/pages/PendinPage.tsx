import { Body, Title } from "@/components/ui/Typography";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { useRouter } from "expo-router";
import { ChevronLeft, Clock } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

export default function PendingPage() {
  const router = useRouter();

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
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
            Registration Status
          </Title>

          {/* Empty balancing spacer */}
          <View className="w-10" />
        </View>
      }
    >
      <View className="flex-1 bg-light-surface items-center justify-center px-6 py-12">
        <View className="w-28 h-28 rounded-full bg-light-background items-center justify-center mb-8 border border-light-border shadow-sm">
          <Clock size={56} color="#D22730" strokeWidth={1.5} />
        </View>

        <Title className="text-2xl text-center leading-8 mb-4">
          Pending Account{"\n"}Approval
        </Title>

        <Body className="text-light-muted text-center px-6 leading-6">
          Your registration has been submitted. Please wait for the admin to
          review and approve your account.
        </Body>
      </View>
    </AuthLayout>
  );
}
