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
