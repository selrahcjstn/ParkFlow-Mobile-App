export interface ParkingHistoryResponse {
  hasViolation?: boolean; violationFee?: number; penaltyFee?: number; amount?: number;
  isPaid?: boolean; referenceNumber?: string;
  firstName: string;
  lastName: string;
  roleName: string;
  brand: string;
  type: string;
  entryTime: string;
  exitTime: string | null;
  parkingDuration: number | null;
  overstayHours?: number;
  plateNumber: string;
  entryMethod?: string;
}

export interface PaginatedParkingHistoryResponse {
  generatedAt: string;
  items?: ParkingHistoryResponse[];
  parkingHistory?: ParkingHistoryResponse[];
}
