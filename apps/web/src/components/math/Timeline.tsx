export type TimelinePoint = {
  time: number;
  label: string;
  value?: string;
  tone?: 'primary' | 'accent' | 'muted';
};

type PositionedPoint = {
  point: TimelinePoint;
  labelX: number;
  labelY: number;
  valueY: number;
};

function distributeLabels(points: TimelinePoint[], xForTime: (time: number) => number): PositionedPoint[] {
  const groups = new Map<number, TimelinePoint[]>();
  for (const point of points) groups.set(point.time, [...(groups.get(point.time) ?? []), point]);

  return points.map((point) => {
    const siblings = groups.get(point.time) ?? [point];
    const position = siblings.indexOf(point);
    const top = position % 2 === 0;
    const rowIndex = Math.floor(position / 2);
    const rowCount = top ? Math.ceil(siblings.length / 2) : Math.floor(siblings.length / 2);
    const spacing = rowCount <= 1 ? 0 : Math.min(88, 440 / (rowCount - 1));
    const totalWidth = spacing * Math.max(0, rowCount - 1);
    const rawCenter = xForTime(point.time);
    const center = Math.max(70 + totalWidth / 2, Math.min(530 - totalWidth / 2, rawCenter));
    const labelX = center + (rowIndex - (rowCount - 1) / 2) * spacing;

    return {
      point,
      labelX,
      labelY: top ? 42 : 148,
      valueY: top ? 59 : 165,
    };
  });
}

export default function Timeline({
  points,
  minTime,
  maxTime,
  ariaLabel = 'Timeline',
}: {
  points: TimelinePoint[];
  minTime: number;
  maxTime: number;
  ariaLabel?: string;
}) {
  const span = Math.max(0.0001, maxTime - minTime);
  const x = (time: number) => 60 + (480 * (time - minTime)) / span;
  const positioned = distributeLabels(points, x);

  return (
    <figure className="finance-timeline">
      <svg viewBox="0 0 600 190" role="img" aria-label={ariaLabel}>
        <line x1="60" y1="100" x2="540" y2="100" />
        {positioned.map(({ point, labelX, labelY, valueY }, index) => {
          const pointX = x(point.time);
          const leaderY = labelY < 100 ? 68 : 132;
          return (
            <g key={`${point.time}-${index}`} data-tone={point.tone}>
              <line x1={pointX} y1="88" x2={pointX} y2="112" />
              {Math.abs(labelX - pointX) > 1 && (
                <line className="finance-label-leader" x1={pointX} y1={labelY < 100 ? 87 : 113} x2={labelX} y2={leaderY} />
              )}
              <circle cx={pointX} cy="100" r="7" />
              <text x={labelX} y={labelY} textAnchor="middle">{point.label}</text>
              {point.value && <text x={labelX} y={valueY} textAnchor="middle">{point.value}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
