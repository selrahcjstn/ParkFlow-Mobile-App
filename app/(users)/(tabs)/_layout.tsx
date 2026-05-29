import { DashboardHeader, TabHeader } from "@/components/layouts";
import { Tabs } from "expo-router";
import { CalendarDays, History, Home, User } from "lucide-react-native";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#09090B" : "#F4F4F5",
    text: isDark ? "#FAFAFA" : "#09090B",
    muted: isDark ? "#A1A1AA" : "#71717A",
    border: isDark ? "#27272A" : "#E4E4E7",
    primary: isDark ? "#F87171" : "#D22730",
  };

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
          header: ({ route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return <DashboardHeader hasScrolled={hasScrolled} />;
          },
          tabBarIcon: ({ color, size }) => (
            <Home size={size - 2} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <TabHeader
                title={options.title ?? "Schedule"}
                hasScrolled={hasScrolled}
                colors={{
                  background: colors.background,
                  text: colors.text,
                  border: colors.border,
                }}
              />
            );
          },
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size - 2} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
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
                colors={{
                  background: colors.background,
                  text: colors.text,
                  border: colors.border,
                }}
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
