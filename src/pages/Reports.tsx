import { useMemo, useState } from 'react';
import { BarList, ColumnChart, LineChart } from '../components/Charts';
import { Badge, Card, EmptyState, PageHeader, Select } from '../components/ui';
import { formatStage, useAppState } from '../lib/store';
import { DEAL_STAGES } from '../lib/types';
import type { DealStage } from '../lib/types';
import { formatCurrency, lastMonths, monthKey, monthLabel } from '../lib/utils';
import { navigate } from '../lib/router';

type RangeKey = '3m' | '6m' | '12m' | 'ytd' | 'all';

function rangeStart(range: RangeKey): string | null {
  const now = new Date();
  switch (range) {
    case '3m': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 2);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    case '6m': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 5);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    case '12m': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 11);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    case 'ytd':
      return `${now.getFullYear()}-01-01`;
    case 'all':
      return null;
  }
}

const STAGE_COLORS: Record<DealStage, string> = {
  'new-lead': '#818cf8',
  contacted: '#6366f1',
  qualified: '#4f46e5',
  proposal: '#8b5cf6',
  negotiation: '#7c3aed',
  closed: '#0e9f6e',
};

export function ReportsPage() {
  const s = useAppState();
  const [range, setRange] = useState<RangeKey>('12m');
  const [rep, setRep] = useState('all');

  const start = rangeStart(range);

  const report = useMemo(() => {
    const repFilter = (d: (typeof s.deals)[number]) => (rep === 'all' ? true : d.repId === rep);

    const closedIn = s.deals.filter(
      (d) => d.stage === 'closed' && (d.outcome === 'won' || d.outcome === 'lost') && d.closedAt && (start === null || d.closedAt >= start),
    );
    const won = closedIn.filter((d) => d.outcome === 'won' && repFilter(d));
    const lost = closedIn.filter((d) => d.outcome === 'lost' && repFilter(d));
    const wonRevenue = won.reduce((sum, d) => sum + d.value, 0);
    const winRate = won.length + lost.length > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;
    const avgWonValue = won.length > 0 ? wonRevenue / won.length : 0;

    const open = s.deals.filter((d) => d.outcome === 'open' && repFilter(d));
    const openValue = open.reduce((sum, d) => sum + d.value, 0);
    const weightedValue = open.reduce((sum, d) => sum + (d.value * d.probability) / 100, 0);

    // Revenue by month (won only)
    const monthCount = range === '3m' ? 3 : range === '6m' ? 6 : range === '12m' ? 12 : range === 'ytd' ? new Date().getMonth() + 1 : 12;
    const months = lastMonths(monthCount);
    const revenueSeries = months.map((mk) => ({
      label: mk.slice(5) === '01' ? `${monthLabel(mk)} ’${mk.slice(2, 4)}` : monthLabel(mk),
      value: won.filter((d) => d.closedAt && monthKey(d.closedAt) === mk).reduce((sum, d) => sum + d.value, 0),
    }));

    // Revenue + won by rep
    const repsForRows = (rep === 'all' ? s.reps.filter((r) => r.status === 'active') : s.reps.filter((r) => r.id === rep));
    const repRows = repsForRows.map((r) => {
      const wonForRep = won.filter((d) => d.repId === r.id);
      const openForRep = open.filter((d) => d.repId === r.id);
      const lostForRep = closedIn.filter((d) => d.outcome === 'lost' && d.repId === r.id);
      const repWinRate = wonForRep.length + lostForRep.length > 0 ? (wonForRep.length / (wonForRep.length + lostForRep.length)) * 100 : null;
      return {
        rep: r,
        wonRevenue: wonForRep.reduce((sum, d) => sum + d.value, 0),
        wonCount: wonForRep.length,
        lostCount: lostForRep.length,
        openPipeline: openForRep.reduce((sum, d) => sum + d.value, 0),
        winRate: repWinRate,
        avgDeal: wonForRep.length > 0 ? wonForRep.reduce((sum, d) => sum + d.value, 0) / wonForRep.length : 0,
      };
    });

    // Stage breakdown — open pipeline by stage + closed outcomes
    const stageBreakdown = DEAL_STAGES.map((stage) => {
      const deals =
        stage === 'closed'
          ? s.deals.filter((d) => d.stage === 'closed' && repFilter(d))
          : s.deals.filter((d) => d.stage === stage && d.outcome === 'open' && repFilter(d));
      return {
        stage,
        label: formatStage(stage),
        count: deals.length,
        value: deals.reduce((sum, d) => sum + d.value, 0),
      };
    });

    return { won, lost, wonRevenue, winRate, avgWonValue, open, openValue, weightedValue, revenueSeries, repRows, stageBreakdown, closedIn };
  }, [s, range, rep, start]);

  return (
    <div>
      <PageHeader
        title="Revenue reports"
        subtitle="Won revenue, win rate and pipeline health — calculated live from deal data. Won revenue and open pipeline are reported separately."
      />

      <div className="toolbar">
        <span className="toolbar-label">Date range</span>
        <Select ariaLabel="Report date range" value={range} onChange={(v) => setRange(v as RangeKey)}>
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
          <option value="12m">Last 12 months</option>
          <option value="ytd">Year to date</option>
          <option value="all">All time</option>
        </Select>
        <span className="toolbar-label">Rep</span>
        <Select ariaLabel="Filter report by rep" value={rep} onChange={setRep}>
          <option value="all">All reps</option>
          {s.reps.map((r) => (
            <option key={r.id} value={r.id} >{r.name}</option>
          ))}
        </Select>
        <Badge tone="success">Won revenue: {formatCurrency(report.wonRevenue, { compact: true })}</Badge>
        <Badge tone="info">Open pipeline: {formatCurrency(report.openValue, { compact: true })}</Badge>
      </div>

      <div className="report-summary-strip">
        <div className="mini-stat">
          <span className="mini-stat-label">Won revenue</span>
          <span className="mini-stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(report.wonRevenue)}</span>
          <span className="mini-stat-sub">{report.won.length} deals won</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Open pipeline</span>
          <span className="mini-stat-value">{formatCurrency(report.openValue)}</span>
          <span className="mini-stat-sub">{report.open.length} open deals</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Weighted pipeline</span>
          <span className="mini-stat-value">{formatCurrency(report.weightedValue)}</span>
          <span className="mini-stat-sub">probability-adjusted</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Win rate</span>
          <span className="mini-stat-value">{Math.round(report.winRate)}%</span>
          <span className="mini-stat-sub">{report.won.length}W / {report.lost.length}L closed</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Avg won deal value</span>
          <span className="mini-stat-value">{formatCurrency(report.avgWonValue)}</span>
          <span className="mini-stat-sub">across won deals</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Card title="Won revenue by month">
          {report.revenueSeries.every((p) => p.value === 0) ? (
            <EmptyState icon="🗠" title="No won revenue in this period" hint="Deals marked Won appear here by close date." />
          ) : (
            <LineChart points={report.revenueSeries} ariaLabel="Won revenue by month" height={230} />
          )}
        </Card>

        <div className="grid-2">
          <Card title="Won revenue by sales rep">
            {report.repRows.length === 0 ? (
              <EmptyState icon="⚑" title="No reps to report on" />
            ) : (
              <BarList
                ariaLabel="Won revenue by rep"
                rows={report.repRows
                  .slice()
                  .sort((a, b) => b.wonRevenue - a.wonRevenue)
                  .map((r) => ({
                    label: r.rep.name,
                    value: r.wonRevenue,
                    hint: `${r.wonCount} won · open pipeline ${formatCurrency(r.openPipeline, { compact: true })}`,
                  }))}
              />
            )}
          </Card>

          <Card title="Open deals by stage" right={<span className="muted-text small-text">count per stage</span>}>
            <ColumnChart
              ariaLabel="Open deals by stage"
              columns={report.stageBreakdown.filter((sb) => sb.stage !== 'closed').map((sb) => ({
                label: sb.label.split(' ').map((w) => w.slice(0, 6)).join(' '),
                value: sb.count,
                color: STAGE_COLORS[sb.stage],
                hint: `${sb.count} deals · ${formatCurrency(sb.value)}`,
              }))}
            />
          </Card>
        </div>

        <Card title="Pipeline by stage — value breakdown" padded={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th className="num">Deals</th>
                  <th className="num">Total value</th>
                  <th>Share of pipeline</th>
                </tr>
              </thead>
              <tbody>
                {report.stageBreakdown.map((sb) => {
                  const totalAll = report.stageBreakdown.reduce((sum, x) => sum + x.value, 0) || 1;
                  return (
                    <tr key={sb.stage}>
                      <td>
                        <span className="stage-sum-name">
                          <span className="dot" style={{ background: STAGE_COLORS[sb.stage] }} />
                          {sb.label}
                        </span>
                      </td>
                      <td className="num">{sb.count}</td>
                      <td className="num" style={{ fontWeight: 650 }}>{formatCurrency(sb.value)}</td>
                      <td>
                        <span className="prob-bar" style={{ width: 140 }}>
                          <span className="prob-fill" style={{ width: `${(sb.value / totalAll) * 100}%` }} />
                        </span>
                        <span className="muted-text small-text">{Math.round((sb.value / totalAll) * 100)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="table-footer">
              Closed column shows finished deals: {report.won.length} won ({formatCurrency(report.wonRevenue)}) · {report.lost.length} lost · table totals {formatCurrency(report.stageBreakdown.reduce((sum, x) => sum + x.value, 0))}
            </div>
          </div>
        </Card>

        <Card title="Sales rep performance" padded={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Rep</th>
                  <th className="num">Won revenue</th>
                  <th className="num">Won / lost</th>
                  <th className="num">Win rate</th>
                  <th className="num">Avg won deal</th>
                  <th className="num">Open pipeline</th>
                </tr>
              </thead>
              <tbody>
                {report.repRows
                  .slice()
                  .sort((a, b) => b.wonRevenue - a.wonRevenue)
                  .map((r) => (
                    <tr key={r.rep.id} className="row-click" onClick={() => navigate(`/team/${r.rep.id}`)}>
                      <td>
                        <div className="cell-main">{r.rep.name}</div>
                        <div className="cell-sub">{r.rep.role}</div>
                      </td>
                      <td className="num" style={{ fontWeight: 650, color: 'var(--success)' }}>{formatCurrency(r.wonRevenue)}</td>
                      <td className="num">{r.wonCount} / {r.lostCount}</td>
                      <td className="num">{r.winRate === null ? '—' : `${Math.round(r.winRate)}%`}</td>
                      <td className="num">{r.avgDeal > 0 ? formatCurrency(r.avgDeal) : '—'}</td>
                      <td className="num">{formatCurrency(r.openPipeline)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
