import { formatDate } from "./formatDate";
import { formatTime } from "./formatTime";

export const formatDateAndTime = (date: string | Date) => {
  if (!date) return "N/A";

  const d = typeof date === "string" ? new Date(date) : date;

  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return typeof date === "string" ? date : "Invalid date";
  }

  const formattedDate = formatDate(d);
  const formattedTime = formatTime(d);

  return `${formattedDate} ${formattedTime}`;
};
