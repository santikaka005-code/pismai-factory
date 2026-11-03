(function(root) {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function userXml(employee) {
    const name=String(employee.fullname ?? '').trim();
    if(!name || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff\ud800-\udfff]/u.test(name)) throw Error('ชื่อมีอักขระที่เครื่องไม่รองรับ');
    return `<?xml version="1.0"?>\n<user_info>\n\t<name>${escape(name)}</name>\n\t<level>user</level>\n\t<card />\n\t<password></password>\n\t<enabled>1</enabled>\n\t<depart_id>0</depart_id>\n\t<timezone>\n\t\t<tz>0</tz>\n\t\t<tz>0</tz>\n\t\t<tz>0</tz>\n\t\t<tz>0</tz>\n\t\t<tz>0</tz>\n\t</timezone>\n\t<UsePeriod>0</UsePeriod>\n\t<Start>0</Start>\n\t<End>0</End>\n\t<UseVerifyCount>0</UseVerifyCount>\n\t<VerifyCount>0</VerifyCount>\n\t<duress />\n</user_info>\n`;
  }
  function crc32(bytes) {
    let crc=0xffffffff;
    for(const byte of bytes){crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    return (crc^0xffffffff)>>>0;
  }
  async function buildZip(employees) {
    if(!employees.length)throw Error('กรุณาเลือกพนักงานอย่างน้อย 1 คน');
    if(employees.length>1500)throw Error('เกินจำนวนผู้ใช้ที่รองรับ');
    const encoder=new TextEncoder(), ids=new Set(), local=[], central=[];let offset=0, centralSize=0;
    for(const employee of employees) {
      const id=employee.scanner_id;
      if(!Number.isInteger(id)||id<1||id>99999999||ids.has(id))throw Error('รหัสเครื่องไม่ถูกต้องหรือซ้ำกัน');
      ids.add(id);
      const name=encoder.encode(`user_${id}.xml`), raw=encoder.encode(userXml(employee));
      let compressor;
      try{compressor=new CompressionStream('deflate-raw');}catch{throw Error('เบราว์เซอร์นี้สร้าง ZIP ไม่ได้ กรุณาใช้ Chrome หรือ Edge รุ่นปัจจุบัน');}
      const compressed=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(compressor)).arrayBuffer());
      const crc=crc32(raw), header=new Uint8Array(30+name.length), h=new DataView(header.buffer);
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(8,8,true);h.setUint16(12,33,true);
      h.setUint32(14,crc,true);h.setUint32(18,compressed.length,true);h.setUint32(22,raw.length,true);h.setUint16(26,name.length,true);header.set(name,30);
      const directory=new Uint8Array(46+name.length), d=new DataView(directory.buffer);
      d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(10,8,true);d.setUint16(14,33,true);
      d.setUint32(16,crc,true);d.setUint32(20,compressed.length,true);d.setUint32(24,raw.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);directory.set(name,46);
      local.push(header,compressed);central.push(directory);offset+=header.length+compressed.length;centralSize+=directory.length;
    }
    const end=new Uint8Array(22), e=new DataView(end.buffer);
    e.setUint32(0,0x06054b50,true);e.setUint16(8,employees.length,true);e.setUint16(10,employees.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
    return new Blob([...local,...central,end],{type:'application/zip'});
  }
  async function open({load, map}) {
    if(document.querySelector('#hipRosterDialog'))return;
    const all=[...map(await load()).values()], employees=all.filter(e=>e.status==='Active');
    if(!employees.length)throw Error('ไม่มีพนักงานรายวันที่เปิดใช้งาน');
    const selected=new Set(), dialog=document.createElement('dialog');dialog.id='hipRosterDialog';
    dialog.setAttribute('aria-labelledby','hipRosterTitle');
    dialog.innerHTML=`<div class="scanner-head"><h2 id="hipRosterTitle">เลือกรายชื่อเข้าเครื่อง HIP</h2><button type="button" data-close>ปิด</button></div><p>เลือกเฉพาะคนที่ต้องการเพิ่ม ไฟล์มีรหัสและชื่อสำหรับรอลงลายนิ้วมือ</p><p class="alert">หากมีผู้ใช้อยู่ในเครื่องแล้ว ให้เลือกเฉพาะพนักงานใหม่ การนำเข้ารหัสเดิมอาจกระทบข้อมูลที่ลงทะเบียนไว้</p><label>ค้นหารหัสหรือชื่อ <input type="search" data-search placeholder="เช่น 02 หรือชื่อพนักงาน"></label><div class="hip-roster-actions"><button type="button" data-all>เลือกทุกคนที่แสดง</button><button type="button" data-clear>ล้างที่เลือกทั้งหมด</button><span data-count aria-live="polite"></span></div><div class="scanner-table"><table><thead><tr><th>เลือก</th><th>รหัสเว็บ</th><th>ID เครื่อง</th><th>ชื่อ</th></tr></thead><tbody></tbody></table></div><p data-message role="status"></p><div class="hip-roster-download"><button type="button" data-download disabled>ดาวน์โหลด ZIP</button></div><p>วาง ENROLLDB.ZIP ที่หน้าแรกของ USB แล้วเลือกอัปโหลดข้อมูลผู้ใช้ (XML) หากชื่อไฟล์มีเลขต่อท้าย ให้เปลี่ยนกลับเป็น ENROLLDB.ZIP</p>`;
    document.body.append(dialog);dialog.showModal();const q=s=>dialog.querySelector(s);let busy=false;
    const visible=()=>{const term=q('[data-search]').value.trim().toLocaleLowerCase();return employees.filter(e=>[e.emp_code,e.scanner_id,e.fullname].join(' ').toLocaleLowerCase().includes(term));};
    function draw(){const rows=visible();q('tbody').innerHTML=rows.map(e=>`<tr><td><input type="checkbox" data-id="${escape(e.employee_id)}" aria-label="เลือก ${escape(e.emp_code)} ${escape(e.fullname)}" ${selected.has(e.employee_id)?'checked':''}></td><td>${escape(e.emp_code)}</td><td>${e.scanner_id}</td><td>${escape(e.fullname)}</td></tr>`).join('')||'<tr><td colspan="4">ไม่พบพนักงาน</td></tr>';q('[data-count]').textContent=`เลือก ${selected.size} / ${employees.length} คน · แสดง ${rows.length} คน`;q('[data-download]').disabled=busy||!selected.size;}
    q('tbody').onchange=event=>{const id=event.target.dataset.id;if(!id||busy)return;event.target.checked?selected.add(id):selected.delete(id);draw();};
    q('[data-search]').oninput=draw;
    q('[data-all]').onclick=()=>{visible().forEach(e=>selected.add(e.employee_id));draw();};
    q('[data-clear]').onclick=()=>{selected.clear();draw();};
    q('[data-close]').onclick=()=>{if(!busy)dialog.close();};dialog.onclose=()=>dialog.remove();dialog.oncancel=event=>{if(busy)event.preventDefault();};
    q('[data-download]').onclick=async()=>{
      if(busy||!selected.size)return;busy=true;dialog.querySelectorAll('input,button').forEach(e=>e.disabled=true);q('[data-message]').textContent='กำลังตรวจรายชื่อล่าสุดและสร้างไฟล์...';
      try {
        const latest=[...map(await load()).values()], fresh=new Map(latest.map(e=>[e.employee_id,e]));
        const chosen=employees.filter(e=>selected.has(e.employee_id)).map(e=>{const f=fresh.get(e.employee_id);if(!f||f.status!=='Active'||f.emp_code!==e.emp_code||f.scanner_id!==e.scanner_id||f.fullname!==e.fullname)throw Error('รายชื่อที่เลือกมีการเปลี่ยนแปลง กรุณาปิดแล้วเปิดรายการใหม่');return f;});
        const zip=await buildZip(chosen), url=URL.createObjectURL(zip), link=document.createElement('a');link.href=url;link.download='ENROLLDB.ZIP';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
        q('[data-message]').textContent=`ดาวน์โหลด ${chosen.length} คนแล้ว ยังไม่ได้ส่งเข้าเครื่องสแกน`;
      }catch(error){q('[data-message]').textContent=error.message;}finally{busy=false;dialog.querySelectorAll('input,button').forEach(e=>e.disabled=false);draw();}
    };
    draw();
  }
  const api={userXml,buildZip,open};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HipRoster=api;
})(typeof window!=='undefined'?window:globalThis);
