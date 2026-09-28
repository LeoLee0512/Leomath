# 部署 LeoMath 到阿里云 ECS

## 现状（2026-09）

| 项目 | 值 |
| --- | --- |
| 域名 | `leomath.cn`（阿里云域名 + 云解析 DNS，免费版） |
| DNS | `@` 与 `www` 两条 A 记录 → `8.130.33.10`，TTL 10 分钟 |
| 服务器 | 阿里云 ECS，公网 IP `8.130.33.10`，已安装 nginx（默认欢迎页） |
| 应用 | Docker Compose：`web`（Next.js，监听 3000）+ `db`（Postgres 16） |

`.cn` 域名在国内服务器上对公网提供 Web 服务需要完成 ICP 备案，备案通过前 80/443 端口可能被阻断。备案入口在阿里云控制台顶部的「备案」。

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

# 4. 启动（自动执行数据库迁移）
docker compose up -d --build
docker compose logs -f web   # 看到 "Ready" 即可

# 5. nginx 反向代理
sudo cp deploy/nginx.leomath.conf /etc/nginx/conf.d/leomath.conf
sudo rm -f /etc/nginx/conf.d/default.conf /etc/nginx/sites-enabled/default   # 去掉欢迎页
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

## 备份

```bash
docker compose exec db pg_dump -U leomath leomath | gzip > leomath-$(date +%F).sql.gz
```

## 排错

- `docker compose logs web`：应用日志；`docker compose logs db`：数据库。
- 看到 nginx 欢迎页：说明 `default.conf` 还在，或 `leomath.conf` 没有加载，`nginx -T | grep server_name` 检查。
- 502：容器没起来或没监听 3000，`docker compose ps`。
- 注册/登录报「出错了」：检查 `DATABASE_URL` 与 `db` 健康状态。
