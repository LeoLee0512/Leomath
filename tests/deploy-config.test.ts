import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("deployment response headers", () => {
  it("replaces rather than duplicates the upstream asset Cache-Control header", async () => {
    const config = await readFile("deploy/nginx.leomath.conf", "utf8");
    const start = config.indexOf("location /_astro/");
    const block = config.slice(start, config.indexOf("\n    }", start));
    expect(block).toContain("proxy_hide_header Cache-Control;");
    expect(block).toContain('add_header Cache-Control "public, max-age=31536000, immutable";');
    expect(block.indexOf("proxy_hide_header Cache-Control;")).toBeLessThan(block.indexOf("add_header Cache-Control"));
  });

  it("builds the production bundle with the production JSX runtime", async () => {
    const dockerfile = await readFile("Dockerfile", "utf8");
    const buildStage = dockerfile.split("FROM node:22-alpine AS build")[1].split("FROM node:22-alpine AS runtime")[0];
    expect(buildStage).toContain("ENV NODE_ENV=production");
  });
});
