import AppButton from "@/components/ui/AppButton";
import { SessionListItemSkeleton } from "@/components/ui/Skeleton";
import { GuardReservationItem } from "@/features/schedule/types/reservation.types";
import React from "react";
import { Text, View } from "react-native";

export function reservationProgress(status: number | string) {
  return status === 4 || String(status).toLowerCase() === "completed" ? "Concluded" : "Not concluded";
}

function timeLabel(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "—";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

export default function TodayReservationList({ items, loading, error, onRetry }: {
  items: GuardReservationItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <View className="bg-light-surface dark:bg-dark-surface rounded-card px-4 border border-light-border dark:border-dark-border">
      {loading ? <View className="py-4"><SessionListItemSkeleton /><SessionListItemSkeleton /></View>
        : error ? <View className="py-6 gap-3">
          <Text className="text-light-text dark:text-dark-text font-book text-center">{"Could not load today's reservations. Please try again."}</Text>
          <AppButton label="Try again" variant="outline" uppercase={false} onPress={onRetry} />
        </View>
        : items.length === 0 ? <View className="py-8 gap-2">
          <Text className="text-light-text dark:text-dark-text font-bold text-center">No reservations to show</Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-center">Only approved and concluded reservations for today appear here.</Text>
        </View>
        : items.map((item, index) => {
          const concluded = reservationProgress(item.status) === "Concluded";
          return <View key={item.id} className={`py-4 gap-2 ${index < items.length - 1 ? "border-b border-light-border dark:border-dark-border" : ""}`}>
            <View className="flex-row items-start gap-3">
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-base">{item.userFullName || "Reserved guest"}</Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-sm mt-1">{item.plateNumber || "No vehicle assigned"}</Text>
              </View>
              <View className={`rounded-pill px-2.5 py-1.5 ${concluded ? "bg-light-success/10 dark:bg-dark-success/10" : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted"}`}>
                <Text className={`font-book text-xs ${concluded ? "text-light-text dark:text-dark-success" : "text-light-muted dark:text-dark-muted"}`}>{reservationProgress(item.status)}</Text>
              </View>
            </View>
            <Text className="text-light-text dark:text-dark-text font-book text-sm">{timeLabel(item.startTime)} – {timeLabel(item.endTime)}</Text>
          </View>;
        })}
    </View>
  );
}
