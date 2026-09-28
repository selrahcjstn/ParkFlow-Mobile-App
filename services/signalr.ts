import * as signalR from "@microsoft/signalr";
import { SecureStore } from "./storage";
import { SERVER_BASE_URL } from "./apiConfig";
import { queryClient } from "./queryClient";

// Polyfill __non_webpack_require__ for Metro / Expo Static Export
if (typeof (globalThis as any).__non_webpack_require__ === "undefined") {
  (globalThis as any).__non_webpack_require__ = undefined;
}

const getHubUrl = () => {
  const base = (SERVER_BASE_URL || "http://54.90.173.98:5000").replace(/\/+$/, "");
  return `${base}/hubs/notifications`;
};

type Callback = (data: any) => void;
const violationListeners = new Set<Callback>();
const exitResponseListeners = new Set<Callback>();
const paymentProcessedListeners = new Set<Callback>();
const semesterResetListeners = new Set<Callback>();
const reservationListeners = new Set<Callback>();
const verificationStatusListeners = new Set<Callback>();
const accountSuspendedListeners = new Set<Callback>();

let hubConnection: signalR.HubConnection | null = null;

export const getConnection = (): signalR.HubConnection => {
  if (!hubConnection) {
    try {
      hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(getHubUrl(), {
          accessTokenFactory: async () => {
            try {
              const token = await SecureStore.getItemAsync("token");
              return token ?? "";
            } catch {
              return "";
            }
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

      const handleReservationGlobal = (data: any) => {
        console.log("[SignalR Global Proxy] ReservationUpdated event triggered:", data);
        reservationListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (err) {
            console.error("[SignalR Global Proxy] Error in ReservationUpdated listener:", err);
          }
        });
      };

      const handleVerificationStatusGlobal = (data: any) => {
        console.log("[SignalR Global Proxy] VerificationStatusChanged event triggered:", data);
        verificationStatusListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (err) {
            console.error("[SignalR Global Proxy] Error in VerificationStatusChanged listener:", err);
          }
        });
      };

      const handleAccountSuspendedGlobal = (data: any) => {
        console.log("[SignalR Global Proxy] AccountSuspended event triggered:", data);
        accountSuspendedListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (err) {
            console.error("[SignalR Global Proxy] Error in AccountSuspended listener:", err);
          }
        });
      };

      hubConnection.on("SemesterReset", handleSemesterResetGlobal);
      hubConnection.on("semesterreset", handleSemesterResetGlobal);
      hubConnection.on("ParkingSessionUpdated", handleParkingSessionGlobal);
      hubConnection.on("parkingsessionupdated", handleParkingSessionGlobal);
      hubConnection.on("ReceiveParkingSession", handleParkingSessionGlobal);
      hubConnection.on("ParkingStatusChanged", handleParkingSessionGlobal);
      hubConnection.on("ReservationUpdated", handleReservationGlobal);
      hubConnection.on("reservationupdated", handleReservationGlobal);
      hubConnection.on("ReceiveReservation", handleReservationGlobal);
      hubConnection.on("VerificationStatusChanged", handleVerificationStatusGlobal);
      hubConnection.on("verificationstatuschanged", handleVerificationStatusGlobal);

      const handleSystemSettingsUpdated = (data: any) => {
        console.log("[SignalR Global Proxy] SystemSettingsUpdated event triggered:", data);
        queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
      };
      hubConnection.on("SystemSettingsUpdated", handleSystemSettingsUpdated);
      hubConnection.on("systemsettingsupdated", handleSystemSettingsUpdated);
      hubConnection.on("ApprovalListUpdated", handleVerificationStatusGlobal);
      hubConnection.on("approvallistupdated", handleVerificationStatusGlobal);
      hubConnection.on("AccountSuspended", handleAccountSuspendedGlobal);
      hubConnection.on("accountsuspended", handleAccountSuspendedGlobal);
    } catch (err) {
      console.warn("[SignalR Global Proxy] Failed to initialize HubConnection:", err);
      // Fallback instance with a safe dummy builder if build failed
      hubConnection = new signalR.HubConnectionBuilder()
        .withUrl("http://54.90.173.98:5000/hubs/notifications")
        .build();
    }
  }

  return hubConnection;
};

export const connection = {
  get state() {
    try {
      const conn = getConnection();
      return conn?.state ?? signalR.HubConnectionState.Disconnected;
    } catch (err) {
      console.warn("[SignalR] Failed to get connection state:", err);
      return signalR.HubConnectionState.Disconnected;
    }
  },
  start: async () => {
    try {
      const conn = getConnection();
      if (conn && conn.state === signalR.HubConnectionState.Disconnected) {
        console.log("[SignalR] Connecting to notification hub...");
        await conn.start();
        console.log("[SignalR] Hub connection established successfully! State:", conn.state);
      }
    } catch (err) {
      console.warn("[SignalR] Hub connection start failed:", err);
    }
  },
  stop: async () => {
    try {
      const conn = getConnection();
      if (conn && conn.state !== signalR.HubConnectionState.Disconnected) {
        await conn.stop();
        console.log("[SignalR] Hub connection stopped.");
      }
    } catch (err) {
      console.warn("[SignalR] Hub connection stop failed:", err);
    }
  },
  restart: async () => {
    try {
      console.log("[SignalR] Restarting connection with latest auth token...");
      if (hubConnection && hubConnection.state !== signalR.HubConnectionState.Disconnected) {
        try {
          await hubConnection.stop();
        } catch {}
      }
      hubConnection = null; // Reset connection instance so new token is picked up by accessTokenFactory
      const conn = getConnection();
      await conn.start();
      console.log("[SignalR] Hub connection successfully restarted! State:", conn.state);
    } catch (err) {
      console.warn("[SignalR] Hub connection restart failed:", err);
    }
  },
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

export const registerReservationListener = (callback: Callback) => {
  reservationListeners.add(callback);
  return () => {
    reservationListeners.delete(callback);
  };
};

export const registerVerificationStatusListener = (callback: Callback) => {
  verificationStatusListeners.add(callback);
  return () => {
    verificationStatusListeners.delete(callback);
  };
};

export const registerAccountSuspendedListener = (callback: Callback) => {
  accountSuspendedListeners.add(callback);
  return () => {
    accountSuspendedListeners.delete(callback);
  };
};
