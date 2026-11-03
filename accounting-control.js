(function () {
  "use strict";

  const LOCAL_KEY = "apws_contest_pf_payment_allocations_v1";
  let deductionsExpanded = false;
  let stockExpanded = false;
  let financeExpanded = false;
  const canAccessStockSummary = user => ["C6", "C7"].includes(user?.level);
  const stockViews = ["stock-overview", "stock-cold", "stock-packaging", "stock-prices"];
  function stockSidebar(view) {
    return `<button type="button" data-pf-toggle-stock aria-expanded="${stockExpanded}" aria-controls="pf-stock-submenu" class="acr-parent"><span>▣</span><span>สรุปสต็อก</span><span class="acr-chevron">${stockExpanded ? "▾" : "▸"}</span></button><div id="pf-stock-submenu" class="acr-submenu" ${stockExpanded ? "" : "hidden"}>${[["stock-overview", "ภาพรวมมูลค่า"], ["stock-cold", "ห้องเย็น"], ["stock-packaging", "บรรจุภัณฑ์"], ["stock-prices", "ตั้งราคาขาย"]].map(([id, label]) => `<button type="button" data-view="${id}" class="${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""}>${label}</button>`).join("")}</div>`;
  }
  function sidebar({ view = "", deductionTab = "", accounting = true, deductions = true, user = null } = {}) {
    const links = [["allocation", "▦", "จัดสรรเงินจ่าย"], ["export", "⇩", "Export / พิมพ์"], ["percentage", "%", "ปรับเปอร์เซ็นต์"], ["graph", "▥", "กราฟเปรียบเทียบ"], ["cost", "⌁", "วิเคราะห์ต้นทุน"], ["billing", "+", "เปิดบิล"], ["document-editor", "▤", "ปรับแต่งเอกสาร"]];
    return `<aside class="acr-rail acr-stable-rail"><div class="acr-rail-brand">บัญชีและค่าแรง<small>จัดการเงินและรอบจ่าย</small></div><nav aria-label="เมนู บัญชีและค่าแรง">${deductions ? `<button type="button" data-pf-toggle-deductions aria-expanded="${deductionsExpanded}" aria-controls="pf-deduction-submenu" class="acr-parent ${deductionTab ? "is-current" : ""}"><span aria-hidden="true">−</span><span>บันทึกหักเงิน/เบี้ยขยัน</span><span class="acr-chevron" aria-hidden="true">${deductionsExpanded ? "▾" : "▸"}</span></button><div id="pf-deduction-submenu" class="acr-submenu" ${deductionsExpanded ? "" : "hidden"}>${[["production", "หักเงิน"], ["bonus", "ลงเบี้ยขยัน"], ["daily-ot", "ปรับ OT รายวัน"], ["approval", "อนุมัติหักเงิน"]].map(([tab, label]) => `<button type="button" data-deduction-tab="${tab}" class="${deductionTab === tab || tab === "production" && deductionTab === "time" ? "active" : ""}" ${deductionTab === tab || tab === "production" && deductionTab === "time" ? 'aria-current="page"' : ""}>${label}</button>`).join("")}</div>` : ""}${accounting ? `<button type="button" data-pf-toggle-finance aria-expanded="${financeExpanded}" aria-controls="pf-finance-submenu" class="acr-parent"><span aria-hidden="true">฿</span><span>การเงิน</span><span class="acr-chevron" aria-hidden="true">${financeExpanded ? "▾" : "▸"}</span></button><div id="pf-finance-submenu" class="acr-submenu" ${financeExpanded ? "" : "hidden"}>${links.map(([id, icon, label]) => `<button type="button" data-view="${id}" class="${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span><span>${label}</span></button>`).join("")}</div>` : ""}${accounting && canAccessStockSummary(user) ? stockSidebar(view) : ""}</nav><button class="acr-exit" type="button" data-ac-exit>↩<span>กลับระบบหลัก</span></button></aside>`;
  }
  function bindSidebar(root) {
    root.querySelector("[data-pf-toggle-finance]")?.addEventListener("click", (event) => {
      financeExpanded = !financeExpanded;
      event.currentTarget.setAttribute("aria-expanded", String(financeExpanded));
      const submenu = root.querySelector("#pf-finance-submenu");
      if (submenu) submenu.hidden = !financeExpanded;
      const arrow = event.currentTarget.querySelector(".acr-chevron");
      if (arrow) arrow.textContent = financeExpanded ? "▾" : "▸";
    });
    root.querySelector("[data-pf-toggle-stock]")?.addEventListener("click", (event) => {
      stockExpanded = !stockExpanded;
      event.currentTarget.setAttribute("aria-expanded", String(stockExpanded));
      const submenu = root.querySelector("#pf-stock-submenu");
      if (submenu) submenu.hidden = !stockExpanded;
      const arrow = event.currentTarget.querySelector(".acr-chevron");
      if (arrow) arrow.textContent = stockExpanded ? "▾" : "▸";
    });
    root.querySelector("[data-pf-toggle-deductions]")?.addEventListener("click", (event) => {
      deductionsExpanded = !deductionsExpanded;
      event.currentTarget.setAttribute("aria-expanded", String(deductionsExpanded));
      const submenu = root.querySelector("#pf-deduction-submenu");
      if (submenu) submenu.hidden = !deductionsExpanded;
      const arrow = event.currentTarget.querySelector(".acr-chevron");
      if (arrow) arrow.textContent = deductionsExpanded ? "▾" : "▸";
    });
  }
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

  function createBillingPrototype() {
    if (window.PfColdSales) {
      const live = window.PfColdSales.create();
      const preview = window.PfBillingPrototype?.create();
      return {attach(el) {
        el.innerHTML = '<div class="acr-page"><div data-live-bills></div><details class="pfb-no-print"><summary>ระบบตัวอย่างเดิม: ใบเสร็จ / ลูกค้า / บริษัท / ภาษี (ไม่เชื่อมบิลจริง)</summary><div data-preview-bills></div></details></div>';
        live.attach(el.querySelector('[data-live-bills]'));
        preview?.attach(el.querySelector('[data-preview-bills]'));
      }};
    }
    if (window.PfBillingPrototype) return window.PfBillingPrototype.create();
    const products = [{name:'มะม่วงแช่แข็ง',lot:'DEMO-01',boxes:80,price:900},{name:'ทุเรียนแช่แข็ง',lot:'DEMO-02',boxes:40,price:2400},{name:'สับปะรดแช่แข็ง',lot:'DEMO-03',boxes:60,price:700}];
    const draft = {customer:'',product:'0',boxes:'1',price:'900'};
    const bills = [];
    const customers = [];
    let selectedCustomer = '', customerSearch = '', customerEditing = '';
    let customerDraft = {name:'',address:'',taxId:'',phone:'',email:'',branch:''};
    const customerFields = [['name','ชื่อลูกค้า / บริษัท'],['address','ที่อยู่สำหรับออกบิล'],['taxId','เลขประจำตัวผู้เสียภาษี'],['branch','สาขา'],['phone','เบอร์ติดต่อ'],['email','อีเมล']];
    function customerMarkup() {
      const matches = customers.filter(c=>[c.name,c.taxId,c.phone,c.id].join(' ').toLocaleLowerCase().includes(customerSearch.toLocaleLowerCase()));
      const selected = customers.find(c=>c.id===selectedCustomer);
      const history = bills.filter(b=>b.customerId===selectedCustomer);
      return `<section class="pfs-panel pfb-form"><h2>${customerEditing?'แก้ไขข้อมูลลูกค้า':'เพิ่มข้อมูลลูกค้า'}</h2><p>ข้อมูลตัวอย่างเท่านั้น ไม่เก็บถาวร · ใช้รหัสลูกค้าแยกประวัติแม้ชื่อซ้ำกัน</p><form data-customer-form><div class="pfb-fields">${customerFields.map(([key,label])=>`<label>${label}${key==='name'?' *':''}<input data-customer-field="${key}" name="${key}" ${key==='name'?'required':''} ${key==='taxId'?'inputmode="numeric" pattern="[0-9]{13}" title="กรอกตัวเลข 13 หลัก หรือเว้นว่าง" maxlength="13"':key==='email'?'type="email" maxlength="160"':'maxlength="300"'} value="${escapeHtml(customerDraft[key])}"></label>`).join('')}</div><button type="submit" class="pfs-button pfs-primary">${customerEditing?'บันทึกการแก้ไขตัวอย่าง':'เพิ่มลูกค้าตัวอย่าง'}</button>${customerEditing?'<button type="button" class="pfs-button" data-customer-new>ยกเลิกแก้ไข</button>':''}</form></section><section class="pfs-panel"><h2>ค้นหาลูกค้าและประวัติการซื้อ</h2><form data-customer-search class="pfs-toolbar"><label>ชื่อ / รหัสลูกค้า / เลขผู้เสียภาษี / เบอร์โทร<input name="query" value="${escapeHtml(customerSearch)}" placeholder="ค้นหาลูกค้า"></label><button class="pfs-button" type="submit">ค้นหา</button></form>${matches.map(c=>`<article class="pfb-order"><div><strong>${escapeHtml(c.name)}</strong><p>${c.id} · ${escapeHtml(c.taxId||'ไม่ระบุเลขผู้เสียภาษี')} · ${escapeHtml(c.phone||'ไม่ระบุเบอร์โทร')}</p><small>เปิดบิล ${bills.filter(b=>b.customerId===c.id).length} ครั้ง (จำลอง)</small></div><button type="button" class="pfs-button" data-customer-select="${c.id}">ดูข้อมูลและประวัติ</button></article>`).join('')||'<p class="pfs-empty">ไม่พบลูกค้า ลองเพิ่มข้อมูลหรือเปลี่ยนคำค้น</p>'}</section>${selected?`<section class="pfs-panel"><header class="pfs-panel-head"><div><h2>${escapeHtml(selected.name)}</h2><p>${selected.id}</p></div><div class="pfs-switch"><button type="button" class="pfs-button" data-customer-edit="${selected.id}">แก้ไขข้อมูล</button><button type="button" class="pfs-button pfs-primary" data-customer-bill="${selected.id}">เปิดบิลให้ลูกค้านี้</button></div></header>${customerFields.slice(1).map(([key,label])=>`<p>${label}: ${escapeHtml(selected[key]||'—')}</p>`).join('')}<div class="pfs-notice">เปิดบิล ${history.length} ครั้ง · รวม ${money(history.reduce((n,b)=>n+b.total,0))} · ตัดของแล้ว ${history.filter(b=>b.done).length} ครั้ง (ทั้งหมดเป็นตัวอย่าง)</div><h3>ประวัติการซื้อ</h3>${history.map(b=>`<article class="pfb-order"><div><strong>${b.id} · ${escapeHtml(b.date)}</strong><p>${products[b.product].name} · ${b.boxes} กล่อง · ${b.boxes*20} กก. · ${money(b.total)}</p><p>ชื่อบนบิล: ${escapeHtml(b.customer)}</p><span>${b.done?'ตัดของแล้ว (จำลอง)':'รอตัดของ (จำลอง)'}</span></div></article>`).join('')||'<p>ยังไม่มีประวัติการซื้อ</p>'}</section>`:''}`;
    }

    let root, tab = 'form', notice = '';
    const amount = () => Number(draft.boxes) * Number(draft.price);
    const available = index => products[index].boxes - bills.filter(b=>b.product===Number(index)).reduce((n,b)=>n+b.boxes,0);
    function paint() {
      root.innerHTML = `<section class="acr-page pfs-page"><header class="acr-page-head"><div><p>PF ACCOUNTING / การเงิน</p><h1>เปิดบิล</h1><span>ขายสินค้าจาก Stock ห้องเย็น</span></div></header><div class="pfs-notice">โหมดตัวอย่าง · ข้อมูลสมมติทั้งหมด ไม่บันทึกขาย ไม่แจ้งเตือนจริง และไม่ตัดสต็อก · ออกจาก บัญชีและค่าแรง หรือรีเฟรชแล้วเริ่มใหม่</div><div class="pfs-switch"><button type="button" data-bill-tab="form" aria-pressed="${tab==='form'}">เปิดบิลขาย</button><button type="button" data-bill-tab="customers" aria-pressed="${tab==='customers'}">ลูกค้า / ประวัติการซื้อ</button><button type="button" data-bill-tab="queue" aria-pressed="${tab==='queue'}">คิวห้องเย็นจำลอง (${bills.filter(b=>!b.done).length})</button></div>${notice?`<p class="pfs-notice" role="status">${escapeHtml(notice)}</p>`:''}${tab==='customers'?customerMarkup():tab==='form'?`<form data-bill-form class="pfs-panel pfb-form"><h2>รายละเอียดการขาย</h2><p>เลือกสินค้า → ระบุจำนวนและราคา → ส่งให้หัวหน้า Stock ตรวจและตัดของ</p><label>ลูกค้า<select name="customer" required><option value="">เลือกลูกค้า</option>${customers.map(c=>`<option value="${c.id}" ${draft.customer===c.id?'selected':''}>${escapeHtml(c.name)} · ${c.id}</option>`).join('')}</select></label><button type="button" class="pfs-button" data-bill-tab="customers">เพิ่มลูกค้า / ดูประวัติ</button><label>สินค้า / ล็อตตัวอย่าง<select name="product">${products.map((p,i)=>`<option value="${i}" ${draft.product===String(i)?'selected':''}>${p.name} · ${p.lot}</option>`).join('')}</select></label><p>พร้อมขายจำลอง <b data-bill-available>${available(draft.product)}</b> กล่อง · 20 กก./กล่อง · เฉพาะสินค้าของบริษัท</p><div class="pfb-fields"><label>จำนวนกล่อง<input name="boxes" type="number" min="1" max="${available(draft.product)}" step="1" required value="${escapeHtml(draft.boxes)}"></label><label>ราคาขายต่อกล่อง (บาท)<input name="price" type="number" min="0" max="1000000" step="0.01" required value="${escapeHtml(draft.price)}"></label></div><div class="pfs-notice">น้ำหนัก <b data-bill-weight>${Number(draft.boxes)*20}</b> กก. · รวม <b data-bill-total>${money(amount())}</b></div><button class="pfs-button pfs-primary" type="submit">ทดลองเปิดบิลและส่งคิวห้องเย็น</button><p>เมื่อส่งแล้ว สินค้าจะถูกกันไว้ในตัวอย่าง จนหัวหน้า Stock ยืนยันตัดของ</p></form>`:`<section class="pfs-panel"><h2>Stock ห้องเย็น — คิวขายจำลอง</h2><p>ตัวอย่างการแจ้งเตือนที่หัวหน้า Stock จะเห็น หลังฝ่ายการเงินเปิดบิล</p>${bills.length?bills.map((b,i)=>`<article class="pfb-order"><div><strong>${b.id} · ${escapeHtml(b.customer)}</strong><p>${products[b.product].name} · ${products[b.product].lot}</p><p>${b.boxes} กล่อง · ${b.boxes*20} กก. · ${money(b.total)}</p><span>${b.done?'ตัดของแล้ว (จำลอง)':'รอหัวหน้า Stock ตัดของ'}</span></div>${b.done?'':`<button type="button" class="pfs-button" data-bill-confirm="${i}">ทดลองยืนยันตัดของ</button>`}</article>`).join(''):'<p class="pfs-empty">ยังไม่มีบิลตัวอย่าง ลองเปิดบิลขายก่อน</p>'}</section>`}</section>`;
    }
    function attach(target) {
      root=target;paint();
      root.onclick=e=>{const button=e.target.closest('button');if(!button)return;if(button.hasAttribute('data-customer-new')){customerEditing='';customerDraft={name:'',address:'',taxId:'',phone:'',email:'',branch:''};paint();return}if(button.dataset.customerSelect){selectedCustomer=button.dataset.customerSelect;paint();return}if(button.dataset.customerEdit){const c=customers.find(c=>c.id===button.dataset.customerEdit);customerEditing=c.id;customerDraft={...c};paint();return}if(button.dataset.customerBill){draft.customer=button.dataset.customerBill;tab='form';paint();return}if(button.dataset.billTab){tab=button.dataset.billTab;notice='';paint()}if(button.hasAttribute('data-bill-confirm')){const bill=bills[Number(button.dataset.billConfirm)];if(bill&&!bill.done){bill.done=true;notice=`${bill.id} ยืนยันตัดของแล้วในตัวอย่างเท่านั้น`;paint()}}};
      root.oninput=e=>{if(e.target.dataset.customerField){customerDraft[e.target.dataset.customerField]=e.target.value;return}if(!(e.target.name in draft)||!e.target.closest('[data-bill-form]'))return;draft[e.target.name]=e.target.value;if(e.target.name==='product'){draft.price=String(products[Number(draft.product)].price);paint();return}root.querySelector('[data-bill-total]').textContent=money(amount());root.querySelector('[data-bill-weight]').textContent=Number(draft.boxes)*20;};
      root.onsubmit=e=>{if(e.target.matches('[data-customer-search]')){e.preventDefault();customerSearch=e.target.elements.query.value.trim();paint();return}if(e.target.matches('[data-customer-form]')){e.preventDefault();if(!e.target.checkValidity()||!customerDraft.name.trim())return;const fields=Object.fromEntries(customerFields.map(([key])=>[key,customerDraft[key].trim()]));const existing=customers.find(c=>c.id===customerEditing);if(existing)Object.assign(existing,fields);else customers.push({id:`CUS-${String(customers.length+1).padStart(4,'0')}`,...fields});selectedCustomer=existing?.id||customers[customers.length-1].id;draft.customer=selectedCustomer;customerEditing='';customerDraft={name:'',address:'',taxId:'',phone:'',email:'',branch:''};customerSearch='';notice='บันทึกข้อมูลลูกค้าในตัวอย่างแล้ว (ยังไม่เก็บถาวร)';paint();return}if(!e.target.matches('[data-bill-form]'))return;e.preventDefault();const boxes=Number(draft.boxes),price=Number(draft.price);if(!customers.some(c=>c.id===draft.customer)||!Number.isInteger(boxes)||boxes<1||boxes>available(draft.product)||!Number.isFinite(price)||price<0||price>1000000||!e.target.checkValidity())return;bills.unshift({id:`DEMO-${String(bills.length+1).padStart(4,'0')}`,customerId:draft.customer,customer:customers.find(c=>c.id===draft.customer).name,customerSnapshot:{...customers.find(c=>c.id===draft.customer)},date:new Date().toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}),product:Number(draft.product),boxes,total:Math.round(boxes*price*100)/100,done:false});draft.boxes='1';tab='queue';notice='ส่งบิลเข้าคิวห้องเย็นจำลองแล้ว ยังไม่มีการขายหรือตัดสต็อกจริง';paint()};
    }
    return {attach};
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
    localStorage.removeItem("apws_contest_accounting_password_hash_v1");
    sessionStorage.removeItem("apws_contest_accounting_access_v1");
    if (levelNumber(user) < 4 && user?.role !== "developer" && !user?.is_system) return options.onExit?.();

    const stockAllowed = canAccessStockSummary(user);
    const week = currentWeek();
    const state = { view: ["allocation", "export", "percentage", "graph", "cost", "billing", "document-editor", ...stockViews].includes(options.initialView) ? options.initialView : "allocation", kind: "production", exportScope: "all", startDate: week.startDate, endDate: week.endDate, group: "all", rows: [], allocations: {}, adjustments: {}, expanded: new Set(), loading: true, message: "", messageType: "success", percentBasis: "money", percentKind: "production", percentGroup: "all", percentMode: "add", percentValue: 0, graphPreset: "week", graphStartDate: week.startDate, graphEndDate: week.endDate, graphData: null, graphLoading: false, graphDrill: "", costPreset: "week", costStartDate: week.startDate, costEndDate: week.endDate, costData: null, costLoading: false };
    if (!stockAllowed && stockViews.includes(state.view)) state.view = "allocation";
    const methodOf = (row) => state.allocations[row.employee_key] === "transfer" ? "transfer" : "cash";
    const adjustmentOf = (row) => Number(state.adjustments[row.employee_key] || 0);
    const adjustedNet = (row) => Math.max(0, Math.round((Number(row.net_amount || 0) + adjustmentOf(row)) * 100) / 100);
    const methodRows = (method) => state.rows.filter((row) => method === "all" || methodOf(row) === method);
    const sum = (rows) => rows.reduce((total, row) => total + adjustedNet(row), 0);
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

    let loadVersion = 0;
    async function load() {
      const version = ++loadVersion;
      state.loading = true;
      state.message = "";
      paint();
      try {
        const rows = await Promise.resolve(options.getWeeklyRows?.(state.startDate, state.endDate) || []);
        if (version !== loadVersion) return;
        let saved = readLocalWeek(state.startDate, state.endDate);
        try {
          const cloud = await options.loadAllocations?.(state.startDate, state.endDate);
          if (cloud && typeof cloud === "object") saved = { ...saved, ...cloud };
        } catch (error) { console.warn("PF allocation cloud load failed; using local copy.", error); }
        if (version !== loadVersion) return;
        state.rows = rows;
        state.allocations = {};
        state.adjustments = {};
        state.rows.forEach((row) => {
          const stored = saved[row.employee_key];
          state.allocations[row.employee_key] = (typeof stored === "object" ? stored?.payment_method : stored) === "transfer" ? "transfer" : "cash";
          if (stored && typeof stored === "object" && Number.isFinite(Number(stored.net_amount))) {
            state.adjustments[row.employee_key] = Math.round((Number(stored.net_amount) - Number(row.net_amount || 0)) * 100) / 100;
          }
        });
      } catch (error) {
        if (version !== loadVersion) return;
        state.message = error instanceof Error ? error.message : "โหลดข้อมูลรอบจ่ายไม่สำเร็จ";
        state.messageType = "error";
      } finally { if (version === loadVersion) { state.loading = false; paint(); } }
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

    async function loadGraphDashboard() {
      state.graphLoading = true;
      state.message = "";
      paint();
      try {
        state.graphData = await options.getComparisonDashboard?.(state.graphStartDate, state.graphEndDate) || { totals: {}, hours: [], weights: [], employees: [], payments: [] };
      } catch (error) {
        state.message = error instanceof Error ? error.message : "โหลดข้อมูลกราฟเปรียบเทียบไม่สำเร็จ";
        state.messageType = "error";
      } finally { state.graphLoading = false; paint(); }
    }

    async function save(description) {
      const localRows = {};
      state.rows.forEach((row) => { localRows[row.employee_key] = { payment_method: methodOf(row), net_amount: adjustedNet(row) }; });
      writeLocalWeek(state.startDate, state.endDate, localRows);
      state.message = "กำลังบันทึกข้อมูล บัญชีและค่าแรง...";
      state.messageType = "success";
      paint();
      try {
        await options.saveAllocations?.({
          start_date: state.startDate,
          end_date: state.endDate,
          allocations: state.rows.map((row) => ({ employee_key: row.employee_key, employee_kind: row.employee_kind, employee_id: row.employee_id, emp_code: row.emp_code, fullname: row.fullname, group_label: row.group_label, payment_method: methodOf(row), net_amount: adjustedNet(row) }))
        });
        state.message = "บันทึกข้อมูล บัญชีและค่าแรง เรียบร้อยแล้ว";
        options.onAudit?.("PF_PAYMENT_ALLOCATION_SAVE", description);
      } catch (error) {
        state.message = "บันทึกไว้ในเครื่องแล้ว แต่ฐานกลางยังไม่พร้อม: " + (error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
        state.messageType = "warning";
      }
      paint();
    }

    async function exportFile(format) {
      if (state.loading) return;
      const method = "all";
      const rows = scopedExportRows();
      if (!rows.length) {
        state.message = "ไม่มีรายการในกลุ่มและช่วงวันที่ที่เลือกสำหรับ Export";
        state.messageType = "error";
        return paint();
      }
      state.message = `กำลังสร้าง ${format === "excel" ? "Excel" : "PDF"}...`;
      state.messageType = "success";
      paint();
      try {
        await options.exportPayments?.(format, method, { start_date: state.startDate, end_date: state.endDate, payment_method: method, scope_label: exportScopeLabel(), rows: rows.map((row, index) => ({ ...row, net_amount: adjustedNet(row), sequence: index + 1, payment_method: methodOf(row) })), printed_by: user?.fullname || user?.username || "System Admin", printed_by_position: String(user?.level || "C4") });
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
      const adjustment = adjustmentOf(row);
      return `<tr class="acr-employee-row ${expanded ? "is-expanded" : ""}"><td><button type="button" class="acr-employee-toggle" data-expand-key="${escapeHtml(row.employee_key)}" aria-expanded="${expanded}"><span>${expanded ? "▾" : "▸"}</span><span><strong>${escapeHtml(row.emp_code || "-")}</strong><small>${escapeHtml(row.fullname || "-")} · ${row.employee_kind === "time" ? "พนักงานเวลา" : "พนักงานเหมา"}</small></span></button></td><td>${escapeHtml(row.group_label || "-")}</td><td class="acr-number">${money(row.gross_amount)}</td><td class="acr-number acr-positive">+${money(row.bonus_amount)}</td><td class="acr-number acr-negative">-${money(Number(row.deduction_amount || 0) + Number(row.withholding_tax_amount || 0))}</td><td class="acr-number"><strong>${money(adjustedNet(row))}</strong>${adjustment ? `<small class="${adjustment > 0 ? "acr-positive" : "acr-negative"}">${adjustment > 0 ? "+" : ""}${money(adjustment)} จากเปอร์เซ็นต์</small>` : ""}</td><td><div class="acr-method-switch"><button type="button" data-method-key="${escapeHtml(row.employee_key)}" data-method="cash" class="${method === "cash" ? "is-cash" : ""}">เงินสด</button><button type="button" data-method-key="${escapeHtml(row.employee_key)}" data-method="transfer" class="${method === "transfer" ? "is-transfer" : ""}">เงินโอน</button></div></td></tr>${expanded ? `<tr class="acr-detail-row"><td colspan="7"><div class="acr-detail-grid"><section><header><span>เงินเพิ่ม</span><strong class="acr-positive">+${money(row.bonus_amount)}</strong></header>${detailItems(row.bonus_items, "acr-positive", "ไม่มีรายการเงินเพิ่มในรอบนี้")}</section><section><header><span>รายการหัก</span><strong class="acr-negative">-${money(Number(row.deduction_amount || 0) + Number(row.withholding_tax_amount || 0))}</strong></header>${detailItems(row.deduction_items, "acr-negative", "ไม่มีรายการหักในรอบนี้")}</section></div></td></tr>` : ""}`;
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
      return `<article class="acr-export-card ${method}"><div><span>${method === "cash" ? "CASH" : "BANK TRANSFER"}</span><h2>${label}</h2><p>${rows.length} คน · ${money(sum(rows))}</p></div></article>`;
    }

    function exportMarkup() {
      const rows = scopedExportRows();
      const cashRows = rows.filter((row) => methodOf(row) === "cash");
      const transferRows = rows.filter((row) => methodOf(row) === "transfer");
      const productionGroups = [...new Set(state.rows.filter((row) => row.employee_kind === "production").map((row) => row.group_label))].sort((a, b) => a.localeCompare(b, "th"));
      const timeGroups = [...new Set(state.rows.filter((row) => row.employee_kind === "time").map((row) => row.group_label))].sort((a, b) => a.localeCompare(b, "th"));
      return `<section class="acr-page"><header class="acr-page-head"><div><p>PF ACCOUNTING</p><h1>Export รายการจ่ายเงิน</h1><span>เลือกกลุ่มและช่วงวันที่ รวมเงินสดและเงินโอนในเอกสารเดียว</span></div><div class="acr-period"><label>เริ่มต้น<input type="date" data-export-start-date value="${state.startDate}"></label><label>สิ้นสุด<input type="date" data-export-end-date min="${state.startDate}" value="${state.endDate}"></label></div></header><div class="acr-export-filter"><label>ขอบเขตรายงาน<select data-export-scope><option value="all" ${state.exportScope === "all" ? "selected" : ""}>พนักงานทั้งหมด</option><optgroup label="พนักงานเหมา"><option value="production::*" ${state.exportScope === "production::*" ? "selected" : ""}>พนักงานเหมาทุกกลุ่ม</option>${productionGroups.map((group) => `<option value="production::${escapeHtml(group)}" ${state.exportScope === `production::${group}` ? "selected" : ""}>${escapeHtml(group)}</option>`).join("")}</optgroup><optgroup label="พนักงานเวลา"><option value="time::*" ${state.exportScope === "time::*" ? "selected" : ""}>พนักงานเวลาทุกกลุ่ม</option>${timeGroups.map((group) => `<option value="time::${escapeHtml(group)}" ${state.exportScope === `time::${group}` ? "selected" : ""}>${escapeHtml(group)}</option>`).join("")}</optgroup></select></label><div><span>กำลังแสดง</span><strong>${escapeHtml(exportScopeLabel())}</strong><small>${rows.length} คน</small></div></div><div class="acr-export-summary"><strong>ยอดสุทธิรวม ${money(sum(rows))}</strong><span>เงินสด ${money(sum(cashRows))} + เงินโอน ${money(sum(transferRows))}</span></div><div class="acr-export-grid">${exportCard("cash", "รายการจ่ายเงินสด", cashRows)}${exportCard("transfer", "รายการจ่ายเงินโอน", transferRows)}</div><div class="acr-export-actions acr-export-download"><label>รูปแบบไฟล์<select data-export-format-choice><option value="pdf">PDF / พิมพ์</option><option value="excel">Excel</option></select></label><button type="button" data-export-combined ${state.loading ? "disabled" : ""}>Export รวมเงินสดและเงินโอน</button></div><section class="acr-export-preview"><div class="acr-list-head"><div><h2>ตัวอย่างรายการที่จะส่งออก</h2><span>ไฟล์จะแสดงขอบเขต “${escapeHtml(exportScopeLabel())}” บนเอกสาร</span></div></div><div class="acr-table-wrap"><table><thead><tr><th>ลำดับ</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>ประเภท</th><th>กลุ่ม</th><th>วิธีจ่าย</th><th class="acr-number">ยอดสุทธิ</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.emp_code)}</td><td>${escapeHtml(row.fullname)}</td><td>${row.employee_kind === "time" ? "พนักงานเวลา" : "พนักงานเหมา"}</td><td>${escapeHtml(row.group_label)}</td><td>${methodOf(row) === "cash" ? "เงินสด" : "เงินโอน"}</td><td class="acr-number"><strong>${money(adjustedNet(row))}</strong></td></tr>`).join("")}</tbody></table></div></section></section>`;
    }

    function percentageMarkup() {
      const kindRows = state.rows.filter((row) => row.employee_kind === state.percentKind);
      const groups = [...new Set(kindRows.map((row) => row.group_label || "ไม่ระบุกลุ่ม"))].sort((a, b) => a.localeCompare(b, "th"));
      const selected = kindRows.filter((row) => state.percentGroup === "all" || row.group_label === state.percentGroup);
      const percent = Math.min(1000, Math.max(0, Number(state.percentValue || 0)));
      const sign = state.percentMode === "deduct" ? -1 : 1;
      const basisValue = (row) => state.percentBasis === "weight" ? Number(row.metric_weight || 0) : state.percentBasis === "hours" ? Number(row.metric_hours || 0) : Number(row.net_amount || 0);
      const unit = state.percentBasis === "weight" ? "กก." : state.percentBasis === "hours" ? "ชม." : "บาท";
      const valueText = (value) => state.percentBasis === "money" ? money(value) : `${Number(value || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
      const baseTotal = selected.reduce((total, row) => total + basisValue(row), 0);
      const changeTotal = selected.reduce((total, row) => total + Math.round(basisValue(row) * percent * sign * 100) / 10000, 0);
      return `<section class="acr-page"><header class="acr-page-head"><div><p>PF PERCENT ADJUSTMENT</p><h1>ปรับยอดจ่ายด้วยเปอร์เซ็นต์</h1><span>เลือกกลุ่มเพื่อบวกหรือหักจากยอดสุทธิ โดยไม่แก้ข้อมูลค่าแรงต้นทาง</span></div><div class="acr-period"><label>เริ่มต้น<input type="date" data-percent-start-date value="${state.startDate}"></label><label>สิ้นสุด<input type="date" data-percent-end-date value="${state.endDate}"></label></div></header>
        <section class="acr-percent-basis"><button type="button" data-percent-basis="money" class="${state.percentBasis === "money" ? "active" : ""}">฿ ยอดเงินสุทธิ</button><button type="button" data-percent-basis="weight" class="${state.percentBasis === "weight" ? "active" : ""}">⚖ น้ำหนักผลผลิต</button><button type="button" data-percent-basis="hours" class="${state.percentBasis === "hours" ? "active" : ""}">◷ เวลาทำงาน</button></section><section class="acr-percent-form"><label>ประเภทพนักงาน<select data-percent-kind ${state.percentBasis !== "money" ? "disabled" : ""}><option value="production" ${state.percentKind === "production" ? "selected" : ""}>พนักงานเหมา</option><option value="time" ${state.percentKind === "time" ? "selected" : ""}>พนักงานเวลา</option></select></label><label>กลุ่ม<select data-percent-group><option value="all">ทุกกลุ่ม</option>${groups.map((group) => `<option value="${escapeHtml(group)}" ${state.percentGroup === group ? "selected" : ""}>${escapeHtml(group)}</option>`).join("")}</select></label><label>รูปแบบ<select data-percent-mode><option value="add" ${state.percentMode === "add" ? "selected" : ""}>+ บวกเพิ่ม</option><option value="deduct" ${state.percentMode === "deduct" ? "selected" : ""}>− หักออก</option></select></label><label>เปอร์เซ็นต์<div class="acr-percent-input"><input data-percent-value type="number" min="0" max="1000" step="0.01" value="${percent}"><b>%</b></div></label></section>
        <div class="acr-metrics acr-percent-metrics"><article><span>${unit}ก่อนปรับ</span><strong>${valueText(baseTotal)}</strong><small>${selected.length} คน</small></article><article class="${sign > 0 ? "transfer" : "cash"}"><span>${sign > 0 ? "ยอดบวกเพิ่ม" : "ยอดหักออก"} ${percent}%</span><strong>${sign > 0 ? "+" : "−"}${valueText(Math.abs(changeTotal))}</strong><small>คำนวณแยกรายคน</small></article><article class="transfer"><span>${unit}หลังปรับ</span><strong>${valueText(Math.max(0, baseTotal + changeTotal))}</strong><small>ตัวอย่างผลการคำนวณ</small></article></div>
        ${state.percentBasis === "money" ? `<div class="acr-percent-actions"><button type="button" data-percent-clear>ล้างการปรับของกลุ่มนี้</button><button type="button" data-percent-apply ${!selected.length || percent <= 0 ? "disabled" : ""}>ยืนยัน${sign > 0 ? "บวก" : "หัก"} ${percent}% ให้ ${selected.length} คน</button></div>` : `<div class="acr-percent-info">น้ำหนักและเวลาใช้สำหรับวิเคราะห์เปอร์เซ็นต์เท่านั้น ระบบจะไม่แก้รายการงานต้นทางหรือเปลี่ยนยอดจ่าย</div>`}
        <section class="acr-export-preview acr-percent-preview"><div class="acr-list-head"><div><h2>ตัวอย่างรายคน</h2><span>${state.percentBasis === "money" ? "การยืนยันครั้งใหม่จะแทนค่าปรับเดิมของคนในกลุ่มที่เลือก" : `คำนวณจาก${state.percentBasis === "weight" ? "น้ำหนักผลผลิต" : "เวลาทำงาน"}จริงในช่วงวันที่เลือก`}</span></div></div><div class="acr-table-wrap"><table><thead><tr><th>รหัส</th><th>พนักงาน</th><th>กลุ่ม</th><th class="acr-number">ยอดต้นทาง</th><th class="acr-number">ปรับครั้งนี้</th><th class="acr-number">ยอดใหม่</th></tr></thead><tbody>${selected.map((row) => { const base = basisValue(row); const change = Math.round(base * percent * sign * 100) / 10000; return `<tr><td>${escapeHtml(row.emp_code)}</td><td>${escapeHtml(row.fullname)}</td><td>${escapeHtml(row.group_label)}</td><td class="acr-number">${valueText(base)}</td><td class="acr-number ${change >= 0 ? "acr-positive" : "acr-negative"}">${change >= 0 ? "+" : "−"}${valueText(Math.abs(change))}</td><td class="acr-number"><strong>${valueText(Math.max(0, base + change))}</strong></td></tr>`; }).join("") || `<tr><td colspan="6" class="acr-empty">ยังไม่มีข้อมูลในกลุ่มนี้</td></tr>`}</tbody></table></div></section></section>`;
    }

    function graphBars(items, valueKey = "value", tone = "green", suffix = "") {
      const max = Math.max(1, ...items.map((item) => Math.abs(Number(item[valueKey] || 0))));
      return `<div class="acr-chart-bars">${items.map((item) => `<div><span>${escapeHtml(item.label)}</span><i><b class="${tone}" style="width:${Math.max(2, Math.abs(Number(item[valueKey] || 0)) / max * 100)}%"></b></i><strong>${Number(item[valueKey] || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}${suffix}</strong></div>`).join("") || `<p>ยังไม่มีข้อมูลในช่วงนี้</p>`}</div>`;
    }

    function graphDrillMarkup(data) {
      const type = state.graphDrill;
      if (!type) return "";
      let title = "";
      let panels = "";
      if (type === "employees") {
        title = "พนักงานทั้งหมด";
        panels = ["production", "time"].map((kind) => { const items = data.employees.filter((item) => item.kind === kind); const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0); return `<article><header><div><span>${kind === "production" ? "●" : "●"}</span><h2>${kind === "production" ? "พนักงานเหมา" : "พนักงานเวลา"}</h2></div><strong>${total.toLocaleString("th-TH")} คน</strong></header>${graphBars(items, "value", kind === "production" ? "green" : "blue", " คน")}</article>`; }).join("");
      } else if (type === "weights") {
        title = "น้ำหนักผลไม้ทั้งหมด";
        panels = `<article><header><h2>น้ำหนักรับเข้า</h2><strong>${data.weights.reduce((sum, item) => sum + Number(item.inbound || 0), 0).toLocaleString("th-TH")} กก.</strong></header>${graphBars(data.weights, "inbound", "amber", " กก.")}</article><article><header><h2>ผลผลิตปลายทาง</h2><strong>${data.weights.reduce((sum, item) => sum + Number(item.output || 0), 0).toLocaleString("th-TH")} กก.</strong></header>${graphBars(data.weights, "output", "green", " กก.")}</article>`;
      } else if (type === "hours") {
        title = "เวลาทำงานรวม";
        panels = `<article><header><h2>เวลาปกติ</h2></header>${graphBars(data.hours, "regular", "green", " ชม.")}</article><article><header><h2>เวลาล่วงเวลา (OT)</h2></header>${graphBars(data.hours, "overtime", "blue", " ชม.")}</article>`;
      } else {
        title = "ยอดจ่ายสุทธิ";
        panels = `<article><header><h2>ยอดต้นทาง</h2></header>${graphBars(data.payments, "base", "amber", " บาท")}</article><article><header><h2>ยอดหลังบวก/หักเปอร์เซ็นต์</h2></header>${graphBars(data.payments, "value", "green", " บาท")}</article>`;
      }
      return `<div class="acr-graph-drill"><div class="acr-graph-breadcrumb"><span>ภาพรวม</span><b>›</b><strong>${title}</strong><button type="button" data-graph-back>← กลับภาพรวม</button></div><div class="acr-drill-grid">${panels}</div></div>`;
    }

    function graphDashboardMarkup() {
      const data = state.graphData || { totals: {}, hours: [], weights: [], employees: [], payments: [] };
      const totals = data.totals || {};
      const kinds = [{ label: "พนักงานเหมา", value: data.employees.filter((item) => item.kind === "production").reduce((sum, item) => sum + Number(item.value || 0), 0) }, { label: "พนักงานเวลา", value: data.employees.filter((item) => item.kind === "time").reduce((sum, item) => sum + Number(item.value || 0), 0) }];
      const overview = `<div class="acr-graph-kpis"><article><span>◷</span><div><small>เวลาทำงานรวม</small><strong>${Number(totals.hours || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })} ชม.</strong></div></article><article><span>●</span><div><small>น้ำหนักผลไม้ปลายทาง</small><strong>${Number(totals.weight || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })} กก.</strong></div></article><article><span>♙</span><div><small>พนักงานทั้งหมด</small><strong>${Number(totals.employees || 0).toLocaleString("th-TH")} คน</strong></div></article><article><span>฿</span><div><small>ยอดจ่ายสุทธิ</small><strong>${money(totals.payment)}</strong></div></article></div><div class="acr-graph-grid"><button type="button" data-graph-drill="hours"><header><h2>เวลาทำงานรวม</h2><span>คลิกดูเวลาปกติและ OT ↗</span></header>${graphBars(data.hours, "value", "green", " ชม.")}</button><button type="button" data-graph-drill="weights"><header><h2>น้ำหนักผลไม้ทุกชนิด</h2><span>คลิกรับเข้าเทียบปลายทาง ↗</span></header>${graphBars(data.weights, "value", "amber", " กก.")}</button><button type="button" data-graph-drill="employees"><header><h2>จำนวนพนักงาน</h2><span>คลิกแยกประเภทและกลุ่ม ↗</span></header>${graphBars(kinds, "value", "blue", " คน")}</button><button type="button" data-graph-drill="payments"><header><h2>ยอดจ่ายหลังปรับเปอร์เซ็นต์</h2><span>คลิกเทียบก่อนและหลังปรับ ↗</span></header>${graphBars(data.payments, "value", "green", " บาท")}</button></div>`;
      return `<section class="acr-page acr-graph-page"><header class="acr-page-head"><div><p>PF DATA EXPLORER</p><h1>กราฟเปรียบเทียบข้อมูลทั้งหมด</h1><span>คลิกกราฟเพื่อซูมดูรายละเอียดเชิงลึก</span></div><button type="button" class="acr-refresh-cost" data-reload-graph>↻ โหลดข้อมูลล่าสุด</button></header><div class="acr-cost-periods"><div>${[["today","วันนี้"],["week","สัปดาห์นี้"],["month","เดือนนี้"],["year","ปีนี้"],["custom","กำหนดเอง"]].map(([value,label]) => `<button type="button" data-graph-preset="${value}" class="${state.graphPreset === value ? "active" : ""}">${label}</button>`).join("")}</div><label>เริ่มต้น<input type="date" data-graph-start value="${state.graphStartDate}" ${state.graphPreset === "custom" ? "" : "disabled"}></label><label>สิ้นสุด<input type="date" data-graph-end value="${state.graphEndDate}" ${state.graphPreset === "custom" ? "" : "disabled"}></label></div>${state.graphLoading ? `<div class="acr-empty">กำลังรวมข้อมูลทุกส่วนของระบบ...</div>` : state.graphDrill ? graphDrillMarkup(data) : overview}</section>`;
    }

    function costAnalysisMarkup() {
      if (!stockAllowed) return '<section class="acr-page"><h1>วิเคราะห์ต้นทุน</h1><p>ข้อมูลต้นทุนสต็อกสำหรับผู้บริหารสิทธิ์ C6–C7</p></section>';
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

    let stockController = null;
    let documentEditor = null;
    const billingPrototype = createBillingPrototype();
    function paint() {
      const sidebarScroll = root.querySelector(".acr-stable-rail")?.scrollTop || 0;
      const content = state.view === "document-editor" ? `<div data-pf-document-root></div>` : state.view === "billing" ? `<div data-pf-billing-root></div>` : stockViews.includes(state.view) ? `<div data-pf-stock-root></div>` : state.view === "allocation" ? allocationMarkup() : state.view === "export" ? exportMarkup() : state.view === "percentage" ? percentageMarkup() : state.view === "graph" ? graphDashboardMarkup() : costAnalysisMarkup();
      root.innerHTML = `<main class="acr-shell">${sidebar({ user, view: state.view, deductions: Boolean(options.onOpenDeductions) })}<div class="acr-workspace">${content}${state.message ? `<div class="acr-toast ${state.messageType}">${escapeHtml(state.message)}</div>` : ""}</div></main>`;
      const rail = root.querySelector(".acr-stable-rail");
      if (rail) rail.scrollTop = sidebarScroll;
      bind();
      if (state.view === "document-editor") { if (!documentEditor) documentEditor = window.PfDocumentEditor.create(); documentEditor.attach(root.querySelector("[data-pf-document-root]")); }
      if (state.view === "billing") billingPrototype.attach(root.querySelector("[data-pf-billing-root]"));
      if (stockViews.includes(state.view)) {
        if (!stockController) stockController = window.PfStockSummary.create({ request: options.stockRequest, navigate: (view) => { state.view = view; paint(); } });
        stockController.attach(root.querySelector("[data-pf-stock-root]"), state.view);
      }
    }

    function bind() {
      bindSidebar(root);
      root.querySelectorAll("[data-deduction-tab]").forEach((button) => button.addEventListener("click", () => options.onOpenDeductions?.(button.dataset.deductionTab)));
      root.querySelector("[data-ac-exit]")?.addEventListener("click", () => options.onExit?.());
      root.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
        if (!stockAllowed && stockViews.includes(button.dataset.view)) return;
        state.view = button.dataset.view;
        paint();
        if (state.view === "graph" && !state.graphData && !state.graphLoading) loadGraphDashboard();
        if (state.view === "cost" && !state.costData && !state.costLoading) loadCostAnalysis();
      }));
      root.querySelector("[data-reload]")?.addEventListener("click", load);
      root.querySelectorAll("[data-percent-basis]").forEach((button) => button.addEventListener("click", () => {
        state.percentBasis = button.dataset.percentBasis;
        if (state.percentBasis === "weight") state.percentKind = "production";
        if (state.percentBasis === "hours") state.percentKind = "time";
        state.percentGroup = "all";
        paint();
      }));
      root.querySelector("[data-percent-kind]")?.addEventListener("change", (event) => { state.percentKind = event.target.value === "time" ? "time" : "production"; state.percentGroup = "all"; paint(); });
      root.querySelector("[data-percent-start-date]")?.addEventListener("change", (event) => {
        state.startDate = event.target.value || state.startDate;
        state.endDate = addDays(state.startDate, 6);
        state.percentGroup = "all";
        load();
      });
      root.querySelector("[data-percent-end-date]")?.addEventListener("change", (event) => {
        state.endDate = event.target.value || state.endDate;
        if (state.endDate < state.startDate) state.endDate = state.startDate;
        state.percentGroup = "all";
        load();
      });
      root.querySelector("[data-percent-group]")?.addEventListener("change", (event) => { state.percentGroup = event.target.value || "all"; paint(); });
      root.querySelector("[data-percent-mode]")?.addEventListener("change", (event) => { state.percentMode = event.target.value === "deduct" ? "deduct" : "add"; paint(); });
      root.querySelector("[data-percent-value]")?.addEventListener("change", (event) => { state.percentValue = Math.min(1000, Math.max(0, Number(event.target.value || 0))); paint(); });
      root.querySelector("[data-percent-apply]")?.addEventListener("click", () => {
        const percent = Math.min(1000, Math.max(0, Number(state.percentValue || 0)));
        const sign = state.percentMode === "deduct" ? -1 : 1;
        const selected = state.rows.filter((row) => row.employee_kind === state.percentKind && (state.percentGroup === "all" || row.group_label === state.percentGroup));
        selected.forEach((row) => { state.adjustments[row.employee_key] = Math.round(Number(row.net_amount || 0) * percent * sign) / 100; });
        save(`${state.percentMode === "deduct" ? "หัก" : "บวก"} ${percent}% ให้ ${state.percentKind}/${state.percentGroup}`);
      });
      root.querySelector("[data-percent-clear]")?.addEventListener("click", () => {
        const selected = state.rows.filter((row) => row.employee_kind === state.percentKind && (state.percentGroup === "all" || row.group_label === state.percentGroup));
        selected.forEach((row) => { delete state.adjustments[row.employee_key]; });
        save(`ล้างการปรับเปอร์เซ็นต์ ${state.percentKind}/${state.percentGroup}`);
      });
      root.querySelector("[data-reload-cost]")?.addEventListener("click", loadCostAnalysis);
      root.querySelector("[data-reload-graph]")?.addEventListener("click", loadGraphDashboard);
      root.querySelectorAll("[data-graph-drill]").forEach((button) => button.addEventListener("click", () => { state.graphDrill = button.dataset.graphDrill; paint(); }));
      root.querySelector("[data-graph-back]")?.addEventListener("click", () => { state.graphDrill = ""; paint(); });
      root.querySelectorAll("[data-graph-preset]").forEach((button) => button.addEventListener("click", () => {
        state.graphPreset = button.dataset.graphPreset;
        state.graphDrill = "";
        if (state.graphPreset === "custom") return paint();
        const range = analysisRange(state.graphPreset);
        state.graphStartDate = range.startDate;
        state.graphEndDate = range.endDate;
        loadGraphDashboard();
      }));
      root.querySelector("[data-graph-start]")?.addEventListener("change", (event) => { state.graphStartDate = event.target.value || state.graphStartDate; if (state.graphEndDate < state.graphStartDate) state.graphEndDate = state.graphStartDate; state.graphDrill = ""; loadGraphDashboard(); });
      root.querySelector("[data-graph-end]")?.addEventListener("change", (event) => { state.graphEndDate = event.target.value || state.graphEndDate; if (state.graphEndDate < state.graphStartDate) state.graphStartDate = state.graphEndDate; state.graphDrill = ""; loadGraphDashboard(); });
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
      root.querySelector("[data-export-combined]")?.addEventListener("click", () => exportFile(root.querySelector("[data-export-format-choice]")?.value === "excel" ? "excel" : "pdf"));
      root.querySelectorAll("[data-export-start-date], [data-export-end-date]").forEach((input) => input.addEventListener("change", (event) => {
        if (!event.target.value) return paint();
        if (input.hasAttribute("data-export-start-date")) state.startDate = event.target.value;
        else state.endDate = event.target.value;
        if (state.endDate < state.startDate) state.endDate = state.startDate;
        load();
      }));
      root.querySelector("[data-export-scope]")?.addEventListener("change", (event) => { state.exportScope = event.target.value || "all"; paint(); });
    }

    paint();
    load();
    if (state.view === "graph") loadGraphDashboard();
    if (state.view === "cost") loadCostAnalysis();
  }

  window.AccountingControl = { render, sidebar, bindSidebar, createBillingPrototype, canAccessStockSummary };
})();
