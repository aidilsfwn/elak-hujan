import { getWeekKey, toLocalDateStr } from '@/lib/rainScoring';

export type AttendanceStatus = 'office' | 'not-office';

export interface AttendanceWeek {
  statuses: Record<string, AttendanceStatus>;
  updatedAt: string;
}

export interface AttendanceData {
  version: 1;
  weeks: Record<string, AttendanceWeek>;
}

const ATTENDANCE_KEY = 'elakhujan_attendance';
const MAX_WEEKS = 12;
const EMPTY_ATTENDANCE: AttendanceData = { version: 1, weeks: {} };

function parseDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return toLocalDateStr(date) === dateStr ? date : null;
}

export function loadAttendance(): AttendanceData {
  try {
    const parsed = JSON.parse(localStorage.getItem(ATTENDANCE_KEY) ?? 'null') as Partial<AttendanceData> | null;
    if (parsed?.version !== 1 || !parsed.weeks || typeof parsed.weeks !== 'object') return EMPTY_ATTENDANCE;
    const weeks: Record<string, AttendanceWeek> = {};
    Object.entries(parsed.weeks).forEach(([weekKey, week]) => {
      if (!parseDate(weekKey) || !week || typeof week !== 'object') return;
      const candidate = week as Partial<AttendanceWeek>;
      if (!candidate.statuses || typeof candidate.statuses !== 'object') return;
      const statuses: Record<string, AttendanceStatus> = {};
      Object.entries(candidate.statuses).forEach(([dateStr, status]) => {
        const date = parseDate(dateStr);
        if (date && getWeekKey(date) === weekKey && (status === 'office' || status === 'not-office')) statuses[dateStr] = status;
      });
      weeks[weekKey] = { statuses, updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date(0).toISOString() };
    });
    return { version: 1, weeks };
  } catch {
    return EMPTY_ATTENDANCE;
  }
}

export function saveAttendance(data: AttendanceData): void {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(data));
}

export function updateAttendance(
  data: AttendanceData,
  dateStr: string,
  status: AttendanceStatus | null,
): AttendanceData {
  const date = parseDate(dateStr);
  if (!date || date.getDay() === 0 || date.getDay() === 6) return data;
  const weekKey = getWeekKey(date);
  const statuses = { ...(data.weeks[weekKey]?.statuses ?? {}) };
  if (status === null) delete statuses[dateStr];
  else statuses[dateStr] = status;

  const weeks = {
    ...data.weeks,
    [weekKey]: { statuses, updatedAt: new Date().toISOString() },
  };
  const retainedKeys = Object.keys(weeks).sort().slice(-MAX_WEEKS);
  return {
    version: 1,
    weeks: Object.fromEntries(retainedKeys.map((key) => [key, weeks[key]])),
  };
}

export function completedAttendanceDates(data: AttendanceData): string[] {
  return Object.values(data.weeks).flatMap((week) => Object.entries(week.statuses)
    .filter(([, status]) => status === 'office')
    .map(([dateStr]) => dateStr));
}
