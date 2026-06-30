#!/usr/bin/env node
/**
 * Genera docs/PROJECT_STATUS.md con métricas vivas del proyecto.
 *
 * Uso:
 *   node scripts/update-status.mjs            # regenera el doc
 *   npm run status                            # idem (corre tests+coverage antes)
 *
 * El script NO corre los tests por sí mismo; lee los artefactos que deja
 * `vitest run --coverage` (coverage/coverage-summary.json) y el reporte JSON
 * de tests (coverage/test-results.json). El script `npm run status` los genera
 * primero. Si faltan, las secciones afectadas muestran "n/d".
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const r = (...p) => join(ROOT, ...p);

// --- Utilidades -----------------------------------------------------------

/** Recorre un directorio recursivamente devolviendo rutas de archivo. */
function walk(dir, ignore = new Set(["node_modules", ".next", ".git", "coverage"])) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (ignore.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full, ignore));
    else out.push(full);
  }
  return out;
}

/** Cuenta líneas no vacías de un archivo. */
function countLines(file) {
  return readFileSync(file, "utf8").split("\n").length;
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

// --- Métricas de código ---------------------------------------------------

function codeMetrics() {
  const all = walk(r("."));
  const buckets = {
    "TypeScript (.ts)": (f) => extname(f) === ".ts" && !f.includes("/tests/"),
    "React (.tsx)": (f) => extname(f) === ".tsx",
    "Tests (.test.*)": (f) => /\.test\.(ts|tsx)$/.test(f),
    "Estilos (.css)": (f) => extname(f) === ".css",
    "SQL (.sql)": (f) => extname(f) === ".sql",
  };
  const rows = {};
  let totalLines = 0;
  let totalFiles = 0;
  for (const [label, match] of Object.entries(buckets)) {
    const files = all.filter(match);
    const lines = files.reduce((acc, f) => acc + countLines(f), 0);
    rows[label] = { files: files.length, lines };
    if (!label.startsWith("Tests")) {
      // El total "productivo" excluye tests para no inflar.
    }
    totalLines += lines;
    totalFiles += files.length;
  }
  return { rows, totalLines, totalFiles };
}

function structureMetrics() {
  const components = walk(r("components")).filter((f) => f.endsWith(".tsx")).length;
  const hooks = walk(r("lib")).filter((f) => /\/use[A-Z][^/]*\.ts$/.test(f)).length;
  const apiRoutes = walk(r("app/api")).filter((f) => f.endsWith("route.ts")).length;
  const libModules = walk(r("lib")).filter((f) => f.endsWith(".ts")).length;
  return { components, hooks, apiRoutes, libModules };
}

// --- Dependencias ---------------------------------------------------------

function depMetrics() {
  const pkg = JSON.parse(readFileSync(r("package.json"), "utf8"));
  const prod = Object.entries(pkg.dependencies ?? {});
  const dev = Object.entries(pkg.devDependencies ?? {});
  return { prod, dev };
}

// --- Cobertura ------------------------------------------------------------

function coverageMetrics() {
  const file = r("coverage", "coverage-summary.json");
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, "utf8"));
  const t = data.total;
  return {
    lines: t.lines.pct,
    statements: t.statements.pct,
    functions: t.functions.pct,
    branches: t.branches.pct,
    coveredLines: t.lines.covered,
    totalLines: t.lines.total,
  };
}

// --- Tests ----------------------------------------------------------------

function testMetrics() {
  const file = r("coverage", "test-results.json");
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, "utf8"));
  return {
    total: data.numTotalTests ?? 0,
    passed: data.numPassedTests ?? 0,
    failed: data.numFailedTests ?? 0,
    suites: data.numTotalTestSuites ?? 0,
  };
}

// --- Git ------------------------------------------------------------------

function gitMetrics() {
  const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
  return {
    commits: safe(() => sh("git rev-list --count HEAD"), "n/d"),
    contributors: safe(() => sh("git shortlog -sn --all | wc -l").trim(), "n/d"),
    branch: safe(() => sh("git rev-parse --abbrev-ref HEAD"), "n/d"),
    lastCommit: safe(() => sh("git log -1 --format=%cd --date=format:%Y-%m-%d"), "n/d"),
    lastHash: safe(() => sh("git rev-parse --short HEAD"), "n/d"),
  };
}

// --- Render ---------------------------------------------------------------

function bar(pct) {
  const filled = Math.round((pct / 100) * 20);
  return "█".repeat(filled) + "░".repeat(20 - filled);
}

function badge(pct, good = 80, warn = 60) {
  if (pct >= good) return "🟢";
  if (pct >= warn) return "🟡";
  return "🔴";
}

