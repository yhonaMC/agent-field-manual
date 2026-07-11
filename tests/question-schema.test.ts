import { describe, it, expect } from "vitest";
import { QuestionSchema, QuestionFileSchema } from "../src/lib/question-schema";

const valid = {
  id: "d1-p1-q01",
  domain: 1,
  sources: ["practice-1"],
  stem: "You are building an agent that audits a codebase and scope grows as findings appear. Which approach fits best?",
  options: [
    "Give more examples inside the fixed workflow",
    "Let the agent generate follow-up tasks from intermediate findings",
    "Add more fixed pipeline steps",
    "Re-run the pipeline with different configs",
  ],
  correctIndex: 1,
  explanation: "Open-ended tasks need adaptive decomposition: new discoveries should feed back into what the agent does next.",
  tags: ["agent-loops"],
};

describe("QuestionSchema", () => {
  it("accepts a valid question", () => {
    expect(QuestionSchema.parse(valid)).toMatchObject({ id: "d1-p1-q01" });
  });
  it("rejects wrong option count", () => {
    expect(() => QuestionSchema.parse({ ...valid, options: valid.options.slice(0, 3) })).toThrow();
  });
  it("rejects out-of-range correctIndex", () => {
    expect(() => QuestionSchema.parse({ ...valid, correctIndex: 4 })).toThrow();
  });
  it("rejects malformed id", () => {
    expect(() => QuestionSchema.parse({ ...valid, id: "question-1" })).toThrow();
  });
  it("rejects empty sources", () => {
    expect(() => QuestionSchema.parse({ ...valid, sources: [] })).toThrow();
  });
  it("parses an array file", () => {
    expect(QuestionFileSchema.parse([valid])).toHaveLength(1);
  });
});
