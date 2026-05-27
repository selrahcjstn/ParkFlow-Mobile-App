export type ScheduleItemRequest = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type ScheduleRequest = {
  submissionId: string;
  schedules: ScheduleItemRequest[];
};
