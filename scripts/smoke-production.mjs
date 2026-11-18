// Production smoke test. Credentials stay in the environment and are never printed.
//   SMOKE_EMAIL=... SMOKE_PASSWORD=... node scripts/smoke-production.mjs [baseUrl]
const base = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "https://leomath.cn").replace(/\/$/, "");
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
const timeout = 15000;

function requireEnv() {
  if (!email || !password) throw new Error("Set SMOKE_EMAIL and SMOKE_PASSWORD before running the smoke test.");
}

async function request(path, init = {}, referer = "/zh") {
  return fetch(base + path, {
    ...init,
    headers: {
      Origin: base,
      Referer: base + referer,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(timeout),
  });
}

async function expectOk(path, init = {}, referer = "/zh") {
  const response = await request(path, init, referer);
  if (response.status !== 200) throw new Error(`${init.method ?? "GET"} ${path}: expected 200, got ${response.status}`);
  return response;
}

function form(fields) {
  return new URLSearchParams(fields);
}

async function action(name, fields, cookie, referer) {
  const headers = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
  if (cookie) headers.Cookie = cookie;
  return expectOk(`/_actions/${name}`, {
    method: "POST",
    headers,
    body: form(fields),
  }, referer);
}

async function page(path, cookie) {
  const headers = cookie ? { Cookie: cookie } : {};
  const response = await expectOk(path, { headers });
  return response.text();
}

async function main() {
  requireEnv();
  for (const path of ["/zh", "/zh/concepts/derivative", "/zh/problems", "/zh/tools"]) {
    await page(path);
    console.log(`OK page ${path}`);
  }

  const home = await request("/zh");
  if (!home.headers.get("content-security-policy")) throw new Error("Missing Content-Security-Policy on /zh");
  console.log("OK enforced CSP header present");

  const login = await action("login", { locale: "zh", email, password, next: "/zh/account" }, "", "/zh/login");
  const cookies = typeof login.headers.getSetCookie === "function"
    ? login.headers.getSetCookie()
    : [login.headers.get("set-cookie") ?? ""];
  const cookie = cookies.join("; ").match(/leomath_session=[^;]+/)?.[0];
  if (!cookie) throw new Error("Login returned no leomath_session cookie");
  await page("/zh/account", cookie);
  console.log("OK login and account page");

  const marker = `Smoke check ${Date.now()}`;
  const conceptPath = "/zh/concepts/derivative";
  await action("addComment", {
    locale: "zh", type: "concept", slug: "derivative", body: marker, path: conceptPath,
  }, cookie, conceptPath);
  const withComment = await page(conceptPath, cookie);
  const item = withComment.split("<li").find((part) => part.includes(marker));
  const commentId = item?.match(/name="id" value="(\d+)"/)?.[1];
  if (!commentId) throw new Error("Test comment was not found after posting");
  console.log("OK comment posted");

  await action("deleteComment", { locale: "zh", id: commentId, path: conceptPath }, cookie, conceptPath);
  const afterDelete = await page(conceptPath, cookie);
  if (afterDelete.includes(marker)) throw new Error("Test comment is still visible after deletion");
  console.log("OK comment deleted");

  const answer = await action("checkAnswer", {
    locale: "zh", exercise: "derivative-1", answer: "10",
  }, cookie, conceptPath);
  const answerBody = await answer.text();
  if (!answerBody.includes('"derivative-1",true,"10"')) {
    throw new Error(`Unexpected exercise-check response: ${answerBody.slice(0, 200)}`);
  }
  console.log("OK exercise checked correctly");

  for (const path of ["/", "/zh"]) {
    const response = await expectOk(path);
    if (!response.headers.get("content-security-policy")) throw new Error(`CSP header missing on ${path}`);
  }

  for (const url of ["https://tree.leomath.cn/", "https://cms.leomath.cn/"]) {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (response.status !== 200) throw new Error(`${url}: expected 200, got ${response.status}`);
    console.log(`OK neighbor ${url}`);
  }

  console.log("Smoke test passed. On the server also check: docker compose logs web | grep '\\[csp\\]'");
}

main().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
