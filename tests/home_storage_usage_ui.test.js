const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const server = fs.readFileSync("report_server.py", "utf8");
const migration = fs.readFileSync("supabase_storage_usage_migration.sql", "utf8");

assert.match(app, /renderHomeStorageUsage/);
assert.match(app, /\/api\/storage-usage/);
assert.match(app, /พื้นที่จัดเก็บข้อมูล/);
assert.match(app, /พื้นที่คงเหลือ/);
assert.match(app, /BACKUP_STORAGE_WARNING_PERCENT/);
assert.match(server, /STORAGE_USAGE_CACHE_SECONDS = 60/);
assert.match(server, /rpc\/get_database_storage_usage/);
assert.match(migration, /pg_database_size\(current_database\(\)\)/);
assert.match(migration, /grant execute.*service_role/);

console.log("Home storage usage UI tests passed.");
