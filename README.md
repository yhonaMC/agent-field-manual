# The Agent Field Manual

A free, open study manual for the Claude Certified Agent Fluency (CCAF) exam — styled as a 1970s technical field manual.

**Live:** [https://agent-field-manual.vercel.app](https://agent-field-manual.vercel.app) *(update if domain changes)*

## Features

- **18 lessons** across 5 domains, written as numbered field-manual sections
- **190+ practice questions** with worked explanations
- **Per-domain drills** with a retry-missed loop, so weak spots get repeated until cleared
- **60-question timed exam simulator** — resumable, with per-domain scoring at the end
- **Spaced-repetition review deck** on a 1 / 3 / 7 / 16 / 35-day ladder
- **Scenario deep-dives** for applied, judgment-call style questions
- **Analog-gauge progress dashboard** — needle-and-dial visualizations instead of progress bars
- **Progress export / import** as a portable file

No accounts, no backend, no tracking. Everything lives in `localStorage`.

## Design

The manual leans fully into a retro technical-document identity: cream paper backgrounds, navy ink typography, mil-spec `§`-numbered sections, and a dedicated dark "exam room" mode for timed runs. All styling is hand-built CSS — no UI component libraries, no CSS frameworks.

## Architecture

```
content/*.mdx  ─┐
                ├─► Zod-validated question bank ─► Astro static pages + React islands ─► nanostores → localStorage
questions.json ─┘
```

- Content collections (MDX lessons) and the JSON question bank are validated at build time — the build fails on any malformed question, so bad content can never ship.
- Core logic is unit-tested in isolation: the spaced-repetition scheduler, the exam sampler, and the scoring engine.

## Tech stack

- [Astro](https://astro.build) (static site generation, content collections)
- [React](https://react.dev) (interactive islands: drills, exam, review deck, dashboard)
- [nanostores](https://github.com/nanostores/nanostores) (state, persisted to `localStorage`)
- [Zod](https://zod.dev) (question bank + content schema validation)
- [Vitest](https://vitest.dev) (unit tests)
- TypeScript throughout

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # static build (runs tests first, then builds)
npm test         # unit tests
```

## Screenshots

<!-- screenshots after deploy -->
