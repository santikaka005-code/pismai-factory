# Pismai Factory Wage

ระบบต้นแบบสำหรับจัดการค่าแรงผลิตในโรงงานแบบ HTML, CSS และ JavaScript ล้วน

## วิธีเปิดใช้งาน

เปิดไฟล์ `index.html` ใน browser ได้ทันที ไม่ต้องติดตั้ง dependency

## Login Demo

| Username | Password | Role |
| --- | --- | --- |
| admin | admin123 | admin |
| hr | hr123 | hr |
| operator | op123 | operator |

## สิ่งที่มีในตอนนี้

- Login mock ด้วย JavaScript
- เก็บ session/token จำลองใน `localStorage`
- Redirect ไป Dashboard หลัง login
- Role guard ตามเมนู
- โครง Sidebar ตาม Project modules:
  `Dashboard`, `Production`, `Stock`, `Warehouse`, `Reports`, `Audit Log`, `Backup`, `Setting`
- Dashboard พร้อมข้อมูลตัวอย่าง
- Production Management เป็นโมดูลหลัก:
  `Dashboard`, `New Session`, `Fast Entry`, `Batch Entry`, `Summary`, `Reports`, `Print`, `Audit Log`
- Production Session จำลอง table:
  `id, session_name, date, shift, pile, status, created_by, start_time, end_time`
- Production Record จำลอง table:
  `id, session_id, employee_id, date, shift, pile, water, flower, water_rate, flower_rate, water_total, flower_total, grand_total, created_by, created_at, updated_at, is_locked`
- Fast Entry ใช้คีย์บอร์ดเป็นหลัก, Enter ไปช่องถัดไป, Ctrl+S บันทึก, Esc ล้างฟอร์ม
- Batch Entry รองรับการกรอกจากใบจด โดยตรวจรหัสพนักงาน, น้ำหนักผิดปกติ, รหัสซ้ำใน batch และบันทึกแถวที่ถูกต้องได้ก่อน
- Audit Log บันทึกการเริ่ม session, เพิ่ม record, แก้ record
- Record จะ lock หลัง 5 นาที และหลังจากนั้นให้ Admin เท่านั้นที่แก้ได้
- Employee Management พร้อมโครงข้อมูลเหมือน table:
  `id, emp_code, fullname, department, shift, status, created_at, updated_at`
- Employee CRUD แบบจำลองผ่าน JavaScript และ `localStorage`
- ค้นหาพนักงานด้วย `emp_code` หรือ `fullname`
- Admin และ HR เพิ่ม/แก้ไขพนักงานได้
- เฉพาะ Admin ลบพนักงานได้
- Operator ดูข้อมูลพนักงานได้อย่างเดียว
- Wage Rate Settings สำหรับ Admin พร้อมโครงข้อมูลเหมือน table:
  `id, item_type, rate, effective_date, created_by, created_at`
- `item_type` รองรับเฉพาะ `water` และ `flower`
- ไม่แก้ไข rate records เก่า การเพิ่ม rate ใหม่จะสร้าง history row ใหม่เสมอ
- จำลอง API หา current rate ตาม production date ด้วย `apiGetCurrentRate(itemType, productionDate)`
- Production Fast Entry พร้อมโครงข้อมูลเหมือน table:
  `id, employee_id, emp_code, pile_no, water_weight, flower_weight, water_rate, flower_rate, water_amount, flower_amount, total_amount, record_date, record_time, created_by, updated_by, status, created_at, updated_at`
- จำลอง API สำหรับ fast input:
  `apiGetEmployeeByCode`, `apiCreateProductionRecord`, `apiGetLatestProductionRecords`, `apiCheckProductionDuplicate`
- Fast Input รองรับ pile no 1-5, ค้นหาพนักงานอัตโนมัติเมื่อกรอก code ครบ 5 ตัว, Ctrl+S เพื่อบันทึก, Esc เพื่อล้างฟอร์ม, Enter เพื่อไปช่องถัดไป
- หลังบันทึกจะคง pile no เดิม ล้าง employee code / water / flower และ focus กลับไปที่ employee code
- แสดง latest production records 10 รายการ
- Report Export สำหรับ Admin และ HR
- Python report backend ขนาดเล็กสร้างไฟล์ด้วย `reportlab` และ `openpyxl`
- Export PDF รายพนักงาน
- เลือกพนักงานหลายคนแล้ว export PDF เดียวหลายหน้า
- Export daily Excel ตามวันที่
- Stock และ Warehouse เป็น placeholder สำหรับทำต่อ

## หมายเหตุ

เวอร์ชันนี้ยังไม่มี backend/database หลักจริง คำสั่ง API ส่วนใหญ่ถูกจำลองเป็นฟังก์ชันใน `app.js` และเก็บข้อมูลใน `localStorage`

สำหรับรายงาน มี backend เฉพาะ export ไฟล์:

```bash
python report_server.py
```

บน Windows สามารถเปิด `start_report_server.bat` ได้เลย

Report APIs:

- `GET /reports/employee-daily-pdf?date=YYYY-MM-DD&employee_id=ID`
- `POST /reports/selected-employees-pdf`
- `GET /reports/daily-excel?date=YYYY-MM-DD`

ก่อน export หน้าเว็บจะ sync ข้อมูลจาก `localStorage` ไปที่ report backend เพื่อให้ Python สร้าง PDF/Excel จากข้อมูลล่าสุด
