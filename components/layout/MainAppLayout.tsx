import { DashboardHeader, DashboardLayout } from "@/components/layout";
import React from "react";
import { View } from "react-native";

type Props = {
  children?: React.ReactNode;
  title?: string;
};

export default function GuardDashboard({ children, title }: Props) {
  return (
    <DashboardLayout>
      <DashboardHeader title={title ?? "Dashboard"} />
      <View className="flex-1 bg-light-background rounded-t-3xl  pt-2">
        {children}
      </View>
    </DashboardLayout>
  );
}
