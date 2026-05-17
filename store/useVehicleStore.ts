import { userService } from "@/services/user.service";
import { create } from "zustand";

type Vehicle = {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  vehicleType: number;
};

type VehicleState = {
  vehicle: Vehicle | null;
  isLoading: boolean;
  hasHydrated: boolean;

  loadVehicle: () => Promise<void>;
  setVehicle: (vehicle: Vehicle | null) => void;
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
      const res = await userService.getVehicles();

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
