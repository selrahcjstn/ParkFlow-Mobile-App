import { SectionHeader } from "@/components/shared";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ChevronRight, Keyboard, LogOut, ShieldAlert } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface GuardActionButtonsProps {
  onSearch?: () => void;
  onExit?: () => void;
  onViolations?: () => void;
  unpaidViolationsCount?: number;
}

export default function GuardActionButtons({
  onSearch,
  onExit,
  onViolations,
  unpaidViolationsCount = 0,
}: GuardActionButtonsProps) {
  const { colors } = useAppTheme();

  const actions = [
    {
      key: "violations",
      icon: <ShieldAlert size={20} color={colors.danger} strokeWidth={1.8} />,
      title: "Violations & Citations",
      subtitle: "Review active violators and mark as paid",
      onPress: onViolations,
      badge: unpaidViolationsCount > 0 ? `${unpaidViolationsCount} UNPAID` : undefined,
    },
    {
      key: "entry",
      icon: <Keyboard size={20} color={colors.accent} strokeWidth={1.8} />,
      title: "Manual Input Entry",
      subtitle: "Process entry via vehicle plate number",
      onPress: onSearch,
    },
    {
      key: "exit",
      icon: <LogOut size={20} color={colors.accent} strokeWidth={1.8} />,
      title: "Manual Input Exit",
      subtitle: "Process exit via vehicle plate number",
      onPress: onExit,
    },
  ];

  return (
    <View className="mt-6 gap-2">
      <SectionHeader title="Guard Actions" containerClassName="mb-1" />

      <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border overflow-hidden">
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.key}
            onPress={action.onPress}
            activeOpacity={0.6}
            className={`flex-row items-center px-4 py-3.5 ${
              index < actions.length - 1 ? "border-b border-light-border dark:border-dark-border" : ""
            }`}
          >
            <View className="mr-3">{action.icon}</View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-light-text dark:text-dark-text font-bold text-[14px]">
                  {action.title}
                </Text>
                {action.badge && (
                  <View className="bg-light-danger dark:bg-dark-danger px-1.5 py-0.5 rounded-full">
                    <Text className="text-white text-[9px] font-bold">
                      {action.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-light-muted dark:text-dark-muted text-[12px] mt-0.5">
                {action.subtitle}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.muted} strokeWidth={1.5} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
