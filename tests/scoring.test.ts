import { describe, it, expect } from "vitest";
import { scoreExam } from "../src/lib/scoring";
import type { Question } from "../src/lib/question-schema";

const mk = (id: string, domain: number, correctIndex: number): Question => ({
  id, domain, sources: ["final-pool"],
  stem: "Stem text long enough for the schema to be perfectly happy.",
  options: ["a", "b", "c", "d"], correctIndex,
  explanation: "Explanation text long enough for the schema.", tags: [],
});

describe("scoreExam", () => {
  const qs = [mk("final-q001", 1, 0), mk("final-q002", 1, 1), mk("final-q003", 2, 2)];

  it("scores answers and breaks down by domain", () => {
    const r = scoreExam(qs, { "final-q001": 0, "final-q002": 3, "final-q003": 2 }, "2026-07-10");
    expect(r.score).toBe(2);
    expect(r.total).toBe(3);
    expect(r.byDomain).toEqual({ "1": { correct: 1, total: 2 }, "2": { correct: 1, total: 1 } });
    expect(r.date).toBe("2026-07-10");
  });

  it("treats unanswered questions as wrong", () => {
    const r = scoreExam(qs, {}, "2026-07-10");
    expect(r.score).toBe(0);
    expect(r.byDomain["1"].total).toBe(2);
  });

  it("reports per-question correctness", () => {
    const r = scoreExam(qs, { "final-q001": 0 }, "2026-07-10");
    expect(r.perQuestion).toEqual({ "final-q001": true, "final-q002": false, "final-q003": false });
  });
});
