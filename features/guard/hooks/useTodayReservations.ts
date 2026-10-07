import { ReservationService } from "@/features/schedule/services/reservation.service";
import { registerParkingSessionListener, registerReservationListener } from "@/services/signalr";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

export function getCampusDate(now = new Date()) {
  return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Shared by the five-row dashboard preview and the searchable full page.
export function useTodayReservations(page = 1, search = "") {
  const client = useQueryClient();
  const [focused, setFocused] = useState(false);
  const [day, setDay] = useState(getCampusDate);
  const query = useQuery({
    queryKey: ["guard-today-reservations", day, page, search],
    queryFn: async () => {
      const response = await ReservationService.getTodayForGuard(page, search);
      if (!response.isSuccess || !response.data) throw new Error(response.message);
      return response.data;
    },
    enabled: focused,
    staleTime: 15000,
    refetchInterval: focused ? 30000 : false,
    retry: 1,
  });
  useFocusEffect(useCallback(() => {
    setDay(getCampusDate());
    setFocused(true);
    void client.invalidateQueries({ queryKey: ["guard-today-reservations"] });
    return () => setFocused(false);
  }, [client]));
  useEffect(() => {
    if (!focused) return;
    const refresh = () => {
      setDay(getCampusDate());
      void client.invalidateQueries({ queryKey: ["guard-today-reservations"] });
    };
    const offReservations = registerReservationListener(refresh);
    const offParking = registerParkingSessionListener(refresh);
    const timer = setInterval(() => setDay(getCampusDate()), 30000);
    return () => { offReservations(); offParking(); clearInterval(timer); };
  }, [client, focused]);
  return query;
}
