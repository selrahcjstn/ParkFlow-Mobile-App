import * as signalR from "@microsoft/signalr";
import * as SecureStore from "expo-secure-store";

const getHubUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "";
  // Strip trailing '/api' or '/api/' since ASP.NET Core SignalR hubs are mapped at root level
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");
  return `${baseUrl}/hubs/notifications`;
};

export const connection = new signalR.HubConnectionBuilder()
  .withUrl(getHubUrl(), {
    accessTokenFactory: async () => {
      const token = await SecureStore.getItemAsync("token");
      return token ?? "";
    },
  })
  .withAutomaticReconnect()
  .configureLogging(signalR.LogLevel.Warning)
  .build();

// Proxy listener sets to allow UI components to subscribe/unsubscribe dynamically
// while keeping the physical SignalR method registrations active globally.
type Callback = (data: any) => void;
const violationListeners = new Set<Callback>();
const exitResponseListeners = new Set<Callback>();

connection.on("ReceiveViolation", (data) => {
  console.log("[SignalR Global Proxy] ReceiveViolation event triggered:", data);
  violationListeners.forEach((listener) => {
    try {
      listener(data);
    } catch (err) {
      console.error("[SignalR Global Proxy] Error in ReceiveViolation listener:", err);
    }
  });
});

const handleExitResponseGlobal = (data: any) => {
  console.log("[SignalR Global Proxy] exitresponse event triggered:", data);
  exitResponseListeners.forEach((listener) => {
    try {
      listener(data);
    } catch (err) {
      console.error("[SignalR Global Proxy] Error in exitresponse listener:", err);
    }
  });
};

connection.on("exitresponse", handleExitResponseGlobal);
connection.on("ExitResponse", handleExitResponseGlobal);

export const registerViolationListener = (callback: Callback) => {
  violationListeners.add(callback);
  return () => {
    violationListeners.delete(callback);
  };
};

export const registerExitResponseListener = (callback: Callback) => {
  exitResponseListeners.add(callback);
  return () => {
    exitResponseListeners.delete(callback);
  };
};
