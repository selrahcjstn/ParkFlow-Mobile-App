import { vehicleService } from "@/features/user/services/vehicle.service";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import { create } from "zustand";
import { queryClient } from "@/services/queryClient";

type VehicleState = {
  vehicles: VehicleResponse[];
  vehicle: VehicleResponse | null;
  isLoading: boolean;
  hasHydrated: boolean;

  loadVehicle: (forceFresh?: boolean) => Promise<boolean>;
  setVehicle: (vehicle: VehicleResponse | null) => void;
  setVehicles: (vehicles: VehicleResponse[]) => void;
  clearVehicle: () => void;
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  vehicle: null,
  isLoading: false,
  hasHydrated: false,

  loadVehicle: async (forceFresh = false) => {
    if (get().isLoading && !forceFresh) return false;

    set({ isLoading: true });

    try {
      if (forceFresh) {
        queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      }

      const res = await vehicleService.getVehicles();
      const list = res.data ?? res.result;
      if (!res?.isSuccess || !Array.isArray(list)) {
        throw new Error(res?.message || "Failed to fetch vehicles");
      }

      queryClient.setQueryData(["vehicles"], list);
      set({ vehicles: list });

      const currentVehicle = get().vehicle;
      const remainsSelected = currentVehicle ? list.find((v) => v.id === currentVehicle.id) : null;

      if (remainsSelected) {
        set({ vehicle: remainsSelected });
      } else {
        const primary = list.find((v) => v.isPrimary);
        const autoSelect = primary ?? list[0] ?? null;
        set({ vehicle: autoSelect });
        if (list.length > 0 && !primary && autoSelect) {
          vehicleService.setPrimaryVehicle(autoSelect.id).catch(() => {});
        }
      }
      set({ hasHydrated: true });
      return true;
    } catch {
      // A failed request does not mean the user has no registered vehicles.
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  setVehicle: (vehicle) => set({ vehicle }),
  setVehicles: (vehicles) => set({ vehicles }),
  clearVehicle: () =>
    set({ vehicles: [], vehicle: null, isLoading: false, hasHydrated: false }),
}));
