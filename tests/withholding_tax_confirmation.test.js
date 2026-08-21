const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

assert.match(source, /<form class="panel withholding-tax-panel" id="withholdingTaxForm">/);
assert.match(source, /id="confirmWithholdingTaxGroups" type="submit" disabled/);
assert.match(source, /มีการเปลี่ยนแปลงที่ยังไม่ยืนยัน ระบบยังใช้ค่าเดิมอยู่/);
assert.match(source, /withholdingTaxForm\?\.addEventListener\("submit"/);
assert.match(source, /window\.confirm\(confirmationLines\.join\("\\n"\)\)/);
assert.match(source, /saveProductionWithholdingTaxGroups\(selectedGroups\)/);
assert.match(source, /UPDATE_WITHHOLDING_TAX_GROUPS/);

const changeHandler = source.slice(
  source.indexOf('document.querySelectorAll("[data-withholding-tax-group]").forEach'),
  source.indexOf('withholdingTaxForm?.addEventListener("submit"')
);
assert.doesNotMatch(changeHandler, /saveProductionWithholdingTaxGroups/);

assert.match(css, /\.withholding-tax-confirm-row\s*\{/);
assert.match(css, /\.withholding-tax-note\.is-pending\s*\{/);

console.log("Withholding tax confirmation tests passed.");
