(function () {
  "use strict";

  const LOCAL_KEY = "pismai_pf_payment_allocations_v1";
  const levelNumber = (user) => Number(String(user?.level || "C1").replace(/\D/g, "")) || 1;
  const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const money = (value) => `฿${(Number(value) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const isoDate = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  function currentWeek() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (today.getDay() || 7) + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: isoDate(start), endDate: isoDate(end) };
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
    const state = { view: "allocation", startDate: week.startDate, endDate: week.endDate, group: "all", rows: [], allocations: {}, expanded: new Set(), loading: true, message: "", messageType: "success" };
    const methodOf = (row) => state.allocations[row.employee_key] === "transfer" ? "transfer" : "cash";
    const methodRows = (method) => state.rows.filter((row) => method === "all" || methodOf(row) === method);
    const sum = (rows) => rows.reduce((total, row) => total + Number(row.net_amount || 0), 0);
    const totals = () => ({ cash: methodRows("cash"), transfer: methodRows("transfer"), total: sum(state.rows) });

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
      const rows = methodRows(method);
      if (!rows.length) {
        state.message = `ไม่มีรายการ${method === "cash" ? "เงินสด" : "เงินโอน"}สำหรับ Export`;
        state.messageType = "error";
        return paint();
      }
      state.message = `กำลังสร้าง ${format === "excel" ? "Excel" : "PDF"}...`;
      state.messageType = "success";
      paint();
      try {
        await options.exportPayments?.(format, method, { start_date: state.startDate, end_date: state.endDate, payment_method: method, rows: rows.map((row, index) => ({ ...row, sequence: index + 1, payment_method: method })), printed_by: user?.fullname || user?.username || "System Admin", printed_by_position: String(user?.level || "C4") });
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
      const groups = [...new Set(state.rows.map((row) => row.group_label || "ไม่ระบุกลุ่ม"))].sort((a, b) => a.localeCompare(b, "th"));
      const visible = state.group === "all" ? state.rows : state.rows.filter((row) => row.group_label === state.group);
      return `<section class="acr-page"><header class="acr-page-head"><div><p>PF ACCOUNTING</p><h1>จัดสรรการจ่ายเงินประจำสัปดาห์</h1><span>นำยอดสุทธิหลังหักและบวกจากระบบค่าแรงมาแบ่งวิธีจ่าย</span></div><div class="acr-period"><label>เริ่มต้น<input type="date" data-start-date value="${state.startDate}"></label><label>สิ้นสุด<input type="date" data-end-date value="${state.endDate}"></label></div></header>
        <div class="acr-sync-line"><span>ข้อมูลล่าสุดจากระบบค่าแรง · ${state.rows.length.toLocaleString("th-TH")} คน</span><button type="button" data-reload>↻ โหลดข้อมูลล่าสุด</button></div>
        <div class="acr-metrics"><article><span>ยอดสุทธิทั้งหมด</span><strong>${money(summary.total)}</strong><small>${state.rows.length} คน</small></article><article class="cash"><span>เตรียมเงินสด</span><strong>${money(sum(summary.cash))}</strong><small>${summary.cash.length} คน</small></article><article class="transfer"><span>ยอดเงินโอน</span><strong>${money(sum(summary.transfer))}</strong><small>${summary.transfer.length} คน</small></article></div>
        <div class="acr-allocation-grid"><aside class="acr-groups"><h2>เลือกกลุ่มพนักงาน</h2><button type="button" data-group="all" class="${state.group === "all" ? "active" : ""}"><b>ทุกกลุ่ม</b><span>${state.rows.length} คน</span></button>${groups.map((group) => { const rows = state.rows.filter((row) => row.group_label === group); return `<button type="button" data-group="${escapeHtml(group)}" class="${state.group === group ? "active" : ""}"><b>${escapeHtml(group)}</b><span>${rows.length} คน · ${money(sum(rows))}</span></button>`; }).join("")}<div class="acr-group-default"><label>ตั้งวิธีจ่ายให้กลุ่มนี้<select data-group-method><option value="cash">เงินสดทั้งกลุ่ม</option><option value="transfer">เงินโอนทั้งกลุ่ม</option></select></label><button type="button" data-apply-group>ใช้กับ ${state.group === "all" ? "ทุกกลุ่ม" : escapeHtml(state.group)}</button></div></aside>
          <section class="acr-list"><div class="acr-list-head"><div><h2>${state.group === "all" ? "พนักงานทั้งหมด" : escapeHtml(state.group)}</h2><span>เปลี่ยนรายคนได้ ยอดจะย้ายฝั่งทันที</span></div><b>${visible.length} คน</b></div>${state.loading ? `<div class="acr-empty">กำลังดึงยอดสุทธิล่าสุด...</div>` : visible.length ? `<div class="acr-table-wrap"><table><thead><tr><th>พนักงาน</th><th>กลุ่ม</th><th class="acr-number">ค่าแรง</th><th class="acr-number">เงินเพิ่ม</th><th class="acr-number">เงินหัก</th><th class="acr-number">ยอดสุทธิ</th><th>วิธีจ่าย</th></tr></thead><tbody>${visible.map(rowMarkup).join("")}</tbody></table></div>` : `<div class="acr-empty">ยังไม่มีข้อมูลค่าแรงในช่วงวันที่นี้</div>`}<footer class="acr-reconcile"><span>เงินสด ${money(sum(summary.cash))}</span><b>+</b><span>เงินโอน ${money(sum(summary.transfer))}</span><b>=</b><strong>${money(summary.total)}</strong></footer></section></div></section>`;
    }

    function exportCard(method, label, rows) {
      return `<article class="acr-export-card ${method}"><div><span>${method === "cash" ? "CASH" : "BANK TRANSFER"}</span><h2>${label}</h2><p>${rows.length} คน · ${money(sum(rows))}</p></div><div class="acr-export-actions"><button type="button" data-export-method="${method}" data-export-format="excel">Export Excel</button><button type="button" data-export-method="${method}" data-export-format="pdf">Export PDF / พิมพ์</button></div></article>`;
    }

    function exportMarkup() {
      const summary = totals();
      return `<section class="acr-page"><header class="acr-page-head"><div><p>PF ACCOUNTING</p><h1>Export รายการจ่ายเงิน</h1><span>แยกเอกสารเงินสดและเงินโอนตามการจัดสรรล่าสุด</span></div><div class="acr-period-static">${escapeHtml(state.startDate)} ถึง ${escapeHtml(state.endDate)}</div></header><div class="acr-export-summary"><strong>ยอดสุทธิรวม ${money(summary.total)}</strong><span>ตรวจสอบแล้ว: เงินสด + เงินโอน = ยอดสุทธิรวม</span></div><div class="acr-export-grid">${exportCard("cash", "รายการจ่ายเงินสด", summary.cash)}${exportCard("transfer", "รายการจ่ายเงินโอน", summary.transfer)}</div><section class="acr-export-preview"><div class="acr-list-head"><div><h2>ตัวอย่างรายการที่จะส่งออก</h2><span>ใช้หัวกระดาษ โลโก้ ชื่อบริษัท ช่วงวันที่ และข้อมูลผู้ออกเอกสารตามฟอร์มหลัก</span></div></div><div class="acr-table-wrap"><table><thead><tr><th>ลำดับ</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>กลุ่ม</th><th>วิธีจ่าย</th><th class="acr-number">ยอดสุทธิ</th></tr></thead><tbody>${state.rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.emp_code)}</td><td>${escapeHtml(row.fullname)}</td><td>${escapeHtml(row.group_label)}</td><td>${methodOf(row) === "cash" ? "เงินสด" : "เงินโอน"}</td><td class="acr-number"><strong>${money(row.net_amount)}</strong></td></tr>`).join("")}</tbody></table></div></section></section>`;
    }

    function paint() {
      root.innerHTML = `<main class="acr-shell"><aside class="acr-rail"><div class="acr-logo">PF</div><div class="acr-rail-brand">PF Accounting<small>สิทธิ์ C4 ขึ้นไป</small></div><nav><button type="button" data-view="allocation" class="${state.view === "allocation" ? "active" : ""}"><span>▦</span>จัดสรรเงินจ่าย</button><button type="button" data-view="export" class="${state.view === "export" ? "active" : ""}"><span>⇩</span>Export / พิมพ์</button></nav><button class="acr-exit" type="button" data-ac-exit>↩<span>กลับระบบหลัก</span></button></aside><div class="acr-workspace">${state.view === "allocation" ? allocationMarkup() : exportMarkup()}${state.message ? `<div class="acr-toast ${state.messageType}">${escapeHtml(state.message)}</div>` : ""}</div></main>`;
      bind();
    }

    function bind() {
      root.querySelector("[data-ac-exit]")?.addEventListener("click", () => options.onExit?.());
      root.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; paint(); }));
      root.querySelector("[data-reload]")?.addEventListener("click", load);
      root.querySelectorAll("[data-group]").forEach((button) => button.addEventListener("click", () => { state.group = button.dataset.group; paint(); }));
      root.querySelectorAll("[data-method-key]").forEach((button) => button.addEventListener("click", () => { state.allocations[button.dataset.methodKey] = button.dataset.method; save(`เปลี่ยน ${button.dataset.methodKey} เป็น ${button.dataset.method}`); }));
      root.querySelectorAll("[data-expand-key]").forEach((button) => button.addEventListener("click", () => { const key = button.dataset.expandKey; state.expanded.has(key) ? state.expanded.delete(key) : state.expanded.add(key); paint(); }));
      root.querySelector("[data-apply-group]")?.addEventListener("click", () => { const method = root.querySelector("[data-group-method]")?.value === "transfer" ? "transfer" : "cash"; state.rows.filter((row) => state.group === "all" || row.group_label === state.group).forEach((row) => { state.allocations[row.employee_key] = method; }); save(`ตั้ง ${state.group} เป็น ${method}`); });
      const changeRange = () => { state.startDate = root.querySelector("[data-start-date]")?.value || state.startDate; state.endDate = root.querySelector("[data-end-date]")?.value || state.endDate; if (state.startDate > state.endDate) [state.startDate, state.endDate] = [state.endDate, state.startDate]; state.group = "all"; load(); };
      root.querySelector("[data-start-date]")?.addEventListener("change", changeRange);
      root.querySelector("[data-end-date]")?.addEventListener("change", changeRange);
      root.querySelectorAll("[data-export-method]").forEach((button) => button.addEventListener("click", () => exportFile(button.dataset.exportMethod, button.dataset.exportFormat)));
    }

    paint();
    load();
  }

  window.AccountingControl = { render };
})();
