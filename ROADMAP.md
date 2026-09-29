# Roadmap

LeoMath is built in public. This file is the plan; CHANGELOG.md is what actually shipped.

## Before launch (v0.1.x)

- [x] P0-1 Knowledge tree as real navigation: node status and reading time, prerequisite path highlighting, side panel with "start learning", mobile list view.
- [x] P0-2 Unified semantic components on concept pages: numbered definitions and results, unboxed proofs ending in □, examples, common mistakes, experiment frames; a "problem → need → definition" opening in every article; a section navigator instead of a progress bar.
- [x] P0-3 Zero-cost onboarding on the hero experiment: three contextual hints, controls revealed after the first interaction.
- [x] P0-4 Full mobile acceptance at 390 px: no horizontal overflow on any page, list-view tree, stacked experiment panels, horizontal section navigator.
- [ ] ICP filing for leomath.cn, HTTPS, first deployment on the Aliyun host.

## Inherited from MathForge (archived 2026-09)

MathForge (LeoLee0512/MathLearn) is archived. What was worth keeping has been rewritten here; nothing was copied as code.

- [x] Experiments: secant → tangent, Riemann sums, Taylor approximation (the linear transformation and direction field already existed).
- [x] Tools: formula editor, function plotter with parameters, calculator, 2×2 matrix calculator, on a new expression parser with tests.
- [x] Content: mean value theorem (calculus path), inner products and Cauchy–Schwarz (linear algebra path).
- [ ] Probability path: conditional probability and Bayes, maximum likelihood, central limit theorem with its experiment, random walks. Planned nodes exist in the tree.
  - [x] Probability spaces (birthday problem), published 2026-09.
  - [x] Conditional probability & Bayes (screening and area experiments; a short Bayesian-neural-network extension), published 2026-09.
  - [ ] Random variables (binomial → Poisson), Mean & variance (covariance as an inner product), Central limit theorem.
  - [ ] Later: a statistics path (sampling distributions, estimation, hypothesis testing).
  - Ideas are rewritten, never copied, from public probability demos at https://github.com/huzhuofan1020-svg; each borrowed node, experiment and path carries a `credits` link to the specific repository (link only, no name, at the author's request).
- [ ] Number theory (gcd and Bézout) and analytic geometry (conics and eccentricity): not yet placed in the tree.
- [ ] Stolz–Cesàro: an advanced sequences node after Limits.
- [ ] Proof exercises: MathForge's competition problems are proofs, which the numeric/choice checker cannot grade. Needs a "worked solution, self-check" exercise kind.
- [ ] The Euclid corpus (7,152 semantic blocks with a dependency graph) stays in the archived repository; a possible future Leo Lab experiment on structured reading.

## v0.1.3: depth over breadth

No new nodes until the existing ones are complete. `node scripts/audit-chain.mjs` is the checklist. Known gaps:

- [ ] Experiments for Limits (ε–δ band on a sequence), Vectors (basis and coordinates), Inner products (projection and the Cauchy–Schwarz slack).
- [ ] A definition block for the mean value theorem article (extremum / critical point), or accept that it is theorem-centred.
- [ ] Observation questions reviewed against what the experiments actually show.

## After launch

- Search across concepts and exercises.
- Leo Lab: Lorenz system, Fourier series, numerical integration experiments.
- Dev log.
- More paths: multivariable calculus, numerical analysis.
- Computational tools: ODE solver with exportable data; 3×3 matrices.
- Software: screenshots, SHA-256 checksums, update history per release.
