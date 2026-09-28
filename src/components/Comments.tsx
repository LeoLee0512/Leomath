import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { currentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { listComments, isAdmin, COMMENT_MAX_LENGTH, type CommentTargetType } from "@/lib/comments";
import { authorLabel, formatCommentDate } from "@/lib/comments-format";
import { deleteCommentAction } from "@/app/actions";
import { FEEDBACK_EMAIL } from "@/content/site";
import { RichText } from "./Math";
import { CommentForm } from "./CommentForm";

/**
 * Discussion under a concept, experiment or software page, plus the feedback address.
 * Server component: the list is rendered per request; posting goes through a server action.
 */
export async function Comments({ type, slug, path, locale, t }: {
  type: CommentTargetType;
  slug: string;
  /** The page path, revalidated after a post so the new comment appears. */
  path: string;
  locale: Locale;
  t: Dictionary;
}) {
  const tc = t.comments;
  const user = await currentUser();
  const comments = hasDatabase() ? await listComments({ type, slug }).catch(() => []) : [];
  const admin = user ? isAdmin(user.email) : false;
  return (
    <section id="comments" className="mt-16 border-t border-rule pt-8 scroll-mt-24">
      <h2 className="display text-2xl font-semibold">{tc.title}</h2>
      <p className="mt-2 text-sm text-muted">
        {tc.feedback} <a href={`mailto:${FEEDBACK_EMAIL}`} className="text-leo hover:underline mono">{FEEDBACK_EMAIL}</a>
      </p>

      {comments.length === 0 ? (
        <p className="mt-6 text-sm text-ink-2">{tc.empty}</p>
      ) : (
        <ol className="mt-6 space-y-5">
          {comments.map((c) => {
            const mine = user?.id === c.userId;
            return (
              <li key={c.id} className="border border-rule bg-paper p-4 md:p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium text-ink">{authorLabel(c.author.displayName, c.author.email)}</span>
                  <time dateTime={c.createdAt.toISOString()} className="mono text-xs text-muted">{formatCommentDate(c.createdAt, locale)}</time>
                  {(mine || admin) && (
                    <form action={deleteCommentAction} className="ml-auto">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="path" value={path} />
                      <button className="text-xs text-muted hover:text-e1">{tc.delete}</button>
                    </form>
                  )}
                </div>
                <div className="mt-2 text-[0.95rem] leading-relaxed whitespace-pre-wrap prose-math">
                  <RichText>{c.body}</RichText>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {!hasDatabase() ? null : user ? (
        <CommentForm type={type} slug={slug} path={path} locale={locale} t={tc} maxLength={COMMENT_MAX_LENGTH} />
      ) : (
        <p className="mt-6 text-sm text-muted">
          <Link href={`/${locale}/login?next=${encodeURIComponent(path)}`} className="text-leo hover:underline">{t.nav.login}</Link> · {tc.loginToComment}
        </p>
      )}
    </section>
  );
}
