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
  isPaid?: boolean;
  referenceNumber?: string;
  color?: string;
  motorPictureUrl?: string;
  orcrDocumentUrl?: string;
  plateNumber: string;
}

export interface PaginatedParkingHistoryResponse {
  generatedAt: string;
  items?: ParkingHistoryResponse[];
  parkingHistory?: ParkingHistoryResponse[];
}
