import AppButton from "@/components/ui/AppButton";
import { useSystemSettingsQuery } from "@/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

export function formatPersonnelHour(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "—";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

export default function PersonnelParkingHours() {
  const settings = useSystemSettingsQuery();
  const { colors } = useAppTheme();
  return (
    <View className="bg-light-surface dark:bg-dark-surface rounded-card p-5 border border-light-border dark:border-dark-border mb-4 gap-3">
      <Text className="text-light-text dark:text-dark-text font-bold text-lg">University parking hours</Text>
      <Text className="text-light-muted dark:text-dark-muted font-regular text-sm leading-5">Managed by the Super Admin. Faculty and university staff do not fill out or upload a personal schedule.</Text>
      {settings.isPending ? <ActivityIndicator color={colors.primary} />
        : settings.isError || !settings.data ? <>
          <Text className="text-light-danger dark:text-dark-danger font-regular text-sm">Could not load university parking hours.</Text>
          <AppButton label="Try again" variant="outline" uppercase={false} onPress={() => void settings.refetch()} />
        </> : <>
          <Text className="text-light-muted dark:text-dark-muted font-book text-sm">Free parking · Every day, including Sunday</Text>
          <Text className="text-light-text dark:text-dark-text font-bold text-2xl">{formatPersonnelHour(settings.data.personnelFreeParkingStart ?? "05:00")} – {formatPersonnelHour(settings.data.personnelFreeParkingEnd ?? "21:00")}</Text>
          <Text className="text-light-text dark:text-dark-text font-regular text-sm leading-5">You may enter anytime with an approved Employee ID and vehicle. Outside these hours, parking costs ₱{Number(settings.data.violationRatePerHour).toFixed(2)} per started hour.</Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-sm leading-5">If you stay past your entry-day cutoff, hourly charges continue until you exit. The next morning does not reset the fee.</Text>
        </>}
    </View>
  );
}
