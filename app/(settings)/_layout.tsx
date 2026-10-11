import { ChevronLeft } from "lucide-react-native";
import { Stack, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuthStore } from "@/features/auth/store/auth.store";

interface SettingsHeaderProps {
  title: string;
  hasScrolled?: boolean;
  onBack: () => void;
  rightElement?: React.ReactNode;
}

function SettingsHeader({
  title,
  hasScrolled = false,
  onBack,
  rightElement,
}: SettingsHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: colors.background,
          borderBottomWidth: hasScrolled ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
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
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Center Title slot */}
      <View style={styles.centerSlot}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
      </View>

      {/* Right slot for layout balance */}
      <View style={styles.rightSlot}>
        {rightElement}
      </View>
    </View>
  );
}

export default function SettingsLayout() {
  const { colors } = useAppTheme();
  const isPersonnel = useAuthStore(s => s.user?.profileType === "personnel");

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
          title: "Profile",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Profile"}
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
          title: "Reservation",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Reservation"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="setup-schedule"
        options={{
          title: isPersonnel ? "Employee ID verification" : "Setup Schedule & COR",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Setup Schedule & COR"}
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
          title: "Change Password",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Change Password"}
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
          title: "Registered Emails",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Registered Emails"}
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
        name="notification-detail"
        options={{
          title: "Alert Details",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Alert Details"}
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
          title: "About & Updates",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "About & Updates"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="violations"
        options={{
          title: "My Violations",
          headerShown: true,
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "My Violations"}
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
