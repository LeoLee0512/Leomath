import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { FEEDBACK_EMAIL } from "@/content/site";
import { pageMeta } from "@/lib/seo";

// Describes what the code actually stores: see db/migrations, src/lib/auth.ts and src/proxy.ts.
// Update this page (and its date) whenever those change.
const UPDATED = "2026-09-29";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return locale === "zh"
    ? pageMeta(locale, "/privacy", { title: "隐私政策", description: "LeoMath 收集哪些信息、为什么收集、保存多久，以及 Cookie 的用途。" })
    : pageMeta(locale, "/privacy", { title: "Privacy policy", description: "What LeoMath collects, why, for how long, and what its cookies do." });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const mail = <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>;
  return (
    <div className="container py-14">
      <div className="prose-math max-w-2xl">
        {locale === "zh" ? (
          <>
            <h1>隐私政策</h1>
            <p className="text-muted text-sm">更新于 {UPDATED}</p>
            <p>LeoMath 是个人维护的数学学习网站。不注册也能使用全部学习内容、实验与工具；只有登录后的进度记录、练习记录和评论需要账户。本页说明站点实际保存了什么。</p>

            <h2>不登录时</h2>
            <p>站点不使用任何第三方统计、广告或追踪脚本，所有页面资源（包括字体和公式样式）都从本站加载。服务器会像绝大多数网站一样，在访问日志中记录请求时间、IP 地址、请求的页面和浏览器标识，仅用于安全防护与故障排查，定期滚动删除。</p>

            <h2>注册与登录后</h2>
            <ul>
              <li><strong>账户信息</strong>：邮箱、你选择填写的昵称、界面语言、注册时间。密码只以 bcrypt 哈希形式保存，任何人（包括站长）都无法看到原密码。</li>
              <li><strong>学习记录</strong>：每个知识点的学习状态（学习中 / 已完成），以及每次练习提交的答案、是否正确和时间，用于显示你的进度。</li>
              <li><strong>评论</strong>：评论内容与发布时间会公开显示，署名为你的昵称；没有昵称时显示部分隐去的邮箱。单独删除一条评论后它不再显示，但记录会保留在数据库中，以便处理滥用与投诉；注销账户时这些记录会一并删除。</li>
            </ul>
            <p>这些信息只用于提供上述功能，不出售、不用于广告，也不提供给第三方，法律法规要求的情形除外。数据保存在位于中国大陆的服务器上。</p>

            <h2>Cookie 与本地存储</h2>
            <ul>
              <li><code>leomath_session</code>：登录凭证，仅在登录后设置，有效期 30 天。它是一个随机令牌，数据库中只保存其哈希；设置为 HttpOnly，页面脚本无法读取。退出登录即删除。</li>
              <li><code>leomath_locale</code>：记住你选择的语言（中文 / English），有效期一年。</li>
              <li>浏览器本地存储：记住明暗主题，以及部分实验是否已显示过操作提示。这些只保存在你的浏览器里，不会发送到服务器。</li>
            </ul>
            <p>站点没有任何用于追踪或广告的 Cookie。</p>

            <h2>你的权利</h2>
            <p>登录后，在“<Link href="/zh/account">我的学习</Link>”页面底部可以自己完成：</p>
            <ul>
              <li><strong>下载我的数据</strong>：账户信息、学习进度、全部练习提交和全部评论，导出为一个 JSON 文件。</li>
              <li><strong>注销账户</strong>：输入密码确认后立即生效。账户以及与之关联的学习进度、练习记录和全部评论会从数据库中永久删除，无法恢复。</li>
            </ul>
            <p>如需更正信息，或无法登录时需要删除账户，请写信到 {mail}。</p>

            <h2>变更</h2>
            <p>本政策如有变化，会更新本页顶部的日期；重大变化会在站点上另行说明。相关条款见<Link href="/zh/terms">用户协议</Link>。</p>
          </>
        ) : (
          <>
            <h1>Privacy policy</h1>
            <p className="text-muted text-sm">Updated {UPDATED}</p>
            <p>LeoMath is a mathematics learning site maintained by one person. All learning content, experiments and tools work without an account; only progress tracking, exercise history and comments need one. This page describes what the site actually stores.</p>

            <h2>Without an account</h2>
            <p>The site uses no third-party analytics, advertising or tracking scripts, and every page resource (fonts and maths styles included) is served from this site. Like most websites, the server’s access log records the time, IP address, requested page and browser identifier of each request, used only for security and troubleshooting and rotated regularly.</p>

            <h2>With an account</h2>
            <ul>
              <li><strong>Account</strong>: your email, the display name you choose to give, interface language and sign-up time. Passwords are stored only as bcrypt hashes; nobody, the maintainer included, can see the original.</li>
              <li><strong>Learning records</strong>: the status of each concept (learning / done) and every exercise answer you submit, whether it was correct and when, used to show your progress.</li>
              <li><strong>Comments</strong>: comment text and time are shown publicly under your display name, or a partly masked email if you have none. When you delete a single comment it is no longer shown, but the record is kept in the database to handle abuse and complaints; deleting your account removes those records too.</li>
            </ul>
            <p>This information is used only to provide these features. It is not sold, not used for advertising and not shared with third parties, except where the law requires. Data is stored on servers in mainland China.</p>

            <h2>Cookies and local storage</h2>
            <ul>
              <li><code>leomath_session</code>: your sign-in, set only when you log in, valid for 30 days. It is a random token of which the database stores only a hash; it is HttpOnly, so page scripts cannot read it. Logging out deletes it.</li>
              <li><code>leomath_locale</code>: remembers your language choice (Chinese / English) for one year.</li>
              <li>Browser local storage: remembers the light/dark theme and whether some experiments have shown their hints. It stays in your browser and is never sent to the server.</li>
            </ul>
            <p>The site sets no tracking or advertising cookies.</p>

            <h2>Your rights</h2>
            <p>When signed in, the bottom of the <Link href="/en/account">My learning</Link> page lets you do this yourself:</p>
            <ul>
              <li><strong>Download my data</strong>: your account details, learning progress, every exercise answer and every comment, as one JSON file.</li>
              <li><strong>Delete account</strong>: takes effect as soon as you confirm with your password. The account and its progress, exercise history and all comments are permanently removed from the database and cannot be recovered.</li>
            </ul>
            <p>To correct information, or to delete an account you can no longer sign in to, write to {mail}.</p>

            <h2>Changes</h2>
            <p>If this policy changes, the date at the top of this page is updated; significant changes are announced on the site. See also the <Link href="/en/terms">terms of use</Link>.</p>
          </>
        )}
      </div>
    </div>
  );
}
