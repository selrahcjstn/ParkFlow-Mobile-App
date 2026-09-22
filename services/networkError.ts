export type NetworkErrorKind = "network" | "configuration";

export type NetworkErrorDetails = {
  kind: NetworkErrorKind;
  message: string;
  baseURL?: string;
  requestUrl?: string;
  code?: string;
  timestamp: number;
};

type Listener = (error: NetworkErrorDetails | null) => void;

let currentError: NetworkErrorDetails | null = null;
const listeners = new Set<Listener>();

export const reportNetworkError = (details: Omit<NetworkErrorDetails, "timestamp">) => {
  currentError = { ...details, timestamp: Date.now() };
  listeners.forEach((listener) => listener(currentError));
};

export const clearNetworkError = () => {
  currentError = null;
  listeners.forEach((listener) => listener(null));
};

export const getNetworkErrorSnapshot = () => currentError;

export const subscribeToNetworkErrors = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
