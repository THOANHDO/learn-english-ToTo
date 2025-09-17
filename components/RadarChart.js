'use client';

export default function RadarChart({ data, size = 260 }) {
  const center = size / 2;
  const radius = size / 2 - 24;
  const angleStep = (Math.PI * 2) / data.length;

  const buildPoints = (multiplier) =>
    data
      .map((item, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const valueRadius = radius * multiplier;
        const x = center + valueRadius * Math.cos(angle);
        const y = center + valueRadius * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');

  const valuePoints = data
    .map((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const valueRadius = radius * (item.value / 100);
      return {
        x: center + valueRadius * Math.cos(angle),
        y: center + valueRadius * Math.sin(angle)
      };
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.2)" />
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon key={ratio} points={buildPoints(ratio)} fill="none" stroke="rgba(148,163,184,0.2)" />
      ))}
      <polygon points={valuePoints.map((point) => `${point.x},${point.y}`).join(' ')} fill="rgba(56,189,248,0.35)" stroke="#38bdf8" />
      {valuePoints.map((point, index) => (
        <g key={data[index].label}>
          <circle cx={point.x} cy={point.y} r={4} fill="#38bdf8" />
          <text x={point.x} y={point.y - 8} fill="#bae6fd" fontSize="10" textAnchor="middle">
            {data[index].label}
          </text>
        </g>
      ))}
    </svg>
  );
}
