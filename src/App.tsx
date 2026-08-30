import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { AppChrome } from '@/components/AppChrome';
import { useConfig } from '@/hooks/useConfig';
import { DayDetail } from '@/pages/DayDetail';
import { LeaveAdvisor } from '@/pages/LeaveAdvisor';
import { Onboarding } from '@/pages/Onboarding';
import { Settings } from '@/pages/Settings';
import { Weekly } from '@/pages/Weekly';

function RoutedApp() {
  const { config } = useConfig();
  const location = useLocation();
  const onboarding = location.pathname.startsWith('/onboarding');
  if (!config?.onboardingComplete && !onboarding) return <Navigate to="/onboarding" replace />;
  if (config?.onboardingComplete && onboarding) return <Navigate to="/leave" replace />;

  const routes = <Routes>
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/" element={<Weekly />} />
    <Route path="/day/:date" element={<DayDetail />} />
    <Route path="/leave" element={<LeaveAdvisor />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="*" element={<Navigate to={config?.onboardingComplete ? '/leave' : '/onboarding'} replace />} />
  </Routes>;
  return onboarding ? routes : <AppChrome>{routes}</AppChrome>;
}

export default function App() { return <Providers><BrowserRouter><RoutedApp /></BrowserRouter></Providers>; }
