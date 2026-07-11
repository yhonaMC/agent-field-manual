# The Agent Field Manual — Design Spec

**Date:** 2026-07-10
**Status:** Approved by user
**Owner:** Yhonaiker Moncada

## 1. What this is

A public, English-language, static study site for the Claude certification (CCAF).
Content is sourced from the user's personal study material (PDF exports located at
`C:\Users\pc\OneDrive\Desktop\claude cetificacion`), **rewritten/paraphrased during
extraction** so the published content is original wording (no verbatim Witi course
text). The site is also a portfolio piece.

Working name: **The Agent Field Manual** (project folder: `agent-field-manual`).

## 2. Scope decisions (locked)

- **Audience:** public, no accounts. All progress stored in `localStorage`.
- **Language:** UI and content 100% English.
- **No backend.** Fully static deploy (Vercel).
- **Features:** domain lessons, per-domain practice quizzes, 60-question final exam
  simulator, spaced-repetition review (SRS). Scenarios included as deep-dive reading.
- **Content attribution:** published as the user's own study guide; all question
  stems, options, and explanations are paraphrased/rewritten, never copied verbatim.

## 3. Source material inventory

- 5 domains, each with: overview PDF, exam-objectives PDF, chapters (18 chapters
  total: D1 ch01–05, D2 ch06–08, D3 ch09–12, D4 ch13–16, D5 ch17–18), and 2–3
  practice quiz PDFs (Moodle attempt reviews showing options, the chosen answer,
  correct/incorrect marks, and an explanation per question).
- `scenarios/`: 6 scenario PDFs + a "deep dive" PDF covering all 6.
- `examen final (pool completo).pdf`: the full final-exam question pool
  (60-question exam drawn from it).
- Estimated total: ~200+ unique questions after dedup across practice quizzes and
  the final pool.

## 4. Tech stack

- **Astro 5** (static output) + **React** islands + **TypeScript**.
- **nanostores** (+ `@nanostores/react`, `@nanostores/persistent`) for state and
  localStorage persistence.
- **MDX** via Astro content collections for lessons/scenarios; **JSON** collections
  for questions, validated with **Zod** at build time (build fails on bad data).
- **Custom CSS** (design tokens via custom properties, some SVG). No UI libraries,
  no Tailwind — the visual identity is hand-built.
- **Vitest** for pure logic (SRS scheduler, exam builder, scoring, shuffling).
- **Deploy:** Vercel free tier.

## 5. Visual design — "Retro-technical operations manual"

The site looks like a 1970s NASA/military field manual for operating AI agents:

- Cream textured paper background, navy ink, burnt-orange accents. Serif type for
  lesson prose (printed-manual feel), monospace for data/code/labels.
- Mil-spec section numbering: domains are `§ 1.0`, chapters `§ 1.3`; a real
  table-of-contents index page.
- Blueprint-style SVG diagrams for agent concepts (agent loop, orchestration,
  tool use).
- Progress rendered as physical artifacts: an angled ink-stamp "CERTIFIED" when a
  chapter is mastered; analog needle gauges for per-domain progress.
- **Exam room mode:** entering the final exam simulator inverts the theme to a dark
  control-panel look with a countdown timer. The contrast makes the exam feel serious.
- Microdetails: margin notes, print registration marks in corners, footer styled as
  a technical document "revision history".

## 6. Information architecture

Static pages (zero/minimal JS, SEO-indexable):

- `/` — landing + manual index (table of contents, progress summary)
- `/manual/[domain]` — domain index: overview, objectives, chapter list, gauge
- `/manual/[domain]/[chapter]` — lesson (MDX)
- `/scenarios/[id]` — scenario deep-dives
- `/progress` — dashboard (gauges, exam history, SRS due count, export/import)

React islands:

- **QuizEngine** — per-domain practice quiz. Options shuffled, immediate feedback
  with explanation, end-of-quiz "retry only missed" loop. Every answer feeds the
  progress store.
- **ExamSimulator** — 60 questions sampled from the final pool, balanced by domain.
  Domain weights come from the official exam-objectives PDFs if stated there;
  otherwise sampling is proportional to each domain's share of the pool. 90-minute
  countdown (single config constant); no feedback until submit;
  results broken down by domain with missed questions linked to their lessons.
- **ReviewDeck** — SRS queue. Simplified SM-2: intervals 1, 3, 7, 16, 35 days;
  any question missed anywhere enters the queue; dashboard shows cards due today.
- **ProgressGauges** — analog gauges + stamps on dashboard/domain pages.

## 7. Content pipeline (one-time, Claude-assisted)

```
PDFs ── read + paraphrase ──> src/content/
                              ├─ lessons/    18 chapters as MDX
                              ├─ domains/    5 overviews + exam objectives
                              ├─ scenarios/  6 deep-dive MDX
                              └─ questions/  JSON per domain + final pool
```

Question schema (Zod-validated):

```ts
{
  id: string,            // e.g. "d1-p1-q01", "final-q17"
  domain: 1 | 2 | 3 | 4 | 5,
  source: "practice-1" | "practice-2" | "practice-3" | "final-pool",
  stem: string,          // paraphrased
  options: string[],     // exactly 4, paraphrased
  correctIndex: number,  // 0-3
  explanation: string,   // paraphrased/improved
  tags: string[]
}
```

Near-duplicate questions across practice quizzes and the final pool are deduped
(kept once, tagged with all sources).

## 8. Progress data model (localStorage)

Single versioned key `afm:v1`:

```ts
{
  answers: {
    [questionId]: {
      attempts: number,
      lastCorrect: boolean,
      srs: { interval: number, due: string /* ISO date */, ease: number }
    }
  },
  lessonsRead: string[],          // chapter ids
  examHistory: [
    { date: string, score: number, byDomain: Record<1|2|3|4|5, {correct: number, total: number}> }
  ]
}
```

- Export/import progress as a JSON file (mitigates device loss).
- Storage writes go through one persistence module; schema version bumps get a
  migration function.

## 9. Error handling

- Build time: Zod rejects malformed question JSON → build fails loudly.
- Runtime: corrupted/missing localStorage falls back to a fresh state (never
  crashes); import validates the JSON against the same schema and rejects bad files
  with a visible message.
- Exam timer persists its deadline in the store, so a reload mid-exam resumes
  rather than resets.

## 10. Testing

- Vitest units for: SM-2 scheduler (interval progression, due-date math), exam
  builder (60 sampled, domain balance, no duplicates), scoring/domain breakdown,
  option shuffling (correct answer tracked), storage migration + import validation.
- Content: schema validation at build is the test.
- UI: manual verification against the design direction.

## 11. Out of scope (YAGNI)

- Accounts, cloud sync, backend of any kind.
- i18n/Spanish toggle.
- Authoring UI for questions (content is edited as files).
- Analytics beyond a privacy-friendly counter (optional, later).
