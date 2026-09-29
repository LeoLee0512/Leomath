# 部署 LeoMath 到阿里云 ECS

## 现状（2026-09）

| 项目 | 值 |
| --- | --- |
| 域名 | `leomath.cn`（阿里云域名 + 云解析 DNS，免费版） |
| DNS | `@` 与 `www` 两条 A 记录 → `8.130.33.10`，TTL 10 分钟 |
| 服务器 | 阿里云 ECS，公网 IP `8.130.33.10`，已安装 nginx（默认欢迎页） |
| 应用 | Docker Compose：`web`（Next.js，监听 3000）+ `db`（Postgres 16） |

`.cn` 域名在国内服务器上对公网提供 Web 服务需要完成 ICP 备案，备案通过前 80/443 端口可能被阻断。备案入口在阿里云控制台顶部的「备案」。

## 这台服务器是共享的（重要）

> **2026-09-28 更新：服务器已清空重装，目前只部署了 LeoMath（leomath.cn）。** 下表是重装前的布局，仅作历史参考。Leo Tree 与 MathForge 目前都不在线。Leo Tree 的新部署方案是 **Docker + `tree.leomath.cn`**，与 LeoMath 同机、共用系统 nginx：步骤在 leotree 仓库的 `docs/DOCKER_DEPLOYMENT.md`（容器只发布 `127.0.0.1:3008`，nginx 配置同本仓库 `deploy/nginx.tree.conf`，云解析需先加 A 记录 `tree`）。不要再用裸 IP 和 IP 证书；LeoMath 站内的链接也只指向域名，Leo Tree 已于 2026-09-28 上线于 https://tree.leomath.cn/，`src/content/software.ts` 的 `useUrl` 指向它。 Computational Mechanics Solver 同样以 Docker 部署在本机，域名 `cms.leomath.cn`，容器发布 `127.0.0.1:8765`，步骤在 first-app 仓库的 `docs/DOCKER_DEPLOYMENT.md`。

同一台 ECS 上曾经运行着另外两个 Leo 产品，部署或改 nginx 前必须知道：

| 产品 | 仓库 | 监听 | 入口 | 运行方式 |
| --- | --- | --- | --- | --- |
| Leo Tree 1.0.0-beta.3 | `LeoLee0512/leotree` | 系统 nginx **80/443**，`server_name 8.130.33.10`，反代到 `127.0.0.1:3008` | https://8.130.33.10/ | systemd `leotree`，用户 `leotree`，运行目录 `/opt/leotree/current`，环境 `/etc/leotree.env`；IP 证书由 `leotree-cert-renew.timer` 每 6 小时续期 |
| MathForge 0.3.1 | `LeoLee0512/MathLearn` | **8090**（独立 nginx 1.21.5 实例或容器） | http://8.130.33.10:8090/ | 静态站，`/var/www/mathforge`，脚本 `deploy/deploy.sh` |
| LeoMath | `LeoLee0512/Leomath` | 系统 nginx 80/443，`server_name leomath.cn www.leomath.cn`，反代到 `127.0.0.1:3000` | https://leomath.cn | Docker Compose |

规则：

- 三个站点靠 `server_name` 区分，共用 80/443。**不要删除或改写 `/etc/nginx/sites-available/leotree`**，也不要给任何 server 块加 `default_server`。
- `certbot --nginx -d leomath.cn` 只会改 leomath 的 server 块；Leo Tree 的 IP 证书路径是 `/etc/letsencrypt/live/8.130.33.10/`，不要动。
- 80 端口的 `/.well-known/acme-challenge/` 两边都要留，否则对方续期失败。
- 改完 nginx 后逐个验证：`curl -sI https://leomath.cn`、`curl -skI https://8.130.33.10/`、`curl -sI http://127.0.0.1:8090/` 都应是 200 或 301/302，不能出现 nginx 欢迎页。
- 可选：用子域名替代 IP 入口，配置见 `deploy/nginx.tree.conf`（tree.leomath.cn → 3008）与 `deploy/nginx.mathforge.conf`（mathforge.leomath.cn → 8090），需先在云解析加 A 记录。Leo Tree 的知识按浏览器 origin 保存，换域名后用户需要用完整备份 ZIP 迁移。

