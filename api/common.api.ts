import type { ApiResponse } from "@/types/apiResponse";
import type { Method } from "axios";

import { api } from "./axios";

export async function apiRequest<TResponse, TBody = unknown>(
  method: Method,
  url: string,
  body?: TBody,
) {
  const response = await api.request<ApiResponse<TResponse>>({
    method,
    url,
    data: body,
  });

  return response as unknown as ApiResponse<TResponse>;
}
