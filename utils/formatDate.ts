export function formatDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;

  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return "Invalid date";
  }

  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
