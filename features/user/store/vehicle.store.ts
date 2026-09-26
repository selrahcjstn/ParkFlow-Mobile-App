import { vehicleService } from "@/features/user/services/vehicle.service";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import { create } from "zustand";
import { queryClient } from "@/services/queryClient";

type VehicleState = {
  vehicles: VehicleResponse[];
  vehicle: VehicleResponse | null;
  isLoading: boolean;
  hasHydrated: boolean;

  loadVehicle: () => Promise<void>;
  setVehicle: (vehicle: VehicleResponse | null) => void;
  setVehicles: (vehicles: VehicleResponse[]) => void;
  clearVehicle: () => void;
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  vehicle: null,
  isLoading: false,
  hasHydrated: false,

  loadVehicle: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });

    try {
      const data = await queryClient.fetchQuery<VehicleResponse[]>({
        queryKey: ["vehicles"],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
          const res = await vehicleService.getVehicles();
          const list = res.data ?? res.result;
          if (!res?.isSuccess || !Array.isArray(list)) {
            throw new Error(res?.message || "Failed to fetch vehicles");
          }
          return list;
        },
      });

      set({ vehicles: data });

      const currentVehicle = get().vehicle;
      const remainsSelected = currentVehicle ? data.find((v) => v.id === currentVehicle.id) : null;

      if (remainsSelected) {
        set({ vehicle: remainsSelected });
      } else {
        const primary = data.find((v) => v.isPrimary);
        const autoSelect = primary ?? data[0] ?? null;
        set({ vehicle: autoSelect });
        if (data.length > 0 && !primary && autoSelect) {
          vehicleService.setPrimaryVehicle(autoSelect.id).catch(() => {});
        }
      }
    } catch {
      set({ vehicles: [], vehicle: null });
    } finally {
      set({ isLoading: false, hasHydrated: true });
    }
  },

  setVehicle: (vehicle) => set({ vehicle }),
  setVehicles: (vehicles) => set({ vehicles }),
  clearVehicle: () =>
    set({ vehicles: [], vehicle: null, isLoading: false, hasHydrated: false }),
}));
