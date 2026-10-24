'use client';

import { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, TrendingUp } from 'lucide-react';

type TrendPoint = { week: string; assigned: number; completed: number };
type MetricKey = 'assigned' | 'completed';

export function AnalyticsTrendChart({ points }: { points: TrendPoint[] }) {
  const [range, setRange] = useState<4 | 8>(8);
  const [visible, setVisible] = useState<Record<MetricKey, boolean>>({ assigned: true, completed: true });
  const series = useMemo(() => points.slice(-range), [points, range]);
  const maxValue = Math.max(1, ...series.flatMap((point) => [point.assigned, point.completed]));
  const plot = { left: 28, right: 592, top: 18, bottom: 132 };
  const xAt = (index: number) => series.length < 2 ? (plot.left + plot.right) / 2 : plot.left + index * (plot.right - plot.left) / (series.length - 1);
  const yAt = (value: number) => plot.bottom - (Math.max(0, value) / maxValue) * (plot.bottom - plot.top);
  const lineFor = (key: MetricKey) => series.map((point, index) => `${xAt(index)},${yAt(point[key])}`).join(' ');
  const toggle = (key: MetricKey) => setVisible((current) => ({ ...current, [key]: !current[key] }));

  if (!points.length) {
    return <div className="cp-analytics-empty"><BarChart3 size={25}/><strong>No trend records yet</strong><p>Assign or complete a real task to create contribution events. This chart will update from saved database records.</p></div>;
  }

  return (
    <div className="cp-analytics-chart">
      <div className="cp-analytics-chart-toolbar">
        <div className="cp-analytics-legend">
          <button type="button" className={visible.assigned ? 'visible assigned' : 'assigned'} aria-pressed={visible.assigned} onClick={() => toggle('assigned')}><i/>Assigned</button>
          <button type="button" className={visible.completed ? 'visible completed' : 'completed'} aria-pressed={visible.completed} onClick={() => toggle('completed')}><i/>Completed</button>
        </div>
        <div className="cp-analytics-range" aria-label="Choose chart range">
          <button type="button" className={range === 4 ? 'active' : ''} onClick={() => setRange(4)}>4W</button>
          <button type="button" className={range === 8 ? 'active' : ''} onClick={() => setRange(8)}>8W</button>
        </div>
      </div>
      <div className="cp-analytics-plot">
        <svg viewBox="0 0 620 158" role="img" aria-label="Weekly task assignments and completions from recorded contribution events">
          {[0, 1, 2, 3, 4].map((step) => {
            const y = plot.top + step * (plot.bottom - plot.top) / 4;
            const val = Math.round(maxValue * (4 - step) / 4);
            return <g key={step}><line x1={plot.left} y1={y} x2={plot.right} y2={y} className="cp-analytics-grid-line"/><text x="19" y={y + 3} textAnchor="end" className="cp-analytics-axis-label">{val}</text></g>;
          })}
          {visible.assigned && <polyline points={lineFor('assigned')} className="cp-analytics-line assigned-line"/>}
          {visible.completed && <polyline points={lineFor('completed')} className="cp-analytics-line completed-line"/>}
          {series.map((point, index) => <g key={point.week + index}>
            {visible.assigned && <circle cx={xAt(index)} cy={yAt(point.assigned)} r="3.4" className="cp-analytics-point assigned-point"><title>{point.week}: {point.assigned} assigned</title></circle>}
            {visible.completed && <circle cx={xAt(index)} cy={yAt(point.completed)} r="3.4" className="cp-analytics-point completed-point"><title>{point.week}: {point.completed} completed</title></circle>}
            <text x={xAt(index)} y="151" textAnchor="middle" className="cp-analytics-axis-label">{point.week}</text>
          </g>)}
        </svg>
      </div>
      <div className="cp-analytics-foot"><TrendingUp size={14}/><span>Computed from persisted task events.</span><span className="cp-analytics-total">{series.reduce((sum, point) => sum + point.assigned, 0)} assigned · {series.reduce((sum, point) => sum + point.completed, 0)} completed</span></div>
      <p className="cp-analytics-note"><CheckCircle2 size={13}/> No seeded numbers are used here. Weeks without an event appear only if the database query returns a week with records.</p>
    </div>
  );
}
