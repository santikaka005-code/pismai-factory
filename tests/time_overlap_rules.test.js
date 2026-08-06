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

const calculationSource = `
  ${functionBlock("parseTimeToMinutes", "normalizeClockText")}
  ${functionBlock("normalizeClockText", "normalizeClockInput")}
  ${functionBlock("getTimeRecordInterval", "timeRecordIntervalsOverlap")}
  ${functionBlock("timeRecordIntervalsOverlap", "findConflictingTimeRecord")}
  this.timeRecordIntervalsOverlap = timeRecordIntervalsOverlap;
`;

const context = {};
vm.runInNewContext(calculationSource, context);
const overlaps = context.timeRecordIntervalsOverlap;

assert.equal(overlaps("07:52", "11:35", "12:54", "16:43"), false, "split shifts must be allowed");
assert.equal(overlaps("07:52", "11:35", "11:35", "16:43"), false, "touching boundaries must be allowed");
assert.equal(overlaps("07:52", "11:35", "11:00", "16:43"), true, "overlapping shifts must be rejected");
assert.equal(overlaps("07:52", "11:35", "07:52", "11:35"), true, "exact duplicates must be rejected");
assert.equal(overlaps("12:54", "16:43", "07:52", "11:35"), false, "earlier non-overlapping shift must be allowed");
assert.equal(overlaps("22:00", "02:00", "23:00", "01:00"), true, "overnight overlaps must be rejected");

console.log("Time interval overlap tests passed.");
