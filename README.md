# LeoMath

**理解数学，而不只是记住它。** · *Understand mathematics. Don't just memorise it.*

LeoMath（[leomath.cn](https://leomath.cn)）是 Leo 长期维护的个人数学学习与科学计算平台。它想做的是 GitHub（代码）、博客（文章）和视频（讲授）之间缺失的一层：**数学知识之间的结构关系，以及数学的可操作性**。

LeoMath is Leo's long-term personal platform for learning mathematics and scientific computing. It aims at the layer missing between GitHub (code), blogs (reading) and video (lecturing): **the structure connecting mathematical ideas, and the ability to operate on mathematics directly.**

```
知识结构 → 原理与推导 → 交互实验 → 练习 → 计算工具
Structure → Principles & derivation → Experiments → Exercises → Tools
```

## v0.1.1

第一版刻意很小，但产品人格完整：

- **知识树**：交互式 SVG，悬停任一节点，前置知识链亮起。
- **3 条完整路线**：微积分基础、线性代数基础、微分方程入门，共 12 个知识点，每个都从定义出发，经推导与证明，含练习。
- **3 个交互实验**（浏览器内实时计算，自建 Canvas 组件）：线性变换（拖动基向量）、ODE 数值解（Euler vs RK4，相图）、指数函数的导数（为什么 eˣ 的导数是自己）。
- **24 道练习**，数值/选择题，登录后记录尝试。
- **账户与进度**：邮箱 + 密码，会话存 Postgres，按知识点同步学习进度。
- **双语**：`/zh` 与 `/en`，首次访问按 `Accept-Language` 跳转，Cookie 记住选择；缺失翻译时回退到中文并标注。
- **软件页**：Leo 软件的介绍与下载入口，二进制托管在 GitHub Releases。
- **深色模式**：暖白 + 墨黑 + 少量 Leo 蓝；深色为黑板深墨蓝 + 米白公式。

## 技术栈 · Stack

- Next.js 16 (App Router, TypeScript), React 19, Tailwind CSS 4
- MDX（`@mdx-js/mdx` + remark-math + rehype-katex），KaTeX
- PostgreSQL via `pg`，手写 SQL 迁移（`db/migrations`）
- Vitest（数值算法与知识图谱完整性测试）
- Docker Compose 部署

## 目录 · Layout

```
content/concepts/<slug>/{zh,en}.mdx   数学正文（MDX + LaTeX）
src/content/graph.ts                  知识节点、前置关系、路线、实验
src/content/exercises.ts              练习题库与判题
src/content/software.ts               软件目录
src/components/experiments/           线性变换 / ODE / 指数导数 实验
src/components/KnowledgeTree.tsx      交互式知识树
src/lib/math/                         2×2 线性代数、ODE 积分器
src/lib/{auth,db,progress}.ts         账户、会话、进度
src/i18n/                             语言配置与 UI 词典
src/proxy.ts                          语言检测与跳转
db/migrations/                        SQL 迁移
```

## 本地开发 · Development

需要 Node.js ≥ 22.12 与 PostgreSQL。

```bash
cp .env.example .env            # 填写 DATABASE_URL
npm install
npm run db:migrate
npm run dev                     # http://localhost:3000
```

检查：

```bash
npm run typecheck && npm run lint && npm test
node scripts/compile-mdx.mjs    # 编译全部 MDX，KaTeX 严格模式
```

没有数据库也能运行：账户与进度功能会自动关闭，其余全部可用。

## 部署 · Deployment

生产环境（阿里云 ECS `8.130.33.10`，域名 `leomath.cn`）的完整步骤见 [deploy/DEPLOYMENT.md](./deploy/DEPLOYMENT.md)，nginx 配置见 [deploy/nginx.leomath.conf](./deploy/nginx.leomath.conf)。

```bash
cp .env.example .env
# 设置 POSTGRES_PASSWORD、SITE_URL（可选 WEB_PORT）
docker compose up -d --build
```

容器启动时自动执行迁移，然后监听 3000 端口。在前面放一个反向代理（Caddy / Nginx）终止 TLS 并指向 `leomath.cn`。

## 写内容 · Writing content

1. 在 `src/content/graph.ts` 添加节点（标题、摘要、前置、所属路线、实验），`status: "published"`。
2. 在 `content/concepts/<slug>/zh.mdx` 写正文，可选 `en.mdx`。可用组件：`<Observe>` `<Conjecture>` `<Definition>` `<Theorem>` `<Proposition>` `<Lemma>` `<Proof>` `<Example>` `<Application>` `<Remark>` `<Experiment slug="…" />`。
3. 在 `src/content/exercises.ts` 添加练习。
4. 在 `src/components/KnowledgeTree.tsx` 的 `positions` 中给节点一个坐标。
5. `npm test` 会验证图谱完整性（无环、引用存在、路线只含已发布节点）。

## 致谢 · Acknowledgements

概率路线借鉴了 [github.com/huzhuofan1020-svg](https://github.com/huzhuofan1020-svg) 中公开的概率论交互演示的思路（例如生日问题实验、章节规划）。内容与代码均在 LeoMath 中按自己的写法重写；每个借鉴处都在页面上标注了对应仓库的链接。

The probability path draws on ideas from the public probability demos at [github.com/huzhuofan1020-svg](https://github.com/huzhuofan1020-svg). Everything is rewritten in LeoMath's own style; each borrowed idea links to its source repository on the page.

## 前身 · Predecessor

MathForge（[LeoLee0512/MathLearn](https://github.com/LeoLee0512/MathLearn)，v0.3.1）是 LeoMath 的前身，已归档。它的实验、工具和两篇内容已在 LeoMath 中重写；迁移记录见 [ROADMAP.md](./ROADMAP.md)。

## 许可 · Licence

代码 MIT（[LICENSE](./LICENSE)）；数学正文与文档 CC BY-SA 4.0（[LICENSE-CONTENT](./LICENSE-CONTENT)）。
