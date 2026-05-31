import { TabHeader } from "@/components/layouts";
import { Tabs } from "expo-router";
import { CalendarDays, History, Home, User } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function TabsLayout() {
  const { colors } = useAppTheme();

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
