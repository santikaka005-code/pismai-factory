const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");

function functionSource(name) {
  const markers = [`async function ${name}(`, `function ${name}(`];
  const start = markers.reduce((found, marker) => {
    const index = source.indexOf(marker);
    return found < 0 || (index >= 0 && index < found) ? index : found;
  }, -1);
  assert(start >= 0, `Missing ${name}`);
  const bodyStart = source.indexOf(") {", start) + 2;
  assert(bodyStart > 1, `Missing body for ${name}`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

async function runScenario({ requests, verifyResults = [] }) {
  const context = { result: null, error: null };
  vm.runInNewContext(`
    const CLOUD_SAVE_TIMEOUT_MS = 15000;
    const CLOUD_SAVE_RETRY_DELAY_MS = 600;
    const liveStateSyncTimers = new Map();
    const liveStateSyncInFlight = new Set();
    let applyingCloudState = false;
    const sentBodies = [];
    const statuses = [];
    const requestQueue = ${JSON.stringify(requests)};
    const verifyQueue = ${JSON.stringify(verifyResults)};
    clearTimeout = () => {};
    waitForMilliseconds = async () => {};
    cloudApiRequest = async (_path, options) => {
      sentBodies.push(options.body);
      const next = requestQueue.shift();
      if (next.error) {
        const error = new Error(next.error.message);
        Object.assign(error, next.error);
        throw error;
      }
      return next.response;
    };
    findProductionRowsAlreadySaved = async () => verifyQueue.shift() || null;
    acceptVerifiedProductionRows = (_expected, actual) => actual;
    ${functionSource("isTransientCloudError")}
    ${functionSource("saveProductionRowsToCloud")}
    globalThis.run = async () => {
      const row = { client_uid: "save-1", emp_code: "02" };
      try {
        globalThis.result = await saveProductionRowsToCloud(row, {
          onStatus: (message) => statuses.push(message)
        });
      } catch (error) {
        globalThis.error = { message: error.message, status: error.status };
      }
      globalThis.sentBodies = sentBodies;
      globalThis.statuses = statuses;
    };
  `, context);
  await context.run();
  return context;
}

(async () => {
  const recoveredByVerify = await runScenario({
    requests: [{ error: { message: "timeout", code: "REQUEST_TIMEOUT", isTransient: true } }],
    verifyResults: [[{ id: 91, client_uid: "save-1", emp_code: "02" }]]
  });
  assert.equal(recoveredByVerify.error, null);
  assert.equal(recoveredByVerify.result[0].id, 91);
  assert.equal(recoveredByVerify.sentBodies.length, 1);
  assert.equal(recoveredByVerify.statuses.length, 1);

  const recoveredByRetry = await runScenario({
    requests: [
      { error: { message: "network", isTransient: true } },
      { response: { data: [{ id: 92, client_uid: "save-1", emp_code: "02" }] } }
    ],
    verifyResults: [null]
  });
  assert.equal(recoveredByRetry.error, null);
  assert.equal(recoveredByRetry.result[0].id, 92);
  assert.equal(recoveredByRetry.sentBodies.length, 2);
  assert.equal(recoveredByRetry.sentBodies[0], recoveredByRetry.sentBodies[1]);
  assert.equal(recoveredByRetry.statuses.length, 2);

  const validationFailure = await runScenario({
    requests: [{ error: { message: "invalid", status: 400 } }]
  });
  assert.equal(validationFailure.result, null);
  assert.equal(validationFailure.error.status, 400);
  assert.equal(validationFailure.sentBodies.length, 1);

  assert.match(source, /timeoutController\.abort\(\)/);
  assert.match(source, /production-records\/verify/);
  console.log("Production save resilience tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
