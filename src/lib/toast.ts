import { useSyncExternalStore } from 'react';
import { uid } from './utils';

export interface Toast {
  id: string;
  kind: 'success' | 'error' | 'info';
  message: string;
  leaving?: boolean;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, () => toasts, () => toasts);
}

function hide(id: string) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 260);
}

export function toast(kind: Toast['kind'], message: string) {
  const t: Toast = { id: uid(), kind, message };
  toasts = [...toasts.slice(-3), t];
  emit();
  window.setTimeout(() => hide(t.id), 3800);
}

export function dismissToast(id: string) {
  hide(id);
}

export const successToast = (message: string) => toast('success', message);
export const errorToast = (message: string) => toast('error', message);
export const infoToast = (message: string) => toast('info', message);
