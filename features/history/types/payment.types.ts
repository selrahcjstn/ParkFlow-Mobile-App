export type PaymentRecord = {
  id: string;
  plateNumber: string;
  name: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Waived";

  // Extra fields from backend violations/history API:
  firstName?: string;
  lastName?: string;
  roleName?: string;
  brand?: string;
  vehicleType?: string;
  violationId?: string;
  referenceNumber?: string;
  violationType?: string;
  penaltyFee?: number;
  settlementStatus?: string;
  isPaid?: boolean;
  entryTime?: string;
  exitTime?: string;
  issuedAt?: string;
};
