import { NavLink } from 'react-router-dom';
import { CalendarDays, Clock, Users, Settings } from 'lucide-react';
import { copy } from '@/constants/copy';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/',          end: true,  Icon: CalendarDays, label: copy.nav.weekly },
  { to: '/leave',     end: false, Icon: Clock,        label: copy.nav.leave },
  { to: '/komuniti',  end: false, Icon: Users,        label: copy.nav.community },
  { to: '/settings',  end: false, Icon: Settings,     label: copy.nav.settings },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t bg-background/95 backdrop-blur-sm z-10">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ to, end, Icon, label }) => (
          <NavLink key={to} to={to} end={end} className="flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 py-2">
                <div
                  className={cn(
                    'px-4 py-1 rounded-full transition-colors',
                    isActive ? 'bg-primary/12' : '',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-5 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs transition-colors',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
