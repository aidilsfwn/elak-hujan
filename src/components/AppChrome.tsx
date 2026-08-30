import type { ReactNode } from 'react';
import { CalendarDays, Gauge, SlidersHorizontal } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const destinations = [
  { to: '/leave', label: 'Sekarang', Icon: Gauge, end: false },
  { to: '/', label: 'Minggu', Icon: CalendarDays, end: true },
  { to: '/settings', label: 'Tetapan', Icon: SlidersHorizontal, end: false },
] as const;

function Wordmark() {
  return <NavLink to="/leave" className="eh-wordmark" aria-label="ElakHujan"><span className="eh-mark" aria-hidden="true">EH</span><span>ElakHujan</span></NavLink>;
}

function NavigationLinks({ compact = false }: { compact?: boolean }) {
  return destinations.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `eh-destination ${isActive ? 'is-current' : ''} ${compact ? 'is-compact' : ''}`}><Icon aria-hidden="true" /><span>{label}</span></NavLink>);
}

export function AppChrome({ children }: { children: ReactNode }) {
  return <div className="eh-shell">
    <aside className="eh-rail"><Wordmark /><nav aria-label="Navigasi utama" className="eh-rail-links"><NavigationLinks /></nav><p className="eh-rail-note">Cuaca untuk<br />perjalanan harian</p></aside>
    <header className="eh-mobile-head"><Wordmark /><span>Untuk rider</span></header>
    <main className="eh-content">{children}</main>
    <nav aria-label="Navigasi utama" className="eh-mobile-tabs"><NavigationLinks compact /></nav>
  </div>;
}
