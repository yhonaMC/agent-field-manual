# AgentPrep Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand "The Agent Field Manual" as **AgentPrep**, replace the retro 1970s look with a clean modern-editorial design, add a light/dark theme toggle across the whole site, and make it obvious the site prepares you for the Claude certification — with a Spanish interface but English lesson content.

**Architecture:** The retro identity lives almost entirely in two CSS files (`tokens.css`, `global.css`) plus the layout chrome. The React islands read their colors from CSS custom properties (`--accent`, `--ink`, `--paper`, `--measure`, `--stamp-red`, `--ok`, `--panel-glow`). We therefore **keep those variable names and remap their values** — this makes most island inline styles "just work" under the new palette and under dark mode, so island edits are limited to (a) Spanish string translation, (b) removing `§`-notation from UI chrome, and (c) swapping the analog `Gauge` for a clean `ProgressRing`. A tiny testable `theme.ts` helper drives the toggle; an inline `<head>` script applies the saved theme before first paint to avoid a flash.

**Tech Stack:** Astro 5 (static), React 19 islands, nanostores + localStorage, CSS custom properties (no framework), Inter + Crimson Pro + IBM Plex Mono via `@fontsource`, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-21-agentprep-redesign-design.md`

---

## File Structure

**Created:**
- `src/lib/theme.ts` — pure theme-resolution helpers (testable)
- `tests/theme.test.ts` — unit tests for the helpers
- `src/components/islands/ProgressRing.tsx` — clean SVG progress ring (replaces `Gauge`)
- `src/components/ThemeScript.astro` — inline no-flash theme init + toggle wiring

**Modified:**
- `src/styles/tokens.css` — new light/dark palettes, keep variable names, add `--font-sans`
- `src/styles/global.css` — new component styles, remove retro chrome
- `src/layouts/ManualLayout.astro` — AgentPrep nav (ES + theme toggle), footer, drop `examRoom`
- `src/pages/index.astro` — new landing page
- `src/pages/manual/[domain]/index.astro` — restyle, ES
- `src/pages/manual/[domain]/[chapter].astro` — restyle, ES
- `src/pages/scenarios/[id].astro` — restyle, ES
- `src/pages/exam.astro` — drop `examRoom`, ES
- `src/pages/review.astro` — ES
- `src/pages/progress.astro` — ES
- `src/components/islands/ExamSimulator.tsx` — ES strings, drop `§`/panel-room chrome
- `src/components/islands/QuizEngine.tsx` — ES strings
- `src/components/islands/DrillGate.tsx` — ES strings
- `src/components/islands/ReviewDeck.tsx` — ES strings
- `src/components/islands/ProgressPanel.tsx` — ES strings, use `ProgressRing`
- `src/components/islands/DomainGauge.tsx` — use `ProgressRing`
- `src/components/islands/LessonFooter.tsx` — ES strings, drop rotated stamp
- `public/favicon.svg` — new mark
- `README.md` — new name + description

**Deleted:**
- `src/components/Stamp.astro` — retro-only, unused after this change
- `src/components/islands/Gauge.tsx` — replaced by `ProgressRing`

**Untouched (do not edit):** everything in `src/lib/` except the new `theme.ts`, everything in `src/content/`, everything in `src/data/`, `src/stores/`, and the existing `tests/*` files.

---

## Task 1: Theme helper (pure logic, TDD)

**Files:**
- Create: `src/lib/theme.ts`
- Test: `tests/theme.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/theme.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveInitialTheme, nextTheme, THEME_KEY } from "../src/lib/theme";

describe("resolveInitialTheme", () => {
  it("honors a stored light choice over system preference", () => {
    expect(resolveInitialTheme("light", true)).toBe("light");
  });
  it("honors a stored dark choice over system preference", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
  });
  it("uses system preference when nothing is stored", () => {
    expect(resolveInitialTheme(null, true)).toBe("dark");
    expect(resolveInitialTheme(null, false)).toBe("light");
  });
  it("ignores an invalid stored value and falls back to system", () => {
    expect(resolveInitialTheme("banana", true)).toBe("dark");
  });
});

describe("nextTheme", () => {
  it("toggles between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

describe("THEME_KEY", () => {
  it("is a stable localStorage key", () => {
    expect(THEME_KEY).toBe("agentprep-theme");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- theme.test.ts`
Expected: FAIL — cannot resolve `../src/lib/theme`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/theme.ts`:

```ts
export type Theme = "light" | "dark";

export const THEME_KEY = "agentprep-theme";

export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- theme.test.ts`
Expected: PASS (7 assertions across 3 describe blocks).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts tests/theme.test.ts
git commit -m "feat: theme resolution helper with tests"
```

---

## Task 2: Design tokens (light + dark palettes)

**Files:**
- Modify: `src/styles/tokens.css` (full replacement)

Variable names that islands depend on (`--accent`, `--accent-soft`, `--ok`, `--stamp-red`, `--panel-glow`, `--ink`, `--ink-soft`, `--ink-faint`, `--paper`, `--paper-deep`, `--measure`, `--font-mono`, `--font-prose`) are **kept**; only their values change, plus dark overrides.

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/styles/tokens.css` with:

```css
:root {
  /* surfaces & ink (light) */
  --paper: #fdfcf9;         /* page background */
  --paper-deep: #f4f1e9;    /* insets, code, subtle fills */
  --surface: #ffffff;       /* cards */
  --ink: #17233b;           /* primary text (navy) */
  --ink-2: #5b6472;         /* secondary text */
  --ink-3: #8a8478;         /* tertiary/label text */
  --border: #ece8de;        /* hairlines, card borders */

  /* legacy aliases kept so island inline styles keep working */
  --ink-soft: #8a847880;
  --ink-faint: #ece8de;

  /* accents */
  --accent: #b3541e;        /* burnt orange — primary accent */
  --accent-soft: #b3541e1a; /* tint behind correct answers */
  --badge-bg: #f3efe4;
  --badge-ink: #8a5a1f;
  --ok: #3f6b4f;            /* success / progress green */
  --stamp-red: #b3382c;     /* errors / wrong answers */
  --panel-glow: #b3541e;    /* legacy exam-room accent → now the accent */

  /* type */
  --font-sans: "Inter Variable", system-ui, -apple-system, Segoe UI, sans-serif;
  --font-prose: "Crimson Pro Variable", Georgia, serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* metrics */
  --measure: 68ch;
  --radius: 10px;
  --radius-sm: 8px;
  --rule: 1px solid var(--border);
  color-scheme: light;
}

