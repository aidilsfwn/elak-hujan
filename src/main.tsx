import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline forecasts become dangerously misleading once their valid dates pass.
// Remove the legacy service worker and its cache for users upgrading from v1.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) =>
    Promise.all(registrations.map((registration) => registration.unregister())),
  );
}
if ('caches' in window) {
  void caches.delete('elakhujan-shell-v1');
}
