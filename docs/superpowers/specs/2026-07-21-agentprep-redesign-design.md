# AgentPrep — Rediseño y reposicionamiento

**Fecha:** 2026-07-21
**Estado:** Aprobado
**Proyecto:** agent-field-manual (pasa a llamarse AgentPrep)

## Contexto y objetivo

Feedback de usuarios reales sobre el sitio actual ("The Agent Field Manual"):

1. **No se entiende de qué va la página.** Ni el nombre ni el hero dicen de forma clara que es una guía de estudio para la certificación de Claude.
2. **El diseño no gusta.** La estética "manual técnico de los años 70" (papel crema, tinta navy, secciones §, sellos, marcas de imprenta) no conectó con la audiencia.

Este rediseño resuelve ambas cosas. **No se toca** la lógica existente (progreso, desbloqueo progresivo, SRS, generador de examen, scoring) ni el contenido de lecciones y preguntas.

## Decisiones tomadas (con el usuario)

| Decisión | Elección |
|---|---|
| Dirección de diseño | B — Editorial moderno y limpio |
| Estructura de inicio | Landing completa (explica el sitio antes del contenido) |
| Idioma | Interfaz en español; lecciones y preguntas en inglés (como el examen real) |
| Tema | Modo claro y oscuro con toggle, en todo el sitio |
| Nombre | **AgentPrep** |

## 1 · Identidad y mensaje

- **Nombre:** AgentPrep (reemplaza "The Agent Field Manual" en nav, títulos, metadatos, README y favicon si aplica).
- **Tagline:** «Prepárate para la certificación de Claude».
- **Hero:** badge «GUÍA DE ESTUDIO GRATUITA · CERTIFICACIÓN DE CLAUDE» + título «Todo lo que necesitas para pasar la certificación de Claude» + subtítulo que menciona lecciones, drills y simulador, «sin cuenta, tu progreso queda en tu navegador».
- **Footer:** «AgentPrep — guía no oficial para la certificación de Claude» (aviso de no afiliación con Anthropic) + «Gratis · Sin cuenta · Código abierto».
- **SEO:** `<title>` y `meta description` en español, orientados a búsquedas tipo «certificación Claude», «examen Claude», «estudiar certificación Claude». Open Graph igual.

## 2 · Sistema visual

Se elimina por completo el tema retro: fondo papel, grano SVG, marcas de registro de imprenta, encabezado tipo documento («DOC. AFM-CCAF-2026 · REV A»), numeración § en la interfaz, componente Stamp, «UNCONTROLLED WHEN PRINTED».

### Tokens — modo claro

- Fondo: `#fdfcf9` (blanco cálido) · Superficie/tarjetas: `#ffffff`
- Tinta: `#17233b` (navy) · Texto secundario: `#5b6472` · Terciario: `#8a8478`
- Bordes: `#ece8de`
- Acento: `#b3541e` (naranja quemado) · Badge: fondo `#f3efe4`, texto `#8a5a1f`
- Éxito/progreso: `#3f6b4f`

### Tokens — modo oscuro

- Fondo: `#12161f` · Superficie/tarjetas: `#1a2029` · Bordes: `#232a38`
- Tinta: `#e2e6ed` · Texto secundario: `#8b95a5`
- Acento: `#e0a45c` (ámbar) · Éxito: `#5a9c74`

### Tipografía y formas

- **Títulos:** Crimson Pro (serif, ya instalada).
- **Cuerpo e interfaz:** Inter (sans, nueva dependencia `@fontsource-variable/inter`).
- **Mono:** IBM Plex Mono, solo para código dentro de lecciones.
- Botones: radio 8px; primario relleno navy (claro) / claro invertido (oscuro), secundario texto con flecha, CTA de examen en acento.
- Tarjetas: borde 1px sutil, radio 10px, sin sombras fuertes.
- Nada de gradientes morados, glassmorphism ni estética "IA genérica".

## 3 · Modo claro / oscuro

