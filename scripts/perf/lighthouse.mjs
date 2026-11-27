#!/usr/bin/env node
// Mide rendimiento móvil (Lighthouse, 4G lenta simulada + CPU 4× más lenta).
// Uso: npm run perf -- http://localhost:3000   (servidor de producción ya iniciado)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3000";
const pages = ["/", "/menu", "/platillo/sopa-de-mariscos"];
const chrome = process.env.CHROME_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
mkdirSync("reports/tmp", { recursive: true });

const rows = [];
for (const path of pages) {
  const out = `reports/tmp/lh-${path.replace(/\W+/g, "_") || "home"}.json`;
  execFileSync("npx", ["lighthouse", base + path, "--quiet", "--output=json", `--output-path=${out}`,
    "--only-categories=performance,accessibility,best-practices,seo", "--chrome-flags=--headless=new --no-sandbox"],
    { stdio: "inherit", env: { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) } });
  const r = JSON.parse(readFileSync(out, "utf8"));
  const a = r.audits;
  rows.push({
    página: path,
    rendimiento: Math.round(r.categories.performance.score * 100),
    accesibilidad: Math.round(r.categories.accessibility.score * 100),
    "buenas prácticas": Math.round(r.categories["best-practices"].score * 100),
    seo: Math.round(r.categories.seo.score * 100),
    LCP: a["largest-contentful-paint"].displayValue,
    CLS: a["cumulative-layout-shift"].displayValue,
    TBT: a["total-blocking-time"].displayValue,
    "peso total": `${Math.round(a["total-byte-weight"].numericValue / 1024)} KB`,
  });
}
console.table(rows);
writeFileSync("reports/lighthouse-summary.json", JSON.stringify({ date: new Date().toISOString(), base, rows }, null, 2));
