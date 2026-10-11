import AppButton from "@/components/ui/AppButton";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ReservationAvailability } from "../types/reservation.types";
import { ActivityIndicator, Text, View } from "react-native";

export default function ReservationAvailabilityNotice({ data, loading = false, error = false, onRetry, daily = false }: {
  data?: ReservationAvailability | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  daily?: boolean;
}) {
  const { colors } = useAppTheme();
  return <View className="rounded-card border border-light-border dark:border-dark-border bg-light-surfaceMuted dark:bg-dark-surfaceMuted p-4 mb-4 gap-2" accessibilityLiveRegion="polite">
    <Text className="text-base font-bold text-light-text dark:text-dark-text">{daily ? "Reservation capacity" : "Reservation availability"}</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : error || !data ? <>
      <Text className="text-sm font-regular text-light-muted dark:text-dark-muted">Could not check reservation capacity.</Text>
      {onRetry && <AppButton label="Try again" variant="outline" size="sm" uppercase={false} onPress={onRetry} />}
    </> : <>
      <Text className="text-sm font-book text-light-text dark:text-dark-text">{data.reservationCapacity} reservation spaces · {data.allocationPercent}% of {data.totalCapacity} total spaces</Text>
      <Text className="text-sm font-regular text-light-text dark:text-dark-text">{daily ? "Peak bookings today" : "Peak bookings in this time range"}: {data.bookedSlots} / {data.reservationCapacity}</Text>
      {!daily && <Text className={`text-sm font-bold ${data.availableSlots > 0 ? "text-light-text dark:text-dark-success" : "text-light-text dark:text-dark-danger"}`}>
        {data.availableSlots > 0 ? `${data.availableSlots} spaces available for your selected time` : "Fully booked. Choose another time or date."}
      </Text>}
      <Text className="text-xs font-regular text-light-muted dark:text-dark-muted">Pending and approved bookings count. Reservation spaces are part of the total parking capacity, not extra spaces.</Text>
    </>}
  </View>;
}
