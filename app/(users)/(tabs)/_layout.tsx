import { TabHeader } from "@/components/layouts";
import { Tabs } from "expo-router";
import { CalendarDays, History, Home, User } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuthStore } from "@/features/auth/store/auth.store";

import { useSchedulesQuery } from "@/hooks";
import { View, Text } from "react-native";

function StudentScheduleTabIcon({ color, size }: { color: any; size: number }) {
  const { data: schedules } = useSchedulesQuery();
  const { user } = useAuthStore();
  const isScheduleNotSetup = !schedules || schedules.length === 0 || user?.corVerificationStatus === 0;

  return (
    <View className="relative items-center justify-center">
      <CalendarDays size={size - 2} color={color} strokeWidth={2.2} />
      {isScheduleNotSetup && (
        <View className="absolute -top-1.5 -right-2 bg-light-primary dark:bg-dark-primary rounded-full h-4 w-4 items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm">
          <Text className="text-white font-bold text-[8px]">!</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,

        headerTitleAlign: "center",
        headerShadowVisible: false,

        headerLeftContainerStyle: {
          paddingLeft: 4,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontFamily: "Inter-Bold",
          color: colors.text,
        },
        headerStyle: {
          height: 95,
          backgroundColor: colors.background,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter-Bold",
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Home size={size - 2} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: user?.profileType === "personnel" ? "Parking hours" : "Schedule",
          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={{ color, fontSize: 11, fontFamily: "Inter-Bold", marginTop: 2, textAlign: "center", maxWidth: "100%" }}
            >
              {user?.profileType === "personnel" ? "Parking hours" : "Schedule"}
            </Text>
          ),
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <TabHeader
                title={options.title ?? "Schedule"}
                hasScrolled={hasScrolled}
              />
            );
          },
          tabBarIcon: ({ color, size }) => (
            user?.profileType === "personnel"
              ? <CalendarDays size={size - 2} color={color} strokeWidth={2.2} />
              : <StudentScheduleTabIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <TabHeader
                title={options.title ?? "History"}
                hasScrolled={hasScrolled}
              />
            );
          },
          tabBarIcon: ({ color, size }) => (
            <History size={size - 2} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <TabHeader
                title={options.title ?? "Account"}
                hasScrolled={hasScrolled}
              />
            );
          },
          tabBarIcon: ({ color, size }) => (
            <User size={size - 2} color={color} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
