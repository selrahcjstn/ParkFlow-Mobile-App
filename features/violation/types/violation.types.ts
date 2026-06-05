export type HasViolationNotificationDto = {
  ReferenceNumber: string;
  RefNumber: string;
  IssuedDate: string;    // ISO 8601 — C# DateTime
  IssuedTime: string;    // ISO 8601 — C# DateTime
  IssuedBy: string;
  OverstayHours: number; // C# double
  PlateNumber: string;
  Amount: number;        // C# decimal
  ViolationType: string;
  IsViolation: boolean;
};

export interface ActiveViolationDto {
  firstName: string;
  lastName: string;
  roleName: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  violationId: string;
  referenceNumber: string;
  violationType: string;
  penaltyFee: number;
  settlementStatus: string;
  isPaid: boolean;
  entryTime: string;
  exitTime: string;
  issuedAt: string;
}

