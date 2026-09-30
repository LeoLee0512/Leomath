# Changelog

## 0.1.3 (in progress)

Depth over breadth.

- Third probability concept: Random variables. Random variables as functions on the sample space, mass functions, mutual independence, the binomial law with its most likely value ⌊(n+1)p⌋ (tied when (n+1)p is whole), the Poisson law, and the Poisson limit theorem with proof; total variation distance and Le Cam's bound λ²/n; why small p matters and not only large n. Applications: call-centre lines, the birthday problem as a Poisson count (recovering the previous section's exponential), and thinning of a Poisson count via the law of total probability and Bayes. A short extension on waiting times defines distribution functions and densities (the exponential law), as promised in Conditional probability. Four exercises with coached feedback.
- New experiment: From binomial to Poisson. Binomial bars against Poisson dots with the peak marked, one run of n trials drawn cell by cell (the ω behind X(ω)), sampled frequencies, and the distance against n on a log–log plot next to Le Cam's bound. λ and n are kept in the URL; presets for n = 10, 100, 1000 and a tied peak; the log-scale n slider steps through whole numbers from the keyboard.
- Learn ↔ Explore ↔ Tools are one system: concepts declare their tools; concept pages show "Try it in the matrix calculator →" inline and in the sidebar; each tool lists the concepts that use it.
- Every experiment ends with "What did you observe?": three questions and an explanation revealed on demand, so a visualisation becomes experiment → observation → conjecture → theory.
- `scripts/audit-chain.mjs` lists, for each published concept, which links of problem → observe → definition → proof → experiment → exercises → tool are missing.
- Software catalogue: Computational Mechanics Solver added (cms.leomath.cn); Leo Tree links to its new Docker deployment at tree.leomath.cn instead of the retired bare IP.
- Comments: every concept, experiment and software page ends with a discussion section. Signed-in users post plain text with `$…$` maths (2000 characters, 20 s cooldown) and delete their own comments; accounts listed in `ADMIN_EMAILS` can delete any. Migration `002_comments.sql`.
- Feedback address in the footer, on the About page and under every discussion.
- The site publishes no links to source repositories: footer, About page and software pages drop their GitHub links; `repoUrl`/`releasesUrl` are replaced by an `openSource` flag.
- New path: Foundations of probability (Probability spaces → Conditional probability → Random variables → Mean & variance → Central limit theorem). First concept published: Probability spaces, from the birthday problem through Kolmogorov's axioms to a proof that 23 people suffice via 1 − x ≤ e^{−x}; four exercises. The remaining four nodes are planned, with Mean & variance linked to Inner products.
- Performance (P3), measured with `scripts/measure-pages.mjs` on a production build (compressed sizes):
  - Concept pages: server time 125–154 ms → 22–30 ms. Compiled MDX is cached per file and recompiled only when the file changes.
  - JavaScript 273 KB → 198 KB on the home page, 274 → 199 KB on concept pages, 254 → 179 KB on the problems page. KaTeX (≈75 KB) no longer ships to the browser except on the tools page: article formulas, experiment formulas, observation questions, exercise statements and answer feedback are rendered on the server; the linear-transform matrix is laid out in HTML; the Riemann and Taylor formulas show n symbolically (its value is next to the slider). Each experiment is its own chunk.
  - Formulas in articles are embedded as one HTML string each instead of a tree of React elements; exercise hints and solutions are fetched when opened instead of travelling with every page.
- Security hardening (review batch C):
  - Password checks are rate-limited in the app: 5 failed logins lock that account for 15 minutes, 20 failures per address per 15 minutes, 10 sign-ups per address per hour, 5 failed delete-account confirmations per account. nginx adds per-IP limits on the sign-in, sign-up and account pages and on the CSP report endpoint (deploy/nginx.leomath.conf).
  - Moderator rights are a database flag (`users.is_admin`, migration 003) instead of a match on unverified email addresses; `ADMIN_EMAILS` is gone. Grant with the SQL in deploy/DEPLOYMENT.md.
  - Content-Security-Policy is built per request in `src/proxy.ts` with a nonce and `'strict-dynamic'`; Next.js and the theme script carry the nonce, so an injected inline script is blocked once `CSP_ENFORCE=1` (now a runtime setting). Verified enforced on a production build: pages hydrate, client navigation loads code, no violations.
  - The CSP report endpoint accepts only report content types and small bodies and strips control characters before logging; container logs are capped at 3 × 10 MB.
