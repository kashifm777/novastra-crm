import { useState } from 'react';
import { Avatar, Badge, Card, EmptyState, PageHeader } from '../components/ui';
import { ActivityFeed } from '../components/ActivityFeed';
import { CustomerFormModal, DealFormModal, TaskFormModal } from '../components/forms';
import { formatStage, setTaskStatus, useAppState } from '../lib/store';
import type { Customer, Deal, Task } from '../lib/types';
import { dueLabel, formatCurrency, formatDate, relativeTime } from '../lib/utils';
import { navigate } from '../lib/router';

export function RepDetailPage({ repId }: { repId: string }) {
  const s = useAppState();
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const rep = s.reps.find((r) => r.id === repId);

  if (!rep) {
    return (
      <div className="load-fail">
        <h2>Team member not found</h2>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/team')}>
          ← Back to sales team
        </button>
      </div>
    );
  }

  const customers = s.customers.filter((c) => c.repId === rep.id);
  const deals = s.deals.filter((d) => d.repId === rep.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const tasks = s.tasks.filter((t) => t.repId === rep.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const won = deals.filter((d) => d.outcome === 'won');
  const lost = deals.filter((d) => d.outcome === 'lost');
  const open = deals.filter((d) => d.outcome === 'open');
  const wonRevenue = won.reduce((sum, d) => sum + d.value, 0);
  const openPipeline = open.reduce((sum, d) => sum + d.value, 0);
  const winRate = won.length + lost.length > 0 ? (won.length / (won.length + lost.length)) * 100 : null;
  const avgWon = won.length > 0 ? wonRevenue / won.length : 0;

  return (
    <div>
      <PageHeader
        title={rep.name}
        subtitle={`${rep.role} · joined ${relativeTime(rep.createdAt)}`}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/team')}>
              ← Sales team
            </button>
            {rep.status === 'active' ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
          </>
        }
      />

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card className="detail-head-card">
            <div className="detail-person">
              <Avatar name={rep.name} size={52} />
              <div>
                <div className="detail-person-name">{rep.name}</div>
                <div className="muted-text" style={{ fontSize: 12.5 }}>{rep.role}</div>
              </div>
            </div>
            <div className="meta-list">
              <div className="meta-row">
                <span className="meta-key">Email</span>
                <span className="meta-val"><a href={`mailto:${rep.email}`}>{rep.email}</a></span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Phone</span>
                <span className="meta-val">{rep.phone}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Status</span>
                <span className="meta-val">{rep.status}</span>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/team')}
              title="Edit from the sales team page"
            >
              Manage member →
            </button>
          </Card>

          <Card title="Performance">
            <div className="kv-strip">
              <div className="kv">
                <span className="kv-key">Won revenue</span>
                <span className="kv-val" style={{ color: 'var(--success)' }}>{formatCurrency(wonRevenue)}</span>
              </div>
              <div className="kv">
                <span className="kv-key">Open pipeline</span>
                <span className="kv-val">{formatCurrency(openPipeline)}</span>
              </div>
              <div className="kv">
                <span className="kv-key">Win rate</span>
                <span className="kv-val">{winRate === null ? '—' : `${Math.round(winRate)}%`}</span>
              </div>
              <div className="kv">
                <span className="kv-key">Avg won deal</span>
                <span className="kv-val">{avgWon > 0 ? formatCurrency(avgWon, { compact: true }) : '—'}</span>
              </div>
            </div>
          </Card>

          <Card title="Activity history">
            <ActivityFeed s={s} limit={30} scope={{ entityType: 'rep', entityId: rep.id }} />
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <Card title={`Customers (${customers.length})`} padded={false}>
            {customers.length === 0 ? (
              <EmptyState icon="☺" title="No customers assigned" hint="Reassign a customer from the customer directory to link it here." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="row-click" onClick={() => navigate(`/customers/${c.id}`)}>
                        <td>
                          <div className="person-cell">
                            <Avatar name={c.name} size={28} />
                            <div>
                              <div className="cell-main">{c.company}</div>
                              <div className="cell-sub">{c.name}</div>
                            </div>
                          </div>
                        </td>
                        <td><Badge tone="neutral">{c.status}</Badge></td>
                        <td className="cell-sub">{c.location || '—'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="cell-actions">
                            <button className="icon-btn" title="Edit" aria-label={`Edit ${c.company}`} onClick={() => { setEditCustomer(c); setCustomerFormOpen(true); }}>
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

          <Card title={`Deals (${deals.length})`} padded={false}>
            {deals.length === 0 ? (
              <EmptyState icon="◈" title="No deals yet" hint="Create a deal and assign it to this rep." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Deal</th>
                      <th>Stage</th>
                      <th className="num">Value</th>
                      <th>Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((d) => (
                      <tr key={d.id} className="row-click" onClick={() => navigate(`/deals/${d.id}`)}>
                        <td>
                          <div className="cell-main">{d.name}</div>
                          <div className="cell-sub">{s.customers.find((c) => c.id === d.customerId)?.company ?? '—'}</div>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={`Tasks (${tasks.length})`} padded={false}>
            {tasks.length === 0 ? (
              <EmptyState icon="✓" title="No tasks assigned" hint="Assign a task from the task manager." />
            ) : (
              <div>
                {tasks.map((t) => {
                  const lbl = dueLabel(t.dueDate, t.status);
                  return (
                    <div className={`task-row ${t.status === 'completed' ? 'completed' : ''}`} key={t.id}>
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
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          className="icon-btn"
                          title="Edit"
                          aria-label={`Edit ${t.title}`}
                          onClick={() => { setEditTask(t); setTaskFormOpen(true); }}
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <DealFormModal open={dealFormOpen} initial={editDeal} onClose={() => { setDealFormOpen(false); setEditDeal(null); }} />
      <TaskFormModal open={taskFormOpen} initial={editTask} onClose={() => { setTaskFormOpen(false); setEditTask(null); }} />
      {editCustomer && (
        <CustomerFormModal
          open={customerFormOpen}
          initial={editCustomer}
          onClose={() => { setCustomerFormOpen(false); setEditCustomer(null); }}
        />
      )}
    </div>
  );
}
