# Changelog

## 0.1.1 — 2026-09-28

Launch-readiness pass. No new features; four product-quality fixes.

- Knowledge tree is now a navigator: every node shows its status and reading time; hovering lights up the prerequisite path and dims the rest; a side panel shows the concept, its prerequisites, the chain, and a "start learning" button. Phones get a list view instead of the SVG.
- Concept pages use one semantic visual language: numbered definitions (thin blue rule), numbered theorems/propositions/lemmas (thin ink rule), unboxed proofs ending in □, examples on warm grey, "common mistake" notes, framed experiments with a flask icon. Every article now opens with a Problem block (problem → need → definition). A section navigator (● ◐ ○) replaces a progress bar. Reading time is shown.
- Hero experiment has zero-cost onboarding: three contextual hints (drag e₁ → look at the grid → drag e₂); the determinant and presets appear only after the first interaction; matrix columns are coloured to match the arrows.
- "Choose where to begin": each path says what you will understand. About page states that LeoMath is built in public, with version, changelog and roadmap. Software page fields for release date, architecture and SHA-256; Leo AI (closed source, v2.1.2) is listed as "coming soon" until public download opens.

## 0.1.0 — 2026-09-28

First release. Small on purpose; complete in character.

- Six-section homepage: playable linear transformation, interactive knowledge tree, teaching-method demo (why eˣ is its own derivative), three learning paths with honest counts, Leo Lab, Leo Software.
- Three learning paths (calculus, linear algebra, differential equations), 12 concepts, each written observe → conjecture → define → derive → prove → apply, in Chinese and English.
- Three browser-computed experiments: linear transformation, numerical ODE explorer (Euler vs RK4, phase portrait, direction field), exponential derivative.
- 24 exercises with hints and solutions; attempts recorded for signed-in users.
- Email + password accounts, database sessions, per-concept progress.
- zh/en routing with Accept-Language detection and cookie memory; Chinese fallback with notice.
- Light (paper) and dark (blackboard) themes.
- Docker Compose deployment with automatic migrations.
