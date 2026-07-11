# The Agent Field Manual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, static, English-language study site for the Claude certification (CCAF) with lessons, practice quizzes, a 60-question exam simulator, and spaced-repetition review — styled as a 1970s retro-technical operations manual.

**Architecture:** Astro 5 static site with React islands. All study content lives as MDX (lessons/scenarios) and Zod-validated JSON (questions) extracted and **paraphrased** from the user's PDFs at `C:\Users\pc\OneDrive\Desktop\claude cetificacion`. All user progress lives in `localStorage` behind pure, unit-tested reducer functions; nanostores provides the thin reactive adapter. No backend.

**Tech Stack:** Astro 5, React 19, TypeScript (strict), MDX, Zod, nanostores + @nanostores/persistent + @nanostores/react, Vitest, custom CSS (no UI libraries), Vercel.

**Spec:** `docs/superpowers/specs/2026-07-10-agent-field-manual-design.md`

**Refinements vs spec (intentional):**
- Question field `source: string` → `sources: string[]` (a deduped question can come from both a practice quiz and the final pool).
- SRS state `{ interval, due, ease }` → `{ box, due }` where `box` indexes the fixed interval ladder `[1, 3, 7, 16, 35]` days. Simpler, same behavior.

**Commit identity:** The repo's local git config is already set to `Yhonaiker Moncada <yhonaiker1@gmail.com>`. NEVER add a `Co-Authored-By` trailer.

**Working directory for all commands:** `C:\Users\pc\OneDrive\Desktop\agent-field-manual`

---

## File structure (target)

```
agent-field-manual/
├─ astro.config.mjs
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
├─ src/
│  ├─ content.config.ts             # Astro collections: lessons, domains, scenarios
│  ├─ content/
│  │  ├─ lessons/d1/chapter-01.mdx … d5/chapter-18.mdx
│  │  ├─ domains/domain-1.mdx … domain-5.mdx
│  │  └─ scenarios/scenario-1.mdx … scenario-6.mdx
│  ├─ data/questions/
│  │  ├─ domain-1.json … domain-5.json   # practice + deduped pool questions
│  │  └─ final-pool.json                 # pool-only questions (not in any practice quiz)
│  ├─ lib/                          # pure logic — every file unit-tested
│  │  ├─ question-schema.ts         # Zod schema + types
│  │  ├─ question-bank.ts           # loads/validates all JSON, exposes filters
│  │  ├─ rng.ts                     # mulberry32 + shuffle + shuffleOptions
│  │  ├─ srs.ts                     # SM-2-lite scheduler
│  │  ├─ progress.ts                # ProgressState + pure reducers + import/export
│  │  ├─ exam-builder.ts            # balanced 60-question sampling
│  │  └─ scoring.ts                 # exam scoring + per-domain breakdown
│  ├─ stores/
│  │  ├─ progress-store.ts          # persistentAtom adapter over lib/progress
│  │  └─ exam-session.ts            # persisted in-flight exam (resume on reload)
│  ├─ components/
│  │  ├─ islands/QuizEngine.tsx
│  │  ├─ islands/ExamSimulator.tsx
│  │  ├─ islands/ReviewDeck.tsx
│  │  ├─ islands/ProgressPanel.tsx
│  │  ├─ islands/Gauge.tsx          # SVG analog needle gauge
│  │  └─ Stamp.astro                # "CERTIFIED" ink stamp
│  ├─ layouts/ManualLayout.astro
│  ├─ styles/tokens.css
│  ├─ styles/global.css
│  └─ pages/
│     ├─ index.astro                          # cover + table of contents
│     ├─ manual/[domain]/index.astro          # § d.0 domain brief
│     ├─ manual/[domain]/[chapter].astro      # § d.c lesson
│     ├─ scenarios/[id].astro
│     ├─ exam.astro                           # exam-room mode (dark)
│     ├─ review.astro
│     └─ progress.astro
└─ tests/
   ├─ question-schema.test.ts
   ├─ question-content.test.ts      # validates every JSON file in src/data
   ├─ rng.test.ts
   ├─ srs.test.ts
   ├─ progress.test.ts
   ├─ exam-builder.test.ts
   └─ scoring.test.ts
```

---

### Task 1: Scaffold the Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `src/pages/index.astro`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "agent-field-manual",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "prebuild": "vitest run",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/react": "^4.0.0",
    "@fontsource-variable/crimson-pro": "^5.0.0",
    "@fontsource/ibm-plex-mono": "^5.0.0",
    "@nanostores/persistent": "^1.0.0",
    "@nanostores/react": "^1.0.0",
    "astro": "^5.0.0",
    "nanostores": "^1.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://agent-field-manual.vercel.app",
  integrations: [react(), mdx()],
});
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules/
dist/
.astro/
.vercel/
```

- [ ] **Step 6: Write placeholder `src/pages/index.astro`**

```astro
---
---
<html lang="en">
  <head><meta charset="utf-8" /><title>The Agent Field Manual</title></head>
  <body><h1>The Agent Field Manual</h1></body>
</html>
```

- [ ] **Step 7: Install and verify build**

Run: `npm install` then `npm run build`
Expected: build succeeds ("prebuild" runs vitest — with no test files vitest exits 1 with "No test files found"; if so, temporarily use `vitest run --passWithNoTests` in prebuild, and remove `--passWithNoTests` in Task 2).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold Astro 5 + React + Vitest project"
```

---

### Task 2: Question schema (TDD)

**Files:**
- Create: `src/lib/question-schema.ts`
- Test: `tests/question-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/question-schema.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/question-schema.test.ts`
Expected: FAIL — cannot resolve `../src/lib/question-schema`

- [ ] **Step 3: Write `src/lib/question-schema.ts`**

```ts
import { z } from "zod";

export const SOURCES = ["practice-1", "practice-2", "practice-3", "final-pool"] as const;

export const QuestionSchema = z.object({
  id: z.string().regex(/^(d[1-5]-p[1-3]-q\d{2}|final-q\d{3})$/),
  domain: z.number().int().min(1).max(5),
  sources: z.array(z.enum(SOURCES)).min(1),
  stem: z.string().min(20),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(20),
  tags: z.array(z.string()).default([]),
});

export const QuestionFileSchema = z.array(QuestionSchema);

export type Question = z.infer<typeof QuestionSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/question-schema.test.ts` — Expected: PASS (6 tests). If Task 1 used `--passWithNoTests`, remove that flag from `prebuild` now.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Zod question schema"
```

---

### Task 3: Deterministic RNG + shuffles (TDD)

**Files:**
- Create: `src/lib/rng.ts`
- Test: `tests/rng.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/rng.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/rng.test.ts` — Expected: FAIL (module not found)

- [ ] **Step 3: Write `src/lib/rng.ts`**

```ts
import type { Question } from "./question-schema";

/** Small fast seeded PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(arr: readonly T[], rnd: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface ShuffledOptions {
  options: string[];
  correctPosition: number;
}

export function shuffleOptions(q: Question, rnd: () => number): ShuffledOptions {
  const indices = shuffle([0, 1, 2, 3], rnd);
  return {
    options: indices.map((i) => q.options[i]),
    correctPosition: indices.indexOf(q.correctIndex),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/rng.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: seeded rng, shuffle, option shuffling"
```

---

### Task 4: SRS scheduler (TDD)

**Files:**
- Create: `src/lib/srs.ts`
- Test: `tests/srs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/srs.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/srs.test.ts` — Expected: FAIL (module not found)

- [ ] **Step 3: Write `src/lib/srs.ts`**

```ts
export const SRS_INTERVALS = [1, 3, 7, 16, 35] as const;

export interface SrsState {
  /** Index into SRS_INTERVALS. */
  box: number;
  /** ISO calendar date (UTC) when the card is next due. */
  due: string;
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export function reviewOutcome(prev: SrsState | undefined, correct: boolean, today: Date): SrsState {
  const box = correct ? Math.min((prev?.box ?? -1) + 1, SRS_INTERVALS.length - 1) : 0;
  return { box, due: toIsoDate(addDays(today, SRS_INTERVALS[box])) };
}

