#!/usr/bin/env node
// Inspecciona un GLB y lo compara con el presupuesto.
// Uso: npm run model:inspect -- archivo.glb [--diameter 27]
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { inspectGlb } from "../../src/lib/model/inspect-glb.ts";
import { evaluateModel } from "../../src/lib/model/budgets.ts";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { diameter: { type: "string" } } });
if (!positionals[0]) {
  console.error("Uso: npm run model:inspect -- archivo.glb [--diameter 27]");
  process.exit(1);
}
const report = inspectGlb(readFileSync(positionals[0]).buffer);
console.log(JSON.stringify(report, null, 2));
for (const c of evaluateModel(report, values.diameter ? { diameterCm: Number(values.diameter), verified: true } : undefined)) {
  console.log(`${c.level.toUpperCase().padEnd(5)} ${c.message}`);
}
