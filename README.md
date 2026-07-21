# AgentPrep

Una guía de estudio gratuita y de código abierto para la certificación de agentes de Claude (CCAF). Interfaz en español, contenido de lecciones en inglés (como el examen real).

**Demo:** [https://agent-field-manual.vercel.app](https://agent-field-manual.vercel.app) *(actualiza si cambia el dominio)*

## Features

- **18 lessons** across 5 domains, written as numbered field-manual sections
- **190+ practice questions** with worked explanations
- **Per-domain drills** with a retry-missed loop and progressive unlocking (pass one domain at 70%+ to open the next; final exam unlocks after all five)
- **60-question timed exam simulator** — resumable, with per-domain scoring at the end
- **Spaced-repetition review deck** on a 1 / 3 / 7 / 16 / 35-day ladder
- **Scenario deep-dives** for applied, judgment-call style questions
- **Analog-gauge progress dashboard** — needle-and-dial visualizations instead of progress bars
- **Progress export / import** as a portable file

No accounts, no backend, no tracking. Everything lives in `localStorage`.

## Diseño

Diseño editorial moderno: fondo claro cálido, tinta navy, acento naranja quemado, títulos en serif (Crimson Pro) y cuerpo en sans (Inter). Modo claro y oscuro con toggle, persistido en `localStorage` y sin flash al cargar. Todo el CSS está hecho a mano — sin librerías de componentes ni frameworks de CSS.

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
