import { apiRequest } from "@/services/common.service";
import { ActiveViolationDto } from "../types/violation.types";

export const violationService = {
  getActiveViolations: async () => {
    return await apiRequest<ActiveViolationDto[], void>(
      "get",
      "/violations/my",
    );
  },
  processPayment: async (referenceNumber: string) => {
    return await apiRequest<{ success: boolean; message?: string }, { referenceNumber: string }>(
      "post",
      "/violations/process-payment",
      { referenceNumber }
    );
  },
};
