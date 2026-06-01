import { useAppTheme } from "@/hooks/useAppTheme";
import { router } from "expo-router";
import {
    Bell,
    Calendar,
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
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const iconColor = isDark ? colors.text : colors.surface;

  return (
    <>
      {!isGuard && (
        <AccountMenuSection title="Personal & Vehicles">
          <AccountMenuRow
            icon={<Car size={18} color={iconColor} strokeWidth={2} />}
            label="Manage Vehicle"
            onPress={() => router.push("/(settings)/vehicle" as any)}
          />
          <AccountMenuRow
            icon={<Calendar size={18} color={iconColor} strokeWidth={2} />}
            label="Schedule"
            isLast
            onPress={() => router.push("/(settings)/schedule" as any)}
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
          icon={<Bell size={18} color={iconColor} strokeWidth={2} />}
          label="Notification Settings"
          onPress={() => router.push("/(settings)/notification" as any)}
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
          label="About Us"
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
          <Pressable className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <Text className="font-heavy text-xl text-zinc-900 dark:text-zinc-50 mb-4">
              Select Theme
            </Text>

            {(["light", "dark", "system"] as const).map((option) => {
              const isActive = theme === option;
              return (
                <TouchableOpacity
                  key={option}
                  className="flex-row items-center justify-between py-3.5 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
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
                        : "text-zinc-700 dark:text-zinc-300"
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
              className="mt-5 bg-zinc-100 dark:bg-zinc-800 rounded-full py-3 items-center"
              activeOpacity={0.8}
              onPress={() => setShowThemeSelector(false)}
            >
              <Text className="font-heavy text-sm text-zinc-900 dark:text-zinc-50">
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
