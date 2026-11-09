import { useMemo, useState } from 'react';
import { BarList, LineChart } from '../components/Charts';
import { ActivityFeed } from '../components/ActivityFeed';
import { Badge, Card, Dot, PageHeader, Segmented, StatCard, Select } from '../components/ui';
import { formatStage, isTaskOverdue, isTaskDueToday, useAppState } from '../lib/store';
import type { DealStage } from '../lib/types';
import { DEAL_STAGES } from '../lib/types';
import { dueLabel, formatCurrency, formatNumber, lastMonths, monthKey, monthLabel } from '../lib/utils';
import { navigate } from '../lib/router';

type Period = 'mtd' | '30d' | 'qtd' | '90d' | 'ytd';

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayISO(): string {
  return isoDate(new Date());
}

function periodRange(period: Period): { start: string; end: string; label: string } {
  const now = new Date();
  const today = isoDate(now);
  switch (period) {
    case 'mtd': {
      const start = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start, end: today, label: 'this month' };
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { start: isoDate(d), end: today, label: 'in the last 30 days' };
    }
    case 'qtd': {
      const q = Math.floor(now.getMonth() / 3);
      const start = isoDate(new Date(now.getFullYear(), q * 3, 1));
      return { start, end: today, label: 'this quarter' };
    }
    case '90d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 89);
      return { start: isoDate(d), end: today, label: 'in the last 90 days' };
    }
    case 'ytd': {
      const start = isoDate(new Date(now.getFullYear(), 0, 1));
      return { start, end: today, label: 'this year' };
    }
  }
}

const STAGE_DOT_COLORS: Record<DealStage, string> = {
  'new-lead': '#818cf8',
  contacted: '#6366f1',
  qualified: '#4f46e5',
  proposal: '#8b5cf6',
  negotiation: '#7c3aed',
  closed: '#0e9f6e',
};

