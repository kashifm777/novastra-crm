import { useMemo, useState } from 'react';
import { Badge, Card, ConfirmDialog, EmptyState, PageHeader, SearchInput, Select } from '../components/ui';
import { TaskFormModal } from '../components/forms';
import { deleteTask, isTaskOverdue, isTaskDueToday, repName, setTaskStatus, snapshot, useAppState } from '../lib/store';
import type { Task } from '../lib/types';
import { dueLabel, formatDate, todayISO } from '../lib/utils';
import { successToast } from '../lib/toast';

type GroupKey = 'all' | 'today' | 'overdue' | 'upcoming' | 'completed';
type SortKey = 'due' | 'priority' | 'created';

const PRIORITY_ORDER: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 };

export function TasksPage() {
  const s = useAppState();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<GroupKey>('all');
  const [priority, setPriority] = useState('all');
  const [owner, setOwner] = useState('all');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [sort, setSort] = useState<SortKey>('due');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const today = todayISO();

  const counts = useMemo(
    () => ({
      overdue: s.tasks.filter((t) => isTaskOverdue(t)).length,
      today: s.tasks.filter((t) => isTaskDueToday(t)).length,
      upcoming: s.tasks.filter((t) => t.status !== 'completed' && t.dueDate > today).length,
      completed: s.tasks.filter((t) => t.status === 'completed').length,
      all: s.tasks.length,
    }),
    [s, today],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = s.tasks.filter((t) => {
      if (priority !== 'all' && t.priority !== priority) return false;
      if (owner !== 'all' && t.repId !== owner) return false;
      if (dueFrom && t.dueDate < dueFrom) return false;
      if (dueTo && t.dueDate > dueTo) return false;
      switch (group) {
        case 'overdue':
          if (!isTaskOverdue(t)) return false;
          break;
        case 'today':
          if (!isTaskDueToday(t)) return false;
          break;
        case 'upcoming':
          if (t.status === 'completed' || t.dueDate <= today) return false;
          break;
        case 'completed':
          if (t.status !== 'completed') return false;
          break;
        default:
          break;
      }
      if (!q) return true;
      const linked = [
        snapshot().customers.find((c) => c.id === t.customerId)?.company ?? '',
        snapshot().deals.find((d) => d.id === t.dealId)?.name ?? '',
        repName(s, t.repId),
      ];
      return [t.title, t.description, ...linked].some((f) => f.toLowerCase().includes(q));
    });
    const bySort: Record<SortKey, (a: Task, b: Task) => number> = {
      due: (a, b) => a.dueDate.localeCompare(b.dueDate) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      priority: (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.dueDate.localeCompare(b.dueDate),
      created: (a, b) => b.createdAt.localeCompare(a.createdAt),
    };
    return [...list].sort(bySort[sort]);
  }, [s, search, group, priority, owner, dueFrom, dueTo, sort, today]);

  const groupOptions: { value: GroupKey; label: string }[] = [
    { value: 'all', label: `All (${counts.all})` },
    { value: 'overdue', label: `Overdue (${counts.overdue})` },
    { value: 'today', label: `Today (${counts.today})` },
    { value: 'upcoming', label: `Upcoming (${counts.upcoming})` },
    { value: 'completed', label: `Completed (${counts.completed})` },
  ];

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Follow-ups, deadlines and day-to-day sales work — with overdue tasks pulled to the top."
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + New task
          </button>
        }
      />

      <div style={{ marginBottom: 14 }}>
        <div className="segmented" role="tablist" aria-label="Task groups">
          {groupOptions.map((o) => (
            <button
              key={o.value}
              role="tab"
              aria-selected={group === o.value}
              className={`segment ${group === o.value ? 'segment-active' : ''}`}
              onClick={() => setGroup(o.value)}
              type="button"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" ariaLabel="Search tasks" />
        <Select ariaLabel="Filter by owner" value={owner} onChange={setOwner}>
          <option value="all">All owners</option>
          {s.reps.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <Select ariaLabel="Filter by priority" value={priority} onChange={setPriority}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <span className="toolbar-label">Due between</span>
        <input type="date" className="input" style={{ width: 150 }} aria-label="Due from" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 150 }} aria-label="Due to" value={dueTo} onChange={(e) => setDueTo(e.target.value)} />
        <div className="spacer" />
        <Select ariaLabel="Sort tasks" value={sort} onChange={(v) => setSort(v as SortKey)}>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
          <option value="created">Newest first</option>
        </Select>
      </div>

      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState
            icon="✓"
            title={
              group === 'overdue'
                ? 'No overdue tasks 🎉'
                : group === 'today'
                  ? 'Nothing due today'
                  : 'No tasks found'
            }
            hint={
              s.tasks.length === 0
                ? 'Create your first task to keep deals moving.'
                : 'Try different filters or search terms.'
            }
            action={
              s.tasks.length === 0 ? (
                <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                  + New task
                </button>
              ) : (
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSearch('');
                    setPriority('all');
                    setOwner('all');
                    setDueFrom('');
                    setDueTo('');
                    setGroup('all');
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <div>
            {rows.map((t) => {
              const customer = t.customerId ? s.customers.find((c) => c.id === t.customerId) : null;
              const deal = t.dealId ? s.deals.find((d) => d.id === t.dealId) : null;
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
                      <Badge tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral'}>{t.priority} priority</Badge>
                      <Badge tone={lbl.tone === 'overdue' ? 'danger' : lbl.tone === 'today' ? 'warning' : lbl.tone === 'done' ? 'success' : 'neutral'}>
                        {lbl.label}
                      </Badge>
                      {t.status === 'in-progress' && <Badge tone="info">in progress</Badge>}
                    </div>
                    {t.description && <div className="task-desc">{t.description}</div>}
                    {(customer || deal) && (
                      <div className="task-links">
                        {customer && (
                          <a className="task-link" href={`#/customers/${customer.id}`}>
                            ☺ {customer.company}
                          </a>
                        )}
                        {deal && (
                          <a className="task-link" href={`#/deals/${deal.id}`}>
                            ◈ {deal.name}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="task-side">
                    <span className="task-owner">{repName(s, t.repId)}</span>
                    <span className="cell-sub">due {formatDate(t.dueDate)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {t.status !== 'completed' && (
                      <button
                        className="icon-btn"
                        title="Mark completed"
                        aria-label={`Mark ${t.title} completed`}
                        onClick={() => {
                          setTaskStatus(t.id, 'completed');
                          successToast(`Task “${t.title}” completed ✓`);
                        }}
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="icon-btn"
                      title="Edit"
                      aria-label={`Edit ${t.title}`}
                      onClick={() => {
                        setEditing(t);
                        setFormOpen(true);
                      }}
                    >
                      ✎
                    </button>
                    <button className="icon-btn danger" title="Delete" aria-label={`Delete ${t.title}`} onClick={() => setPendingDelete(t)}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="table-footer">
              Showing {rows.length} of {s.tasks.length} tasks
              {counts.overdue > 0 ? ` · ${counts.overdue} overdue` : ''}
            </div>
          </div>
        )}
      </Card>

      <TaskFormModal open={formOpen} initial={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete task?"
        message={`“${pendingDelete?.title ?? ''}” will be permanently deleted.`}
        confirmLabel="Delete task"
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteTask(pendingDelete.id);
          successToast(`Task “${pendingDelete.title}” deleted`);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
