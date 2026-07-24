const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");
const filterStart = source.lastIndexOf("function renderPersonalReportFilter(");
const filterEnd = source.indexOf("function renderPersonalProductionSummaryTab(", filterStart);
const summaryStart = filterEnd;
const summaryEnd = source.indexOf("function renderPersonalTimeSummaryTab(", summaryStart);

assert.notEqual(filterStart, -1);
assert.notEqual(filterEnd, -1);
assert.notEqual(summaryEnd, -1);

const context = {
  personalReportActiveTab: "production",
  personalReportFruitFilter: "mangosteen",
  personalReportExportMenuOpen: false,
  productionFruitOptions: [
    { id: "mangosteen", label: "มังคุด" },
    { id: "durian", label: "ทุเรียน" },
    { id: "mango", label: "มะม่วง" },
  ],
  productionFruitFieldLabels: {
    mangosteen: { water: "น้ำหนักน้ำ", flower: "น้ำหนักดอก", waterShort: "น้ำ", flowerShort: "ดอก" },
    durian: { mode: "grades" },
    mango: { water: "มะม่วงฝา", flower: "มะม่วงหั่นเต๋า", waterShort: "ฝา", flowerShort: "หั่นเต๋า" },
  },
  DURIAN_GRADES: ["A", "B", "C", "D", "E"],
  escapeHtml: (value) => String(value ?? ""),
  canExportFullDetails: () => true,
  getSession: () => ({ user: {} }),
  getProductionFieldLabels: (fruit) => context.productionFruitFieldLabels[fruit],
  getProductionFruitLabel: (fruit) => ({ mangosteen: "มังคุด", durian: "ทุเรียน", mango: "มะม่วง" })[fruit],
  getDurianGradeTotal: (grades) => Object.values(grades || {}).reduce((sum, value) => sum + Number(value || 0), 0),
  recordsForPersonalReport: (...args) => {
    context.lastFruit = args[3];
    return [{ fruit_type: args[3] }];
  },
  summarizePersonalRecords: () => ({
    water: 10,
    flower: 5,
    grades: { A: 8, B: 2, C: 0, D: 0, E: 0 },
    total: 15,
    amount: 90,
    records: 1,
    days: new Set(["2026-07-20"]),
  }),
  getDailyPersonalSummaries: () => [{ date: "2026-07-20" }],
  getPilePersonalSummaries: () => [{ pile: 1 }],
  renderPersonalDailyRow: () => "<tr><td>daily</td></tr>",
  renderPersonalPileRow: () => "<tr><td>pile</td></tr>",
  numberText: (value) => String(value ?? 0),
  money: (value) => String(value ?? 0),
};

vm.runInNewContext(source.slice(filterStart, filterEnd), context);
vm.runInNewContext(source.slice(summaryStart, summaryEnd), context);

const reportContext = {
  selectedEmployee: { id: 1, emp_code: "02", fullname: "Test" },
  selectedEmployeeId: 1,
  employees: [{ id: 1, emp_code: "02", fullname: "Test" }],
  range: { startDate: "2026-07-20", endDate: "2026-07-20" },
};

const filterHtml = context.renderPersonalReportFilter(reportContext);
assert.match(filterHtml, /id="personalReportFruit"/);
assert.match(filterHtml, /class="personal-report-actions"/);
assert.match(filterHtml, /Export PDF มังคุด/);

const mangosteenHtml = context.renderPersonalProductionSummaryTab(reportContext);
assert.equal(context.lastFruit, "mangosteen");
assert.match(mangosteenHtml, /<th>น้ำหนักน้ำ<\/th>/);
assert.doesNotMatch(mangosteenHtml, /<th>เกรด A<\/th>/);

context.personalReportFruitFilter = "durian";
const durianHtml = context.renderPersonalProductionSummaryTab(reportContext);
assert.equal(context.lastFruit, "durian");
assert.match(durianHtml, /<th>น้ำหนักทุเรียน<\/th>/);
assert.doesNotMatch(durianHtml, /<th>เกรด A<\/th>/);
assert.doesNotMatch(durianHtml, /<th>น้ำหนักน้ำ<\/th>/);

console.log("Personal report UI fruit separation tests passed.");
