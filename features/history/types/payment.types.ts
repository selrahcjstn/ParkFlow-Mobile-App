export type PaymentRecord = {
  id: string;
  plateNumber: string;
  name: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Waived";
};
