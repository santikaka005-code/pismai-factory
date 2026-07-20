const SESSION_KEY = "pismai_factory_session";
const EMPLOYEES_KEY = "pismai_factory_employees";
const TIME_EMPLOYEES_KEY = "pismai_factory_time_employees";
const WAGE_RATES_KEY = "pismai_factory_wage_rates";
const PRODUCTION_RECORDS_KEY = "pismai_factory_production_records";
const PRODUCTION_SESSIONS_KEY = "pismai_factory_production_sessions";
const TIME_RECORDS_KEY = "pismai_factory_time_records";
const DEDUCTION_RECORDS_KEY = "pismai_factory_deduction_records";
const AUDIT_LOG_KEY = "pismai_factory_audit_log";
const CLOUD_MIGRATION_KEY = "pismai_factory_cloud_migration_v2";
const ACCOUNT_USERS_KEY = "pismai_factory_account_users";
const AUDIT_LOG_PASSWORD = "1150";
const ONLINE_CLIENT_KEY = "pismai_online_client_id";
const ONLINE_HEARTBEAT_INTERVAL_MS = 15000;
const REPORT_API_BASE =
  // The desktop launcher opens index.html directly. It must use the same
  // cloud API as the hosted app, otherwise its browser-only data can never
  // reach iPad or other devices.
  location.protocol === "file:" ? "https://pismai-factory-test.onrender.com" : location.origin;
let onlineUserCount = 0;
let onlineHeartbeatTimer = null;
const TIME_DAILY_WAGE = 347;
const TIME_SPECIAL_DAILY_WAGE = 365;
const TIME_STANDARD_HOURS = 8;
const TIME_NORMAL_HOURLY_RATE = TIME_DAILY_WAGE / TIME_STANDARD_HOURS;
const TIME_OT_HOURLY_RATE = 50;
const timeEmployeeTypeOptions = [
  { id: "normal_347", label: "กลุ่มปกติ - 347 บาท/วัน", shortLabel: "กลุ่มปกติ-347", category: "normal", dailyWage: 347 },
  { id: "special_365", label: "กลุ่มพิเศษ - 365 บาท/วัน", shortLabel: "กลุ่มพิเศษ-365", category: "special", dailyWage: 365 },
  { id: "special_347", label: "กลุ่มพิเศษ - 347 บาท/วัน", shortLabel: "กลุ่มพิเศษ-347", category: "special", dailyWage: 347 },
  { id: "special_500", label: "กลุ่มพิเศษ - 500 บาท/วัน", shortLabel: "กลุ่มพิเศษ-500", category: "special", dailyWage: 500 }
];
const TIME_SPECIAL_WAGE_TABLE = {
  2: 91,
  2.5: 114,
  3: 137,
  3.5: 160,
  4: 183,
  4.5: 205,
  5: 228,
  5.5: 251,
  6: 273,
  6.5: 297,
  7: 319,
  7.5: 342,
  8: 365
};
const deductionTypeOptions = [
  { id: "card", label: "ค่าบัตร" },
  { id: "equipment", label: "ค่าอุปกรณ์" },
  { id: "utilities", label: "ค่าน้ำค่าไฟ (ผู้เช่าห้องแถว)" },
  { id: "advance", label: "ค่าเบิกเงินล่วงหน้า" },
  { id: "social_security", label: "ค่าประกันสังคม" },
  { id: "tax", label: "ค่าภาษี" },
  { id: "room", label: "ค่าห้องพัก" }
];
const ATTENDANCE_BONUS_TYPE = "attendance_bonus";

const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    fullname: "System Administrator",
    role: "admin",
    isActive: true
  },
  {
    id: 2,
    username: "hr",
    password: "hr123",
    fullname: "HR Officer",
    role: "hr",
    isActive: true
  },
  {
    id: 3,
    username: "operator",
    password: "op123",
    fullname: "Production Operator",
    role: "operator",
    isActive: true
  },
  {
    id: 4,
    username: "supervisor",
    password: "sup123",
    fullname: "Production Supervisor",
    role: "supervisor",
    isActive: true
  },
  {
    id: 5,
    username: "leader",
    password: "1234",
    fullname: "Production Leader",
    role: "supervisor",
    isActive: true
  }
];

const accountRoleOptions = [
  { key: "manager", role: "admin", label: "ผู้จัดการ" },
  { key: "production_head", role: "supervisor", label: "หัวหน้าผลิต" },
  { key: "qc_head", role: "supervisor", label: "หัวหน้าQC" },
  { key: "hr", role: "hr", label: "HR" },
  { key: "general_staff", role: "operator", label: "พนักงานทั่วไป" }
];

const developerRoleOption = { key: "developer", role: "developer", label: "ผู้พัฒนา" };
const accountLevelOptions = ["C1", "C2", "C3", "C4", "C5", "C6"];
const supportedAccountLevels = [...accountLevelOptions, "C7"];
const systemDeveloperAccount = {
  id: 0,
  username: "Gxy",
  password: "147388",
  fullname: "System Admin",
  phone: "",
  role_key: "developer",
  role: "developer",
  role_label: "ผู้พัฒนา",
  level: "C6",
  isActive: true,
  is_system: true,
  created_at: "2026-07-05T00:00:00.000Z",
  updated_at: "2026-07-05T00:00:00.000Z"
};
const protectedSystemAccountProfiles = {
  gxy: systemDeveloperAccount,
  santi: {
    username: "Santi",
    fullname: "Santi Khl.",
    phone: "0943913997",
    role_key: "developer",
    role: "developer",
    role_label: "ผู้พัฒนาระบบ",
    level: "C7",
    isActive: true,
    is_system: true
  }
};

const modules = [
  {
    id: "dashboard",
    label: "หน้าหลัก",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "Production, wage, and approval overview."
  },
  {
    id: "production",
    label: "บันทึกผลผลิต",
    roles: ["admin", "operator", "supervisor"],
    description: "Session-based production entry, batch input, summary, and print workflow."
  },
  {
    id: "stock",
    label: "สต็อก",
    roles: ["admin", "hr", "operator"],
    description: "Stock module placeholder."
  },
  {
    id: "warehouse",
    label: "คลังสินค้า",
    roles: ["admin", "hr", "operator"],
    description: "Warehouse module placeholder."
  },
  {
    id: "reports",
    label: "รายงาน",
    roles: ["admin", "hr"],
    description: "Export employee daily PDF reports and daily Excel files."
  },
  {
    id: "audit-log",
    label: "ประวัติการใช้งาน",
    roles: ["admin"],
    description: "System action history."
  },
  {
    id: "backup",
    label: "สำรองข้อมูล",
    roles: ["admin"],
    description: "Local data backup tools."
  },
  {
    id: "settings",
    label: "ตั้งค่า",
    roles: ["admin"],
    description: "System settings and master data."
  },
  {
    id: "employees",
    label: "จัดการพนักงาน",
    roles: ["admin"],
    description: "Manage employee master data for production wage records.",
    hidden: true
  },
  {
    id: "wage-rates",
    label: "ตั้งค่าอัตราค่าจ้าง",
    roles: ["admin"],
    description: "Add wage rates and view effective-date history.",
    hidden: true
  }
];

modules.splice(
  0,
  modules.length,
  {
    id: "dashboard",
    label: "Home",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "ภาพรวมการทำงานประจำวัน",
    icon: "⌂",
  },
  {
    id: "production",
    label: "บันทึกผลผลิต",
    roles: ["admin", "operator", "supervisor"],
    description: "บันทึกน้ำหนักน้ำ ดอก และค่าแรง",
    icon: "▣"
  },
  {
    id: "summary-all",
    label: "สรุปผลทั้งหมด",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "ภาพรวมผลผลิต น้ำหนัก และค่าแรงทั้งหมด",
    icon: "▤"
  },
  {
    id: "summary-main",
    label: "สรุปข้อมูลหลัก",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "สรุปรายวันของผลผลิต น้ำหนัก ค่าแรง และรายละเอียดตามวันที่เลือก",
    hidden: true
  },
  {
    id: "summary-export",
    label: "Export สรุปข้อมูล",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "เตรียมพื้นที่สำหรับฟังก์ชั่น Export สรุปข้อมูล",
    hidden: true
  },
  {
    id: "summary-time-overview",
    label: "สรุปข้อมูลเวลาเข้างาน",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "เตรียมพื้นที่สำหรับสรุปข้อมูลเวลาเข้างาน",
    hidden: true
  },
  {
    id: "summary-group-report",
    label: "รายงานแบบกลุ่ม",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "สรุปผลผลิต น้ำหนัก และยอดเงินแยกตามกลุ่มรับเงิน",
    hidden: true
  },
  {
    id: "summary-person",
    label: "สรุปรายบุคคล",
    roles: ["admin", "hr"],
    description: "สรุปผลงานแยกตามพนักงาน",
    icon: "◎"
  },
  {
    id: "time-report",
    label: "บันทึกเวลาทำงาน",
    roles: ["admin", "hr"],
    description: "รายงานผลผลิตรายวัน รายสัปดาห์ และรายเดือน",
    icon: "◷"
  },
  {
    id: "compare-data",
    label: "บันทึกหักเงิน/เบี้ยขยัน",
    roles: ["admin", "hr"],
    description: "บันทึกรายการหักเงินและเบี้ยขยันสำหรับพนักงานเหมาน้ำหนักและพนักงานเหมาเวลา",
    icon: "−"
  },
  {
    id: "employees",
    label: "จัดการพนักงาน",
    roles: ["admin"],
    description: "เลือกจัดการพนักงานเหมาน้ำหนักหรือพนักงานตามเวลา",
    icon: "♙",
    hidden: true
  },
  {
    id: "production-employees",
    label: "พนักงานเหมาน้ำหนัก",
    roles: ["admin"],
    description: "จัดการรหัสพนักงานสำหรับบันทึกน้ำหนักผลไม้",
    icon: "♙",
    hidden: true
  },
  {
    id: "time-employees",
    label: "พนักงานตามเวลา",
    roles: ["admin"],
    description: "จัดการพนักงานสำหรับบันทึกเวลาและประเภทค่าแรงรายวัน",
    icon: "◷",
    hidden: true
  },
  {
    id: "pile-management",
    label: "จัดการกอง",
    roles: ["admin"],
    description: "ตั้งค่าและตรวจสอบข้อมูลกองงาน",
    icon: "▥",
    hidden: true
  },
  {
    id: "settings",
    label: "ตั้งค่า",
    roles: ["admin"],
    description: "ตั้งค่าระบบและข้อมูลหลัก",
    icon: "⚙"
  },
  {
    id: "accounting-control",
    label: "PF Accounting",
    roles: ["admin", "hr", "operator", "supervisor", "developer"],
    description: "พื้นที่คำนวณ วางแผน และติดตามงานบัญชีจากข้อมูลที่กรอกเอง",
    icon: "◉"
  },
  {
    id: "secret-room",
    label: "ห้องแห่งความลับ",
    roles: ["admin", "hr", "operator", "supervisor", "developer"],
    description: "พื้นที่เพื่อนร่วมงาน คอมมู และแชทส่วนตัวภายในองค์กร",
    icon: "◌"
  },
  {
    id: "audit-log",
    label: "Audit Log",
    roles: ["admin"],
    description: "ประวัติการใช้งานระบบ",
    icon: "◫",
    hidden: true
  },
  {
    id: "reports",
    label: "รายงาน",
    roles: ["admin", "hr"],
    description: "Export employee daily PDF reports and daily Excel files.",
    hidden: true
  },
  {
    id: "wage-rates",
    label: "ตั้งค่าอัตราค่าจ้าง",
    roles: ["admin"],
    description: "Add wage rates and view effective-date history.",
    hidden: true
  },
  {
    id: "account-management",
    label: "Register & Edit ID",
    roles: ["admin"],
    description: "Register and edit website login accounts.",
    hidden: true
  },
  {
    id: "backup",
    label: "สำรองข้อมูล",
    roles: ["admin"],
    description: "Local data backup tools.",
    hidden: true
  }
);

modules.forEach((moduleItem) => {
  if (!moduleItem.roles.includes("developer")) {
    moduleItem.roles.push("developer");
  }
});

const adminSettingsModuleIds = new Set([
  "settings",
  "employees",
  "production-employees",
  "time-employees",
  "wage-rates",
  "pile-management",
  "account-management",
  "audit-log",
  "backup"
]);

modules.forEach((moduleItem) => {
  if (adminSettingsModuleIds.has(moduleItem.id)) {
    moduleItem.roles = ["admin"];
  }
});

const levelRouteAccess = {
  C1: ["dashboard", "production", "secret-room"],
  C2: ["dashboard", "production", "summary-person", "secret-room"],
  C3: ["dashboard", "production", "summary-all", "summary-main", "compare-data", "time-report", "secret-room"],
  C4: [
    "dashboard",
    "production",
    "summary-all",
    "summary-main",
    "summary-export",
    "summary-time-overview",
    "summary-group-report",
    "summary-person",
    "compare-data",
    "reports",
    "time-report",
    "settings",
    "employees",
    "production-employees",
    "time-employees",
    "wage-rates",
    "accounting-control",
    "secret-room"
  ],
  C5: modules.map((item) => item.id).filter((id) => id !== "audit-log"),
  C6: modules.map((item) => item.id),
  C7: modules.map((item) => item.id)
};

const defaultRouteByLevel = {
  C1: "dashboard",
  C2: "dashboard",
  C3: "dashboard",
  C4: "dashboard",
  C5: "dashboard",
  C6: "dashboard",
  C7: "dashboard"
};

const builtInAccountLevels = {
  admin: "C6",
  hr: "C4",
  operator: "C1",
  supervisor: "C3",
  leader: "C1",
  Santi: "C7",
  Gxy: "C6"
};

// Employee data is managed only in the central database. Do not seed browser
// storage with sample workers, because they can be mistaken for real staff.
const defaultEmployees = [];

const primaryPayGroups = ["เหมาโรงงาน", "เหมา(นนท์)", "เหมาปุ้ย"];
const PRODUCTION_WITHHOLDING_TAX_RATE = 0.03;
const productionWithholdingTaxGroups = new Set(["เหมา(นนท์)", "เหมาปุ้ย"]);
const legacyPayGroupMap = {
  "กลุ่ม A": "เหมาโรงงาน",
  "กลุ่ม B": "เหมา(นนท์)",
  "กลุ่ม C": "เหมาปุ้ย",
  "กลุ่ม D": "เหมาปุ้ย"
};

function normalizeEmployeePayGroupValue(value) {
  const payGroup = String(value || "").trim();
  if (!payGroup) return primaryPayGroups[0];
  if (legacyPayGroupMap[payGroup]) return legacyPayGroupMap[payGroup];

  const legacySuffix = payGroup.match(/\b([ABCD])$/i)?.[1]?.toUpperCase();
  if (payGroup.includes("กลุ่ม") && legacySuffix) {
    return legacyPayGroupMap[`กลุ่ม ${legacySuffix}`] || payGroup;
  }

  return payGroup;
}

function getPayGroupToneClass(value) {
  const payGroup = normalizeEmployeePayGroupValue(value);
  const toneMap = new Map([
    ["เหมาโรงงาน", "pay-group-factory"],
    ["เหมา(นนท์)", "pay-group-non"],
    ["เหมาปุ้ย", "pay-group-pui"]
  ]);

  return toneMap.get(payGroup) || "pay-group-custom";
}

function renderPayGroupBadge(value) {
  const payGroup = normalizeEmployeePayGroupValue(value);
  return `<span class="pay-group-pill ${getPayGroupToneClass(payGroup)}">${escapeHtml(payGroup)}</span>`;
}

const defaultWageRates = [];
const productionRows = [];

const app = document.querySelector("#app");
let employeeSearch = "";
let editingEmployeeId = null;
let employeeMessage = "";
let employeeMessageType = "success";
let timeEmployeeSearch = "";
let editingTimeEmployeeId = null;
let timeEmployeeMessage = "";
let timeEmployeeMessageType = "success";
let accountSearch = "";
let editingAccountUserId = null;
let accountMode = "";
let accountMessage = "";
let accountMessageType = "success";
let backupMessage = "";
let backupMessageType = "success";
let wageRateFilter = "all";
let currentRateDate = new Date().toISOString().slice(0, 10);
let pileManagementMessage = "";
let pileManagementMessageType = "success";
let summaryDate = "";
let summaryExportStartDate = "";
let summaryExportEndDate = "";
let summaryExportOptions = {
  overview: true,
  piles: true,
  details: true
};
let summaryExportFields = {
  overview: {
    totalWeight: true,
    water: true,
    flower: true,
    grades: true,
    amount: true,
    employees: true,
    records: true
  },
  piles: {
    pile: true,
    water: true,
    flower: true,
    grades: true,
    total: true,
    amount: true
  },
  details: {
    date: true,
    time: true,
    empCode: true,
    employeeName: true,
    pile: true,
    water: true,
    flower: true,
    grades: true,
    total: true,
    amount: true,
    createdBy: true
  }
};
let summaryExportMessage = "";
let summaryExportMessageType = "success";
let summaryMainExportMenuOpen = false;
let summaryReportExportStartDate = new Date().toISOString().slice(0, 10);
let summaryReportExportEndDate = new Date().toISOString().slice(0, 10);
let summaryReportExportProduct = "all";
let summaryReportExportProductType = "ทั้งหมด";
let summaryReportExportMessage = "";
let summaryReportExportMessageType = "success";
let groupReportStartDate = new Date().toISOString().slice(0, 10);
let groupReportEndDate = new Date().toISOString().slice(0, 10);
let groupReportMode = "production";
let groupReportGroup = "all";
let groupReportFruit = "all";
let groupReportView = "group";
let groupReportMessage = "";
let groupReportMessageType = "success";
let groupReportExportMenuOpen = false;
let groupReportExportOptions = {
  summary: true,
  fruit: true,
  employees: true,
  details: false
};
let reportDate = new Date().toISOString().slice(0, 10);
let selectedReportEmployeeIds = [];
let reportMessage = "";
let reportMessageType = "success";
let personalReportEmployeeId = "";
let personalReportStartDate = new Date().toISOString().slice(0, 10);
let personalReportEndDate = new Date().toISOString().slice(0, 10);
let personalReportMessage = "";
let personalReportMessageType = "success";
let personalReportActiveTab = "production";
let personalReportExportMenuOpen = false;
let timeRecordDate = new Date().toISOString().slice(0, 10);
let timeSummaryStartDate = new Date().toISOString().slice(0, 10);
let timeSummaryEndDate = new Date().toISOString().slice(0, 10);
let timeSummaryDepartment = "all";
let timeSummaryMessage = "";
let timeSummaryMessageType = "success";
let timeSummaryExportMenuOpen = false;
let timeEntryMode = "daily";
let timeRecordMessage = "";
let timeRecordMessageType = "success";
let timeEntryEmployeeCode = "";
let weeklyTimeEmployeeCode = "";
let weeklyTimeDraft = Array.from({ length: 7 }, () => ({ clock_in: "", clock_out: "" }));
let editingTimeRecordId = null;
let deductionActiveTab = "production";
let deductionBonusEmployeeKind = "time";
let deductionApprovalEmployeeKind = "production";
let deductionApplications = [];
let deductionStartDate = new Date().toISOString().slice(0, 10);
let deductionEndDate = new Date().toISOString().slice(0, 10);
let deductionEmployeeId = "";
let deductionMessage = "";
let deductionMessageType = "success";
let editingDeductionId = null;
let productionView = "fast-entry";
let selectedProductionFruit = "";
let productionMessage = "";
let productionMessageType = "success";
let auditLogUnlocked = false;
let auditLogMessage = "";
let auditLogSearch = "";
let auditLogCategory = "all";
let accountCloudBootstrapped = false;
let wageRateCloudBootstrapped = false;
let employeeCloudBootstrapped = false;
let deductionCloudBootstrapped = false;
let liveStateCloudBootstrapped = false;
let applyingCloudState = false;
const liveStateSyncTimers = new Map();
let lastRenderedRoute = "";
let batchEntryText = "";
const DURIAN_GRADES = ["A", "B", "C", "D", "E"];
let batchGridState = {
  emp_code: "",
  employee: null,
  flower_pile_no: "1",
  water_pile_no: "2",
  flower_weights_by_pile: createBatchPileWeightMap(),
  water_weights_by_pile: createBatchPileWeightMap(),
  durian_grade_piles: createDurianGradePileSelection(),
  durian_grade_weights_by_pile: createDurianBatchWeightMap()
};
let fastInputState = {
  pile_no: "1",
  emp_code: "",
  water_weight: "",
  flower_weight: "",
  grade_weights: createEmptyDurianGradeWeights(""),
  employee: null,
  message: "",
  messageType: "success"
};
let fastInputStatesByFruit = {};

const productionFruitOptions = [
  {
    id: "mangosteen",
    label: "มังคุด",
    status: "พร้อมใช้งาน",
    description: "ใช้หน้าบันทึกผลผลิตเดิมสำหรับน้ำหนักน้ำ น้ำหนักดอก และค่าแรง"
  },
  {
    id: "durian",
    label: "ทุเรียน",
    status: "พร้อมใช้งาน",
    description: "บันทึกน้ำหนักทุเรียนแยกเกรด A-E และแยกกอง"
  },
  {
    id: "mango",
    label: "มะม่วง",
    status: "พร้อมใช้งาน",
    description: "ใช้หน้าบันทึกผลผลิตสำหรับมะม่วงฝาและมะม่วงหั่นเต๋า"
  },
  {
    id: "coconut",
    label: "มะพร้าว",
    status: "เตรียมไว้ก่อน",
    description: "พื้นที่สำหรับฟอร์มบันทึกข้อมูลมะพร้าว"
  }
];

const productionFruitFieldLabels = {
  mangosteen: {
    water: "น้ำหนักน้ำ",
    flower: "น้ำหนักดอก",
    waterShort: "น้ำ",
    flowerShort: "ดอก",
    description: "กรอกกอง รหัสพนักงาน น้ำหนักน้ำ และน้ำหนักดอกสำหรับงานมังคุด"
  },
  durian: {
    mode: "grades",
    grades: DURIAN_GRADES,
    description: "กรอกกอง รหัสพนักงาน และน้ำหนักทุเรียนแยกเกรด A-E"
  },
  mango: {
    water: "มะม่วงฝา",
    flower: "มะม่วงหั่นเต๋า",
    waterShort: "มะม่วงฝา",
    flowerShort: "มะม่วงหั่นเต๋า",
    description: "กรอกกอง รหัสพนักงาน มะม่วงฝา และมะม่วงหั่นเต๋าสำหรับงานมะม่วง"
  }
};

function wageRateItemTypeForFruitField(fruitId, fieldKey) {
  const normalizedFruitId = fruitId || "mangosteen";
  if (normalizedFruitId === "mangosteen") return fieldKey;
  return `${normalizedFruitId}:${fieldKey}`;
}

function getWageRateTypeOptions() {
  return productionFruitOptions
    .filter((fruit) => productionFruitFieldLabels[fruit.id])
    .flatMap((fruit) => {
      const labels = getProductionFieldLabels(fruit.id);
      if (labels.mode === "grades") {
        return DURIAN_GRADES.map((grade) => ({
          value: wageRateItemTypeForFruitField(fruit.id, `grade_${grade}`),
          label: `${fruit.label} - เกรด ${grade}`,
          fruitId: fruit.id,
          fieldKey: `grade_${grade}`
        }));
      }
      return [
        {
          value: wageRateItemTypeForFruitField(fruit.id, "water"),
          label: `${fruit.label} - ${labels.water}`,
          fruitId: fruit.id,
          fieldKey: "water"
        },
        {
          value: wageRateItemTypeForFruitField(fruit.id, "flower"),
          label: `${fruit.label} - ${labels.flower}`,
          fruitId: fruit.id,
          fieldKey: "flower"
        }
      ];
    });
}

function wageRateTypeLabel(itemType) {
  return getWageRateTypeOptions().find((option) => option.value === itemType)?.label || itemType;
}

function productionFruitTypeForRecord(record) {
  return record.fruit_type || "mangosteen";
}

function getSelectedProductionFruitId() {
  return selectedProductionFruit || "mangosteen";
}

function getProductionFieldLabels(fruitId = getSelectedProductionFruitId()) {
  return productionFruitFieldLabels[fruitId] || productionFruitFieldLabels.mangosteen;
}

function setSelectedProductionFruit(fruitId) {
  selectedProductionFruit = fruitId || "";
  syncFastInputStateForSelectedFruit();
}

function createFastInputState() {
  return {
    pile_no: "1",
    emp_code: "",
    water_weight: "",
    flower_weight: "",
    grade_weights: createEmptyDurianGradeWeights(""),
    employee: null,
    message: "",
    messageType: "success"
  };
}

function createEmptyDurianGradeWeights(value = 0) {
  return DURIAN_GRADES.reduce((weights, grade) => {
    weights[grade] = value;
    return weights;
  }, {});
}

function normalizeDurianGradeWeights(value = {}) {
  return DURIAN_GRADES.reduce((weights, grade) => {
    const amount = Number(value?.[grade] ?? value?.[grade.toLowerCase()] ?? 0);
    weights[grade] = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    return weights;
  }, {});
}

function isDurianFruit(fruitId = getSelectedProductionFruitId()) {
  return fruitId === "durian";
}

function getRecordGradeWeights(record) {
  if (record?.grades && typeof record.grades === "object") {
    return normalizeDurianGradeWeights(record.grades);
  }
  return isDurianFruit(productionFruitTypeForRecord(record))
    ? normalizeDurianGradeWeights(record.grade_weights)
    : createEmptyDurianGradeWeights(0);
}

function getDurianGradeTotal(value) {
  const weights = normalizeDurianGradeWeights(value);
  return DURIAN_GRADES.reduce((sum, grade) => sum + weights[grade], 0);
}

function getRecordTotalWeight(record) {
  if (isDurianFruit(productionFruitTypeForRecord(record))) return getDurianGradeTotal(record.grade_weights);
  return Number(record.water_weight || record.water || 0) + Number(record.flower_weight || record.flower || 0);
}

function formatDurianGradeBreakdown(record, separator = " · ") {
  const weights = getRecordGradeWeights(record);
  return DURIAN_GRADES.map((grade) => `${grade} ${numberText(weights[grade])}`).join(separator);
}

function getFastInputFruitKey() {
  return selectedProductionFruit || "mangosteen";
}

function syncFastInputStateForSelectedFruit() {
  const fruitKey = getFastInputFruitKey();
  if (!fastInputStatesByFruit[fruitKey]) {
    fastInputStatesByFruit[fruitKey] = createFastInputState();
  }
  fastInputState = fastInputStatesByFruit[fruitKey];
  return fastInputState;
}

function normalizeEmployeeCodeInput(value) {
  const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";
  return String(value || "")
    .replace(/[๐-๙]/g, (digit) => String(thaiDigits.indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 8);
}

function normalizeTimeEmployeeCodeInput(value) {
  const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";
  return String(value || "")
    .replace(/[๐-๙]/g, (digit) => String(thaiDigits.indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 8);
}

function getEmployeeLookupText(employee, empCode) {
  if (employee) return employee.fullname;
  return empCode.length >= 2
    ? "ไม่พบพนักงานหรือสถานะไม่ใช้งาน"
    : "รอกรอกรหัสพนักงานอย่างน้อย 2 หลัก";
}

function updateFastEmployeeFromCode(empCode) {
  syncFastInputStateForSelectedFruit();
  const value = normalizeEmployeeCodeInput(empCode);
  fastInputState.emp_code = value;
  fastInputState.employee = value.length >= 2 ? apiGetEmployeeByCode(value) : null;
  return fastInputState.employee;
}

function updateFastEmployeeResultText() {
  const result = document.querySelector(".fast-input-form .employee-result strong");
  if (result) {
    result.textContent = getEmployeeLookupText(fastInputState.employee, fastInputState.emp_code);
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

function createBatchPileWeightMap() {
  return [1, 2, 3, 4, 5].reduce((weightsByPile, pileNo) => {
    weightsByPile[String(pileNo)] = Array(20).fill("");
    return weightsByPile;
  }, {});
}

function createDurianGradePileSelection() {
  return DURIAN_GRADES.reduce((piles, grade) => {
    piles[grade] = "1";
    return piles;
  }, {});
}

function createDurianBatchWeightMap() {
  return DURIAN_GRADES.reduce((byGrade, grade) => {
    byGrade[grade] = createBatchPileWeightMap();
    return byGrade;
  }, {});
}

function getDurianBatchWeights(grade, pileNo = null) {
  const normalizedGrade = DURIAN_GRADES.includes(grade) ? grade : "A";
  const selectedPile = String(pileNo || batchGridState.durian_grade_piles?.[normalizedGrade] || "1");
  batchGridState.durian_grade_weights_by_pile ||= createDurianBatchWeightMap();
  batchGridState.durian_grade_weights_by_pile[normalizedGrade] ||= createBatchPileWeightMap();
  batchGridState.durian_grade_weights_by_pile[normalizedGrade][selectedPile] ||= Array(20).fill("");
  return batchGridState.durian_grade_weights_by_pile[normalizedGrade][selectedPile];
}

function getBatchPileWeights(type, pileNo = null) {
  const stateKey =
    type === "flower" ? "flower_weights_by_pile" : "water_weights_by_pile";
  const selectedPile =
    pileNo || (type === "flower" ? batchGridState.flower_pile_no : batchGridState.water_pile_no);
  const pileKey = String(selectedPile);

  if (!batchGridState[stateKey]) {
    batchGridState[stateKey] = createBatchPileWeightMap();
  }
  if (!batchGridState[stateKey][pileKey]) {
    batchGridState[stateKey][pileKey] = Array(20).fill("");
  }

  return batchGridState[stateKey][pileKey];
}

function isOneDecimalWeightInput(value) {
  const raw = String(value).trim();
  return raw !== "" && /^\d+(\.\d)?$/.test(raw);
}

function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    if (session?.user?.username && builtInAccountLevels[session.user.username]) {
      const builtInLevel = builtInAccountLevels[session.user.username];
      const currentIndex = supportedAccountLevels.indexOf(String(session.user.level || "C1").toUpperCase());
      const builtInIndex = supportedAccountLevels.indexOf(builtInLevel);
      if (currentIndex < builtInIndex) {
        session.user.level = builtInLevel;
      }
    }
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(user, rememberSession = false) {
  const session = {
    token: user.auth_token || `mock-token-${user.role}-${Date.now()}`,
    user: {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      phone: user.phone || "",
      role: user.role,
      role_key: user.role_key || "",
      role_label: user.role_label || user.role,
      level: user.level || "C1",
      is_system: Boolean(user.is_system),
      isActive: user.isActive
    },
    loginAt: new Date().toISOString()
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (rememberSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

function getUserLevel(user) {
  const level = String(user?.level || "C1").toUpperCase();
  return supportedAccountLevels.includes(level) ? level : "C1";
}

function isTopLevelUser(user) {
  if (!user) return false;
  const level = getUserLevel(user);
  return (
    level === "C5" ||
    level === "C6" ||
    level === "C7" ||
    user.role === "developer" ||
    user.role_key === "developer" ||
    user.is_system
  );
}

function isC7Account(accountUser) {
  if (!accountUser) return false;
  const protectedProfile =
    protectedSystemAccountProfiles[String(accountUser.username || "").toLowerCase()];
  return getUserLevel(accountUser) === "C7" || protectedProfile?.level === "C7";
}

function getAllowedRoutesForUser(user) {
  if (!user) return [];
  if (getUserLevel(user) === "C5") {
    return levelRouteAccess.C5;
  }
  if (isTopLevelUser(user)) {
    return modules.map((item) => item.id);
  }

  return levelRouteAccess[getUserLevel(user)] || [];
}

function getDefaultRouteForUser(user) {
  const preferredRoute = defaultRouteByLevel[getUserLevel(user)] || "dashboard";
  if (canOpen(user, preferredRoute)) return preferredRoute;
  return getAllowedRoutesForUser(user).find((route) => canOpen(user, route)) || "dashboard";
}

function visibleNavModulesForUser(user) {
  const navRouteIds = ["dashboard", "production", "time-report", "compare-data", "summary-person", "summary-all", "reports", "settings", "accounting-control", "secret-room"];
  return navRouteIds
    .map((routeId) => modules.find((item) => item.id === routeId))
    .filter((item) => item && !item.hidden)
    .map((item) => ({ ...item, locked: !canOpen(user, item.id) }));
}

function canOpen(user, moduleId) {
  const moduleItem = modules.find((item) => item.id === moduleId);
  if (!moduleItem || !user) return false;
  if (moduleId === "audit-log" && !["C6", "C7"].includes(getUserLevel(user))) return false;
  if (isTopLevelUser(user)) return true;
  return getAllowedRoutesForUser(user).includes(moduleId);
}

function canManageEmployees(user) {
  return canOpen(user, "employees") || canOpen(user, "production-employees") || canOpen(user, "time-employees");
}

function canDeleteEmployees(user) {
  return ["C5", "C6", "C7"].includes(getUserLevel(user)) || isTopLevelUser(user);
}

function canExportFullDetails(user) {
  if (!user) return false;
  if (isTopLevelUser(user)) return true;
  const levelIndex = supportedAccountLevels.indexOf(String(user.level || "").toUpperCase());
  return levelIndex >= supportedAccountLevels.indexOf("C5");
}

function accountRoleOptionByKey(roleKey) {
  if (roleKey === developerRoleOption.key) return developerRoleOption;
  return accountRoleOptions.find((option) => option.key === roleKey) || accountRoleOptions[0];
}

function accountRoleOptionForUser(user) {
  if (user.role === developerRoleOption.role || user.role_key === developerRoleOption.key) {
    return developerRoleOption;
  }
  if (user.role_key) return accountRoleOptionByKey(user.role_key);
  return (
    accountRoleOptions.find((option) => option.role === user.role) ||
    accountRoleOptions[0]
  );
}

function normalizeAccountUser(user) {
  const roleOption = accountRoleOptionForUser(user);
  const username = String(user.username || "").trim();
  const protectedProfile = protectedSystemAccountProfiles[username.toLowerCase()];
  const defaultLevel = builtInAccountLevels[username] || "C1";
  const level = supportedAccountLevels.includes(String(user.level || "").toUpperCase())
    ? String(user.level).toUpperCase()
    : defaultLevel;
  return {
    id: Number(user.id),
    username,
    password: String(user.password || ""),
    fullname: protectedProfile?.fullname || String(user.fullname || "").trim(),
    phone: protectedProfile?.phone || String(user.phone || "").trim(),
    role_key: protectedProfile?.role_key || roleOption.key,
    role: protectedProfile?.role || roleOption.role,
    role_label: protectedProfile?.role_label || roleOption.label,
    level: protectedProfile?.level || level,
    isActive: user.isActive !== false,
    is_system: Boolean(user.is_system || protectedProfile?.is_system),
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || user.created_at || new Date().toISOString(),
    auth_token: String(user.auth_token || "")
  };
}

function isProtectedSystemAccount(accountUser) {
  return isC7Account(accountUser);
}

function ensureSystemDeveloperAccount(accountUsers) {
  const normalizedSystemAccount = normalizeAccountUser(systemDeveloperAccount);
  const withoutSystemAccount = accountUsers.filter((accountUser) => {
    return (
      accountUser.id !== normalizedSystemAccount.id &&
      accountUser.username.toLowerCase() !== normalizedSystemAccount.username.toLowerCase()
    );
  });

  return [normalizedSystemAccount, ...withoutSystemAccount];
}

function applyBuiltInAccountLevelDefaults(accountUsers) {
  return accountUsers.map((accountUser) => {
    const builtInLevel = builtInAccountLevels[accountUser.username];
    if (!builtInLevel || accountUser.is_system) return accountUser;
    const currentIndex = supportedAccountLevels.indexOf(accountUser.level);
    const builtInIndex = supportedAccountLevels.indexOf(builtInLevel);
    if (currentIndex >= builtInIndex) return accountUser;
    return { ...accountUser, level: builtInLevel };
  });
}

function getAccountUsers() {
  const raw = localStorage.getItem(ACCOUNT_USERS_KEY);
  if (!raw) {
    const defaultAccounts = applyBuiltInAccountLevelDefaults(
      ensureSystemDeveloperAccount(users.map((user) =>
        normalizeAccountUser({
          ...user,
          level: builtInAccountLevels[user.username] || "C1",
          phone: "",
          created_at: "2026-07-03T08:00:00.000Z",
          updated_at: "2026-07-03T08:00:00.000Z"
        })
      ))
    );
    saveAccountUsers(defaultAccounts);
    return defaultAccounts;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid account data.");
    const normalizedAccounts = applyBuiltInAccountLevelDefaults(
      parsed.map(normalizeAccountUser)
    );
    if (
      normalizedAccounts.length !== parsed.length ||
      normalizedAccounts.some((accountUser, index) => {
        return JSON.stringify(accountUser) !== JSON.stringify(normalizeAccountUser(parsed[index] || {}));
      })
    ) {
      saveAccountUsers(normalizedAccounts);
    }
    return normalizedAccounts;
  } catch {
    localStorage.removeItem(ACCOUNT_USERS_KEY);
    return getAccountUsers();
  }
}

function saveAccountUsers(accountUsers) {
  localStorage.setItem(
    ACCOUNT_USERS_KEY,
    JSON.stringify(accountUsers.map(normalizeAccountUser))
  );
}

async function cloudApiRequest(path, options = {}) {
  const sessionToken = getSession()?.token || "";
  const response = await fetch(`${REPORT_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { "X-Session-Token": sessionToken } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message || data.message || `Cloud API failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

function getOnlineClientId() {
  let clientId = sessionStorage.getItem(ONLINE_CLIENT_KEY);
  if (!clientId) {
    clientId = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(ONLINE_CLIENT_KEY, clientId);
  }
  return clientId;
}

function onlineUserCountText() {
  const count = Math.max(onlineUserCount || (getSession() ? 1 : 0), 0);
  return `${count.toLocaleString("th-TH")} คน`;
}

function updateOnlineUserBadges() {
  document.querySelectorAll("[data-online-user-count]").forEach((element) => {
    element.textContent = onlineUserCountText();
  });
}

async function refreshOnlineUsers() {
  const session = getSession();
  if (!session) {
    onlineUserCount = 0;
    updateOnlineUserBadges();
    return;
  }

  try {
    const route = location.hash.replace("#/", "") || "dashboard";
    const data = await cloudApiRequest("/api/online-users", {
      method: "POST",
      body: JSON.stringify({
        client_id: getOnlineClientId(),
        username: session.user.username,
        fullname: session.user.fullname,
        route
      })
    });
    onlineUserCount = Number(data.data?.count) || 1;
  } catch (error) {
    onlineUserCount = Math.max(onlineUserCount, 1);
    console.warn("Online user heartbeat failed.", error);
  }
  updateOnlineUserBadges();
}

function startOnlineUserHeartbeat() {
  if (onlineHeartbeatTimer) return;
  refreshOnlineUsers();
  onlineHeartbeatTimer = window.setInterval(refreshOnlineUsers, ONLINE_HEARTBEAT_INTERVAL_MS);
}

const liveStateConfig = {
  production_sessions: { key: PRODUCTION_SESSIONS_KEY, read: getProductionSessions },
  production_records: { key: PRODUCTION_RECORDS_KEY, read: getProductionRecords },
  time_records: { key: TIME_RECORDS_KEY, read: getTimeRecords },
  audit_logs: { key: AUDIT_LOG_KEY, read: getAuditLogs }
};

function queueLiveStateSync(table) {
  if (applyingCloudState || !liveStateConfig[table]) return;
  clearTimeout(liveStateSyncTimers.get(table));
  liveStateSyncTimers.set(table, setTimeout(async () => {
    try {
      await cloudApiRequest("/api/state", {
        method: "POST",
        body: JSON.stringify({ table, rows: liveStateConfig[table].read() })
      });
    } catch (error) {
      console.error(`Cloud sync failed for ${table}.`, error);
    }
  }, 150));
}

async function bootstrapLiveStateFromCloud() {
  const response = await cloudApiRequest("/api/state");
  const state = response.data || {};
  // Only the desktop file launcher owns legacy browser-only data. A phone or
  // iPad must only read cloud data, never upload its potentially stale cache.
  const needsMigration =
    location.protocol === "file:" &&
    localStorage.getItem(CLOUD_MIGRATION_KEY) !== "done";
  applyingCloudState = true;
  try {
    for (const [table, config] of Object.entries(liveStateConfig)) {
      const cloudRows = Array.isArray(state[table]) ? state[table] : [];
      const localRows = config.read();
      if (needsMigration && localRows.length) {
        const merged = [...cloudRows];
        const byId = new Map(cloudRows.map((row) => [String(row.id), row]));
        let nextId = Math.max(0, ...cloudRows.map((row) => Number(row.id) || 0));
        localRows.forEach((localRow) => {
          const existing = byId.get(String(localRow.id));
          if (!existing) {
            merged.push(localRow);
            byId.set(String(localRow.id), localRow);
            return;
          }
          if (JSON.stringify(existing) === JSON.stringify(localRow)) return;
          nextId += 1;
          merged.push({ ...localRow, id: nextId });
        });
        await cloudApiRequest("/api/state", {
          method: "POST",
          body: JSON.stringify({ table, rows: merged })
        });
        localStorage.setItem(config.key, JSON.stringify(merged));
      } else {
        localStorage.setItem(config.key, JSON.stringify(cloudRows));
      }
    }
    if (needsMigration) {
      await migrateRemainingLocalDataToCloud();
    }
    localStorage.setItem(CLOUD_MIGRATION_KEY, "done");
  } finally {
    applyingCloudState = false;
  }
}

async function migrateRemainingLocalDataToCloud() {
  // These older sections were saved only in the browser. Migrate them once
  // before cloud hydration so an existing desktop dataset is not discarded.
  await Promise.all([
    syncAccountsToCloud().catch(() => []),
    syncEmployeesToCloud().catch(() => []),
    syncTimeEmployeesToCloud().catch(() => [])
  ]);
  const rates = getWageRates();
  if (rates.length) {
    await cloudApiRequest("/api/wage-rates/sync", {
      method: "POST",
      body: JSON.stringify({ rows: rates })
    });
  }
  const deductions = getDeductionRecords();
  if (deductions.length) {
    await cloudApiRequest("/api/deductions/sync", {
      method: "POST",
      body: JSON.stringify({ rows: deductions })
    });
  }
}

function normalizeCloudAccountUser(accountUser) {
  return normalizeAccountUser({
    ...accountUser,
    password: accountUser.password || "",
    role_key: accountUser.role_key || accountUser.role || "general_staff",
    level: accountUser.level || accountUser.user_level || "C1",
    isActive: accountUser.isActive ?? accountUser.status !== "Inactive"
  });
}

async function loginWithCloud(username, password) {
  const data = await cloudApiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  return normalizeCloudAccountUser({ ...(data.user || {}), auth_token: data.token || "" });
}

async function syncAccountsToCloud(accounts = getAccountUsers()) {
  const syncableAccounts = accounts.filter((accountUser) => {
    return accountUser.username && accountUser.password && !accountUser.is_system;
  });
  if (!syncableAccounts.length) return [];
  const data = await cloudApiRequest("/api/accounts/sync", {
    method: "POST",
    body: JSON.stringify({ accounts: syncableAccounts })
  });
  return Array.isArray(data.data) ? data.data.map(normalizeCloudAccountUser) : [];
}

async function hydrateAccountsFromCloud() {
  const data = await cloudApiRequest("/api/accounts");
  const cloudAccounts = Array.isArray(data.data) ? data.data.map(normalizeCloudAccountUser) : [];
  saveAccountUsers(cloudAccounts);
  return cloudAccounts;
}

function normalizeCloudWageRate(wageRate) {
  return {
    id: Number(wageRate.id),
    item_type: String(wageRate.item_type || ""),
    rate: Number(wageRate.rate || 0),
    effective_date: String(wageRate.effective_date || ""),
    created_by: String(wageRate.created_by || ""),
    created_at: wageRate.created_at || new Date().toISOString()
  };
}

async function hydrateWageRatesFromCloud() {
  const data = await cloudApiRequest("/api/wage-rates");
  const cloudRates = Array.isArray(data.data) ? data.data.map(normalizeCloudWageRate) : [];
  saveWageRates(cloudRates);
  return cloudRates;
}

async function createCloudWageRate(payload) {
  const data = await cloudApiRequest("/api/wage-rates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  const created = Array.isArray(data.data) ? data.data.map(normalizeCloudWageRate) : [];
  if (created.length) {
    const merged = new Map(getWageRates().map((rate) => [String(rate.id), rate]));
    created.forEach((rate) => merged.set(String(rate.id), rate));
    saveWageRates([...merged.values()]);
  }
  return created[0] || null;
}

function normalizeCloudEmployee(employee) {
  return {
    id: Number(employee.id),
    emp_code: normalizeEmployeeCodeInput(employee.emp_code || ""),
    fullname: String(employee.fullname || ""),
    department: String(employee.department || ""),
    position: String(employee.position || ""),
    pay_group: normalizeEmployeePayGroupValue(employee.pay_group || ""),
    shift: employee.shift || "",
    status: employee.status || "Active",
    created_at: employee.created_at || new Date().toISOString(),
    updated_at: employee.updated_at || employee.created_at || new Date().toISOString()
  };
}

function normalizeCloudTimeEmployee(employee) {
  return normalizeTimeEmployee({
    id: Number(employee.id),
    emp_code: employee.emp_code,
    fullname: employee.fullname,
    employee_type: employee.employee_type,
    daily_wage: employee.daily_wage,
    ot_hourly_rate: employee.ot_hourly_rate,
    status: employee.status || "Active",
    created_at: employee.created_at,
    updated_at: employee.updated_at || employee.created_at
  });
}

async function hydrateEmployeesFromCloud() {
  const data = await cloudApiRequest("/api/employees");
  const cloudEmployees = Array.isArray(data.data) ? data.data.map(normalizeCloudEmployee) : [];
  saveEmployees(cloudEmployees);
  return cloudEmployees;
}

async function hydrateTimeEmployeesFromCloud() {
  const data = await cloudApiRequest("/api/time-employees");
  const cloudEmployees = Array.isArray(data.data) ? data.data.map(normalizeCloudTimeEmployee) : [];
  saveTimeEmployees(cloudEmployees);
  return cloudEmployees;
}

async function hydrateAllEmployeesFromCloud() {
  const [weightEmployees, timeEmployees] = await Promise.all([
    hydrateEmployeesFromCloud(),
    hydrateTimeEmployeesFromCloud()
  ]);
  return { weightEmployees, timeEmployees };
}

async function syncEmployeesToCloud(employees = getEmployees()) {
  const syncableEmployees = employees.filter((employee) => (
    employee.emp_code &&
    employee.fullname &&
    employee.department &&
    employee.pay_group
  ));
  if (!syncableEmployees.length) return [];
  const data = await cloudApiRequest("/api/employees/sync", {
    method: "POST",
    body: JSON.stringify({ employees: syncableEmployees })
  });
  const synced = Array.isArray(data.data) ? data.data.map(normalizeCloudEmployee) : [];
  if (synced.length) saveEmployees(synced);
  return synced;
}

async function syncTimeEmployeesToCloud(employees = getTimeEmployees()) {
  const syncableEmployees = employees.filter((employee) => employee.emp_code && employee.fullname);
  if (!syncableEmployees.length) return [];
  const data = await cloudApiRequest("/api/time-employees/sync", {
    method: "POST",
    body: JSON.stringify({ employees: syncableEmployees })
  });
  const synced = Array.isArray(data.data) ? data.data.map(normalizeCloudTimeEmployee) : [];
  if (synced.length) saveTimeEmployees(synced);
  return synced;
}

async function syncLocalEmployeesToCloud() {
  restoreLocalEmployeesFromRecordsIfEmpty();
  const [weightEmployees, timeEmployees] = await Promise.all([
    syncEmployeesToCloud(),
    syncTimeEmployeesToCloud()
  ]);
  return { weightEmployees, timeEmployees };
}

async function bootstrapEmployeesWithCloud() {
  return hydrateAllEmployeesFromCloud();
}

async function createCloudEmployee(payload) {
  const data = await cloudApiRequest("/api/employees", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  const created = Array.isArray(data.data) ? data.data.map(normalizeCloudEmployee) : [];
  return created[0] || null;
}

async function updateCloudEmployee(id, payload) {
  const data = await cloudApiRequest("/api/employees", {
    method: "PUT",
    body: JSON.stringify({ id, ...payload })
  });
  const updated = Array.isArray(data.data) ? data.data.map(normalizeCloudEmployee) : [];
  return updated[0] || null;
}

async function deleteCloudEmployee(id) {
  await cloudApiRequest("/api/employees", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
}

async function createCloudTimeEmployee(payload) {
  const data = await cloudApiRequest("/api/time-employees", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  const created = Array.isArray(data.data) ? data.data.map(normalizeCloudTimeEmployee) : [];
  return created[0] || null;
}

async function updateCloudTimeEmployee(id, payload) {
  const data = await cloudApiRequest("/api/time-employees", {
    method: "PUT",
    body: JSON.stringify({ id, ...payload })
  });
  const updated = Array.isArray(data.data) ? data.data.map(normalizeCloudTimeEmployee) : [];
  return updated[0] || null;
}

async function deleteCloudTimeEmployee(id) {
  await cloudApiRequest("/api/time-employees", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
}

function getDeductionTypeLabel(typeId) {
  if (typeId === ATTENDANCE_BONUS_TYPE) return "เบี้ยขยัน";
  return deductionTypeOptions.find((item) => item.id === typeId)?.label || typeId || "-";
}

function normalizeDeductionKind(value) {
  return value === "time" ? "time" : "production";
}

function normalizeDeductionRecord(record) {
  const now = new Date().toISOString();
  const startDate = String(record?.start_date || record?.deduction_date || new Date().toISOString().slice(0, 10));
  const endDate = String(record?.end_date || startDate);
  const amount = Number(record?.amount || 0);
  return {
    id: Number(record?.id) || 0,
    employee_kind: normalizeDeductionKind(record?.employee_kind),
    employee_id: Number(record?.employee_id) || 0,
    emp_code: String(record?.emp_code || "").trim(),
    employee_name: String(record?.employee_name || record?.fullname || "").trim(),
    start_date: startDate,
    end_date: endDate < startDate ? startDate : endDate,
    deduction_type: String(record?.deduction_type || "advance").trim(),
    deduction_label: String(record?.deduction_label || getDeductionTypeLabel(record?.deduction_type || "advance")).trim(),
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    note: String(record?.note || "").trim(),
    status: record?.status || (String(record?.deduction_type || "") === ATTENDANCE_BONUS_TYPE ? "Active" : "Pending"),
    created_by: String(record?.created_by || "").trim(),
    updated_by: String(record?.updated_by || "").trim(),
    created_at: record?.created_at || now,
    updated_at: record?.updated_at || record?.created_at || now
  };
}

function normalizeDeductionApplication(record) {
  return {
    id: Number(record?.id) || 0,
    deduction_id: Number(record?.deduction_id) || 0,
    employee_kind: normalizeDeductionKind(record?.employee_kind),
    employee_id: Number(record?.employee_id) || 0,
    emp_code: String(record?.emp_code || "").trim(),
    employee_name: String(record?.employee_name || "").trim(),
    applied_date: String(record?.applied_date || ""),
    amount: Math.max(0, Number(record?.amount || 0)),
    status: String(record?.status || "Applied"),
    note: String(record?.note || "").trim(),
    created_by: String(record?.created_by || "").trim(),
    created_at: record?.created_at || new Date().toISOString()
  };
}

function getDeductionRecords() {
  const raw = localStorage.getItem(DEDUCTION_RECORDS_KEY);
  if (!raw) {
    localStorage.setItem(DEDUCTION_RECORDS_KEY, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const migrated = parsed.map(normalizeDeductionRecord).filter((record) => record.emp_code && record.amount > 0);
    if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      localStorage.setItem(DEDUCTION_RECORDS_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    localStorage.setItem(DEDUCTION_RECORDS_KEY, JSON.stringify([]));
    return [];
  }
}

function saveDeductionRecords(records) {
  localStorage.setItem(DEDUCTION_RECORDS_KEY, JSON.stringify(records.map(normalizeDeductionRecord)));
}

function normalizeCloudDeduction(record) {
  return normalizeDeductionRecord(record);
}

async function hydrateDeductionsFromCloud(options = {}) {
  const params = new URLSearchParams();
  if (options.employee_kind) params.set("employee_kind", normalizeDeductionKind(options.employee_kind));
  if (options.start_date) params.set("start_date", options.start_date);
  if (options.end_date) params.set("end_date", options.end_date);
  const query = params.toString();
  const data = await cloudApiRequest(`/api/deductions${query ? `?${query}` : ""}`);
  const cloudRecords = Array.isArray(data.data) ? data.data.map(normalizeCloudDeduction) : [];
  if (!options.employee_kind && !options.start_date && !options.end_date) {
    saveDeductionRecords(cloudRecords);
  } else {
    const incomingKeys = new Set(cloudRecords.map((record) => String(record.id)));
    const keptRecords = getDeductionRecords().filter((record) => {
      if (incomingKeys.has(String(record.id))) return false;
      if (options.employee_kind && record.employee_kind !== normalizeDeductionKind(options.employee_kind)) return true;
      if (options.start_date && options.end_date && deductionRangesOverlap(record, options.start_date, options.end_date)) return false;
      return true;
    });
    saveDeductionRecords([...keptRecords, ...cloudRecords]);
  }
  return cloudRecords;
}

async function createCloudDeduction(payload) {
  const data = await cloudApiRequest("/api/deductions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  const created = Array.isArray(data.data) ? data.data.map(normalizeCloudDeduction) : [];
  return created[0] || null;
}

async function hydrateDeductionApplicationsFromCloud(options = {}) {
  const params = new URLSearchParams();
  if (options.employee_kind) params.set("employee_kind", normalizeDeductionKind(options.employee_kind));
  if (options.start_date) params.set("start_date", options.start_date);
  if (options.end_date) params.set("end_date", options.end_date);
  const query = params.toString();
  const data = await cloudApiRequest(`/api/deduction-applications${query ? `?${query}` : ""}`);
  const incoming = Array.isArray(data.data) ? data.data.map(normalizeDeductionApplication) : [];
  if (!options.employee_kind && !options.start_date && !options.end_date) {
    deductionApplications = incoming;
  } else {
    const incomingIds = new Set(incoming.map((record) => String(record.id)));
    deductionApplications = [
      ...deductionApplications.filter((record) => {
        if (incomingIds.has(String(record.id))) return false;
        if (options.employee_kind && record.employee_kind !== normalizeDeductionKind(options.employee_kind)) return true;
        if (options.start_date && record.applied_date < options.start_date) return true;
        if (options.end_date && record.applied_date > options.end_date) return true;
        return false;
      }),
      ...incoming
    ];
  }
  return incoming;
}

async function applyCloudDeductionBatch(appliedDate, items, actor) {
  const data = await cloudApiRequest("/api/deduction-applications/apply", {
    method: "POST",
    body: JSON.stringify({
      applied_date: appliedDate,
      created_by: actor?.fullname || actor?.username || "",
      items
    })
  });
  return Array.isArray(data.data) ? data.data.map(normalizeDeductionApplication) : [];
}

async function updateCloudDeduction(id, payload) {
  const data = await cloudApiRequest("/api/deductions", {
    method: "PUT",
    body: JSON.stringify({ id, ...payload })
  });
  const updated = Array.isArray(data.data) ? data.data.map(normalizeCloudDeduction) : [];
  return updated[0] || null;
}

async function deleteCloudDeduction(id) {
  await cloudApiRequest("/api/deductions", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
}

function deductionRangesOverlap(record, startDate, endDate) {
  const recordStart = record.start_date || "";
  const recordEnd = record.end_date || recordStart;
  return recordStart <= endDate && recordEnd >= startDate;
}

function isAttendanceBonusRecord(record) {
  return String(record?.deduction_type || "") === ATTENDANCE_BONUS_TYPE;
}

function getAdjustmentRecordsForRange(kind, startDate, endDate, employee = null) {
  const normalizedKind = normalizeDeductionKind(kind);
  const employeeId = employee?.id ? String(employee.id) : "";
  const empCode = employee?.emp_code ? String(employee.emp_code) : "";
  const bonuses = getDeductionRecords().filter((record) => {
    if (!isAttendanceBonusRecord(record) || record.status !== "Active") return false;
    if (record.employee_kind !== normalizedKind) return false;
    if (!deductionRangesOverlap(record, startDate, endDate)) return false;
    if (!employee) return true;
    return (
      (employeeId && String(record.employee_id) === employeeId) ||
      (empCode && String(record.emp_code) === empCode)
    );
  });
  const appliedDeductions = deductionApplications
    .filter((application) => {
      if (application.status !== "Applied" || application.employee_kind !== normalizedKind) return false;
      if (application.applied_date < startDate || application.applied_date > endDate) return false;
      if (!employee) return true;
      return (
        (employeeId && String(application.employee_id) === employeeId) ||
        (empCode && String(application.emp_code) === empCode)
      );
    })
    .map((application) => {
      const obligation = getDeductionRecords().find((record) => Number(record.id) === Number(application.deduction_id));
      return normalizeDeductionRecord({
        ...(obligation || {}),
        id: `application-${application.id}`,
        start_date: application.applied_date,
        end_date: application.applied_date,
        amount: application.amount,
        status: "Active",
        note: application.note || obligation?.note || "",
        created_by: application.created_by || obligation?.created_by || ""
      });
    });
  return [...bonuses, ...appliedDeductions];
}

function getReportAdjustmentRecords() {
  const bonuses = getDeductionRecords().filter((record) => isAttendanceBonusRecord(record) && record.status === "Active");
  const deductions = deductionApplications
    .filter((application) => application.status === "Applied")
    .map((application) => {
      const obligation = getDeductionRecords().find((record) => Number(record.id) === Number(application.deduction_id));
      return normalizeDeductionRecord({
        ...(obligation || {}),
        id: `application-${application.id}`,
        start_date: application.applied_date,
        end_date: application.applied_date,
        amount: application.amount,
        status: "Active",
        note: application.note || obligation?.note || "",
        created_by: application.created_by || obligation?.created_by || ""
      });
    });
  return [...bonuses, ...deductions];
}

function getAppliedTotalForDeduction(deductionId) {
  return deductionApplications
    .filter((record) => record.status === "Applied" && Number(record.deduction_id) === Number(deductionId))
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

function getDeductionsForRange(kind, startDate, endDate, employee = null) {
  return getAdjustmentRecordsForRange(kind, startDate, endDate, employee).filter((record) => !isAttendanceBonusRecord(record));
}

function getBonusesForRange(kind, startDate, endDate, employee = null) {
  return getAdjustmentRecordsForRange(kind, startDate, endDate, employee).filter(isAttendanceBonusRecord);
}

function sumDeductions(records) {
  return records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

function getDeductionTotalForEmployee(kind, employee, startDate, endDate) {
  return sumDeductions(getDeductionsForRange(kind, startDate, endDate, employee));
}

function getBonusTotalForEmployee(kind, employee, startDate, endDate) {
  return sumDeductions(getBonusesForRange(kind, startDate, endDate, employee));
}

function getDeductionEmployeeOptions(kind = deductionActiveTab) {
  const employees = normalizeDeductionKind(kind) === "time" ? getTimeEmployees() : getEmployees();
  return employees
    .filter((employee) => employee.status === "Active")
    .sort((a, b) => String(a.emp_code || "").localeCompare(String(b.emp_code || ""), "th", { numeric: true }));
}

function findDeductionEmployee(kind, employeeId) {
  return getDeductionEmployeeOptions(kind).find((employee) => Number(employee.id) === Number(employeeId)) || null;
}

async function apiCreateDeduction(payload, actor) {
  const kind = normalizeDeductionKind(payload.employee_kind);
  const bonusMode = payload.deduction_type === ATTENDANCE_BONUS_TYPE;
  const employee = findDeductionEmployee(kind, payload.employee_id);
  const amount = Number(payload.amount || 0);
  if (!employee) throw new Error("กรุณาเลือกพนักงาน");
  if (!payload.start_date) throw new Error(`กรุณาเลือกวันที่${bonusMode ? "ลงเบี้ยขยัน" : "หักเงิน"}`);
  if (amount <= 0) throw new Error("กรุณากรอกจำนวนเงินมากกว่า 0");
  const baseRecord = normalizeDeductionRecord({
    employee_kind: kind,
    employee_id: employee.id,
    emp_code: employee.emp_code,
    employee_name: employee.fullname,
    start_date: payload.start_date,
    end_date: payload.end_date,
    deduction_type: payload.deduction_type,
    deduction_label: getDeductionTypeLabel(payload.deduction_type),
    amount,
    note: payload.note,
    status: bonusMode ? "Active" : "Pending",
    created_by: actor?.fullname || ""
  });
  const created = await createCloudDeduction(baseRecord);
  if (!created) throw new Error(`ไม่สามารถบันทึก${bonusMode ? "เบี้ยขยัน" : "รายการหักเงิน"}ลงฐานข้อมูลกลางได้`);
  saveDeductionRecords([...getDeductionRecords(), created]);
  addAuditLog(actor, bonusMode ? "CREATE_ATTENDANCE_BONUS" : "CREATE_DEDUCTION", `Added ${created.deduction_label} ${created.emp_code} ${created.amount}`);
  return created;
}

async function apiUpdateDeduction(id, payload, actor) {
  const records = getDeductionRecords();
  const existing = records.find((record) => Number(record.id) === Number(id));
  if (!existing) throw new Error("ไม่พบรายการหักเงินนี้");
  const kind = normalizeDeductionKind(payload.employee_kind);
  const employee = findDeductionEmployee(kind, payload.employee_id);
  const amount = Number(payload.amount || 0);
  if (!employee) throw new Error("กรุณาเลือกพนักงาน");
  if (amount <= 0) throw new Error("กรุณากรอกจำนวนเงินมากกว่า 0");
  const appliedTotal = isAttendanceBonusRecord(existing) ? 0 : getAppliedTotalForDeduction(id);
  if (amount < appliedTotal) throw new Error(`ยอดตั้งต้นต้องไม่น้อยกว่ายอดที่หักไปแล้ว ${money(appliedTotal)}`);
  if (appliedTotal > 0 && (
    amount !== Number(existing.amount) ||
    String(payload.start_date) !== String(existing.start_date) ||
    Number(payload.employee_id) !== Number(existing.employee_id) ||
    String(payload.deduction_type) !== String(existing.deduction_type)
  )) {
    throw new Error("รายการที่เริ่มหักแล้วแก้ยอดตั้งต้น วันที่ พนักงาน หรือประเภทไม่ได้");
  }
  const nextRecord = normalizeDeductionRecord({
    ...existing,
    employee_kind: kind,
    employee_id: employee.id,
    emp_code: employee.emp_code,
    employee_name: employee.fullname,
    start_date: payload.start_date,
    end_date: payload.end_date,
    deduction_type: payload.deduction_type,
    deduction_label: getDeductionTypeLabel(payload.deduction_type),
    amount,
    note: payload.note,
    status: isAttendanceBonusRecord(existing) ? "Active" : (amount <= appliedTotal ? "Completed" : "Pending"),
    updated_by: actor?.fullname || "",
    updated_at: new Date().toISOString()
  });
  const updated = await updateCloudDeduction(id, nextRecord);
  if (!updated) throw new Error("ไม่สามารถแก้ไขรายการหักเงินในฐานข้อมูลกลางได้");
  const finalRecord = updated;
  saveDeductionRecords(records.map((record) => (Number(record.id) === Number(id) ? finalRecord : record)));
  addAuditLog(actor, "UPDATE_DEDUCTION", `Updated deduction ${finalRecord.emp_code} ${finalRecord.deduction_label} ${finalRecord.amount}`);
}

async function apiDeleteDeduction(id, actor) {
  const records = getDeductionRecords();
  const existing = records.find((record) => Number(record.id) === Number(id));
  if (!existing) throw new Error("ไม่พบรายการหักเงินนี้");
  await deleteCloudDeduction(id);
  saveDeductionRecords(records.filter((record) => Number(record.id) !== Number(id)));
  addAuditLog(actor, "DELETE_DEDUCTION", `Deleted deduction ${existing.emp_code} ${existing.deduction_label} ${existing.amount}`);
}

async function deleteCloudAccountUser(accountUser) {
  if (!accountUser?.id && !accountUser?.username) return;
  await cloudApiRequest("/api/accounts", {
    method: "DELETE",
    body: JSON.stringify({
      id: accountUser.id,
      username: accountUser.username
    })
  });
}

function apiGetAccountUsers(search = "") {
  const keyword = search.trim().toLowerCase();
  const accountUsers = getAccountUsers().sort((a, b) => a.id - b.id);
  if (!keyword) return accountUsers;

  return accountUsers.filter((accountUser) => {
    return (
      accountUser.fullname.toLowerCase().includes(keyword) ||
      accountUser.username.toLowerCase().includes(keyword) ||
      accountUser.phone.toLowerCase().includes(keyword) ||
      accountUser.role_label.toLowerCase().includes(keyword) ||
      accountUser.level.toLowerCase().includes(keyword)
    );
  });
}

function activeAdminCount(accountUsers) {
  return accountUsers.filter((accountUser) => accountUser.role === "admin" && accountUser.isActive).length;
}

function validateAccountPayload(payload, existingId = null) {
  const fullname = String(payload.fullname || "").trim();
  const phone = String(payload.phone || "").trim();
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "");
  const confirmPassword = String(payload.confirm_password || "");
  const roleKey = String(payload.role_key || "");
  const roleOption = accountRoleOptionByKey(roleKey);
  const level = String(payload.level || "C1").toUpperCase();

  if (!fullname || !phone || !username) {
    throw new Error("กรุณากรอกชื่อ-นามสกุล เบอร์โทร และ Username ให้ครบ");
  }

  if (roleOption.role === developerRoleOption.role) {
    throw new Error("ไม่สามารถเลือกโรลผู้พัฒนาให้บัญชีทั่วไปได้");
  }

  if (!accountLevelOptions.includes(level)) {
    throw new Error("กรุณาเลือกระดับพนักงาน C1-C6");
  }

  if (!existingId && !password) {
    throw new Error("กรุณากรอก Password");
  }

  if (password || confirmPassword) {
    if (password !== confirmPassword) {
      throw new Error("Password และยืนยัน Password ต้องตรงกัน");
    }
    if (password.length < 4) {
      throw new Error("Password ต้องมีอย่างน้อย 4 ตัวอักษร");
    }
  }

  const duplicate = getAccountUsers().some((accountUser) => {
    return (
      accountUser.id !== existingId &&
      accountUser.username.toLowerCase() === username.toLowerCase()
    );
  });

  if (duplicate) {
    throw new Error("Username นี้มีอยู่แล้ว");
  }

  return {
    fullname,
    phone,
    username,
    password,
    role_key: roleOption.key,
    role: roleOption.role,
    role_label: roleOption.label,
    level,
    isActive: payload.isActive !== false
  };
}

async function apiCreateAccountUser(payload, actor) {
  const accountUsers = getAccountUsers();
  const cleanPayload = validateAccountPayload(payload);
  const now = new Date().toISOString();
  const nextId = accountUsers.length
    ? Math.max(...accountUsers.map((accountUser) => accountUser.id)) + 1
    : 1;
  const accountUser = normalizeAccountUser({
    id: nextId,
    ...cleanPayload,
    created_at: now,
    updated_at: now
  });

  const response = await cloudApiRequest("/api/accounts", {
    method: "POST",
    body: JSON.stringify({ ...accountUser, created_by: actor?.username || "" })
  });
  const cloudAccount = Array.isArray(response.data) && response.data[0]
    ? normalizeAccountUser({ ...accountUser, ...response.data[0], phone: accountUser.phone })
    : accountUser;

  saveAccountUsers([...accountUsers, cloudAccount]);
  addAuditLog(actor, "REGISTER_ACCOUNT", `Registered ${accountUser.username} (${accountUser.role_label}, ${accountUser.level})`);
  return cloudAccount;
}

async function apiUpdateAccountUser(id, payload, actor) {
  const accountUsers = getAccountUsers();
  const existing = accountUsers.find((accountUser) => accountUser.id === id);
  if (!existing) {
    throw new Error("ไม่พบข้อมูลบัญชีนี้");
  }

  if (isC7Account(existing)) {
    throw new Error("บัญชีระดับ C7 ผู้พัฒนาระบบไม่สามารถแก้ไขจากหน้าเว็บได้");
  }

  const cleanPayload = validateAccountPayload(payload, id);
  const updatedUser = normalizeAccountUser({
    ...existing,
    ...cleanPayload,
    password: cleanPayload.password || existing.password,
    updated_at: new Date().toISOString()
  });

  const nextUsers = accountUsers.map((accountUser) =>
    accountUser.id === id ? updatedUser : accountUser
  );

  if (activeAdminCount(nextUsers) === 0) {
    throw new Error("ต้องเหลือบัญชีผู้จัดการที่ใช้งานได้อย่างน้อย 1 บัญชี");
  }

  const response = await cloudApiRequest("/api/accounts", {
    method: "PUT",
    body: JSON.stringify({ id, ...cleanPayload, updated_by: actor?.username || "" })
  });
  const cloudUser = Array.isArray(response.data) && response.data[0]
    ? normalizeAccountUser({ ...updatedUser, ...response.data[0], phone: updatedUser.phone })
    : updatedUser;

  saveAccountUsers(accountUsers.map((accountUser) => (accountUser.id === id ? cloudUser : accountUser)));
  addAuditLog(actor, "UPDATE_ACCOUNT", `Updated ${cloudUser.username} (${cloudUser.role_label}, ${cloudUser.level})`);
  return cloudUser;
}

async function apiDeleteAccountUser(id, actor) {
  if (id === actor.id) {
    throw new Error("ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่");
  }

  const accountUsers = getAccountUsers();
  const existing = accountUsers.find((accountUser) => accountUser.id === id);
  if (!existing) {
    throw new Error("ไม่พบข้อมูลบัญชีนี้");
  }

  if (isC7Account(existing)) {
    throw new Error("บัญชีระดับ C7 ผู้พัฒนาระบบไม่สามารถลบได้");
  }

  const nextUsers = accountUsers.filter((accountUser) => accountUser.id !== id);
  if (activeAdminCount(nextUsers) === 0) {
    throw new Error("ต้องเหลือบัญชีผู้จัดการที่ใช้งานได้อย่างน้อย 1 บัญชี");
  }

  await deleteCloudAccountUser(existing);
  saveAccountUsers(nextUsers);
  addAuditLog(actor, "DELETE_ACCOUNT", `Deleted ${existing.username} (${existing.role_label}, ${existing.level})`);
}

function getEmployees() {
  const raw = localStorage.getItem(EMPLOYEES_KEY);
  if (!raw) {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(defaultEmployees));
    return [...defaultEmployees];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...defaultEmployees];
    const migrated = parsed.map((employee) => {
      const payGroup = String(employee.pay_group || "").trim();
      const normalizedPayGroup = normalizeEmployeePayGroupValue(payGroup);
      return normalizedPayGroup === employee.pay_group
        ? employee
        : { ...employee, pay_group: normalizedPayGroup };
    });
    if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(defaultEmployees));
    return [...defaultEmployees];
  }
}

function saveEmployees(employees) {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

function getEmployeePayGroup(employee) {
  return normalizeEmployeePayGroupValue(employee?.pay_group || "");
}

function getProductionWithholdingTax(payGroup, amount) {
  const normalizedGroup = normalizeEmployeePayGroupValue(payGroup);
  if (!productionWithholdingTaxGroups.has(normalizedGroup)) return 0;
  return Math.round((Math.max(0, Number(amount) || 0) * PRODUCTION_WITHHOLDING_TAX_RATE + Number.EPSILON) * 100) / 100;
}

function getEmployeePayGroups() {
  return [...primaryPayGroups];
}

function apiGetEmployees(search = "") {
  const keyword = search.trim().toLowerCase();
  const employees = getEmployees();

  if (!keyword) return employees;

  return employees.filter((employee) => {
    return (
      employee.emp_code.toLowerCase().includes(keyword) ||
      employee.fullname.toLowerCase().includes(keyword) ||
      getEmployeePayGroup(employee).toLowerCase().includes(keyword)
    );
  });
}

function apiGetEmployeeByCode(empCode) {
  const normalizedCode = normalizeEmployeeCodeInput(empCode).toLowerCase();
  return (
    getEmployees().find(
      (employee) =>
        employee.emp_code.toLowerCase() === normalizedCode &&
        employee.status === "Active"
    ) || null
  );
}

async function apiCreateEmployee(payload) {
  const employees = getEmployees();
  const empCode = payload.emp_code.trim();
  if (empCode.length < 2) {
    throw new Error("รหัสพนักงานต้องเป็นตัวเลขอย่างน้อย 2 หลัก");
  }
  const duplicate = employees.some(
    (employee) => employee.emp_code.toLowerCase() === empCode.toLowerCase()
  );

  if (duplicate) {
    throw new Error("Employee code must be unique.");
  }

  const localEmployee = {
    emp_code: empCode,
    fullname: payload.fullname.trim(),
    department: payload.department.trim(),
    position: payload.position || "",
    pay_group: normalizeEmployeePayGroupValue(payload.pay_group),
    shift: payload.shift,
    status: payload.status
  };

  const employee = await createCloudEmployee(localEmployee);
  if (!employee) throw new Error("ไม่สามารถบันทึกพนักงานลงฐานข้อมูลกลางได้");
  saveEmployees([...employees, employee]);
  return employee;
}

async function apiUpdateEmployee(id, payload) {
  const employees = getEmployees();
  const empCode = payload.emp_code.trim();
  if (empCode.length < 2) {
    throw new Error("รหัสพนักงานต้องเป็นตัวเลขอย่างน้อย 2 หลัก");
  }
  const duplicate = employees.some((employee) => {
    return (
      employee.id !== id &&
      employee.emp_code.toLowerCase() === empCode.toLowerCase()
    );
  });

  if (duplicate) {
    throw new Error("Employee code must be unique.");
  }

  const updatedEmployee = await updateCloudEmployee(id, {
    emp_code: empCode,
    fullname: payload.fullname.trim(),
    department: payload.department.trim(),
    position: payload.position || "",
    pay_group: normalizeEmployeePayGroupValue(payload.pay_group),
    shift: payload.shift,
    status: payload.status
  });
  if (!updatedEmployee) throw new Error("ไม่สามารถแก้ไขพนักงานในฐานข้อมูลกลางได้");
  const updatedEmployees = employees.map((employee) => (employee.id === id ? updatedEmployee : employee));

  saveEmployees(updatedEmployees);
}

async function apiDeleteEmployee(id) {
  const employees = getEmployees();
  const existing = employees.find((employee) => employee.id === id);
  if (!existing) {
    throw new Error("Employee was not found.");
  }
  await deleteCloudEmployee(id);
  saveEmployees(employees.filter((employee) => employee.id !== id));
}

function normalizeTimeEmployeeType(value) {
  const type = String(value || "").trim();
  if (type === "normal") return "normal_347";
  if (type === "special") return "special_365";
  return timeEmployeeTypeOptions.some((option) => option.id === type) ? type : "normal_347";
}

function getTimeEmployeeTypeOption(value) {
  const type = normalizeTimeEmployeeType(value);
  return timeEmployeeTypeOptions.find((option) => option.id === type) || timeEmployeeTypeOptions[0];
}

function isSpecialTimeEmployeeType(value) {
  return getTimeEmployeeTypeOption(value).category === "special";
}

function getTimeReportGroupLabel(value) {
  const typeOption = getTimeEmployeeTypeOption(value);
  return typeOption.category === "special" ? "กลุ่มพิเศษ" : "กลุ่มปกติ-347";
}

function defaultTimeEmployeesFromWeightEmployees() {
  return getEmployees().map((employee) => ({
    id: employee.id,
    emp_code: employee.emp_code,
    fullname: employee.fullname,
    employee_type: "normal_347",
    daily_wage: TIME_DAILY_WAGE,
    ot_hourly_rate: TIME_OT_HOURLY_RATE,
    status: employee.status || "Active",
    created_at: employee.created_at || new Date().toISOString(),
    updated_at: employee.updated_at || employee.created_at || new Date().toISOString()
  }));
}

function normalizeTimeEmployee(employee) {
  const typeOption = getTimeEmployeeTypeOption(employee?.employee_type);
  const otHourlyRate = Number(employee?.ot_hourly_rate);
  return {
    id: Number(employee?.id) || 0,
    emp_code: normalizeTimeEmployeeCodeInput(employee?.emp_code || ""),
    fullname: String(employee?.fullname || "").trim(),
    employee_type: typeOption.id,
    daily_wage: typeOption.dailyWage,
    ot_hourly_rate: Number.isFinite(otHourlyRate) && otHourlyRate > 0 ? otHourlyRate : TIME_OT_HOURLY_RATE,
    status: employee?.status || "Active",
    created_at: employee?.created_at || new Date().toISOString(),
    updated_at: employee?.updated_at || employee?.created_at || new Date().toISOString()
  };
}

function getTimeEmployees() {
  const raw = localStorage.getItem(TIME_EMPLOYEES_KEY);
  if (!raw) {
    localStorage.setItem(TIME_EMPLOYEES_KEY, JSON.stringify([]));
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const migrated = parsed.map(normalizeTimeEmployee).filter((employee) => employee.emp_code && employee.fullname);
    if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      localStorage.setItem(TIME_EMPLOYEES_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    localStorage.removeItem(TIME_EMPLOYEES_KEY);
    return [];
  }
}

function saveTimeEmployees(employees) {
  localStorage.setItem(TIME_EMPLOYEES_KEY, JSON.stringify(employees.map(normalizeTimeEmployee)));
}

function apiGetTimeEmployees(search = "") {
  const keyword = search.trim().toLowerCase();
  const employees = getTimeEmployees();
  if (!keyword) return employees;

  return employees.filter((employee) => (
    employee.emp_code.toLowerCase().includes(keyword) ||
    employee.fullname.toLowerCase().includes(keyword) ||
    getTimeEmployeeTypeOption(employee.employee_type).label.toLowerCase().includes(keyword)
  ));
}

function apiGetTimeEmployeeByCode(empCode) {
  const normalizedCode = normalizeTimeEmployeeCodeInput(empCode).toLowerCase();
  return (
    getTimeEmployees().find(
      (employee) =>
        employee.emp_code.toLowerCase() === normalizedCode &&
        employee.status === "Active"
    ) || null
  );
}

function compareTimeEmployeeEntryOrder(a, b) {
  const aSpecial = isSpecialTimeEmployeeType(a.employee_type);
  const bSpecial = isSpecialTimeEmployeeType(b.employee_type);
  if (aSpecial !== bSpecial) return aSpecial ? 1 : -1;
  const aCode = Number(a.emp_code);
  const bCode = Number(b.emp_code);
  if (Number.isFinite(aCode) && Number.isFinite(bCode) && aCode !== bCode) return aCode - bCode;
  return String(a.emp_code || "").localeCompare(String(b.emp_code || ""), "th");
}

function getOrderedActiveTimeEmployees() {
  return getTimeEmployees()
    .filter((employee) => employee.status !== "Inactive")
    .sort(compareTimeEmployeeEntryOrder);
}

function getNextAvailableTimeEntryEmployeeCode(currentCode = "", recordDate = timeRecordDate) {
  const employees = getOrderedActiveTimeEmployees();
  if (!employees.length) return "";
  const normalizedCurrentCode = normalizeTimeEmployeeCodeInput(currentCode);
  const currentIndex = employees.findIndex((employee) => employee.emp_code === normalizedCurrentCode);
  const startIndex = currentIndex >= 0 ? currentIndex : -1;

  for (let offset = 1; offset <= employees.length; offset += 1) {
    const employee = employees[(startIndex + offset + employees.length) % employees.length];
    if (!findDuplicateTimeRecord(employee.emp_code, recordDate)) {
      return employee.emp_code;
    }
  }

  return "";
}

function renderTimeEmployeeCodeOptions(employees = getOrderedActiveTimeEmployees()) {
  return employees
    .map((employee) => `<option value="${escapeHtml(employee.emp_code)}">${escapeHtml(`${employee.fullname} (${getTimeEmployeeTypeOption(employee.employee_type).shortLabel})`)}</option>`)
    .join("");
}

function renderWeeklyTimeEmployeeOptions(employees, selectedCode) {
  const normalEmployees = employees.filter((employee) => !isSpecialTimeEmployeeType(employee.employee_type));
  const specialEmployees = employees.filter((employee) => isSpecialTimeEmployeeType(employee.employee_type));
  const renderOptions = (items) => items
    .map((employee) => `<option value="${escapeHtml(employee.emp_code)}" ${employee.emp_code === selectedCode ? "selected" : ""}>${escapeHtml(employee.emp_code)} - ${escapeHtml(employee.fullname)}</option>`)
    .join("");

  return `
    <option value="">เลือกพนักงาน</option>
    ${normalEmployees.length ? `<optgroup label="กลุ่มปกติ">${renderOptions(normalEmployees)}</optgroup>` : ""}
    ${specialEmployees.length ? `<optgroup label="กลุ่มพิเศษ">${renderOptions(specialEmployees)}</optgroup>` : ""}
  `;
}

async function apiCreateTimeEmployee(payload) {
  const employees = getTimeEmployees();
  const empCode = normalizeTimeEmployeeCodeInput(payload.emp_code);
  if (empCode.length < 2) {
    throw new Error("หมายเลขพนักงานต้องเป็นตัวเลขอย่างน้อย 2 หลัก");
  }
  const duplicate = employees.some((employee) => employee.emp_code.toLowerCase() === empCode.toLowerCase());
  if (duplicate) {
    throw new Error("รหัสพนักงานตามเวลาต้องไม่ซ้ำกัน");
  }

  const typeOption = getTimeEmployeeTypeOption(payload.employee_type);
  const otHourlyRate = Number(payload.ot_hourly_rate) || TIME_OT_HOURLY_RATE;
  const localEmployee = {
    emp_code: empCode,
    fullname: String(payload.fullname || "").trim(),
    employee_type: typeOption.id,
    daily_wage: typeOption.dailyWage,
    ot_hourly_rate: otHourlyRate,
    status: "Active"
  };

  const employee = await createCloudTimeEmployee(localEmployee);
  if (!employee) throw new Error("ไม่สามารถบันทึกพนักงานตามเวลาลงฐานข้อมูลกลางได้");
  saveTimeEmployees([...employees, employee]);
  return employee;
}

async function apiUpdateTimeEmployee(id, payload) {
  const employees = getTimeEmployees();
  const empCode = normalizeTimeEmployeeCodeInput(payload.emp_code);
  if (empCode.length < 2) {
    throw new Error("หมายเลขพนักงานต้องเป็นตัวเลขอย่างน้อย 2 หลัก");
  }
  const duplicate = employees.some((employee) => employee.id !== id && employee.emp_code.toLowerCase() === empCode.toLowerCase());
  if (duplicate) {
    throw new Error("รหัสพนักงานตามเวลาต้องไม่ซ้ำกัน");
  }
  const typeOption = getTimeEmployeeTypeOption(payload.employee_type);
  const otHourlyRate = Number(payload.ot_hourly_rate) || TIME_OT_HOURLY_RATE;
  const updatedEmployee = await updateCloudTimeEmployee(id, {
    emp_code: empCode,
    fullname: String(payload.fullname || "").trim(),
    employee_type: typeOption.id,
    daily_wage: typeOption.dailyWage,
    ot_hourly_rate: otHourlyRate,
    status: "Active"
  });
  if (!updatedEmployee) throw new Error("ไม่สามารถแก้ไขพนักงานตามเวลาในฐานข้อมูลกลางได้");
  saveTimeEmployees(
    employees.map((employee) => (employee.id === id ? updatedEmployee : employee))
  );
}

async function apiDeleteTimeEmployee(id) {
  const employees = getTimeEmployees();
  const existing = employees.find((employee) => employee.id === id);
  if (!existing) {
    throw new Error("ไม่พบพนักงานตามเวลาที่ต้องการลบ");
  }
  await deleteCloudTimeEmployee(id);
  saveTimeEmployees(employees.filter((employee) => employee.id !== id));
}

function getWageRates() {
  const raw = localStorage.getItem(WAGE_RATES_KEY);
  if (!raw) {
    localStorage.setItem(WAGE_RATES_KEY, JSON.stringify(defaultWageRates));
    return [...defaultWageRates];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...defaultWageRates];
  } catch {
    localStorage.setItem(WAGE_RATES_KEY, JSON.stringify(defaultWageRates));
    return [...defaultWageRates];
  }
}

function saveWageRates(wageRates) {
  localStorage.setItem(WAGE_RATES_KEY, JSON.stringify(wageRates));
}

function apiGetWageRates(itemType = "all") {
  const wageRates = getWageRates();
  const filtered =
    itemType === "all"
      ? wageRates
      : wageRates.filter((rate) => rate.item_type === itemType);

  return filtered.sort((a, b) => {
    const dateCompare = b.effective_date.localeCompare(a.effective_date);
    if (dateCompare !== 0) return dateCompare;
    return b.created_at.localeCompare(a.created_at);
  });
}

async function apiCreateWageRate(payload, createdBy) {
  const itemType = String(payload.item_type);
  const rate = Number(payload.rate);
  const effectiveDate = String(payload.effective_date);
  const validItemTypes = getWageRateTypeOptions().map((option) => option.value);

  if (!validItemTypes.includes(itemType)) {
    throw new Error("กรุณาเลือกชนิดงานค่าจ้างที่มีอยู่ในระบบ");
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Rate must be greater than 0.");
  }

  if (!effectiveDate) {
    throw new Error("Effective date is required.");
  }

  const wageRate = {
    item_type: itemType,
    rate,
    effective_date: effectiveDate,
    created_by: createdBy,
    created_at: new Date().toISOString()
  };

  const createdCloudRate = await createCloudWageRate(wageRate);
  if (!createdCloudRate) throw new Error("บันทึกอัตราค่าจ้างลงฐานข้อมูลไม่สำเร็จ");
  return createdCloudRate;
}

function apiGetCurrentRate(itemType, productionDate) {
  const matchingRates = getWageRates()
    .filter((wageRate) => {
      return (
        wageRate.item_type === itemType &&
        wageRate.effective_date <= productionDate
      );
    })
    .sort((a, b) => {
      const dateCompare = b.effective_date.localeCompare(a.effective_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    });

  return matchingRates[0] || null;
}

function apiGetCurrentProductionRate(fruitId, fieldKey, productionDate) {
  const itemType = wageRateItemTypeForFruitField(fruitId, fieldKey);
  const specificRate = apiGetCurrentRate(itemType, productionDate);
  if (specificRate) return specificRate;
  if ((fruitId || "mangosteen") === "mangosteen") return apiGetCurrentRate(fieldKey, productionDate);
  return null;
}

function getProductionSessions() {
  const raw = localStorage.getItem(PRODUCTION_SESSIONS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(PRODUCTION_SESSIONS_KEY);
    return [];
  }
}

function saveProductionSessions(sessions) {
  localStorage.setItem(PRODUCTION_SESSIONS_KEY, JSON.stringify(sessions));
  queueLiveStateSync("production_sessions");
}

function getActiveProductionSession() {
  return (
    getProductionSessions()
      .filter((session) => session.status === "Running")
      .sort((a, b) => b.start_time.localeCompare(a.start_time))[0] || null
  );
}

function apiCreateProductionSession(payload, user) {
  const existingSession = getActiveProductionSession();
  if (existingSession) {
    throw new Error("Please close the current session before starting a new one.");
  }

  const sessions = getProductionSessions();
  const now = new Date().toISOString();
  const nextId = sessions.length
    ? Math.max(...sessions.map((session) => session.id)) + 1
    : 1;
  const session = {
    id: nextId,
    session_name: `${payload.date} pile ${payload.pile}`,
    date: payload.date,
    shift: payload.shift || "",
    pile: Number(payload.pile),
    supervisor: payload.supervisor,
    note: payload.note,
    status: "Running",
    created_by: user.fullname,
    start_time: now,
    end_time: ""
  };

  saveProductionSessions([...sessions, session]);
  addAuditLog(user, "START_SESSION", `Started pile ${session.pile}`);
  return session;
}

function getAuditLogs() {
  const raw = localStorage.getItem(AUDIT_LOG_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(AUDIT_LOG_KEY);
    return [];
  }
}

function saveAuditLogs(logs) {
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  queueLiveStateSync("audit_logs");
}

function addAuditLog(user, action, detail) {
  const logs = getAuditLogs();
  const now = new Date().toISOString();
  const nextId = logs.length ? Math.max(...logs.map((log) => log.id)) + 1 : 1;
  saveAuditLogs([
    ...logs,
    {
      id: nextId,
      action,
      detail,
      created_by: user.fullname,
      user_fullname: user.fullname,
      username: user.username || "",
      role: user.role_label || user.role || "",
      created_at: now
    }
  ]);
}

function productionRecordsForActiveSession() {
  lockExpiredProductionRecords();
  const today = new Date().toISOString().slice(0, 10);
  const fruitId = getSelectedProductionFruitId();
  return getProductionRecords().filter(
    (record) => record.record_date === today && productionFruitTypeForRecord(record) === fruitId
  );
}

function lockExpiredProductionRecords() {
  const records = getProductionRecords();
  let changed = false;
  const updatedRecords = records.map((record) => {
    if (!record.is_locked && Date.now() - new Date(record.created_at).getTime() > 5 * 60 * 1000) {
      changed = true;
      return { ...record, is_locked: 1 };
    }
    return record;
  });

  if (changed) {
    saveProductionRecords(updatedRecords);
  }
}

function isProductionRecordLocked(record) {
  return (
    record.is_locked === 1 ||
    Date.now() - new Date(record.created_at).getTime() > 5 * 60 * 1000
  );
}

function getProductionTotals(records) {
  return records.reduce(
    (totals, record) => {
      totals.people.add(record.employee_id);
      totals.water += Number(record.water_weight || record.water || 0);
      totals.flower += Number(record.flower_weight || record.flower || 0);
      const gradeWeights = getRecordGradeWeights(record);
      DURIAN_GRADES.forEach((grade) => totals.grades[grade] += gradeWeights[grade]);
      totals.total += getRecordTotalWeight(record);
      totals.amount += Number(record.total_amount || record.grand_total || 0);
      return totals;
    },
    { people: new Set(), water: 0, flower: 0, grades: createEmptyDurianGradeWeights(0), total: 0, amount: 0 }
  );
}

function getDashboardRecords() {
  const storedRecords = getProductionRecords();
  if (storedRecords.length) return storedRecords;

  return productionRows.map((row, index) => ({
    id: index + 1,
    record_date: row.date,
    record_time: index === 0 ? "09:10:12" : index === 1 ? "10:22:35" : "13:05:44",
    emp_code: row.employee,
    employee_name: row.employee,
    pile_no: index + 1,
    water_weight: row.quantity * 0.62,
    flower_weight: row.quantity * 0.38,
    total_amount: row.wage,
    created_by: "System",
    status: row.status
  }));
}

function getRecordDate(record) {
  return record.record_date || record.date || "";
}

function getDashboardRecordsForDate(date) {
  return getDashboardRecords().filter((record) => getRecordDate(record) === date);
}

function getDashboardRecordsForRange(startDate, endDate) {
  return getDashboardRecords().filter((record) => {
    const recordDate = getRecordDate(record);
    return recordDate && recordDate >= startDate && recordDate <= endDate;
  });
}

function getLatestDashboardRecordDate() {
  return (
    getDashboardRecords()
      .map(getRecordDate)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] || ""
  );
}

function getSelectedSummaryDate() {
  return summaryDate || new Date().toISOString().slice(0, 10);
}

function getSummaryExportRange() {
  const selectedDate = getSelectedSummaryDate();
  const startDate = summaryExportStartDate || selectedDate;
  const endDate = summaryExportEndDate || selectedDate;

  if (startDate <= endDate) {
    return { startDate, endDate };
  }

  return { startDate: endDate, endDate: startDate };
}

function csvValue(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvRow(values) {
  return values.map(csvValue).join(",");
}

function downloadTextFile(filename, content, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function getPileSummaries(records) {
  const summaries = new Map();

  records.forEach((record) => {
    const pile = Number(record.pile_no || record.pile || 1);
    const existing =
      summaries.get(pile) || { pile, water: 0, flower: 0, grades: createEmptyDurianGradeWeights(0), gradeTotal: 0, total: 0, amount: 0, count: 0 };
    const water = Number(record.water_weight || record.water || 0);
    const flower = Number(record.flower_weight || record.flower || 0);

    existing.water += water;
    existing.flower += flower;
    const gradeWeights = getRecordGradeWeights(record);
    DURIAN_GRADES.forEach((grade) => existing.grades[grade] += gradeWeights[grade]);
    existing.gradeTotal += getDurianGradeTotal(gradeWeights);
    existing.total += getRecordTotalWeight(record);
    existing.amount += Number(record.total_amount || record.grand_total || 0);
    existing.count += 1;
    summaries.set(pile, existing);
  });

  return Array.from(summaries.values()).sort((a, b) => a.pile - b.pile);
}

function renderDashboardBars(pileSummaries) {
  const maxValue = Math.max(
    1,
    ...pileSummaries.map((item) => Math.max(item.water, item.flower, item.gradeTotal || 0))
  );

  return pileSummaries
    .map(
      (item) => `
        <div class="summary-bar-group">
          <div class="summary-bars">
            <div class="summary-bar water" style="height:${Math.max(
              8,
              (item.water / maxValue) * 100
            )}%"><span>${numberText(item.water)}</span></div>
            <div class="summary-bar flower" style="height:${Math.max(
              8,
              (item.flower / maxValue) * 100
            )}%"><span>${numberText(item.flower)}</span></div>
            ${(item.gradeTotal || 0) > 0 ? `<div class="summary-bar durian" style="height:${Math.max(8, ((item.gradeTotal || 0) / maxValue) * 100)}%"><span>${numberText(item.gradeTotal)}</span></div>` : ""}
          </div>
          <strong>กอง ${item.pile}</strong>
        </div>`
    )
    .join("");
}

function renderPileSummaryRow(item) {
  return `
    <tr>
      <td>กอง ${item.pile}</td>
      <td>${numberText(item.water)}</td>
      <td>${numberText(item.flower)}</td>
      <td><strong>${numberText(item.total)}</strong></td>
      <td><strong>${money(item.amount)}</strong></td>
    </tr>
  `;
}

function renderDashboardDetailRow(record) {
  const employee = getEmployees().find((item) => item.id === record.employee_id);
  const isDurian = isDurianFruit(record.fruit_type);

  return `
    <tr>
      <td>${escapeHtml(record.record_time || "")}</td>
      <td><strong>${escapeHtml(record.emp_code || "")}</strong></td>
      <td>${escapeHtml(record.employee_name || employee?.fullname || "")}</td>
      <td>กอง ${escapeHtml(record.pile_no || record.pile || "")}</td>
      <td>${isDurian ? "-" : numberText(record.water_weight || record.water)}</td>
      <td>${isDurian ? "-" : numberText(record.flower_weight || record.flower)}</td>
      <td>${isDurian ? escapeHtml(formatDurianGradeBreakdown(record)) : "-"}</td>
      <td><strong>${numberText(getRecordTotalWeight(record))}</strong></td>
      <td><strong>${money(record.total_amount || record.grand_total || 0)}</strong></td>
      <td>${escapeHtml(record.created_by || "")}</td>
    </tr>
  `;
}

function setSummaryExportMessage(message, type = "success") {
  summaryExportMessage = message;
  summaryExportMessageType = type;
}

function exportSummaryData() {
  const exportRange = getSummaryExportRange();
  const selectedSections = Object.entries(summaryExportOptions)
    .filter(([, enabled]) => enabled)
    .map(([section]) => section);

  if (!selectedSections.length) {
    setSummaryExportMessage("กรุณาเลือกข้อมูลที่ต้องการ Export อย่างน้อย 1 รายการ", "error");
    render();
    return;
  }

  const records = getDashboardRecordsForRange(exportRange.startDate, exportRange.endDate);
  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);
  const rangeLabel =
    exportRange.startDate === exportRange.endDate
      ? exportRange.startDate
      : `${exportRange.startDate} ถึง ${exportRange.endDate}`;
  const lines = [
    csvRow(["รายงานสรุปผลทั้งหมด"]),
    csvRow(["ช่วงวันที่", rangeLabel]),
    ""
  ];

  if (summaryExportOptions.overview) {
    lines.push(csvRow(["ภาพรวม"]));
    lines.push(csvRow(["หัวข้อ", "ค่า"]));
    lines.push(csvRow(["น้ำหนักรวมทั้งหมด (กก.)", numberText(totals.total)]));
    lines.push(csvRow(["น้ำหนักน้ำ (กก.)", numberText(totals.water)]));
    lines.push(csvRow(["น้ำหนักดอก (กก.)", numberText(totals.flower)]));
    lines.push(csvRow(["เงินรวมทั้งหมด", totals.amount]));
    lines.push(csvRow(["พนักงานทั้งหมด", totals.people.size]));
    lines.push(csvRow(["รายการทั้งหมด", records.length]));
    lines.push("");
  }

  if (summaryExportOptions.piles) {
    lines.push(csvRow(["สรุปตามกอง"]));
    lines.push(csvRow(["กอง", "น้ำหนักน้ำ (กก.)", "น้ำหนักดอก (กก.)", "รวม (กก.)", "รวมเงิน"]));
    pileSummaries.forEach((item) => {
      lines.push(csvRow([`กอง ${item.pile}`, item.water, item.flower, item.total, item.amount]));
    });
    lines.push("");
  }

  if (summaryExportOptions.details) {
    lines.push(csvRow(["รายละเอียดทั้งหมด"]));
    lines.push(csvRow(["วันที่", "เวลา", "รหัสพนักงาน", "ชื่อพนักงาน", "กอง", "น้ำหนักน้ำ (กก.)", "น้ำหนักดอก (กก.)", "เงิน", "ผู้บันทึก"]));
    records.forEach((record) => {
      const employee = getEmployees().find((item) => item.id === record.employee_id);
      lines.push(
        csvRow([
          getRecordDate(record),
          record.record_time || "",
          record.emp_code || "",
          record.employee_name || employee?.fullname || "",
          record.pile_no || record.pile || "",
          record.water_weight || record.water || 0,
          record.flower_weight || record.flower || 0,
          record.total_amount || record.grand_total || 0,
          record.created_by || ""
        ])
      );
    });
  }

  downloadTextFile(
    `summary-${exportRange.startDate}-to-${exportRange.endDate}.csv`,
    `\ufeff${lines.join("\r\n")}`
  );
  setSummaryExportMessage(`Export ข้อมูลช่วงวันที่ ${rangeLabel} เรียบร้อยแล้ว`);
  render();
}

function getProductionRecords() {
  const raw = localStorage.getItem(PRODUCTION_RECORDS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(PRODUCTION_RECORDS_KEY);
    return [];
  }
}

function saveProductionRecords(records) {
  localStorage.setItem(PRODUCTION_RECORDS_KEY, JSON.stringify(records));
  queueLiveStateSync("production_records");
}

function normalizeTimeRecordWage(record) {
  if (!record || Number(record.daily_wage) !== TIME_SPECIAL_DAILY_WAGE) return record;
  return {
    ...record,
    daily_wage: TIME_SPECIAL_DAILY_WAGE,
    normal_hourly_rate: TIME_SPECIAL_DAILY_WAGE / TIME_STANDARD_HOURS,
    ot_hourly_rate: Number(record.ot_hourly_rate) || TIME_OT_HOURLY_RATE
  };
}

function getTimeRecords() {
  const raw = localStorage.getItem(TIME_RECORDS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((record) => {
      const wageNormalizedRecord = normalizeTimeRecordWage(record);
      if (!wageNormalizedRecord?.clock_in || !wageNormalizedRecord?.clock_out) return wageNormalizedRecord;
      try {
        return { ...wageNormalizedRecord, ...calculateWorkMinutes(wageNormalizedRecord.clock_in, wageNormalizedRecord.clock_out) };
      } catch {
        return wageNormalizedRecord;
      }
    });
  } catch {
    localStorage.removeItem(TIME_RECORDS_KEY);
    return [];
  }
}

function saveTimeRecords(records) {
  localStorage.setItem(TIME_RECORDS_KEY, JSON.stringify(records));
  queueLiveStateSync("time_records");
}

function nextLocalEmployeeId(...groups) {
  const ids = groups
    .flat()
    .map((item) => Number(item?.id || item?.employee_id || 0))
    .filter((id) => Number.isFinite(id) && id > 0);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function restoreWeightEmployeesFromRecordsIfEmpty() {
  const existingEmployees = getEmployees();
  if (existingEmployees.length) return existingEmployees;

  const restoredByCode = new Map();
  getProductionRecords().forEach((record) => {
    const empCode = normalizeEmployeeCodeInput(record.emp_code || record.employee_code || "");
    if (!empCode || restoredByCode.has(empCode)) return;
    const fullname = String(
      record.employee_name ||
      record.fullname ||
      record.employee?.fullname ||
      `พนักงาน ${empCode}`
    ).trim();
    restoredByCode.set(empCode, {
      id: Number(record.employee_id) || 0,
      emp_code: empCode,
      fullname,
      department: String(record.department || record.employee?.department || "-").trim() || "-",
      position: String(record.position || record.employee?.position || "").trim(),
      pay_group: normalizeEmployeePayGroupValue(record.pay_group || record.employee?.pay_group || primaryPayGroups[0]),
      shift: String(record.shift || "").trim(),
      status: "Active",
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || record.created_at || new Date().toISOString()
    });
  });

  const restoredEmployees = [...restoredByCode.values()];
  let nextId = nextLocalEmployeeId(restoredEmployees);
  const normalizedEmployees = restoredEmployees.map((employee) => ({
    ...employee,
    id: employee.id || nextId++
  }));
  if (normalizedEmployees.length) saveEmployees(normalizedEmployees);
  return normalizedEmployees;
}

function restoreTimeEmployeesFromRecordsIfEmpty() {
  const existingEmployees = getTimeEmployees();
  if (existingEmployees.length) return existingEmployees;

  const restoredByCode = new Map();
  getTimeRecords().forEach((record) => {
    const empCode = normalizeTimeEmployeeCodeInput(record.emp_code || record.employee_code || "");
    if (!empCode || restoredByCode.has(empCode)) return;
    const typeOption = getTimeEmployeeTypeOption(record.employee_type);
    restoredByCode.set(empCode, normalizeTimeEmployee({
      id: Number(record.employee_id) || 0,
      emp_code: empCode,
      fullname: record.fullname || record.employee_name || `พนักงาน ${empCode}`,
      employee_type: typeOption.id,
      daily_wage: record.daily_wage || typeOption.dailyWage,
      ot_hourly_rate: record.ot_hourly_rate || TIME_OT_HOURLY_RATE,
      status: "Active",
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || record.created_at || new Date().toISOString()
    }));
  });

  const restoredEmployees = [...restoredByCode.values()];
  let nextId = nextLocalEmployeeId(restoredEmployees);
  const normalizedEmployees = restoredEmployees.map((employee) => ({
    ...employee,
    id: employee.id || nextId++
  }));
  if (normalizedEmployees.length) saveTimeEmployees(normalizedEmployees);
  return normalizedEmployees;
}

function restoreLocalEmployeesFromRecordsIfEmpty() {
  return {
    weightEmployees: restoreWeightEmployeesFromRecordsIfEmpty(),
    timeEmployees: restoreTimeEmployeesFromRecordsIfEmpty()
  };
}

function parseTimeToMinutes(value) {
  const normalizedValue = normalizeClockText(value);
  const match = normalizedValue.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function normalizeClockText(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const compactDigits = raw.replace(/\D/g, "");
  if (/^\d{3,4}$/.test(compactDigits)) {
    const hours = compactDigits.length === 3 ? compactDigits.slice(0, 1) : compactDigits.slice(0, 2);
    const minutes = compactDigits.slice(-2);
    return `${String(Number(hours)).padStart(2, "0")}:${minutes}`;
  }

  const timeMatch = raw.match(/^(\d{1,2})[:.](\d{2})$/);
  if (timeMatch) {
    return `${String(Number(timeMatch[1])).padStart(2, "0")}:${timeMatch[2]}`;
  }

  return raw;
}

function normalizeClockInput(input) {
  if (!input) return "";
  const normalizedValue = normalizeClockText(input.value);
  if (normalizedValue) input.value = normalizedValue;
  return normalizedValue;
}

function formatMinutesToHourText(minutes) {
  const safeMinutes = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  return `${hours}:${String(remainder).padStart(2, "0")}`;
}

function roundWorkClockMinutes(totalMinutes) {
  const dayMinutes = 24 * 60;
  const dayOffset = Math.floor(totalMinutes / dayMinutes) * dayMinutes;
  const minutesInDay = ((totalMinutes % dayMinutes) + dayMinutes) % dayMinutes;
  const hourStart = Math.floor(minutesInDay / 60) * 60;
  const minutePart = minutesInDay % 60;

  if (minutePart <= 15) return dayOffset + hourStart;
  if (minutePart <= 45) return dayOffset + hourStart + 30;
  return dayOffset + hourStart + 60;
}

function calculateWorkMinutes(clockIn, clockOut) {
  const startRawMinutes = parseTimeToMinutes(clockIn);
  const endRawMinutes = parseTimeToMinutes(clockOut);
  if (startRawMinutes === null || endRawMinutes === null) {
    throw new Error("กรุณากรอกเวลาเป็นรูปแบบ HH:MM");
  }

  const isOvernight = endRawMinutes <= startRawMinutes;
  const startMinutes = roundWorkClockMinutes(startRawMinutes);
  const endMinutes = roundWorkClockMinutes(endRawMinutes + (isOvernight ? 24 * 60 : 0));
  const rawMinutes = endMinutes - startMinutes;
  if (rawMinutes <= 0) {
    throw new Error("เวลาออกต้องมากกว่าเวลาเข้า");
  }

  const lunchStart = 12 * 60;
  const lunchEnd = 13 * 60;
  const breakMinutes = startMinutes < lunchStart && endMinutes > lunchEnd ? 60 : 0;
  const netMinutes = Math.max(0, rawMinutes - breakMinutes);

  return {
    raw_minutes: rawMinutes,
    break_minutes: breakMinutes,
    net_minutes: netMinutes
  };
}

function buildTimeRecord(payload, user) {
  const employee = apiGetTimeEmployeeByCode(payload.emp_code);
  if (!employee) {
    throw new Error(`ไม่พบรหัสพนักงานตามเวลา ${payload.emp_code}`);
  }

  const recordDate = String(payload.record_date || "").trim();
  const clockIn = normalizeClockText(payload.clock_in);
  const clockOut = normalizeClockText(payload.clock_out);
  if (!recordDate || !clockIn || !clockOut) {
    throw new Error("กรุณากรอกวันที่ เวลาเข้า และเวลาออกให้ครบ");
  }

  const calculation = calculateWorkMinutes(clockIn, clockOut);
  const now = new Date().toISOString();

  return {
    record_date: recordDate,
    employee_id: employee.id,
    emp_code: employee.emp_code,
    fullname: employee.fullname,
    department: employee.department || "",
    employee_type: employee.employee_type || "normal",
    employee_type_label: getTimeEmployeeTypeOption(employee.employee_type).label,
    daily_wage: employee.daily_wage || TIME_DAILY_WAGE,
    normal_hourly_rate: (employee.daily_wage || TIME_DAILY_WAGE) / TIME_STANDARD_HOURS,
    ot_hourly_rate: Number(employee.ot_hourly_rate) || TIME_OT_HOURLY_RATE,
    clock_in: clockIn,
    clock_out: clockOut,
    ...calculation,
    created_by: user.fullname,
    created_at: now,
    updated_at: now
  };
}

function findDuplicateTimeRecord(empCode, recordDate, excludeId = null) {
  const normalizedCode = normalizeTimeEmployeeCodeInput(empCode);
  return getTimeRecords().find((record) => (
    record.id !== excludeId &&
    normalizeTimeEmployeeCodeInput(record.emp_code || "") === normalizedCode &&
    record.record_date === recordDate
  )) || null;
}

function assertNoDuplicateTimeRecord(empCode, recordDate, excludeId = null) {
  const duplicate = findDuplicateTimeRecord(empCode, recordDate, excludeId);
  if (duplicate) {
    throw new Error(`พนักงานรหัส ${empCode} มีรายการวันที่ ${recordDate} แล้ว กรุณากดแก้ไขรายการเดิมแทน`);
  }
}

function dateToLocalInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shouldAuditTimeRecordEdit(record, now = new Date()) {
  const createdAt = new Date(record.created_at || record.updated_at || now.toISOString());
  const createdDate = dateToLocalInputValue(createdAt);
  const today = dateToLocalInputValue(now);
  const ageMinutes = Number.isNaN(createdAt.getTime()) ? Infinity : (now.getTime() - createdAt.getTime()) / 60000;
  return ageMinutes > 2 || createdDate !== today || record.record_date !== today;
}

function apiCreateTimeRecord(payload, user) {
  const records = getTimeRecords();
  const recordDate = String(payload.record_date || "").trim();
  const empCode = normalizeTimeEmployeeCodeInput(payload.emp_code);
  assertNoDuplicateTimeRecord(empCode, recordDate);
  const nextId = records.length ? Math.max(...records.map((record) => record.id || 0)) + 1 : 1;
  const record = {
    ...buildTimeRecord(payload, user),
    id: nextId
  };

  saveTimeRecords([...records, record]);
  addAuditLog(
    user,
    "INSERT_TIME_RECORD",
    `Added time record ${record.emp_code} ${record.clock_in}-${record.clock_out}`
  );
  return record;
}

function apiUpdateTimeRecord(id, payload, user) {
  const records = getTimeRecords();
  const existingRecord = records.find((record) => record.id === id);
  if (!existingRecord) {
    throw new Error("ไม่พบรายการเวลาที่ต้องการแก้ไข");
  }

  const nextRecord = {
    ...buildTimeRecord(payload, user),
    id,
    created_by: existingRecord.created_by,
    created_at: existingRecord.created_at,
    updated_by: user.fullname,
    updated_at: new Date().toISOString()
  };
  assertNoDuplicateTimeRecord(nextRecord.emp_code, nextRecord.record_date, id);

  saveTimeRecords(records.map((record) => (record.id === id ? nextRecord : record)));
  if (shouldAuditTimeRecordEdit(existingRecord)) {
    addAuditLog(
      user,
      "UPDATE_TIME_RECORD",
      `Edited time record ${existingRecord.emp_code} #${id}: ${existingRecord.record_date} ${existingRecord.clock_in}-${existingRecord.clock_out} -> ${nextRecord.record_date} ${nextRecord.clock_in}-${nextRecord.clock_out}`
    );
  }
  return nextRecord;
}

function apiDeleteTimeRecord(id, user) {
  const records = getTimeRecords();
  const record = records.find((item) => item.id === id);
  saveTimeRecords(records.filter((item) => item.id !== id));
  if (record) {
    addAuditLog(user, "DELETE_TIME_RECORD", `Deleted time record ${record.emp_code} #${id}`);
  }
}

function apiGetTimeRecordsForDate(date = timeRecordDate) {
  return getTimeRecords()
    .filter((record) => record.record_date === date)
    .sort((a, b) => `${a.emp_code} ${a.clock_in}`.localeCompare(`${b.emp_code} ${b.clock_in}`));
}

function addDaysToDate(dateValue, days) {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function formatWeeklyDateLabel(dateValue) {
  const [year, month, dateNumber] = String(dateValue).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, dateNumber));
  const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const dayText = String(date.getUTCDate()).padStart(2, "0");
  const monthText = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${weekdays[date.getUTCDay()]} ${dayText}/${monthText}`;
}

function renderTimeModeSelector() {
  const options = [
    {
      id: "daily",
      label: "บันทึกรายวัน",
      description: "กรอกเวลารายการเดียวหรือรายการรายวัน"
    },
    {
      id: "weekly",
      label: "บันทึกรายสัปดาห์",
      description: "เลือกพนักงานและกรอกเวลาแบบ 7 วัน"
    }
  ];

  return `
    <section class="time-mode-switch">
      ${options
        .map(
          (option) => `
            <button class="time-mode-card ${timeEntryMode === option.id ? "active" : ""}" data-time-mode="${option.id}" type="button">
              <strong>${escapeHtml(option.label)}</strong>
              <span>${escapeHtml(option.description)}</span>
            </button>
          `
        )
        .join("")}
    </section>
  `;
}

function apiGetLatestProductionRecords(limit = 10) {
  const today = new Date().toISOString().slice(0, 10);
  return getProductionRecords()
    .filter((record) => record.record_date === today)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

function apiCheckProductionDuplicate(employeeId, now = new Date(), fruitId = getSelectedProductionFruitId()) {
  const oneMinuteAgo = now.getTime() - 60 * 1000;

  return (
    getProductionRecords()
      .filter(
        (record) =>
          record.employee_id === employeeId && productionFruitTypeForRecord(record) === fruitId
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .find((record) => new Date(record.created_at).getTime() >= oneMinuteAgo) ||
    null
  );
}

function buildProductionRecord(payload, user, existingRecord = null) {
  const now = new Date();
  const recordDate = payload.record_date || existingRecord?.record_date || now.toISOString().slice(0, 10);
  const recordTime = now.toTimeString().slice(0, 8);
  const fruitType = payload.fruit_type || existingRecord?.fruit_type || "mangosteen";
  const labels = getProductionFieldLabels(fruitType);
  const base = existingRecord || {};

  if (isDurianFruit(fruitType)) {
    const gradeWeights = normalizeDurianGradeWeights(payload.grade_weights || existingRecord?.grade_weights);
    const gradeRates = {};
    const gradeAmounts = {};
    const missingRates = [];
    DURIAN_GRADES.forEach((grade) => {
      const rateRecord = apiGetCurrentProductionRate(fruitType, `grade_${grade}`, recordDate);
      if (gradeWeights[grade] > 0 && !rateRecord) missingRates.push(`เกรด ${grade}`);
      gradeRates[grade] = Number(rateRecord?.rate || 0);
      gradeAmounts[grade] = gradeWeights[grade] * gradeRates[grade];
    });
    if (missingRates.length) {
      throw new Error(`ยังไม่มีอัตราค่าจ้างทุเรียนสำหรับ ${missingRates.join(", ")} วันที่ ${recordDate}`);
    }
    const totalWeight = getDurianGradeTotal(gradeWeights);
    const totalAmount = DURIAN_GRADES.reduce((sum, grade) => sum + gradeAmounts[grade], 0);
    return {
      ...base,
      id: existingRecord?.id,
      session_id: payload.session_id || existingRecord?.session_id || 0,
      fruit_type: fruitType,
      employee_id: payload.employee.id,
      emp_code: payload.employee.emp_code,
      pile_no: Number(payload.pile_no || existingRecord?.pile_no || 1),
      pile: Number(payload.pile_no || existingRecord?.pile_no || 1),
      date: recordDate,
      record_date: recordDate,
      record_time: recordTime,
      shift: payload.shift || existingRecord?.shift || "",
      grade_weights: gradeWeights,
      grade_rates: gradeRates,
      grade_amounts: gradeAmounts,
      total_weight: totalWeight,
      water_weight: 0,
      flower_weight: 0,
      water: 0,
      flower: 0,
      water_rate: 0,
      flower_rate: 0,
      water_amount: 0,
      flower_amount: 0,
      water_total: 0,
      flower_total: 0,
      total_amount: totalAmount,
      grand_total: totalAmount,
      created_by: existingRecord?.created_by || user.fullname,
      updated_by: user.fullname,
      status: existingRecord?.status || "Draft",
      is_locked: existingRecord?.is_locked || 0,
      created_at: existingRecord?.created_at || now.toISOString(),
      updated_at: now.toISOString()
    };
  }
  const waterRateRecord = apiGetCurrentProductionRate(fruitType, "water", recordDate);
  const flowerRateRecord = apiGetCurrentProductionRate(fruitType, "flower", recordDate);

  if (!waterRateRecord || !flowerRateRecord) {
    const missing = [
      !waterRateRecord ? labels.water : "",
      !flowerRateRecord ? labels.flower : ""
    ].filter(Boolean).join(", ");
    throw new Error(`ยังไม่มีอัตราค่าจ้างสำหรับ ${missing} วันที่ ${recordDate}`);
  }

  const waterRate = Number(waterRateRecord.rate);
  const flowerRate = Number(flowerRateRecord.rate);

  const waterWeight = Number(payload.water_weight);
  const flowerWeight = Number(payload.flower_weight);
  const waterAmount = waterWeight * waterRate;
  const flowerAmount = flowerWeight * flowerRate;

  return {
    ...base,
    id: existingRecord?.id,
    session_id: payload.session_id || existingRecord?.session_id || 0,
    fruit_type: fruitType,
    employee_id: payload.employee.id,
    emp_code: payload.employee.emp_code,
    pile_no: Number(payload.pile_no || existingRecord?.pile_no || 1),
    date: recordDate,
    shift: payload.shift || existingRecord?.shift || "",
    pile: Number(payload.pile_no || existingRecord?.pile_no || 1),
    water_weight: waterWeight,
    flower_weight: flowerWeight,
    water: waterWeight,
    flower: flowerWeight,
    water_rate: waterRate,
    flower_rate: flowerRate,
    water_amount: waterAmount,
    flower_amount: flowerAmount,
    water_total: waterAmount,
    flower_total: flowerAmount,
    total_amount: waterAmount + flowerAmount,
    grand_total: waterAmount + flowerAmount,
    record_date: recordDate,
    record_time: recordTime,
    created_by: existingRecord?.created_by || user.fullname,
    updated_by: user.fullname,
    status: existingRecord?.status || "Draft",
    is_locked: existingRecord?.is_locked || 0,
    created_at: existingRecord?.created_at || now.toISOString(),
    updated_at: now.toISOString()
  };
}

function apiCreateProductionRecord(payload, user) {
  const records = getProductionRecords();
  const nextId = records.length
    ? Math.max(...records.map((record) => record.id)) + 1
    : 1;
  const record = {
    ...buildProductionRecord(payload, user),
    id: nextId
  };

  saveProductionRecords([...records, record]);
  addAuditLog(
    user,
    "INSERT_PRODUCTION",
    isDurianFruit(record.fruit_type)
      ? `Added ${record.emp_code} pile ${record.pile_no} durian grades ${JSON.stringify(record.grade_weights)}`
      : `Added ${record.emp_code} pile ${record.pile_no} water ${record.water_weight} flower ${record.flower_weight}`
  );
  return record;
}

function apiUpdateProductionRecord(id, payload, user) {
  const records = getProductionRecords();
  const existingRecord = records.find((record) => record.id === id);

  if (!existingRecord) {
    throw new Error("Existing production record was not found.");
  }

  const updatedRecord = buildProductionRecord(payload, user, existingRecord);
  saveProductionRecords(
    records.map((record) => (record.id === id ? updatedRecord : record))
  );
  addAuditLog(
    user,
    "UPDATE_PRODUCTION",
    `Updated ${updatedRecord.emp_code} record #${updatedRecord.id}`
  );
  return updatedRecord;
}

function money(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(value);
}

function numberText(value) {
  return Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function compactNumberText(value) {
  return Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function buildReportPayload(date = reportDate, employeeIds = selectedReportEmployeeIds) {
  return {
    date,
    employee_ids: employeeIds.map(Number),
    employees: getEmployees(),
    production_records: getProductionRecords(),
    deduction_records: getReportAdjustmentRecords()
  };
}

function getExportPositionLabel(user) {
  if (!user) return "ระบบ";
  if (user.role === "hr" || user.role_key === "hr") return "ฝ่ายบุคคล";
  if (user.role === "admin") return user.role_label || "ผู้ดูแลระบบ";
  if (user.role === "developer") return user.role_label || "ผู้พัฒนา";
  return user.role_label || user.role || "พนักงาน";
}

function buildFullExportPayload(user, rangeOverride = null, departmentOverride = null) {
  const range = rangeOverride || getTimeSummaryRange();
  return {
    start_date: range.startDate,
    end_date: range.endDate,
    department: departmentOverride || timeSummaryDepartment,
    printed_by: user?.fullname || "System Admin",
    printed_by_position: getExportPositionLabel(user),
    employees: getEmployees(),
    production_records: getProductionRecords(),
    time_records: getTimeRecords(),
    deduction_records: getReportAdjustmentRecords()
  };
}

async function syncReportData() {
  const response = await fetch(`${REPORT_API_BASE}/reports/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildReportPayload())
  });

  if (!response.ok) {
    throw new Error("Could not sync report data.");
  }
}

async function downloadReport(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`ไม่สามารถเชื่อมต่อ Report Server ได้ กรุณาเปิด start_report_server.bat หรือ start_pismai_system.bat ก่อน Export`);
  }

  if (!response.ok) {
    throw new Error("Report export failed.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : "report-file";
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function setReportMessage(message, type = "success") {
  reportMessage = message;
  reportMessageType = type;
}

function render() {
  const session = getSession();
  const route = location.hash.replace("#/", "") || "login";

  if (lastRenderedRoute === "audit-log" && route !== "audit-log") {
    auditLogUnlocked = false;
    auditLogMessage = "";
  }

  if (!session && route !== "login") {
    location.hash = "#/login";
    return;
  }

  if (session && route === "login") {
    location.hash = `#/${getDefaultRouteForUser(session.user)}`;
    return;
  }

  if (!session) {
    onlineUserCount = 0;
    updateOnlineUserBadges();
    renderLogin();
    return;
  }

  startOnlineUserHeartbeat();

  if (!canOpen(session.user, route)) {
    renderAccessDenied(session.user, route);
    lastRenderedRoute = route;
    return;
  }

  if (route === "production" && lastRenderedRoute !== "production") {
    setSelectedProductionFruit("");
    productionMessage = "";
  }
  lastRenderedRoute = route;

  renderApp(session.user, route);
}

function formatLiveClock(now = new Date()) {
  const date = now.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const time = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return `${date} ${time}`;
}

function updateLiveClocks() {
  document.querySelectorAll("[data-live-clock]").forEach((clock) => {
    clock.textContent = formatLiveClock();
  });
}

function startLiveClock() {
  updateLiveClocks();
  window.setInterval(updateLiveClocks, 1000);
}

function renderLogin(errorMessage = "") {
  app.innerHTML = `
    <main class="page login-page">
      <section class="login-shell">
        <div class="login-intro">
          <div class="brand-mark" aria-label="Pitsamai Frozen Fruits">
            <img class="brand-logo" src="assets/pitsamai-logo.png" alt="Pitsamai Frozen Fruits" />
          </div>

          <div class="login-copy">
            <p class="eyebrow">Pitsamai Frozen Fruits</p>
            <h1>System<span>Pro</span></h1>
            <p class="brand-subtitle">by Pitsamai Frozen Fruits</p>
            <div class="login-divider"></div>
            <p class="intro-text">
              ระบบบันทึกผลผลิตและคำนวณค่าจ้างรายบุคคลสำหรับโรงงานพิสมัยผลไม้แช่แข็ง
            </p>
          </div>

          <div class="login-feature-row" aria-label="System highlights">
            <div><span>Production</span><strong>บันทึกผลผลิต</strong></div>
            <div><span>Wage</span><strong>คำนวณค่าจ้าง</strong></div>
            <div><span>Report</span><strong>รายงานสรุป</strong></div>
          </div>
        </div>

        <div class="login-panel">
          <form class="login-card" id="loginForm">
            <div class="login-lock" aria-hidden="true">
              <span></span>
            </div>
            <h2>เข้าสู่ระบบ</h2>
            <p class="hint">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
            ${errorMessage ? `<div class="alert alert-error">${errorMessage}</div>` : ""}

            <label class="field">
              <span>ชื่อผู้ใช้งาน</span>
              <input id="username" name="username" autocomplete="username" placeholder="กรอกชื่อผู้ใช้งาน" required />
            </label>

            <label class="field">
              <span>รหัสผ่าน</span>
              <input id="password" name="password" type="password" autocomplete="current-password" placeholder="กรอกรหัสผ่าน" required />
            </label>

            <div class="login-options">
              <label class="remember-check">
                <input name="remember_session" type="checkbox" />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>
              <button class="forgot-button" type="button">ลืมรหัสผ่าน?</button>
            </div>

            <button class="btn btn-primary login-submit" type="submit">
              <span class="login-arrow" aria-hidden="true"></span>
              เข้าสู่ระบบ
            </button>

            <div class="login-separator"><span>หรือ</span></div>

            <p class="demo-note secure-note">
              ระบบปลอดภัย ได้รับการป้องกันข้อมูล กรุณาอย่าเปิดเผยข้อมูลการเข้าสู่ระบบ
            </p>
          </form>
        </div>
      </section>
      <footer class="login-footer">
        <span>© 2026 Pitsamai Frozen Fruits Co., Ltd. สงวนลิขสิทธิ์ทุกประการ</span>
      </footer>
    </main>
  `;

  document.querySelector("#loginForm")?.addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const username = String(form.get("username") || "").trim();
  const normalizedUsername = username.toLowerCase();
  const password = String(form.get("password") || "").trim();
  const rememberSession = form.get("remember_session") === "on";

  try {
    const cloudUser = await loginWithCloud(username, password);
    saveSession(cloudUser, rememberSession);
    sessionStorage.setItem("pismai_welcome_user", cloudUser.username);
    hydrateAccountsFromCloud().catch(() => {});
    const nextRoute = getDefaultRouteForUser(cloudUser);
    if (location.hash === `#/${nextRoute}`) {
      render();
    } else {
      location.hash = `#/${nextRoute}`;
    }
    return;
  } catch (cloudError) {
    if (cloudError?.status && [401, 403, 404].includes(cloudError.status)) {
      renderLogin(cloudError.message || "ไม่พบบัญชีนี้ในฐานข้อมูลกลาง");
      return;
    }
    console.warn("Cloud login unavailable or rejected, falling back to local login.", cloudError);
  }

  const accountUsers = getAccountUsers();
  const registeredUser = accountUsers.find(
    (accountUser) => accountUser.username.toLowerCase() === normalizedUsername
  );
  const demoUser = users.find((item) => item.username.toLowerCase() === normalizedUsername);
  const matchedUser = registeredUser || demoUser || null;
  const user =
    matchedUser &&
    matchedUser.password === password &&
    matchedUser.isActive !== false
      ? matchedUser
      : null;

  if (!user) {
    if (matchedUser && matchedUser.isActive === false) {
      renderLogin("บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
      return;
    }
    if (matchedUser && matchedUser.password !== password) {
      renderLogin("รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      return;
    }
    renderLogin("ไม่พบบัญชีนี้ในเครื่องนี้ หากสมัครจากเครื่องอื่นต้อง Import/Backup ข้อมูลบัญชีมาก่อน");
    return;
  }

  saveSession(user, rememberSession);
  sessionStorage.setItem("pismai_welcome_user", user.username);
  const nextRoute = getDefaultRouteForUser(user);
  if (location.hash === `#/${nextRoute}`) {
    render();
  } else {
    location.hash = `#/${nextRoute}`;
  }
}

function renderApp(user, route) {
  if (route !== "secret-room") window.SecretRoom?.stop?.();
  if (route === "accounting-control" && window.AccountingControl) {
    window.AccountingControl.render(app, user, {
      onExit: () => { location.hash = "#/dashboard"; },
      onAudit: (action, description) => addAuditLog(user, action, description)
    });
    return;
  }
  if (!liveStateCloudBootstrapped) {
    liveStateCloudBootstrapped = true;
    bootstrapLiveStateFromCloud().then(() => render()).catch((error) => {
      console.warn("Live cloud state bootstrap failed.", error);
    });
  }
  if (!accountCloudBootstrapped) {
    accountCloudBootstrapped = true;
    hydrateAccountsFromCloud().catch((error) => {
      console.warn("Account cloud bootstrap failed.", error);
    });
  }
  if (!wageRateCloudBootstrapped) {
    wageRateCloudBootstrapped = true;
    hydrateWageRatesFromCloud().then(() => {
      if (location.hash.replace("#/", "") === "wage-rates") render();
    }).catch((error) => {
      console.warn("Wage rate cloud bootstrap failed.", error);
    });
  }
  if (!employeeCloudBootstrapped) {
    employeeCloudBootstrapped = true;
    bootstrapEmployeesWithCloud().then(() => {
      const currentRoute = location.hash.replace("#/", "");
      if (["dashboard", "employees", "production-employees", "time-employees", "production", "time-report", "compare-data", "summary-person", "summary-all", "summary-main", "settings"].includes(currentRoute)) {
        render();
      }
    }).catch((error) => {
      console.warn("Employee cloud bootstrap failed.", error);
    });
  }
  if (!deductionCloudBootstrapped) {
    deductionCloudBootstrapped = true;
    Promise.all([hydrateDeductionsFromCloud(), hydrateDeductionApplicationsFromCloud()]).then(() => {
      const currentRoute = location.hash.replace("#/", "");
      if (["compare-data", "summary-person", "summary-all", "summary-main", "summary-group-report", "summary-time-overview"].includes(currentRoute)) {
        render();
      }
    }).catch((error) => {
      console.warn("Deduction cloud bootstrap failed.", error);
    });
  }

  const moduleItem = modules.find((item) => item.id === route) || modules[0];
  const visibleModules = visibleNavModulesForUser(user);
  const navOrder = ["dashboard", "production", "time-report", "compare-data", "summary-person", "summary-all", "reports", "settings", "accounting-control", "secret-room"];
  visibleModules.sort((a, b) => navOrder.indexOf(a.id) - navOrder.indexOf(b.id));
  const shouldShowWelcome = sessionStorage.getItem("pismai_welcome_user") === user.username;

  app.innerHTML = `
    <main class="app-layout">
      <div class="drawer-overlay" data-close-drawer></div>
      ${
        shouldShowWelcome
          ? `<div class="welcome-toast" role="status">ยินดีต้อนรับ ${escapeHtml(user.fullname)}</div>`
          : ""
      }
      <header class="topbar">
        <div class="topbar-inner">
          <div class="topbar-brand-row">
            <button class="mobile-menu-button" id="mobileMenuButton" type="button" aria-label="เปิดเมนู">
              <span></span>
            </button>
            <div>
              <p class="eyebrow">Pitsamai Frozen Fruits</p>
              <h1 class="brand-title">${escapeHtml(moduleItem.label)}</h1>
              <span class="topbar-clock" data-live-clock>${formatLiveClock()}</span>
            </div>
          </div>
          <div class="user-box">
            <div class="online-users-widget" title="จำนวนผู้ใช้งานเว็บที่ยังใช้งานอยู่">
              <span class="online-dot" aria-hidden="true"></span>
              <span>ออนไลน์</span>
              <strong data-online-user-count>${onlineUserCountText()}</strong>
            </div>
            <div class="user-meta">
              <strong>${escapeHtml(user.fullname)}</strong>
              <span>${escapeHtml(user.role_label || user.role)}</span>
            </div>
          </div>
        </div>
      </header>
      <section class="content">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <span>Pitsamai</span>
            <strong>Factory Wage</strong>
          </div>
          <nav class="nav-stack">
            ${visibleModules
              .map(
                (item) => `
                  <button class="nav-button ${item.id === route ? "active" : ""} ${item.locked ? "locked" : ""}" data-route="${item.id}" type="button">
                    <span class="nav-label">
                      <span class="nav-icon">${escapeHtml(item.icon || "•")}</span>
                      ${escapeHtml(item.label)}
                    </span>
                    ${item.locked ? `<span class="nav-lock">ล็อก</span>` : ""}
                  </button>
                `
              )
              .join("")}
          </nav>
          <div class="sidebar-session">
            <span>ผู้ใช้งาน</span>
            <b>${escapeHtml(user.fullname)}</b>
            <strong>${escapeHtml(user.role_label || user.role)}</strong>
          </div>
          <button class="sidebar-logout" id="logoutButton" type="button">ออกจากระบบ</button>
        </aside>
        <div class="main-stack">
          ${renderModuleContent(user, moduleItem)}
        </div>
      </section>
    </main>
  `;

  if (shouldShowWelcome) {
    sessionStorage.removeItem("pismai_welcome_user");
    window.setTimeout(() => {
      const toast = document.querySelector(".welcome-toast");
      toast?.classList.add("welcome-toast-hide");
      window.setTimeout(() => toast?.remove(), 280);
    }, 3200);
  }

  bindAppEvents(user, moduleItem);
}
function renderModuleContent(user, moduleItem) {
  const settingsSubpageIds = new Set(["employees", "production-employees", "time-employees", "wage-rates", "account-management", "audit-log", "backup"]);
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
    return wrapSettingsSubpage(renderWageRateForm());
  }
  if (moduleItem.id === "account-management") {
    return wrapSettingsSubpage(renderAccountManagement(user, moduleItem));
  }
  if (moduleItem.id === "audit-log") {
    return wrapSettingsSubpage(renderAuditLog(moduleItem));
  }
  if (moduleItem.id === "backup") {
    return wrapSettingsSubpage(renderBackupModule(moduleItem));
  }
  if (moduleItem.id === "pile-management") {
    return renderPileManagement(moduleItem);
  }
  if (moduleItem.id === "settings") {
    return renderFullSettingsModule(user);
  }
  if (moduleItem.id === "secret-room" && window.SecretRoom) {
    return window.SecretRoom.render();
  }
  return renderSimpleModule(moduleItem);
}

function bindAppEvents(user, moduleItem) {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => {
      document.body.classList.remove("drawer-open");
      const nextRoute = button.dataset.route;
      if (nextRoute === "summary-main") {
        summaryDate = new Date().toISOString().slice(0, 10);
      }
      location.hash = `#/${nextRoute}`;
    });
  });

  document.querySelector("#mobileMenuButton")?.addEventListener("click", () => {
    document.body.classList.add("drawer-open");
  });
  document.querySelector("[data-close-drawer]")?.addEventListener("click", () => {
    document.body.classList.remove("drawer-open");
  });
  document.querySelector("#logoutButton")?.addEventListener("click", () => {
    auditLogUnlocked = false;
    auditLogMessage = "";
    clearSession();
    onlineUserCount = 0;
    updateOnlineUserBadges();
    location.hash = "#/login";
  });

  if (moduleItem.id === "production") bindProductionManagementEvents(user);
  if (moduleItem.id === "summary-main") bindSummaryAllEvents();
  if (moduleItem.id === "summary-export") bindSummaryExportEvents(user);
  if (moduleItem.id === "summary-time-overview") bindTimeSummaryEvents();
  if (moduleItem.id === "summary-group-report") bindSummaryGroupReportEvents(user);
  if (moduleItem.id === "reports") bindReportEvents();
  if (moduleItem.id === "summary-person") bindPersonalReportEvents();
  if (moduleItem.id === "time-report") bindTimeReportEvents(user);
  if (moduleItem.id === "compare-data") bindDeductionEvents(user);
  if (moduleItem.id === "production-employees") bindEmployeeEvents(user);
  if (moduleItem.id === "time-employees") bindTimeEmployeeEvents(user);
  if (moduleItem.id === "wage-rates") bindWageRateEvents(user);
  if (moduleItem.id === "account-management") bindAccountManagementEvents(user);
  if (moduleItem.id === "backup") bindBackupEvents(user);
  if (moduleItem.id === "pile-management") bindPileManagementEvents(user);
  if (moduleItem.id === "audit-log") bindAuditLogPasswordEvents();
  if (moduleItem.id === "secret-room") window.SecretRoom?.bind?.();
}

function renderLegacyDashboard(moduleItem) {
  const records = getProductionRecords();
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((record) => (record.record_date || record.date) === today);
  const totals = getProductionTotals(records);
  const todayTotals = getProductionTotals(todayRecords);
  const activeEmployees = getEmployees().filter((employee) => employee.status === "Active").length;
  const latestRecords = records
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 8);

  return `
    <section class="factory-dashboard">
      <div class="factory-hero">
        <div class="factory-hero-copy">
          <p class="eyebrow">Pitsamai Frozen Fruits</p>
          <h2>ระบบบันทึกผลผลิตและค่าแรงประจำวัน</h2>
          <p>ศูนย์ควบคุมงานบันทึกผลผลิต ตรวจสอบข้อมูลพนักงาน และดูภาพรวมผลผลิตของโรงงาน</p>
          <div class="factory-hero-actions">
            <button class="btn btn-primary" type="button" data-route="production">บันทึกผลผลิต</button>
            <button class="btn btn-outline" type="button" data-route="summary-all">ดูสรุปข้อมูลทั้งหมด</button>
          </div>
        </div>
        <div class="factory-hero-brand">
          <img src="assets/pitsamai-logo.png" alt="Pitsamai Frozen Fruits" />
          <span>Factory Wage</span>
        </div>
      </div>

      <div class="factory-status-strip">
        <div>
          <span>พนักงานใช้งาน</span>
          <strong>${activeEmployees} คน</strong>
        </div>
        <div>
          <span>รายการวันนี้</span>
          <strong>${todayRecords.length} รายการ</strong>
        </div>
        <div>
          <span>ยอดเงินวันนี้</span>
          <strong>${money(todayTotals.amount)}</strong>
        </div>
      </div>

      <section class="factory-section">
        <h3>เมนูทำงานหลัก</h3>
        <p>เริ่มจากบันทึกผลผลิต ตรวจสอบความถูกต้อง แล้วเปิดหน้าสรุปหรือรายงานตามต้องการ</p>
        <div class="factory-action-grid">
          <button class="factory-action-card" type="button" data-route="production">
            <span class="factory-action-icon">▣</span>
            <strong>บันทึกผลผลิต</strong>
            <small>เลือกผลไม้และกรอกน้ำหนักของพนักงาน</small>
          </button>
          <button class="factory-action-card" type="button" data-route="summary-all">
            <span class="factory-action-icon">▤</span>
            <strong>สรุปผลทั้งหมด</strong>
            <small>ดูภาพรวมผลผลิต น้ำหนัก และยอดเงิน</small>
          </button>
          <button class="factory-action-card" type="button" data-route="summary-person">
            <span class="factory-action-icon">◎</span>
            <strong>สรุปรายบุคคล</strong>
            <small>ตรวจข้อมูลแยกตามพนักงานและช่วงเวลา</small>
          </button>
          <button class="factory-action-card" type="button" data-route="settings">
            <span class="factory-action-icon">⚙</span>
            <strong>ตั้งค่า</strong>
            <small>จัดการข้อมูลพนักงานและข้อมูลหลัก</small>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>ภาพรวมทั้งหมด</h2>
            <p>น้ำหนัก ผลผลิต และยอดเงินสะสมในระบบ</p>
          </div>
          <span class="badge badge-success">${money(totals.amount)}</span>
        </div>
        <div class="metrics">
          <div class="metric-card"><span>น้ำหนักรวมทั้งหมด</span><strong>${numberText(totals.total)} กก.</strong><small>น้ำ ${numberText(totals.water)} กก. | ดอก ${numberText(totals.flower)} กก. | ทุเรียน ${numberText(getDurianGradeTotal(totals.grades))} กก.</small></div>
          <div class="metric-card"><span>พนักงานที่มีรายการ</span><strong>${totals.people.size} คน</strong><small>รวมทั้งหมด</small></div>
          <div class="metric-card"><span>จำนวนรายการ</span><strong>${records.length}</strong><small>รายการทั้งหมด</small></div>
          <div class="metric-card"><span>ข้อมูลล่าสุด</span><strong>${latestRecords[0]?.record_date || "-"}</strong><small>${latestRecords[0]?.record_time || "ยังไม่มีรายการ"}</small></div>
        </div>
      </section>

      ${renderProductionRecordsTable(latestRecords, false)}
    </section>
  `;
}
function renderDashboardActionCard(user, route, icon, title, description) {
  const locked = !canOpen(user, route);
  return `
    <button class="factory-action-card ${locked ? "locked" : ""}" type="button" data-route="${route}">
      <span class="factory-action-icon">${escapeHtml(icon)}</span>
      <strong>${escapeHtml(title)}</strong>
      <small>${escapeHtml(description)}</small>
      ${locked ? `<span class="factory-card-lock">ต้องใช้สิทธิ์สูงกว่า</span>` : ""}
    </button>
  `;
}

function renderDashboard(user, moduleItem) {
  const dateLabel = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());
  const canViewSummary = canOpen(user, "summary-all");

  return `
    <section class="factory-dashboard">
      <div class="factory-hero">
        <div class="factory-hero-copy">
          <p class="eyebrow">Pitsamai Frozen Fruits Co., Ltd.</p>
          <h2>ยินดีต้อนรับสู่ระบบโรงงาน</h2>
          <p>
            ศูนย์ควบคุมงานบันทึกผลผลิตและค่าแรงประจำวัน
            สำหรับฝ่ายผลิต ฝ่ายบุคคล และผู้ดูแลระบบ
          </p>
          <div class="factory-hero-actions">
            <button class="btn btn-primary" type="button" data-route="production">บันทึกผลผลิต</button>
            ${
              canViewSummary
                ? `<button class="btn btn-outline" type="button" data-route="summary-all">ดูสรุปข้อมูลทั้งหมด</button>`
                : `<button class="btn btn-outline btn-locked" type="button" data-route="summary-all">สรุปข้อมูลถูกล็อก</button>`
            }
          </div>
        </div>
        <div class="factory-hero-brand">
          <img src="assets/pitsamai-logo.png" alt="Pitsamai" />
          <span>Factory Wage System</span>
        </div>
      </div>

      <div class="factory-status-strip">
        <div>
          <span>วันที่ใช้งาน</span>
          <strong>${escapeHtml(dateLabel)}</strong>
        </div>
        <div>
          <span>ผู้ใช้งาน</span>
          <strong>${escapeHtml(user.fullname)}</strong>
        </div>
        <div>
          <span>ผู้ใช้งานออนไลน์</span>
          <strong data-online-user-count>${onlineUserCountText()}</strong>
        </div>
      </div>

      <section class="factory-section">
        <div class="section-title-row">
          <div>
            <h3>เมนูงานหลัก</h3>
            <p>เลือกงานที่ต้องการดำเนินการในระบบโรงงาน</p>
          </div>
        </div>
        <div class="factory-action-grid">
          ${renderDashboardActionCard(user, "production", "▣", "บันทึกผลผลิต", "กรอกน้ำหนักน้ำ ดอก และค่าแรงของพนักงาน")}
          ${renderDashboardActionCard(user, "summary-all", "▤", "สรุปข้อมูลทั้งหมด", "เปิดหน้ารายงานตัวเลข กราฟ และตารางรายละเอียด")}
          ${renderDashboardActionCard(user, "summary-person", "◎", "สรุปรายบุคคล", "ตรวจสอบผลงานแยกตามพนักงาน")}
          ${renderDashboardActionCard(user, "time-report", "◷", "เวลาทำงาน", "ดูและจัดการข้อมูลเวลาเข้างานตามสิทธิ์")}
          ${renderDashboardActionCard(user, "reports", "▧", "ส่งออกรายงาน", "สร้างไฟล์ PDF และ Excel สำหรับส่งต่อ")}
          ${renderDashboardActionCard(user, "settings", "⚙", "ตั้งค่าระบบ", "จัดการข้อมูลหลักและสิทธิ์ผู้ใช้งาน")}
        </div>
      </section>

      <section class="factory-section">
        <div class="factory-notice">
          <div>
            <h3>แนวทางการใช้งานประจำวัน</h3>
            <p>เริ่มจากบันทึกผลผลิต ตรวจสอบความถูกต้อง แล้วจึงเปิดหน้าสรุปเพื่อพิมพ์หรือส่งต่อรายงาน</p>
          </div>
          ${
            canViewSummary
              ? `<button class="btn btn-outline" type="button" data-route="summary-all">ไปหน้าสรุป</button>`
              : `<button class="btn btn-primary" type="button" data-route="production">เริ่มบันทึกผลผลิต</button>`
          }
        </div>
      </section>
    </section>
  `;
}

function renderSummaryMenu(moduleItem) {
  return `
    <section class="summary-page summary-menu-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>เลือกประเภทข้อมูลสรุปที่ต้องการดู</p>
        </div>
      </div>

      <div class="summary-choice-grid">
        <button class="summary-choice-button" type="button" data-route="summary-main">
          <span class="summary-choice-icon">▣</span>
          <span class="summary-choice-copy">
            <strong>สรุปข้อมูลหลัก</strong>
            <small>ดูภาพรวมผลผลิต น้ำหนัก ค่าแรง ตารางรายละเอียด และ Export ข้อมูล</small>
          </span>
          <span class="summary-choice-arrow">›</span>
        </button>
        <button class="summary-choice-button" type="button" data-route="summary-time-overview">
          <span class="summary-choice-icon">◷</span>
          <span class="summary-choice-copy">
            <strong>สรุปข้อมูลเวลาเข้างาน</strong>
            <small>เตรียมพื้นที่สำหรับรายงานเวลาเข้าออกงานและชั่วโมงทำงาน</small>
          </span>
          <span class="summary-choice-arrow">›</span>
        </button>
        <button class="summary-choice-button" type="button" data-route="summary-group-report">
          <span class="summary-choice-icon">▦</span>
          <span class="summary-choice-copy">
            <strong>รายงานแบบกลุ่ม</strong>
            <small>สรุปน้ำหนักและยอดเงินตามกลุ่มรับเงิน พร้อมเลือกข้อมูลก่อน Export</small>
          </span>
          <span class="summary-choice-arrow">›</span>
        </button>
      </div>
    </section>
  `;
}

function renderSummaryTimeOverview(moduleItem) {
  return `
    <section class="summary-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <button class="btn btn-outline" type="button" data-route="summary-all">กลับไปเลือกประเภทสรุป</button>
      </div>
      <section class="panel">
        <div class="empty-state">หน้านี้เตรียมไว้สำหรับฟังก์ชั่นสรุปข้อมูลเวลาเข้างาน</div>
      </section>
    </section>
  `;
}

function renderSummaryExport(moduleItem) {
  const productOptions = [
    { id: "all", label: "ทั้งหมด" },
    ...productionFruitOptions.map((item) => ({ id: item.id, label: item.label }))
  ];
  const selectedProductLabel =
    productOptions.find((item) => item.id === summaryReportExportProduct)?.label || "ทั้งหมด";

  return `
    <section class="summary-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <button class="btn btn-outline" type="button" data-route="summary-main">กลับไปสรุปข้อมูลหลัก</button>
      </div>

      ${
        summaryReportExportMessage
          ? `<div class="alert ${summaryReportExportMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(summaryReportExportMessage)}</div>`
          : ""
      }

      <section class="panel summary-export-workspace">
        <div class="panel-head">
          <div>
            <h2>รายงานสรุปน้ำหนักตามกอง</h2>
            <p>สร้างรายงาน Summary Report สำหรับ PDF และ Excel โดยแสดงเฉพาะสรุปตามกอง</p>
          </div>
          <span class="badge badge-success">A4 Portrait</span>
        </div>

        <form class="summary-export-form" id="summaryExportForm">
          <label class="field">
            <span>จากวันที่</span>
            <input name="start_date" type="date" value="${escapeHtml(summaryReportExportStartDate)}" required />
          </label>
          <label class="field">
            <span>ถึงวันที่</span>
            <input name="end_date" type="date" value="${escapeHtml(summaryReportExportEndDate)}" required />
          </label>
          <label class="field">
            <span>สินค้า</span>
            <select name="product">
              ${productOptions
                .map(
                  (item) => `
                    <option value="${escapeHtml(item.id)}" ${item.id === summaryReportExportProduct ? "selected" : ""}>
                      ${escapeHtml(item.label)}
                    </option>`
                )
                .join("")}
            </select>
          </label>
          <label class="field">
            <span>ประเภทสินค้า</span>
            <input name="product_type" value="${escapeHtml(summaryReportExportProductType)}" placeholder="ทั้งหมด" />
          </label>
        </form>

        <div class="summary-export-preview">
          <div>
            <span>ชื่อรายงาน</span>
            <strong>รายงานสรุปน้ำหนักตามกอง</strong>
          </div>
          <div>
            <span>ช่วงวันที่</span>
            <strong>${escapeHtml(summaryReportExportStartDate)} ถึง ${escapeHtml(summaryReportExportEndDate)}</strong>
          </div>
          <div>
            <span>สินค้า</span>
            <strong>${escapeHtml(selectedProductLabel)}</strong>
          </div>
          <div>
            <span>ระบบ</span>
            <strong>SystemPro</strong>
          </div>
        </div>

        <div class="summary-export-actions">
          <button class="btn btn-outline" id="exportSummaryExcel" type="button">Export Excel</button>
          <button class="btn btn-primary" id="exportSummaryPdf" type="button">Export PDF สรุปตามกอง</button>
        </div>
      </section>
    </section>
  `;
}

function renderSummaryAll(moduleItem) {
  const user = getSession()?.user;
  const selectedDate = getSelectedSummaryDate();
  summaryDate = selectedDate;
  const records = getDashboardRecordsForDate(selectedDate);
  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);

  return `
    <section class="summary-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <div class="summary-filters">
          <label class="summary-date-field">
            <span>วันที่</span>
            <input id="summaryDate" type="date" value="${escapeHtml(selectedDate)}" />
          </label>
          <span class="summary-mode-pill">${records.length.toLocaleString("th-TH")} รายการ</span>
          <button class="btn btn-outline" id="toggleSummaryMainExportMenu" type="button">Export</button>
        </div>
      </div>

      ${
        summaryExportMessage
          ? `<div class="alert ${summaryExportMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(summaryExportMessage)}</div>`
          : ""
      }

      ${
        summaryMainExportMenuOpen
          ? `
            <section class="panel summary-main-export-panel">
              <div class="time-summary-export-menu summary-main-export-menu">
                <button class="time-export-choice" id="exportSummaryMainPdf" type="button">
                  <strong>Export PDF สรุปผลผลิต</strong>
                  <span>ไฟล์ PDF สรุปผลผลิต น้ำหนัก กอง และยอดเงินของวันที่เลือก</span>
                </button>
                <button class="time-export-choice" id="exportSummaryMainExcel" type="button">
                  <strong>Export Excel</strong>
                  <span>ไฟล์ Excel รายละเอียดผลผลิตและน้ำหนักของวันที่เลือก</span>
                </button>
              </div>
            </section>
          `
          : ""
      }

      <div class="summary-metrics">
        <div class="metric-card metric-green">
          <span>น้ำหนักรวมทั้งหมด</span>
          <strong>${numberText(totals.total)} กก.</strong>
          <small>น้ำ ${numberText(totals.water)} กก. | ดอก ${numberText(totals.flower)} กก.</small>
        </div>
        <div class="metric-card metric-blue">
          <span>ยอดเงินรวม</span>
          <strong>${money(totals.amount)}</strong>
          <small>จากรายการวันที่เลือก</small>
        </div>
        <div class="metric-card metric-purple">
          <span>พนักงานทั้งหมด</span>
          <strong>${totals.people.size.toLocaleString("th-TH")} คน</strong>
          <small>พนักงานที่มีรายการ</small>
        </div>
        <div class="metric-card metric-orange">
          <span>จำนวนกอง</span>
          <strong>${pileSummaries.length.toLocaleString("th-TH")}</strong>
          <small>${escapeHtml(selectedDate)}</small>
        </div>
      </div>

      <section class="summary-grid">
        <section class="panel chart-panel">
          <div class="panel-head">
            <div>
              <h2>กราฟเปรียบเทียบน้ำหนัก</h2>
              <p>เปรียบเทียบน้ำหนักน้ำและดอกแยกตามกอง</p>
            </div>
            <div class="chart-legend">
              <span><i class="legend-water"></i>น้ำ</span>
              <span><i class="legend-flower"></i>ดอก</span>
              <span><i class="legend-durian"></i>ทุเรียน A-E</span>
            </div>
          </div>
          <div class="summary-chart">
            ${pileSummaries.length ? renderDashboardBars(pileSummaries) : `<div class="empty-state">ยังไม่มีข้อมูลสำหรับวันที่เลือก</div>`}
          </div>
        </section>

        <section class="table-card">
          <div class="table-heading">สรุปตามกอง</div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>กอง</th>
                  <th>น้ำหนักน้ำ</th>
                  <th>น้ำหนักดอก</th>
                  <th>รวม</th>
                  <th>รวมเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${
                  pileSummaries.length
                    ? pileSummaries.map(renderPileSummaryRow).join("")
                    : `<tr><td colspan="5" class="empty-cell">ยังไม่มีข้อมูลสำหรับวันที่เลือก</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดรายการ</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>เวลา</th>
                <th>รหัสพนักงาน</th>
                <th>ชื่อพนักงาน</th>
                <th>กอง</th>
                <th>น้ำหนักน้ำ</th>
                <th>น้ำหนักดอก</th>
                <th>ทุเรียน A-E</th>
                <th>น้ำหนักรวม</th>
                <th>รวมเงิน</th>
                <th>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>
              ${
                records.length
                  ? records.map(renderDashboardDetailRow).join("")
                  : `<tr><td colspan="10" class="empty-cell">ยังไม่มีข้อมูลสำหรับวันที่เลือก</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function bindSummaryAllEvents() {
  const user = getSession()?.user;
  document.querySelector("#summaryDate")?.addEventListener("change", (event) => {
    summaryDate = event.target.value || new Date().toISOString().slice(0, 10);
    summaryMainExportMenuOpen = false;
    summaryExportMessage = "";
    render();
  });

  document.querySelector("#toggleSummaryMainExportMenu")?.addEventListener("click", () => {
    summaryMainExportMenuOpen = !summaryMainExportMenuOpen;
    render();
  });

  document.querySelector("#exportSummaryMainPdf")?.addEventListener("click", () => {
    exportProductionSummaryReport(user, "pdf");
  });

  document.querySelector("#exportSummaryMainExcel")?.addEventListener("click", () => {
    exportProductionSummaryReport(user, "excel");
  });
}

async function exportProductionSummaryReport(user, format) {
  const selectedDate = getSelectedSummaryDate();
  const range = { startDate: selectedDate, endDate: selectedDate };
  const records = getDashboardRecordsForRange(range.startDate, range.endDate);
  if (!records.length) {
    setSummaryExportMessage("ไม่มีข้อมูลผลผลิต/น้ำหนักในวันที่เลือก จึงยัง Export ไม่ได้", "error");
    summaryMainExportMenuOpen = true;
    render();
    return;
  }

  const endpoint = format === "excel" ? "production-summary-excel" : "production-summary-pdf";
  setSummaryExportMessage(`กำลังสร้างไฟล์ ${format === "excel" ? "Excel" : "PDF"} สรุปผลผลิต...`);
  summaryMainExportMenuOpen = true;
  render();

  try {
    await downloadReport(`${REPORT_API_BASE}/reports/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: range.startDate,
        end_date: range.endDate,
        printed_by: user?.fullname || "System Admin",
        printed_by_position: getExportPositionLabel(user),
        employees: getEmployees(),
        production_records: getProductionRecords()
      })
    });
    setSummaryExportMessage(`Export ${format === "excel" ? "Excel" : "PDF"} สรุปผลผลิต ${selectedDate} เรียบร้อยแล้ว`);
    summaryMainExportMenuOpen = false;
  } catch (error) {
    setSummaryExportMessage(`${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`, "error");
    summaryMainExportMenuOpen = true;
  }

  render();
}

function getSummaryExportProductLabel(productId = summaryReportExportProduct) {
  if (productId === "all") return "ทั้งหมด";
  return productionFruitOptions.find((item) => item.id === productId)?.label || "ทั้งหมด";
}

function setSummaryReportExportMessage(message, type = "success") {
  summaryReportExportMessage = message;
  summaryReportExportMessageType = type;
}

function buildSummaryByPilePayload(user) {
  const startDate = summaryReportExportStartDate || new Date().toISOString().slice(0, 10);
  const endDate = summaryReportExportEndDate || startDate;
  const [normalizedStart, normalizedEnd] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
  return {
    start_date: normalizedStart,
    end_date: normalizedEnd,
    product: summaryReportExportProduct,
    product_label: getSummaryExportProductLabel(summaryReportExportProduct),
    product_type: summaryReportExportProductType || "ทั้งหมด",
    printed_by: user?.fullname || "System Admin",
    employees: getEmployees(),
    production_records: getProductionRecords()
  };
}

async function exportSummaryByPile(user, format) {
  const endpoint = format === "excel" ? "summary-by-pile-excel" : "summary-by-pile-pdf";
  const payload = buildSummaryByPilePayload(user);
  setSummaryReportExportMessage(`กำลังสร้างไฟล์ ${format === "excel" ? "Excel" : "PDF"}...`);
  render();

  try {
    await downloadReport(`${REPORT_API_BASE}/reports/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSummaryReportExportMessage(`Export ${format === "excel" ? "Excel" : "PDF"} เรียบร้อยแล้ว`);
  } catch (error) {
    setSummaryReportExportMessage(
      `${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`,
      "error"
    );
  }

  render();
}

function bindSummaryExportEvents(user) {
  const form = document.querySelector("#summaryExportForm");
  form?.addEventListener("change", (event) => {
    const formData = new FormData(form);
    summaryReportExportStartDate = String(formData.get("start_date") || new Date().toISOString().slice(0, 10));
    summaryReportExportEndDate = String(formData.get("end_date") || summaryReportExportStartDate);
    summaryReportExportProduct = String(formData.get("product") || "all");
    summaryReportExportProductType = String(formData.get("product_type") || "ทั้งหมด").trim() || "ทั้งหมด";
    summaryReportExportMessage = "";
    render();
  });

  form?.addEventListener("input", (event) => {
    if (event.target?.name === "product_type") {
      summaryReportExportProductType = String(event.target.value || "").trim() || "ทั้งหมด";
    }
  });

  document.querySelector("#exportSummaryPdf")?.addEventListener("click", () => {
    exportSummaryByPile(user, "pdf");
  });

  document.querySelector("#exportSummaryExcel")?.addEventListener("click", () => {
    exportSummaryByPile(user, "excel");
  });
}

function setDeductionMessage(message, type = "success") {
  deductionMessage = message;
  deductionMessageType = type;
}

function isAttendanceBonusTab() {
  return deductionActiveTab === "bonus";
}

function isDeductionApprovalTab() {
  return deductionActiveTab === "approval";
}

function getActiveAdjustmentEmployeeKind() {
  if (isAttendanceBonusTab()) return deductionBonusEmployeeKind;
  if (isDeductionApprovalTab()) return deductionApprovalEmployeeKind;
  return normalizeDeductionKind(deductionActiveTab);
}

function getCurrentDeductionContext() {
  const selectedDate = deductionStartDate || new Date().toISOString().slice(0, 10);
  const range = { startDate: selectedDate, endDate: selectedDate };
  deductionStartDate = selectedDate;
  deductionEndDate = selectedDate;
  const employeeKind = getActiveAdjustmentEmployeeKind();
  const bonusMode = isAttendanceBonusTab();
  const employees = getDeductionEmployeeOptions(employeeKind);
  const selectedEmployeeId = employees.some((employee) => String(employee.id) === String(deductionEmployeeId))
    ? deductionEmployeeId
    : employees[0]?.id || "";
  deductionEmployeeId = selectedEmployeeId ? String(selectedEmployeeId) : "";
  const selectedEmployee = employees.find((employee) => String(employee.id) === String(selectedEmployeeId)) || null;
  const records = (bonusMode
    ? getBonusesForRange(employeeKind, range.startDate, range.endDate)
    : getDeductionRecords().filter((record) => (
      !isAttendanceBonusRecord(record) &&
      record.employee_kind === employeeKind &&
      deductionRangesOverlap(record, range.startDate, range.endDate)
    )))
    .sort((a, b) => `${a.start_date} ${a.emp_code} ${a.deduction_label}`.localeCompare(`${b.start_date} ${b.emp_code} ${b.deduction_label}`, "th", { numeric: true }));
  const editingRecord = records.find((record) => Number(record.id) === Number(editingDeductionId)) || null;
  return { range, employees, selectedEmployee, records, editingRecord, employeeKind, bonusMode };
}

function renderDeductionTypeOptions(selectedType = "advance") {
  return deductionTypeOptions
    .map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedType ? "selected" : ""}>${escapeHtml(item.label)}</option>`)
    .join("");
}

function renderDeductionEmployeeOptions(employees, selectedId) {
  if (!employees.length) return `<option value="">ยังไม่มีพนักงาน Active</option>`;
  return employees
    .map((employee) => `<option value="${employee.id}" ${String(employee.id) === String(selectedId) ? "selected" : ""}>${escapeHtml(employee.emp_code)} - ${escapeHtml(employee.fullname)}</option>`)
    .join("");
}

function renderDeductionRow(record) {
  const appliedTotal = isAttendanceBonusRecord(record) ? 0 : getAppliedTotalForDeduction(record.id);
  const remaining = Math.max(0, Number(record.amount || 0) - appliedTotal);
  return `
    <tr>
      <td><span class="deduction-date-cell">${escapeHtml(record.start_date)}</span></td>
      <td><strong>${escapeHtml(record.emp_code)}</strong></td>
      <td>${escapeHtml(record.employee_name)}</td>
      <td>${escapeHtml(record.deduction_label)}</td>
      <td><strong>${money(record.amount)}</strong>${isAttendanceBonusRecord(record) ? "" : `<small class="deduction-row-balance">คงเหลือ ${money(remaining)}</small>`}</td>
      <td>${escapeHtml(record.note || "-")}</td>
      <td>${escapeHtml(record.created_by || "-")}</td>
      <td>
        <div class="table-actions">
          ${appliedTotal > 0
            ? `<span class="badge badge-muted">เริ่มหักแล้ว</span>`
            : `<button class="btn btn-small btn-outline" type="button" data-edit-deduction="${record.id}">แก้ไข</button>
               <button class="btn btn-small btn-danger" type="button" data-delete-deduction="${record.id}">ลบ</button>`}
        </div>
      </td>
    </tr>
  `;
}

function getPendingDeductionRows(kind) {
  return getDeductionRecords()
    .filter((record) => {
      if (isAttendanceBonusRecord(record) || record.employee_kind !== normalizeDeductionKind(kind)) return false;
      if (record.status === "Cancelled") return false;
      return Number(record.amount || 0) - getAppliedTotalForDeduction(record.id) > 0.004;
    })
    .map((record) => {
      const applied = getAppliedTotalForDeduction(record.id);
      return { ...record, applied_amount: applied, remaining_amount: Math.max(0, Number(record.amount || 0) - applied) };
    })
    .sort((a, b) => `${a.emp_code} ${a.start_date} ${a.id}`.localeCompare(`${b.emp_code} ${b.start_date} ${b.id}`, "th", { numeric: true }));
}

function renderDeductionApproval(user, moduleItem) {
  const rows = getPendingDeductionRows(deductionApprovalEmployeeKind);
  const employeeCount = new Set(rows.map((row) => `${row.employee_kind}-${row.employee_id || row.emp_code}`)).size;
  const remainingTotal = rows.reduce((sum, row) => sum + row.remaining_amount, 0);
  const kindLabel = deductionApprovalEmployeeKind === "time" ? "พนักงานเหมาเวลา" : "พนักงานเหมาน้ำหนัก";
  return `
    <section class="summary-page deduction-page deduction-approval-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>เลือกรายการและกำหนดยอดที่จะหักในรอบนี้ รายการที่ยังหักไม่ครบจะกลับมารอด้วยยอดคงเหลือเดิม</p>
        </div>
        <span class="badge badge-success deduction-cloud-badge">ฐานข้อมูลกลางพร้อมใช้งาน</span>
      </div>
      <div class="module-tabs deduction-tabs">
        <button class="module-tab" type="button" data-deduction-tab="production">พนักงานเหมาน้ำหนัก</button>
        <button class="module-tab" type="button" data-deduction-tab="time">พนักงานเหมาเวลา</button>
        <button class="module-tab bonus-tab" type="button" data-deduction-tab="bonus">ลงเบี้ยขยัน</button>
        <button class="module-tab active approval-tab" type="button" data-deduction-tab="approval">อนุมัติหักเงิน</button>
      </div>
      ${deductionMessage ? `<div class="alert ${deductionMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(deductionMessage)}</div>` : ""}
      <section class="panel deduction-approval-toolbar">
        <div class="deduction-kind-switch" role="group" aria-label="ประเภทพนักงานที่อนุมัติหักเงิน">
          <span>ประเภทพนักงาน</span>
          <button class="${deductionApprovalEmployeeKind === "production" ? "active" : ""}" type="button" data-approval-employee-kind="production">พนักงานเหมาน้ำหนัก</button>
          <button class="${deductionApprovalEmployeeKind === "time" ? "active" : ""}" type="button" data-approval-employee-kind="time">พนักงานเหมาเวลา</button>
        </div>
        <label class="field deduction-approval-date">
          <span>วันที่นำยอดไปหัก</span>
          <input id="deductionApprovalDate" type="date" value="${escapeHtml(deductionStartDate)}" required />
        </label>
      </section>
      <div class="summary-metrics deduction-metrics">
        <div class="metric-card metric-blue"><span>รายการรอหัก</span><strong>${rows.length.toLocaleString("th-TH")} รายการ</strong><small>${kindLabel}</small></div>
        <div class="metric-card metric-green"><span>จำนวนพนักงาน</span><strong>${employeeCount.toLocaleString("th-TH")} คน</strong><small>ที่ยังมียอดคงเหลือ</small></div>
        <div class="metric-card metric-orange"><span>ยอดคงเหลือทั้งหมด</span><strong>${money(remainingTotal)}</strong><small>ยังไม่กระทบยอดสุทธิจนกว่าจะยืนยัน</small></div>
      </div>
      <form id="deductionApprovalForm">
        <section class="table-card deduction-approval-table-card">
          <div class="table-heading deduction-table-heading">
            <div><strong>รายการรอการหัก</strong><span>แก้ยอดรอบนี้ได้ แต่ห้ามเกินยอดคงเหลือ</span></div>
          </div>
          <div class="table-scroll">
            <table>
              <thead><tr><th class="select-cell">เลือก</th><th>วันที่เริ่มรายการ</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>รายการ</th><th>ยอดตั้งต้น</th><th>หักสะสม</th><th>ยอดคงเหลือ</th><th>หักรอบนี้</th></tr></thead>
              <tbody>
                ${rows.length ? rows.map((row) => `
                  <tr>
                    <td class="select-cell"><input type="checkbox" data-approve-deduction="${row.id}" aria-label="เลือกรายการ ${escapeHtml(row.deduction_label)} ของ ${escapeHtml(row.employee_name)}" /></td>
                    <td><span class="deduction-date-cell">${escapeHtml(row.start_date)}</span></td>
                    <td><strong>${escapeHtml(row.emp_code)}</strong></td>
                    <td>${escapeHtml(row.employee_name)}</td>
                    <td>${escapeHtml(row.deduction_label)}</td>
                    <td>${money(row.amount)}</td>
                    <td>${money(row.applied_amount)}</td>
                    <td><strong class="deduction-remaining">${money(row.remaining_amount)}</strong></td>
                    <td><input class="deduction-approval-amount" data-approval-amount="${row.id}" type="number" min="0.01" max="${row.remaining_amount}" step="0.01" value="${row.remaining_amount}" disabled /></td>
                  </tr>`).join("") : `<tr><td colspan="9" class="empty-cell">ไม่มีรายการค้างสำหรับ${kindLabel}</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
        <div class="deduction-approval-footer">
          <div><span>เลือกแล้ว</span><strong id="deductionApprovalSelectedCount">0 รายการ</strong><small id="deductionApprovalSelectedTotal">รวม ฿0</small></div>
          <button class="btn btn-primary deduction-submit-button" type="submit" ${rows.length ? "" : "disabled"}>ยืนยันหักเงินรอบนี้</button>
        </div>
      </form>
    </section>`;
}

function renderDeductionEntry(user, moduleItem) {
  if (isDeductionApprovalTab()) return renderDeductionApproval(user, moduleItem);
  const context = getCurrentDeductionContext();
  const editing = context.editingRecord;
  const formEmployeeId = editing?.employee_id || context.selectedEmployee?.id || "";
  const formStartDate = editing?.start_date || context.range.startDate;
  const totalAmount = sumDeductions(context.records);
  const employeeCount = new Set(context.records.map((record) => record.employee_id || record.emp_code)).size;
  const actionLabel = context.bonusMode ? "เบี้ยขยัน" : "รายการหัก";
  const employeeKindLabel = context.employeeKind === "time" ? "พนักงานเหมาเวลา" : "พนักงานเหมาน้ำหนัก";

  return `
    <section class="summary-page deduction-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>บันทึกรายการหักไว้รออนุมัติ หรือเพิ่มเบี้ยขยันลงฐานข้อมูลกลางสำหรับรายงานและใบเสร็จ</p>
        </div>
        <span class="badge badge-success deduction-cloud-badge">ฐานข้อมูลกลางพร้อมใช้งาน</span>
      </div>

      <div class="module-tabs deduction-tabs">
        <button class="module-tab ${deductionActiveTab === "production" ? "active" : ""}" type="button" data-deduction-tab="production">พนักงานเหมาน้ำหนัก</button>
        <button class="module-tab ${deductionActiveTab === "time" ? "active" : ""}" type="button" data-deduction-tab="time">พนักงานเหมาเวลา</button>
        <button class="module-tab ${deductionActiveTab === "bonus" ? "active bonus-tab" : ""}" type="button" data-deduction-tab="bonus">ลงเบี้ยขยัน</button>
        <button class="module-tab ${deductionActiveTab === "approval" ? "active approval-tab" : ""}" type="button" data-deduction-tab="approval">อนุมัติหักเงิน</button>
      </div>

      ${context.bonusMode ? `
        <div class="deduction-kind-switch" role="group" aria-label="ประเภทพนักงานสำหรับเบี้ยขยัน">
          <span>ประเภทพนักงาน</span>
          <button class="${context.employeeKind === "production" ? "active" : ""}" type="button" data-bonus-employee-kind="production">พนักงานเหมาน้ำหนัก</button>
          <button class="${context.employeeKind === "time" ? "active" : ""}" type="button" data-bonus-employee-kind="time">พนักงานเหมาเวลา</button>
        </div>
      ` : ""}

      ${
        deductionMessage
          ? `<div class="alert ${deductionMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(deductionMessage)}</div>`
          : ""
      }

      <section class="panel deduction-control-panel">
        <div class="deduction-control-copy">
          <strong>ดูรายการตามวันที่</strong>
          <span>เลือกวันที่ที่ต้องการตรวจสอบหรือเพิ่ม${context.bonusMode ? "เบี้ยขยัน" : "รายการหักเงิน"}</span>
        </div>
        <form class="deduction-filter-form" id="deductionFilterForm">
          <label class="field">
            <span>${context.bonusMode ? "วันที่ลงเบี้ยขยัน" : "วันที่หักเงิน"}</span>
            <input name="start_date" type="date" value="${escapeHtml(context.range.startDate)}" required />
          </label>
          <button class="btn btn-outline deduction-load-button" type="submit">แสดงรายการ</button>
        </form>
      </section>

      <div class="deduction-export-note">
        <span class="deduction-export-note-mark">฿</span>
        <div>
          <strong>${context.bonusMode ? "ระบบจะบวกเบี้ยขยันให้อัตโนมัติ" : "รายการหักจะถูกพักไว้ก่อน"}</strong>
          <span>${context.bonusMode ? `เมื่อช่วงวันที่ Export ครอบคลุมวันที่ ${escapeHtml(context.range.startDate)} ยอดนี้จะถูกบวกในการคำนวณทันที` : "ยอดจะยังไม่ถูกหักจากเงิน จนกว่าจะเลือกและยืนยันในแท็บอนุมัติหักเงิน"}</span>
        </div>
      </div>
      ${!context.bonusMode && context.employeeKind === "production" ? `
        <div class="deduction-export-note">
          <span class="deduction-export-note-mark">3%</span>
          <div>
            <strong>หัก ณ ที่จ่ายอัตโนมัติสำหรับเหมา(นนท์) และเหมาปุ้ย</strong>
            <span>ระบบคำนวณ 3% จากยอดค่าแรงก่อนหักเมื่อแสดงรายงานและ Export โดยไม่ต้องสร้างรายการหักหรือรออนุมัติซ้ำ</span>
          </div>
        </div>
      ` : ""}

      <div class="summary-metrics deduction-metrics">
        <div class="metric-card metric-blue"><span>${actionLabel}</span><strong>${context.records.length.toLocaleString("th-TH")} รายการ</strong><small>ประจำวันที่ ${escapeHtml(context.range.startDate)}</small></div>
        <div class="metric-card metric-green"><span>จำนวนพนักงาน</span><strong>${employeeCount.toLocaleString("th-TH")} คน</strong><small>${employeeKindLabel}</small></div>
        <div class="metric-card ${context.bonusMode ? "metric-green" : "metric-orange"}"><span>${context.bonusMode ? "ยอดเบี้ยขยันรวมวันนี้" : "ยอดตั้งต้นรวมวันนี้"}</span><strong>${money(totalAmount)}</strong><small>${context.bonusMode ? "เงินเพิ่มก่อนคำนวณยอดสุทธิ" : "รออนุมัติก่อนนำไปหักเงินจริง"}</small></div>
      </div>

      <section class="panel deduction-form-panel">
        <div class="section-title-row">
          <div>
            <h3>${editing ? `แก้ไข${actionLabel}` : `เพิ่ม${actionLabel}`}</h3>
            <p class="muted-text">${context.bonusMode ? "กรอกจำนวนเงินจริง ระบบจะนำยอดไปบวกในรายงานตามวันที่ที่เลือก" : "กรอกยอดตั้งต้น รายการจะอยู่ในคิวรอและเก็บวันที่นี้ไว้จนกว่าจะหักครบ"}</p>
          </div>
          ${editing ? `<button class="btn btn-outline" id="cancelDeductionEdit" type="button">ยกเลิกแก้ไข</button>` : ""}
        </div>
        <form class="summary-export-form deduction-form" id="deductionForm">
          <input type="hidden" name="id" value="${editing?.id || ""}" />
          <input type="hidden" name="employee_kind" value="${escapeHtml(context.employeeKind)}" />
          <label class="field">
            <span>พนักงาน</span>
            <select name="employee_id" required ${context.employees.length ? "" : "disabled"}>
              ${renderDeductionEmployeeOptions(context.employees, formEmployeeId)}
            </select>
          </label>
          <label class="field">
            <span>${context.bonusMode ? "วันที่ลงเบี้ยขยัน" : "วันที่หักเงิน"}</span>
            <input name="start_date" type="date" value="${escapeHtml(formStartDate)}" required />
          </label>
          ${context.bonusMode ? `
            <label class="field deduction-readonly-field">
              <span>ประเภทเงินเพิ่ม</span>
              <input value="เบี้ยขยัน" readonly />
              <input type="hidden" name="deduction_type" value="${ATTENDANCE_BONUS_TYPE}" />
            </label>
          ` : `
            <label class="field">
              <span>รายการหัก</span>
              <select name="deduction_type" required>
                ${renderDeductionTypeOptions(editing?.deduction_type || "advance")}
              </select>
            </label>
          `}
          <label class="field">
            <span>จำนวนเงิน</span>
            <input name="amount" type="number" min="0" step="1" value="${editing ? Number(editing.amount || 0) : ""}" placeholder="0" required />
          </label>
          <label class="field">
            <span>หมายเหตุ</span>
            <input name="note" value="${escapeHtml(editing?.note || "")}" placeholder="รายละเอียดเพิ่มเติมถ้ามี" />
          </label>
          <button class="btn ${context.bonusMode ? "btn-success" : "btn-primary"} deduction-submit-button" type="submit" ${context.employees.length ? "" : "disabled"}>${editing ? "บันทึกการแก้ไข" : `บันทึก${actionLabel}`}</button>
        </form>
      </section>

      <section class="table-card">
        <div class="table-heading deduction-table-heading">
          <div>
            <strong>${actionLabel}ประจำวันที่ ${escapeHtml(context.range.startDate)}</strong>
            <span>${employeeKindLabel}</span>
          </div>
          <span class="deduction-table-total ${context.bonusMode ? "bonus-total" : ""}">รวม ${money(totalAmount)}</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>รหัส</th>
                <th>ชื่อพนักงาน</th>
                <th>${context.bonusMode ? "ประเภทเงินเพิ่ม" : "รายการหัก"}</th>
                <th>${context.bonusMode ? "จำนวนเงิน" : "ยอดตั้งต้น"}</th>
                <th>หมายเหตุ</th>
                <th>ผู้บันทึก</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${context.records.length ? context.records.map(renderDeductionRow).join("") : `<tr><td colspan="8" class="empty-cell">ยังไม่มี${actionLabel}ในวันนี้</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function bindDeductionEvents(user) {
  document.querySelectorAll("[data-deduction-tab]").forEach((button) => {
    button.addEventListener("click", async () => {
      const requestedTab = button.dataset.deductionTab;
      deductionActiveTab = ["bonus", "approval"].includes(requestedTab) ? requestedTab : normalizeDeductionKind(requestedTab);
      deductionEmployeeId = "";
      editingDeductionId = null;
      const employeeKind = getActiveAdjustmentEmployeeKind();
      setDeductionMessage("กำลังโหลดข้อมูลจากฐานกลาง...");
      render();
      try {
        if (isDeductionApprovalTab()) {
          await Promise.all([hydrateDeductionsFromCloud(), hydrateDeductionApplicationsFromCloud()]);
        } else {
          await Promise.all([
            hydrateDeductionsFromCloud({ employee_kind: employeeKind, start_date: deductionStartDate, end_date: deductionEndDate }),
            hydrateDeductionApplicationsFromCloud({ employee_kind: employeeKind, start_date: deductionStartDate, end_date: deductionEndDate })
          ]);
        }
        setDeductionMessage("");
      } catch (error) {
        setDeductionMessage(`${error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ"} กรุณารันไฟล์ supabase_deduction_records_migration.sql ใน Supabase`, "error");
      }
      render();
    });
  });

  document.querySelectorAll("[data-bonus-employee-kind]").forEach((button) => {
    button.addEventListener("click", async () => {
      deductionBonusEmployeeKind = normalizeDeductionKind(button.dataset.bonusEmployeeKind);
      deductionEmployeeId = "";
      editingDeductionId = null;
      setDeductionMessage("กำลังโหลดข้อมูลจากฐานกลาง...");
      render();
      try {
        await hydrateDeductionsFromCloud({ employee_kind: deductionBonusEmployeeKind, start_date: deductionStartDate, end_date: deductionEndDate });
        setDeductionMessage("");
      } catch (error) {
        setDeductionMessage(`${error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ"} กรุณาตรวจสอบ Supabase`, "error");
      }
      render();
    });
  });

  document.querySelectorAll("[data-approval-employee-kind]").forEach((button) => {
    button.addEventListener("click", async () => {
      deductionApprovalEmployeeKind = normalizeDeductionKind(button.dataset.approvalEmployeeKind);
      setDeductionMessage("กำลังโหลดรายการค้างจากฐานกลาง...");
      render();
      try {
        await Promise.all([hydrateDeductionsFromCloud(), hydrateDeductionApplicationsFromCloud()]);
        setDeductionMessage("");
      } catch (error) {
        setDeductionMessage(`${error instanceof Error ? error.message : "โหลดรายการค้างไม่สำเร็จ"} กรุณารันไฟล์ migration ของระบบหักเงินใน Supabase`, "error");
      }
      render();
    });
  });

  document.querySelector("#deductionFilterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    deductionStartDate = String(form.get("start_date") || deductionStartDate);
    deductionEndDate = deductionStartDate;
    editingDeductionId = null;
    setDeductionMessage("กำลังโหลดรายการหักเงินจากฐานกลาง...");
    render();
    try {
      await hydrateDeductionsFromCloud({ employee_kind: getActiveAdjustmentEmployeeKind(), start_date: deductionStartDate, end_date: deductionEndDate });
      setDeductionMessage("โหลดรายการหักเงินจากฐานกลางเรียบร้อยแล้ว");
    } catch (error) {
      setDeductionMessage(`${error instanceof Error ? error.message : "โหลดรายการหักเงินไม่สำเร็จ"} กรุณาตรวจสอบ Supabase`, "error");
    }
    render();
  });

  document.querySelector("#deductionForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = Number(form.get("id") || 0);
    const bonusMode = isAttendanceBonusTab();
    const payload = {
      employee_kind: normalizeDeductionKind(form.get("employee_kind") || getActiveAdjustmentEmployeeKind()),
      employee_id: Number(form.get("employee_id") || 0),
      start_date: String(form.get("start_date") || deductionStartDate),
      end_date: String(form.get("start_date") || deductionStartDate),
      deduction_type: bonusMode ? ATTENDANCE_BONUS_TYPE : String(form.get("deduction_type") || "advance"),
      amount: Number(form.get("amount") || 0),
      note: String(form.get("note") || "")
    };
    try {
      if (id) {
        await apiUpdateDeduction(id, payload, user);
        setDeductionMessage(`แก้ไข${bonusMode ? "เบี้ยขยัน" : "รายการหักเงิน"}ในฐานกลางเรียบร้อยแล้ว`);
      } else {
        await apiCreateDeduction(payload, user);
        setDeductionMessage(`บันทึก${bonusMode ? "เบี้ยขยัน" : "รายการหักเงิน"}ลงฐานกลางเรียบร้อยแล้ว`);
      }
      deductionStartDate = payload.start_date;
      deductionEndDate = payload.end_date;
      deductionEmployeeId = String(payload.employee_id);
      editingDeductionId = null;
      await hydrateDeductionsFromCloud({ employee_kind: payload.employee_kind, start_date: deductionStartDate, end_date: deductionEndDate });
    } catch (error) {
      setDeductionMessage(`${error instanceof Error ? error.message : "บันทึกรายการหักเงินไม่สำเร็จ"} กรุณาตรวจสอบ Supabase`, "error");
    }
    render();
  });

  document.querySelector("#cancelDeductionEdit")?.addEventListener("click", () => {
    editingDeductionId = null;
    setDeductionMessage("");
    render();
  });

  document.querySelectorAll("[data-edit-deduction]").forEach((button) => {
    button.addEventListener("click", () => {
      editingDeductionId = Number(button.dataset.editDeduction);
      setDeductionMessage("");
      render();
    });
  });

  document.querySelectorAll("[data-delete-deduction]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.deleteDeduction);
      if (!window.confirm("ยืนยันลบรายการนี้จากฐานกลาง Supabase?")) return;
      try {
        await apiDeleteDeduction(id, user);
        editingDeductionId = null;
        await hydrateDeductionsFromCloud({ employee_kind: getActiveAdjustmentEmployeeKind(), start_date: deductionStartDate, end_date: deductionEndDate });
        setDeductionMessage("ลบรายการจากฐานกลางเรียบร้อยแล้ว");
      } catch (error) {
        setDeductionMessage(`${error instanceof Error ? error.message : "ลบรายการหักเงินไม่สำเร็จ"} กรุณาตรวจสอบ Supabase`, "error");
      }
      render();
    });
  });

  const updateApprovalSummary = () => {
    const checked = [...document.querySelectorAll("[data-approve-deduction]:checked")];
    const total = checked.reduce((sum, checkbox) => {
      const input = document.querySelector(`[data-approval-amount="${checkbox.dataset.approveDeduction}"]`);
      return sum + Number(input?.value || 0);
    }, 0);
    const countNode = document.querySelector("#deductionApprovalSelectedCount");
    const totalNode = document.querySelector("#deductionApprovalSelectedTotal");
    if (countNode) countNode.textContent = `${checked.length.toLocaleString("th-TH")} รายการ`;
    if (totalNode) totalNode.textContent = `รวม ${money(total)}`;
  };

  document.querySelectorAll("[data-approve-deduction]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const input = document.querySelector(`[data-approval-amount="${checkbox.dataset.approveDeduction}"]`);
      if (input) input.disabled = !checkbox.checked;
      updateApprovalSummary();
    });
  });
  document.querySelectorAll("[data-approval-amount]").forEach((input) => input.addEventListener("input", updateApprovalSummary));

  document.querySelector("#deductionApprovalForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const appliedDate = String(document.querySelector("#deductionApprovalDate")?.value || "");
    const items = [...document.querySelectorAll("[data-approve-deduction]:checked")].map((checkbox) => {
      const deductionId = Number(checkbox.dataset.approveDeduction);
      const input = document.querySelector(`[data-approval-amount="${deductionId}"]`);
      return { deduction_id: deductionId, amount: Number(input?.value || 0) };
    });
    if (!appliedDate) {
      setDeductionMessage("กรุณาเลือกวันที่นำยอดไปหัก", "error");
      render();
      return;
    }
    if (!items.length) {
      setDeductionMessage("กรุณาเลือกรายการที่ต้องการหักอย่างน้อย 1 รายการ", "error");
      render();
      return;
    }
    const pendingById = new Map(getPendingDeductionRows(deductionApprovalEmployeeKind).map((row) => [Number(row.id), row]));
    const invalid = items.find((item) => item.amount <= 0 || item.amount > Number(pendingById.get(item.deduction_id)?.remaining_amount || 0));
    if (invalid) {
      setDeductionMessage("ยอดหักรอบนี้ต้องมากกว่า 0 และไม่เกินยอดคงเหลือ", "error");
      render();
      return;
    }
    try {
      setDeductionMessage("กำลังยืนยันยอดหักกับฐานข้อมูลกลาง...");
      render();
      await applyCloudDeductionBatch(appliedDate, items, user);
      deductionStartDate = appliedDate;
      deductionEndDate = appliedDate;
      await Promise.all([hydrateDeductionsFromCloud(), hydrateDeductionApplicationsFromCloud()]);
      addAuditLog(user, "APPLY_DEDUCTION_BATCH", `Applied ${items.length} deductions on ${appliedDate}`);
      setDeductionMessage(`ยืนยันหักเงิน ${items.length.toLocaleString("th-TH")} รายการเรียบร้อยแล้ว`);
    } catch (error) {
      setDeductionMessage(`${error instanceof Error ? error.message : "ยืนยันยอดหักไม่สำเร็จ"} กรุณาตรวจสอบยอดคงเหลือและ Supabase`, "error");
    }
    render();
  });
}

function renderSimpleModule(moduleItem) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge badge-warning">Prototype</span>
      </div>
      <div class="empty-state">This module is reserved for the next implementation step.</div>
    </section>
  `;
}

function renderSettingsBackBar() {
  return `
    <section class="settings-back-bar">
      <button class="btn btn-outline" type="button" data-route="settings">← กลับหน้าตั้งค่า</button>
    </section>
  `;
}

function renderFullSettingsModule(user) {
  const employees = getEmployees();
  const activeEmployees = employees.filter((employee) => employee.status === "Active").length;
  const rates = getWageRates();
  const accounts = getAccountUsers();
  const logs = getAuditLogs();
  const canViewAuditLog = canOpen(user, "audit-log");
  const settingsTiles = [
    ["employees", "จัดการพนักงาน", "เลือกจัดการพนักงานเหมาน้ำหนักหรือพนักงานตามเวลา"],
    ["wage-rates", "ตั้งค่าอัตราค่าจ้าง", "เพิ่มอัตราใหม่และดูประวัติค่าน้ำ/ค่าดอกย้อนหลัง"],
    ["account-management", "บัญชีเข้าใช้งาน", "Register และแก้ไข ID สำหรับเข้าเว็บ"],
    ["audit-log", "Audit Log", "ดูประวัติระบบ หลังกรอกรหัส 4 หลัก"],
    ["backup", "สำรองข้อมูล", "Export และ Import ฐานข้อมูล Supabase จริง"]
  ].filter(([route]) => canOpen(user, route));

  return `
    <section class="panel settings-home-panel">
      <div class="panel-head">
        <div>
          <h2>ตั้งค่า</h2>
          <p>ศูนย์จัดการข้อมูลหลักสำหรับแอดมิน: พนักงาน บัญชี ค่าจ้าง และ Backup ฐานข้อมูล${canViewAuditLog ? " รวมถึง Audit Log" : ""}</p>
        </div>
        <span class="badge badge-success">Admin</span>
      </div>
      <div class="metrics-grid metrics-spaced">
        <div class="metric-card"><span>พนักงานใช้งาน</span><strong>${activeEmployees.toLocaleString("th-TH")}</strong><small>จาก ${employees.length.toLocaleString("th-TH")} คน</small></div>
        <div class="metric-card"><span>อัตราค่าจ้าง</span><strong>${rates.length.toLocaleString("th-TH")}</strong><small>รายการประวัติ</small></div>
        <div class="metric-card"><span>บัญชีระบบ</span><strong>${accounts.length.toLocaleString("th-TH")}</strong><small>รวมบัญชีแอดมิน</small></div>
        ${canViewAuditLog ? `<div class="metric-card"><span>Audit Log</span><strong>${logs.length.toLocaleString("th-TH")}</strong><small>รายการล่าสุด</small></div>` : ""}
      </div>
    </section>

    <section class="panel">
      <div class="section-title-row">
        <h3>เมนูตั้งค่า</h3>
        <p class="muted-text">เลือกงานที่ต้องการจัดการ</p>
      </div>
      <div class="settings-grid settings-grid-wide">
        ${
          settingsTiles.length
            ? settingsTiles
                .map(
                  ([route, title, description]) =>
                    `<button class="settings-tile" data-route="${route}" type="button"><strong>${title}</strong><span>${description}</span></button>`
                )
                .join("")
            : `<div class="empty-state">ระดับ ${escapeHtml(getUserLevel(user))} ยังไม่มีเมนูตั้งค่าที่เปิดให้ใช้งาน</div>`
        }
      </div>
    </section>
  `;
}
function renderAccountManagement(user, moduleItem) {
  const accounts = apiGetAccountUsers(accountSearch);
  const editingAccount = editingAccountUserId
    ? getAccountUsers().find((accountUser) => accountUser.id === editingAccountUserId)
    : null;

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge badge-success">Admin</span>
      </div>
      <div class="toolbar">
        <form class="search-form" id="accountSearchForm">
          <label class="search-box">
            <span>Search</span>
            <input id="accountSearch" name="accountSearch" placeholder="ชื่อ, username, เบอร์, role, level" value="${escapeHtml(accountSearch)}" />
          </label>
          <button class="btn btn-outline" type="submit">Search</button>
          <button class="btn btn-outline" id="clearAccountSearch" type="button">Clear</button>
        </form>
      </div>
    </section>
    ${
      accountMessage
        ? `<div class="alert ${accountMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(accountMessage)}</div>`
        : ""
    }
    ${renderAccountForm(editingAccount)}
    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fullname</th>
              <th>Username</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Level</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              accounts.length
                ? accounts.map((accountUser) => renderAccountRow(accountUser, user)).join("")
                : `<tr><td colspan="9" class="empty-cell">No accounts found.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAccountForm(accountUser) {
  const isEditing = Boolean(accountUser);
  return `
    <section class="panel">
      <div class="section-title-row">
        <h3>${isEditing ? "Edit account" : "Register account"}</h3>
        ${isEditing ? `<button class="btn btn-outline" id="cancelAccountEdit" type="button">Cancel edit</button>` : ""}
      </div>
      <form class="account-form" id="accountForm">
        <input type="hidden" name="id" value="${isEditing ? accountUser.id : ""}" />
        <label class="field">
          <span>Fullname</span>
          <input name="fullname" value="${isEditing ? escapeHtml(accountUser.fullname) : ""}" required />
        </label>
        <label class="field">
          <span>Phone</span>
          <input name="phone" value="${isEditing ? escapeHtml(accountUser.phone) : ""}" required />
        </label>
        <label class="field">
          <span>Username</span>
          <input name="username" value="${isEditing ? escapeHtml(accountUser.username) : ""}" required />
        </label>
        <label class="field">
          <span>Password ${isEditing ? "(เว้นว่างถ้าไม่เปลี่ยน)" : ""}</span>
          <input name="password" type="password" autocomplete="new-password" ${isEditing ? "" : "required"} />
        </label>
        <label class="field">
          <span>Confirm Password</span>
          <input name="confirm_password" type="password" autocomplete="new-password" ${isEditing ? "" : "required"} />
        </label>
        <label class="field">
          <span>Role</span>
          <select name="role_key" required>
            ${accountRoleOptions
              .map(
                (option) =>
                  `<option value="${option.key}" ${accountUser?.role_key === option.key ? "selected" : ""}>${escapeHtml(option.label)}</option>`
              )
              .join("")}
          </select>
        </label>
        <label class="field">
          <span>Level</span>
          <select name="level" required>
            ${accountLevelOptions
              .map((level) => `<option value="${level}" ${accountUser?.level === level ? "selected" : ""}>${level}</option>`)
              .join("")}
          </select>
        </label>
        <label class="field">
          <span>Status</span>
          <select name="isActive" required>
            <option value="true" ${accountUser?.isActive !== false ? "selected" : ""}>Active</option>
            <option value="false" ${accountUser?.isActive === false ? "selected" : ""}>Inactive</option>
          </select>
        </label>
        <button class="btn btn-primary form-submit" type="submit">${isEditing ? "Save changes" : "Register"}</button>
      </form>
    </section>
  `;
}

function renderAccountRow(accountUser, currentUser) {
  const statusClass = accountUser.isActive ? "badge-success" : "badge-danger";
  const locked = isProtectedSystemAccount(accountUser);
  return `
    <tr>
      <td>${accountUser.id}</td>
      <td>${escapeHtml(accountUser.fullname)}</td>
      <td><strong>${escapeHtml(accountUser.username)}</strong></td>
      <td>${escapeHtml(accountUser.phone || "-")}</td>
      <td>${escapeHtml(accountUser.role_label)}</td>
      <td>${escapeHtml(accountUser.level)}</td>
      <td><span class="badge ${statusClass}">${accountUser.isActive ? "Active" : "Inactive"}</span></td>
      <td>${formatDate(accountUser.updated_at)}</td>
      <td>
        <div class="row-actions">
          ${
            locked
              ? `<span class="muted-text">System</span>`
              : `<button class="btn btn-small btn-outline" data-edit-account="${accountUser.id}" type="button">Edit</button>`
          }
          ${
            locked || accountUser.id === currentUser.id
              ? ""
              : `<button class="btn btn-small btn-danger" data-delete-account="${accountUser.id}" type="button">Delete</button>`
          }
        </div>
      </td>
    </tr>
  `;
}

function setAccountMessage(message, type = "success") {
  accountMessage = message;
  accountMessageType = type;
}

function bindAccountManagementEvents(user) {
  document.querySelector("#accountSearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    accountSearch = String(form.get("accountSearch") || "");
    render();
  });

  document.querySelector("#clearAccountSearch")?.addEventListener("click", () => {
    accountSearch = "";
    render();
  });

  document.querySelector("#cancelAccountEdit")?.addEventListener("click", () => {
    editingAccountUserId = null;
    accountMode = "";
    render();
  });

  document.querySelector("#accountForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = Number(form.get("id"));
    const payload = {
      fullname: String(form.get("fullname") || ""),
      phone: String(form.get("phone") || ""),
      username: String(form.get("username") || ""),
      password: String(form.get("password") || ""),
      confirm_password: String(form.get("confirm_password") || ""),
      role_key: String(form.get("role_key") || ""),
      level: String(form.get("level") || ""),
      isActive: String(form.get("isActive")) === "true"
    };

    try {
      if (id) {
        await apiUpdateAccountUser(id, payload, user);
        setAccountMessage("Account updated.");
      } else {
        await apiCreateAccountUser(payload, user);
        setAccountMessage("Account registered.");
      }
      editingAccountUserId = null;
      accountMode = "";
      render();
    } catch (error) {
      setAccountMessage(error instanceof Error ? error.message : "Save failed.", "error");
      render();
    }
  });

  document.querySelectorAll("[data-edit-account]").forEach((button) => {
    button.addEventListener("click", () => {
      editingAccountUserId = Number(button.dataset.editAccount);
      accountMode = "edit";
      accountMessage = "";
      render();
    });
  });

  document.querySelectorAll("[data-delete-account]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.deleteAccount);
      const accountUser = getAccountUsers().find((item) => item.id === id);
      if (!window.confirm(`Delete account ${accountUser?.username || id}?`)) return;

      try {
        await apiDeleteAccountUser(id, user);
        if (editingAccountUserId === id) editingAccountUserId = null;
        setAccountMessage("Account deleted.");
        render();
      } catch (error) {
        setAccountMessage(error instanceof Error ? error.message : "Delete failed.", "error");
        render();
      }
    });
  });
}

function getAuditLogCategory(action) {
  const normalized = String(action || "").toUpperCase();
  if (/DELETE|REMOVE/.test(normalized)) return "delete";
  if (/EXPORT|BACKUP|IMPORT/.test(normalized)) return "export";
  if (/LOGIN|LOGOUT|AUTH|SIGN_IN|START_SESSION/.test(normalized)) return "access";
  if (/UPDATE|EDIT|APPLY|APPROVE|REJECT|CLOSE|LOCK/.test(normalized)) return "update";
  if (/CREATE|REGISTER|ADD/.test(normalized)) return "create";
  return "system";
}

function getAuditLogActionLabel(action) {
  const labels = {
    CREATE_ATTENDANCE_BONUS: "เพิ่มเบี้ยขยัน",
    CREATE_DEDUCTION: "เพิ่มรายการหักเงิน",
    UPDATE_DEDUCTION: "แก้ไขรายการหักเงิน",
    DELETE_DEDUCTION: "ลบรายการหักเงิน",
    APPLY_DEDUCTION_BATCH: "นำรายการหักเงินไปใช้",
    REGISTER_ACCOUNT: "สร้างบัญชีเข้าใช้งาน",
    UPDATE_ACCOUNT: "แก้ไขบัญชีเข้าใช้งาน",
    DELETE_ACCOUNT: "ลบบัญชีเข้าใช้งาน",
    START_SESSION: "เริ่มกองงาน",
    UPDATE_TIME_RECORD: "แก้ไขเวลาทำงาน",
    DELETE_TIME_RECORD: "ลบเวลาทำงาน",
    EXPORT_DATABASE_BACKUP: "ส่งออกข้อมูลสำรอง",
    IMPORT_DATABASE_BACKUP: "นำเข้าข้อมูลสำรอง",
    EXPORT_PILE_SUMMARY: "ส่งออกสรุปกอง"
  };
  const normalized = String(action || "").toUpperCase();
  return labels[normalized] || normalized.replaceAll("_", " ") || "ไม่ระบุเหตุการณ์";
}

function getAuditLogCategoryLabel(category) {
  return {
    create: "เพิ่มข้อมูล",
    update: "แก้ไขข้อมูล",
    delete: "ลบข้อมูล",
    access: "การเข้าใช้งาน",
    export: "นำเข้า / ส่งออก",
    system: "ระบบ"
  }[category] || "ระบบ";
}

function formatAuditLogDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "-" };
  return {
    date: date.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  };
}

function renderAuditLog(moduleItem) {
  if (!auditLogUnlocked) {
    return renderAuditLogPasswordGate(moduleItem);
  }

  const logs = getAuditLogs().slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const today = new Date().toDateString();
  const todayCount = logs.filter((log) => new Date(log.created_at).toDateString() === today).length;
  const uniqueUsers = new Set(logs.map((log) => log.username || log.user_fullname || log.created_by).filter(Boolean)).size;
  const searchTerm = auditLogSearch.trim().toLocaleLowerCase("th-TH");
  const filteredLogs = logs.filter((log) => {
    const category = getAuditLogCategory(log.action);
    const matchesCategory = auditLogCategory === "all" || category === auditLogCategory;
    const searchable = [log.user_fullname, log.created_by, log.username, log.role, log.action, getAuditLogActionLabel(log.action), log.detail]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("th-TH");
    return matchesCategory && (!searchTerm || searchable.includes(searchTerm));
  });
  return `
    <section class="panel audit-log-header">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>ตรวจสอบประวัติการทำรายการสำคัญในระบบ เรียงจากรายการล่าสุด</p>
        </div>
        <span class="badge audit-level-badge">เฉพาะ C6-C7</span>
      </div>
      <div class="audit-summary-grid">
        <div class="audit-summary-item"><span>รายการทั้งหมด</span><strong>${logs.length.toLocaleString("th-TH")}</strong><small>รายการที่บันทึกไว้</small></div>
        <div class="audit-summary-item"><span>กิจกรรมวันนี้</span><strong>${todayCount.toLocaleString("th-TH")}</strong><small>ตามเวลาของเครื่องนี้</small></div>
        <div class="audit-summary-item"><span>ผู้ใช้งานที่พบ</span><strong>${uniqueUsers.toLocaleString("th-TH")}</strong><small>บัญชีในประวัติทั้งหมด</small></div>
      </div>
    </section>
    <section class="panel audit-filter-panel">
      <form class="audit-filter-form" id="auditLogFilterForm">
        <label class="field audit-search-field">
          <span>ค้นหาประวัติ</span>
          <input name="auditSearch" type="search" value="${escapeHtml(auditLogSearch)}" placeholder="ค้นหาชื่อ ผู้ใช้ เหตุการณ์ หรือรายละเอียด" autocomplete="off" />
        </label>
        <label class="field">
          <span>ประเภทกิจกรรม</span>
          <select name="auditCategory">
            <option value="all" ${auditLogCategory === "all" ? "selected" : ""}>ทุกประเภท</option>
            <option value="create" ${auditLogCategory === "create" ? "selected" : ""}>เพิ่มข้อมูล</option>
            <option value="update" ${auditLogCategory === "update" ? "selected" : ""}>แก้ไขข้อมูล</option>
            <option value="delete" ${auditLogCategory === "delete" ? "selected" : ""}>ลบข้อมูล</option>
            <option value="access" ${auditLogCategory === "access" ? "selected" : ""}>การเข้าใช้งาน</option>
            <option value="export" ${auditLogCategory === "export" ? "selected" : ""}>นำเข้า / ส่งออก</option>
            <option value="system" ${auditLogCategory === "system" ? "selected" : ""}>ระบบ</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit">ค้นหา</button>
        <button class="btn btn-outline" id="auditLogClearFilter" type="button">ล้างตัวกรอง</button>
      </form>
      <div class="audit-filter-result">แสดง <strong>${filteredLogs.length.toLocaleString("th-TH")}</strong> จาก ${logs.length.toLocaleString("th-TH")} รายการ</div>
    </section>
    <section class="table-card audit-log-card">
      <div class="table-scroll audit-table-scroll">
        <table class="audit-log-table">
          <thead>
            <tr>
              <th>วันและเวลา</th>
              <th>ผู้ดำเนินการ</th>
              <th>ประเภท</th>
              <th>เหตุการณ์</th>
              <th>รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            ${
              filteredLogs.length
                ? filteredLogs
                    .map(
                      (log) => {
                        const category = getAuditLogCategory(log.action);
                        const dateTime = formatAuditLogDateTime(log.created_at);
                        const fullname = log.user_fullname || log.created_by || log.username || "ไม่ระบุผู้ใช้";
                        const initial = String(fullname).trim().charAt(0).toLocaleUpperCase("th-TH") || "-";
                        return `
                        <tr>
                          <td class="audit-date-cell" data-label="วันและเวลา"><strong>${escapeHtml(dateTime.date)}</strong><span>${escapeHtml(dateTime.time)} น.</span></td>
                          <td data-label="ผู้ดำเนินการ"><div class="audit-user"><span class="audit-user-initial">${escapeHtml(initial)}</span><div><strong>${escapeHtml(fullname)}</strong><span>${escapeHtml(log.username || log.role || "ไม่ระบุตำแหน่ง")}</span></div></div></td>
                          <td data-label="ประเภท"><span class="audit-category audit-category-${category}">${escapeHtml(getAuditLogCategoryLabel(category))}</span></td>
                          <td class="audit-action-cell" data-label="เหตุการณ์"><strong>${escapeHtml(getAuditLogActionLabel(log.action))}</strong><span>${escapeHtml(log.action || "-")}</span></td>
                          <td class="audit-detail-cell" data-label="รายละเอียด">${escapeHtml(log.detail || "ไม่มีรายละเอียดเพิ่มเติม")}</td>
                        </tr>
                      `;
                      }
                    )
                    .join("")
                : `<tr><td colspan="5" class="empty-cell audit-empty-cell"><strong>ไม่พบประวัติที่ตรงกับตัวกรอง</strong><span>ลองเปลี่ยนคำค้นหาหรือเลือกประเภทกิจกรรมอื่น</span></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAuditLogPasswordGate(moduleItem) {
  const currentUser = getSession()?.user;
  const fullname = currentUser?.fullname || currentUser?.username || "ผู้ดูแลระบบ";
  const initial = String(fullname).trim().charAt(0).toLocaleUpperCase("th-TH") || "-";
  return `
    <section class="audit-gate-shell">
      <div class="audit-gate-security">
        <div class="audit-gate-classification"><span></span> SECURITY CHECKPOINT</div>
        <div class="audit-gate-lock" aria-hidden="true"></div>
        <div class="audit-gate-security-copy">
          <p>ข้อมูลควบคุมภายใน</p>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <span>พื้นที่ตรวจสอบประวัติการดำเนินงานและการเปลี่ยนแปลงข้อมูลสำคัญของระบบ</span>
        </div>
        <div class="audit-gate-clearance">
          <div><span>ระดับสิทธิ์</span><strong>C6-C7</strong></div>
          <div><span>การป้องกัน</span><strong>PIN 4 หลัก</strong></div>
        </div>
      </div>
      <div class="audit-gate-auth">
        <div class="audit-gate-auth-status"><span></span> PROTECTED AREA</div>
        <h3>ยืนยันก่อนเปิด Audit Log</h3>
        <p class="audit-gate-intro">กรอกรหัสรักษาความปลอดภัยเพื่อเปิดดูประวัติการใช้งาน</p>
        ${auditLogMessage ? `<div class="audit-gate-error" role="alert"><strong>ไม่สามารถยืนยันได้</strong><span>${escapeHtml(auditLogMessage)} กรุณาตรวจสอบแล้วลองอีกครั้ง</span></div>` : ""}
        <form class="audit-gate-form" id="auditLogPasswordForm">
          <label for="auditLogPassword">รหัสรักษาความปลอดภัย</label>
          <div class="audit-pin-input-wrap">
            <span class="audit-pin-icon" aria-hidden="true">PIN</span>
            <input
              id="auditLogPassword"
              name="auditLogPassword"
              type="password"
              inputmode="numeric"
              pattern="[0-9]{4}"
              maxlength="4"
              autocomplete="off"
              aria-describedby="auditPinHelp"
              placeholder="กรอกรหัส 4 หลัก"
              autofocus
              required
            />
          </div>
          <small id="auditPinHelp">รองรับตัวเลขเท่านั้น และจำกัดไม่เกิน 4 หลัก</small>
          <button class="btn audit-gate-submit" type="submit">ยืนยันและเปิด Audit Log</button>
        </form>
        <div class="audit-gate-user">
          <span class="audit-gate-user-initial">${escapeHtml(initial)}</span>
          <div><span>กำลังยืนยันสิทธิ์ในชื่อ</span><strong>${escapeHtml(fullname)}</strong></div>
          <span class="audit-gate-user-level">${escapeHtml(getUserLevel(currentUser))}</span>
        </div>
      </div>
    </section>
  `;
}

function bindAuditLogPasswordEvents() {
  const passwordInput = document.querySelector("#auditLogPassword");
  passwordInput?.addEventListener("input", () => {
    passwordInput.value = passwordInput.value.replace(/\D/g, "").slice(0, 4);
  });

  document.querySelector("#auditLogPasswordForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("auditLogPassword") || "");

    if (password === AUDIT_LOG_PASSWORD) {
      auditLogUnlocked = true;
      auditLogMessage = "";
      render();
      return;
    }

    auditLogUnlocked = false;
    auditLogMessage = "รหัสไม่ถูกต้อง";
    render();
  });

  document.querySelector("#auditLogFilterForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    auditLogSearch = String(form.get("auditSearch") || "");
    auditLogCategory = String(form.get("auditCategory") || "all");
    render();
  });

  document.querySelector("#auditLogFilterForm select[name='auditCategory']")?.addEventListener("change", (event) => {
    auditLogCategory = event.currentTarget.value || "all";
    const searchInput = document.querySelector("#auditLogFilterForm input[name='auditSearch']");
    auditLogSearch = searchInput?.value || "";
    render();
  });

  document.querySelector("#auditLogClearFilter")?.addEventListener("click", () => {
    auditLogSearch = "";
    auditLogCategory = "all";
    render();
  });
}

function buildBackupData() {
  return {
    exported_at: new Date().toISOString(),
    app: "Pismai Factory Wage",
    version: 1,
    data: {
      employees: getEmployees(),
      time_employees: getTimeEmployees(),
      wage_rates: getWageRates(),
      production_records: getProductionRecords(),
      production_sessions: getProductionSessions(),
      time_records: getTimeRecords(),
      deduction_records: getDeductionRecords(),
      deduction_applications: deductionApplications,
      audit_logs: getAuditLogs(),
      account_users: getAccountUsers()
    }
  };
}

async function exportDatabaseBackup(accessCode) {
  return cloudApiRequest("/api/backup", {
    headers: { "X-Backup-Code": accessCode }
  });
}

async function restoreDatabaseBackup(accessCode, backupPayload) {
  return cloudApiRequest("/api/backup/restore", {
    method: "POST",
    headers: { "X-Backup-Code": accessCode },
    body: JSON.stringify(backupPayload)
  });
}

function setBackupMessage(message, type = "success") {
  backupMessage = message;
  backupMessageType = type;
}

function renderBackupModule(moduleItem) {
  const backupData = buildBackupData();
  const counts = backupData.data;
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>สำรองและกู้คืนข้อมูลจากฐานกลาง Supabase จริง ใช้สำหรับย้ายเครื่อง ตรวจสอบย้อนหลัง และลดความเสี่ยงข้อมูลหาย</p>
        </div>
        <span class="badge badge-success">Supabase</span>
      </div>
      <div class="metrics-grid metrics-spaced">
        <div class="metric-card"><span>Local Employees</span><strong>${counts.employees.length.toLocaleString("th-TH")}</strong><small>พนักงานเหมาน้ำหนัก</small></div>
        <div class="metric-card"><span>Time Employees</span><strong>${counts.time_employees.length.toLocaleString("th-TH")}</strong><small>พนักงานตามเวลา</small></div>
        <div class="metric-card"><span>Local Records</span><strong>${counts.production_records.length.toLocaleString("th-TH")}</strong><small>ใช้เทียบกับฐานกลาง</small></div>
        <div class="metric-card"><span>Local Rates</span><strong>${counts.wage_rates.length.toLocaleString("th-TH")}</strong><small>รายการในเครื่อง</small></div>
        <div class="metric-card"><span>Local Accounts</span><strong>${counts.account_users.length.toLocaleString("th-TH")}</strong><small>บัญชีที่ cache ไว้</small></div>
      </div>
    </section>
    ${
      backupMessage
        ? `<div class="alert ${backupMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(backupMessage)}</div>`
        : ""
    }
    <section class="panel">
      <div class="section-title-row">
        <div>
          <h3>Database Backup / Restore</h3>
          <p class="muted-text">Export จะดึงข้อมูลจาก Supabase โดยตรง ส่วน Import จะเขียนกลับเข้าฐานกลางตามไฟล์ backup</p>
        </div>
      </div>
      <div class="settings-security-form settings-backup-form">
        <label class="field">
          <span>รหัสสำรองข้อมูล 4 หลัก</span>
          <input id="backupAccessCode" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="กรอกรหัส" />
        </label>
        <div class="panel-actions">
          <button class="btn btn-primary" id="exportBackup" type="button">Export Database</button>
          <label class="btn btn-outline" for="importBackupFile">Import Database</label>
        </div>
        <input id="importBackupFile" type="file" accept="application/json,.json" hidden />
      </div>
    </section>
  `;
}

function bindBackupEvents(user) {
  const codeInput = document.querySelector("#backupAccessCode");
  codeInput?.addEventListener("input", () => {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 4);
  });

  document.querySelector("#exportBackup")?.addEventListener("click", async () => {
    const accessCode = String(codeInput?.value || "");
    if (accessCode.length !== 4) {
      setBackupMessage("กรุณากรอกรหัสสำรองข้อมูล 4 หลัก", "error");
      render();
      return;
    }

    try {
      const backup = await exportDatabaseBackup(accessCode);
      const content = JSON.stringify(backup, null, 2);
      const today = new Date().toISOString().slice(0, 10);
      downloadTextFile(`pismai-database-backup-${today}.json`, content, "application/json;charset=utf-8");
      addAuditLog(user, "EXPORT_DATABASE_BACKUP", "Exported Supabase database backup");
      setBackupMessage("Export ฐานข้อมูลสำเร็จ");
      render();
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "Export database failed.", "error");
      render();
    }
  });

  document.querySelector("#importBackupFile")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const accessCode = String(codeInput?.value || "");
    if (accessCode.length !== 4) {
      setBackupMessage("กรุณากรอกรหัสสำรองข้อมูล 4 หลักก่อน Import", "error");
      render();
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const data = parsed.data || parsed;
        if (!data || typeof data !== "object") throw new Error("Invalid backup file.");
        const knownKeys = ["account_users", "employees", "time_employees", "wage_rates", "production_records", "production_sessions", "time_records", "deduction_records", "deduction_applications", "audit_logs"];
        const hasKnownData = knownKeys.some((key) => Array.isArray(data[key]));
        if (!hasKnownData) throw new Error("Backup file does not contain supported data.");
        const confirmed = window.confirm(
          "Import จะเขียนข้อมูลในไฟล์กลับเข้าฐานกลาง Supabase จริง หาก id ซ้ำจะอัปเดตข้อมูลเดิม ต้องการดำเนินการต่อหรือไม่?"
        );
        if (!confirmed) {
          setBackupMessage("Import cancelled.", "error");
          render();
          return;
        }

        await restoreDatabaseBackup(accessCode, { data });
        addAuditLog(user, "IMPORT_DATABASE_BACKUP", `Imported Supabase backup ${file.name}`);
        setBackupMessage("Import ฐานข้อมูลสำเร็จ");
        render();
      } catch (error) {
        setBackupMessage(error instanceof Error ? error.message : "Import database failed.", "error");
        render();
      }
    });
    reader.readAsText(file);
  });
}

function renderPileManagement(moduleItem) {
  const records = getProductionRecords();
  const pileSummaries = getPileSummaries(records);
  const pileMap = new Map(pileSummaries.map((item) => [Number(item.pile), item]));
  const activePileCount = pileSummaries.filter((item) => item.count > 0).length;
  const totalRecords = pileSummaries.reduce((sum, item) => sum + item.count, 0);
  const totalWeight = pileSummaries.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = pileSummaries.reduce((sum, item) => sum + item.amount, 0);
  const rows = [1, 2, 3, 4, 5].map((pileNo) => {
    const item = pileMap.get(pileNo) || { water: 0, flower: 0, total: 0, amount: 0, count: 0 };
    const statusClass = item.count > 0 ? "badge-success" : "badge-warning";
    const statusText = item.count > 0 ? "Active" : "No records";
    return `
      <tr>
        <td><strong>กอง ${pileNo}</strong></td>
        <td>${item.count.toLocaleString("th-TH")}</td>
        <td>${numberText(item.water)}</td>
        <td>${numberText(item.flower)}</td>
        <td>${numberText(item.total)}</td>
        <td>${currency(item.amount)}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  });

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>ตรวจสอบกองงาน 1-5 จากรายการผลิตจริง โดยหน้านี้ไม่แก้ข้อมูลผลผลิต</p>
        </div>
        <span class="badge badge-success">${activePileCount}/5 Active</span>
      </div>
      <div class="metrics-grid metrics-spaced">
        <div class="metric-card"><span>กองที่มีข้อมูล</span><strong>${activePileCount.toLocaleString("th-TH")}</strong><small>จากทั้งหมด 5 กอง</small></div>
        <div class="metric-card"><span>รายการผลิต</span><strong>${totalRecords.toLocaleString("th-TH")}</strong><small>จากข้อมูลในเครื่อง</small></div>
        <div class="metric-card"><span>น้ำหนักรวม</span><strong>${numberText(totalWeight)}</strong><small>กิโลกรัม</small></div>
        <div class="metric-card"><span>ยอดเงินรวม</span><strong>${currency(totalAmount)}</strong><small>ตามอัตราค่าจ้าง</small></div>
      </div>
    </section>
    ${
      pileManagementMessage
        ? `<div class="alert ${pileManagementMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(pileManagementMessage)}</div>`
        : ""
    }
    <section class="panel">
      <div class="section-title-row">
        <h3>เครื่องมือกองงาน</h3>
        <p class="muted-text">ใช้สำหรับตรวจสอบและส่งออกข้อมูลสรุปกอง</p>
      </div>
      <div class="panel-actions">
        <button class="btn btn-primary" id="exportPileSummary" type="button">Export CSV</button>
        <button class="btn btn-outline" id="clearPileMessage" type="button">Clear message</button>
      </div>
    </section>
    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>กอง</th>
              <th>จำนวนรายการ</th>
              <th>น้ำ</th>
              <th>ดอก</th>
              <th>รวม กก.</th>
              <th>ยอดเงิน</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function bindPileManagementEvents(user) {
  document.querySelector("#exportPileSummary")?.addEventListener("click", () => {
    const summaries = getPileSummaries(getProductionRecords());
    const summaryMap = new Map(summaries.map((item) => [Number(item.pile), item]));
    const rows = [["pile", "records", "water", "flower", "total", "amount", "status"]];
    [1, 2, 3, 4, 5].forEach((pileNo) => {
      const item = summaryMap.get(pileNo) || { water: 0, flower: 0, total: 0, amount: 0, count: 0 };
      rows.push([
        `Pile ${pileNo}`,
        item.count,
        item.water,
        item.flower,
        item.total,
        item.amount,
        item.count > 0 ? "Active" : "No records"
      ]);
    });
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadTextFile(`pile-summary-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    pileManagementMessage = "ส่งออกสรุปกองเป็น CSV แล้ว";
    pileManagementMessageType = "success";
    addAuditLog(user, "EXPORT_PILE_SUMMARY", "Exported pile summary CSV");
    render();
  });

  document.querySelector("#clearPileMessage")?.addEventListener("click", () => {
    pileManagementMessage = "";
    pileManagementMessageType = "success";
    render();
  });
}
function renderProductionManagement(user, moduleItem) {
  const selectedFruit = productionFruitOptions.find((fruit) => fruit.id === selectedProductionFruit);

  if (!selectedFruit) {
    return renderProductionFruitMenu();
  }

  if (!productionFruitFieldLabels[selectedFruit.id]) {
    return renderProductionFruitPlaceholder(selectedFruit);
  }

  const labels = getProductionFieldLabels(selectedFruit.id);
  const visibleViews = [
    ["fast-entry", "กรอกเร็ว"],
    ["batch-entry", "กรอกแบบชุด"],
    ["summary", "สรุปวันนี้"]
  ];
  const currentView = visibleViews.some(([id]) => id === productionView)
    ? productionView
    : "fast-entry";

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(labels.description)}</p>
        </div>
        <div class="panel-actions">
          <button class="btn btn-outline report-primary-button" data-production-fruit-menu type="button">เปลี่ยนผลไม้</button>
          <span class="badge badge-success">พร้อมบันทึก</span>
        </div>
      </div>
      <div class="module-tabs">
        ${visibleViews
          .map(
            ([id, label]) =>
              `<button class="module-tab ${currentView === id ? "active" : ""}" data-production-view="${id}" type="button">${label}</button>`
          )
          .join("")}
      </div>
    </section>
    ${
      productionMessage
        ? `<div class="alert ${productionMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(productionMessage)}</div>`
        : ""
    }
    ${renderProductionView(user, currentView)}
  `;
}

function renderProductionFruitMenu() {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>เลือกผลไม้สำหรับบันทึกผลผลิต</h2>
          <p>แต่ละผลไม้สามารถมีฟอร์มและข้อมูลที่ต้องเก็บต่างกัน เลือกผลไม้ก่อนเริ่มบันทึก</p>
        </div>
      </div>
      <div class="production-fruit-grid">
        ${productionFruitOptions
          .map(
            (fruit) => `
              <button class="production-fruit-card" data-production-fruit="${fruit.id}" type="button">
                <span>${escapeHtml(fruit.status)}</span>
                <strong>${escapeHtml(fruit.label)}</strong>
                <small>${escapeHtml(fruit.description)}</small>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderProductionFruitPlaceholder(fruit) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>บันทึกผลผลิต - ${escapeHtml(fruit.label)}</h2>
          <p>${escapeHtml(fruit.description)}</p>
        </div>
        <button class="btn btn-outline report-primary-button" data-production-fruit-menu type="button">เปลี่ยนผลไม้</button>
      </div>
      <div class="empty-state">ฟอร์มบันทึกข้อมูลของ${escapeHtml(fruit.label)}ยังไม่ได้เปิดใช้งาน</div>
    </section>
  `;
}

function renderProductionView(user, view) {
  if (view === "batch-entry") return renderBatchEntry();
  if (view === "summary") return renderProductionSummary();
  return renderProductionFast(user, {
    label: "กรอกเร็ว",
    description: "บันทึกผลผลิตประจำวัน"
  });
}

function renderBatchEntry() {
  if (isDurianFruit()) return renderDurianBatchEntry();
  const labels = getProductionFieldLabels();
  const employeeName = batchGridState.employee
    ? batchGridState.employee.fullname
    : "รอกรอกรหัสพนักงานอย่างน้อย 2 หลัก";
  const renderWeightInputs = (type, values) =>
    values
      .map(
        (value, index) => `
          <label class="batch-weight-cell">
            <span>${index + 1}</span>
            <input data-batch-weight="${type}" data-batch-index="${index}" inputmode="decimal" type="number" min="0" step="0.1" value="${escapeHtml(value)}" />
          </label>`
      )
      .join("");

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>กรอกแบบชุด</h2>
          <p>กรอกรหัสพนักงาน แล้วใส่น้ำหนักฝั่งละ 20 ช่อง</p>
        </div>
      </div>
      <div class="batch-employee-row">
        <label class="field">
          <span>รหัสพนักงาน</span>
          <input id="batchEmpCode" inputmode="numeric" maxlength="8" value="${escapeHtml(batchGridState.emp_code)}" autocomplete="off" />
        </label>
        <div class="employee-result">
          <span>พนักงาน</span>
          <strong>${escapeHtml(employeeName)}</strong>
        </div>
      </div>
      <div class="batch-grid-entry">
        <section class="batch-side">
          <div class="batch-side-head">
            <h3>${escapeHtml(labels.flower)}</h3>
            <label class="compact-field">
              <span>กอง</span>
              <select id="batchFlowerPile">
                ${[1, 2, 3, 4, 5].map((pileNo) => `<option value="${pileNo}" ${batchGridState.flower_pile_no === String(pileNo) ? "selected" : ""}>กอง ${pileNo}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="batch-weight-grid">${renderWeightInputs("flower", getBatchPileWeights("flower"))}</div>
        </section>
        <section class="batch-side">
          <div class="batch-side-head">
            <h3>${escapeHtml(labels.water)}</h3>
            <label class="compact-field">
              <span>กอง</span>
              <select id="batchWaterPile">
                ${[1, 2, 3, 4, 5].map((pileNo) => `<option value="${pileNo}" ${batchGridState.water_pile_no === String(pileNo) ? "selected" : ""}>กอง ${pileNo}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="batch-weight-grid">${renderWeightInputs("water", getBatchPileWeights("water"))}</div>
        </section>
      </div>
      <div class="batch-actions">
        <button class="btn btn-primary report-primary-button" id="saveBatchEntry" type="button">บันทึกชุดนี้</button>
        <button class="btn btn-outline" id="clearBatchEntry" type="button">ล้างข้อมูล</button>
      </div>
    </section>
  `;
}

function renderDurianBatchEntry() {
  const employeeName = batchGridState.employee
    ? batchGridState.employee.fullname
    : "รอกรอกรหัสพนักงานอย่างน้อย 2 หลัก";
  const renderInputs = (grade) => getDurianBatchWeights(grade).map((value, index) => `
    <label class="batch-weight-cell">
      <span>${index + 1}</span>
      <input data-durian-batch-grade="${grade}" data-batch-index="${index}" inputmode="decimal" type="number" min="0" step="0.1" value="${escapeHtml(value)}" />
    </label>`).join("");
  return `
    <section class="panel">
      <div class="panel-head"><div><h2>กรอกทุเรียนแบบชุด</h2><p>กรอกรหัสพนักงาน แล้วใส่น้ำหนักแต่ละเกรดแยกตามกอง</p></div></div>
      <div class="batch-employee-row">
        <label class="field"><span>รหัสพนักงาน</span><input id="batchEmpCode" inputmode="numeric" maxlength="8" value="${escapeHtml(batchGridState.emp_code)}" autocomplete="off" /></label>
        <div class="employee-result"><span>พนักงาน</span><strong>${escapeHtml(employeeName)}</strong></div>
      </div>
      <div class="durian-batch-grid">
        ${DURIAN_GRADES.map((grade) => `
          <section class="batch-side durian-grade-side grade-${grade.toLowerCase()}">
            <div class="batch-side-head">
              <h3>เกรด ${grade}</h3>
              <label class="compact-field"><span>กอง</span><select data-durian-grade-pile="${grade}">
                ${[1,2,3,4,5].map((pileNo) => `<option value="${pileNo}" ${String(batchGridState.durian_grade_piles?.[grade] || "1") === String(pileNo) ? "selected" : ""}>กอง ${pileNo}</option>`).join("")}
              </select></label>
            </div>
            <div class="batch-weight-grid">${renderInputs(grade)}</div>
          </section>`).join("")}
      </div>
      <div class="batch-actions"><button class="btn btn-primary report-primary-button" id="saveBatchEntry" type="button">บันทึกชุดนี้</button><button class="btn btn-outline" id="clearBatchEntry" type="button">ล้างข้อมูล</button></div>
    </section>`;
}

function renderProductionSummary() {
  const labels = getProductionFieldLabels();
  const records = productionRecordsForActiveSession();
  const totals = getProductionTotals(records);
  const employeeMap = new Map(getEmployees().map((employee) => [employee.id, employee]));

  const durianMode = isDurianFruit();
  const gradeTotals = durianMode ? records.reduce((totals, record) => {
    const weights = getRecordGradeWeights(record);
    DURIAN_GRADES.forEach((grade) => totals[grade] += weights[grade]);
    return totals;
  }, createEmptyDurianGradeWeights(0)) : null;
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>สรุปการผลิต</h2>
          <p>${durianMode ? DURIAN_GRADES.map((grade) => `เกรด ${grade} ${numberText(gradeTotals[grade])} กก.`).join(" · ") : `${labels.waterShort} ${numberText(totals.water)} กก., ${labels.flowerShort} ${numberText(totals.flower)} กก.`}, ${totals.people.size} คน</p>
        </div>
        <span class="badge badge-success">${money(totals.amount)}</span>
      </div>
    </section>
    ${renderProductionRecordsTable(
      records.map((record) => ({
        ...record,
        employee_name: employeeMap.get(record.employee_id)?.fullname || ""
      })),
      true
    )}
  `;
}

function renderProductionRecordsTable(records, showEdit) {
  const labels = getProductionFieldLabels();
  const durianMode = isDurianFruit();
  return `
    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>เวลา</th><th>รหัส</th><th>ชื่อ</th><th>กอง</th>${durianMode ? DURIAN_GRADES.map((grade) => `<th>เกรด ${grade}</th>`).join("") : `<th>${escapeHtml(labels.water)}</th><th>${escapeHtml(labels.flower)}</th>`}<th>รวมเงิน</th><th>สถานะ</th><th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length
                ? records.map((record) => renderProductionManagementRow(record, showEdit)).join("")
                : `<tr><td colspan="${durianMode ? 12 : 9}" class="empty-cell">ยังไม่มีรายการผลผลิตวันนี้</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderProductionManagementRow(record, showEdit) {
  const employee = getEmployees().find((item) => item.id === record.employee_id);
  const locked = isProductionRecordLocked(record);

  return `
    <tr>
      <td>${escapeHtml(record.record_time || "")}</td>
      <td><strong>${escapeHtml(record.emp_code)}</strong></td>
      <td>${escapeHtml(record.employee_name || employee?.fullname || "")}</td>
      <td>${record.pile_no}</td>
      ${isDurianFruit(productionFruitTypeForRecord(record))
        ? DURIAN_GRADES.map((grade) => `<td>${numberText(getRecordGradeWeights(record)[grade])}</td>`).join("")
        : `<td>${numberText(record.water_weight)}</td><td>${numberText(record.flower_weight)}</td>`}
      <td><strong>${money(record.total_amount)}</strong></td>
      <td><span class="badge ${locked ? "badge-danger" : "badge-success"}">${locked ? "Locked" : "Open"}</span></td>
      <td>${showEdit ? `<button class="btn btn-small btn-outline" data-edit-production="${record.id}" type="button">Edit</button>` : ""}</td>
    </tr>
  `;
}

function renderProductionFast(user, moduleItem) {
  if (isDurianFruit()) return renderDurianFast(user, moduleItem);
  syncFastInputStateForSelectedFruit();
  if (fastInputState.emp_code) {
    updateFastEmployeeFromCode(fastInputState.emp_code);
  }
  const labels = getProductionFieldLabels();
  const activeSession = null;
  const latestRecords = productionRecordsForActiveSession()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);
  const employeeName = getEmployeeLookupText(
    fastInputState.employee,
    fastInputState.emp_code
  );

  return `
    <section class="panel fast-input-panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge badge-success">กรอกเร็ว</span>
      </div>

      ${
        activeSession
          ? `<div class="session-strip">
              <strong>Session</strong>
              <span>Pile ${activeSession.pile}</span>
              <span>${escapeHtml(activeSession.date)}</span>
            </div>`
          : ""
      }

      ${
        fastInputState.message
          ? `<div class="alert ${
              fastInputState.messageType === "error"
                ? "alert-error"
                : "alert-success"
            }">${escapeHtml(fastInputState.message)}</div>`
          : ""
      }

      <form class="fast-input-form" id="productionFastForm">
        <label class="field">
          <span>กอง</span>
          <select name="pile_no" id="fastPileNo" required>
            ${[1, 2, 3, 4, 5]
              .map(
                (pileNo) =>
                  `<option value="${pileNo}" ${
                    fastInputState.pile_no === String(pileNo) ? "selected" : ""
                  }>กอง ${pileNo}</option>`
              )
              .join("")}
          </select>
        </label>

        <label class="field">
          <span>รหัสพนักงาน</span>
          <input
            name="emp_code"
            id="fastEmpCode"
            inputmode="numeric"
            maxlength="8"
            value="${escapeHtml(fastInputState.emp_code)}"
            autocomplete="off"
            required
          />
        </label>

        <div class="employee-result">
          <span>พนักงาน</span>
          <strong>${escapeHtml(employeeName)}</strong>
        </div>

        <label class="field">
          <span>${escapeHtml(labels.water)}</span>
          <input
            name="water_weight"
            id="fastWaterWeight"
            type="number"
            min="0"
            step="0.1"
            value="${escapeHtml(fastInputState.water_weight)}"
            required
          />
        </label>

        <label class="field">
          <span>${escapeHtml(labels.flower)}</span>
          <input
            name="flower_weight"
            id="fastFlowerWeight"
            type="number"
            min="0"
            step="0.1"
            value="${escapeHtml(fastInputState.flower_weight)}"
            required
          />
        </label>

        <button class="btn btn-primary form-submit" type="submit">บันทึก</button>
      </form>

      <p class="demo-note">
        กด Enter เพื่อไปช่องถัดไป, Ctrl+S เพื่อบันทึก, Esc เพื่อล้างฟอร์ม
      </p>
    </section>

    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>กอง</th>
              <th>รหัสพนักงาน</th>
              <th>${escapeHtml(labels.water)}</th>
              <th>${escapeHtml(labels.flower)}</th>
              <th>รวมเงิน</th>
              <th>สถานะ</th>
              <th>ผู้บันทึก</th>
            </tr>
          </thead>
          <tbody>
            ${
              latestRecords.length
                ? latestRecords.map(renderProductionRecordRow).join("")
                : `<tr><td colspan="10" class="empty-cell">ยังไม่มีรายการผลผลิตวันนี้</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}
function renderProductionRecordRow(record) {
  return `
    <tr>
      <td>${record.id}</td>
      <td>${escapeHtml(record.record_date)}</td>
      <td>${escapeHtml(record.record_time)}</td>
      <td>${record.pile_no}</td>
      <td><strong>${escapeHtml(record.emp_code)}</strong></td>
      <td>${record.water_weight.toLocaleString("th-TH")} x ${money(record.water_rate)}</td>
      <td>${record.flower_weight.toLocaleString("th-TH")} x ${money(record.flower_rate)}</td>
      <td><strong>${money(record.total_amount)}</strong></td>
      <td><span class="badge badge-warning">${escapeHtml(record.status)}</span></td>
      <td>${escapeHtml(record.created_by)}</td>
    </tr>
  `;
}

function renderDurianFast(user, moduleItem) {
  syncFastInputStateForSelectedFruit();
  if (fastInputState.emp_code) updateFastEmployeeFromCode(fastInputState.emp_code);
  fastInputState.grade_weights ||= createEmptyDurianGradeWeights("");
  const latestRecords = productionRecordsForActiveSession().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);
  const employeeName = getEmployeeLookupText(fastInputState.employee, fastInputState.emp_code);
  return `
    <section class="panel fast-input-panel durian-fast-panel">
      <div class="panel-head"><div><h2>${escapeHtml(moduleItem.label)} - ทุเรียน</h2><p>บันทึกน้ำหนักแยกเกรด A-E ภายในกองเดียวกัน</p></div><span class="badge badge-success">กรอกเร็ว</span></div>
      ${fastInputState.message ? `<div class="alert ${fastInputState.messageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(fastInputState.message)}</div>` : ""}
      <form class="fast-input-form durian-fast-form" id="productionFastForm">
        <label class="field"><span>กอง</span><select name="pile_no" id="fastPileNo" required>${[1,2,3,4,5].map((pileNo) => `<option value="${pileNo}" ${fastInputState.pile_no === String(pileNo) ? "selected" : ""}>กอง ${pileNo}</option>`).join("")}</select></label>
        <label class="field"><span>รหัสพนักงาน</span><input name="emp_code" id="fastEmpCode" inputmode="numeric" maxlength="8" value="${escapeHtml(fastInputState.emp_code)}" autocomplete="off" required /></label>
        <div class="employee-result"><span>พนักงาน</span><strong>${escapeHtml(employeeName)}</strong></div>
        <div class="durian-grade-inputs">
          ${DURIAN_GRADES.map((grade) => `<label class="field durian-grade-field grade-${grade.toLowerCase()}"><span>เกรด ${grade}</span><input data-fast-durian-grade="${grade}" type="number" min="0" step="0.1" value="${escapeHtml(fastInputState.grade_weights[grade] ?? "")}" placeholder="0.0" /></label>`).join("")}
        </div>
        <button class="btn btn-primary form-submit" type="submit">บันทึก</button>
      </form>
      <p class="demo-note">กรอกเฉพาะเกรดที่มีน้ำหนักได้ · กด Ctrl+S เพื่อบันทึก · Esc เพื่อล้างฟอร์ม</p>
    </section>
    <section class="table-card"><div class="table-scroll"><table>
      <thead><tr><th>เลขที่</th><th>วันที่</th><th>เวลา</th><th>กอง</th><th>รหัส</th>${DURIAN_GRADES.map((grade) => `<th>เกรด ${grade}</th>`).join("")}<th>รวมเงิน</th><th>สถานะ</th><th>ผู้บันทึก</th></tr></thead>
      <tbody>${latestRecords.length ? latestRecords.map(renderDurianRecordRow).join("") : `<tr><td colspan="13" class="empty-cell">ยังไม่มีรายการทุเรียนวันนี้</td></tr>`}</tbody>
    </table></div></section>`;
}

function renderDurianRecordRow(record) {
  const weights = getRecordGradeWeights(record);
  const rates = record.grade_rates || {};
  return `<tr>
    <td>${record.id}</td><td>${escapeHtml(record.record_date)}</td><td>${escapeHtml(record.record_time)}</td><td>${record.pile_no}</td><td><strong>${escapeHtml(record.emp_code)}</strong></td>
    ${DURIAN_GRADES.map((grade) => `<td>${numberText(weights[grade])} x ${money(rates[grade] || 0)}</td>`).join("")}
    <td><strong>${money(record.total_amount)}</strong></td><td><span class="badge badge-warning">${escapeHtml(record.status)}</span></td><td>${escapeHtml(record.created_by)}</td>
  </tr>`;
}

function setFastInputMessage(message, messageType = "success") {
  syncFastInputStateForSelectedFruit();
  fastInputState.message = message;
  fastInputState.messageType = messageType;
}

function clearFastInputForm(keepMessage = false) {
  syncFastInputStateForSelectedFruit();
  fastInputState = {
    ...fastInputState,
    emp_code: "",
    water_weight: "",
    flower_weight: "",
    grade_weights: createEmptyDurianGradeWeights(""),
    employee: null,
    message: keepMessage ? fastInputState.message : "",
    messageType: keepMessage ? fastInputState.messageType : "success"
  };
  fastInputStatesByFruit[getFastInputFruitKey()] = fastInputState;
}

function focusFastEmployeeCode() {
  window.setTimeout(() => {
    document.querySelector("#fastEmpCode")?.focus();
  }, 0);
}

function saveProductionFastForm(user) {
  syncFastInputStateForSelectedFruit();
  if (isDurianFruit()) {
    saveDurianFastForm(user);
    return;
  }
  const pileInput = document.querySelector("#fastPileNo");
  const empInput = document.querySelector("#fastEmpCode");
  const waterInput = document.querySelector("#fastWaterWeight");
  const flowerInput = document.querySelector("#fastFlowerWeight");

  if (pileInput) fastInputState.pile_no = pileInput.value;
  if (empInput) {
    updateFastEmployeeFromCode(empInput.value);
    empInput.value = fastInputState.emp_code;
  }
  if (waterInput) fastInputState.water_weight = waterInput.value;
  if (flowerInput) fastInputState.flower_weight = flowerInput.value;
  fastInputState.employee =
    fastInputState.emp_code.length >= 2 ? apiGetEmployeeByCode(fastInputState.emp_code) : null;

  const labels = getProductionFieldLabels();
  const employee = fastInputState.employee;
  const waterWeight = Number(fastInputState.water_weight);
  const flowerWeight = Number(fastInputState.flower_weight);

  if (!employee) {
    setFastInputMessage("ต้องกรอกรหัสพนักงานที่มีอยู่และยังใช้งานอยู่", "error");
    render();
    focusFastEmployeeCode();
    return;
  }

  if (
    String(fastInputState.water_weight).trim() === "" ||
    String(fastInputState.flower_weight).trim() === ""
  ) {
    setFastInputMessage(`กรุณากรอก${labels.water}และ${labels.flower}`, "error");
    render();
    focusFastEmployeeCode();
    return;
  }

  if (!Number.isFinite(waterWeight) || !Number.isFinite(flowerWeight)) {
    setFastInputMessage(`${labels.water}และ${labels.flower}ต้องเป็นตัวเลข`, "error");
    render();
    focusFastEmployeeCode();
    return;
  }

  if (waterWeight < 0 || flowerWeight < 0) {
    setFastInputMessage("น้ำหนักต้องไม่ติดลบ", "error");
    render();
    focusFastEmployeeCode();
    return;
  }

  if (
    !isOneDecimalWeightInput(fastInputState.water_weight) ||
    !isOneDecimalWeightInput(fastInputState.flower_weight)
  ) {
    setFastInputMessage("น้ำหนักต้องเป็นทศนิยมได้ไม่เกิน 1 ตำแหน่ง เช่น 0.5 หรือ 1.9", "error");
    render();
    focusFastEmployeeCode();
    return;
  }

  if (
    (waterWeight > 500 || flowerWeight > 500) &&
    !window.confirm("น้ำหนักเกิน 500 กก. ต้องการบันทึกต่อหรือไม่?")
  ) {
    return;
  }

  const payload = {
    employee,
    fruit_type: getSelectedProductionFruitId(),
    pile_no: fastInputState.pile_no,
    water_weight: waterWeight,
    flower_weight: flowerWeight
  };
  const duplicate = apiCheckProductionDuplicate(employee.id, new Date(), getSelectedProductionFruitId());

  try {
    if (duplicate) {
      const addNew = window.confirm(
        "พนักงานคนนี้เพิ่งถูกบันทึกภายใน 1 นาที กด OK เพื่อเพิ่มรายการใหม่ หรือ Cancel เพื่อแก้รายการเดิม"
      );

      if (addNew) {
        apiCreateProductionRecord(payload, user);
        setFastInputMessage("บันทึกรายการใหม่แล้ว");
      } else {
        apiUpdateProductionRecord(duplicate.id, payload, user);
        setFastInputMessage(`แก้ไขรายการ #${duplicate.id} แล้ว`);
      }
    } else {
      apiCreateProductionRecord(payload, user);
      setFastInputMessage("บันทึกผลผลิตแล้ว");
    }

    clearFastInputForm(true);
    render();
    focusFastEmployeeCode();
  } catch (error) {
    setFastInputMessage(
      error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
      "error"
    );
    render();
    focusFastEmployeeCode();
  }
}

function saveDurianFastForm(user) {
  const pileInput = document.querySelector("#fastPileNo");
  const empInput = document.querySelector("#fastEmpCode");
  if (pileInput) fastInputState.pile_no = pileInput.value;
  if (empInput) updateFastEmployeeFromCode(empInput.value);
  fastInputState.grade_weights ||= createEmptyDurianGradeWeights("");
  document.querySelectorAll("[data-fast-durian-grade]").forEach((input) => {
    fastInputState.grade_weights[input.dataset.fastDurianGrade] = input.value;
  });
  const employee = fastInputState.emp_code.length >= 2 ? apiGetEmployeeByCode(fastInputState.emp_code) : null;
  fastInputState.employee = employee;
  if (!employee) {
    setFastInputMessage("ต้องกรอกรหัสพนักงานที่มีอยู่และยังใช้งานอยู่", "error");
    render(); focusFastEmployeeCode(); return;
  }
  const invalidGrade = DURIAN_GRADES.find((grade) => {
    const raw = String(fastInputState.grade_weights[grade] ?? "").trim();
    return raw && !isOneDecimalWeightInput(raw);
  });
  if (invalidGrade) {
    setFastInputMessage(`น้ำหนักเกรด ${invalidGrade} ต้องเป็นทศนิยมได้ไม่เกิน 1 ตำแหน่ง`, "error");
    render(); return;
  }
  const gradeWeights = normalizeDurianGradeWeights(fastInputState.grade_weights);
  const totalWeight = getDurianGradeTotal(gradeWeights);
  if (totalWeight <= 0) {
    setFastInputMessage("กรุณากรอกน้ำหนักอย่างน้อย 1 เกรด", "error");
    render(); return;
  }
  if (totalWeight > 500 && !window.confirm("น้ำหนักทุเรียนรวมเกิน 500 กก. ต้องการบันทึกต่อหรือไม่?")) return;
  const payload = { employee, fruit_type: "durian", pile_no: fastInputState.pile_no, grade_weights: gradeWeights };
  const duplicate = apiCheckProductionDuplicate(employee.id, new Date(), "durian");
  try {
    if (duplicate) {
      const addNew = window.confirm("พนักงานคนนี้เพิ่งถูกบันทึกทุเรียนภายใน 1 นาที กด OK เพื่อเพิ่มรายการใหม่ หรือ Cancel เพื่อแก้รายการเดิม");
      if (addNew) apiCreateProductionRecord(payload, user);
      else apiUpdateProductionRecord(duplicate.id, payload, user);
      setFastInputMessage(addNew ? "บันทึกรายการทุเรียนใหม่แล้ว" : `แก้ไขรายการ #${duplicate.id} แล้ว`);
    } else {
      apiCreateProductionRecord(payload, user);
      setFastInputMessage("บันทึกทุเรียนเรียบร้อยแล้ว");
    }
    clearFastInputForm(true);
  } catch (error) {
    setFastInputMessage(error instanceof Error ? error.message : "บันทึกทุเรียนไม่สำเร็จ", "error");
  }
  render(); focusFastEmployeeCode();
}

function bindProductionFastEvents(user) {
  syncFastInputStateForSelectedFruit();
  const form = document.querySelector("#productionFastForm");
  const pileInput = document.querySelector("#fastPileNo");
  const empInput = document.querySelector("#fastEmpCode");
  const waterInput = document.querySelector("#fastWaterWeight");
  const flowerInput = document.querySelector("#fastFlowerWeight");
  const gradeInputs = [...document.querySelectorAll("[data-fast-durian-grade]")];
  const orderedInputs = [pileInput, empInput, waterInput, flowerInput, ...gradeInputs].filter(Boolean);

  focusFastEmployeeCode();
  if (empInput?.value) {
    updateFastEmployeeFromCode(empInput.value);
    empInput.value = fastInputState.emp_code;
    updateFastEmployeeResultText();
  }

  pileInput?.addEventListener("change", (event) => {
    fastInputState.pile_no = event.target.value;
  });

  empInput?.addEventListener("input", (event) => {
    const value = normalizeEmployeeCodeInput(event.target.value);
    event.target.value = value;
    updateFastEmployeeFromCode(value);
    updateFastEmployeeResultText();
  });

  waterInput?.addEventListener("input", (event) => {
    fastInputState.water_weight = event.target.value;
  });

  flowerInput?.addEventListener("input", (event) => {
    fastInputState.flower_weight = event.target.value;
  });

  gradeInputs.forEach((input) => input.addEventListener("input", (event) => {
    fastInputState.grade_weights ||= createEmptyDurianGradeWeights("");
    fastInputState.grade_weights[event.target.dataset.fastDurianGrade] = event.target.value;
  }));

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProductionFastForm(user);
  });

  form?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const currentIndex = orderedInputs.indexOf(event.target);
      const nextInput = orderedInputs[currentIndex + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
        saveProductionFastForm(user);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearFastInputForm();
      render();
      focusFastEmployeeCode();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveProductionFastForm(user);
    }
  });
}

function setProductionMessage(message, type = "success") {
  productionMessage = message;
  productionMessageType = type;
}

function bindProductionManagementEvents(user) {
  if (productionView === "fast-entry" && document.querySelector("#productionFastForm")) {
    bindProductionFastEvents(user);
  }

  document.querySelectorAll("[data-production-fruit]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedProductionFruit(button.dataset.productionFruit);
      productionMessage = "";
      render();
    });
  });

  document.querySelectorAll("[data-production-fruit-menu]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedProductionFruit("");
      productionMessage = "";
      render();
    });
  });

  document.querySelectorAll("[data-production-view]").forEach((button) => {
    button.addEventListener("click", () => {
      productionView = button.dataset.productionView;
      productionMessage = "";
      render();
    });
  });

  document.querySelector("#productionSessionForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const session = apiCreateProductionSession(
        {
          date: String(form.get("date")),
          shift: "",
          pile: String(form.get("pile")),
          supervisor: String(form.get("supervisor")),
          note: String(form.get("note") || "")
        },
        user
      );
      syncFastInputStateForSelectedFruit();
      fastInputState.pile_no = String(session.pile);
      productionView = "fast-entry";
      setProductionMessage("เริ่ม Session แล้ว พร้อมกรอกเร็ว");
      render();
    } catch (error) {
      setProductionMessage(
        error instanceof Error ? error.message : "เริ่ม Session ไม่สำเร็จ",
        "error"
      );
      render();
    }
  });

  document.querySelector("#batchEntryText")?.addEventListener("input", (event) => {
    batchEntryText = event.target.value;
  });

  document.querySelector("#batchEmpCode")?.addEventListener("input", (event) => {
    const value = normalizeEmployeeCodeInput(event.target.value);
    event.target.value = value;
    batchGridState.emp_code = value;
    batchGridState.employee = value.length >= 2 ? apiGetEmployeeByCode(value) : null;

    const result = document.querySelector(".batch-employee-row .employee-result strong");
    if (result) {
      result.textContent = batchGridState.employee
        ? batchGridState.employee.fullname
        : value.length >= 2
        ? "ไม่พบพนักงานหรือสถานะไม่ใช้งาน"
          : "รอกรอกรหัสพนักงานอย่างน้อย 2 หลัก";
    }
  });

  document.querySelector("#batchFlowerPile")?.addEventListener("change", (event) => {
    batchGridState.flower_pile_no = event.target.value;
    render();
    window.setTimeout(() => {
      document.querySelector("[data-batch-weight='flower']")?.focus();
    }, 0);
  });

  document.querySelector("#batchWaterPile")?.addEventListener("change", (event) => {
    batchGridState.water_pile_no = event.target.value;
    render();
    window.setTimeout(() => {
      document.querySelector("[data-batch-weight='water']")?.focus();
    }, 0);
  });

  document.querySelectorAll("[data-durian-grade-pile]").forEach((select) => {
    select.addEventListener("change", (event) => {
      const grade = event.target.dataset.durianGradePile;
      batchGridState.durian_grade_piles ||= createDurianGradePileSelection();
      batchGridState.durian_grade_piles[grade] = event.target.value;
      render();
      window.setTimeout(() => document.querySelector(`[data-durian-batch-grade='${grade}']`)?.focus(), 0);
    });
  });

  document.querySelectorAll("[data-batch-weight]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const type = event.target.dataset.batchWeight;
      const index = Number(event.target.dataset.batchIndex);
      const values = getBatchPileWeights(type);
      values[index] = event.target.value;
    });
  });

  document.querySelectorAll("[data-durian-batch-grade]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const grade = event.target.dataset.durianBatchGrade;
      const index = Number(event.target.dataset.batchIndex);
      getDurianBatchWeights(grade)[index] = event.target.value;
    });
  });

  const batchInputs = [
    document.querySelector("#batchEmpCode"),
    ...document.querySelectorAll("[data-batch-weight='flower']"),
    ...document.querySelectorAll("[data-batch-weight='water']")
    ,...document.querySelectorAll("[data-durian-batch-grade]")
  ].filter(Boolean);

  batchInputs.forEach((input, index) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const nextInput = batchInputs[index + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select?.();
      } else {
        saveBatchEntries(user);
      }
    });
  });

  document.querySelector("#clearBatchEntry")?.addEventListener("click", () => {
    batchEntryText = "";
    clearBatchGridState();
    setProductionMessage("ล้างข้อมูลกรอกแบบชุดแล้ว");
    render();
  });

  document.querySelector("#saveBatchEntry")?.addEventListener("click", () => {
    saveBatchEntries(user);
  });

  document.querySelectorAll("[data-edit-production]").forEach((button) => {
    button.addEventListener("click", () => {
      editProductionRecord(Number(button.dataset.editProduction), user);
    });
  });

  document.querySelector("#printProductionPage")?.addEventListener("click", () => {
    window.print();
  });
}

function saveLegacyBatchEntries(user) {
  const lines = batchEntryText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const seenCodes = new Set();
  const errors = [];
  let savedCount = 0;

  lines.forEach((line, index) => {
    const columns = line.split(/\s+|,/).filter(Boolean);
    const hasPileColumn = columns.length >= 4;
    const [pileRaw, empCode, waterRaw, flowerRaw] = hasPileColumn
      ? columns
      : [fastInputState.pile_no, columns[0], columns[1], columns[2]];
    const employee = empCode ? apiGetEmployeeByCode(empCode) : null;
    const pileNo = Number(pileRaw);
    const water = Number(waterRaw);
    const flower = Number(flowerRaw);
    const rowNo = index + 1;

    if (!empCode || !waterRaw || !flowerRaw) {
      errors.push(`แถว ${rowNo}: ต้องเป็น กอง รหัส น้ำ ดอก หรือ รหัส น้ำ ดอก`);
      return;
    }
    if (!Number.isInteger(pileNo) || pileNo < 1 || pileNo > 5) {
      errors.push(`แถว ${rowNo}: กองต้องเป็นเลข 1-5`);
      return;
    }
    if (seenCodes.has(empCode)) {
      errors.push(`แถว ${rowNo}: รหัส ${empCode} ซ้ำในชุดนี้`);
      return;
    }
    seenCodes.add(empCode);
    if (!employee) {
      errors.push(`แถว ${rowNo}: ไม่พบพนักงาน ${empCode} หรือสถานะไม่ใช้งาน`);
      return;
    }
    if (!Number.isFinite(water) || !Number.isFinite(flower) || water < 0 || flower < 0) {
      errors.push(`แถว ${rowNo}: น้ำหนักน้ำ/ดอกต้องเป็นตัวเลขและไม่ติดลบ`);
      return;
    }
    if ((water > 500 || flower > 500) && !window.confirm(`แถว ${rowNo} น้ำหนักเกิน 500 กก. ต้องการบันทึกหรือไม่?`)) {
      errors.push(`แถว ${rowNo}: ยกเลิกรายการน้ำหนักเกิน 500 กก.`);
      return;
    }

    apiCreateProductionRecord(
      {
        employee,
        pile_no: pileNo,
        water_weight: water,
        flower_weight: flower
      },
      user
    );
    savedCount += 1;
  });

  batchEntryText = errors.length ? errors.join("\n") : "";
  setProductionMessage(
    errors.length
      ? `บันทึกแถวที่ถูกต้องแล้ว ${savedCount} แถว กรุณาแก้ไขรายการนี้:\n${errors.join(" | ")}`
      : `บันทึกแบบชุดแล้ว ${savedCount} แถว`,
    errors.length ? "error" : "success"
  );
  render();
}

function clearBatchGridState(keepEmployee = false) {
  batchGridState = {
    ...batchGridState,
    emp_code: keepEmployee ? batchGridState.emp_code : "",
    employee: keepEmployee ? batchGridState.employee : null,
    flower_weights_by_pile: createBatchPileWeightMap(),
    water_weights_by_pile: createBatchPileWeightMap(),
    durian_grade_piles: createDurianGradePileSelection(),
    durian_grade_weights_by_pile: createDurianBatchWeightMap()
  };
}

function syncBatchEmployeeFromInput() {
  const empInput = document.querySelector("#batchEmpCode");
  if (!empInput) return;

  const empCode = normalizeEmployeeCodeInput(empInput.value);
  empInput.value = empCode;
  batchGridState.emp_code = empCode;
  batchGridState.employee = empCode.length >= 2 ? apiGetEmployeeByCode(empCode) : null;
}

function readBatchWeightValues(values, label) {
  const errors = [];
  const weights = [];

  values.forEach((value, index) => {
    const raw = String(value).trim();
    if (!raw) return;

    const weight = Number(raw);
    if (!isOneDecimalWeightInput(raw) || !Number.isFinite(weight) || weight < 0) {
      errors.push(`${label} ช่อง ${index + 1} ต้องเป็นตัวเลขทศนิยมได้ไม่เกิน 1 ตำแหน่ง เช่น 0.5 หรือ 1.9`);
      return;
    }
    weights.push(weight);
  });

  return { errors, weights };
}

function addBatchGroup(groups, pileNo, water, flower) {
  const existing = groups.get(pileNo) || { pileNo, water: 0, flower: 0 };
  existing.water += water;
  existing.flower += flower;
  groups.set(pileNo, existing);
}

function saveBatchEntries(user) {
  if (isDurianFruit()) {
    saveDurianBatchEntries(user);
    return;
  }
  syncBatchEmployeeFromInput();
  const labels = getProductionFieldLabels();
  const employee = batchGridState.employee;

  if (!employee) {
    setProductionMessage("กรุณากรอกรหัสพนักงานที่มีอยู่และยังใช้งานอยู่", "error");
    render();
    window.setTimeout(() => document.querySelector("#batchEmpCode")?.focus(), 0);
    return;
  }

  const groups = new Map();
  const errors = [];

  [1, 2, 3, 4, 5].forEach((pileNo) => {
    const flowerResult = readBatchWeightValues(
      getBatchPileWeights("flower", pileNo),
      `${labels.flower} กอง ${pileNo}`
    );
    const waterResult = readBatchWeightValues(
      getBatchPileWeights("water", pileNo),
      `${labels.water} กอง ${pileNo}`
    );

    errors.push(...flowerResult.errors, ...waterResult.errors);

    const flowerTotal = flowerResult.weights.reduce((sum, weight) => sum + weight, 0);
    const waterTotal = waterResult.weights.reduce((sum, weight) => sum + weight, 0);
    if (flowerTotal > 0 || waterTotal > 0) {
      addBatchGroup(groups, pileNo, waterTotal, flowerTotal);
    }
  });

  if (errors.length) {
    setProductionMessage(errors.join("\n"), "error");
    render();
    return;
  }

  if (!groups.size) {
    setProductionMessage("กรุณากรอกน้ำหนักอย่างน้อย 1 ช่อง", "error");
    render();
    return;
  }

  const overLimitGroups = Array.from(groups.values()).filter(
    (group) => group.water > 500 || group.flower > 500
  );
  if (
    overLimitGroups.length &&
    !window.confirm("ผลรวมน้ำหนักบางกองเกิน 500 กก. ต้องการบันทึกต่อหรือไม่?")
  ) {
    return;
  }

  Array.from(groups.values()).forEach((group) => {
    apiCreateProductionRecord(
      {
        employee,
        fruit_type: getSelectedProductionFruitId(),
        pile_no: group.pileNo,
        water_weight: group.water,
        flower_weight: group.flower
      },
      user
    );
  });

  const summaryLines = Array.from(groups.values())
    .sort((a, b) => a.pileNo - b.pileNo)
    .map(
      (group) =>
        `กอง ${group.pileNo}: ${labels.waterShort} ${numberText(group.water)} กก., ${labels.flowerShort} ${numberText(group.flower)} กก., รวม ${numberText(group.water + group.flower)} กก.`
    );
  const grandTotal = Array.from(groups.values()).reduce(
    (sum, group) => sum + group.water + group.flower,
    0
  );
  const summaryMessage = `บันทึกชุดนี้แล้ว\n${summaryLines.join("\n")}\nน้ำหนักทั้งหมดของการกรอกครั้งนี้ ${numberText(grandTotal)} กก.`;

  clearBatchGridState();
  setProductionMessage(summaryMessage, "success");
  window.alert(summaryMessage);
  render();
  window.setTimeout(() => document.querySelector("#batchEmpCode")?.focus(), 0);
}

function saveDurianBatchEntries(user) {
  syncBatchEmployeeFromInput();
  const employee = batchGridState.employee;
  if (!employee) {
    setProductionMessage("กรุณากรอกรหัสพนักงานที่มีอยู่และยังใช้งานอยู่", "error");
    render();
    window.setTimeout(() => document.querySelector("#batchEmpCode")?.focus(), 0);
    return;
  }
  const groups = new Map();
  const errors = [];
  DURIAN_GRADES.forEach((grade) => {
    [1,2,3,4,5].forEach((pileNo) => {
      const result = readBatchWeightValues(getDurianBatchWeights(grade, pileNo), `เกรด ${grade} กอง ${pileNo}`);
      errors.push(...result.errors);
      const total = result.weights.reduce((sum, weight) => sum + weight, 0);
      if (total <= 0) return;
      const group = groups.get(pileNo) || { pileNo, grade_weights: createEmptyDurianGradeWeights(0) };
      group.grade_weights[grade] += total;
      groups.set(pileNo, group);
    });
  });
  if (errors.length) {
    setProductionMessage(errors.join("\n"), "error"); render(); return;
  }
  if (!groups.size) {
    setProductionMessage("กรุณากรอกน้ำหนักทุเรียนอย่างน้อย 1 ช่อง", "error"); render(); return;
  }
  const overLimit = [...groups.values()].some((group) => getDurianGradeTotal(group.grade_weights) > 500);
  if (overLimit && !window.confirm("ผลรวมน้ำหนักทุเรียนบางกองเกิน 500 กก. ต้องการบันทึกต่อหรือไม่?")) return;
  try {
    [...groups.values()].forEach((group) => apiCreateProductionRecord({
      employee,
      fruit_type: "durian",
      pile_no: group.pileNo,
      grade_weights: group.grade_weights
    }, user));
  } catch (error) {
    setProductionMessage(error instanceof Error ? error.message : "บันทึกทุเรียนแบบชุดไม่สำเร็จ", "error"); render(); return;
  }
  const lines = [...groups.values()].sort((a,b) => a.pileNo-b.pileNo).map((group) =>
    `กอง ${group.pileNo}: ${DURIAN_GRADES.map((grade) => `${grade} ${numberText(group.grade_weights[grade])}`).join(", ")} · รวม ${numberText(getDurianGradeTotal(group.grade_weights))} กก.`
  );
  const grandTotal = [...groups.values()].reduce((sum, group) => sum + getDurianGradeTotal(group.grade_weights), 0);
  const message = `บันทึกทุเรียนแบบชุดแล้ว\n${lines.join("\n")}\nน้ำหนักรวม ${numberText(grandTotal)} กก.`;
  clearBatchGridState();
  setProductionMessage(message);
  window.alert(message);
  render();
  window.setTimeout(() => document.querySelector("#batchEmpCode")?.focus(), 0);
}

function editProductionRecord(recordId, user) {
  const record = getProductionRecords().find((item) => item.id === recordId);
  if (!record) return;
  const labels = getProductionFieldLabels(productionFruitTypeForRecord(record));

  if (isProductionRecordLocked(record) && !isTopLevelUser(user)) {
    setProductionMessage("This record is locked. C6/C7 only can edit after 5 minutes.", "error");
    render();
    return;
  }

  const employee = apiGetEmployeeByCode(record.emp_code);
  if (!employee) {
    setProductionMessage("Employee not found or inactive.", "error");
    render();
    return;
  }

  if (isDurianFruit(productionFruitTypeForRecord(record))) {
    const pile = window.prompt("กอง", String(record.pile_no));
    if (pile === null) return;
    const pileNo = Number(pile);
    const gradeWeights = {};
    const currentWeights = getRecordGradeWeights(record);
    for (const grade of DURIAN_GRADES) {
      const value = window.prompt(`น้ำหนักทุเรียนเกรด ${grade}`, String(currentWeights[grade]));
      if (value === null) return;
      if (!isOneDecimalWeightInput(value) || Number(value) < 0) {
        setProductionMessage(`น้ำหนักเกรด ${grade} ต้องเป็นตัวเลขไม่ติดลบและมีทศนิยมไม่เกิน 1 ตำแหน่ง`, "error");
        render(); return;
      }
      gradeWeights[grade] = Number(value);
    }
    if (!Number.isInteger(pileNo) || pileNo < 1 || pileNo > 5 || getDurianGradeTotal(gradeWeights) <= 0) {
      setProductionMessage("กองต้องเป็นเลข 1-5 และต้องมีน้ำหนักอย่างน้อย 1 เกรด", "error"); render(); return;
    }
    try {
      apiUpdateProductionRecord(record.id, { employee, fruit_type: "durian", pile_no: pileNo, grade_weights: gradeWeights }, user);
      setProductionMessage(`แก้ไขรายการทุเรียน #${record.id} แล้ว`);
    } catch (error) {
      setProductionMessage(error instanceof Error ? error.message : "แก้ไขรายการทุเรียนไม่สำเร็จ", "error");
    }
    render();
    return;
  }

  const pile = window.prompt("กอง", String(record.pile_no));
  if (pile === null) return;
  const water = window.prompt(labels.water, String(record.water_weight));
  if (water === null) return;
  const flower = window.prompt(labels.flower, String(record.flower_weight));
  if (flower === null) return;
  const pileNo = Number(pile);
  const waterWeight = Number(water);
  const flowerWeight = Number(flower);

  if (
    !Number.isInteger(pileNo) ||
    pileNo < 1 ||
    pileNo > 5 ||
    !Number.isFinite(waterWeight) ||
    !Number.isFinite(flowerWeight) ||
    waterWeight < 0 ||
    flowerWeight < 0
  ) {
    setProductionMessage(`กองต้องเป็นเลข 1-5 และ${labels.water}/${labels.flower}ต้องเป็นตัวเลขไม่ติดลบ`, "error");
    render();
    return;
  }

  if (!isOneDecimalWeightInput(water) || !isOneDecimalWeightInput(flower)) {
    setProductionMessage("น้ำหนักต้องเป็นทศนิยมได้ไม่เกิน 1 ตำแหน่ง เช่น 0.5 หรือ 1.9", "error");
    render();
    return;
  }

  if (
    (waterWeight > 500 || flowerWeight > 500) &&
    !window.confirm("น้ำหนักเกิน 500 กก. ต้องการบันทึกต่อหรือไม่?")
  ) {
    return;
  }

  try {
    apiUpdateProductionRecord(
      record.id,
      {
        employee,
        pile_no: pileNo,
        water_weight: waterWeight,
        flower_weight: flowerWeight
      },
      user
    );
    setProductionMessage(`แก้ไขรายการ #${record.id} แล้ว`);
    render();
  } catch (error) {
    setProductionMessage(
      error instanceof Error ? error.message : "แก้ไขรายการไม่สำเร็จ",
      "error"
    );
    render();
  }
}

function renderWageRateForm() {
  const wageRateTypeOptions = getWageRateTypeOptions();
  const rates = apiGetWageRates(wageRateFilter);
  const allRates = apiGetWageRates("all");
  const latestByType = new Map();
  wageRateTypeOptions.forEach((option) => {
    latestByType.set(option.value, allRates.find((rate) => rate.item_type === option.value) || null);
  });
  const latestPreviewOptions = wageRateTypeOptions.slice(0, 4);

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>ตั้งค่าอัตราค่าจ้าง</h2>
          <p>เพิ่มอัตราใหม่แบบเก็บประวัติ ไม่แก้ทับรายการเดิม เพื่อให้ตรวจสอบย้อนหลังได้</p>
        </div>
        <span class="badge badge-success">${rates.length.toLocaleString("th-TH")} records</span>
      </div>
      <div class="metrics-grid metrics-spaced">
        ${latestPreviewOptions
          .map((option) => {
            const latestRate = latestByType.get(option.value);
            return `<div class="metric-card"><span>${escapeHtml(option.label)}</span><strong>${latestRate ? money(latestRate.rate) : "-"}</strong><small>${latestRate ? escapeHtml(latestRate.effective_date) : "ยังไม่มีข้อมูล"}</small></div>`;
          })
          .join("")}
        <div class="metric-card"><span>รายการทั้งหมด</span><strong>${allRates.length.toLocaleString("th-TH")}</strong><small>ประวัติอัตราค่าจ้าง</small></div>
      </div>
    </section>

    <section class="panel">
      <div class="section-title-row">
        <h3>เพิ่มอัตราใหม่</h3>
        <p class="muted-text">รายการใหม่จะถูกใช้ตามวันที่มีผลล่าสุด</p>
      </div>
      <form class="rate-form" id="wageRateForm">
        <label class="field">
          <span>ชนิดงาน / ผลไม้</span>
          <select name="item_type" required>
            ${wageRateTypeOptions
              .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
              .join("")}
          </select>
        </label>

        <label class="field">
          <span>อัตราค่าจ้างต่อหน่วย</span>
          <input name="rate" type="number" min="0.01" step="0.01" required />
        </label>

        <label class="field">
          <span>วันที่เริ่มใช้</span>
          <input name="effective_date" type="date" value="${escapeHtml(currentRateDate)}" required />
        </label>

        <button class="btn btn-primary form-submit" type="submit">เพิ่มอัตรา</button>
      </form>
    </section>

    <section class="panel">
      <div class="toolbar">
        <label class="compact-field">
          <span>Filter</span>
          <select id="wageRateFilter">
            ${[["all", "ทั้งหมด"], ...wageRateTypeOptions.map((option) => [option.value, option.label])]
              .map(([value, label]) => `<option value="${value}" ${wageRateFilter === value ? "selected" : ""}>${label}</option>`)
              .join("")}
          </select>
        </label>
        <label class="compact-field">
          <span>วันที่เริ่มใช้เริ่มต้น</span>
          <input id="currentRateDate" type="date" value="${escapeHtml(currentRateDate)}" />
        </label>
      </div>
    </section>

    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>ID</th><th>ชนิดงาน</th><th>Rate</th><th>Effective</th><th>Created By</th><th>Created</th></tr>
          </thead>
          <tbody>
            ${rates.length ? rates.map(renderWageRateRow).join("") : `<tr><td colspan="6" class="empty-cell">No wage rates found.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
function renderWageRateRow(wageRate) {
  return `
    <tr>
      <td>${wageRate.id}</td>
      <td><span class="badge badge-warning">${escapeHtml(wageRateTypeLabel(wageRate.item_type))}</span></td>
      <td><strong>${money(wageRate.rate)}</strong></td>
      <td>${escapeHtml(wageRate.effective_date)}</td>
      <td>${escapeHtml(wageRate.created_by)}</td>
      <td>${formatDate(wageRate.created_at)}</td>
    </tr>
  `;
}

function bindWageRateEvents(user) {
  document.querySelector("#currentRateDate")?.addEventListener("change", (event) => {
    currentRateDate = event.target.value || new Date().toISOString().slice(0, 10);
    render();
  });

  document.querySelector("#wageRateFilter")?.addEventListener("change", (event) => {
    wageRateFilter = event.target.value;
    render();
  });

  document.querySelector("#wageRateForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isTopLevelUser(user)) {
      window.alert("Only C6/C7 can add wage rates.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      item_type: String(form.get("item_type")),
      rate: String(form.get("rate")),
      effective_date: String(form.get("effective_date"))
    };

    try {
      await apiCreateWageRate(payload, user.fullname);
      render();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Save failed.");
    }
  });
}

function normalizeDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    const today = new Date().toISOString().slice(0, 10);
    return { startDate: today, endDate: today };
  }

  const start = startDate || endDate;
  const end = endDate || startDate;
  return start <= end
    ? { startDate: start, endDate: end }
    : { startDate: end, endDate: start };
}

function recordsForPersonalReport(employeeId, startDate, endDate) {
  const range = normalizeDateRange(startDate, endDate);
  return getProductionRecords()
    .filter((record) => {
      const recordDate = record.record_date || record.date || "";
      return (
        Number(record.employee_id) === Number(employeeId) &&
        recordDate >= range.startDate &&
        recordDate <= range.endDate
      );
    })
    .sort((a, b) => {
      const aKey = `${a.record_date || a.date || ""} ${a.record_time || ""}`;
      const bKey = `${b.record_date || b.date || ""} ${b.record_time || ""}`;
      return aKey.localeCompare(bKey);
    });
}

function summarizePersonalRecords(records) {
  return records.reduce(
    (totals, record) => {
      const water = Number(record.water_weight || record.water || 0);
      const flower = Number(record.flower_weight || record.flower || 0);
      totals.water += water;
      totals.flower += flower;
      DURIAN_GRADES.forEach((grade) => totals.grades[grade] += getRecordGradeWeights(record)[grade]);
      totals.total += getRecordTotalWeight(record);
      totals.amount += Number(record.total_amount || record.grand_total || 0);
      totals.records += 1;
      totals.days.add(record.record_date || record.date || "");
      return totals;
    },
    { water: 0, flower: 0, grades: createEmptyDurianGradeWeights(0), total: 0, amount: 0, records: 0, days: new Set() }
  );
}

function getDailyPersonalSummaries(records) {
  const summaries = new Map();

  records.forEach((record) => {
    const date = record.record_date || record.date || "";
    const water = Number(record.water_weight || record.water || 0);
    const flower = Number(record.flower_weight || record.flower || 0);
    const existing = summaries.get(date) || { date, water: 0, flower: 0, grades: createEmptyDurianGradeWeights(0), total: 0, amount: 0, count: 0 };
    existing.water += water;
    existing.flower += flower;
    DURIAN_GRADES.forEach((grade) => existing.grades[grade] += getRecordGradeWeights(record)[grade]);
    existing.total += getRecordTotalWeight(record);
    existing.amount += Number(record.total_amount || record.grand_total || 0);
    existing.count += 1;
    summaries.set(date, existing);
  });

  return Array.from(summaries.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getPilePersonalSummaries(records) {
  const summaries = new Map();

  records.forEach((record) => {
    const pile = Number(record.pile_no || record.pile || 0);
    const pileKey = String(pile || "-");
    const water = Number(record.water_weight || record.water || 0);
    const flower = Number(record.flower_weight || record.flower || 0);
    const existing = summaries.get(pileKey) || { pile: pileKey, water: 0, flower: 0, grades: createEmptyDurianGradeWeights(0), total: 0, amount: 0, count: 0 };
    existing.water += water;
    existing.flower += flower;
    DURIAN_GRADES.forEach((grade) => existing.grades[grade] += getRecordGradeWeights(record)[grade]);
    existing.total += getRecordTotalWeight(record);
    existing.amount += Number(record.total_amount || record.grand_total || 0);
    existing.count += 1;
    summaries.set(pileKey, existing);
  });

  return Array.from(summaries.values()).sort((a, b) => Number(a.pile) - Number(b.pile));
}

function renderPersonalReport(moduleItem) {
  const employees = getEmployees().filter((employee) => employee.status === "Active");
  const preferredEmployeeId = Number(personalReportEmployeeId);
  const selectedEmployeeId = employees.some((employee) => employee.id === preferredEmployeeId)
    ? preferredEmployeeId
    : employees[0]?.id || "";
  personalReportEmployeeId = selectedEmployeeId ? String(selectedEmployeeId) : "";

  const selectedEmployee = employees.find(
    (employee) => employee.id === Number(selectedEmployeeId)
  );
  const range = normalizeDateRange(personalReportStartDate, personalReportEndDate);
  const records = selectedEmployee
    ? recordsForPersonalReport(selectedEmployee.id, range.startDate, range.endDate)
    : [];
  const totals = summarizePersonalRecords(records);
  const dailySummaries = getDailyPersonalSummaries(records);
  const pileSummaries = getPilePersonalSummaries(records);
  const canExportPersonalReport = Boolean(selectedEmployee);

  return `
    <section class="summary-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <div class="summary-filters">
          <button class="btn btn-outline" data-route="reports" type="button">Export หลายคน</button>
        </div>
      </div>

      ${
        personalReportMessage
          ? `<div class="alert ${
              personalReportMessageType === "error" ? "alert-error" : "alert-success"
            }">${escapeHtml(personalReportMessage)}</div>`
          : ""
      }

      <section class="panel">
        <form class="personal-report-form" id="personalReportForm">
          <label class="field compact-field">
            <span>พนักงาน</span>
            <select id="personalReportEmployee" name="employee_id" required>
              ${employees
                .map(
                  (employee) => `
                    <option value="${employee.id}" ${
                    Number(selectedEmployeeId) === employee.id ? "selected" : ""
                  }>
                      ${escapeHtml(employee.emp_code)} - ${escapeHtml(employee.fullname)}
                    </option>`
                )
                .join("")}
            </select>
          </label>

          <label class="field compact-field">
            <span>วันที่เริ่ม</span>
            <input id="personalReportStartDate" name="start_date" type="date" value="${escapeHtml(range.startDate)}" />
          </label>

          <label class="field compact-field">
            <span>วันที่สิ้นสุด</span>
            <input id="personalReportEndDate" name="end_date" type="date" value="${escapeHtml(range.endDate)}" />
          </label>

          <button class="btn btn-outline" id="exportPersonalExcel" type="button" ${canExportPersonalReport ? "" : "disabled"}>
            Export Excel
          </button>
          <button class="btn btn-primary report-primary-button" id="exportPersonalPdf" type="button" ${canExportPersonalReport ? "" : "disabled"}>
            Export PDF รายงานน้ำหนัก
          </button>
        </form>
        ${
          selectedEmployee && !records.length
            ? `<p class="demo-note">ยังไม่มีข้อมูลในช่วงวันที่นี้ แต่สามารถ Export รายงานเปล่าสำหรับพนักงานที่เลือกได้</p>`
            : ""
        }
      </section>

      <div class="summary-metrics">
        <div class="metric-card metric-green">
          <span>น้ำหนักรวม</span>
          <strong>${numberText(totals.total)} กก.</strong>
          <small>น้ำ ${numberText(totals.water)} | ดอก ${numberText(totals.flower)}</small>
        </div>
        <div class="metric-card metric-blue">
          <span>ยอดเงินรวม</span>
          <strong>${money(totals.amount)}</strong>
          <small>จากรายการของพนักงานที่เลือก</small>
        </div>
        <div class="metric-card metric-purple">
          <span>วันที่มีผลงาน</span>
          <strong>${totals.days.size.toLocaleString("th-TH")} วัน</strong>
          <small>${escapeHtml(range.startDate)} ถึง ${escapeHtml(range.endDate)}</small>
        </div>
        <div class="metric-card metric-orange">
          <span>จำนวนรายการ</span>
          <strong>${totals.records.toLocaleString("th-TH")}</strong>
          <small>${selectedEmployee ? escapeHtml(selectedEmployee.emp_code) : "ยังไม่มีพนักงาน"}</small>
        </div>
      </div>
    </section>

    <section class="personal-report-grid">
      <section class="table-card">
        <div class="table-heading">สรุปรายวัน</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>น้ำหนักดอก</th>
                <th>น้ำหนักน้ำ</th>
                <th>ทุเรียน A-E</th>
                <th>น้ำหนักรวม</th>
                <th>รวมเป็นเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${
                dailySummaries.length
                  ? dailySummaries.map(renderPersonalDailyRow).join("")
                  : `<tr><td colspan="6" class="empty-cell">ยังไม่มีข้อมูลในช่วงวันที่นี้</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="table-card">
        <div class="table-heading">สรุปตามกอง</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>กอง</th>
                <th>จำนวนรายการ</th>
                <th>น้ำหนักดอก</th>
                <th>น้ำหนักน้ำ</th>
                <th>ทุเรียน A-E</th>
                <th>น้ำหนักรวม</th>
                <th>รวมเป็นเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${
                pileSummaries.length
                  ? pileSummaries.map(renderPersonalPileRow).join("")
                  : `<tr><td colspan="7" class="empty-cell">ยังไม่มีข้อมูลตามกองในช่วงวันที่นี้</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function renderPersonalDailyRow(item) {
  return `
    <tr>
      <td><strong>${escapeHtml(item.date)}</strong></td>
      <td>${numberText(item.flower)}</td>
      <td>${numberText(item.water)}</td>
      <td>${escapeHtml(formatDurianGradeBreakdown(item))}</td>
      <td><strong>${numberText(item.total)}</strong></td>
      <td><strong>${money(item.amount)}</strong></td>
    </tr>
  `;
}

function renderPersonalPileRow(item) {
  return `
    <tr>
      <td><strong>กอง ${escapeHtml(item.pile)}</strong></td>
      <td>${item.count.toLocaleString("th-TH")}</td>
      <td>${numberText(item.flower)}</td>
      <td>${numberText(item.water)}</td>
      <td>${escapeHtml(formatDurianGradeBreakdown(item))}</td>
      <td><strong>${numberText(item.total)}</strong></td>
      <td><strong>${money(item.amount)}</strong></td>
    </tr>
  `;
}

function buildPersonalReportPayload() {
  const range = normalizeDateRange(personalReportStartDate, personalReportEndDate);
  return {
    employee_id: Number(personalReportEmployeeId),
    start_date: range.startDate,
    end_date: range.endDate,
    employees: getEmployees(),
    production_records: getProductionRecords(),
    deduction_records: getAdjustmentRecordsForRange("production", range.startDate, range.endDate)
  };
}

function setPersonalReportMessage(message, type = "success") {
  personalReportMessage = message;
  personalReportMessageType = type;
}

function personalReportExportError(error) {
  setPersonalReportMessage(
    `${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`,
    "error"
  );
  render();
}

function bindPersonalReportEvents() {
  document.querySelector("#personalReportForm")?.addEventListener("change", (event) => {
    const target = event.target;
    if (target.id === "personalReportEmployee") {
      personalReportEmployeeId = target.value;
    }
    if (target.id === "personalReportStartDate") {
      personalReportStartDate = target.value || new Date().toISOString().slice(0, 10);
    }
    if (target.id === "personalReportEndDate") {
      personalReportEndDate = target.value || personalReportStartDate;
    }
    personalReportMessage = "";
    render();
  });

  document.querySelector("#exportPersonalPdf")?.addEventListener("click", async () => {
    try {
      await syncReportData();
      await downloadReport(`${REPORT_API_BASE}/reports/employee-range-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPersonalReportPayload())
      });
      setPersonalReportMessage("ดาวน์โหลด PDF รายบุคคลแล้ว");
      render();
    } catch (error) {
      personalReportExportError(error);
    }
  });

  document.querySelector("#exportPersonalExcel")?.addEventListener("click", async () => {
    try {
      await syncReportData();
      await downloadReport(`${REPORT_API_BASE}/reports/employee-range-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPersonalReportPayload())
      });
      setPersonalReportMessage("ดาวน์โหลด Excel รายบุคคลแล้ว");
      render();
    } catch (error) {
      personalReportExportError(error);
    }
  });
}

function renderReports(moduleItem) {
  const employees = getEmployees().filter((employee) => employee.status === "Active");
  const records = dailyRecordsForReport(reportDate);
  const employeeIdsWithRecords = new Set(records.map((record) => record.employee_id));

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge badge-warning">Requires report server</span>
      </div>

      ${
        reportMessage
          ? `<div class="alert ${
              reportMessageType === "error" ? "alert-error" : "alert-success"
            }">${escapeHtml(reportMessage)}</div>`
          : ""
      }

      <div class="report-toolbar">
        <label class="field compact-field">
          <span>Report Date</span>
          <input id="reportDate" type="date" value="${escapeHtml(reportDate)}" />
        </label>
        <button class="btn btn-outline" id="exportDailyExcel" type="button">Export Daily Excel</button>
        <button class="btn btn-primary report-primary-button" id="exportSelectedPdf" type="button">
          Export PDF พนักงานที่เลือก
        </button>
      </div>

      <p class="demo-note">
        Start the Python report server first: python report_server.py
      </p>
    </section>

    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Employee Code</th>
              <th>Fullname</th>
              <th>Records On Date</th>
              <th>Daily Total</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            ${
              employees.length
                ? employees.map((employee) =>
                    renderReportEmployeeRow(
                      employee,
                      employeeIdsWithRecords.has(employee.id)
                    )
                  ).join("")
                : `<tr><td colspan="6" class="empty-cell">No active employees found.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function dailyRecordsForReport(date) {
  return getProductionRecords().filter((record) => record.record_date === date);
}

function reportTotalsForEmployee(employeeId) {
  const records = dailyRecordsForReport(reportDate).filter(
    (record) => record.employee_id === employeeId
  );
  const totalAmount = records.reduce(
    (sum, record) => sum + Number(record.total_amount || 0),
    0
  );

  return { count: records.length, totalAmount };
}

function renderReportEmployeeRow(employee, hasRecords) {
  const totals = reportTotalsForEmployee(employee.id);
  const checked = selectedReportEmployeeIds.includes(employee.id) ? "checked" : "";

  return `
    <tr>
      <td>
        <input
          type="checkbox"
          data-report-employee="${employee.id}"
          ${checked}
          ${hasRecords ? "" : "disabled"}
        />
      </td>
      <td><strong>${escapeHtml(employee.emp_code)}</strong></td>
      <td>${escapeHtml(employee.fullname)}</td>
      <td>${totals.count}</td>
      <td>${money(totals.totalAmount)}</td>
      <td>
        <button
          class="btn btn-small btn-outline"
          data-employee-pdf="${employee.id}"
          ${hasRecords ? "" : "disabled"}
          type="button"
        >
          Download PDF
        </button>
      </td>
    </tr>
  `;
}

function reportExportError(error) {
  setReportMessage(
    `${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`,
    "error"
  );
  render();
}

function bindReportEvents() {
  document.querySelector("#reportDate")?.addEventListener("change", (event) => {
    reportDate = event.target.value || new Date().toISOString().slice(0, 10);
    reportMessage = "";
    render();
  });

  document.querySelectorAll("[data-report-employee]").forEach((input) => {
    input.addEventListener("change", () => {
      const employeeId = Number(input.dataset.reportEmployee);
      if (input.checked) {
        selectedReportEmployeeIds = [...new Set([...selectedReportEmployeeIds, employeeId])];
      } else {
        selectedReportEmployeeIds = selectedReportEmployeeIds.filter((id) => id !== employeeId);
      }
    });
  });

  document.querySelectorAll("[data-employee-pdf]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const employeeId = Number(button.dataset.employeePdf);
        await syncReportData();
        await downloadReport(
          `${REPORT_API_BASE}/reports/employee-daily-pdf?date=${encodeURIComponent(reportDate)}&employee_id=${employeeId}`
        );
        setReportMessage("Employee PDF downloaded.");
        render();
      } catch (error) {
        reportExportError(error);
      }
    });
  });

  document.querySelector("#exportSelectedPdf")?.addEventListener("click", async () => {
    if (!selectedReportEmployeeIds.length) {
      setReportMessage("Select at least one employee with records.", "error");
      render();
      return;
    }

    try {
      await downloadReport(`${REPORT_API_BASE}/reports/selected-employees-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildReportPayload())
      });
      setReportMessage("Selected employees PDF downloaded.");
      render();
    } catch (error) {
      reportExportError(error);
    }
  });

  document.querySelector("#exportDailyExcel")?.addEventListener("click", async () => {
    try {
      await syncReportData();
      await downloadReport(
        `${REPORT_API_BASE}/reports/daily-excel?date=${encodeURIComponent(reportDate)}`
      );
      setReportMessage("Daily Excel downloaded.");
      render();
    } catch (error) {
      reportExportError(error);
    }
  });
}

function renderTimeReport(user, moduleItem) {
  const editingTimeRecord = editingTimeRecordId
    ? getTimeRecords().find((record) => record.id === editingTimeRecordId)
    : null;
  const dailyTimeRecords = apiGetTimeRecordsForDate(timeRecordDate);
  const dailyEntryEmployeeCode = editingTimeRecord?.emp_code || timeEntryEmployeeCode || getNextAvailableTimeEntryEmployeeCode("", timeRecordDate);
  return `
    <section class="time-page">
      <section class="time-hero panel">
        <div>
          <p class="eyebrow">Attendance Management</p>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>บันทึกเวลาเข้า-ออก ปัดเวลาตามช่วงครึ่งชั่วโมง และคำนวณค่าแรงตามกติกาของโรงงาน</p>
        </div>
        <div class="time-hero-status">
          <span>วันที่ปฏิบัติงาน</span>
          <strong>${escapeHtml(timeRecordDate)}</strong>
        </div>
      </section>

      ${renderTimeModeSelector()}

      ${
        timeRecordMessage
          ? `<div class="alert ${timeRecordMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(timeRecordMessage)}</div>`
          : ""
      }

      ${timeEntryMode === "daily" ? `
      <section class="time-workspace">
        <section class="panel time-form-panel">
          <div class="time-section-head">
            <div>
              <span>Time Entry</span>
              <h3>บันทึกรายการลงเวลา</h3>
            </div>
            <b>มาตรฐานกะ 08:00-17:00</b>
          </div>
          <form class="time-entry-form" id="timeRecordForm">
            <label class="field">
              <span>วันที่</span>
              <input name="record_date" type="date" value="${escapeHtml(editingTimeRecord?.record_date || timeRecordDate)}" required />
            </label>
            <label class="field">
              <span>รหัสพนักงาน</span>
              <select name="emp_code" id="timeRecordEmployeeCode" required>
                ${renderWeeklyTimeEmployeeOptions(getOrderedActiveTimeEmployees(), dailyEntryEmployeeCode)}
              </select>
            </label>
            <label class="field">
              <span>เวลาเข้า</span>
              <input name="clock_in" type="time" value="${escapeHtml(editingTimeRecord?.clock_in || "08:00")}" required />
            </label>
            <label class="field">
              <span>เวลาออก</span>
              <input name="clock_out" type="time" value="${escapeHtml(editingTimeRecord?.clock_out || "17:00")}" required />
            </label>
            <button class="btn btn-primary form-submit" type="submit">${editingTimeRecord ? "บันทึกการแก้ไข" : "บันทึกรายการ"}</button>
            ${editingTimeRecord ? `<button class="btn btn-outline" id="cancelTimeRecordEdit" type="button">ยกเลิกแก้ไข</button>` : ""}
          </form>
          ${editingTimeRecord ? `<div class="alert alert-success">กำลังแก้ไขรายการ #${editingTimeRecord.id} ${escapeHtml(editingTimeRecord.emp_code)} ${escapeHtml(editingTimeRecord.clock_in)}-${escapeHtml(editingTimeRecord.clock_out)}</div>` : ""}
        </section>

        <section class="panel time-policy-panel">
          <div class="time-section-head">
            <div>
              <span>Work Rule</span>
              <h3>หลักเกณฑ์คำนวณเวลา</h3>
            </div>
          </div>
          <div class="time-policy-list">
            <div><span>การปัดเวลาเข้าและออก</span><strong>00-15 นาที = ต้นชั่วโมง · 16-45 นาที = ครึ่งชั่วโมง · 46-59 นาที = ชั่วโมงถัดไป</strong></div>
            <div><span>ช่วงพักกลางวัน</span><strong>12:00-13:00</strong></div>
            <div><span>เงื่อนไขการหักพัก</span><strong>เข้า ก่อน 12:00 และออก หลัง 13:00</strong></div>
            <div><span>ตัวอย่างมาตรฐาน</span><strong>08:00-17:00 = 8:00 ชั่วโมง</strong></div>
            <div><span>เริ่มงานช่วงบ่าย</span><strong>ไม่หักเวลาพัก</strong></div>
            <div><span>ค่าแรงไม่ครบ 8 ชั่วโมง</span><strong>ปัดเป็นบาท: ชั่วโมงสุทธิ × ฐานรายวันของพนักงาน ÷ 8</strong></div>
            <div><span>ฐานรายวัน</span><strong>กลุ่มปกติ ${TIME_DAILY_WAGE} บาท · กลุ่มพิเศษเลือกได้ 347 / 365 / 500 บาท</strong></div>
            <div><span>ค่าล่วงเวลา</span><strong>ส่วนที่เกิน 8 ชั่วโมง × ค่า OT ที่ตั้งไว้รายคน</strong></div>
            <div><span>กันกรอกซ้ำ</span><strong>พนักงาน 1 คนบันทึกได้ 1 รายการต่อวัน หากผิดให้กดแก้ไขรายการเดิม</strong></div>
            <div><span>ประวัติการแก้ไข</span><strong>แก้ภายใน 2 นาทีไม่ลง Log · เกิน 2 นาทีหรือข้ามวันจะลง Audit Log</strong></div>
          </div>
        </section>
      </section>
      ${renderDailyTimeRecordTable(dailyTimeRecords)}
      ` : renderWeeklyTimeEntry(user)}
    </section>
  `;
}

function renderDailyTimeRecordTable(records) {
  return `
    <section class="table-card weekly-saved-records">
      <div class="table-heading">รายการเวลาวันที่ ${escapeHtml(timeRecordDate)}</div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>รหัส</th>
              <th>ชื่อพนักงาน</th>
              <th>เข้า</th>
              <th>ออก</th>
              <th>พัก</th>
              <th>สุทธิ</th>
              <th>ผู้บันทึก</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length
                ? records.map(renderTimeRecordRow).join("")
                : `<tr><td colspan="9" class="empty-cell">ยังไม่มีรายการเวลาวันนี้</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderTimeRecordRow(record) {
  return `
    <tr>
      <td>${escapeHtml(record.record_date || "-")}</td>
      <td><strong>${escapeHtml(record.emp_code || "-")}</strong></td>
      <td>${escapeHtml(record.fullname || "-")}</td>
      <td>${escapeHtml(record.clock_in || "-")}</td>
      <td>${escapeHtml(record.clock_out || "-")}</td>
      <td>${escapeHtml(formatMinutesToHourText(record.break_minutes))}</td>
      <td><strong>${escapeHtml(formatMinutesToHourText(record.net_minutes))}</strong></td>
      <td>${escapeHtml(record.created_by || "-")}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-small btn-outline" data-edit-time-record="${record.id}" type="button">แก้ไข</button>
          <button class="btn btn-small btn-danger" data-delete-time-record="${record.id}" type="button">ลบ</button>
        </div>
      </td>
    </tr>
  `;
}

function renderWeeklyTimeEntry(user) {
  const weekDates = Array.from({ length: 7 }, (_, index) => addDaysToDate(timeRecordDate, index));
  const activeEmployees = getOrderedActiveTimeEmployees();
  const weeklyRecords = getTimeRecords()
    .filter((record) => {
      const recordDate = record.record_date || "";
      const matchDate = recordDate >= weekDates[0] && recordDate <= weekDates[6];
      const matchEmployee = !weeklyTimeEmployeeCode || record.emp_code === weeklyTimeEmployeeCode;
      return matchDate && matchEmployee;
    })
    .sort((a, b) =>
      `${a.record_date || ""} ${a.emp_code || ""} ${a.clock_in || ""}`.localeCompare(
        `${b.record_date || ""} ${b.emp_code || ""} ${b.clock_in || ""}`
      )
    );

  return `
    <section class="panel time-weekly-panel">
      <div class="time-section-head">
        <div>
          <span>Batch Import</span>
          <h3>บันทึกรายสัปดาห์</h3>
        </div>
        <b>สร้างตาราง 7 วันอัตโนมัติ</b>
      </div>

      <form id="weeklyTimeForm">
        <div class="weekly-control-bar">
          <label class="field">
            <span>รหัสพนักงาน / ชื่อพนักงาน</span>
            <select name="emp_code" required>
              ${renderWeeklyTimeEmployeeOptions(activeEmployees, weeklyTimeEmployeeCode)}
            </select>
          </label>
          <label class="field">
            <span>วันที่เริ่มต้น</span>
            <input id="weeklyStartDate" name="start_date" type="date" value="${escapeHtml(timeRecordDate)}" required />
          </label>
          <div class="weekly-auto-note">
            <span>สร้างวันที่ต่อเนื่อง</span>
            <strong>${escapeHtml(formatWeeklyDateLabel(weekDates[0]))} - ${escapeHtml(formatWeeklyDateLabel(weekDates[6]))}</strong>
          </div>
        </div>

        <div class="weekly-grid-scroll">
          <div class="weekly-grid">
            ${weekDates
              .map(
                (dateValue, index) => `
                  <section class="weekly-day-card" data-weekly-day="${index}">
                    <header>
                      <span>${escapeHtml(formatWeeklyDateLabel(dateValue))}</span>
                      <strong>${escapeHtml(dateValue)}</strong>
                    </header>
                    <input type="hidden" name="record_date_${index}" value="${escapeHtml(dateValue)}" />
                    <label>
                      <span>เข้า</span>
                      <input data-weekly-clock-in="${index}" name="clock_in_${index}" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="0800" value="${escapeHtml(weeklyTimeDraft[index]?.clock_in || "")}" />
                    </label>
                    <label>
                      <span>ออก</span>
                      <input data-weekly-clock-out="${index}" name="clock_out_${index}" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="1700" value="${escapeHtml(weeklyTimeDraft[index]?.clock_out || "")}" />
                    </label>
                    <div class="weekly-day-total">
                      <span>สุทธิ</span>
                      <strong data-weekly-total="${index}">0:00</strong>
                    </div>
                  </section>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="weekly-footer">
          <div class="time-policy-list weekly-policy">
            <div><span>ปัดเวลาเข้า-ออก</span><strong>00-15 = ต้นชม. · 16-45 = ครึ่งชม. · 46-59 = ชม.ถัดไป</strong></div>
            <div><span>พักกลางวัน</span><strong>12:00-13:00</strong></div>
            <div><span>เริ่มเที่ยงหรือบ่าย</span><strong>ไม่หักพัก</strong></div>
            <div><span>ค่าแรงปกติ</span><strong>ฐานรายวันของพนักงาน ÷ 8 × ชั่วโมงสุทธิ แล้วปัดเป็นบาท</strong></div>
            <div><span>ฐานครบ 8 ชั่วโมง</span><strong>กลุ่มปกติ ${TIME_DAILY_WAGE} บาท · กลุ่มพิเศษเลือกได้ 347 / 365 / 500 บาท</strong></div>
            <div><span>เกิน 8 ชั่วโมง</span><strong>คิด OT ตามค่าที่ตั้งไว้ในพนักงานแต่ละคน</strong></div>
            <div><span>กันกรอกซ้ำ</span><strong>วันไหนมีรายการแล้ว ระบบจะให้แก้รายการเดิมแทนการบันทึกซ้ำ</strong></div>
          </div>
          <div class="weekly-actions">
            <button class="btn btn-outline" id="clearWeeklyTime" type="button">ล้างตาราง</button>
            <button class="btn btn-primary report-primary-button" type="submit">บันทึกทั้งสัปดาห์</button>
          </div>
        </div>
      </form>

      <section class="table-card weekly-saved-records">
        <div class="table-heading">รายการเวลาที่บันทึกในสัปดาห์นี้</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>รหัส</th>
                <th>ชื่อพนักงาน</th>
                <th>เข้า</th>
                <th>ออก</th>
                <th>พัก</th>
                <th>สุทธิ</th>
                <th>ผู้บันทึก</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${
                weeklyRecords.length
                  ? weeklyRecords
                      .map(
                        (record) => renderTimeRecordRow(record)
                      )
                      .join("")
                  : `<tr><td colspan="9" class="empty-cell">ยังไม่มีรายการที่บันทึกในสัปดาห์นี้</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function setTimeRecordMessage(message, type = "success") {
  timeRecordMessage = message;
  timeRecordMessageType = type;
}

function setWeeklyDraftValue(index, key, value) {
  if (!weeklyTimeDraft[index]) {
    weeklyTimeDraft[index] = { clock_in: "", clock_out: "" };
  }
  weeklyTimeDraft[index][key] = value;
}

function syncWeeklyDraftFromForm() {
  for (let index = 0; index < 7; index += 1) {
    const clockInInput = document.querySelector(`[data-weekly-clock-in="${index}"]`);
    const clockOutInput = document.querySelector(`[data-weekly-clock-out="${index}"]`);
    setWeeklyDraftValue(
      index,
      "clock_in",
      clockInInput ? clockInInput.value : weeklyTimeDraft[index]?.clock_in || ""
    );
    setWeeklyDraftValue(
      index,
      "clock_out",
      clockOutInput ? clockOutInput.value : weeklyTimeDraft[index]?.clock_out || ""
    );
  }
}

function clearWeeklyTimeDraft() {
  weeklyTimeDraft = Array.from({ length: 7 }, () => ({ clock_in: "", clock_out: "" }));
}

function setTimeSummaryRangeToCurrentWeek() {
  timeSummaryStartDate = timeRecordDate;
  timeSummaryEndDate = addDaysToDate(timeRecordDate, 6);
  timeSummaryDepartment = "all";
}

function updateWeeklyDayTotals() {
  for (let index = 0; index < 7; index += 1) {
    const clockIn = normalizeClockText(document.querySelector(`[data-weekly-clock-in="${index}"]`)?.value || "");
    const clockOut = normalizeClockText(document.querySelector(`[data-weekly-clock-out="${index}"]`)?.value || "");
    const totalElement = document.querySelector(`[data-weekly-total="${index}"]`);
    if (!totalElement) continue;

    if (!clockIn || !clockOut) {
      totalElement.textContent = "0:00";
      totalElement.dataset.state = "empty";
      continue;
    }

    try {
      const calculation = calculateWorkMinutes(clockIn, clockOut);
      totalElement.textContent = formatMinutesToHourText(calculation.net_minutes);
      totalElement.dataset.state = "valid";
    } catch {
      totalElement.textContent = "ผิดเวลา";
      totalElement.dataset.state = "error";
    }
  }
}

function focusWeeklyInput(selector) {
  const nextInput = document.querySelector(selector);
  if (!nextInput) return false;
  nextInput.focus();
  nextInput.select?.();
  return true;
}

function handleWeeklyTimeEnter(event) {
  if (event.key !== "Enter") return;

  const target = event.currentTarget;
  const inIndex = target.dataset.weeklyClockIn;
  const outIndex = target.dataset.weeklyClockOut;
  event.preventDefault();
  normalizeClockInput(target);
  updateWeeklyDayTotals();

  if (inIndex !== undefined) {
    focusWeeklyInput(`[data-weekly-clock-out="${inIndex}"]`);
    return;
  }

  if (outIndex !== undefined) {
    const nextIndex = Number(outIndex) + 1;
    if (nextIndex < 7 && focusWeeklyInput(`[data-weekly-clock-in="${nextIndex}"]`)) {
      return;
    }
    document.querySelector("#weeklyTimeForm button[type=\"submit\"]")?.focus();
  }
}

function bindTimeReportEvents(user) {
  document.querySelectorAll("[data-time-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      timeEntryMode = button.dataset.timeMode || "daily";
      timeRecordMessage = "";
      editingTimeRecordId = null;
      render();
    });
  });

  document.querySelector("#weeklyStartDate")?.addEventListener("change", (event) => {
    syncWeeklyDraftFromForm();
    timeRecordDate = event.target.value || new Date().toISOString().slice(0, 10);
    timeEntryEmployeeCode = getNextAvailableTimeEntryEmployeeCode("", timeRecordDate);
    timeRecordMessage = "";
    render();
  });

  document.querySelector("#weeklyTimeForm select[name=\"emp_code\"]")?.addEventListener("change", (event) => {
    syncWeeklyDraftFromForm();
    weeklyTimeEmployeeCode = event.target.value || "";
    timeRecordMessage = "";
    render();
  });

  document.querySelectorAll("[data-weekly-clock-in], [data-weekly-clock-out]").forEach((input) => {
    input.addEventListener("input", () => {
      const inIndex = input.dataset.weeklyClockIn;
      const outIndex = input.dataset.weeklyClockOut;
      if (inIndex !== undefined) setWeeklyDraftValue(Number(inIndex), "clock_in", input.value);
      if (outIndex !== undefined) setWeeklyDraftValue(Number(outIndex), "clock_out", input.value);
      updateWeeklyDayTotals();
    });
    input.addEventListener("blur", () => {
      normalizeClockInput(input);
      const inIndex = input.dataset.weeklyClockIn;
      const outIndex = input.dataset.weeklyClockOut;
      if (inIndex !== undefined) setWeeklyDraftValue(Number(inIndex), "clock_in", input.value);
      if (outIndex !== undefined) setWeeklyDraftValue(Number(outIndex), "clock_out", input.value);
      updateWeeklyDayTotals();
    });
    input.addEventListener("keydown", handleWeeklyTimeEnter);
  });

  document.querySelector("#clearWeeklyTime")?.addEventListener("click", () => {
    clearWeeklyTimeDraft();
    document.querySelectorAll("[data-weekly-clock-in], [data-weekly-clock-out]").forEach((input) => {
      input.value = "";
    });
    updateWeeklyDayTotals();
  });

  document.querySelector("#weeklyTimeForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    syncWeeklyDraftFromForm();
    const form = new FormData(event.currentTarget);
    const empCode = String(form.get("emp_code") || "").trim();
    weeklyTimeEmployeeCode = empCode;
    const errors = [];
    let savedCount = 0;

    if (!empCode) {
      setTimeRecordMessage("กรุณาเลือกพนักงานสำหรับบันทึกรายสัปดาห์", "error");
      render();
      return;
    }

    for (let index = 0; index < 7; index += 1) {
      const clockIn = normalizeClockText(form.get(`clock_in_${index}`));
      const clockOut = normalizeClockText(form.get(`clock_out_${index}`));
      const recordDate = String(form.get(`record_date_${index}`) || "").trim();

      if (!clockIn && !clockOut) continue;
      if (!clockIn || !clockOut) {
        errors.push(`${recordDate}: กรุณากรอกเวลาเข้าและออกให้ครบ`);
        continue;
      }

      try {
        apiCreateTimeRecord(
          {
            record_date: recordDate,
            emp_code: empCode,
            clock_in: clockIn,
            clock_out: clockOut
          },
          user
        );
        savedCount += 1;
      } catch (error) {
        errors.push(`${recordDate}: ${error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"}`);
      }
    }

    if (!savedCount && !errors.length) {
      setTimeRecordMessage("กรุณากรอกเวลาอย่างน้อย 1 วัน", "error");
      render();
      return;
    }

    if (errors.length) {
      setTimeRecordMessage(`บันทึกสำเร็จ ${savedCount} วัน / ต้องแก้ไข ${errors.length} วัน: ${errors.join(" | ")}`, "error");
    } else {
      clearWeeklyTimeDraft();
      setTimeRecordMessage(`บันทึกรายสัปดาห์สำเร็จ ${savedCount} วัน ข้อมูลอยู่ในตารางสัปดาห์นี้และหน้าสรุปข้อมูลเวลาเข้างาน`);
    }
    setTimeSummaryRangeToCurrentWeek();
    render();
  });

  if (document.querySelector("#weeklyTimeForm")) {
    updateWeeklyDayTotals();
  }

  document.querySelectorAll("[data-edit-time-record]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.editTimeRecord);
      const record = getTimeRecords().find((item) => item.id === id);
      if (!record) {
        setTimeRecordMessage("ไม่พบรายการเวลาที่ต้องการแก้ไข", "error");
        render();
        return;
      }
      editingTimeRecordId = id;
      timeEntryMode = "daily";
      timeRecordDate = record.record_date || timeRecordDate;
      timeEntryEmployeeCode = record.emp_code || "";
      setTimeRecordMessage("แก้เวลาให้ถูกต้องแล้วกดบันทึกการแก้ไข");
      render();
    });
  });

  document.querySelectorAll("[data-delete-time-record]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.deleteTimeRecord);
      if (!window.confirm("ยืนยันลบรายการเวลานี้?")) return;
      apiDeleteTimeRecord(id, user);
      if (editingTimeRecordId === id) editingTimeRecordId = null;
      setTimeRecordMessage("ลบรายการเวลาเรียบร้อยแล้ว");
      render();
    });
  });

  document.querySelector("#cancelTimeRecordEdit")?.addEventListener("click", () => {
    editingTimeRecordId = null;
    timeEntryEmployeeCode = getNextAvailableTimeEntryEmployeeCode(timeEntryEmployeeCode, timeRecordDate);
    setTimeRecordMessage("ยกเลิกการแก้ไขแล้ว");
    render();
  });

  document.querySelector("#timeRecordForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    timeRecordDate = String(form.get("record_date") || timeRecordDate);

    try {
      const wasEditing = Boolean(editingTimeRecordId);
      const payload = {
        record_date: timeRecordDate,
        emp_code: form.get("emp_code"),
        clock_in: form.get("clock_in"),
        clock_out: form.get("clock_out")
      };
      const record = editingTimeRecordId
        ? apiUpdateTimeRecord(editingTimeRecordId, payload, user)
        : apiCreateTimeRecord(payload, user);
      const actionText = wasEditing ? "แก้ไข" : "บันทึก";
      const nextEmployeeCode = wasEditing ? record.emp_code : getNextAvailableTimeEntryEmployeeCode(record.emp_code, timeRecordDate);
      editingTimeRecordId = null;
      timeEntryEmployeeCode = nextEmployeeCode;
      setTimeRecordMessage(`${actionText} ${record.emp_code} ${record.clock_in}-${record.clock_out} สุทธิ ${formatMinutesToHourText(record.net_minutes)} ชั่วโมง${nextEmployeeCode ? ` · ถัดไป ${nextEmployeeCode}` : " · ครบทุกคนในวันนี้แล้ว"}`);
      render();
    } catch (error) {
      setTimeRecordMessage(error instanceof Error ? error.message : "บันทึกเวลาไม่สำเร็จ", "error");
      render();
    }
  });

  document.querySelector("#timeRecordForm input[name='record_date']")?.addEventListener("change", (event) => {
    timeRecordDate = event.target.value || new Date().toISOString().slice(0, 10);
    if (!editingTimeRecordId) {
      timeEntryEmployeeCode = getNextAvailableTimeEntryEmployeeCode("", timeRecordDate);
    }
    timeRecordMessage = "";
    render();
  });

  const dailyTimeForm = document.querySelector("#timeRecordForm");
  if (dailyTimeForm && !editingTimeRecordId) {
    const clockInInput = dailyTimeForm.querySelector("input[name='clock_in']");
    clockInInput?.focus();
    clockInInput?.select?.();
  }

}

function renderEmployeeManagementHub(user, moduleItem) {
  const weightEmployees = getEmployees();
  const timeEmployees = getTimeEmployees();
  const activeWeightEmployees = weightEmployees.filter((employee) => employee.status === "Active").length;
  const activeTimeEmployees = timeEmployees.filter((employee) => employee.status === "Active").length;

  return `
    <section class="panel settings-home-panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>แยกฐานพนักงานออกเป็น 2 กลุ่ม: กลุ่มชั่งน้ำหนักผลไม้ และกลุ่มบันทึกเวลาทำงาน</p>
        </div>
        <span class="badge badge-success">แยกฐานข้อมูล</span>
      </div>
      <div class="metrics-grid metrics-spaced">
        <div class="metric-card"><span>พนักงานเหมาน้ำหนัก</span><strong>${activeWeightEmployees.toLocaleString("th-TH")}</strong><small>จาก ${weightEmployees.length.toLocaleString("th-TH")} คน</small></div>
        <div class="metric-card"><span>พนักงานตามเวลา</span><strong>${activeTimeEmployees.toLocaleString("th-TH")}</strong><small>จาก ${timeEmployees.length.toLocaleString("th-TH")} คน</small></div>
        <div class="metric-card"><span>ฐานปกติ</span><strong>${TIME_DAILY_WAGE.toLocaleString("th-TH")}</strong><small>บาทต่อวัน</small></div>
        <div class="metric-card"><span>ฐานพิเศษ</span><strong>${TIME_SPECIAL_DAILY_WAGE.toLocaleString("th-TH")}</strong><small>บาทต่อวัน</small></div>
      </div>
    </section>

    <section class="panel">
      <div class="section-title-row">
        <h3>เลือกประเภทพนักงาน</h3>
        <p class="muted-text">พนักงานสองกลุ่มนี้ใช้คนละฐานและคนละวิธีคิดเงิน</p>
      </div>
      <div class="settings-grid settings-grid-wide">
        <button class="settings-tile" data-route="production-employees" type="button">
          <strong>พนักงานเหมาน้ำหนัก</strong>
          <span>ใช้ฟังก์ชั่นจัดการพนักงานเดิม สำหรับบันทึกน้ำหนักผลไม้และคิดเงินตามผลผลิต</span>
        </button>
        <button class="settings-tile" data-route="time-employees" type="button">
          <strong>พนักงานตามเวลา</strong>
          <span>สร้าง แก้ไข ลบพนักงานที่ใช้กับหน้าเวลา พร้อมแยกกลุ่มปกติ/พิเศษและค่า OT รายคน</span>
        </button>
      </div>
    </section>
  `;
}

function renderEmployees(user, moduleItem) {
  const employees = apiGetEmployees(employeeSearch);
  const allEmployees = getEmployees();
  const activeEmployees = allEmployees.filter((employee) => employee.status === "Active").length;
  const payGroups = new Set(allEmployees.map(getEmployeePayGroup));
  const canManage = canManageEmployees(user);
  const canDelete = canDeleteEmployees(user);
  const editingEmployee = editingEmployeeId
    ? getEmployees().find((employee) => employee.id === editingEmployeeId)
    : null;

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge ${canManage ? "badge-success" : "badge-warning"}">
          ${canManage ? "Can add/edit" : "View only"}
        </span>
      </div>
      <div class="metrics-grid metrics-spaced">
        <div class="metric-card"><span>พนักงานทั้งหมด</span><strong>${allEmployees.length.toLocaleString("th-TH")}</strong><small>ในฐานข้อมูลเครื่องนี้</small></div>
        <div class="metric-card"><span>ใช้งานอยู่</span><strong>${activeEmployees.toLocaleString("th-TH")}</strong><small>พร้อมเลือกในหน้าผลผลิต</small></div>
        <div class="metric-card"><span>กลุ่มรับเงิน</span><strong>${payGroups.size.toLocaleString("th-TH")}</strong><small>กลุ่มที่ใช้อยู่</small></div>
        <div class="metric-card"><span>ผลค้นหา</span><strong>${employees.length.toLocaleString("th-TH")}</strong><small>${employeeSearch ? escapeHtml(employeeSearch) : "ทั้งหมด"}</small></div>
      </div>

      <div class="toolbar">
        <form class="search-form" id="employeeSearchForm">
          <label class="search-box">
            <span>Search</span>
            <input
              id="employeeSearch"
              name="employeeSearch"
              placeholder="Search emp_code or fullname"
              value="${escapeHtml(employeeSearch)}"
            />
          </label>
          <button class="btn btn-outline" type="submit">Search</button>
          <button class="btn btn-outline" id="clearEmployeeSearch" type="button">Clear</button>
        </form>
      </div>
    </section>

    ${
      employeeMessage
        ? `<div class="alert ${employeeMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(employeeMessage)}</div>`
        : ""
    }

    ${
      canManage
        ? renderEmployeeForm(editingEmployee)
        : `<section class="panel compact-panel">
            <p class="muted-text">Your role can view employees only. Add, edit, and delete are restricted.</p>
          </section>`
    }

    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Emp Code</th>
              <th>Fullname</th>
              <th>Department</th>
              <th>Pay Group</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              employees.length
                ? employees
                    .map((employee) =>
                      renderEmployeeRow(employee, canManage, canDelete)
                    )
                    .join("")
                : `<tr><td colspan="9" class="empty-cell">No employees found.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderEmployeeForm(employee) {
  const mode = employee ? "Edit employee" : "Add employee";
  const currentPayGroup = employee ? getEmployeePayGroup(employee) : primaryPayGroups[0];
  const selectedPayGroup = primaryPayGroups.includes(currentPayGroup)
    ? currentPayGroup
    : primaryPayGroups[0];
  const payGroups = [...primaryPayGroups];

  return `
    <section class="panel">
      <div class="section-title-row">
        <h3>${mode}</h3>
        ${
          employee
            ? `<button class="btn btn-outline" id="cancelEmployeeEdit" type="button">Cancel edit</button>`
            : ""
        }
      </div>
      <form class="employee-form" id="employeeForm">
        <input type="hidden" name="id" value="${employee ? employee.id : ""}" />

        <label class="field">
          <span>Emp Code</span>
          <input name="emp_code" inputmode="numeric" maxlength="8" pattern="[0-9]{2,8}" value="${employee ? escapeHtml(employee.emp_code) : ""}" required />
        </label>

        <label class="field">
          <span>Fullname</span>
          <input name="fullname" value="${employee ? escapeHtml(employee.fullname) : ""}" required />
        </label>

        <label class="field">
          <span>Department</span>
          <input name="department" value="${employee ? escapeHtml(employee.department) : ""}" required />
        </label>

        <label class="field">
          <span>กลุ่มรับเงิน</span>
          <select name="pay_group" class="pay-group-select ${getPayGroupToneClass(selectedPayGroup)}" data-pay-group-select required>
            <option value="">เลือกกลุ่มรับเงิน</option>
            ${payGroups
              .map(
                (group) =>
                  `<option value="${escapeHtml(group)}" ${
                    selectedPayGroup === group ? "selected" : ""
                  }>${escapeHtml(group)}</option>`
              )
              .join("")}
          </select>
        </label>

        <label class="field">
          <span>Status</span>
          <select name="status" required>
            ${["Active", "Inactive"]
              .map(
                (status) =>
                  `<option value="${status}" ${employee?.status === status ? "selected" : ""}>${status}</option>`
              )
              .join("")}
          </select>
        </label>

        <button class="btn btn-primary form-submit" type="submit">
          ${employee ? "Save changes" : "Add employee"}
        </button>
      </form>
    </section>
  `;
}

function renderEmployeeRow(employee, canManage, canDelete) {
  const statusClass =
    employee.status === "Active" ? "badge-success" : "badge-danger";

  return `
    <tr>
      <td>${employee.id}</td>
      <td><strong>${escapeHtml(employee.emp_code)}</strong></td>
      <td>${escapeHtml(employee.fullname)}</td>
      <td>${escapeHtml(employee.department)}</td>
      <td>${renderPayGroupBadge(getEmployeePayGroup(employee))}</td>
      <td><span class="badge ${statusClass}">${escapeHtml(employee.status)}</span></td>
      <td>${formatDate(employee.created_at)}</td>
      <td>${formatDate(employee.updated_at)}</td>
      <td>
        <div class="row-actions">
          ${
            canManage
              ? `<button class="btn btn-small btn-outline" data-edit-employee="${employee.id}" type="button">Edit</button>`
              : `<span class="muted-text">View</span>`
          }
          ${
            canDelete
              ? `<button class="btn btn-small btn-danger" data-delete-employee="${employee.id}" type="button">Delete</button>`
              : ""
          }
        </div>
      </td>
    </tr>
  `;
}

function updatePayGroupSelectTone(select) {
  select.classList.remove(
    "pay-group-factory",
    "pay-group-non",
    "pay-group-pui",
    "pay-group-custom"
  );
  select.classList.add(getPayGroupToneClass(select.value));
}

function bindEmployeeEvents(user) {
  document.querySelectorAll("[data-pay-group-select]").forEach((select) => {
    updatePayGroupSelectTone(select);
    select.addEventListener("change", () => updatePayGroupSelectTone(select));
  });

  document.querySelector("#employeeSearchForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    employeeSearch = String(form.get("employeeSearch") || "");
    try {
      const data = await cloudApiRequest(`/api/employees?search=${encodeURIComponent(employeeSearch)}`);
      const cloudEmployees = Array.isArray(data.data) ? data.data.map(normalizeCloudEmployee) : [];
      saveEmployees(cloudEmployees);
    } catch (error) {
      employeeMessage = error instanceof Error ? error.message : "โหลดพนักงานจากฐานกลางไม่สำเร็จ";
      employeeMessageType = "error";
    }
    render();
  });

  document.querySelector("#clearEmployeeSearch")?.addEventListener("click", () => {
    employeeSearch = "";
    render();
  });

  document.querySelector("#cancelEmployeeEdit")?.addEventListener("click", () => {
    editingEmployeeId = null;
    employeeMessage = "";
    render();
  });

  document.querySelector("input[name='emp_code']")?.addEventListener("input", (event) => {
    event.target.value = normalizeEmployeeCodeInput(event.target.value);
  });

  document.querySelector("#employeeForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!canManageEmployees(user)) {
      window.alert("Your role cannot add or edit employees.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const id = Number(form.get("id"));
    const empCode = normalizeEmployeeCodeInput(form.get("emp_code"));
    if (empCode.length < 2) {
      employeeMessage = "รหัสพนักงานต้องเป็นตัวเลขอย่างน้อย 2 หลัก";
      employeeMessageType = "error";
      render();
      return;
    }
    const payload = {
      emp_code: empCode,
      fullname: String(form.get("fullname")),
      department: String(form.get("department")),
      pay_group: String(form.get("pay_group") || "").trim(),
      shift: editingEmployeeId
        ? getEmployees().find((employee) => employee.id === editingEmployeeId)?.shift || ""
        : "",
      status: String(form.get("status"))
    };

    if (!payload.pay_group) {
      employeeMessage = "กรุณาระบุกลุ่มรับเงินของพนักงาน";
      employeeMessageType = "error";
      render();
      return;
    }

    try {
      if (id) {
        await apiUpdateEmployee(id, payload);
        employeeMessage = `Updated employee ${payload.emp_code}.`;
      } else {
        await apiCreateEmployee(payload);
        employeeMessage = `Added employee ${payload.emp_code}.`;
      }
      employeeMessageType = "success";
      editingEmployeeId = null;
      render();
    } catch (error) {
      employeeMessage = error instanceof Error ? error.message : "Save failed.";
      employeeMessageType = "error";
      render();
    }
  });

  document.querySelectorAll("[data-edit-employee]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!canManageEmployees(user)) return;
      editingEmployeeId = Number(button.dataset.editEmployee);
      employeeMessage = "";
      render();
    });
  });

  document.querySelectorAll("[data-delete-employee]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!canDeleteEmployees(user)) {
        window.alert("Only C5/C6/C7 can delete employees.");
        return;
      }

      const id = Number(button.dataset.deleteEmployee);
      const employee = getEmployees().find((item) => item.id === id);
      const confirmed = window.confirm(
        `Delete employee ${employee?.emp_code || id}?`
      );

      if (confirmed) {
        try {
          await apiDeleteEmployee(id);
          if (editingEmployeeId === id) editingEmployeeId = null;
          employeeMessage = `Deleted employee ${employee?.emp_code || id}.`;
          employeeMessageType = "success";
          render();
        } catch (error) {
          employeeMessage = error instanceof Error ? error.message : "Delete failed.";
          employeeMessageType = "error";
          render();
        }
      }
    });
  });
}

function renderTimeEmployees(user, moduleItem) {
  const employees = apiGetTimeEmployees(timeEmployeeSearch);
  const allEmployees = getTimeEmployees();
  const activeEmployees = allEmployees.filter((employee) => employee.status === "Active").length;
  const specialEmployees = allEmployees.filter((employee) => isSpecialTimeEmployeeType(employee.employee_type)).length;
  const canManage = canManageEmployees(user);
  const canDelete = canDeleteEmployees(user);
  const editingEmployee = editingTimeEmployeeId
    ? getTimeEmployees().find((employee) => employee.id === editingTimeEmployeeId)
    : null;

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge ${canManage ? "badge-success" : "badge-warning"}">
          ${canManage ? "Can add/edit" : "View only"}
        </span>
      </div>
      <div class="metrics-grid metrics-spaced">
        <div class="metric-card"><span>พนักงานตามเวลาทั้งหมด</span><strong>${allEmployees.length.toLocaleString("th-TH")}</strong><small>ฐานแยกจากพนักงานน้ำหนัก</small></div>
        <div class="metric-card"><span>ใช้งานอยู่</span><strong>${activeEmployees.toLocaleString("th-TH")}</strong><small>พร้อมเลือกในหน้าบันทึกเวลา</small></div>
        <div class="metric-card"><span>กลุ่มพิเศษ</span><strong>${specialEmployees.toLocaleString("th-TH")}</strong><small>รองรับฐาน 347 / 365 / 500</small></div>
        <div class="metric-card"><span>ผลค้นหา</span><strong>${employees.length.toLocaleString("th-TH")}</strong><small>${timeEmployeeSearch ? escapeHtml(timeEmployeeSearch) : "ทั้งหมด"}</small></div>
      </div>

      <div class="toolbar">
        <form class="search-form" id="timeEmployeeSearchForm">
          <label class="search-box">
            <span>Search</span>
            <input
              id="timeEmployeeSearch"
              name="timeEmployeeSearch"
              placeholder="ค้นหารหัส ชื่อ หรือประเภท"
              value="${escapeHtml(timeEmployeeSearch)}"
            />
          </label>
          <button class="btn btn-outline" type="submit">Search</button>
          <button class="btn btn-outline" id="clearTimeEmployeeSearch" type="button">Clear</button>
        </form>
      </div>
    </section>

    ${
      timeEmployeeMessage
        ? `<div class="alert ${timeEmployeeMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(timeEmployeeMessage)}</div>`
        : ""
    }

    ${
      canManage
        ? renderTimeEmployeeForm(editingEmployee)
        : `<section class="panel compact-panel">
            <p class="muted-text">Your role can view time employees only. Add, edit, and delete are restricted.</p>
          </section>`
    }

    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>รหัสพนักงาน</th>
              <th>ชื่อพนักงาน</th>
              <th>ประเภท</th>
              <th>ฐานรายวัน</th>
              <th>OT</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              employees.length
                ? employees.map((employee) => renderTimeEmployeeRow(employee, canManage, canDelete)).join("")
                : `<tr><td colspan="9" class="empty-cell">ยังไม่มีพนักงานตามเวลา</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderTimeEmployeeForm(employee) {
  const mode = employee ? "แก้ไขพนักงานตามเวลา" : "เพิ่มพนักงานตามเวลา";
  const selectedType = normalizeTimeEmployeeType(employee?.employee_type);
  return `
    <section class="panel">
      <div class="section-title-row">
        <h3>${mode}</h3>
        ${
          employee
            ? `<button class="btn btn-outline" id="cancelTimeEmployeeEdit" type="button">Cancel edit</button>`
            : ""
        }
      </div>
      <form class="employee-form" id="timeEmployeeForm">
        <input type="hidden" name="id" value="${employee ? employee.id : ""}" />

        <label class="field">
          <span>หมายเลขพนักงาน</span>
          <input name="emp_code" inputmode="numeric" maxlength="8" pattern="[0-9]{2,8}" value="${employee ? escapeHtml(employee.emp_code) : ""}" required />
        </label>

        <label class="field">
          <span>ชื่อพนักงาน</span>
          <input name="fullname" value="${employee ? escapeHtml(employee.fullname) : ""}" required />
        </label>

        <label class="field">
          <span>กลุ่มพนักงาน</span>
          <select name="employee_type" required>
            ${timeEmployeeTypeOptions
              .map(
                (option) =>
                  `<option value="${option.id}" ${selectedType === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`
              )
              .join("")}
          </select>
        </label>

        <label class="field">
          <span>OT บาท/ชม.</span>
          <input name="ot_hourly_rate" type="number" min="0" step="1" value="${employee ? escapeHtml(String(employee.ot_hourly_rate || TIME_OT_HOURLY_RATE)) : TIME_OT_HOURLY_RATE}" required />
        </label>

        <button class="btn btn-primary form-submit" type="submit">
          ${employee ? "Save changes" : "Add time employee"}
        </button>
      </form>
    </section>
  `;
}

function renderTimeEmployeeRow(employee, canManage, canDelete) {
  const typeOption = getTimeEmployeeTypeOption(employee.employee_type);
  return `
    <tr>
      <td>${employee.id}</td>
      <td><strong>${escapeHtml(employee.emp_code)}</strong></td>
      <td>${escapeHtml(employee.fullname)}</td>
      <td><span class="badge ${typeOption.category === "special" ? "badge-warning" : "badge-success"}">${escapeHtml(typeOption.shortLabel || typeOption.label)}</span></td>
      <td>${typeOption.dailyWage.toLocaleString("th-TH")} บาท</td>
      <td>${(Number(employee.ot_hourly_rate) || TIME_OT_HOURLY_RATE).toLocaleString("th-TH")} บาท/ชม.</td>
      <td>${formatDate(employee.created_at)}</td>
      <td>${formatDate(employee.updated_at)}</td>
      <td>
        <div class="row-actions">
          ${
            canManage
              ? `<button class="btn btn-small btn-outline" data-edit-time-employee="${employee.id}" type="button">Edit</button>`
              : `<span class="muted-text">View</span>`
          }
          ${
            canDelete
              ? `<button class="btn btn-small btn-danger" data-delete-time-employee="${employee.id}" type="button">Delete</button>`
              : ""
          }
        </div>
      </td>
    </tr>
  `;
}

function bindTimeEmployeeEvents(user) {
  document.querySelector("#timeEmployeeSearchForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    timeEmployeeSearch = String(form.get("timeEmployeeSearch") || "");
    try {
      const data = await cloudApiRequest(`/api/time-employees?search=${encodeURIComponent(timeEmployeeSearch)}`);
      const cloudEmployees = Array.isArray(data.data) ? data.data.map(normalizeCloudTimeEmployee) : [];
      saveTimeEmployees(cloudEmployees);
    } catch (error) {
      timeEmployeeMessage = error instanceof Error ? error.message : "โหลดพนักงานตามเวลาจากฐานกลางไม่สำเร็จ";
      timeEmployeeMessageType = "error";
    }
    render();
  });

  document.querySelector("#clearTimeEmployeeSearch")?.addEventListener("click", () => {
    timeEmployeeSearch = "";
    render();
  });

  document.querySelector("#cancelTimeEmployeeEdit")?.addEventListener("click", () => {
    editingTimeEmployeeId = null;
    timeEmployeeMessage = "";
    render();
  });

  document.querySelector("#timeEmployeeForm input[name='emp_code']")?.addEventListener("input", (event) => {
    event.target.value = normalizeTimeEmployeeCodeInput(event.target.value);
  });

  document.querySelector("#timeEmployeeForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canManageEmployees(user)) {
      window.alert("Your role cannot add or edit employees.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const id = Number(form.get("id"));
    const empCode = normalizeTimeEmployeeCodeInput(form.get("emp_code"));
    if (empCode.length < 2) {
      timeEmployeeMessage = "หมายเลขพนักงานต้องเป็นตัวเลขอย่างน้อย 2 หลัก";
      timeEmployeeMessageType = "error";
      render();
      return;
    }

    const payload = {
      emp_code: empCode,
      fullname: String(form.get("fullname") || ""),
      employee_type: String(form.get("employee_type") || "normal"),
      ot_hourly_rate: Number(form.get("ot_hourly_rate")) || TIME_OT_HOURLY_RATE
    };

    if (!payload.fullname.trim()) {
      timeEmployeeMessage = "กรุณากรอกชื่อพนักงาน";
      timeEmployeeMessageType = "error";
      render();
      return;
    }

    try {
      if (id) {
        await apiUpdateTimeEmployee(id, payload);
        timeEmployeeMessage = `Updated time employee ${payload.emp_code}.`;
      } else {
        await apiCreateTimeEmployee(payload);
        timeEmployeeMessage = `Added time employee ${payload.emp_code}.`;
      }
      timeEmployeeMessageType = "success";
      editingTimeEmployeeId = null;
      render();
    } catch (error) {
      timeEmployeeMessage = error instanceof Error ? error.message : "Save failed.";
      timeEmployeeMessageType = "error";
      render();
    }
  });

  document.querySelectorAll("[data-edit-time-employee]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!canManageEmployees(user)) return;
      editingTimeEmployeeId = Number(button.dataset.editTimeEmployee);
      timeEmployeeMessage = "";
      render();
    });
  });

  document.querySelectorAll("[data-delete-time-employee]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!canDeleteEmployees(user)) {
        window.alert("Only C5/C6/C7 can delete employees.");
        return;
      }
      const id = Number(button.dataset.deleteTimeEmployee);
      const employee = getTimeEmployees().find((item) => item.id === id);
      const confirmed = window.confirm(`Delete time employee ${employee?.emp_code || id}?`);
      if (!confirmed) return;

      try {
        await apiDeleteTimeEmployee(id);
        if (editingTimeEmployeeId === id) editingTimeEmployeeId = null;
        timeEmployeeMessage = `Deleted time employee ${employee?.emp_code || id}.`;
        timeEmployeeMessageType = "success";
        render();
      } catch (error) {
        timeEmployeeMessage = error instanceof Error ? error.message : "Delete failed.";
        timeEmployeeMessageType = "error";
        render();
      }
    });
  });
}

function renderProductionRow(row) {
  const badgeClass = {
    Approved: "badge-success",
    Pending: "badge-warning",
    Review: "badge-danger"
  }[row.status];

  return `
    <tr>
      <td>${escapeHtml(row.date)}</td>
      <td>${escapeHtml(row.line)}</td>
      <td>${escapeHtml(row.employee)}</td>
      <td>${row.quantity.toLocaleString("th-TH")}</td>
      <td>${money(row.wage)}</td>
      <td><span class="badge ${badgeClass}">${escapeHtml(row.status)}</span></td>
    </tr>
  `;
}

function renderAccessDenied(user, route) {
  const moduleItem = modules.find((item) => item.id === route);
  app.innerHTML = `
    <main class="access-page">
      <section class="access-card">
        <p class="eyebrow">สิทธิ์การเข้าใช้งาน</p>
        <h1>เมนูนี้ถูกล็อก</h1>
        <p class="intro-text">
          ${escapeHtml(user.fullname)} ระดับ ${escapeHtml(getUserLevel(user))}
          ยังไม่มีสิทธิ์เข้าเมนู ${escapeHtml(moduleItem?.label || route)}
        </p>
        <button class="btn btn-primary" id="backButton" type="button">กลับหน้าหลัก</button>
      </section>
    </main>
  `;

  document.querySelector("#backButton").addEventListener("click", () => {
    location.hash = `#/${getDefaultRouteForUser(user)}`;
  });
}

function renderDashboard(moduleItem) {
  const user = getSession()?.user;
  const selectedDate = getSelectedSummaryDate();
  summaryDate = selectedDate;

  const records = getDashboardRecordsForDate(selectedDate);
  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);
  const exportRange = getSummaryExportRange();

  return `
    <section class="summary-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>ดูข้อมูลสรุปตามวันที่ เลือกช่วงวันที่เพื่อ Export เป็นไฟล์เดียวได้</p>
        </div>
        <div class="summary-filters">
          <label class="summary-date-field">
            <span>วันที่แสดงผล</span>
            <input id="summaryDate" type="date" value="${escapeHtml(selectedDate)}" />
          </label>
          <span class="summary-mode-pill">${records.length.toLocaleString("th-TH")} รายการ</span>
        </div>
      </div>

      ${
        summaryExportMessage
          ? `<div class="alert ${summaryExportMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(summaryExportMessage)}</div>`
          : ""
      }

      <div class="summary-metrics">
        <div class="metric-card metric-green">
          <span>น้ำหนักรวมทั้งหมด</span>
          <strong>${numberText(totals.total)} กก.</strong>
          <small>น้ำ ${numberText(totals.water)} กก. | ดอก ${numberText(totals.flower)} กก.</small>
        </div>
        <div class="metric-card metric-blue">
          <span>ยอดเงินรวม</span>
          <strong>${money(totals.amount)}</strong>
          <small>คำนวณจากข้อมูลวันที่เลือก</small>
        </div>
        <div class="metric-card metric-purple">
          <span>พนักงานที่มีรายการ</span>
          <strong>${totals.people.size.toLocaleString("th-TH")} คน</strong>
          <small>ไม่นับรหัสซ้ำในวันเดียวกัน</small>
        </div>
        <div class="metric-card metric-orange">
          <span>จำนวนกอง</span>
          <strong>${pileSummaries.length.toLocaleString("th-TH")}</strong>
          <small>${escapeHtml(selectedDate)}</small>
        </div>
      </div>

      <section class="summary-export-panel">
        <div>
          <strong>Export ข้อมูลสรุป</strong>
          <span>เลือกช่วงวันที่และข้อมูลที่ต้องการส่งออก</span>
        </div>
        <div class="summary-export-range">
          <label>
            <span>จากวันที่</span>
            <input id="summaryExportStart" type="date" value="${escapeHtml(exportRange.startDate)}" />
          </label>
          <label>
            <span>ถึงวันที่</span>
            <input id="summaryExportEnd" type="date" value="${escapeHtml(exportRange.endDate)}" />
          </label>
        </div>
        <div class="summary-export-options">
          <label><input type="checkbox" data-summary-export-option="overview" ${summaryExportOptions.overview ? "checked" : ""} /> ภาพรวม</label>
          <label><input type="checkbox" data-summary-export-option="piles" ${summaryExportOptions.piles ? "checked" : ""} /> สรุปตามกอง</label>
          <label><input type="checkbox" data-summary-export-option="details" ${summaryExportOptions.details ? "checked" : ""} /> รายละเอียด</label>
        </div>
        <button class="btn btn-primary summary-export-button" id="toggleSummaryMainExportMenu" type="button">Export</button>
        ${
          summaryMainExportMenuOpen
            ? `
              <div class="time-summary-export-menu summary-main-export-menu">
                <button class="time-export-choice" id="exportSummaryFullDetails" type="button" ${canExportFullDetails(user) ? "" : "disabled"}>
                  <strong>Export รายละเอียดทั้งหมด</strong>
                  <span>ไฟล์ Excel รวมรายละเอียดผลผลิต เวลาเข้างาน และสรุปตามช่วงวันที่</span>
                </button>
                <button class="time-export-choice" id="exportSummaryTimeReceipt" type="button">
                  <strong>Export ใบเสร็จเวลา</strong>
                  <span>ไฟล์ PDF A4 แนวนอน ซ้ายต้นฉบับ / ขวาสำเนาสำหรับเซ็นรับเงิน</span>
                </button>
              </div>
            `
            : ""
        }
      </section>

      <section class="summary-grid">
        <section class="panel chart-panel">
          <div class="section-title-row">
            <h3>กราฟเปรียบเทียบน้ำหนัก</h3>
            <div class="chart-legend">
              <span><i class="legend-water"></i>น้ำ</span>
              <span><i class="legend-flower"></i>ดอก</span>
            </div>
          </div>
          <div class="summary-chart">
            ${pileSummaries.length ? renderDashboardBars(pileSummaries) : `<div class="empty-state">ยังไม่มีข้อมูลสำหรับวันที่เลือก</div>`}
          </div>
        </section>

        <section class="table-card">
          <div class="table-heading">สรุปตามกอง</div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>กอง</th>
                  <th>น้ำหนักน้ำ</th>
                  <th>น้ำหนักดอก</th>
                  <th>รวม</th>
                  <th>รวมเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${
                  pileSummaries.length
                    ? pileSummaries.map(renderPileSummaryRow).join("")
                    : `<tr><td colspan="5" class="empty-cell">ยังไม่มีข้อมูลสำหรับวันที่เลือก</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดรายการ</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>เวลา</th>
                <th>รหัสพนักงาน</th>
                <th>ชื่อพนักงาน</th>
                <th>กอง</th>
                <th>น้ำหนักน้ำ</th>
                <th>น้ำหนักดอก</th>
                <th>ทุเรียน A-E</th>
                <th>น้ำหนักรวม</th>
                <th>รวมเงิน</th>
                <th>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>
              ${
                records.length
                  ? records.map(renderDashboardDetailRow).join("")
                  : `<tr><td colspan="10" class="empty-cell">ยังไม่มีข้อมูลสำหรับวันที่เลือก</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function renderDashboardBars(pileSummaries) {
  const maxValue = Math.max(
    1,
    ...pileSummaries.map((item) => Math.max(item.water, item.flower, item.gradeTotal || 0))
  );

  return pileSummaries
    .map(
      (item) => `
        <div class="summary-bar-group">
          <div class="summary-bars">
            <div class="summary-bar water" style="height:${Math.max(8, (item.water / maxValue) * 100)}%">
              <span>${numberText(item.water)}</span>
            </div>
            <div class="summary-bar flower" style="height:${Math.max(8, (item.flower / maxValue) * 100)}%">
              <span>${numberText(item.flower)}</span>
            </div>
            ${(item.gradeTotal || 0) > 0 ? `<div class="summary-bar durian" style="height:${Math.max(8, ((item.gradeTotal || 0) / maxValue) * 100)}%"><span>${numberText(item.gradeTotal)}</span></div>` : ""}
          </div>
          <strong>กอง ${item.pile}</strong>
        </div>`
    )
    .join("");
}

function renderPileSummaryRow(item) {
  return `
    <tr>
      <td>กอง ${item.pile}</td>
      <td>${numberText(item.water)}</td>
      <td>${numberText(item.flower)}</td>
      <td><strong>${numberText(item.total)}</strong>${(item.gradeTotal || 0) > 0 ? `<small class="grade-breakdown">${DURIAN_GRADES.map((grade) => `${grade} ${numberText(item.grades[grade])}`).join(" · ")}</small>` : ""}</td>
      <td><strong>${money(item.amount)}</strong></td>
    </tr>
  `;
}

function renderDashboardDetailRow(record) {
  const employee = getEmployees().find((item) => item.id === record.employee_id);
  const isDurian = isDurianFruit(record.fruit_type);

  return `
    <tr>
      <td>${escapeHtml(record.record_time || "")}</td>
      <td><strong>${escapeHtml(record.emp_code || "")}</strong></td>
      <td>${escapeHtml(record.employee_name || employee?.fullname || "")}</td>
      <td>กอง ${escapeHtml(record.pile_no || record.pile || "")}</td>
      <td>${isDurian ? "-" : numberText(record.water_weight || record.water)}</td>
      <td>${isDurian ? "-" : numberText(record.flower_weight || record.flower)}</td>
      <td>${isDurian ? escapeHtml(formatDurianGradeBreakdown(record)) : "-"}</td>
      <td><strong>${numberText(getRecordTotalWeight(record))}</strong></td>
      <td><strong>${money(record.total_amount || record.grand_total || 0)}</strong></td>
      <td>${escapeHtml(record.created_by || "")}</td>
    </tr>
  `;
}

function exportSummaryData() {
  const exportRange = getSummaryExportRange();
  const selectedSections = Object.entries(summaryExportOptions)
    .filter(([, enabled]) => enabled)
    .map(([section]) => section);

  if (!selectedSections.length) {
    setSummaryExportMessage("กรุณาเลือกข้อมูลที่ต้องการ Export อย่างน้อย 1 รายการ", "error");
    render();
    return;
  }

  const records = getDashboardRecordsForRange(exportRange.startDate, exportRange.endDate);
  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);
  const rangeLabel =
    exportRange.startDate === exportRange.endDate
      ? exportRange.startDate
      : `${exportRange.startDate} ถึง ${exportRange.endDate}`;
  const lines = [
    csvRow(["รายงานสรุปผลทั้งหมด"]),
    csvRow(["ช่วงวันที่", rangeLabel]),
    ""
  ];

  if (summaryExportOptions.overview) {
    lines.push(csvRow(["ภาพรวม"]));
    lines.push(csvRow(["หัวข้อ", "ค่า"]));
    lines.push(csvRow(["น้ำหนักรวมทั้งหมด (กก.)", totals.total]));
    lines.push(csvRow(["น้ำหนักน้ำ (กก.)", totals.water]));
    lines.push(csvRow(["น้ำหนักดอก (กก.)", totals.flower]));
    lines.push(csvRow(["ทุเรียนเกรด A-E", formatDurianGradeBreakdown(totals)]));
    lines.push(csvRow(["ยอดเงินรวม", totals.amount]));
    lines.push(csvRow(["พนักงานที่มีรายการ", totals.people.size]));
    lines.push(csvRow(["จำนวนรายการ", records.length]));
    lines.push("");
  }

  if (summaryExportOptions.piles) {
    lines.push(csvRow(["สรุปตามกอง"]));
    lines.push(csvRow(["กอง", "น้ำหนักน้ำ (กก.)", "น้ำหนักดอก (กก.)", "ทุเรียนเกรด A-E", "รวม (กก.)", "รวมเงิน"]));
    pileSummaries.forEach((item) => {
      lines.push(csvRow([`กอง ${item.pile}`, item.water, item.flower, formatDurianGradeBreakdown(item), item.total, item.amount]));
    });
    lines.push("");
  }

  if (summaryExportOptions.details) {
    lines.push(csvRow(["รายละเอียด"]));
    lines.push(csvRow(["วันที่", "เวลา", "รหัสพนักงาน", "ชื่อพนักงาน", "กอง", "น้ำหนักน้ำ", "น้ำหนักดอก", "ทุเรียนเกรด A-E", "น้ำหนักรวม", "รวมเงิน", "ผู้บันทึก"]));
    records.forEach((record) => {
      const employee = getEmployees().find((item) => item.id === record.employee_id);
      lines.push(
        csvRow([
          getRecordDate(record),
          record.record_time || "",
          record.emp_code || "",
          record.employee_name || employee?.fullname || "",
          record.pile_no || record.pile || "",
          record.water_weight || record.water || 0,
          record.flower_weight || record.flower || 0,
          isDurianFruit(productionFruitTypeForRecord(record)) ? formatDurianGradeBreakdown(record) : "-",
          getRecordTotalWeight(record),
          record.total_amount || record.grand_total || 0,
          record.created_by || ""
        ])
      );
    });
  }

  downloadTextFile(
    `summary-${exportRange.startDate}-to-${exportRange.endDate}.csv`,
    `\ufeff${lines.join("\r\n")}`
  );
  setSummaryExportMessage(`Export ข้อมูลช่วงวันที่ ${rangeLabel} เรียบร้อยแล้ว`);
  render();
}

function renderDashboard(moduleItem) {
  const selectedDate = getSelectedSummaryDate();
  summaryDate = selectedDate;

  const records = getDashboardRecordsForDate(selectedDate);
  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);
  const exportRange = getSummaryExportRange();

  const headerHtml = `
    <div class="summary-header">
      <div>
        <h2>${escapeHtml(moduleItem.label)}</h2>
        <p>เลือกวันที่เพื่อดูข้อมูลของวันนั้น ข้อมูลในหน้านี้จะเปลี่ยนตามวันที่ที่เลือก</p>
      </div>
      <div class="summary-filters">
        <label class="summary-date-field">
          <span>วันที่แสดงผล</span>
          <input id="summaryDate" type="date" value="${escapeHtml(selectedDate)}" />
        </label>
        <span class="summary-mode-pill">${records.length.toLocaleString("th-TH")} รายการ</span>
      </div>
    </div>
  `;

  if (!records.length) {
    return `
      <section class="summary-page">
        ${headerHtml}
        <section class="panel">
          <div class="empty-state">ยังไม่มีข้อมูลสำหรับวันที่ ${escapeHtml(selectedDate)}</div>
        </section>
      </section>
    `;
  }

  return `
    <section class="summary-page">
      ${headerHtml}

      ${
        summaryExportMessage
          ? `<div class="alert ${summaryExportMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(summaryExportMessage)}</div>`
          : ""
      }

      <div class="summary-metrics">
        <div class="metric-card metric-green">
          <span>น้ำหนักรวมทั้งหมด</span>
          <strong>${numberText(totals.total)} กก.</strong>
          <small>น้ำ ${numberText(totals.water)} กก. | ดอก ${numberText(totals.flower)} กก.</small>
        </div>
        <div class="metric-card metric-blue">
          <span>ยอดเงินรวม</span>
          <strong>${money(totals.amount)}</strong>
          <small>คำนวณจากข้อมูลวันที่เลือก</small>
        </div>
        <div class="metric-card metric-purple">
          <span>พนักงานที่มีรายการ</span>
          <strong>${totals.people.size.toLocaleString("th-TH")} คน</strong>
          <small>ไม่นับรหัสซ้ำในวันเดียวกัน</small>
        </div>
        <div class="metric-card metric-orange">
          <span>จำนวนกอง</span>
          <strong>${pileSummaries.length.toLocaleString("th-TH")}</strong>
          <small>${escapeHtml(selectedDate)}</small>
        </div>
      </div>

      <section class="summary-export-panel">
        <div>
          <strong>Export ข้อมูลสรุป</strong>
          <span>เลือกช่วงวันที่และข้อมูลที่ต้องการส่งออก</span>
        </div>
        <div class="summary-export-range">
          <label>
            <span>จากวันที่</span>
            <input id="summaryExportStart" type="date" value="${escapeHtml(exportRange.startDate)}" />
          </label>
          <label>
            <span>ถึงวันที่</span>
            <input id="summaryExportEnd" type="date" value="${escapeHtml(exportRange.endDate)}" />
          </label>
        </div>
        <div class="summary-export-options">
          <label><input type="checkbox" data-summary-export-option="overview" ${summaryExportOptions.overview ? "checked" : ""} /> ภาพรวม</label>
          <label><input type="checkbox" data-summary-export-option="piles" ${summaryExportOptions.piles ? "checked" : ""} /> สรุปตามกอง</label>
          <label><input type="checkbox" data-summary-export-option="details" ${summaryExportOptions.details ? "checked" : ""} /> รายละเอียด</label>
        </div>
        <button class="btn btn-primary summary-export-button" id="exportSummaryData" type="button">Export</button>
      </section>

      <section class="summary-grid">
        <section class="panel chart-panel">
          <div class="section-title-row">
            <h3>กราฟเปรียบเทียบน้ำหนัก</h3>
            <div class="chart-legend">
              <span><i class="legend-water"></i>น้ำ</span>
              <span><i class="legend-flower"></i>ดอก</span>
            </div>
          </div>
          <div class="summary-chart">
            ${renderDashboardBars(pileSummaries)}
          </div>
        </section>

        <section class="table-card">
          <div class="table-heading">สรุปตามกอง</div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>กอง</th>
                  <th>น้ำหนักน้ำ</th>
                  <th>น้ำหนักดอก</th>
                  <th>รวม</th>
                  <th>รวมเงิน</th>
                </tr>
              </thead>
              <tbody>${pileSummaries.map(renderPileSummaryRow).join("")}</tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดรายการ</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>เวลา</th>
                <th>รหัสพนักงาน</th>
                <th>ชื่อพนักงาน</th>
                <th>กอง</th>
                <th>น้ำหนักน้ำ</th>
                <th>น้ำหนักดอก</th>
                <th>รวมเงิน</th>
                <th>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>${records.map(renderDashboardDetailRow).join("")}</tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function renderDashboard(user, moduleItem) {
  const dateLabel = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());
  const canViewSummary = canOpen(user, "summary-all");

  return `
    <section class="factory-dashboard">
      <div class="factory-hero">
        <div class="factory-hero-copy">
          <p class="eyebrow">Pitsamai Frozen Fruits Co., Ltd.</p>
          <h2>ยินดีต้อนรับสู่ระบบโรงงาน</h2>
          <p>
            ศูนย์ควบคุมงานบันทึกผลผลิตและค่าแรงประจำวัน
            สำหรับฝ่ายผลิต ฝ่ายบุคคล และผู้ดูแลระบบ
          </p>
          <div class="factory-hero-actions">
            <button class="btn btn-primary" type="button" data-route="production">บันทึกผลผลิต</button>
            ${
              canViewSummary
                ? `<button class="btn btn-outline" type="button" data-route="summary-all">ดูสรุปข้อมูลทั้งหมด</button>`
                : `<button class="btn btn-outline btn-locked" type="button" data-route="summary-all">สรุปข้อมูลถูกล็อก</button>`
            }
          </div>
        </div>
        <div class="factory-hero-brand">
          <img src="assets/pitsamai-logo.png" alt="Pitsamai" />
          <span>Factory Wage System</span>
        </div>
      </div>

      <div class="factory-status-strip">
        <div>
          <span>วันที่ใช้งาน</span>
          <strong>${escapeHtml(dateLabel)}</strong>
        </div>
        <div>
          <span>ผู้ใช้งาน</span>
          <strong>${escapeHtml(user.fullname)}</strong>
        </div>
        <div>
          <span>สิทธิ์ระบบ</span>
          <strong>${escapeHtml(user.role_label || user.role)}</strong>
        </div>
      </div>

      <section class="factory-section">
        <div class="section-title-row">
          <div>
            <h3>เมนูงานหลัก</h3>
            <p>เลือกงานที่ต้องการดำเนินการในระบบโรงงาน</p>
          </div>
        </div>
        <div class="factory-action-grid">
          ${renderDashboardActionCard(user, "production", "▣", "บันทึกผลผลิต", "กรอกน้ำหนักน้ำ ดอก และค่าแรงของพนักงาน")}
          ${renderDashboardActionCard(user, "summary-all", "▤", "สรุปข้อมูลทั้งหมด", "เปิดหน้ารายงานตัวเลข กราฟ และตารางรายละเอียด")}
          ${renderDashboardActionCard(user, "summary-person", "◎", "สรุปรายบุคคล", "ตรวจสอบผลงานแยกตามพนักงาน")}
          ${renderDashboardActionCard(user, "time-report", "◷", "เวลาทำงาน", "ดูและจัดการข้อมูลเวลาเข้างานตามสิทธิ์")}
          ${renderDashboardActionCard(user, "reports", "▧", "ส่งออกรายงาน", "สร้างไฟล์ PDF และ Excel สำหรับส่งต่อ")}
          ${renderDashboardActionCard(user, "settings", "⚙", "ตั้งค่าระบบ", "จัดการข้อมูลหลักและสิทธิ์ผู้ใช้งาน")}
        </div>
      </section>

      <section class="factory-section">
        <div class="factory-notice">
          <div>
            <h3>แนวทางการใช้งานประจำวัน</h3>
            <p>เริ่มจากบันทึกผลผลิต ตรวจสอบความถูกต้อง แล้วจึงเปิดหน้าสรุปเพื่อพิมพ์หรือส่งต่อรายงาน</p>
          </div>
          ${
            canViewSummary
              ? `<button class="btn btn-outline" type="button" data-route="summary-all">ไปหน้าสรุป</button>`
              : `<button class="btn btn-primary" type="button" data-route="production">เริ่มบันทึกผลผลิต</button>`
          }
        </div>
      </section>
    </section>
  `;
}

function getTimeSummaryRange() {
  const fallbackDate = new Date().toISOString().slice(0, 10);
  const startDate = timeSummaryStartDate || fallbackDate;
  const endDate = timeSummaryEndDate || startDate;

  if (startDate <= endDate) {
    return { startDate, endDate };
  }

  return { startDate: endDate, endDate: startDate };
}

function getTimeSummaryDepartments() {
  const departments = new Set();
  getEmployees().forEach((employee) => {
    if (employee.department) departments.add(employee.department);
  });
  getTimeRecords().forEach((record) => {
    if (record.department) departments.add(record.department);
  });

  return ["all", ...Array.from(departments).sort((a, b) => a.localeCompare(b, "th"))];
}

function getTimeSummaryRecords() {
  const range = getTimeSummaryRange();

  return getTimeRecords()
    .filter((record) => {
      const recordDate = String(record.record_date || "");
      const matchDate = recordDate >= range.startDate && recordDate <= range.endDate;
      const matchDepartment =
        timeSummaryDepartment === "all" || record.department === timeSummaryDepartment;
      return matchDate && matchDepartment;
    })
    .sort((a, b) =>
      `${a.record_date || ""} ${a.emp_code || ""} ${a.clock_in || ""}`.localeCompare(
        `${b.record_date || ""} ${b.emp_code || ""} ${b.clock_in || ""}`,
        "th"
      )
    );
}

function getTimeRecordsForExportRange(range, department = "all") {
  return getTimeRecords()
    .filter((record) => {
      const recordDate = String(record.record_date || "");
      const matchDate = recordDate >= range.startDate && recordDate <= range.endDate;
      const matchDepartment = department === "all" || record.department === department;
      return matchDate && matchDepartment;
    })
    .sort((a, b) =>
      `${a.record_date || ""} ${a.emp_code || ""} ${a.clock_in || ""}`.localeCompare(
        `${b.record_date || ""} ${b.emp_code || ""} ${b.clock_in || ""}`,
        "th"
      )
    );
}

function isLateTime(clockIn) {
  const minutes = parseTimeToMinutes(clockIn);
  return minutes !== null && minutes > 8 * 60;
}

function isEarlyOutTime(clockOut) {
  const minutes = parseTimeToMinutes(clockOut);
  return minutes !== null && minutes < 17 * 60;
}

function summarizeTimeRecords(records) {
  return records.reduce(
    (summary, record) => {
      summary.totalRecords += 1;
      summary.totalRawMinutes += Number(record.raw_minutes) || 0;
      summary.totalBreakMinutes += Number(record.break_minutes) || 0;
      summary.totalNetMinutes += Number(record.net_minutes) || 0;
      summary.employeeKeys.add(record.employee_id || record.emp_code || record.fullname || "");
      summary.workDays.add(record.record_date || "");
      if (isLateTime(record.clock_in)) summary.lateCount += 1;
      if (isEarlyOutTime(record.clock_out)) summary.earlyOutCount += 1;
      return summary;
    },
    {
      totalRecords: 0,
      totalRawMinutes: 0,
      totalBreakMinutes: 0,
      totalNetMinutes: 0,
      lateCount: 0,
      earlyOutCount: 0,
      employeeKeys: new Set(),
      workDays: new Set()
    }
  );
}

function getTimeSummaryByDate(records) {
  const summaries = new Map();

  records.forEach((record) => {
    const dateKey = record.record_date || "-";
    if (!summaries.has(dateKey)) {
      summaries.set(dateKey, {
        date: dateKey,
        records: 0,
        employees: new Set(),
        netMinutes: 0,
        lateCount: 0,
        earlyOutCount: 0
      });
    }

    const summary = summaries.get(dateKey);
    summary.records += 1;
    summary.employees.add(record.employee_id || record.emp_code || record.fullname || "");
    summary.netMinutes += Number(record.net_minutes) || 0;
    if (isLateTime(record.clock_in)) summary.lateCount += 1;
    if (isEarlyOutTime(record.clock_out)) summary.earlyOutCount += 1;
  });

  return Array.from(summaries.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getTimeSummaryByEmployee(records) {
  const summaries = new Map();

  records.forEach((record) => {
    const key = record.employee_id || record.emp_code || record.fullname || "";
    if (!summaries.has(key)) {
      summaries.set(key, {
        empCode: record.emp_code || "-",
        fullname: record.fullname || "-",
        department: record.department || "-",
        records: 0,
        days: new Set(),
        netMinutes: 0,
        lateCount: 0,
        earlyOutCount: 0,
        firstIn: record.clock_in || "-",
        lastOut: record.clock_out || "-"
      });
    }

    const summary = summaries.get(key);
    summary.records += 1;
    summary.days.add(record.record_date || "");
    summary.netMinutes += Number(record.net_minutes) || 0;
    if (isLateTime(record.clock_in)) summary.lateCount += 1;
    if (isEarlyOutTime(record.clock_out)) summary.earlyOutCount += 1;
    if (record.clock_in && record.clock_in < summary.firstIn) summary.firstIn = record.clock_in;
    if (record.clock_out && record.clock_out > summary.lastOut) summary.lastOut = record.clock_out;
  });

  return Array.from(summaries.values()).sort((a, b) =>
    `${a.empCode} ${a.fullname}`.localeCompare(`${b.empCode} ${b.fullname}`, "th")
  );
}

function formatDecimalHours(minutes) {
  return ((Number(minutes) || 0) / 60).toFixed(2);
}

function setTimeSummaryMessage(message, type = "success") {
  timeSummaryMessage = message;
  timeSummaryMessageType = type;
}

function getTimeSummaryExportOptions() {
  return {
    overview: document.querySelector("[data-time-export-option='overview']")?.checked ?? true,
    daily: document.querySelector("[data-time-export-option='daily']")?.checked ?? true,
    employees: document.querySelector("[data-time-export-option='employees']")?.checked ?? true,
    details: document.querySelector("[data-time-export-option='details']")?.checked ?? true
  };
}

function timeReceiptNumber(empCode, range) {
  return `TR-${range.startDate.replaceAll("-", "")}-${empCode}`;
}

function formatBaht(value) {
  return `${money(value).replace("฿", "").trim()} บาท`;
}

function getTimeNormalHourlyRate(record) {
  return Number(record.normal_hourly_rate) || ((Number(record.daily_wage) || TIME_DAILY_WAGE) / TIME_STANDARD_HOURS);
}

function calculateTimeNormalWageAmount(normalHours, record = {}) {
  const dailyWage = Number(record.daily_wage) || TIME_DAILY_WAGE;
  if (dailyWage === TIME_SPECIAL_DAILY_WAGE) {
    const roundedHalfHour = Math.round(normalHours * 2) / 2;
    if (Object.prototype.hasOwnProperty.call(TIME_SPECIAL_WAGE_TABLE, roundedHalfHour)) {
      return TIME_SPECIAL_WAGE_TABLE[roundedHalfHour];
    }
  }
  if (normalHours >= TIME_STANDARD_HOURS) return dailyWage;
  return Math.round(normalHours * getTimeNormalHourlyRate(record));
}

function getTimeReceiptRow(record) {
  const netMinutes = Number(record.net_minutes) || 0;
  const normalMinutes = Math.min(netMinutes, TIME_STANDARD_HOURS * 60);
  const otMinutes = Math.max(0, netMinutes - normalMinutes);
  const normalHours = normalMinutes / 60;
  const otHours = otMinutes / 60;
  const otHourlyRate = Number(record.ot_hourly_rate) || TIME_OT_HOURLY_RATE;
  const normalAmount = calculateTimeNormalWageAmount(normalHours, record);
  const otAmount = otHours * otHourlyRate;

  return {
    ...record,
    normalHours,
    otHours,
    normalAmount,
    otAmount,
    totalAmount: normalAmount + otAmount
  };
}

function combineTimeRecordsByEmployeeDate(records) {
  const dailyRecords = new Map();
  const sortedRecords = [...records].sort((a, b) =>
    `${a.record_date || ""} ${a.clock_in || ""}`.localeCompare(
      `${b.record_date || ""} ${b.clock_in || ""}`
    )
  );

  sortedRecords.forEach((record) => {
    const employeeKey = record.employee_id || record.emp_code || record.fullname || "";
    const key = `${employeeKey}::${record.record_date || ""}`;
    if (!dailyRecords.has(key)) {
      dailyRecords.set(key, {
        ...record,
        clock_ins: [],
        clock_outs: [],
        raw_minutes: 0,
        break_minutes: 0,
        net_minutes: 0,
        round_count: 0
      });
    }

    const dailyRecord = dailyRecords.get(key);
    dailyRecord.clock_ins.push(record.clock_in || "-");
    dailyRecord.clock_outs.push(record.clock_out || "-");
    dailyRecord.raw_minutes += Number(record.raw_minutes) || 0;
    dailyRecord.break_minutes += Number(record.break_minutes) || 0;
    dailyRecord.net_minutes += Number(record.net_minutes) || 0;
    dailyRecord.round_count += 1;
  });

  return Array.from(dailyRecords.values()).map((record) => ({
    ...record,
    clock_in: record.clock_ins.join(" / "),
    clock_out: record.clock_outs.join(" / ")
  }));
}

function getTimeReceiptGroups(records) {
  const groups = new Map();

  combineTimeRecordsByEmployeeDate(records).forEach((record) => {
    const key = record.employee_id || record.emp_code || record.fullname || "";
    if (!groups.has(key)) {
      groups.set(key, {
        employee_id: record.employee_id,
        emp_code: record.emp_code || "-",
        fullname: record.fullname || "-",
        department: record.department || "-",
        rows: []
      });
    }
    groups.get(key).rows.push(getTimeReceiptRow(record));
  });

  return Array.from(groups.values()).map((group) => {
    group.rows.sort((a, b) =>
      `${a.record_date || ""} ${a.clock_in || ""}`.localeCompare(`${b.record_date || ""} ${b.clock_in || ""}`)
    );
    group.totals = group.rows.reduce(
      (totals, row) => {
        totals.normalHours += row.normalHours;
        totals.otHours += row.otHours;
        totals.normalAmount += row.normalAmount;
        totals.otAmount += row.otAmount;
        totals.totalAmount += row.totalAmount;
        return totals;
      },
      { normalHours: 0, otHours: 0, normalAmount: 0, otAmount: 0, totalAmount: 0 }
    );
    return group;
  });
}

function timeReceiptRowsHtml(rows) {
  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.record_date || "-")}</td>
          <td>${escapeHtml(row.clock_in || "-")}</td>
          <td>${escapeHtml(row.clock_out || "-")}</td>
          <td>${numberText(row.normalHours)}</td>
          <td>${numberText(row.otHours)}</td>
          <td>${numberText(row.normalAmount)}</td>
          <td>${numberText(row.otAmount)}</td>
          <td>${numberText(row.totalAmount)}</td>
        </tr>`
    )
    .join("");
}

function renderTimeReceiptPanel(group, range, logoDataUrl, copy = false) {
  const totals = group.totals;
  const receiptNo = timeReceiptNumber(group.emp_code, range);
  const issuedAt = formatLiveClock();

  return `
    <section class="receipt-panel ${copy ? "copy" : ""}">
      ${copy ? `<div class="copy-watermark">สำเนา</div>` : ""}
      <header class="receipt-header">
        <img src="${logoDataUrl}" alt="Pitsamai" />
        <div>
          <h1>Pitsamai Frozen Fruits</h1>
          <h2>ใบเสร็จเวลาและค่าแรง</h2>
        </div>
      </header>

      <div class="receipt-meta">
        <div><span>เลขที่เอกสาร</span><strong>${escapeHtml(receiptNo)}</strong></div>
        <div><span>วันที่ออก</span><strong>${escapeHtml(issuedAt)}</strong></div>
        <div><span>ช่วงวันที่</span><strong>${escapeHtml(range.startDate)} - ${escapeHtml(range.endDate)}</strong></div>
      </div>

      <div class="receipt-employee">
        <div><span>รหัสพนักงาน</span><strong>${escapeHtml(group.emp_code)}</strong></div>
        <div><span>ชื่อพนักงาน</span><strong>${escapeHtml(group.fullname)}</strong></div>
        <div><span>แผนก</span><strong>${escapeHtml(group.department)}</strong></div>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>เข้า</th>
            <th>ออก</th>
            <th>ปกติ</th>
            <th>OT</th>
            <th>เงินปกติ</th>
            <th>เงิน OT</th>
            <th>รวม</th>
          </tr>
        </thead>
        <tbody>
          ${timeReceiptRowsHtml(group.rows)}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">รวม</td>
            <td>${numberText(totals.normalHours)}</td>
            <td>${numberText(totals.otHours)}</td>
            <td>${numberText(totals.normalAmount)}</td>
            <td>${numberText(totals.otAmount)}</td>
            <td>${numberText(totals.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="receipt-summary">
        <div><span>รวมชั่วโมงปกติ</span><strong>${numberText(totals.normalHours)} ชม.</strong></div>
        <div><span>รวม OT</span><strong>${numberText(totals.otHours)} ชม.</strong></div>
        <div><span>ค่าแรงปกติ</span><strong>${formatBaht(totals.normalAmount)}</strong></div>
        <div><span>ค่า OT</span><strong>${formatBaht(totals.otAmount)}</strong></div>
        <div class="net"><span>ยอดรับสุทธิ</span><strong>${formatBaht(totals.totalAmount)}</strong></div>
      </div>

      <footer class="receipt-signatures">
        <div>
          <span>ผู้รับเงิน</span>
          <i></i>
          <small>(........................................)</small>
        </div>
        <div>
          <span>ผู้จ่ายเงิน</span>
          <i></i>
          <small>(........................................)</small>
        </div>
      </footer>
    </section>
  `;
}

function buildTimeReceiptHtml(records, logoDataUrl) {
  const range = getTimeSummaryRange();
  const groups = getTimeReceiptGroups(records);
  const pages = groups
    .map(
      (group) => `
        <main class="receipt-page">
          ${renderTimeReceiptPanel(group, range, logoDataUrl, false)}
          <div class="receipt-divider"></div>
          ${renderTimeReceiptPanel(group, range, logoDataUrl, true)}
        </main>`
    )
    .join("");

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ใบเสร็จเวลาและค่าแรง</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #10231d; font-family: Tahoma, Arial, sans-serif; background: #ffffff; }
    .receipt-page { position: relative; display: grid; grid-template-columns: 1fr 1px 1fr; gap: 8mm; width: 100%; min-height: 190mm; page-break-after: always; padding: 2mm; }
    .receipt-page:last-child { page-break-after: auto; }
    .receipt-divider { border-left: 1px dashed #6b7280; }
    .receipt-panel { position: relative; overflow: hidden; display: grid; grid-template-rows: auto auto auto 1fr auto auto; gap: 4mm; min-width: 0; padding: 5mm; border: 1.5px solid #0f5f50; border-radius: 3mm; background: #ffffff; }
    .receipt-header { display: grid; grid-template-columns: 21mm 1fr; gap: 4mm; align-items: center; border-bottom: 1px solid #83b9af; padding-bottom: 3mm; }
    .receipt-header img { width: 20mm; height: 20mm; object-fit: contain; }
    h1 { margin: 0; color: #0b4f42; font-size: 18pt; line-height: 1.05; }
    h2 { margin: 1.5mm 0 0; color: #0b4f42; font-size: 13pt; line-height: 1.1; }
    .receipt-meta, .receipt-employee { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid #9bc8c0; border-radius: 2mm; overflow: hidden; }
    .receipt-meta div, .receipt-employee div { padding: 2mm 2.5mm; border-right: 1px solid #c9ded9; }
    .receipt-meta div:last-child, .receipt-employee div:last-child { border-right: 0; }
    span { display: block; color: #52635e; font-size: 7.5pt; font-weight: 700; }
    strong { display: block; margin-top: 1mm; color: #111827; font-size: 8.5pt; }
    .receipt-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.2pt; }
    .receipt-table th { color: #ffffff; background: #075f4e; border: 1px solid #075f4e; padding: 1.6mm 1mm; }
    .receipt-table td { text-align: center; border: 1px solid #bdd7d2; padding: 1.25mm 0.8mm; }
    .receipt-table tbody tr:nth-child(even) td { background: #f3fbf9; }
    .receipt-table tfoot td { color: #063f35; background: #dff4ef; font-weight: 700; }
    .receipt-summary { align-self: end; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border: 1px solid #0f5f50; border-radius: 2mm; overflow: hidden; }
    .receipt-summary div { min-height: 15mm; padding: 2mm; text-align: center; border-right: 1px solid #9bc8c0; background: #f7fcfb; }
    .receipt-summary div:last-child { border-right: 0; }
    .receipt-summary .net { background: #e0f4ef; }
    .receipt-summary .net strong { color: #064e3b; font-size: 12pt; }
    .receipt-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; padding-top: 2mm; }
    .receipt-signatures div { text-align: center; }
    .receipt-signatures i { display: block; height: 10mm; border-bottom: 1px dotted #111827; }
    .receipt-signatures small { display: block; margin-top: 1.5mm; font-size: 7.5pt; color: #374151; }
    .copy-watermark { position: absolute; inset: 0; display: grid; place-items: center; transform: rotate(-28deg); color: rgba(15, 95, 80, 0.08); font-size: 78pt; font-weight: 900; pointer-events: none; z-index: 0; }
    .receipt-panel > *:not(.copy-watermark) { position: relative; z-index: 1; }
    @media print { body { background: #ffffff; } }
  </style>
</head>
<body>
${pages}
</body>
</html>`;
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function getReceiptLogoDataUrl() {
  try {
    const response = await fetch("assets/pitsamai-logo.png");
    if (!response.ok) throw new Error("Logo unavailable");
    return await readBlobAsDataUrl(await response.blob());
  } catch {
    return "assets/pitsamai-logo.png";
  }
}

async function exportTimeFullDetailsData(user = getSession()?.user, options = {}) {
  const range = options.range || getTimeSummaryRange();
  const department = options.department || timeSummaryDepartment;
  const setMenuOpen =
    options.menu === "summary"
      ? (value) => {
          summaryMainExportMenuOpen = value;
        }
      : options.menu === "personal"
      ? (value) => {
          personalReportExportMenuOpen = value;
        }
      : (value) => {
          timeSummaryExportMenuOpen = value;
        };
  const setMessage = options.messageSetter || setTimeSummaryMessage;

  if (!canExportFullDetails(user)) {
    setMessage("บัญชีนี้ไม่มีสิทธิ์ Export รายละเอียดทั้งหมด กรุณาใช้บัญชีแอดมินหรือ level C5 ขึ้นไป", "error");
    setMenuOpen(true);
    render();
    return;
  }

  setMessage("กำลังสร้างไฟล์ Excel รายละเอียดทั้งหมด...");
  setMenuOpen(true);
  render();

  try {
    const payload = buildFullExportPayload(user, range, department);
    if (options.productionRecords) payload.production_records = options.productionRecords;
    if (options.timeRecords) payload.time_records = options.timeRecords;

    await downloadReport(`${REPORT_API_BASE}/reports/time-full-export-excel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (user) {
      addAuditLog(
        user,
        "EXPORT_FULL_DETAILS",
        `Exported full details ${range.startDate} to ${range.endDate}`
      );
    }
    setMessage(`Export รายละเอียดทั้งหมด ${range.startDate} ถึง ${range.endDate} เรียบร้อยแล้ว`);
    setMenuOpen(false);
  } catch (error) {
    setMessage(
      `${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`,
      "error"
    );
    setMenuOpen(true);
  }

  render();
}

async function exportTimeReceiptData(user = getSession()?.user, options = {}) {
  const range = options.range || getTimeSummaryRange();
  const department = options.department || timeSummaryDepartment;
  const setMenuOpen =
    options.menu === "summary"
      ? (value) => {
          summaryMainExportMenuOpen = value;
        }
      : options.menu === "personal"
      ? (value) => {
          personalReportExportMenuOpen = value;
        }
      : (value) => {
          timeSummaryExportMenuOpen = value;
        };
  const setMessage = options.messageSetter || setTimeSummaryMessage;
  const records = options.records || getTimeSummaryRecords();

  if (!records.length) {
    setMessage("ไม่มีข้อมูลเวลาเข้างานในช่วงวันที่ที่เลือก จึงยัง Export ใบเสร็จไม่ได้", "error");
    setMenuOpen(true);
    render();
    return;
  }

  setMessage("กำลังสร้างไฟล์ PDF ใบเสร็จเวลา...");
  setMenuOpen(true);
  render();

  try {
    const payload = buildFullExportPayload(user, range, department);
    if (options.productionRecords) payload.production_records = options.productionRecords;
    if (options.timeRecords) payload.time_records = options.timeRecords;

    await downloadReport(`${REPORT_API_BASE}/reports/time-receipts-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        daily_wage: TIME_DAILY_WAGE,
        standard_hours: TIME_STANDARD_HOURS,
        ot_hourly_rate: TIME_OT_HOURLY_RATE
      })
    });
    if (user) {
      addAuditLog(
        user,
        "EXPORT_TIME_RECEIPTS",
        `Exported time receipts ${range.startDate} to ${range.endDate}`
      );
    }
    setMessage(`Export ใบเสร็จเวลา PDF ${range.startDate} ถึง ${range.endDate} เรียบร้อยแล้ว`);
    setMenuOpen(false);
  } catch (error) {
    setMessage(
      `${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`,
      "error"
    );
    setMenuOpen(true);
  }

  render();
}

function exportTimeSummaryData() {
  const records = getTimeSummaryRecords();
  if (!records.length) {
    setTimeSummaryMessage("ไม่มีข้อมูลเวลาเข้างานในช่วงวันที่ที่เลือก จึงยัง Export ไม่ได้", "error");
    render();
    return;
  }

  const exportOptions = getTimeSummaryExportOptions();
  if (!Object.values(exportOptions).some(Boolean)) {
    setTimeSummaryMessage("กรุณาเลือกข้อมูลอย่างน้อย 1 ส่วนสำหรับ Export", "error");
    render();
    return;
  }

  const range = getTimeSummaryRange();
  const summary = summarizeTimeRecords(records);
  const byDate = getTimeSummaryByDate(records);
  const byEmployee = getTimeSummaryByEmployee(records);
  const departmentLabel = timeSummaryDepartment === "all" ? "ทุกแผนก" : timeSummaryDepartment;
  const lines = [
    csvRow(["รายงานสรุปข้อมูลเวลาเข้างาน"]),
    csvRow(["ช่วงวันที่", `${range.startDate} ถึง ${range.endDate}`]),
    csvRow(["แผนก", departmentLabel]),
    csvRow([])
  ];

  if (exportOptions.overview) {
    lines.push(csvRow(["ภาพรวม"]));
    lines.push(csvRow(["หัวข้อ", "ค่า"]));
    lines.push(csvRow(["จำนวนรายการ", summary.totalRecords]));
    lines.push(csvRow(["พนักงาน", summary.employeeKeys.size]));
    lines.push(csvRow(["จำนวนวันทำงาน", summary.workDays.size]));
    lines.push(csvRow(["ชั่วโมงสุทธิรวม", formatDecimalHours(summary.totalNetMinutes)]));
    lines.push(csvRow(["เวลาสุทธิรวม", formatMinutesToHourText(summary.totalNetMinutes)]));
    lines.push(csvRow(["มาสาย", summary.lateCount]));
    lines.push(csvRow(["ออกก่อนเวลา", summary.earlyOutCount]));
    lines.push(csvRow([]));
  }

  if (exportOptions.daily) {
    lines.push(csvRow(["สรุปรายวัน"]));
    lines.push(csvRow(["วันที่", "จำนวนรายการ", "พนักงาน", "เวลาสุทธิ", "ชั่วโมงสุทธิ", "มาสาย", "ออกก่อนเวลา"]));
    byDate.forEach((item) => {
      lines.push(
        csvRow([
          item.date,
          item.records,
          item.employees.size,
          formatMinutesToHourText(item.netMinutes),
          formatDecimalHours(item.netMinutes),
          item.lateCount,
          item.earlyOutCount
        ])
      );
    });
    lines.push(csvRow([]));
  }

  if (exportOptions.employees) {
    lines.push(csvRow(["สรุปรายพนักงาน"]));
    lines.push(csvRow(["รหัสพนักงาน", "ชื่อพนักงาน", "แผนก", "จำนวนวัน", "จำนวนรายการ", "เวลาสุทธิ", "ชั่วโมงสุทธิ", "มาสาย", "ออกก่อนเวลา"]));
    byEmployee.forEach((item) => {
      lines.push(
        csvRow([
          item.empCode,
          item.fullname,
          item.department,
          item.days.size,
          item.records,
          formatMinutesToHourText(item.netMinutes),
          formatDecimalHours(item.netMinutes),
          item.lateCount,
          item.earlyOutCount
        ])
      );
    });
    lines.push(csvRow([]));
  }

  if (exportOptions.details) {
    lines.push(csvRow(["รายละเอียดทั้งหมด"]));
    lines.push(csvRow(["วันที่", "รหัสพนักงาน", "ชื่อพนักงาน", "แผนก", "เวลาเข้า", "เวลาออก", "พัก", "เวลาสุทธิ", "ชั่วโมงสุทธิ", "ผู้บันทึก"]));
    records.forEach((record) => {
      lines.push(
        csvRow([
          record.record_date || "",
          record.emp_code || "",
          record.fullname || "",
          record.department || "",
          record.clock_in || "",
          record.clock_out || "",
          formatMinutesToHourText(record.break_minutes),
          formatMinutesToHourText(record.net_minutes),
          formatDecimalHours(record.net_minutes),
          record.created_by || ""
        ])
      );
    });
  }

  downloadTextFile(
    `time-summary-${range.startDate}-to-${range.endDate}.csv`,
    `\ufeff${lines.join("\r\n")}`
  );
  setTimeSummaryMessage(`Export รายงานเวลาเข้างาน ${range.startDate} ถึง ${range.endDate} เรียบร้อยแล้ว`);
  render();
}

function renderTimeSummaryMetricCard(label, value, detail, tone = "") {
  return `
    <div class="metric-card ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function renderTimeSummaryDailyRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.date)}</td>
      <td>${item.records.toLocaleString("th-TH")}</td>
      <td>${item.employees.size.toLocaleString("th-TH")}</td>
      <td>${escapeHtml(formatMinutesToHourText(item.netMinutes))}</td>
      <td>${escapeHtml(formatDecimalHours(item.netMinutes))}</td>
      <td>${item.lateCount.toLocaleString("th-TH")}</td>
      <td>${item.earlyOutCount.toLocaleString("th-TH")}</td>
    </tr>
  `;
}

function renderTimeSummaryEmployeeRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.empCode)}</td>
      <td>${escapeHtml(item.fullname)}</td>
      <td>${escapeHtml(item.department)}</td>
      <td>${item.days.size.toLocaleString("th-TH")}</td>
      <td>${item.records.toLocaleString("th-TH")}</td>
      <td>${escapeHtml(formatMinutesToHourText(item.netMinutes))}</td>
      <td>${escapeHtml(formatDecimalHours(item.netMinutes))}</td>
      <td>${item.lateCount.toLocaleString("th-TH")}</td>
      <td>${item.earlyOutCount.toLocaleString("th-TH")}</td>
    </tr>
  `;
}

function renderTimeSummaryDetailRow(record) {
  return `
    <tr>
      <td>${escapeHtml(record.record_date || "-")}</td>
      <td>${escapeHtml(record.emp_code || "-")}</td>
      <td>${escapeHtml(record.fullname || "-")}</td>
      <td>${escapeHtml(record.department || "-")}</td>
      <td>${escapeHtml(record.clock_in || "-")}</td>
      <td>${escapeHtml(record.clock_out || "-")}</td>
      <td>${escapeHtml(formatMinutesToHourText(record.break_minutes))}</td>
      <td>${escapeHtml(formatMinutesToHourText(record.net_minutes))}</td>
      <td>${escapeHtml(formatDecimalHours(record.net_minutes))}</td>
      <td>${escapeHtml(record.created_by || "-")}</td>
    </tr>
  `;
}

function renderSummaryTimeOverview(moduleItem) {
  const user = getSession()?.user;
  const range = getTimeSummaryRange();
  const records = getTimeSummaryRecords();
  const summary = summarizeTimeRecords(records);
  const byDate = getTimeSummaryByDate(records);
  const byEmployee = getTimeSummaryByEmployee(records);
  const departments = getTimeSummaryDepartments();
  const departmentOptions = departments
    .map((department) => {
      const label = department === "all" ? "ทุกแผนก" : department;
      return `<option value="${escapeHtml(department)}" ${department === timeSummaryDepartment ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");

  return `
    <section class="time-summary-page">
      <div class="summary-header time-summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label || "สรุปข้อมูลเวลาเข้างาน")}</h2>
          <p>สรุปเวลาเข้าออกงานจากฐานข้อมูลเวลาทำงาน เลือกช่วงวันที่หรือแผนกแล้วข้อมูลทุกตารางจะเปลี่ยนตามทันที</p>
        </div>
        <button class="btn btn-outline" type="button" data-route="summary-all">กลับไปหน้าสรุป</button>
      </div>

      ${
        timeSummaryMessage
          ? `<div class="alert ${timeSummaryMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(timeSummaryMessage)}</div>`
          : ""
      }

      <section class="panel time-summary-control-panel">
        <form class="time-summary-form" id="timeSummaryForm">
          <label class="field">
            <span>จากวันที่</span>
            <input id="timeSummaryStartDate" name="start_date" type="date" value="${escapeHtml(range.startDate)}" required />
          </label>
          <label class="field">
            <span>ถึงวันที่</span>
            <input id="timeSummaryEndDate" name="end_date" type="date" value="${escapeHtml(range.endDate)}" required />
          </label>
          <label class="field">
            <span>แผนก</span>
            <select id="timeSummaryDepartment" name="department">${departmentOptions}</select>
          </label>
          <button class="btn btn-outline" type="submit">แสดงข้อมูล</button>
          <button class="btn btn-primary time-summary-export-button" id="toggleTimeExportMenu" type="button">Export</button>
        </form>
        ${
          timeSummaryExportMenuOpen
            ? `
              <div class="time-summary-export-menu">
                <button class="time-export-choice" id="exportTimeSummaryPdf" type="button">
                  <strong>Export PDF สรุปเวลา</strong>
                  <span>ไฟล์ PDF สรุปเวลาเข้างานตามช่วงวันที่และแผนกที่เลือก</span>
                </button>
                <button class="time-export-choice" id="exportTimeSummaryExcel" type="button">
                  <strong>Export Excel</strong>
                  <span>ไฟล์ Excel รายละเอียดเวลาเข้าออกตามข้อมูลบนหน้านี้</span>
                </button>
              </div>
            `
            : ""
        }
      </section>

      ${
        records.length
          ? `
            <div class="summary-metrics time-summary-metrics">
              ${renderTimeSummaryMetricCard("จำนวนรายการ", `${summary.totalRecords.toLocaleString("th-TH")} รายการ`, `${summary.workDays.size.toLocaleString("th-TH")} วันทำงาน`, "metric-green")}
              ${renderTimeSummaryMetricCard("พนักงาน", `${summary.employeeKeys.size.toLocaleString("th-TH")} คน`, timeSummaryDepartment === "all" ? "รวมทุกแผนก" : timeSummaryDepartment, "metric-blue")}
              ${renderTimeSummaryMetricCard("เวลาสุทธิรวม", `${formatMinutesToHourText(summary.totalNetMinutes)} ชม.`, `${formatDecimalHours(summary.totalNetMinutes)} ชั่วโมง`, "metric-purple")}
              ${renderTimeSummaryMetricCard("สถานะเวลา", `สาย ${summary.lateCount.toLocaleString("th-TH")} / ออกก่อน ${summary.earlyOutCount.toLocaleString("th-TH")}`, "เทียบเวลาเข้า 08:00 และเวลาออก 17:00", "metric-orange")}
            </div>

            <section class="time-summary-grid">
              <section class="table-card">
                <div class="table-heading">สรุปรายวัน</div>
                <div class="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>วันที่</th>
                        <th>รายการ</th>
                        <th>พนักงาน</th>
                        <th>เวลาสุทธิ</th>
                        <th>ชั่วโมง</th>
                        <th>มาสาย</th>
                        <th>ออกก่อน</th>
                      </tr>
                    </thead>
                    <tbody>${byDate.map(renderTimeSummaryDailyRow).join("")}</tbody>
                  </table>
                </div>
              </section>

              <section class="table-card">
                <div class="table-heading">สรุปรายพนักงาน</div>
                <div class="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>รหัส</th>
                        <th>ชื่อพนักงาน</th>
                        <th>แผนก</th>
                        <th>วัน</th>
                        <th>รายการ</th>
                        <th>เวลาสุทธิ</th>
                        <th>ชั่วโมง</th>
                        <th>สาย</th>
                        <th>ออกก่อน</th>
                      </tr>
                    </thead>
                    <tbody>${byEmployee.map(renderTimeSummaryEmployeeRow).join("")}</tbody>
                  </table>
                </div>
              </section>
            </section>

            <section class="table-card">
              <div class="table-heading">รายละเอียดเวลาเข้าออกงาน</div>
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>รหัส</th>
                      <th>ชื่อพนักงาน</th>
                      <th>แผนก</th>
                      <th>เข้า</th>
                      <th>ออก</th>
                      <th>พัก</th>
                      <th>สุทธิ</th>
                      <th>ชั่วโมง</th>
                      <th>ผู้บันทึก</th>
                    </tr>
                  </thead>
                  <tbody>${records.map(renderTimeSummaryDetailRow).join("")}</tbody>
                </table>
              </div>
            </section>
          `
          : `
            <section class="panel">
              <div class="empty-state">ยังไม่มีข้อมูลเวลาเข้างานในช่วงวันที่ที่เลือก</div>
            </section>
          `
      }
    </section>
  `;
}

function bindTimeSummaryEvents() {
  const user = getSession()?.user;
  const form = document.querySelector("#timeSummaryForm");
  const applyFilter = () => {
    const formData = new FormData(form);
    timeSummaryStartDate = formData.get("start_date") || new Date().toISOString().slice(0, 10);
    timeSummaryEndDate = formData.get("end_date") || timeSummaryStartDate;
    timeSummaryDepartment = formData.get("department") || "all";
    timeSummaryMessage = "";
    timeSummaryExportMenuOpen = false;
    render();
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilter();
  });

  form?.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("change", applyFilter);
  });

  document.querySelector("#toggleTimeExportMenu")?.addEventListener("click", () => {
    timeSummaryExportMenuOpen = !timeSummaryExportMenuOpen;
    render();
  });

  document.querySelector("#exportTimeSummaryPdf")?.addEventListener("click", () => {
    exportTimeSummaryReport(user, "pdf");
  });

  document.querySelector("#exportTimeSummaryExcel")?.addEventListener("click", () => {
    exportTimeSummaryReport(user, "excel");
  });
}

async function exportTimeSummaryReport(user, format) {
  const range = getTimeSummaryRange();
  const records = getTimeSummaryRecords();
  if (!records.length) {
    setTimeSummaryMessage("ไม่มีข้อมูลเวลาเข้างานในช่วงวันที่ที่เลือก จึงยัง Export ไม่ได้", "error");
    timeSummaryExportMenuOpen = true;
    render();
    return;
  }

  const endpoint = format === "excel" ? "time-summary-excel" : "time-summary-pdf";
  const departmentLabel = timeSummaryDepartment === "all" ? "ทุกแผนก" : timeSummaryDepartment;
  setTimeSummaryMessage(`กำลังสร้างไฟล์ ${format === "excel" ? "Excel" : "PDF"} สรุปเวลาเข้างาน...`);
  timeSummaryExportMenuOpen = true;
  render();

  try {
    await downloadReport(`${REPORT_API_BASE}/reports/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: range.startDate,
        end_date: range.endDate,
        department: timeSummaryDepartment,
        department_label: departmentLabel,
        printed_by: user?.fullname || "System Admin",
        printed_by_position: getExportPositionLabel(user),
        employees: getTimeEmployees(),
        time_records: getTimeRecords()
      })
    });
    setTimeSummaryMessage(`Export ${format === "excel" ? "Excel" : "PDF"} สรุปเวลา ${range.startDate} ถึง ${range.endDate} เรียบร้อยแล้ว`);
    timeSummaryExportMenuOpen = false;
  } catch (error) {
    setTimeSummaryMessage(`${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`, "error");
    timeSummaryExportMenuOpen = true;
  }

  render();
}

function getPersonalReportContext() {
  const employees = (personalReportActiveTab === "time" ? getTimeEmployees() : getEmployees())
    .filter((employee) => employee.status === "Active");
  const preferredEmployeeId = Number(personalReportEmployeeId);
  const selectedEmployeeId = employees.some((employee) => employee.id === preferredEmployeeId)
    ? preferredEmployeeId
    : employees[0]?.id || "";
  personalReportEmployeeId = selectedEmployeeId ? String(selectedEmployeeId) : "";

  return {
    employees,
    selectedEmployeeId,
    selectedEmployee: employees.find((employee) => employee.id === Number(selectedEmployeeId)),
    range: normalizeDateRange(personalReportStartDate, personalReportEndDate)
  };
}

function recordsForPersonalTimeReport(employeeId, startDate, endDate) {
  const range = normalizeDateRange(startDate, endDate);
  return getTimeRecords()
    .filter((record) => {
      const recordDate = record.record_date || "";
      return (
        Number(record.employee_id) === Number(employeeId) &&
        recordDate >= range.startDate &&
        recordDate <= range.endDate
      );
    })
    .sort((a, b) =>
      `${a.record_date || ""} ${a.clock_in || ""}`.localeCompare(
        `${b.record_date || ""} ${b.clock_in || ""}`
      )
    );
}

function getPersonalTimeDailySummaries(records) {
  return getTimeSummaryByDate(records);
}

function exportPersonalTimeSummary() {
  const context = getPersonalReportContext();
  if (!context.selectedEmployee) {
    setPersonalReportMessage("กรุณาเลือกพนักงานก่อน Export", "error");
    render();
    return;
  }

  const records = recordsForPersonalTimeReport(
    context.selectedEmployee.id,
    context.range.startDate,
    context.range.endDate
  );
  if (!records.length) {
    setPersonalReportMessage("ไม่มีข้อมูลเวลาเข้างานของพนักงานคนนี้ในช่วงวันที่ที่เลือก", "error");
    render();
    return;
  }

  const summary = summarizeTimeRecords(records);
  const dailySummaries = getPersonalTimeDailySummaries(records);
  const lines = [
    csvRow(["รายงานสรุปเวลาเข้างานรายบุคคล"]),
    csvRow(["พนักงาน", `${context.selectedEmployee.emp_code} - ${context.selectedEmployee.fullname}`]),
    csvRow(["ช่วงวันที่", `${context.range.startDate} ถึง ${context.range.endDate}`]),
    csvRow([]),
    csvRow(["ภาพรวม"]),
    csvRow(["หัวข้อ", "ค่า"]),
    csvRow(["จำนวนรายการ", summary.totalRecords]),
    csvRow(["จำนวนวัน", summary.workDays.size]),
    csvRow(["เวลาสุทธิ", formatMinutesToHourText(summary.totalNetMinutes)]),
    csvRow(["ชั่วโมงสุทธิ", formatDecimalHours(summary.totalNetMinutes)]),
    csvRow(["มาสาย", summary.lateCount]),
    csvRow(["ออกก่อนเวลา", summary.earlyOutCount]),
    csvRow([]),
    csvRow(["สรุปรายวัน"]),
    csvRow(["วันที่", "จำนวนรายการ", "เวลาสุทธิ", "ชั่วโมงสุทธิ", "มาสาย", "ออกก่อนเวลา"])
  ];

  dailySummaries.forEach((item) => {
    lines.push(
      csvRow([
        item.date,
        item.records,
        formatMinutesToHourText(item.netMinutes),
        formatDecimalHours(item.netMinutes),
        item.lateCount,
        item.earlyOutCount
      ])
    );
  });

  lines.push(csvRow([]));
  lines.push(csvRow(["รายละเอียด"]));
  lines.push(csvRow(["วันที่", "เวลาเข้า", "เวลาออก", "พัก", "เวลาสุทธิ", "ชั่วโมงสุทธิ", "ผู้บันทึก"]));
  records.forEach((record) => {
    lines.push(
      csvRow([
        record.record_date || "",
        record.clock_in || "",
        record.clock_out || "",
        formatMinutesToHourText(record.break_minutes),
        formatMinutesToHourText(record.net_minutes),
        formatDecimalHours(record.net_minutes),
        record.created_by || ""
      ])
    );
  });

  downloadTextFile(
    `personal-time-${context.selectedEmployee.emp_code}-${context.range.startDate}-to-${context.range.endDate}.csv`,
    `\ufeff${lines.join("\r\n")}`
  );
  setPersonalReportMessage("Export สรุปเวลาเข้างานรายบุคคลเรียบร้อยแล้ว");
  render();
}

function renderPersonalReportTabs() {
  return `
    <div class="module-tabs personal-report-tabs">
      <button class="module-tab ${personalReportActiveTab === "production" ? "active" : ""}" type="button" data-personal-tab="production">
        สรุปรายบุคคลหลัก
      </button>
      <button class="module-tab ${personalReportActiveTab === "time" ? "active" : ""}" type="button" data-personal-tab="time">
        สรุปเวลาเข้างาน
      </button>
    </div>
  `;
}

function renderPersonalReportFilter(context) {
  return `
    <section class="panel">
      <form class="personal-report-form" id="personalReportForm">
        <label class="field compact-field">
          <span>พนักงาน</span>
          <select id="personalReportEmployee" name="employee_id" required>
            ${context.employees
              .map(
                (employee) => `
                  <option value="${employee.id}" ${
                  Number(context.selectedEmployeeId) === employee.id ? "selected" : ""
                }>
                    ${escapeHtml(employee.emp_code)} - ${escapeHtml(employee.fullname)}
                  </option>`
              )
              .join("")}
          </select>
        </label>

        <label class="field compact-field">
          <span>วันที่เริ่ม</span>
          <input id="personalReportStartDate" name="start_date" type="date" value="${escapeHtml(context.range.startDate)}" />
        </label>

        <label class="field compact-field">
          <span>วันที่สิ้นสุด</span>
          <input id="personalReportEndDate" name="end_date" type="date" value="${escapeHtml(context.range.endDate)}" />
        </label>

        ${
          personalReportActiveTab === "production"
            ? `
              <button class="btn btn-outline" id="exportPersonalExcel" type="button" ${context.selectedEmployee ? "" : "disabled"}>
                Export Excel
              </button>
              <button class="btn btn-primary report-primary-button" id="exportPersonalPdf" type="button" ${context.selectedEmployee ? "" : "disabled"}>
                Export PDF รายงานน้ำหนัก
              </button>
            `
            : `
              <button class="btn btn-primary report-primary-button" id="exportPersonalTime" type="button" ${context.selectedEmployee ? "" : "disabled"}>
                Export
              </button>
            `
        }
        <button class="btn btn-outline" id="togglePersonalExportMenu" type="button" ${context.selectedEmployee ? "" : "disabled"}>
          Export เพิ่มเติม
        </button>
      </form>
      ${
        personalReportExportMenuOpen && context.selectedEmployee
          ? `
            <div class="time-summary-export-menu personal-export-menu">
              <button class="time-export-choice" id="exportPersonalFullDetails" type="button" ${canExportFullDetails(getSession()?.user) ? "" : "disabled"}>
                <strong>Export รายละเอียดทั้งหมด</strong>
                <span>ไฟล์ Excel รวมรายละเอียดผลผลิตและเวลาเข้างานของพนักงานที่เลือก</span>
              </button>
              ${
                personalReportActiveTab === "time"
                  ? `
                    <button class="time-export-choice" id="exportPersonalTimeReceipt" type="button">
                      <strong>Export ใบเสร็จเวลา</strong>
                      <span>ไฟล์ PDF ใบเสร็จเวลาเฉพาะพนักงานที่เลือก ซ้ายต้นฉบับ / ขวาสำเนา</span>
                    </button>
                  `
                  : `
                    <button class="time-export-choice" id="exportPersonalProductionPdf" type="button">
                      <strong>Export รายงานน้ำหนัก</strong>
                      <span>ไฟล์ PDF รายงานผลงาน/น้ำหนักเฉพาะพนักงานที่เลือก</span>
                    </button>
                  `
              }
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderPersonalProductionSummaryTab(context) {
  const records = context.selectedEmployee
    ? recordsForPersonalReport(context.selectedEmployee.id, context.range.startDate, context.range.endDate)
    : [];
  const totals = summarizePersonalRecords(records);
  const dailySummaries = getDailyPersonalSummaries(records);
  const pileSummaries = getPilePersonalSummaries(records);

  return `
    ${
      context.selectedEmployee && !records.length
        ? `<div class="alert alert-success">ยังไม่มีข้อมูลผลงานในช่วงวันที่นี้ แต่สามารถ Export รายงานเปล่าของพนักงานที่เลือกได้</div>`
        : ""
    }

    <div class="summary-metrics">
      <div class="metric-card metric-green">
        <span>น้ำหนักรวม</span>
        <strong>${numberText(totals.total)} กก.</strong>
        <small>น้ำ ${numberText(totals.water)} | ดอก ${numberText(totals.flower)}</small>
      </div>
      <div class="metric-card metric-blue">
        <span>ยอดเงินรวม</span>
        <strong>${money(totals.amount)}</strong>
        <small>จากรายการของพนักงานที่เลือก</small>
      </div>
      <div class="metric-card metric-purple">
        <span>วันที่มีผลงาน</span>
        <strong>${totals.days.size.toLocaleString("th-TH")} วัน</strong>
        <small>${escapeHtml(context.range.startDate)} ถึง ${escapeHtml(context.range.endDate)}</small>
      </div>
      <div class="metric-card metric-orange">
        <span>จำนวนรายการ</span>
        <strong>${totals.records.toLocaleString("th-TH")}</strong>
        <small>${context.selectedEmployee ? escapeHtml(context.selectedEmployee.emp_code) : "ยังไม่มีพนักงาน"}</small>
      </div>
    </div>

    <section class="personal-report-grid">
      <section class="table-card">
        <div class="table-heading">สรุปรายวัน</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>น้ำหนักดอก</th>
                <th>น้ำหนักน้ำ</th>
                <th>ทุเรียน A-E</th>
                <th>น้ำหนักรวม</th>
                <th>รวมเป็นเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${
                dailySummaries.length
                  ? dailySummaries.map(renderPersonalDailyRow).join("")
                  : `<tr><td colspan="6" class="empty-cell">ยังไม่มีข้อมูลในช่วงวันที่นี้</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="table-card">
        <div class="table-heading">สรุปตามกอง</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>กอง</th>
                <th>จำนวนรายการ</th>
                <th>น้ำหนักดอก</th>
                <th>น้ำหนักน้ำ</th>
                <th>ทุเรียน A-E</th>
                <th>น้ำหนักรวม</th>
                <th>รวมเป็นเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${
                pileSummaries.length
                  ? pileSummaries.map(renderPersonalPileRow).join("")
                  : `<tr><td colspan="7" class="empty-cell">ยังไม่มีข้อมูลตามกองในช่วงวันที่นี้</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function renderPersonalTimeSummaryTab(context) {
  const records = context.selectedEmployee
    ? recordsForPersonalTimeReport(context.selectedEmployee.id, context.range.startDate, context.range.endDate)
    : [];
  const summary = summarizeTimeRecords(records);
  const dailySummaries = getPersonalTimeDailySummaries(records);

  if (!records.length) {
    return `
      <section class="panel">
        <div class="empty-state">ยังไม่มีข้อมูลเวลาเข้างานของพนักงานคนนี้ในช่วงวันที่ที่เลือก</div>
      </section>
    `;
  }

  return `
    <div class="summary-metrics">
      ${renderTimeSummaryMetricCard("จำนวนรายการ", `${summary.totalRecords.toLocaleString("th-TH")} รายการ`, `${summary.workDays.size.toLocaleString("th-TH")} วันทำงาน`, "metric-green")}
      ${renderTimeSummaryMetricCard("เวลาสุทธิรวม", `${formatMinutesToHourText(summary.totalNetMinutes)} ชม.`, `${formatDecimalHours(summary.totalNetMinutes)} ชั่วโมง`, "metric-blue")}
      ${renderTimeSummaryMetricCard("เวลาพักรวม", `${formatMinutesToHourText(summary.totalBreakMinutes)} ชม.`, "หักจากเวลาทำงานตามกติกา", "metric-purple")}
      ${renderTimeSummaryMetricCard("สถานะเวลา", `สาย ${summary.lateCount.toLocaleString("th-TH")} / ออกก่อน ${summary.earlyOutCount.toLocaleString("th-TH")}`, "เทียบเวลา 08:00 - 17:00", "metric-orange")}
    </div>

    <section class="time-summary-grid">
      <section class="table-card">
        <div class="table-heading">สรุปเวลารายวัน</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>รายการ</th>
                <th>เวลาสุทธิ</th>
                <th>ชั่วโมง</th>
                <th>มาสาย</th>
                <th>ออกก่อน</th>
              </tr>
            </thead>
            <tbody>
              ${dailySummaries
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHtml(item.date)}</td>
                      <td>${item.records.toLocaleString("th-TH")}</td>
                      <td>${escapeHtml(formatMinutesToHourText(item.netMinutes))}</td>
                      <td>${escapeHtml(formatDecimalHours(item.netMinutes))}</td>
                      <td>${item.lateCount.toLocaleString("th-TH")}</td>
                      <td>${item.earlyOutCount.toLocaleString("th-TH")}</td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดเวลาเข้าออก</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เข้า</th>
                <th>ออก</th>
                <th>พัก</th>
                <th>สุทธิ</th>
                <th>ชั่วโมง</th>
                <th>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>
              ${records
                .map(
                  (record) => `
                    <tr>
                      <td>${escapeHtml(record.record_date || "-")}</td>
                      <td>${escapeHtml(record.clock_in || "-")}</td>
                      <td>${escapeHtml(record.clock_out || "-")}</td>
                      <td>${escapeHtml(formatMinutesToHourText(record.break_minutes))}</td>
                      <td>${escapeHtml(formatMinutesToHourText(record.net_minutes))}</td>
                      <td>${escapeHtml(formatDecimalHours(record.net_minutes))}</td>
                      <td>${escapeHtml(record.created_by || "-")}</td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function renderPersonalReport(moduleItem) {
  const context = getPersonalReportContext();

  return `
    <section class="summary-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>เลือกพนักงานและช่วงวันที่เพื่อดูสรุปผลงานหรือสรุปเวลาเข้างานแบบรายบุคคล</p>
        </div>
        <div class="summary-filters">
          <button class="btn btn-outline" data-route="reports" type="button">Export หลายคน</button>
        </div>
      </div>

      ${renderPersonalReportTabs()}

      ${
        personalReportMessage
          ? `<div class="alert ${
              personalReportMessageType === "error" ? "alert-error" : "alert-success"
            }">${escapeHtml(personalReportMessage)}</div>`
          : ""
      }

      ${renderPersonalReportFilter(context)}

      ${
        personalReportActiveTab === "time"
          ? renderPersonalTimeSummaryTab(context)
          : renderPersonalProductionSummaryTab(context)
      }
    </section>
  `;
}

function bindPersonalReportEvents() {
  document.querySelectorAll("[data-personal-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      personalReportActiveTab = button.dataset.personalTab || "production";
      personalReportMessage = "";
      render();
    });
  });

  document.querySelector("#personalReportForm")?.addEventListener("change", (event) => {
    const target = event.target;
    if (target.id === "personalReportEmployee") {
      personalReportEmployeeId = target.value;
    }
    if (target.id === "personalReportStartDate") {
      personalReportStartDate = target.value || new Date().toISOString().slice(0, 10);
    }
    if (target.id === "personalReportEndDate") {
      personalReportEndDate = target.value || personalReportStartDate;
    }
    personalReportMessage = "";
    personalReportExportMenuOpen = false;
    render();
  });

  document.querySelector("#togglePersonalExportMenu")?.addEventListener("click", () => {
    personalReportExportMenuOpen = !personalReportExportMenuOpen;
    render();
  });

  document.querySelector("#exportPersonalFullDetails")?.addEventListener("click", () => {
    const context = getPersonalReportContext();
    if (!context.selectedEmployee) {
      setPersonalReportMessage("กรุณาเลือกพนักงานก่อน Export", "error");
      render();
      return;
    }
    exportTimeFullDetailsData(getSession()?.user, {
      range: context.range,
      department: "all",
      productionRecords: recordsForPersonalReport(
        context.selectedEmployee.id,
        context.range.startDate,
        context.range.endDate
      ),
      timeRecords: recordsForPersonalTimeReport(
        context.selectedEmployee.id,
        context.range.startDate,
        context.range.endDate
      ),
      menu: "personal",
      messageSetter: setPersonalReportMessage
    });
  });

  document.querySelector("#exportPersonalTimeReceipt")?.addEventListener("click", () => {
    const context = getPersonalReportContext();
    if (!context.selectedEmployee) {
      setPersonalReportMessage("กรุณาเลือกพนักงานก่อน Export", "error");
      render();
      return;
    }
    const records = recordsForPersonalTimeReport(
      context.selectedEmployee.id,
      context.range.startDate,
      context.range.endDate
    );
    exportTimeReceiptData(getSession()?.user, {
      range: context.range,
      department: "all",
      records,
      timeRecords: records,
      productionRecords: recordsForPersonalReport(
        context.selectedEmployee.id,
        context.range.startDate,
        context.range.endDate
      ),
      menu: "personal",
      messageSetter: setPersonalReportMessage
    });
  });

  document.querySelector("#exportPersonalProductionPdf")?.addEventListener("click", async () => {
    const context = getPersonalReportContext();
    if (!context.selectedEmployee) {
      setPersonalReportMessage("กรุณาเลือกพนักงานก่อน Export", "error");
      render();
      return;
    }

    try {
      setPersonalReportMessage("กำลังสร้างไฟล์ PDF รายงานน้ำหนัก...");
      personalReportExportMenuOpen = true;
      render();
      await downloadReport(`${REPORT_API_BASE}/reports/employee-range-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPersonalReportPayload())
      });
      setPersonalReportMessage("ดาวน์โหลด PDF รายงานน้ำหนักรายบุคคลแล้ว");
      personalReportExportMenuOpen = false;
      render();
    } catch (error) {
      personalReportExportMenuOpen = true;
      personalReportExportError(error);
    }
  });

  document.querySelector("#exportPersonalTime")?.addEventListener("click", exportPersonalTimeSummary);

  document.querySelector("#exportPersonalPdf")?.addEventListener("click", async () => {
    try {
      await syncReportData();
      await downloadReport(`${REPORT_API_BASE}/reports/employee-range-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPersonalReportPayload())
      });
      setPersonalReportMessage("ดาวน์โหลด PDF รายบุคคลแล้ว");
      render();
    } catch (error) {
      personalReportExportError(error);
    }
  });

  document.querySelector("#exportPersonalExcel")?.addEventListener("click", async () => {
    try {
      await syncReportData();
      await downloadReport(`${REPORT_API_BASE}/reports/employee-range-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPersonalReportPayload())
      });
      setPersonalReportMessage("ดาวน์โหลด Excel รายบุคคลแล้ว");
      render();
    } catch (error) {
      personalReportExportError(error);
    }
  });
}

const summaryExportFieldGroups = {
  overview: [
    { key: "totalWeight", label: "น้ำหนักรวมทั้งหมด" },
    { key: "water", label: "น้ำหนักน้ำ" },
    { key: "flower", label: "น้ำหนักดอก" },
    { key: "grades", label: "ทุเรียนเกรด A-E" },
    { key: "amount", label: "ยอดเงินรวม" },
    { key: "employees", label: "พนักงานที่มีรายการ" },
    { key: "records", label: "จำนวนรายการ" }
  ],
  piles: [
    { key: "pile", label: "กอง" },
    { key: "water", label: "น้ำหนักน้ำ" },
    { key: "flower", label: "น้ำหนักดอก" },
    { key: "grades", label: "ทุเรียนเกรด A-E" },
    { key: "total", label: "รวม" },
    { key: "amount", label: "รวมเงิน" }
  ],
  details: [
    { key: "date", label: "วันที่" },
    { key: "time", label: "เวลา" },
    { key: "empCode", label: "รหัสพนักงาน" },
    { key: "employeeName", label: "ชื่อพนักงาน" },
    { key: "pile", label: "กอง" },
    { key: "water", label: "น้ำหนักน้ำ" },
    { key: "flower", label: "น้ำหนักดอก" },
    { key: "grades", label: "ทุเรียนเกรด A-E" },
    { key: "total", label: "น้ำหนักรวม" },
    { key: "amount", label: "รวมเงิน" },
    { key: "createdBy", label: "ผู้บันทึก" }
  ]
};

function hasSelectedSummaryExportFields(section) {
  return Object.values(summaryExportFields[section] || {}).some(Boolean);
}

function getSelectedSummaryExportSections() {
  return Object.entries(summaryExportOptions)
    .filter(([section, enabled]) => enabled && hasSelectedSummaryExportFields(section))
    .map(([section]) => section);
}

function renderSummaryFieldOptions(section, title) {
  const fields = summaryExportFieldGroups[section] || [];
  return `
    <div class="summary-field-group">
      <strong>${escapeHtml(title)}</strong>
      <div>
        ${fields
          .map(
            (field) => `
              <label>
                <input
                  type="checkbox"
                  data-summary-export-field="${escapeHtml(section)}.${escapeHtml(field.key)}"
                  ${summaryExportFields[section]?.[field.key] ? "checked" : ""}
                />
                ${escapeHtml(field.label)}
              </label>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function getSummaryExportPayload(user, format) {
  const exportRange = getSummaryExportRange();
  return {
    start_date: exportRange.startDate,
    end_date: exportRange.endDate,
    printed_by: user?.fullname || "System Admin",
    printed_by_position: getExportPositionLabel(user),
    employees: getEmployees(),
    production_records: getProductionRecords(),
    deduction_records: getReportAdjustmentRecords(),
    export_sections: { ...summaryExportOptions },
    export_fields: JSON.parse(JSON.stringify(summaryExportFields)),
    export_format: format
  };
}

function renderSummaryAll(moduleItem) {
  const user = getSession()?.user;
  const selectedDate = getSelectedSummaryDate();
  summaryDate = selectedDate;

  const records = getDashboardRecordsForDate(selectedDate);
  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);
  const exportRange = getSummaryExportRange();

  return `
    <section class="summary-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>เลือกวันที่เพื่อดูข้อมูล และเลือกเฉพาะส่วน/ฟิลด์ที่ต้องการ Export ได้</p>
        </div>
        <div class="summary-filters">
          <label class="summary-date-field">
            <span>วันที่</span>
            <input id="summaryDate" type="date" value="${escapeHtml(selectedDate)}" />
          </label>
          <span class="summary-mode-pill">${records.length.toLocaleString("th-TH")} รายการ</span>
        </div>
      </div>

      ${
        summaryExportMessage
          ? `<div class="alert ${summaryExportMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(summaryExportMessage)}</div>`
          : ""
      }

      <section class="summary-export-panel summary-main-export-workspace">
        <div>
          <strong>Export ข้อมูลสรุป</strong>
          <span>เลือกช่วงวันที่ ส่วนรายงาน และฟิลด์ที่ต้องการส่งออก</span>
        </div>
        <div class="summary-export-range">
          <label>
            <span>จากวันที่</span>
            <input id="summaryExportStart" type="date" value="${escapeHtml(exportRange.startDate)}" />
          </label>
          <label>
            <span>ถึงวันที่</span>
            <input id="summaryExportEnd" type="date" value="${escapeHtml(exportRange.endDate)}" />
          </label>
        </div>
        <div class="summary-export-options">
          <label><input type="checkbox" data-summary-export-option="overview" ${summaryExportOptions.overview ? "checked" : ""} /> ภาพรวม</label>
          <label><input type="checkbox" data-summary-export-option="piles" ${summaryExportOptions.piles ? "checked" : ""} /> สรุปตามกอง</label>
          <label><input type="checkbox" data-summary-export-option="details" ${summaryExportOptions.details ? "checked" : ""} /> รายละเอียด</label>
        </div>
        <div class="summary-field-options">
          ${renderSummaryFieldOptions("overview", "ฟิลด์ภาพรวม")}
          ${renderSummaryFieldOptions("piles", "ฟิลด์สรุปตามกอง")}
          ${renderSummaryFieldOptions("details", "ฟิลด์รายละเอียด")}
        </div>
        <button class="btn btn-primary summary-export-button" id="toggleSummaryMainExportMenu" type="button">Export</button>
        ${
          summaryMainExportMenuOpen
            ? `
              <div class="time-summary-export-menu summary-main-export-menu">
                <button class="time-export-choice" id="exportSummaryCsv" type="button">
                  <strong>Export CSV</strong>
                  <span>ไฟล์ CSV ตามฟิลด์ที่เลือก เปิดใน Excel ได้ทันที</span>
                </button>
                <button class="time-export-choice" id="exportSummaryMainPdf" type="button">
                  <strong>Export PDF สรุปผลผลิต</strong>
                  <span>ไฟล์ PDF ใช้หัวข้อ น้ำหนักน้ำ / น้ำหนักดอก / รวม ตามฟิลด์ที่เลือก</span>
                </button>
                <button class="time-export-choice" id="exportSummaryMainExcel" type="button">
                  <strong>Export Excel</strong>
                  <span>ไฟล์ Excel ตามส่วนรายงานและฟิลด์ที่เลือก</span>
                </button>
              </div>
            `
            : ""
        }
      </section>

      <div class="summary-metrics">
        <div class="metric-card metric-green">
          <span>น้ำหนักรวมทั้งหมด</span>
          <strong>${numberText(totals.total)} กก.</strong>
          <small>น้ำ ${numberText(totals.water)} กก. | ดอก ${numberText(totals.flower)} กก.</small>
        </div>
        <div class="metric-card metric-blue">
          <span>ยอดเงินรวม</span>
          <strong>${money(totals.amount)}</strong>
          <small>จากรายการวันที่เลือก</small>
        </div>
        <div class="metric-card metric-purple">
          <span>พนักงานทั้งหมด</span>
          <strong>${totals.people.size.toLocaleString("th-TH")} คน</strong>
          <small>พนักงานที่มีรายการ</small>
        </div>
        <div class="metric-card metric-orange">
          <span>จำนวนกอง</span>
          <strong>${pileSummaries.length.toLocaleString("th-TH")}</strong>
          <small>${escapeHtml(selectedDate)}</small>
        </div>
      </div>

      <section class="summary-grid">
        <section class="panel chart-panel">
          <div class="section-title-row">
            <h3>กราฟเปรียบเทียบน้ำหนัก</h3>
            <div class="chart-legend">
              <span><i class="legend-water"></i>น้ำ</span>
              <span><i class="legend-flower"></i>ดอก</span>
            </div>
          </div>
          <div class="summary-chart">
            ${pileSummaries.length ? renderDashboardBars(pileSummaries) : `<div class="empty-state">ยังไม่มีข้อมูลสำหรับวันที่เลือก</div>`}
          </div>
        </section>

        <section class="table-card">
          <div class="table-heading">สรุปตามกอง</div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>กอง</th>
                  <th>น้ำหนักน้ำ</th>
                  <th>น้ำหนักดอก</th>
                  <th>รวม</th>
                  <th>รวมเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${
                  pileSummaries.length
                    ? pileSummaries.map(renderPileSummaryRow).join("")
                    : `<tr><td colspan="5" class="empty-cell">ยังไม่มีข้อมูลสำหรับวันที่เลือก</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดรายการ</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>เวลา</th>
                <th>รหัสพนักงาน</th>
                <th>ชื่อพนักงาน</th>
                <th>กอง</th>
                <th>น้ำหนักน้ำ</th>
                <th>น้ำหนักดอก</th>
                <th>รวมเงิน</th>
                <th>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>
              ${
                records.length
                  ? records.map(renderDashboardDetailRow).join("")
                  : `<tr><td colspan="8" class="empty-cell">ยังไม่มีข้อมูลสำหรับวันที่เลือก</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

function exportSummaryData() {
  const exportRange = getSummaryExportRange();
  const selectedSections = getSelectedSummaryExportSections();

  if (!selectedSections.length) {
    setSummaryExportMessage("กรุณาเลือกข้อมูลและฟิลด์ที่ต้องการ Export อย่างน้อย 1 รายการ", "error");
    summaryMainExportMenuOpen = true;
    render();
    return;
  }

  const records = getDashboardRecordsForRange(exportRange.startDate, exportRange.endDate);
  if (!records.length) {
    setSummaryExportMessage("ไม่มีข้อมูลผลผลิต/น้ำหนักในช่วงวันที่เลือก จึงยัง Export ไม่ได้", "error");
    summaryMainExportMenuOpen = true;
    render();
    return;
  }

  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);
  const rangeLabel =
    exportRange.startDate === exportRange.endDate
      ? exportRange.startDate
      : `${exportRange.startDate} ถึง ${exportRange.endDate}`;
  const lines = [
    csvRow(["รายงานสรุปผลทั้งหมด"]),
    csvRow(["ช่วงวันที่", rangeLabel]),
    ""
  ];

  if (selectedSections.includes("overview")) {
    const overviewRows = [
      ["totalWeight", "น้ำหนักรวมทั้งหมด (กก.)", totals.total],
      ["water", "น้ำหนักน้ำ (กก.)", totals.water],
      ["flower", "น้ำหนักดอก (กก.)", totals.flower],
      ["grades", "ทุเรียนเกรด A-E", DURIAN_GRADES.map((grade) => `${grade} ${numberText(totals.grades[grade])}`).join(" | ")],
      ["amount", "ยอดเงินรวม", totals.amount],
      ["employees", "พนักงานที่มีรายการ", totals.people.size],
      ["records", "จำนวนรายการ", records.length]
    ].filter(([key]) => summaryExportFields.overview[key]);
    lines.push(csvRow(["ภาพรวม"]));
    lines.push(csvRow(["หัวข้อ", "ค่า"]));
    overviewRows.forEach(([, label, value]) => lines.push(csvRow([label, value])));
    lines.push("");
  }

  if (selectedSections.includes("piles")) {
    const fields = summaryExportFieldGroups.piles.filter((field) => summaryExportFields.piles[field.key]);
    const getValue = {
      pile: (item) => `กอง ${item.pile}`,
      water: (item) => item.water,
      flower: (item) => item.flower,
      grades: (item) => DURIAN_GRADES.map((grade) => `${grade} ${numberText(item.grades?.[grade] || 0)}`).join(" | "),
      total: (item) => item.total,
      amount: (item) => item.amount
    };
    lines.push(csvRow(["สรุปตามกอง"]));
    lines.push(csvRow(fields.map((field) => field.label)));
    pileSummaries.forEach((item) => lines.push(csvRow(fields.map((field) => getValue[field.key](item)))));
    lines.push("");
  }

  if (selectedSections.includes("details")) {
    const fields = summaryExportFieldGroups.details.filter((field) => summaryExportFields.details[field.key]);
    const getValue = {
      date: (record) => getRecordDate(record),
      time: (record) => record.record_time || "",
      empCode: (record) => record.emp_code || "",
      employeeName: (record) => {
        const employee = getEmployees().find((item) => item.id === record.employee_id);
        return record.employee_name || employee?.fullname || "";
      },
      pile: (record) => record.pile_no || record.pile || "",
      water: (record) => record.water_weight || record.water || 0,
      flower: (record) => record.flower_weight || record.flower || 0,
      grades: (record) => isDurianFruit(productionFruitTypeForRecord(record)) ? formatDurianGradeBreakdown(record, " | ") : "-",
      total: (record) => getRecordTotalWeight(record),
      amount: (record) => record.total_amount || record.grand_total || 0,
      createdBy: (record) => record.created_by || ""
    };
    lines.push(csvRow(["รายละเอียด"]));
    lines.push(csvRow(fields.map((field) => field.label)));
    records.forEach((record) => lines.push(csvRow(fields.map((field) => getValue[field.key](record)))));
  }

  downloadTextFile(
    `summary-${exportRange.startDate}-to-${exportRange.endDate}.csv`,
    `\ufeff${lines.join("\r\n")}`
  );
  setSummaryExportMessage(`Export CSV ข้อมูลช่วงวันที่ ${rangeLabel} เรียบร้อยแล้ว`);
  summaryMainExportMenuOpen = false;
  render();
}

async function exportProductionSummaryReport(user, format) {
  const exportRange = getSummaryExportRange();
  const records = getDashboardRecordsForRange(exportRange.startDate, exportRange.endDate);
  const selectedSections = getSelectedSummaryExportSections();

  if (!selectedSections.length) {
    setSummaryExportMessage("กรุณาเลือกข้อมูลและฟิลด์ที่ต้องการ Export อย่างน้อย 1 รายการ", "error");
    summaryMainExportMenuOpen = true;
    render();
    return;
  }

  if (!records.length) {
    setSummaryExportMessage("ไม่มีข้อมูลผลผลิต/น้ำหนักในช่วงวันที่เลือก จึงยัง Export ไม่ได้", "error");
    summaryMainExportMenuOpen = true;
    render();
    return;
  }

  const endpoint = format === "excel" ? "production-summary-excel" : "production-summary-pdf";
  setSummaryExportMessage(`กำลังสร้างไฟล์ ${format === "excel" ? "Excel" : "PDF"} สรุปผลผลิต...`);
  summaryMainExportMenuOpen = true;
  render();

  try {
    await downloadReport(`${REPORT_API_BASE}/reports/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getSummaryExportPayload(user, format))
    });
    setSummaryExportMessage(`Export ${format === "excel" ? "Excel" : "PDF"} สรุปผลผลิต ${exportRange.startDate} ถึง ${exportRange.endDate} เรียบร้อยแล้ว`);
    summaryMainExportMenuOpen = false;
  } catch (error) {
    setSummaryExportMessage(`${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`, "error");
    summaryMainExportMenuOpen = true;
  }

  render();
}

function bindSummaryAllEvents() {
  const user = getSession()?.user;
  document.querySelector("#summaryDate")?.addEventListener("change", (event) => {
    summaryDate = event.target.value || new Date().toISOString().slice(0, 10);
    summaryExportStartDate = summaryDate;
    summaryExportEndDate = summaryDate;
    summaryMainExportMenuOpen = false;
    summaryExportMessage = "";
    render();
  });

  document.querySelector("#summaryExportStart")?.addEventListener("change", (event) => {
    summaryExportStartDate = event.target.value || getSelectedSummaryDate();
    summaryExportMessage = "";
    render();
  });

  document.querySelector("#summaryExportEnd")?.addEventListener("change", (event) => {
    summaryExportEndDate = event.target.value || summaryExportStartDate || getSelectedSummaryDate();
    summaryExportMessage = "";
    render();
  });

  document.querySelectorAll("[data-summary-export-option]").forEach((input) => {
    input.addEventListener("change", () => {
      summaryExportOptions[input.dataset.summaryExportOption] = input.checked;
      summaryExportMessage = "";
      render();
    });
  });

  document.querySelectorAll("[data-summary-export-field]").forEach((input) => {
    input.addEventListener("change", () => {
      const [section, field] = String(input.dataset.summaryExportField || "").split(".");
      if (summaryExportFields[section] && field) {
        summaryExportFields[section][field] = input.checked;
      }
      summaryExportMessage = "";
      render();
    });
  });

  document.querySelector("#toggleSummaryMainExportMenu")?.addEventListener("click", () => {
    summaryMainExportMenuOpen = !summaryMainExportMenuOpen;
    render();
  });

  document.querySelector("#exportSummaryCsv")?.addEventListener("click", exportSummaryData);
  document.querySelector("#exportSummaryMainPdf")?.addEventListener("click", () => {
    exportProductionSummaryReport(user, "pdf");
  });
  document.querySelector("#exportSummaryMainExcel")?.addEventListener("click", () => {
    exportProductionSummaryReport(user, "excel");
  });
}

const groupReportDefaultGroups = ["เหมาโรงงาน", "เหมา(นนท์)", "เหมาปุ้ย"];

function normalizeGroupReportRange() {
  return normalizeDateRange(groupReportStartDate, groupReportEndDate);
}

function getProductionFruitLabel(fruitId) {
  if (!fruitId || fruitId === "all") return "ทั้งหมด";
  return productionFruitOptions.find((item) => item.id === fruitId)?.label || fruitId;
}

function getGroupReportPayGroups() {
  return [...groupReportDefaultGroups];
}

function getGroupReportRecords() {
  const range = normalizeGroupReportRange();
  const employees = getEmployees().filter((employee) => employee.status === "Active");
  const employeeMap = new Map(employees.map((employee) => [String(employee.id), employee]));
  const employeeCodeMap = new Map(employees.map((employee) => [String(employee.emp_code), employee]));

  return getProductionRecords()
    .map((record) => {
      const employee =
        employeeMap.get(String(record.employee_id || "")) ||
        employeeCodeMap.get(String(record.emp_code || ""));
      if (!employee) return null;

      const payGroup = getEmployeePayGroup(employee);
      const fruitId = productionFruitTypeForRecord(record);
      if (!groupReportDefaultGroups.includes(payGroup)) return null;
      return {
        ...record,
        employee,
        employee_id: employee.id || record.employee_id,
        emp_code: employee.emp_code || record.emp_code,
        employee_name: employee.fullname || record.employee_name,
        pay_group: payGroup,
        fruit_type: fruitId,
        fruit_label: getProductionFruitLabel(fruitId),
        record_date: getRecordDate(record)
      };
    })
    .filter(Boolean)
    .filter((record) => {
      const matchDate = record.record_date >= range.startDate && record.record_date <= range.endDate;
      const matchGroup = groupReportGroup === "all" || record.pay_group === groupReportGroup;
      const matchFruit = groupReportFruit === "all" || record.fruit_type === groupReportFruit;
      return matchDate && matchGroup && matchFruit;
    })
    .sort((a, b) =>
      `${a.pay_group} ${a.fruit_label} ${a.record_date} ${a.emp_code || ""}`.localeCompare(
        `${b.pay_group} ${b.fruit_label} ${b.record_date} ${b.emp_code || ""}`,
        "th"
      )
    );
}

function summarizeGroupReportRows(records, mode = "group") {
  const range = normalizeGroupReportRange();
  const summaries = new Map();
  records.forEach((record) => {
    const water = Number(record.water_weight || record.water || 0);
    const flower = Number(record.flower_weight || record.flower || 0);
    const amount = Number(record.total_amount || record.grand_total || 0);
    const key = mode === "fruit" ? `${record.pay_group}__${record.fruit_type}` : record.pay_group;

    if (!summaries.has(key)) {
      summaries.set(key, {
        key,
        pay_group: record.pay_group,
        fruit_type: mode === "fruit" ? record.fruit_type : "all",
        fruit_label: mode === "fruit" ? record.fruit_label : "ทั้งหมด",
        employees: new Set(),
        records: 0,
        water: 0,
        flower: 0,
        grades: createEmptyDurianGradeWeights(0),
        total: 0,
        amount: 0,
        deduction_amount: 0,
        withholding_tax_amount: 0,
        bonus_amount: 0,
        net_amount: 0,
        deductedEmployees: new Set()
      });
    }

    const summary = summaries.get(key);
    const employeeKey = record.employee_id || record.emp_code || record.employee_name || "";
    summary.employees.add(employeeKey);
    summary.records += 1;
    summary.water += water;
    summary.flower += flower;
    DURIAN_GRADES.forEach((grade) => summary.grades[grade] += getRecordGradeWeights(record)[grade]);
    summary.total += getRecordTotalWeight(record);
    summary.amount += amount;
    if (mode === "group" && !summary.deductedEmployees.has(employeeKey)) {
      summary.deductedEmployees.add(employeeKey);
      summary.deduction_amount += getDeductionTotalForEmployee(
        "production",
        record.employee || { id: record.employee_id, emp_code: record.emp_code },
        range.startDate,
        range.endDate
      );
      summary.bonus_amount += getBonusTotalForEmployee(
        "production",
        record.employee || { id: record.employee_id, emp_code: record.emp_code },
        range.startDate,
        range.endDate
      );
    }
  });

  return Array.from(summaries.values())
    .map((summary) => ({
      ...summary,
      withholding_tax_amount: getProductionWithholdingTax(summary.pay_group, summary.amount),
      net_amount: Math.max(
        0,
        Number(summary.amount || 0) + Number(summary.bonus_amount || 0)
          - Number(summary.deduction_amount || 0)
          - getProductionWithholdingTax(summary.pay_group, summary.amount)
      )
    }))
    .sort((a, b) =>
      `${a.pay_group} ${a.fruit_label}`.localeCompare(`${b.pay_group} ${b.fruit_label}`, "th")
    );
}

function getGroupReportEmployeeRows(records) {
  const range = normalizeGroupReportRange();
  const rows = new Map();
  records.forEach((record) => {
    const key = record.employee_id || record.emp_code || record.employee_name || "";
    const water = Number(record.water_weight || record.water || 0);
    const flower = Number(record.flower_weight || record.flower || 0);
    const amount = Number(record.total_amount || record.grand_total || 0);
    if (!rows.has(key)) {
      rows.set(key, {
        emp_code: record.emp_code || record.employee?.emp_code || "-",
        fullname: record.employee_name || record.employee?.fullname || "-",
        pay_group: record.pay_group,
        records: 0,
        water: 0,
        flower: 0,
        grades: createEmptyDurianGradeWeights(0),
        total: 0,
        amount: 0,
        deduction_amount: getDeductionTotalForEmployee(
          "production",
          record.employee || { id: record.employee_id, emp_code: record.emp_code },
          range.startDate,
          range.endDate
        ),
        withholding_tax_amount: 0,
        bonus_amount: getBonusTotalForEmployee(
          "production",
          record.employee || { id: record.employee_id, emp_code: record.emp_code },
          range.startDate,
          range.endDate
        ),
        net_amount: 0
      });
    }
    const row = rows.get(key);
    row.records += 1;
    row.water += water;
    row.flower += flower;
    DURIAN_GRADES.forEach((grade) => row.grades[grade] += getRecordGradeWeights(record)[grade]);
    row.total += getRecordTotalWeight(record);
    row.amount += amount;
    row.withholding_tax_amount = getProductionWithholdingTax(row.pay_group, row.amount);
    row.net_amount = Math.max(
      0,
      Number(row.amount || 0) + Number(row.bonus_amount || 0)
        - Number(row.deduction_amount || 0)
        - Number(row.withholding_tax_amount || 0)
    );
  });
  return Array.from(rows.values()).sort((a, b) =>
    `${a.pay_group} ${a.emp_code}`.localeCompare(`${b.pay_group} ${b.emp_code}`, "th")
  );
}

function getGroupReportTotals(groupRows) {
  return groupRows.reduce(
    (totals, row) => {
      row.employees.forEach((employee) => totals.employees.add(employee));
      totals.records += row.records;
      totals.water += row.water;
      totals.flower += row.flower;
      DURIAN_GRADES.forEach((grade) => totals.grades[grade] += Number(row.grades?.[grade] || 0));
      totals.total += row.total;
      totals.amount += row.amount;
      totals.deduction_amount += Number(row.deduction_amount || 0);
      totals.withholding_tax_amount += Number(row.withholding_tax_amount || 0);
      totals.bonus_amount += Number(row.bonus_amount || 0);
      totals.net_amount += Number(row.net_amount ?? row.amount ?? 0);
      return totals;
    },
    { employees: new Set(), records: 0, water: 0, flower: 0, grades: createEmptyDurianGradeWeights(0), total: 0, amount: 0, deduction_amount: 0, withholding_tax_amount: 0, bonus_amount: 0, net_amount: 0 }
  );
}

function getTimeGroupReportGroups() {
  return ["กลุ่มปกติ-347", "กลุ่มพิเศษ"];
}

function getTimeGroupReportRecords() {
  const range = normalizeGroupReportRange();
  const employees = getTimeEmployees().filter((employee) => employee.status === "Active");
  const employeeMap = new Map(employees.map((employee) => [String(employee.id), employee]));
  const employeeCodeMap = new Map(employees.map((employee) => [String(employee.emp_code), employee]));
  const records = getTimeRecords().filter((record) => {
    const recordDate = record.record_date || "";
    return recordDate >= range.startDate && recordDate <= range.endDate;
  });

  return combineTimeRecordsByEmployeeDate(records)
    .map((record) => {
      const employee =
        employeeMap.get(String(record.employee_id || "")) ||
        employeeCodeMap.get(String(record.emp_code || ""));
      if (!employee) return null;

      const typeOption = getTimeEmployeeTypeOption(employee.employee_type || record.employee_type);
      const reportGroupLabel = getTimeReportGroupLabel(typeOption.id);
      const enrichedRecord = {
        ...record,
        employee,
        employee_type: typeOption.id,
        employee_type_label: reportGroupLabel,
        employee_wage_group_label: typeOption.shortLabel,
        daily_wage: Number(employee.daily_wage || record.daily_wage || typeOption.dailyWage),
        ot_hourly_rate: Number(employee.ot_hourly_rate || record.ot_hourly_rate || TIME_OT_HOURLY_RATE),
        fullname: employee.fullname || record.fullname || "-",
        emp_code: employee.emp_code || record.emp_code || "-",
        department: employee.department || record.department || "-"
      };
      const receiptRow = getTimeReceiptRow(enrichedRecord);
      return {
        ...enrichedRecord,
        normal_hours: receiptRow.normalHours,
        ot_hours: receiptRow.otHours,
        normal_amount: receiptRow.normalAmount,
        ot_amount: receiptRow.otAmount,
        total_amount: receiptRow.totalAmount
      };
    })
    .filter(Boolean)
    .filter((record) => groupReportGroup === "all" || record.employee_type_label === groupReportGroup)
    .sort((a, b) =>
      `${a.employee_type_label} ${a.record_date || ""} ${a.emp_code || ""}`.localeCompare(
        `${b.employee_type_label} ${b.record_date || ""} ${b.emp_code || ""}`,
        "th"
      )
    );
}

function summarizeTimeGroupReportRows(records) {
  const range = normalizeGroupReportRange();
  const summaries = new Map();
  records.forEach((record) => {
    const key = record.employee_type_label;
    if (!summaries.has(key)) {
      summaries.set(key, {
        key,
        pay_group: key,
        employees: new Set(),
        records: 0,
        net_minutes: 0,
        normal_hours: 0,
        ot_hours: 0,
        normal_amount: 0,
        ot_amount: 0,
        amount: 0,
        deduction_amount: 0,
        bonus_amount: 0,
        net_amount: 0,
        deductedEmployees: new Set()
      });
    }
    const summary = summaries.get(key);
    const employeeKey = record.employee_id || record.emp_code || record.fullname || "";
    summary.employees.add(employeeKey);
    summary.records += 1;
    summary.net_minutes += Number(record.net_minutes) || 0;
    summary.normal_hours += Number(record.normal_hours) || 0;
    summary.ot_hours += Number(record.ot_hours) || 0;
    summary.normal_amount += Number(record.normal_amount) || 0;
    summary.ot_amount += Number(record.ot_amount) || 0;
    summary.amount += Number(record.total_amount) || 0;
    if (!summary.deductedEmployees.has(employeeKey)) {
      summary.deductedEmployees.add(employeeKey);
      summary.deduction_amount += getDeductionTotalForEmployee(
        "time",
        record.employee || { id: record.employee_id, emp_code: record.emp_code },
        range.startDate,
        range.endDate
      );
      summary.bonus_amount += getBonusTotalForEmployee(
        "time",
        record.employee || { id: record.employee_id, emp_code: record.emp_code },
        range.startDate,
        range.endDate
      );
    }
  });
  return Array.from(summaries.values())
    .map((summary) => ({
      ...summary,
      net_amount: Math.max(0, Number(summary.amount || 0) + Number(summary.bonus_amount || 0) - Number(summary.deduction_amount || 0))
    }))
    .sort((a, b) => a.pay_group.localeCompare(b.pay_group, "th"));
}

function getTimeGroupReportEmployeeRows(records) {
  const range = normalizeGroupReportRange();
  const rows = new Map();
  records.forEach((record) => {
    const key = record.employee_id || record.emp_code || record.fullname || "";
    if (!rows.has(key)) {
      rows.set(key, {
        pay_group: record.employee_type_label,
        emp_code: record.emp_code || "-",
        fullname: record.fullname || "-",
        records: 0,
        net_minutes: 0,
        normal_hours: 0,
        ot_hours: 0,
        amount: 0,
        deduction_amount: getDeductionTotalForEmployee(
          "time",
          record.employee || { id: record.employee_id, emp_code: record.emp_code },
          range.startDate,
          range.endDate
        ),
        bonus_amount: getBonusTotalForEmployee(
          "time",
          record.employee || { id: record.employee_id, emp_code: record.emp_code },
          range.startDate,
          range.endDate
        ),
        net_amount: 0
      });
    }
    const row = rows.get(key);
    row.records += 1;
    row.net_minutes += Number(record.net_minutes) || 0;
    row.normal_hours += Number(record.normal_hours) || 0;
    row.ot_hours += Number(record.ot_hours) || 0;
    row.amount += Number(record.total_amount) || 0;
    row.net_amount = Math.max(0, Number(row.amount || 0) + Number(row.bonus_amount || 0) - Number(row.deduction_amount || 0));
  });
  return Array.from(rows.values()).sort((a, b) =>
    `${a.pay_group} ${a.emp_code}`.localeCompare(`${b.pay_group} ${b.emp_code}`, "th")
  );
}

function getTimeGroupReportTotals(groupRows) {
  return groupRows.reduce(
    (totals, row) => {
      row.employees.forEach((employee) => totals.employees.add(employee));
      totals.records += row.records;
      totals.net_minutes += row.net_minutes;
      totals.normal_hours += row.normal_hours;
      totals.ot_hours += row.ot_hours;
      totals.amount += row.amount;
      totals.deduction_amount += Number(row.deduction_amount || 0);
      totals.bonus_amount += Number(row.bonus_amount || 0);
      totals.net_amount += Number(row.net_amount ?? row.amount ?? 0);
      return totals;
    },
    { employees: new Set(), records: 0, net_minutes: 0, normal_hours: 0, ot_hours: 0, amount: 0, deduction_amount: 0, bonus_amount: 0, net_amount: 0 }
  );
}

function renderGroupReportSummaryRow(row, showFruit = false) {
  return `
    <tr>
      <td><strong>${escapeHtml(row.pay_group)}</strong></td>
      ${showFruit ? `<td>${escapeHtml(row.fruit_label)}</td>` : ""}
      <td>${row.employees.size.toLocaleString("th-TH")}</td>
      <td>${row.records.toLocaleString("th-TH")}</td>
      <td>${compactNumberText(row.water)}</td>
      <td>${compactNumberText(row.flower)}</td>
      <td>${getDurianGradeTotal(row.grades) > 0 ? DURIAN_GRADES.map((grade) => `${grade}:${compactNumberText(row.grades[grade])}`).join(" · ") : "-"}</td>
      <td><strong>${compactNumberText(row.total)}</strong></td>
      <td><strong>${money(row.amount)}</strong></td>
      <td>${money(row.bonus_amount || 0)}</td>
      <td>${money(row.deduction_amount || 0)}</td>
      <td>${money(row.withholding_tax_amount || 0)}</td>
      <td><strong>${money(row.net_amount ?? row.amount)}</strong></td>
    </tr>
  `;
}

function renderGroupReportEmployeeRow(row) {
  return `
    <tr>
      <td>${escapeHtml(row.pay_group)}</td>
      <td><strong>${escapeHtml(row.emp_code)}</strong></td>
      <td>${escapeHtml(row.fullname)}</td>
      <td>${row.records.toLocaleString("th-TH")}</td>
      <td>${numberText(row.water)}</td>
      <td>${numberText(row.flower)}</td>
      <td>${getDurianGradeTotal(row.grades) > 0 ? DURIAN_GRADES.map((grade) => `${grade}:${numberText(row.grades[grade])}`).join(" · ") : "-"}</td>
      <td><strong>${numberText(row.total)}</strong></td>
      <td><strong>${money(row.amount)}</strong></td>
      <td>${money(row.bonus_amount || 0)}</td>
      <td>${money(row.deduction_amount || 0)}</td>
      <td>${money(row.withholding_tax_amount || 0)}</td>
      <td><strong>${money(row.net_amount ?? row.amount)}</strong></td>
    </tr>
  `;
}

function renderGroupReportDetailRow(record) {
  return `
    <tr>
      <td>${escapeHtml(record.record_date || "-")}</td>
      <td>${escapeHtml(record.pay_group)}</td>
      <td>${escapeHtml(record.fruit_label)}</td>
      <td>${escapeHtml(record.emp_code || "-")}</td>
      <td>${escapeHtml(record.employee_name || record.employee?.fullname || "-")}</td>
      <td>${escapeHtml(record.pile_no || record.pile || "-")}</td>
      <td>${numberText(record.water_weight || record.water || 0)}</td>
      <td>${numberText(record.flower_weight || record.flower || 0)}</td>
      <td>${isDurianFruit(record.fruit_type) ? formatDurianGradeBreakdown(record) : "-"}</td>
      <td><strong>${money(record.total_amount || record.grand_total || 0)}</strong></td>
    </tr>
  `;
}

function renderTimeGroupReportSummaryRow(row) {
  return `
    <tr>
      <td><strong>${escapeHtml(row.pay_group)}</strong></td>
      <td>${row.employees.size.toLocaleString("th-TH")}</td>
      <td>${row.records.toLocaleString("th-TH")}</td>
      <td>${escapeHtml(formatMinutesToHourText(row.net_minutes))}</td>
      <td>${numberText(row.normal_hours)}</td>
      <td>${numberText(row.ot_hours)}</td>
      <td><strong>${money(row.amount)}</strong></td>
      <td>${money(row.bonus_amount || 0)}</td>
      <td>${money(row.deduction_amount || 0)}</td>
      <td><strong>${money(row.net_amount ?? row.amount)}</strong></td>
    </tr>
  `;
}

function renderTimeGroupReportEmployeeRow(row) {
  return `
    <tr>
      <td>${escapeHtml(row.pay_group)}</td>
      <td><strong>${escapeHtml(row.emp_code)}</strong></td>
      <td>${escapeHtml(row.fullname)}</td>
      <td>${row.records.toLocaleString("th-TH")}</td>
      <td>${escapeHtml(formatMinutesToHourText(row.net_minutes))}</td>
      <td>${numberText(row.normal_hours)}</td>
      <td>${numberText(row.ot_hours)}</td>
      <td><strong>${money(row.amount)}</strong></td>
      <td>${money(row.bonus_amount || 0)}</td>
      <td>${money(row.deduction_amount || 0)}</td>
      <td><strong>${money(row.net_amount ?? row.amount)}</strong></td>
    </tr>
  `;
}

function renderTimeGroupReportDetailRow(record) {
  return `
    <tr>
      <td>${escapeHtml(record.record_date || "-")}</td>
      <td>${escapeHtml(record.employee_type_label || "-")}</td>
      <td><strong>${escapeHtml(record.emp_code || "-")}</strong></td>
      <td>${escapeHtml(record.fullname || "-")}</td>
      <td>${escapeHtml(record.clock_in || "-")}</td>
      <td>${escapeHtml(record.clock_out || "-")}</td>
      <td>${escapeHtml(formatMinutesToHourText(record.net_minutes))}</td>
      <td>${numberText(record.ot_hourly_rate || TIME_OT_HOURLY_RATE)}</td>
      <td><strong>${money(record.total_amount || 0)}</strong></td>
    </tr>
  `;
}

function renderGroupReportBarChart(rows) {
  const maxValue = Math.max(1, ...rows.map((row) => row.total));
  return `
    <div class="group-report-bars">
      ${rows
        .map(
          (row) => `
            <div class="group-report-bar-item">
              <div class="group-report-bar-track">
                <div class="group-report-bar-fill" style="height:${Math.max(8, (row.total / maxValue) * 100)}%"></div>
              </div>
              <strong>${escapeHtml(row.pay_group)}</strong>
              <span>${compactNumberText(row.total)} กก.</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTimeGroupReportContent(records, groupRows, employeeRows, totals) {
  return `
    <div class="summary-metrics">
      <div class="metric-card metric-green"><span>เวลาสุทธิรวม</span><strong>${escapeHtml(formatMinutesToHourText(totals.net_minutes))}</strong><small>${formatDecimalHours(totals.net_minutes)} ชั่วโมง</small></div>
      <div class="metric-card metric-blue"><span>ยอดเงินรวม</span><strong>${money(totals.amount)}</strong><small>ก่อนหัก</small></div>
      <div class="metric-card metric-purple"><span>จำนวนกลุ่ม</span><strong>${groupRows.length.toLocaleString("th-TH")}</strong><small>${groupReportGroup === "all" ? "ทุกกลุ่ม" : groupReportGroup}</small></div>
      <div class="metric-card metric-orange"><span>เบี้ยขยัน / หัก</span><strong>${money(totals.bonus_amount || 0)} / ${money(totals.deduction_amount || 0)}</strong><small>สุทธิ ${money(totals.net_amount ?? totals.amount)}</small></div>
    </div>

    <section class="table-card">
      <div class="table-heading">สรุปตามกลุ่มเวลา</div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>กลุ่ม</th><th>คน</th><th>รายการ</th><th>เวลาสุทธิ</th><th>ชม.ปกติ</th><th>ชม.OT</th><th>รวมเงิน</th><th>เบี้ยขยัน</th><th>หัก</th><th>สุทธิ</th></tr></thead>
          <tbody>${groupRows.length ? groupRows.map(renderTimeGroupReportSummaryRow).join("") : `<tr><td colspan="10" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
        </table>
      </div>
    </section>

    <section class="table-card">
      <div class="table-heading">รายละเอียดพนักงานตามกลุ่มเวลา</div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>กลุ่ม</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>วัน</th><th>เวลาสุทธิ</th><th>ชม.ปกติ</th><th>ชม.OT</th><th>รวมเงิน</th><th>เบี้ยขยัน</th><th>หัก</th><th>สุทธิ</th></tr></thead>
          <tbody>${employeeRows.length ? employeeRows.map(renderTimeGroupReportEmployeeRow).join("") : `<tr><td colspan="11" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
        </table>
      </div>
    </section>

    <section class="table-card">
      <div class="table-heading">รายละเอียดรายการเวลา</div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>วันที่</th><th>กลุ่ม</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>เข้า</th><th>ออก</th><th>สุทธิ</th><th>OT/ชม.</th><th>รวมเงิน</th></tr></thead>
          <tbody>${records.length ? records.map(renderTimeGroupReportDetailRow).join("") : `<tr><td colspan="9" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSummaryGroupReport(moduleItem) {
  const range = normalizeGroupReportRange();
  const isTimeReport = groupReportMode === "time";
  const records = isTimeReport ? getTimeGroupReportRecords() : getGroupReportRecords();
  const groupRows = isTimeReport ? summarizeTimeGroupReportRows(records) : summarizeGroupReportRows(records, "group");
  const fruitRows = isTimeReport ? [] : summarizeGroupReportRows(records, "fruit");
  const employeeRows = isTimeReport ? getTimeGroupReportEmployeeRows(records) : getGroupReportEmployeeRows(records);
  const totals = isTimeReport ? getTimeGroupReportTotals(groupRows) : getGroupReportTotals(groupRows);
  const groupOptions = ["all", ...(isTimeReport ? getTimeGroupReportGroups() : getGroupReportPayGroups())];
  const fruitOptions = [{ id: "all", label: "ทั้งหมด" }, ...productionFruitOptions.map((item) => ({ id: item.id, label: item.label }))];

  return `
    <section class="summary-page group-report-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>ดูรายละเอียดตามกลุ่มของงานน้ำหนักหรือกลุ่มของพนักงานเวลา</p>
        </div>
        <button class="btn btn-outline" type="button" data-route="summary-all">กลับไปสรุปผลทั้งหมด</button>
      </div>

      ${
        groupReportMessage
          ? `<div class="alert ${groupReportMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(groupReportMessage)}</div>`
          : ""
      }

      <div class="module-tabs">
        <button class="module-tab ${groupReportMode === "production" ? "active" : ""}" type="button" data-group-report-mode="production">
          รายงานแบบกลุ่มตามน้ำหนัก
        </button>
        <button class="module-tab ${groupReportMode === "time" ? "active" : ""}" type="button" data-group-report-mode="time">
          รายงานแบบกลุ่มตามเวลา
        </button>
      </div>

      <section class="panel group-report-controls">
        <form class="group-report-form" id="groupReportForm">
          <label class="field">
            <span>จากวันที่</span>
            <input name="start_date" type="date" value="${escapeHtml(range.startDate)}" />
          </label>
          <label class="field">
            <span>ถึงวันที่</span>
            <input name="end_date" type="date" value="${escapeHtml(range.endDate)}" />
          </label>
          <label class="field">
            <span>กลุ่ม</span>
            <select name="pay_group">
              ${groupOptions.map((group) => `<option value="${escapeHtml(group)}" ${groupReportGroup === group ? "selected" : ""}>${escapeHtml(group === "all" ? "ทุกกลุ่ม" : group)}</option>`).join("")}
            </select>
          </label>
          ${isTimeReport ? "" : `
            <label class="field">
              <span>ผลไม้</span>
              <select name="fruit_type">
                ${fruitOptions.map((fruit) => `<option value="${escapeHtml(fruit.id)}" ${groupReportFruit === fruit.id ? "selected" : ""}>${escapeHtml(fruit.label)}</option>`).join("")}
              </select>
            </label>
            <label class="field">
              <span>มุมมอง</span>
              <select name="view_mode">
                <option value="group" ${groupReportView === "group" ? "selected" : ""}>ตามกลุ่ม</option>
                <option value="fruit" ${groupReportView === "fruit" ? "selected" : ""}>ตามกลุ่ม + ผลไม้</option>
              </select>
            </label>
          `}
          <button class="btn btn-primary" type="submit">แสดงข้อมูล</button>
        </form>
      </section>

      <section class="summary-export-panel group-report-export-panel">
        <div>
          <strong>Export / Print ${isTimeReport ? "รายงานแบบกลุ่มตามเวลา" : "รายงานแบบกลุ่มตามน้ำหนัก"}</strong>
          <span>เลือกก่อนพิมพ์ว่าจะส่งออกส่วนไหนบ้าง</span>
        </div>
        <div class="summary-export-options">
          <label><input type="checkbox" data-group-export-option="summary" ${groupReportExportOptions.summary ? "checked" : ""} /> สรุปตามกลุ่ม</label>
          ${isTimeReport ? "" : `<label><input type="checkbox" data-group-export-option="fruit" ${groupReportExportOptions.fruit ? "checked" : ""} /> แยกตามผลไม้</label>`}
          <label><input type="checkbox" data-group-export-option="employees" ${groupReportExportOptions.employees ? "checked" : ""} /> รายละเอียดพนักงาน</label>
          <label><input type="checkbox" data-group-export-option="details" ${groupReportExportOptions.details ? "checked" : ""} /> รายละเอียดรายการ</label>
        </div>
        <button class="btn btn-primary summary-export-button" id="toggleGroupReportExportMenu" type="button">Export</button>
        ${
          groupReportExportMenuOpen
            ? `
              <div class="time-summary-export-menu group-report-export-menu">
                <button class="time-export-choice" id="exportGroupReportPdf" type="button">
                  <strong>Export PDF</strong>
                  <span>ไฟล์รายงานตามตัวเลือกที่เลือกไว้</span>
                </button>
                <button class="time-export-choice" id="exportGroupReportExcel" type="button">
                  <strong>Export Excel</strong>
                  <span>ตารางข้อมูลละเอียดสำหรับนำไปทำงานต่อ</span>
                </button>
              </div>
            `
            : ""
        }
      </section>

      ${isTimeReport ? renderTimeGroupReportContent(records, groupRows, employeeRows, totals) : `
        <div class="summary-metrics">
        <div class="metric-card metric-green"><span>น้ำหนักรวม</span><strong>${numberText(totals.total)} กก.</strong><small>น้ำ ${numberText(totals.water)} | ดอก ${numberText(totals.flower)} | ทุเรียน ${numberText(getDurianGradeTotal(totals.grades))}</small></div>
        <div class="metric-card metric-blue"><span>ยอดเงินรวม</span><strong>${money(totals.amount)}</strong><small>ก่อนหัก</small></div>
        <div class="metric-card metric-purple"><span>จำนวนกลุ่ม</span><strong>${groupRows.length.toLocaleString("th-TH")}</strong><small>${groupReportGroup === "all" ? "ทุกกลุ่ม" : groupReportGroup}</small></div>
        <div class="metric-card metric-orange"><span>หักทั่วไป / หัก 3%</span><strong>${money(totals.deduction_amount || 0)} / ${money(totals.withholding_tax_amount || 0)}</strong><small>เบี้ยขยัน ${money(totals.bonus_amount || 0)} · สุทธิ ${money(totals.net_amount ?? totals.amount)}</small></div>
      </div>

      <section class="summary-grid group-report-top-grid">
        <section class="panel chart-panel">
          <div class="section-title-row">
            <h3>น้ำหนักตามกลุ่ม</h3>
            <span class="summary-mode-pill">${escapeHtml(getProductionFruitLabel(groupReportFruit))}</span>
          </div>
          ${groupRows.length ? renderGroupReportBarChart(groupRows) : `<div class="empty-state">ยังไม่มีข้อมูลตามตัวกรองที่เลือก</div>`}
        </section>

        <section class="table-card group-report-summary-card">
          <div class="table-heading">สรุปตามกลุ่ม</div>
          <div class="table-scroll">
            <table class="group-report-compact-table">
              <thead><tr><th>กลุ่ม</th><th>คน</th><th>รายการ</th><th>น้ำ</th><th>ดอก</th><th>เกรดทุเรียน A-E</th><th>รวม</th><th>เงิน</th><th>เบี้ยขยัน</th><th>หักทั่วไป</th><th>หัก 3%</th><th>สุทธิ</th></tr></thead>
              <tbody>${groupRows.length ? groupRows.map((row) => renderGroupReportSummaryRow(row)).join("") : `<tr><td colspan="12" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="table-card">
        <div class="table-heading">สรุปตามกลุ่มและผลไม้</div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>กลุ่ม</th><th>ผลไม้</th><th>จำนวนคน</th><th>รายการ</th><th>น้ำหนักน้ำ</th><th>น้ำหนักดอก</th><th>เกรดทุเรียน A-E</th><th>รวม</th><th>รวมเงิน</th><th>เบี้ยขยัน</th><th>หักทั่วไป</th><th>หัก 3%</th><th>สุทธิ</th></tr></thead>
            <tbody>${fruitRows.length ? fruitRows.map((row) => renderGroupReportSummaryRow(row, true)).join("") : `<tr><td colspan="13" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
          </table>
        </div>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดพนักงานในกลุ่ม</div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>กลุ่ม</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>รายการ</th><th>น้ำหนักน้ำ</th><th>น้ำหนักดอก</th><th>เกรดทุเรียน A-E</th><th>รวม</th><th>รวมเงิน</th><th>เบี้ยขยัน</th><th>หักทั่วไป</th><th>หัก 3%</th><th>สุทธิ</th></tr></thead>
            <tbody>${employeeRows.length ? employeeRows.map(renderGroupReportEmployeeRow).join("") : `<tr><td colspan="13" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
          </table>
        </div>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดรายการ</div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>วันที่</th><th>กลุ่ม</th><th>ผลไม้</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>กอง</th><th>น้ำหนักน้ำ</th><th>น้ำหนักดอก</th><th>เกรดทุเรียน A-E</th><th>รวมเงิน</th></tr></thead>
            <tbody>${records.length ? records.slice(0, 200).map(renderGroupReportDetailRow).join("") : `<tr><td colspan="10" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
          </table>
        </div>
      </section>
      `}
    </section>
  `;
}

function getGroupReportPayload(user, format) {
  const range = normalizeGroupReportRange();
  const records = getGroupReportRecords();
  const employeeKeys = new Set(records.map((record) => String(record.employee?.id || record.employee_id || "")));
  const employeeCodes = new Set(records.map((record) => String(record.employee?.emp_code || record.emp_code || "")));
  const employees = getEmployees().filter((employee) =>
    employee.status === "Active" &&
    (employeeKeys.has(String(employee.id)) || employeeCodes.has(String(employee.emp_code)))
  );
  return {
    start_date: range.startDate,
    end_date: range.endDate,
    pay_group: groupReportGroup,
    fruit_type: groupReportFruit,
    group_label: groupReportGroup === "all" ? "ทุกกลุ่ม" : groupReportGroup,
    fruit_label: getProductionFruitLabel(groupReportFruit),
    view_mode: groupReportView,
    export_options: { ...groupReportExportOptions },
    printed_by: user?.fullname || "System Admin",
    printed_by_position: getExportPositionLabel(user),
    employees,
    production_records: records,
    deduction_records: getAdjustmentRecordsForRange("production", range.startDate, range.endDate),
    export_format: format
  };
}

function getTimeGroupReportPayload(user, format) {
  const range = normalizeGroupReportRange();
  const records = getTimeGroupReportRecords();
  const groupRows = summarizeTimeGroupReportRows(records).map((row) => ({
    pay_group: row.pay_group,
    employees: row.employees.size,
    records: row.records,
    net_minutes: row.net_minutes,
    normal_hours: row.normal_hours,
    ot_hours: row.ot_hours,
    normal_amount: row.normal_amount,
    ot_amount: row.ot_amount,
    amount: row.amount,
    bonus_amount: row.bonus_amount || 0,
    deduction_amount: row.deduction_amount || 0,
    net_amount: row.net_amount ?? row.amount
  }));
  const employeeRows = getTimeGroupReportEmployeeRows(records).map((row) => ({
    ...row,
    bonus_amount: row.bonus_amount || 0,
    deduction_amount: row.deduction_amount || 0,
    net_amount: row.net_amount ?? row.amount
  }));
  return {
    start_date: range.startDate,
    end_date: range.endDate,
    group_label: groupReportGroup === "all" ? "ทุกกลุ่ม" : groupReportGroup,
    export_options: { ...groupReportExportOptions, fruit: false },
    printed_by: user?.fullname || "System Admin",
    printed_by_position: getExportPositionLabel(user),
    time_group_rows: groupRows,
    time_employee_rows: employeeRows,
    time_group_records: records,
    deduction_records: getAdjustmentRecordsForRange("time", range.startDate, range.endDate),
    export_format: format
  };
}

async function exportGroupReport(user, format) {
  const isTimeReport = groupReportMode === "time";
  const records = isTimeReport ? getTimeGroupReportRecords() : getGroupReportRecords();
  const hasOption = isTimeReport
    ? Boolean(groupReportExportOptions.summary || groupReportExportOptions.employees || groupReportExportOptions.details)
    : Object.values(groupReportExportOptions).some(Boolean);
  if (!hasOption) {
    groupReportMessage = "กรุณาเลือกส่วนรายงานที่ต้องการ Export อย่างน้อย 1 รายการ";
    groupReportMessageType = "error";
    groupReportExportMenuOpen = true;
    render();
    return;
  }
  if (!records.length) {
    groupReportMessage = "ไม่มีข้อมูลตามตัวกรองที่เลือก จึงยัง Export ไม่ได้";
    groupReportMessageType = "error";
    groupReportExportMenuOpen = true;
    render();
    return;
  }

  const endpoint = isTimeReport
    ? (format === "excel" ? "time-group-report-excel" : "time-group-report-pdf")
    : (format === "excel" ? "group-report-excel" : "group-report-pdf");
  groupReportMessage = `กำลังสร้างไฟล์ ${format === "excel" ? "Excel" : "PDF"} ${isTimeReport ? "รายงานแบบกลุ่มตามเวลา" : "รายงานแบบกลุ่ม"}...`;
  groupReportMessageType = "success";
  groupReportExportMenuOpen = true;
  render();

  try {
    await downloadReport(`${REPORT_API_BASE}/reports/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isTimeReport ? getTimeGroupReportPayload(user, format) : getGroupReportPayload(user, format))
    });
    const range = normalizeGroupReportRange();
    groupReportMessage = `Export ${isTimeReport ? "รายงานแบบกลุ่มตามเวลา" : "รายงานแบบกลุ่ม"} ${range.startDate} ถึง ${range.endDate} เรียบร้อยแล้ว`;
    groupReportMessageType = "success";
    groupReportExportMenuOpen = false;
  } catch (error) {
    groupReportMessage = `${error instanceof Error ? error.message : "Export failed."} (${REPORT_API_BASE})`;
    groupReportMessageType = "error";
    groupReportExportMenuOpen = true;
  }
  render();
}

function bindSummaryGroupReportEvents(user) {
  document.querySelectorAll("[data-group-report-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      groupReportMode = button.dataset.groupReportMode || "production";
      groupReportGroup = "all";
      groupReportFruit = "all";
      groupReportView = "group";
      groupReportMessage = "";
      groupReportExportMenuOpen = false;
      render();
    });
  });

  document.querySelector("#groupReportForm")?.addEventListener("change", (event) => {
    const form = new FormData(event.currentTarget);
    groupReportStartDate = form.get("start_date") || new Date().toISOString().slice(0, 10);
    groupReportEndDate = form.get("end_date") || groupReportStartDate;
    groupReportGroup = form.get("pay_group") || "all";
    groupReportFruit = groupReportMode === "time" ? "all" : form.get("fruit_type") || "all";
    groupReportView = groupReportMode === "time" ? "group" : form.get("view_mode") || "group";
    groupReportMessage = "";
    groupReportExportMenuOpen = false;
    render();
  });

  document.querySelector("#groupReportForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  document.querySelectorAll("[data-group-export-option]").forEach((input) => {
    input.addEventListener("change", () => {
      groupReportExportOptions[input.dataset.groupExportOption] = input.checked;
      groupReportMessage = "";
      render();
    });
  });

  document.querySelector("#toggleGroupReportExportMenu")?.addEventListener("click", () => {
    groupReportExportMenuOpen = !groupReportExportMenuOpen;
    render();
  });

  document.querySelector("#exportGroupReportPdf")?.addEventListener("click", () => exportGroupReport(user, "pdf"));
  document.querySelector("#exportGroupReportExcel")?.addEventListener("click", () => exportGroupReport(user, "excel"));
}

window.addEventListener("hashchange", render);
window.addEventListener("focus", refreshOnlineUsers);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshOnlineUsers();
});
startLiveClock();
render();
