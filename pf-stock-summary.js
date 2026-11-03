(function () {
  "use strict";
  const escape = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const number = (v) => Number(v || 0).toLocaleString("th-TH", { maximumFractionDigits: 3 });
  const money = (v) => `฿${Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const time = (v) => v ? new Date(v).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" }) : "—";
  const titles = { "stock-overview": "สรุปสต็อก", "stock-cold": "Stock ห้องเย็น", "stock-packaging": "Stock บรรจุภัณฑ์", "stock-prices": "ตั้งราคาขาย" };

  function create(options) {
    let root = null, view = "stock-overview", data = null, loading = false, saving = "", error = "", message = "", loadedAt = 0;
    let metric = "value", query = "";
    const drafts = {};
    const rows = () => (data?.packaging?.items || []).filter(r => `${r.name} ${r.size || ""} ${r.specification || ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const name = (r) => [r.name, r.size, r.specification].filter(Boolean).join(" · ");
    const ensure = (r) => { if (r?.error) throw new Error(typeof r.error === "string" ? r.error : r.error.error || "ไม่สามารถโหลดข้อมูลได้"); return r?.data || r; };
    async function load() {
      if (loading || saving) return;
      loading = true; error = ""; paint();
      try {
        const next = ensure(await options.request("/api/accounting/stock-summary"));
        if (!Array.isArray(next?.packaging?.items)) throw new Error("รูปแบบข้อมูลสต็อกไม่ถูกต้อง");
        const costs = ensure(await options.request("/api/accounting/stock-costs"));
        data = { ...next, costs }; loadedAt = Date.now();
      } catch (e) { error = e.message || "โหลดสต็อกไม่สำเร็จ"; }
      finally { loading = false; paint(); }
    }
    function cold() {
      const pallets = data?.costs?.cold?.pallets;
      if (Array.isArray(pallets)) {
        const stored = pallets.filter(p=>p.status==='stored');
        const weight = owner => stored.filter(p=>p.owner===owner).reduce((sum,p)=>sum+Number(p.boxes)*Number(p.kg_per_box),0);
        return `<section class="pfs-panel"><h2>Stock ห้องเย็น</h2><p>ของโรงงาน ${number(weight('own'))} กก. · ฝากแช่ ${number(weight('guest'))} กก.</p><p>ยังไม่มีราคาหรือต้นทุนสินค้าสำเร็จสำหรับประเมินมูลค่า จึงไม่ตีมูลค่าเป็นศูนย์และไม่นับของฝากแช่เป็นสินทรัพย์ของโรงงาน</p></section>`;
      }
      return `<section class="pfs-panel pfs-unavailable"><span class="pfs-eyebrow">COLD STORAGE</span><h2>ยังไม่มีข้อมูลห้องเย็นที่ยืนยันได้</h2><p>ยังโหลดข้อมูลห้องเย็นไม่ได้ กรุณารีเฟรชข้อมูล</p><div class="pfs-placeholder"><span>จำนวนกล่อง <b>—</b></span><span>น้ำหนัก (กก.) <b>—</b></span><span>มูลค่าพร้อมขาย <b>—</b></span></div><small>เมื่อเชื่อมข้อมูลจริง จะแยกตามชนิดผลไม้แปรรูปและหน่วยขาย โดยไม่นับสินค้าฝากแช่เป็นสินค้าของบริษัท</small></section>`;
    }
    function chart() {
      const items = rows().filter(r => Number(r.balance_qty) > 0).sort((a, b) => Number(b.sale_value || 0) - Number(a.sale_value || 0));
      // Different counting units must never share a quantity scale.
      const units = metric === "quantity" ? [...new Set(items.map(r => r.unit))] : [null];
      return `<section class="pfs-panel"><header class="pfs-panel-head"><div><h2>บรรจุภัณฑ์คงเหลือ</h2><p>จำนวนจริงจาก Stock · ประเมินด้วยราคาขายที่ตั้งไว้</p></div><div class="pfs-switch">${[["value", "มูลค่า"], ["quantity", "จำนวน"]].map(([id, label]) => `<button type="button" data-pfs-metric="${id}" aria-pressed="${metric === id}">${label}</button>`).join("")}</div></header>${!items.length ? '<p class="pfs-empty">ไม่มีรายการคงเหลือที่ตรงกับการค้นหา</p>' : units.map(unit => {
        const group = unit === null ? items : items.filter(r => r.unit === unit);
        const value = r => metric === "value" ? Number(r.sale_value || 0) : Number(r.balance_qty || 0);
        const max = Math.max(1, ...group.map(value));
        return `${unit !== null ? `<h3>หน่วย: ${escape(unit)}</h3>` : ""}<div class="pfs-bars">${group.map(r => `<article class="pfs-bar-row"><div><strong>${escape(name(r))}</strong><small>${number(r.balance_qty)} ${escape(r.unit)}${r.sale_price !== null ? ` · ${money(r.sale_price)} / ${escape(r.unit)}` : ""}</small></div><div class="pfs-track" aria-label="${escape(name(r))}: ${metric === "value" ? r.sale_value === null ? "ยังไม่ตั้งราคา" : money(r.sale_value) : number(r.balance_qty) + ' ' + escape(r.unit)}"><i style="width:${value(r) / max * 100}%"></i></div><b>${metric === "value" ? r.sale_value === null ? '<span class="pfs-missing">ยังไม่ตั้งราคา</span>' : money(r.sale_value) : number(r.balance_qty) + ' ' + escape(r.unit)}</b></article>`).join("")}</div>`;
      }).join("")}</section>`;
    }
    function priceTable() {
      return `<section class="pfs-panel"><header class="pfs-panel-head"><div><h2>ราคาขายบรรจุภัณฑ์</h2><p>ราคาต่อหน่วยนับใน Stock · มีผลทันทีเมื่อบันทึก · ไม่เปลี่ยนต้นทุนรับเข้า</p></div></header><div class="pfs-table-wrap"><table><thead><tr><th>สินค้า</th><th>คงเหลือ</th><th>ราคาขาย / หน่วย (บาท)</th><th>แก้ไขล่าสุด</th><th>บันทึก</th></tr></thead><tbody>${rows().map(r => `<tr><td><strong>${escape(r.name)}</strong><small>${escape([r.size, r.specification].filter(Boolean).join(" · "))}</small></td><td>${number(r.balance_qty)} ${escape(r.unit)}</td><td><form id="pfs-price-${escape(r.id)}" data-pfs-price="${escape(r.id)}"><label><input aria-label="ราคาขาย ${escape(name(r))}" name="price" data-pfs-draft="${escape(r.id)}" type="number" min="0" max="1000000000" step="0.0001" required value="${escape(drafts[r.id]?.value ?? r.sale_price ?? "")}" placeholder="ยังไม่ตั้งราคา" ${saving ? "disabled" : ""}><span>/ ${escape(r.unit)}</span></label></form></td><td><small>${time(r.price_updated_at)}<br>${escape(r.price_updated_by || "")}</small></td><td><button class="pfs-button pfs-primary" form="pfs-price-${escape(r.id)}" type="submit" ${saving || loading || error ? "disabled" : ""}>${saving === String(r.id) ? "กำลังบันทึก…" : "บันทึก"}</button>${drafts[r.id] ? `<button type="button" class="pfs-button" data-pfs-reset="${escape(r.id)}" ${saving ? "disabled" : ""}>ใช้ราคาล่าสุด</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="5" class="pfs-empty">ยังไม่มีรายการบรรจุภัณฑ์ที่ตรงกับการค้นหา</td></tr>'}</tbody></table></div></section><p class="pfs-footnote">รายการที่ไม่ตั้งราคาจะไม่นับรวมมูลค่า · ราคา 0 คือกำหนดให้ไม่มีมูลค่าขาย ไม่ใช่ราคาที่ยังไม่ได้ตั้ง</p><section class="pfs-panel"><h2>ราคาขายผลไม้แปรรูป</h2><p>ยังไม่กำหนดราคาขายสินค้าสำเร็จ จึงแสดงเฉพาะจำนวนจริงจากห้องเย็น</p></section>`;
    }
    function costsPanel() {
      const sections=data?.costs?.sections;
      if(!Array.isArray(sections))return '<section class="pfs-panel"><h2>ต้นทุนสต็อก</h2><p>ยังโหลดข้อมูลต้นทุนไม่ได้</p></section>';
      return `<section class="pfs-panel"><h2>ต้นทุนและมูลค่าคงเหลือทุกสต็อก</h2><p>ต้นทุนรับเข้าและเบิก แยกจากราคาขายด้านบน ไม่ใช่ยอดจ่ายเงินหรือรายได้ใหม่</p></section>${sections.map(section=>{
        if(section.error)return `<section class="pfs-panel"><h2>${escape(section.title)}</h2><p>${escape(section.error)}</p></section>`;
        const fruit=section.id==='fruit';
        const items=fruit?(section.balances||[]):(section.items||[]);
        const total=items.reduce((sum,r)=>sum+Number(r.inventory_value||0),0);
        const movements=fruit?[...(section.receipts||[]).map(r=>({...r,type:'receipt',quantity:r.weight_kg,unit:'กก.',item_name:r.fruit_name,unit_price:r.price_per_kg,occurred_on:r.received_at})),...(section.issues||[]).map(r=>({...r,type:'issue',quantity:r.weight_kg,unit:'กก.',item_name:r.fruit_name,total_amount:r.total_cost,occurred_on:r.issued_at}))]:(section.movements||[]);
        return `<section class="pfs-panel"><h2>Stock ${escape(section.title)} · ${money(total)}</h2><div class="pfs-table-wrap"><table><thead><tr><th>รายการ</th><th>คงเหลือ</th><th>ต้นทุนเฉลี่ย / หน่วย</th><th>มูลค่าคงเหลือ</th></tr></thead><tbody>${items.map(r=>{const qty=Number(fruit?r.balance_weight:r.balance_qty);return `<tr><td>${escape(fruit?r.fruit_name:r.name)}</td><td>${number(qty)} ${escape(fruit?'กก.':r.unit)}</td><td>${qty?money(Number(r.inventory_value)/qty):'—'}</td><td>${money(r.inventory_value)}</td></tr>`;}).join('')||'<tr><td colspan="4">ยังไม่มีรายการ</td></tr>'}</tbody></table></div><details><summary>รายละเอียดเงินรับเข้า / เบิก (${movements.length} รายการ)</summary><div class="pfs-table-wrap"><table><thead><tr><th>วันที่</th><th>ประเภท</th><th>สินค้า</th><th>จำนวน</th><th>ราคา / หน่วย</th><th>มูลค่า</th></tr></thead><tbody>${movements.sort((a,b)=>String(b.occurred_on).localeCompare(String(a.occurred_on))).map(r=>`<tr><td>${escape(r.occurred_on||'')}</td><td>${r.type==='receipt'?'รับเข้า':'เบิก'}</td><td>${escape(r.item_name||'')}</td><td>${number(r.quantity)} ${escape(r.unit||'')}</td><td>${money(r.unit_price ?? (Number(r.quantity)?Number(r.total_amount)/Number(r.quantity):0))}</td><td>${money(r.total_amount)}</td></tr>`).join('')}</tbody></table></div></details></section>`;
      }).join('')}`;
    }
    function paint() {
      if (!root || !root.isConnected) return;
      const packaging = data?.packaging;
      const hasData = Boolean(data);
      root.innerHTML = `<section class="acr-page pfs-page"><header class="acr-page-head"><div><p>PF ACCOUNTING / STOCK</p><h1>${titles[view] || titles['stock-overview']}</h1><span>มูลค่าสต็อกตามราคาขาย · ${hasData ? `ข้อมูล ณ ${time(data.as_of)}` : "กำลังตรวจสอบข้อมูลส่วนกลาง"}</span></div><button type="button" class="pfs-button" data-pfs-refresh ${loading || saving ? "disabled" : ""}>${loading ? "กำลังโหลด…" : "รีเฟรชข้อมูล"}</button></header>${error ? `<div class="pfs-notice is-error" role="alert">${escape(error)}${hasData ? " · กำลังแสดงข้อมูลที่โหลดครั้งก่อน กรุณารีเฟรช" : ""}</div>` : ""}${message ? `<div class="pfs-notice" role="status">${escape(message)}</div>` : ""}${!hasData ? `<section class="pfs-panel pfs-empty">${loading ? "กำลังโหลดสต็อกและราคาขายจากฐานกลาง…" : "ยังแสดงมูลค่าไม่ได้ กรุณาลองรีเฟรชข้อมูล"}</section>` : `${view === "stock-overview" ? `<div class="pfs-kpis"><article><span>มูลค่าผลผลิตพร้อมขาย</span><strong>—</strong><small>ยังไม่กำหนดราคาสินค้าสำเร็จ</small></article><article><span>มูลค่าบรรจุภัณฑ์${packaging.unpriced_in_stock ? " (บางส่วน)" : ""}</span><strong>${money(packaging.priced_value)}</strong><small>เฉพาะรายการที่ตั้งราคาขายแล้ว</small></article><article><span>คงเหลือที่ยังไม่มีราคา</span><strong>${number(packaging.unpriced_in_stock)} <small>รายการ</small></strong><small>ไม่นำมารวมเป็นมูลค่า 0</small></article></div>` : ""}${view !== "stock-cold" ? `<div class="pfs-toolbar"><label>ค้นหาบรรจุภัณฑ์<input type="search" data-pfs-search value="${escape(query)}" placeholder="ชื่อ / ขนาด / รายละเอียด"></label>${view !== "stock-prices" ? '<button type="button" class="pfs-button" data-pfs-prices>ตั้งราคาขาย →</button>' : ""}</div>` : ""}${view === "stock-cold" ? cold() : view === "stock-prices" ? priceTable() : `${packaging.unpriced_in_stock ? `<p class="pfs-notice">มีสินค้าคงเหลือ ${number(packaging.unpriced_in_stock)} รายการที่ยังไม่ตั้งราคา ยอดมูลค่าจึงยังไม่ครบ</p>` : ""}${chart()}${view === "stock-overview" ? cold() : ""}<p class="pfs-footnote">มูลค่าประเมินตามราคาขาย ไม่ใช่รายได้หรือกำไรที่เกิดขึ้นแล้ว และไม่รวมกับมูลค่าผลผลิตเพื่อป้องกันการนับซ้ำ</p>`}`}${view === "stock-overview" ? costsPanel() : ""}</section>`;
    }
    function attach(target, nextView) {
      root = target; view = nextView; paint();
      root.onclick = event => {
        const button = event.target.closest("button"); if (!button) return;
        if (button.dataset.pfsReset) { delete drafts[button.dataset.pfsReset]; paint(); }
        if (button.hasAttribute("data-pfs-refresh")) { message = ""; load(); }
        if (button.hasAttribute("data-pfs-prices")) options.navigate("stock-prices");
        if (button.dataset.pfsMetric) { metric = button.dataset.pfsMetric; paint(); }
      };
      root.oninput = event => {
        const id = event.target.dataset.pfsDraft;
        if (id) { const row = data.packaging.items.find(r => String(r.id) === id); drafts[id] = { value: event.target.value, revision: drafts[id]?.revision ?? row.price_revision }; }
      };
      root.onchange = event => { if (event.target.hasAttribute("data-pfs-search")) { query = event.target.value; paint(); } };
      root.onsubmit = async event => {
        if (!event.target.matches("[data-pfs-price]")) return;
        event.preventDefault(); if (saving || loading || error) return;
        const id = event.target.dataset.pfsPrice, row = data.packaging.items.find(r => String(r.id) === id);
        const value = event.target.elements.price.value;
        if (!row || value === "" || !event.target.checkValidity()) return;
        const revision = drafts[id]?.revision ?? row.price_revision;
        saving = id; message = ""; paint();
        try {
          ensure(await options.request("/api/accounting/stock-sale-price", { method: "PUT", body: { item_id: id, price: Number(value), revision } }));
          delete drafts[id]; message = `บันทึกราคาขาย ${row.name} เรียบร้อยแล้ว`;
        } catch (e) { message = ""; error = e.message || "บันทึกไม่สำเร็จ"; }
        finally { saving = ""; }
        if (!error) await load(); else paint();
      };
      if (!loading && (!data || Date.now() - loadedAt > 60000)) load();
    }
    return { attach };
  }
  window.PfStockSummary = { create };
})();
