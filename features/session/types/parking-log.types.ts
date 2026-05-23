export type GetParkingSessionStatsResponse = {
  activeSessionCount: number;
  overstayCount: number;
  maximumCapacity: number;
};

export type GetActiveParkingSessionResponse = {
  firstName: string;
  lastName: string;
  phoneNumber: string;

  status: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;

  entryTime: string;
  maximumExitTime: string;
  totalParkingHours: string;
};
