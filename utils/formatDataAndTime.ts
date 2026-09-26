import { formatDate } from "./formatDate";
import { formatTime } from "./formatTime";

export const formatDateAndTime = (date: string | Date): string => {
  if (!date) return "N/A";

  try {
    const d = typeof date === "string" ? new Date(date) : date;

    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return typeof date === "string" ? date : "Invalid date";
    }

    const formattedDate = formatDate(d);
    const formattedTime = formatTime(d);

    if (formattedDate && formattedTime) {
      return `${formattedDate} ${formattedTime}`;
    }

    return formattedDate || formattedTime || (typeof date === "string" ? date : "N/A");
  } catch {
    return typeof date === "string" ? date : "N/A";
  }
};
