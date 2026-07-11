import { describe, it, expect } from "vitest";
import {
  emptyProgress, recordAnswer, markLessonRead, appendExam,
  dueQuestionIds, parseImported, ProgressSchema,
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
