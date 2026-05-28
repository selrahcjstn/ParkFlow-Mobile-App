import {
  Bell,
  Calendar,
  Car,
  Info,
  LifeBuoy,
  LogOut,
  MessageSquarePlus,
  Moon,
  Phone,
  Settings,
} from "lucide-react-native";
import { Switch } from "react-native";
import { router } from "expo-router";
import AccountMenuRow from "./AccountMenuRow";
import AccountMenuSection from "./AccountMenuSection";

interface AccountMenuProps {
  isDark: boolean;
  darkTheme: boolean;
  onToggleDarkTheme: (value: boolean) => void;
  onLogout: () => void;
}

export default function AccountMenu({
  isDark,
  darkTheme,
  onToggleDarkTheme,
  onLogout,
}: AccountMenuProps) {
  const defaultIconColor = isDark ? "#FAFAFA" : "#09090B";
  const dangerIconColor = isDark ? "#F87171" : "#D22730";

  return (
    <>
      <AccountMenuSection title="Personal & Vehicles">
        <AccountMenuRow
          icon={<Car size={18} color={defaultIconColor} strokeWidth={2} />}
          label="Manage Vehicle"
          onPress={() => console.log("Navigate: Manage Vehicles")}
        />
        <AccountMenuRow
          icon={<Calendar size={18} color={defaultIconColor} strokeWidth={2} />}
          label="Schedule"
          isLast
          onPress={() => console.log("Navigate: Schedule")}
        />
      </AccountMenuSection>

      <AccountMenuSection title="App Settings">
        <AccountMenuRow
          icon={<Settings size={18} color={defaultIconColor} strokeWidth={2} />}
          label="Account Center"
          onPress={() => console.log("Navigate: Account Center")}
        />
        <AccountMenuRow
          icon={<Bell size={18} color={defaultIconColor} strokeWidth={2} />}
          label="Notification"
          onPress={() => console.log("Navigate: Notifications")}
        />
        <AccountMenuRow
          icon={<Moon size={18} color={defaultIconColor} strokeWidth={2} />}
          label="Dark Mode"
          isLast
          rightElement={
            <Switch
              value={darkTheme}
              onValueChange={onToggleDarkTheme}
              trackColor={{ false: "#ECECF0", true: "#D22730" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#ECECF0"
            />
          }
        />
      </AccountMenuSection>

      <AccountMenuSection title="Support & Info">
        <AccountMenuRow
          icon={<LifeBuoy size={18} color={defaultIconColor} strokeWidth={2} />}
          label="Help Center"
          onPress={() => console.log("Navigate: Help Center")}
        />
        <AccountMenuRow
          icon={
            <MessageSquarePlus
              size={18}
              color={defaultIconColor}
              strokeWidth={2}
            />
          }
          label="Feedback and Suggestion"
          onPress={() => console.log("Navigate: Feedback")}
        />
        <AccountMenuRow
          icon={<Phone size={18} color={defaultIconColor} strokeWidth={2} />}
          label="Contact us"
          onPress={() => console.log("Navigate: Contact")}
        />
        <AccountMenuRow
          icon={<Info size={18} color={defaultIconColor} strokeWidth={2} />}
          label="About Us"
          isLast
          onPress={() => console.log("Navigate: About")}
        />
      </AccountMenuSection>

      <AccountMenuSection containerClassName="mb-2">
        <AccountMenuRow
          icon={<LogOut size={18} color={dangerIconColor} strokeWidth={2.2} />}
          label="Log out"
          isDanger
          isLast
          onPress={onLogout}
        />
      </AccountMenuSection>
    </>
  );
}
