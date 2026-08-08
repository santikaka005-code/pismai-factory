const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const server = fs.readFileSync("report_server.py", "utf8");
const migration = fs.readFileSync("supabase_backup_archive_migration.sql", "utf8");

assert.match(app, /data-open-backup-clear="main"/);
assert.match(app, /data-open-backup-clear="queue"/);
assert.match(app, /id="exportQueueBackup"/);
assert.match(app, /BACKUP_STORAGE_WARNING_PERCENT = 85/);
assert.match(app, /renderBackupStorageMeter/);
assert.match(app, /backup-storage-threshold/);
assert.match(app, /confirmation: "BACKUP_CLEAR"/);
assert.match(app, /Private Archive/);
assert.match(app, /production_save_queue_events/);
assert.match(app, /\[1, 2, 3\]\.includes\(version\)/);

assert.match(server, /account_level_number\(actor_account\.get\("user_level"\)\) < 4/);
assert.match(server, /actor_account\.get\("status"\)/);
assert.match(server, /backup_archive_checksum\(verified_content\)/);
assert.match(server, /delete_backup_snapshot_rows\(snapshot_data, scope\)/);
assert.match(server, /MAIN_CLEAR_TABLES = \[[\s\S]*?production_records[\s\S]*?time_records/);
assert.doesNotMatch(server.match(/MAIN_CLEAR_TABLES = \[[\s\S]*?\n\]/)[0], /account_users|employees|wage_rates|audit_logs/);

assert.match(migration, /pismai-backup-archives/);
assert.match(migration, /public = false/);

console.log("Backup / Clear safety UI tests passed.");
