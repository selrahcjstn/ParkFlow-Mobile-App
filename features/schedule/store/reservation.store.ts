import { create } from "zustand";
import { ReservationService } from "../services/reservation.service";
import {
  CreateReservationRequest,
  ParkingReservationResponse,
  ReservationStatus,
} from "../types/reservation.types";
import { queryClient } from "@/services/queryClient";

type ReservationState = {
  reservations: ParkingReservationResponse[];
  activeReservation: ParkingReservationResponse | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchMyReservations: () => Promise<{ success: boolean; data?: ParkingReservationResponse[]; message?: string }>;
  createReservation: (data: CreateReservationRequest) => Promise<{ success: boolean; data?: ParkingReservationResponse; message?: string }>;
  cancelReservation: (id: string) => Promise<{ success: boolean; message?: string }>;
};

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: [],
  activeReservation: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchMyReservations: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await ReservationService.getMyReservations();
      if (!res?.isSuccess || !res.data) {
        throw new Error(res?.message || "Failed to fetch reservations");
      }
      const data = res.data;

      // Active reservation is the latest Pending or Approved reservation
      const active = data.find(
        (r) => r.status === ReservationStatus.Pending || r.status === ReservationStatus.Approved,
      ) || null;

      set({ reservations: data, activeReservation: active, isLoading: false });
      return { success: true, data };
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load reservations";
      set({ error: errMsg, isLoading: false });
      return { success: false, message: errMsg };
    }
  },

  createReservation: async (data: CreateReservationRequest) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await ReservationService.createReservation(data);
      if (!res?.isSuccess || !res.data) {
        throw new Error(res?.message || "Failed to create reservation");
      }
      const newReservation = res.data;

      // Invalidate queries & update state
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      const currentList = get().reservations;
      set({
        reservations: [newReservation, ...currentList],
        activeReservation: newReservation,
        isSubmitting: false,
      });

      return { success: true, data: newReservation };
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create reservation";
      set({ error: errMsg, isSubmitting: false });
      return { success: false, message: errMsg };
    }
  },

  cancelReservation: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await ReservationService.cancelReservation(id);
      if (!res?.isSuccess) {
        throw new Error(res?.message || "Failed to cancel reservation");
      }

      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      const updatedList = get().reservations.map((r) =>
        r.id === id ? { ...r, status: ReservationStatus.Cancelled } : r,
      );
      set({
        reservations: updatedList,
        activeReservation: null,
        isSubmitting: false,
      });

      return { success: true };
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to cancel reservation";
      set({ error: errMsg, isSubmitting: false });
      return { success: false, message: errMsg };
    }
  },
}));
