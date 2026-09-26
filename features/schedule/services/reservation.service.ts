import { apiRequest } from "@/services/common.service";
import {
  CreateReservationRequest,
  ParkingReservationResponse,
} from "../types/reservation.types";

export const ReservationService = {
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
