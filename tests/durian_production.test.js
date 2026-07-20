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

const testSource = `
  const DURIAN_GRADES = ["A", "B", "C", "D", "E"];
  const rates = { grade_A: 4, grade_B: 3, grade_C: 2, grade_D: 1, grade_E: 1 };
  function getProductionFieldLabels() { return { water: "น้ำ", flower: "ดอก" }; }
  function apiGetCurrentProductionRate(fruitType, fieldKey) {
    return rates[fieldKey] == null ? null : { rate: rates[fieldKey] };
  }
  ${functionBlock("createEmptyDurianGradeWeights", "getFastInputFruitKey")}
  ${functionBlock("createProductionClientUid", "isValidProductionRecordDate")}
  ${functionBlock("buildProductionRecord", "apiCreateProductionRecord")}
  this.buildProductionRecord = buildProductionRecord;
  this.normalizeDurianGradeWeights = normalizeDurianGradeWeights;
  this.getDurianGradeTotal = getDurianGradeTotal;
  this.rates = rates;
`;

const context = {};
vm.runInNewContext(testSource, context);

const user = { fullname: "Test Admin" };
const employee = { id: 21, emp_code: "21" };
const record = context.buildProductionRecord(
  {
    record_date: "2026-07-18",
    fruit_type: "durian",
    pile_no: 2,
    employee,
    grade_weights: { A: 10, B: 5, C: 2, D: 0, E: 1 }
  },
  user
);

assert.equal(record.total_weight, 18);
assert.equal(record.total_amount, 60);
assert.deepEqual({ ...record.grade_amounts }, { A: 40, B: 15, C: 4, D: 0, E: 1 });
assert.equal(record.water_weight, 0);
assert.equal(record.flower_weight, 0);
assert.equal(record.pile_no, 2);

context.rates.grade_C = undefined;
assert.throws(
  () => context.buildProductionRecord(
    {
      record_date: "2026-07-18",
      fruit_type: "durian",
      pile_no: 1,
      employee,
      grade_weights: { A: 0, B: 0, C: 1, D: 0, E: 0 }
    },
    user
  ),
  /เกรด C/
);

assert.deepEqual(
  { ...context.normalizeDurianGradeWeights({ a: "2.5", B: -1, C: "bad" }) },
  { A: 2.5, B: 0, C: 0, D: 0, E: 0 }
);

console.log("Durian grade, wage, and validation tests passed.");
