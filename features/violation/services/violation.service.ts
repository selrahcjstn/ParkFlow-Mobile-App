import { apiRequest } from "@/services/common.service";
import { ActiveViolationDto } from "../types/violation.types";

export const violationService = {
  getActiveViolations: async () => {
    return await apiRequest<ActiveViolationDto[], void>(
      "get",
      "/violations/my",
    );
  },
  getViolationHistory: async (pageNumber: number = 1, pageSize: number = 20, unpaidOnly?: boolean) => {
    const query = unpaidOnly !== undefined ? `?unpaidOnly=${unpaidOnly}` : "";
    return await apiRequest<{
      generatedAt: string;
      items: ActiveViolationDto[];
    }>(
      "get",
      `/violations/history/page/${pageNumber}/${pageSize}${query}`
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
