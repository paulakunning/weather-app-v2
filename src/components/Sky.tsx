import { Rain } from "./Rain";

// Full-screen sky behind every page. It only reads the --sky-* and
// --cloud-opacity variables, so it stays mounted while they animate.
export function Sky() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-clip">
      {/* Mid stop at 62%, like the Figma gradient (docs/design/figma-tokens.md). */}
      <div className="absolute inset-0 bg-linear-to-b from-(--sky-top) via-(--sky-mid) via-62% to-(--sky-bottom)" />
      <div className="absolute -top-[8%] -left-[15%] h-[57%] w-[130%] rounded-[50%] bg-linear-to-b from-[rgba(33,25,61,0.5)] via-[rgba(102,62,91,0.3)] to-transparent opacity-(--cloud-opacity) blur-[45px]" />
      <div className="absolute -right-[10%] bottom-[6%] h-[34%] w-[120%] rounded-[50%] bg-linear-to-t from-[rgba(239,140,97,0.25)] via-[rgba(159,86,108,0.2)] to-transparent blur-[40px]" />
      <Rain />
      <svg className="absolute inset-0 size-full opacity-[0.04] mix-blend-screen">
        <filter id="sky-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves={3}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#sky-grain)" />
      </svg>
    </div>
  );
}
