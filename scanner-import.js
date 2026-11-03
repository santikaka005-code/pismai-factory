/* USB attendance staging. Device-specific formats require a real sample. */
(function (root) {
  "use strict";
  function rosterMap(employees) {
    const byScanner = new Map(), ids = new Set();
    for (const e of employees) {
      const code = String(e.emp_code ?? '').trim(), id = String(e.id ?? '').trim();
      if (!/^\d{1,8}$/.test(code) || Number(code) < 1 || !id || ids.has(id)) throw Error('รายชื่อมีรหัสไม่ถูกต้องหรือรหัสประจำตัวซ้ำ');
      const scannerId = String(Number(code));
      if (byScanner.has(scannerId)) {
        const other=byScanner.get(scannerId);
        throw Error(`ID เครื่อง ${scannerId} ซ้ำ: ${other.emp_code} — ${other.fullname} (ID เว็บ ${other.employee_id}) ชนกับ ${code} — ${e.fullname} (ID เว็บ ${id}) กรุณาตรวจรายชื่อก่อนจับคู่เวลา`);
      }
      ids.add(id);
      byScanner.set(scannerId, {employee_id:id, emp_code:code, scanner_id:Number(code), fullname:e.fullname, status:e.status});
    }
    return byScanner;
  }
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function parse(text, delimiter) {
    if (/[\x00-\x08\x0e-\x1f\ufffd]/.test(text)) throw new Error("ไฟล์ไม่ใช่ข้อความที่อ่านได้ กรุณาตรวจการเข้ารหัสหรือส่งไฟล์ตัวอย่างให้ตรวจสอบ");
    const rows = []; let row = [], cell = "", quoted = false;
    text = text.replace(/^\uFEFF/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
        else if (quoted || cell === "") quoted = !quoted;
        else cell += c;
      } else if (!quoted && c === delimiter) { row.push(cell); cell = ""; }
      else if (!quoted && (c === "\n" || c === "\r")) {
        row.push(cell); rows.push(row); row = []; cell = "";
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else cell += c;
    }
    if (quoted) throw new Error("เครื่องหมายคำพูดในไฟล์ไม่ครบ ยังไม่นำเข้า");
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  function date(value) {
    const s = String(value || "").trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return "";
    const d = new Date(s + "T00:00:00Z");
    return Number(m[1]) >= 1900 && !isNaN(d) && d.toISOString().slice(0, 10) === s ? s : "";
  }
  function time(value) {
    const s = String(value || "").trim();
    return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(s) ? s : "";
  }
  function convert(rows, map, mode, header, inValue, outValue) {
    const entries = [], rejected = [], ignored = [], groups = new Map();
    const get = (row, key) => String(row[Number(map[key])] ?? "").trim();
    rows.forEach((row, index) => {
      if (header && index === 0) return;
      if (row.every(c => !c.trim())) { ignored.push(index + 1); return; }
      const emp_code = get(row, "employee"), record_date = date(get(row, "date"));
      if (!emp_code || !record_date) { rejected.push({line:index + 1, reason:"รหัสว่างหรือวันที่ไม่ใช่ YYYY-MM-DD", raw:row}); return; }
      if (mode === "pair") {
        const a = get(row, "in"), b = get(row, "out");
        if ((a && !time(a)) || (b && !time(b))) { rejected.push({line:index + 1, reason:"เวลาไม่ใช่ HH:mm หรือ HH:mm:ss", raw:row}); return; }
        entries.push({emp_code, record_date, clock_in:a, clock_out:b, lines:[index + 1]});
      } else {
        const t = time(get(row, "time")), direction = get(row, "direction");
        if (!t || ![inValue, outValue].includes(direction)) { rejected.push({line:index + 1, reason:"เวลาไม่ถูกต้องหรือประเภทเข้า/ออกไม่ตรงค่าที่กำหนด", raw:row}); return; }
        const key = JSON.stringify([emp_code, record_date]);
        if (!groups.has(key)) groups.set(key, {emp_code, record_date, ins:[], outs:[], lines:[]});
        const g = groups.get(key); g[direction === inValue ? "ins" : "outs"].push(t); g.lines.push(index + 1);
      }
    });
    for (const g of groups.values()) {
      entries.push({emp_code:g.emp_code, record_date:g.record_date, clock_in:g.ins.length === 1 ? g.ins[0] : "", clock_out:g.outs.length === 1 ? g.outs[0] : "", lines:g.lines,
        review:g.ins.length > 1 || g.outs.length > 1 ? "มีหลายครั้งในวันเดียว ต้องตรวจรายการต้นฉบับและกำหนดช่วงเวลาทำงาน" : ""});
    }
    entries.sort((a,b) => a.record_date.localeCompare(b.record_date) || a.emp_code.localeCompare(b.emp_code));
    return {entries, rejected, ignored};
  }
  function problems(entry, exists) {
    const reasons = [];
    if (!exists(entry.emp_code)) reasons.push("ไม่พบรหัสพนักงาน");
    if (!date(entry.record_date)) reasons.push("วันที่ไม่ถูกต้อง");
    if (!time(entry.clock_in)) reasons.push("ขาดเวลาเข้า");
    if (!time(entry.clock_out)) reasons.push("ขาดเวลาออก");
    if (entry.clock_in && entry.clock_out && entry.clock_out <= entry.clock_in) reasons.push("เวลาข้ามวันหรือเวลาออกไม่หลังเวลาเข้า ต้องตรวจแยกกะ");
    if ((entry.clock_in.length > 5 && entry.clock_in.slice(6) !== "00") || (entry.clock_out.length > 5 && entry.clock_out.slice(6) !== "00")) reasons.push("มีวินาที ต้องให้เจ้าหน้าที่ยืนยันเวลาเป็นนาที");
    if (entry.review) reasons.push(entry.review);
    return reasons;
  }
  async function database() {
    return new Promise((resolve,reject) => {
      const request = indexedDB.open("pismai-scanner-import", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("batches", {keyPath:"id"});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("เปิดพื้นที่เก็บไฟล์ไม่สำเร็จ ยังไม่นำเข้า"));
    });
  }
  async function storage(action, value) {
    const db = await database();
    return new Promise((resolve,reject) => {
      const tx = db.transaction("batches", action === "put" ? "readwrite" : "readonly");
      const req = tx.objectStore("batches")[action](value);
      tx.oncomplete = () => { db.close(); resolve(req.result); };
      tx.onabort = tx.onerror = () => { db.close(); reject(new Error("เก็บไฟล์ไม่สำเร็จ พื้นที่อาจเต็ม ยังไม่ถือว่านำเข้าสำเร็จ")); };
    });
  }
  async function open(adapter, initialBatchId = null) {
    if (document.querySelector("#scannerImportDialog")) return;
    const dialog = document.createElement("dialog"); dialog.id = "scannerImportDialog";
    dialog.innerHTML = `<div class="scanner-head"><h2>นำเข้าไฟล์เครื่องสแกน · USB</h2><button type="button" data-close>ปิด</button></div>
      <p>อ่านไฟล์ข้อความ CSV / TSV / TXT โดยจับคู่คอลัมน์ ยังไม่ยืนยันรูปแบบเฉพาะ HIP จนกว่าจะทดสอบไฟล์จริง</p>
      <p class="alert">ไฟล์ต้นฉบับและรายการรอตรวจเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ควรเก็บไฟล์ USB ไว้ด้วย รายการที่ส่งเข้าคิวแล้วจึงเข้าสู่ระบบกลาง</p>
      <div data-message role="status" aria-live="polite"></div>
      <section data-upload><label>เลือกไฟล์ <input type="file" data-file accept=".txt,.csv,.tsv,.dat" /></label>
      <label>การเข้ารหัส <select data-encoding><option value="utf-8">UTF-8</option><option value="windows-874">ภาษาไทย Windows-874</option><option value="utf-16le">UTF-16 LE</option></select></label>
      <label>ตัวแบ่ง <select data-delimiter><option value="tab">Tab</option><option value=",">Comma (,)</option><option value=";">Semicolon (;)</option><option value="|">|</option></select></label>
      <button type="button" data-read>อ่านตัวอย่าง</button></section>
      <div data-preview></div><div data-work></div><h3>ประวัติ / รายการรอตรวจบนเครื่องนี้</h3><div data-history></div>`;
    document.body.append(dialog); dialog.showModal();
    let batch = null, parsed = null, file = null, busy = false;
    const q = s => dialog.querySelector(s);
    const message = s => { q("[data-message]").textContent = s; };
    q("[data-close]").onclick = () => { if (!busy) dialog.close(); };
    dialog.addEventListener("cancel", e => { if (busy) e.preventDefault(); });
    dialog.onclose = () => dialog.remove();
    async function guarded(fn) {
      if (busy) return; busy = true;
      try { await fn(); } catch(e) { message(e.message); } finally { busy = false; }
    }
    async function history() {
      const all = await storage("getAll");
      q("[data-history]").innerHTML = all.sort((a,b) => b.created.localeCompare(a.created)).map(b => `<button type="button" data-batch="${escape(b.id)}">${escape(b.name)} · ${escape(b.created)} · ${b.entries.filter(e=>!e.queue).length} รายการยังไม่ส่ง</button>`).join("") || "ยังไม่มีประวัติ";
      dialog.querySelectorAll("[data-batch]").forEach(button => button.onclick = () => guarded(async () => { batch = await storage("get", button.dataset.batch); draw(); }));
    }
    function draw() {
      q("[data-preview]").innerHTML = "";
      const pending = batch.entries.filter(e => !e.queue && problems(e, adapter.exists).length).length;
      q("[data-work]").innerHTML = `<h3>${escape(batch.name)}</h3><p>ข้อมูล ${batch.rows.length - (batch.header ? 1 : 0)} แถว · กลุ่มเวลา ${batch.entries.length} · อ่านไม่ได้ ${batch.rejected.length} แถว · แถวว่าง ${batch.ignored.length} · ต้องตรวจ ${pending} รายการ</p>
        <button type="button" data-original>ดาวน์โหลดไฟล์ต้นฉบับ</button>
        <p>ข้อมูลไม่ครบยังไม่ส่งคำนวณค่าแรง กะข้ามคืนต้องตรวจในระบบบันทึกเวลาเดิม</p>
        <div class="scanner-table"><table><thead><tr><th>แถวต้นทาง</th><th>พนักงาน</th><th>วันที่</th><th>เข้า</th><th>ออก</th><th>สถานะ / ดำเนินการ</th></tr></thead><tbody>${batch.entries.map((e,i) => `<tr><td>${escape(e.lines.join(", "))}</td><td>${escape(e.emp_code)}</td><td>${escape(e.record_date)}</td><td>${escape(e.clock_in || "—")}</td><td>${escape(e.clock_out || "—")}</td><td>${e.queue ? `รับเข้าคิว ${escape(e.queue)} แล้ว (ติดตามผลในคิวบันทึก)` : escape(problems(e,adapter.exists).join(" · ") || "พร้อมส่งเข้าคิว")}${!e.queue ? `<br><button type="button" data-edit="${i}">ตรวจ / เติมส่วนที่ขาด</button> <button type="button" data-send="${i}" ${problems(e,adapter.exists).length ? "disabled" : ""}>ส่งเข้าคิว</button>` : ""}</td></tr>`).join("")}</tbody></table></div>
        <div data-editor></div><details><summary>ข้อมูลต้นฉบับทุกแถว / แถวที่อ่านไม่ได้</summary><pre>${escape(batch.rows.map((r,i)=>`${i+1}: ${JSON.stringify(r)}`).join("\n"))}</pre>${batch.rejected.map(r=>`<p>แถว ${r.line}: ${escape(r.reason)}</p>`).join("")}</details>`;
      q("[data-original]").onclick = () => { const url = URL.createObjectURL(batch.file); const a=document.createElement("a"); a.href=url; a.download=batch.name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); };
      dialog.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { if (!busy) editor(Number(b.dataset.edit)); });
      dialog.querySelectorAll("[data-send]").forEach(b => b.onclick = () => guarded(async () => {
        const i=Number(b.dataset.send); let entry=batch.entries[i];
        if (entry.queue || problems(entry,adapter.exists).length) return;
        message("กำลังส่งเข้าคิว กรุณารอ...");
        // Persist an identical payload before sending, so a network retry keeps its identity.
        if (!entry.prepared) {
          const prepared = adapter.prepare({...entry, clock_in:entry.clock_in.slice(0,5),clock_out:entry.clock_out.slice(0,5)}, {submission_uid:crypto.randomUUID(), batch:batch.id, file:batch.name, device:batch.device, lines:entry.lines, original_rows:entry.lines.map(line=>batch.rows[line-1]), corrections:entry.corrections || []});
          const updated = {...batch, entries:batch.entries.map((value,index)=>index===i?{...entry,prepared}:value)};
          await storage("put",updated); batch=updated; entry=batch.entries[i];
        }
        const result = await adapter.send(entry.prepared);
        entry.queue = result.id;
        await storage("put",batch); draw(); await history();
        message("รับเข้าคิวแล้ว กรุณาติดตามผลการบันทึกที่เมนูคิวบันทึก");
      }));
    }
    function editor(i) {
      const entry=batch.entries[i];
      if (entry.prepared) { message("รายการนี้เคยเริ่มส่งแล้ว กรุณาตรวจคิวบันทึกก่อนแก้ไข หรือส่งซ้ำด้วยข้อมูลเดิม"); return; }
      q("[data-editor]").innerHTML = `<form data-edit-form><h3>ตรวจรายการแถว ${escape(entry.lines.join(", "))}</h3><label>รหัสพนักงาน <input name="emp_code" required value="${escape(entry.emp_code)}"></label><label>วันที่ <input type="date" name="record_date" required value="${escape(entry.record_date)}"></label><label>เข้า <input type="time" name="clock_in" required value="${escape(entry.clock_in.slice(0,5))}"></label><label>ออก <input type="time" name="clock_out" required value="${escape(entry.clock_out.slice(0,5))}"></label><label>เหตุผล / สิ่งที่ตรวจสอบ <input name="reason" required></label><button type="submit">บันทึกการตรวจ / เติมเวลา</button></form>`;
      q("[data-edit-form]").onsubmit = e => { e.preventDefault(); const f=new FormData(e.currentTarget); guarded(async()=> {
        const reason=String(f.get("reason")).trim(); if (!reason) throw new Error("กรุณาระบุเหตุผล");
        const next={...entry,emp_code:String(f.get("emp_code")).trim(),record_date:String(f.get("record_date")),clock_in:String(f.get("clock_in")),clock_out:String(f.get("clock_out")),review:""};
        const errors=problems(next,adapter.exists); if(errors.length) throw new Error(errors.join(" · "));
        next.corrections=[...(entry.corrections || []),{before:{emp_code:entry.emp_code,record_date:entry.record_date,clock_in:entry.clock_in,clock_out:entry.clock_out,review:entry.review || ""},reason,actor:adapter.actor,at:new Date().toISOString()}];
        const updated={...batch,entries:batch.entries.map((v,n)=>n===i?next:v)};
        await storage("put",updated); batch=updated; draw(); message("บันทึกการตรวจแล้ว ยังไม่ส่งเข้าคิวค่าแรง");
      }); };
    }
    q("[data-read]").onclick = () => guarded(async()=> {
      file=q("[data-file]").files[0]; if(!file) throw new Error("กรุณาเลือกไฟล์");
      if(file.size>10*1024*1024) throw new Error("ไฟล์เกิน 10 MB กรุณาแบ่งช่วงข้อมูลก่อน");
      parsed=parse(new TextDecoder(q("[data-encoding]").value,{fatal:true}).decode(await file.arrayBuffer()),q("[data-delimiter]").value === "tab" ? "\t" : q("[data-delimiter]").value);
      if(!parsed.length) throw new Error("ไฟล์ว่าง");
      const width=Math.max(...parsed.slice(0,100).map(r=>r.length));
      const fields={employee:"รหัสพนักงาน",date:"วันที่ YYYY-MM-DD",in:"เวลาเข้า (แบบคู่)",out:"เวลาออก (แบบคู่)",time:"เวลาสแกน (แบบเหตุการณ์)",direction:"ประเภทเข้า/ออก (แบบเหตุการณ์)"};
      q("[data-preview]").innerHTML=`<h3>จับคู่คอลัมน์</h3><pre>${escape(parsed.slice(0,6).map(r=>JSON.stringify(r)).join("\n"))}</pre><label><input type="checkbox" data-header checked> แถวแรกเป็นหัวตาราง</label><label>รูปแบบ <select data-mode><option value="pair">หนึ่งแถวมีเวลาเข้าและออก</option><option value="event">หนึ่งแถวต่อการสแกน</option></select></label>${Object.entries(fields).map(([key,label])=>`<label>${label}<select data-map="${key}"><option value="-1">ไม่มี / เลือกคอลัมน์</option>${Array.from({length:width},(_,i)=>`<option value="${i}">${i+1}: ${escape(parsed[0][i] || "")}</option>`).join("")}</select></label>`).join("")}<label>ค่าที่หมายถึงเข้า <input data-in-value value="IN"></label><label>ค่าที่หมายถึงออก <input data-out-value value="OUT"></label><label>ชื่อเครื่อง / รหัสเครื่อง <input data-device placeholder="เช่น ประตูโรงงาน-01" required></label><button type="button" data-import>นำเข้าและตรวจข้อมูล</button>`;
      q("[data-work]").innerHTML=""; message("ตรวจตัวอย่างและเลือกคอลัมน์ให้ตรง ไม่มีการเดาประเภทเข้า/ออกจากตัวเลข");
      q("[data-import]").onclick=()=>guarded(async()=> {
        const map=Object.fromEntries([...dialog.querySelectorAll("[data-map]")].map(e=>[e.dataset.map,e.value]));
        const mode=q("[data-mode]").value, header=q("[data-header]").checked, iv=q("[data-in-value]").value.trim(), ov=q("[data-out-value]").value.trim(),device=q("[data-device]").value.trim();
        if (!device || map.employee === "-1" || map.date === "-1") throw new Error("กรุณาระบุเครื่องและเลือกคอลัมน์รหัสพนักงาน / วันที่");
        if (mode === "event" && (map.time === "-1" || map.direction === "-1" || !iv || !ov || iv===ov)) throw new Error("เลือกคอลัมน์เวลาและประเภท พร้อมค่าเข้า/ออกที่ต่างกัน");
        if (mode === "pair" && map.in === "-1" && map.out === "-1") throw new Error("เลือกคอลัมน์เวลาอย่างน้อยหนึ่งช่อง");
        const keys=mode === "pair" ? ["employee","date","in","out"] : ["employee","date","time","direction"];
        const selected=keys.map(k=>map[k]).filter(v=>v!=="-1");
        if (new Set(selected).size!==selected.length) throw new Error("ห้ามเลือกคอลัมน์เดียวกันให้หลายช่อง");
        const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await file.arrayBuffer()))).map(b=>b.toString(16).padStart(2,"0")).join("");
        const id=JSON.stringify([device,hash]); const existing=await storage("get",id);
        if(existing) {batch=existing;draw();message("ไฟล์นี้เคยนำเข้าจากเครื่องนี้แล้ว เปิดรายการเดิมให้ตรวจต่อ");return;}
        batch={id,name:file.name,file,device,created:new Date().toISOString(),actor:adapter.actor,header,rows:parsed,map,mode,inValue:iv,outValue:ov,...convert(parsed,map,mode,header,iv,ov)};
        if(adapter.resolveScannerCode) batch.entries=batch.entries.map(e=>({...e,emp_code:adapter.resolveScannerCode(e.emp_code)||e.emp_code}));
        await storage("put",batch);draw();await history();
        const count=batch.entries.filter(e=>problems(e,adapter.exists).length).length;
        const notice=`นำเข้าเก็บบนเครื่องนี้แล้ว: ต้องตรวจ/เติมเวลา ${count} รายการ · อ่านไม่ได้ ${batch.rejected.length} แถว ยังไม่ส่งคำนวณค่าแรง`;
        message(notice); window.alert(notice);
      });
    });
    await guarded(async () => {
      await history();
      if (initialBatchId) { batch = await storage("get", initialBatchId); if (batch) draw(); }
    });
  }
  function openRemote(selectedDate, adapter) {
    if (document.querySelector("#scannerRemoteDialog")) return;
    const key="apws_contest_scanner_remote_draft_v1", tokenKey="apws_contest_scanner_bridge_token";
    let saved={}, token="";
    try { saved=JSON.parse(localStorage.getItem(key)||"{}")||{}; token=sessionStorage.getItem(tokenKey)||""; } catch (_) {}
    const dialog=document.createElement("dialog"); dialog.id="scannerRemoteDialog";
    dialog.setAttribute("aria-labelledby","scannerRemoteTitle");
    dialog.innerHTML=`<div class="scanner-head"><h2 id="scannerRemoteTitle">ดึงข้อมูลจากเครื่องสแกน</h2><button type="button" data-close>ปิด</button></div>
      <p class="scanner-connection-status" role="status">ยังไม่ได้ตรวจการเชื่อมต่อ</p>
      <p>เปิดตัวเชื่อม HIP บนคอมนี้ แล้วตรวจสถานะก่อนดึงข้อมูล ใช้กับพนักงานรายวันเท่านั้น</p>
      <form><label>ชื่อเครื่อง<input name="device" maxlength="100" value="${escape(saved.device||"ประตูแรก")}" required></label>
      <label>IP เครื่องสแกน<input name="host" maxlength="15" value="${escape(saved.host||"192.168.1.224")}" required></label>
      <label>ตั้งแต่วันที่<input name="start" type="date" value="${escape(date(saved.start)||date(selectedDate))}" required></label>
      <label>ถึงวันที่<input name="end" type="date" value="${escape(date(saved.end)||date(selectedDate))}" required></label>
      <label>รหัสเชื่อมคอม<input name="token" type="password" autocomplete="off" maxlength="128" value="${escape(token)}" placeholder="คัดลอกจากหน้ารหัสบนคอม" required></label>
      <p class="scanner-local-note"><a href="http://127.0.0.1:18765/pair" target="_blank" rel="noopener noreferrer">เปิดหน้ารหัสบนคอมนี้</a> · หากเปิดไม่ได้ ให้รัน start_scanner_bridge.bat บนคอมที่ติดตั้ง HIP PremiumTime ก่อน หากเบราว์เซอร์ถามสิทธิ์เข้าถึงเครือข่ายภายใน ให้อนุญาตเว็บนี้</p>
      <p data-message role="status" aria-live="polite"></p>
      <div class="scanner-remote-footer"><button class="btn btn-outline" type="submit">ตรวจการเชื่อมต่อ</button><button class="btn btn-primary" type="button" data-read disabled>ดึงข้อมูลวันที่เลือก</button></div></form>
      <div data-results></div>`;
    document.body.append(dialog);dialog.showModal();
    const q=s=>dialog.querySelector(s), status=q('.scanner-connection-status'), message=q('[data-message]');
    let busy=false, connected=false, latest=null;
    const setBusy=value=>{busy=value;q('[type="submit"]').disabled=value;q('[data-read]').disabled=value||!connected;dialog.querySelectorAll('input').forEach(e=>e.disabled=value);};
    q('[data-close]').onclick=()=>{if(!busy)dialog.close();};
    dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});dialog.onclose=()=>dialog.remove();
    function input() {
      const values=Object.fromEntries(new FormData(q('form')));
      for(const k of Object.keys(values))values[k]=String(values[k]).trim();
      if(!values.device || !date(values.start)||!date(values.end)||values.start>values.end)throw Error('กรุณาระบุชื่อเครื่องและช่วงวันที่ให้ถูกต้อง');
      if(!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(values.host)||values.host.split('.').some(n=>Number(n)>255))throw Error('กรุณาระบุ IP ให้ถูกต้อง');
      values.host=values.host.split('.').map(Number).join('.');
      if(!/^[a-f0-9]{64}$/.test(values.token))throw Error('กรุณาคัดลอกรหัส 64 ตัวจากหน้ารหัสบนคอมนี้');
      localStorage.setItem(key,JSON.stringify({device:values.device,host:values.host,start:values.start,end:values.end}));
      sessionStorage.setItem(tokenKey,values.token);
      q('[name="host"]').value=values.host;return values;
    }
    async function request(route,values) {
      let response;
      try { response=await fetch('http://127.0.0.1:18765/'+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+values.token},body:JSON.stringify({host:values.host,start:values.start,end:values.end}),signal:AbortSignal.timeout(100000)}); }
      catch(e){throw Error(e.name==='TimeoutError'?'อ่านข้อมูลนานเกินกำหนด ตรวจเครื่องแล้วลองใหม่':'ติดต่อโปรแกรมตัวกลางบนคอมนี้ไม่ได้ ตรวจว่าเปิด start_scanner_bridge.bat แล้ว และอนุญาตการเข้าถึงเครือข่ายภายในในเบราว์เซอร์');}
      const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'อ่านเครื่องไม่สำเร็จ');return result;
    }
    function clockText(clock) { return Array.isArray(clock)?`${clock[0]}-${String(clock[1]).padStart(2,'0')}-${String(clock[2]).padStart(2,'0')} ${clock.slice(3,6).map(n=>String(n).padStart(2,'0')).join(':')}`:'—'; }
    async function run(read) {
      if(busy)return;
      let values;
      try { values=input(); } catch(e){message.textContent=e.message;return;}
      setBusy(true);message.textContent=read?'กำลังอ่านรายการสแกน กรุณารอ...':'กำลังตรวจเครื่องผ่าน HIP...';
      q('[data-results]').innerHTML='';latest=null;
      try {
        const result=await request(read?'read':'status',values);connected=true;
        status.textContent=`เชื่อมต่อแล้ว · ${result.product} · ${result.ip}`;
        message.textContent=`เวลาเครื่อง ${clockText(result.device_clock)} · ผู้ใช้ ${result.counts?.['2']??'—'} · บันทึกในเครื่อง ${result.counts?.['6']??'—'} รายการ`;
        const c=result.device_clock;
        if(Array.isArray(c)) {
          const clock=new Date(c[0],c[1]-1,c[2],c[3],c[4],c[5]);
          if(Math.abs(clock.getTime()-Date.now())>5*60*1000) message.textContent+=' · คำเตือน: เวลาเครื่องต่างจากคอมเกิน 5 นาที ตรวจเวลาที่เครื่องก่อนใช้คำนวณค่าแรง';
        }
        if(read) {
          latest=result;
          if(!result.selected_count) { q('[data-results]').innerHTML=`<div class="scanner-empty"><strong>อ่านเครื่องสำเร็จ — ไม่มีรายการในช่วงวันที่เลือก</strong><p>${escape(result.start)} ถึง ${escape(result.end)} · อ่านจากเครื่องทั้งหมด ${result.total} รายการ</p></div>`;return; }
          // Keep all returned fields. Verification codes are not assumed to be IN/OUT.
          q('[data-results]').innerHTML=`<h3>พบ ${result.selected_count} รายการ</h3><p>เก็บต้นฉบับบนคอมแล้ว รายการนี้ยังไม่เข้าค่าแรง ต้องตรวจรหัสพนักงานและเวลาเข้า–ออกก่อน</p><button type="button" data-download>ดาวน์โหลดข้อมูลต้นฉบับ</button><button type="button" data-review>ตรวจรายการและเติมเวลา</button><div class="scanner-remote-table"><table><thead><tr><th>รหัสในเครื่อง</th><th>วันเวลาสแกน</th><th>รหัสการสแกน</th></tr></thead><tbody>${result.records.map(r=>`<tr><td>${escape(r.user_id)}</td><td>${escape(clockText([r.year,r.month,r.day,r.hour,r.minute,r.second]))}</td><td>${escape(r.verify_mode)}</td></tr>`).join('')}</tbody></table></div>`;
          q('[data-download]').onclick=()=>{
            const url=URL.createObjectURL(new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`HIP-${result.start}-${result.end}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
          };
          q('[data-review]').onclick=async()=>{
            if(busy)return;setBusy(true);
            try {
              const raw=JSON.stringify({ip:result.ip,records:result.records});
              const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))).map(b=>b.toString(16).padStart(2,'0')).join('');
              const id='remote:'+hash;let batch=await storage('get',id);
              if(!batch){
                const rows=result.records.map(r=>[String(r.user_id),`${r.year}-${String(r.month).padStart(2,'0')}-${String(r.day).padStart(2,'0')}`,[r.hour,r.minute,r.second].map(n=>String(n).padStart(2,'0')).join(':'),String(r.verify_mode),JSON.stringify(r)]);
                const groups=new Map();rows.forEach((row,i)=>{const k=JSON.stringify(row.slice(0,2));if(!groups.has(k))groups.set(k,{emp_code:adapter.resolveScannerCode(row[0]) || '',record_date:row[1],clock_in:'',clock_out:'',review:'ยังไม่ยืนยันประเภทเข้า–ออก ตรวจรหัสและเวลาสแกนต้นฉบับก่อนกรอก',lines:[]});groups.get(k).lines.push(i+1);});
                batch={id,name:`HIP-LAN-${result.start}-${result.end}.json`,device:result.ip,created:result.captured_at,actor:adapter.actor,header:false,rows,entries:[...groups.values()],rejected:[],ignored:[],file:new Blob([JSON.stringify(result,null,2)],{type:'application/json'})};
                await storage('put',batch);
              }
              dialog.close();await open(adapter,id);
              window.alert(`รับรายการสแกนแล้ว ${result.selected_count} รายการ กรุณาตรวจ ${batch.entries.length} กลุ่มพนักงาน/วัน และระบุเวลาเข้า–ออกก่อนส่งเข้าคิว`);
            }catch(e){message.textContent='เก็บรายการรอตรวจไม่สำเร็จ: '+e.message;}finally{setBusy(false);}
          };
        }
      }catch(e){connected=false;status.textContent='ยังเชื่อมต่อหรืออ่านข้อมูลไม่สำเร็จ';message.textContent=e.message;}
      finally{setBusy(false);}
    }
    q('form').onsubmit=e=>{e.preventDefault();run(false);};q('[data-read]').onclick=()=>run(true);
    for(const selector of ['[name="host"]','[name="token"]'])q(selector).addEventListener('input',()=>{connected=false;q('[data-read]').disabled=true;status.textContent='ข้อมูลเชื่อมต่อเปลี่ยนแล้ว กรุณาตรวจใหม่';});
  }

  const api={parse,date,time,convert,problems,open,openRemote,rosterMap};
  if(typeof module!=="undefined" && module.exports) module.exports=api;
  else root.ScannerImport=api;
})(typeof window!=="undefined"?window:globalThis);
