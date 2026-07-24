const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

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
vm.runInNewContext(`
  const BATCH_WEIGHT_INPUT_COUNT = 40;
  ${functionSource("createBatchPileWeightMap")}
  let batchGridState = {
    emp_code: "02",
    employee: { id: 2 },
    flower_pile_no: "4",
    water_pile_no: "5",
    durian_pile_no: "3",
    flower_weights_by_pile: createBatchPileWeightMap(),
    water_weights_by_pile: createBatchPileWeightMap(),
    durian_weights_by_pile: createBatchPileWeightMap()
  };
  ${functionSource("clearBatchGridState")}
  clearBatchGridState();
  globalThis.state = batchGridState;
`, context);

assert.equal(context.state.flower_pile_no, "1");
assert.equal(context.state.water_pile_no, "1");
assert.equal(context.state.durian_pile_no, "1");
assert.equal(context.state.emp_code, "");
assert.deepEqual(
  Object.values(context.state.durian_weights_by_pile).map((values) => values.length),
  [40, 40, 40, 40, 40]
);

console.log("Batch entry single durian grid tests passed.");
