import { ChevronLeft } from "lucide-react-native";
import { Stack, router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SettingsHeaderProps {
  title: string;
  hasScrolled?: boolean;
  onBack: () => void;
  colors: {
    background: string;
    text: string;
    border: string;
  };
}

function SettingsHeader({
  title,
  hasScrolled = false,
  onBack,
  colors,
}: SettingsHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: colors.background,
        },
        hasScrolled && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
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
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>

      {/* Right slot for layout balance */}
      <View style={styles.rightSlot} />
    </View>
  );
}

export default function SettingsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#09090B" : "#F4F4F5",
    text: isDark ? "#FAFAFA" : "#09090B",
    border: isDark ? "#27272A" : "#E4E4E7",
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile Details",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Profile Details"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="vehicle"
        options={{
          title: "My Vehicles",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "My Vehicles"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="schedule"
        options={{
          title: "Schedule",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Schedule"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="account-center"
        options={{
          title: "Account Center",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Account Center"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="set-password"
        options={{
          title: "Set Email & Password",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Set Credentials"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="notification"
        options={{
          title: "Notifications",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Notifications"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
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
