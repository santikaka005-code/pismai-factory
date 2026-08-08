const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("app.js", "utf8");

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `Missing ${name}`);
  let depth = 0;
  let opened = false;
  for (let index = source.indexOf("{", start); index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
      opened = true;
    } else if (source[index] === "}") {
      depth -= 1;
      if (opened && depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

const context = {
  getUserLevel: (user) => user.user_level || user.level,
  Date,
  Number,
  String,
  Boolean
};
vm.createContext(context);
vm.runInContext(functionSource("canEditProductionRecords"), context);
vm.runInContext(functionSource("canManageAllProductionRecords"), context);
vm.runInContext(functionSource("canDeleteProductionRecords"), context);
vm.runInContext("const PRODUCTION_SELF_EDIT_WINDOW_MS = 5 * 60 * 1000;", context);
vm.runInContext(functionSource("normalizeProductionEditorIdentity"), context);
vm.runInContext(functionSource("isProductionRecordOwnedByUser"), context);
vm.runInContext(functionSource("getProductionRecordEditRemainingMs"), context);
vm.runInContext(functionSource("canEditProductionRecord"), context);

assert.strictEqual(context.canEditProductionRecords({ user_level: "C1" }), true);
assert.strictEqual(context.canEditProductionRecords({ user_level: "C3" }), true);
assert.strictEqual(context.canEditProductionRecords({ user_level: "C4" }), true);
assert.strictEqual(context.canDeleteProductionRecords({ user_level: "C3" }), false);
assert.strictEqual(context.canDeleteProductionRecords({ user_level: "C4" }), true);

const now = Date.parse("2026-07-25T10:05:00Z");
const c2 = { user_level: "C2", username: "operator", fullname: "Operator One" };
const recentOwnRecord = { created_by: "Operator One", created_at: "2026-07-25T10:00:01Z" };
const expiredOwnRecord = { created_by: "Operator One", created_at: "2026-07-25T10:00:00Z" };
const recentOtherRecord = { created_by: "Other User", created_at: "2026-07-25T10:04:30Z" };

assert.strictEqual(context.canEditProductionRecord(c2, recentOwnRecord, now), true);
assert.strictEqual(context.canEditProductionRecord(c2, expiredOwnRecord, now), true);
assert.strictEqual(context.canEditProductionRecord(c2, expiredOwnRecord, now + 1), false);
assert.strictEqual(context.canEditProductionRecord(c2, recentOtherRecord, now), false);
assert.strictEqual(
  context.canEditProductionRecord({ user_level: "C4", fullname: "Supervisor" }, expiredOwnRecord, now + 86400000),
  true
);
assert(source.includes("expected_updated_at"), "Production edits must use optimistic concurrency");
assert(source.includes("data-open-production-editor"), "Production editor button is missing");
assert(source.includes("data-select-production-delete"), "Production delete button is missing");
assert(
  source.includes("const showEdit = editUser ? canEditProductionRecord(editUser, record) : false"),
  "Production summary rows must enforce record-level edit permission"
);
assert(source.includes("expected_updated_at: existingRecord.updated_at"), "Production delete must use optimistic concurrency");
assert(source.includes("getProductionClientUid(response.data) !== getProductionClientUid(existingRecord)"), "Production edit must verify stable client_uid");
assert(source.includes("getProductionClientUid(record) !== existingUid"), "Production edit must remove stale local UID duplicates");
assert(source.includes("Audit Log"), "Production editor must explain audit logging");

console.log("Production editor permission and concurrency tests passed.");
