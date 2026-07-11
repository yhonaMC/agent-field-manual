import { describe, it, expect } from "vitest";
import { mulberry32, shuffle, shuffleOptions } from "../src/lib/rng";
import type { Question } from "../src/lib/question-schema";

const q: Question = {
  id: "d1-p1-q01", domain: 1, sources: ["practice-1"],
  stem: "A question stem long enough to satisfy the schema requirements.",
  options: ["A", "B", "C", "D"], correctIndex: 2,
  explanation: "An explanation long enough to satisfy the schema.", tags: [],
};

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("returns values in [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe("shuffle", () => {
  it("keeps all elements and does not mutate input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, mulberry32(1));
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("shuffleOptions", () => {
  it("tracks the correct answer through the shuffle", () => {
    for (let seed = 0; seed < 20; seed++) {
      const s = shuffleOptions(q, mulberry32(seed));
      expect(s.options[s.correctPosition]).toBe("C");
      expect([...s.options].sort()).toEqual(["A", "B", "C", "D"]);
    }
  });
});
