import { useState } from 'react';
import { Avatar, Badge, Card, ConfirmDialog, EmptyState, PageHeader } from '../components/ui';
import { ActivityFeed } from '../components/ActivityFeed';
import { CustomerFormModal, DealFormModal, TaskFormModal } from '../components/forms';
import { deleteCustomer, setTaskStatus, useAppState, repName, formatStage } from '../lib/store';
import type { CustomerStatus, Deal } from '../lib/types';
import { dueLabel, formatCurrency, formatDate, relativeTime } from '../lib/utils';
import { successToast } from '../lib/toast';
import { navigate } from '../lib/router';

const STATUS_TONES: Record<CustomerStatus, 'info' | 'success' | 'neutral' | 'danger'> = {
  lead: 'info',
  active: 'success',
  inactive: 'neutral',
  churned: 'danger',
};

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  const s = useAppState();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  const customer = s.customers.find((c) => c.id === customerId);

  if (!customer) {
    return (
      <div className="load-fail">
        <h2>Customer not found</h2>
        <p style={{ marginTop: 8 }}>It may have been deleted.</p>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/customers')}>
          ← Back to customers
        </button>
      </div>
    );
  }

  const deals = s.deals.filter((d) => d.customerId === customer.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const tasks = s.tasks.filter((t) => t.customerId === customer.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const openValue = deals.filter((d) => d.outcome === 'open').reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals.filter((d) => d.outcome === 'won').reduce((sum, d) => sum + d.value, 0);
  const rep = s.reps.find((r) => r.id === customer.repId);

  function remove() {
    deleteCustomer(customer!.id);
    successToast(`Customer “${customer!.company}” deleted`);
    navigate('/customers');
  }

  return (
    <div>
      <PageHeader
        title={customer.company}
        subtitle={`Account profile · added ${relativeTime(customer.createdAt)}`}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/customers')}>
              ← All customers
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditOpen(true);
              }}
            >
              ✎ Edit
            </button>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              🗑 Delete
            </button>
          </>
        }
      />

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card className="detail-head-card">
            <div className="detail-person">
              <Avatar name={customer.name} size={52} />
              <div>
                <div className="detail-person-name">{customer.name}</div>
                <div className="muted-text" style={{ fontSize: 12.5 }}>
                  <Badge tone={STATUS_TONES[customer.status]}>{customer.status}</Badge>
                </div>
              </div>
            </div>
            <div className="meta-list">
              <div className="meta-row">
                <span className="meta-key">Company</span>
                <span className="meta-val">{customer.company}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Email</span>
                <span className="meta-val">
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Phone</span>
                <span className="meta-val">{customer.phone}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Location</span>
                <span className="meta-val">{customer.location || '—'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Owner</span>
                <span className="meta-val">{rep ? <span className="rep-chip"><Avatar name={rep.name} size={20} /> {rep.name}</span> : 'Unassigned'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Customer since</span>
                <span className="meta-val">{formatDate(customer.createdAt)}</span>
              </div>
            </div>
            {customer.notes && (
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>
                  Notes
                </div>
                <div className="notes-box">{customer.notes}</div>
              </div>
            )}
          </Card>

          <Card title="Activity history">
            <ActivityFeed s={s} limit={40} scope={{ entityType: 'customer', entityId: customer.id }} />
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <Card>
            <div className="kv-strip">
              <div className="kv">
                <span className="kv-key">Open pipeline</span>
                <span className="kv-val">{formatCurrency(openValue)}</span>
              </div>
              <div className="kv">
                <span className="kv-key">Won revenue</span>
                <span className="kv-val" style={{ color: 'var(--success)' }}>{formatCurrency(wonValue)}</span>
              </div>
              <div className="kv">
                <span className="kv-key">Deals</span>
                <span className="kv-val">{deals.length}</span>
              </div>
              <div className="kv">
                <span className="kv-key">Open tasks</span>
                <span className="kv-val">{tasks.filter((t) => t.status !== 'completed').length}</span>
              </div>
            </div>
          </Card>

          <Card
            title="Deals"
            right={
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditDeal(null);
                  setDealFormOpen(true);
                }}
              >
                + New deal
              </button>
            }
            padded={false}
          >
            {deals.length === 0 ? (
              <EmptyState icon="◈" title="No deals yet" hint="Create the first deal for this customer to start tracking pipeline." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Deal</th>
                      <th>Stage</th>
                      <th className="num">Value</th>
                      <th>Close date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((d) => (
                      <tr key={d.id} className="row-click" onClick={() => navigate(`/deals/${d.id}`)}>
                        <td>
                          <div className="cell-main">{d.name}</div>
                          <div className="cell-sub">{repName(s, d.repId)}</div>
                        </td>
                        <td>
                          {d.stage === 'closed' ? (
                            <Badge tone={d.outcome === 'won' ? 'success' : d.outcome === 'lost' ? 'danger' : 'neutral'}>
                              Closed · {d.outcome}
                            </Badge>
                          ) : (
                            <Badge tone="primary">{formatStage(d.stage)}</Badge>
                          )}
                        </td>
                        <td className="num" style={{ fontWeight: 650 }}>{formatCurrency(d.value)}</td>
                        <td className="cell-sub">{formatDate(d.expectedCloseDate)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="cell-actions">
                            <button
                              className="icon-btn"
                              title="Edit deal"
                              aria-label={`Edit ${d.name}`}
                              onClick={() => {
                                setEditDeal(d);
                                setDealFormOpen(true);
                              }}
                            >
                              ✎
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="Tasks"
            right={
              <button className="btn btn-primary btn-sm" onClick={() => setTaskFormOpen(true)}>
                + New task
              </button>
            }
            padded={false}
          >
            {tasks.length === 0 ? (
              <EmptyState icon="✓" title="No tasks yet" hint="Create a follow-up task so this account never goes quiet." />
            ) : (
              <div>
                {tasks.map((t) => {
                  const lbl = dueLabel(t.dueDate, t.status);
                  return (
                    <div className="task-row" key={t.id}>
                      <input
                        type="checkbox"
                        className="task-check"
                        checked={t.status === 'completed'}
                        aria-label={`Mark "${t.title}" ${t.status === 'completed' ? 'incomplete' : 'complete'}`}
                        onChange={() => setTaskStatus(t.id, t.status === 'completed' ? 'open' : 'completed')}
                      />
                      <div className="task-body">
                        <div className="task-title-line">
                          <span className="task-title">{t.title}</span>
                          <Badge tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral'}>{t.priority}</Badge>
                          <Badge tone={lbl.tone === 'overdue' ? 'danger' : lbl.tone === 'today' ? 'warning' : lbl.tone === 'done' ? 'success' : 'neutral'}>{lbl.label}</Badge>
                        </div>
                        {t.description && <div className="task-desc">{t.description}</div>}
                        {t.dealId && s.deals.find((d) => d.id === t.dealId) && (
                          <div className="task-links">
                            <a className="task-link" href={`#/deals/${t.dealId}`}>
                              ◈ {s.deals.find((d) => d.id === t.dealId)!.name}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="task-side">
                        <span className="task-owner">{repName(s, t.repId)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <CustomerFormModal open={editOpen} initial={customer} onClose={() => setEditOpen(false)} />
      <DealFormModal
        open={dealFormOpen}
        initial={editDeal}
        presetCustomerId={customer.id}
        onClose={() => {
          setDealFormOpen(false);
          setEditDeal(null);
        }}
      />
      <TaskFormModal
        open={taskFormOpen}
        presetCustomerId={customer.id}
        onClose={() => setTaskFormOpen(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete customer?"
        message={`This permanently deletes ${customer.company} and everything linked to it.`}
        detail={`${deals.length} deal(s) and ${tasks.length} task(s) will be deleted too. This cannot be undone.`}
        confirmLabel="Delete customer"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
