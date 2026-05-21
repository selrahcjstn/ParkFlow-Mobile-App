import { Body, Caption } from "@/components/ui/Typography";
import { AlertCircle, AlertTriangle, Info } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

export type SystemMessageCardProps = {
  title?: string;
  message: string;
  variant?: "danger" | "warning" | "info";
  actionRequired?: React.ReactNode | string;
};

export default function SystemMessageCard({
  title = "System Message",
  message,
  variant = "danger",
  actionRequired,
}: SystemMessageCardProps) {
  const theme = {
    danger: {
      bg: "bg-red-100",
      border: "border-red-200",
      text: "text-light-danger",
      iconColor: "#EF4444",
      icon: AlertCircle,
    },
    warning: {
      bg: "bg-amber-100",
      border: "border-amber-200",
      text: "text-light-warning",
      iconColor: "#F59E0B",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-100",
      border: "border-blue-200",
      text: "text-blue-600",
      iconColor: "#2563EB",
      icon: Info,
    },
  }[variant];

  const IconComponent = theme.icon;

  return (
    <View
      className={`rounded-2xl p-4 border ${theme.bg} ${theme.border} mb-4`}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <IconComponent size={18} color={theme.iconColor} strokeWidth={2.5} />
        <Body className={`font-heavy text-[13px] ${theme.text}`}>
          {title}
        </Body>
      </View>

      <Body className="text-light-text font-book text-[13px] leading-[18px]">
        {message}
      </Body>

      {actionRequired ? (
        <View className="mt-3 pt-3 border-t border-light-border/20">
          <Body className="font-heavy text-[11px] text-light-muted mb-1">
            Action Required
          </Body>
          {typeof actionRequired === "string" ? (
            <Body className="text-light-text font-book text-[13px] leading-[18px]">
              {actionRequired}
            </Body>
          ) : (
            actionRequired
          )}
        </View>
      ) : null}
    </View>
  );
}
