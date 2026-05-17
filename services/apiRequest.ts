import type { ApiResponse } from "@/types/apiResponse";
import type { Method } from "axios";

import { api } from "./api";

export async function apiRequest<TResponse, TBody = unknown>(
  method: Method,
  url: string,
  body?: TBody,
) {
  return (await api.request<ApiResponse<TResponse>>({
    method,
    url,
    data: body,
  })) as ApiResponse<TResponse>;
}
