import { Check, RotateCcw } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { getWeekKey, malaysiaNow, toLocalDateStr } from '@/lib/rainScoring';
import type { AttendanceStatus } from '@/lib/attendanceStorage';

const dayNames = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

function elapsedWeekdays(now: Date): Date[] {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
  const dates: Date[] = [];
  const elapsedCount = now.getDay() === 0 || now.getDay() === 6 ? 5 : now.getDay();
  for (let offset = 0; offset < elapsedCount; offset++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);
    dates.push(date);
  }
  return dates;
}

export function AttendanceProgress({ target }: { target: number }) {
  const { attendance, setStatus } = useAttendance();
  const now = malaysiaNow();
  const currentWeek = attendance.weeks[getWeekKey(now)];
  const statuses = currentWeek?.statuses ?? {};
  const elapsed = elapsedWeekdays(now);
  const completed = Object.values(statuses).filter((status) => status === 'office').length;
  const remaining = Math.max(0, target - completed);
  const unresolved = elapsed.find((date) => !statuses[toLocalDateStr(date)]);
  const records = elapsed.filter((date) => statuses[toLocalDateStr(date)]);
  const unresolvedStr = unresolved ? toLocalDateStr(unresolved) : null;
  const unresolvedIsToday = unresolvedStr === toLocalDateStr(now);
  const futureWeekdays = now.getDay() >= 1 && now.getDay() <= 5 ? 5 - now.getDay() : 0;
  const opportunities = futureWeekdays + (unresolvedIsToday ? 1 : 0);
  const impossible = remaining > opportunities && elapsed.every((date) => statuses[toLocalDateStr(date)] !== undefined);

  const answer = (status: AttendanceStatus) => {
    if (unresolvedStr) setStatus(unresolvedStr, status);
  };

  return <section className="attendance-progress" aria-label="Kemajuan kehadiran minggu ini">
    <header>
      <div><span>Kemajuan minggu ini</span><strong>{remaining === 0 ? 'Sasaran selesai' : `${remaining} hari lagi diperlukan`}</strong></div>
      <div className="attendance-count"><strong>{Math.min(completed, target)}/{target}</strong><span>hari</span></div>
    </header>
    <div className="attendance-meter" aria-label={`${Math.min(completed, target)} daripada ${target} hari selesai`}>{Array.from({ length: target }, (_, index) => <i key={index} className={index < completed ? 'is-complete' : ''}><Check /></i>)}</div>

    {remaining > 0 && unresolved && <div className="attendance-question">
      <p>Adakah anda ke pejabat {unresolvedIsToday ? 'hari ini' : `pada ${dayNames[unresolved.getDay()]}, ${unresolved.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}`}?</p>
      <div><button type="button" onClick={() => answer('office')}>Ya, saya pergi</button><button type="button" onClick={() => answer('not-office')}>Tidak</button></div>
    </div>}
    {impossible && <p className="attendance-warning">Hari bekerja yang tinggal tidak mencukupi untuk mencapai sasaran minggu ini.</p>}

    {records.length > 0 && <details className="attendance-records">
      <summary>Semak rekod minggu ini</summary>
      <div>{records.map((date) => {
        const dateStr = toLocalDateStr(date);
        const status = statuses[dateStr];
        return <div className="attendance-record" key={dateStr}>
          <span>{dayNames[date.getDay()]}<small>{date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</small></span>
          <div><button type="button" className={status === 'office' ? 'is-selected' : ''} onClick={() => setStatus(dateStr, 'office')} aria-pressed={status === 'office'}>Pergi</button><button type="button" className={status === 'not-office' ? 'is-selected' : ''} onClick={() => setStatus(dateStr, 'not-office')} aria-pressed={status === 'not-office'}>Tidak</button><button type="button" className="attendance-reset" onClick={() => setStatus(dateStr, null)} aria-label={`Kosongkan rekod ${dayNames[date.getDay()]}`}><RotateCcw /></button></div>
        </div>;
      })}</div>
    </details>}
  </section>;
}
