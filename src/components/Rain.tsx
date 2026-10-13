// mulberry32: a seeded random with integer math only, so every render
// (and every JS engine) draws exactly the same drops.
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seeded(7);
const round = (value: number) => Math.round(value * 1000) / 1000;

// Each drop gets its own place, length, strength, speed and start, so they never line up.
const DROPS = Array.from({ length: 70 }, () => {
  const duration = 0.55 + random() * 0.6;
  return {
    left: round(random() * 115), // drops drift left, so some start past the right edge
    height: Math.round(40 + random() * 70),
    opacity: round(0.25 + random() * 0.5),
    duration: round(duration),
    delay: round(-random() * duration), // negative: already mid-fall on the first frame
  };
});

export function Rain() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-(--rain-opacity) motion-reduce:hidden">
      {DROPS.map((drop, i) => (
        <span
          key={i}
          className="animate-rain absolute top-0 w-px bg-linear-to-b from-transparent to-(--ink-mid)"
          style={{
            left: `${drop.left}%`,
            height: drop.height,
            opacity: drop.opacity,
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
