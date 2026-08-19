(function () {
  "use strict";

  const LOCAL_KEY = "pismai_pf_payment_allocations_v1";
  const levelNumber = (user) => Number(String(user?.level || "C1").replace(/\D/g, "")) || 1;
  const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const money = (value) => `฿${(Number(value) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const isoDate = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  function addDays(dateText, days) {
    const parts = String(dateText || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return dateText;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + days);
    return isoDate(date);
  }

  function currentWeek() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (today.getDay() || 7) + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: isoDate(start), endDate: isoDate(end) };
  }

  function analysisRange(preset) {
    const today = new Date();
    if (preset === "today") return { startDate: isoDate(today), endDate: isoDate(today) };
    if (preset === "month") return { startDate: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)) };
    if (preset === "year") return { startDate: isoDate(new Date(today.getFullYear(), 0, 1)), endDate: isoDate(new Date(today.getFullYear(), 11, 31)) };
    return currentWeek();
  }

  function readLocalWeek(startDate, endDate) {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}")[`${startDate}:${endDate}`] || {}; }
    catch { return {}; }
  }

  function writeLocalWeek(startDate, endDate, allocations) {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); } catch { data = {}; }
    data[`${startDate}:${endDate}`] = allocations;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  }

  function render(root, user, options = {}) {
    localStorage.removeItem("pismai_accounting_password_hash_v1");
    sessionStorage.removeItem("pismai_accounting_access_v1");
    if (levelNumber(user) < 4 && user?.role !== "developer" && !user?.is_system) return options.onExit?.();

    const week = currentWeek();
    const state = { view: "allocation", kind: "production", exportScope: "all", startDate: week.startDate, endDate: week.endDate, group: "all", rows: [], allocations: {}, expanded: new Set(), loading: true, message: "", messageType: "success", costPreset: "week", costStartDate: week.startDate, costEndDate: week.endDate, costData: null, costLoading: false };
    const methodOf = (row) => state.allocations[row.employee_key] === "transfer" ? "transfer" : "cash";
    const methodRows = (method) => state.rows.filter((row) => method === "all" || methodOf(row) === method);
    const sum = (rows) => rows.reduce((total, row) => total + Number(row.net_amount || 0), 0);
    const totals = () => ({ cash: methodRows("cash"), transfer: methodRows("transfer"), total: sum(state.rows) });
    function scopedExportRows() {
      if (state.exportScope === "all") return state.rows;
      const [kind, group = "*"] = state.exportScope.split("::");
      return state.rows.filter((row) => row.employee_kind === kind && (group === "*" || row.group_label === group));
    }
    function exportScopeLabel() {
      if (state.exportScope === "all") return "พนักงานทั้งหมด";
      const [kind, group = "*"] = state.exportScope.split("::");
      const kindLabel = kind === "time" ? "พนักงานเวลา" : "พนักงานเหมา";
      return group === "*" ? `${kindLabel}ทุกกลุ่ม` : `${kindLabel} - ${group}`;
    }

    async function load() {
      state.loading = true;
      state.message = "";
      paint();
      try {
        state.rows = await Promise.resolve(options.getWeeklyRows?.(state.startDate, state.endDate) || []);
        let saved = readLocalWeek(state.startDate, state.endDate);
        try {
          const cloud = await options.loadAllocations?.(state.startDate, state.endDate);
          if (cloud && typeof cloud === "object") saved = { ...saved, ...cloud };
        } catch (error) { console.warn("PF allocation cloud load failed; using local copy.", error); }
        state.allocations = {};
        state.rows.forEach((row) => { state.allocations[row.employee_key] = saved[row.employee_key] === "transfer" ? "transfer" : "cash"; });
      } catch (error) {
        state.message = error instanceof Error ? error.message : "โหลดข้อมูลรอบจ่ายไม่สำเร็จ";
        state.messageType = "error";
      } finally { state.loading = false; paint(); }
    }

    async function loadCostAnalysis() {
      state.costLoading = true;
      state.message = "";
      paint();
      try {
        state.costData = await options.getCostAnalysis?.(state.costStartDate, state.costEndDate) || { rows: [], totals: {} };
      } catch (error) {
        state.message = error instanceof Error ? error.message : "โหลดข้อมูลวิเคราะห์ต้นทุนไม่สำเร็จ";
        state.messageType = "error";
      } finally {
        state.costLoading = false;
        paint();
      }
    }

    async function save(description) {
      writeLocalWeek(state.startDate, state.endDate, state.allocations);
      state.message = "กำลังบันทึกวิธีจ่าย...";
      state.messageType = "success";
      paint();
      try {
        await options.saveAllocations?.({
          start_date: state.startDate,
          end_date: state.endDate,
          allocations: state.rows.map((row) => ({ employee_key: row.employee_key, employee_kind: row.employee_kind, employee_id: row.employee_id, emp_code: row.emp_code, fullname: row.fullname, group_label: row.group_label, payment_method: methodOf(row), net_amount: Number(row.net_amount || 0) }))
        });
        state.message = "บันทึกวิธีจ่ายเรียบร้อยแล้ว";
        options.onAudit?.("PF_PAYMENT_ALLOCATION_SAVE", description);
      } catch (error) {
        state.message = "บันทึกไว้ในเครื่องแล้ว แต่ฐานกลางยังไม่พร้อม: " + (error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
        state.messageType = "warning";
      }
      paint();
    }

    async function exportFile(method, format) {
      const rows = scopedExportRows().filter((row) => methodOf(row) === method);
      if (!rows.length) {
        state.message = `ไม่มีรายการ${method === "cash" ? "เงินสด" : "เงินโอน"}สำหรับ Export`;
        state.messageType = "error";
        return paint();
      }
      state.message = `กำลังสร้าง ${format === "excel" ? "Excel" : "PDF"}...`;
      state.messageType = "success";
      paint();
      try {
        await options.exportPayments?.(format, method, { start_date: state.startDate, end_date: state.endDate, payment_method: method, scope_label: exportScopeLabel(), rows: rows.map((row, index) => ({ ...row, sequence: index + 1, payment_method: method })), printed_by: user?.fullname || user?.username || "System Admin", printed_by_position: String(user?.level || "C4") });
        state.message = `Export ${format === "excel" ? "Excel" : "PDF"} เรียบร้อยแล้ว`;
        options.onAudit?.("PF_PAYMENT_EXPORT", `Export ${method} ${format} ${state.startDate} - ${state.endDate}`);
      } catch (error) {
        state.message = error instanceof Error ? error.message : "Export ไม่สำเร็จ";
        state.messageType = "error";
      }
      paint();
    }

    function rowMarkup(row) {
      const method = methodOf(row);
      const expanded = state.expanded.has(row.employee_key);
      const detailItems = (items, tone, emptyText) => items?.length
        ? items.map((item) => `<article><div><b>${escapeHtml(item.label || "-")}</b><span>${escapeHtml(item.start_date || "-")}${item.end_date && item.end_date !== item.start_date ? ` ถึง ${escapeHtml(item.end_date)}` : ""}</span></div><strong class="${tone}">${tone === "acr-positive" ? "+" : "-"}${money(item.amount)}</strong><p>${escapeHtml(item.note || "ไม่มีหมายเหตุ")}</p><small>บันทึกโดย ${escapeHtml(item.created_by || "-")}</small></article>`).join("")
        : `<div class="acr-detail-empty">${emptyText}</div>`;
      return `<tr class="acr-employee-row ${expanded ? "is-expanded" : ""}"><td><button type="button" class="acr-employee-toggle" data-expand-key="${escapeHtml(row.employee_key)}" aria-expanded="${expanded}"><span>${expanded ? "▾" : "▸"}</span><span><strong>${escapeHtml(row.emp_code || "-")}</strong><small>${escapeHtml(row.fullname || "-")} · ${row.employee_kind === "time" ? "พนักงานเวลา" : "พนักงานเหมา"}</small></span></button></td><td>${escapeHtml(row.group_label || "-")}</td><td class="acr-number">${money(row.gross_amount)}</td><td class="acr-number acr-positive">+${money(row.bonus_amount)}</td><td class="acr-number acr-negative">-${money(Number(row.deduction_amount || 0) + Number(row.withholding_tax_amount || 0))}</td><td class="acr-number"><strong>${money(row.net_amount)}</strong></td><td><div class="acr-method-switch"><button type="button" data-method-key="${escapeHtml(row.employee_key)}" data-method="cash" class="${method === "cash" ? "is-cash" : ""}">เงินสด</button><button type="button" data-method-key="${escapeHtml(row.employee_key)}" data-method="transfer" class="${method === "transfer" ? "is-transfer" : ""}">เงินโอน</button></div></td></tr>${expanded ? `<tr class="acr-detail-row"><td colspan="7"><div class="acr-detail-grid"><section><header><span>เงินเพิ่ม</span><strong class="acr-positive">+${money(row.bonus_amount)}</strong></header>${detailItems(row.bonus_items, "acr-positive", "ไม่มีรายการเงินเพิ่มในรอบนี้")}</section><section><header><span>รายการหัก</span><strong class="acr-negative">-${money(Number(row.deduction_amount || 0) + Number(row.withholding_tax_amount || 0))}</strong></header>${detailItems(row.deduction_items, "acr-negative", "ไม่มีรายการหักในรอบนี้")}</section></div></td></tr>` : ""}`;
    }

    function allocationMarkup() {
      const summary = totals();
      const kindRows = state.rows.filter((row) => row.employee_kind === state.kind);
      const groups = [...new Set(kindRows.map((row) => row.group_label || "ไม่ระบุกลุ่ม"))].sort((a, b) => a.localeCompare(b, "th"));
      const visible = state.group === "all" ? kindRows : kindRows.filter((row) => row.group_label === state.group);
      const productionCount = state.rows.filter((row) => row.employee_kind === "production").length;
      const timeCount = state.rows.filter((row) => row.employee_kind === "time").length;
      return `<section class="acr-page"><header class="acr-page-head"><div><p>PF ACCOUNTING</p><h1>จัดสรรการจ่ายเงินประจำสัปดาห์</h1><span>นำยอดสุทธิหลังหักและบวกจากระบบค่าแรงมาแบ่งวิธีจ่าย</span></div><div class="acr-period"><label>เริ่มต้น<input type="date" data-start-date value="${state.startDate}"></label><label>สิ้นสุด<input type="date" data-end-date value="${state.endDate}"></label></div></header>
        <div class="acr-sync-line"><span>ข้อมูลล่าสุดจากระบบค่าแรง · ${state.rows.length.toLocaleString("th-TH")} คน</span><button type="button" data-reload>↻ โหลดข้อมูลล่าสุด</button></div>
        <div class="acr-metrics"><article><span>ยอดสุทธิทั้งหมด</span><strong>${money(summary.total)}</strong><small>${state.rows.length} คน</small></article><article class="cash"><span>เตรียมเงินสด</span><strong>${money(sum(summary.cash))}</strong><small>${summary.cash.length} คน</small></article><article class="transfer"><span>ยอดเงินโอน</span><strong>${money(sum(summary.transfer))}</strong><small>${summary.transfer.length} คน</small></article></div>
        <div class="acr-allocation-grid"><aside class="acr-groups"><h2>ประเภทพนักงาน</h2><div class="acr-kind-tabs"><button type="button" data-kind="production" class="${state.kind === "production" ? "active" : ""}"><b>พนักงานเหมา</b><span>${productionCount} คน</span></button><button type="button" data-kind="time" class="${state.kind === "time" ? "active" : ""}"><b>พนักงานเวลา</b><span>${timeCount} คน</span></button></div><h3>เลือกกลุ่ม</h3><button type="button" data-group="all" class="${state.group === "all" ? "active" : ""}"><b>ทุกกลุ่ม</b><span>${kindRows.length} คน</span></button>${groups.map((group) => { const rows = kindRows.filter((row) => row.group_label === group); return `<button type="button" data-group="${escapeHtml(group)}" class="${state.group === group ? "active" : ""}"><b>${escapeHtml(group)}</b><span>${rows.length} คน · ${money(sum(rows))}</span></button>`; }).join("")}<div class="acr-group-default"><label>ตั้งวิธีจ่ายให้กลุ่มนี้<select data-group-method><option value="cash">เงินสดทั้งกลุ่ม</option><option value="transfer">เงินโอนทั้งกลุ่ม</option></select></label><button type="button" data-apply-group>ใช้กับ ${state.group === "all" ? `พนักงาน${state.kind === "time" ? "เวลาทุกกลุ่ม" : "เหมาทุกกลุ่ม"}` : escapeHtml(state.group)}</button></div></aside>
          <section class="acr-list"><div class="acr-list-head"><div><h2>${state.kind === "time" ? "พนักงานเวลา" : "พนักงานเหมา"}${state.group === "all" ? "ทั้งหมด" : ` · ${escapeHtml(state.group)}`}</h2><span>เปลี่ยนรายคนได้ ยอดจะย้ายฝั่งทันที</span></div><b>${visible.length} คน</b></div>${state.loading ? `<div class="acr-empty">กำลังดึงยอดสุทธิล่าสุด...</div>` : visible.length ? `<div class="acr-table-wrap"><table><thead><tr><th>พนักงาน</th><th>กลุ่ม</th><th class="acr-number">ค่าแรง</th><th class="acr-number">เงินเพิ่ม</th><th class="acr-number">เงินหัก</th><th class="acr-number">ยอดสุทธิ</th><th>วิธีจ่าย</th></tr></thead><tbody>${visible.map(rowMarkup).join("")}</tbody></table></div>` : `<div class="acr-empty">ยังไม่มีพนักงานประเภทนี้ในระบบ</div>`}<footer class="acr-reconcile"><span>เงินสด ${money(sum(summary.cash))}</span><b>+</b><span>เงินโอน ${money(sum(summary.transfer))}</span><b>=</b><strong>${money(summary.total)}</strong></footer></section></div></section>`;
    }

    function exportCard(method, label, rows) {
      return `<article class="acr-export-card ${method}"><div><span>${method === "cash" ? "CASH" : "BANK TRANSFER"}</span><h2>${label}</h2><p>${rows.length} คน · ${money(sum(rows))}</p></div><div class="acr-export-actions"><button type="button" data-export-method="${method}" data-export-format="excel">Export Excel</button><button type="button" data-export-method="${method}" data-export-format="pdf">Export PDF / พิมพ์</button></div></article>`;
    }

    function exportMarkup() {
      const rows = scopedExportRows();
      const cashRows = rows.filter((row) => methodOf(row) === "cash");
      const transferRows = rows.filter((row) => methodOf(row) === "transfer");
      const productionGroups = [...new Set(state.rows.filter((row) => row.employee_kind === "production").map((row) => row.group_label))].sort((a, b) => a.localeCompare(b, "th"));
      const timeGroups = [...new Set(state.rows.filter((row) => row.employee_kind === "time").map((row) => row.group_label))].sort((a, b) => a.localeCompare(b, "th"));
      return `<section class="acr-page"><header class="acr-page-head"><div><p>PF ACCOUNTING</p><h1>Export รายการจ่ายเงิน</h1><span>แยกเอกสารเงินสดและเงินโอนตามการจัดสรรล่าสุด</span></div><div class="acr-period-static">${escapeHtml(state.startDate)} ถึง ${escapeHtml(state.endDate)}</div></header><div class="acr-export-filter"><label>ขอบเขตรายงาน<select data-export-scope><option value="all" ${state.exportScope === "all" ? "selected" : ""}>พนักงานทั้งหมด</option><optgroup label="พนักงานเหมา"><option value="production::*" ${state.exportScope === "production::*" ? "selected" : ""}>พนักงานเหมาทุกกลุ่ม</option>${productionGroups.map((group) => `<option value="production::${escapeHtml(group)}" ${state.exportScope === `production::${group}` ? "selected" : ""}>${escapeHtml(group)}</option>`).join("")}</optgroup><optgroup label="พนักงานเวลา"><option value="time::*" ${state.exportScope === "time::*" ? "selected" : ""}>พนักงานเวลาทุกกลุ่ม</option>${timeGroups.map((group) => `<option value="time::${escapeHtml(group)}" ${state.exportScope === `time::${group}` ? "selected" : ""}>${escapeHtml(group)}</option>`).join("")}</optgroup></select></label><div><span>กำลังแสดง</span><strong>${escapeHtml(exportScopeLabel())}</strong><small>${rows.length} คน</small></div></div><div class="acr-export-summary"><strong>ยอดสุทธิรวม ${money(sum(rows))}</strong><span>เงินสด ${money(sum(cashRows))} + เงินโอน ${money(sum(transferRows))}</span></div><div class="acr-export-grid">${exportCard("cash", "รายการจ่ายเงินสด", cashRows)}${exportCard("transfer", "รายการจ่ายเงินโอน", transferRows)}</div><section class="acr-export-preview"><div class="acr-list-head"><div><h2>ตัวอย่างรายการที่จะส่งออก</h2><span>ไฟล์จะแสดงขอบเขต “${escapeHtml(exportScopeLabel())}” บนเอกสาร</span></div></div><div class="acr-table-wrap"><table><thead><tr><th>ลำดับ</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>ประเภท</th><th>กลุ่ม</th><th>วิธีจ่าย</th><th class="acr-number">ยอดสุทธิ</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.emp_code)}</td><td>${escapeHtml(row.fullname)}</td><td>${row.employee_kind === "time" ? "พนักงานเวลา" : "พนักงานเหมา"}</td><td>${escapeHtml(row.group_label)}</td><td>${methodOf(row) === "cash" ? "เงินสด" : "เงินโอน"}</td><td class="acr-number"><strong>${money(row.net_amount)}</strong></td></tr>`).join("")}</tbody></table></div></section></section>`;
    }

    function costAnalysisMarkup() {
      const data = state.costData || { rows: [], totals: {} };
      const totals = data.totals || {};
      const yieldPercent = Number(totals.inbound_weight || 0) > 0 ? (Number(totals.output_weight || 0) / Number(totals.inbound_weight || 0)) * 100 : 0;
      const costPerKg = Number(totals.output_weight || 0) > 0 ? Number(totals.total_estimated_cost || 0) / Number(totals.output_weight || 0) : 0;
      const maxWeight = Math.max(1, ...data.rows.map((row) => Math.max(Number(row.inbound_weight || 0), Number(row.output_weight || 0))));
      return `<section class="acr-page"><header class="acr-page-head"><div><p>PF COST ANALYTICS</p><h1>เปรียบเทียบข้อมูลเพื่อวิเคราะห์ต้นทุน</h1><span>เชื่อมข้อมูลรับเข้าผลไม้ ผลผลิตปลายทาง และค่าแรงจากระบบเดียวกัน</span></div><button type="button" class="acr-refresh-cost" data-reload-cost>↻ โหลดข้อมูลล่าสุด</button></header>
        <div class="acr-cost-periods"><div>${[["today","วันนี้"],["week","สัปดาห์นี้"],["month","เดือนนี้"],["year","ปีนี้"],["custom","กำหนดเอง"]].map(([value,label]) => `<button type="button" data-cost-preset="${value}" class="${state.costPreset === value ? "active" : ""}">${label}</button>`).join("")}</div><label>เริ่มต้น<input type="date" data-cost-start value="${state.costStartDate}" ${state.costPreset === "custom" ? "" : "disabled"}></label><label>สิ้นสุด<input type="date" data-cost-end value="${state.costEndDate}" ${state.costPreset === "custom" ? "" : "disabled"}></label></div>
        <div class="acr-metrics acr-cost-metrics"><article><span>น้ำหนักรับเข้ารวม</span><strong>${Number(totals.inbound_weight || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })} กก.</strong><small>มูลค่า ${money(totals.inbound_cost)}</small></article><article><span>น้ำหนักผลผลิตปลายทาง</span><strong>${Number(totals.output_weight || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })} กก.</strong><small>อัตราแปรรูป ${yieldPercent.toFixed(1)}%</small></article><article class="transfer"><span>ต้นทุนประมาณการต่อ กก.</span><strong>${money(costPerKg)}</strong><small>วัตถุดิบ + ค่าแรงเหมา + ค่าแรงเวลา</small></article></div>
        <section class="acr-cost-breakdown"><div class="acr-cost-total"><div><span>มูลค่ารับเข้า</span><strong>${money(totals.inbound_cost)}</strong></div><b>+</b><div><span>ค่าแรงเหมา</span><strong>${money(totals.production_labor)}</strong></div><b>+</b><div><span>ค่าแรงเวลา</span><strong>${money(totals.time_labor)}</strong></div><b>=</b><div><span>ต้นทุนรวมประมาณการ</span><strong>${money(totals.total_estimated_cost)}</strong></div></div></section>
        <section class="acr-export-preview acr-cost-table"><div class="acr-list-head"><div><h2>เปรียบเทียบตามชนิดผลไม้</h2><span>ค่าแรงเวลาจัดสรรตามสัดส่วนน้ำหนักผลผลิต เพื่อใช้เป็นข้อมูลสนับสนุน ไม่ใช่รายการบัญชีที่ผ่านการรับรอง</span></div></div>${state.costLoading ? `<div class="acr-empty">กำลังรวมข้อมูลจากทั้งระบบ...</div>` : data.rows.length ? `<div class="acr-table-wrap"><table><thead><tr><th>ผลไม้</th><th>เปรียบเทียบน้ำหนัก</th><th class="acr-number">รับเข้า</th><th class="acr-number">ปลายทาง</th><th class="acr-number">อัตราแปรรูป</th><th class="acr-number">มูลค่ารับเข้า</th><th class="acr-number">ค่าแรงรวม</th><th class="acr-number">ต้นทุน/กก.</th></tr></thead><tbody>${data.rows.map((row) => `<tr><td><strong>${escapeHtml(row.fruit_label)}</strong></td><td><div class="acr-weight-bars"><i style="width:${Math.max(1,(Number(row.inbound_weight || 0)/maxWeight)*100)}%"><span>รับเข้า</span></i><i class="out" style="width:${Math.max(1,(Number(row.output_weight || 0)/maxWeight)*100)}%"><span>ปลายทาง</span></i></div></td><td class="acr-number">${Number(row.inbound_weight || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}</td><td class="acr-number">${Number(row.output_weight || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}</td><td class="acr-number">${Number(row.yield_percent || 0).toFixed(1)}%</td><td class="acr-number">${money(row.inbound_cost)}</td><td class="acr-number">${money(Number(row.production_labor || 0) + Number(row.time_labor_allocated || 0))}</td><td class="acr-number"><strong>${money(row.total_cost_per_output_kg)}</strong></td></tr>`).join("")}</tbody></table></div>` : `<div class="acr-empty">ยังไม่มีข้อมูลรับเข้าหรือผลผลิตในช่วงที่เลือก</div>`}</section></section>`;
    }

    function paint() {
      const content = state.view === "allocation" ? allocationMarkup() : state.view === "export" ? exportMarkup() : costAnalysisMarkup();
      root.innerHTML = `<main class="acr-shell"><aside class="acr-rail"><div class="acr-logo">PF</div><div class="acr-rail-brand">PF Accounting<small>สิทธิ์ C4 ขึ้นไป</small></div><nav><button type="button" data-view="allocation" class="${state.view === "allocation" ? "active" : ""}"><span>▦</span>จัดสรรเงินจ่าย</button><button type="button" data-view="export" class="${state.view === "export" ? "active" : ""}"><span>⇩</span>Export / พิมพ์</button><button type="button" data-view="cost" class="${state.view === "cost" ? "active" : ""}"><span>⌁</span>วิเคราะห์ต้นทุน</button></nav><button class="acr-exit" type="button" data-ac-exit>↩<span>กลับระบบหลัก</span></button></aside><div class="acr-workspace">${content}${state.message ? `<div class="acr-toast ${state.messageType}">${escapeHtml(state.message)}</div>` : ""}</div></main>`;
      bind();
    }

    function bind() {
      root.querySelector("[data-ac-exit]")?.addEventListener("click", () => options.onExit?.());
      root.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
        state.view = button.dataset.view;
        paint();
        if (state.view === "cost" && !state.costData && !state.costLoading) loadCostAnalysis();
      }));
      root.querySelector("[data-reload]")?.addEventListener("click", load);
      root.querySelector("[data-reload-cost]")?.addEventListener("click", loadCostAnalysis);
      root.querySelectorAll("[data-cost-preset]").forEach((button) => button.addEventListener("click", () => {
        state.costPreset = button.dataset.costPreset;
        if (state.costPreset === "custom") return paint();
        const range = analysisRange(state.costPreset);
        state.costStartDate = range.startDate;
        state.costEndDate = range.endDate;
        loadCostAnalysis();
      }));
      root.querySelector("[data-cost-start]")?.addEventListener("change", (event) => {
        state.costStartDate = event.target.value || state.costStartDate;
        if (state.costEndDate < state.costStartDate) state.costEndDate = state.costStartDate;
        loadCostAnalysis();
      });
      root.querySelector("[data-cost-end]")?.addEventListener("change", (event) => {
        state.costEndDate = event.target.value || state.costEndDate;
        if (state.costEndDate < state.costStartDate) state.costStartDate = state.costEndDate;
        loadCostAnalysis();
      });
      root.querySelectorAll("[data-kind]").forEach((button) => button.addEventListener("click", () => { state.kind = button.dataset.kind; state.group = "all"; paint(); }));
      root.querySelectorAll("[data-group]").forEach((button) => button.addEventListener("click", () => { state.group = button.dataset.group; paint(); }));
      root.querySelectorAll("[data-method-key]").forEach((button) => button.addEventListener("click", () => { state.allocations[button.dataset.methodKey] = button.dataset.method; save(`เปลี่ยน ${button.dataset.methodKey} เป็น ${button.dataset.method}`); }));
      root.querySelectorAll("[data-expand-key]").forEach((button) => button.addEventListener("click", () => { const key = button.dataset.expandKey; state.expanded.has(key) ? state.expanded.delete(key) : state.expanded.add(key); paint(); }));
      root.querySelector("[data-apply-group]")?.addEventListener("click", () => { const method = root.querySelector("[data-group-method]")?.value === "transfer" ? "transfer" : "cash"; state.rows.filter((row) => row.employee_kind === state.kind && (state.group === "all" || row.group_label === state.group)).forEach((row) => { state.allocations[row.employee_key] = method; }); save(`ตั้ง ${state.kind}/${state.group} เป็น ${method}`); });
      root.querySelector("[data-start-date]")?.addEventListener("change", (event) => {
        state.startDate = event.target.value || state.startDate;
        state.endDate = addDays(state.startDate, 6);
        state.group = "all";
        load();
      });
      root.querySelector("[data-end-date]")?.addEventListener("change", (event) => {
        state.endDate = event.target.value || state.endDate;
        if (state.endDate < state.startDate) state.endDate = state.startDate;
        state.group = "all";
        load();
      });
      root.querySelectorAll("[data-export-method]").forEach((button) => button.addEventListener("click", () => exportFile(button.dataset.exportMethod, button.dataset.exportFormat)));
      root.querySelector("[data-export-scope]")?.addEventListener("change", (event) => { state.exportScope = event.target.value || "all"; paint(); });
    }

    paint();
    load();
  }

  window.AccountingControl = { render };
})();
