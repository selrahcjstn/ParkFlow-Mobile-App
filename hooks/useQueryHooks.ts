import { useQuery } from "@tanstack/react-query";
import { userService } from "@/features/user/services/user.service";
import { vehicleService } from "@/features/user/services/vehicle.service";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { UserProfileResponse } from "@/features/user/types/user.types";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
} from "@/features/session/types/parking-log.types";
import { ScheduleService } from "@/features/schedule/services/schedule.service";
import { ScheduleResponse } from "@/features/schedule/types/schedule.types";

export function useProfileQuery() {
  return useQuery<UserProfileResponse, Error>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await userService.getProfile();
      if (!res.isSuccess || !res.data) {
        throw new Error(res.message || "Failed to fetch profile");
      }
      return res.data;
    },
  });
}

export function useVehiclesQuery() {
  return useQuery<VehicleResponse[], Error>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await vehicleService.getVehicles();
      const data = res.data ?? res.result;
      if (!res.isSuccess || !Array.isArray(data)) {
        throw new Error(res.message || "Failed to fetch vehicles");
      }
      return data;
    },
  });
}

export function useActiveSessionQuery() {
  return useQuery<GetActiveParkingSessionResponse, Error>({
    queryKey: ["activeSession"],
    queryFn: async () => {
      const res = await parkingLogService.getActiveSession();
      const data = res.data ?? res.result;
      if (!res.isSuccess || !data) {
        throw new Error(res.message || "Failed to fetch active session");
      }
      return data;
    },
  });
}

export function useSessionStatsQuery() {
  return useQuery<GetParkingSessionStatsResponse, Error>({
    queryKey: ["sessionStats"],
    queryFn: async () => {
      const res = await parkingLogService.getParkingSessionStats();
      const data = res.data ?? res.result;
      if (!res.isSuccess || !data) {
        throw new Error(res.message || "Failed to fetch session stats");
      }
      return data;
    },
  });
}

export function useSchedulesQuery() {
  return useQuery<ScheduleResponse[], Error>({
    queryKey: ["schedules"],
    queryFn: async () => {
      const res = await ScheduleService.getSchedules();
      if (!res.isSuccess || !res.data) {
        throw new Error(res.message || "Failed to fetch schedules");
      }
      return res.data;
    },
  });
}
