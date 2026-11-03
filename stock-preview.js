/* Prototype only. Memory-only sample data; no API, database or accounting writes. */
(() => {
  'use strict';
  const root = document.getElementById('stock-preview');
  const readOnly = new URLSearchParams(location.search).get('readonly') === '1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n).toLocaleString('th-TH');
  const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${({box:'<path d="m3 6 9-4 9 4v12l-9 4-9-4Z M3 6l9 4 9-4 M12 10v12 M7 4l9 4"/>',in:'<path d="M12 3v12m-5-5 5 5 5-5 M4 15v6h16v-6"/>',out:'<path d="M12 16V3m-5 5 5-5 5 5 M4 15v6h16v-6"/>',room:'<path d="M3 21V3h18v18 M8 21v-7h8v7 M7 7h3m4 0h3 M7 10h3m4 0h3"/>',plus:'<path d="M12 5v14 M5 12h14"/>',move:'<path d="M3 12h18m-4-4 4 4-4 4 M7 8l-4 4 4 4"/>'})[name] || ''}</svg>`;
  const locations = room => Array.from({length:16}, (_,i) => `${room === '1' ? 'A' : 'B'}-${String(i+1).padStart(2,'0')}`);
  let state;
  let toastTimer;
  function initial() {
    const pallets = [
      ['P001','มะม่วงหั่นเต๋า','M-001',36,'1','A-01','own','โรงงานเรา'],
      ['P002','ทุเรียนแกะเนื้อ','D-001',40,'1','A-02','own','โรงงานเรา'],
      ['P003','มะม่วงหั่นเต๋า','M-002',36,'1','A-05','guest','ลูกค้า A'],
      ['P004','มังคุดแกะเนื้อ','MG-001',30,'1','A-09','own','โรงงานเรา'],
      ['P005','ทุเรียนแกะเนื้อ','D-002',36,'2','B-01','guest','ลูกค้า B'],
      ['P006','มะม่วงหั่นเต๋า','M-003',42,'2','B-02','own','โรงงานเรา'],
      ['P007','มะพร้าวเนื้อ','C-001',36,'2','B-10','own','โรงงานเรา']
    ].map(([id,product,lot,boxes,room,slot,owner,customer])=>({id,product,lot,boxes,room,slot,owner,customer,kgPerBox:20,date:today()}));
    return {tab:'overview',room:'1',filter:'all',selected:null,move:null,nextId:8,pallets,
      pending:[{id:'W001',product:'มะม่วงหั่นเต๋า',lot:'M-004',boxes:36,owner:'own',customer:'โรงงานเรา'}, {id:'W002',product:'ทุเรียนแกะเนื้อ',lot:'D-003',boxes:40,owner:'guest',customer:'ลูกค้า C'}],
      draft:{product:'มะม่วงหั่นเต๋า',lot:'',boxes:36,owner:'own',customer:'',slot:'',source:''},
      movements:[],notice:''};
  }
  const kg = p => p.boxes * p.kgPerBox;
  const ownerLabel = p => p.owner === 'own' ? 'ของเรา' : `ฝากแช่ · ${p.customer}`;
  const badge = p => `<span class="sp-owner-badge ${p.owner === 'guest'?'guest':''}">${esc(ownerLabel(p))}</span>`;
  const totals = () => ({weight:state.pallets.reduce((s,p)=>s+kg(p),0), boxes:state.pallets.reduce((s,p)=>s+p.boxes,0), own:state.pallets.filter(p=>p.owner==='own').reduce((s,p)=>s+kg(p),0), guest:state.pallets.filter(p=>p.owner==='guest').reduce((s,p)=>s+kg(p),0)});
  const log = (type,p,boxes,detail) => state.movements.unshift({type,product:p.product,lot:p.lot,owner:p.owner,customer:p.customer,boxes,weight:boxes*p.kgPerBox,detail,time:new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'}).format(new Date())});
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
    return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>ตำแหน่งสินค้าในห้องเย็น</h2><p>มองจากด้านบน · คลิกพาเลตเพื่อดูรายละเอียด</p></div><span class="sp-tag">ผังสมมติ / ยังไม่ใช่ขนาดจริง</span></div><div class="sp-tools"><div class="sp-room-tabs">${['1','2'].map(r=>`<button type="button" data-room="${r}" class="${r===state.room?'active':''}">ห้องเย็น ${r}</button>`).join('')}</div><div class="sp-legend"><span><i class="sp-dot"></i>ของเรา</span><span><i class="sp-dot guest"></i>ฝากแช่</span><span><i class="sp-dot empty"></i>ว่าง</span></div></div><div class="sp-tools" style="padding-top:0"><span class="sp-help">สีบอกเจ้าของสินค้า · กล่องและพาเลตใช้สีเดียวกัน</span><select class="sp-filter" id="sp-filter" aria-label="กรองเจ้าของสินค้า"><option value="all">เจ้าของทั้งหมด</option><option value="own" ${state.filter==='own'?'selected':''}>สินค้าของเรา</option><option value="guest" ${state.filter==='guest'?'selected':''}>สินค้าฝากแช่</option></select></div><div class="sp-map-wrap"><div class="sp-map"><div class="sp-map-caption"><span>COLD ROOM 0${state.room}</span><span>16 ตำแหน่งตัวอย่าง</span></div><div class="sp-slots">${slots}</div><div class="sp-door">ประตูเข้า–ออก</div></div><div class="sp-room-foot"><span>ใช้แล้ว ${pallets.length} / 16 ตำแหน่ง</span><span>${fmt(pallets.reduce((s,p)=>s+p.boxes,0))} กล่อง · ${fmt(pallets.reduce((s,p)=>s+kg(p),0))} กก.</span></div><p class="sp-note">ลากรายการรอจัดเก็บลงช่องว่าง แล้วตรวจและยืนยันรับเข้า หรือเลือกช่องว่างแล้วกรอกฟอร์ม</p></div></section>`;
  }
  function receiptForm() {
    const d=state.draft;
    const options=locations(state.room).filter(slot=>!state.pallets.some(p=>p.room===state.room&&p.slot===slot));
    return `<section class="sp-panel" id="sp-receipt"><div class="sp-panel-head"><div><h2>รับสินค้าสำเร็จเข้าห้องเย็น</h2><p>รับจากการผลิต หรือรับฝากแช่</p></div></div><form class="sp-form" id="sp-receipt-form"><div class="sp-owner" aria-label="ประเภทเจ้าของ"><button type="button" data-owner="own" aria-pressed="${d.owner==='own'}" class="${d.owner==='own'?'active':''}">● สินค้าของเรา</button><button type="button" data-owner="guest" aria-pressed="${d.owner==='guest'}" class="guest ${d.owner==='guest'?'active':''}">● สินค้าฝากแช่</button></div>${d.owner==='guest'?`<label class="sp-field">ชื่อเจ้าของ / ผู้ฝาก<input name="customer" value="${esc(d.customer)}" maxlength="100" required placeholder="ระบุเจ้าของสินค้า"></label>`:''}<label class="sp-field">สินค้าแปรรูป<input name="product" value="${esc(d.product)}" maxlength="100" required></label><label class="sp-field">ล็อตสินค้า<input name="lot" value="${esc(d.lot)}" maxlength="80" placeholder="เช่น M-004" required></label><div class="sp-field-row"><label class="sp-field">จำนวนกล่อง / พาเลต<input name="boxes" type="number" min="1" max="1000" step="1" value="${d.boxes}" required></label><label class="sp-field">น้ำหนัก / กล่อง<input value="20 กก." readonly aria-label="น้ำหนักคงที่ 20 กิโลกรัมต่อกล่อง"></label></div><div class="sp-total"><span>น้ำหนักรวม <small>กก.</small></span><strong id="sp-form-weight">${fmt(d.boxes*20)}</strong></div><label class="sp-field">ตำแหน่งในห้องเย็น ${state.room}<select name="slot" required><option value="">เลือกตำแหน่งว่าง</option>${options.map(s=>`<option ${s===d.slot?'selected':''}>${s}</option>`).join('')}</select></label>${d.source?`<p class="sp-help">อ้างอิงรายการรอจัดเก็บ ${esc(d.source)} · ยังไม่นับเป็นสต็อก</p>`:''}<button class="sp-button sp-primary" type="submit">${icon('in')} ยืนยันรับเข้า (ทดลอง)</button><p class="sp-help">1 รายการ = 1 พาเลต · 36 กล่องเป็นค่าเริ่มต้น ปรับเพิ่มได้<br>ต้นแบบนี้รองรับ 20 กก./กล่องก่อน</p></form></section>`;
  }
  function detail() {
    const p=state.pallets.find(p=>p.id===state.selected);if(!p)return '';
    return `<section class="sp-panel"><div class="sp-panel-head"><h2>พาเลต ${p.id}</h2><button class="sp-button" type="button" data-close-detail aria-label="ปิดรายละเอียด">×</button></div><div class="sp-detail">${badge(p)}<h3>${esc(p.product)}</h3><p>ล็อต ${esc(p.lot)} · ${fmt(p.boxes)} กล่อง × 20 กก.<br>รวม ${fmt(kg(p))} กก. · ห้อง ${p.room} / ${p.slot}<br>วันที่รับเข้า ${esc(p.date)}</p><form id="sp-move-form"><label class="sp-field">ย้ายไปห้อง / ตำแหน่ง<select name="target" required><option value="">เลือกตำแหน่งว่าง</option>${['1','2'].flatMap(r=>locations(r).filter(s=>!state.pallets.some(p=>p.room===r&&p.slot===s)).map(s=>`<option value="${r}:${s}">ห้อง ${r} / ${s}</option>`)).join('')}</select></label><button class="sp-button" type="submit">${icon('move')} เตรียมย้ายพาเลต</button></form><form id="sp-dispatch-form" style="margin-top:15px"><label class="sp-field">จ่ายออก (กล่อง)<input name="boxes" type="number" min="1" max="${p.boxes}" step="1" required placeholder="จำนวนกล่องส่งลูกค้า"></label><button class="sp-button sp-danger" type="submit">${icon('out')} ยืนยันจ่ายออก (ทดลอง)</button></form><p class="sp-help">ย้ายตำแหน่งไม่เพิ่มสต็อก · จ่ายออกลดตามจำนวนกล่อง</p></div></section>`;
  }
  function moveConfirmation(){
    const m=state.move,p=m&&state.pallets.find(p=>p.id===m.id);if(!p)return '';
    return `<section class="sp-panel"><div class="sp-panel-head"><h2>ตรวจและยืนยันย้าย</h2></div><div class="sp-detail"><strong>${esc(p.product)} · ${p.id}</strong><p>จากห้อง ${p.room} / ${p.slot}<br>ไปห้อง ${m.room} / ${m.slot}<br>${p.boxes} กล่อง · ${fmt(kg(p))} กก.<br>ยอดรวมทั้งโรงงานเท่าเดิม</p><button class="sp-button sp-primary" type="button" id="sp-confirm-move">ยืนยันย้าย (ทดลอง)</button><button class="sp-button" type="button" id="sp-cancel-move">ยกเลิก</button></div></section>`;
  }
  function pendingPanel(){return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>รอตรวจรับ / จัดเก็บ</h2><p>ยังไม่รวมในยอดคงเหลือ · ลากวางได้ หรือกดเลือกรับเข้า</p></div><span class="sp-tag">${state.pending.length} พาเลต</span></div><div class="sp-pending-list">${state.pending.map(p=>`<div class="sp-pending" draggable="true" data-pending="${p.id}"><span class="sp-pallet-icon ${p.owner==='guest'?'guest':''}">${icon('box')}</span><div class="sp-pending-main"><strong>${esc(p.product)}</strong><small>${esc(p.lot)} · ${p.boxes} กล่อง · ${fmt(p.boxes*20)} กก.</small><small>${esc(ownerLabel(p))}</small></div><button type="button" data-load-pending="${p.id}">รับเข้า ↗</button></div>`).join('')||'<p class="sp-empty">จัดเก็บรายการตัวอย่างครบแล้ว</p>'}</div></section>`;}
  function accountingPanel(){const t=totals();return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>เชื่อมต่อ PF Accounting</h2><p>แนวทางข้อมูล · ยังไม่ส่งเข้าบัญชีจริง</p></div><span class="sp-tag">เตรียมเชื่อม</span></div><div class="sp-accounting"><p>สินค้าของเราผูกล็อตผลิตและต้นทุน สินค้าฝากแช่เก็บแยกเจ้าของ ไม่นับเป็นสินทรัพย์สินค้าของโรงงาน</p><div class="sp-cost-line"><span><i class="sp-dot"></i>สินค้าของเรา</span><strong>${fmt(t.own)} กก.</strong></div><div class="sp-cost-line"><span><i class="sp-dot guest"></i>สินค้าฝากแช่</span><strong>${fmt(t.guest)} กก.</strong></div><div class="sp-cost-line"><span>ต้นทุนล็อต / รายได้ค่าฝากแช่</span><span>รอกำหนดข้อมูล</span></div></div></section>`;}
  function inventory(){return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>รายการสินค้าคงเหลือ</h2><p>หนึ่งพาเลตต่อหนึ่งล็อตและเจ้าของในเค้าโครงนี้</p></div></div><div class="sp-table-wrap"><table class="sp-table"><thead><tr><th>พาเลต / ล็อต</th><th>สินค้า</th><th>เจ้าของ</th><th>ตำแหน่ง</th><th>กล่อง</th><th>น้ำหนัก</th><th></th></tr></thead><tbody>${state.pallets.map(p=>`<tr><td>${p.id} / ${esc(p.lot)}</td><td>${esc(p.product)}</td><td>${badge(p)}</td><td>ห้อง ${p.room} / ${p.slot}</td><td>${fmt(p.boxes)}</td><td>${fmt(kg(p))} กก.</td><td><button class="sp-button" data-open-pallet="${p.id}" type="button">ดูตำแหน่ง ↗</button></td></tr>`).join('')||'<tr><td colspan="7">ยังไม่มีสินค้า</td></tr>'}</tbody></table></div></section>`;}
  function history(){return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>รายการเคลื่อนไหวที่ทดลอง</h2><p>แสดงเฉพาะรายการที่ทำในรอบทดลองนี้ · ไม่รวมยอดยกมาตัวอย่าง</p></div></div><div class="sp-table-wrap"><table class="sp-table"><thead><tr><th>เวลา</th><th>รายการ</th><th>สินค้า / ล็อต</th><th>เจ้าของ</th><th>จำนวน</th><th>รายละเอียด</th></tr></thead><tbody>${state.movements.map(m=>`<tr><td>${m.time}</td><td>${m.type}</td><td>${esc(m.product)} / ${esc(m.lot)}</td><td>${badge(m)}</td><td>${m.boxes} กล่อง · ${fmt(m.weight)} กก.</td><td>${esc(m.detail)}</td></tr>`).join('')||'<tr><td colspan="6" class="sp-empty">ลองรับเข้า ย้าย หรือจ่ายออก เพื่อดูประวัติที่นี่</td></tr>'}</tbody></table></div></section>`;}
  function workflow(){return `<section class="sp-panel"><div class="sp-panel-head"><div><h2>ขั้นตอนการทำงานของเจ้าหน้าที่</h2><p>รับสินค้าที่แปรรูปแล้วมาแช่และเก็บรอส่งลูกค้า</p></div></div><div class="sp-workflow">${[
      ['สินค้าถึงห้องเย็น','สินค้าจากการผลิตของเรา หรือของผู้ฝากแช่ เจ้าหน้าที่ระบุเจ้าของ สินค้า และล็อตให้ชัดเจน'],
      ['ตรวจนับและเลือกตำแหน่ง','นับกล่องบนพาเลต เช่น 36 กล่อง × 20 กก. = 720 กก. เลือกห้องและช่องวางจากผัง 2D'],
      ['ยืนยันรับเข้าสต็อก','ยืนยันแล้วจึงเพิ่มยอดและปรากฏพาเลตบนผัง สีเขียวคือของเรา สีม่วงคือฝากแช่ พร้อมป้ายเจ้าของ'],
      ['ย้ายหรือส่งลูกค้า','ย้ายเปลี่ยนเฉพาะตำแหน่ง จ่ายออกลดจำนวนจริง ข้อมูลล็อตของเราเตรียมใช้วิเคราะห์ต้นทุนใน PF Accounting']
    ].map(([title,text],i)=>`<div class="sp-step"><b>0${i+1}</b><strong>${title}</strong><p>${text}</p></div>`).join('')}</div><div class="sp-accounting"><p>ผังจริง ความจุแต่ละตำแหน่ง หน่วยบรรจุแบบอื่น การอนุมัติ และวิธีคิดค่าฝากแช่ จะกำหนดเพิ่มก่อนเปิดใช้งานจริง รูปกล่องบนผังเป็นสัญลักษณ์ อ่านจำนวนจริงจากตัวเลข</p></div></section>`;}
  function render(){const t=totals(),incoming=state.movements.filter(m=>m.type==='รับเข้า').reduce((s,m)=>s+m.weight,0),outgoing=state.movements.filter(m=>m.type==='จ่ายออก').reduce((s,m)=>s+m.weight,0);
    root.innerHTML=`<main class="sp-shell"><div class="sp-demo"><span>โหมดเค้าโครง · ข้อมูลสมมติทั้งหมด · รีเฟรชแล้วเริ่มใหม่ · ไม่เชื่อมฐานข้อมูลหรือบัญชีจริง</span><button type="button" id="sp-reset">เริ่มทดลองใหม่</button></div><header class="sp-head"><div class="sp-brand"><div class="sp-logo">PF</div><div><p class="sp-eyebrow">COLD STORAGE / STOCK</p><h1>สต็อกห้องเย็น</h1><p class="sp-sub">สินค้าสำเร็จรูปและสินค้าฝากแช่ · 2 ห้องจัดเก็บรอส่งลูกค้า</p></div></div><button class="sp-button sp-primary" type="button" id="sp-new">${icon('plus')} รับเข้าห้องเย็น</button></header><nav class="sp-nav" aria-label="เมนูสต็อก">${[['overview','ภาพรวม / ผังห้องเย็น'],['inventory','สินค้าคงเหลือ'],['history','ประวัติเคลื่อนไหว'],['workflow','ขั้นตอนการทำงาน']].map(([id,label])=>`<button type="button" data-tab="${id}" class="${state.tab===id?'active':''}" aria-current="${state.tab===id?'page':'false'}">${label}</button>`).join('')}</nav><div class="sp-kpis">${[
      ['รับเข้าวันนี้',incoming,'กก.','รายการที่ยืนยันในรอบทดลอง', 'in'],
      ['จ่ายออกวันนี้',outgoing,'กก.','รายการที่จ่ายในรอบทดลอง','out'],
      ['คงเหลือทั้งหมด',t.weight,'กก.',`${fmt(t.boxes)} กล่อง · ของเรา ${fmt(t.own)} / ฝาก ${fmt(t.guest)} กก.`,'box'],
      ['พาเลตที่จัดเก็บ',state.pallets.length,'พาเลต',`2 ห้อง · ตำแหน่งสมมติว่าง ${32-state.pallets.length} / 32`,'room']
    ].map(([label,n,unit,note,ic])=>`<section class="sp-kpi"><div class="sp-kpi-top"><span>${label}</span>${icon(ic)}</div><strong>${fmt(n)} <small>${unit}</small></strong><p>${note}</p></section>`).join('')}</div>${state.tab==='overview'?`<div class="sp-layout">${roomMap()}<aside class="sp-side">${moveConfirmation()}${detail()}${receiptForm()}</aside></div><div class="sp-bottom">${pendingPanel()}${accountingPanel()}</div>`:state.tab==='inventory'?inventory():state.tab==='history'?history():workflow()}<footer class="sp-footer"><span>PF STOCK · 2D CONCEPT / ${today()} · ตำแหน่งและความจุรอสำรวจจริง</span><span>เตรียมรองรับผัง 3D ภายหลัง โดยใช้รหัสตำแหน่งชุดเดิม</span></footer></main>`;
    bind();
  }
  function capture(){const f=root.querySelector('#sp-receipt-form');if(!f)return;const data=new FormData(f);for(const k of ['product','lot','customer','slot'])if(data.has(k))state.draft[k]=String(data.get(k));state.draft.boxes=Number(data.get('boxes'));}
  function loadPending(id,slot){const p=state.pending.find(p=>p.id===id);if(!p)return;state.draft={...p,source:id,slot:slot||'',customer:p.owner==='guest'?p.customer:''};state.selected=null;state.move=null;render();toast('เลือกรายการแล้ว ตรวจตำแหน่งและยืนยันรับเข้าเพื่อเพิ่มยอด');}
  function prepareMove(id,room,slot){const p=state.pallets.find(p=>p.id===id);if(!p||!locations(room).includes(slot)||state.pallets.some(p=>p.room===room&&p.slot===slot)){toast('ตำแหน่งนี้ไม่ว่าง กรุณาเลือกตำแหน่งอื่น');return;}state.move={id,room,slot};state.selected=id;render();root.querySelector('#sp-confirm-move')?.focus();}
  function bind(){
    root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{capture();state.tab=b.dataset.tab;render();});
    root.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>{capture();state.room=b.dataset.room;state.draft.slot='';state.selected=null;state.move=null;render();});
    root.querySelector('#sp-filter')?.addEventListener('change',e=>{capture();state.filter=e.target.value;render();});
    root.querySelector('#sp-new').onclick=()=>{capture();state.tab='overview';state.selected=null;state.move=null;state.draft.source='';render();root.querySelector('#sp-receipt').scrollIntoView({behavior:'smooth',block:'center'});root.querySelector('[name=product]').focus({preventScroll:true});};
    root.querySelector('#sp-reset').onclick=()=>{state=initial();render();toast('คืนค่าข้อมูลตัวอย่างแล้ว');};
    root.querySelectorAll('[data-owner]').forEach(b=>b.onclick=()=>{capture();if(state.draft.source){toast('ประเภทเจ้าของของรายการรอรับเข้าถูกกำหนดไว้แล้ว กดรับเข้าใหม่เพื่อสร้างรายการอื่น');return;}state.draft.owner=b.dataset.owner;render();});
    const f=root.querySelector('#sp-receipt-form');
    f?.addEventListener('input',()=>{capture();root.querySelector('#sp-form-weight').textContent=Number.isFinite(state.draft.boxes)?fmt(state.draft.boxes*20):'—';});
    f?.addEventListener('change',capture);
    f?.addEventListener('submit',e=>{e.preventDefault();capture();const d=state.draft;const waiting=d.source&&state.pending.find(p=>p.id===d.source);
      if(!d.product.trim()||!d.lot.trim()||!Number.isInteger(d.boxes)||d.boxes<1||d.boxes>1000||!locations(state.room).includes(d.slot)||(d.owner==='guest'&&!d.customer.trim())){toast('กรุณาระบุสินค้า ล็อต จำนวนกล่อง เจ้าของ และตำแหน่งให้ครบ');return;}
      if(d.source&&(!waiting||waiting.product!==d.product||waiting.lot!==d.lot||waiting.boxes!==d.boxes||waiting.owner!==d.owner||waiting.customer!==(d.owner==='own'?'โรงงานเรา':d.customer.trim()))){toast('รายการรอรับเข้าต้องรับตรงตามยอดและล็อตตัวอย่าง กดรับเข้าใหม่เพื่อสร้างรายการอื่น');return;}
      if(state.pallets.some(p=>p.room===state.room&&p.slot===d.slot)){toast('ตำแหน่งนี้มีสินค้าแล้ว กรุณาเลือกช่องว่าง');return;}
      const p={id:`P${String(state.nextId++).padStart(3,'0')}`,product:d.product.trim(),lot:d.lot.trim(),boxes:d.boxes,room:state.room,slot:d.slot,owner:d.owner,customer:d.owner==='own'?'โรงงานเรา':d.customer.trim(),kgPerBox:20,date:today()};
      state.pallets.push(p);log('รับเข้า',p,p.boxes,`ห้อง ${p.room} / ${p.slot}`);if(d.source)state.pending=state.pending.filter(p=>p.id!==d.source);state.draft={product:'มะม่วงหั่นเต๋า',lot:'',boxes:36,owner:'own',customer:'',slot:'',source:''};state.selected=p.id;render();toast(`ทดลองรับเข้า ${p.boxes} กล่อง / ${fmt(kg(p))} กก. สำเร็จ`);
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
    root.querySelector('#sp-confirm-move')?.addEventListener('click',()=>{capture();const m=state.move,p=m&&state.pallets.find(p=>p.id===m.id);if(!p||state.pallets.some(p=>p.room===m.room&&p.slot===m.slot)){state.move=null;render();toast('ตำแหน่งไม่ว่างแล้ว');return;}const from=`ห้อง ${p.room} / ${p.slot}`;p.room=m.room;p.slot=m.slot;log('ย้าย',p,p.boxes,`${from} → ห้อง ${p.room} / ${p.slot}`);state.move=null;state.room=p.room;state.draft.slot='';render();toast('ย้ายพาเลตแล้ว ยอดรวมสต็อกเท่าเดิม');});
    root.querySelector('#sp-cancel-move')?.addEventListener('click',()=>{capture();state.move=null;render();});
    root.querySelector('#sp-dispatch-form')?.addEventListener('submit',e=>{e.preventDefault();capture();const p=state.pallets.find(p=>p.id===state.selected),boxes=Number(new FormData(e.target).get('boxes'));if(!p||!Number.isInteger(boxes)||boxes<1||boxes>p.boxes){toast('จำนวนกล่องจ่ายออกต้องไม่เกินคงเหลือ');return;}log('จ่ายออก',p,boxes,`จากห้อง ${p.room} / ${p.slot}`);p.boxes-=boxes;if(!p.boxes){state.pallets=state.pallets.filter(x=>x.id!==p.id);state.selected=null;state.move=null;}render();toast(`ทดลองจ่ายออก ${boxes} กล่อง / ${fmt(boxes*20)} กก.`);});
    if (readOnly) {
      root.querySelectorAll('form input, form select, form button, [data-owner], [data-load-pending], #sp-new, #sp-confirm-move').forEach(node => { node.disabled = true; });
      root.querySelectorAll('[draggable]').forEach(node => { node.draggable = false; node.ondragstart = null; });
      root.querySelectorAll('[data-slot]').forEach(node => { node.ondrop = null; node.ondragover = null; });
      root.querySelector('.sp-demo span').textContent = 'C3 ดูข้อมูลตัวอย่างเท่านั้น · ไม่บันทึกฐานข้อมูลจริง';
    }
  }
  state=initial();
  window.PFStockPreview=Object.freeze({getSnapshot:()=>JSON.parse(JSON.stringify({pallets:state.pallets,pending:state.pending,movements:state.movements,totals:totals()}))});
  render();
})();
