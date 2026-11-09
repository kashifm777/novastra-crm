import { useEffect, useState } from 'react';
import { addCustomer, addDeal, addRep, addTask, snapshot, updateCustomer, updateDeal, updateRep, updateTask } from '../lib/store';
import { DEAL_STAGES } from '../lib/types';
import type { Customer, Deal, DealStage, Rep, Task } from '../lib/types';
import { formatStage } from '../lib/store';
import { isEmail, isISODate, isPhone } from '../lib/utils';
import { errorToast, successToast } from '../lib/toast';
import { Field, FormRow, Modal } from './ui';

/* ------------------------------------------------------------------ */
/* Customer form                                                       */
/* ------------------------------------------------------------------ */

interface CustomerDraft {
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  status: Customer['status'];
  repId: string;
  notes: string;
}

const EMPTY_CUSTOMER: CustomerDraft = {
  name: '',
  company: '',
  email: '',
  phone: '',
  location: '',
  status: 'lead',
  repId: '',
  notes: '',
};

export function CustomerFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Customer | null;
}) {
  const [draft, setDraft] = useState<CustomerDraft>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});

  useEffect(() => {
    if (open) {
      setDraft(initial ? {
        name: initial.name,
        company: initial.company,
        email: initial.email,
        phone: initial.phone,
        location: initial.location,
        status: initial.status,
        repId: initial.repId,
        notes: initial.notes,
      } : EMPTY_CUSTOMER);
      setErrors({});
    }
  }, [open, initial]);

  const s = snapshot();

  function set<K extends keyof CustomerDraft>(key: K, value: CustomerDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof CustomerDraft, string>> = {};
    if (!draft.name.trim()) errs.name = 'Contact name is required';
    if (!draft.company.trim()) errs.company = 'Company is required';
    if (!isEmail(draft.email)) errs.email = 'Enter a valid email address';
    if (!isPhone(draft.phone)) errs.phone = 'Enter a valid phone number';
    if (!draft.repId) errs.repId = 'Assign a sales rep';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: draft.name.trim(),
      company: draft.company.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      location: draft.location.trim(),
      status: draft.status,
      repId: draft.repId,
      notes: draft.notes.trim(),
    };
    try {
      if (initial) {
        updateCustomer(initial.id, payload);
        successToast(`Customer “${payload.company}” updated`);
      } else {
        addCustomer(payload);
        successToast(`Customer “${payload.company}” added`);
      }
      onClose();
    } catch {
      errorToast('Something went wrong. Please try again.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit customer' : 'Add customer'} wide>
      <form onSubmit={submit} noValidate className="form-stack">
        <FormRow>
          <Field label="Contact name" required error={errors.name}>
            <input className={`input ${errors.name ? 'input-error' : ''}`} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Lena Fischer" />
          </Field>
          <Field label="Company" required error={errors.company}>
            <input className={`input ${errors.company ? 'input-error' : ''}`} value={draft.company} onChange={(e) => set('company', e.target.value)} placeholder="Northwind Logistics" />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Email" required error={errors.email}>
            <input type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={draft.email} onChange={(e) => set('email', e.target.value)} placeholder="lena@northwindlog.com" />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input className={`input ${errors.phone ? 'input-error' : ''}`} value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(212) 555-0114" />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Location">
            <input className="input" value={draft.location} onChange={(e) => set('location', e.target.value)} placeholder="City, ST" />
          </Field>
          <Field label="Status">
            <select className="select" value={draft.status} onChange={(e) => set('status', e.target.value as Customer['status'])}>
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
            </select>
          </Field>
        </FormRow>
        <Field label="Assigned sales rep" required error={errors.repId}>
          <select className="select" value={draft.repId} onChange={(e) => set('repId', e.target.value)}>
            <option value="">Select a rep…</option>
            {s.reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}{r.status === 'inactive' ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes" hint="Anything the team should know about this account.">
          <textarea className="textarea" value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {initial ? 'Save changes' : 'Add customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Rep form                                                            */
/* ------------------------------------------------------------------ */

interface RepDraft {
  name: string;
  email: string;
  phone: string;
  role: Rep['role'];
  status: Rep['status'];
}

const EMPTY_REP: RepDraft = { name: '', email: '', phone: '', role: 'Sales Representative', status: 'active' };

export function RepFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Rep | null }) {
  const [draft, setDraft] = useState<RepDraft>(EMPTY_REP);
  const [errors, setErrors] = useState<Partial<Record<keyof RepDraft, string>>>({});

  useEffect(() => {
    if (open) {
      setDraft(initial ? {
        name: initial.name,
        email: initial.email,
        phone: initial.phone,
        role: initial.role,
        status: initial.status,
      } : EMPTY_REP);
      setErrors({});
    }
  }, [open, initial]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof RepDraft, string>> = {};
    if (!draft.name.trim()) errs.name = 'Name is required';
    if (!isEmail(draft.email)) errs.email = 'Enter a valid email address';
    if (!isPhone(draft.phone)) errs.phone = 'Enter a valid phone number';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (initial) {
      updateRep(initial.id, draft);
      successToast(`${draft.name} updated`);
    } else {
      addRep({ ...draft, name: draft.name.trim() });
      successToast(`${draft.name.trim()} added to the sales team`);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit team member' : 'Add team member'}>
      <form onSubmit={submit} noValidate className="form-stack">
        <Field label="Full name" required error={errors.name}>
          <input className={`input ${errors.name ? 'input-error' : ''}`} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Sarah Chen" />
        </Field>
        <FormRow>
          <Field label="Email" required error={errors.email}>
            <input type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="sarah@novastra.com" />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input className={`input ${errors.phone ? 'input-error' : ''}`} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="(415) 555-0132" />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Role">
            <select className="select" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Rep['role'] })}>
              <option>Sales Representative</option>
              <option>Senior Sales Rep</option>
              <option>Account Executive</option>
              <option>Sales Manager</option>
            </select>
          </Field>
          <Field label="Status" hint="Deactivating keeps their records but hides them from new assignments.">
            <select className="select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Rep['status'] })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </FormRow>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {initial ? 'Save changes' : 'Add team member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Deal form                                                           */
/* ------------------------------------------------------------------ */

interface DealDraft {
  name: string;
  customerId: string;
  repId: string;
  value: string;
  expectedCloseDate: string;
  stage: DealStage;
  outcome: 'won' | 'lost';
  probability: string;
  notes: string;
}

function dealToDraft(deal?: Deal | null, presetCustomerId?: string | null, presetStage?: DealStage): DealDraft {
  if (deal) {
    return {
      name: deal.name,
      customerId: deal.customerId,
      repId: deal.repId,
      value: String(deal.value),
      expectedCloseDate: deal.expectedCloseDate,
      stage: deal.stage,
      outcome: deal.outcome === 'lost' ? 'lost' : 'won',
      probability: String(deal.probability),
      notes: deal.notes,
    };
  }
  return {
    name: '',
    customerId: presetCustomerId ?? '',
    repId: presetCustomerId ? snapshot().customers.find((c) => c.id === presetCustomerId)?.repId ?? '' : '',
    value: '',
    expectedCloseDate: '',
    stage: presetStage ?? 'new-lead',
    outcome: 'won',
    probability: presetStage === 'new-lead' ? '15' : '40',
    notes: '',
  };
}

export function DealFormModal({
  open,
  onClose,
  initial,
  presetCustomerId,
  presetStage,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Deal | null;
  presetCustomerId?: string | null;
  presetStage?: DealStage;
}) {
  const [draft, setDraft] = useState<DealDraft>(() => dealToDraft(initial, presetCustomerId, presetStage));
  const [errors, setErrors] = useState<Partial<Record<keyof DealDraft, string>>>({});

  useEffect(() => {
    if (open) {
      setDraft(dealToDraft(initial, presetCustomerId, presetStage));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, presetCustomerId, presetStage]);

  function set<K extends keyof DealDraft>(key: K, value: DealDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof DealDraft, string>> = {};
    if (!draft.name.trim()) errs.name = 'Deal name is required';
    if (!draft.customerId) errs.customerId = 'Select a customer';
    if (!draft.repId) errs.repId = 'Select a sales rep';
    const value = Number(draft.value);
    if (!draft.value.trim() || Number.isNaN(value) || value <= 0) errs.value = 'Enter a value greater than $0';
    if (!isISODate(draft.expectedCloseDate)) errs.expectedCloseDate = 'Pick an expected close date';
    const prob = Number(draft.probability);
    if (Number.isNaN(prob) || prob < 0 || prob > 100) errs.probability = 'Probability must be 0–100';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: draft.name.trim(),
      customerId: draft.customerId,
      repId: draft.repId,
      value: Math.round(value),
      expectedCloseDate: draft.expectedCloseDate,
      stage: draft.stage,
      outcome: draft.stage === 'closed' ? (draft.outcome as Deal['outcome']) : ('open' as Deal['outcome']),
      probability: Math.round(prob),
      notes: draft.notes.trim(),
    };
    try {
      if (initial) {
        updateDeal(initial.id, payload);
        successToast(`Deal “${payload.name}” updated`);
      } else {
        addDeal(payload);
        successToast(`Deal “${payload.name}” created`);
      }
      onClose();
    } catch {
      errorToast('Something went wrong. Please try again.');
    }
  }

  const isClosed = draft.stage === 'closed';

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit deal' : 'New deal'} wide>
      <form onSubmit={submit} noValidate className="form-stack">
        <Field label="Deal name" required error={errors.name}>
          <input className={`input ${errors.name ? 'input-error' : ''}`} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Northwind Platform License" />
        </Field>
        <FormRow>
          <Field label="Customer" required error={errors.customerId}>
            <select className={`select ${errors.customerId ? 'input-error' : ''}`} value={draft.customerId} onChange={(e) => {
              const customerId = e.target.value;
              const customer = snapshot().customers.find((c) => c.id === customerId);
              setDraft((d) => ({ ...d, customerId, repId: d.repId || customer?.repId || '' }));
            }}>
              <option value="">Select a customer…</option>
              {snapshot().customers.map((c) => (
                <option key={c.id} value={c.id}>{c.company} — {c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Sales rep" required error={errors.repId}>
            <select className={`select ${errors.repId ? 'input-error' : ''}`} value={draft.repId} onChange={(e) => set('repId', e.target.value)}>
              <option value="">Select a rep…</option>
              {snapshot().reps.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.status === 'inactive' ? ' (inactive)' : ''}</option>
              ))}
            </select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Value (USD)" required error={errors.value}>
            <input type="number" min="0" step="100" className={`input ${errors.value ? 'input-error' : ''}`} value={draft.value} onChange={(e) => set('value', e.target.value)} placeholder="42000" />
          </Field>
          <Field label="Expected close date" required error={errors.expectedCloseDate}>
            <input type="date" className={`input ${errors.expectedCloseDate ? 'input-error' : ''}`} value={draft.expectedCloseDate} onChange={(e) => set('expectedCloseDate', e.target.value)} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Stage" required>
            <select className="select" value={draft.stage} onChange={(e) => set('stage', e.target.value as DealStage)}>
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>{formatStage(stage)}</option>
              ))}
            </select>
          </Field>
          {isClosed ? (
            <Field label="Outcome" required hint="Closed deals must be marked Won or Lost.">
              <select className="select" value={draft.outcome} onChange={(e) => set('outcome', e.target.value as 'won' | 'lost')}>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </Field>
          ) : (
            <Field label="Probability" required error={errors.probability} hint="Likelihood this deal closes, 0–100%.">
              <input type="number" min="0" max="100" step="5" className={`input ${errors.probability ? 'input-error' : ''}`} value={draft.probability} onChange={(e) => set('probability', e.target.value)} />
            </Field>
          )}
        </FormRow>
        <Field label="Notes">
          <textarea className="textarea" value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {initial ? 'Save changes' : 'Create deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Task form                                                           */
/* ------------------------------------------------------------------ */

interface TaskDraft {
  title: string;
  description: string;
  dueDate: string;
  priority: Task['priority'];
  status: Task['status'];
  repId: string;
  customerId: string;
  dealId: string;
}

function taskToDraft(task?: Task | null): TaskDraft {
  if (task) {
    return {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      repId: task.repId,
      customerId: task.customerId ?? '',
      dealId: task.dealId ?? '',
    };
  }
  return { title: '', description: '', dueDate: '', priority: 'medium', status: 'open', repId: snapshot().reps.find((r) => r.status === 'active')?.id ?? '', customerId: '', dealId: '' };
}

export function TaskFormModal({
  open,
  onClose,
  initial,
  presetCustomerId,
  presetDealId,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Task | null;
  presetCustomerId?: string | null;
  presetDealId?: string | null;
}) {
  const [draft, setDraft] = useState<TaskDraft>(() => ({
    ...taskToDraft(initial),
    customerId: presetCustomerId ?? taskToDraft(initial).customerId,
    dealId: presetDealId ?? taskToDraft(initial).dealId,
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof TaskDraft, string>>>({});

  useEffect(() => {
    if (open) {
      const base = taskToDraft(initial);
      setDraft({ ...base, customerId: presetCustomerId ?? base.customerId, dealId: presetDealId ?? base.dealId });
      setErrors({});
    }
  }, [open, initial, presetCustomerId, presetDealId]);

  function set<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const visibleDeals = snapshot().deals.filter((d) => (draft.customerId ? d.customerId === draft.customerId : true));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof TaskDraft, string>> = {};
    if (!draft.title.trim()) errs.title = 'Task title is required';
    if (!isISODate(draft.dueDate)) errs.dueDate = 'Pick a due date';
    if (!draft.repId) errs.repId = 'Assign someone';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload: Parameters<typeof addTask>[0] = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      dueDate: draft.dueDate,
      priority: draft.priority,
      status: draft.status,
      repId: draft.repId,
      customerId: draft.customerId || null,
      dealId: draft.dealId || null,
    };
    try {
      if (initial) {
        updateTask(initial.id, payload);
        successToast(`Task “${payload.title}” updated`);
      } else {
        addTask(payload);
        successToast(`Task “${payload.title}” created`);
      }
      onClose();
    } catch {
      errorToast('Something went wrong. Please try again.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit task' : 'New task'}>
      <form onSubmit={submit} noValidate className="form-stack">
        <Field label="Title" required error={errors.title}>
          <input className={`input ${errors.title ? 'input-error' : ''}`} value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Send pricing sheet" />
        </Field>
        <Field label="Description">
          <textarea className="textarea" value={draft.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <FormRow>
          <Field label="Due date" required error={errors.dueDate}>
            <input type="date" className={`input ${errors.dueDate ? 'input-error' : ''}`} value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </Field>
          <Field label="Priority">
            <select className="select" value={draft.priority} onChange={(e) => set('priority', e.target.value as Task['priority'])}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Status">
            <select className="select" value={draft.status} onChange={(e) => set('status', e.target.value as Task['status'])}>
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Assignee" required error={errors.repId}>
            <select className={`select ${errors.repId ? 'input-error' : ''}`} value={draft.repId} onChange={(e) => set('repId', e.target.value)}>
              <option value="">Select a rep…</option>
              {snapshot().reps.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.status === 'inactive' ? ' (inactive)' : ''}</option>
              ))}
            </select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Linked customer" hint="Optional">
            <select className="select" value={draft.customerId} onChange={(e) => setDraft((d) => ({ ...d, customerId: e.target.value, dealId: '' }))}>
              <option value="">None</option>
              {snapshot().customers.map((c) => (
                <option key={c.id} value={c.id}>{c.company}</option>
              ))}
            </select>
          </Field>
          <Field label="Linked deal" hint={draft.customerId ? undefined : 'Filter deals by linking a customer first.'}>
            <select className="select" value={draft.dealId} onChange={(e) => set('dealId', e.target.value)} disabled={!draft.dealId && visibleDeals.length === 0}>
              <option value="">None</option>
              {visibleDeals.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
        </FormRow>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {initial ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
