export function formatHours(value?: string | number) {
  if (value === undefined || value === null || value === "") return "N/A";
  const parsed = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(parsed)) return String(value);
  return `${parsed.toFixed(2)} hrs`;
}

export function formatPhoneNumber(num?: string | null): string {
  if (!num) return "N/A";
  const clean = num.replace(/[\s+\-()]/g, "");
  if (/^0+$/.test(clean) || clean === "" || num.toLowerCase() === "n/a") return "N/A";
  return num;
}

export function formatPenaltyFee(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return `₱${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}
