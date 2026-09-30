import { Component, type ComponentType, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";

const copy = {
  zh: { failed: "这个交互部分出错了。", retry: "重新加载" },
  en: { failed: "This interactive part ran into an error.", retry: "Reload it" },
};

/**
 * Catches an error thrown while an island renders. Without it React unmounts the whole island and the
 * experiment or tool silently disappears from the page; with it the reader sees a message and can reload it.
 */
export class IslandBoundary extends Component<{ locale: Locale; children: ReactNode }, { failed: boolean; key: number }> {
  state = { failed: false, key: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[island]", error);
  }

  render() {
    if (!this.state.failed) return <div key={this.state.key}>{this.props.children}</div>;
    const t = copy[this.props.locale];
    return (
      <div className="exp-frame px-4 py-6 text-sm text-ink-2 flex flex-wrap items-center gap-3" role="alert">
        <span>{t.failed}</span>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => this.setState((s) => ({ failed: false, key: s.key + 1 }))}>{t.retry}</button>
      </div>
    );
  }
}

/** The same component, rendered inside an IslandBoundary. */
export function withBoundary<P extends { locale: Locale }>(Inner: ComponentType<P>) {
  function Bounded(props: P) {
    return (
      <IslandBoundary locale={props.locale}>
        <Inner {...props} />
      </IslandBoundary>
    );
  }
  Bounded.displayName = `withBoundary(${Inner.displayName ?? Inner.name})`;
  return Bounded;
}
