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
  getUserLevel: (user) => user.user_level,
  Number,
  String
};
vm.createContext(context);
vm.runInContext(functionSource("canEditProductionRecords"), context);

assert.strictEqual(context.canEditProductionRecords({ user_level: "C3" }), false);
assert.strictEqual(context.canEditProductionRecords({ user_level: "C4" }), true);
assert.strictEqual(context.canEditProductionRecords({ user_level: "C7" }), true);
assert(source.includes("expected_updated_at"), "Production edits must use optimistic concurrency");
assert(source.includes("data-open-production-editor"), "Production editor button is missing");
assert(source.includes("data-select-production-delete"), "Production delete button is missing");
assert(source.includes("expected_updated_at: existingRecord.updated_at"), "Production delete must use optimistic concurrency");
assert(source.includes("Audit Log"), "Production editor must explain audit logging");

console.log("Production editor permission and concurrency tests passed.");
