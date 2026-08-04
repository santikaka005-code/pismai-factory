const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles.css", "utf8");
const migration = fs.readFileSync("supabase_production_save_queue_migration.sql", "utf8");

function functionSource(name) {
  const markers = [`async function ${name}(`, `function ${name}(`];
  const start = markers.map((marker) => app.indexOf(marker)).filter((index) => index >= 0).sort((a, b) => a - b)[0];
  assert(Number.isInteger(start), `Missing ${name}`);
  const bodyStart = app.indexOf(") {", start) + 2;
  let depth = 0;
  for (let index = bodyStart; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") depth -= 1;
    if (depth === 0) return app.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

for (const name of ["saveProductionFastForm", "saveDurianFastForm", "saveBatchEntries", "saveDurianBatchEntries"]) {
  const source = functionSource(name);
  assert.match(source, /enqueueProductionRows\(/, `${name} must enqueue centrally`);
  assert.doesNotMatch(source, /apiCreateProductionRecord/, `${name} must not create browser-local production rows first`);
  assert.doesNotMatch(source, /saveProductionRowsToCloud/, `${name} must not block on direct production insert`);
}

assert.match(app, /PRODUCTION_QUEUE_ACCEPT_TIMEOUT_MS = 5000/);
assert.match(app, /PRODUCTION_QUEUE_PRIMARY_TIMEOUT_MS = 3500/);
assert.match(functionSource("enqueueProductionRows"), /PRODUCTION_QUEUE_ACCEPT_TIMEOUT_MS - \(Date\.now\(\) - acceptanceStartedAt\)/);
assert.match(app, /data-open-production-queue/);
assert.match(app, /productionView === "queue"/);
assert.match(app, /ไม่พบข้อมูลในฐาน/);
assert.match(app, /data-queue-retry/);
assert.match(app, /data-queue-cancel/);
assert.match(functionSource("renderProductionQueueRow"), /ผู้บันทึก/);
assert.doesNotMatch(functionSource("renderProductionQueuePage"), /table-scroll/);

assert.match(css, /\.production-queue-row\s*\{[\s\S]*?display:\s*grid/);
assert.match(css, /\.production-queue-panel\s*\{[\s\S]*?overflow:\s*hidden/);

assert.match(migration, /unique \(queue_uid\)/i);
assert.match(migration, /production_records_queue_dedupe_key_unique/i);
assert.match(migration, /on delete restrict/i);
assert.match(migration, /for update skip locked/i);
assert.match(migration, /revoke all on function public\.claim_next_production_save_queue\(text\) from public/i);
assert.match(migration, /status in \('queued', 'processing', 'succeeded', 'needs_review', 'failed', 'cancelled'\)/i);

console.log("Production queue UI and schema tests passed.");
