const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles.css", "utf8");
const migration = fs.readFileSync("supabase_time_save_queue_migration.sql", "utf8");

assert.match(app, /enqueueTimeRows\(\[record\], "insert"\)/);
assert.match(app, /enqueueTimeRows\(pendingRecords, "insert"\)/);
assert.match(app, /enqueueTimeRows\(\[nextRecord\], "update"\)/);
assert.match(app, /renderTimeQueuePage\(\)/);
assert.match(app, /data-open-time-queue/);
assert.match(app, /data-time-queue-verify/);
assert.match(app, /data-time-queue-retry/);
assert.match(app, /data-time-queue-edit/);
assert.doesNotMatch(app, /renderTimeQueuePanel\(\)/);
assert.match(app, /TIME_QUEUE_PRIMARY_TIMEOUT_MS = 3500/);
assert.match(app, /timeQueueNumber\(record\.queue_item\)/);
assert.match(app, /"time_save_queue",\s*"time_save_queue_events"/);
assert.match(css, /\.time-queue-row\s*\{[\s\S]*?display:\s*grid/);
assert.match(migration, /unique index[\s\S]*time_records_queue_dedupe_key_unique/i);
assert.match(migration, /for update skip locked/i);
assert.match(migration, /operation in \('insert', 'update'\)/i);
assert.match(migration, /on delete restrict/i);

console.log("Time queue UI and schema tests passed.");
