export interface ParkingHistoryResponse {
  firstName: string;
  lastName: string;
  roleName: string;
  brand: string;
  type: string;
  entryTime: string;
  exitTime: string | null;
  parkingDuration: number | null;
  hasViolation: boolean;
  violationFee: number;
  overstayHours?: number;
  plateNumber: string;
}

export interface PaginatedParkingHistoryResponse {
  generatedAt: string;
  items?: ParkingHistoryResponse[];
  parkingHistory?: ParkingHistoryResponse[];
}
