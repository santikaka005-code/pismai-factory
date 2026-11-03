/* LAN discovery runs in the opt-in Desktop bridge, never on Render. */
window.ProductionPull = (() => {
  const state = { devices: [], selected: '', start: '', end: '', fruit: '', pile: '', busy: false, message: '', scanned: false, pairChallenge: '' };
  function icon() {
    return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="26" height="19" rx="2"/><path d="M16 22v6m-6 0h12"/></svg>';
  }
  let tablePreview = null, tablePage = 0;
  function previewTable(preview, e) {
    if (tablePreview !== preview) { tablePreview = preview; tablePage = 0; }
    const records = preview.payload?.records || [];
    const accepted = new Set(preview.accepted.map(r => String(r.desktop_import?.record_id || '')));
    const errors = new Map(preview.rejected.map(r => [r.row, r.reason]));
    const pages = Math.max(1, Math.ceil(records.length / 100));
    tablePage = Math.min(tablePage, pages - 1);
    const number = (v, digits) => v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v).toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
    const total = preview.accepted.reduce((sum, r) => sum + Number(r.desktop_import?.tenths || 0), 0) / 10;
    return `<div class="pull-summary"><div><span>ดึงจากเครื่องแล้ว</span><strong>${records.length.toLocaleString('th-TH')} รายการ</strong></div><div><span>ผ่านตรวจเบื้องต้น</span><strong>${preview.accepted.length.toLocaleString('th-TH')} รายการ</strong></div><div><span>ต้องตรวจสอบ</span><strong>${preview.rejected.length.toLocaleString('th-TH')} รายการ</strong></div><div><span>น้ำหนักหลังตัด · เฉพาะที่ผ่าน</span><strong>${number(total, 1)} กก.</strong></div></div>
      <p>รับข้อมูลจากเครื่องแล้ว · ยังไม่ได้ส่งเข้าคิวหรือยืนยันการบันทึกลงฐานข้อมูลเว็บ</p>
      <div class="pull-table-wrap" role="region" aria-label="รายการชั่งที่ดึงจากเครื่อง" tabindex="0"><table class="pull-table"><caption>รายละเอียดรายการที่ดึงมาล่าสุด</caption><thead><tr>${['ลำดับ / รหัสรายการ', 'วันที่ / เวลาชั่ง', 'พนักงาน', 'ผลไม้ / ประเภท', 'กอง', 'ก่อนตัด (กก.)', 'หลังตัด (กก.)', 'ผลตรวจ'].map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${records.slice(tablePage * 100, (tablePage + 1) * 100).map((r, index) => {
        const row = tablePage * 100 + index + 1;
        const ok = !errors.has(row) && accepted.has(String(r?.id || ''));
        const validated = preview.accepted.find(a => a.desktop_import?.record_id === r?.id);
        const demo = String(r?.device || '').includes('APWS-SIMULATOR') || String(r?.raw_frame || '').includes('APWS-SIMULATOR');
        return `<tr class="${ok ? '' : 'pull-row-error'}"><td>${row}<small>${e(r?.id || '—')}</small>${demo ? '<span class="pull-badge pull-demo">ทดสอบชั่ง</span>' : ''}</td><td>${e(r?.record_date || '—')}<small>${e(validated?.record_time || String(r?.recorded_at || '').slice(11, 19) || '—')}</small></td><td>${e(r?.employee_code || '—')}<small>${e(r?.employee_name || r?.fullname || validated?.employee_name || '—')}</small></td><td>${e(r?.fruit_name || r?.fruit_id || '—')}<small>${e(r?.kind_name || r?.kind_id || '—')}</small></td><td>${e(r?.pile_no ?? r?.pile ?? '—')}</td><td class="pull-number">${number(r?.raw_kg, 3)}</td><td class="pull-number"><strong>${number(r?.weight_kg, 1)}</strong></td><td><span class="pull-badge ${ok ? 'pull-ok' : 'pull-error'}">${ok ? 'พร้อมเข้าคิว' : 'ไม่ผ่านตรวจ'}</span>${!ok ? `<small>${e(errors.get(row) || 'ไม่พบผลตรวจรายการ')}</small>` : ''}</td></tr>`;
      }).join('')}</tbody></table></div><div class="production-pull-toolbar pull-pagination"><span>แสดง ${records.length ? tablePage * 100 + 1 : 0}–${Math.min((tablePage + 1) * 100, records.length)} จาก ${records.length} รายการ · หน้า ${tablePage + 1}/${pages}</span><button type="button" class="production-pull-file" data-pull-page="-1" ${tablePage === 0 ? 'disabled' : ''}>ก่อนหน้า</button><button type="button" class="production-pull-file" data-pull-page="1" ${tablePage + 1 >= pages ? 'disabled' : ''}>ถัดไป</button></div>`;
  }
  async function api(path, body = {}) {
    if (relayRequest && !useLocal) return relayRequest('/api/apws-relay/'+path, {method:'POST',body:JSON.stringify(body),timeoutMs:45000});
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(`http://127.0.0.1:19766/v1/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `ตัวเชื่อมตอบกลับ HTTP ${response.status}`);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('ตัวเชื่อมตอบช้าเกินไป ตรวจเครื่องต้นทางแล้วค้นหาใหม่');
      if (error instanceof TypeError) throw new Error('เปิด APWS รุ่นประกวดบนเครื่องที่ใช้เว็บนี้ แล้วค้นหาใหม่ · หากเบราว์เซอร์ถาม ให้อนุญาตเครือข่ายภายใน');
      throw error;
    } finally { clearTimeout(timer); }
  }
  let relayRequest = null, useLocal = false;
  function render({ date, escape: e, canImport, fruits = [], preview, importMessage = '', importBusy = false }) {
    state.start ||= date; state.end ||= date;
    const device = state.devices.find(d => d.device_id === state.selected), busy = state.busy || importBusy;
    return `<section class="production-pull" aria-labelledby="productionPullTitle">
      <button type="button" class="production-pull-back" data-close-production-pull>← กลับไปบันทึกผลผลิต</button>
      <header class="production-pull-heading"><span>APWS Desktop · ${useLocal ? 'LAN' : 'เชื่อมผ่านเว็บ'}</span><h2 id="productionPullTitle" tabindex="-1">ดึงข้อมูลจากเครื่องไลน์ผลิต</h2><p>${useLocal ? 'โหมด LAN ต้องเปิด APWS บนเครื่องที่ใช้เว็บด้วย' : 'เปิด APWS เฉพาะเครื่องชั่ง · เครื่องนี้ใช้แค่เบราว์เซอร์ได้'}</p></header>
      ${!useLocal ? `<section class="production-pull-options"><h3>เชื่อมเครื่องชั่งผ่านเว็บ</h3><p>ที่ APWS เครื่องชั่ง กด “เชื่อม / หยุดเชื่อมผ่านเว็บ” แล้วกรอกรหัส 10 หลักด้านล่าง ทั้งสองเครื่องต้องมีอินเทอร์เน็ต หากปิดแอปหรือเซิร์ฟเวอร์เริ่มใหม่ ให้เชื่อมรหัสใหม่</p><label>รหัสจาก APWS เครื่องชั่ง<input data-pull-cloud-code inputmode="numeric" autocomplete="off" maxlength="16" placeholder="12345 67890" ${busy ? 'disabled' : ''}></label><button type="button" class="production-pull-file" data-pull-cloud-claim ${busy || !canImport ? 'disabled' : ''}>เชื่อมเครื่องชั่ง</button></section>` : ''}
      <div class="production-pull-toolbar"><button type="button" class="production-pull-primary" data-pull-search ${busy || !canImport ? 'disabled' : ''}>${icon()}${state.busy ? 'กำลังทำงาน…' : 'ค้นหาเครื่อง'}</button><span>${useLocal ? 'เปิด APWS ทั้งสองเครื่อง · ใช้ LAN/Wi-Fi วงเดียวกัน' : 'ค้นหาเครื่องที่เชื่อมกับบัญชีเว็บนี้ · เปิด APWS ที่เครื่องชั่งค้างไว้'}</span></div>
      ${!canImport ? '<p class="alert alert-error">การเชื่อมและนำเข้าข้อมูลใช้สิทธิ์ C6 ขึ้นไป</p>' : ''}
      <p role="status" aria-live="polite" class="production-pull-status">${e(state.message)}</p>
      <div class="production-pull-devices">${state.devices.map(d => `<button type="button" class="production-pull-device ${state.selected === d.device_id ? 'is-selected' : ''}" data-pull-device="${e(d.device_id)}" aria-pressed="${state.selected === d.device_id}" ${busy || !d.online || !canImport ? 'disabled' : ''}>${icon()}<strong>${e(d.name)}</strong><span>${e(d.host)} · ${d.online ? (d.paired ? 'พร้อมใช้งาน · จับคู่แล้ว' : 'เปิดแชร์ · จับคู่ครั้งแรก') : 'ติดต่อไม่ได้'}</span>${d.error ? `<small>${e(d.error)}</small>` : ''}</button>`).join('')}</div>
      ${!state.devices.length ? `<div class="production-pull-empty"><h3>${state.scanned ? 'ยังไม่พบเครื่องที่เชื่อมไว้' : 'เชื่อมเครื่องชั่งแล้วกดค้นหา'}</h3><p>${useLocal ? 'เปิด APWS ทั้งสองเครื่อง ตรวจ LAN / Firewall' : 'ติดตั้ง APWS รุ่นเชื่อมผ่านเว็บที่เครื่องชั่ง แล้วกรอกรหัสจากแอปด้านบน'}</p></div>` : ''}
      ${device && !device.paired ? `<section class="production-pull-options"><h3>เชื่อม ${e(device.name)} ครั้งแรก</h3><p>กดขอเชื่อม แล้วกดอนุญาตที่ APWS เครื่องต้นทางเพียงครั้งแรก ไม่ต้องกรอก IP หรือคัดลอกรหัส</p>${state.pairChallenge ? `<p role="status">รออนุญาตที่เครื่องต้นทาง · ตรวจว่ารหัสตรงกัน: <strong>${e(state.pairChallenge)}</strong></p>` : ''}<button type="button" class="production-pull-primary" data-pull-pair ${busy || !canImport ? 'disabled' : ''}>ขอเชื่อมและจำเครื่องนี้</button><details><summary>ใช้รหัสจับคู่แบบเดิม</summary><label>รหัสจับคู่<input type="password" data-pull-code autocomplete="off" placeholder="APWS1.…" ${busy ? 'disabled' : ''}></label></details></section>` : ''}
      ${device?.paired ? `<section class="production-pull-options"><h3>เตรียมเครื่องชั่งครั้งแรก</h3><p>ส่งรายชื่อพนักงานและผลไม้จากเว็บให้เครื่องนี้ ก่อนทดสอบด้วยรหัสพนักงานของเว็บ</p><button type="button" class="production-pull-file" data-pull-masters ${busy || !canImport ? 'disabled' : ''}>ส่งรายชื่อและผลไม้ให้เครื่องนี้</button></section>` : ''}
      <section class="production-pull-options"><div class="production-pull-options-head"><h3>ข้อมูลที่ต้องการ</h3><span>${device ? e(device.name) : 'ยังไม่ได้เลือกเครื่อง'}</span></div>
      <fieldset ${busy || !canImport ? 'disabled' : ''}><legend class="production-pull-sr">เลือกช่วงข้อมูล</legend>
        <label>ตั้งแต่<input type="date" data-pull-field="start" value="${e(state.start)}"></label><label>ถึง<input type="date" data-pull-field="end" value="${e(state.end)}"></label>
        <label>ผลไม้<select data-pull-field="fruit"><option value="">ทั้งหมด</option>${fruits.map(f => `<option value="${e(f.id)}" ${f.id === state.fruit ? 'selected' : ''}>${e(f.label)}</option>`).join('')}</select></label>
        <label>หมายเลขกอง (ว่าง = ทั้งหมด)<input type="number" min="1" step="1" data-pull-field="pile" value="${e(state.pile)}"></label>
      </fieldset><footer><span>ไม่เกิน 31 วัน · 5,000 รายการต่อครั้ง</span><button type="button" class="production-pull-primary" data-pull-preview ${busy || !canImport || !device?.online || !device?.paired ? 'disabled' : ''}>ตรวจรายการก่อนนำเข้า</button></footer></section>
      ${importMessage ? `<p role="status" class="production-pull-status">${e(importMessage)}</p>` : ''}
      ${preview && canImport ? `<section class="production-pull-options"><h3>ตรวจข้อมูลก่อนยืนยัน</h3><p>${e(preview.fileName)} · พร้อมนำเข้า ${preview.accepted.length} รายการ · ต้องตรวจสอบ ${preview.rejected.length} รายการ</p>
        ${previewTable(preview, e)}
        ${preview.rejected.length ? `<details><summary>รายการที่ไม่นำเข้า</summary><ul>${preview.rejected.slice(0, 100).map(r => `<li>แถว ${r.row}: ${e(r.reason)}</li>`).join('')}</ul>${preview.rejected.length > 100 ? '<p>แสดง 100 รายการแรก กรุณาแบ่งช่วงเพื่อตรวจเพิ่มเติม</p>' : ''}</details>` : ''}
        ${preview.review ? `<p class="alert alert-error">พบข้อมูลทับกับไฟล์เดิม การยืนยันจะนำเข้าทั้งชุดและนับยอดเพิ่ม</p><ul>${(preview.review.matches || []).map(m => `<li>${e(m.file_name)}: ตรง ${m.matched}/${m.total} รายการ</li>`).join('')}</ul>` : ''}
        <div class="production-pull-toolbar"><button type="button" class="production-pull-primary" data-pull-confirm ${busy || !preview.accepted.length || preview.blocked ? 'disabled' : ''}>${preview.review ? 'ตรวจสอบแล้ว ยืนยันรับทั้งชุด' : 'ยืนยันส่งเข้าคิวบันทึก'}</button><button type="button" class="production-pull-file" data-pull-cancel ${busy ? 'disabled' : ''}>ยกเลิกชุดนี้</button></div></section>` : ''}
      <details class="production-pull-options"><summary>LAN แบบเดิม / นำเข้าจากไฟล์</summary><p>โหมด LAN เดิมต้องเปิด APWS บนเครื่องเปิดเว็บด้วย</p><button type="button" class="production-pull-file" data-pull-switch>${useLocal ? 'ใช้การเชื่อมผ่านเว็บ' : 'ใช้ LAN แบบเดิม'}</button><button type="button" class="production-pull-file" data-route="pf-desktop-app">นำเข้าจากไฟล์ APWS</button></details>
      <p class="production-pull-note">ส่งน้ำหนักเมื่อกดตรวจรายการเท่านั้น · ไม่มีการบันทึกเข้าฐานเว็บจนกว่าจะยืนยัน</p></section>`;
  }
  function bind({ canImport, refresh, clearPreview, preview, confirm, isImportBusy, loadMasters, cloudRequest }) {
    relayRequest = cloudRequest || null;
    const root = document.querySelector('.production-pull');
    if (!root) return;
    root.querySelectorAll('[data-pull-page]').forEach(button => button.addEventListener('click', () => {
      tablePage = Math.max(0, tablePage + Number(button.dataset.pullPage)); refresh();
    }));
    const run = async (action) => {
      if (!canImport() || state.busy || isImportBusy()) return;
      state.busy = true; state.message = ''; refresh();
      try { await action(); } catch (error) { state.message = error.message; }
      finally { state.busy = false; refresh(); }
    };
    const scan = async () => {
      const data = await api('discover'); state.devices = data.devices; state.scanned = true;
      if (!state.devices.some(d => d.device_id === state.selected && d.online)) state.selected = '';
      state.message = `พบเครื่องที่ติดต่อได้ ${state.devices.filter(d => d.online).length} เครื่อง · เลือกเครื่องที่ต้องการดึงข้อมูล`;
    };
    root.querySelector('[data-pull-switch]')?.addEventListener('click', () => {
      if (state.busy || isImportBusy()) return;
      useLocal=!useLocal;state.devices=[];state.selected='';state.message='';state.scanned=false;clearPreview();refresh();
    });
    root.querySelector('[data-pull-cloud-claim]')?.addEventListener('click', () => {
      const code=root.querySelector('[data-pull-cloud-code]').value;
      run(async()=>{await api('claim',{code});clearPreview();await scan();state.message='เชื่อมเครื่องแล้ว เลือกเครื่องด้านล่างเพื่อดึงข้อมูล';});
    });
    root.querySelector('[data-pull-search]')?.addEventListener('click', () => run(async () => {
      clearPreview(); state.devices = []; state.selected = ''; await scan();
    }));
    root.querySelectorAll('[data-pull-device]').forEach(button => button.addEventListener('click', () => {
      if (!canImport() || state.busy || isImportBusy()) return;
      state.selected = button.dataset.pullDevice; clearPreview(); refresh();
    }));
    root.querySelectorAll('[data-pull-field]').forEach(input => input.addEventListener('change', () => {
      state[input.dataset.pullField] = input.value; clearPreview(); refresh();
    }));
    root.querySelector('[data-pull-pair]')?.addEventListener('click', () => {
      const code = root.querySelector('[data-pull-code]').value;
      state.pairChallenge = code ? '' : String(Math.floor(Math.random() * 900000) + 100000);
      run(async () => {
        try { await api('pair', { device_id: state.selected, code, challenge: state.pairChallenge }); await scan(); }
        finally { state.pairChallenge = ''; }
      });
    });
    root.querySelector('[data-pull-masters]')?.addEventListener('click', () => run(async () => {
      if (!loadMasters) throw Error('รีเฟรชหน้าเว็บเพื่อส่งรายชื่อ');
      const payload = await loadMasters();
      const result = await api('masters', { device_id: state.selected, ...payload });
      state.message = `พร้อมชั่ง · ส่งพนักงาน ${result.employees} คน และผลไม้ ${result.fruits} ชนิดแล้ว · กลับไปกดทดสอบชั่งใน APWS ได้เลย`;
    }));
    root.querySelector('[data-pull-preview]')?.addEventListener('click', () => run(async () => {
      clearPreview();
      if (!state.start || !state.end || state.start > state.end || (Date.parse(state.end) - Date.parse(state.start)) / 86400000 > 30) throw new Error('เลือกช่วงวันที่ถูกต้องและไม่เกิน 31 วัน');
      const payload = await api('pull', { device_id: state.selected, start: state.start, end: state.end, fruit: state.fruit, pile: state.pile });
      if (!canImport()) return;
      if (!payload.records?.length) throw new Error('ไม่พบข้อมูลในเครื่องและช่วงที่เลือก ไม่มีการบันทึกข้อมูล');
      preview(payload); state.message = 'รับข้อมูลจากเครื่องแล้ว กรุณาตรวจรายการและกดยืนยัน';
    }));
    root.querySelector('[data-pull-confirm]')?.addEventListener('click', () => { if (canImport() && !state.busy && !isImportBusy()) confirm(); });
    root.querySelector('[data-pull-cancel]')?.addEventListener('click', () => { clearPreview(); refresh(); });
  }
  return { render, icon, bind };
})();
