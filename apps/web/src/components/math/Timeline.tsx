export type TimelinePoint = { time: number; label: string; value?: string; tone?: 'primary' | 'accent' | 'muted' };

export default function Timeline({ points, minTime, maxTime, ariaLabel = 'Timeline' }: {
  points: TimelinePoint[];
  minTime: number;
  maxTime: number;
  ariaLabel?: string;
}) {
  const times = [...new Set(points.map(({ time }) => time))].sort((a, b) => a - b);
  const span = Math.max(0.0001, maxTime - minTime);
  const x = (time: number) => 40 + (time - minTime) / span * 520;

  return (
    <figure className="finance-timeline min-w-0" aria-label={ariaLabel}>
      <svg viewBox="0 0 600 96" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="40" x2="560" y2="40" />
        {times.map((time) => (
          <g key={time}>
            <line x1={x(time)} y1="28" x2={x(time)} y2="52" />
            <circle cx={x(time)} cy="40" r="7" />
            <text x={x(time)} y="76" textAnchor="middle">t={time}</text>
          </g>
        ))}
      </svg>
      <figcaption className="sr-only">Each cash flow and focal event appears in time order below, including events at the same date.</figcaption>
      <ol className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {[...points].sort((a, b) => a.time - b.time).map((point, index) => (
          <li key={`${point.time}-${index}`} data-timeline-event data-time={point.time}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm leading-relaxed">
            <span className="flex min-w-0 items-baseline gap-3">
              <strong className="shrink-0 font-mono text-[var(--foreground)]">t={point.time}</strong>
              <span className="break-words text-[var(--foreground)]">{point.label}</span>
            </span>
            {point.value && <span className="break-words font-mono text-[var(--foreground)]">{point.value}</span>}
          </li>
        ))}
      </ol>
    </figure>
  );
}
