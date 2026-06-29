import { describe, it, expect } from "vitest";
import {
  rangeFor,
  weekDays,
  monthGridDays,
  offsetForDate,
  isTaskActive,
  headerLabel,
  timelineHours,
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT,
} from "@/lib/time";
import type { Task } from "@/lib/types";

const makeTask = (scheduledAt: string, durationMin: number): Task => ({
  id: "t1",
  title: "Test",
  notes: null,
  scheduled_at: scheduledAt,
  duration_min: durationMin,
  person_id: null,
  category_id: null,
  status: "pending",
  created_at: scheduledAt,
});

describe("timelineHours", () => {
  it("starts at DAY_START_HOUR and ends at DAY_END_HOUR", () => {
    const hours = timelineHours();
    expect(hours[0]).toBe(DAY_START_HOUR);
    expect(hours[hours.length - 1]).toBe(DAY_END_HOUR);
  });

  it("contains consecutive integers", () => {
    const hours = timelineHours();
    for (let i = 1; i < hours.length; i++) {
      expect(hours[i]).toBe(hours[i - 1] + 1);
    }
  });
});

describe("offsetForDate", () => {
  it("returns 0 for DAY_START_HOUR:00", () => {
    const d = new Date(2024, 0, 1, DAY_START_HOUR, 0);
    expect(offsetForDate(d)).toBe(0);
  });

  it("returns HOUR_HEIGHT for one hour after start", () => {
    const d = new Date(2024, 0, 1, DAY_START_HOUR + 1, 0);
    expect(offsetForDate(d)).toBe(HOUR_HEIGHT);
  });

  it("calculates partial hours correctly", () => {
    const d = new Date(2024, 0, 1, DAY_START_HOUR, 30);
    expect(offsetForDate(d)).toBe(HOUR_HEIGHT / 2);
  });
});

describe("rangeFor", () => {
  const anchor = new Date(2024, 5, 15); // 15 jun 2024

  it("day range from is start-of-day and to is end-of-day", () => {
    const { from, to } = rangeFor("day", anchor);
    // from debe ser 00:00:00 del día, to debe ser 23:59:59 del mismo día local
    const fromDate = new Date(from);
    const toDate = new Date(to);
    // La diferencia debe ser menor a 24h (mismo día)
    const diffMs = toDate.getTime() - fromDate.getTime();
    expect(diffMs).toBeLessThan(24 * 60 * 60 * 1000);
    expect(diffMs).toBeGreaterThan(0);
  });

  it("week range abarca exactamente 7 días", () => {
    const { from, to } = rangeFor("week", anchor);
    const diff =
      (new Date(to).getTime() - new Date(from).getTime()) /
      (1000 * 60 * 60 * 24);
    // De lunes 00:00 a domingo 23:59:59 son ~7 días
    expect(Math.round(diff)).toBe(7);
  });

  it("month range stays within june 2024", () => {
    const { from, to } = rangeFor("month", anchor);
    expect(from.startsWith("2024-06")).toBe(true);
    // El fin puede ser de la semana de relleno, pero el mes empieza en junio
    expect(new Date(from).getFullYear()).toBe(2024);
  });
});

describe("weekDays", () => {
  it("returns 7 days", () => {
    expect(weekDays(new Date(2024, 5, 15))).toHaveLength(7);
  });

  it("first day is Monday", () => {
    const days = weekDays(new Date(2024, 5, 15)); // sábado
    expect(days[0].getDay()).toBe(1); // lunes
  });

  it("last day is Sunday", () => {
    const days = weekDays(new Date(2024, 5, 15));
    expect(days[6].getDay()).toBe(0); // domingo
  });
});

describe("monthGridDays", () => {
  it("always returns a multiple of 7", () => {
    const days = monthGridDays(new Date(2024, 5, 1));
    expect(days.length % 7).toBe(0);
  });

  it("contains all days of the month", () => {
    const anchor = new Date(2024, 5, 1); // junio 2024 tiene 30 días
    const days = monthGridDays(anchor);
    const junioDays = days.filter((d) => d.getMonth() === 5);
    expect(junioDays).toHaveLength(30);
  });
});

describe("isTaskActive", () => {
  it("returns true when now is within task duration", () => {
    const task = makeTask("2024-06-15T10:00:00.000Z", 60);
    const now = new Date("2024-06-15T10:30:00.000Z");
    expect(isTaskActive(task, now)).toBe(true);
  });

  it("returns false when now is before the task starts", () => {
    const task = makeTask("2024-06-15T10:00:00.000Z", 60);
    const now = new Date("2024-06-15T09:59:00.000Z");
    expect(isTaskActive(task, now)).toBe(false);
  });

  it("returns false when now is after the task ends", () => {
    const task = makeTask("2024-06-15T10:00:00.000Z", 60);
    const now = new Date("2024-06-15T11:01:00.000Z");
    expect(isTaskActive(task, now)).toBe(false);
  });

  it("returns false when task is on a different day", () => {
    const task = makeTask("2024-06-15T10:00:00.000Z", 60);
    const now = new Date("2024-06-16T10:30:00.000Z");
    expect(isTaskActive(task, now)).toBe(false);
  });
});

describe("headerLabel", () => {
  it("day label includes day number and month", () => {
    const label = headerLabel("day", new Date(2024, 5, 15));
    expect(label.toLowerCase()).toContain("15");
    expect(label.toLowerCase()).toContain("junio");
  });

  it("week label shows a date range", () => {
    const label = headerLabel("week", new Date(2024, 5, 15));
    expect(label).toContain("–");
  });

  it("month label includes month name and year", () => {
    const label = headerLabel("month", new Date(2024, 5, 1));
    expect(label.toLowerCase()).toContain("junio");
    expect(label).toContain("2024");
  });
});
