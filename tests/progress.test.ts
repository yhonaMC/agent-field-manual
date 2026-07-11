import { describe, it, expect } from "vitest";
import {
  emptyProgress, recordAnswer, markLessonRead, appendExam,
  dueQuestionIds, parseImported, ProgressSchema,
  recordDrill, domainPassed, domainUnlocked, allDomainsPassed,
} from "../src/lib/progress";

const day = (s: string) => new Date(`${s}T12:00:00Z`);

describe("progress reducers", () => {
  it("emptyProgress shape validates against its own schema", () => {
    expect(() => ProgressSchema.parse(emptyProgress())).not.toThrow();
  });

  it("recordAnswer counts attempts and does not enter SRS on first-try correct", () => {
    const s = recordAnswer(emptyProgress(), "d1-p1-q01", true, day("2026-07-10"));
    expect(s.answers["d1-p1-q01"]).toEqual({ attempts: 1, lastCorrect: true });
  });

  it("recordAnswer enters SRS on a miss", () => {
    const s = recordAnswer(emptyProgress(), "d1-p1-q01", false, day("2026-07-10"));
    expect(s.answers["d1-p1-q01"].srs).toEqual({ box: 0, due: "2026-07-11" });
  });

  it("a correct answer advances an existing SRS card", () => {
    let s = recordAnswer(emptyProgress(), "q", false, day("2026-07-10"));
    // fake id "q" is fine here: reducers don't validate ids against the bank
    s = recordAnswer(s, "q", true, day("2026-07-11"));
    expect(s.answers["q"].srs).toEqual({ box: 1, due: "2026-07-14" });
    expect(s.answers["q"].attempts).toBe(2);
  });

  it("is immutable", () => {
    const before = emptyProgress();
    recordAnswer(before, "q", false, day("2026-07-10"));
    expect(before.answers).toEqual({});
  });

  it("markLessonRead is idempotent", () => {
    let s = markLessonRead(emptyProgress(), "d1/chapter-01");
    s = markLessonRead(s, "d1/chapter-01");
    expect(s.lessonsRead).toEqual(["d1/chapter-01"]);
  });

  it("appendExam stores history", () => {
    const s = appendExam(emptyProgress(), {
      date: "2026-07-10", score: 48, total: 60,
      byDomain: { 1: { correct: 10, total: 12 } },
    });
    expect(s.examHistory).toHaveLength(1);
  });

  it("dueQuestionIds returns only due SRS cards", () => {
    let s = recordAnswer(emptyProgress(), "a", false, day("2026-07-01")); // due 07-02
    s = recordAnswer(s, "b", false, day("2026-07-10"));                   // due 07-11
    s = recordAnswer(s, "c", true, day("2026-07-01"));                    // never in SRS
    expect(dueQuestionIds(s, day("2026-07-10"))).toEqual(["a"]);
  });
});

describe("parseImported", () => {
  it("round-trips an exported state", () => {
    const s = recordAnswer(emptyProgress(), "q", false, day("2026-07-10"));
    expect(parseImported(JSON.stringify(s))).toEqual(s);
  });
  it("throws on garbage", () => {
    expect(() => parseImported("{\"nope\":true}")).toThrow();
    expect(() => parseImported("not json")).toThrow();
  });
});

describe("drill gating", () => {
  it("recordDrill marks passed at >= 70%", () => {
    const s = recordDrill(emptyProgress(), 1, 28, 40); // 70%
    expect(s.drills["1"]).toEqual({ attempts: 1, bestCorrect: 28, total: 40, passed: true });
  });
  it("recordDrill below threshold does not pass but counts attempt and best", () => {
    let s = recordDrill(emptyProgress(), 1, 20, 40);
    expect(s.drills["1"]!.passed).toBe(false);
    s = recordDrill(s, 1, 25, 40);
    expect(s.drills["1"]).toEqual({ attempts: 2, bestCorrect: 25, total: 40, passed: false });
  });
  it("passed is sticky across later worse attempts", () => {
    let s = recordDrill(emptyProgress(), 2, 30, 30);
    s = recordDrill(s, 2, 1, 30);
    expect(s.drills["2"]!.passed).toBe(true);
    expect(s.drills["2"]!.bestCorrect).toBe(30);
  });
  it("domainUnlocked chains sequentially", () => {
    let s = emptyProgress();
    expect(domainUnlocked(s, 1)).toBe(true);
    expect(domainUnlocked(s, 2)).toBe(false);
    s = recordDrill(s, 1, 40, 40);
    expect(domainUnlocked(s, 2)).toBe(true);
    expect(domainUnlocked(s, 3)).toBe(false);
  });
  it("allDomainsPassed requires all five", () => {
    let s = emptyProgress();
    for (const d of [1, 2, 3, 4]) s = recordDrill(s, d, 10, 10);
    expect(allDomainsPassed(s)).toBe(false);
    s = recordDrill(s, 5, 10, 10);
    expect(allDomainsPassed(s)).toBe(true);
  });
  it("old exports without drills still import (backward compat)", () => {
    const legacy = { v: 1, answers: {}, lessonsRead: [], examHistory: [] };
    const parsed = parseImported(JSON.stringify(legacy));
    expect(parsed.drills).toEqual({});
  });
});
