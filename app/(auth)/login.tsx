import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { authService } from "../../services/auth.service";

import { AuthHeader, AuthLayout, FormCard } from "../../components/layout";
import { AppButton, AppInput, LinkText } from "../../components/ui";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const data = await authService.login(email, password);

      console.log("LOGIN SUCCESS:", data);

      // later: store token + navigate
      // router.replace("/home");

    } catch (err: any) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
      console.log("FULL URL TEST:", process.env.EXPO_PUBLIC_API_URL);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader
        logo={require("../../assets/images/icon.png")}
        title="ParkFlow"
        subtitle="Parking Management System"
      />

      <FormCard title="Login">
        <AppInput
          label="Email"
          placeholder="Enter Email"
          value={email}
          onChangeText={setEmail}
        />

        <AppInput
          label="Password"
          placeholder="Enter Password"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        <View className="self-end mb-6 -mt-2">
          <LinkText label="Forgot Password?" />
        </View>

        <AppButton
          label="Login"
          variant="primary"
          size="lg"
          onPress={handleLogin}
        />

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