html.dark {
  --paper: #12161f;
  --paper-deep: #1a2029;
  --surface: #1a2029;
  --ink: #e2e6ed;
  --ink-2: #8b95a5;
  --ink-3: #737d8c;
  --border: #232a38;

  --ink-soft: #8b95a580;
  --ink-faint: #232a38;

  --accent: #e0a45c;
  --accent-soft: #e0a45c22;
  --badge-bg: #1e2534;
  --badge-ink: #e0a45c;
  --ok: #5a9c74;
  --stamp-red: #e0736a;
  --panel-glow: #e0a45c;
  color-scheme: dark;
}
```

- [ ] **Step 2: Verify the build still compiles**

Run: `npm run build`
Expected: build succeeds (styling will look half-migrated until Task 3 — that's fine; we only need no errors). If `prebuild` runs the test suite, it should pass.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: new light/dark design tokens, keep legacy var names"
```

---

## Task 3: Global styles + fonts (remove retro chrome)

**Files:**
- Modify: `package.json` (add Inter font dependency)
- Modify: `src/styles/global.css` (full replacement)

- [ ] **Step 1: Add the Inter font dependency**

Run:

```bash
npm install @fontsource-variable/inter@^5.0.0
```

Expected: `@fontsource-variable/inter` appears under `dependencies` in `package.json`.

- [ ] **Step 2: Replace global.css**

Replace the entire contents of `src/styles/global.css` with:

```css
@import "./tokens.css";
@import "@fontsource-variable/inter";
@import "@fontsource-variable/crimson-pro";
@import "@fontsource/ibm-plex-mono/400.css";
@import "@fontsource/ibm-plex-mono/600.css";

* { box-sizing: border-box; }

html {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 18px;
  line-height: 1.65;
}
body { margin: 0; min-height: 100vh; }

h1, h2, h3 { font-family: var(--font-prose); line-height: 1.18; font-weight: 600; }

a { color: var(--accent); text-underline-offset: 3px; }
a:hover { text-decoration: underline; }

code, pre, .mono { font-family: var(--font-mono); font-size: 0.85em; }
pre { background: var(--paper-deep); border: var(--rule); border-radius: var(--radius-sm); padding: 1rem; overflow-x: auto; }

/* ── page frame ─────────────────────────────────── */
.sheet { max-width: 64rem; margin: 0 auto; padding: 0 1.25rem 5rem; }

.doc-header {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: .6rem 1rem;
  border-bottom: 1px solid var(--border);
  padding: 1rem 0; margin-bottom: 2.5rem;
}
.doc-header .brand { font-family: var(--font-prose); font-weight: 700; font-size: 1.2rem; color: var(--ink); text-decoration: none; }
.doc-header nav { display: flex; align-items: center; gap: 1.1rem; flex-wrap: wrap; }
.doc-header nav a { color: var(--ink-2); text-decoration: none; font-size: .92rem; font-weight: 500; }
.doc-header nav a:hover { color: var(--accent); }

.theme-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 999px;
  border: 1px solid var(--border); background: var(--surface);
  cursor: pointer; font-size: 1rem; line-height: 1; padding: 0;
}
.theme-toggle:hover { border-color: var(--accent); }

.doc-footer {
  margin-top: 4rem; padding-top: 1.25rem;
  border-top: 1px solid var(--border);
  font-size: .8rem; color: var(--ink-3);
  display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
}

/* ── labels & prose ─────────────────────────────── */
.section-no {
  display: inline-block; font-family: var(--font-sans);
  font-size: .72rem; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: var(--accent);
  margin-bottom: .5rem;
}
.prose { max-width: var(--measure); }
.prose h2, .prose h3 { margin-top: 2em; }
.rule-row { border-top: var(--rule); padding: .8rem 0; }

/* ── buttons ────────────────────────────────────── */
.btn {
  display: inline-block; font-family: var(--font-sans);
  font-size: .92rem; font-weight: 600; cursor: pointer;
  background: var(--ink); color: var(--paper);
  border: 1px solid var(--ink); border-radius: var(--radius-sm);
  padding: .6rem 1.15rem; text-decoration: none; line-height: 1.2;
}
.btn:hover { background: var(--accent); border-color: var(--accent); color: #fff; text-decoration: none; }
.btn.ghost { background: transparent; color: var(--ink); border-color: var(--border); }
.btn.ghost:hover { color: var(--accent); border-color: var(--accent); background: transparent; }
.btn.accent { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.accent:hover { filter: brightness(1.06); }
.btn:disabled { opacity: .45; cursor: not-allowed; }

/* ── cards & landing sections ───────────────────── */
.badge {
  display: inline-block; background: var(--badge-bg); color: var(--badge-ink);
  font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  padding: .35rem .8rem; border-radius: 999px;
}
.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 1.25rem;
}
.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
.grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }

.hero { text-align: center; max-width: 40rem; margin: 3.5rem auto 2.5rem; }
.hero h1 { font-size: 2.6rem; margin: 1rem 0 .75rem; }
.hero p.lead { font-size: 1.1rem; color: var(--ink-2); margin: 0 auto 1.5rem; }
.hero .actions { display: flex; gap: .6rem; justify-content: center; flex-wrap: wrap; }

.stats { display: flex; justify-content: center; flex-wrap: wrap;
  border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.stat { padding: 1rem 1.6rem; text-align: center; border-left: 1px solid var(--border); }
.stat:first-child { border-left: 0; }
.stat b { display: block; font-family: var(--font-prose); font-size: 1.5rem; }
.stat span { font-size: .8rem; color: var(--ink-3); }

.step-num {
  width: 30px; height: 30px; border-radius: 999px; background: var(--ink); color: var(--paper);
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .95rem;
}
.cta-card { border: 1px solid var(--border); border-radius: 14px; background: var(--paper-deep);
  padding: 2rem; text-align: center; }

.progressbar { height: 5px; background: var(--paper-deep); border-radius: 999px; overflow: hidden; }
.progressbar > span { display: block; height: 100%; background: var(--ok); border-radius: 999px; }
.locked { opacity: .55; }
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: build succeeds, no unresolved `@import`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/styles/global.css
git commit -m "feat: modern-editorial global styles + Inter font, drop retro chrome"
```

