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

- Astro 7（服务端渲染，`@astrojs/node` 独立服务器），TypeScript，Tailwind CSS 4
- 页面是纯 HTML；只有实验、工具和知识树是 React 19 孤岛（islands），进入视口时才加载各自的 JS
- 公式：Temml 在服务端把 LaTeX 渲染成 MathML，由浏览器原生排版；字体 STIX Two Math，裁剪到站内用到的字符（约 40 KB）
- MDX（Astro 内容集合 + remark-math，`src/lib/mdx-plugins.ts` 负责公式、块编号与标题锚点）
- 表单与交互：Astro Actions（登录、注册、进度、评论、判题），不开 JavaScript 也能用
- PostgreSQL via `pg`，手写 SQL 迁移（`db/migrations`）
- Vitest（数值算法与知识图谱完整性测试）
- Docker Compose 部署

## 目录 · Layout

```
content/concepts/<slug>/{zh,en}.mdx   数学正文（MDX + LaTeX）
src/content/graph.ts                  知识节点、前置关系、路线、实验
src/content/exercises.ts              练习题库与判题
src/content/software.ts               软件目录
src/pages/[locale]/                   页面（Astro）；src/pages/api/ 数据导出与 CSP 报告
src/layouts/Base.astro                页面骨架；src/components/site/ 页头、页脚、<head>
src/components/content/               文章块、公式、实验框、讨论区；exercises/ 练习
src/components/experiments/           交互实验（React 孤岛，islands/ 每个实验一个入口）
src/components/KnowledgeTree.tsx      交互式知识树（React 孤岛）
src/actions/index.ts                  表单与判题（Astro Actions）
src/lib/tex.ts                        LaTeX → MathML（Temml）；src/styles/math.css 公式样式与字体
src/lib/math/                         2×2 线性代数、ODE 积分器、概率
src/lib/{auth,db,progress}.ts         账户、会话、进度
src/i18n/                             语言配置与 UI 词典
src/middleware.ts                     语言跳转、登录用户、安全响应头与 CSP
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
node scripts/compile-mdx.mjs    # 编译全部 MDX，并检查站内每个公式都能被 Temml 解析
```

没有数据库也能运行：账户与进度功能会自动关闭，其余全部可用。

新增的内容用到了新的数学符号时，`npm test` 里的字体覆盖检查会失败，这时重新裁剪字体（需要 Python 的 fonttools 与 brotli：`pip install fonttools brotli`）：

```bash
npm run font:subset
```

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
2. 在 `content/concepts/<slug>/zh.mdx` 写正文，可选 `en.mdx`。可用组件：`<Problem>` `<Observe>` `<Conjecture>` `<Definition>` `<Theorem>` `<Proposition>` `<Lemma>` `<Corollary>` `<Proof>` `<Example>` `<Warning>` `<Application>` `<Remark>` `<Tool id="…" />` `<Experiment slug="…" />`。编号（定义 3.1、定理 3.2……）在编译时自动生成；只占一行的 `$$…$$` 是行间公式。
   新实验：组件放在 `src/components/experiments/`，在 `islands/` 加一个同名入口文件，并在 `src/components/content/Experiment.astro` 里加一行。
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
