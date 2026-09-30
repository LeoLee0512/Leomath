# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The site URL decides which host the app trusts behind nginx (security.allowedDomains in astro.config.mjs).
ARG SITE_URL=https://leomath.cn
ENV ASTRO_TELEMETRY_DISABLED=1 SITE_URL=$SITE_URL
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production ASTRO_TELEMETRY_DISABLED=1 HOST=0.0.0.0 PORT=3000
RUN addgroup -S leomath && adduser -S leomath -G leomath
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Reading times are computed from the MDX sources at request time.
COPY --from=build /app/content ./content
# Migration runner and SQL files.
COPY --from=build /app/db ./db
COPY --from=build /app/scripts/migrate.mjs ./scripts/migrate.mjs
USER leomath
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && node dist/server/entry.mjs"]
