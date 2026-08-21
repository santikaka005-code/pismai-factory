const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const controller = fs.readFileSync(path.join(root, "accounting-control.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(controller, /data-view="graph"[\s\S]*กราฟเปรียบเทียบ/);
assert.match(controller, /data-graph-drill="hours"/);
assert.match(controller, /data-graph-drill="weights"/);
assert.match(controller, /data-graph-drill="employees"/);
assert.match(controller, /data-graph-drill="payments"/);
assert.match(controller, /data-graph-back/);
assert.match(controller, /data-graph-preset/);
assert.match(controller, /state\.view === "graph" \? graphDashboardMarkup\(\)/);
assert.match(app, /async function getPfComparisonDashboard/);
assert.match(app, /getComparisonDashboard: getPfComparisonDashboard/);
assert.match(app, /adjustment: finalAmount - Number\(row\.net_amount \|\| 0\)/);

console.log("PF Accounting comparison chart tests passed.");
