import { parkingLogService } from "@/services/parking-log.service";
import { ParkingLogRequest, ParkingLogResponse } from "@/types/parkingLog";
import { create } from "zustand";

type ParkingLogState = {
  activeLog: ParkingLogResponse | null;
  loading: boolean;
  error: string | null;

  createEntry: (payload: ParkingLogRequest) => Promise<void>;
};

export const useParkingLogStore = create<ParkingLogState>((set) => ({
  activeLog: null,
  loading: false,
  error: null,

  createEntry: async (payload) => {
    try {
      set({ loading: true, error: null });

      const res = await parkingLogService.register(payload);

      if (res.isSuccess) {
        set({ activeLog: res.data });
      } else {
        set({ error: res.message });
      }
    } catch (err: any) {
      set({ error: err.message ?? "Something went wrong" });
    } finally {
      set({ loading: false });
    }
  },
}));
