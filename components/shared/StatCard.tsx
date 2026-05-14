import { Body, Caption, Title } from "@/components/ui/Typography"; // adjust path if needed
import type { ReactNode } from "react";
import { View } from "react-native";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  sublabel?: string;
  sublabelColor?: string;
}

export default function StatCard({
  icon,
  value,
  label,
  sublabel,
  sublabelColor = "text-light-success",
}: StatCardProps) {
  return (
    <View className="mx-5 mt-2 bg-light-surface rounded-2xl border border-light-border shadow-sm px-5 py-4 flex-row items-center gap-x-4">
      {/* Icon */}
      <View className="w-12 h-12 rounded-xl bg-light-background border border-light-border items-center justify-center">
        {icon}
      </View>

      {/* Values */}
      <View className="flex-1">
        <Body className="text-light-muted text-xs uppercase tracking-widest mt-0.5">
          {label}
        </Body>
        <Title className="text-3xl leading-tight tracking-tight">{value}</Title>
      </View>

      {/* Sublabel pill */}
      {sublabel && (
        <View className="bg-light-success/10 border border-light-success/20 px-2.5 py-1 rounded-full">
          <Caption className={`${sublabelColor} text-base font-heavy`}>
            {sublabel}
          </Caption>
        </View>
      )}
    </View>
  );
}
