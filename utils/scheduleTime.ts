import { toMinutes } from "./timeParser";

export function getDefaultTime(field: "start" | "end"): Date {
  const date = new Date();
  date.setHours(field === "start" ? 8 : 17, 0, 0, 0);
  return date;
}

export function isEndBeforeStart(s?: string, e?: string): boolean {
  const start = toMinutes(s);
  const end = toMinutes(e);
  if (start === null || end === null) return false;
  return end <= start;
}
