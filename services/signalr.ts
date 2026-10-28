import * as signalR from "@microsoft/signalr";
import { SecureStore } from "./storage";
import { SERVER_BASE_URL, getApiConfigurationError } from "./apiConfig";
import { queryClient } from "./queryClient";

// Polyfill __non_webpack_require__ for Metro / Expo Static Export
if (typeof (globalThis as any).__non_webpack_require__ === "undefined") {
  (globalThis as any).__non_webpack_require__ = undefined;
}

const getHubUrl = () => {
  const error = getApiConfigurationError();
  if (error) throw new Error(error);
  const base = SERVER_BASE_URL.replace(/\/+$/, "");
  return `${base}/hubs/notifications`;
};

type Callback = (data: any) => void;
const exitResponseListeners = new Set<Callback>();
const semesterResetListeners = new Set<Callback>();
const reservationListeners = new Set<Callback>();
const verificationStatusListeners = new Set<Callback>();
const accountSuspendedListeners = new Set<Callback>();
const scheduleListeners = new Set<Callback>();

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


      const handleExitResponseGlobal = (data: any) => {
        console.log("[SignalR Global Proxy] exitresponse event triggered:", data);
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
        queryClient.invalidateQueries({ queryKey: ["myReservations"] });
        queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
        queryClient.invalidateQueries({ queryKey: ["reservation-availability"] });
        try {
          const { useReservationStore } = require("@/features/schedule/store/reservation.store");
          void useReservationStore.getState().fetchMyReservations();
        } catch {}
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
      hubConnection.on("ReceiveParkingReceipt", handleExitResponseGlobal);
      hubConnection.on("receiveparkingreceipt", handleExitResponseGlobal);
      hubConnection.on("ParkingReceipt", handleExitResponseGlobal);
      hubConnection.on("parkingreceipt", handleExitResponseGlobal);


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
        console.log("[SignalR Global Proxy] ParkingSession/Occupancy event triggered:", data);
        queryClient.invalidateQueries({ queryKey: ["parkingSessionStats"] });
        queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
        queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
        queryClient.invalidateQueries({ queryKey: ["reservation-availability"] });
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
        queryClient.invalidateQueries({ queryKey: ["myReservations"] });
        queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
        try {
          const { useReservationStore } = require("@/features/schedule/store/reservation.store");
          void useReservationStore.getState().fetchMyReservations();
        } catch {}
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
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
        queryClient.invalidateQueries({ queryKey: ["myReservations"] });
        queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
        try {
          const { useReservationStore } = require("@/features/schedule/store/reservation.store");
          void useReservationStore.getState().fetchMyReservations();
        } catch {}
        reservationListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (err) {
            console.error("[SignalR Global Proxy] Error in ReservationUpdated listener:", err);
          }
        });
      };

      const handleVerificationStatusGlobal = (data: any) => {
        void queryClient.invalidateQueries({ queryKey: ["verification"] });
        console.log("[SignalR Global Proxy] VerificationStatusChanged event triggered:", { type: data?.type, status: data?.status });
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

      const handleScheduleGlobal = (data: any) => {
        console.log("[SignalR Global Proxy] ScheduleUpdated event triggered:", data);
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        try {
          const { useScheduleStore } = require("@/features/schedule/store/schedule.store");
          void useScheduleStore.getState().fetchSchedules(true);
        } catch {}
        scheduleListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (err) {
            console.error("[SignalR Global Proxy] Error in ScheduleUpdated listener:", err);
          }
        });
      };

      hubConnection.on("ScheduleUpdated", handleScheduleGlobal);
      hubConnection.on("scheduleupdated", handleScheduleGlobal);
      hubConnection.on("SemesterReset", handleSemesterResetGlobal);
      hubConnection.on("semesterreset", handleSemesterResetGlobal);
      hubConnection.on("ParkingSessionUpdated", handleParkingSessionGlobal);
      hubConnection.on("parkingsessionupdated", handleParkingSessionGlobal);
      hubConnection.on("ParkingOccupancyUpdated", handleParkingSessionGlobal);
      hubConnection.on("parkingoccupancyupdated", handleParkingSessionGlobal);
      hubConnection.on("ReceiveParkingSession", handleParkingSessionGlobal);
      hubConnection.on("ParkingStatusChanged", handleParkingSessionGlobal);
      hubConnection.on("ReservationUpdated", handleReservationGlobal);
      hubConnection.on("reservationupdated", handleReservationGlobal);
      hubConnection.on("ReceiveReservation", handleReservationGlobal);
      hubConnection.on("ReservationStatusChanged", handleReservationGlobal);
      hubConnection.on("reservationstatuschanged", handleReservationGlobal);
      hubConnection.on("ReservationListUpdated", handleReservationGlobal);
      hubConnection.on("reservationlistupdated", handleReservationGlobal);
      hubConnection.on("VerificationStatusChanged", handleVerificationStatusGlobal);
      hubConnection.on("verificationstatuschanged", handleVerificationStatusGlobal);

      const handleNotificationDispatch = (data: any) => {
        console.log("[SignalR Global Proxy] ReceiveNotification event triggered:", { type: data?.type });
        if (
          data?.type === "approved" ||
          data?.type === "vehicle_approved" ||
          data?.type === "registration_rejected" ||
          data?.type === "vehicle_rejected" || data?.type === "verification_updated"
        ) {
          handleVerificationStatusGlobal(data);
        }
        if (
          data?.title?.includes("Exit") ||
          (data?.type === "approved" && data?.actionRoute?.includes("history"))
        ) {
          handleExitResponseGlobal(data?.signalRData || data);

        }
      };

      hubConnection.on("ReceiveNotification", handleNotificationDispatch);
      hubConnection.on("receivenotification", handleNotificationDispatch);

      const handleSystemSettingsUpdated = (data: any) => {
        console.log("[SignalR Global Proxy] SystemSettingsUpdated event triggered:", data);
        queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
        queryClient.invalidateQueries({ queryKey: ["parkingSessionStats"] });
        parkingSessionListeners.forEach((listener) => {
          try {
            listener(data);
          } catch (err) {
            console.error("[SignalR Global Proxy] Error in SystemSettingsUpdated listener:", err);
          }
        });
      };
      hubConnection.on("SystemSettingsUpdated", handleSystemSettingsUpdated);
      hubConnection.on("systemsettingsupdated", handleSystemSettingsUpdated);
      hubConnection.on("ApprovalListUpdated", handleVerificationStatusGlobal);
      hubConnection.on("approvallistupdated", handleVerificationStatusGlobal);
      hubConnection.on("UserApproved", handleVerificationStatusGlobal);
      hubConnection.on("userapproved", handleVerificationStatusGlobal);
      hubConnection.on("VehicleApproved", handleVerificationStatusGlobal);
      hubConnection.on("vehicleapproved", handleVerificationStatusGlobal);
      hubConnection.on("CorStatusChanged", handleVerificationStatusGlobal);
      hubConnection.on("corstatuschanged", handleVerificationStatusGlobal);
      hubConnection.on("UserStatusChanged", handleVerificationStatusGlobal);
      hubConnection.on("userstatuschanged", handleVerificationStatusGlobal);
      hubConnection.on("AccountSuspended", handleAccountSuspendedGlobal);
      hubConnection.on("accountsuspended", handleAccountSuspendedGlobal);
    } catch (err) {
      console.warn("[SignalR Global Proxy] Failed to initialize HubConnection:", err);
      throw new Error("Notification connection is unavailable. Check the configured HTTPS API endpoint.");
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


export const registerExitResponseListener = (callback: Callback) => {
  exitResponseListeners.add(callback);
  return () => {
    exitResponseListeners.delete(callback);
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

export const registerScheduleListener = (callback: Callback) => {
  scheduleListeners.add(callback);
  return () => {
    scheduleListeners.delete(callback);
  };
};
