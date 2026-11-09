import { useMemo, useState } from 'react';
import { Avatar, Badge, Card, ConfirmDialog, EmptyState, PageHeader, SearchInput, Select, useDebounced } from '../components/ui';
import { DealFormModal } from '../components/forms';
import { deleteDeal, formatStage, snapshot, useAppState } from '../lib/store';
import { DEAL_STAGES } from '../lib/types';
import type { Deal } from '../lib/types';
import { formatCurrency, formatDate } from '../lib/utils';
import { successToast } from '../lib/toast';
import { navigate } from '../lib/router';

type SortKey = 'name' | 'value' | 'close' | 'recent';

function outcomeBadge(d: Deal) {
  if (d.stage === 'closed') {
    if (d.outcome === 'won') return <Badge tone="success">Won</Badge>;
    if (d.outcome === 'lost') return <Badge tone="danger">Lost</Badge>;
    return <Badge tone="neutral">Closed — pending outcome</Badge>;
  }
  return <Badge tone="primary">{formatStage(d.stage)}</Badge>;
}

export function DealsPage() {
  const s = useAppState();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 150);
  const [stage, setStage] = useState('all');
  const [rep, setRep] = useState('all');
  const [customer, setCustomer] = useState('all');
  const [outcome, setOutcome] = useState('all');
  const [closeFrom, setCloseFrom] = useState('');
  const [closeTo, setCloseTo] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Deal | null>(null);

  const rows = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    const list = s.deals.filter((d) => {
      if (stage !== 'all' && d.stage !== stage) return false;
      if (rep !== 'all' && d.repId !== rep) return false;
      if (customer !== 'all' && d.customerId !== customer) return false;
      if (outcome !== 'all') {
        if (outcome === 'closed' ? d.stage !== 'closed' : d.outcome !== outcome) return false;
      }
      if (closeFrom && d.expectedCloseDate < closeFrom) return false;
      if (closeTo && d.expectedCloseDate > closeTo) return false;
      if (!q) return true;
      const customerName = snapshot().customers.find((c) => c.id === d.customerId)?.company ?? '';
      return [d.name, customerName].some((f) => f.toLowerCase().includes(q));
    });
    const bySort: Record<SortKey, (a: Deal, b: Deal) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      value: (a, b) => b.value - a.value,
      close: (a, b) => a.expectedCloseDate.localeCompare(b.expectedCloseDate),
      recent: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    };
    return [...list].sort(bySort[sort]);
  }, [s, debounced, stage, rep, customer, outcome, closeFrom, closeTo, sort]);

  const totals = useMemo(
    () => ({
      all: rows.reduce((sum, d) => sum + d.value, 0),
      open: rows.filter((d) => d.outcome === 'open').reduce((sum, d) => sum + d.value, 0),
      won: rows.filter((d) => d.outcome === 'won').reduce((sum, d) => sum + d.value, 0),
    }),
    [rows],
  );

  const filtersActive = stage !== 'all' || rep !== 'all' || customer !== 'all' || outcome !== 'all' || closeFrom || closeTo;

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Search, sort and manage every deal across all six pipeline stages."
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + New deal
          </button>
        }
      />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search deal or customer…" ariaLabel="Search deals" />
        <Select ariaLabel="Filter by stage" value={stage} onChange={setStage}>
          <option value="all">All stages</option>
          {DEAL_STAGES.map((st) => (
            <option key={st} value={st}>{formatStage(st)}</option>
          ))}
        </Select>
        <Select ariaLabel="Filter by rep" value={rep} onChange={setRep}>
          <option value="all">All reps</option>
          {s.reps.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <Select ariaLabel="Filter by customer" value={customer} onChange={setCustomer}>
          <option value="all">All customers</option>
          {s.customers.map((c) => (
            <option key={c.id} value={c.id}>{c.company}</option>
          ))}
        </Select>
        <Select ariaLabel="Filter by outcome" value={outcome} onChange={setOutcome}>
          <option value="all">All outcomes</option>
          <option value="open">Open</option>
          <option value="closed">Closed (any)</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </Select>
        <span className="toolbar-label">Close date</span>
        <input type="date" className="input" style={{ width: 150 }} aria-label="Close date from" value={closeFrom} onChange={(e) => setCloseFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 150 }} aria-label="Close date to" value={closeTo} onChange={(e) => setCloseTo(e.target.value)} />
      </div>

      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState
            icon="◈"
            title="No deals match"
            hint={s.deals.length === 0 ? 'Create your first deal to start building the pipeline.' : 'Try widening the filters or clearing the search.'}
            action={
              s.deals.length === 0 ? (
                <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                  + New deal
                </button>
              ) : filtersActive ? (
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSearch('');
                    setStage('all');
                    setRep('all');
                    setCustomer('all');
                    setOutcome('all');
                    setCloseFrom('');
                    setCloseTo('');
                  }}
                >
                  Clear all filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => setSort('name')}>Deal {sort === 'name' ? '↓' : ''}</th>
                  <th>Customer</th>
                  <th>Rep</th>
                  <th className="sortable num" onClick={() => setSort('value')}>Value {sort === 'value' ? '↓' : ''}</th>
                  <th>Stage / outcome</th>
                  <th className="num">Probability</th>
                  <th className="sortable" onClick={() => setSort('close')}>Expected close {sort === 'close' ? '↓' : ''}</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const cust = s.customers.find((c) => c.id === d.customerId);
                  const repUser = s.reps.find((r) => r.id === d.repId);
                  return (
                    <tr key={d.id} className="row-click" onClick={() => navigate(`/deals/${d.id}`)}>
                      <td>
                        <div className="cell-main">{d.name}</div>
                        <div className="cell-sub">updated {formatDate(d.updatedAt)}</div>
                      </td>
                      <td>{cust ? <span style={{ color: 'var(--text-soft)' }}>{cust.company}</span> : <span className="cell-sub">Missing</span>}</td>
                      <td>{repUser ? <span className="rep-chip"><Avatar name={repUser.name} size={22} /> {repUser.name}</span> : <span className="cell-sub">Unassigned</span>}</td>
                      <td className="num" style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(d.value)}</td>
                      <td>{outcomeBadge(d)}</td>
                      <td className="num">
                        <span className="prob-bar"><span className="prob-fill" style={{ width: `${d.probability}%` }} /></span>
                        {d.probability}%
                      </td>
                      <td className="cell-sub">{formatDate(d.expectedCloseDate)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="cell-actions">
                          <button className="icon-btn" title="Edit" aria-label={`Edit ${d.name}`} onClick={() => { setEditing(d); setFormOpen(true); }}>
                            ✎
                          </button>
                          <button className="icon-btn danger" title="Delete" aria-label={`Delete ${d.name}`} onClick={() => setPendingDelete(d)}>
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
              Showing {rows.length} of {s.deals.length} deals · total value {formatCurrency(totals.all)} · open {formatCurrency(totals.open)} · won {formatCurrency(totals.won)}
            </div>
          </div>
        )}
      </Card>

      <DealFormModal open={formOpen} initial={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete deal?"
        message={`“${pendingDelete?.name ?? ''}” (${pendingDelete ? formatCurrency(pendingDelete.value) : ''}) will be permanently deleted.`}
        detail="Linked tasks are deleted as well. This cannot be undone."
        confirmLabel="Delete deal"
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteDeal(pendingDelete.id);
          successToast(`Deal “${pendingDelete.name}” deleted`);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
