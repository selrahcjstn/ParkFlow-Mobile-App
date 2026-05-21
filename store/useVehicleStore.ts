import { vehicleService } from "@/services/vehicle.service";
import { VehicleResponse } from "@/types/vehicle";
import { create } from "zustand";

type VehicleState = {
  vehicle: VehicleResponse | null;
  isLoading: boolean;
  hasHydrated: boolean;

  loadVehicle: () => Promise<void>;
  setVehicle: (vehicle: VehicleResponse | null) => void;
  clearVehicle: () => void;
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicle: null,
  isLoading: false,
  hasHydrated: false,

  loadVehicle: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });

    try {
      const res = await vehicleService.getVehicles();

      if (!res?.isSuccess) {
        set({ vehicle: null });
        return;
      }

      const firstVehicle = res.data?.[0];

      if (!firstVehicle) {
        set({ vehicle: null });
        return;
      }

      set({
        vehicle: {
          id: firstVehicle.id,
          plateNumber: firstVehicle.plateNumber,
          brand: firstVehicle.brand,
          qrCodeHash: firstVehicle.qrCodeHash,
          vehicleType: firstVehicle.vehicleType,
          status: firstVehicle.status,
        },
      });
    } catch {
      set({ vehicle: null });
    } finally {
      set({ isLoading: false, hasHydrated: true });
    }
  },

  setVehicle: (vehicle) => set({ vehicle }),
  clearVehicle: () =>
    set({ vehicle: null, isLoading: false, hasHydrated: false }),
}));
