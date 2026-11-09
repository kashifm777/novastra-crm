import { useState } from 'react';
import { Avatar, Badge, Card, ConfirmDialog, Modal, PageHeader } from '../components/ui';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskFormModal } from '../components/forms';
import { closeDeal, deleteDeal, formatStage, moveDealStage, setTaskStatus, useAppState } from '../lib/store';
import { DEAL_STAGES } from '../lib/types';
import type { Task } from '../lib/types';
import { dueLabel, formatCurrency, formatDate, relativeTime } from '../lib/utils';
import { successToast } from '../lib/toast';
import { navigate } from '../lib/router';

export function DealDetailPage({ dealId }: { dealId: string }) {
  const s = useAppState();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [closingOutcome, setClosingOutcome] = useState<'won' | 'lost' | null>(null);
  const [movingBack, setMovingBack] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  const deal = s.deals.find((d) => d.id === dealId);

  if (!deal) {
    return (
      <div className="load-fail">
        <h2>Deal not found</h2>
        <p style={{ marginTop: 8 }}>It may have been deleted or moved.</p>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/deals')}>
          ← Back to deals
        </button>
      </div>
    );
  }

  const customer = s.customers.find((c) => c.id === deal.customerId);
  const rep = s.reps.find((r) => r.id === deal.repId);
  const tasks = s.tasks.filter((t) => t.dealId === deal.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const stageIdx = DEAL_STAGES.indexOf(deal.stage);
  const isClosed = deal.stage === 'closed';

  function remove() {
    deleteDeal(deal!.id);
    successToast(`Deal “${deal!.name}” deleted`);
    navigate('/deals');
  }

  function doClose(outcome: 'won' | 'lost') {
    if (!deal) return;
    closeDeal(deal.id, outcome);
    successToast(outcome === 'won' ? `Deal won! ${formatCurrency(deal.value)} added to revenue 🎉` : 'Deal marked Lost');
  }

  return (
    <div>
      <PageHeader
        title={deal.name}
        subtitle={`Deal · updated ${relativeTime(deal.updatedAt)}`}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/deals')}>
              ← All deals
            </button>
            {!isClosed && (
              <button className="btn btn-success" onClick={() => doClose('won')}>
                ✓ Mark Won
              </button>
            )}
            <button
              className={isClosed ? 'btn btn-ghost' : 'btn btn-danger'}
              onClick={() => (isClosed ? setMovingBack(true) : doClose('lost'))}
            >
              {isClosed ? '↺ Reopen deal' : 'Mark Lost'}
            </button>
          </>
        }
      />

      <div className="pipeline-stage-card" style={{ marginBottom: 18 }}>
        <Card>
          <div className="card-head">
            <h2 className="card-title">Pipeline stage</h2>
            {isClosed ? (
              <Badge tone={deal.outcome === 'won' ? 'success' : deal.outcome === 'lost' ? 'danger' : 'neutral'}>
                Closed · {deal.outcome}
              </Badge>
            ) : (
              <span className="muted-text small-text">{stageIdx + 1} of 6 · click a stage to move the deal</span>
            )}
          </div>
          <div className="card-body">
            <div className="stage-stepper" role="tablist" aria-label="Deal stage">
              {DEAL_STAGES.map((stage, i) => (
                <button
                  key={stage}
                  className={`stage-chip ${stage === deal.stage ? 'stage-chip-current' : i < stageIdx ? 'stage-chip-done' : ''}`}
                  onClick={() => {
                    if (stage === deal.stage) return;
                    if (stage === 'closed') {
                      setClosingOutcome('won');
                    } else {
                      moveDealStage(deal.id, stage);
                      successToast(`Deal moved to ${formatStage(stage)}`);
                    }
                  }}
                >
                  {i + 1}. {formatStage(stage)}
                  {stage === 'closed' && <span aria-hidden="true">·W/L</span>}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card className="detail-head-card">
            <div>
              <span className="kv-key">Value</span>
              <div style={{ fontSize: 26, fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(deal.value)}</div>
            </div>
            <div className="meta-list">
              <div className="meta-row">
                <span className="meta-key">Outcome</span>
                <span className="meta-val">
                  {isClosed ? (
                    <Badge tone={deal.outcome === 'won' ? 'success' : 'danger'}>{deal.outcome === 'won' ? 'Won' : 'Lost'}</Badge>
                  ) : (
                    <Badge tone="primary">Open</Badge>
                  )}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Stage</span>
                <span className="meta-val">{formatStage(deal.stage)}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Probability</span>
                <span className="meta-val">
                  <span className="prob-bar"><span className="prob-fill" style={{ width: `${deal.probability}%` }} /></span>
                  {deal.probability}%
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Customer</span>
                <span className="meta-val">{customer ? <a href={`#/customers/${customer.id}`}>{customer.company}</a> : '—'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Owner</span>
                <span className="meta-val">{rep ? <span className="rep-chip"><Avatar name={rep.name} size={20} /> {rep.name}</span> : 'Unassigned'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Expected close</span>
                <span className="meta-val">{formatDate(deal.expectedCloseDate)}</span>
              </div>
              {deal.closedAt && (
                <div className="meta-row">
                  <span className="meta-key">Closed on</span>
                  <span className="meta-val">{formatDate(deal.closedAt)}</span>
                </div>
              )}
              <div className="meta-row">
                <span className="meta-key">Created</span>
                <span className="meta-val">{formatDate(deal.createdAt)}</span>
              </div>
            </div>
            {deal.notes && (
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>
                  Notes
                </div>
                <div className="notes-box">{deal.notes}</div>
              </div>
            )}
          </Card>

          <Card title="Activity history">
            <ActivityFeed s={s} limit={30} scope={{ entityType: 'deal', entityId: deal.id }} />
          </Card>
        </div>

        <Card
          title="Linked tasks"
          right={
            <button className="btn btn-primary btn-sm" onClick={() => setTaskFormOpen(true)}>
              + New task
            </button>
          }
          padded={false}
        >
          {tasks.length === 0 ? (
            <p className="muted-text small-text" style={{ padding: 18 }}>
              No tasks linked to this deal yet.
            </p>
          ) : (
            <div>
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Closing confirmation from the stage stepper */}
      <Modal open={closingOutcome !== null} onClose={() => setClosingOutcome(null)} title="Close deal — choose outcome">
        <p>
          Moving <strong>{deal.name}</strong> ({formatCurrency(deal.value)}) to Closed. Mark the outcome:
        </p>
        <p className="confirm-detail">Won deals count toward revenue reports; lost deals count against your win rate.</p>
        <div className="modal-actions">
          <button
            className="btn btn-danger"
            onClick={() => {
              doClose('lost');
              setClosingOutcome(null);
            }}
          >
            Mark Lost
          </button>
          <button
            className="btn btn-success"
            onClick={() => {
              doClose('won');
              setClosingOutcome(null);
            }}
          >
            Mark Won
          </button>
        </div>
      </Modal>
      <ConfirmDialog
        open={movingBack}
        title="Reopen deal?"
        message={`“${deal.name}” will move back to Negotiation and the outcome resets to Open.`}
        confirmLabel="Reopen"
        onConfirm={() => {
          moveDealStage(deal.id, 'negotiation');
          successToast('Deal reopened into Negotiation');
        }}
        onCancel={() => setMovingBack(false)}
      />

      <div style={{ marginTop: 18 }}>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
          🗑 Delete deal
        </button>
      </div>

      <TaskFormModal
        open={taskFormOpen}
        presetDealId={deal.id}
        presetCustomerId={deal.customerId}
        onClose={() => setTaskFormOpen(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete deal?"
        message={`“${deal.name}” (${formatCurrency(deal.value)}) will be permanently deleted.`}
        detail="Linked tasks are deleted as well. This cannot be undone."
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const s = useAppState();
  const lbl = dueLabel(task.dueDate, task.status);
  return (
    <div className={`task-row ${task.status === 'completed' ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="task-check"
        checked={task.status === 'completed'}
        aria-label={`Mark "${task.title}" ${task.status === 'completed' ? 'incomplete' : 'complete'}`}
        onChange={() => setTaskStatus(task.id, task.status === 'completed' ? 'open' : 'completed')}
      />
      <div className="task-body">
        <div className="task-title-line">
          <span className="task-title">{task.title}</span>
          <Badge tone={lbl.tone === 'overdue' ? 'danger' : lbl.tone === 'today' ? 'warning' : lbl.tone === 'done' ? 'success' : 'neutral'}>
            {lbl.label}
          </Badge>
        </div>
        <div className="task-links">
          <span className="task-link">⚑ {s.reps.find((r) => r.id === task.repId)?.name ?? 'Unassigned'}</span>
        </div>
      </div>
    </div>
  );
}
