const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");
const start = source.lastIndexOf("function renderSummaryAll(");
const end = source.indexOf("function exportSummaryData(", start);
assert.notEqual(start, -1);
assert.notEqual(end, -1);

const context = {
  summaryFruitFilter: "mangosteen",
  summaryDate: "2026-07-20",
  summaryExportMessage: "",
  summaryExportMessageType: "success",
  summaryMainExportMenuOpen: false,
  summaryExportOptions: { overview: true, piles: true, details: true },
  productionFruitOptions: [
    { id: "mangosteen", label: "มังคุด" },
    { id: "durian", label: "ทุเรียน" },
  ],
  productionFruitFieldLabels: {
    mangosteen: { water: "น้ำหนักน้ำ", flower: "น้ำหนักดอก", waterShort: "น้ำ", flowerShort: "ดอก" },
    durian: { mode: "grades" },
  },
  DURIAN_GRADES: ["A", "B", "C", "D", "E"],
  getSession: () => ({ user: {} }),
  getSelectedSummaryDate: () => "2026-07-20",
  getDashboardRecordsForDate: () => [],
  filterProductionRecordsByFruit: (records) => records,
  getProductionTotals: () => ({ total: 0, water: 0, flower: 0, grades: { A: 0, B: 0, C: 0, D: 0, E: 0 }, amount: 0, people: new Set() }),
  getPileSummaries: () => [],
  getSummaryExportRange: () => ({ startDate: "2026-07-20", endDate: "2026-07-20" }),
  getProductionFieldLabels: (fruit) => context.productionFruitFieldLabels[fruit],
  renderSummaryFieldOptions: () => "",
  renderDashboardBars: () => "",
  renderPileSummaryRow: () => "",
  renderDashboardDetailRow: () => "",
  getDurianGradeTotal: () => 0,
  escapeHtml: (value) => String(value ?? ""),
  numberText: (value) => String(value ?? 0),
  money: (value) => String(value ?? 0),
};

vm.runInNewContext(source.slice(start, end), context);

const mangosteenHtml = context.renderSummaryAll({ label: "สรุปผลทั้งหมด" });
assert.match(mangosteenHtml, /id="summaryFruitFilter"/);
assert.doesNotMatch(mangosteenHtml, /<th>เกรด A<\/th>/);
assert.match(mangosteenHtml, /<th>น้ำหนักน้ำ<\/th>/);

context.summaryFruitFilter = "durian";
const durianHtml = context.renderSummaryAll({ label: "สรุปผลทั้งหมด" });
assert.match(durianHtml, /<th>เกรด A<\/th>/);
assert.doesNotMatch(durianHtml, /<th>น้ำหนักน้ำ<\/th>/);

console.log("Summary fruit UI separation tests passed.");
