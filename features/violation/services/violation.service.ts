import { apiRequest } from "@/services/common.service";
import { ActiveViolationDto } from "../types/violation.types";

export const violationService = {
  getActiveViolations: async () => {
    return await apiRequest<ActiveViolationDto[], void>(
      "get",
      "/violations/my",
    );
  },
};
