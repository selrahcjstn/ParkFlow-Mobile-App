export function formatTime(dateInput: Date | string): string {
  if (!dateInput) return "Invalid time";

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Invalid time";
  }

  // If input is UTC (like "Z"), convert properly to local time
  const hours = date.getHours(); // local time conversion from UTC automatically handled by JS
  const minutes = date.getMinutes();

  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}
