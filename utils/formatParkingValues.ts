export function formatPenaltyFee(value?: string) {
  if (!value) return "₱0.00";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(parsed);
}

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

