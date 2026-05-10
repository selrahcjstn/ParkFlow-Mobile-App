import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthLayout, AuthHeader, FormCard } from "../../components/layout";
import { AppButton, AppInput, LinkText } from "../../components/ui";

export default function Login() {
  const router = useRouter();

  return (
    <AuthLayout>
      {/* App branding shown at the top */}
      <AuthHeader
        logo={require("../../assets/images/icon.png")}
        title="ParkFlow"
        subtitle="Parking Management System"
      />

      {/* Login form lives inside the rounded card */}
      <FormCard title="Login">
        <AppInput label="Username" placeholder="Enter Username" />

        <AppInput label="Password" placeholder="Enter Password" isPassword />

        {/* Forgot password — tucked to the right */}
        <View className="self-end mb-6 -mt-2">
          <LinkText label="Forgot Password?" />
        </View>

        <AppButton label="Login" variant="primary" size="lg" />

        {/* Point new users to the registration flow */}
        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-light-text text-sm font-semibold">
            Don't have an account?{" "}
          </Text>
          <LinkText
            label="Click Here!"
            onPress={() => router.push("/(auth)/register")}
          />
        </View>
      </FormCard>
    </AuthLayout>
  );
}
