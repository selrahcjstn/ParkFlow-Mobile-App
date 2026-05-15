import { Body, Caption, Title } from "@/components/ui/Typography";
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
      <View className="w-12 h-12 rounded-xl bg-light-background border border-light-border items-center justify-center">
        {icon}
      </View>

      <View className="flex-1">
        <Caption className="uppercase tracking-widest">{label}</Caption>
        <Title className="text-3xl leading-tight tracking-tight">{value}</Title>
      </View>

      {sublabel ? (
        <View className="bg-light-success/10 border border-light-success/20 px-2.5 py-1 rounded-full">
          <Caption className={`${sublabelColor} font-heavy`}>{sublabel}</Caption>
        </View>
      ) : null}
    </View>
  );
}
