import { ParkingLogData } from "./parkingLog";

export type ParkingLogTodayResponse = {
  totalCount: number;
  limit: number;
  items: ParkingLogData[];
};
