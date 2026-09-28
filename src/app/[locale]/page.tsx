import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths, getConcept, experimentsForConcept } from "@/content/graph";
import { exercisesForConcept } from "@/content/exercises";
import { software } from "@/content/software";
import { LinearTransform } from "@/components/experiments/LinearTransform";
import { ExponentialDerivative } from "@/components/experiments/ExponentialDerivative";
import { KnowledgeTree } from "@/components/KnowledgeTree";
import { M, MB } from "@/components/Math";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      {/* 1. Hero: a quiet mathematical canvas with a real object to play with. */}
      <section className="relative overflow-hidden">
        <GridBackdrop />
        <div className="container relative grid gap-10 lg:grid-cols-[1.05fr_1fr] items-center py-14 md:py-20 lg:py-24">
          <div className="max-w-xl">
            <h1 className="display text-[2.4rem] leading-[1.15] md:text-[3.2rem] font-semibold">{t.home.heroTitle}</h1>
            <p className="mt-6 text-lg text-ink-2 leading-relaxed">{t.home.heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={`/${locale}/learn`} className="btn btn-primary">{t.home.ctaExplore} →</Link>
              <Link href={`/${locale}/software`} className="btn btn-ghost">{t.home.ctaSoftware}</Link>
            </div>
            <div className="mt-14 hidden lg:block">
              <p className="display text-xl text-ink">{t.home.heroCaptionA}</p>
              <p className="display text-xl text-ink-2 mt-1">{t.home.heroCaptionB}</p>
              <Link href={`/${locale}/concepts/linear-maps`} className="mt-4 inline-block text-sm text-leo hover:underline">{t.home.heroLink}</Link>
            </div>
          </div>
          <div>
            <p className="exp-control text-muted mb-2">{t.home.heroHint}</p>
            <LinearTransform locale={locale} compact />
            <div className="mt-6 lg:hidden">
              <p className="display text-lg text-ink">{t.home.heroCaptionA}</p>
              <p className="display text-lg text-ink-2">{t.home.heroCaptionB}</p>
              <Link href={`/${locale}/concepts/linear-maps`} className="mt-2 inline-block text-sm text-leo hover:underline">{t.home.heroLink}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The knowledge tree: mathematics is connected. */}
      <section className="section hairline">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="display text-3xl md:text-4xl font-semibold">{t.home.treeTitle}</h2>
            <p className="mt-4 text-ink-2 leading-relaxed">{t.home.treeSubtitle}</p>
          </div>
          <div className="mt-10">
            <KnowledgeTree locale={locale} />
          </div>
        </div>
      </section>

      {/* 3. How LeoMath teaches: one real example. */}
      <section className="section hairline">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="eyebrow">{t.home.methodChainLead}</p>
            <h2 className="display text-3xl md:text-4xl font-semibold mt-3">{t.home.methodTitle}</h2>
            <p className="mt-4 text-ink-2 leading-relaxed">{t.home.methodLead}</p>
            <div className="mt-6 prose-math">
              <MB>{"f(x)=a^{x},\\qquad \\frac{f(x+h)-f(x)}{h}=a^{x}\\cdot\\frac{a^{h}-1}{h}"}</MB>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
              {t.home.methodChain.map((step, i) => (
                <span key={step} className="inline-flex items-center gap-2">
                  <span className="border border-ink-2 px-2 py-0.5 rounded-[3px]">{step}</span>
                  {i < t.home.methodChain.length - 1 && <span className="text-muted">→</span>}
                </span>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-3 text-lg display">
              <span>{t.home.methodIntuition}</span>
              <span className="text-muted">⟶</span>
              <span className="border border-ink px-2 py-0.5 rounded-[3px] font-semibold">{t.home.methodRigor}</span>
            </div>
            <p className="mt-3 text-ink-2 leading-relaxed max-w-md">{t.home.methodBoth}</p>
            <Link href={`/${locale}/concepts/derivative`} className="mt-5 inline-block text-sm text-leo hover:underline">{t.home.methodLink}</Link>
          </div>
          <ExponentialDerivative locale={locale} compact />
        </div>
      </section>

      {/* 4. What to learn today: three complete paths, honest counts. */}
      <section className="section hairline">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="display text-3xl md:text-4xl font-semibold">{t.home.pathsTitle}</h2>
            <p className="mt-4 text-ink-2 leading-relaxed">{t.home.pathsSubtitle}</p>
          </div>
          <div className="mt-10 grid gap-px bg-rule md:grid-cols-3 border border-rule">
            {paths.map((p) => {
              const nExp = new Set(p.concepts.flatMap((c) => experimentsForConcept(c).map((e) => e.slug))).size;
              const nEx = p.concepts.reduce((s, c) => s + exercisesForConcept(c).length, 0);
              return (
                <Link key={p.slug} href={`/${locale}/learn/${p.slug}`} className="bg-paper p-7 hover:bg-paper-2 transition-colors flex flex-col">
                  <h3 className="display text-xl font-semibold">{p.title[locale]}</h3>
                  <p className="mt-2 text-ink-2 text-sm leading-relaxed">{p.subtitle[locale]}</p>
                  <ol className="mt-5 space-y-1 text-sm">
                    {p.concepts.map((c, i) => (
                      <li key={c} className="flex gap-2"><span className="mono text-muted w-4">{i + 1}</span>{getConcept(c)!.title[locale]}</li>
                    ))}
                  </ol>
                  <p className="mt-6 pt-4 border-t border-rule text-xs mono text-muted">{t.home.pathsCounts(p.concepts.length, nExp, nEx)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Leo Lab */}
      <section className="section hairline">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="display text-3xl md:text-4xl font-semibold">{t.home.labTitle}</h2>
            <p className="mt-4 text-ink-2 leading-relaxed">{t.home.labSubtitle}</p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { title: t.home.labExperiments, desc: t.home.labExperimentsDesc, formula: "\\dot{x}=\\sigma(y-x)", href: `/${locale}/explore`, live: true },
              { title: t.home.labComputing, desc: t.home.labComputingDesc, formula: "\\|y_n-y(t_n)\\|=O(h^4)", href: `/${locale}/explore/ode-explorer`, live: true },
              { title: t.home.labDevlog, desc: t.home.labDevlogDesc, formula: "\\text{v}0.1.0", href: `/${locale}/about`, live: false },
            ].map((card) => (
              <Link key={card.title} href={card.href} className="group block border-t border-ink-2 pt-5">
                <div className="text-muted text-lg h-8"><M>{card.formula}</M></div>
                <h3 className="display text-xl font-semibold mt-3 group-hover:text-leo transition-colors">{card.title}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">{card.desc}</p>
                {!card.live && <p className="mt-3 text-xs text-muted">{t.home.labComing}</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Leo Software */}
      <section className="section hairline">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="display text-3xl md:text-4xl font-semibold">{t.home.softwareTitle}</h2>
            <p className="mt-4 text-ink-2 leading-relaxed">{t.home.softwareSubtitle}</p>
          </div>
          <div className="mt-10 max-w-2xl">
            {software.map((s) => (
              <div key={s.slug} className="border border-rule p-7 bg-paper">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="display text-2xl font-semibold">{s.name}</h3>
                  <span className="mono text-xs text-muted">{s.latest.platforms.join(" · ")}</span>
                  <span className="mono text-xs text-muted">v{s.latest.version}</span>
                </div>
                <p className="mt-2 text-ink-2">{s.tagline[locale]}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/${locale}/software/${s.slug}`} className="btn btn-ghost btn-small">{t.home.softwareLearn}</Link>
                  <a href={s.latest.downloadUrl} className="btn btn-primary btn-small" rel="noopener">{t.home.softwareDownload}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/** A real coordinate grid, not decoration: unit squares, axes through the origin of the hero. */
function GridBackdrop() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="var(--grid)" strokeWidth="1" />
        </pattern>
        <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--paper)" stopOpacity="0.2" />
          <stop offset="0.75" stopColor="var(--paper)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--paper)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-grid)" />
      <rect width="100%" height="100%" fill="url(#hero-fade)" />
    </svg>
  );
}
