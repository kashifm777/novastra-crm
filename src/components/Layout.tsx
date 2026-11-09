import { useState } from 'react';
import type { ReactNode } from 'react';
import { useRoute, navigate } from '../lib/router';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '▦' },
  { path: '/customers', label: 'Customers', icon: '☺' },
  { path: '/pipeline', label: 'Pipeline', icon: '⇉' },
  { path: '/deals', label: 'Deals', icon: '◈' },
  { path: '/tasks', label: 'Tasks', icon: '✓' },
  { path: '/reports', label: 'Reports', icon: '🗠' },
  { path: '/team', label: 'Sales Team', icon: '⚑' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

function isActivePath(current: string, nav: string): boolean {
  if (nav === '/') return current === '/';
  const seg = nav.slice(1);
  return current === `/${seg}` || current.startsWith(`/${seg}/`);
}

export function Layout({ children, unread }: { children: ReactNode; unread: number }) {
  const { path } = useRoute();
  const [mobileOpen, setMobileOpen] = useState(false);
  const prettyToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const nav = (
    <nav className="side-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(path, item.path);
        const badge = item.path === '/notifications' && unread > 0 ? unread : 0;
        return (
          <a
            key={item.path}
            href={`#${item.path}`}
            className={`nav-item ${active ? 'nav-item-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
            {badge > 0 && <span className="nav-badge">{badge > 9 ? '9+' : badge}</span>}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className="layout">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-btn menu-btn" aria-label="Toggle navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((v) => !v)}>
            ☰
          </button>
          <a href="#/" className="brand" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              N
            </span>
            <span className="brand-name">Novastra CRM</span>
          </a>
        </div>
        <div className="topbar-right">
          <span className="topbar-date">{prettyToday}</span>
          <a className="bell-link" href="#/notifications" aria-label={`Notifications, ${unread} unread`}>
            <span aria-hidden="true">🔔</span>
            {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
          </a>
        </div>
      </header>
      <div className="layout-body">
        <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
          {nav}
          <div className="sidebar-foot">
            <div className="foot-card" onClick={() => navigate('/reports')}>
              <strong>Quarterly review</strong>
              <span>Reports pull live deal data — take a look.</span>
            </div>
          </div>
        </aside>
        {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
        <main className="main" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
