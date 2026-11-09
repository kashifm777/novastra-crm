import { useMemo, useState } from 'react';
import { Avatar, Badge, Card, EmptyState, PageHeader, SearchInput, useDebounced } from '../components/ui';
import { RepFormModal } from '../components/forms';
import { snapshot, useAppState, updateRep } from '../lib/store';
import type { Rep } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { errorToast, successToast } from '../lib/toast';
import { navigate } from '../lib/router';

export function TeamPage() {
  const s = useAppState();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 150);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rep | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Rep | null>(null);

  const cards = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return s.reps
      .filter((r) => !q || [r.name, r.role, r.email].some((f) => f.toLowerCase().includes(q)))
      .map((r) => {
        const deals = s.deals.filter((d) => d.repId === r.id);
        const won = deals.filter((d) => d.outcome === 'won');
        const open = deals.filter((d) => d.outcome === 'open');
        const lost = deals.filter((d) => d.outcome === 'lost');
        return {
          rep: r,
          customers: s.customers.filter((c) => c.repId === r.id).length,
          tasks: s.tasks.filter((t) => t.repId === r.id && t.status !== 'completed').length,
          openPipeline: open.reduce((sum, d) => sum + d.value, 0),
          wonRevenue: won.reduce((sum, d) => sum + d.value, 0),
          wonCount: won.length,
          lostCount: lost.length,
          dealsCount: deals.length,
        };
      })
      .sort((a, b) => b.wonRevenue - a.wonRevenue);
  }, [s, debounced]);

  function toggleStatus() {
    if (!confirmToggle) return;
    const nextStatus = confirmToggle.status === 'active' ? 'inactive' : 'active';
    const activeCount = snapshot().reps.filter((x) => x.status === 'active').length;
    if (nextStatus === 'inactive' && activeCount <= 1) {
      errorToast("You can't deactivate the last active rep.");
      setConfirmToggle(null);
      return;
    }
    updateRep(confirmToggle.id, { status: nextStatus });
    successToast(`${confirmToggle.name} ${nextStatus === 'inactive' ? 'deactivated' : 'reactivated'}`);
    setConfirmToggle(null);
  }

  return (
    <div>
      <PageHeader
        title="Sales team"
        subtitle="Your reps, their books of business and performance at a glance."
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Add team member
          </button>
        }
      />

      <div className="toolbar" style={{ marginBottom: 14 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search reps…" ariaLabel="Search sales reps" />
        <span className="muted-text small-text">
          {s.reps.filter((r) => r.status === 'active').length} active · {s.reps.filter((r) => r.status === 'inactive').length} inactive
        </span>
      </div>

      {cards.length === 0 ? (
        <Card>
          <EmptyState
            icon="⚑"
            title="No team members found"
            hint={s.reps.length === 0 ? 'Add reps so customers and deals can be assigned.' : 'Try a different search.'}
            action={
              s.reps.length === 0 ? (
                <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                  + Add team member
                </button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="team-grid">
          {cards.map(({ rep, customers, tasks, openPipeline, wonRevenue, wonCount, lostCount }) => (
            <div className={`team-card ${rep.status === 'inactive' ? 'inactive' : ''}`} key={rep.id}>
              <div className="team-card-top">
                <Avatar name={rep.name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="team-name">{rep.name}</div>
                  <div className="team-role">{rep.role}</div>
                  <div style={{ marginTop: 5 }}>
                    <Badge tone={rep.status === 'active' ? 'success' : 'neutral'}>{rep.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="team-contact">
                <span>✉ {rep.email}</span>
                <span>☎ {rep.phone}</span>
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <Badge tone="neutral">{customers} customers</Badge>
                <Badge tone="neutral">{tasks} open tasks</Badge>
                <Badge tone="primary">{formatCurrency(openPipeline, { compact: true })} open</Badge>
              </div>
              <div className="team-stats">
                <div className="team-stat">
                  <span>Won revenue</span>
                  <span style={{ color: 'var(--success)' }}>{formatCurrency(wonRevenue, { compact: true })}</span>
                </div>
                <div className="team-stat">
                  <span>Win rate</span>
                  <span>{wonCount + lostCount > 0 ? `${Math.round((wonCount / (wonCount + lostCount)) * 100)}%` : '—'}</span>
                </div>
                <div className="team-stat">
                  <span>Deals</span>
                  <span>{wonCount}W · {lostCount}L</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/team/${rep.id}`)}>
                  View detail →
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditing(rep);
                    setFormOpen(true);
                  }}
                >
                  ✎ Edit
                </button>
                <button
                  className={`btn btn-sm ${rep.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => setConfirmToggle(rep)}
                >
                  {rep.status === 'active' ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RepFormModal open={formOpen} initial={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />
      {confirmToggle && (
        <ConfirmUse
          rep={confirmToggle}
          onCancel={() => setConfirmToggle(null)}
          onConfirm={() => toggleStatus()}
        />
      )}
    </div>
  );
}

function ConfirmUse({ rep, onConfirm, onCancel }: { rep: Rep; onConfirm: () => void; onCancel: () => void }) {
  const deactivating = rep.status === 'active';
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={deactivating ? 'Deactivate rep' : 'Reactivate rep'}>
        <div className="modal-head">
          <h2>{deactivating ? 'Deactivate rep?' : 'Reactivate rep?'}</h2>
          <button className="icon-btn" onClick={onCancel} aria-label="Close dialog">✕</button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">
            {deactivating
              ? `${rep.name} will be marked inactive and hidden from new assignments. Their customers, deals and tasks remain in place.`
              : `${rep.name} will be marked active again and can receive new assignments.`}
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className={`btn ${deactivating ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
              {deactivating ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