- Toggle 🌙/☀️ en la nav, visible en todas las páginas.
- Implementación: variables CSS por tema + clase `dark` en `<html>`.
- Valor inicial: `prefers-color-scheme` del sistema; la elección manual se guarda en `localStorage` y tiene prioridad.
- Script inline en `<head>` para aplicar el tema antes del primer render (evitar flash).
- El «modo sala de examen» (`examRoom`) desaparece: el simulador usa el tema activo con un encabezado enfocado (timer + progreso).

## 4 · Página de inicio (mockup aprobado)

Orden de secciones:

1. **Nav:** logo AgentPrep · Temario · Simulacro · Repaso · Progreso · toggle de tema.
2. **Hero:** badge + título + subtítulo + botones «Empezar a estudiar» (→ página del dominio 1) y «Probar el simulacro →».
3. **Barra de cifras:** 5 dominios · 18 lecciones · 190+ preguntas · simulacro de 60.
4. **Cómo funciona (3 pasos):** ① Estudia las lecciones ② Practica cada dominio (70% para desbloquear el siguiente) ③ Haz el simulacro.
5. **Los 5 dominios:** grid de tarjetas; cada una con etiqueta «DOMINIO N · X LECCIONES», título, barra de progreso y estado. Dominios bloqueados: atenuados, candado y «Se desbloquea al aprobar el dominio N-1».
6. **CTA del simulacro:** tarjeta destacada «¿Ya te sientes listo?» con botón en acento.
7. **Footer:** aviso no oficial + «Gratis · Sin cuenta · Código abierto».

El índice completo de lecciones deja de estar en el inicio; vive en la página de cada dominio.

## 5 · Páginas interiores

Todas usan el mismo sistema visual y la interfaz en español. El contenido MDX de lecciones, escenarios y preguntas permanece en inglés.

- **Dominio (`/manual/[domain]`):** encabezado con nombre y descripción, lista de lecciones con estado (leída/no), acceso al drill del dominio y a los escenarios relacionados.
- **Lección (`/manual/[domain]/[chapter]`):** artículo limpio con ancho de lectura cómodo, migas de pan (Dominio N → Lección), navegación anterior/siguiente, y el pie de lección existente (LessonFooter) restilizado.
- **Drills (QuizEngine / DrillGate):** misma mecánica (retry-missed, gate de 70%); tarjetas de pregunta, opciones y explicaciones con el nuevo estilo; textos de interfaz («Comprobar», «Siguiente», «Reintentar falladas», etc.) en español.
- **Simulador (`/exam`):** misma mecánica (60 preguntas, cronómetro, reanudable, desglose por dominio); usa el tema activo; encabezado enfocado con timer y progreso; interfaz en español.
- **Repaso (`/review`):** ReviewDeck restilizado, interfaz en español; escalera SRS sin cambios.
- **Progreso (`/progress`):** los medidores analógicos de aguja (Gauge/DomainGauge) se reemplazan por **anillos de progreso** limpios; historial y export/import se mantienen, restilizados y en español.
- **Escenarios (`/scenarios/[order]`):** mismo layout de artículo que las lecciones.

## 6 · Alcance técnico

**Cambia:** `tokens.css`, `global.css`, `ManualLayout.astro`, todas las páginas en `src/pages/`, estilos y strings de interfaz de los islands en `src/components/islands/`, componente Stamp (se elimina), metadatos SEO, README.

**No cambia:** `src/lib/` (progress, srs, exam-builder, scoring, question-bank, rng), `src/content/` (MDX en inglés), `src/data/questions/` (JSON en inglés), esquema de localStorage (el progreso existente de los usuarios se conserva), tests unitarios existentes.

**Nueva dependencia:** `@fontsource-variable/inter`. Se puede retirar `@fontsource-variable/crimson-pro` del cuerpo (queda solo para títulos).

## 7 · Verificación

- `npm test` — los tests unitarios existentes siguen pasando sin modificaciones (no se toca lógica).
- `npm run build` — build estático sin errores.
- Revisión visual de cada página (inicio, dominio, lección, drill, examen, repaso, progreso, escenarios) en claro y oscuro, escritorio y móvil.
- Comprobar que el progreso guardado en localStorage de un usuario existente sigue funcionando tras el rediseño.
- Sin flash de tema incorrecto al cargar en modo oscuro.
