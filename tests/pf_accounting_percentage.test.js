const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const controller = fs.readFileSync(path.join(root, "accounting-control.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(controller, /data-view="percentage"[\s\S]*ปรับเปอร์เซ็นต์/);
assert.match(controller, /data-percent-kind/);
assert.match(controller, /data-percent-group/);
assert.match(controller, /data-percent-mode/);
assert.match(controller, /data-percent-value/);
assert.match(controller, /data-percent-apply/);
assert.match(controller, /data-percent-clear/);
assert.match(controller, /data-percent-basis="money"/);
assert.match(controller, /data-percent-basis="weight"/);
assert.match(controller, /data-percent-basis="hours"/);
assert.match(controller, /row\.metric_weight/);
assert.match(controller, /row\.metric_hours/);
assert.match(controller, /net_amount: adjustedNet\(row\)/);
assert.match(controller, /state\.view === "percentage" \? percentageMarkup\(\)/);
assert.match(app, /payment_method: row\.payment_method, net_amount: Number\(row\.net_amount \|\| 0\)/);
assert.match(app, /metric_weight \+= Number\(getRecordTotalWeight\(record\)/);
assert.match(app, /metric_hours \+= Number\(receipt\.normalHours/);

console.log("PF Accounting percentage adjustment tests passed.");
