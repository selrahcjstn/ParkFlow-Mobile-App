import type { VehicleResponse } from "@/types/vehicle.types";

import { apiRequest } from "../../../services/common.service";

export const vehicleService = {
  getVehicles: async () => {
    return apiRequest<VehicleResponse[]>("get", "/vehicles/owner/my");
  },
};