export function isDue(state: SrsState, today: Date): boolean {
  return state.due <= toIsoDate(today);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/srs.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: SM-2-lite spaced repetition scheduler"
```

---

### Task 5: Progress state + reducers + import/export (TDD)

**Files:**
- Create: `src/lib/progress.ts`
- Test: `tests/progress.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/progress.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/progress.test.ts` — Expected: FAIL (module not found)

- [ ] **Step 3: Write `src/lib/progress.ts`**

```ts
import { z } from "zod";
import { reviewOutcome, isDue, type SrsState } from "./srs";

const SrsSchema = z.object({ box: z.number().int().min(0).max(4), due: z.string() });

const AnswerSchema = z.object({
  attempts: z.number().int().min(0),
  lastCorrect: z.boolean(),
  srs: SrsSchema.optional(),
});

const ExamRecordSchema = z.object({
  date: z.string(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  byDomain: z.record(z.string(), z.object({ correct: z.number().int(), total: z.number().int() })),
});

export const ProgressSchema = z.object({
  v: z.literal(1),
  answers: z.record(z.string(), AnswerSchema),
  lessonsRead: z.array(z.string()),
  examHistory: z.array(ExamRecordSchema),
});

export type ProgressState = z.infer<typeof ProgressSchema>;
export type ExamRecord = z.infer<typeof ExamRecordSchema>;
export type AnswerRecord = z.infer<typeof AnswerSchema>;

export function emptyProgress(): ProgressState {
  return { v: 1, answers: {}, lessonsRead: [], examHistory: [] };
}

export function recordAnswer(state: ProgressState, questionId: string, correct: boolean, today: Date): ProgressState {
  const prev = state.answers[questionId];
  let srs: SrsState | undefined = prev?.srs;
  if (!correct) {
    srs = reviewOutcome(prev?.srs, false, today);
  } else if (prev?.srs) {
    srs = reviewOutcome(prev.srs, true, today);
  }
  const next: AnswerRecord = {
    attempts: (prev?.attempts ?? 0) + 1,
    lastCorrect: correct,
    ...(srs ? { srs } : {}),
  };
  return { ...state, answers: { ...state.answers, [questionId]: next } };
}

export function markLessonRead(state: ProgressState, lessonId: string): ProgressState {
  if (state.lessonsRead.includes(lessonId)) return state;
  return { ...state, lessonsRead: [...state.lessonsRead, lessonId] };
}

export function appendExam(state: ProgressState, record: ExamRecord): ProgressState {
  return { ...state, examHistory: [...state.examHistory, record] };
}

export function dueQuestionIds(state: ProgressState, today: Date): string[] {
  return Object.entries(state.answers)
    .filter(([, a]) => a.srs && isDue(a.srs, today))
    .map(([id]) => id);
}

/** Validates an exported-progress JSON string. Throws on anything invalid. */
export function parseImported(json: string): ProgressState {
  return ProgressSchema.parse(JSON.parse(json));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/progress.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: progress state, reducers, import/export validation"
```

---

### Task 6: Exam builder (TDD)

**Files:**
- Create: `src/lib/exam-builder.ts`
- Test: `tests/exam-builder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/exam-builder.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/exam-builder.test.ts` — Expected: FAIL (module not found)

- [ ] **Step 3: Write `src/lib/exam-builder.ts`**

```ts
import type { Question } from "./question-schema";
import { shuffle } from "./rng";

/** Largest-remainder proportional allocation, capped at each domain's pool count. */
export function allocateByDomain(counts: Record<number, number>, size: number): Record<number, number> {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const entries = Object.entries(counts).map(([d, n]) => {
    const exact = (n / total) * size;
    return { domain: Number(d), n, floor: Math.floor(exact), rem: exact - Math.floor(exact) };
  });
  const alloc: Record<number, number> = {};
  let used = 0;
  for (const e of entries) {
    alloc[e.domain] = Math.min(e.floor, e.n);
    used += alloc[e.domain];
  }
  // Distribute the remainder to the largest fractional parts (with capacity left).
  const byRem = [...entries].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (used < size && byRem.some((e) => alloc[e.domain] < e.n)) {
    const e = byRem[i % byRem.length];
    if (alloc[e.domain] < e.n) { alloc[e.domain]++; used++; }
    i++;
  }
  return alloc;
}

export function buildExam(pool: Question[], size: number, rnd: () => number): Question[] {
  const byDomain = new Map<number, Question[]>();
  for (const q of pool) {
    byDomain.set(q.domain, [...(byDomain.get(q.domain) ?? []), q]);
  }
  const counts = Object.fromEntries([...byDomain].map(([d, qs]) => [d, qs.length]));
  const alloc = allocateByDomain(counts, size);
  const picked: Question[] = [];
  for (const [domain, qs] of byDomain) {
    picked.push(...shuffle(qs, rnd).slice(0, alloc[domain] ?? 0));
  }
  return shuffle(picked, rnd);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/exam-builder.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: domain-balanced exam builder"
```

---

### Task 7: Scoring (TDD)

**Files:**
- Create: `src/lib/scoring.ts`
- Test: `tests/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/scoring.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scoring.test.ts` — Expected: FAIL (module not found)

- [ ] **Step 3: Write `src/lib/scoring.ts`**

```ts
import type { Question } from "./question-schema";
import type { ExamRecord } from "./progress";

export interface ExamResult extends ExamRecord {
  perQuestion: Record<string, boolean>;
}

export function scoreExam(
  questions: Question[],
  answers: Record<string, number>,
  date: string,
): ExamResult {
  const byDomain: ExamRecord["byDomain"] = {};
  const perQuestion: Record<string, boolean> = {};
  let score = 0;
  for (const q of questions) {
    const key = String(q.domain);
    byDomain[key] ??= { correct: 0, total: 0 };
    byDomain[key].total++;
    const correct = answers[q.id] === q.correctIndex;
    perQuestion[q.id] = correct;
    if (correct) { score++; byDomain[key].correct++; }
  }
  return { date, score, total: questions.length, byDomain, perQuestion };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scoring.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: exam scoring with per-domain breakdown"
```

---

### Task 8: Question bank + content validation test

**Files:**
- Create: `src/lib/question-bank.ts`, `src/data/questions/domain-1.json` (seed with 1 sample question, replaced in Task 11)
- Test: `tests/question-content.test.ts`

- [ ] **Step 1: Seed `src/data/questions/domain-1.json`**

```json
[
  {
    "id": "d1-p1-q01",
    "domain": 1,
    "sources": ["practice-1"],
    "stem": "PLACEHOLDER SEED — replaced during Domain 1 extraction. This stem is long enough to validate.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Placeholder explanation, long enough to satisfy schema validation rules.",
    "tags": ["seed"]
  }
]
```

- [ ] **Step 2: Write the content validation test**

This test is the build-time content gate (runs in `prebuild`): every JSON file must parse against the schema, ids must be globally unique, and each file's `domain` must match its filename.

```ts
// tests/question-content.test.ts
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
```

- [ ] **Step 3: Write `src/lib/question-bank.ts`**

```ts
import { QuestionFileSchema, type Question } from "./question-schema";

const files = import.meta.glob("../data/questions/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

export const allQuestions: Question[] = Object.values(files)
  .flatMap((m) => QuestionFileSchema.parse(m.default))
  .sort((a, b) => a.id.localeCompare(b.id));

export const questionById = new Map(allQuestions.map((q) => [q.id, q]));

export function practiceQuestions(domain: number): Question[] {
  return allQuestions.filter((q) => q.domain === domain && q.sources.some((s) => s.startsWith("practice")));
}

export function finalPool(): Question[] {
  return allQuestions.filter((q) => q.sources.includes("final-pool"));
}
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run` — Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: question bank loader + build-time content validation"
```

---

### Task 9: Progress store + exam session store (nanostores adapters)

Thin adapters — logic is already tested; these stay free of business rules.

**Files:**
- Create: `src/stores/progress-store.ts`, `src/stores/exam-session.ts`

- [ ] **Step 1: Write `src/stores/progress-store.ts`**

```ts
import { persistentAtom } from "@nanostores/persistent";
import {
  ProgressSchema, emptyProgress, recordAnswer, markLessonRead, appendExam,
  parseImported, type ProgressState, type ExamRecord,
} from "../lib/progress";

export const $progress = persistentAtom<ProgressState>("afm:v1", emptyProgress(), {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      return ProgressSchema.parse(JSON.parse(raw));
    } catch {
      return emptyProgress(); // corrupted storage never crashes the app
    }
  },
});

export const answer = (questionId: string, correct: boolean) =>
  $progress.set(recordAnswer($progress.get(), questionId, correct, new Date()));

export const readLesson = (lessonId: string) =>
  $progress.set(markLessonRead($progress.get(), lessonId));

export const saveExam = (record: ExamRecord) =>
  $progress.set(appendExam($progress.get(), record));

export const exportProgress = (): string => JSON.stringify($progress.get(), null, 2);

/** Throws with a Zod error message if the file is invalid. */
export const importProgress = (json: string) => $progress.set(parseImported(json));

export const resetProgress = () => $progress.set(emptyProgress());
```

- [ ] **Step 2: Write `src/stores/exam-session.ts`**

```ts
import { persistentAtom } from "@nanostores/persistent";
import { z } from "zod";

const ExamSessionSchema = z.object({
  questionIds: z.array(z.string()),
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
  /** Epoch ms when the exam ends — survives reloads so the timer resumes. */
  deadline: z.number(),
  seed: z.number(),
});

export type ExamSession = z.infer<typeof ExamSessionSchema>;

export const $examSession = persistentAtom<ExamSession | null>("afm:exam:v1", null, {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const val = JSON.parse(raw);
      return val === null ? null : ExamSessionSchema.parse(val);
    } catch {
      return null;
    }
  },
});
```

- [ ] **Step 3: Verify project still builds**

Run: `npx tsc --noEmit -p tsconfig.json` (or `npx astro check` if installed)
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: persistent progress and exam-session stores"
```

---

### Task 10: Design system — tokens, global CSS, ManualLayout, Stamp, Gauge

The visual identity: 1970s technical field manual. Cream paper, navy ink, burnt-orange accents, serif prose, mono labels, mil-spec section numbers, registration marks, revision-history footer.

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/ManualLayout.astro`, `src/components/Stamp.astro`, `src/components/islands/Gauge.tsx`
- Modify: `src/pages/index.astro` (use the layout)

- [ ] **Step 1: Write `src/styles/tokens.css`**

```css
:root {
  /* paper & ink */
  --paper: #f2ecdd;
  --paper-deep: #e9e1cd;
  --ink: #1c2a3a;          /* navy ink */
  --ink-soft: #44506050;
  --ink-faint: #1c2a3a22;
  --accent: #c2531d;       /* burnt orange */
  --accent-soft: #c2531d22;
  --stamp-red: #b3382c;
  --ok: #3f6b4f;

  /* exam-room (dark) mode */
  --panel: #10151c;
  --panel-ink: #d8e0e8;
  --panel-glow: #e8a13c;

  /* type */
  --font-prose: "Crimson Pro Variable", Georgia, serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --measure: 68ch;
  --rule: 1px solid var(--ink-faint);
}
```

- [ ] **Step 2: Write `src/styles/global.css`**

```css
@import "./tokens.css";

* { box-sizing: border-box; }

html {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-prose);
  font-size: 19px;
  line-height: 1.6;
}

/* subtle paper grain via inline SVG turbulence */
body {
  margin: 0;
  min-height: 100vh;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.11 0 0 0 0 0.16 0 0 0 0 0.23 0 0 0 0.035 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

h1, h2, h3 { line-height: 1.15; font-weight: 600; }

a { color: var(--ink); text-decoration-color: var(--accent); text-underline-offset: 3px; }
a:hover { color: var(--accent); }

code, pre, .mono { font-family: var(--font-mono); font-size: 0.85em; }
pre { background: var(--paper-deep); border: var(--rule); padding: 1rem; overflow-x: auto; }

/* ── manual chrome ────────────────────────────────── */

.sheet {
  max-width: 60rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 6rem;
  position: relative;
}

/* print registration marks in the corners */
.sheet::before, .sheet::after {
  content: "";
  position: fixed;
  width: 18px; height: 18px;
  border: 1px solid var(--ink-soft);
  pointer-events: none;
}
.sheet::before { top: 12px; left: 12px; border-right: 0; border-bottom: 0; }
.sheet::after  { bottom: 12px; right: 12px; border-left: 0; border-top: 0; }

.doc-header {
  display: flex; justify-content: space-between; align-items: baseline;
  border-bottom: 2px solid var(--ink);
  padding-bottom: .6rem; margin-bottom: 2.5rem;
  font-family: var(--font-mono); font-size: .72rem;
  letter-spacing: .08em; text-transform: uppercase;
}
.doc-header nav a { margin-left: 1.1rem; text-decoration: none; }

.section-no {
  font-family: var(--font-mono);
  color: var(--accent);
  font-size: .8em;
  letter-spacing: .05em;
  display: block;
  margin-bottom: .25rem;
}

.prose { max-width: var(--measure); }
.prose h2, .prose h3 { margin-top: 2.2em; }
.prose h2::before { content: "§ "; color: var(--accent); font-family: var(--font-mono); font-size: .8em; }

.rule-row { border-top: var(--rule); padding: .8rem 0; }

.doc-footer {
  margin-top: 5rem; padding-top: 1rem;
  border-top: 2px solid var(--ink);
  font-family: var(--font-mono); font-size: .68rem;
  letter-spacing: .06em; text-transform: uppercase;
  display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
}

/* ── buttons ──────────────────────────────────────── */
.btn {
  font-family: var(--font-mono); font-size: .8rem; letter-spacing: .08em;
  text-transform: uppercase; cursor: pointer;
  background: var(--ink); color: var(--paper);
  border: 1px solid var(--ink); padding: .55rem 1.1rem;
}
.btn:hover { background: var(--accent); border-color: var(--accent); }
.btn.ghost { background: transparent; color: var(--ink); }
.btn.ghost:hover { color: var(--accent); }

/* ── exam-room mode (set on <html> for /exam) ─────── */
html.exam-room { background: var(--panel); color: var(--panel-ink); }
html.exam-room body { background-image: none; }
html.exam-room .sheet::before, html.exam-room .sheet::after { border-color: var(--panel-glow); }
html.exam-room .doc-header, html.exam-room .doc-footer { border-color: var(--panel-glow); color: var(--panel-ink); }
html.exam-room a { color: var(--panel-ink); }
```

- [ ] **Step 3: Write `src/layouts/ManualLayout.astro`**

```astro
---
import "@fontsource-variable/crimson-pro";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "../styles/global.css";

interface Props {
  title: string;
  description: string;
  examRoom?: boolean;
}
const { title, description, examRoom = false } = Astro.props;
---
<html lang="en" class={examRoom ? "exam-room" : ""}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title} · The Agent Field Manual</title>
  </head>
  <body>
    <div class="sheet">
      <header class="doc-header">
        <a href="/" style="text-decoration:none">AFM · THE AGENT FIELD MANUAL</a>
        <nav>
          <a href="/#contents">Contents</a>
          <a href="/exam">Exam</a>
          <a href="/review">Review</a>
          <a href="/progress">Progress</a>
        </nav>
      </header>
      <slot />
      <footer class="doc-footer">
        <span>DOC. AFM-CCAF-2026 · REV A</span>
        <span>UNCONTROLLED WHEN PRINTED</span>
        <span>© {new Date().getFullYear()} YHONAIKER MONCADA</span>
      </footer>
    </div>
  </body>
</html>
```

- [ ] **Step 4: Write `src/components/Stamp.astro`**

```astro
---
interface Props { label?: string }
const { label = "CERTIFIED" } = Astro.props;
---
<span class="stamp" aria-label={`${label} stamp`}>{label}</span>
<style>
  .stamp {
    display: inline-block;
    font-family: var(--font-mono);
    font-weight: 600;
    font-size: .7rem;
    letter-spacing: .18em;
    color: var(--stamp-red);
    border: 2px solid var(--stamp-red);
    border-radius: 3px;
    padding: .2rem .6rem;
    transform: rotate(-7deg);
    opacity: .82;
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='0.6' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0.06'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='white' filter='url(%23g)'/%3E%3C/svg%3E");
  }
</style>
```

- [ ] **Step 5: Write `src/components/islands/Gauge.tsx`** (analog needle gauge, 0–100)

```tsx
interface GaugeProps {
  value: number; // 0..100
  label: string;
}

export default function Gauge({ value, label }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  // needle sweeps from -120° (0%) to +120° (100%)
  const angle = -120 + (clamped / 100) * 240;
  const ticks = Array.from({ length: 11 }, (_, i) => -120 + i * 24);
  return (
    <figure style={{ margin: 0, textAlign: "center", fontFamily: "var(--font-mono)" }}>
      <svg viewBox="0 0 100 78" width="130" role="img" aria-label={`${label}: ${Math.round(clamped)}%`}>
        <circle cx="50" cy="50" r="44" fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth="1.5" />
        {ticks.map((t) => (
          <line key={t} x1="50" y1="10" x2="50" y2={t % 120 === 0 ? 17 : 14}
            stroke="var(--ink)" strokeWidth="1" transform={`rotate(${t} 50 50)`} />
        ))}
        <line x1="50" y1="50" x2="50" y2="14" stroke="var(--accent)" strokeWidth="2"
          transform={`rotate(${angle} 50 50)`} strokeLinecap="round" />
        <circle cx="50" cy="50" r="3.5" fill="var(--ink)" />
        <text x="50" y="70" textAnchor="middle" fontSize="9" fill="var(--ink)" fontFamily="var(--font-mono)">
          {Math.round(clamped)}%
        </text>
      </svg>
      <figcaption style={{ fontSize: ".62rem", letterSpacing: ".12em", textTransform: "uppercase" }}>
        {label}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 6: Rewrite `src/pages/index.astro` to use the layout** (temporary cover; the full TOC lands in Task 18)

```astro
---
import ManualLayout from "../layouts/ManualLayout.astro";
---
<ManualLayout title="Cover" description="A field manual for the Claude certification: lessons, drills, and a full exam simulator.">
  <section class="prose">
    <span class="section-no">DOC. AFM-CCAF-2026</span>
    <h1>The Agent Field Manual</h1>
    <p>Operating instructions for Claude agents. Study the manual, run the drills, pass the certification.</p>
  </section>
</ManualLayout>
```

- [ ] **Step 7: Verify visually and commit**

Run: `npm run dev`, open `http://localhost:4321` — cream paper, mono header, registration marks visible.

```bash
git add -A && git commit -m "feat: design system — tokens, manual layout, stamp, gauge"
```

---

### Task 11: Content collections config

**Files:**
- Create: `src/content.config.ts`, `src/content/lessons/d1/chapter-01.mdx` (skeleton frontmatter, real content in Task 12)

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    domain: z.number().int().min(1).max(5),
    chapter: z.number().int().min(1).max(18),
    section: z.string(),           // mil-spec number, e.g. "1.3"
    summary: z.string().min(20),   // used for meta description + TOC
  }),
});

const domains = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/domains" }),
  schema: z.object({
    title: z.string(),
    domain: z.number().int().min(1).max(5),
    summary: z.string().min(20),
    objectives: z.array(z.string()).min(1),
  }),
});

