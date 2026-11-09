import { useSyncExternalStore } from 'react';
import { buildSeed } from './seed';
import type {
  Activity,
  AppState,
  Customer,
  Deal,
  DealStage,
  NotificationItem,
  NotificationType,
  Rep,
  Task,
} from './types';
import { formatCurrency, uid } from './utils';

const STORAGE_KEY = 'novastra-crm-data-v1';
const MAX_NOTIFICATIONS = 80;
const MAX_ACTIVITIES = 400;

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (
        Array.isArray(parsed.customers) &&
        Array.isArray(parsed.reps) &&
        Array.isArray(parsed.deals) &&
        Array.isArray(parsed.tasks) &&
        Array.isArray(parsed.notifications) &&
        Array.isArray(parsed.activities)
      ) {
        return parsed as AppState;
      }
    }
  } catch {
    // corrupted state — fall through to a fresh seed
  }
  return buildSeed();
}

function save(next: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to persist CRM data', err);
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function commit(next: AppState) {
  if (next.activities.length > MAX_ACTIVITIES) {
    next = { ...next, activities: next.activities.slice(0, MAX_ACTIVITIES) };
  }
  if (next.notifications.length > MAX_NOTIFICATIONS) {
    next = { ...next, notifications: next.notifications.slice(0, MAX_NOTIFICATIONS) };
  }
  state = next;
  save(state);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function snapshot(): AppState {
  return state;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function formatStage(stage: DealStage): string {
  switch (stage) {
    case 'new-lead':
      return 'New Lead';
    case 'closed':
      return 'Closed';
    default:
      return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
}

export function findCustomer(s: AppState, id: string | null | undefined): Customer | undefined {
  return id ? s.customers.find((c) => c.id === id) : undefined;
}

export function findDeal(s: AppState, id: string | null | undefined): Deal | undefined {
  return id ? s.deals.find((d) => d.id === id) : undefined;
}

export function findRep(s: AppState, id: string | null | undefined): Rep | undefined {
  return id ? s.reps.find((r) => r.id === id) : undefined;
}

export function repName(s: AppState, id: string | null | undefined): string {
  return findRep(s, id)?.name ?? 'Unassigned';
}

export function customerLabel(s: AppState, id: string | null | undefined): string {
  const c = findCustomer(s, id);
  return c ? c.company : '—';
}

function activityEntry(entityType: Activity['entityType'], entityId: string, message: string, createdAt?: string): Activity {
  return { id: uid(), entityType, entityId, message, createdAt: createdAt ?? new Date().toISOString() };
}

function pushNotification(
  type: NotificationType,
  title: string,
  message: string,
  dedupeKey: string,
  link: string,
  existing: NotificationItem[],
  createdAt?: string,
): NotificationItem[] {
  const target = existing.find((n) => n.dedupeKey === dedupeKey);
  if (target) return existing;
  const item: NotificationItem = {
    id: uid(),
    type,
    title,
    message,
    dedupeKey,
    read: false,
    createdAt: createdAt ?? new Date().toISOString(),
    link,
  };
  return [item, ...existing];
}

function mutate(patch: (s: AppState) => Partial<AppState>) {
  commit({ ...state, ...patch(state) });
}

function localTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export function addCustomer(input: Omit<Customer, 'id' | 'createdAt'>): string {
  const id = uid();
  const customer: Customer = { ...input, id, createdAt: new Date().toISOString() };
  mutate((s) => ({
    customers: [customer, ...s.customers],
    activities: [activityEntry('customer', id, 'Customer added to CRM'), ...s.activities],
  }));
  return id;
}

export function updateCustomer(id: string, patch: Partial<Omit<Customer, 'id' | 'createdAt'>>): void {
  mutate((s) => {
    const prev = s.customers.find((c) => c.id === id);
    if (!prev) return {};
    const messages: string[] = [];
    if (patch.repId && patch.repId !== prev.repId) {
      messages.push(`Owner changed to ${repName(s, patch.repId)}`);
    }
    if (patch.status && patch.status !== prev.status) {
      messages.push(`Status changed to ${patch.status}`);
    }
    const meaningful = messages.length > 0;
    const activities = [
      activityEntry('customer', id, meaningful ? messages.join('; ') : 'Customer details updated'),
      ...s.activities,
    ];
    return { customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)), activities };
  });
}

export function deleteCustomer(id: string): void {
  const name = state.customers.find((c) => c.id === id)?.company ?? 'Customer';
  mutate((s) => ({
    customers: s.customers.filter((c) => c.id !== id),
    deals: s.deals.filter((d) => d.customerId !== id),
    tasks: s.tasks.filter((t) => t.customerId !== id),
    activities: [activityEntry('customer', id, `${name} deleted (with linked deals and tasks)`), ...s.activities],
  }));
}

/* ------------------------------------------------------------------ */
/* Sales reps                                                          */
/* ------------------------------------------------------------------ */

export function addRep(input: Omit<Rep, 'id' | 'createdAt'>): string {
  const id = uid();
  const rep: Rep = { ...input, id, createdAt: new Date().toISOString() };
  mutate((s) => ({
    reps: [rep, ...s.reps],
    activities: [activityEntry('rep', id, `${rep.name} joined the sales team`), ...s.activities],
  }));
  return id;
}

export function updateRep(id: string, patch: Partial<Omit<Rep, 'id' | 'createdAt'>>): void {
  mutate((s) => {
    const prev = s.reps.find((r) => r.id === id);
    if (!prev) return {};
    let message = 'Team member details updated';
    if (patch.status && patch.status !== prev.status) {
      message = patch.status === 'inactive' ? `${prev.name} was deactivated` : `${prev.name} was reactivated`;
    }
    const activities = [activityEntry('rep', id, message), ...s.activities];
    return { reps: s.reps.map((r) => (r.id === id ? { ...r, ...patch } : r)), activities };
  });
}

/* ------------------------------------------------------------------ */
/* Deals                                                               */
/* ------------------------------------------------------------------ */

export interface DealInput {
  name: string;
  customerId: string;
  repId: string;
  value: number;
  expectedCloseDate: string;
  stage: DealStage;
  outcome: Deal['outcome'];
  probability: number;
  notes: string;
}

function dealInput(a: Deal, overrides?: Partial<DealInput>): DealInput {
  return {
    name: a.name,
    customerId: a.customerId,
    repId: a.repId,
    value: a.value,
    expectedCloseDate: a.expectedCloseDate,
    stage: a.stage,
    outcome: a.outcome,
    probability: a.probability,
    notes: a.notes,
    ...overrides,
  };
}

export function addDeal(input: DealInput): string {
  const id = uid();
  const now = new Date().toISOString();
  const closed = input.stage === 'closed';
  const outcome: Deal['outcome'] = closed ? (input.outcome === 'lost' ? 'lost' : input.outcome === 'won' ? 'won' : 'open') : 'open';
  const deal: Deal = {
    ...input,
    id,
    outcome,
    closedAt: closed && outcome !== 'open' ? now.slice(0, 10) : null,
    createdAt: now,
    updatedAt: now,
  };
  mutate((s) => {
    let activities = [activityEntry('deal', id, `Deal created — ${formatCurrency(deal.value)}`, now)];
    let notifications = s.notifications;
    if (closed && outcome === 'won') {
      notifications = pushNotification('deal-won', 'Deal won 🎉', `${deal.name} (${formatCurrency(deal.value)}) was created as Won.`, `deal-outcome:${id}:won`, `/deals/${id}`, notifications, now);
    } else if (closed && outcome === 'lost') {
      notifications = pushNotification('deal-lost', 'Deal lost', `${deal.name} (${formatCurrency(deal.value)}) was created as Lost.`, `deal-outcome:${id}:lost`, `/deals/${id}`, notifications, now);
    } else if (deal.repId) {
      notifications = pushNotification('deal-assigned', 'Deal assigned', `${deal.name} was assigned to ${repName(s, deal.repId)}.`, `deal-assigned:${id}:${deal.repId}`, `/deals/${id}`, notifications, now);
    }
    return { deals: [deal, ...s.deals], activities, notifications };
  });
  return id;
}

export function updateDeal(id: string, input: DealInput): void {
  mutate((s) => {
    const prev = s.deals.find((d) => d.id === id);
    if (!prev) return {};
    const now = new Date().toISOString();
    const closed = input.stage === 'closed';
    const nextOutcome: Deal['outcome'] = closed ? (input.outcome === 'lost' ? 'lost' : input.outcome === 'won' ? 'won' : 'open') : 'open';
    const nextClosedAt = closed && nextOutcome !== 'open' ? (prev.closedAt ?? now.slice(0, 10)) : null;

    const deal: Deal = {
      ...prev,
      ...input,
      outcome: nextOutcome,
      closedAt: nextClosedAt,
      updatedAt: now,
    };

    let activities = s.activities;
    let notifications = s.notifications;

    const stageChanged = prev.stage !== deal.stage;
    const outcomeChanged = prev.outcome !== deal.outcome;
    const repChanged = prev.repId !== deal.repId;
    const valueChanged = prev.value !== deal.value;

    if (outcomeChanged && deal.outcome === 'won') {
      activities = [activityEntry('deal', id, `Deal marked Won — ${formatCurrency(deal.value)}`, now), ...activities];
      notifications = pushNotification('deal-won', 'Deal won 🎉', `${deal.name} (${formatCurrency(deal.value)}) was marked Won.`, `deal-outcome:${id}:won`, `/deals/${id}`, notifications, now);
    } else if (outcomeChanged && deal.outcome === 'lost') {
      activities = [activityEntry('deal', id, 'Deal marked Lost', now), ...activities];
      notifications = pushNotification('deal-lost', 'Deal lost', `${deal.name} (${formatCurrency(deal.value)}) was marked Lost.`, `deal-outcome:${id}:lost`, `/deals/${id}`, notifications, now);
    } else {
      if (stageChanged) {
        activities = [activityEntry('deal', id, `Stage moved to ${formatStage(deal.stage)}`, now), ...activities];
        notifications = pushNotification('deal-stage', 'Deal stage updated', `${deal.name} moved to ${formatStage(deal.stage)}.`, `deal-stage:${id}:${deal.stage}`, `/deals/${id}`, notifications, now);
      }
      if (repChanged) {
        activities = [activityEntry('deal', id, `Deal assigned to ${repName(s, deal.repId)}`, now), ...activities];
        notifications = pushNotification('deal-assigned', 'Deal assigned', `${deal.name} was assigned to ${repName(s, deal.repId)}.`, `deal-assigned:${id}:${deal.repId}`, `/deals/${id}`, notifications, now);
      }
      if (!stageChanged && !repChanged && valueChanged) {
        activities = [activityEntry('deal', id, `Deal value updated to ${formatCurrency(deal.value)}`, now), ...activities];
      }
    }

    return { deals: s.deals.map((d) => (d.id === id ? deal : d)), activities, notifications };
  });
}

/** Move a deal between pipeline stages with clear control flow for closing. */
export function moveDealStage(id: string, stage: DealStage, outcome?: 'won' | 'lost'): void {
  const deal = state.deals.find((d) => d.id === id);
  if (!deal) return;
  const finalOutcome: Deal['outcome'] = stage === 'closed' ? (outcome ?? 'won') : 'open';
  let probability = deal.probability;
  if (stage === 'closed') {
    probability = finalOutcome === 'won' ? 100 : 0;
  } else if (deal.stage === 'closed' || probability >= 100 || probability <= 0) {
    // Reopening a closed deal — reset to a sensible working probability
    probability = 60;
  }
  updateDeal(id, dealInput(deal, { stage, outcome: finalOutcome, probability }));
}

/** Close a deal straight from the pipeline with an explicit outcome. */
export function closeDeal(id: string, outcome: 'won' | 'lost'): void {
  moveDealStage(id, 'closed', outcome);
}

export function deleteDeal(id: string): void {
  const name = state.deals.find((d) => d.id === id)?.name ?? 'Deal';
  mutate((s) => ({
    deals: s.deals.filter((d) => d.id !== id),
    tasks: s.tasks.filter((t) => t.dealId !== id),
    activities: [activityEntry('deal', id, `${name} deleted (with linked tasks)`), ...s.activities],
  }));
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export interface TaskInput {
  title: string;
  description: string;
  dueDate: string;
  priority: Task['priority'];
  status: Task['status'];
  repId: string;
  customerId: string | null;
  dealId: string | null;
}

function taskInput(a: Task, overrides?: Partial<TaskInput>): TaskInput {
  return {
    title: a.title,
    description: a.description,
    dueDate: a.dueDate,
    priority: a.priority,
    status: a.status,
    repId: a.repId,
    customerId: a.customerId,
    dealId: a.dealId,
    ...overrides,
  };
}

function invalidTaskKey(id: string): string[] {
  return [`task-overdue:${id}`, `task-assigned:${id}:`];
}

export function addTask(input: TaskInput): string {
  const id = uid();
  const now = new Date().toISOString();
  const task: Task = {
    ...input,
    id,
    completedAt: input.status === 'completed' ? now : null,
    createdAt: now,
  };
  mutate((s) => {
    const assignee = repName(s, task.repId);
    const activities = [
      activityEntry('task', id, task.status === 'completed' ? `Task completed at creation: "${task.title}"` : `Task created: "${task.title}"`, now),
      activityEntry('task', id, `Task assigned to ${assignee}`, now),
      ...s.activities,
    ];
    const notifications = pushNotification(
      'task-assigned',
      'New task assigned',
      `"${task.title}" was assigned to ${assignee} (${task.priority} priority).`,
      `task-assigned:${id}:${task.repId}`,
      '/tasks',
      s.notifications,
      now,
    );
    return { tasks: [task, ...s.tasks], activities, notifications };
  });
  return id;
}

export function updateTask(id: string, input: TaskInput): void {
  mutate((s) => {
    const prev = s.tasks.find((t) => t.id === id);
    if (!prev) return {};
    const now = new Date().toISOString();
    const task: Task = {
      ...prev,
      ...input,
      completedAt: input.status === 'completed' ? (prev.completedAt ?? now) : null,
    };
    const tasks = s.tasks.map((t) => (t.id === id ? task : t));

    let message = 'Task updated';
    if (prev.status !== 'completed' && task.status === 'completed') message = 'Task completed';
    else if (prev.status === 'completed' && task.status !== 'completed') message = 'Task reopened';
    else if (prev.repId !== task.repId) message = `Task reassigned to ${repName(s, task.repId)}`;

    const activities = [activityEntry('task', id, message, now), ...s.activities];

    let notifications = s.notifications;
    // clear any overdue flags while editing (recreated on next check if still overdue)
    notifications = notifications.filter((n) => !invalidTaskKey(id).some((k) => n.dedupeKey === k || n.dedupeKey.startsWith(k)));
    if (prev.repId !== task.repId) {
      notifications = pushNotification(
        'task-assigned',
        'New task assigned',
        `"${task.title}" was assigned to ${repName(s, task.repId)} (${task.priority} priority).`,
        `task-assigned:${id}:${task.repId}`,
        '/tasks',
        notifications,
        now,
      );
    }
    return { tasks, activities, notifications };
  });
}

export function setTaskStatus(id: string, status: Task['status']): void {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  updateTask(id, taskInput(task, { status }));
}

export function deleteTask(id: string): void {
  const title = state.tasks.find((t) => t.id === id)?.title ?? 'Task';
  mutate((s) => ({
    tasks: s.tasks.filter((t) => t.id !== id),
    notifications: s.notifications.filter((n) => !n.dedupeKey.startsWith(`task-overdue:${id}`) && !n.dedupeKey.startsWith(`task-assigned:${id}:`)),
    activities: [activityEntry('task', id, `Task deleted: "${title}"`), ...s.activities],
  }));
}

/* ------------------------------------------------------------------ */
/* Periodic checks                                                     */
/* ------------------------------------------------------------------ */

/** Create notifications for tasks past their due date. Runs on app load + when data changes. */
export function runOverdueCheck(): void {
  const today = localTodayISO();
  const overdue = state.tasks.filter((t) => t.status !== 'completed' && t.dueDate < today);
  // Prune overdue flags that no longer apply
  const validKeys = new Set(overdue.map((t) => `task-overdue:${t.id}`));
  const hasStale = state.notifications.some(
    (n) => n.type === 'task-overdue' && !validKeys.has(n.dedupeKey),
  );
  const missing = overdue.filter((t) => !state.notifications.some((n) => n.dedupeKey === `task-overdue:${t.id}`));
  if (hasStale || missing.length > 0) {
    mutate((s) => {
      let notifications = s.notifications;
      notifications = notifications.filter((n) => n.type !== 'task-overdue' || validKeys.has(n.dedupeKey));
      const now = new Date().toISOString();
      notifications = [
        ...missing.map((task) => ({
          id: uid(),
          type: 'task-overdue' as const,
          title: 'Task overdue',
          message: `"${task.title}" is past its due date.`,
          dedupeKey: `task-overdue:${task.id}`,
          read: false,
          createdAt: now,
          link: '/tasks',
        })),
        ...notifications,
      ];
      return { notifications };
    });
  }
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function markNotificationRead(id: string): void {
  mutate((s) => ({
    notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  }));
}

export function markAllNotificationsRead(): void {
  mutate((s) => ({ notifications: s.notifications.map((n) => (n.read ? n : { ...n, read: true })) }));
}

export function deleteNotification(id: string): void {
  mutate((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
}

/* ------------------------------------------------------------------ */
/* Derived helpers                                                     */
/* ------------------------------------------------------------------ */

export function overdueTaskIds(s: AppState): string[] {
  const today = localTodayISO();
  return s.tasks.filter((t) => t.status !== 'completed' && t.dueDate < today).map((t) => t.id);
}

export function unreadNotificationCount(s: AppState): number {
  return s.notifications.filter((n) => !n.read).length;
}

export function isTaskOverdue(task: Task): boolean {
  return task.status !== 'completed' && task.dueDate < localTodayISO();
}

export function isTaskDueToday(task: Task): boolean {
  return task.status !== 'completed' && task.dueDate === localTodayISO();
}
