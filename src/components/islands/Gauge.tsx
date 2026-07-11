interface GaugeProps {
  value: number; // 0..100
  label: string;
}

export default function Gauge({ value, label }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  // needle sweeps from -120° (0%) to +120° (100%)
  const angle = -120 + (clamped / 100) * 240;
  const ticks = Array.from({ length: 11 }, (_, i) => -120 + i * 24);
  return (
    <figure style={{ margin: 0, textAlign: "center", fontFamily: "var(--font-mono)" }}>
      <svg viewBox="0 0 100 78" width="130" role="img" aria-label={`${label}: ${Math.round(clamped)}%`}>
        <circle cx="50" cy="50" r="44" fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth="1.5" />
        {ticks.map((t) => (
          <line key={t} x1="50" y1="10" x2="50" y2={t % 120 === 0 ? 17 : 14}
            stroke="var(--ink)" strokeWidth="1" transform={`rotate(${t} 50 50)`} />
        ))}
        <line x1="50" y1="50" x2="50" y2="14" stroke="var(--accent)" strokeWidth="2"
          transform={`rotate(${angle} 50 50)`} strokeLinecap="round" />
        <circle cx="50" cy="50" r="3.5" fill="var(--ink)" />
        <text x="50" y="70" textAnchor="middle" fontSize="9" fill="var(--ink)" fontFamily="var(--font-mono)">
          {Math.round(clamped)}%
        </text>
      </svg>
      <figcaption style={{ fontSize: ".62rem", letterSpacing: ".12em", textTransform: "uppercase" }}>
        {label}
      </figcaption>
    </figure>
  );
}
