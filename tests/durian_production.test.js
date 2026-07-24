const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("app.js", "utf8");

assert.match(source, /durian_weight:\s*durianWeight/);
assert.match(source, /total_weight:\s*durianWeight/);
assert.match(source, /gradeWeights = \{ \.\.\.legacyWeights, A: durianWeight, B: 0, C: 0, D: 0, E: 0 \}/);
assert.match(source, /apiGetCurrentProductionRate\(fruitType, "weight", recordDate\)/);
assert.match(source, /apiGetCurrentProductionRate\(fruitType, "grade_A", recordDate\)/);
assert.doesNotMatch(source, /data-fast-durian-grade/);
assert.doesNotMatch(source, /data-durian-batch-grade/);

console.log("Durian single-weight implementation tests passed.");
