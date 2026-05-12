export const scheduleService = {
  createSchedule: async (body: FormData) => {
    const res = await fetch("/parking-schedule/create", {});
    return res.json();
  },
};
