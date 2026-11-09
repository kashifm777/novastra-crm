import { useMemo, useState } from 'react';
import { Avatar, Badge, Modal, PageHeader, Select, SearchInput } from '../components/ui';
import { DealFormModal } from '../components/forms';
import { closeDeal, formatStage, moveDealStage, useAppState } from '../lib/store';
import { DEAL_STAGES } from '../lib/types';
import type { Deal, DealStage } from '../lib/types';
import { formatCurrency, formatDate } from '../lib/utils';
import { successToast } from '../lib/toast';
import { navigate } from '../lib/router';

/** Prompt shown when a deal is dropped into the Closed stage. */
function CloseOutcomeDialog({ deal, onDone }: { deal: Deal | null; onDone: () => void }) {
  return (
    <Modal open={deal !== null} onClose={onDone} title="Close deal" >
      {deal && (
        <>
          <p>
            Closing <strong>{deal.name}</strong> ({formatCurrency(deal.value)}) — mark the outcome:
          </p>
          <p className="confirm-detail">Closed deals keep their stage “Closed” with a clear Won or Lost result in every view.</p>
          <div className="modal-actions">
            <button
              className="btn btn-danger"
              onClick={() => {
                closeDeal(deal.id, 'lost');
                successToast(`Deal marked Lost (${formatCurrency(deal.value)})`);
                onDone();
              }}
            >
              Mark Lost
            </button>
            <button
              className="btn btn-success"
              onClick={() => {
                closeDeal(deal.id, 'won');
                successToast(`Deal won! ${formatCurrency(deal.value)} added to revenue 🎉`);
                onDone();
              }}
            >
              Mark Won
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

export function PipelinePage() {
  const s = useAppState();
  const [search, setSearch] = useState('');
  const [rep, setRep] = useState('all');
  const [customer, setCustomer] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [presetStage, setPresetStage] = useState<DealStage>('new-lead');
  const [closingDeal, setClosingDeal] = useState<Deal | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return s.deals.filter((d) => {
      if (rep !== 'all' && d.repId !== rep) return false;
      if (customer !== 'all' && d.customerId !== customer) return false;
      if (!q) return true;
      const cust = s.customers.find((c) => c.id === d.customerId)?.company ?? '';
      return [d.name, cust].some((f) => f.toLowerCase().includes(q));
    });
  }, [s, search, rep, customer]);

  function move(deal: Deal, dir: -1 | 1) {
    const idx = DEAL_STAGES.indexOf(deal.stage);
    const next = DEAL_STAGES[idx + dir];
    if (!next) return;
    if (next === 'closed') {
      setClosingDeal(deal);
      return;
    }
    if (deal.stage === 'closed') {
      moveDealStage(deal.id, next);
      successToast(`Deal moved back to ${formatStage(next)} — outcome reset to open`);
      return;
    }
    moveDealStage(deal.id, next);
    successToast(`Deal moved to ${formatStage(next)}`);
  }

  const columns = DEAL_STAGES.map((stage) => {
    const deals = filtered
      .filter((d) => d.stage === stage)
      .sort((a, b) => b.value - a.value);
    return { stage, deals, total: deals.reduce((sum, d) => sum + d.value, 0) };
  });

  return (
    <div>
      <PageHeader
        title="Deal pipeline"
        subtitle="Drag-free stage controls: use the arrows on each card to move a deal forward or back."
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              setPresetStage('new-lead');
              setFormOpen(true);
            }}
          >
            + New deal
          </button>
        }
      />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search deals…" ariaLabel="Search pipeline" />
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
        <span className="muted-text small-text">
          Open pipeline:{' '}
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(filtered.filter((d) => d.outcome === 'open').reduce((sum, d) => sum + d.value, 0))}
          </strong>
        </span>
      </div>

      <div className="pipeline-scroll">
        <div className="pipeline-grid">
          {columns.map(({ stage, deals, total }) => {
            const stageIdx = DEAL_STAGES.indexOf(stage);
            return (
              <div className="pipeline-col" key={stage}>
                <div className="pipeline-col-head">
                  <span className="pipeline-col-title">
                    {formatStage(stage)}
                    {stage === 'closed' && <span className="muted-text small-text">(won / lost)</span>}
                  </span>
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <span className="pipeline-col-total">{formatCurrency(total, { compact: true })}</span>
                    <span className="pipeline-col-count">{deals.length}</span>
                  </span>
                </div>
                <div className="pipeline-results">
                  {deals.map((d) => {
                    const cust = s.customers.find((c) => c.id === d.customerId);
                    const repUser = s.reps.find((r) => r.id === d.repId);
                    const isClosed = stage === 'closed';
                    return (
                      <div className="pipeline-cart" key={d.id}>
                        <div
                          className="pipeline-cart-body"
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/deals/${d.id}`)}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/deals/${d.id}`)}
                        >
                          <div className="deal-card-name">{d.name}</div>
                          <div className="deal-card-value">{formatCurrency(d.value)}</div>
                          <div className="deal-card-meta">
                            <span>{cust?.company ?? '—'}</span>
                            <span>Close: {formatDate(d.expectedCloseDate)}</span>
                          </div>
                        </div>
                        <div className="pipeline-cart-foot">
                          {repUser && (
                            <span title={`Owner: ${repUser.name}`}>
                              <Avatar name={repUser.name} size={22} />
                            </span>
                          )}
                          {isClosed ? (
                            d.outcome === 'won' ? (
                              <Badge tone="success">Won</Badge>
                            ) : d.outcome === 'lost' ? (
                              <Badge tone="danger">Lost</Badge>
                            ) : (
                              <Badge tone="neutral">Pending</Badge>
                            )
                          ) : (
                            <span className="close-btns">
                              <button
                                className="mini-out mini-win"
                                onClick={() => setClosingDeal(d)}
                                aria-label={`Mark ${d.name} as Won`}
                              >
                                Won
                              </button>
                              <button
                                className="mini-out mini-lose"
                                onClick={() => setClosingDeal(d)}
                                aria-label={`Mark ${d.name} as Lost`}
                              >
                                Lost
                              </button>
                            </span>
                          )}
                          <span style={{ display: 'inline-flex', gap: 4 }}>
                            <button
                              className="mover-btn"
                              disabled={stageIdx === 0}
                              aria-label={`Move ${d.name} back a stage`}
                              title={stage === 'closed' ? 'Reopen into pipeline' : 'Move back a stage'}
                              onClick={() => move(d, -1)}
                            >
                              ‹
                            </button>
                            <button
                              className="mover-btn"
                              disabled={isClosed}
                              aria-label={`Move ${d.name} forward a stage`}
                              title="Move forward a stage"
                              onClick={() => move(d, 1)}
                            >
                              ›
                            </button>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    className="btn btn-ghost btn-sm btn-block"
                    onClick={() => {
                      setPresetStage(stage === 'closed' ? 'new-lead' : stage);
                      setFormOpen(true);
                    }}
                  >
                    + Add deal here
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DealFormModal open={formOpen} presetStage={presetStage} onClose={() => setFormOpen(false)} />
      <CloseOutcomeDialog
        deal={closingDeal}
        onDone={() => {
          setClosingDeal(null);
        }}
      />
    </div>
  );
}
