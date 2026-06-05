import { ChevronLeft } from "lucide-react-native";
import { Stack, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

interface SettingsHeaderProps {
  title: string;
  hasScrolled?: boolean;
  onBack: () => void;
}

function SettingsHeader({
  title,
  hasScrolled = false,
  onBack,
}: SettingsHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: isDark ? "#1E1F22" : "#F4F4F5",
          borderBottomWidth: hasScrolled ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: isDark ? "#3A3C43" : "#E4E4E7",
        },
      ]}
    >
      {/* Left Back Button slot */}
      <View style={styles.leftSlot}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={28} color={isDark ? "#f2f3f5" : "#09090B"} />
        </TouchableOpacity>
      </View>

      {/* Center Title slot */}
      <View style={styles.centerSlot}>
        <Text style={[styles.title, { color: isDark ? "#f2f3f5" : "#09090B" }]}>
          {title}
        </Text>
      </View>

      {/* Right slot for layout balance */}
      <View style={styles.rightSlot} />
    </View>
  );
}

export default function SettingsLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile Details",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Profile Details"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="vehicle"
        options={{
          title: "My Vehicles",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "My Vehicles"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="schedule"
        options={{
          title: "Schedule",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Schedule"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="account-center"
        options={{
          title: "Account Center",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Account Center"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="set-password"
        options={{
          title: "Set Email & Password",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Set Credentials"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="emails"
        options={{
          title: "Emails",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Emails"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="email-details"
        options={{
          title: "Email Details",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Email Details"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="notification"
        options={{
          title: "Notification Settings",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Notification Settings"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="notifications-log"
        options={{
          title: "Notifications",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Notifications"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="help-center"
        options={{
          title: "Help Center",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Help Center"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="feedback"
        options={{
          title: "Feedback & Suggestions",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Feedback & Suggestions"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="contact"
        options={{
          title: "Contact Us",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Contact Us"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: "About Us",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "About Us"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 90,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  leftSlot: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    marginLeft: -8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  centerSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    letterSpacing: -0.2,
  },
  rightSlot: {
    width: 40,
    height: 40,
  },
});
