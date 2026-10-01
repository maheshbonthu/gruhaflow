/**
 * Listing artwork without a CDN or an upload pipeline: a deterministic gradient
 * plus a generated skyline, seeded off the project slug. Every project gets a
 * stable, distinct image and nothing can 404.
 */

const PALETTES: Array<[string, string, string]> = [
  ["#0f766e", "#14b8a6", "#99f6e4"],
  ["#1e3a8a", "#3b82f6", "#bfdbfe"],
  ["#7c2d12", "#ea7317", "#fed7aa"],
  ["#4c1d95", "#8b5cf6", "#ddd6fe"],
  ["#064e3b", "#10b981", "#a7f3d0"],
  ["#831843", "#ec4899", "#fbcfe8"],
  ["#0c4a6e", "#0ea5e9", "#bae6fd"],
  ["#713f12", "#d1a30a", "#fef08a"],
];

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Buildings are derived from the seed so a project's skyline never changes. */
function skyline(seed: string, count: number) {
  let h = hash(seed);
  const next = () => {
    h = (h * 1103515245 + 12345) % 2147483648;
    return h / 2147483648;
  };
  const bars: Array<{ x: number; w: number; height: number; windows: number }> = [];
  let x = 2;
  for (let i = 0; i < count; i++) {
    const w = 8 + Math.floor(next() * 10);
    bars.push({
      x,
      w,
      height: 24 + Math.floor(next() * 50),
      windows: 2 + Math.floor(next() * 3),
    });
    x += w + 3;
  }
  return bars;
}

export default function PropertyMedia({
  seed,
  label,
  className,
  tall = false,
}: {
  seed: string;
  label?: string;
  className?: string;
  tall?: boolean;
}) {
  const [dark, mid, light] = PALETTES[hash(seed) % PALETTES.length];
  const id = `pm-${hash(seed).toString(36)}`;
  const bars = skyline(seed, 9);

  return (
    <div className={className} aria-hidden={!label}>
      <svg
        viewBox="0 0 120 80"
        preserveAspectRatio="xMidYMid slice"
        className={tall ? "h-full w-full" : "h-full w-full"}
        role={label ? "img" : "presentation"}
        aria-label={label}
      >
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dark} />
            <stop offset="100%" stopColor={mid} />
          </linearGradient>
          <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={light} stopOpacity="0.9" />
            <stop offset="100%" stopColor={light} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <rect width="120" height="80" fill={`url(#${id}-sky)`} />
        <circle cx="96" cy="18" r="11" fill={`url(#${id}-sun)`} />

        {/* Back row, washed out for depth. */}
        {bars.map((b, i) => (
          <rect
            key={`b${i}`}
            x={b.x + 4}
            y={80 - b.height * 0.82}
            width={b.w}
            height={b.height}
            fill={dark}
            opacity="0.45"
            rx="0.6"
          />
        ))}

        {/* Front row with lit windows. */}
        {bars.map((b, i) => (
          <g key={`f${i}`}>
            <rect
              x={b.x}
              y={80 - b.height}
              width={b.w}
              height={b.height}
              fill={light}
              opacity="0.22"
              rx="0.6"
            />
            {Array.from({ length: b.windows }).map((_, r) =>
              Array.from({ length: 2 }).map((_, c) => (
                <rect
                  key={`w${i}-${r}-${c}`}
                  x={b.x + 1.8 + c * (b.w / 2 - 0.4)}
                  y={80 - b.height + 4 + r * 7}
                  width={b.w / 2 - 2.6}
                  height={3.2}
                  fill={light}
                  opacity={(r + c) % 2 === 0 ? 0.75 : 0.35}
                  rx="0.4"
                />
              ))
            )}
          </g>
        ))}

        <rect y="76" width="120" height="4" fill={dark} opacity="0.6" />
      </svg>
    </div>
  );
}
