import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { router } from "expo-router";
import {
    Calendar,
    CalendarCheck,
    CalendarDays,
    Car,
    Check,
    Info,
    LifeBuoy,
    LogOut,
    MessageSquarePlus,
    Moon,
    Phone,
    Settings,
} from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity } from "react-native";
import AccountMenuRow from "./AccountMenuRow";
import AccountMenuSection from "./AccountMenuSection";

interface AccountMenuProps {
  onLogout: () => void;
  isGuard?: boolean;
}

export default function AccountMenu({
  onLogout,
  isGuard = false,
}: AccountMenuProps) {
  const { theme, isDark, setTheme, colors } = useAppTheme();
  const isPersonnel = useAuthStore(s => s.user?.profileType === "personnel");
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const iconColor = colors.text;

  return (
    <>
      {!isGuard && (
        <AccountMenuSection title="Personal & Vehicles">
          <AccountMenuRow icon={<Car size={18} color={iconColor} strokeWidth={2} />} label="Driver documents"
            onPress={() => router.push('/(settings)/driver-documents' as any)} />
          <AccountMenuRow
            icon={<Car size={18} color={iconColor} strokeWidth={2} />}
            label="Manage Vehicle"
            onPress={() => router.push("/(settings)/vehicle" as any)}
          />
          <AccountMenuRow
            icon={<CalendarDays size={18} color={iconColor} strokeWidth={2} />}
            label={isPersonnel ? "Employee ID verification" : "Setup Schedule & COR"}
            onPress={() => router.push("/(settings)/setup-schedule" as any)}
          />
          <AccountMenuRow
            icon={<CalendarCheck size={18} color={iconColor} strokeWidth={2} />}
            label="Parking Reservations"
            isLast
            onPress={() =>
              router.push({
                pathname: "/(settings)/schedule",
                params: { tab: "list", filter: "all" },
              } as any)
            }
          />
        </AccountMenuSection>
      )}

      <AccountMenuSection title="App Settings">
        <AccountMenuRow
          icon={<Settings size={18} color={iconColor} strokeWidth={2} />}
          label="Account Center"
          onPress={() => router.push("/(settings)/account-center" as any)}
        />
        <AccountMenuRow
          icon={<Moon size={18} color={iconColor} strokeWidth={2} />}
          label="Theme Mode"
          isLast
          rightElement={
            <Text className="font-semibold text-sm text-light-muted dark:text-dark-muted mr-1 capitalize">
              {theme === "system" ? "System" : theme}
            </Text>
          }
          onPress={() => setShowThemeSelector(true)}
        />
      </AccountMenuSection>

      <AccountMenuSection title="Support & Info">
        <AccountMenuRow
          icon={<LifeBuoy size={18} color={iconColor} strokeWidth={2} />}
          label="Help Center"
          onPress={() => router.push("/(settings)/help-center" as any)}
        />
        <AccountMenuRow
          icon={
            <MessageSquarePlus size={18} color={iconColor} strokeWidth={2} />
          }
          label="Feedback and Suggestion"
          onPress={() => router.push("/(settings)/feedback" as any)}
        />
        <AccountMenuRow
          icon={<Phone size={18} color={iconColor} strokeWidth={2} />}
          label="Contact us"
          onPress={() => router.push("/(settings)/contact" as any)}
        />
        <AccountMenuRow
          icon={<Info size={18} color={iconColor} strokeWidth={2} />}
          label="About, Updates & Terms"
          isLast
          onPress={() => router.push("/(settings)/about" as any)}
        />
      </AccountMenuSection>

      <AccountMenuSection containerClassName="mb-2">
        <AccountMenuRow
          icon={<LogOut size={18} color={iconColor} strokeWidth={2.2} />}
          label="Log out"
          isDanger
          isLast
          onPress={onLogout}
        />
      </AccountMenuSection>

      <Modal
        visible={showThemeSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeSelector(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 items-center justify-center px-6"
          onPress={() => setShowThemeSelector(false)}
        >
          <Pressable className="w-full bg-light-surface dark:bg-dark-surface rounded-3xl p-6 shadow-2xl border border-light-border dark:border-dark-border">
            <Text className="font-bold text-xl text-light-text dark:text-dark-text mb-4">
              Select Theme
            </Text>

            {(["light", "dark", "system"] as const).map((option) => {
              const isActive = theme === option;
              return (
                <TouchableOpacity
                  key={option}
                  className="flex-row items-center justify-between py-3.5 border-b border-light-border/50 dark:border-dark-border/50 last:border-b-0"
                  activeOpacity={0.7}
                  onPress={async () => {
                    await setTheme(option);
                    setShowThemeSelector(false);
                  }}
                >
                  <Text
                    className={`font-semibold text-base capitalize ${
                      isActive
                        ? "text-light-primary dark:text-dark-primary"
                        : "text-light-text/70 dark:text-dark-text/70"
                    }`}
                  >
                    {option === "system" ? "System Default" : option}
                  </Text>
                  {isActive && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              className="mt-5 bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-full py-3 items-center"
              activeOpacity={0.8}
              onPress={() => setShowThemeSelector(false)}
            >
              <Text className="font-bold text-sm text-light-text dark:text-dark-text">
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
