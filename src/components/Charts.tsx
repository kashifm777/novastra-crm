import { formatCurrency } from '../lib/utils';

export interface ChartPoint {
  label: string;
  value: number;
  fullLabel?: string;
}

/* ------------------------------------------------------------------ */
/* Line / area chart                                                   */
/* ------------------------------------------------------------------ */

export function LineChart({
  points,
  height = 220,
  ariaLabel,
}: {
  points: ChartPoint[];
  height?: number;
  ariaLabel: string;
}) {
  const H = height;

  const padL = 52;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const width = 720;

  const max = Math.max(...points.map((p) => p.value), 1000);
  const niceMax = niceCeil(max);
  const innerW = width - padL - padR;
  const innerH = H - padT - padB;

  const x = (i: number) => padL + (points.length <= 1 ? innerW / 2 : (i * innerW) / (points.length - 1));
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(points.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (niceMax / ticks) * i);

  return (
    <svg viewBox={`0 0 ${width} ${H}`} className="chart-svg" role="img" aria-label={ariaLabel} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="chart-tick">
            {formatCurrency(t, { compact: true })}
          </text>
        </g>
      ))}
      <path d={areaPath} fill="url(#areaFill)" />
      <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill="var(--primary)" className="chart-dot" />
          <text x={x(i)} y={H - 6} textAnchor="middle" className="chart-tick">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function niceCeil(v: number): number {
  const pow = 10 ** Math.floor(Math.log10(Math.max(1, v)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * pow);
  return candidates.find((c) => c >= v) ?? v;
}

/* ------------------------------------------------------------------ */
/* Horizontal bars                                                     */
/* ------------------------------------------------------------------ */

export function BarList({
  rows,
  ariaLabel,
  color = 'var(--primary)',
  formatValue = (v) => formatCurrency(v, { compact: true }),
}: {
  rows: { label: string; value: number; hint?: string }[];
  ariaLabel: string;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="bar-list" role="img" aria-label={ariaLabel}>
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <div className="bar-label">
            <span className="bar-name">{r.label}</span>
            <span className="bar-value">{formatValue(r.value)}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(r.value / max) * 100}%`, background: color }}
            />
          </div>
          {r.hint && <div className="bar-hint">{r.hint}</div>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vertical columns                                                    */
/* ------------------------------------------------------------------ */

export function ColumnChart({
  columns,
  ariaLabel,
}: {
  columns: { label: string; value: number; color?: string; hint?: string }[];
  ariaLabel: string;
}) {
  const max = Math.max(...columns.map((c) => c.value), 1);
  return (
    <div className="column-chart" role="img" aria-label={ariaLabel}>
      {columns.map((c) => (
        <div className="column" key={c.label} title={c.hint}>
          <span className="column-count">{c.value > 0 ? c.value : ''}</span>
          <div className="column-track">
            <div className="column-fill" style={{ height: `${Math.max(2, (c.value / max) * 100)}%`, background: c.color ?? 'var(--primary)' }} />
          </div>
          <span className="column-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
