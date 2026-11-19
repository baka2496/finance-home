// Checks that a Netlify production deploy contains both sync functions.
// 2026-11: the hourly scheduler was deployed without finance-sync-worker, so
// exchange holdings silently stopped updating for weeks.
// Usage: node scripts/verify-deploy.mjs [site origin]
import { readdirSync } from "node:fs";

const origin = (process.argv[2] || "https://caiwuju-finance-home.netlify.app").replace(/\/$/, "");
const expected = {
  // A scheduled function refuses public invocation; a missing one falls back to the SPA (404 on POST).
  "finance-sync": [403],
  // A background function is acknowledged with 202 before it checks the token.
  "finance-sync-worker": [202],
};

const local = readdirSync(new URL("../netlify/functions/", import.meta.url))
  .map((name) => name.replace(/\.m?[jt]s$/, ""));
const unchecked = local.filter((name) => !(name in expected));
if (unchecked.length) {
  console.error(`請把新的 Netlify 函式加入檢查清單：${unchecked.join(", ")}`);
  process.exit(1);
}

let failed = false;
for (const [name, okStatuses] of Object.entries(expected)) {
  const response = await fetch(`${origin}/.netlify/functions/${name}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
  });
  await response.body?.cancel();
  const ok = okStatuses.includes(response.status);
  failed ||= !ok;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}: HTTP ${response.status}${ok ? "" : "（這個函式沒有部署上去）"}`);
}
process.exitCode = failed ? 1 : 0;
