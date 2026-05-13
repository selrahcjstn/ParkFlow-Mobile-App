import { userService } from "@/services/user.service";
import { create } from "zustand";

type VehicleState = {
  vehicle: null | {
    id: string;
    plateNumber: string;
    brand: string;
    qrCodeHash: string;
  };

  loadVehicle: () => Promise<void>;
  setVehicle: (vehicle: VehicleState["vehicle"]) => void;
  clearVehicle: () => void;
};

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicle: null,

  loadVehicle: async () => {
    try {
      const res = await userService.getVehicles();

      if (!res?.isSuccess) {
        console.error(
          "[vehicle] loadVehicle error:",
          res?.message || "Failed to load vehicle",
        );
        return;
      }

      const firstVehicle = res.data?.[0];

      if (!firstVehicle) {
        console.error("No vehicle found");
        return;
      }

      const vehicle = {
        id: firstVehicle.id,
        plateNumber: firstVehicle.plateNumber,
        brand: firstVehicle.brand,
        qrCodeHash: firstVehicle.qrCodeHash,
      };

      set({ vehicle });
    } catch (error) {
      console.error("[vehicle] loadVehicle error:", error);
    }
  },

  setVehicle: (vehicle) => set({ vehicle }),
  clearVehicle: () => set({ vehicle: null }),
}));
