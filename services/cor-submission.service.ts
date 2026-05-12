// services/cor-submission.service.ts
import { api } from "@/services/api";

export const corSubmissionService = {
  create: async (payload: any) => {
    // Axios automatically stringifies this to JSON and sets Content-Type to application/json
    const res = await api.post("/cor-submissions", payload);
    return res.data;
  },
};