const scenarios = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/scenarios" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().min(1),
    summary: z.string().min(20),
  }),
});

export const collections = { lessons, domains, scenarios };
```

- [ ] **Step 2: Seed one lesson skeleton `src/content/lessons/d1/chapter-01.mdx`**

```mdx
---
title: "Agent Fundamentals"
domain: 1
chapter: 1
section: "1.1"
summary: "Skeleton lesson — replaced with real paraphrased content during Domain 1 extraction."
---

Content arrives in the Domain 1 extraction task.
```

- [ ] **Step 3: Verify build, commit**

Run: `npm run build` — Expected: success, collections detected.

```bash
git add -A && git commit -m "feat: content collections for lessons, domains, scenarios"
```

---

### Task 12–16: Content extraction (Domains 1–5)

> These five tasks follow the **same procedure** with different inputs. The full procedure is written once here and **applies verbatim to each domain task below**; each task lists its exact input files and output files. The executor is Claude reading PDFs with the Read tool.

**Extraction procedure (applies to Tasks 12–16):**

1. **PDF reading:** Use `Read` with `pages` ranges (≤20 pages per call). If Read fails with a `pdftoppm is not installed` error, install poppler first:
   - `winget install --id=oschwartz10612.Poppler -e` (then restart the shell so PATH updates; verify with `pdftoppm -v`).
   - Fallback: `choco install poppler` or `scoop install poppler`.
2. **Lessons:** For each chapter PDF, read the whole chapter, then write `src/content/lessons/d<D>/chapter-<NN>.mdx` with the frontmatter schema from Task 11. **Rewrite everything in your own words** — same technical facts, zero verbatim sentences from the source. Structure: `##` sections with clear headings, short paragraphs, code examples where the source has them, and a final `## Field Notes` section with 3–5 bullet takeaways. `section` frontmatter = `"<D>.<chapter position within domain>"` (e.g. D1 ch03 → `"1.3"`).
3. **Domain brief:** From the overview + exam-objectives PDFs, write `src/content/domains/domain-<D>.mdx` (frontmatter per Task 11: title, domain, summary, objectives array — objectives paraphrased from the official objectives PDF).
4. **Questions:** For each practice-quiz PDF (Moodle attempt reviews), extract every question: stem, 4 options, which option is marked correct (✓ icon / "The correct answer is:" line — **use the stated correct answer, NOT the user's chosen radio button**), and the explanation box. Write to `src/data/questions/domain-<D>.json` following the Task 2 schema. Rules:
   - **Paraphrase** stem, options, and explanation. Never change which option is technically correct. Keep options similar in length so the right one doesn't stand out.
   - Ids: `d<D>-p<quiz#>-q<NN>` numbered in PDF order (e.g. `d3-p2-q07`).
   - If the same question (same technical point, near-identical options) appears in two practice quizzes of the domain, keep ONE entry (first occurrence's id) and merge `sources` (e.g. `["practice-1","practice-2"]`).
   - `tags`: 1–3 kebab-case topic tags of your choosing (e.g. `"tool-use"`, `"context-window"`).
5. **Validate:** Run `npx vitest run tests/question-content.test.ts` — must PASS. Run `npm run build` — must succeed.
6. **Commit:** `git add -A && git commit -m "content: domain <D> lessons and question bank"`

### Task 12: Extract Domain 1

**Inputs** (`C:\Users\pc\OneDrive\Desktop\claude cetificacion\Domain 1\`): `introduccion dominio 1.pdf`, `welcome.pdf`, `objetive exam.pdf`, `chapter 01.pdf`–`chapter 05.pdf`, `questions practica.pdf` (practice-1), `question practica 02.pdf` (practice-2), `question practica 03.pdf` (practice-3)

**Outputs:** `src/content/lessons/d1/chapter-01.mdx` … `chapter-05.mdx` (sections 1.1–1.5, replacing the Task 11 skeleton), `src/content/domains/domain-1.mdx`, `src/data/questions/domain-1.json` (replacing the Task 8 seed — delete the seed entry)

- [ ] Steps 1–6 of the extraction procedure, then commit.

### Task 13: Extract Domain 2

**Inputs** (`Domain 2\`): `overview domain.pdf`, `exam objetives domain 2.pdf`, `chapter 06.pdf`–`chapter 08.pdf`, `exam practica dominio 2.pdf` (practice-1), `examen de practica domain 2 02.pdf` (practice-2)

**Outputs:** `src/content/lessons/d2/chapter-06.mdx` … `chapter-08.mdx` (sections 2.1–2.3), `src/content/domains/domain-2.mdx`, `src/data/questions/domain-2.json`

- [ ] Steps 1–6 of the extraction procedure, then commit.

### Task 14: Extract Domain 3

**Inputs** (`Domain 3\`): `overview domain 3.pdf`, `exam objetives domain 3.pdf`, `chapter 09.pdf`–`chapter 12.pdf`, `exam practica domino 3.pdf` (practice-1), `examen de practica domain 3 02.pdf` (practice-2)

**Outputs:** `src/content/lessons/d3/chapter-09.mdx` … `chapter-12.mdx` (sections 3.1–3.4), `src/content/domains/domain-3.mdx`, `src/data/questions/domain-3.json`

- [ ] Steps 1–6 of the extraction procedure, then commit.

### Task 15: Extract Domain 4

**Inputs** (`Domain 4\`): `overview domain 4.pdf`, `official exam objetives.pdf`, `chapter 13.pdf`–`chapter 16.pdf`, `exam practica dominio 4.pdf` (practice-1), `examen de practica 02.pdf` (practice-2)

**Outputs:** `src/content/lessons/d4/chapter-13.mdx` … `chapter-16.mdx` (sections 4.1–4.4), `src/content/domains/domain-4.mdx`, `src/data/questions/domain-4.json`

- [ ] Steps 1–6 of the extraction procedure, then commit.

### Task 16: Extract Domain 5

**Inputs** (`Domain 5\`): `overview dommain 5.pdf`, `official exam objetives domain 5.pdf`, `chapter 17.pdf`, `chapter 18.pdf`, `exam practica dominio 5.pdf` (practice-1), `exam practica dominio 5 02.pdf` (practice-2). Note: the two `.pptx` files are supplemental — skip them unless a chapter PDF is missing context (pptx can be read by unzipping: `ppt/slides/slide*.xml`).

**Outputs:** `src/content/lessons/d5/chapter-17.mdx`, `chapter-18.mdx` (sections 5.1–5.2), `src/content/domains/domain-5.mdx`, `src/data/questions/domain-5.json`

- [ ] Steps 1–6 of the extraction procedure, then commit.

---

### Task 17: Extract scenarios + final exam pool (with dedup)

**Files:**
- Create: `src/content/scenarios/scenario-1.mdx` … `scenario-6.mdx`, `src/data/questions/final-pool.json`
- Modify: `src/data/questions/domain-*.json` (adding `"final-pool"` to `sources` of duplicates)

**Inputs:** `scenarios\01.pdf`–`06.pdf`, `scenarios\the exam 6 scenarios -deep dive.pdf`, `examen final (pool completo).pdf`

- [ ] **Step 1: Scenarios.** For each of the 6 scenario PDFs (cross-referencing the deep-dive PDF for extra analysis), write `src/content/scenarios/scenario-<N>.mdx` (frontmatter: title, order=N, summary). Structure: `## The Situation` (paraphrased setup), `## Walkthrough` (the reasoning, rewritten in your own words), `## Field Notes` (key takeaways). No verbatim sentences.

- [ ] **Step 2: Final pool.** Read `examen final (pool completo).pdf` in ≤20-page chunks (it's large — likely 60+ questions). Extract every question using the same rules as the Tasks 12–16 procedure step 4 (paraphrase; stated correct answer, not the chosen radio). Determine each question's `domain` (1–5) by topic, matching against the domain objectives.

- [ ] **Step 3: Dedup against domain banks.** For each pool question, check whether the same question (same technical point + near-identical options) already exists in any `domain-<D>.json`:
  - **Duplicate:** add `"final-pool"` to the existing entry's `sources`. Do NOT create a new entry.
  - **New:** append to `src/data/questions/final-pool.json` with id `final-q<NNN>` (001-based, PDF order).

- [ ] **Step 4: Validate.** Run `npx vitest run` (content test enforces unique ids and schema) and `npm run build`. Also sanity-check: `finalPool()` (Task 8) should return ≥60 questions total — if fewer, the exam simulator cannot sample 60; recount the extraction.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "content: scenarios and final exam pool (deduped)"
```

---

### Task 18: Static pages — cover/TOC, domain briefs, lessons, scenarios

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/manual/[domain]/index.astro`, `src/pages/manual/[domain]/[chapter].astro`, `src/pages/scenarios/[id].astro`, `src/components/islands/LessonFooter.tsx`

- [ ] **Step 1: Rewrite `src/pages/index.astro`** — cover + full table of contents from collections:

```astro
---
import { getCollection } from "astro:content";
import ManualLayout from "../layouts/ManualLayout.astro";

const domains = (await getCollection("domains")).sort((a, b) => a.data.domain - b.data.domain);
const lessons = (await getCollection("lessons")).sort((a, b) => a.data.chapter - b.data.chapter);
const scenarios = (await getCollection("scenarios")).sort((a, b) => a.data.order - b.data.order);
---
<ManualLayout title="Cover" description="A field manual for the Claude certification: 18 lessons, 200+ practice questions, scenarios, and a full 60-question exam simulator.">
  <section class="prose">
    <span class="section-no">DOC. AFM-CCAF-2026 · REV A</span>
    <h1 style="font-size:3rem">The Agent Field Manual</h1>
    <p style="font-size:1.15rem">
      Operating instructions for Claude agents. Study the manual, run the drills,
      pass the certification. Free, no account, your progress stays in your browser.
    </p>
    <p>
      <a class="btn" href={`/manual/1`} style="text-decoration:none">Open § 1.0</a>
      <a class="btn ghost" href="/exam" style="text-decoration:none">Exam simulator</a>
    </p>
  </section>

  <section id="contents" style="margin-top:4rem">
    <h2><span class="section-no">INDEX</span>Table of Contents</h2>
    {domains.map((d) => (
      <div class="rule-row">
        <a href={`/manual/${d.data.domain}`} style="font-weight:600; text-decoration:none">
          <span class="mono" style="color:var(--accent)">§ {d.data.domain}.0</span> {d.data.title}
        </a>
        <ul style="list-style:none; padding-left:2.2rem; margin:.4rem 0 0">
          {lessons.filter((l) => l.data.domain === d.data.domain).map((l) => (
            <li>
              <a href={`/manual/${l.data.domain}/${l.id.split("/")[1]}`}>
                <span class="mono">§ {l.data.section}</span> {l.data.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ))}
    <div class="rule-row">
      <span class="mono" style="color:var(--accent)">§ 6.0</span> <strong>Scenario deep-dives</strong>
      <ul style="list-style:none; padding-left:2.2rem; margin:.4rem 0 0">
        {scenarios.map((s) => (
          <li><a href={`/scenarios/${s.data.order}`}><span class="mono">§ 6.{s.data.order}</span> {s.data.title}</a></li>
        ))}
      </ul>
    </div>
  </section>
</ManualLayout>
```

- [ ] **Step 2: Write `src/pages/manual/[domain]/index.astro`** — domain brief + objectives + chapter list + practice quiz entry point:

```astro
---
import { getCollection, render } from "astro:content";
import ManualLayout from "../../../layouts/ManualLayout.astro";
import QuizEngine from "../../../components/islands/QuizEngine";
import DomainGauge from "../../../components/islands/DomainGauge";
import { practiceQuestions } from "../../../lib/question-bank";

export async function getStaticPaths() {
  const domains = await getCollection("domains");
  return domains.map((d) => ({ params: { domain: String(d.data.domain) }, props: { entry: d } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const lessons = (await getCollection("lessons", (l) => l.data.domain === entry.data.domain))
  .sort((a, b) => a.data.chapter - b.data.chapter);
const questions = practiceQuestions(entry.data.domain);
---
<ManualLayout title={entry.data.title} description={entry.data.summary}>
  <article class="prose">
    <span class="section-no">§ {entry.data.domain}.0</span>
    <h1>{entry.data.title}</h1>
    <DomainGauge client:load domain={entry.data.domain} questionIds={questions.map((q) => q.id)} />
    <Content />
    <h2>Official exam objectives</h2>
    <ul>{entry.data.objectives.map((o) => <li>{o}</li>)}</ul>
    <h2>Chapters</h2>
    <ul style="list-style:none; padding:0">
      {lessons.map((l) => (
        <li class="rule-row">
          <a href={`/manual/${l.data.domain}/${l.id.split("/")[1]}`}>
            <span class="mono">§ {l.data.section}</span> {l.data.title}
          </a>
        </li>
      ))}
    </ul>
  </article>
  <section style="margin-top:4rem">
    <h2><span class="section-no">DRILL</span>Practice quiz — {questions.length} questions</h2>
    <QuizEngine client:visible questions={questions} />
  </section>
</ManualLayout>
```

(`DomainGauge` and `QuizEngine` are created in Tasks 19–20 — this page won't compile until then; Tasks 18–20 are committed together if needed, or stub components created first. **To keep every commit green:** create minimal stubs now:)

```tsx
// src/components/islands/QuizEngine.tsx  (stub — replaced in Task 19)
import type { Question } from "../../lib/question-schema";
export default function QuizEngine({ questions }: { questions: Question[] }) {
  return <p className="mono">Quiz loading… ({questions.length} questions)</p>;
}
```

```tsx
// src/components/islands/DomainGauge.tsx  (stub — replaced in Task 21)
export default function DomainGauge(_props: { domain: number; questionIds: string[] }) {
  return null;
}
```

- [ ] **Step 3: Write `src/pages/manual/[domain]/[chapter].astro`**:

```astro
---
import { getCollection, render } from "astro:content";
import ManualLayout from "../../../layouts/ManualLayout.astro";
import LessonFooter from "../../../components/islands/LessonFooter";

export async function getStaticPaths() {
  const lessons = await getCollection("lessons");
  return lessons.map((l) => ({
    params: { domain: String(l.data.domain), chapter: l.id.split("/")[1] },
    props: { entry: l },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<ManualLayout title={entry.data.title} description={entry.data.summary}>
  <article class="prose">
    <span class="section-no">§ {entry.data.section}</span>
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
  <LessonFooter client:visible lessonId={entry.id} domain={entry.data.domain} />
</ManualLayout>
```

- [ ] **Step 4: Write `src/components/islands/LessonFooter.tsx`** — mark-as-read + stamp:

```tsx
import { useStore } from "@nanostores/react";
import { $progress, readLesson } from "../../stores/progress-store";

export default function LessonFooter({ lessonId, domain }: { lessonId: string; domain: number }) {
  const progress = useStore($progress);
  const read = progress.lessonsRead.includes(lessonId);
  return (
    <div style={{ marginTop: "3rem", display: "flex", alignItems: "center", gap: "1rem" }}>
      {read ? (
        <span className="mono" style={{ color: "var(--stamp-red)", border: "2px solid var(--stamp-red)",
          padding: ".2rem .6rem", transform: "rotate(-4deg)", fontSize: ".7rem", letterSpacing: ".18em" }}>
          LOGGED
        </span>
      ) : (
        <button className="btn" onClick={() => readLesson(lessonId)}>Log this chapter as read</button>
      )}
      <a href={`/manual/${domain}`}>Back to § {domain}.0</a>
    </div>
  );
}
```

- [ ] **Step 5: Write `src/pages/scenarios/[id].astro]`**:

```astro
---
import { getCollection, render } from "astro:content";
import ManualLayout from "../../layouts/ManualLayout.astro";

export async function getStaticPaths() {
  const scenarios = await getCollection("scenarios");
  return scenarios.map((s) => ({ params: { id: String(s.data.order) }, props: { entry: s } }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<ManualLayout title={entry.data.title} description={entry.data.summary}>
  <article class="prose">
    <span class="section-no">§ 6.{entry.data.order}</span>
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
</ManualLayout>
```

- [ ] **Step 6: Verify build + commit**

Run: `npm run build` — Expected: all pages generate (5 domain pages, 18 lessons, 6 scenarios).

```bash
git add -A && git commit -m "feat: static pages — TOC, domain briefs, lessons, scenarios"
```

---

### Task 19: QuizEngine island

**Files:**
- Replace stub: `src/components/islands/QuizEngine.tsx`

Behavior: shuffled options; select → immediate correct/incorrect + explanation; every answer recorded via `answer()` (feeds SRS); summary screen with score and a **Retry missed only** loop.

- [ ] **Step 1: Write the full `src/components/islands/QuizEngine.tsx`**

```tsx
import { useMemo, useState } from "react";
import type { Question } from "../../lib/question-schema";
import { mulberry32, shuffle, shuffleOptions } from "../../lib/rng";
import { answer } from "../../stores/progress-store";

interface Props { questions: Question[] }

export default function QuizEngine({ questions }: Props) {
  const [runIds, setRunIds] = useState<string[] | null>(null); // null = not started
  const [seed, setSeed] = useState(1);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const run = runIds?.map((id) => byId.get(id)!).filter(Boolean) ?? [];
  const q = run[index];
  const shuffled = useMemo(
    () => (q ? shuffleOptions(q, mulberry32(seed * 1000 + index)) : null),
    [q, seed, index],
  );

  function start(ids: string[]) {
    setRunIds(shuffle(ids, mulberry32(seed)));
    setIndex(0); setSelected(null); setMissed([]); setCorrectCount(0);
  }

  function choose(pos: number) {
    if (selected !== null || !q || !shuffled) return;
    setSelected(pos);
    const correct = pos === shuffled.correctPosition;
    answer(q.id, correct);
    if (correct) setCorrectCount((c) => c + 1);
    else setMissed((m) => [...m, q.id]);
  }

  if (!runIds) {
    return <button className="btn" onClick={() => start(questions.map((x) => x.id))}>
      Start drill · {questions.length} questions
    </button>;
  }

  if (!q) {
    // finished
    return (
      <div className="rule-row">
        <p className="mono" style={{ fontSize: "1.4rem" }}>
          {correctCount}/{run.length || runIds.length} correct
        </p>
        {missed.length > 0 && (
          <button className="btn" onClick={() => { setSeed((s) => s + 1); start(missed); }}>
            Retry the {missed.length} missed
          </button>
        )}{" "}
        <button className="btn ghost" onClick={() => { setSeed((s) => s + 1); start(questions.map((x) => x.id)); }}>
          Restart full drill
        </button>
      </div>
    );
  }

  const revealed = selected !== null;
  return (
    <div>
      <p className="mono" style={{ fontSize: ".72rem", letterSpacing: ".1em" }}>
        ITEM {index + 1} / {run.length} · § {q.domain}.0
      </p>
      <p style={{ fontSize: "1.05rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
      <ol style={{ listStyle: "lower-alpha", paddingLeft: "1.6rem", maxWidth: "var(--measure)" }}>
        {shuffled!.options.map((opt, pos) => {
          const isCorrect = revealed && pos === shuffled!.correctPosition;
          const isWrongPick = revealed && pos === selected && !isCorrect;
          return (
            <li key={pos} style={{ margin: ".45rem 0" }}>
              <button
                onClick={() => choose(pos)}
                disabled={revealed}
                style={{
                  font: "inherit", textAlign: "left", cursor: revealed ? "default" : "pointer",
                  background: isCorrect ? "var(--accent-soft)" : "transparent",
                  border: "none", padding: ".15rem .3rem", width: "100%",
                  color: isWrongPick ? "var(--stamp-red)" : "inherit",
                  textDecoration: isWrongPick ? "line-through" : "none",
                }}
              >
                {opt} {isCorrect ? "✓" : isWrongPick ? "✗" : ""}
              </button>
            </li>
          );
        })}
      </ol>
      {revealed && (
        <div style={{ borderLeft: "3px solid var(--accent)", padding: ".3rem 1rem", maxWidth: "var(--measure)" }}>
          <p style={{ margin: 0 }}>{q.explanation}</p>
          <button className="btn" style={{ marginTop: ".8rem" }}
            onClick={() => { setIndex((i) => i + 1); setSelected(null); }}>
            {index + 1 < run.length ? "Next item" : "Finish drill"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`, open `/manual/1`, run the quiz: options shuffle, wrong pick strikes through, explanation shows, "retry missed" loop works, and `localStorage["afm:v1"]` updates after each answer.

- [ ] **Step 3: Run full test suite** — `npx vitest run` — Expected: PASS (guards against regressions in lib usage).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: QuizEngine island with retry-missed loop"
```

---

### Task 20: ExamSimulator island + /exam page

**Files:**
- Create: `src/components/islands/ExamSimulator.tsx`, `src/pages/exam.astro`

Behavior: setup screen → 60 questions (balanced sample from `finalPool()`), 90-min countdown persisted as a deadline (reload = resume), free navigation, no feedback until submit; results by domain with links back to lessons; results recorded to progress (feeds SRS) and exam history.

- [ ] **Step 1: Write `src/pages/exam.astro`**

```astro
---
import ManualLayout from "../layouts/ManualLayout.astro";
import ExamSimulator from "../components/islands/ExamSimulator";
import { finalPool } from "../lib/question-bank";
const pool = finalPool();
---
<ManualLayout title="Exam Simulator" description="A timed 60-question CCAF exam simulator with per-domain scoring." examRoom>
  <section>
    <span class="section-no">EXAMINATION ROOM</span>
    <h1>Final Exam Simulator</h1>
    <ExamSimulator client:load pool={pool} />
  </section>
</ManualLayout>
```

- [ ] **Step 2: Write `src/components/islands/ExamSimulator.tsx`**

```tsx
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import type { Question } from "../../lib/question-schema";
import { buildExam } from "../../lib/exam-builder";
import { mulberry32 } from "../../lib/rng";
import { scoreExam, type ExamResult } from "../../lib/scoring";
import { $examSession, type ExamSession } from "../../stores/exam-session";
import { answer as recordAnswer, saveExam } from "../../stores/progress-store";

const EXAM_SIZE = 60;
const EXAM_MINUTES = 90;

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function ExamSimulator({ pool }: { pool: Question[] }) {
  const session = useStore($examSession);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<ExamResult | null>(null);
  const [cursor, setCursor] = useState(0);

  const byId = useMemo(() => new Map(pool.map((q) => [q.id, q])), [pool]);
  const questions = useMemo(
    () => session?.questionIds.map((id) => byId.get(id)!).filter(Boolean) ?? [],
    [session, byId],
  );

  useEffect(() => {
    if (!session || result) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [session, result]);

  const remaining = session ? session.deadline - now : 0;

  useEffect(() => {
    if (session && !result && remaining <= 0) submit(); // time up → auto-submit
  }, [remaining, session, result]);

  function start() {
    const seed = (Date.now() % 2 ** 31) | 0;
    const exam = buildExam(pool, EXAM_SIZE, mulberry32(seed));
    $examSession.set({
      questionIds: exam.map((q) => q.id),
      answers: {},
      deadline: Date.now() + EXAM_MINUTES * 60_000,
      seed,
    });
    setResult(null); setCursor(0);
  }

  function pick(qid: string, idx: number) {
    if (!session) return;
    $examSession.set({ ...session, answers: { ...session.answers, [qid]: idx } });
  }

  function submit() {
    if (!session) return;
    const r = scoreExam(questions, session.answers, new Date().toISOString().slice(0, 10));
    for (const [qid, correct] of Object.entries(r.perQuestion)) recordAnswer(qid, correct);
    saveExam({ date: r.date, score: r.score, total: r.total, byDomain: r.byDomain });
    setResult(r);
    $examSession.set(null);
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div>
        <p className="mono" style={{ fontSize: "2rem" }}>{result.score}/{result.total} · {pct}%</p>
        <table className="mono" style={{ borderCollapse: "collapse", fontSize: ".85rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>DOMAIN</th><th>SCORE</th></tr></thead>
          <tbody>
            {Object.entries(result.byDomain).map(([d, s]) => (
              <tr key={d}>
                <td style={{ paddingRight: "2rem" }}><a href={`/manual/${d}`}>§ {d}.0</a></td>
                <td>{s.correct}/{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Missed questions were added to your <a href="/review">review deck</a>.</p>
        <button className="btn" onClick={start}>Take another exam</button>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <p style={{ maxWidth: "var(--measure)" }}>
          {EXAM_SIZE} questions sampled from a pool of {pool.length}, balanced across all five domains.
          {" "}{EXAM_MINUTES} minutes. No feedback until you submit — just like the real thing.
        </p>
        <button className="btn" onClick={start} disabled={pool.length < EXAM_SIZE}>Begin examination</button>
      </div>
    );
  }

  const q = questions[cursor];
  const answered = Object.keys(session.answers).length;
  return (
    <div>
      <p className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem" }}>
        <span>ITEM {cursor + 1}/{questions.length} · {answered} ANSWERED</span>
        <span style={{ color: remaining < 5 * 60_000 ? "var(--stamp-red)" : "var(--panel-glow)" }}>
          T-{fmt(remaining)}
        </span>
      </p>
      <p style={{ fontSize: "1.05rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
      <ol style={{ listStyle: "lower-alpha", paddingLeft: "1.6rem", maxWidth: "var(--measure)" }}>
        {q.options.map((opt, i) => (
          <li key={i} style={{ margin: ".45rem 0" }}>
            <label style={{ cursor: "pointer" }}>
              <input type="radio" name={q.id} checked={session.answers[q.id] === i}
                onChange={() => pick(q.id, i)} /> {opt}
            </label>
          </li>
        ))}
      </ol>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button className="btn ghost" disabled={cursor === 0} onClick={() => setCursor((c) => c - 1)}>Prev</button>
        <button className="btn ghost" disabled={cursor === questions.length - 1} onClick={() => setCursor((c) => c + 1)}>Next</button>
        <button className="btn" onClick={() => { if (confirm(`Submit with ${answered}/${questions.length} answered?`)) submit(); }}>
          Submit exam
        </button>
      </div>
      <nav className="mono" style={{ marginTop: "1.2rem", display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setCursor(i)} title={`Item ${i + 1}`}
            style={{
              width: 26, height: 22, fontSize: ".6rem", cursor: "pointer",
              border: "1px solid var(--panel-glow)",
              background: i === cursor ? "var(--panel-glow)" : session.answers[qq.id] !== undefined ? "#e8a13c55" : "transparent",
              color: i === cursor ? "var(--panel)" : "inherit",
            }}>{i + 1}</button>
        ))}
      </nav>
    </div>
  );
}
```

Note: exam options are intentionally NOT shuffled per-render (order must stay stable while navigating). The pool order was already shuffled by `buildExam`.

- [ ] **Step 3: Verify manually**

Run: `npm run dev` → `/exam`. Check: dark exam-room theme; begin exam; answer a few; **reload the page** — same questions, same answers, timer continued. Submit → per-domain table; `afm:v1` examHistory has the record; `/review` questions include the missed ones (after Task 21). Timer color turns red under 5 minutes.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: exam simulator with resumable timed sessions"
```

---

### Task 21: ReviewDeck island + /review page + DomainGauge

**Files:**
- Create: `src/components/islands/ReviewDeck.tsx`, `src/pages/review.astro`
- Replace stub: `src/components/islands/DomainGauge.tsx`

- [ ] **Step 1: Write `src/pages/review.astro`**

```astro
---
import ManualLayout from "../layouts/ManualLayout.astro";
import ReviewDeck from "../components/islands/ReviewDeck";
---
<ManualLayout title="Review Deck" description="Spaced-repetition review of every question you have missed.">
  <section>
    <span class="section-no">MAINTENANCE SCHEDULE</span>
    <h1>Review Deck</h1>
    <p class="prose">Every question you miss anywhere in the manual is scheduled here: 1, 3, 7, 16, then 35 days out. Clear the queue daily.</p>
    <ReviewDeck client:load />
  </section>
</ManualLayout>
```

- [ ] **Step 2: Write `src/components/islands/ReviewDeck.tsx`**

```tsx
import { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { $progress, answer } from "../../stores/progress-store";
import { dueQuestionIds } from "../../lib/progress";
import { questionById } from "../../lib/question-bank";
import { mulberry32, shuffleOptions } from "../../lib/rng";

export default function ReviewDeck() {
  const progress = useStore($progress);
  const [sessionDone, setSessionDone] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const due = useMemo(
    () => dueQuestionIds(progress, new Date()).filter((id) => !sessionDone.includes(id) && questionById.has(id)),
    [progress, sessionDone],
  );

  const q = due.length > 0 ? questionById.get(due[0])! : null;
  const shuffled = useMemo(
    () => (q ? shuffleOptions(q, mulberry32(q.id.length * 7919 + sessionDone.length)) : null),
    [q, sessionDone.length],
  );

  if (!q || !shuffled) {
    return <p className="mono" style={{ fontSize: "1.1rem" }}>
      {sessionDone.length > 0 ? `Queue cleared — ${sessionDone.length} card(s) reviewed. ` : ""}
      Nothing due. Come back tomorrow.
    </p>;
  }

  const revealed = selected !== null;
  function choose(pos: number) {
    if (revealed) return;
    setSelected(pos);
    answer(q!.id, pos === shuffled!.correctPosition);
  }

  return (
    <div>
      <p className="mono" style={{ fontSize: ".72rem", letterSpacing: ".1em" }}>
        {due.length} CARD(S) DUE · § {q.domain}.0
      </p>
      <p style={{ fontSize: "1.05rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
      <ol style={{ listStyle: "lower-alpha", paddingLeft: "1.6rem", maxWidth: "var(--measure)" }}>
        {shuffled.options.map((opt, pos) => {
          const isCorrect = revealed && pos === shuffled.correctPosition;
          const isWrongPick = revealed && pos === selected && !isCorrect;
          return (
            <li key={pos} style={{ margin: ".45rem 0" }}>
              <button onClick={() => choose(pos)} disabled={revealed}
                style={{ font: "inherit", textAlign: "left", width: "100%", border: "none", padding: ".15rem .3rem",
                  cursor: revealed ? "default" : "pointer",
                  background: isCorrect ? "var(--accent-soft)" : "transparent",
                  color: isWrongPick ? "var(--stamp-red)" : "inherit" }}>
                {opt} {isCorrect ? "✓" : isWrongPick ? "✗" : ""}
              </button>
            </li>
          );
        })}
      </ol>
      {revealed && (
        <div style={{ borderLeft: "3px solid var(--accent)", padding: ".3rem 1rem", maxWidth: "var(--measure)" }}>
          <p style={{ margin: 0 }}>{q.explanation}</p>
          <button className="btn" style={{ marginTop: ".8rem" }}
            onClick={() => { setSessionDone((d) => [...d, q.id]); setSelected(null); }}>
            Next card
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/components/islands/DomainGauge.tsx` stub** — real gauge fed by progress:

```tsx
import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import Gauge from "./Gauge";

export default function DomainGauge({ domain, questionIds }: { domain: number; questionIds: string[] }) {
  const progress = useStore($progress);
  const mastered = questionIds.filter((id) => progress.answers[id]?.lastCorrect).length;
  const pct = questionIds.length === 0 ? 0 : (mastered / questionIds.length) * 100;
  return <Gauge value={pct} label={`§ ${domain}.0 mastery`} />;
}
```

- [ ] **Step 4: Verify manually** — miss a question in a domain drill, open `/review`: the card is due (box 0, due tomorrow — to see it today, temporarily miss it "yesterday" by editing `afm:v1` due date in devtools, or accept that box-0 cards appear next day). Answer it; queue advances. Domain gauge moves after correct answers.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: SRS review deck and live domain gauges"
```

---

### Task 22: Progress dashboard

**Files:**
- Create: `src/pages/progress.astro`, `src/components/islands/ProgressPanel.tsx`

- [ ] **Step 1: Write `src/pages/progress.astro`**

```astro
---
import ManualLayout from "../layouts/ManualLayout.astro";
import ProgressPanel from "../components/islands/ProgressPanel";
import { getCollection } from "astro:content";
import { allQuestions } from "../lib/question-bank";

const lessons = await getCollection("lessons");
const lessonMeta = lessons.map((l) => ({ id: l.id, domain: l.data.domain, title: l.data.title, section: l.data.section }));
const questionMeta = allQuestions.map((q) => ({ id: q.id, domain: q.domain }));
---
<ManualLayout title="Progress" description="Your study log: domain mastery gauges, exam history, and review queue.">
  <section>
    <span class="section-no">FLIGHT LOG</span>
    <h1>Progress</h1>
    <ProgressPanel client:load lessonMeta={lessonMeta} questionMeta={questionMeta} />
  </section>
</ManualLayout>
```

- [ ] **Step 2: Write `src/components/islands/ProgressPanel.tsx`**

```tsx
import { useRef } from "react";
import { useStore } from "@nanostores/react";
import { $progress, exportProgress, importProgress, resetProgress } from "../../stores/progress-store";
import { dueQuestionIds } from "../../lib/progress";
import Gauge from "./Gauge";

interface Props {
  lessonMeta: { id: string; domain: number; title: string; section: string }[];
  questionMeta: { id: string; domain: number }[];
}

export default function ProgressPanel({ lessonMeta, questionMeta }: Props) {
  const progress = useStore($progress);
  const fileRef = useRef<HTMLInputElement>(null);
  const due = dueQuestionIds(progress, new Date()).length;

  function download() {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `afm-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(file: File) {
    try {
      importProgress(await file.text());
      alert("Progress imported.");
    } catch {
      alert("That file is not a valid AFM progress export.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", margin: "1.5rem 0" }}>
        {[1, 2, 3, 4, 5].map((d) => {
          const qs = questionMeta.filter((q) => q.domain === d);
          const mastered = qs.filter((q) => progress.answers[q.id]?.lastCorrect).length;
          return <Gauge key={d} value={qs.length ? (mastered / qs.length) * 100 : 0} label={`§ ${d}.0`} />;
        })}
      </div>

      <p className="mono">{due} card(s) due in the <a href="/review">review deck</a>.</p>

      <h2>Chapters logged</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {lessonMeta.sort((a, b) => a.section.localeCompare(b.section)).map((l) => (
          <li key={l.id} className="rule-row mono" style={{ fontSize: ".8rem" }}>
            {progress.lessonsRead.includes(l.id) ? "■" : "□"} § {l.section} {l.title}
          </li>
        ))}
      </ul>

      <h2>Exam history</h2>
      {progress.examHistory.length === 0 ? (
        <p>No exams yet. <a href="/exam">Take the simulator.</a></p>
      ) : (
        <table className="mono" style={{ borderCollapse: "collapse", fontSize: ".85rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>DATE</th><th>SCORE</th></tr></thead>
          <tbody>
            {progress.examHistory.map((e, i) => (
              <tr key={i}><td style={{ paddingRight: "2rem" }}>{e.date}</td><td>{e.score}/{e.total}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Data</h2>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        <button className="btn" onClick={download}>Export progress</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>Import progress</button>
        <button className="btn ghost" onClick={() => { if (confirm("Erase all local progress?")) resetProgress(); }}>Reset</button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      <p style={{ fontSize: ".85rem", maxWidth: "var(--measure)" }}>
        Progress lives only in this browser. Export before switching devices.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify manually** — gauges reflect drill results; export downloads a JSON; import of that JSON works; import of a garbage file shows the error alert; reset clears after confirm.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: progress dashboard with gauges, history, export/import"
```

---

### Task 23: SEO, README, deploy

**Files:**
- Create: `README.md`, `public/favicon.svg`
- Modify: `src/layouts/ManualLayout.astro` (OG tags), `astro.config.mjs` (sitemap optional — skip, YAGNI)

- [ ] **Step 1: Add OG/meta tags to `ManualLayout.astro` head** (insert after the `<title>` line):

```astro
    <meta property="og:title" content={`${title} · The Agent Field Manual`} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 2: Write `public/favicon.svg`** — a mono "§" on paper:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#f2ecdd"/>
  <text x="16" y="23" font-family="monospace" font-size="20" font-weight="600" fill="#c2531d" text-anchor="middle">§</text>
</svg>
```

- [ ] **Step 3: Write `README.md`** — project pitch (what it is, stack, architecture diagram, screenshots placeholder to fill after deploy, `npm run dev` instructions). Written as a portfolio-facing README in English, authored by Yhonaiker.

- [ ] **Step 4: Full verification**

Run: `npm run build` (runs the whole test suite via prebuild, then builds every page) and `npm run preview` — click through: cover → domain → lesson → drill → exam → review → progress.
Expected: no console errors, all routes render.

- [ ] **Step 5: Commit and deploy**

```bash
git add -A && git commit -m "feat: SEO meta, favicon, README"
```

Deploy: create a GitHub repo under `yhonaMC` (`gh repo create agent-field-manual --public --source . --push` — HTTPS remote, gh is authenticated as yhonaMC), then import into Vercel (user action: vercel.com → New Project → import repo; framework auto-detected as Astro). Alternative: `npx vercel` CLI if the user prefers.

- [ ] **Step 6: Post-deploy check** — open the production URL, run one full drill and one exam; verify localStorage persists across reloads.

---

## Self-review notes (already applied)

- **Spec coverage:** lessons ✓ (T12–16, 18), quizzes ✓ (T19), exam simulator ✓ (T20 — balanced sampling per spec's fallback rule: proportional to pool share), SRS ✓ (T4, T21), scenarios ✓ (T17, T18), progress + export/import ✓ (T5, T22), exam-room dark mode ✓ (T10, T20), resumable timer ✓ (T9, T20), corrupted-storage fallback ✓ (T9 decode try/catch), build-time content validation ✓ (T8 + prebuild), paraphrase-for-copyright ✓ (extraction procedure).
- **Type consistency:** `answer()` store action used by QuizEngine/ReviewDeck/ExamSimulator (aliased `recordAnswer` locally in T20 to avoid shadowing); `ExamRecord.byDomain` keys are strings (Zod record) — scoring and UI both treat them as strings; `ShuffledOptions.correctPosition` used consistently.
- **Known deliberate choices:** exam options unshuffled during navigation (stability); first-try-correct questions never enter SRS (spec: only missed questions enter the queue); `confirm()`/`alert()` used for destructive/failure UX (YAGNI over modal components).
