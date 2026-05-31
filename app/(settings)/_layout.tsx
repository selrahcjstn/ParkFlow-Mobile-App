import { ChevronLeft } from "lucide-react-native";
import { Stack, router } from "expo-router";
import React from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

interface SettingsHeaderProps {
  title: string;
  hasScrolled?: boolean;
  onBack: () => void;
  colors?: {
    background: string;
    text: string;
    border: string;
  };
}

function SettingsHeader({
  title,
  hasScrolled = false,
  onBack,
}: SettingsHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  const themeAnim = React.useRef(new Animated.Value(isDark ? 0 : 1)).current;

  React.useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDark ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isDark, themeAnim]);

  const darkOpacity = themeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const lightOpacity = themeAnim;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: "#F4F4F5",
        },
      ]}
    >
      {/* Dark Mode Background Overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "#1E1F22",
            opacity: darkOpacity,
          },
        ]}
      />

      {/* Dark Mode Border Line */}
      {hasScrolled && (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: "#3A3C43",
            opacity: darkOpacity,
          }}
        />
      )}

      {/* Light Mode Border Line */}
      {hasScrolled && (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: "#E4E4E7",
            opacity: lightOpacity,
          }}
        />
      )}

      {/* Left Back Button slot */}
      <View style={styles.leftSlot}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {/* Dark Mode Back Icon */}
          <Animated.View style={{ position: "absolute", opacity: darkOpacity }}>
            <ChevronLeft size={28} color="#f2f3f5" />
          </Animated.View>

          {/* Light Mode Back Icon */}
          <Animated.View style={{ position: "absolute", opacity: lightOpacity }}>
            <ChevronLeft size={28} color="#09090B" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Center Title slot with Layered Title Text */}
      <View style={styles.centerSlot}>
        {/* Dark Mode Title */}
        <Animated.Text
          style={[
            styles.title,
            {
              color: "#f2f3f5",
              position: "absolute",
              opacity: darkOpacity,
            },
          ]}
        >
          {title}
        </Animated.Text>

        {/* Light Mode Title */}
        <Animated.Text
          style={[
            styles.title,
            {
              color: "#09090B",
              position: "absolute",
              opacity: lightOpacity,
            },
          ]}
        >
          {title}
        </Animated.Text>
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
      <Stack.Screen
        name="help-center"
        options={{
          title: "Help Center",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Help Center"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="feedback"
        options={{
          title: "Feedback & Suggestions",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Feedback & Suggestions"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="contact"
        options={{
          title: "Contact Us",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "Contact Us"}
                hasScrolled={hasScrolled}
                onBack={() => router.back()}
                colors={colors}
              />
            );
          },
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: "About Us",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <SettingsHeader
                title={options.title ?? "About Us"}
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
