import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Providers } from './app/providers';
import { useConfig } from '@/hooks/useConfig';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { Weekly } from '@/pages/Weekly';
import { DayDetail } from '@/pages/DayDetail';
import { LeaveAdvisor } from '@/pages/LeaveAdvisor';
import { Settings } from '@/pages/Settings';
import { Onboarding } from '@/pages/Onboarding';

function AppRoutes() {
  const { config } = useConfig();
  const location = useLocation();
  const isOnboarding = location.pathname.startsWith('/onboarding');

  if (!config?.onboardingComplete && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (config?.onboardingComplete && isOnboarding) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto relative">
      {!isOnboarding && <AppHeader />}
      <main className={isOnboarding ? 'flex-1' : 'flex-1 pt-14 pb-16'}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Weekly />} />
          <Route path="/day/:date" element={<DayDetail />} />
          <Route path="/leave" element={<LeaveAdvisor />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isOnboarding && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  );
}
