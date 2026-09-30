import { create } from "zustand";
import { ScheduleService } from "../services/schedule.service";
import { ScheduleResponse } from "../types/schedule.types";
import { queryClient } from "@/services/queryClient";

type ScheduleState = {
  schedules: ScheduleResponse[];
  isLoading: boolean;
  error: string | null;

  setSchedules: (schedules: ScheduleResponse[]) => void;
  fetchSchedules: () => Promise<{ success: boolean; data?: ScheduleResponse[]; message?: string }>;
};

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  isLoading: false,
  error: null,

  setSchedules: (schedules) => set({ schedules }),

  fetchSchedules: async (forceRefresh = true) => {
    set({ isLoading: true, error: null });
    try {
      if (forceRefresh) {
        await queryClient.invalidateQueries({ queryKey: ["schedules"] });
      }
      const data = await queryClient.fetchQuery<ScheduleResponse[]>({
        queryKey: ["schedules"],
        staleTime: forceRefresh ? 0 : 1000 * 60 * 2,
        queryFn: async () => {
          const res = await ScheduleService.getSchedules();
          if (!res?.isSuccess || !res.data) {
            throw new Error(res?.message || "Failed to fetch schedules");
          }
          return res.data;
        },
      });
      set({ schedules: data, isLoading: false });
      return { success: true, data };
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred while fetching schedules";
      set({ error: errMsg, isLoading: false });
      return { success: false, message: errMsg };
    }
  },
}));
