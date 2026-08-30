import * as signalR from "@microsoft/signalr";
import * as SecureStore from "expo-secure-store";

// Polyfill __non_webpack_require__ for Metro / Expo Static Export
if (typeof (globalThis as any).__non_webpack_require__ === "undefined") {
  (globalThis as any).__non_webpack_require__ = undefined;
}

const getHubUrl = () => {
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.VITE_API_URL ||
    "http://54.90.173.98:5000/api";
  // Strip trailing '/api' or '/api/' since ASP.NET Core SignalR hubs are mapped at root level
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");
  return `${baseUrl}/hubs/notifications`;
};

type Callback = (data: any) => void;
const violationListeners = new Set<Callback>();
const exitResponseListeners = new Set<Callback>();
const paymentProcessedListeners = new Set<Callback>();
const semesterResetListeners = new Set<Callback>();

let hubConnection: signalR.HubConnection | null = null;

export const getConnection = (): signalR.HubConnection => {
  if (!hubConnection) {
    hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        accessTokenFactory: async () => {
          const token = await SecureStore.getItemAsync("token");
          return token ?? "";
        },
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    hubConnection.on("ReceiveViolation", (data: any) => {
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

    hubConnection.on("exitresponse", handleExitResponseGlobal);
    hubConnection.on("ExitResponse", handleExitResponseGlobal);

    const handlePaymentProcessedGlobal = (data: any) => {
      console.log("[SignalR Global Proxy] PaymentProcessed event triggered:", data);
      paymentProcessedListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error("[SignalR Global Proxy] Error in PaymentProcessed listener:", err);
        }
      });
    };

    const handleSemesterResetGlobal = (data: any) => {
      console.log("[SignalR Global Proxy] SemesterReset event triggered:", data);
      semesterResetListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error("[SignalR Global Proxy] Error in SemesterReset listener:", err);
        }
      });
    };

    const handleParkingSessionGlobal = (data: any) => {
      console.log("[SignalR Global Proxy] ParkingSessionUpdated event triggered:", data);
      parkingSessionListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error("[SignalR Global Proxy] Error in ParkingSessionUpdated listener:", err);
        }
      });
    };

    hubConnection.on("SemesterReset", handleSemesterResetGlobal);
    hubConnection.on("semesterreset", handleSemesterResetGlobal);
    hubConnection.on("ParkingSessionUpdated", handleParkingSessionGlobal);
    hubConnection.on("parkingsessionupdated", handleParkingSessionGlobal);
    hubConnection.on("ReceiveParkingSession", handleParkingSessionGlobal);
    hubConnection.on("ParkingStatusChanged", handleParkingSessionGlobal);
  }

  return hubConnection;
};

export const connection = {
  get state() {
    return getConnection().state;
  },
  start: () => getConnection().start(),
  stop: () => getConnection().stop(),
};

const parkingSessionListeners = new Set<Callback>();

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

export const registerPaymentProcessedListener = (callback: Callback) => {
  paymentProcessedListeners.add(callback);
  return () => {
    paymentProcessedListeners.delete(callback);
  };
};

export const registerSemesterResetListener = (callback: Callback) => {
  semesterResetListeners.add(callback);
  return () => {
    semesterResetListeners.delete(callback);
  };
};

export const registerParkingSessionListener = (callback: Callback) => {
  parkingSessionListeners.add(callback);
  return () => {
    parkingSessionListeners.delete(callback);
  };
};
