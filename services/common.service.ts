import type { ApiResponse } from "@/types/api-response.types";
import type { Method } from "axios";

import { api } from "./axios";

export async function apiRequest<TResponse, TBody = unknown>(
  method: Method,
  url: string,
  body?: TBody,
  options?: { handleNetworkErrorLocally?: boolean },
) {
  const response = await api.request<ApiResponse<TResponse>>({
    method,
    url,
    data: body,
    ...options,
  });

  return response as unknown as ApiResponse<TResponse>;
}
