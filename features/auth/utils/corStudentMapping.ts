import { COLLEGE_COURSE_OPTIONS, YEAR_LEVEL_OPTIONS } from '@/constants/courses';
import { SCHEDULE_DAYS } from '@/constants/scheduleDays';
import type { CorSchedulePreview, CorWeekDay } from '../services/verification.service';

// Keep printed initials and accented names without expanding missing names.
export function validCorName(value: string) { return /^[\p{L}][\p{L}\p{M}' .-]{0,149}$/u.test(value.trim()); }

export function courseKey(value: string) {
  return value.replace(/\([^)]*\)/g, '').toUpperCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    .replace('BACHELOR OF SCIENCE', 'BS').replace('BACHELOR OF ARTS', 'BA').replace(/^(BS|BA) IN /, '$1 ');
}
export function mapCorSection(value?: string | null): string {
  const match = value?.match(/\b\d{1,2}[A-Z][A-Z0-9]*\s*-\s*G\d+\b/i);
  return match ? match[0].replace(/\s+/g, '').toUpperCase() : value?.trim() || '';
}
export function mapCorCourse(value?: string | null): string {
  if (!value) return '';
  const matches = COLLEGE_COURSE_OPTIONS.filter(option => courseKey(option.value) === courseKey(value) ||
    option.value === value || option.value.match(/\(([^)]+)\)/)?.[1].toUpperCase() === value.trim().toUpperCase());
  return matches.length === 1 ? matches[0].value : '';
}
export function mapCorYear(value?: number | null): number {
  const mapped = value === 6 ? 5 : value;
  return YEAR_LEVEL_OPTIONS.some(o => Number(o.value) === mapped) ? Number(mapped) : 0;
}
export function mapCorSemester(value?: string | null): string {
  const normalized = (value || '').trim().toUpperCase();
  if (/^(1|1ST|FIRST)( SEMESTER)?$/.test(normalized)) return '1st Semester';
  if (/^(2|2ND|SECOND)( SEMESTER)?$/.test(normalized)) return '2nd Semester';
  if (['SUMMER', 'MIDYEAR', 'MID YEAR'].includes(normalized)) return 'Summer';
  return '';
}
export function weeklyPreview(preview: CorSchedulePreview): CorWeekDay[] {
  if (preview.week?.length === 7) return preview.week;
  return SCHEDULE_DAYS.map(day => {
    const classes = preview.items.filter(s => s.dayOfWeek === day.key);
    return classes.length ? { dayOfWeek: day.key, hasClasses: true,
      startTime: classes.map(s => s.startTime).sort()[0], endTime: classes.map(s => s.endTime).sort().at(-1)! }
      : { dayOfWeek: day.key, hasClasses: preview.issues.length ? null : false, startTime: null, endTime: null };
  });
}
export function validWeek(week: CorWeekDay[]) {
  return week.length === 7 && new Set(week.map(d => d.dayOfWeek)).size === 7 && week.some(d => d.hasClasses === true) &&
    week.every(d => d.hasClasses === false || d.hasClasses === true && !!d.startTime && !!d.endTime && d.startTime < d.endTime);
}
