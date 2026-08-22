const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const server = fs.readFileSync("report_server.py", "utf8");
const migration = fs.readFileSync("supabase_issue_reports_migration.sql", "utf8");

assert.match(app, /label: "แจ้งปัญหาของเว็บ"/);
assert.match(app, /renderIssueReportPage/);
assert.match(app, /\/api\/issue-reports/);
assert.match(app, /attachment_data: issueReportAttachment\?\.data/);
assert.match(app, /"issue_reports"/);
assert.match(app, /รายงานปัญหาของเว็บ/);
assert.match(app, /canReceiveIssueNotifications/);
assert.match(app, /\["C6", "C7"\]\.includes\(getUserLevel\(user\)\)/);
assert.match(app, /data-issue-unread-badge/);
assert.match(server, /\/api\/issue-reports\/notifications/);
assert.match(server, /account_level_number\(actor\.get\("level"\)\) not in \{6, 7\}/);
assert.match(server, /"issue_reports",/);
assert.match(server, /validate_issue_report_payload/);
assert.match(server, /ISSUE_REPORT_MAX_ATTACHMENT_BYTES = 2 \* 1024 \* 1024/);
assert.match(migration, /create table if not exists public\.issue_reports/);
assert.match(migration, /attachment_data text/);

console.log("Issue report UI and backup integration tests passed.");
