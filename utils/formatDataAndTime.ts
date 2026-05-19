export const formatDateAndTime = (date: string | Date) => {
  if (!date) return "Invalid date";

  const d = typeof date === "string" ? new Date(date) : date;

  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return "Invalid date";
  }

  const formattedDate = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const formattedTime = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${formattedDate} ${formattedTime}`;
};
