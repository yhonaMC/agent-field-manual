import { describe, it, expect } from "vitest";
import { SRS_INTERVALS, reviewOutcome, isDue, toIsoDate } from "../src/lib/srs";

const day = (s: string) => new Date(`${s}T12:00:00Z`);

describe("srs", () => {
  it("has the fixed interval ladder", () => {
    expect(SRS_INTERVALS).toEqual([1, 3, 7, 16, 35]);
  });
  it("a miss (re)sets to box 0, due tomorrow", () => {
    const s = reviewOutcome({ box: 3, due: "2026-07-10" }, false, day("2026-07-10"));
    expect(s).toEqual({ box: 0, due: "2026-07-11" });
  });
  it("a first-ever miss creates box 0", () => {
    expect(reviewOutcome(undefined, false, day("2026-07-10")).box).toBe(0);
  });
  it("a correct review advances one box", () => {
    const s = reviewOutcome({ box: 1, due: "2026-07-10" }, true, day("2026-07-10"));
    expect(s).toEqual({ box: 2, due: "2026-07-17" }); // +7 days
  });
  it("box caps at the last interval", () => {
    const s = reviewOutcome({ box: 4, due: "2026-07-10" }, true, day("2026-07-10"));
    expect(s.box).toBe(4);
    expect(s.due).toBe("2026-08-14"); // +35 days
  });
  it("isDue compares by calendar date", () => {
    expect(isDue({ box: 0, due: "2026-07-10" }, day("2026-07-10"))).toBe(true);
    expect(isDue({ box: 0, due: "2026-07-11" }, day("2026-07-10"))).toBe(false);
    expect(isDue({ box: 0, due: "2026-07-01" }, day("2026-07-10"))).toBe(true);
  });
  it("toIsoDate formats UTC calendar date", () => {
    expect(toIsoDate(day("2026-07-10"))).toBe("2026-07-10");
  });
});
