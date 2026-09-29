import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { FEEDBACK_EMAIL } from "@/content/site";
import { pageMeta } from "@/lib/seo";

const UPDATED = "2026-09-29";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return locale === "zh"
    ? pageMeta(locale, "/terms", { title: "用户协议", description: "使用 LeoMath、发表评论与引用站内内容的规则。" })
    : pageMeta(locale, "/terms", { title: "Terms of use", description: "Rules for using LeoMath, posting comments and reusing its content." });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const mail = <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>;
  return (
    <div className="container py-14">
      <div className="prose-math max-w-2xl">
        {locale === "zh" ? (
          <>
            <h1>用户协议</h1>
            <p className="text-muted text-sm">更新于 {UPDATED}</p>
            <p>使用 LeoMath 即表示你同意以下规则。个人信息如何处理，见<Link href="/zh/privacy">隐私政策</Link>。</p>

            <h2>站内内容</h2>
            <p>数学正文与文档采用 <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans" rel="license noopener">CC BY-SA 4.0</a> 许可：可以自由转载和改编，但需署名 LeoMath 并以相同许可发布。站点代码采用 MIT 许可。个别实验的思路参考了他人的公开作品，页面上已注明来源。</p>
            <p>内容力求准确，但难免有错。它用于学习与参考，不构成任何专业意见；发现错误欢迎写信到 {mail}。</p>

            <h2>评论</h2>
            <ul>
              <li>评论公开可见。请只发表与数学学习相关、你有权发表的内容。</li>
              <li>不得发布违法违规内容、人身攻击、骚扰、广告或垃圾信息，不得冒充他人。</li>
              <li>评论的著作权归你所有。发表即表示你授权 LeoMath 在本站展示、存档该评论。</li>
              <li>站长可以删除违反本协议的评论，情节严重的可以停用账户。</li>
            </ul>

            <h2>账户</h2>
            <p>请妥善保管密码。发现账户被他人使用，请立即修改密码并写信告知。你可以随时在“我的学习”页面自行注销账户，详见隐私政策。</p>

            <h2>软件下载</h2>
            <p>软件页提供的程序按现状提供。安装前请确认来源为本站页面所列地址。</p>

            <h2>变更与联系</h2>
            <p>本协议如有变化，会更新本页顶部的日期。任何问题请写信到 {mail}。</p>
          </>
        ) : (
          <>
            <h1>Terms of use</h1>
            <p className="text-muted text-sm">Updated {UPDATED}</p>
            <p>By using LeoMath you agree to these rules. How personal information is handled is described in the <Link href="/en/privacy">privacy policy</Link>.</p>

            <h2>Site content</h2>
            <p>Mathematical text and documentation are licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license noopener">CC BY-SA 4.0</a>: you may share and adapt them, with attribution to LeoMath and under the same licence. The site’s code is MIT-licensed. Some experiments draw on ideas from other people’s public work; the source is noted on the page.</p>
            <p>The content aims to be accurate but may contain mistakes. It is for learning and reference and is not professional advice of any kind; please report errors to {mail}.</p>

            <h2>Comments</h2>
            <ul>
              <li>Comments are public. Post only content related to learning mathematics that you have the right to post.</li>
              <li>No unlawful content, personal attacks, harassment, advertising or spam, and no impersonation.</li>
              <li>You keep the copyright of your comments. By posting you allow LeoMath to display and archive them on this site.</li>
              <li>The maintainer may remove comments that break these rules and, in serious cases, disable accounts.</li>
            </ul>

            <h2>Accounts</h2>
            <p>Keep your password safe. If someone else uses your account, change your password at once and write to us. You can delete your account yourself at any time from the My learning page; see the privacy policy.</p>

            <h2>Software downloads</h2>
            <p>Programs offered on the software pages are provided as they are. Before installing, make sure the download comes from an address listed on this site.</p>

            <h2>Changes and contact</h2>
            <p>If these terms change, the date at the top of this page is updated. For any question, write to {mail}.</p>
          </>
        )}
      </div>
    </div>
  );
}
