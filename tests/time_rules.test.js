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
  const TIME_DAILY_WAGE = 347;
  const TIME_STANDARD_HOURS = 8;
  const TIME_NORMAL_HOURLY_RATE = TIME_DAILY_WAGE / TIME_STANDARD_HOURS;
  const TIME_OT_HOURLY_RATE = 50;
  const TIME_SPECIAL_DAILY_WAGE = 365;
  const TIME_SPECIAL_WAGE_TABLE = {};
  ${functionBlock("parseTimeToMinutes", "normalizeClockText")}
  ${functionBlock("normalizeClockText", "normalizeClockInput")}
  ${functionBlock("roundWorkClockMinutes", "calculateWorkMinutes")}
  ${functionBlock("calculateWorkMinutes", "buildTimeRecord")}
  ${functionBlock("getTimeNormalHourlyRate", "calculateTimeNormalWageAmount")}
  ${functionBlock("calculateTimeNormalWageAmount", "getTimeReceiptRow")}
  ${functionBlock("getTimeReceiptRow", "combineTimeRecordsByEmployeeDate")}
  ${functionBlock("combineTimeRecordsByEmployeeDate", "getTimeReceiptGroups")}
  ${functionBlock("getTimeReceiptGroups", "timeReceiptRowsHtml")}
  this.calculateWorkMinutes = calculateWorkMinutes;
  this.getTimeReceiptRow = getTimeReceiptRow;
  this.getTimeReceiptGroups = getTimeReceiptGroups;
`;

const context = {};
vm.runInNewContext(calculationSource, context);

const expectedWages = new Map([
  [2, 87], [2.5, 108], [3, 130], [3.5, 152], [4, 174], [4.5, 195],
  [5, 217], [5.5, 239], [6, 260], [6.5, 282], [7, 304], [7.5, 325], [8, 347],
  [8.5, 372], [9, 397]
]);

for (const [hours, expected] of expectedWages) {
  const row = context.getTimeReceiptRow({ net_minutes: hours * 60 });
  assert.equal(row.totalAmount, expected, `${hours} hours should pay ${expected} baht`);
}

assert.equal(context.calculateWorkMinutes("08:15", "17:15").net_minutes, 480);
assert.equal(context.calculateWorkMinutes("08:16", "17:45").net_minutes, 480);
assert.equal(context.calculateWorkMinutes("08:46", "18:46").net_minutes, 540);

const splitDay = context.getTimeReceiptGroups([
  { employee_id: 1, emp_code: "10001", record_date: "2026-07-13", clock_in: "08:00", clock_out: "12:00", net_minutes: 240 },
  { employee_id: 1, emp_code: "10001", record_date: "2026-07-13", clock_in: "13:00", clock_out: "17:00", net_minutes: 240 }
])[0];
assert.equal(splitDay.rows.length, 1);
assert.equal(splitDay.rows[0].normalHours, 8);
assert.equal(splitDay.rows[0].totalAmount, 347);
assert.equal(splitDay.rows[0].clock_in, "08:00 / 13:00");

const splitDayWithOt = context.getTimeReceiptGroups([
  { employee_id: 1, emp_code: "10001", record_date: "2026-07-14", clock_in: "08:00", clock_out: "12:00", net_minutes: 240 },
  { employee_id: 1, emp_code: "10001", record_date: "2026-07-14", clock_in: "13:00", clock_out: "18:00", net_minutes: 300 }
])[0];
assert.equal(splitDayWithOt.rows[0].normalHours, 8);
assert.equal(splitDayWithOt.rows[0].otHours, 1);
assert.equal(splitDayWithOt.rows[0].totalAmount, 397);

console.log("Time rounding and wage-table tests passed.");
