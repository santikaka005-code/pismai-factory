
const user={level:'C5',fullname:'ผู้ทดลอง'};
const modules=[{id:'stock',label:'Stock'},{id:'inbound',label:'Stock ทั่วไป'},{id:'inbound-fruits',label:'จัดการผลไม้ / ราคาแนะนำ'},{id:'inbound-history',label:'รายการรับเข้า'},{id:'stock-cold-room',label:'Stock ห้องเย็น'}];
const getUserLevel=u=>u.level;
let inboundLoaded=true,inboundMessage='',inboundMessageType='success',inboundConfirmPayload=null;
let inboundFilters={from:'',to:'',supplier:'',fruit:'',search:''};
let inboundSelectedReceiptIds=new Set();
const inboundData={fruits:[{id:1,name:'มะม่วง',status:'Active'},{id:2,name:'ทุเรียน',status:'Active'}],prices:[{fruit_id:1,price_per_kg:25,effective_date:'2020-01-01',created_at:'2020-01-01'},{fruit_id:2,price_per_kg:90,effective_date:'2020-01-01',created_at:'2020-01-01'}],receipts:[{id:1,fruit_id:1,fruit_name:'มะม่วง',supplier_name:'ผู้ส่งตัวอย่าง A',weight_kg:500,price_per_kg:25,total_amount:12500,received_at:new Date().toISOString(),created_by:'ผู้ทดลอง',note:'ข้อมูลสมมติสำหรับทดสอบ'}]};
async function cloudApiRequest(url,options){const data=JSON.parse(options.body||'{}');if(url==='/api/inbound/receipts'){const fruit=inboundData.fruits.find(f=>f.id===data.fruit_id);inboundData.receipts.unshift({...data,id:inboundData.receipts.length+1,fruit_name:fruit.name,total_amount:data.weight_kg*data.price_per_kg,created_by:'ผู้ทดลอง'});}else if(url==='/api/inbound/fruits'){inboundData.fruits.push({id:inboundData.fruits.length+1,name:String(data.name),status:'Active'});}else if(url==='/api/inbound/prices'){inboundData.prices.unshift({...data,fruit_id:Number(data.fruit_id),price_per_kg:Number(data.price_per_kg),created_at:new Date().toISOString()});}else throw Error('ตัวเทสไม่เชื่อม API จริง');return {data:[]};}
async function loadInboundData(){render();}
function printSelectedInboundReceipts(){alert('ตัวอย่างเท่านั้น ยังไม่พิมพ์เอกสารจริง');}
function exportSelectedInbound(){alert('ตัวอย่างเท่านั้น ยังไม่ส่งออกเอกสารจริง');}
function isStockRoute(route) {
  return ["stock", "inbound", "inbound-fruits", "inbound-history", "stock-cold-room"].includes(route);
}
function renderStockNavigation(active = "home") {
  return `<nav class="stock-section-nav" aria-label="หมวด Stock">
    <button type="button" data-route="stock" class="${active === "home" ? "is-active" : ""}" ${active === "home" ? 'aria-current="page"' : ""}>Stock ทั้งหมด</button>
    <button type="button" data-route="inbound" class="${active === "general" ? "is-active" : ""}" ${active === "general" ? 'aria-current="page"' : ""}>Stock ทั่วไป</button>
    <button type="button" data-route="stock-cold-room" class="${active === "cold" ? "is-active" : ""}" ${active === "cold" ? 'aria-current="page"' : ""}>Stock ห้องเย็น</button>
  </nav>`;
}
function renderStockHub() {
  return `${renderStockNavigation()}<section class="stock-hub">
    <p class="eyebrow">PF STOCK MANAGEMENT</p><h2>Stock</h2>
    <p>เลือกส่วนงานที่ต้องการจัดการ แยกการรับเข้าผลไม้ทั่วไปออกจากสินค้าแปรรูปที่เข้าห้องเย็นและสินค้าฝากแช่</p>
    <div class="stock-choice-grid">
      <button class="stock-choice" data-route="inbound" type="button">
        <span class="stock-choice-icon" aria-hidden="true">⇩</span><span class="stock-choice-status">ใช้งานข้อมูลรับเข้าเดิม</span>
        <strong>Stock ทั่วไป</strong><p>รับเข้าผลไม้จากผู้ส่ง บันทึกน้ำหนัก ราคาซื้อจริง และต้นทุนของแต่ละรายการ</p>
        <ul><li>บันทึกรับเข้าผลไม้</li><li>จัดการชนิดผลไม้และราคาแนะนำ</li><li>ประวัติรับเข้า พิมพ์ และส่งออก Excel / PDF</li><li>จัดการข้อมูลสินค้าและผู้ส่ง</li></ul>
        <span class="stock-choice-cta">เปิด Stock ทั่วไป →</span>
      </button>
      <button class="stock-choice is-cold" data-route="stock-cold-room" type="button">
        <span class="stock-choice-icon" aria-hidden="true">❄</span><span class="stock-choice-status">เค้าโครงทดลอง · ยังไม่บันทึกสต็อกจริง</span>
        <strong>Stock ห้องเย็น</strong><p>ตรวจรับสินค้าที่แปรรูปแล้วเข้าห้องเย็น 2 ห้อง จัดเก็บเป็นพาเลตและกล่องรอส่งลูกค้า</p>
        <ul><li>ผังห้องเย็น 2D มองจากด้านบน</li><li>กล่องละ 20 กก. ปรับจำนวนกล่องต่อพาเลตได้</li><li>แยกสีสินค้าของเราและสินค้าฝากแช่ พร้อมชื่อเจ้าของ</li><li>ทดลองรับเข้า ย้ายตำแหน่ง จ่ายออก และดูยอดสรุป</li></ul>
        <span class="stock-choice-cta">เปิด Stock ห้องเย็น →</span>
      </button>
    </div>
    <div class="stock-hub-note">PF Accounting อยู่ในเมนูเดิมสำหรับเรื่องเงิน ส่วน Stock ใช้จัดการสินค้าและการรับเข้า · Stock ทั่วไปยังเป็นข้อมูลรับซื้อ ไม่ใช่ยอดคงเหลือหลังเบิกผลิต ส่วน Stock ห้องเย็นเป็นโหมดทดลอง รีเฟรชแล้วเริ่มใหม่</div>
  </section>`;
}
function renderModuleContent(user, moduleItem) {
  const settingsSubpageIds = new Set(["employees", "production-employees", "time-employees", "wage-rates", "settings-pile-summary", "account-management", "audit-log", "backup", "pf-desktop-app"]);
  const wrapSettingsSubpage = (content) =>
    settingsSubpageIds.has(moduleItem.id) ? `${renderSettingsBackBar()}${content}` : content;

  if (moduleItem.id === "dashboard") {
    return renderDashboard(user, moduleItem);
  }
  if (moduleItem.id === "summary-all") {
    return renderSummaryMenu(moduleItem);
  }
  if (moduleItem.id === "summary-main") {
    return renderSummaryAll(moduleItem);
  }
  if (moduleItem.id === "summary-export") {
    return renderSummaryExport(moduleItem);
  }
  if (moduleItem.id === "summary-time-overview") {
    return renderSummaryTimeOverview(moduleItem);
  }
  if (moduleItem.id === "summary-group-report") {
    return renderSummaryGroupReport(moduleItem);
  }
  if (moduleItem.id === "production") {
    return renderProductionManagement(user, moduleItem);
  }
  if (moduleItem.id === "stock") return renderStockHub();
  if (moduleItem.id === "stock-cold-room") return `${renderStockNavigation("cold")}<section class="stock-cold-workspace" data-stock-cold-workspace><iframe src="stock-preview.html?v=20261015-stock-sections" title="Stock ห้องเย็น 2D — โหมดทดลอง ข้อมูลสมมติ" class="stock-cold-frame"></iframe></section>`;
  if (moduleItem.id === "inbound") return renderInboundEntry(user);
  if (moduleItem.id === "inbound-fruits") return renderInboundFruitManagement(user);
  if (moduleItem.id === "inbound-history") return renderInboundHistory(user);
  if (moduleItem.id === "summary-person") {
    return renderPersonalReport(moduleItem);
  }
  if (moduleItem.id === "time-report") {
    return renderTimeReport(user, moduleItem);
  }
  if (moduleItem.id === "compare-data") {
    return renderDeductionEntry(user, moduleItem);
  }
  if (moduleItem.id === "reports") {
    return renderReports(moduleItem);
  }
  if (moduleItem.id === "employees") {
    return wrapSettingsSubpage(renderEmployeeManagementHub(user, moduleItem));
  }
  if (moduleItem.id === "production-employees") {
    return wrapSettingsSubpage(renderEmployees(user, moduleItem));
  }
  if (moduleItem.id === "time-employees") {
    return wrapSettingsSubpage(renderTimeEmployees(user, moduleItem));
  }
  if (moduleItem.id === "wage-rates") {
    return wrapSettingsSubpage(renderWageRateForm(user));
  }
  if (moduleItem.id === "settings-pile-summary") {
    return wrapSettingsSubpage(renderSettingsPileSummary(user, moduleItem));
  }
  if (moduleItem.id === "account-management") {
    return wrapSettingsSubpage(renderAccountManagement(user, moduleItem));
  }
  if (moduleItem.id === "audit-log") {
    return wrapSettingsSubpage(renderAuditLog(moduleItem));
  }
  if (moduleItem.id === "backup") {
    return wrapSettingsSubpage(renderBackupModule(user, moduleItem));
  }
  if (moduleItem.id === "pf-desktop-app") {
    return wrapSettingsSubpage(renderPfDesktopApp(user, moduleItem));
  }
  if (moduleItem.id === "pile-management") {
    return renderPileManagement(moduleItem);
  }
  if (moduleItem.id === "record-report") {
    return renderIssueReportPage(user, moduleItem);
  }
  if (moduleItem.id === "settings") {
    return renderFullSettingsModule(user);
  }
  if (moduleItem.id === "secret-room" && window.SecretRoom) {
    return window.SecretRoom.render();
  }
  return renderSimpleModule(moduleItem);
}
function renderInboundHeader(title, subtitle, user, active = "entry") {
  const canManage = Number(String(getUserLevel(user)).replace(/\D/g, "")) >= 5;
  return `${renderStockNavigation("general")}<header class="inbound-page-head"><div><p class="eyebrow">STOCK ทั่วไป / รับเข้าผลไม้</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><div class="inbound-head-actions">
    <button class="btn btn-outline ${active === "entry" ? "is-active" : ""}" data-route="inbound" type="button">รับเข้าผลไม้</button>
    <button class="btn btn-outline ${active === "manage" ? "is-active" : ""}" data-route="inbound-fruits" type="button" ${canManage ? "" : "disabled"}>จัดการผลไม้ / ราคาแนะนำ</button>
    <button class="btn btn-outline ${active === "history" ? "is-active" : ""}" data-route="inbound-history" type="button">รายการรับเข้า</button>
  </div></header>`;
}
function renderInboundEntry(user) {
  if (!inboundLoaded) {
    loadInboundData();
    return `${renderInboundHeader("Stock ทั่วไป", "บันทึกผลไม้ น้ำหนัก ราคาจริง และต้นทุนของแต่ละรายการ", user)}<section class="panel inbound-loading">กำลังโหลดข้อมูลรับเข้า...</section>`;
  }
  const fruits = inboundActiveFruits();
  const suppliers = [...new Set(inboundData.receipts.map((row) => row.supplier_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));
  return `${renderInboundHeader("Stock ทั่วไป", "รับเข้าผลไม้จากผู้ส่ง พร้อมน้ำหนัก ราคาจริง และต้นทุนที่เชื่อม PF Accounting", user)}${renderInboundStatus()}
    <section class="panel inbound-entry-card">
      <form id="inboundEntryForm" class="inbound-entry-form">
        <label class="field"><span>วันที่รับเข้า</span><input name="received_at" type="datetime-local" value="${inboundLocalDateTime()}" required /></label>
        <label class="field"><span>ชื่อผู้ส่ง</span><input name="supplier_name" list="inboundSupplierList" maxlength="160" placeholder="พิมพ์ชื่อผู้ที่มาส่ง" autocomplete="off" required /><datalist id="inboundSupplierList">${suppliers.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("")}</datalist></label>
        <label class="field"><span>ผลไม้</span><select name="fruit_id" required><option value="">เลือกผลไม้</option>${fruits.map((fruit) => `<option value="${fruit.id}">${escapeHtml(fruit.name)}</option>`).join("")}</select></label>
        <div class="inbound-price-hint" id="inboundPriceHint">เลือกผู้ส่งและผลไม้เพื่อดูราคาล่าสุดหรือราคาแนะนำ</div>
        <label class="field"><span>น้ำหนัก (กก.)</span><input name="weight_kg" type="number" min="0.01" max="100000000" step="0.01" inputmode="decimal" placeholder="0.00" required /></label>
        <label class="field"><span>ราคาต่อกิโล <small>แก้ไขได้</small></span><div class="inbound-price-input"><input name="price_per_kg" type="number" min="0.01" max="1000000" step="0.01" inputmode="decimal" placeholder="0.00" required /><b>ราคาของรายการนี้</b></div></label>
        <div class="inbound-total"><span>ยอดเงิน</span><strong id="inboundCalculatedTotal">0.00</strong><b>บาท</b><small id="inboundFormula">0.00 กก. × 0.00 บาท = 0.00 บาท</small></div>
        <label class="field inbound-note"><span>หมายเหตุ</span><textarea name="note" maxlength="1000" rows="3" placeholder="รายละเอียดที่ต้องการจดจำ (ไม่บังคับ)"></textarea></label>
        <div class="inbound-entry-actions"><button class="btn btn-outline" type="reset">ล้างข้อมูล</button><button class="btn btn-primary" type="submit" ${fruits.length ? "" : "disabled"}>ตรวจสอบก่อนบันทึก</button></div>
      </form>
      ${fruits.length ? "" : `<div class="inbound-empty-callout">ยังไม่มีผลไม้ที่เปิดใช้งาน ผู้มีสิทธิ์ C5 ขึ้นไปต้องเพิ่มผลไม้และตั้งราคาแนะนำก่อน</div>`}
    </section>
    ${inboundConfirmPayload ? renderInboundConfirmation() : ""}`;
}
function renderInboundConfirmation() {
  const row = inboundConfirmPayload;
  return `<div class="inbound-modal-backdrop" data-close-inbound-confirm><section class="inbound-confirm" role="dialog" aria-modal="true" aria-labelledby="inboundConfirmTitle" data-inbound-confirm-panel>
    <button class="inbound-modal-close" data-close-inbound-confirm type="button">×</button><h3 id="inboundConfirmTitle">ตรวจสอบรายการ</h3><p>กรุณาตรวจสอบก่อนบันทึกลงฐานข้อมูลกลาง</p>
    <dl><div><dt>ผู้ส่ง</dt><dd>${escapeHtml(row.supplier_name)}</dd></div><div><dt>ผลไม้</dt><dd>${escapeHtml(row.fruit_name)}</dd></div><div><dt>น้ำหนัก</dt><dd>${inboundMoney(row.weight_kg)} กก.</dd></div><div><dt>ราคาจริง</dt><dd>${inboundMoney(row.price_per_kg)} บาท/กก.</dd></div><div class="is-total"><dt>ยอดเงิน</dt><dd>${inboundMoney(row.total_amount)} บาท</dd></div></dl>
    <div class="inbound-lock-note">ราคานี้จะถูกเก็บถาวรกับรายการ และไม่เปลี่ยนตามราคาแนะนำในอนาคต</div>
    <div class="inbound-confirm-actions"><button class="btn btn-outline" data-close-inbound-confirm type="button">กลับไปแก้ไข</button><button class="btn btn-primary" id="confirmInboundSave" type="button">ยืนยันบันทึกรับเข้า</button></div>
  </section></div>`;
}
function renderInboundFruitManagement(user) {
  if (!inboundLoaded) { loadInboundData(); return `${renderInboundHeader("จัดการผลไม้ / ราคาแนะนำ", "ราคานี้เป็นค่าเริ่มต้นและผู้บันทึกแก้ราคาจริงได้", user, "manage")}<section class="panel inbound-loading">กำลังโหลดข้อมูล...</section>`; }
  const fruits = inboundData.fruits;
  const today = localDateInputValue();
  return `${renderInboundHeader("จัดการผลไม้ / ราคาแนะนำ", "ราคาแนะนำช่วยกรอกเร็วขึ้น แต่ไม่บังคับราคาของรายการรับเข้า", user, "manage")}${renderInboundStatus()}
    <section class="inbound-management-grid">
      <div class="panel inbound-master-panel"><h3>เพิ่มผลไม้ใหม่</h3><form id="inboundFruitForm" class="inbound-inline-form"><label class="field"><span>ชื่อผลไม้</span><input name="name" maxlength="100" placeholder="เช่น มังคุด" required /></label><button class="btn btn-primary" type="submit">เพิ่มผลไม้</button></form>
        <div class="inbound-fruit-list"><h3>ผลไม้และราคาปัจจุบัน</h3>${fruits.map((fruit) => { const price = inboundRecommendedPrice(fruit.id, today); return `<article><div><strong>${escapeHtml(fruit.name)}</strong><span class="badge">${fruit.status === "Active" ? "ใช้งาน" : "เลิกใช้งาน"}</span></div><b>${price ? `${inboundMoney(price.price_per_kg)} บาท/กก.` : "ยังไม่มีราคาแนะนำ"}</b><small>${price ? `เริ่มใช้ ${escapeHtml(price.effective_date)}` : "ตั้งราคาเพื่อช่วยกรอกอัตโนมัติ"}</small><button class="btn btn-outline" data-price-fruit="${fruit.id}" type="button">ตั้งราคาใหม่</button></article>`; }).join("") || `<p class="empty-cell">ยังไม่มีผลไม้</p>`}</div>
      </div>
      <div class="panel inbound-price-panel"><h3>ตั้งราคาแนะนำใหม่</h3><p>ราคาเก่าจะยังอยู่ในประวัติ และไม่กระทบรายการที่บันทึกแล้ว</p><form id="inboundPriceForm">
        <label class="field"><span>ผลไม้</span><select name="fruit_id" required><option value="">เลือกผลไม้</option>${inboundActiveFruits().map((fruit) => `<option value="${fruit.id}">${escapeHtml(fruit.name)}</option>`).join("")}</select></label>
        <label class="field"><span>ราคาแนะนำต่อกิโล</span><input name="price_per_kg" type="number" min="0.01" step="0.01" required /></label>
        <label class="field"><span>วันที่เริ่มใช้</span><input name="effective_date" type="date" value="${today}" required /></label>
        <label class="field"><span>หมายเหตุ</span><textarea name="note" maxlength="500" rows="3"></textarea></label>
        <div class="inbound-lock-note">ราคาแนะนำใหม่จะไม่แก้ราคาจริงของรายการรับเข้าที่มีอยู่แล้ว</div><button class="btn btn-primary" type="submit">บันทึกราคาแนะนำ</button>
      </form></div>
    </section>`;
}
function renderInboundHistory(user) {
  if (!inboundLoaded) { loadInboundData(); return `${renderInboundHeader("รายการรับเข้า", "ตรวจสอบน้ำหนัก ราคาจริง และยอดเงินย้อนหลัง", user, "history")}<section class="panel inbound-loading">กำลังโหลดข้อมูล...</section>`; }
  const rows = inboundFilteredReceipts();
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.weight_kg || 0), 0);
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const suppliers = [...new Set(inboundData.receipts.map((row) => row.supplier_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));
  const selectedRows = inboundData.receipts.filter((row) => inboundSelectedReceiptIds.has(Number(row.id)));
  const allVisibleSelected = rows.length > 0 && rows.every((row) => inboundSelectedReceiptIds.has(Number(row.id)));
  return `${renderInboundHeader("รายการรับเข้า", "ผลไม้ชนิดเดียวกันสามารถรับคนละราคาได้ โดยเก็บราคาจริงแยกทุกรายการ", user, "history")}${renderInboundStatus()}
    <section class="inbound-metrics"><div><span>น้ำหนักตามตัวกรอง</span><strong>${inboundMoney(totalWeight)}</strong><small>กก.</small></div><div><span>ยอดเงินตามตัวกรอง</span><strong>${inboundMoney(totalAmount)}</strong><small>บาท</small></div><div><span>จำนวนรายการ</span><strong>${rows.length.toLocaleString("th-TH")}</strong><small>รายการ</small></div></section>
    <section class="panel inbound-history-panel"><form id="inboundFilterForm" class="inbound-filters"><label><span>จากวันที่</span><input name="from" type="date" value="${escapeHtml(inboundFilters.from)}" /></label><label><span>ถึงวันที่</span><input name="to" type="date" value="${escapeHtml(inboundFilters.to)}" /></label><label><span>ผู้ส่ง</span><select name="supplier"><option value="">ทั้งหมด</option>${suppliers.map((name) => `<option ${inboundFilters.supplier === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></label><label><span>ผลไม้</span><select name="fruit"><option value="">ทั้งหมด</option>${inboundData.fruits.map((fruit) => `<option value="${fruit.id}" ${inboundFilters.fruit === String(fruit.id) ? "selected" : ""}>${escapeHtml(fruit.name)}</option>`).join("")}</select></label><label class="is-search"><span>ค้นหา</span><input name="search" type="search" value="${escapeHtml(inboundFilters.search)}" placeholder="ชื่อผู้ส่ง หรือหมายเหตุ" /></label><button class="btn btn-primary" type="submit">ค้นหา</button><button class="btn btn-outline" id="clearInboundFilters" type="button">ล้างตัวกรอง</button></form>
      <div class="inbound-selection-bar"><div><strong>เลือกแล้ว <span id="inboundSelectedCount">${selectedRows.length.toLocaleString("th-TH")}</span> รายการ</strong><small>รายการที่ติ๊กจะถูกรวมอยู่ในฟอร์มเดียวกัน</small></div><div><button class="btn btn-outline" id="printSelectedInbound" type="button" ${selectedRows.length ? "" : "disabled"}>พิมพ์</button><button class="btn btn-outline" id="exportSelectedInboundExcel" type="button" ${selectedRows.length ? "" : "disabled"}>Excel</button><button class="btn btn-primary" id="exportSelectedInboundPdf" type="button" ${selectedRows.length ? "" : "disabled"}>PDF</button></div></div>
      <div class="inbound-info-strip">ข้อมูลราคาที่แสดงคือราคาจริง ณ ตอนรับเข้า และจะไม่เปลี่ยนตามราคาแนะนำใหม่</div>
      <div class="table-scroll"><table class="inbound-table"><thead><tr><th class="inbound-check-cell"><input id="selectAllInboundVisible" type="checkbox" ${allVisibleSelected ? "checked" : ""} aria-label="เลือกทุกรายการที่แสดง" /></th><th>วันเวลา</th><th>ผู้ส่ง</th><th>ผลไม้</th><th>น้ำหนัก</th><th class="is-price">ราคา/กก.</th><th>ยอดเงิน</th><th>หมายเหตุ</th><th>ผู้บันทึก</th></tr></thead><tbody>${rows.map((row) => `<tr class="${inboundSelectedReceiptIds.has(Number(row.id)) ? "is-selected" : ""}"><td class="inbound-check-cell"><input class="inbound-row-check" type="checkbox" value="${Number(row.id)}" ${inboundSelectedReceiptIds.has(Number(row.id)) ? "checked" : ""} aria-label="เลือกรายการรับเข้า ${Number(row.id)}" /></td><td>${escapeHtml(new Date(row.received_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }))}</td><td><strong>${escapeHtml(row.supplier_name)}</strong></td><td>${escapeHtml(row.fruit_name)}</td><td class="number-cell">${inboundMoney(row.weight_kg)}</td><td class="number-cell is-price"><strong>${inboundMoney(row.price_per_kg)}</strong></td><td class="number-cell"><strong>${inboundMoney(row.total_amount)}</strong></td><td>${escapeHtml(row.note || "-")}</td><td>${escapeHtml(row.created_by || "-")}</td></tr>`).join("") || `<tr><td colspan="9" class="empty-cell">ไม่พบรายการรับเข้า</td></tr>`}</tbody><tfoot><tr><th></th><th colspan="3">รวมทั้งหมด</th><th>${inboundMoney(totalWeight)} กก.</th><th></th><th>${inboundMoney(totalAmount)} บาท</th><th colspan="2">${rows.length.toLocaleString("th-TH")} รายการ</th></tr></tfoot></table></div>
    </section>`;
}
function renderInboundStatus() {
  if (!inboundMessage) return "";
  return `<div class="inbound-alert ${inboundMessageType === "error" ? "is-error" : "is-success"}" role="alert">${escapeHtml(inboundMessage)}</div>`;
}
function inboundActiveFruits() {
  return inboundData.fruits.filter((fruit) => fruit.status === "Active");
}
function inboundLocalDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function inboundMoney(value) {
  return Number(value || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function inboundRecommendedPrice(fruitId, dateValue = localDateInputValue()) {
  return inboundData.prices
    .filter((price) => Number(price.fruit_id) === Number(fruitId) && String(price.effective_date) <= dateValue)
    .sort((a, b) => `${b.effective_date}|${b.created_at}`.localeCompare(`${a.effective_date}|${a.created_at}`))[0] || null;
}
function inboundLatestSupplierReceipt(supplier, fruitId) {
  const normalized = String(supplier || "").trim().toLocaleLowerCase("th-TH");
  return inboundData.receipts.find((row) =>
    String(row.supplier_name || "").trim().toLocaleLowerCase("th-TH") === normalized &&
    Number(row.fruit_id) === Number(fruitId)
  ) || null;
}
function inboundFilteredReceipts() {
  const search = inboundFilters.search.trim().toLocaleLowerCase("th-TH");
  return inboundData.receipts.filter((row) => {
    const day = String(row.received_at || "").slice(0, 10);
    return (!inboundFilters.from || day >= inboundFilters.from) && (!inboundFilters.to || day <= inboundFilters.to) &&
      (!inboundFilters.supplier || row.supplier_name === inboundFilters.supplier) && (!inboundFilters.fruit || String(row.fruit_id) === inboundFilters.fruit) &&
      (!search || `${row.supplier_name} ${row.fruit_name} ${row.note} ${row.created_by}`.toLocaleLowerCase("th-TH").includes(search));
  });
}
function inboundSelectedRows() {
  return inboundData.receipts.filter((row) => inboundSelectedReceiptIds.has(Number(row.id)));
}
function bindInboundEvents(user, route) {
  if (!inboundLoaded) return;
  if (route === "inbound") {
    const form = document.querySelector("#inboundEntryForm");
    const calculate = () => {
      const weight = Number(form?.elements.weight_kg.value || 0), price = Number(form?.elements.price_per_kg.value || 0), total = Math.round(weight * price * 100) / 100;
      const totalNode = document.querySelector("#inboundCalculatedTotal"), formula = document.querySelector("#inboundFormula");
      if (totalNode) totalNode.textContent = inboundMoney(total); if (formula) formula.textContent = `${inboundMoney(weight)} กก. × ${inboundMoney(price)} บาท = ${inboundMoney(total)} บาท`;
    };
    const suggest = () => {
      if (!form) return; const fruitId = form.elements.fruit_id.value, supplier = form.elements.supplier_name.value.trim(), date = String(form.elements.received_at.value).slice(0, 10);
      const prior = inboundLatestSupplierReceipt(supplier, fruitId), recommended = inboundRecommendedPrice(fruitId, date), chosen = prior || recommended;
      const hint = document.querySelector("#inboundPriceHint");
      if (chosen && !form.elements.price_per_kg.dataset.edited) form.elements.price_per_kg.value = Number(chosen.price_per_kg).toFixed(2);
      if (hint) hint.textContent = prior ? `ครั้งล่าสุด: ${supplier} รับผลไม้นี้ราคา ${inboundMoney(prior.price_per_kg)} บาท/กก. — ใช้ราคานี้หรือแก้ไขได้` : recommended ? `ราคาแนะนำปัจจุบัน ${inboundMoney(recommended.price_per_kg)} บาท/กก. — แก้ไขราคาของรายการนี้ได้` : "ยังไม่มีราคาแนะนำ กรุณากรอกราคาจริงของรายการนี้";
      calculate();
    };
    form?.elements.fruit_id.addEventListener("change", () => { form.elements.price_per_kg.dataset.edited = ""; suggest(); });
    form?.elements.supplier_name.addEventListener("change", suggest); form?.elements.received_at.addEventListener("change", suggest);
    form?.elements.weight_kg.addEventListener("input", calculate); form?.elements.price_per_kg.addEventListener("input", () => { form.elements.price_per_kg.dataset.edited = "1"; calculate(); });
    form?.addEventListener("reset", () => window.setTimeout(() => { form.elements.received_at.value = inboundLocalDateTime(); calculate(); }, 0));
    form?.addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(form), fruit = inboundData.fruits.find((item) => String(item.id) === String(data.get("fruit_id"))); const weight = Number(data.get("weight_kg")), price = Number(data.get("price_per_kg")); if (!fruit || !String(data.get("supplier_name")).trim() || weight <= 0 || price <= 0) return; inboundConfirmPayload = { received_at: new Date(String(data.get("received_at"))).toISOString(), supplier_name: String(data.get("supplier_name")).trim(), fruit_id: Number(fruit.id), fruit_name: fruit.name, weight_kg: weight, price_per_kg: price, total_amount: Math.round(weight * price * 100) / 100, note: String(data.get("note") || "") }; render(); });
    document.querySelectorAll("[data-close-inbound-confirm]").forEach((node) => node.addEventListener("click", (event) => { if (event.target.closest("[data-inbound-confirm-panel]") && !event.target.hasAttribute("data-close-inbound-confirm")) return; inboundConfirmPayload = null; render(); }));
    document.querySelector("#confirmInboundSave")?.addEventListener("click", async (event) => { const button = event.currentTarget; button.disabled = true; button.textContent = "กำลังบันทึก..."; try { const payload = { ...inboundConfirmPayload, client_uid: `inbound-${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}` }; delete payload.fruit_name; delete payload.total_amount; await cloudApiRequest("/api/inbound/receipts", { method: "POST", body: JSON.stringify(payload), timeoutMs: 20000 }); inboundConfirmPayload = null; inboundMessage = "บันทึกรายการรับเข้าสำเร็จ"; inboundMessageType = "success"; await loadInboundData(true); } catch (error) { inboundMessage = error.message; inboundMessageType = "error"; render(); } });
  }
  if (route === "inbound-fruits") {
    document.querySelector("#inboundFruitForm")?.addEventListener("submit", async (event) => { event.preventDefault(); const button = event.currentTarget.querySelector("button"); button.disabled = true; try { await cloudApiRequest("/api/inbound/fruits", { method: "POST", body: JSON.stringify({ name: new FormData(event.currentTarget).get("name") }) }); inboundMessage = "เพิ่มผลไม้สำเร็จ"; inboundMessageType = "success"; await loadInboundData(true); } catch (error) { inboundMessage = error.message; inboundMessageType = "error"; render(); } });
    document.querySelectorAll("[data-price-fruit]").forEach((button) => button.addEventListener("click", () => { const select = document.querySelector("#inboundPriceForm select[name='fruit_id']"); if (select) { select.value = button.dataset.priceFruit; select.focus(); } }));
    document.querySelector("#inboundPriceForm")?.addEventListener("submit", async (event) => { event.preventDefault(); const button = event.currentTarget.querySelector("button[type='submit']"); button.disabled = true; const data = Object.fromEntries(new FormData(event.currentTarget)); try { await cloudApiRequest("/api/inbound/prices", { method: "POST", body: JSON.stringify(data) }); inboundMessage = "บันทึกราคาแนะนำใหม่แล้ว รายการเก่าไม่ถูกเปลี่ยน"; inboundMessageType = "success"; await loadInboundData(true); } catch (error) { inboundMessage = error.message; inboundMessageType = "error"; render(); } });
  }
  if (route === "inbound-history") {
    document.querySelector("#inboundFilterForm")?.addEventListener("submit", (event) => { event.preventDefault(); inboundFilters = Object.fromEntries(new FormData(event.currentTarget)); render(); });
    document.querySelector("#clearInboundFilters")?.addEventListener("click", () => { inboundFilters = { from: "", to: "", supplier: "", fruit: "", search: "" }; render(); });
    document.querySelectorAll(".inbound-row-check").forEach((checkbox) => checkbox.addEventListener("change", () => {
      const id = Number(checkbox.value);
      if (checkbox.checked) inboundSelectedReceiptIds.add(id); else inboundSelectedReceiptIds.delete(id);
      render();
    }));
    document.querySelector("#selectAllInboundVisible")?.addEventListener("change", (event) => {
      inboundFilteredReceipts().forEach((row) => event.currentTarget.checked ? inboundSelectedReceiptIds.add(Number(row.id)) : inboundSelectedReceiptIds.delete(Number(row.id)));
      render();
    });
    document.querySelector("#printSelectedInbound")?.addEventListener("click", printSelectedInboundReceipts);
    document.querySelector("#exportSelectedInboundExcel")?.addEventListener("click", () => exportSelectedInbound("excel"));
    document.querySelector("#exportSelectedInboundPdf")?.addEventListener("click", () => exportSelectedInbound("pdf"));
  }
}
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function render(){let route=location.hash.replace('#/','')||'stock';const module=modules.find(m=>m.id===route)||modules[0];document.querySelector('#st-content').innerHTML=renderModuleContent(user,module);document.querySelector('#st-title').textContent=module.label;document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{location.hash='#/'+b.dataset.route;});if(route.startsWith('inbound'))bindInboundEvents(user,route);}
window.addEventListener('hashchange',render);render();
