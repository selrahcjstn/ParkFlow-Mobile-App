import { apiRequest } from "@/services/common.service";
import {
  CreateReservationRequest,
  ParkingReservationResponse,
  GuardReservationPage,
  ReservationAvailability,
} from "../types/reservation.types";

export const ReservationService = {
  getAvailability: async (date: string, startTime: string, endTime: string) => {
    const params = new URLSearchParams({ date, startTime, endTime });
    return apiRequest<ReservationAvailability>("get", `/parking-reservations/availability?${params.toString()}`,
      undefined, { handleNetworkErrorLocally: true });
  },
  getTodayForGuard: async (page = 1, search = "") => {
    return apiRequest<GuardReservationPage>("get",
      `/parking-reservations/guard/today?page=${page}&search=${encodeURIComponent(search)}`,
      undefined, { handleNetworkErrorLocally: true });
  },
  createReservation: async (data: CreateReservationRequest) => {
    return apiRequest<ParkingReservationResponse>(
      "post",
      "/parking-reservations",
      data,
    );
  },

  getMyReservations: async () => {
    return apiRequest<ParkingReservationResponse[]>(
      "get",
      "/parking-reservations/my",
    );
  },

  getReservationById: async (id: string) => {
    return apiRequest<ParkingReservationResponse>(
      "get",
      `/parking-reservations/${id}`,
    );
  },

  cancelReservation: async (id: string) => {
    return apiRequest<boolean>(
      "post",
      `/parking-reservations/${id}/cancel`,
    );
  },
};