export function DashboardPage() {
  const s = useAppState();
  const [chartMonths, setChartMonths] = useState<'6' | '12'>('12');
  const [period, setPeriod] = useState<Period>('30d');
  const range = periodRange(period);
  const today = todayISO();

  const stats = useMemo(() => {
    const activeDeals = s.deals.filter((d) => d.outcome !== 'open' || d.stage !== 'closed');
    const openDeals = s.deals.filter((d) => d.outcome === 'open');
    const wonDeals = s.deals.filter((d) => d.outcome === 'won');
    const lostDeals = s.deals.filter((d) => d.outcome === 'lost');
    const closedInPeriod = wonDeals
      .concat(lostDeals)
      .filter((d) => d.closedAt && d.closedAt >= range.start && d.closedAt <= range.end);
    const wonInPeriod = closedInPeriod.filter((d) => d.outcome === 'won');
    const wonInPeriodValue = wonInPeriod.reduce((sum, d) => sum + d.value, 0);
    const winRate = closedInPeriod.length > 0 ? (wonInPeriod.length / closedInPeriod.length) * 100 : 0;
    const dueToday = s.tasks.filter((t) => isTaskDueToday(t));
    const overdue = s.tasks.filter((t) => isTaskOverdue(t));
    const openTaskCount = s.tasks.filter((t) => t.status !== 'completed').length;

    const months = lastMonths(Number(chartMonths));
    const points = months.map((mk) => ({
      label: mk.slice(5) === '01' ? `${monthLabel(mk)} ’${mk.slice(2, 4)}` : monthLabel(mk),
      value: wonDeals.filter((d) => d.closedAt && monthKey(d.closedAt) === mk).reduce((sum, d) => sum + d.value, 0),
    }));

    const pipeline = DEAL_STAGES.map((stage) => {
      const deals = stage === 'closed' ? activeDeals.filter((d) => d.stage === 'closed') : openDeals.filter((d) => d.stage === stage);
      const weighted = deals.reduce((sum, d) => sum + (d.value * d.probability) / 100, 0);
      return {
        stage,
        label: formatStage(stage),
        count: deals.length,
        value: deals.reduce((sum, d) => sum + d.value, 0),
        weighted,
      };
    });

    return {
      openDeals,
      wonDeals,
      lostDeals,
      winRate,
      dueToday,
      overdue,
      openTaskCount,
      points,
      pipeline,
      wonInPeriod,
      wonInPeriodValue,
    };
  }, [s, chartMonths, range]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A live pulse on customers, pipeline, revenue and follow-ups."
      />

      <div className="stat-grid">
        <StatCard
          icon="☺"
          tone="primary"
          label="Total customers"
          value={formatNumber(s.customers.length)}
          sub={`${s.customers.filter((c) => c.status === 'active').length} active · ${s.customers.filter((c) => c.status === 'lead').length} leads`}
          onClick={() => navigate('/customers')}
        />
        <StatCard
          icon="◈"
          tone="info"
          label="Open deals"
          value={formatNumber(stats.openDeals.length)}
          sub={`${formatCurrency(stats.openDeals.reduce((sum, d) => sum + d.value, 0), { compact: true })} in pipeline`}
          onClick={() => navigate('/pipeline')}
        />
        <StatCard
          icon="🏆"
          tone="success"
          label={`Revenue won ${range.label}`}
          value={formatCurrency(stats.wonInPeriodValue, { compact: true })}
          sub={`${stats.wonInPeriod.length} won · win rate ${Math.round(stats.winRate)}%`}
          onClick={() => navigate('/reports')}
        />
        <StatCard
          icon="✓"
          tone={stats.overdue.length > 0 ? 'danger' : 'success'}
          label="Tasks needing action"
          value={String(stats.dueToday.length + stats.overdue.length)}
          sub={
            <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                <Dot tone={stats.dueToday.length > 0 ? 'warning' : 'neutral'} /> {stats.dueToday.length} due today
              </span>
              <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                <Dot tone={stats.overdue.length > 0 ? 'danger' : 'neutral'} /> {stats.overdue.length} overdue
              </span>
            </span>
          }
          onClick={() => navigate('/tasks')}
        />
      </div>

      <div className="grid-2-wide" style={{ marginBottom: 18 }}>
        <Card
          title="Revenue won over time"
          right={
            <Segmented
              ariaLabel="Chart period"
              value={chartMonths}
              onChange={setChartMonths}
              options={[
                { value: '6', label: '6 months' },
                { value: '12', label: '12 months' },
              ]}
            />
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="muted-text small-text">Reporting period:</span>
            <Select ariaLabel="Reporting period" value={period} onChange={(v) => setPeriod(v as Period)}>
              <option value="mtd">This month</option>
              <option value="30d">Last 30 days</option>
              <option value="qtd">This quarter</option>
              <option value="90d">Last 90 days</option>
              <option value="ytd">This year</option>
            </Select>
            <Badge tone="success">
              {formatCurrency(stats.wonInPeriodValue)} won {range.label}
            </Badge>
          </div>
          <LineChart points={stats.points} ariaLabel={`Revenue won per month over the last ${chartMonths} months`} />
        </Card>

        <Card title="Sales pipeline summary">
          <div>
            {stats.pipeline.map((p) => (
              <div className="stage-summary-row" key={p.stage}>
                <span className="stage-sum-name">
                  <span className="dot" style={{ background: STAGE_DOT_COLORS[p.stage] }} />
                  {p.label}
                  {p.stage === 'closed' && (
                    <span className="muted-text small-text">
                      ({stats.wonDeals.length}W / {stats.lostDeals.length}L)
                    </span>
                  )}
                </span>
                <span className="stage-sum-count">{p.count} deals</span>
                <span className="muted-text small-text num">{formatCurrency(p.value, { compact: true })}</span>
                <span className="muted-text small-text num">
                  {p.stage === 'closed' ? 'final value' : `~${formatCurrency(p.weighted, { compact: true })} weighted`}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <BarList
              ariaLabel="Open pipeline value by stage"
              rows={stats.pipeline.filter((p) => p.stage !== 'closed').map((p) => ({ label: p.label, value: p.value }))}
            />
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card title={`Follow-ups — ${today}`}>
          <div className="kv-strip" style={{ marginBottom: 14 }}>
            <div className="kv">
              <span className="kv-key">Due today</span>
              <span className="kv-val">{stats.dueToday.length}</span>
            </div>
            <div className="kv">
              <span className="kv-key">Overdue</span>
              <span className="kv-val" style={{ color: stats.overdue.length ? 'var(--danger)' : undefined }}>
                {stats.overdue.length}
              </span>
            </div>
            <div className="kv">
              <span className="kv-key">All open</span>
              <span className="kv-val">{stats.openTaskCount}</span>
            </div>
          </div>
          {stats.overdue.length === 0 && stats.dueToday.length === 0 ? (
            <p className="muted-text small-text">Nothing overdue and nothing due today. 🎉</p>
          ) : (
            <div>
              {[...stats.overdue, ...stats.dueToday].slice(0, 6).map((t) => {
                const lbl = dueLabel(t.dueDate, t.status);
                return (
                  <div className="activity-item" key={t.id}>
                    <span className="activity-dot" style={{ background: lbl.tone === 'overdue' ? 'var(--danger)' : '#d97706' }} />
                    <button
                      className="link-chip"
                      style={{ color: 'var(--text-soft)', fontWeight: 550, flex: 1, textAlign: 'left', justifyContent: 'flex-start' }}
                      onClick={() => navigate('/tasks')}
                    >
                      {t.title}
                    </button>
                    <Badge tone={lbl.tone === 'overdue' ? 'danger' : 'warning'}>{lbl.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/tasks')}>
            Open task manager →
          </button>
        </Card>

        <Card title="Recent activity">
          <ActivityFeed s={s} limit={9} />
        </Card>
      </div>
    </div>
  );
}
