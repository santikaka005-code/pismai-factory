(function () {
  "use strict";

  const DATA_KEY = "pismai_accounting_control_v1";
  const ACCESS_KEY = "pismai_accounting_access_v1";
  const PASSWORD_KEY = "pismai_accounting_password_hash_v1";
  const DEFAULT_PASSWORD_HASH = "0eaa69a16d7c358a329a7111a809bd2f9a7ff489596bdda17538705e9e03e05d";
  const ACCESS_MINUTES = 30;
  const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const views = [
    ["overview", "ศูนย์ควบคุม", "⌾"],
    ["entry", "บันทึก", "▤"],
    ["tax", "ภาษี", "▣"],
    ["cashflow", "เงินสด", "◫"],
    ["calendar", "กำหนดการ", "◷"],
    ["documents", "เอกสาร", "□"],
    ["settings", "กติกา", "⚙"]
  ];
  const lawRules = {
    checkedAt: "18 กรกฎาคม 2569",
    vatRate: 0.07,
    vatEffectiveUntil: "2026-09-30",
    vatRegistrationThreshold: 1800000,
    citStandardRate: 0.20,
    smeCapitalLimit: 5000000,
    smeRevenueLimit: 30000000,
    smeBands: [[300000, 0], [3000000, 0.15], [Infinity, 0.20]],
    sources: [
      ["กรมสรรพากร: VAT 7% ถึง 30 ก.ย. 2569", "https://www.rd.go.th/region/08/chiangrai/265/3664.html"],
      ["กรมสรรพากร: เกณฑ์จด VAT 1.8 ล้านบาท", "https://rd.go.th/7061.html"],
      ["กรมสรรพากร: อัตราภาษีเงินได้นิติบุคคล", "https://www.rd.go.th/841.html"],
      ["กรมสรรพากร: ปฏิทินภาษีอากร", "https://www.rd.go.th/62348.html"],
      ["กรมพัฒนาธุรกิจการค้า: กำหนดยื่นงบและ บอจ.5", "https://www.dbd.go.th/news/125290667"]
    ]
  };

  let state = null;
  let activeView = "overview";
  let currentUser = null;
  let callbacks = {};
  let notice = "";
  let noticeType = "success";

  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }
  function num(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
  function money(value) { return num(value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function todayIso() { return new Date().toISOString().slice(0, 10); }
  function currentPeriod() { return new Date().toISOString().slice(0, 7); }
  function thaiPeriod(period) { const [year, month] = String(period).split("-").map(Number); return `${THAI_MONTHS[(month || 1) - 1]} ${(year || 2026) + 543}`; }
  function levelNumber(user) { return Number(String(user?.level || "C1").replace(/\D/g, "")) || 1; }
  function isC5(user) { return levelNumber(user) >= 5 || user?.role === "developer" || user?.is_system; }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function addMonthsClamped(date, amount) {
    const source = new Date(date);
    const originalDay = source.getDate();
    const target = new Date(source.getFullYear(), source.getMonth() + amount, 1, 12);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
    target.setDate(Math.min(originalDay, lastDay));
    return target;
  }
  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }
  function iso(date) {
    const value = new Date(date);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  function daysUntil(date) { return Math.ceil((new Date(`${date}T23:59:59`) - new Date()) / 86400000); }
  function formatDate(date) { return new Date(`${date}T12:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }); }

  function defaultState() {
    return {
      version: 1,
      company: { name: "พิศมัยผลไม้แช่แข็ง", taxId: "", vatRegistered: true, entityType: "limited", paidCapital: 0, fiscalYearEnd: "2026-12-31" },
      selectedPeriod: currentPeriod(),
      months: {},
      transactions: [],
      obligations: [],
      documents: [],
      scenario: "normal",
      updatedAt: new Date().toISOString(),
      updatedBy: ""
    };
  }
  function load() {
    try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(DATA_KEY) || "{}") }; }
    catch { return defaultState(); }
  }
  function save(action) {
    state.updatedAt = new Date().toISOString();
    state.updatedBy = currentUser?.fullname || currentUser?.username || "";
    localStorage.setItem(DATA_KEY, JSON.stringify(state));
    callbacks.onAudit?.("ACCOUNTING_CONTROL", action);
  }
  function monthData() {
    const blank = { revenue: 0, otherIncome: 0, costOfSales: 0, payroll: 0, operatingExpense: 0, otherExpense: 0, openingCash: 0, receivables: 0, payables: 0, outputVat: 0, inputVat: 0, nonDeductibleExpense: 0, taxLossCarryforward: 0, withholdingCredit: 0, employees: 0 };
    return { ...blank, ...(state.months[state.selectedPeriod] || {}) };
  }
  function calc() {
    const m = monthData();
    const income = num(m.revenue) + num(m.otherIncome);
    const expenses = num(m.costOfSales) + num(m.payroll) + num(m.operatingExpense) + num(m.otherExpense);
    const profit = income - expenses;
    const grossProfit = num(m.revenue) - num(m.costOfSales);
    const vatPayable = state.company.vatRegistered ? num(m.outputVat) - num(m.inputVat) : 0;
    const taxableProfit = Math.max(0, profit + num(m.nonDeductibleExpense) - num(m.taxLossCarryforward));
    const annualRevenue = Object.entries(state.months).filter(([period]) => period.slice(0, 4) === state.selectedPeriod.slice(0, 4)).reduce((sum, [, row]) => sum + num(row.revenue) + num(row.otherIncome), 0);
    const isSme = num(state.company.paidCapital) <= lawRules.smeCapitalLimit && annualRevenue <= lawRules.smeRevenueLimit;
    const cit = Math.max(0, calculateCit(taxableProfit, isSme) - num(m.withholdingCredit));
    const wht = state.transactions.filter((row) => row.period === state.selectedPeriod).reduce((sum, row) => sum + num(row.amount) * num(row.rate) / 100, 0);
    const thirtyDay = num(m.payables) + Math.max(0, vatPayable) + wht + num(m.payroll);
    const projectedCash = num(m.openingCash) + num(m.receivables) - thirtyDay;
    return { ...m, income, expenses, profit, grossProfit, vatPayable, taxableProfit, annualRevenue, isSme, cit, wht, thirtyDay, projectedCash };
  }
  function calculateCit(profit, isSme) {
    if (!isSme) return profit * lawRules.citStandardRate;
    const exempt = Math.min(profit, 300000);
    const middle = Math.max(0, Math.min(profit, 3000000) - exempt);
    const top = Math.max(0, profit - 3000000);
    return middle * 0.15 + top * 0.20;
  }
  function scenarioData(c) {
    const factor = state.scenario === "revenue-down" ? 0.8 : 1;
    const extraPayroll = state.scenario === "hire-two" ? Math.max(30000, num(c.payroll) / Math.max(1, num(c.employees)) * 2) : 0;
    const income = c.income * factor;
    const expenses = c.expenses + extraPayroll;
    return { income, expenses, profit: income - expenses, cash: c.projectedCash - (c.income - income) - extraPayroll, extraPayroll };
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function accessGranted(user) {
    if (isC5(user)) return true;
    try {
      const access = JSON.parse(sessionStorage.getItem(ACCESS_KEY) || "{}");
      return access.username === user.username && Date.now() < num(access.expiresAt);
    } catch { return false; }
  }
  function renderGate(root) {
    root.innerHTML = `<main class="acr-gate"><button class="acr-gate-back" data-ac-exit>← กลับระบบหลัก</button><section class="acr-gate-card"><div class="acr-shield">⌾</div><p class="acr-kicker">PROTECTED ACCOUNTING AREA</p><h1>ยืนยันตัวตนเพื่อเข้าพื้นที่นักบัญชี</h1><p>พื้นที่นี้มีข้อมูลประมาณการทางบัญชี ภาษี และเอกสารภายใน ระบบจะบันทึกประวัติการเข้าใช้งาน</p>${notice ? `<div class="acr-notice ${noticeType}">${esc(notice)}</div>` : ""}<form id="acrAccessForm"><label>รหัสผ่านพื้นที่นักบัญชี<input type="password" name="password" autocomplete="current-password" required autofocus /></label><button type="submit">เข้าสู่ห้องควบคุมบัญชี</button></form><small>ระดับ C5 ขึ้นไปเข้าใช้งานได้โดยไม่ต้องกรอกรหัสผ่าน • สิทธิ์หมดอายุหลังไม่ใช้งาน ${ACCESS_MINUTES} นาที</small></section></main>`;
    root.querySelector("[data-ac-exit]")?.addEventListener("click", callbacks.onExit);
    root.querySelector("#acrAccessForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = new FormData(event.currentTarget).get("password") || "";
      const expected = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD_HASH;
      if (await sha256(password) !== expected) { notice = "รหัสผ่านไม่ถูกต้อง"; noticeType = "error"; renderGate(root); return; }
      sessionStorage.setItem(ACCESS_KEY, JSON.stringify({ username: currentUser.username, expiresAt: Date.now() + ACCESS_MINUTES * 60000 }));
      callbacks.onAudit?.("ACCOUNTING_ACCESS", "เข้าพื้นที่นักบัญชีด้วยรหัสผ่าน");
      notice = ""; renderRoom(root);
    });
  }

  function render(root, user, options) {
    currentUser = user;
    callbacks = options || {};
    state = load();
    if (!accessGranted(user)) renderGate(root); else renderRoom(root);
  }
  function renderRoom(root) {
    const c = calc();
    root.innerHTML = `<main class="acr-shell"><aside class="acr-rail"><div class="acr-logo">ACR</div><nav>${views.map(([id, label, icon]) => `<button class="${activeView === id ? "active" : ""}" data-ac-view="${id}" title="${label}"><b>${icon}</b><span>${label}</span></button>`).join("")}</nav><button class="acr-exit" data-ac-exit>↩<span>กลับระบบหลัก</span></button></aside><section class="acr-workspace"><header class="acr-header"><div><p>ACCOUNTING CONTROL ROOM</p><h1>ห้องควบคุมบัญชี</h1><span>${esc(state.company.name)} · ${thaiPeriod(state.selectedPeriod)}</span></div><div class="acr-header-actions"><label>รอบข้อมูล<input type="month" id="acrPeriod" value="${esc(state.selectedPeriod)}" /></label><span class="acr-status">รอนักบัญชียืนยัน</span><b class="acr-user">${esc(currentUser.level || "C1")}</b></div></header><div class="acr-trust"><span>✓ ข้อมูลกรอกด้วยตนเอง</span><span>ไม่เชื่อมบัญชีธนาคาร</span><span>อัปเดต ${state.updatedAt ? new Date(state.updatedAt).toLocaleString("th-TH") : "ยังไม่มี"}</span></div>${notice ? `<div class="acr-notice ${noticeType}">${esc(notice)}</div>` : ""}<div class="acr-view">${renderView(c)}</div><footer class="acr-footer"><span>สถานะข้อมูล: ยังไม่ยืนยันโดยนักบัญชี</span><span>กติกากฎหมายตรวจสอบล่าสุด ${lawRules.checkedAt}</span><span>ผู้ใช้งาน ${esc(currentUser.fullname || currentUser.username)}</span></footer></section></main>`;
    bindRoom(root);
  }
  function renderView(c) {
    if (activeView === "entry") return entryView(c);
    if (activeView === "tax") return taxView(c);
    if (activeView === "cashflow") return cashView(c);
    if (activeView === "calendar") return calendarView();
    if (activeView === "documents") return documentsView();
    if (activeView === "settings") return settingsView();
    return overviewView(c);
  }

  function metric(label, value, tone, detail) { return `<article class="acr-metric ${tone}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`; }
  function overviewView(c) {
    const s = scenarioData(c);
    const expenseTotal = Math.max(1, c.expenses);
    const deadlines = buildDeadlines().slice(0, 4);
    return `<section class="acr-metrics">${metric("เงินคงเหลือจำลอง", `${money(s.cash)} ฿`, s.cash < 0 ? "red" : "green", "หลังภาระที่กรอกใน 30 วัน")}${metric("กำไรคาดการณ์", `${money(s.profit)} ฿`, s.profit < 0 ? "red" : "green", state.scenario === "normal" ? "สถานการณ์ปกติ" : "ตามสถานการณ์ที่เลือก")}${metric("ภาษีสำรอง", `${money(Math.max(0, c.vatPayable) + c.wht + c.cit)} ฿`, "amber", "VAT + หัก ณ ที่จ่าย + ภาษีนิติบุคคล")}${metric("ภาระ 30 วัน", `${money(c.thirtyDay)} ฿`, c.thirtyDay > c.openingCash + c.receivables ? "red" : "amber", "เจ้าหนี้ ภาษี และเงินเดือน")}</section><section class="acr-main-grid"><article class="acr-panel acr-runway"><div class="acr-panel-title"><div><p>FINANCIAL RUNWAY</p><h2>ไทม์ไลน์การเงิน 30 วัน</h2></div><span>${s.cash >= 500000 ? "ปลอดภัย" : s.cash >= 100000 ? "เฝ้าระวัง" : "ความเสี่ยงสูง"}</span></div>${runwaySvg(c, s)}<div class="acr-runway-legend"><span>● เงินรับคาดการณ์ ${money(c.receivables)}</span><span>● ภาระจ่าย ${money(c.thirtyDay)}</span><span>● ยอดปลายทาง ${money(s.cash)}</span></div></article><aside class="acr-decisions"><h2>ต้องตัดสินใจ</h2>${deadlines.map(deadlineCard).join("")}${c.projectedCash < 100000 ? `<article class="danger"><b>เงินสดอาจต่ำกว่าเป้า</b><span>ยอดจำลองหลังภาระ ${money(c.projectedCash)} บาท</span><button data-ac-view="cashflow">วางแผนเงินสด</button></article>` : ""}</aside></section><section class="acr-bottom-grid"><article class="acr-panel"><div class="acr-panel-title"><div><p>SCENARIO LAB</p><h2>จำลองสถานการณ์</h2></div></div><div class="acr-scenarios">${[["normal","ปกติ","ฐานข้อมูลปัจจุบัน"],["revenue-down","รายได้ลด 20%",`เงินปลายทาง ${money(s.cash)}`],["hire-two","เพิ่มพนักงาน 2 คน",`ค่าแรงเพิ่ม ${money(s.extraPayroll)}`]].map(([id,title,text]) => `<button class="${state.scenario === id ? "active" : ""}" data-scenario="${id}"><b>${title}</b><span>${text}</span></button>`).join("")}</div></article><article class="acr-panel acr-insight"><p>สิ่งที่ตัวเลขกำลังบอก</p>${insights(c, s).map((text) => `<div>› ${text}</div>`).join("")}</article><button class="acr-new-entry" data-ac-view="entry"><b>＋</b><strong>บันทึกตัวเลขใหม่</strong><span>อัปเดตข้อมูลประจำเดือน</span></button></section>`;
  }
  function runwaySvg(c, s) {
    const start = Math.max(0, c.openingCash); const end = s.cash; const mid = start + c.receivables - c.thirtyDay * .45;
    const max = Math.max(1, start, mid, end, c.thirtyDay); const y = (v) => 160 - Math.max(-.2, v / max) * 120;
    return `<svg class="acr-chart" viewBox="0 0 900 190" role="img" aria-label="กราฟประมาณการกระแสเงินสด 30 วัน"><defs><linearGradient id="acrArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#43f08a" stop-opacity=".35"/><stop offset="1" stop-color="#43f08a" stop-opacity="0"/></linearGradient></defs><g class="grid"><line x1="35" y1="40" x2="870" y2="40"/><line x1="35" y1="100" x2="870" y2="100"/><line x1="35" y1="160" x2="870" y2="160"/></g><path class="area" d="M35 ${y(start)} C220 ${y(start*.92)} 300 ${y(mid)} 450 ${y(mid)} S700 ${y(end*1.12)} 870 ${y(end)} L870 170 L35 170 Z"/><path class="line" d="M35 ${y(start)} C220 ${y(start*.92)} 300 ${y(mid)} 450 ${y(mid)} S700 ${y(end*1.12)} 870 ${y(end)}"/><line class="today" x1="310" y1="25" x2="310" y2="170"/><text x="278" y="18">วันนี้</text><text x="35" y="185">วัน 1</text><text x="300" y="185">วัน 10</text><text x="570" y="185">วัน 20</text><text x="835" y="185">วัน 30</text></svg>`;
  }
  function insights(c, s) {
    const rows = [];
    rows.push(c.profit >= 0 ? `อัตรากำไรประมาณ ${c.income ? (c.profit / c.income * 100).toFixed(1) : "0"}% ของรายได้` : `รายจ่ายสูงกว่ารายได้ ${money(Math.abs(c.profit))} บาท`);
    if (c.annualRevenue > lawRules.vatRegistrationThreshold && !state.company.vatRegistered) rows.push("รายได้สะสมเกินเกณฑ์ VAT 1.8 ล้านบาท ควรตรวจวันเกินเกณฑ์ทันที");
    if (c.vatPayable > 0) rows.push(`ควรกันเงิน VAT อย่างน้อย ${money(c.vatPayable)} บาท`);
    rows.push(s.cash < 0 ? `แบบจำลองชี้ว่าเงินสดอาจขาด ${money(Math.abs(s.cash))} บาท` : `เงินจำลองหลังภาระยังเป็นบวก ${money(s.cash)} บาท`);
    return rows;
  }
  function entryView(c) {
    const fields = [["revenue","รายได้จากการขาย/บริการ"],["otherIncome","รายได้อื่น"],["costOfSales","ต้นทุนขาย"],["payroll","เงินเดือนและค่าแรง"],["operatingExpense","ค่าใช้จ่ายดำเนินงาน"],["otherExpense","ค่าใช้จ่ายอื่น"],["openingCash","เงินสดตั้งต้นที่กรอก"],["receivables","ลูกหนี้คาดว่าจะรับใน 30 วัน"],["payables","เจ้าหนี้ครบกำหนดใน 30 วัน"],["outputVat","ภาษีขาย"],["inputVat","ภาษีซื้อที่ใช้ได้"],["nonDeductibleExpense","รายจ่ายต้องห้ามทางภาษี"],["taxLossCarryforward","ขาดทุนทางภาษีที่ใช้ได้"],["withholdingCredit","ภาษีถูกหัก ณ ที่จ่าย"],["employees","จำนวนพนักงาน"]];
    return `<section class="acr-page-head"><div><p>MANUAL INPUT</p><h2>บันทึกข้อมูล ${thaiPeriod(state.selectedPeriod)}</h2><span>กรอกยอดสรุปจากเอกสารของบริษัท ระบบจะคำนวณประมาณการให้</span></div></section><form class="acr-form-panel" id="acrMonthForm"><div class="acr-form-warning">ตัวเลขหน้านี้ไม่ใช่ยอดจากธนาคารและยังไม่ถือว่าได้รับการตรวจสอบทางบัญชี</div><div class="acr-field-grid">${fields.map(([key,label]) => `<label><span>${label}</span><input type="number" name="${key}" step="0.01" min="0" value="${num(c[key])}" /></label>`).join("")}</div><div class="acr-form-actions"><button type="reset" class="secondary">คืนค่าก่อนแก้ไข</button><button type="submit">บันทึกและคำนวณใหม่</button></div></form><section class="acr-mini-summary">${metric("รายได้รวม", `${money(c.income)} ฿`, "green", "จากข้อมูลที่กรอก")}${metric("รายจ่ายรวม", `${money(c.expenses)} ฿`, "red", "จากข้อมูลที่กรอก")}${metric("กำไร/ขาดทุน", `${money(c.profit)} ฿`, c.profit < 0 ? "red" : "green", "ยังไม่ผ่านการตรวจสอบ")}</section>`;
  }
  function taxView(c) {
    const rows = state.transactions.filter((row) => row.period === state.selectedPeriod);
    return `<section class="acr-page-head"><div><p>TAX ESTIMATOR</p><h2>ศูนย์ประมาณการภาษี</h2><span>อ้างอิงกติกาที่ตรวจสอบล่าสุด ${lawRules.checkedAt}</span></div></section><section class="acr-metrics tax">${metric("VAT คาดว่านำส่ง", `${money(Math.max(0,c.vatPayable))} ฿`, "amber", `ภาษีขาย ${money(c.outputVat)} - ภาษีซื้อ ${money(c.inputVat)}`)}${metric("หัก ณ ที่จ่าย", `${money(c.wht)} ฿`, "amber", `${rows.length} รายการในเดือนนี้`)}${metric("ภาษีนิติบุคคล", `${money(c.cit)} ฿`, "amber", c.isSme ? "คำนวณแบบ SME ตามข้อมูลที่กรอก" : "อัตราทั่วไป 20%")}${metric("กำไรทางภาษี", `${money(c.taxableProfit)} ฿`, "green", "กำไร + รายจ่ายต้องห้าม - ขาดทุนที่ใช้ได้")}</section><section class="acr-two-col"><article class="acr-panel"><div class="acr-panel-title"><div><p>WITHHOLDING TAX</p><h2>รายการภาษีหัก ณ ที่จ่าย</h2></div></div><form id="acrWhtForm" class="acr-inline-form"><input name="payee" placeholder="ชื่อผู้รับเงิน" required/><select name="type"><option value="service|3">ค่าบริการ/จ้างทำของ 3%</option><option value="rent|5">ค่าเช่า 5%</option><option value="advertising|2">ค่าโฆษณา 2%</option><option value="transport|1">ค่าขนส่ง 1%</option><option value="custom|0">กำหนดอัตราเอง</option></select><input name="amount" type="number" min="0" step="0.01" placeholder="ยอดก่อนหัก" required/><input name="custom_rate" type="number" min="0" step="0.01" placeholder="อัตรา %"/><button>เพิ่ม</button></form><div class="acr-table"><table><thead><tr><th>ผู้รับเงิน</th><th>ประเภท</th><th>ฐาน</th><th>อัตรา</th><th>ภาษี</th><th></th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td>${esc(row.payee)}</td><td>${esc(row.label)}</td><td>${money(row.amount)}</td><td>${num(row.rate)}%</td><td>${money(num(row.amount)*num(row.rate)/100)}</td><td><button class="acr-delete" data-delete-wht="${esc(row.id)}">ลบ</button></td></tr>`).join("") : `<tr><td colspan="6">ยังไม่มีรายการ</td></tr>`}</tbody></table></div></article><article class="acr-panel acr-law-note"><h2>ข้อควรตรวจสอบ</h2><ul><li>VAT 7% ใช้ถึง 30 กันยายน 2569 ระบบจะเตือนให้ทบทวนหลังวันดังกล่าว</li><li>เกณฑ์จด VAT คือรายรับเกิน 1.8 ล้านบาทต่อปี และโดยทั่วไปต้องยื่นคำขอภายใน 30 วันนับแต่วันที่เกิน</li><li>อัตราหัก ณ ที่จ่ายขึ้นกับลักษณะสัญญา ผู้จ่าย ผู้รับ และข้อยกเว้น รายการที่ระบบแนะนำต้องให้นักบัญชีตรวจ</li><li>สิทธิ SME พิจารณาทุนชำระแล้วและรายได้ทั้งรอบบัญชี ตัวเลขนี้เป็นเพียงประมาณการจากข้อมูลที่มี</li></ul><button data-ac-view="settings" class="secondary">ดูแหล่งกฎหมายและกติกา</button></article></section>`;
  }
  function cashView(c) {
    const s = scenarioData(c);
    return `<section class="acr-page-head"><div><p>CASH PLANNING</p><h2>แผนกระแสเงินสด</h2><span>แบบจำลองจากเงินตั้งต้น ลูกหนี้ เจ้าหนี้ เงินเดือน และภาษีที่กรอก</span></div></section><section class="acr-cash-equation"><div><span>เงินตั้งต้น</span><b>${money(c.openingCash)}</b></div><i>+</i><div><span>คาดว่าจะรับ</span><b>${money(c.receivables)}</b></div><i>−</i><div><span>ภาระ 30 วัน</span><b>${money(c.thirtyDay)}</b></div><i>=</i><div class="result"><span>เงินปลายทาง</span><b>${money(c.projectedCash)}</b></div></section><section class="acr-two-col"><article class="acr-panel"><h2>เลือกสถานการณ์</h2><div class="acr-scenarios vertical">${[["normal","ปกติ"],["revenue-down","รายได้ลด 20%"],["hire-two","เพิ่มพนักงาน 2 คน"]].map(([id,title]) => `<button class="${state.scenario===id?"active":""}" data-scenario="${id}"><b>${title}</b><span>เงินปลายทาง ${money(state.scenario===id?s.cash:c.projectedCash)}</span></button>`).join("")}</div></article><article class="acr-panel"><h2>ผลจำลอง</h2>${runwaySvg(c,s)}<div class="acr-risk ${s.cash < 0 ? "danger" : s.cash < 100000 ? "warning" : "safe"}"><b>${s.cash < 0 ? "เงินสดไม่พอรองรับภาระ" : s.cash < 100000 ? "เงินสดอยู่ในระดับเฝ้าระวัง" : "เงินสดยังอยู่ในระดับบวก"}</b><span>${s.cash < 0 ? `ต้องหาเงินเพิ่มหรือลด/เลื่อนรายจ่ายอย่างน้อย ${money(Math.abs(s.cash))} บาท` : `คงเหลือจำลอง ${money(s.cash)} บาท`}</span></div></article></section>`;
  }
  function buildDeadlines() {
    const [year, month] = state.selectedPeriod.split("-").map(Number);
    const nextMonth = new Date(year, month, 1);
    const fiscal = state.company.fiscalYearEnd || `${year}-12-31`;
    const fiscalDate = new Date(`${fiscal}T12:00:00`);
    const agm = addMonthsClamped(fiscalDate, 4);
    const dbd = addMonthsClamped(agm, 1);
    const shareholderList = addDays(agm, 14);
    const pnd50 = addDays(fiscalDate, 150);
    const rows = [
      { id:"wht", title:"ภาษีหัก ณ ที่จ่าย", detail:"ภ.ง.ด.1/3/53 (ยื่นออนไลน์)", date:iso(new Date(year, month, 15)), tone:"warning" },
      { id:"vat", title:"ภาษีมูลค่าเพิ่ม (VAT)", detail:"ภ.พ.30 (ยื่นออนไลน์)", date:iso(new Date(year, month, 23)), tone:"danger" },
      { id:"sso", title:"เงินสมทบประกันสังคม", detail:"ตรวจยอดและนำส่งประจำเดือน", date:iso(new Date(year, month, 15)), tone:"warning" },
      { id:"agm", title:"ประชุมสามัญผู้ถือหุ้น", detail:"ภายใน 4 เดือนนับแต่วันปิดบัญชี", date:iso(agm), tone:"normal" },
      { id:"boj5", title:"บัญชีรายชื่อผู้ถือหุ้น (บอจ.5)", detail:"ภายใน 14 วันหลังประชุมผู้ถือหุ้น (คำนวณจากวันประชุมล่าสุด)", date:iso(shareholderList), tone:"normal" },
      { id:"dbd", title:"นำส่งงบการเงิน DBD", detail:"ภายใน 1 เดือนหลังอนุมัติ (คำนวณจากวันประชุมล่าสุด)", date:iso(dbd), tone:"normal" },
      { id:"pnd50", title:"ภาษีเงินได้นิติบุคคล (ภ.ง.ด.50)", detail:"ภายใน 150 วันนับแต่วันสิ้นรอบบัญชี", date:iso(pnd50), tone:"normal" }
    ];
    return rows.sort((a,b) => a.date.localeCompare(b.date));
  }
  function deadlineCard(row) { const days = daysUntil(row.date); return `<article class="${days < 0 ? "danger" : days <= 7 ? "warning" : ""}"><b>${esc(row.title)}</b><span>${esc(row.detail)}</span><small>${formatDate(row.date)} · ${days < 0 ? `เกิน ${Math.abs(days)} วัน` : `เหลือ ${days} วัน`}</small><button data-ac-view="calendar">ตรวจสอบ</button></article>`; }
  function calendarView() {
    const completed = new Set(state.obligations.filter((x) => x.completed).map((x) => x.id));
    return `<section class="acr-page-head"><div><p>COMPLIANCE CALENDAR</p><h2>งานและกำหนดเวลา</h2><span>วันครบกำหนดสร้างจากรอบข้อมูลและวันปิดบัญชี โปรดตรวจปฏิทินราชการก่อนยื่นจริง</span></div></section><section class="acr-deadline-list">${buildDeadlines().map((row) => `<article><label><input type="checkbox" data-obligation="${row.id}" ${completed.has(row.id)?"checked":""}/><span class="check"></span></label><div><b>${esc(row.title)}</b><span>${esc(row.detail)}</span></div><time>${formatDate(row.date)}</time><em class="${daysUntil(row.date)<0?"late":daysUntil(row.date)<=7?"soon":""}">${daysUntil(row.date)<0?`เกิน ${Math.abs(daysUntil(row.date))} วัน`:`เหลือ ${daysUntil(row.date)} วัน`}</em></article>`).join("")}</section><div class="acr-form-warning">ระบบคำนวณวันตามกติกาทั่วไปและยังไม่เลื่อนวันหยุดราชการอัตโนมัติ ให้ตรวจสอบปฏิทินกรมสรรพากรก่อนยื่นทุกครั้ง</div>`;
  }
  function documentsView() {
    return `<section class="acr-page-head"><div><p>DOCUMENT REGISTER</p><h2>ทะเบียนเอกสาร</h2><span>บันทึกสถานะเอกสาร ไม่ได้อัปโหลดข้อมูลการเงินจริง</span></div></section><form id="acrDocumentForm" class="acr-inline-form document"><input name="name" placeholder="ชื่อเอกสาร" required/><select name="type"><option>ใบกำกับภาษี</option><option>หนังสือรับรองหัก ณ ที่จ่าย</option><option>หลักฐานยื่นแบบ</option><option>งบการเงิน</option><option>สัญญา</option><option>เอกสารบริษัท</option></select><input name="date" type="date" value="${todayIso()}" required/><select name="status"><option>รอตรวจ</option><option>ครบถ้วน</option><option>ขาดเอกสาร</option></select><button>เพิ่มเอกสาร</button></form><section class="acr-document-grid">${state.documents.length ? state.documents.map((doc) => `<article><span>${esc(doc.type)}</span><b>${esc(doc.name)}</b><small>${formatDate(doc.date)}</small><em class="${doc.status === "ครบถ้วน" ? "ok" : doc.status === "ขาดเอกสาร" ? "bad" : ""}">${esc(doc.status)}</em><button class="acr-delete" data-delete-document="${esc(doc.id)}">ลบ</button></article>`).join("") : `<div class="acr-empty">ยังไม่มีเอกสารในทะเบียน</div>`}</section>`;
  }
  function settingsView() {
    return `<section class="acr-page-head"><div><p>RULES & CONFIGURATION</p><h2>ข้อมูลบริษัทและกติกาคำนวณ</h2><span>เฉพาะ C5 ขึ้นไปควรแก้ไขข้อมูลสำคัญ</span></div></section><section class="acr-two-col"><form id="acrCompanyForm" class="acr-form-panel"><h2>ข้อมูลกิจการ</h2><label>ชื่อบริษัท<input name="name" value="${esc(state.company.name)}" required/></label><label>เลขประจำตัวผู้เสียภาษี<input name="taxId" value="${esc(state.company.taxId)}" maxlength="13"/></label><label>ทุนชำระแล้ว<input name="paidCapital" type="number" min="0" step="0.01" value="${num(state.company.paidCapital)}"/></label><label>วันสิ้นรอบบัญชี<input name="fiscalYearEnd" type="date" value="${esc(state.company.fiscalYearEnd)}"/></label><label class="acr-check"><input name="vatRegistered" type="checkbox" ${state.company.vatRegistered?"checked":""}/> จดทะเบียนภาษีมูลค่าเพิ่มแล้ว</label><button ${isC5(currentUser)?"":"disabled"}>บันทึกข้อมูลบริษัท</button>${isC5(currentUser)?"":"<small>ต้องใช้ระดับ C5 ขึ้นไป</small>"}</form><article class="acr-panel acr-rules"><h2>กติกาที่ระบบใช้อยู่</h2><dl><div><dt>VAT</dt><dd>7% ถึง 30 กันยายน 2569</dd></div><div><dt>เกณฑ์จด VAT</dt><dd>รายรับเกิน 1.8 ล้านบาท/ปี</dd></div><div><dt>ภาษีนิติบุคคลทั่วไป</dt><dd>20% ของกำไรสุทธิทางภาษี</dd></div><div><dt>เงื่อนไข SME ที่ใช้ประเมิน</dt><dd>ทุนชำระแล้วไม่เกิน 5 ล้านบาท และรายได้ไม่เกิน 30 ล้านบาท</dd></div><div><dt>อัตรา SME</dt><dd>0–300,000 ยกเว้น; 300,001–3 ล้าน 15%; ส่วนเกิน 3 ล้าน 20%</dd></div></dl><h3>แหล่งอ้างอิงราชการ</h3>${lawRules.sources.map(([label,url]) => `<a href="${url}" target="_blank" rel="noopener">↗ ${esc(label)}</a>`).join("")}<div class="acr-rule-alert">หลังวันที่ 30 กันยายน 2569 ระบบจะไม่สมมติอัตรา VAT ใหม่ และจะแสดงคำเตือนให้ตรวจประกาศล่าสุด</div></article></section>${isC5(currentUser)?`<section class="acr-panel acr-password"><h2>เปลี่ยนรหัสผ่านพื้นที่นักบัญชี</h2><form id="acrPasswordForm"><input name="password" type="password" minlength="6" placeholder="รหัสใหม่อย่างน้อย 6 ตัว" required/><input name="confirm" type="password" minlength="6" placeholder="ยืนยันรหัสใหม่" required/><button>เปลี่ยนรหัสผ่าน</button></form><small>รหัสถูกเก็บเป็น SHA-256 digest ในอุปกรณ์นี้ ไม่เก็บข้อความรหัสผ่านโดยตรง</small></section>`:""}`;
  }

  function bindRoom(root) {
    root.querySelectorAll("[data-ac-view]").forEach((button) => button.addEventListener("click", () => { activeView = button.dataset.acView; notice = ""; renderRoom(root); }));
    root.querySelector("[data-ac-exit]")?.addEventListener("click", callbacks.onExit);
    root.querySelector("#acrPeriod")?.addEventListener("change", (event) => { state.selectedPeriod = event.target.value || currentPeriod(); save("เปลี่ยนรอบข้อมูล"); renderRoom(root); });
    root.querySelectorAll("[data-scenario]").forEach((button) => button.addEventListener("click", () => { state.scenario = button.dataset.scenario; save(`เลือกสถานการณ์ ${state.scenario}`); renderRoom(root); }));
    root.querySelector("#acrMonthForm")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const row = {}; form.forEach((value,key) => row[key] = num(value)); state.months[state.selectedPeriod] = row; save(`บันทึกตัวเลขรอบ ${state.selectedPeriod}`); notice="บันทึกข้อมูลและคำนวณใหม่แล้ว"; noticeType="success"; activeView="overview"; renderRoom(root); });
    root.querySelector("#acrWhtForm")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const [type, suggested] = String(form.get("type")).split("|"); const rate = type === "custom" ? num(form.get("custom_rate")) : num(suggested); const labels={service:"ค่าบริการ/จ้างทำของ",rent:"ค่าเช่า",advertising:"ค่าโฆษณา",transport:"ค่าขนส่ง",custom:"กำหนดเอง"}; state.transactions.push({id:uid("wht"),period:state.selectedPeriod,payee:String(form.get("payee")),type,label:labels[type],amount:num(form.get("amount")),rate}); save("เพิ่มรายการภาษีหัก ณ ที่จ่าย"); renderRoom(root); });
    root.querySelectorAll("[data-delete-wht]").forEach((button) => button.addEventListener("click", () => { state.transactions = state.transactions.filter((row) => row.id !== button.dataset.deleteWht); save("ลบรายการภาษีหัก ณ ที่จ่าย"); renderRoom(root); }));
    root.querySelectorAll("[data-obligation]").forEach((input) => input.addEventListener("change", () => { state.obligations = state.obligations.filter((row) => row.id !== input.dataset.obligation); state.obligations.push({id:input.dataset.obligation,completed:input.checked,updatedAt:new Date().toISOString()}); save("อัปเดตสถานะงานบัญชี"); renderRoom(root); }));
    root.querySelector("#acrDocumentForm")?.addEventListener("submit", (event) => { event.preventDefault(); const form=new FormData(event.currentTarget); state.documents.unshift({id:uid("doc"),name:String(form.get("name")),type:String(form.get("type")),date:String(form.get("date")),status:String(form.get("status"))}); save("เพิ่มทะเบียนเอกสาร"); renderRoom(root); });
    root.querySelectorAll("[data-delete-document]").forEach((button) => button.addEventListener("click", () => { state.documents=state.documents.filter((doc)=>doc.id!==button.dataset.deleteDocument); save("ลบทะเบียนเอกสาร"); renderRoom(root); }));
    root.querySelector("#acrCompanyForm")?.addEventListener("submit", (event) => { event.preventDefault(); if(!isC5(currentUser)) return; const form=new FormData(event.currentTarget); state.company={...state.company,name:String(form.get("name")),taxId:String(form.get("taxId")),paidCapital:num(form.get("paidCapital")),fiscalYearEnd:String(form.get("fiscalYearEnd")),vatRegistered:form.get("vatRegistered")==="on"}; save("แก้ไขข้อมูลบริษัทในพื้นที่นักบัญชี"); notice="บันทึกข้อมูลบริษัทแล้ว"; noticeType="success"; renderRoom(root); });
    root.querySelector("#acrPasswordForm")?.addEventListener("submit", async (event) => { event.preventDefault(); const form=new FormData(event.currentTarget); const password=String(form.get("password")); if(password!==String(form.get("confirm"))){notice="รหัสผ่านทั้งสองช่องไม่ตรงกัน";noticeType="error";renderRoom(root);return;} localStorage.setItem(PASSWORD_KEY,await sha256(password)); callbacks.onAudit?.("ACCOUNTING_PASSWORD","เปลี่ยนรหัสผ่านพื้นที่นักบัญชี"); notice="เปลี่ยนรหัสผ่านแล้ว";noticeType="success";renderRoom(root); });
  }

  window.AccountingControl = { render };
})();
