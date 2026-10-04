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
  penaltyFee?: number;
  amount?: number;
  overstayHours?: number;
  isPaid?: boolean;
  referenceNumber?: string;
  plateNumber: string;
  entryMethod?: string;
}

export interface PaginatedParkingHistoryResponse {
  generatedAt: string;
  items?: ParkingHistoryResponse[];
  parkingHistory?: ParkingHistoryResponse[];
}
