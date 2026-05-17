import type { VehicleResponse } from "@/types/vehicle";

import { apiRequest } from "./apiRequest";

export const vehicleService = {
  getVehicles: async () => {
    return apiRequest<VehicleResponse[]>("get", "/vehicles/owner/my");
  },
};