---

## Task 4: Theme init script + toggle wiring (no-flash)

**Files:**
- Create: `src/components/ThemeScript.astro`

This renders two inline scripts: one in `<head>` (runs before paint, sets the theme class) and a small module that wires the toggle button clicks. Both are framework-free so they run on every static page.

- [ ] **Step 1: Create the component**

Create `src/components/ThemeScript.astro`:

```astro
---
// Framework-free theme boot + toggle wiring. Must be placed in <head>.
// The first <script is:inline> runs before paint to avoid a flash of the wrong theme.
---
<script is:inline>
  (function () {
    var KEY = "agentprep-theme";
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = (stored === "light" || stored === "dark") ? stored : (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  })();
</script>
<script>
  const KEY = "agentprep-theme";
  function currentTheme() {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }
  function applyTheme(theme: string) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    for (const btn of document.querySelectorAll<HTMLButtonElement>(".theme-toggle")) {
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    }
  }
  function wire() {
    applyTheme(currentTheme()); // sync button glyphs to the already-applied theme
    for (const btn of document.querySelectorAll<HTMLButtonElement>(".theme-toggle")) {
      btn.addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark"));
    }
  }
  document.addEventListener("astro:page-load", wire);
  wire();
</script>
```

- [ ] **Step 2: (wiring verified in Task 5 once the toggle button exists)**

No standalone check here — the button lives in the layout (next task). Proceed.

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeScript.astro
git commit -m "feat: no-flash theme boot + toggle wiring"
```

---

## Task 5: Layout — AgentPrep nav, footer, theme toggle, drop examRoom

**Files:**
- Modify: `src/layouts/ManualLayout.astro` (full replacement)

- [ ] **Step 1: Replace the layout**

Replace the entire contents of `src/layouts/ManualLayout.astro` with:

```astro
---
import "../styles/global.css";
import ThemeScript from "../components/ThemeScript.astro";

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
---
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title} · AgentPrep</title>
    <meta property="og:title" content={`${title} · AgentPrep`} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <ThemeScript />
  </head>
  <body>
    <div class="sheet">
      <header class="doc-header">
        <a href="/" class="brand">AgentPrep</a>
        <nav>
          <a href="/#temario">Temario</a>
          <a href="/exam">Simulacro</a>
          <a href="/review">Repaso</a>
          <a href="/progress">Progreso</a>
          <button class="theme-toggle" type="button" aria-label="Cambiar tema">🌙</button>
        </nav>
      </header>
      <slot />
      <footer class="doc-footer">
        <span>AgentPrep — guía no oficial para la certificación de Claude</span>
        <span>Gratis · Sin cuenta · Código abierto</span>
      </footer>
    </div>
  </body>
</html>
```

Note: `examRoom` prop is removed. Any page passing `examRoom` (only `exam.astro`) is fixed in Task 9.

- [ ] **Step 2: Verify build + toggle**

Run: `npm run build && npm run preview`
Open the preview URL. Expected: header reads **AgentPrep** with Spanish nav and a 🌙/☀️ toggle. Clicking the toggle flips the whole page between light and dark and the glyph swaps. Reload — the chosen theme persists with no flash. Stop the preview (Ctrl-C).

- [ ] **Step 3: Commit**

```bash
git add src/layouts/ManualLayout.astro
git commit -m "feat: AgentPrep layout — Spanish nav, theme toggle, drop exam-room"
```

---

## Task 6: Homepage landing

**Files:**
- Modify: `src/pages/index.astro` (full replacement)

- [ ] **Step 1: Replace the homepage**

Replace the entire contents of `src/pages/index.astro` with:

```astro
---
import { getCollection } from "astro:content";
import ManualLayout from "../layouts/ManualLayout.astro";

