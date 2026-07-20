const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("app.js", "utf8");

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `Missing ${name}`);
  let depth = 0;
  for (let index = source.indexOf("{", start); index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const context = {};
vm.createContext(context);
vm.runInContext(`
  const BATCH_WEIGHT_INPUT_COUNT = 40;
  const DURIAN_GRADES = ["A", "B", "C", "D", "E"];
  ${functionSource("createBatchPileWeightMap")}
  ${functionSource("createDurianGradePileSelection")}
  ${functionSource("createDurianBatchWeightMap")}
  let batchGridState = {
    emp_code: "02",
    employee: { id: 2 },
    flower_pile_no: "4",
    water_pile_no: "5",
    flower_weights_by_pile: createBatchPileWeightMap(),
    water_weights_by_pile: createBatchPileWeightMap(),
    durian_grade_piles: { A: "5", B: "4", C: "3", D: "2", E: "1" },
    durian_grade_weights_by_pile: createDurianBatchWeightMap()
  };
  ${functionSource("clearBatchGridState")}
  globalThis.testPileMap = createBatchPileWeightMap();
  clearBatchGridState();
  globalThis.clearedBatchState = batchGridState;
`, context);

assert.deepStrictEqual(
  Object.values(context.testPileMap).map((values) => values.length),
  [40, 40, 40, 40, 40]
);
assert.strictEqual(context.clearedBatchState.flower_pile_no, "1");
assert.strictEqual(context.clearedBatchState.water_pile_no, "1");
assert.strictEqual(context.clearedBatchState.emp_code, "");
assert(Object.values(context.clearedBatchState.durian_grade_piles).every((pile) => pile === "1"));
assert(source.includes("BATCH_WEIGHT_INPUT_COUNT = 40"));

console.log("Batch entry 40-slot and pile reset tests passed.");
