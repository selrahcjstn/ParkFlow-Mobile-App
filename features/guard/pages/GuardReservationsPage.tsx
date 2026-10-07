import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TodayReservationList from "../components/TodayReservationList";
import { useTodayReservations } from "../hooks/useTodayReservations";

export default function GuardReservationsPage() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ search: "", page: 1 });
  useEffect(() => {
    const timer = setTimeout(() => setFilter({ search: search.trim(), page: 1 }), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const reservations = useTodayReservations(filter.page, filter.search);
  const count = reservations.data?.totalCount ?? 0;
  const pages = Math.max(1, Math.ceil(count / 5));
  useEffect(() => {
    if (reservations.data && filter.page > pages) setFilter(f => ({ ...f, page: pages }));
  }, [reservations.data, filter.page, pages]);

  return <SubScreenLayout title="Today's reservations" onBack={() => router.canGoBack() ? router.back() : router.replace("/(guard)/(tabs)/home")}>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={reservations.isRefetching} onRefresh={() => void reservations.refetch()} tintColor={colors.primary} colors={[colors.primary]} />}>
      <View className="w-full max-w-[1200px] self-center">
        <AppInput label="Search reservations" placeholder="Search name, plate, or reference…" value={search} maxLength={100} onChangeText={setSearch} accessibilityLabel="Search today's reservations" returnKeyType="search" />
        <Text className="text-light-muted dark:text-dark-muted font-regular text-sm mb-4">Today's approved and concluded reservations · Philippine time</Text>
        <TodayReservationList items={reservations.data?.items ?? []} loading={reservations.isPending} error={reservations.isError} onRetry={() => void reservations.refetch()} />
        {reservations.data && !reservations.isError ? <View className="mt-4 gap-3">
          <Text className="text-light-muted dark:text-dark-muted font-book text-sm text-center">{count} reservations · Page {filter.page} of {pages}</Text>
          {pages > 1 ? <View className="flex-row gap-3">
            <AppButton className="flex-1" label="Previous" variant="outline" uppercase={false} disabled={filter.page <= 1 || reservations.isFetching} onPress={() => setFilter(f => ({ ...f, page: f.page - 1 }))} />
            <AppButton className="flex-1" label="Next" variant="outline" uppercase={false} disabled={filter.page >= pages || reservations.isFetching} onPress={() => setFilter(f => ({ ...f, page: f.page + 1 }))} />
          </View> : null}
        </View> : null}
      </View>
    </ScrollView>
  </SubScreenLayout>;
}
