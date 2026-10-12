import { describe, expect, test } from "vitest";
import {
  daylightFraction,
  formatHour,
  formatTime,
  nearestHourIndex,
  sunTimesFor,
  timelineStatus,
  type SunTimes,
} from "./time";

const BUENOS_AIRES = "America/Argentina/Buenos_Aires";

// Two consecutive Buenos Aires days (October 2026); `day` is local midnight.
const sun: SunTimes[] = [
  { day: 1791601200, sunrise: 1791623877, sunset: 1791669829 },
  { day: 1791687600, sunrise: 1791710199, sunset: 1791756278 },
];
const [firstDay, secondDay] = sun as [SunTimes, SunTimes];

test("formatTime is 24-hour in both locales", () => {
  const unix = 1791691200 + 42 * 60;
  const en = formatTime(unix, BUENOS_AIRES, "en");
  expect(en).toBe(formatTime(unix, BUENOS_AIRES, "es"));
  expect(en).toMatch(/^\d{2}:\d{2}$/);
});

test("formatHour uses the city's time zone", () => {
  // 19:00 UTC is 16:00 in Buenos Aires.
  expect(formatHour(1791658800, BUENOS_AIRES, "en")).toBe("16");
});

test("nearestHourIndex picks the closest, earlier on ties, clamped", () => {
  const times = [0, 3600, 7200];
  expect(nearestHourIndex(times, 1800)).toBe(0);
  expect(nearestHourIndex(times, 1801)).toBe(1);
  expect(nearestHourIndex(times, -500)).toBe(0);
  expect(nearestHourIndex(times, 99999)).toBe(2);
});

describe("sunTimesFor", () => {
  test("just before local midnight belongs to the previous day", () => {
    expect(sunTimesFor(sun, secondDay.day - 3600)).toBe(firstDay);
  });

  test("local midnight starts the new day", () => {
    expect(sunTimesFor(sun, secondDay.day)).toBe(secondDay);
  });

  test("returns null before the first day", () => {
    expect(sunTimesFor(sun, 0)).toBeNull();
  });
});

test("daylightFraction is 0 at sunrise, 0.5 mid-day and null after sunset", () => {
  const { sunrise, sunset } = secondDay;
  expect(daylightFraction(sunrise, secondDay)).toBe(0);
  expect(daylightFraction((sunrise + sunset) / 2, secondDay)).toBe(0.5);
  expect(daylightFraction(sunset + 1, secondDay)).toBeNull();
});

test("timelineStatus is live within 15 minutes of now", () => {
  expect(timelineStatus(1000, 1000 + 900)).toBe("live");
  expect(timelineStatus(1000 + 901, 1000)).toBe("forecast");
  expect(timelineStatus(1000 - 901, 1000)).toBe("earlier");
});
