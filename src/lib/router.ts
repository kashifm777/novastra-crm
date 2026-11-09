import { useEffect, useState } from 'react';

export function getCurrentPath(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h === '' || h === '/' ? '/' : h;
}

export function navigate(to: string): void {
  const target = to.startsWith('/') ? to : `/${to}`;
  if (getCurrentPath() === target) return;
  window.location.hash = target;
  window.scrollTo(0, 0);
}

export function useRoute(): { path: string; segments: string[] } {
  const [path, setPath] = useState<string>(getCurrentPath);
  useEffect(() => {
    const onChange = () => {
      setPath(getCurrentPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const segments = path.split('/').filter(Boolean);
  return { path, segments };
}
