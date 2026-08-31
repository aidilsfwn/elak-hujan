import { useEffect, useState } from 'react';
import { useConfig } from './useConfig';
import { LEAVE_ADVISOR_LEAD_HOURS } from '@/constants/thresholds';
import { malaysiaNow } from '@/lib/rainScoring';

/**
 * Returns true when the current time is within LEAVE_ADVISOR_LEAD_HOURS before
 * the evening commute window start, through 1 hour after the window ends.
 * Rechecked every minute.
 */
export function useLeaveAdvisorVisible(): boolean {
  const { config } = useConfig();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!config) return;

    function check() {
      const now = malaysiaNow();
      const [startH, startM] = config!.eveningWindow.start.split(':').map(Number);
      const [endH, endM] = config!.eveningWindow.end.split(':').map(Number);
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const windowStartMins = startH * 60 + startM;
      const windowEndMins = endH * 60 + endM;
      const leadMins = LEAVE_ADVISOR_LEAD_HOURS * 60;
      setIsVisible(nowMins >= windowStartMins - leadMins && nowMins <= windowEndMins + 60);
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [config]);

  return isVisible;
}