const domains = (await getCollection("domains")).sort((a, b) => a.data.domain - b.data.domain);
const lessons = await getCollection("lessons");
const lessonsIn = (d: number) => lessons.filter((l) => l.data.domain === d).length;
---
<ManualLayout
  title="Estudia para la certificación de Claude"
  description="Guía de estudio gratuita para la certificación de agentes de Claude: 18 lecciones, más de 190 preguntas de práctica y un simulador de examen de 60 preguntas. Sin cuenta.">

  <section class="hero">
    <span class="badge">Guía de estudio gratuita · Certificación de Claude</span>
    <h1>Todo lo que necesitas para pasar la certificación de Claude</h1>
    <p class="lead">
      Lecciones estructuradas, práctica por dominio y un simulador de examen cronometrado —
      igual al examen real de Anthropic. Sin cuenta: tu progreso queda en tu navegador.
    </p>
    <div class="actions">
      <a class="btn" href="/manual/1">Empezar a estudiar</a>
      <a class="btn ghost" href="/exam">Probar el simulacro →</a>
    </div>
  </section>

  <section class="stats" aria-label="Resumen del contenido">
    <div class="stat"><b>5</b><span>dominios</span></div>
    <div class="stat"><b>18</b><span>lecciones</span></div>
    <div class="stat"><b>190+</b><span>preguntas</span></div>
    <div class="stat"><b>60</b><span>preguntas en el simulacro</span></div>
  </section>

  <section style="margin-top:3.5rem">
    <h2 style="text-align:center">Cómo funciona</h2>
    <div class="grid-3" style="margin-top:1.5rem">
      <div>
        <div class="step-num">1</div>
        <h3 style="margin:.6rem 0 .3rem; font-size:1.1rem">Estudia las lecciones</h3>
        <p style="color:var(--ink-2); margin:0">18 lecciones en inglés (como el examen real), organizadas por dominio oficial.</p>
      </div>
      <div>
        <div class="step-num">2</div>
        <h3 style="margin:.6rem 0 .3rem; font-size:1.1rem">Practica cada dominio</h3>
        <p style="color:var(--ink-2); margin:0">Drills con explicaciones. Aprueba con 70% para desbloquear el siguiente dominio.</p>
      </div>
      <div>
        <div class="step-num">3</div>
        <h3 style="margin:.6rem 0 .3rem; font-size:1.1rem">Haz el simulacro</h3>
        <p style="color:var(--ink-2); margin:0">60 preguntas cronometradas con resultados por dominio, como el examen de verdad.</p>
      </div>
    </div>
  </section>

  <section id="temario" style="margin-top:3.5rem; scroll-margin-top:1rem">
    <h2 style="text-align:center">Los 5 dominios del examen</h2>
    <div class="grid-2" style="margin-top:1.5rem">
      {domains.map((d) => (
        <a href={`/manual/${d.data.domain}`} class="card" style="text-decoration:none; color:inherit; display:block">
          <span class="section-no">Dominio {d.data.domain} · {lessonsIn(d.data.domain)} lecciones</span>
          <h3 style="margin:.2rem 0 .4rem; font-size:1.15rem">{d.data.title}</h3>
          <p style="color:var(--ink-2); margin:0; font-size:.95rem">{d.data.summary}</p>
        </a>
      ))}
    </div>
  </section>

  <section style="margin-top:3.5rem">
    <div class="cta-card">
      <h2 style="margin-top:0">¿Ya te sientes listo?</h2>
      <p style="color:var(--ink-2); max-width:34rem; margin:.4rem auto 1.2rem">
        Mide tu nivel con el simulador: 60 preguntas, cronometrado y con desglose por dominio al final.
      </p>
      <a class="btn accent" href="/exam">Iniciar simulacro</a>
    </div>
  </section>
</ManualLayout>
```

- [ ] **Step 2: Verify**

Run: `npm run build && npm run preview`
Open the homepage. Expected: badge + certification headline, the 4-cell stats bar, 3 "cómo funciona" steps, a 2-column grid of the 5 domain cards (each linking to its domain), and the exam CTA. Toggle dark mode — everything remains legible. Stop preview.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: AgentPrep landing page — clear certification framing"
```

---

## Task 7: ProgressRing component (replaces Gauge)

**Files:**
- Create: `src/components/islands/ProgressRing.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/islands/ProgressRing.tsx`:

```tsx
interface ProgressRingProps {
  value: number; // 0..100
  label: string;
}

export default function ProgressRing({ value, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped / 100);
  return (
    <figure style={{ margin: 0, textAlign: "center", fontFamily: "var(--font-sans)" }}>
      <svg viewBox="0 0 100 100" width="112" role="img" aria-label={`${label}: ${Math.round(clamped)}%`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--paper-deep)" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--ok)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fontSize="20" fontFamily="var(--font-prose)" fontWeight="600" fill="var(--ink)">
          {Math.round(clamped)}%
        </text>
      </svg>
      <figcaption style={{ fontSize: ".72rem", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)" }}>
        {label}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 2: Verify it type-checks via build (used in Tasks 8 & 12)**

No standalone render yet. Proceed — it's consumed next.

- [ ] **Step 3: Commit**

```bash
git add src/components/islands/ProgressRing.tsx
git commit -m "feat: clean ProgressRing to replace analog Gauge"
```

---

## Task 8: Progress page + panel (rings, Spanish)

**Files:**
- Modify: `src/components/islands/DomainGauge.tsx` (full replacement)
- Modify: `src/components/islands/ProgressPanel.tsx` (full replacement)
- Modify: `src/pages/progress.astro`

- [ ] **Step 1: Point DomainGauge at ProgressRing**

Replace the entire contents of `src/components/islands/DomainGauge.tsx` with:

```tsx
import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import ProgressRing from "./ProgressRing";