function main() {
  const code = codeMetrics();
  const struct = structureMetrics();
  const deps = depMetrics();
  const cov = coverageMetrics();
  const tests = testMetrics();
  const git = gitMetrics();
  const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const lines = [];
  const push = (...l) => lines.push(...l);

  push(
    "# 📊 Project Status — Planner Familiar",
    "",
    "> **Métricas vivas.** Generado automáticamente por `scripts/update-status.mjs`.",
    "> No editar a mano: corre `npm run status` para regenerar.",
    "",
    `**Última actualización:** ${now}  `,
    `**Branch:** \`${git.branch}\` · **Commit:** \`${git.lastHash}\` (${git.lastCommit})`,
    "",
    "---",
    ""
  );

  // Resumen
  const prodLOC = code.totalLines - (code.rows["Tests (.test.*)"]?.lines ?? 0);
  push(
    "## 🎯 Resumen",
    "",
    "| Métrica | Valor |",
    "|---|---|",
    `| Líneas de código (sin tests) | **${prodLOC.toLocaleString()}** |`,
    `| Archivos totales | **${code.totalFiles}** |`,
    `| Tests | **${tests ? tests.total : "n/d"}** |`,
    `| Cobertura (líneas) | **${cov ? cov.lines + "%" : "n/d"}** ${cov ? badge(cov.lines) : ""} |`,
    `| Dependencias (prod) | **${deps.prod.length}** |`,
    `| Commits | **${git.commits}** |`,
    "",
    "---",
    ""
  );

  // Código
  push(
    "## 💻 Código",
    "",
    "| Tipo | Archivos | Líneas |",
    "|---|--:|--:|"
  );
  for (const [label, { files, lines: l }] of Object.entries(code.rows)) {
    push(`| ${label} | ${files} | ${l.toLocaleString()} |`);
  }
  push(`| **Total** | **${code.totalFiles}** | **${code.totalLines.toLocaleString()}** |`, "");

  push(
    "### Estructura",
    "",
    "| Categoría | Cantidad |",
    "|---|--:|",
    `| Componentes React | ${struct.components} |`,
    `| Hooks (\`use*\`) | ${struct.hooks} |`,
    `| Rutas API | ${struct.apiRoutes} |`,
    `| Módulos en \`lib/\` | ${struct.libModules} |`,
    "",
    "---",
    ""
  );

  // Tests + cobertura
  push("## 🧪 Tests & Cobertura", "");
  const testFiles = code.rows["Tests (.test.*)"]?.files ?? 0;
  if (tests) {
    push(
      `**${tests.passed}/${tests.total} tests** en ${testFiles} archivos ` +
        `(${tests.suites} suites) · ` +
        `${tests.failed === 0 ? "✅ todos pasando" : `❌ ${tests.failed} fallando`}`,
      ""
    );
  } else {
    push("_Sin resultados de tests. Corre `npm run status` para generarlos._", "");
  }

  if (cov) {
    push(
      "| Métrica | % | |",
      "|---|--:|---|",
      `| Líneas | ${cov.lines}% | \`${bar(cov.lines)}\` ${badge(cov.lines)} |`,
      `| Statements | ${cov.statements}% | \`${bar(cov.statements)}\` ${badge(cov.statements)} |`,
      `| Funciones | ${cov.functions}% | \`${bar(cov.functions)}\` ${badge(cov.functions)} |`,
      `| Ramas | ${cov.branches}% | \`${bar(cov.branches)}\` ${badge(cov.branches)} |`,
      "",
      `_${cov.coveredLines}/${cov.totalLines} líneas cubiertas._`,
      ""
    );
  } else {
    push("_Sin reporte de cobertura. Corre `npm run status`._", "");
  }
  push("---", "");

  // Dependencias
  push(
    "## 📦 Dependencias",
    "",
    `**Producción (${deps.prod.length})**`,
    "",
    "| Paquete | Versión |",
    "|---|---|"
  );
  for (const [name, ver] of deps.prod) push(`| \`${name}\` | ${ver} |`);
  push(
    "",
    `<details><summary><strong>Desarrollo (${deps.dev.length})</strong></summary>`,
    "",
    "| Paquete | Versión |",
    "|---|---|"
  );
  for (const [name, ver] of deps.dev) push(`| \`${name}\` | ${ver} |`);
  push("", "</details>", "", "---", "");

  // Git
  push(
    "## 🔧 Repositorio",
    "",
    "| Métrica | Valor |",
    "|---|---|",
    `| Commits | ${git.commits} |`,
    `| Contribuidores | ${git.contributors} |`,
    `| Branch actual | \`${git.branch}\` |`,
    `| Último commit | ${git.lastCommit} (\`${git.lastHash}\`) |`,
    "",
    "---",
    "",
    "_Leyenda cobertura: 🟢 ≥80% · 🟡 60–79% · 🔴 <60%_",
    ""
  );

  writeFileSync(r("docs", "PROJECT_STATUS.md"), lines.join("\n"));
  console.log("✓ docs/PROJECT_STATUS.md actualizado");
}

main();
