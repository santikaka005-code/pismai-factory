/* Production cold-room stock. Server-authoritative transactions; no demo inventory. */
(() => {
  'use strict';
  const root = document.getElementById('stock-cold-room');
  const readOnly = new URLSearchParams(location.search).get('readonly') === '1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n).toLocaleString('th-TH');
  const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${({box:'<path d="m3 6 9-4 9 4v12l-9 4-9-4Z M3 6l9 4 9-4 M12 10v12 M7 4l9 4"/>',in:'<path d="M12 3v12m-5-5 5 5 5-5 M4 15v6h16v-6"/>',out:'<path d="M12 16V3m-5 5 5-5 5 5 M4 15v6h16v-6"/>',room:'<path d="M3 21V3h18v18 M8 21v-7h8v7 M7 7h3m4 0h3 M7 10h3m4 0h3"/>',plus:'<path d="M12 5v14 M5 12h14"/>',move:'<path d="M3 12h18m-4-4 4 4-4 4 M7 8l-4 4 4 4"/>'})[name] || ''}</svg>`;
  const locations = room => state.locations.filter(row=>row.room===room).map(row=>row.slot);
  let state;
  let toastTimer;
  const blankDraft=()=>({product:'',lot:'',boxes:36,kgPerBox:20,owner:'own',customer:'',slot:'',source:'',reference:''});
  function initial(){return {tab:'overview',room:'1',filter:'all',selected:null,move:null,pallets:[],pending:[],movements:[],locations:[],draft:blankDraft()};}
  let ready=false,busy=false,loading=false,error='';
  const session=()=>{try{return JSON.parse(sessionStorage.getItem('apws_contest_session')||'null');}catch{return null;}};
  const actorKey=String(session()?.user?.id||session()?.user?.username||'');
  const pendingKey='pismai-cold-stock-pending:'+actorKey;
  let pendingWrite=null;
  try{pendingWrite=JSON.parse(sessionStorage.getItem(pendingKey)||'null');}catch{}
  const canWrite=()=>!readOnly && /^C[4-7]$/.test(session()?.user?.level||'') && actorKey===String(session()?.user?.id||session()?.user?.username||'');
  const uid=()=>`cold-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join('')}`;
  async function request(path,body){
    if(!canWrite()){const e=new Error('กรุณาเข้าสู่ระบบด้วยบัญชี C4 ขึ้นไป');e.status=403;throw e;}
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
    try{
      const base=location.protocol==='file:'?'https://pf-systempro-factory.onrender.com':location.origin;
      const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Session-Token':session().token},body:body?JSON.stringify(body):undefined,signal:controller.signal});
      const result=await response.json();
      if(!response.ok){const e=new Error(result.error||'เชื่อมต่อสต็อกไม่สำเร็จ');e.status=response.status;throw e;}
      return result.data;
    }finally{clearTimeout(timer);}
  }
  const pallet=row=>({...row,id:String(row.id),room:row.room||'',slot:row.slot||'',kgPerBox:Number(row.kg_per_box),date:row.received_at?new Date(row.received_at).toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok'}):''});
  async function refresh(){
    if(loading)return;
    capture();loading=true;ready=false;error='';render();
    try{
      const data=await request('/api/cold-stock/snapshot');
      if(data?.schema_version!==1||!['locations','pallets','movements'].every(k=>Array.isArray(data[k])))throw new Error('ข้อมูลห้องเย็นไม่ครบ กรุณาโหลดใหม่');
      state.locations=data.locations;
      state.pallets=data.pallets.filter(p=>p.status==='stored').map(pallet);
      state.pending=data.pallets.filter(p=>p.status==='pending').map(pallet);
      state.movements=data.movements.map(m=>({...m,...pallet(m.after_state),id:m.id,type:({stage:'รอจัดเก็บ',receive:'รับเข้า',store:'รับเข้า',move:'ย้าย',dispatch:'จ่ายออก'})[m.action],boxes:m.boxes,weight:Number(m.weight),day:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(m.created_at)),time:new Date(m.created_at).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}),detail:[m.before_state?.slot?`${m.before_state.room}/${m.before_state.slot} →`:'',m.after_state.slot?`${m.after_state.room}/${m.after_state.slot}`:'รอจัดเก็บ',m.recipient,m.reference,`ผู้บันทึก: ${m.created_by}`].filter(Boolean).join(' · ')}));
      ready=true;
    }catch(e){error=e.message||'โหลดข้อมูลไม่ได้';}finally{loading=false;render();}
  }
  async function save(payload){
    if(busy||loading||!ready||!canWrite())return;
    capture();
    if(!pendingWrite){pendingWrite={...payload,client_uid:uid()};try{sessionStorage.setItem(pendingKey,JSON.stringify(pendingWrite));}catch{}}
    let savedSuccessfully=false;
    busy=true;error='';render();
    try{
      const saved=await request('/api/cold-stock/movements',pendingWrite);
      if(!saved?.after_state)throw new Error('ยังยืนยันผลบันทึกไม่ได้ กรุณาลองรายการเดิมอีกครั้ง');
      pendingWrite=null;try{sessionStorage.removeItem(pendingKey);}catch{}
      state.draft=blankDraft();state.move=null;state.selected=String(saved.pallet_id);
      if(saved.after_state.room)state.room=saved.after_state.room;
      await refresh();
      savedSuccessfully=true;
    }catch(e){
      if([400,404,409].includes(e.status)){pendingWrite=null;try{sessionStorage.removeItem(pendingKey);}catch{}await refresh();}
      error=e.message||'ยังยืนยันผลบันทึกไม่ได้ กดลองรายการเดิมอีกครั้ง';
    }finally{busy=false;render();if(savedSuccessfully&&ready)toast('บันทึกสต็อกห้องเย็นสำเร็จ');}
  }
  const kg = p => p.boxes * p.kgPerBox;
  const ownerLabel = p => p.owner === 'own' ? 'ของเรา' : `ฝากแช่ · ${p.customer}`;
  const badge = p => `<span class="sp-owner-badge ${p.owner === 'guest'?'guest':''}">${esc(ownerLabel(p))}</span>`;
  const totals = () => ({weight:state.pallets.reduce((s,p)=>s+kg(p),0), boxes:state.pallets.reduce((s,p)=>s+p.boxes,0), own:state.pallets.filter(p=>p.owner==='own').reduce((s,p)=>s+kg(p),0), guest:state.pallets.filter(p=>p.owner==='guest').reduce((s,p)=>s+kg(p),0)});
  function toast(text) {
    document.getElementById('sp-toast')?.remove();
    const node = document.createElement('div');node.id='sp-toast';node.className='sp-toast';node.role='status';node.textContent=text;root.append(node);
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.remove(),5000);
  }
  function roomMap() {
    const pallets = state.pallets.filter(p=>p.room===state.room);
    const slots = locations(state.room).map((slot,i)=>{
      const p = pallets.find(p=>p.slot===slot);
      const filtered = p && state.filter !== 'all' && p.owner !== state.filter;
      const content = p ? `<strong>${filtered?'สินค้าอีกประเภท':esc(p.product)}</strong>${filtered?'':`<span class="sp-boxes" aria-hidden="true">${Array.from({length:Math.min(p.boxes,36)},()=>'<i></i>').join('')}</span><span class="sp-slot-label">${icon('box')} ${fmt(p.boxes)} กล่อง · ${fmt(kg(p))} กก.</span><small>${esc(ownerLabel(p))} · ${p.id}</small>`}` : '<strong style="font-weight:400">＋</strong><small>ว่าง · เลือกจัดเก็บ</small>';
      return `${i===8?'<div class="sp-aisle" style="grid-column:1/-1">ทางเดิน / พื้นที่เคลื่อนย้าย — ไม่วางสินค้า</div>':''}<button class="sp-slot ${p?'occupied':''} ${p?.owner==='guest'?'guest':''} ${state.selected===p?.id && p?'selected':''}" type="button" data-slot="${slot}" ${p?`data-pallet="${p.id}" draggable="true"`:''} aria-label="ตำแหน่ง ${slot} ${p?esc(`${p.product} ${p.boxes} กล่อง ${ownerLabel(p)}`):'ว่าง'}"><span class="sp-slot-code">${slot}</span>${content}</button>`;
    }).join('');
    return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>ตำแหน่งสินค้าในห้องเย็น</h2><p>มองจากด้านบน · คลิกพาเลตเพื่อดูรายละเอียด</p></div><span class="sp-tag">ผังรหัสตำแหน่ง · ไม่แสดงสัดส่วนจริง</span></div><div class="sp-tools"><div class="sp-room-tabs">${['1','2'].map(r=>`<button type="button" data-room="${r}" class="${r===state.room?'active':''}">ห้องเย็น ${r}</button>`).join('')}</div><div class="sp-legend"><span><i class="sp-dot"></i>ของเรา</span><span><i class="sp-dot guest"></i>ฝากแช่</span><span><i class="sp-dot empty"></i>ว่าง</span></div></div><div class="sp-tools" style="padding-top:0"><span class="sp-help">สีบอกเจ้าของสินค้า · กล่องและพาเลตใช้สีเดียวกัน</span><select class="sp-filter" id="sp-filter" aria-label="กรองเจ้าของสินค้า"><option value="all">เจ้าของทั้งหมด</option><option value="own" ${state.filter==='own'?'selected':''}>สินค้าของเรา</option><option value="guest" ${state.filter==='guest'?'selected':''}>สินค้าฝากแช่</option></select></div><div class="sp-map-wrap"><div class="sp-map"><div class="sp-map-caption"><span>COLD ROOM 0${state.room}</span><span>${locations(state.room).length} ตำแหน่ง</span></div><div class="sp-slots">${slots}</div><div class="sp-door">ประตูเข้า–ออก</div></div><div class="sp-room-foot"><span>ใช้แล้ว ${pallets.length} / ${locations(state.room).length} ตำแหน่ง</span><span>${fmt(pallets.reduce((s,p)=>s+p.boxes,0))} กล่อง · ${fmt(pallets.reduce((s,p)=>s+kg(p),0))} กก.</span></div><p class="sp-note">ลากรายการรอจัดเก็บลงช่องว่าง แล้วตรวจและยืนยันรับเข้า หรือเลือกช่องว่างแล้วกรอกฟอร์ม</p></div></section>`;
  }
  function receiptForm() {
    const d=state.draft;
    const options=locations(state.room).filter(slot=>!state.pallets.some(p=>p.room===state.room&&p.slot===slot));
    return `<section class="sp-panel" id="sp-receipt"><div class="sp-panel-head"><div><h2>รับสินค้าสำเร็จเข้าห้องเย็น</h2><p>รับจากการผลิต หรือรับฝากแช่ · ตรวจนับสินค้าจริงก่อนยืนยัน</p></div></div><form class="sp-form" id="sp-receipt-form"><div class="sp-owner" aria-label="ประเภทเจ้าของ"><button type="button" data-owner="own" aria-pressed="${d.owner==='own'}" class="${d.owner==='own'?'active':''}">● สินค้าของเรา</button><button type="button" data-owner="guest" aria-pressed="${d.owner==='guest'}" class="guest ${d.owner==='guest'?'active':''}">● สินค้าฝากแช่</button></div>${d.owner==='guest'?`<label class="sp-field">ชื่อเจ้าของ / ผู้ฝาก<input name="customer" value="${esc(d.customer)}" maxlength="100" required placeholder="ระบุเจ้าของสินค้า"></label>`:''}<label class="sp-field">สินค้าแปรรูป<input name="product" value="${esc(d.product)}" maxlength="100" required></label><label class="sp-field">เลขเอกสาร / อ้างอิง<input name="reference" value="${esc(d.reference||'')}" maxlength="160"></label><label class="sp-field">ล็อตสินค้า<input name="lot" value="${esc(d.lot)}" maxlength="80" placeholder="เช่น M-004" required></label><div class="sp-field-row"><label class="sp-field">จำนวนกล่อง / พาเลต<input name="boxes" type="number" min="1" max="1000" step="1" value="${d.boxes}" required></label><label class="sp-field">น้ำหนัก / กล่อง<input name="kgPerBox" type="number" min="0.01" max="1000" step="0.01" value="${d.kgPerBox}" required></label></div><div class="sp-total"><span>น้ำหนักรวม <small>กก.</small></span><strong id="sp-form-weight">${fmt(d.boxes*d.kgPerBox)}</strong></div><label class="sp-field">ตำแหน่งในห้องเย็น ${state.room}<select name="slot" required><option value="">เลือกตำแหน่งว่าง</option>${options.map(s=>`<option ${s===d.slot?'selected':''}>${s}</option>`).join('')}</select></label>${d.source?`<p class="sp-help">อ้างอิงรายการรอจัดเก็บ ${esc(d.source)} · ยังไม่นับเป็นสต็อก</p>`:''}<button class="sp-button sp-primary" type="submit">${icon('in')} ยืนยันรับเข้า</button>${!d.source?'<button class="sp-button" name="stage" value="1" type="submit" formnovalidate>บันทึกรอจัดเก็บ (ยังไม่เพิ่มยอด)</button>':''}<p class="sp-help">1 รายการ = 1 พาเลต · 36 กล่องเป็นค่าเริ่มต้น ปรับเพิ่มได้<br>ระบุน้ำหนักต่อกล่องตามสินค้าจริง</p></form></section>`;
  }
  function detail() {
    const p=state.pallets.find(p=>p.id===state.selected);if(!p)return '';
    return `<section class="sp-panel"><div class="sp-panel-head"><h2>พาเลต ${p.id}</h2><button class="sp-button" type="button" data-close-detail aria-label="ปิดรายละเอียด">×</button></div><div class="sp-detail">${badge(p)}<h3>${esc(p.product)}</h3><p>ล็อต ${esc(p.lot)} · ${fmt(p.boxes)} กล่อง × ${fmt(p.kgPerBox)} กก.<br>รวม ${fmt(kg(p))} กก. · ห้อง ${p.room} / ${p.slot}<br>วันที่รับเข้า ${esc(p.date)}</p><form id="sp-move-form"><label class="sp-field">ย้ายไปห้อง / ตำแหน่ง<select name="target" required><option value="">เลือกตำแหน่งว่าง</option>${['1','2'].flatMap(r=>locations(r).filter(s=>!state.pallets.some(p=>p.room===r&&p.slot===s)).map(s=>`<option value="${r}:${s}">ห้อง ${r} / ${s}</option>`)).join('')}</select></label><button class="sp-button" type="submit">${icon('move')} เตรียมย้ายพาเลต</button></form><form id="sp-dispatch-form" style="margin-top:15px"><label class="sp-field">ผู้รับ / ปลายทาง<input name="recipient" maxlength="160" required></label><label class="sp-field">เลขใบส่งของ / อ้างอิง<input name="reference" maxlength="160"></label><label class="sp-field">จ่ายออก (กล่อง)<input name="boxes" type="number" min="1" max="${p.boxes}" step="1" required placeholder="จำนวนกล่องส่งลูกค้า"></label><button class="sp-button sp-danger" type="submit">${icon('out')} ยืนยันจ่ายออก</button></form><p class="sp-help">ย้ายตำแหน่งไม่เพิ่มสต็อก · จ่ายออกลดตามจำนวนกล่อง</p></div></section>`;
  }
  function moveConfirmation(){
    const m=state.move,p=m&&state.pallets.find(p=>p.id===m.id);if(!p)return '';
    return `<section class="sp-panel"><div class="sp-panel-head"><h2>ตรวจและยืนยันย้าย</h2></div><div class="sp-detail"><strong>${esc(p.product)} · ${p.id}</strong><p>จากห้อง ${p.room} / ${p.slot}<br>ไปห้อง ${m.room} / ${m.slot}<br>${p.boxes} กล่อง · ${fmt(kg(p))} กก.<br>ยอดรวมทั้งโรงงานเท่าเดิม</p><button class="sp-button sp-primary" type="button" id="sp-confirm-move">ยืนยันย้าย</button><button class="sp-button" type="button" id="sp-cancel-move">ยกเลิก</button></div></section>`;
  }
  function pendingPanel(){return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>รอตรวจรับ / จัดเก็บ</h2><p>ยังไม่รวมในยอดคงเหลือ · ลากวางได้ หรือกดเลือกรับเข้า</p></div><span class="sp-tag">${state.pending.length} พาเลต</span></div><div class="sp-pending-list">${state.pending.map(p=>`<div class="sp-pending" draggable="true" data-pending="${p.id}"><span class="sp-pallet-icon ${p.owner==='guest'?'guest':''}">${icon('box')}</span><div class="sp-pending-main"><strong>${esc(p.product)}</strong><small>${esc(p.lot)} · ${p.boxes} กล่อง · ${fmt(kg(p))} กก.</small><small>${esc(ownerLabel(p))}</small></div><button type="button" data-load-pending="${p.id}">รับเข้า ↗</button></div>`).join('')||'<p class="sp-empty">ไม่มีรายการรอจัดเก็บ</p>'}</div></section>`;}
  function accountingPanel(){const t=totals();return `<section class="sp-panel"><div class="sp-panel-head"><h2>แยกสินค้าตามเจ้าของ</h2></div><div class="sp-accounting"><div class="sp-cost-line"><span>สินค้าของเรา</span><strong>${fmt(t.own)} กก.</strong></div><div class="sp-cost-line"><span>สินค้าฝากแช่</span><strong>${fmt(t.guest)} กก.</strong></div><p>การเคลื่อนไหวห้องเย็นบันทึกจำนวนสินค้า ส่วนค่าใช้จ่ายและค่าฝากแช่จัดการใน PF Accounting</p></div></section>`;}
  function inventory(){return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>รายการสินค้าคงเหลือ</h2><p>หนึ่งพาเลตต่อหนึ่งล็อตและเจ้าของ</p></div></div><div class="sp-table-wrap"><table class="sp-table"><thead><tr><th>พาเลต / ล็อต</th><th>สินค้า</th><th>เจ้าของ</th><th>ตำแหน่ง</th><th>กล่อง</th><th>น้ำหนัก</th><th></th></tr></thead><tbody>${state.pallets.map(p=>`<tr><td>${p.id} / ${esc(p.lot)}</td><td>${esc(p.product)}</td><td>${badge(p)}</td><td>ห้อง ${p.room} / ${p.slot}</td><td>${fmt(p.boxes)}</td><td>${fmt(kg(p))} กก.</td><td><button class="sp-button" data-open-pallet="${p.id}" type="button">ดูตำแหน่ง ↗</button></td></tr>`).join('')||'<tr><td colspan="7">ยังไม่มีสินค้า</td></tr>'}</tbody></table></div></section>`;}
  function history(){return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>ประวัติเคลื่อนไหว</h2><p>ข้อมูลบันทึกจริง พร้อมวันเวลาและผู้ทำรายการ</p></div></div><div class="sp-table-wrap"><table class="sp-table"><thead><tr><th>เวลา</th><th>รายการ</th><th>สินค้า / ล็อต</th><th>เจ้าของ</th><th>จำนวน</th><th>รายละเอียด</th></tr></thead><tbody>${state.movements.map(m=>`<tr><td>${esc(m.time)}</td><td>${esc(m.type)}</td><td>${esc(m.product)} / ${esc(m.lot)}</td><td>${badge(m)}</td><td>${m.boxes} กล่อง · ${fmt(m.weight)} กก.</td><td>${esc(m.detail)}</td></tr>`).join('')||'<tr><td colspan="6" class="sp-empty">ยังไม่มีรายการเคลื่อนไหว</td></tr>'}</tbody></table></div></section>`;}
  function workflow(){return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>ขั้นตอนการทำงานของเจ้าหน้าที่</h2><p>รับสินค้าที่แปรรูปแล้วมาแช่และเก็บรอส่งลูกค้า</p></div></div><div class="sp-workflow">${[
      ['สินค้าถึงห้องเย็น','สินค้าจากการผลิตของเรา หรือของผู้ฝากแช่ เจ้าหน้าที่ระบุเจ้าของ สินค้า และล็อตให้ชัดเจน'],
      ['ตรวจนับและเลือกตำแหน่ง','นับกล่องบนพาเลต เช่น 36 กล่อง × 20 กก. = 720 กก. เลือกห้องและช่องวางจากผัง 2D'],
      ['ยืนยันรับเข้าสต็อก','ยืนยันแล้วจึงเพิ่มยอดและปรากฏพาเลตบนผัง สีเขียวคือของเรา สีม่วงคือฝากแช่ พร้อมป้ายเจ้าของ'],
      ['ย้ายหรือส่งลูกค้า','ย้ายเปลี่ยนเฉพาะตำแหน่ง จ่ายออกลดจำนวนจริง ข้อมูลล็อตของเราเตรียมใช้วิเคราะห์ต้นทุนใน PF Accounting']
    ].map(([title,text],i)=>`<div class="sp-step"><b>0${i+1}</b><strong>${title}</strong><p>${text}</p></div>`).join('')}</div><div class="sp-accounting"><p>ผังแสดงรหัสตำแหน่ง ไม่ใช่ขนาดหรือความจุรับน้ำหนักของห้อง รูปกล่องเป็นสัญลักษณ์ อ่านจำนวนจริงจากตัวเลข และตรวจพื้นที่จริงก่อนจัดเก็บ</p></div></section>`;}
  function render(){const t=totals(),incoming=state.movements.filter(m=>m.type==='รับเข้า'&&m.day===today()).reduce((s,m)=>s+m.weight,0),outgoing=state.movements.filter(m=>m.type==='จ่ายออก'&&m.day===today()).reduce((s,m)=>s+m.weight,0);
    root.innerHTML=`<main class="sp-shell"><div class="sp-demo"><span>ข้อมูลจริง · บันทึกส่วนกลาง · น้ำหนักต่อกล่องตามสินค้า</span><button type="button" id="sp-refresh">โหลดข้อมูลใหม่</button></div>${error?`<div role="alert" class="sp-demo">${esc(error)}</div>`:""}${pendingWrite?`<div class="sp-demo" role="status">มีรายการรอยืนยันผลบันทึก ระบบจะใช้รหัสเดิมเพื่อไม่ตัดยอดซ้ำ <button id="sp-retry" type="button" ${busy||loading||!ready?"disabled":""}>ลองรายการเดิมอีกครั้ง</button></div>`:""}<header class="sp-head"><div class="sp-brand"><div class="sp-logo">PF</div><div><p class="sp-eyebrow">COLD STORAGE / STOCK</p><h1>สต็อกห้องเย็น</h1><p class="sp-sub">สินค้าสำเร็จรูปและสินค้าฝากแช่ · 2 ห้องจัดเก็บรอส่งลูกค้า</p></div></div><button class="sp-button sp-primary" type="button" id="sp-new">${icon('plus')} รับเข้าห้องเย็น</button></header><nav class="sp-nav" aria-label="เมนูสต็อก">${[['overview','ภาพรวม / ผังห้องเย็น'],['inventory','สินค้าคงเหลือ'],['history','ประวัติเคลื่อนไหว'],['workflow','ขั้นตอนการทำงาน']].map(([id,label])=>`<button type="button" data-tab="${id}" class="${state.tab===id?'active':''}" aria-current="${state.tab===id?'page':'false'}">${label}</button>`).join('')}</nav><div class="sp-kpis">${[
      ['รับเข้าวันนี้',incoming,'กก.','ตามวันที่ประเทศไทย', 'in'],
      ['จ่ายออกวันนี้',outgoing,'กก.','ตามวันที่ประเทศไทย','out'],
      ['คงเหลือทั้งหมด',t.weight,'กก.',`${fmt(t.boxes)} กล่อง · ของเรา ${fmt(t.own)} / ฝาก ${fmt(t.guest)} กก.`,'box'],
      ['พาเลตที่จัดเก็บ',state.pallets.length,'พาเลต',`2 ห้อง · ตำแหน่งว่าง ${state.locations.length-state.pallets.length} / ${state.locations.length}`,'room']
    ].map(([label,n,unit,note,ic])=>`<section class="sp-kpi"><div class="sp-kpi-top"><span>${label}</span>${icon(ic)}</div><strong>${fmt(n)} <small>${unit}</small></strong><p>${note}</p></section>`).join('')}</div>${state.tab==='overview'?`<div class="sp-layout">${roomMap()}<aside class="sp-side">${moveConfirmation()}${detail()}${receiptForm()}</aside></div><div class="sp-bottom">${pendingPanel()}${accountingPanel()}</div>`:state.tab==='inventory'?inventory():state.tab==='history'?history():workflow()}<footer class="sp-footer"><span>PF STOCK · LIVE STOCK / ${today()} · รหัสตำแหน่งจัดเก็บ · ไม่ใช่ผังตามสัดส่วน</span><span>เตรียมรองรับผัง 3D ภายหลัง โดยใช้รหัสตำแหน่งชุดเดิม</span></footer></main>`;
    bind();
    window.PfColdSales?.decorate(root);
    if(!ready)root.querySelector('.sp-kpis').innerHTML='<p role="status">ยังไม่แสดงยอดจนกว่าจะโหลดข้อมูลส่วนกลางสำเร็จ</p>';
  }
  function capture(){const f=root.querySelector('#sp-receipt-form');if(!f)return;const data=new FormData(f);for(const k of ['product','lot','customer','slot','reference'])if(data.has(k))state.draft[k]=String(data.get(k));if(data.has('boxes'))state.draft.boxes=Number(data.get('boxes'));if(data.has('kgPerBox'))state.draft.kgPerBox=Number(data.get('kgPerBox'));}
  function loadPending(id,slot){const p=state.pending.find(p=>p.id===id);if(!p)return;state.draft={...p,source:id,slot:slot||'',customer:p.owner==='guest'?p.customer:''};state.selected=null;state.move=null;render();toast('เลือกรายการแล้ว ตรวจตำแหน่งและยืนยันรับเข้าเพื่อเพิ่มยอด');}
  function prepareMove(id,room,slot){const p=state.pallets.find(p=>p.id===id);if(!p||!locations(room).includes(slot)||state.pallets.some(p=>p.room===room&&p.slot===slot)){toast('ตำแหน่งนี้ไม่ว่าง กรุณาเลือกตำแหน่งอื่น');return;}state.move={id,room,slot};state.selected=id;render();root.querySelector('#sp-confirm-move')?.focus();}
  function bind(){
    root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{capture();state.tab=b.dataset.tab;render();});
    root.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>{capture();state.room=b.dataset.room;state.draft.slot='';state.selected=null;state.move=null;render();});
    root.querySelector('#sp-filter')?.addEventListener('change',e=>{capture();state.filter=e.target.value;render();});
    root.querySelector('#sp-new').onclick=()=>{capture();state.tab='overview';state.selected=null;state.move=null;state.draft.source='';render();root.querySelector('#sp-receipt').scrollIntoView({behavior:'smooth',block:'center'});root.querySelector('[name=product]').focus({preventScroll:true});};
    root.querySelector('#sp-refresh').onclick=refresh; root.querySelector('#sp-retry')?.addEventListener('click',()=>save(pendingWrite));
    root.querySelectorAll('[data-owner]').forEach(b=>b.onclick=()=>{capture();if(state.draft.source){toast('ประเภทเจ้าของของรายการรอรับเข้าถูกกำหนดไว้แล้ว กดรับเข้าใหม่เพื่อสร้างรายการอื่น');return;}state.draft.owner=b.dataset.owner;render();});
    const f=root.querySelector('#sp-receipt-form');
    f?.addEventListener('input',()=>{capture();root.querySelector('#sp-form-weight').textContent=Number.isFinite(state.draft.boxes)?fmt(state.draft.boxes*state.draft.kgPerBox):'—';});
    f?.addEventListener('change',capture);
    f?.addEventListener('submit',e=>{e.preventDefault();capture();if(busy||pendingWrite)return;const d=state.draft,stage=e.submitter?.name==='stage';
      if(!d.product.trim()||!d.lot.trim()||!Number.isInteger(d.boxes)||d.boxes<1||d.boxes>1000||!Number.isFinite(d.kgPerBox)||d.kgPerBox<=0||d.kgPerBox>1000||(!stage&&!locations(state.room).includes(d.slot))||(d.owner==='guest'&&!d.customer.trim())){toast('กรุณาระบุสินค้า ล็อต จำนวนกล่อง เจ้าของ และตำแหน่งให้ครบ');return;}
      if(d.source){const waiting=state.pending.find(p=>p.id===d.source);if(!waiting)return;save({action:'store',pallet_id:waiting.id,version:waiting.version,room:state.room,slot:d.slot});}
      else save({action:stage?'stage':'receive',product:d.product.trim(),lot:d.lot.trim(),owner:d.owner,customer:d.customer.trim(),boxes:d.boxes,kg_per_box:d.kgPerBox,reference:d.reference||'',...(!stage?{room:state.room,slot:d.slot}:{})});
    });
    root.querySelectorAll('[data-slot]').forEach(b=>{
      b.onclick=()=>{capture();if(b.dataset.pallet){state.selected=b.dataset.pallet;state.move=null;}else{state.draft.slot=b.dataset.slot;state.selected=null;}render();};
      b.ondragover=e=>{if(!b.dataset.pallet){e.preventDefault();b.classList.add('drop-target');}};b.ondragleave=()=>b.classList.remove('drop-target');
      b.ondrop=e=>{e.preventDefault();b.classList.remove('drop-target');if(b.dataset.pallet){toast('ตำแหน่งนี้มีพาเลตแล้ว');return;}const raw=e.dataTransfer.getData('application/x-pf-stock');if(!raw)return;let data;try{data=JSON.parse(raw);}catch{return;}capture();if(data.kind==='pending')loadPending(data.id,b.dataset.slot);else if(data.kind==='pallet')prepareMove(data.id,state.room,b.dataset.slot);};
    });
    root.querySelectorAll('[draggable=true]').forEach(b=>b.ondragstart=e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-pf-stock',JSON.stringify({kind:b.dataset.pending?'pending':'pallet',id:b.dataset.pending||b.dataset.pallet}));});
    root.querySelectorAll('[data-load-pending]').forEach(b=>b.onclick=()=>loadPending(b.dataset.loadPending));
    root.querySelectorAll('[data-open-pallet]').forEach(b=>b.onclick=()=>{const p=state.pallets.find(p=>p.id===b.dataset.openPallet);state.room=p.room;state.selected=p.id;state.tab='overview';state.draft.slot='';render();});
    root.querySelector('[data-close-detail]')?.addEventListener('click',()=>{capture();state.selected=null;state.move=null;render();});
    root.querySelector('#sp-move-form')?.addEventListener('submit',e=>{e.preventDefault();capture();const [room,slot]=new FormData(e.target).get('target').split(':');prepareMove(state.selected,room,slot);});
    root.querySelector('#sp-confirm-move')?.addEventListener('click',()=>{const m=state.move,p=m&&state.pallets.find(p=>p.id===m.id);if(p&&!pendingWrite)save({action:'move',pallet_id:p.id,version:p.version,room:m.room,slot:m.slot});});
    root.querySelector('#sp-cancel-move')?.addEventListener('click',()=>{capture();state.move=null;render();});
    root.querySelector('#sp-dispatch-form')?.addEventListener('submit',e=>{e.preventDefault();const p=state.pallets.find(p=>p.id===state.selected),d=new FormData(e.target),boxes=Number(d.get('boxes'));if(!p||pendingWrite||!Number.isInteger(boxes)||boxes<1||boxes>p.boxes){toast('จำนวนกล่องจ่ายออกต้องไม่เกินคงเหลือ');return;}save({action:'dispatch',pallet_id:p.id,version:p.version,boxes,recipient:String(d.get('recipient')||'').trim(),reference:String(d.get('reference')||'').trim()});});
    if(state.draft.source){root.querySelectorAll('#sp-receipt-form input:not([name=slot]),[data-owner]').forEach(node=>node.disabled=true);}
    if (!canWrite() || !ready || busy || loading || pendingWrite) {
      root.querySelectorAll('form input, form select, form button, [data-owner], [data-load-pending], #sp-new, #sp-confirm-move').forEach(node => { node.disabled = true; });
      root.querySelectorAll('[draggable]').forEach(node => { node.draggable = false; node.ondragstart = null; });
      root.querySelectorAll('[data-slot]').forEach(node => { node.ondrop = null; node.ondragover = null; });
      root.querySelector('.sp-demo span').textContent = loading?'กำลังโหลดข้อมูลจริง…':busy?'กำลังบันทึก…':!ready?'ยังโหลดข้อมูลจริงไม่สำเร็จ · ไม่สามารถบันทึกได้':'ข้อมูลจริง · ตรวจสอบรายการค้างก่อนบันทึกใหม่';
    }
  }
  state=initial();
  window.PFColdStock=Object.freeze({getSnapshot:()=>JSON.parse(JSON.stringify({pallets:state.pallets,pending:state.pending,movements:state.movements,totals:totals()}))});
  render();
  refresh();
  window.PfColdSales?.mountStock(document.getElementById("cold-sale-orders"),refresh);
})();
