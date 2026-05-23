import { Body } from "@/components/ui/Typography";
import { AlertCircle, AlertTriangle, Terminal } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

export type SystemMessageCardProps = {
  title?: string;
  message: string;
  variant?: "danger" | "warning" | "info";
};

export default function SystemMessageCard({
  title = "Reason for failure", // Clean sentence case
  message,
  variant = "danger",
}: SystemMessageCardProps) {
  const theme = {
    danger: {
      accentBorder: "border-l-light-danger",
      iconColor: "#EF4444",
      icon: AlertCircle,
    },
    warning: {
      accentBorder: "border-l-light-warning",
      iconColor: "#F59E0B",
      icon: AlertTriangle,
    },
    info: {
      accentBorder: "border-l-light-primary",
      iconColor: "#3B82F6",
      icon: Terminal,
    },
  }[variant];

  const IconComponent = theme.icon;

  return (
    <View
      // Professional diagnostic layout with fixed height
      className={`rounded-xl p-4 bg-light-surface border border-light-border/60 border-l-4 ${theme.accentBorder} h-[120px] justify-between`}
    >
      <View>
        {/* Header Block — Subdued and integrated cleanly */}
        <View className="flex-row items-center gap-x-1.5 mb-2">
          <IconComponent size={12} color={theme.iconColor} strokeWidth={2.5} />
          <Body className="text-light-muted font-heavy capitalize text-[11px]">
            {title}
          </Body>
        </View>

        {/* System Error Message */}
        <Body
          className="text-light-text font-book text-[13px] leading-[18px]"
          numberOfLines={3}
        >
          {message || "No system message details provided."}
        </Body>
      </View>

      {/* Decorative Technical Indicator at bottom right */}
      <View className="items-end opacity-20">
        <Terminal size={12} color="#64748B" strokeWidth={2} />
      </View>
    </View>
  );
}
