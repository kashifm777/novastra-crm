export type CustomerStatus = 'lead' | 'active' | 'inactive' | 'churned';
export type RepStatus = 'active' | 'inactive';
export type RepRole = 'Sales Representative' | 'Senior Sales Rep' | 'Account Executive' | 'Sales Manager';

export const DEAL_STAGES = ['new-lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed'] as const;
export type DealStage = (typeof DEAL_STAGES)[number];
export type DealOutcome = 'open' | 'won' | 'lost';
export type TaskStatus = 'open' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  status: CustomerStatus;
  repId: string;
  notes: string;
  createdAt: string;
}

export interface Rep {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RepRole;
  status: RepStatus;
  createdAt: string;
}

export interface Deal {
  id: string;
  name: string;
  customerId: string;
  repId: string;
  value: number;
  expectedCloseDate: string;
  stage: DealStage;
  outcome: DealOutcome;
  probability: number;
  notes: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  repId: string;
  customerId: string | null;
  dealId: string | null;
  completedAt: string | null;
  createdAt: string;
}

export type NotificationType =
  | 'task-assigned'
  | 'task-overdue'
  | 'deal-assigned'
  | 'deal-stage'
  | 'deal-won'
  | 'deal-lost';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey: string;
  read: boolean;
  createdAt: string;
  link: string;
}

export interface Activity {
  id: string;
  entityType: 'customer' | 'deal' | 'task' | 'rep';
  entityId: string;
  message: string;
  createdAt: string;
}

export interface AppState {
  customers: Customer[];
  reps: Rep[];
  deals: Deal[];
  tasks: Task[];
  notifications: NotificationItem[];
  activities: Activity[];
}