export default function DomainGauge({ domain, questionIds }: { domain: number; questionIds: string[] }) {
  const progress = useStore($progress);
  const mastered = questionIds.filter((id) => progress.answers[id]?.lastCorrect).length;
  const pct = questionIds.length === 0 ? 0 : (mastered / questionIds.length) * 100;
  return <ProgressRing value={pct} label={`Dominio ${domain}`} />;
}
```

- [ ] **Step 2: Rewrite ProgressPanel (rings + Spanish)**

Replace the entire contents of `src/components/islands/ProgressPanel.tsx` with:

```tsx
import { useRef } from "react";
import { useStore } from "@nanostores/react";
import { $progress, exportProgress, importProgress, resetProgress } from "../../stores/progress-store";
import { dueQuestionIds } from "../../lib/progress";
import ProgressRing from "./ProgressRing";

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
    a.download = `agentprep-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(file: File) {
    try {
      importProgress(await file.text());
      alert("Progreso importado.");
    } catch {
      alert("Ese archivo no es una exportación válida de AgentPrep.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", margin: "1.5rem 0" }}>
        {[1, 2, 3, 4, 5].map((d) => {
          const qs = questionMeta.filter((q) => q.domain === d);
          const mastered = qs.filter((q) => progress.answers[q.id]?.lastCorrect).length;
          return <ProgressRing key={d} value={qs.length ? (mastered / qs.length) * 100 : 0} label={`Dominio ${d}`} />;
        })}
      </div>

      <p>{due} tarjeta(s) pendiente(s) en el <a href="/review">mazo de repaso</a>.</p>

      <h2>Lecciones registradas</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {[...lessonMeta].sort((a, b) => a.section.localeCompare(b.section)).map((l) => (
          <li key={l.id} className="rule-row" style={{ fontSize: ".92rem" }}>
            {progress.lessonsRead.includes(l.id) ? "✓" : "○"} {l.title}
          </li>
        ))}
      </ul>

      <h2>Historial de exámenes</h2>
      {progress.examHistory.length === 0 ? (
        <p>Aún no has hecho exámenes. <a href="/exam">Prueba el simulador.</a></p>
      ) : (
        <table style={{ borderCollapse: "collapse", fontSize: ".92rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>FECHA</th><th>PUNTAJE</th></tr></thead>
          <tbody>
            {progress.examHistory.map((e, i) => (
              <tr key={i}><td style={{ paddingRight: "2rem" }}>{e.date}</td><td>{e.score}/{e.total}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Datos</h2>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        <button className="btn" onClick={download}>Exportar progreso</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>Importar progreso</button>
        <button className="btn ghost" onClick={() => { if (confirm("¿Borrar todo el progreso local?")) resetProgress(); }}>Reiniciar</button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      <p style={{ fontSize: ".92rem", maxWidth: "var(--measure)", color: "var(--ink-2)" }}>
        Tu progreso vive solo en este navegador. Expórtalo antes de cambiar de dispositivo.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Spanish-ify the progress page chrome**

In `src/pages/progress.astro`, replace the `<section>` block (lines 12-16) with:

```astro
  <section>
    <span class="section-no">Tu registro</span>
    <h1>Progreso</h1>
    <ProgressPanel client:load lessonMeta={lessonMeta} questionMeta={questionMeta} />
  </section>
```

Also update the `<ManualLayout>` opening tag on line 11 to:

```astro
<ManualLayout title="Progreso" description="Tu registro de estudio: dominio por dominio, historial de exámenes y cola de repaso.">
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Open `/progress`. Expected: five clean progress rings (green arc), Spanish headings ("Lecciones registradas", "Historial de exámenes", "Datos"), working export/import/reset buttons. Toggle dark — rings and text stay legible. Stop preview.

- [ ] **Step 5: Commit**

```bash
git add src/components/islands/DomainGauge.tsx src/components/islands/ProgressPanel.tsx src/pages/progress.astro
git commit -m "feat: progress page uses rings, Spanish interface"
```

---

## Task 9: Exam page + simulator (drop exam-room, Spanish)

**Files:**
- Modify: `src/pages/exam.astro` (full replacement)
- Modify: `src/components/islands/ExamSimulator.tsx` (full replacement)

- [ ] **Step 1: Replace the exam page (remove `examRoom`)**

Replace the entire contents of `src/pages/exam.astro` with:

```astro
---
import ManualLayout from "../layouts/ManualLayout.astro";
import ExamSimulator from "../components/islands/ExamSimulator";
import { finalPool } from "../lib/question-bank";
const pool = finalPool();
---
<ManualLayout title="Simulador de examen" description="Simulador de examen cronometrado de 60 preguntas con desglose por dominio, igual al examen real de la certificación de Claude.">
  <section>
    <span class="section-no">Simulacro</span>
    <h1>Simulador de examen</h1>
    <ExamSimulator client:load pool={pool} />
  </section>
</ManualLayout>
```

- [ ] **Step 2: Rewrite the simulator (Spanish, no `§`, timer uses accent)**

Replace the entire contents of `src/components/islands/ExamSimulator.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import type { Question } from "../../lib/question-schema";
import { buildExam } from "../../lib/exam-builder";
import { mulberry32 } from "../../lib/rng";
import { scoreExam, type ExamResult } from "../../lib/scoring";
import { $examSession } from "../../stores/exam-session";
import { $progress, answer as recordAnswer, saveExam } from "../../stores/progress-store";
import { allDomainsPassed, domainPassed } from "../../lib/progress";

const EXAM_SIZE = 60;
const EXAM_MINUTES = 90;

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function ExamSimulator({ pool }: { pool: Question[] }) {
  const session = useStore($examSession);
  const progress = useStore($progress);
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
    if (session && !result && remaining <= 0) submit(); // se acabó el tiempo → enviar
  }, [remaining, session, result]);

  if (!allDomainsPassed(progress) && !session && !result) {
    return (
      <div style={{ maxWidth: "var(--measure)" }}>
        <p style={{ fontWeight: 600 }}>■ Examen bloqueado</p>
        <p>Aprueba los cinco drills de dominio para presentar el examen final:</p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[1, 2, 3, 4, 5].map((d) => (
            <li key={d} style={{ margin: ".3rem 0" }}>
              {domainPassed(progress, d) ? "✓" : "○"} <a href={`/manual/${d}`}>Drill del dominio {d}</a>
              {domainPassed(progress, d) ? " — aprobado" : " — pendiente"}
            </li>
          ))}
        </ul>
      </div>
    );
  }

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
        <p style={{ fontFamily: "var(--font-prose)", fontSize: "2rem", fontWeight: 600 }}>{result.score}/{result.total} · {pct}%</p>
        <table style={{ borderCollapse: "collapse", fontSize: ".92rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>DOMINIO</th><th>PUNTAJE</th></tr></thead>
          <tbody>
            {Object.entries(result.byDomain).map(([d, s]) => (
              <tr key={d}>
                <td style={{ paddingRight: "2rem" }}><a href={`/manual/${d}`}>Dominio {d}</a></td>
                <td>{s.correct}/{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Las preguntas falladas se añadieron a tu <a href="/review">mazo de repaso</a>.</p>
        <button className="btn" onClick={start}>Hacer otro examen</button>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <p style={{ maxWidth: "var(--measure)" }}>
          {EXAM_SIZE} preguntas tomadas de un banco de {pool.length}, balanceadas entre los cinco dominios.
          {" "}{EXAM_MINUTES} minutos. Sin feedback hasta que envíes — igual que en el examen real.
        </p>
        <button className="btn accent" onClick={start} disabled={pool.length < EXAM_SIZE}>Comenzar examen</button>
      </div>
    );
  }

  const q = questions[cursor];
  if (!q) return null;
  const answered = Object.keys(session.answers).length;
  return (
    <div>
      <p style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: ".85rem" }}>
        <span>PREGUNTA {cursor + 1}/{questions.length} · {answered} RESPONDIDAS</span>
        <span style={{ fontWeight: 600, color: remaining < 5 * 60_000 ? "var(--stamp-red)" : "var(--accent)" }}>
          T-{fmt(remaining)}
        </span>
      </p>
      <p style={{ fontSize: "1.1rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
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
        <button className="btn ghost" disabled={cursor === 0} onClick={() => setCursor((c) => c - 1)}>Anterior</button>
        <button className="btn ghost" disabled={cursor === questions.length - 1} onClick={() => setCursor((c) => c + 1)}>Siguiente</button>
        <button className="btn accent" onClick={() => { if (confirm(`¿Enviar con ${answered}/${questions.length} respondidas?`)) submit(); }}>
          Enviar examen
        </button>
      </div>
      <nav style={{ marginTop: "1.2rem", display: "flex", flexWrap: "wrap", gap: "4px", fontFamily: "var(--font-mono)" }}>
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setCursor(i)} title={`Pregunta ${i + 1}`}
            style={{
              width: 28, height: 24, fontSize: ".65rem", cursor: "pointer", borderRadius: 4,
              border: "1px solid var(--border)",
              background: i === cursor ? "var(--accent)" : session.answers[qq.id] !== undefined ? "var(--accent-soft)" : "var(--surface)",
              color: i === cursor ? "#fff" : "var(--ink)",
            }}>{i + 1}</button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build && npm run preview`
