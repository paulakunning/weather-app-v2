import Image from "next/image";
import type { Dictionary } from "@/i18n/en";
import { formatTime, type SunTimes } from "@/lib/time";

type SunArcProps = {
  sun: SunTimes | null;
  daylight: number | null;
  timeZone: string;
  locale: string;
  dict: Dictionary;
};

// Where public/sun-arc/path.svg sits in the 112 px box (Figma, % of the box).
const ARC = { left: 11.36, top: 31.36, width: 77.28, height: 54.09 };
const HORIZON_TOP = 85.45;

// Point at fraction t along the exported cubic Bézier, as % of the box.
function arcPoint(t: number): { left: number; top: number } {
  const u = 1 - t;
  const x =
    u * u * u * 0.611 +
    3 * u * u * t * 231.399 +
    3 * u * t * t * 462.187 +
    t * t * t * 692.975;
  const y = (u * u * u + t * t * t) * 61.193 - 3 * u * t * 19.583;
  return {
    left: ARC.left + (ARC.width * x) / 693.586,
    top: ARC.top + (ARC.height * y) / 61.8038,
  };
}

function Layer({ src, style }: { src: string; style: React.CSSProperties }) {
  return (
    <div className="absolute" style={style}>
      <Image src={src} alt="" fill unoptimized />
    </div>
  );
}

export function SunArc({ sun, daylight, timeZone, locale, dict }: SunArcProps) {
  const start = arcPoint(0);
  const sunAt = daylight === null ? null : arcPoint(daylight);

  return (
    <div className="relative h-28 w-full max-w-[896px]">
      <Layer
        src="/sun-arc/horizon-dashed.svg"
        style={{
          inset: `calc(${HORIZON_TOP}% - 0.51px) 9.09% calc(${100 - HORIZON_TOP}% - 0.51px)`,
        }}
      />
      <Layer
        src="/sun-arc/path.svg"
        style={{
          inset: `${ARC.top - 1}% ${ARC.left}% ${100 - ARC.top - ARC.height - 1}%`,
        }}
      />
      <Layer
        src="/sun-arc/sunrise-dot.svg"
        style={{
          left: `${start.left}%`,
          top: `${start.top}%`,
          width: 4.07,
          height: 4.07,
          translate: "-50% -50%",
        }}
      />
      {sunAt && (
        <>
          <Layer
            src="/sun-arc/sun-tick.svg"
            style={{
              left: `${sunAt.left}%`,
              top: `${sunAt.top}%`,
              bottom: `${100 - HORIZON_TOP}%`,
              width: 1.02,
              translate: "-50% 0",
            }}
          />
          <Layer
            src="/sun-arc/sun-halo.svg"
            style={{
              left: `${sunAt.left}%`,
              top: `${sunAt.top}%`,
              width: 28.51,
              height: 28.51,
              translate: "-50% -50%",
            }}
          />
          <Layer
            src="/sun-arc/sun-dot.svg"
            style={{
              left: `${sunAt.left}%`,
              top: `${sunAt.top}%`,
              width: 9.16,
              height: 9.16,
              translate: "-50% -50%",
            }}
          />
        </>
      )}
      {sun && (
        // Under the horizon, so the labels never cross the curve on narrow screens.
        <div
          className="absolute flex justify-between gap-4 pt-1.5 whitespace-nowrap uppercase"
          style={{
            top: `${HORIZON_TOP}%`,
            left: `${ARC.left}%`,
            right: `${ARC.left}%`,
          }}
        >
          <p className="text-[10.18px] tracking-[0.81px] text-(--ink-mid-2)">
            {formatTime(sun.sunrise, timeZone, locale)} {dict.sun.sunrise}
          </p>
          <p className="text-[11.2px] font-medium tracking-[0.56px]">
            {formatTime(sun.sunset, timeZone, locale)} {dict.sun.sunset}
          </p>
        </div>
      )}
    </div>
  );
}
