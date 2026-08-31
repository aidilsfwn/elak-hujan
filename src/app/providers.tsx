import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { WEATHER_CACHE_MINUTES, WARNINGS_CACHE_MINUTES } from '@/constants/thresholds';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Math.min(WEATHER_CACHE_MINUTES, WARNINGS_CACHE_MINUTES) * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