Open `/exam`. If all domains aren't passed yet you'll see the Spanish "Examen bloqueado" gate — that's correct. The page uses the normal light/dark theme (no forced dark room). Toggle theme; the timer/item-grid stay legible. Stop preview.

- [ ] **Step 4: Commit**

```bash
git add src/pages/exam.astro src/components/islands/ExamSimulator.tsx
git commit -m "feat: exam simulator in Spanish, themed (no forced dark room)"
```

---

## Task 10: Drill islands — QuizEngine, DrillGate, LessonFooter (Spanish)

**Files:**
- Modify: `src/components/islands/QuizEngine.tsx` (full replacement)
- Modify: `src/components/islands/DrillGate.tsx` (full replacement)
- Modify: `src/components/islands/LessonFooter.tsx` (full replacement)

- [ ] **Step 1: Rewrite QuizEngine (Spanish, no `§`)**

Replace the entire contents of `src/components/islands/QuizEngine.tsx` with:

```tsx
import { useMemo, useState } from "react";
import type { Question } from "../../lib/question-schema";
import { mulberry32, shuffle, shuffleOptions } from "../../lib/rng";
import { answer, saveDrill } from "../../stores/progress-store";
import { DRILL_PASS_THRESHOLD } from "../../lib/progress";

interface Props { questions: Question[]; domain: number }

export default function QuizEngine({ questions, domain }: Props) {
  const [runIds, setRunIds] = useState<string[] | null>(null); // null = sin empezar
  const [seed, setSeed] = useState(1);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFullRun, setIsFullRun] = useState(false);

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
    setIsFullRun(ids.length === questions.length);
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
    return <button className="btn accent" onClick={() => start(questions.map((x) => x.id))}>
      Empezar drill · {questions.length} preguntas
    </button>;
  }

  if (!q) {
    // terminado
    return (
      <div className="rule-row">
        <p style={{ fontFamily: "var(--font-prose)", fontSize: "1.6rem", fontWeight: 600 }}>
          {correctCount}/{run.length || runIds.length} correctas
        </p>
        {isFullRun && (
          (correctCount / (run.length || runIds.length)) >= DRILL_PASS_THRESHOLD ? (
            <p style={{ color: "var(--ok)", fontWeight: 600 }}>Drill aprobado — el siguiente dominio queda desbloqueado.</p>
          ) : (
            <p style={{ color: "var(--stamp-red)" }}>Por debajo del {Math.round(DRILL_PASS_THRESHOLD * 100)}% — repite el drill completo para desbloquear el siguiente dominio.</p>
          )
        )}
        {missed.length > 0 && (
          <button className="btn" onClick={() => { setSeed((s) => s + 1); start(missed); }}>
            Reintentar las {missed.length} falladas
          </button>
        )}{" "}
        <button className="btn ghost" onClick={() => { setSeed((s) => s + 1); start(questions.map((x) => x.id)); }}>
          Reiniciar drill completo
        </button>
      </div>
    );
  }

  const revealed = selected !== null;
  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: ".75rem", letterSpacing: ".08em", color: "var(--ink-3)" }}>
        PREGUNTA {index + 1} / {run.length} · Dominio {q.domain}
      </p>
      <p style={{ fontSize: "1.1rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
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
            onClick={() => {
              if (index + 1 >= run.length && isFullRun) saveDrill(domain, correctCount, run.length);
              setIndex((i) => i + 1); setSelected(null);
            }}>
            {index + 1 < run.length ? "Siguiente" : "Terminar drill"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite DrillGate (Spanish)**

Replace the entire contents of `src/components/islands/DrillGate.tsx` with:

```tsx
import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import { domainUnlocked, DRILL_PASS_THRESHOLD } from "../../lib/progress";
import type { Question } from "../../lib/question-schema";
import QuizEngine from "./QuizEngine";