- Accessibility and interface (review batch B):
  - Stylesheet in cascade layers: two unlayered rules (`a { color: inherit }`, `button, input { font: inherit }`) and the unlayered component classes had silently overridden Tailwind utilities site-wide, so link colours, hover states, selected-button borders, `max-w-*` on containers and `text-sm` inside prose never applied. Base rules are now in `@layer base`, components in `@layer components`, and `container` is redefined with `@utility`.
  - Contrast (light theme, WCAG AA): muted text, the amber accent, success green and error red darkened; input borders meet 3:1.
  - Knowledge tree works with a keyboard (Enter/Space pins a node) and is exposed as a group of buttons; headings and the search field are not hidden under the sticky header when jumped to; the mobile menu returns focus on Escape, closes on an outside tap and is always present for aria-controls; the desktop navigation marks the current section.
  - Form errors are announced; the comment box has a name; exercise options are a labelled group; numeric inputs are named per exercise; the completion message is in a live region; birthday simulation results are announced; decorative glyphs are hidden from screen readers.
  - Bayes screening draws ill people as squares and healthy people as circles, so the distinction does not depend on colour.
  - Plurals and measure words ("1 experiment", "尝试 3 次"); locale-correct colons; the tree's reading time in Chinese; "Next section" everywhere; a localised 404 page; switching language keeps the query and anchor and the link carries `lang`; home-page lab cards describe experiments that exist; the path chooser mentions probability; legend swatches and readouts use CSS colours (correct before hydration and in dark mode); 27 unused dictionary keys removed; the vectors article lists its eight axioms as eight items.
- Review fixes (a full review of the probability path, P0–P2):
  - Security: experiment parameters from the URL are clamped to their controls' ranges and strings must be known values, so a crafted link can no longer stall or crash the server while it renders an experiment; the ODE integrator and the screening population also refuse runaway sizes. An unknown ODE preset in the URL no longer breaks the page.
  - URL state: written with `history.replaceState(null, …)` so the Next.js router keeps it (it was lost after a server action); client-side mounts read the live URL, so Back/Forward show what the address bar says; writes pending when you navigate away are dropped; Copy link flushes synchronously (Safari). ODE parameters, initial values and methods and the Riemann sampling rule are now in the URL too.
  - Mathematics: where the birthday curve is steepest (around n≈20), the posterior curve near x=0 (≈12x, not "hugging zero"), the MAP/L2 statement (exact form, and when weight decay equals L2), 506/730 vs ln 2 shown to six places, the non-uniform-birthdays remark made precise, the √(d/365) rescaling, the retest example's conditional-independence assumption in the experiment text; the English title of Conditional probability & Bayes now matches the Chinese.
  - Exercises: tolerances match the decimals each statement asks for; taylor-2 asks for the sharpest bound; rounded percentages (16.7 for 1/6) are diagnosed; a solved card keeps its tick; two option notes rewritten.
  - Privacy policy: the language cookie is set automatically; the sign-in cookie is also set at sign-up; database backups are kept at most 30 days (daily rotation in deploy/DEPLOYMENT.md), and the data export now includes sign-in records.
  - English pages no longer show a Chinese full-width colon in "Next section".
- Practice that coaches, from reader feedback:
  - Every multiple-choice option has a note: wrong options name the misconception behind them, the right one says why it holds (`src/content/exercise-feedback.ts`; a test requires one note per option).
  - Numeric answers are diagnosed: known specific mistakes first (e.g. answering with the prior instead of the posterior), then a sign error, a reciprocal, a factor of 10/100/1000 or a percentage, or a near miss outside the tolerance. The grading rule is stated under each input: exact value, or the allowed error.
  - A correct answer gets a short green confirmation; each concept counts solved exercises and, when all are done, says so and offers the next section.
- Experiments you can reuse:
  - Parameters are kept in the URL (`?<experiment>.<param>=…`), read on the server so a shared link opens with the same settings; defaults are left out of the URL.
  - Under every experiment: Reset (back to defaults, URL cleared), Copy link (with an anchor to the experiment), and on the standalone page, Back to the article.
  - On phones only draggable canvases capture touch; the rest let the page scroll.
