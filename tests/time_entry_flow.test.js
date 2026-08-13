const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");

function functionBlock(name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf(`function ${nextName}(`, start);
  assert.notEqual(start, -1, `Missing function ${name}`);
  assert.notEqual(end, -1, `Missing boundary function ${nextName}`);
  return source.slice(start, end);
}

const context = {
  normalizeTimeEmployeeCodeInput: (value) => String(value || "").trim(),
  getOrderedActiveTimeEmployees: () => [
    { emp_code: "01" },
    { emp_code: "02" },
    { emp_code: "201" }
  ]
};
vm.runInNewContext(
  `${functionBlock("getNextAvailableTimeEntryEmployeeCode", "renderTimeEmployeeCodeOptions")}
   this.nextEmployee = getNextAvailableTimeEntryEmployeeCode;`,
  context
);

assert.equal(context.nextEmployee("", "2026-08-13"), "01");
assert.equal(context.nextEmployee("01", "2026-08-13"), "02");
assert.equal(context.nextEmployee("02", "2026-08-13"), "201");
assert.equal(context.nextEmployee("201", "2026-08-13"), "01");

assert.match(source, /apiCreateTimeRecords\(payloads, user\)/, "weekly entry should use one bulk save");
assert.match(source, /placeholder="เช่น 0752" value="\$\{escapeHtml\(editingTimeRecord\?\.clock_in \|\| ""\)\}"/);

console.log("Time entry flow tests passed.");
