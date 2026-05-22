import type { VehicleResponse } from "@/types/vehicle";

import { apiRequest } from "./common.api";

export const vehicleService = {
  getVehicles: async () => {
    return apiRequest<VehicleResponse[]>("get", "/vehicles/owner/my");
  },
};
