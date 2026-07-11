import { describe, it, expect } from "vitest";
import { QuestionFileSchema } from "../src/lib/question-schema";

const files = import.meta.glob("../src/data/questions/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

describe("question content files", () => {
  it("at least one question file exists", () => {
    expect(Object.keys(files).length).toBeGreaterThan(0);
  });

  for (const [path, mod] of Object.entries(files)) {
    it(`${path} matches the schema`, () => {
      const parsed = QuestionFileSchema.parse(mod.default);
      const m = path.match(/domain-(\d)\.json$/);
      if (m) {
        for (const q of parsed) expect(q.domain).toBe(Number(m[1]));
      }
    });
  }

  it("ids are globally unique", () => {
    const ids = Object.values(files).flatMap((m) => QuestionFileSchema.parse(m.default).map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