export default function DrillGate({ domain, questions }: { domain: number; questions: Question[] }) {
  const progress = useStore($progress);
  if (!domainUnlocked(progress, domain)) {
    return (
      <div style={{ border: "1px dashed var(--ink-soft)", borderRadius: "var(--radius)", padding: "1.2rem", maxWidth: "var(--measure)" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>■ Drill bloqueado</p>
        <p style={{ marginBottom: 0, color: "var(--ink-2)" }}>
          Aprueba el drill del dominio {domain - 1} ({Math.round(DRILL_PASS_THRESHOLD * 100)}% o más en una ronda completa) para desbloquear este.{" "}
          <a href={`/manual/${domain - 1}`}>Ir al dominio {domain - 1}</a>
        </p>
      </div>
    );
  }
  return <QuizEngine questions={questions} domain={domain} />;
}
```

- [ ] **Step 3: Rewrite LessonFooter (Spanish, no rotated stamp)**

Replace the entire contents of `src/components/islands/LessonFooter.tsx` with:

```tsx
import { useStore } from "@nanostores/react";
import { $progress, readLesson } from "../../stores/progress-store";

export default function LessonFooter({ lessonId, domain }: { lessonId: string; domain: number }) {
  const progress = useStore($progress);
  const read = progress.lessonsRead.includes(lessonId);
  return (
    <div style={{ marginTop: "3rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      {read ? (
        <span style={{ color: "var(--ok)", fontWeight: 600 }}>✓ Lección registrada</span>
      ) : (
        <button className="btn" onClick={() => readLesson(lessonId)}>Marcar lección como leída</button>
      )}
      <a href={`/manual/${domain}`}>← Volver al dominio {domain}</a>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Open `/manual/1`, scroll to the drill, run a couple questions. Expected: Spanish prompts ("Empezar drill", "Siguiente", "Reintentar las N falladas"), correct answers tinted, explanations shown. Open a lesson (e.g. `/manual/1/chapter-01`), confirm the footer reads "Marcar lección como leída" / "✓ Lección registrada". Stop preview.

- [ ] **Step 5: Commit**

```bash
git add src/components/islands/QuizEngine.tsx src/components/islands/DrillGate.tsx src/components/islands/LessonFooter.tsx
git commit -m "feat: drill/lesson islands in Spanish, no retro stamp"
```

---

## Task 11: Review page + deck (Spanish)

**Files:**
- Modify: `src/pages/review.astro` (full replacement)
- Modify: `src/components/islands/ReviewDeck.tsx` (full replacement)

- [ ] **Step 1: Replace the review page**

Replace the entire contents of `src/pages/review.astro` with:

```astro
---
import ManualLayout from "../layouts/ManualLayout.astro";
import ReviewDeck from "../components/islands/ReviewDeck";
---
<ManualLayout title="Repaso" description="Repaso espaciado de cada pregunta que has fallado, con recordatorios a 1, 3, 7, 16 y 35 días.">
  <section>
    <span class="section-no">Mantenimiento</span>
    <h1>Mazo de repaso</h1>
    <p class="prose">Cada pregunta que fallas en cualquier parte del manual se programa aquí: a 1, 3, 7, 16 y luego 35 días. Vacía la cola cada día.</p>
    <ReviewDeck client:load />
  </section>
</ManualLayout>
```

- [ ] **Step 2: Rewrite ReviewDeck (Spanish, no `§`)**

Replace the entire contents of `src/components/islands/ReviewDeck.tsx` with:

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
    return <p style={{ fontSize: "1.1rem" }}>
      {sessionDone.length > 0 ? `Cola vacía — ${sessionDone.length} tarjeta(s) repasada(s). ` : ""}
      Nada pendiente. Vuelve mañana.
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
      <p style={{ fontFamily: "var(--font-mono)", fontSize: ".75rem", letterSpacing: ".08em", color: "var(--ink-3)" }}>
        {due.length} TARJETA(S) PENDIENTE(S) · Dominio {q.domain}
      </p>
      <p style={{ fontSize: "1.1rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
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
            Siguiente tarjeta
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build && npm run preview`
Open `/review`. Expected: Spanish heading "Mazo de repaso" and either a due card or "Nada pendiente. Vuelve mañana." Stop preview.

- [ ] **Step 4: Commit**

```bash
git add src/pages/review.astro src/components/islands/ReviewDeck.tsx
git commit -m "feat: review deck in Spanish"
```

---

## Task 12: Domain, lesson & scenario pages (restyle, Spanish chrome)

**Files:**
- Modify: `src/pages/manual/[domain]/index.astro` (full replacement)
- Modify: `src/pages/manual/[domain]/[chapter].astro` (full replacement)
- Modify: `src/pages/scenarios/[id].astro` (full replacement)

- [ ] **Step 1: Replace the domain page**

Replace the entire contents of `src/pages/manual/[domain]/index.astro` with:

```astro
---
import { getCollection, render } from "astro:content";
import ManualLayout from "../../../layouts/ManualLayout.astro";
import DrillGate from "../../../components/islands/DrillGate";
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
    <span class="section-no">Dominio {entry.data.domain}</span>
    <h1>{entry.data.title}</h1>
    <DomainGauge client:load domain={entry.data.domain} questionIds={questions.map((q) => q.id)} />
    <Content />
    <h2>Objetivos oficiales del examen</h2>
    <ul>{entry.data.objectives.map((o) => <li>{o}</li>)}</ul>
    <h2>Lecciones</h2>
    <ul style="list-style:none; padding:0">
      {lessons.map((l) => (
        <li class="rule-row">
          <a href={`/manual/${l.data.domain}/${l.id.split("/")[1]}`}>{l.data.title}</a>
        </li>
      ))}
    </ul>
  </article>
  <section style="margin-top:4rem">
    <h2><span class="section-no">Drill</span>Práctica — {questions.length} preguntas</h2>
    <DrillGate client:visible domain={entry.data.domain} questions={questions} />
  </section>
</ManualLayout>
```

- [ ] **Step 2: Replace the lesson page**

Replace the entire contents of `src/pages/manual/[domain]/[chapter].astro` with:

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
    <span class="section-no"><a href={`/manual/${entry.data.domain}`} style="color:var(--accent); text-decoration:none">Dominio {entry.data.domain}</a></span>
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
  <LessonFooter client:visible lessonId={entry.id} domain={entry.data.domain} />
</ManualLayout>
```

- [ ] **Step 3: Replace the scenario page**

Replace the entire contents of `src/pages/scenarios/[id].astro` with:

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
    <span class="section-no">Escenario {entry.data.order}</span>
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
</ManualLayout>
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Open `/manual/2` (a domain), one lesson, and `/scenarios/1`. Expected: clean article layout, serif headings, Spanish chrome ("Dominio N", "Objetivos oficiales del examen", "Lecciones", "Escenario N"). English body content is unchanged. Toggle theme on each. Stop preview.

- [ ] **Step 5: Commit**

```bash
git add "src/pages/manual/[domain]/index.astro" "src/pages/manual/[domain]/[chapter].astro" "src/pages/scenarios/[id].astro"
git commit -m "feat: domain/lesson/scenario pages restyled with Spanish chrome"
```

---

## Task 13: Favicon, delete retro components, README

**Files:**
- Modify: `public/favicon.svg` (full replacement)
- Delete: `src/components/Stamp.astro`
- Delete: `src/components/islands/Gauge.tsx`
- Modify: `README.md`

- [ ] **Step 1: Replace the favicon**

Replace the entire contents of `public/favicon.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#17233b"/>
  <text x="16" y="22" font-family="Georgia, serif" font-size="18" font-weight="700" fill="#e0a45c" text-anchor="middle">A</text>
</svg>
```

- [ ] **Step 2: Confirm the retro components are unused, then delete them**

Run: `grep -rn "Stamp\|islands/Gauge\|from \"./Gauge\"\|from \"../Gauge\"" src`
Expected: no matches in `src/pages` or `src/components` other than the files being deleted. (After Tasks 7-8, `Gauge` is no longer imported; `Stamp` was never imported.)

Then delete:

```bash
git rm src/components/Stamp.astro src/components/islands/Gauge.tsx
```

- [ ] **Step 3: Update the README**

In `README.md`, replace the top block (title line through the "Live" line) with:

```markdown
# AgentPrep

Una guía de estudio gratuita y de código abierto para la certificación de agentes de Claude (CCAF). Interfaz en español, contenido de lecciones en inglés (como el examen real).

**Demo:** [https://agent-field-manual.vercel.app](https://agent-field-manual.vercel.app) *(actualiza si cambia el dominio)*
```

And replace the `## Design` section body with:

```markdown
## Diseño

Diseño editorial moderno: fondo claro cálido, tinta navy, acento naranja quemado, títulos en serif (Crimson Pro) y cuerpo en sans (Inter). Modo claro y oscuro con toggle, persistido en `localStorage` y sin flash al cargar. Todo el CSS está hecho a mano — sin librerías de componentes ni frameworks de CSS.
```

- [ ] **Step 4: Verify the build has no dangling references**

Run: `npm run build`
Expected: build succeeds with no "cannot find module Gauge/Stamp" errors.

- [ ] **Step 5: Commit**

```bash
git add public/favicon.svg README.md
git commit -m "feat: AgentPrep favicon + README; remove retro Stamp/Gauge"
```

---

## Task 14: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- run`
Expected: all suites pass, including the new `theme.test.ts`. No suite references deleted modules.

- [ ] **Step 2: Full production build**

Run: `npm run build`
Expected: `prebuild` runs Vitest (green), then Astro builds all pages with no errors or unresolved imports.

- [ ] **Step 3: Manual visual sweep in preview**

Run: `npm run preview`
Walk every page in **both** light and dark: `/` (landing), `/manual/1` (domain + drill), `/manual/1/chapter-01` (lesson), `/scenarios/1`, `/exam`, `/review`, `/progress`.
Check each: no leftover retro chrome (paper grain, `§` in UI, rotated stamps, "UNCONTROLLED WHEN PRINTED"), the name reads **AgentPrep**, certification framing is visible on the homepage, Spanish interface throughout, English lesson content intact, theme toggle persists across navigation with no flash, and the layout is not horizontally scrolling on a narrow (~375px) viewport. Stop preview.

- [ ] **Step 4: Confirm existing user progress still loads**

The localStorage schema and store keys are untouched, so a returning user's progress must still render. In the preview, on `/progress`, complete one drill question on `/manual/1`, return to `/progress`, and confirm the ring for Dominio 1 moved and the lesson/exam logs update. (This exercises the same store the old build wrote to.)

- [ ] **Step 5: Final commit (if the sweep required any fixes)**

```bash
git add -A
git commit -m "fix: redesign verification adjustments"
```

If the sweep needed no changes, skip this step.

---

## Self-Review Notes

- **Spec coverage:** Identity/message (Tasks 5, 6, 13) · visual system tokens (Task 2) · global styles removing retro chrome (Task 3) · light/dark toggle no-flash (Tasks 1, 4, 5) · landing structure (Task 6) · interior pages restyle + ES interface (Tasks 8–12) · rings replace gauges (Tasks 7, 8) · exam themed not dark-only (Task 9) · SEO/README/favicon (Tasks 5 head, 13) · verification incl. preserved localStorage (Task 14). All spec sections map to a task.
- **Var-name preservation:** `--accent`, `--accent-soft`, `--ok`, `--stamp-red`, `--panel-glow`, `--ink*`, `--paper*`, `--measure` are all redefined (Task 2) but keep their names, so island inline styles that reference them work in both themes without per-island edits beyond translation.
- **Type consistency:** `ProgressRing` props `{ value, label }` match every call site (DomainGauge, ProgressPanel). `ManualLayout` no longer accepts `examRoom`; the only caller (`exam.astro`) is updated in Task 9. `theme.ts` exports `resolveInitialTheme`, `nextTheme`, `THEME_KEY`, `Theme` — the inline boot script reimplements the same logic in vanilla JS (it can't import a module before paint), and this duplication is intentional and noted.
