# Contributing to LeoMath

LeoMath is a personal site built in public. The most useful contribution is a report of a **mathematical error or an unclear explanation**: open a GitHub issue with the page URL and the sentence or formula in question. Pull requests for content are welcome but are reviewed by hand and merged slowly.

## Adding a concept

1. Add the node to `src/content/graph.ts` (title, summary, prerequisites, path, experiments) and give it a position in `src/components/KnowledgeTree.tsx`.
2. Write `content/concepts/<slug>/zh.mdx` (and `en.mdx`) in the order problem → observe → conjecture → definition → theorem → proof → common mistake → application. Use the semantic blocks: `<Problem>` `<Observe>` `<Conjecture>` `<Definition>` `<Theorem>` `<Proposition>` `<Lemma>` `<Corollary>` `<Proof>` `<Example>` `<Warning>` `<Application>` `<Remark>` `<Experiment slug="…" />`.
3. Add exercises to `src/content/exercises.ts`.
4. Run `npm run check`; it verifies the graph has no cycles, every reference resolves, every article compiles and every formula parses. If the new content uses a symbol the math font does not have yet, the font test fails: run `npm run font:subset` (needs `pip install fonttools brotli`).

## Content review checklist

A formula compiling is not a proof that it is right. Before publishing:

- Every exercise answer is computed by **two independent methods** and both agree.
- Every multiple-choice distractor is checked to be actually wrong, and the correct option is unique.
- Every theorem states its hypotheses, and every proof uses each of them (or the article says which are dispensable).
- Every counterexample is verified to violate exactly the hypothesis it is meant to illustrate.
- Prerequisite links in `graph.ts` reflect what the proofs actually use.

An LLM agreeing that something is correct does not satisfy any item above.

## Licence

Code is MIT; content is CC BY-SA 4.0 (see LICENSE-CONTENT). By contributing you agree your contribution is licensed the same way.
