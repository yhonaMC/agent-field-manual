import { describe, it, expect } from "vitest";
import { buildExam, allocateByDomain } from "../src/lib/exam-builder";
import { mulberry32 } from "../src/lib/rng";
import type { Question } from "../src/lib/question-schema";

function fakePool(counts: Record<number, number>): Question[] {
  const pool: Question[] = [];
  for (const [domain, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) {
      pool.push({
        id: `final-q${String(pool.length + 1).padStart(3, "0")}`,
        domain: Number(domain), sources: ["final-pool"],
        stem: "Stem text long enough for the schema to be perfectly happy.",
        options: ["a", "b", "c", "d"], correctIndex: 0,
        explanation: "Explanation text long enough for the schema.", tags: [],
      });
    }
  }
  return pool;
}

describe("allocateByDomain", () => {
  it("allocates proportionally with largest remainder, summing to size", () => {
    // 100/50/30/15/5 = 200 → for 60: 30/15/9/4.5/1.5 → 30/15/9/5/1 or 30/15/9/4/2
    const alloc = allocateByDomain({ 1: 100, 2: 50, 3: 30, 4: 15, 5: 5 }, 60);
    expect(Object.values(alloc).reduce((a, b) => a + b, 0)).toBe(60);
    expect(alloc[1]).toBe(30);
    expect(alloc[2]).toBe(15);
    expect(alloc[3]).toBe(9);
  });
  it("never allocates more than a domain has", () => {
    const alloc = allocateByDomain({ 1: 2, 2: 100 }, 60);
    expect(alloc[1]).toBeLessThanOrEqual(2);
    expect(Object.values(alloc).reduce((a, b) => a + b, 0)).toBe(60);
  });
});

describe("buildExam", () => {
  const pool = fakePool({ 1: 40, 2: 40, 3: 40, 4: 40, 5: 40 });
  it("returns exactly 60 unique questions", () => {
    const exam = buildExam(pool, 60, mulberry32(1));
    expect(exam).toHaveLength(60);
    expect(new Set(exam.map((q) => q.id)).size).toBe(60);
  });
  it("balances by domain (12 each for a uniform pool)", () => {
    const exam = buildExam(pool, 60, mulberry32(1));
    for (let d = 1; d <= 5; d++) {
      expect(exam.filter((q) => q.domain === d)).toHaveLength(12);
    }
  });
  it("is deterministic for a seed and shuffled across domains", () => {
    const a = buildExam(pool, 60, mulberry32(9));
    const b = buildExam(pool, 60, mulberry32(9));
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    const domainsInOrder = a.map((q) => q.domain).join("");
    expect(domainsInOrder).not.toBe("1".repeat(12) + "2".repeat(12) + "3".repeat(12) + "4".repeat(12) + "5".repeat(12));
  });
});
