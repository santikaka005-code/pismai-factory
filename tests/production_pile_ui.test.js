const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles.css", "utf8");

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name}`);
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

const context = { Number };
vm.createContext(context);
vm.runInContext(functionSource("productionPileToneClass"), context);
vm.runInContext(functionSource("isBatchProductionSaveShortcut"), context);

for (let pile = 1; pile <= 5; pile += 1) {
  assert.equal(context.productionPileToneClass(pile), `production-pile-tone-${pile}`);
}
assert.equal(context.productionPileToneClass("bad"), "production-pile-tone-1");
assert.equal(context.isBatchProductionSaveShortcut({ key: "Enter", shiftKey: true }), true);
assert.equal(context.isBatchProductionSaveShortcut({ key: "Enter", shiftKey: false }), false);
assert.equal(context.isBatchProductionSaveShortcut({ key: "s", shiftKey: true }), false);

assert.match(source, /fast-input-form[^\n]*productionPileToneClass\(fastInputState\.pile_no\)/);
assert.match(source, /batch-side[^\n]*productionPileToneClass\(batchGridState\.flower_pile_no\)/);
assert.match(source, /batch-side[^\n]*productionPileToneClass\(batchGridState\.water_pile_no\)/);
assert.match(source, /durian-grade-side[^\n]*productionPileToneClass\(batchGridState\.durian_pile_no\)/);
assert.match(source, /id="productionBatchEntry"/);

const fastEvents = functionSource("bindProductionFastEvents");
assert.doesNotMatch(fastEvents, /isBatchProductionSaveShortcut/);

assert.match(css, /\.production-pile-tone-1\s*\{\s*--production-pile-color:\s*#1d4ed8/);
assert.match(css, /\.production-pile-tone-2\s*\{\s*--production-pile-color:\s*#dc2626/);
assert.match(css, /\.production-pile-tone-3\s*\{\s*--production-pile-color:\s*#111111/);
assert.match(css, /\.production-pile-tone-4\s*\{\s*--production-pile-color:\s*#7e22ce/);
assert.match(css, /\.production-pile-tone-5\s*\{\s*--production-pile-color:\s*#15803d/);

console.log("Production pile colors and batch-only shortcut tests passed.");
