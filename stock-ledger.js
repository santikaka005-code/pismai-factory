(function () {
  "use strict";

  const categories = {
    packaging: { title: "Stock บรรจุภัณฑ์", icon: "▣", description: "รับเข้าและเบิกบรรจุภัณฑ์ พร้อมขนาด ราคาต่อหน่วย และเลขใบส่งของ", example: "เช่น กล่องกระดาษ ถุงบรรจุสินค้า ฟิล์มยืด" },
    supplies: { title: "Stock เบ็ดเตล็ด", icon: "◈", description: "ติดตามวัสดุใช้ในโรงงาน ถุงมือ น้ำยา และสารเคมี แยกรายการและหน่วยนับ", example: "เช่น ถุงมือยาง ถุงมือผ้า น้ำยาทำความสะอาด" },
    office: { title: "Stock สำนักงาน", icon: "▤", description: "ตรวจยอด รับเข้า และเบิกวัสดุสำนักงาน พร้อมผู้รับและประวัติทุกรายการ", example: "เช่น หมึกพิมพ์ กระดาษ อุปกรณ์สำนักงาน" }
  };
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const number = (value, digits = 3) => (Number(value) || 0).toLocaleString("th-TH", { maximumFractionDigits: digits });
  const money = (value) => (Number(value) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const price = (value) => (Number(value) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const dateLabel = (value) => /^\d{4}-\d{2}-\d{2}/.test(String(value || "")) ? new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }) : "—";
  const uuid = () => window.crypto?.randomUUID?.() || `stock-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // request(path, {method, body}) receives a plain JSON object as body and returns parsed JSON.
  // This controller owns only root; destroy() invalidates pending reads after route changes.
  function mount(root, options = {}) {
    if (!root || !categories[options.category]) throw new Error("ไม่พบหมวด Stock ที่ต้องการ");
    if (typeof options.request !== "function") throw new Error("Stock ต้องเชื่อมต่อ API ก่อนใช้งาน");
    root.__stockLedgerController?.destroy();
    const category = options.category;
    const config = categories[category];
    const canWrite = options.canWrite === true;
    const state = {
      view: "balance", items: [], movements: [], loading: true, loaded: false, loadError: "", message: "", messageType: "success",
      busy: false, needsRefresh: false, search: "", startDate: "", endDate: "", addItemOpen: false,
      itemDraft: { name: "", specification: "", size: "", unit: "ชิ้น" },
      drafts: { receipt: { occurred_on: today() }, issue: { occurred_on: today() } }, pendingKeys: {}
    };
    let destroyed = false;
    let loadVersion = 0;
    const itemFor = (id) => state.items.find((item) => String(item.id) === String(id));
    const unwrap = (result) => result?.data && !result.items ? result.data : result;
    const ensureSuccess = (result) => {
      if (result?.ok === false || result?.success === false || result?.error) throw new Error(result.error?.message || result.error || result.message || "ไม่สามารถบันทึกข้อมูลได้");
      return result;
    };
    const normalizeDate = (value) => String(value || "").slice(0, 10);

    function rememberForms() {
      const movement = root.querySelector("[data-sl-movement-form]");
      if (movement) state.drafts[movement.dataset.slMovementForm] = Object.fromEntries(new FormData(movement));
      const item = root.querySelector("[data-sl-item-form]");
      if (item) state.itemDraft = Object.fromEntries(new FormData(item));
    }

    function statusMarkup() {
      if (!state.message) return "";
      return `<div class="sl-notice is-${escape(state.messageType)}" role="${state.messageType === "error" ? "alert" : "status"}">${escape(state.message)}</div>`;
    }

    function showMessage(message, type = "success") {
      state.message = message;
      state.messageType = type;
      const target = root.querySelector("[data-sl-status]");
      if (target) target.innerHTML = statusMarkup();
    }

    function metricsMarkup() {
      const currentDate = today();
      const movementsToday = state.movements.filter((row) => normalizeDate(row.occurred_on) === currentDate);
      const value = state.items.reduce((sum, item) => sum + (Number(item.inventory_value) || 0), 0);
      return `<div class="sl-metrics">
        <article><span>รายการสินค้า</span><strong>${number(state.items.length, 0)} <small>รายการ</small></strong><p>สินค้าที่ลงทะเบียนในหมวดนี้</p></article>
        <article><span>รายการที่มีคงเหลือ</span><strong>${state.items.filter(item => Number(item.balance_qty)>0).length} <small>รายการ</small></strong><p>ดูจำนวนแยกตามหน่วยในตาราง</p></article>
        <article><span>รับเข้าวันนี้</span><strong>${number(movementsToday.filter((row) => row.type === "receipt").length, 0)} <small>รายการ</small></strong><p>จำนวนรายการรับเข้าที่บันทึก</p></article>
        <article><span>เบิกออกวันนี้</span><strong>${number(movementsToday.filter((row) => row.type === "issue").length, 0)} <small>รายการ</small></strong><p>จำนวนรายการเบิกที่บันทึก</p></article>
      </div>`;
    }

    function itemFormMarkup() {
      if (!canWrite || !state.addItemOpen) return "";
      const draft = state.itemDraft;
      return `<section class="sl-panel sl-new-item"><div class="sl-panel-head"><div><h3>เพิ่มรายการสินค้า</h3><p>แยกรายการเมื่อขนาด รุ่น หรือหน่วยนับต่างกัน</p></div><button type="button" data-sl-action="close-item" class="sl-button is-quiet" aria-label="ปิดฟอร์มเพิ่มสินค้า">ปิด</button></div>
        <form data-sl-item-form><div class="sl-form-grid">
          <label class="is-wide">ชื่อสินค้า <span>*</span><input name="name" required maxlength="160" value="${escape(draft.name)}" placeholder="${escape(config.example)}"></label>
          <label>รายละเอียด / รุ่น<input name="specification" maxlength="200" value="${escape(draft.specification)}" placeholder="เช่น เกรดวัสดุ รุ่น หรือความหนา"></label>
          <label>ขนาด<input name="size" maxlength="120" value="${escape(draft.size)}" placeholder="เช่น 30 × 40 ซม. / ไซซ์ M / 5 ลิตร"></label>
          <label>หน่วยนับ <span>*</span><input name="unit" required maxlength="40" list="sl-units-${category}" value="${escape(draft.unit)}" placeholder="ชิ้น / ใบ / คู่ / ลิตร"><datalist id="sl-units-${category}"><option value="ชิ้น"><option value="ใบ"><option value="คู่"><option value="กล่อง"><option value="ม้วน"><option value="ขวด"><option value="แกลลอน"><option value="ลิตร"><option value="กิโลกรัม"><option value="รีม"><option value="ตลับ"></datalist></label>
        </div><div class="sl-form-footer"><p>ใช้หน่วยนี้ทั้งตอนรับเข้าและเบิก หากซื้อเป็นแพ็กให้แปลงจำนวนเป็นหน่วยนี้ก่อนบันทึก</p><button type="submit" class="sl-button is-primary">บันทึกรายการสินค้า</button></div></form></section>`;
    }

    function optionsMarkup(selectedId) {
      return `<option value="">เลือกรายการสินค้า</option>${state.items.map((item) => `<option value="${escape(item.id)}" ${String(item.id) === String(selectedId) ? "selected" : ""}>${escape([item.name, item.size, item.specification].filter(Boolean).join(" · "))} (${escape(item.unit)})</option>`).join("")}`;
    }

    function movementFormMarkup(type) {
      if (!canWrite) return `<div class="sl-readonly-note">สิทธิ์ C3 ดูยอดและประวัติได้ การรับเข้าและเบิกใช้สิทธิ์ C4 ขึ้นไป</div>`;
      const receipt = type === "receipt";
      const draft = state.drafts[type];
      const item = itemFor(draft.item_id);
      return `<section class="sl-panel"><div class="sl-panel-head"><div><h3>${receipt ? "บันทึกรับเข้า" : "บันทึกเบิกออก"}</h3><p>${receipt ? "เก็บผู้ส่ง เลขใบส่งของ และราคาต่อหน่วยของแต่ละรายการ" : "เลือกสินค้า ระบุผู้รับ และจำนวนที่เบิก ระบบจะตัดจากยอดคงเหลือ"}</p></div><span class="sl-direction ${receipt ? "is-receipt" : "is-issue"}">${receipt ? "↓ รับเข้า" : "↑ เบิกออก"}</span></div>
        ${!state.items.length ? `<div class="sl-empty-inline">ยังไม่มีรายการสินค้า กรุณาเพิ่มรายการสินค้าก่อนรับเข้า</div>` : ""}
        <form data-sl-movement-form="${type}"><fieldset ${state.needsRefresh || !state.items.length ? "disabled" : ""}><div class="sl-form-grid">
          <label class="is-wide">รายการสินค้า <span>*</span><select name="item_id" required>${optionsMarkup(draft.item_id)}</select></label>
          <label>วันที่${receipt ? "รับเข้า" : "เบิก"} <span>*</span><input type="date" name="occurred_on" required value="${escape(draft.occurred_on || today())}"></label>
          <label>จำนวน <span>*</span><div class="sl-input-unit"><input type="number" name="quantity" required min="0.001" max="1000000000" step="0.001" inputmode="decimal" value="${escape(draft.quantity || "")}" placeholder="0"><span data-sl-unit>${escape(item?.unit || "หน่วย")}</span></div></label>
          ${receipt ? `<label>ราคาต่อหน่วย (บาท) <span>*</span><input type="number" name="unit_price" required min="0" max="1000000000" step="0.0001" inputmode="decimal" value="${escape(draft.unit_price ?? "")}" placeholder="0.00"></label>
          <label>ผู้ส่ง / ผู้จำหน่าย <span>*</span><input name="supplier" required maxlength="160" value="${escape(draft.supplier)}" placeholder="ชื่อบริษัทหรือผู้ส่ง"></label>
          <label>เลขใบส่งของ / เอกสารอ้างอิง<input name="delivery_note" maxlength="120" value="${escape(draft.delivery_note)}" placeholder="เช่น DN-2026-001"></label>` : `<label>ผู้รับ / หน่วยงานที่เบิก <span>*</span><input name="recipient" required maxlength="160" value="${escape(draft.recipient)}" placeholder="ชื่อผู้รับหรือแผนก"></label>`}
          <label class="is-wide">หมายเหตุ<input name="note" maxlength="1000" value="${escape(draft.note)}" placeholder="${receipt ? "รายละเอียดเพิ่มเติมของการรับเข้า" : "วัตถุประสงค์การเบิก / จุดที่นำไปใช้"}"></label>
        </div><div class="sl-transaction-summary"><span data-sl-availability>${item ? `คงเหลือ ${number(item.balance_qty)} ${escape(item.unit)}` : "เลือกรายการสินค้าเพื่อดูยอดคงเหลือ"}</span><strong data-sl-total>${receipt ? `จำนวนรับเข้า ${number(draft.quantity)} ${escape(item?.unit || "หน่วย")}` : `จำนวนเบิก ${number(draft.quantity)} ${escape(item?.unit || "หน่วย")}`}</strong></div>
        <div class="sl-form-footer"><p>${receipt ? "ราคาต่อหน่วยต้องใช้หน่วยเดียวกับจำนวนรับเข้า" : "เบิกได้ไม่เกินคงเหลือ ไม่รวมยอดจากหมวดอื่น"}</p><button type="submit" class="sl-button is-primary">ยืนยัน${receipt ? "รับเข้า" : "เบิกออก"}</button></div></fieldset></form></section>`;
    }

    function filtersMarkup() {
      const history = state.view !== "balance";
      return `<div class="sl-filters"><label class="sl-search">ค้นหา<input data-sl-filter="search" type="search" value="${escape(state.search)}" placeholder="${history ? "สินค้า ผู้ส่ง ผู้รับ เลขใบส่งของ" : "ชื่อสินค้า ขนาด รุ่น"}"></label>${history ? `<label>ตั้งแต่วันที่<input data-sl-filter="startDate" type="date" value="${escape(state.startDate)}"></label><label>ถึงวันที่<input data-sl-filter="endDate" type="date" value="${escape(state.endDate)}"></label>` : ""}<button type="button" data-sl-action="clear-filters" class="sl-button is-quiet">ล้างตัวกรอง</button></div>`;
    }

    function balanceResults() {
      const query = state.search.trim().toLocaleLowerCase("th-TH");
      const items = state.items.filter((item) => [item.name, item.specification, item.size, item.unit].join(" ").toLocaleLowerCase("th-TH").includes(query));
      if (!items.length) return `<div class="sl-empty"><strong>${state.items.length ? "ไม่พบสินค้าที่ตรงกับคำค้น" : "ยังไม่มีรายการสินค้าในหมวดนี้"}</strong><p>${state.items.length ? "ลองเปลี่ยนคำค้นหรือล้างตัวกรอง" : canWrite ? "เพิ่มรายการสินค้า แล้วบันทึกรับเข้าเพื่อเริ่มติดตามยอดคงเหลือ" : "เมื่อเจ้าหน้าที่เพิ่มสินค้าและรับเข้า ข้อมูลจะแสดงที่นี่"}</p></div>`;
      return `<p class="sl-result-count">${number(items.length)} รายการ · ยอดคงเหลือปัจจุบัน ไม่เปลี่ยนตามวันที่ในประวัติ</p><div class="sl-table-scroll" tabindex="0" role="region" aria-label="ตารางยอดคงเหลือ"><table class="sl-table"><thead><tr><th>สินค้า / รายละเอียด</th><th>ขนาด</th><th class="is-number">คงเหลือ</th><th>หน่วย</th>${canWrite ? "<th>ทำรายการ</th>" : ""}</tr></thead><tbody>${items.map((item) => `<tr><td><strong>${escape(item.name)}</strong><small>${escape(item.specification || "—")}</small></td><td>${escape(item.size || "—")}</td><td class="is-number"><span class="sl-balance ${Number(item.balance_qty) <= 0 ? "is-zero" : ""}">${number(item.balance_qty)}</span></td><td>${escape(item.unit)}</td>${canWrite ? `<td><div class="sl-row-actions"><button class="sl-button is-small" type="button" data-sl-action="quick-receipt" data-sl-item="${escape(item.id)}">รับเข้า</button><button class="sl-button is-small" type="button" data-sl-action="quick-issue" data-sl-item="${escape(item.id)}" ${Number(item.balance_qty) <= 0 || state.needsRefresh ? "disabled" : ""}>เบิก</button></div></td>` : ""}</tr>`).join("")}</tbody></table></div>`;
    }

    function historyResults() {
      if (state.startDate && state.endDate && state.startDate > state.endDate) return `<div class="sl-notice is-error" role="alert">วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด</div>`;
      const query = state.search.trim().toLocaleLowerCase("th-TH");
      const rows = state.movements.filter((row) => {
        if (state.view !== "history" && row.type !== state.view) return false;
        const date = normalizeDate(row.occurred_on);
        if ((state.startDate && date < state.startDate) || (state.endDate && date > state.endDate)) return false;
        const item = itemFor(row.item_id);
        return [row.item_name || item?.name, row.specification || item?.specification, row.size || item?.size, row.supplier, row.recipient, row.delivery_note, row.note, row.created_by].join(" ").toLocaleLowerCase("th-TH").includes(query);
      }).sort((a, b) => String(b.occurred_on).localeCompare(String(a.occurred_on)) || String(b.created_at || "").localeCompare(String(a.created_at || "")));
      if (!rows.length) return `<div class="sl-empty"><strong>ยังไม่มีรายการ${state.view === "receipt" ? "รับเข้า" : state.view === "issue" ? "เบิกออก" : "เคลื่อนไหว"}ที่ตรงกับตัวกรอง</strong><p>ประวัติจะแสดงหลังบันทึกสำเร็จ สามารถค้นหาสินค้าและเลือกช่วงวันที่ได้</p></div>`;
      const receiptTotal = rows.filter((row) => row.type === "receipt").reduce((sum, row) => sum + (Number(row.total_amount) || 0), 0);
      const issueTotal = rows.filter((row) => row.type === "issue").reduce((sum, row) => sum + (Number(row.total_amount) || 0), 0);
      return `<div class="sl-history-summary"><span>${number(rows.length)} รายการตามตัวกรอง</span><span>รับเข้า ${rows.filter(row=>row.type === "receipt").length} รายการ</span><span>เบิกออก ${rows.filter(row=>row.type === "issue").length} รายการ</span></div><div class="sl-table-scroll" tabindex="0" role="region" aria-label="ตารางประวัติ Stock"><table class="sl-table"><thead><tr><th>วันที่ / ประเภท</th><th>สินค้า / ขนาด</th><th class="is-number">จำนวน</th><th>ผู้ส่ง / ผู้รับ</th><th>ใบส่งของ / หมายเหตุ</th><th>ผู้บันทึก</th></tr></thead><tbody>${rows.map((row) => {
        const item = itemFor(row.item_id);
        const receipt = row.type === "receipt";
        return `<tr><td><span>${escape(dateLabel(row.occurred_on))}</span><small><span class="sl-direction ${receipt ? "is-receipt" : "is-issue"}">${receipt ? "↓ รับเข้า" : "↑ เบิกออก"}</span></small></td><td><strong>${escape(row.item_name || item?.name || "ไม่พบสินค้า")}</strong><small>${escape([row.specification || item?.specification, row.size || item?.size].filter(Boolean).join(" · ") || "—")}</small></td><td class="is-number">${receipt ? "+" : "−"}${number(row.quantity)} <small>${escape(row.unit || item?.unit || "")}</small></td><td>${escape(receipt ? row.supplier || "—" : row.recipient || "—")}<small>${receipt ? "ผู้ส่ง / ผู้จำหน่าย" : "ผู้รับ / หน่วยงาน"}</small></td><td>${escape(row.delivery_note || "—")}<small>${escape(row.note || "")}</small></td><td>${escape(row.created_by_name || row.created_by || "—")}</td></tr>`;
      }).join("")}</tbody></table></div>`;
    }

    function updateResults() {
      const target = root.querySelector("[data-sl-results]");
      if (target) target.innerHTML = state.view === "balance" ? balanceResults() : historyResults();
    }

    function paint() {
      if (destroyed) return;
      const hasData = state.loaded;
      root.innerHTML = `<section class="stock-ledger sl-${category}" data-sl-category="${category}" aria-label="${escape(config.title)}">
        <header class="sl-header"><div class="sl-heading"><span class="sl-icon" aria-hidden="true">${config.icon}</span><div><p class="sl-eyebrow">PF STOCK / ${category.toUpperCase()}</p><h2>${config.title}</h2><p>${config.description}</p></div></div><div class="sl-header-actions"><span class="sl-access">${canWrite ? "รับเข้า · เบิกออก" : "ดูข้อมูล · C3"}</span><button type="button" data-sl-action="refresh" class="sl-button" ${state.loading || state.busy ? "disabled" : ""}>${state.loading ? "กำลังโหลด…" : "↻ โหลดข้อมูลใหม่"}</button></div></header>
        <div data-sl-status aria-live="polite">${statusMarkup()}</div>
        ${state.loadError ? `<div class="sl-notice is-error" role="alert"><strong>${hasData ? "อัปเดตข้อมูลไม่สำเร็จ" : "โหลดข้อมูล Stock ไม่สำเร็จ"}</strong><p>${escape(state.loadError)}</p><button type="button" data-sl-action="refresh" class="sl-button" ${state.loading ? "disabled" : ""}>ลองโหลดอีกครั้ง</button></div>` : ""}
        ${state.loading && !hasData ? `<div class="sl-loading" role="status">กำลังโหลดข้อมูล${config.title}…</div>` : hasData ? `${metricsMarkup()}
        <div class="sl-toolbar"><div class="sl-tabs" role="tablist" aria-label="หน้าข้อมูล Stock">${[["balance", "ยอดคงเหลือ"], ["receipt", "รับเข้า"], ["issue", "เบิกของ"], ["history", "ประวัติทั้งหมด"]].map(([view, label]) => `<button type="button" role="tab" data-sl-view="${view}" aria-selected="${state.view === view}" class="${state.view === view ? "is-active" : ""}" ${state.busy ? "disabled" : ""}>${label}</button>`).join("")}</div>${canWrite ? `<button type="button" data-sl-action="add-item" class="sl-button is-primary" ${state.busy || state.needsRefresh ? "disabled" : ""}>+ เพิ่มรายการสินค้า</button>` : ""}</div>
        ${itemFormMarkup()}${state.view === "receipt" || state.view === "issue" ? movementFormMarkup(state.view) : ""}
        <section class="sl-panel sl-records"><div class="sl-panel-head"><div><h3>${state.view === "balance" ? "สินค้าคงเหลือ" : state.view === "receipt" ? "ประวัติรับเข้า" : state.view === "issue" ? "ประวัติเบิกของ" : "ประวัติรับเข้าและเบิกออก"}</h3><p>${state.view === "balance" ? "แยกตามสินค้า ขนาด และหน่วยนับ" : "แสดงรายการที่บันทึกในหมวดนี้เท่านั้น"}</p></div></div>${filtersMarkup()}<div data-sl-results>${state.view === "balance" ? balanceResults() : historyResults()}</div></section>
        <p class="sl-footnote">ข้อมูลหมวดนี้แยกจาก Stock ผลไม้และห้องเย็น · ข้อมูลจำนวนสำหรับเจ้าหน้าที่ · ข้อมูลการเงินแสดงใน PF Accounting</p>` : ""}
      </section>`;
      setBusy(state.busy);
    }

    function setBusy(busy) {
      state.busy = busy;
      root.querySelectorAll("[data-sl-item-form] button, [data-sl-movement-form] button, [data-sl-action], [data-sl-view]").forEach((button) => {
        if (busy) {
          button.dataset.slWasDisabled = button.disabled ? "1" : "0";
          button.disabled = true;
        } else if (button.dataset.slWasDisabled !== undefined) {
          button.disabled = button.dataset.slWasDisabled === "1";
          delete button.dataset.slWasDisabled;
        }
      });
      root.querySelectorAll("[data-sl-item-form], [data-sl-movement-form]").forEach((form) => {
        form.setAttribute("aria-busy", String(busy));
        form.inert = busy || state.loading;
      });
    }

    async function load({ saved = false } = {}) {
      if (destroyed || state.loading && state.loaded) return;
      const version = ++loadVersion;
      if (!saved) rememberForms();
      state.loading = true;
      state.loadError = "";
      paint();
      try {
        const response = unwrap(ensureSuccess(await options.request(`/api/stock/bootstrap?category=${encodeURIComponent(category)}`)));
        if (destroyed || version !== loadVersion) return;
        if (!Array.isArray(response?.items) || !Array.isArray(response?.movements)) throw new Error("รูปแบบข้อมูล Stock ไม่ถูกต้อง กรุณาลองโหลดใหม่");
        const wasWaitingForRefresh = state.needsRefresh;
        state.items = response.items;
        state.movements = response.movements;
        state.loaded = true;
        state.needsRefresh = false;
        if (wasWaitingForRefresh) {
          state.message = "อัปเดตยอดล่าสุดสำเร็จ สามารถทำรายการต่อได้";
          state.messageType = "success";
        }
      } catch (error) {
        if (destroyed || version !== loadVersion) return;
        state.loadError = error?.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้";
        if (saved) {
          state.needsRefresh = true;
          state.message = "บันทึกรายการสำเร็จแล้ว แต่ยังอัปเดตยอดไม่ได้ กรุณาโหลดข้อมูลใหม่ก่อนทำรายการต่อ";
          state.messageType = "warning";
        }
      } finally {
        if (!destroyed && version === loadVersion) {
          state.loading = false;
          paint();
        }
      }
    }

    function updateFormSummary(form) {
      const draft = Object.fromEntries(new FormData(form));
      const item = itemFor(draft.item_id);
      const type = form.dataset.slMovementForm;
      state.drafts[type] = draft;
      const unit = form.querySelector("[data-sl-unit]");
      const availability = form.querySelector("[data-sl-availability]");
      const total = form.querySelector("[data-sl-total]");
      if (unit) unit.textContent = item?.unit || "หน่วย";
      if (availability) availability.textContent = item ? `คงเหลือ ${number(item.balance_qty)} ${item.unit}` : "เลือกรายการสินค้าเพื่อดูยอดคงเหลือ";
      if (total) total.textContent = type === "receipt" ? `จำนวนรับเข้า ${number(draft.quantity)} ${escape(item?.unit || "หน่วย")}` : `จำนวนเบิก ${number(draft.quantity)} ${item?.unit || "หน่วย"}`;
      const quantity = form.elements.quantity;
      quantity.setCustomValidity(type === "issue" && item && Number(draft.quantity) > Number(item.balance_qty) ? "จำนวนเบิกมากกว่ายอดคงเหลือ" : "");
    }

    async function submitItem(form) {
      if (!canWrite || state.busy || state.loading || state.needsRefresh) return;
      rememberForms();
      const payload = { category, ...Object.fromEntries(Object.entries(state.itemDraft).map(([key, value]) => [key, String(value || "").trim()])) };
      if (!payload.name || !payload.unit) return showMessage("กรุณาระบุชื่อสินค้าและหน่วยนับ", "error");
      setBusy(true);
      showMessage("กำลังบันทึกรายการสินค้า…", "info");
      try {
        const response = unwrap(ensureSuccess(await options.request("/api/stock/items", { method: "POST", body: payload })));
        if (destroyed) return;
        state.itemDraft = { name: "", specification: "", size: "", unit: "ชิ้น" };
        state.addItemOpen = false;
        state.view = "receipt";
        const id = response?.item?.id || response?.id;
        if (id) state.drafts.receipt.item_id = String(id);
        state.message = "เพิ่มรายการสินค้าแล้ว สามารถบันทึกรับเข้าได้เลย";
        state.messageType = "success";
        state.busy = false;
        // Clear old form before refreshing so rememberForms() cannot restore a saved draft.
        paint();
        await load({ saved: true });
      } catch (error) {
        if (destroyed) return;
        setBusy(false);
        showMessage(error?.message || "บันทึกสินค้าไม่สำเร็จ กรุณาลองใหม่", "error");
      }
    }

    async function submitMovement(form) {
      if (!canWrite || state.busy || state.loading || state.needsRefresh) return;
      updateFormSummary(form);
      if (!form.reportValidity()) return;
      const type = form.dataset.slMovementForm;
      const draft = state.drafts[type];
      const item = itemFor(draft.item_id);
      const quantity = Number(draft.quantity);
      if (!item || !Number.isFinite(quantity) || quantity <= 0) return showMessage("กรุณาเลือกสินค้าและระบุจำนวนมากกว่า 0", "error");
      if (type === "issue" && quantity > Number(item.balance_qty)) return showMessage("จำนวนเบิกมากกว่ายอดคงเหลือ กรุณาตรวจสอบจำนวน", "error");
      const payload = { category, item_id: item.id, type, quantity, occurred_on: draft.occurred_on, note: String(draft.note || "").trim() };
      if (type === "receipt") {
        payload.unit_price = Number(draft.unit_price);
        payload.supplier = String(draft.supplier || "").trim();
        payload.delivery_note = String(draft.delivery_note || "").trim();
        if (!Number.isFinite(payload.unit_price) || payload.unit_price < 0 || !payload.supplier) return showMessage("กรุณาตรวจสอบราคาและชื่อผู้ส่ง", "error");
      } else {
        payload.recipient = String(draft.recipient || "").trim();
        if (!payload.recipient) return showMessage("กรุณาระบุผู้รับหรือหน่วยงานที่เบิก", "error");
      }
      const fingerprint = JSON.stringify(payload);
      const pending = state.pendingKeys[type];
      payload.client_uid = pending?.fingerprint === fingerprint ? pending.uid : uuid();
      state.pendingKeys[type] = { fingerprint, uid: payload.client_uid };
      setBusy(true);
      showMessage(`กำลังบันทึก${type === "receipt" ? "รับเข้า" : "เบิกออก"}…`, "info");
      try {
        ensureSuccess(await options.request("/api/stock/movements", { method: "POST", body: payload }));
        if (destroyed) return;
        state.drafts[type] = { occurred_on: today(), item_id: String(item.id) };
        delete state.pendingKeys[type];
        state.message = `บันทึก${type === "receipt" ? "รับเข้า" : "เบิกออก"} ${item.name} ${number(quantity)} ${item.unit} สำเร็จ`;
        state.messageType = "success";
        state.busy = false;
        paint();
        await load({ saved: true });
      } catch (error) {
        if (destroyed) return;
        setBusy(false);
        showMessage(error?.message || "บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง", "error");
      }
    }

    function handleClick(event) {
      const button = event.target.closest("[data-sl-action], [data-sl-view]");
      if (!button || !root.contains(button) || button.disabled || state.busy) return;
      if (button.dataset.slView) {
        rememberForms();
        state.view = button.dataset.slView;
        paint();
        return;
      }
      const action = button.dataset.slAction;
      if (action === "refresh") { void load(); return; }
      if (action === "clear-filters") {
        state.search = ""; state.startDate = ""; state.endDate = "";
        root.querySelectorAll("[data-sl-filter]").forEach((input) => { input.value = ""; });
        updateResults(); return;
      }
      if (!canWrite) return;
      rememberForms();
      if (action === "add-item") state.addItemOpen = true;
      if (action === "close-item") state.addItemOpen = false;
      if (action === "quick-receipt" || action === "quick-issue") {
        state.view = action === "quick-receipt" ? "receipt" : "issue";
        state.drafts[state.view].item_id = button.dataset.slItem;
      }
      paint();
      if (action === "add-item") root.querySelector('[data-sl-item-form] [name="name"]')?.focus();
    }

    function handleInput(event) {
      const input = event.target;
      if (input.dataset.slFilter) {
        state[input.dataset.slFilter] = input.value;
        updateResults();
      }
      const form = input.closest("[data-sl-movement-form]");
      if (form) updateFormSummary(form);
    }

    function handleSubmit(event) {
      if (event.target.matches("[data-sl-item-form]")) { event.preventDefault(); void submitItem(event.target); }
      if (event.target.matches("[data-sl-movement-form]")) { event.preventDefault(); void submitMovement(event.target); }
    }

    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleInput);
    root.addEventListener("submit", handleSubmit);
    const controller = {
      refresh: () => state.busy ? Promise.resolve() : load(),
      destroy: () => {
        destroyed = true; ++loadVersion;
        root.removeEventListener("click", handleClick); root.removeEventListener("input", handleInput);
        root.removeEventListener("change", handleInput); root.removeEventListener("submit", handleSubmit);
        if (root.__stockLedgerController === controller) delete root.__stockLedgerController;
      }
    };
    root.__stockLedgerController = controller;
    void load();
    return controller;
  }

  window.StockLedger = Object.freeze({ mount });
})();
