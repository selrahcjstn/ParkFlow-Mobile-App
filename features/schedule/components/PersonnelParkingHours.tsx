import { useAuthStore } from '@/features/auth/store/auth.store';
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
  const isFaculty = useAuthStore(s => s.user?.role === "UniversityStaff");
  const settings = useSystemSettingsQuery();
  const { colors } = useAppTheme();
  return (
    <View className="bg-light-surface dark:bg-dark-surface rounded-card p-5 border border-light-border dark:border-dark-border mb-4 gap-3">
      <Text className="text-light-text dark:text-dark-text font-bold text-lg">University parking hours</Text>
      <Text className="text-light-muted dark:text-dark-muted font-regular text-sm leading-5">Parking hours are managed by the Super Admin. Campus parking is free upon entry during permitted hours; only vehicle overstay beyond permitted hours incurs a penalty fee.</Text>
      {isFaculty ? <>
        <Text className="text-light-text dark:text-dark-text font-bold text-lg">Faculty parking</Text>
        <Text className="text-light-muted dark:text-dark-muted font-regular text-sm leading-5">Campus parking is free upon entry during permitted hours. Only vehicle overstay beyond authorized schedules incurs a penalty fee. Approved identity, driver documents, and vehicle are required.</Text>
      </> : settings.isPending ? <ActivityIndicator color={colors.primary} />
        : settings.isError || !settings.data ? <>
          <Text className="text-light-text dark:text-dark-danger font-regular text-sm">Could not load university parking hours.</Text>
          <AppButton label="Try again" variant="outline" uppercase={false} onPress={() => void settings.refetch()} />
        </> : <>
          <Text className="text-light-muted dark:text-dark-muted font-book text-sm">Staff hours · Every day, including Sunday</Text>
          <Text className="text-light-text dark:text-dark-text font-bold text-2xl">{formatPersonnelHour(settings.data.personnelFreeParkingStart ?? "05:00")} – {formatPersonnelHour(settings.data.personnelFreeParkingEnd ?? "21:00")}</Text>
          <Text className="text-light-text dark:text-dark-text font-regular text-sm leading-5">Campus parking is free upon entry during permitted hours. Only vehicle overstay beyond permitted hours incurs a penalty fee. Employee schedule, identity, driver documents, and vehicle approvals are separate requirements.</Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-sm leading-5">Entry and exit times continue to be recorded for operational tracking.</Text>
        </>}
    </View>
  );
}