- Learning first, from reader feedback:
  - Every path states its level, what it needs, who it is for and what you can do afterwards (only what its published concepts teach), with total reading time and the date its articles last changed (`scripts/content-dates.mjs` reads git history before each build into `src/content/updated.json`).
  - Home page: path cards directly under the hero; the hero buttons lead to the paths and to a sample section instead of the software page; a line of real counts (paths, concepts, experiments, exercises) and "free, no account needed"; the matrix demo is labelled as the kind of experiment every concept has; unreleased software no longer appears on the home page.
  - Path page: a "next step" box with the first concept not yet mastered and, when signed in, a progress bar; mastered concepts are ticked.
  - Concept page: the sidebar leads with the path (section k of n, ticks, next section, "check yourself" link to the exercises); prerequisites, follow-ups, tools and experiments fold into "Related"; the sign-in prompt says what an account gives. On phones the eyebrow shows the section number.
  - Login and sign-up pages list what an account is for and say that everything works without one.
  - Software page: products not yet available are listed briefly under "In development" instead of as full cards.
- Self-service data rights on the My learning page: "Download my data" exports account, progress, every exercise answer and every comment as JSON (`/api/account/export`); "Delete account" asks for the password and a confirmation, then deletes the user row, which removes sessions, progress, attempts and all comments through ON DELETE CASCADE. The privacy policy and terms describe this instead of an email-only process.
- Database tests run the real migrations on PGlite (Postgres in WebAssembly, dev dependency): export contents, password check, deletion removing exactly one user's rows, and a guard that every table referencing users cascades.
- Site foundations, from reader feedback:
  - One source for the version: `VERSION` in `src/content/site.ts` reads package.json; footer, About page and home page use it. The About page states current counts of paths, concepts, experiments and exercises from the content itself.
  - Search and sharing: `robots.txt`, `sitemap.xml` (every public page in both languages with hreflang), `favicon.ico`, `apple-touch-icon.png`, and a 1200 × 630 share card (`scripts/make-icons.mjs`). Every page sets its canonical URL, hreflang alternates, Open Graph and Twitter card through `pageMeta` in `src/lib/seo.ts`; login, sign-up and account pages are noindex.
  - Security headers: a Content-Security-Policy (report-only until `CSP_ENFORCE=1`; violations are logged via `/api/csp-report`) and HSTS when the site URL is HTTPS.
  - Privacy policy (with a cookie section) and terms of use in both languages, linked from the footer and the sign-up form; the footer shows the ICP number once `ICP_NUMBER` is set.
  - Accessibility: a skip-to-content link; sliders announce the value shown on screen (`aria-valuetext`); on phones the navigation is one header row with a menu button instead of a second scrolling row.
- Second probability concept: Conditional probability & Bayes. Conditioning as renormalising to B, the multiplication rule, independence (and why exclusive events are never independent), total probability and Bayes with proofs, the screening paradox, retesting as posterior → prior, and a short extension on Bayesian neural networks (posterior over weights, predictive averaging, MAP with a Gaussian prior = L2 regularisation). Four exercises.
- New experiments: Bayes in screening (a thousand people by illness and test result, with retesting) and conditioning as a ratio of areas (unit-square picture of P(B | A), P(B | Aᶜ), independence and conditioning on B).
- Display maths: a line holding only `$$…$$` now renders as a centred display equation. remark-math had been parsing these as inline maths in every article.
- New experiment: the birthday problem (exact curve, exponential bound, "someone shares the first person's day", class-by-class simulation on a year strip).
- Credits: concepts, experiments and paths can declare `credits` (a note and a public URL). They render under the experiment frame, at the end of the article and under the path title, as a link only. This is the one kind of outside link the site publishes: the probability path rewrites ideas from public demos at github.com/huzhuofan1020-svg.

## 0.1.2 — 2026-09-29

MathForge is archived; its non-overlapping parts are rebuilt here.

- New experiments: secant becomes tangent (derivative, mean value theorem), Riemann sums (integral), Taylor approximation with radius of convergence (Taylor expansion).
- New Tools page, the last link of the learning chain: formula editor with live KaTeX and copy, function plotter with automatic parameter sliders, pan and zoom, a calculator, and a 2×2 matrix calculator. Built on a new expression parser (tokenizer + recursive descent, unit-tested; "2 3" is an error, "1e3" is a number, "2x" is 2·x).
- New concepts: Mean value theorem (calculus path, now five concepts) and Inner products & Cauchy–Schwarz (linear algebra path, now five concepts), each with a Problem opening, proofs, a common-mistake note and two exercises. The integral's fundamental theorem and Taylor's remainder now cite the mean value theorem as a prerequisite.
- Knowledge tree gains a Probability branch (planned).
- Software: MathForge listed as archived with a GitHub link only.
- `engines` field; CONTRIBUTING with the content review checklist.

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
