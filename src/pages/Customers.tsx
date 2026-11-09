import { useMemo, useState } from 'react';
import { Avatar, Badge, Card, ConfirmDialog, EmptyState, PageHeader, SearchInput, Select, useDebounced } from '../components/ui';
import { CustomerFormModal } from '../components/forms';
import { deleteCustomer, isTaskOverdue, snapshot, useAppState } from '../lib/store';
import type { Customer, CustomerStatus } from '../lib/types';
import { formatCurrency, formatDate, relativeTime } from '../lib/utils';
import { successToast } from '../lib/toast';
import { navigate } from '../lib/router';

const STATUS_TONES: Record<CustomerStatus, 'info' | 'success' | 'neutral' | 'danger'> = {
  lead: 'info',
  active: 'success',
  inactive: 'neutral',
  churned: 'danger',
};

type SortKey = 'name' | 'company' | 'status' | 'owner' | 'recent' | 'value';

export function CustomersPage() {
  const s = useAppState();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 150);
  const [status, setStatus] = useState<'all' | CustomerStatus>('all');
  const [owner, setOwner] = useState('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);

  const rows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = s.customers.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (owner !== 'all' && c.repId !== owner) return false;
      if (!q) return true;
      return [c.name, c.company, c.email, c.phone, c.location].some((f) => f.toLowerCase().includes(q));
    });
    const bySort: Record<SortKey, (a: Customer, b: Customer) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      company: (a, b) => a.company.localeCompare(b.company),
      status: (a, b) => a.status.localeCompare(b.status),
      owner: (a, b) => (snapshot().reps.find((r) => r.id === a.repId)?.name ?? '').localeCompare(snapshot().reps.find((r) => r.id === b.repId)?.name ?? ''),
      recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
      value: (a, b) => {
        const openValue = (id: string) => s.deals.filter((d) => d.customerId === id && d.outcome === 'open').reduce((sum, d) => sum + d.value, 0);
        return openValue(b.id) - openValue(a.id);
      },
    };
    return [...list].sort(bySort[sort]);
  }, [s, debouncedSearch, status, owner, sort]);

  function askDelete(c: Customer) {
    setPendingDelete(c);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteCustomer(pendingDelete.id);
    successToast(`Customer “${pendingDelete.company}” deleted`);
    setPendingDelete(null);
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${s.customers.length} accounts · ${s.customers.filter((c) => c.status === 'lead').length} new leads`}
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Add customer
          </button>
        }
      />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, company, email…" ariaLabel="Search customers" />
        <Select ariaLabel="Filter by status" value={status} onChange={(v) => setStatus(v as 'all' | CustomerStatus)}>
          <option value="all">All statuses</option>
          <option value="lead">Lead</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="churned">Churned</option>
        </Select>
        <Select ariaLabel="Filter by sales rep" value={owner} onChange={setOwner}>
          <option value="all">All owners</option>
          {s.reps.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <div className="spacer" />
        <Select ariaLabel="Sort customers" value={sort} onChange={(v) => setSort(v as SortKey)}>
          <option value="recent">Newest first</option>
          <option value="name">Name (A→Z)</option>
          <option value="company">Company (A→Z)</option>
          <option value="status">Status</option>
          <option value="owner">Owner</option>
          <option value="value">Open pipeline value</option>
        </Select>
      </div>

      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No customers found"
            hint={s.customers.length === 0 ? 'Add your first customer to start tracking deals and tasks.' : 'Try adjusting your search or filters.'}
            action={
              s.customers.length === 0 ? (
                <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                  + Add customer
                </button>
              ) : (
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                    setOwner('all');
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th className="num">Open pipeline</th>
                  <th>Open tasks</th>
                  <th>Added</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const rep = s.reps.find((r) => r.id === c.repId);
                  const openValue = s.deals
                    .filter((d) => d.customerId === c.id && d.outcome === 'open')
                    .reduce((sum, d) => sum + d.value, 0);
                  const openTasks = s.tasks.filter((t) => t.customerId === c.id && t.status !== 'completed');
                  const overdue = openTasks.some((t) => isTaskOverdue(t));
                  return (
                    <tr key={c.id} className="row-click" onClick={() => navigate(`/customers/${c.id}`)}>
                      <td>
                        <div className="person-cell">
                          <Avatar name={c.name} size={34} />
                          <div>
                            <div className="cell-main">{c.company}</div>
                            <div className="cell-sub">{c.name} · {c.location || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge tone={STATUS_TONES[c.status]}>{c.status}</Badge>
                      </td>
                      <td>{rep ? <span className="rep-chip"><Avatar name={rep.name} size={22} /> {rep.name}</span> : <span className="cell-sub">Unassigned</span>}</td>
                      <td className="num" style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
                        {openValue > 0 ? formatCurrency(openValue) : <span className="cell-sub">—</span>}
                      </td>
                      <td>
                        {openTasks.length === 0 ? (
                          <span className="cell-sub">None</span>
                        ) : (
                          <Badge tone={overdue ? 'danger' : 'neutral'}>{openTasks.length} open{overdue ? ', overdue!' : ''}</Badge>
                        )}
                      </td>
                      <td className="cell-sub" title={formatDate(c.createdAt)}>{relativeTime(c.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="cell-actions">
                          <button className="icon-btn" title="View profile" aria-label={`View ${c.company}`} onClick={() => navigate(`/customers/${c.id}`)}>
                            ↗
                          </button>
                          <button
                            className="icon-btn"
                            title="Edit"
                            aria-label={`Edit ${c.company}`}
                            onClick={() => {
                              setEditing(c);
                              setFormOpen(true);
                            }}
                          >
                            ✎
                          </button>
                          <button className="icon-btn danger" title="Delete" aria-label={`Delete ${c.company}`} onClick={() => askDelete(c)}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="table-footer">
              Showing {rows.length} of {s.customers.length} customers
            </div>
          </div>
        )}
      </Card>

      <CustomerFormModal
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete customer?"
        message={`This permanently deletes ${pendingDelete?.company ?? ''} from the CRM.`}
        detail="All deals and tasks linked to this customer are deleted as well. This cannot be undone."
        confirmLabel="Delete customer"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
