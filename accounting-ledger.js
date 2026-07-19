(function () {
  "use strict";

  const STORAGE_KEY = "pismai_accounting_ledger_v1";
  const API_PATH = "/api/accounting";
  const ACCOUNT_TYPES = {
    asset: "สินทรัพย์", liability: "หนี้สิน", equity: "ส่วนของเจ้าของ",
    revenue: "รายได้", expense: "ค่าใช้จ่าย"
  };
  const NORMAL_DEBIT = new Set(["asset", "expense"]);
  const DEFAULT_ACCOUNTS = [
    ["1010", "เงินสด", "asset"], ["1020", "เงินฝากธนาคาร", "asset"],
    ["1100", "ลูกหนี้การค้า", "asset"], ["1150", "ภาษีซื้อ", "asset"],
    ["1200", "สินค้าคงเหลือ", "asset"], ["1300", "งานระหว่างทำ", "asset"],
    ["1500", "ที่ดิน อาคารและอุปกรณ์", "asset"], ["1590", "ค่าเสื่อมราคาสะสม", "asset", true],
    ["2010", "เจ้าหนี้การค้า", "liability"], ["2050", "ภาษีขาย", "liability"],
    ["2060", "ภาษีหัก ณ ที่จ่ายค้างจ่าย", "liability"], ["2100", "ค่าใช้จ่ายค้างจ่าย", "liability"],
    ["3010", "ทุนจดทะเบียน", "equity"], ["3100", "กำไรสะสม", "equity"],
    ["4010", "รายได้จากการขาย", "revenue"], ["4020", "รายได้จากบริการ", "revenue"],
    ["5010", "ต้นทุนขาย", "expense"], ["5020", "ค่าแรงทางตรง", "expense"],
    ["5030", "ค่าใช้จ่ายการผลิต", "expense"], ["6010", "เงินเดือนและค่าแรง", "expense"],
    ["6020", "ค่าเช่า", "expense"], ["6030", "ค่าสาธารณูปโภค", "expense"],
    ["6040", "ค่าขนส่ง", "expense"], ["6050", "ค่าโฆษณา", "expense"],
    ["6090", "ค่าใช้จ่ายอื่น", "expense"], ["6900", "ภาษีเงินได้นิติบุคคล", "expense"]
  ];

  let state;
  let currentUser;
  let hostRoot;
  let refreshHost = function () {};
  let notice = "";
  let noticeType = "success";
  let cloudTimer;
  let cloudReady = false;
  let lifecycleId = 0;

  function safeRefresh() {
    if (!String(location.hash).startsWith("#/accounting-control")) return;
    if (hostRoot && !hostRoot.isConnected) return;
    refreshHost();
  }

  function id(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]); }
  function num(value) { const n = Number(value); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; }
  function money(value) { return num(value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function periodOf(date) { return String(date || today()).slice(0, 7); }
  function userLevel() { return Number(String(currentUser?.level || "C1").replace(/\D/g, "")) || 1; }
  function canApprove() { return userLevel() >= 5 || currentUser?.role === "developer" || currentUser?.is_system; }
  function userName() { return currentUser?.username || "unknown"; }
  function defaultState() {
    return {
      version: 2, revision: 0,
      accounts: DEFAULT_ACCOUNTS.map(([code, name, type, contra]) => ({ id:id("acc"), code, name, type, contra:Boolean(contra), active:true, system:true })),
      journals: [], documents: [], periods: {}, audit: [], updatedAt:new Date().toISOString(), updatedBy:"system"
    };
  }
  function normalize(raw) {
    const base = defaultState();
    const source = raw && typeof raw === "object" ? raw : {};
    return { ...base, ...source,
      accounts:Array.isArray(source.accounts) && source.accounts.length ? source.accounts : base.accounts,
      journals:Array.isArray(source.journals) ? source.journals : [],
      documents:Array.isArray(source.documents) ? source.documents : [],
      periods:source.periods && typeof source.periods === "object" ? source.periods : {},
      audit:Array.isArray(source.audit) ? source.audit : []
    };
  }
  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); }
    catch { return defaultState(); }
  }
  function audit(action, detail, targetId) {
    state.audit.unshift({ id:id("audit"), action, detail, targetId:targetId || "", by:userName(), at:new Date().toISOString() });
    state.audit = state.audit.slice(0, 2000);
  }
  function save(action, detail, targetId) {
    if (action) audit(action, detail, targetId);
    state.updatedAt = new Date().toISOString(); state.updatedBy = userName();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!cloudReady) { clearTimeout(cloudTimer); cloudTimer = setTimeout(syncCloud, 300); }
  }
  function authToken() {
    try { return JSON.parse(sessionStorage.getItem("pismai_factory_session") || localStorage.getItem("pismai_factory_session") || "{}").token || ""; }
    catch { return ""; }
  }
  async function syncCloud() {
    const token = authToken();
    if (!token || !location.protocol.startsWith("http")) return;
    try {
      const response = await fetch(`${API_PATH}/workspace`, { method:"PUT", headers:{"Content-Type":"application/json","X-Session-Token":token}, body:JSON.stringify({ revision:state.revision, workspace:state }) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 409 && result.data?.workspace) {
        notice = "ข้อมูลกลางมีเวอร์ชันใหม่กว่า กรุณาโหลดหน้าใหม่ก่อนบันทึกต่อ"; noticeType = "error"; safeRefresh(); return;
      }
      if (!response.ok) throw new Error(result.error || `Cloud ${response.status}`);
      state.revision = Number(result.data?.revision || state.revision + 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      notice = `บันทึกในเครื่องแล้ว แต่ยังส่งฐานกลางไม่สำเร็จ: ${error.message}`; noticeType = "error"; safeRefresh();
    }
  }
  async function remoteRequest(path, options) {
    const response = await fetch(`${API_PATH}${path}`, { ...(options||{}), headers:{"Content-Type":"application/json","X-Session-Token":authToken(),...(options?.headers||{})} });
    const result = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : result.error?.message || `Accounting API ${response.status}`);
    return result.data;
  }
  async function hydrateCloud(expectedLifecycle = lifecycleId) {
    const token = authToken();
    if (!token || !location.protocol.startsWith("http")) return;
    try {
      const response = await fetch(`${API_PATH}/bootstrap`, { headers:{"X-Session-Token":token} });
      if (!response.ok) return;
      const result = await response.json();
      if (expectedLifecycle !== lifecycleId || !String(location.hash).startsWith("#/accounting-control")) return;
      const data=result.data||{}, linesByJournal=new Map();
      (data.journal_lines||[]).forEach(line=>{const rows=linesByJournal.get(line.journal_id)||[];rows.push({accountId:line.account_id,memo:line.description||"",debit:num(line.debit),credit:num(line.credit),partner_id:line.partner_id||"",due_date:line.due_date||"",tax_code:line.tax_code||""});linesByJournal.set(line.journal_id,rows);});
      state.accounts=(data.accounts||[]).map(a=>({id:a.id,code:a.code,name:a.name_th,type:a.account_type,contra:Boolean(a.is_contra),active:Boolean(a.active),system:Boolean(a.system_account)}));
      state.periods=Object.fromEntries((data.periods||[]).map(p=>[p.period_code,{id:p.id,status:p.status,closedBy:p.closed_by||"",closedAt:p.closed_at||""}]));
      state.journals=(data.journals||[]).map(j=>({id:j.id,date:j.entry_date,period:periodOf(j.entry_date),reference:j.journal_no,externalReference:j.reference||"",description:j.description,documentNo:"",lines:linesByJournal.get(j.id)||[],status:j.status,createdBy:j.created_by,createdAt:j.created_at,postedBy:j.posted_by||"",postedAt:j.posted_at||"",rejectionReason:j.rejection_reason||""}));
      state.company=data.company||state.company; state.updatedAt=new Date().toISOString(); state.updatedBy="cloud"; cloudReady=true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); safeRefresh();
    } catch { /* offline mode keeps the last verified local copy */ }
  }
  function accountById(accountId) { return state.accounts.find(a => a.id === accountId); }
  function periodStatus(period) { return state.periods[period]?.status || "open"; }
  function isClosed(date) { return periodStatus(periodOf(date)) === "closed"; }
  function totals(lines) { return lines.reduce((sum,l) => ({ debit:num(sum.debit)+num(l.debit), credit:num(sum.credit)+num(l.credit) }), {debit:0,credit:0}); }
  function validLines(lines) {
    const clean = lines.filter(l => l.accountId && (num(l.debit) || num(l.credit))).map(l => ({...l,debit:num(l.debit),credit:num(l.credit)}));
    const t = totals(clean);
    return { clean, total:t, balanced:clean.length >= 2 && t.debit > 0 && Math.abs(t.debit-t.credit) < 0.005 && clean.every(l => !(l.debit && l.credit)) };
  }
  function postedJournals() { return state.journals.filter(j => j.status === "posted" || j.status === "reversed"); }
  function balances(endDate) {
    const map = new Map(state.accounts.map(a => [a.id, {account:a,debit:0,credit:0}]));
    postedJournals().filter(j => !endDate || j.date <= endDate).forEach(j => j.lines.forEach(line => {
      const row = map.get(line.accountId); if (row) { row.debit += num(line.debit); row.credit += num(line.credit); }
    }));
    return [...map.values()].map(row => ({...row,balance:NORMAL_DEBIT.has(row.account.type) ? row.debit-row.credit : row.credit-row.debit}));
  }
  function trialBalance(endDate) {
    return balances(endDate).map(row => ({...row,closingDebit:row.debit >= row.credit ? row.debit-row.credit : 0,closingCredit:row.credit > row.debit ? row.credit-row.debit : 0}));
  }
  function accountOptions(selected) { return state.accounts.filter(a=>a.active).sort((a,b)=>a.code.localeCompare(b.code)).map(a=>`<option value="${esc(a.id)}" ${a.id===selected?"selected":""}>${esc(a.code)} · ${esc(a.name)}</option>`).join(""); }
  function statusLabel(status) { return ({draft:"แบบร่าง",pending_approval:"รอ C5 อนุมัติ",posted:"ผ่านรายการ",reversed:"กลับรายการ",rejected:"ไม่อนุมัติ",open:"เปิด",review:"รอตรวจ",closed:"ปิดแล้ว"})[status] || status; }
  function metric(label,value,detail,tone) { return `<article class="acl-metric ${tone||""}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`; }
  function views() { return [["chart","ผังบัญชี","≡"],["journal","สมุดรายวัน","✎"],["trial","งบทดลอง","∑"],["statements","งบการเงิน","▥"],["closing","ปิดงวด","◉"]]; }

  function chartView() {
    const counts = Object.keys(ACCOUNT_TYPES).map(type => metric(ACCOUNT_TYPES[type], state.accounts.filter(a=>a.type===type&&a.active).length, "บัญชีที่ใช้งาน", type)).join("");
    return `<section class="acr-page-head"><div><p>CHART OF ACCOUNTS</p><h2>ผังบัญชี</h2><span>เลขที่บัญชีเป็นรากของสมุดรายวันและงบการเงิน ห้ามลบบัญชีที่มีรายการแล้ว</span></div></section><section class="acl-metrics">${counts}</section><section class="acr-two-col"><form id="aclAccountForm" class="acr-form-panel"><h2>เพิ่มบัญชี</h2><label>เลขที่บัญชี<input name="code" pattern="[0-9A-Za-z.-]+" required></label><label>ชื่อบัญชี<input name="name" required></label><label>หมวดบัญชี<select name="type">${Object.entries(ACCOUNT_TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label><label class="acr-check"><input type="checkbox" name="contra"> เป็นบัญชีหักจากหมวดหลัก</label><button>เพิ่มเข้าผังบัญชี</button></form><article class="acr-panel"><div class="acr-table"><table><thead><tr><th>เลขที่</th><th>ชื่อบัญชี</th><th>หมวด</th><th>สถานะ</th></tr></thead><tbody>${state.accounts.sort((a,b)=>a.code.localeCompare(b.code)).map(a=>`<tr><td>${esc(a.code)}</td><td>${esc(a.name)}${a.contra?" <small>(บัญชีหัก)</small>":""}</td><td>${ACCOUNT_TYPES[a.type]}</td><td><button class="acl-status" data-toggle-account="${esc(a.id)}">${a.active?"ใช้งาน":"พักใช้"}</button></td></tr>`).join("")}</tbody></table></div></article></section>`;
  }
  function journalView() {
    const rows = Array.from({length:6},(_,i)=>`<tr><td><select name="account_${i}"><option value="">เลือกบัญชี</option>${accountOptions()}</select></td><td><input name="memo_${i}" placeholder="คำอธิบายบรรทัด"></td><td><input name="debit_${i}" type="number" min="0" step="0.01"></td><td><input name="credit_${i}" type="number" min="0" step="0.01"></td></tr>`).join("");
    return `<section class="acr-page-head"><div><p>DOUBLE-ENTRY JOURNAL</p><h2>สมุดรายวัน</h2><span>ผู้บันทึกส่งรายการให้ C5 ตรวจ ผู้บันทึกและผู้อนุมัติต้องเป็นคนละคน</span></div></section><form id="aclJournalForm" class="acr-form-panel acl-journal-form"><div class="acl-journal-head"><label>วันที่<input name="date" type="date" value="${today()}" required></label><label>เลขอ้างอิงภายนอก<input name="reference" required placeholder="เลขใบแจ้งหนี้/ใบเสร็จ"></label><label>คำอธิบาย<input name="description" required></label><label>เลขเอกสาร<input name="documentNo" placeholder="INV/RCPT/TAX"></label></div><div class="acr-table"><table><thead><tr><th>บัญชี</th><th>รายละเอียด</th><th>เดบิต</th><th>เครดิต</th></tr></thead><tbody>${rows}</tbody></table></div><div class="acl-journal-actions"><button name="intent" value="draft" class="secondary">บันทึกแบบร่าง</button><button name="intent" value="submit">ส่งให้ C5 ตรวจ</button></div></form><section class="acr-panel"><h2>รายการล่าสุด</h2><div class="acr-table"><table><thead><tr><th>วันที่</th><th>เลขสมุดรายวัน</th><th>คำอธิบาย</th><th>ยอด</th><th>สถานะ</th><th>การตรวจ</th></tr></thead><tbody>${state.journals.length?state.journals.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,50).map(j=>`<tr><td>${esc(j.date)}</td><td>${esc(j.reference)}</td><td>${esc(j.description)}${j.rejectionReason?`<small class="acl-reject-reason">${esc(j.rejectionReason)}</small>`:""}</td><td>${money(totals(j.lines).debit)}</td><td><span class="acl-pill ${j.status}">${statusLabel(j.status)}</span></td><td>${j.status==="pending_approval"&&canApprove()&&j.createdBy!==userName()?`<button data-approve-journal="${esc(j.id)}">อนุมัติ</button><button class="acr-delete" data-reject-journal="${esc(j.id)}">ไม่อนุมัติ</button>`:j.status==="pending_approval"&&j.createdBy===userName()?"รอ C5 คนอื่น":"-"}</td></tr>`).join(""):`<tr><td colspan="6">ยังไม่มีสมุดรายวัน</td></tr>`}</tbody></table></div></section>`;
  }
  function trialView() {
    const rows = trialBalance(); const td=rows.reduce((s,r)=>s+r.closingDebit,0); const tc=rows.reduce((s,r)=>s+r.closingCredit,0);
    return `<section class="acr-page-head"><div><p>TRIAL BALANCE</p><h2>งบทดลอง</h2><span>รวมจากรายการที่ผ่านบัญชีแล้วเท่านั้น</span></div></section><section class="acl-metrics">${metric("เดบิต",`${money(td)} ฿`,"ยอดคงเหลือด้านเดบิต","asset")}${metric("เครดิต",`${money(tc)} ฿`,"ยอดคงเหลือด้านเครดิต","liability")}${metric("ผลต่าง",`${money(td-tc)} ฿`,Math.abs(td-tc)<.005?"สมดุล":"ต้องตรวจสอบ",Math.abs(td-tc)<.005?"ok":"danger")}</section><section class="acr-panel"><div class="acr-table"><table><thead><tr><th>บัญชี</th><th>ชื่อ</th><th>เดบิตเคลื่อนไหว</th><th>เครดิตเคลื่อนไหว</th><th>เดบิตคงเหลือ</th><th>เครดิตคงเหลือ</th></tr></thead><tbody>${rows.filter(r=>r.debit||r.credit).map(r=>`<tr><td>${esc(r.account.code)}</td><td>${esc(r.account.name)}</td><td>${money(r.debit)}</td><td>${money(r.credit)}</td><td>${money(r.closingDebit)}</td><td>${money(r.closingCredit)}</td></tr>`).join("")||`<tr><td colspan="6">ยังไม่มีรายการผ่านบัญชี</td></tr>`}</tbody><tfoot><tr><th colspan="4">รวม</th><th>${money(td)}</th><th>${money(tc)}</th></tr></tfoot></table></div></section>`;
  }
  function statementsView() {
    const rows=balances(); const sum=type=>rows.filter(r=>r.account.type===type).reduce((s,r)=>s+r.balance,0);
    const revenue=sum("revenue"), expense=sum("expense"), profit=revenue-expense, assets=sum("asset"), liabilities=sum("liability"), equity=sum("equity")+profit;
    const section=(title,types)=>`<article class="acr-panel"><h2>${title}</h2><div class="acl-statement">${rows.filter(r=>types.includes(r.account.type)&&Math.abs(r.balance)>.004).map(r=>`<div><span>${esc(r.account.code)} ${esc(r.account.name)}</span><b>${money(r.balance)}</b></div>`).join("")||"<small>ยังไม่มีรายการ</small>"}</div></article>`;
    return `<section class="acr-page-head"><div><p>FINANCIAL STATEMENTS</p><h2>งบการเงินจากบัญชีคู่</h2><span>ตัวเลขคำนวณจากสมุดรายวันที่ผ่านรายการแล้วและยังไม่ถือเป็นงบที่ผู้สอบบัญชีรับรอง</span></div></section><section class="acl-metrics">${metric("สินทรัพย์",`${money(assets)} ฿`,"ยอดสุทธิ","asset")}${metric("หนี้สิน",`${money(liabilities)} ฿`,"ยอดสุทธิ","liability")}${metric("ส่วนของเจ้าของ",`${money(equity)} ฿`,"รวมกำไรของงวด","equity")}${metric("กำไรสุทธิ",`${money(profit)} ฿`,`รายได้ ${money(revenue)} - ค่าใช้จ่าย ${money(expense)}`,profit>=0?"ok":"danger")}</section><section class="acr-two-col">${section("งบกำไรขาดทุน",["revenue","expense"])}${section("งบแสดงฐานะการเงิน",["asset","liability","equity"])}</section><div class="acr-form-warning">สมการบัญชี: สินทรัพย์ ${money(assets)} = หนี้สินและส่วนของเจ้าของ ${money(liabilities+equity)} · ผลต่าง ${money(assets-liabilities-equity)}</div>`;
  }
  function closingView() {
    const periods=[...new Set([periodOf(today()),...state.journals.map(j=>periodOf(j.date)),...Object.keys(state.periods)])].sort().reverse();
    return `<section class="acr-page-head"><div><p>PERIOD CONTROL</p><h2>ตรวจและปิดงวดบัญชี</h2><span>ปิดงวดแล้วจะบันทึก แก้ไข หรือกลับรายการในเดือนนั้นไม่ได้</span></div></section><section class="acr-panel"><div class="acr-table"><table><thead><tr><th>งวด</th><th>รายการผ่านบัญชี</th><th>แบบร่าง</th><th>เดบิต</th><th>เครดิต</th><th>สถานะ</th><th></th></tr></thead><tbody>${periods.map(p=>{const js=state.journals.filter(j=>periodOf(j.date)===p),posted=js.filter(j=>j.status==="posted"),t=totals(posted.flatMap(j=>j.lines)),status=periodStatus(p);return `<tr><td>${p}</td><td>${posted.length}</td><td>${js.filter(j=>j.status==="draft").length}</td><td>${money(t.debit)}</td><td>${money(t.credit)}</td><td><span class="acl-pill ${status}">${statusLabel(status)}</span></td><td>${canApprove()?`<button data-period-action="${status==="closed"?"reopen":"close"}" data-period="${p}">${status==="closed"?"เปิดใหม่":"ปิดงวด"}</button>`:"ต้องใช้ C5+"}</td></tr>`}).join("")}</tbody></table></div></section><section class="acr-panel"><h2>ประวัติควบคุมล่าสุด</h2><div class="acl-audit">${state.audit.slice(0,50).map(a=>`<div><time>${new Date(a.at).toLocaleString("th-TH")}</time><b>${esc(a.action)}</b><span>${esc(a.detail)}</span><small>${esc(a.by)}</small></div>`).join("")||"ยังไม่มีประวัติ"}</div></section>`;
  }
  function render(view) {
    if (!state) state=load();
    const content = view==="chart"?chartView():view==="journal"?journalView():view==="trial"?trialView():view==="statements"?statementsView():closingView();
    return `${notice?`<div class="acr-notice ${noticeType}">${esc(notice)}</div>`:""}${content}`;
  }
  function rerender() { noticeType=noticeType||"success"; safeRefresh(); }
  function bind(root, refresh) {
    hostRoot=root; refreshHost=refresh||function(){};
    root.querySelector("#aclAccountForm")?.addEventListener("submit",async e=>{
      e.preventDefault(); const f=new FormData(e.currentTarget),code=String(f.get("code")||"").trim(),name=String(f.get("name")||"").trim();
      if(state.accounts.some(a=>a.code.toLowerCase()===code.toLowerCase())){notice="เลขที่บัญชีซ้ำ";noticeType="error";rerender();return;}
      try {
        if(cloudReady){await remoteRequest("/accounts",{method:"POST",body:JSON.stringify({code,name,type:String(f.get("type")),contra:f.get("contra")==="on"})});await hydrateCloud();}
        else {state.accounts.push({id:id("acc"),code,name,type:String(f.get("type")),contra:f.get("contra")==="on",active:true,system:false});save("ACCOUNT_CREATE",`${code} ${name}`);}
        notice="เพิ่มบัญชีแล้ว";noticeType="success";rerender();
      } catch(error){notice=error.message;noticeType="error";rerender();}
    });
    root.querySelectorAll("[data-toggle-account]").forEach(btn=>btn.addEventListener("click",()=>{
      if(cloudReady){notice="การพักใช้บัญชีฐานกลางจะเปิดหลังเพิ่มขั้นอนุมัติการแก้ผังบัญชี";noticeType="error";rerender();return;}
      const a=accountById(btn.dataset.toggleAccount);if(!a)return;a.active=!a.active;save("ACCOUNT_STATUS",`${a.code} ${a.active?"เปิด":"พักใช้"}`,a.id);rerender();
    }));
    root.querySelector("#aclJournalForm")?.addEventListener("submit",async e=>{
      e.preventDefault(); const f=new FormData(e.currentTarget),date=String(f.get("date")),intent=String(e.submitter?.value||"draft");
      if(isClosed(date)){notice="งวดนี้ปิดแล้ว ไม่สามารถบันทึกรายการได้";noticeType="error";rerender();return;}
      const lines=Array.from({length:6},(_,i)=>({accountId:String(f.get(`account_${i}`)||""),memo:String(f.get(`memo_${i}`)||""),debit:num(f.get(`debit_${i}`)),credit:num(f.get(`credit_${i}`))}));
      const check=validLines(lines); if(!check.balanced){notice=`บันทึกไม่ได้: เดบิต ${money(check.total.debit)} ต้องเท่ากับเครดิต ${money(check.total.credit)} และต้องมีอย่างน้อย 2 บรรทัด`;noticeType="error";rerender();return;}
      const payload={date,reference:String(f.get("reference")),description:String(f.get("description")),document_no:String(f.get("documentNo")||""),journal_type:"general",lines:check.clean,intent};
      try {
        if(cloudReady){await remoteRequest("/journals",{method:"POST",body:JSON.stringify(payload)});await hydrateCloud();}
        else {const j={id:id("jv"),date,period:periodOf(date),reference:payload.reference,description:payload.description,documentNo:payload.document_no,lines:check.clean,status:intent==="submit"?"pending_approval":"draft",createdBy:userName(),createdAt:new Date().toISOString()};state.journals.unshift(j);save(intent==="submit"?"JOURNAL_SUBMIT":"JOURNAL_DRAFT",`${j.reference} ${money(check.total.debit)}`,j.id);}
        notice=intent==="submit"?"ส่งรายการให้ C5 ตรวจแล้ว":"บันทึกแบบร่างแล้ว";noticeType="success";rerender();
      } catch(error){notice=error.message;noticeType="error";rerender();}
    });
    root.querySelectorAll("[data-approve-journal]").forEach(btn=>btn.addEventListener("click",async()=>{
      try{await remoteRequest("/journals/approve",{method:"POST",body:JSON.stringify({journal_id:btn.dataset.approveJournal})});await hydrateCloud();notice="อนุมัติและผ่านรายการแล้ว";noticeType="success";rerender();}catch(error){notice=error.message;noticeType="error";rerender();}
    }));
    root.querySelectorAll("[data-reject-journal]").forEach(btn=>btn.addEventListener("click",async()=>{
      const reason=prompt("เหตุผลที่ไม่อนุมัติ");if(!reason)return;
      try{await remoteRequest("/journals/reject",{method:"POST",body:JSON.stringify({journal_id:btn.dataset.rejectJournal,reason})});await hydrateCloud();notice="ส่งรายการกลับพร้อมเหตุผลแล้ว";noticeType="success";rerender();}catch(error){notice=error.message;noticeType="error";rerender();}
    }));
    root.querySelectorAll("[data-period-action]").forEach(btn=>btn.addEventListener("click",async()=>{
      if(!canApprove())return;const period=btn.dataset.period,action=btn.dataset.periodAction;
      if(cloudReady&&action==="reopen"){notice="การเปิดงวดฐานกลางต้องระบุเหตุผลและจะเพิ่มในรอบถัดไป";noticeType="error";rerender();return;}
      try{
        if(cloudReady){await remoteRequest("/periods/close",{method:"POST",body:JSON.stringify({period_id:state.periods[period]?.id})});await hydrateCloud();}
        else {const drafts=state.journals.filter(j=>periodOf(j.date)===period&&["draft","pending_approval"].includes(j.status));if(drafts.length)throw new Error(`ยังมีรายการค้าง ${drafts.length} รายการ`);state.periods[period]={status:action==="close"?"closed":"open",closedBy:userName(),closedAt:new Date().toISOString()};save(action==="close"?"PERIOD_CLOSE":"PERIOD_REOPEN",period,period);}
        notice=`ปิดงวด ${period} แล้ว`;noticeType="success";rerender();
      }catch(error){notice=error.message;noticeType="error";rerender();}
    }));
  }
  function init(user, refresh) { lifecycleId += 1; currentUser=user; refreshHost=refresh||function(){}; state=load(); hydrateCloud(lifecycleId); }
  function deactivate() { lifecycleId += 1; hostRoot=null; refreshHost=function(){}; clearTimeout(cloudTimer); }
  window.AccountingLedger={views,init,deactivate,render,bind,getState:()=>state,trialBalance,balances};
})();
