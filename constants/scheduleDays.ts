export const SCHEDULE_DAYS = [
  { key: 1, label: "Monday" },
  { key: 2, label: "Tuesday" },
  { key: 3, label: "Wednesday" },
  { key: 4, label: "Thursday" },
  { key: 5, label: "Friday" },
  { key: 6, label: "Saturday" },
  { key: 0, label: "Sunday" },
] as const;

export type ScheduleDayKey = (typeof SCHEDULE_DAYS)[number]["key"];

export const getDayLabel = (key: ScheduleDayKey) =>
  SCHEDULE_DAYS.find((d) => d.key === key)?.label || "";
