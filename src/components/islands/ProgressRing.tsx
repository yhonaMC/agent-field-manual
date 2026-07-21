interface ProgressRingProps {
  value: number; // 0..100
  label: string;
}

export default function ProgressRing({ value, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped / 100);
  return (
    <figure style={{ margin: 0, textAlign: "center", fontFamily: "var(--font-sans)" }}>
      <svg viewBox="0 0 100 100" width="112" role="img" aria-label={`${label}: ${Math.round(clamped)}%`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--paper-deep)" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--ok)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fontSize="20" fontFamily="var(--font-prose)" fontWeight="600" fill="var(--ink)">
          {Math.round(clamped)}%
        </text>
      </svg>
      <figcaption style={{ fontSize: ".72rem", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)" }}>
        {label}
      </figcaption>
    </figure>
  );
}