## 首次部署

在 ECS 上（Ubuntu / Alibaba Cloud Linux 均可）：

```bash
# 1. Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. 代码
git clone https://github.com/LeoLee0512/Leomath.git /opt/leomath
cd /opt/leomath

# 3. 环境变量
cp .env.example .env
# 编辑 .env：
#   POSTGRES_PASSWORD=<随机强密码>
#   SITE_URL=https://leomath.cn
#   WEB_PORT=3000   （只在本机监听时，把 docker-compose.yml 的 ports 改成 "127.0.0.1:3000:3000"）
#   ADMIN_EMAILS=<你的登录邮箱>   （可删除任何评论；多个用逗号分隔）

# 4. 启动（自动执行数据库迁移）
docker compose up -d --build
docker compose logs -f web   # 看到 "Ready" 即可

# 5. nginx 反向代理
sudo cp deploy/nginx.leomath.conf /etc/nginx/conf.d/leomath.conf
# 只去掉 nginx 自带的默认站点；leotree、mathforge 的站点配置一律保留
sudo rm -f /etc/nginx/conf.d/default.conf /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 6. HTTPS（Let's Encrypt）
sudo apt install -y certbot python3-certbot-nginx   # 或 dnf install
sudo certbot --nginx -d leomath.cn -d www.leomath.cn
```

阿里云安全组需要放行入方向 TCP 80 与 443（3000 不要对公网开放）。

## 更新

```bash
cd /opt/leomath
git pull
docker compose up -d --build
```

新的 SQL 迁移放在 `db/migrations/` 下，容器启动时自动应用。

## 安全响应头、备案号

- **CSP**：生产构建默认发送 `Content-Security-Policy-Report-Only`，违规会以 `[csp] ...` 写进 web 容器日志。观察一段时间：
  ```bash
  docker compose logs web | grep "\[csp\]"
  ```
  日志干净后，在 `.env` 里设 `CSP_ENFORCE=1` 并 `docker compose up -d --build`（这是**构建时**设置，只重启不生效）。
- **HSTS**：`SITE_URL` 以 `https://` 开头时自动发送 `Strict-Transport-Security: max-age=15552000`（180 天）。只在 HTTPS 已稳定可用后部署这一版；一旦浏览器收到 HSTS，180 天内都只会用 HTTPS 访问。
- **ICP 备案号**：备案通过后在 `.env` 里设 `ICP_NUMBER=京ICP备xxxxxxxx号-1`，重启即可，页脚会显示并链接到 beian.miit.gov.cn。

## 备份

每天一次，只保留最近 30 天。隐私政策承诺“注销的数据 30 天内从所有备份中消失”，所以**不要**另外长期保存旧备份。

```bash
sudo mkdir -p /opt/leomath/backups
# crontab -e（root），每天 03:30：
30 3 * * * cd /opt/leomath && docker compose exec -T db pg_dump -U leomath leomath | gzip > backups/leomath-$(date +\%F).sql.gz && find backups -name 'leomath-*.sql.gz' -mtime +30 -delete
```

手动备份（同样放进 `backups/`，30 天后会被自动删除）：

```bash
docker compose exec -T db pg_dump -U leomath leomath | gzip > /opt/leomath/backups/leomath-$(date +%F).sql.gz
```

## 排错

- `docker compose logs web`：应用日志；`docker compose logs db`：数据库。
- 看到 nginx 欢迎页：说明 `default.conf` 还在，或 `leomath.conf` 没有加载，`nginx -T | grep server_name` 检查。
- 502：容器没起来或没监听 3000，`docker compose ps`。
- 注册/登录报「出错了」：检查 `DATABASE_URL` 与 `db` 健康状态。
