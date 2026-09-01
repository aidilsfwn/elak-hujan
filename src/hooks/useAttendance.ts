import { create } from 'zustand';
import { loadAttendance, saveAttendance, updateAttendance, type AttendanceData, type AttendanceStatus } from '@/lib/attendanceStorage';

interface AttendanceStore {
  attendance: AttendanceData;
  setStatus: (dateStr: string, status: AttendanceStatus | null) => void;
}

export const useAttendance = create<AttendanceStore>((set) => ({
  attendance: loadAttendance(),
  setStatus: (dateStr, status) => set((state) => {
    const attendance = updateAttendance(state.attendance, dateStr, status);
    saveAttendance(attendance);
    return { attendance };
  }),
}));
