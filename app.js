const SESSION_KEY = "apws_contest_session";
const EMPLOYEES_KEY = "apws_contest_employees";
const TIME_EMPLOYEES_KEY = "apws_contest_time_employees";
const WAGE_RATES_KEY = "apws_contest_wage_rates";
const PRODUCTION_RECORDS_KEY = "apws_contest_production_records";
const PRODUCTION_INDEXED_DB_NAME = "apws_contest_production_v1";
const PRODUCTION_INDEXED_DB_VERSION = 1;
const PRODUCTION_CACHE_REVISION = "recovery-sync-2026-09-18";
const PRODUCTION_SESSIONS_KEY = "apws_contest_production_sessions";
const TIME_RECORDS_KEY = "apws_contest_time_records";
const TIME_SYNC_CURSOR_KEY = "apws_contest_time_sync_cursor";
const DEDUCTION_RECORDS_KEY = "apws_contest_deduction_records";
const AUDIT_LOG_KEY = "apws_contest_audit_log";
const AUDIT_SYNC_CURSOR_KEY = "apws_contest_audit_sync_cursor";
const CLOUD_MIGRATION_KEY = "apws_contest_cloud_migration_v2";
const ACCOUNT_USERS_KEY = "apws_contest_account_users";
const WITHHOLDING_TAX_GROUPS_KEY = "apws_contest_withholding_tax_groups";
const FRUIT_PILES_KEY = "apws_contest_fruit_piles";
const AUDIT_LOG_PASSWORD = "1150";
const ONLINE_CLIENT_KEY = "apws_contest_online_client_id";
const ONLINE_HEARTBEAT_INTERVAL_MS = 60000;
const HOME_STORAGE_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const LIVE_STATE_REFRESH_INTERVAL_MS = 60 * 1000;
const AUDIT_LOG_SYNC_DELAY_MS = 8000;
const CLOUD_SAVE_TIMEOUT_MS = 15000;
const CLOUD_SAVE_RETRY_DELAY_MS = 600;
const PRODUCTION_QUEUE_ACCEPT_TIMEOUT_MS = 5000;
const PRODUCTION_QUEUE_PRIMARY_TIMEOUT_MS = 3500;
const PRODUCTION_QUEUE_POLL_INTERVAL_MS = 1200;
const TIME_QUEUE_ACCEPT_TIMEOUT_MS = 3000;
const TIME_QUEUE_PRIMARY_TIMEOUT_MS = 2000;
const TIME_QUEUE_POLL_INTERVAL_MS = 1000;
const REPORT_API_BASE =
  // The desktop launcher opens index.html directly. It must use the same
  // cloud API as the hosted app, otherwise its browser-only data can never
  // reach iPad or other devices.
  location.protocol === "file:" ? "http://127.0.0.1:8787" : location.origin;
let onlineUserCount = 0;
let onlineHeartbeatTimer = null;
const TIME_DAILY_WAGE = 347;
const TIME_SPECIAL_DAILY_WAGE = 365;
const TIME_STANDARD_HOURS = 8;
const TIME_NORMAL_HOURLY_RATE = TIME_DAILY_WAGE / TIME_STANDARD_HOURS;
const TIME_OT_HOURLY_RATE = 50;
const timeRecruitmentGroupOptions = [
  { id: "factory", label: "กลุ่มโรงงาน" },
  { id: "champ", label: "กลุ่มแชมป์" }
];

function normalizeTimeRecruitmentGroup(value) {
  return timeRecruitmentGroupOptions.some((option) => option.id === value) ? value : null;
}

const timeEmployeeTypeOptions = [
  { id: "normal_347", label: "กลุ่มปกติ - 347 บาท/วัน", shortLabel: "กลุ่มปกติ-347", category: "normal", dailyWage: 347 },
  { id: "special_365", label: "กลุ่มพิเศษ - 365 บาท/วัน", shortLabel: "กลุ่มพิเศษ-365", category: "special", dailyWage: 365 },
  { id: "special_347", label: "กลุ่มพิเศษ - 347 บาท/วัน", shortLabel: "กลุ่มพิเศษ-347", category: "special", dailyWage: 347 },
  { id: "special_500", label: "กลุ่มพิเศษ - 500 บาท/วัน", shortLabel: "กลุ่มพิเศษ-500", category: "special", dailyWage: 500 },
  { id: "education_347", label: "กลุ่ม Education - 347 บาท/วัน", shortLabel: "Education-347", category: "special", dailyWage: 347 },
  { id: "office_347", label: "กลุ่ม Office", shortLabel: "Office", category: "office", dailyWage: 0 }
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
  { id: "room", label: "ค่าห้องพัก" },
  { id: "other", label: "อื่นๆ" }
];
const ATTENDANCE_BONUS_TYPE = "attendance_bonus";
const DAILY_OT_OVERRIDE_TYPE = "daily_ot_override";
const defaultFruitPiles = [
  { number: 1, name: "กอง 1", color: "#1d4ed8", visible: true },
  { number: 2, name: "กอง 2", color: "#dc2626", visible: true },
  { number: 3, name: "กอง 3", color: "#111111", visible: true },
  { number: 4, name: "กอง 4", color: "#7e22ce", visible: true },
  { number: 5, name: "กอง 5", color: "#15803d", visible: true },
  { number: 6, name: "กอง 6", color: "#92400e", visible: true }
];

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
const CUSTOM_ACCOUNT_ROLE_PREFIX = "custom:";
const NEW_ACCOUNT_ROLE_KEY = "__new_custom_role__";
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
    id: "inbound",
    label: "Stock ผลไม้",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "บันทึกรับซื้อผลไม้และต้นทุนจริงรายรายการ",
    icon: "⇩",
    hidden: true
  },
  {
    id: "stock",
    label: "Stock",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "Stock ผลไม้ ห้องเย็น บรรจุภัณฑ์ เบ็ดเตล็ด และสำนักงาน",
    icon: "▦"
  },
  {
    id: "stock-cold-room",
    label: "Stock ห้องเย็น",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "สินค้าแปรรูป พาเลต กล่อง และสินค้าฝากแช่ในห้องเย็น",
    hidden: true
  },
  {
    id: "stock-packaging",
    label: "Stock บรรจุภัณฑ์",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "รับเข้าและเบิกบรรจุภัณฑ์ พร้อมขนาด ราคา และเลขใบส่งของ",
    hidden: true
  },
  {
    id: "stock-supplies",
    label: "Stock เบ็ดเตล็ด",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "รับเข้าและเบิกของใช้โรงงาน ถุงมือ น้ำยา และสารเคมี",
    hidden: true
  },
  {
    id: "stock-office",
    label: "Stock สำนักงาน",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "รับเข้าและเบิกวัสดุสำนักงาน หมึก และอุปกรณ์ Office",
    hidden: true
  },
  {
    id: "inbound-fruits",
    label: "จัดการผลไม้ / ราคาแนะนำ",
    roles: ["admin", "hr", "supervisor"],
    description: "จัดการชนิดผลไม้และประวัติราคาแนะนำ",
    hidden: true
  },
  {
    id: "inbound-history",
    label: "รายการรับเข้า",
    roles: ["admin", "hr", "operator", "supervisor"],
    description: "ค้นหาและตรวจสอบรายการรับเข้าย้อนหลัง",
    hidden: true
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
    icon: "−",
    hidden: true
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
    id: "settings-pile-summary",
    label: "กองผลไม้",
    roles: ["admin"],
    description: "ตรวจสอบน้ำหนักและยอดเงินแยกตามกอง พร้อม Export PDF และ Excel",
    icon: "▦",
    hidden: true
  },
  {
    id: "record-report",
    label: "แจ้งปัญหาของเว็บ",
    roles: ["admin", "hr", "operator", "supervisor", "developer"],
    description: "แจ้งข้อผิดพลาดและติดตามสถานะการแก้ไข",
    icon: "▧"
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
    label: "บัญชีและค่าแรง",
    roles: ["admin", "hr", "operator", "supervisor", "developer"],
    description: "พื้นที่คำนวณ วางแผน และติดตามงานบัญชีจากข้อมูลที่กรอกเอง",
    icon: "◉"
  },
  {
    id: "secret-room",
    label: "Community",
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
  },
  {
    id: "pf-desktop-app",
    label: "APWS Desktop",
    roles: ["admin"],
    description: "รับข้อมูลชั่งจาก Desktop app และส่งข้อมูลหลักกลับไปใช้งาน",
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
  "settings-pile-summary",
  "account-management",
  "audit-log",
  "backup",
  "pf-desktop-app"
]);

modules.forEach((moduleItem) => {
  if (adminSettingsModuleIds.has(moduleItem.id)) {
    moduleItem.roles = ["admin"];
  }
});

const levelRouteAccess = {
  C1: ["dashboard", "production"],
  C2: ["dashboard", "production"],
  C3: ["dashboard", "production", "secret-room", "record-report"],
  C4: [
    "dashboard",
    "production",
    "stock",
    "stock-cold-room",
    "stock-packaging",
    "stock-supplies",
    "stock-office",
    "inbound",
    "inbound-fruits",
    "inbound-history",
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
    "settings-pile-summary",
    "accounting-control",
    "pf-desktop-app",
    "pile-management",
    "secret-room",
    "record-report"
  ],
  C5: modules.map((item) => item.id).filter((id) => id !== "backup"),
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
const PAY_GROUP_CUSTOM_TONE_COUNT = 6;
const PRODUCTION_WITHHOLDING_TAX_RATE = 0.03;
const defaultProductionWithholdingTaxGroups = ["เหมา(นนท์)", "เหมาปุ้ย"];
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

  if (toneMap.has(payGroup)) return toneMap.get(payGroup);
  const toneIndex = [...payGroup].reduce((sum, character) => sum + character.charCodeAt(0), 0) % PAY_GROUP_CUSTOM_TONE_COUNT;
  return `pay-group-custom-${toneIndex + 1}`;
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
let employeePageMode = "list";
let employeeMessage = "";
let employeeMessageType = "success";
let timeEmployeeSearch = "";
let editingTimeEmployeeId = null;
let timeEmployeePageMode = "list";
let timeEmployeeMessage = "";
let timeEmployeeMessageType = "success";
let accountSearch = "";
let editingAccountUserId = null;
let accountMode = "";
let accountMessage = "";
let accountMessageType = "success";
let backupMessage = "";
let backupMessageType = "success";
let desktopImportPreview = null;
let desktopImportMessage = "";
let desktopImportMessageType = "success";
let desktopImportBusy = false;
let backupUnlocked = false;
let backupAccessCode = "";
let backupActiveTab = "backup";
let backupSnapshot = null;
let backupSnapshotLoading = false;
let backupSelectedFile = null;
let backupSelectedData = null;
let backupFileValidation = null;
let backupRestoreConfirmOpen = false;
let backupClearConfirmOpen = false;
let backupClearScope = "main";
let backupBusy = false;
let issueReports = [];
let issueReportsLoaded = false;
let issueReportsLoading = false;
let issueReportMessage = "";
let issueReportMessageType = "success";
let issueReportSearch = "";
let issueReportStatusFilter = "all";
let issueReportSelectedId = null;
let issueReportAttachment = null;
let issueNotificationTimer = null;
let issueNotificationUsername = "";
let issueNotificationInitialized = false;
let issueNotificationUnreadCount = 0;
let issueNotificationLatestId = 0;
let homeStorageUsage = null;
let homeStorageUsageLoaded = false;
let homeStorageUsageLoading = false;
let homeStorageUsageError = "";
let homeStorageUsageTimer = null;
let homeStorageUsageSetupMissing = false;
let wageRateFilter = "all";
let currentRateDate = localDateInputValue();
let editingWageRateId = null;
let pileManagementMessage = "";
let pileManagementMessageType = "success";
let settingsPileSummaryDate = localDateInputValue();
let settingsPileSummaryFruit = "all";
let settingsPileSummaryMessage = "";
let settingsPileSummaryMessageType = "success";
let editingFruitPileNumber = null;
let fruitPileFormOpen = false;
let summaryDate = "";
let summaryExportStartDate = "";
let summaryExportEndDate = "";
let summaryFruitFilter = "mangosteen";
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
let summaryReportExportStartDate = localDateInputValue();
let summaryReportExportEndDate = localDateInputValue();
let summaryReportExportProduct = "all";
let summaryReportExportProductType = "ทั้งหมด";
let summaryReportExportMessage = "";
let summaryReportExportMessageType = "success";
let groupReportStartDate = localDateInputValue();
let groupReportEndDate = localDateInputValue();
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
let reportDate = localDateInputValue();
let selectedReportEmployeeIds = [];
let reportMessage = "";
let reportMessageType = "success";
let personalReportEmployeeId = "";
let personalReportStartDate = localDateInputValue();
let personalReportEndDate = localDateInputValue();
let personalReportMessage = "";
let personalReportMessageType = "success";
let personalReportActiveTab = "production";
let personalReportExportMenuOpen = false;
let personalReportFruitFilter = "mangosteen";
let timeRecordDate = localDateInputValue();
let timeSummaryStartDate = localDateInputValue();
let timeSummaryEndDate = localDateInputValue();
let timeSummaryDepartment = "all";
let timeSummaryMessage = "";
let timeSummaryMessageType = "success";
let timeSummaryExportMenuOpen = false;
let timeEntryMode = "weekly";
let timeView = "entry";
let timeRecordMessage = "";
let timeRecordMessageType = "success";
let weeklyTimeEmployeeCode = "";
let weeklyTimeDraft = Array.from({ length: 7 }, () => ({ clock_in: "", clock_out: "" }));
let editingTimeRecordId = null;
let timeRecordSaving = false;
let timeQueueItems = [];
let timeQueueLoading = false;
let timeQueueLoadedOnce = false;
let timeQueueLoadError = "";
let timeQueueFilter = "all";
let timeQueueActionId = null;
let editingTimeQueueItem = null;
const timeQueueTrackers = new Map();
let deductionActiveTab = "production";
let deductionBonusEmployeeKind = "time";
let deductionApprovalEmployeeKind = "production";
let deductionApprovalView = "pending";
let deductionApplications = [];
let editingApprovedDeductionApplicationId = null;
let deductionStartDate = localDateInputValue();
let deductionEndDate = localDateInputValue();
let deductionEmployeeId = "";
let deductionMessage = "";
let deductionMessageType = "success";
let editingDeductionId = null;
let productionView = "fast-entry";
let selectedProductionFruit = "";
let productionRecordDate = localDateInputValue();
let productionMessage = "";
let productionMessageType = "success";
let productionSaving = false;
let productionQueueItems = [];
let productionQueueLoading = false;
let productionQueueMessage = "";
let productionQueueMessageType = "success";
let productionQueueFilter = "all";
let productionQueueSearch = "";
let productionQueuePage = 1;
let productionQueuePollTimer = null;
let productionQueueActionId = null;
let productionRecordsMemory = null;
let productionSyncCursor = "";
const productionQueueTrackers = new Map();
let productionEditorOpen = false;
let productionFruitCreatorOpen = false;
let productionEditorDate = localDateInputValue();
let productionEditorFruit = "mangosteen";
let productionEditorEmployeeSearch = "";
let productionEditorSelectedIds = [];
let productionEditorBatchDate = "";
let editingProductionRecordId = null;
let deletingProductionRecordId = null;
let productionEditorSaving = false;
let productionEditorMessage = "";
let productionEditorMessageType = "success";
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
const liveStateSyncInFlight = new Set();
const liveStateSyncVersions = new Map();
const liveStateSyncPending = new Set();
let liveStateRefreshInFlight = false;
let lastLiveStateFullRefreshAt = 0;
let lastRenderedRoute = "";
let batchEntryText = "";
const DURIAN_GRADES = ["A", "B", "C", "D", "E"];
const BATCH_WEIGHT_INPUT_COUNT = 60;
let batchGridState = {
  emp_code: "",
  employee: null,
  flower_pile_no: "1",
  water_pile_no: "1",
  flower_weights_by_pile: createBatchPileWeightMap(),
  water_weights_by_pile: createBatchPileWeightMap(),
  durian_pile_no: "1",
  durian_weights_by_pile: createBatchPileWeightMap(),
  durian_grade_piles: createDurianGradePileSelection(),
  durian_grade_weights_by_pile: createDurianBatchWeightMap()
};
let fastInputState = {
  pile_no: "1",
  emp_code: "",
  water_weight: "",
  flower_weight: "",
  durian_weight: "",
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
    description: "บันทึกน้ำหนักทุเรียนรวมและแยกกอง"
  },
  {
    id: "mango",
    label: "มะม่วง",
    status: "พร้อมใช้งาน",
    description: "ใช้หน้าบันทึกผลผลิตสำหรับมะม่วงฝาและมะม่วงหั่นเต๋า"
  },
  {
    id: "pomelo",
    label: "ส้มโอ",
    status: "พร้อมใช้งาน",
    description: "บันทึกน้ำหนักส้มโอรวมแบบน้ำหนักเดียวและแยกกอง"
  },
  {
    id: "coconut",
    label: "มะพร้าว",
    status: "พร้อมใช้งาน",
    description: "บันทึกน้ำหนักมะพร้าวแบบน้ำหนักเดียวและแยกกอง"
  }
];

const productionFruitFieldLabels = {
  coconut: {
    mode: "single",
    weight: "น้ำหนักมะพร้าว",
    weightShort: "มะพร้าว",
    description: "กรอกกอง รหัสพนักงาน และน้ำหนักมะพร้าว"
  },
  mangosteen: {
    water: "น้ำหนักน้ำ",
    flower: "น้ำหนักดอก",
    waterShort: "น้ำ",
    flowerShort: "ดอก",
    description: "กรอกกอง รหัสพนักงาน น้ำหนักน้ำ และน้ำหนักดอกสำหรับงานมังคุด"
  },
  durian: {
    mode: "single",
    weight: "น้ำหนักทุเรียน",
    weightShort: "ทุเรียน",
    description: "กรอกกอง รหัสพนักงาน และน้ำหนักทุเรียน"
  },
  pomelo: {
    mode: "single",
    weight: "น้ำหนักส้มโอ",
    weightShort: "ส้มโอ",
    description: "กรอกกอง รหัสพนักงาน และน้ำหนักส้มโอ"
  },
  mango: {
    water: "มะม่วงฝา",
    flower: "มะม่วงหั่นเต๋า",
    waterShort: "มะม่วงฝา",
    flowerShort: "มะม่วงหั่นเต๋า",
    description: "กรอกกอง รหัสพนักงาน มะม่วงฝา และมะม่วงหั่นเต๋าสำหรับงานมะม่วง"
  }
};

const CUSTOM_PRODUCTION_FRUITS_KEY = "pf_custom_production_fruits_v1";

function registerCustomProductionFruit(config) {
  if (!config?.id || !config?.label || productionFruitFieldLabels[config.id]) return;
  const single = config.mode === "single";
  productionFruitOptions.push({
    id: config.id,
    label: config.label,
    status: "พร้อมใช้งาน",
    description: single
      ? `บันทึก${config.weight || `น้ำหนัก${config.label}`}แบบน้ำหนักเดียวและแยกกอง`
      : `บันทึก${config.water || "ประเภท 1"}และ${config.flower || "ประเภท 2"}แยกกอง`
  });
  productionFruitFieldLabels[config.id] = single
    ? {
        mode: "single",
        weight: config.weight || `น้ำหนัก${config.label}`,
        weightShort: config.label,
        description: `กรอกกอง รหัสพนักงาน และ${config.weight || `น้ำหนัก${config.label}`}`
      }
    : {
        water: config.water || "น้ำหนักประเภท 1",
        flower: config.flower || "น้ำหนักประเภท 2",
        waterShort: config.water || "ประเภท 1",
        flowerShort: config.flower || "ประเภท 2",
        description: `กรอกกอง รหัสพนักงาน ${config.water || "ประเภท 1"} และ${config.flower || "ประเภท 2"}`
      };
}

function loadCustomProductionFruits() {
  try {
    const configs = JSON.parse(localStorage.getItem(CUSTOM_PRODUCTION_FRUITS_KEY) || "[]");
    if (Array.isArray(configs)) configs.forEach(registerCustomProductionFruit);
  } catch (_) {
    localStorage.removeItem(CUSTOM_PRODUCTION_FRUITS_KEY);
  }
}

function saveCustomProductionFruit(config) {
  const configs = JSON.parse(localStorage.getItem(CUSTOM_PRODUCTION_FRUITS_KEY) || "[]");
  configs.push(config);
  localStorage.setItem(CUSTOM_PRODUCTION_FRUITS_KEY, JSON.stringify(configs));
  registerCustomProductionFruit(config);
}

loadCustomProductionFruits();

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
      if (labels.mode === "single") {
        return [{
          value: wageRateItemTypeForFruitField(fruit.id, "weight"),
          label: `${fruit.label} - ${labels.weight}`,
          fruitId: fruit.id,
          fieldKey: "weight"
        }];
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
  return record?.fruit_type || "mangosteen";
}

function filterProductionRecordsByFruit(records, fruitId = "all") {
  if (!fruitId || fruitId === "all") return records;
  return records.filter((record) => productionFruitTypeForRecord(record) === fruitId);
}

function normalizeProductionPileNumber(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
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
    durian_weight: "",
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

function isSingleWeightFruit(fruitId = getSelectedProductionFruitId()) {
  return getProductionFieldLabels(fruitId).mode === "single";
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

function getRecordDurianWeight(record) {
  if (!isSingleWeightFruit(productionFruitTypeForRecord(record))) return 0;
  const directWeight = Number(record?.durian_weight);
  if (Number.isFinite(directWeight) && directWeight > 0) return directWeight;
  const totalWeight = Number(record?.total_weight);
  if (Number.isFinite(totalWeight) && totalWeight > 0) return totalWeight;
  return getDurianGradeTotal(record?.grade_weights || record?.grades);
}

function getRecordTotalWeight(record) {
  if (isSingleWeightFruit(productionFruitTypeForRecord(record))) return getRecordDurianWeight(record);
  return Number(record.water_weight || record.water || 0) + Number(record.flower_weight || record.flower || 0);
}

function formatDurianGradeBreakdown(record, separator = " · ") {
  return `ทุเรียน ${numberText(getRecordDurianWeight(record))}`;
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

function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeFruitPile(pile) {
  const number = Number(pile?.number);
  if (!Number.isInteger(number) || number < 1 || number > 99) return null;
  const fallback = defaultFruitPiles.find((item) => item.number === number);
  const color = /^#[0-9a-f]{6}$/i.test(String(pile?.color || ""))
    ? String(pile.color).toLowerCase()
    : fallback?.color || "#0f766e";
  return {
    number,
    name: String(pile?.name || fallback?.name || `กอง ${number}`).trim().slice(0, 40) || `กอง ${number}`,
    color,
    visible: pile?.visible !== false
  };
}

function getFruitPiles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FRUIT_PILES_KEY) || "null");
    if (!Array.isArray(parsed)) return defaultFruitPiles.map((pile) => ({ ...pile }));
    return parsed.map(normalizeFruitPile).filter(Boolean).sort((a, b) => a.number - b.number);
  } catch (_error) {
    return defaultFruitPiles.map((pile) => ({ ...pile }));
  }
}

function saveFruitPiles(piles) {
  const normalized = (piles || []).map(normalizeFruitPile).filter(Boolean).sort((a, b) => a.number - b.number);
  localStorage.setItem(FRUIT_PILES_KEY, JSON.stringify(normalized));
}

let fruitPileRefreshAt = 0;
let fruitPileSyncBusy = false;
const FRUIT_PILES_MIGRATED_KEY = "apws_contest_fruit_piles_shared_v1";
const FRUIT_PILES_LEGACY_KEY = "apws_contest_fruit_piles_before_shared_v1";

function applySharedFruitPiles(data) {
  if (!Array.isArray(data?.piles)) return;
  if (!localStorage.getItem(FRUIT_PILES_MIGRATED_KEY) && !localStorage.getItem(FRUIT_PILES_LEGACY_KEY)) {
    const legacy = localStorage.getItem(FRUIT_PILES_KEY);
    if (legacy) localStorage.setItem(FRUIT_PILES_LEGACY_KEY, legacy);
  }
  saveFruitPiles(data.piles);
  // Replace only selector options so active weight inputs and cursor survive.
  for (const [id, state, field] of [
    ["fastPileNo", fastInputState, "pile_no"],
    ["batchFlowerPile", batchGridState, "flower_pile_no"],
    ["batchWaterPile", batchGridState, "water_pile_no"],
    ["batchDurianPile", batchGridState, "durian_pile_no"]
  ]) {
    const select = document.getElementById(id);
    if (!select) continue;
    state[field] = effectiveVisibleFruitPileNumber(state[field]);
    select.innerHTML = fruitPileOptionMarkup(state[field]);
    applyProductionPileTone(select.closest(".batch-side, form") || select, state[field]);
  }
}

async function migrateLocalFruitPiles() {
  if (localStorage.getItem(FRUIT_PILES_MIGRATED_KEY) || !canManageAllProductionRecords(getSession()?.user)) return;
  const legacy = localStorage.getItem(FRUIT_PILES_LEGACY_KEY) || localStorage.getItem(FRUIT_PILES_KEY);
  if (legacy) {
    const response = await cloudApiRequest("/api/fruit-piles", {
      method: "POST", body: JSON.stringify({action: "migrate", piles: JSON.parse(legacy)})
    });
    if (!Array.isArray(response.data?.piles)) throw new Error("ยังย้ายรายการกองขึ้นฐานกลางไม่สำเร็จ");
  }
  localStorage.setItem(FRUIT_PILES_MIGRATED_KEY, "1");
}

async function refreshSharedFruitPiles() {
  if (!getSession() || fruitPileSyncBusy || Date.now() - fruitPileRefreshAt < 60000) return;
  fruitPileSyncBusy = true;
  try {
    await migrateLocalFruitPiles();
    const response = await cloudApiRequest("/api/fruit-piles");
    const before = JSON.stringify(getFruitPiles());
    applySharedFruitPiles(response.data);
    fruitPileRefreshAt = Date.now();
    if (before !== JSON.stringify(getFruitPiles()) && location.hash === "#/settings-pile-summary" && !isEditingFormField()) render();
  } catch (error) {
    console.warn("Fruit pile sync failed", error);
  } finally { fruitPileSyncBusy = false; }
}

async function saveSharedFruitPiles(next) {
  if (fruitPileSyncBusy) {
    settingsPileSummaryMessage = "กำลังซิงก์รายการกอง กรุณาลองอีกครั้ง";
    settingsPileSummaryMessageType = "error";
    render();
    return false;
  }
  fruitPileSyncBusy = true;
  try {
    const previous = getFruitPiles();
    await migrateLocalFruitPiles();
    const response = await cloudApiRequest("/api/fruit-piles", {
      method: "POST", body: JSON.stringify({action: "update",
        piles: next.filter(p => JSON.stringify(previous.find(old => old.number === p.number)) !== JSON.stringify(p)),
        deleted: previous.filter(p => !next.some(n => n.number === p.number)).map(p => p.number)
      })
    });
    if (!Array.isArray(response.data?.piles)) throw new Error("ฐานกลางยังไม่ยืนยันรายการกอง");
    applySharedFruitPiles(response.data);
    fruitPileRefreshAt = Date.now();
    return true;
  } catch (error) {
    settingsPileSummaryMessage = `บันทึกกองไม่สำเร็จ: ${error.message}`;
    settingsPileSummaryMessageType = "error";
    render();
    return false;
  } finally { fruitPileSyncBusy = false; }
}

function getVisibleFruitPiles() {
  const visible = getFruitPiles().filter((pile) => pile.visible);
  return visible.length ? visible : [];
}

function effectiveVisibleFruitPileNumber(pileNo) {
  const visiblePiles = getVisibleFruitPiles();
  const selected = visiblePiles.find((pile) => pile.number === Number(pileNo));
  return String(selected?.number ?? visiblePiles[0]?.number ?? "");
}

function fruitPileByNumber(pileNo) {
  return getFruitPiles().find((pile) => pile.number === Number(pileNo)) || null;
}

function fruitPileOptionMarkup(selectedPile) {
  return getVisibleFruitPiles().map((pile) => `<option value="${pile.number}" style="color:${pile.color}" ${String(selectedPile) === String(pile.number) ? "selected" : ""}>${escapeHtml(pile.name)}</option>`).join("");
}

function fruitPileToneStyle(pileNo) {
  const pile = fruitPileByNumber(pileNo);
  return pile ? `style="--production-pile-color:${pile.color}"` : "";
}

function isConfiguredFruitPile(pileNo, visibleOnly = false) {
  const pile = fruitPileByNumber(pileNo);
  return Boolean(pile && (!visibleOnly || pile.visible));
}

function createBatchPileWeightMap() {
  return getFruitPiles().reduce((weightsByPile, pile) => {
    const pileNo = pile.number;
    weightsByPile[String(pileNo)] = Array(BATCH_WEIGHT_INPUT_COUNT).fill("");
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
  batchGridState.durian_grade_weights_by_pile[normalizedGrade][selectedPile] ||= Array(BATCH_WEIGHT_INPUT_COUNT).fill("");
  return batchGridState.durian_grade_weights_by_pile[normalizedGrade][selectedPile];
}

function getBatchPileWeights(type, pileNo = null) {
  const stateKey = type === "flower"
    ? "flower_weights_by_pile"
    : type === "durian" ? "durian_weights_by_pile" : "water_weights_by_pile";
  const selectedPile = pileNo || (
    type === "flower"
      ? batchGridState.flower_pile_no
      : type === "durian" ? batchGridState.durian_pile_no : batchGridState.water_pile_no
  );
  const pileKey = String(selectedPile);

  if (!batchGridState[stateKey]) {
    batchGridState[stateKey] = createBatchPileWeightMap();
  }
  if (!batchGridState[stateKey][pileKey]) {
    batchGridState[stateKey][pileKey] = Array(BATCH_WEIGHT_INPUT_COUNT).fill("");
  }

  return batchGridState[stateKey][pileKey];
}

function productionPileToneClass(pileNo) {
  const normalized = Number(pileNo);
  return Number.isInteger(normalized) && normalized >= 1 && normalized <= 6
    ? `production-pile-tone-${normalized}`
    : "production-pile-tone-1";
}

function applyProductionPileTone(element, pileNo) {
  if (!element) return;
  element.classList.remove(...[1, 2, 3, 4, 5, 6].map((value) => `production-pile-tone-${value}`));
  element.classList.add(productionPileToneClass(pileNo));
  const pile = fruitPileByNumber(pileNo);
  if (pile) element.style.setProperty("--production-pile-color", pile.color);
}

function isBatchProductionSaveShortcut(event) {
  return event?.key === "Enter" && event.shiftKey === true;
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

  const routes = levelRouteAccess[getUserLevel(user)] || [];
  return canManageAccountUsers(user) ? [...new Set([...routes, "account-management"])] : routes;
}

function canManageAccountUsers(user) {
  if (!user || user.isActive === false) return false;
  return Boolean(isTopLevelUser(user));
}

function canWriteStock(user) {
  return Boolean(user && user.isActive !== false && (Number(getUserLevel(user).slice(1)) >= 4 || isTopLevelUser(user)));
}

function canImportDesktopWeighing(user) {
  return Boolean(user && user.isActive !== false && Number(getUserLevel(user).slice(1)) >= 6);
}

function getDefaultRouteForUser(user) {
  const preferredRoute = defaultRouteByLevel[getUserLevel(user)] || "dashboard";
  if (canOpen(user, preferredRoute)) return preferredRoute;
  return getAllowedRoutesForUser(user).find((route) => canOpen(user, route)) || "dashboard";
}

function visibleNavModulesForUser(user) {
  const navRouteIds = ["dashboard", "production", "stock", "time-report", "compare-data", "summary-person", "summary-all", "reports", "accounting-control", "secret-room", "record-report", "settings"];
  return navRouteIds
    .map((routeId) => modules.find((item) => item.id === routeId))
    .filter((item) => item && !item.hidden)
    .filter((item) => item.id !== "inbound" || canOpen(user, "inbound"))
    .filter((item) => item.id !== "stock" || canOpen(user, "stock"))
    .filter((item) => item.id !== "accounting-control" || canOpen(user, "accounting-control") || canOpen(user, "compare-data"))
    .map((item) => item.id === "accounting-control" && !canOpen(user, "accounting-control") && canOpen(user, "compare-data") ? { ...item, id: "compare-data" } : item)
    .map((item) => ({ ...item, locked: !canOpen(user, item.id) }));
}

function canOpen(user, moduleId) {
  const moduleItem = modules.find((item) => item.id === moduleId);
  if (!moduleItem || !user || user.isActive === false) return false;
  if (moduleId === "account-management") return canManageAccountUsers(user);
  if (moduleId === "backup") return ["C6", "C7"].includes(getUserLevel(user));
  if (moduleId === "audit-log") return ["C5", "C6", "C7"].includes(getUserLevel(user));
  if (isTopLevelUser(user)) return true;
  return getAllowedRoutesForUser(user).includes(moduleId);
}

function canManageEmployees(user) {
  return canOpen(user, "employees") || canOpen(user, "production-employees") || canOpen(user, "time-employees");
}

function canDeleteEmployees(user) {
  return ["C5", "C6", "C7"].includes(getUserLevel(user)) || isTopLevelUser(user);
}

function canEditProductionRecords(user) {
  return Boolean(user && user.isActive !== false && Number(getUserLevel(user).slice(1)) >= 3);
}

function canManageAllProductionRecords(user) {
  const levelNumber = Number(String(getUserLevel(user)).replace(/\D/g, "")) || 1;
  return levelNumber >= 4;
}

function canDeleteProductionRecords(user) {
  return canManageAllProductionRecords(user);
}

function canEditApprovedDeductions(user) {
  const levelNumber = Number(String(getUserLevel(user)).replace(/\D/g, "")) || 1;
  return levelNumber >= 4 || isTopLevelUser(user);
}

const APPROVED_DEDUCTION_C4_EDIT_WINDOW_MS = 15 * 60 * 1000;

function approvedDeductionCreatedAgeMs(row) {
  const createdAt = Date.parse(row?.created_at || "");
  if (!Number.isFinite(createdAt)) return Infinity;
  return Date.now() - createdAt;
}

function approvedDeductionCreatedByUser(row, user) {
  const createdBy = normalizeProductionEditorIdentity(row?.created_by || "");
  if (!createdBy) return false;
  return [user?.fullname, user?.username].some((value) => normalizeProductionEditorIdentity(value) === createdBy);
}

function canEditApprovedDeductionApplication(user, row) {
  const levelNumber = Number(String(getUserLevel(user)).replace(/\D/g, "")) || 1;
  if (levelNumber >= 5 || isTopLevelUser(user)) return true;
  if (levelNumber !== 4) return false;
  return approvedDeductionCreatedAgeMs(row) <= APPROVED_DEDUCTION_C4_EDIT_WINDOW_MS;
}

function canDeleteApprovedDeductionApplication(user, row) {
  const levelNumber = Number(String(getUserLevel(user)).replace(/\D/g, "")) || 1;
  if (levelNumber >= 5 || isTopLevelUser(user)) return true;
  if (levelNumber !== 4) return false;
  return approvedDeductionCreatedByUser(row, user);
}

function canManageWageRates(user) {
  const levelNumber = Number(String(getUserLevel(user)).replace(/\D/g, "")) || 1;
  return levelNumber >= 4 || isTopLevelUser(user);
}

const PRODUCTION_SELF_EDIT_WINDOW_MS = 5 * 60 * 1000;

function normalizeProductionEditorIdentity(value) {
  return String(value || "").trim().toLocaleLowerCase("th-TH");
}

function isProductionRecordOwnedByUser(record, user) {
  const owner = normalizeProductionEditorIdentity(record?.created_by);
  if (!owner || !user) return false;
  return [user.fullname, user.username]
    .map(normalizeProductionEditorIdentity)
    .filter(Boolean)
    .includes(owner);
}

function getProductionRecordEditRemainingMs(record, nowMs = Date.now()) {
  const createdAt = Date.parse(String(record?.created_at || ""));
  if (!Number.isFinite(createdAt)) return -1;
  const remainingMs = PRODUCTION_SELF_EDIT_WINDOW_MS - Math.max(0, nowMs - createdAt);
  return remainingMs >= 0 ? remainingMs : -1;
}

function canEditProductionRecord(user, record, nowMs = Date.now()) {
  if (!user || !record || Number(getUserLevel(user).slice(1)) < 3) return false;
  if (canManageAllProductionRecords(user)) return true;
  return isProductionRecordOwnedByUser(record, user) &&
    getProductionRecordEditRemainingMs(record, nowMs) >= 0;
}

function canExportFullDetails(user) {
  if (!user) return false;
  if (isTopLevelUser(user)) return true;
  const levelIndex = supportedAccountLevels.indexOf(String(user.level || "").toUpperCase());
  return levelIndex >= supportedAccountLevels.indexOf("C5");
}

function accountRoleOptionByKey(roleKey) {
  const normalizedKey = String(roleKey || "").trim();
  if (normalizedKey === developerRoleOption.key) return developerRoleOption;
  const builtIn = accountRoleOptions.find((option) => option.key === normalizedKey);
  if (builtIn) return builtIn;

  if (normalizedKey) {
    const customLabel = normalizedKey.startsWith(CUSTOM_ACCOUNT_ROLE_PREFIX)
      ? normalizedKey.slice(CUSTOM_ACCOUNT_ROLE_PREFIX.length).trim()
      : normalizedKey;
    if (customLabel) {
      return {
        key: normalizedKey,
        role: "operator",
        label: customLabel,
        isCustom: true
      };
    }
  }

  return accountRoleOptions.find((option) => option.key === "general_staff");
}

function accountRoleOptionForUser(user) {
  if (user.role === developerRoleOption.role || user.role_key === developerRoleOption.key) {
    return developerRoleOption;
  }
  if (user.role_key) return accountRoleOptionByKey(user.role_key);
  const legacyRole = accountRoleOptions.find((option) => option.role === user.role);
  if (legacyRole) return legacyRole;
  if (user.role) return accountRoleOptionByKey(user.role);
  return accountRoleOptionByKey("general_staff");
}

function normalizeCustomAccountRoleLabel(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function createCustomAccountRoleOption(label) {
  const normalizedLabel = normalizeCustomAccountRoleLabel(label);
  return {
    key: `${CUSTOM_ACCOUNT_ROLE_PREFIX}${normalizedLabel}`,
    role: "operator",
    label: normalizedLabel,
    isCustom: true
  };
}

function accountRoleOptionsForForm(accountUser = null) {
  const roleMap = new Map(accountRoleOptions.map((option) => [option.key, option]));
  [...getAccountUsers(), ...(accountUser ? [accountUser] : [])].forEach((item) => {
    const option = accountRoleOptionForUser(item);
    if (option?.isCustom && option.label) roleMap.set(option.key, option);
  });
  return [...roleMap.values()];
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
  const { timeoutMs = 0, ...fetchOptions } = options;
  const sessionToken = getSession()?.token || "";
  const timeoutController =
    timeoutMs > 0 && !fetchOptions.signal && typeof AbortController !== "undefined"
      ? new AbortController()
      : null;
  const timeoutId = timeoutController
    ? window.setTimeout(() => timeoutController.abort(), timeoutMs)
    : null;
  let response;
  let data;
  try {
    response = await fetch(`${REPORT_API_BASE}${path}`, {
      ...fetchOptions,
      cache: fetchOptions.cache || "no-store",
      ...(timeoutController ? { signal: timeoutController.signal } : {}),
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { "X-Session-Token": sessionToken } : {}),
        ...(fetchOptions.headers || {})
      }
    });
    data = await response.json().catch((error) => {
      if (timeoutController?.signal.aborted) throw error;
      return {};
    });
  } catch (error) {
    if (timeoutController?.signal.aborted) {
      const timeoutError = new Error(
        "การเชื่อมต่อใช้เวลานานเกินไป ระบบจะตรวจสอบว่ารายการถูกบันทึกแล้วหรือไม่"
      );
      timeoutError.code = "REQUEST_TIMEOUT";
      timeoutError.isTransient = true;
      throw timeoutError;
    }
    if (error && typeof error === "object") error.isTransient = true;
    throw error;
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  }
  if (!response.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message || data.message || `Cloud API failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    error.isTransient = [408, 425, 429].includes(response.status) || response.status >= 500;
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
    window.SecretRoom?.stopNotifications?.();
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
  refreshSharedFruitPiles();
  onlineHeartbeatTimer = window.setInterval(() => {
    refreshOnlineUsers();
    refreshSharedFruitPiles();
    refreshLiveStateFromCloud({ renderWhenIdle: true });
  }, ONLINE_HEARTBEAT_INTERVAL_MS);
}

const liveStateConfig = {
  production_sessions: { key: PRODUCTION_SESSIONS_KEY, read: getProductionSessions },
  production_records: { key: PRODUCTION_RECORDS_KEY, read: getProductionRecords },
  time_records: { key: TIME_RECORDS_KEY, read: getTimeRecords },
  audit_logs: { key: AUDIT_LOG_KEY, read: getAuditLogs }
};

const LOCAL_AUDIT_LOG_LIMIT = 250;
const LOCAL_PRODUCTION_RECORD_LIMIT = 750;

function openProductionIndexedDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return resolve(null);
    const request = window.indexedDB.open(PRODUCTION_INDEXED_DB_NAME, PRODUCTION_INDEXED_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("records")) db.createObjectStore("records", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readProductionIndexedDb() {
  const db = await openProductionIndexedDb();
  if (!db) return { records: [], cursor: "" };
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["records", "meta"], "readonly");
    const recordsRequest = transaction.objectStore("records").getAll();
    const cursorRequest = transaction.objectStore("meta").get("cursor");
    const revisionRequest = transaction.objectStore("meta").get("snapshot_revision");
    transaction.oncomplete = () => resolve({
      records: Array.isArray(recordsRequest.result) ? recordsRequest.result.sort((a, b) => Number(a.id) - Number(b.id)) : [],
      // Keep cached rows available offline, but fetch a complete snapshot once
      // after recovery-sync fixes, even when today's data advanced the old cursor.
      cursor: revisionRequest.result?.value === PRODUCTION_CACHE_REVISION
        ? String(cursorRequest.result?.value || "") : ""
    });
    transaction.onerror = () => reject(transaction.error);
  });
}

async function replaceProductionIndexedDb(records, cursor) {
  const db = await openProductionIndexedDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(["records", "meta"], "readwrite");
    const store = transaction.objectStore("records");
    store.clear();
    records.forEach((record) => store.put(record));
    transaction.objectStore("meta").put({ key: "cursor", value: cursor || "" });
    transaction.objectStore("meta").put({ key: "snapshot_revision", value: PRODUCTION_CACHE_REVISION });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function persistProductionDeltaIndexedDb(records, deletedIds, cursor) {
  const db = await openProductionIndexedDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(["records", "meta"], "readwrite");
    const store = transaction.objectStore("records");
    (deletedIds || []).forEach((id) => store.delete(Number(id)));
    (records || []).forEach((record) => store.put(record));
    transaction.objectStore("meta").put({ key: "cursor", value: cursor || "" });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function applyProductionDelta(records, deletedIds, cursor) {
  if (!(records || []).length && !(deletedIds || []).length) {
    productionSyncCursor = cursor || productionSyncCursor;
    return getProductionRecords();
  }
  const current = new Map(getProductionRecords().map((record) => [Number(record.id), record]));
  (deletedIds || []).forEach((id) => current.delete(Number(id)));
  (records || []).forEach((record) => current.set(Number(record.id), record));
  const merged = Array.from(current.values()).sort((a, b) => Number(a.id) - Number(b.id));
  productionSyncCursor = cursor || productionSyncCursor;
  writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, merged);
  await persistProductionDeltaIndexedDb(records, deletedIds, productionSyncCursor);
  return merged;
}

function applyTimeDelta(records, deletedIds, cursor) {
  const current = new Map(getTimeRecords().map((record) => [Number(record.id), record]));
  (deletedIds || []).forEach((id) => current.delete(Number(id)));
  (records || []).forEach((record) => {
    if (isCurrentTimeVersion(current.get(Number(record.id)), record)) current.set(Number(record.id), record);
  });
  const merged = Array.from(current.values()).sort((a, b) => Number(a.id) - Number(b.id));
  writeLiveStateRowsToStorage("time_records", TIME_RECORDS_KEY, merged);
  if (cursor && cursor > (localStorage.getItem(TIME_SYNC_CURSOR_KEY) || "")) localStorage.setItem(TIME_SYNC_CURSOR_KEY, cursor);
  return merged;
}

function applyAuditDelta(records, cursor) {
  const current = new Map(getAuditLogs().map((record) => [Number(record.id), record]));
  (records || []).forEach((record) => current.set(Number(record.id), record));
  const merged = Array.from(current.values()).sort((a, b) => Number(a.id) - Number(b.id));
  writeLiveStateRowsToStorage("audit_logs", AUDIT_LOG_KEY, merged);
  if (cursor) localStorage.setItem(AUDIT_SYNC_CURSOR_KEY, String(cursor));
  return merged;
}

function writeLiveStateRowsToStorage(table, key, rows) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  if (table === "production_records") productionRecordsMemory = sourceRows;
  const localRows = table === "audit_logs"
    ? sourceRows.slice(-LOCAL_AUDIT_LOG_LIMIT)
    : table === "production_records"
      ? sourceRows.slice(-LOCAL_PRODUCTION_RECORD_LIMIT)
      : sourceRows;
  const serialized = JSON.stringify(localRows);
  if (localStorage.getItem(key) === serialized) return false;
  try {
    localStorage.setItem(key, serialized);
  } catch (error) {
    if (error?.name !== "QuotaExceededError") throw error;
    // Audit history remains complete in Supabase. Remove only the browser cache
    // so production and time data can continue hydrating on every device.
    localStorage.removeItem(AUDIT_LOG_KEY);
    localStorage.setItem(key, serialized);
  }
  return true;
}

function getLiveStateSyncVersion(table) {
  return liveStateSyncVersions.get(table) || 0;
}

function getLiveStateVersionSignature() {
  return Object.keys(liveStateConfig)
    .map((table) => `${table}:${getLiveStateSyncVersion(table)}`)
    .join("|");
}

function mergeProductionCloudRows(cloudRows) {
  if (!Array.isArray(cloudRows) || !cloudRows.length) return;
  const records = getProductionRecords();
  const merged = [...records];
  cloudRows.forEach((cloudRow) => {
    const cloudClientUid = cloudRow.client_uid || cloudRow.raw_payload?.client_uid || "";
    const existingIndex = merged.findIndex((record) => {
      if (cloudClientUid && record.client_uid === cloudClientUid) return true;
      return Number(record.id) === Number(cloudRow.id);
    });
    if (existingIndex >= 0) {
      merged[existingIndex] = { ...merged[existingIndex], ...cloudRow };
    } else {
      merged.push(cloudRow);
    }
  });
  writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, merged);
}

function getProductionClientUid(record) {
  return String(record?.client_uid || record?.raw_payload?.client_uid || "").trim();
}

function formatCloudRecordIds(records) {
  const ids = (Array.isArray(records) ? records : [records])
    .map((record) => Number(record?.id))
    .filter((id) => Number.isFinite(id) && id > 0);
  if (!ids.length) return "-";
  return ids.map((id) => `#${id}`).join(", ");
}

function assertProductionCloudRowMatches(expected, actual) {
  const fields = [
    ["emp_code", "รหัสพนักงาน"],
    ["record_date", "วันที่"],
    ["fruit_type", "ชนิดผลไม้"]
  ];
  fields.forEach(([field, label]) => {
    if (String(expected?.[field] || "") !== String(actual?.[field] || "")) {
      throw new Error(`Cloud ตรวจกลับมาไม่ตรง: ${label} ไม่ตรง กรุณาตรวจสอบก่อนบันทึกใหม่`);
    }
  });

  const expectedPile = normalizeProductionPileNumber(expected?.pile_no ?? expected?.pile);
  const actualPile = normalizeProductionPileNumber(actual?.pile_no ?? actual?.pile);
  if (expectedPile !== actualPile) {
    throw new Error("Cloud ตรวจกลับมาไม่ตรง: เลขกองไม่ตรง กรุณาตรวจสอบก่อนบันทึกใหม่");
  }

  if (isSingleWeightFruit(productionFruitTypeForRecord(expected))) {
    if (Math.abs(getRecordDurianWeight(expected) - getRecordDurianWeight(actual)) > 0.05) {
      throw new Error("Cloud ตรวจกลับมาไม่ตรง: น้ำหนักผลไม้ไม่ตรง กรุณาตรวจสอบก่อนบันทึกใหม่");
    }
    return;
  }

  const expectedWater = Number(expected?.water_weight ?? expected?.water ?? 0);
  const actualWater = Number(actual?.water_weight ?? actual?.water ?? 0);
  const expectedFlower = Number(expected?.flower_weight ?? expected?.flower ?? 0);
  const actualFlower = Number(actual?.flower_weight ?? actual?.flower ?? 0);
  if (Math.abs(expectedWater - actualWater) > 0.05 || Math.abs(expectedFlower - actualFlower) > 0.05) {
    throw new Error("Cloud ตรวจกลับมาไม่ตรง: น้ำหนักไม่ตรง กรุณาตรวจสอบก่อนบันทึกใหม่");
  }
}

function verifyProductionRowsFromCloudResponse(expectedRows, cloudRows) {
  const expectedByUid = new Map();
  expectedRows.forEach((row) => {
    const uid = getProductionClientUid(row);
    if (uid) expectedByUid.set(uid, row);
  });
  if (expectedByUid.size !== expectedRows.length) {
    throw new Error("รายการที่กำลังบันทึกไม่มีรหัสตรวจสอบครบ กรุณารีเฟรชหน้าแล้วลองอีกครั้ง");
  }

  const verifiedRows = Array.isArray(cloudRows) ? cloudRows : [];
  const verifiedByUid = new Map();
  verifiedRows.forEach((row) => {
    const uid = getProductionClientUid(row);
    if (uid && expectedByUid.has(uid)) verifiedByUid.set(uid, row);
  });
  if (verifiedByUid.size !== expectedByUid.size) {
    throw new Error(
      `Cloud ตรวจกลับมาไม่ครบ (${verifiedByUid.size}/${expectedByUid.size} รายการ) กรุณาตรวจสอบเน็ตแล้วกดบันทึกอีกครั้ง`
    );
  }
  if (verifiedRows.length !== expectedByUid.size) {
    throw new Error(
      `Cloud พบจำนวนรายการตรวจสอบผิดปกติ (${verifiedRows.length}/${expectedByUid.size} รายการ) กรุณาแจ้งผู้ดูแลก่อนบันทึกซ้ำ`
    );
  }
  expectedByUid.forEach((expected, uid) => {
    assertProductionCloudRowMatches(expected, verifiedByUid.get(uid));
  });
  return Array.from(verifiedByUid.values()).sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
}

function acceptVerifiedProductionRows(expectedRows, cloudRows) {
  const verifiedRows = verifyProductionRowsFromCloudResponse(expectedRows, cloudRows);
  applyingCloudState = true;
  mergeProductionCloudRows(verifiedRows);
  return verifiedRows;
}

async function findProductionRowsAlreadySaved(expectedRows) {
  const clientUids = expectedRows.map(getProductionClientUid).filter(Boolean);
  if (clientUids.length !== expectedRows.length) return null;
  const response = await cloudApiRequest("/api/production-records/verify", {
    method: "POST",
    body: JSON.stringify({ client_uids: clientUids }),
    timeoutMs: CLOUD_SAVE_TIMEOUT_MS
  });
  const cloudRows = Array.isArray(response.data) ? response.data : [];
  if (cloudRows.length !== expectedRows.length) return null;
  return acceptVerifiedProductionRows(expectedRows, cloudRows);
}

function isTransientCloudError(error) {
  return Boolean(
    error?.isTransient ||
      error?.code === "REQUEST_TIMEOUT" ||
      [408, 425, 429].includes(Number(error?.status)) ||
      Number(error?.status) >= 500
  );
}

async function saveProductionRowsToCloud(records, { mode = "insert", onStatus } = {}) {
  const rows = Array.isArray(records) ? records : [records];
  const filteredRows = rows.filter(Boolean);
  if (!filteredRows.length) return [];
  clearTimeout(liveStateSyncTimers.get("production_records"));
  liveStateSyncTimers.delete("production_records");
  liveStateSyncInFlight.add("production_records");
  try {
    const sendRows = () =>
      cloudApiRequest("/api/production-records/bulk-sync", {
        method: "POST",
        body: JSON.stringify({ records: filteredRows, mode }),
        timeoutMs: CLOUD_SAVE_TIMEOUT_MS
      });
    let response;
    try {
      response = await sendRows();
    } catch (firstError) {
      if (!isTransientCloudError(firstError)) throw firstError;
      onStatus?.("เน็ตตอบสนองช้า กำลังตรวจสอบรายการเดิมในฐานข้อมูล กรุณาอย่ากดบันทึกซ้ำ...");
      try {
        const savedRows = await findProductionRowsAlreadySaved(filteredRows);
        if (savedRows) return savedRows;
      } catch (verifyError) {
        console.warn("Production save verification failed before retry.", verifyError);
      }
      await waitForMilliseconds(CLOUD_SAVE_RETRY_DELAY_MS);
      onStatus?.("ยังไม่พบรายการ ระบบกำลังส่งรายการเดิมซ้ำอย่างปลอดภัยอีกครั้ง...");
      try {
        response = await sendRows();
      } catch (retryError) {
        if (!isTransientCloudError(retryError)) throw retryError;
        try {
          const savedRows = await findProductionRowsAlreadySaved(filteredRows);
          if (savedRows) return savedRows;
        } catch (verifyError) {
          console.warn("Production save verification failed after retry.", verifyError);
        }
        const uncertainError = new Error(
          "การเชื่อมต่อไม่เสถียรและยังยืนยันผลไม่ได้ ข้อมูลในช่องกรอกยังอยู่ กรุณารอเน็ตดีขึ้นแล้วกดบันทึกอีกครั้ง"
        );
        uncertainError.cause = retryError;
        throw uncertainError;
      }
    }
    const cloudRows = Array.isArray(response.data) ? response.data : [];
    if (cloudRows.length !== filteredRows.length) {
      throw new Error(
        `Cloud ยืนยันกลับมาไม่ครบ (${cloudRows.length}/${filteredRows.length} รายการ) กรุณาตรวจสอบเน็ตแล้วกดบันทึกอีกครั้ง`
      );
    }
    return acceptVerifiedProductionRows(filteredRows, cloudRows);
  } finally {
    applyingCloudState = false;
    liveStateSyncInFlight.delete("production_records");
  }
}

function createProductionQueueUid(records) {
  const rows = (Array.isArray(records) ? records : [records]).filter(Boolean);
  const batchUid = String(rows[0]?.batch_uid || "").trim();
  return `production-queue:${batchUid || createProductionBatchUid()}`;
}

function productionQueueNumber(item) {
  if (item?.queue_no) return String(item.queue_no).replace(/^Q-(\d+)$/, (_, value) => `Q-${value.padStart(6, "0")}`);
  const id = Number(item?.id || 0);
  return id > 0 ? `Q-${String(id).padStart(6, "0")}` : "Q------";
}

function mergeProductionQueueItem(item) {
  if (!item || !Number(item.id)) return;
  const index = productionQueueItems.findIndex((existing) => Number(existing.id) === Number(item.id));
  if (index >= 0) productionQueueItems[index] = { ...productionQueueItems[index], ...item };
  else productionQueueItems.unshift(item);
  productionQueueItems.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  updateProductionQueueBadges();
}

function updateProductionQueueBadges() {
  const activeCount = productionQueueItems.filter((item) => ["queued", "processing"].includes(item.status)).length;
  document.querySelectorAll("[data-production-queue-count]").forEach((element) => {
    element.textContent = String(activeCount);
    element.hidden = activeCount <= 0;
  });
}

function acceptProductionQueueResult(item) {
  mergeProductionQueueItem(item);
  if (item?.status === "succeeded" && Array.isArray(item.result_payload) && item.result_payload.length) {
    applyingCloudState = true;
    try {
      mergeProductionCloudRows(item.result_payload);
    } finally {
      applyingCloudState = false;
    }
  }
  return item;
}

async function enqueueProductionRows(records, { onStatus, source = "manual" } = {}) {
  const rows = (Array.isArray(records) ? records : [records]).filter(Boolean);
  if (!rows.length) throw new Error("ไม่มีข้อมูลผลผลิตสำหรับเข้าคิว");
  const queueUid = createProductionQueueUid(rows);
  const acceptanceStartedAt = Date.now();
  try {
    const response = await cloudApiRequest("/api/production-save-queue/enqueue", {
      method: "POST",
      body: JSON.stringify({ queue_uid: queueUid, records: rows, source }),
      timeoutMs: PRODUCTION_QUEUE_PRIMARY_TIMEOUT_MS
    });
    const item = acceptProductionQueueResult(response.data);
    if (!item?.id) throw new Error("ฐานข้อมูลไม่ได้ส่งเลขคิวกลับมา ข้อมูลในฟอร์มยังอยู่");
    trackProductionQueueItem(item.id);
    return item;
  } catch (error) {
    if (!isTransientCloudError(error)) throw error;
    onStatus?.("การตอบรับช้ากว่าปกติ กำลังตรวจสอบเลขคิวเดิมเพื่อป้องกันการส่งซ้ำ...");
    try {
      const remainingMs = PRODUCTION_QUEUE_ACCEPT_TIMEOUT_MS - (Date.now() - acceptanceStartedAt);
      if (remainingMs < 300) throw new Error("Queue acceptance deadline reached.");
      const lookup = await cloudApiRequest(
        `/api/production-save-queue/lookup?queue_uid=${encodeURIComponent(queueUid)}`,
        { timeoutMs: remainingMs }
      );
      const item = acceptProductionQueueResult(lookup.data);
      if (item?.id) {
        trackProductionQueueItem(item.id);
        return item;
      }
    } catch (lookupError) {
      console.warn("Production queue lookup failed.", lookupError);
    }
    const uncertainError = new Error(
      "ยังยืนยันไม่ได้ว่าฐานข้อมูลรับคิวแล้ว ข้อมูลในช่องกรอกยังอยู่ กรุณาตรวจอินเทอร์เน็ตแล้วกดบันทึกอีกครั้ง"
    );
    uncertainError.cause = error;
    throw uncertainError;
  }
}

function stopProductionQueueTracker(queueId) {
  const timer = productionQueueTrackers.get(Number(queueId));
  if (timer) window.clearTimeout(timer);
  productionQueueTrackers.delete(Number(queueId));
}

function trackProductionQueueItem(queueId, attempt = 0) {
  const id = Number(queueId);
  if (!id || productionQueueTrackers.has(id)) return;
  const poll = async () => {
    productionQueueTrackers.delete(id);
    try {
      const response = await cloudApiRequest(`/api/production-save-queue/${id}`, {
        timeoutMs: PRODUCTION_QUEUE_ACCEPT_TIMEOUT_MS
      });
      const item = acceptProductionQueueResult(response.data);
      if (["succeeded", "needs_review", "failed", "cancelled"].includes(item?.status)) {
        if (productionView === "queue") render();
        return;
      }
      if (productionView === "queue") render();
    } catch (error) {
      console.warn(`Queue ${id} status refresh failed.`, error);
    }
    const retryDelay = Math.min(PRODUCTION_QUEUE_POLL_INTERVAL_MS * Math.max(1, attempt + 1), 15000);
    const timer = window.setTimeout(() => {
      productionQueueTrackers.delete(id);
      trackProductionQueueItem(id, attempt + 1);
    }, retryDelay);
    productionQueueTrackers.set(id, timer);
  };
  const timer = window.setTimeout(poll, attempt === 0 ? 350 : PRODUCTION_QUEUE_POLL_INTERVAL_MS);
  productionQueueTrackers.set(id, timer);
}

async function refreshProductionQueue({ renderAfter = true } = {}) {
  if (productionQueueLoading) return;
  productionQueueLoading = true;
  try {
    const response = await cloudApiRequest("/api/production-save-queue?limit=100", {
      timeoutMs: 7000
    });
    productionQueueItems = Array.isArray(response.data) ? response.data : [];
    productionQueueItems.forEach((item) => {
      acceptProductionQueueResult(item);
      if (["queued", "processing"].includes(item.status)) trackProductionQueueItem(item.id);
      else stopProductionQueueTracker(item.id);
    });
    productionQueueMessage = "";
    productionQueueMessageType = "success";
  } catch (error) {
    productionQueueMessage = error instanceof Error ? error.message : "โหลดคิวการบันทึกไม่สำเร็จ";
    productionQueueMessageType = "error";
  } finally {
    productionQueueLoading = false;
    if (renderAfter && productionView === "queue") render();
  }
}

function createTimeQueueUid(operation, records) {
  if (operation === "insert" && records.length === 1 && records[0]?.scanner_import?.submission_uid) {
    return `time-queue:scanner:${records[0].scanner_import.submission_uid}`;
  }
  const seed = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const recordId = operation === "update" ? `:${records[0]?.id || ""}` : "";
  return `time-queue:${operation}${recordId}:${seed}`;
}

function timeQueueNumber(item) {
  if (item?.queue_no) return item.queue_no;
  return Number(item?.id) ? `TQ-${String(item.id).padStart(6, "0")}` : "TQ------";
}

function mergeTimeQueueItem(item) {
  if (!item || !Number(item.id)) return item;
  const index = timeQueueItems.findIndex((row) => Number(row.id) === Number(item.id));
  if (index >= 0) timeQueueItems[index] = { ...timeQueueItems[index], ...item };
  else timeQueueItems.unshift(item);
  timeQueueItems.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  // Queue results are historical receipts, not the current database state.
  // Replaying them can undo newer edits or resurrect deleted records.
  return item;
}

async function enqueueTimeRows(records, operation = "insert") {
  const rows = (Array.isArray(records) ? records : [records]).filter(Boolean);
  if (!rows.length) throw new Error("ไม่มีข้อมูลเวลาสำหรับเข้าคิว");
  const queueUid = createTimeQueueUid(operation, rows);
  const startedAt = Date.now();
  try {
    const response = await cloudApiRequest("/api/time-save-queue/enqueue", {
      method: "POST",
      body: JSON.stringify({ queue_uid: queueUid, operation, records: rows }),
      timeoutMs: TIME_QUEUE_PRIMARY_TIMEOUT_MS
    });
    const item = mergeTimeQueueItem(response.data);
    if (!item?.id) throw new Error("ฐานข้อมูลไม่ได้ส่งเลขคิวเวลา กรุณาลองอีกครั้ง");
    trackTimeQueueItem(item.id);
    return item;
  } catch (error) {
    if (!isTransientCloudError(error)) throw error;
    const remainingMs = TIME_QUEUE_ACCEPT_TIMEOUT_MS - (Date.now() - startedAt);
    if (remainingMs > 300) {
      try {
        const lookup = await cloudApiRequest(
          `/api/time-save-queue/lookup?queue_uid=${encodeURIComponent(queueUid)}`,
          { timeoutMs: remainingMs }
        );
        const item = mergeTimeQueueItem(lookup.data);
        if (item?.id) {
          trackTimeQueueItem(item.id);
          return item;
        }
      } catch (lookupError) {
        console.warn("Time queue lookup failed.", lookupError);
      }
    }
    throw new Error("ยังยืนยันไม่ได้ว่าฐานรับคิวเวลาแล้ว ข้อมูลในช่องกรอกยังอยู่ กรุณาตรวจอินเทอร์เน็ตแล้วกดอีกครั้ง");
  }
}

function trackTimeQueueItem(queueId, attempt = 0) {
  const id = Number(queueId);
  if (!id || timeQueueTrackers.has(id)) return;
  const poll = async () => {
    timeQueueTrackers.delete(id);
    try {
      const response = await cloudApiRequest(`/api/time-save-queue/${id}`, { timeoutMs: TIME_QUEUE_ACCEPT_TIMEOUT_MS });
      const item = mergeTimeQueueItem(response.data);
      if (["succeeded", "needs_review", "failed"].includes(item?.status)) {
        timeRecordMessageType = item.status === "succeeded" ? "success" : "error";
        timeRecordMessage = item.status === "succeeded"
          ? `${timeQueueNumber(item)} ฐานข้อมูลยืนยันบันทึกแล้ว`
          : `${timeQueueNumber(item)} ยังบันทึกไม่สำเร็จ: ${item.error_message || "กรุณาตรวจสอบในคิวบันทึกเวลา"}`;
        await refreshConfirmedTimeRecords();
        if (location.hash === "#/time-report" && !isEditingFormField()) render();
        return;
      }
    } catch (error) {
      console.warn(`Time queue ${id} refresh failed.`, error);
    }
    if (attempt < 30) {
      const timer = window.setTimeout(() => {
        timeQueueTrackers.delete(id);
        trackTimeQueueItem(id, attempt + 1);
      }, TIME_QUEUE_POLL_INTERVAL_MS);
      timeQueueTrackers.set(id, timer);
    }
  };
  const timer = window.setTimeout(poll, attempt === 0 ? 250 : TIME_QUEUE_POLL_INTERVAL_MS);
  timeQueueTrackers.set(id, timer);
}

async function refreshTimeQueue({ renderAfter = false } = {}) {
  if (timeQueueLoading) return;
  timeQueueLoading = true;
  try {
    const response = await cloudApiRequest("/api/time-save-queue?limit=60", { timeoutMs: 7000 });
    timeQueueItems = Array.isArray(response.data) ? response.data : [];
    timeQueueLoadError = "";
    timeQueueItems.forEach((item) => {
      mergeTimeQueueItem(item);
      if (["queued", "processing"].includes(item.status)) trackTimeQueueItem(item.id);
    });
  } catch (error) {
    console.warn("Time queue refresh failed.", error);
    timeQueueLoadError = error instanceof Error ? error.message : "โหลดคิวบันทึกเวลาไม่สำเร็จ";
  } finally {
    timeQueueLoading = false;
    timeQueueLoadedOnce = true;
    if (renderAfter && location.hash === "#/time-report") render();
  }
}

async function runTimeQueueAction(queueId, action, records = null) {
  if (timeQueueActionId) return null;
  timeQueueActionId = Number(queueId);
  try {
    const response = await cloudApiRequest(`/api/time-save-queue/${queueId}/${action}`, {
      method: "POST",
      body: JSON.stringify(records ? { records } : {}),
      timeoutMs: 12000
    });
    const item = mergeTimeQueueItem(response.data);
    if (["queued", "processing"].includes(item?.status)) trackTimeQueueItem(item.id);
    return item;
  } finally {
    timeQueueActionId = null;
  }
}

async function loadTimeQueueForEdit(queueId) {
  const response = await cloudApiRequest(`/api/time-save-queue/${queueId}`, { timeoutMs: 8000 });
  editingTimeQueueItem = mergeTimeQueueItem(response.data);
  return editingTimeQueueItem;
}

function scheduleProductionQueueRefresh() {
  if (productionQueuePollTimer) window.clearTimeout(productionQueuePollTimer);
  productionQueuePollTimer = window.setTimeout(async () => {
    productionQueuePollTimer = null;
    if (productionView !== "queue") return;
    await refreshProductionQueue();
    scheduleProductionQueueRefresh();
  }, 2500);
}

async function runProductionQueueAction(queueId, action, payload = {}) {
  if (productionQueueActionId) return;
  productionQueueActionId = Number(queueId);
  productionQueueMessage = "กำลังตรวจสอบข้อมูลกับฐานข้อมูลกลาง...";
  productionQueueMessageType = "success";
  render();
  try {
    const response = await cloudApiRequest(`/api/production-save-queue/${queueId}/${action}`, {
      method: "POST",
      body: JSON.stringify(payload),
      timeoutMs: 12000
    });
    const item = acceptProductionQueueResult(response.data);
    productionQueueMessage = action === "verify"
      ? item?.status === "succeeded" ? "ตรวจสอบแล้ว พบข้อมูลในฐานและเชื่อมรายการเรียบร้อย" : item?.error_message || "ตรวจสอบรายการแล้ว"
      : action === "confirm-save" ? "ยืนยันตรวจสอบและบันทึกข้อมูลลงฐานเรียบร้อยแล้ว"
      : action === "retry" ? "ส่งข้อมูลต้นฉบับเดิมกลับเข้าคิวแล้ว"
      : action === "cancel" ? "ยกเลิกคิวแล้ว โดยยังเก็บประวัติไว้"
      : "เชื่อมรายการเดิมเรียบร้อยแล้ว";
    productionQueueMessageType = item?.status === "needs_review" ? "error" : "success";
    if (["queued", "processing"].includes(item?.status)) trackProductionQueueItem(item.id);
  } catch (error) {
    productionQueueMessage = error instanceof Error ? error.message : "ดำเนินการกับคิวไม่สำเร็จ";
    productionQueueMessageType = "error";
  } finally {
    productionQueueActionId = null;
    await refreshProductionQueue({ renderAfter: false });
    render();
  }
}

function isCurrentTimeVersion(existing, incoming) {
  if (!existing?.server_updated_at) return true;
  if (!incoming?.server_updated_at) return false;
  return Date.parse(incoming.server_updated_at) >= Date.parse(existing.server_updated_at);
}

let timeChangeWatchStarted = false;
let confirmedTimeRefresh = null;
let timeRenderPending = false;

function renderConfirmedTimeChange() {
  timeRenderPending = true;
  if (!isEditingFormField()) {
    timeRenderPending = false;
    render();
  }
}

async function refreshConfirmedTimeRecords() {
  if (confirmedTimeRefresh) return confirmedTimeRefresh;
  if (liveStateRefreshInFlight || applyingCloudState) throw new Error("Time snapshot is still loading; retry delta afterwards.");
  confirmedTimeRefresh = (async () => {
    const token = getSession()?.token;
    const cursor = localStorage.getItem(TIME_SYNC_CURSOR_KEY) || "";
    const response = await cloudApiRequest(`/api/time-records/delta?cursor=${encodeURIComponent(cursor)}`, { timeoutMs: 15000 });
    if (!token || getSession()?.token !== token) throw new Error("Time sync session changed.");
    const delta = response.data || {};
    applyTimeDelta(delta.records || [], delta.deleted_ids || [], delta.cursor || cursor);
    if ((delta.records || []).length || (delta.deleted_ids || []).length) renderConfirmedTimeChange();
  })();
  try { await confirmedTimeRefresh; } finally { confirmedTimeRefresh = null; }
}

function startTimeChangeWatch() {
  if (timeChangeWatchStarted) return;
  timeChangeWatchStarted = true;
  let revision = "";
  let sessionToken = "";
  const watch = async () => {
    let retryMs = 100;
    try {
      const session = getSession();
      if (!session || document.hidden || !lastLiveStateFullRefreshAt) { retryMs = 1000; return; }
      if (sessionToken !== session.token) { sessionToken = session.token; revision = ""; }
      const response = await cloudApiRequest(`/api/time-records/changes?revision=${encodeURIComponent(revision)}`, { timeoutMs: 25000 });
      if (getSession()?.token !== sessionToken) { revision = ""; return; }
      const next = response.data?.revision;
      if (next && next !== revision) {
        await refreshConfirmedTimeRecords();
        revision = next;
      }
    } catch (error) {
      console.warn("Time change notification disconnected; retrying.", error);
      retryMs = 5000;
    } finally { window.setTimeout(watch, retryMs); }
  };
  watch();
}

function mergeTimeCloudRows(cloudRows) {
  if (!Array.isArray(cloudRows) || !cloudRows.length) return;
  const records = getTimeRecords();
  const merged = [...records];
  cloudRows.forEach((cloudRow) => {
    const existingIndex = merged.findIndex((record) => Number(record.id) === Number(cloudRow.id));
    if (existingIndex >= 0) {
      if (isCurrentTimeVersion(merged[existingIndex], cloudRow)) merged[existingIndex] = { ...merged[existingIndex], ...cloudRow };
    } else {
      merged.push(cloudRow);
    }
  });
  saveTimeRecordsLocal(merged);
}

function assertTimeCloudRowMatches(expected, actual) {
  const fields = [
    ["record_date", "วันที่"],
    ["emp_code", "รหัสพนักงาน"],
    ["clock_in", "เวลาเข้า"],
    ["clock_out", "เวลาออก"]
  ];
  fields.forEach(([field, label]) => {
    if (String(expected?.[field] || "") !== String(actual?.[field] || "")) {
      throw new Error(`Cloud ตรวจกลับมาไม่ตรง: ${label} ไม่ตรง กรุณาตรวจสอบก่อนบันทึกใหม่`);
    }
  });
}

async function saveTimeRowsToCloud(records, { mode = "upsert" } = {}) {
  const rows = (Array.isArray(records) ? records : [records]).filter(Boolean);
  if (!rows.length) return [];
  clearTimeout(liveStateSyncTimers.get("time_records"));
  liveStateSyncTimers.delete("time_records");
  liveStateSyncInFlight.add("time_records");
  try {
    const response = await cloudApiRequest("/api/time-records/bulk-sync", {
      method: "POST",
      body: JSON.stringify({ records: rows, mode })
    });
    const cloudRows = Array.isArray(response.data) ? response.data : [];
    if (cloudRows.length !== rows.length) {
      throw new Error(`Cloud ยืนยันรายการเวลาไม่ครบ (${cloudRows.length}/${rows.length}) กรุณาตรวจสอบเน็ตแล้วกดบันทึกอีกครั้ง`);
    }
    rows.forEach((expected, index) => assertTimeCloudRowMatches(expected, cloudRows[index]));
    applyingCloudState = true;
    mergeTimeCloudRows(cloudRows);
    return cloudRows;
  } finally {
    applyingCloudState = false;
    liveStateSyncInFlight.delete("time_records");
  }
}

async function deleteTimeRecordFromCloud(id) {
  clearTimeout(liveStateSyncTimers.get("time_records"));
  liveStateSyncTimers.delete("time_records");
  liveStateSyncInFlight.add("time_records");
  try {
    await cloudApiRequest("/api/time-records/bulk-sync", {
      method: "POST",
      body: JSON.stringify({ mode: "delete", record_ids: [id] })
    });
  } finally {
    liveStateSyncInFlight.delete("time_records");
  }
}

function waitForMilliseconds(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function syncLiveStateNow(table, { renderOnSuccess = true } = {}) {
  const config = liveStateConfig[table];
  if (applyingCloudState || !config) return false;
  const requestVersion = getLiveStateSyncVersion(table);
  const rows = config.read();
  liveStateSyncInFlight.add(table);
  let receivedMergedRows = false;
  try {
    const response = await cloudApiRequest("/api/state", {
      method: "POST",
      body: JSON.stringify({ table, rows })
    });
    if (Array.isArray(response.data) && getLiveStateSyncVersion(table) === requestVersion) {
      applyingCloudState = true;
      writeLiveStateRowsToStorage(table, config.key, response.data);
      receivedMergedRows = true;
    } else {
      liveStateSyncPending.add(table);
    }
  } catch (error) {
    liveStateSyncPending.add(table);
    throw error;
  } finally {
    applyingCloudState = false;
    liveStateSyncInFlight.delete(table);
  }
  if (receivedMergedRows && renderOnSuccess && !isEditingFormField()) render();
  return receivedMergedRows;
}

async function flushLiveStateSync(table) {
  if (!liveStateConfig[table]) return false;
  clearTimeout(liveStateSyncTimers.get(table));
  liveStateSyncTimers.delete(table);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    while (liveStateSyncInFlight.has(table)) {
      await waitForMilliseconds(50);
    }
    const requestVersion = getLiveStateSyncVersion(table);
    liveStateSyncPending.delete(table);
    const synced = await syncLiveStateNow(table, { renderOnSuccess: false });
    if (synced && getLiveStateSyncVersion(table) === requestVersion && !liveStateSyncPending.has(table)) {
      return true;
    }
  }

  throw new Error("ยังยืนยันการบันทึกขึ้น Cloud ไม่สำเร็จ กรุณาลองบันทึกอีกครั้ง");
}

function queueLiveStateSync(table, options = {}) {
  if (applyingCloudState || !liveStateConfig[table]) return;
  const markChanged = options.markChanged !== false;
  const delayMs = Number.isFinite(Number(options.delayMs)) ? Number(options.delayMs) : 150;
  if (markChanged) {
    liveStateSyncVersions.set(table, getLiveStateSyncVersion(table) + 1);
  }
  clearTimeout(liveStateSyncTimers.get(table));
  liveStateSyncTimers.set(table, setTimeout(async () => {
    liveStateSyncTimers.delete(table);
    if (liveStateSyncInFlight.has(table)) {
      liveStateSyncPending.add(table);
      return;
    }
    const requestVersion = getLiveStateSyncVersion(table);
    let receivedMergedRows = false;
    try {
      receivedMergedRows = await syncLiveStateNow(table);
    } catch (error) {
      console.error(`Cloud sync failed for ${table}.`, error);
    }
    if (liveStateSyncPending.has(table) || getLiveStateSyncVersion(table) !== requestVersion) {
      liveStateSyncPending.delete(table);
      queueLiveStateSync(table, { markChanged: false, delayMs: receivedMergedRows ? 150 : 2000 });
      return;
    }
  }, delayMs));
}

function isEditingFormField() {
  const active = document.activeElement;
  return Boolean(
    active &&
    (active.matches?.("input, select, textarea") || active.isContentEditable)
  );
}

async function refreshLiveStateFromCloud({ renderWhenIdle = true, force = false } = {}) {
  if (
    confirmedTimeRefresh ||
    liveStateRefreshInFlight ||
    applyingCloudState ||
    productionSaving ||
    liveStateSyncTimers.size ||
    liveStateSyncInFlight.size ||
    !getSession()
  ) return;
  const now = Date.now();
  if (!force && lastLiveStateFullRefreshAt && now - lastLiveStateFullRefreshAt < LIVE_STATE_REFRESH_INTERVAL_MS) {
    return;
  }

  const refreshVersionSignature = getLiveStateVersionSignature();
  liveStateRefreshInFlight = true;
  let changed = false;
  try {
    const timeSyncCursor = String(localStorage.getItem(TIME_SYNC_CURSOR_KEY) || "");
    const auditSyncCursor = String(localStorage.getItem(AUDIT_SYNC_CURSOR_KEY) || "");
    const canReadAudit = canOpen(getSession()?.user, "audit-log");
    const [response, productionResponse, timeResponse, auditResponse] = await Promise.all([
      cloudApiRequest("/api/state?exclude=production_records,time_records,audit_logs"),
      productionSyncCursor
        ? cloudApiRequest(`/api/production-records/delta?cursor=${encodeURIComponent(productionSyncCursor)}`)
        : cloudApiRequest("/api/production-records/snapshot"),
      timeSyncCursor && getTimeRecords().length
        ? cloudApiRequest(`/api/time-records/delta?cursor=${encodeURIComponent(timeSyncCursor)}`)
        : cloudApiRequest("/api/time-records/snapshot"),
      !canReadAudit ? Promise.resolve(null) : auditSyncCursor && getAuditLogs().length
        ? cloudApiRequest(`/api/audit-logs/delta?cursor=${encodeURIComponent(auditSyncCursor)}`)
        : cloudApiRequest("/api/audit-logs/snapshot")
    ]);
    const state = response.data || {};
    if (
      refreshVersionSignature !== getLiveStateVersionSignature() ||
      liveStateSyncTimers.size ||
      liveStateSyncInFlight.size
    ) {
      return;
    }
    applyingCloudState = true;
    for (const [table, config] of Object.entries(liveStateConfig)) {
      if (["production_records", "time_records", "audit_logs"].includes(table)) continue;
      const cloudRows = Array.isArray(state[table]) ? state[table] : [];
      if (writeLiveStateRowsToStorage(table, config.key, cloudRows)) changed = true;
    }
    if (productionSyncCursor) {
      const delta = productionResponse.data || {};
      if ((delta.records || []).length || (delta.deleted_ids || []).length) changed = true;
      await applyProductionDelta(delta.records || [], delta.deleted_ids || [], delta.cursor || productionSyncCursor);
    } else {
      const rows = Array.isArray(productionResponse.data) ? productionResponse.data : [];
      productionSyncCursor = String(productionResponse.cursor || "");
      writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, rows);
      await replaceProductionIndexedDb(rows, productionSyncCursor);
      changed = true;
    }
    if (auditResponse && auditSyncCursor && getAuditLogs().length) {
      const delta = auditResponse.data || {};
      if ((delta.records || []).length) changed = true;
      applyAuditDelta(delta.records || [], delta.cursor || auditSyncCursor);
    } else if (auditResponse) {
      const rows = Array.isArray(auditResponse.data) ? auditResponse.data : [];
      writeLiveStateRowsToStorage("audit_logs", AUDIT_LOG_KEY, rows);
      if (auditResponse.cursor) localStorage.setItem(AUDIT_SYNC_CURSOR_KEY, String(auditResponse.cursor));
      changed = true;
    }
    if (timeSyncCursor && getTimeRecords().length) {
      const delta = timeResponse.data || {};
      if ((delta.records || []).length || (delta.deleted_ids || []).length) changed = true;
      applyTimeDelta(delta.records || [], delta.deleted_ids || [], delta.cursor || timeSyncCursor);
    } else {
      const rows = Array.isArray(timeResponse.data) ? timeResponse.data : [];
      writeLiveStateRowsToStorage("time_records", TIME_RECORDS_KEY, rows);
      if (timeResponse.cursor) localStorage.setItem(TIME_SYNC_CURSOR_KEY, String(timeResponse.cursor));
      changed = true;
    }
  } catch (error) {
    console.warn("Live cloud refresh failed.", error);
  } finally {
    lastLiveStateFullRefreshAt = Date.now();
    applyingCloudState = false;
    liveStateRefreshInFlight = false;
  }

  if (changed && renderWhenIdle && !isEditingFormField()) render();
}

async function bootstrapLiveStateFromCloud() {
  const indexedProduction = await readProductionIndexedDb().catch(() => ({ records: [], cursor: "" }));
  if (indexedProduction.records.length) {
    productionSyncCursor = indexedProduction.cursor;
    writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, indexedProduction.records);
  }
  const timeSyncCursor = String(localStorage.getItem(TIME_SYNC_CURSOR_KEY) || "");
  const auditSyncCursor = String(localStorage.getItem(AUDIT_SYNC_CURSOR_KEY) || "");
  const localTimeRecords = getTimeRecords();
  const localAuditLogs = getAuditLogs();
  const canReadAudit = canOpen(getSession()?.user, "audit-log");
  const [response, productionResponse, timeResponse, auditResponse] = await Promise.all([
    cloudApiRequest("/api/state?exclude=production_records,time_records,audit_logs"),
    indexedProduction.records.length && indexedProduction.cursor
      ? cloudApiRequest(`/api/production-records/delta?cursor=${encodeURIComponent(indexedProduction.cursor)}`)
      : cloudApiRequest("/api/production-records/snapshot"),
    timeSyncCursor && localTimeRecords.length
      ? cloudApiRequest(`/api/time-records/delta?cursor=${encodeURIComponent(timeSyncCursor)}`)
      : cloudApiRequest("/api/time-records/snapshot"),
    !canReadAudit ? Promise.resolve(null) : auditSyncCursor && localAuditLogs.length
      ? cloudApiRequest(`/api/audit-logs/delta?cursor=${encodeURIComponent(auditSyncCursor)}`)
      : cloudApiRequest("/api/audit-logs/snapshot")
  ]);
  const state = response.data || {};
  lastLiveStateFullRefreshAt = Date.now();
  // Only the desktop file launcher owns legacy browser-only data. A phone or
  // iPad must only read cloud data, never upload its potentially stale cache.
  const needsMigration =
    location.protocol === "file:" &&
    localStorage.getItem(CLOUD_MIGRATION_KEY) !== "done";
  applyingCloudState = true;
  try {
    for (const [table, config] of Object.entries(liveStateConfig)) {
      if (["production_records", "time_records", "audit_logs"].includes(table)) continue;
      const cloudRows = Array.isArray(state[table]) ? state[table] : [];
      const localRows = config.read();
      if (needsMigration && localRows.length) {
        const merged = [...cloudRows];
        const byId = new Map(cloudRows.map((row) => [String(row.id), row]));
        const byProductionUid = table === "production_records"
          ? new Map(cloudRows.map((row) => [getProductionClientUid(row), row]).filter(([uid]) => uid))
          : new Map();
        let nextId = Math.max(0, ...cloudRows.map((row) => Number(row.id) || 0));
        localRows.forEach((localRow) => {
          const productionUid = table === "production_records" ? getProductionClientUid(localRow) : "";
          if (productionUid && byProductionUid.has(productionUid)) return;
          const existing = byId.get(String(localRow.id));
          if (!existing) {
            merged.push(localRow);
            byId.set(String(localRow.id), localRow);
            if (productionUid) byProductionUid.set(productionUid, localRow);
            return;
          }
          if (JSON.stringify(existing) === JSON.stringify(localRow)) return;
          nextId += 1;
          const migratedRow = { ...localRow, id: nextId };
          merged.push(migratedRow);
          if (productionUid) byProductionUid.set(productionUid, migratedRow);
        });
        await cloudApiRequest("/api/state", {
          method: "POST",
          body: JSON.stringify({ table, rows: merged })
        });
        writeLiveStateRowsToStorage(table, config.key, merged);
      } else {
        writeLiveStateRowsToStorage(table, config.key, cloudRows);
      }
    }
    if (indexedProduction.records.length && indexedProduction.cursor) {
      const delta = productionResponse.data || {};
      await applyProductionDelta(delta.records || [], delta.deleted_ids || [], delta.cursor || indexedProduction.cursor);
    } else {
      const rows = Array.isArray(productionResponse.data) ? productionResponse.data : [];
      productionSyncCursor = String(productionResponse.cursor || "");
      writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, rows);
      await replaceProductionIndexedDb(rows, productionSyncCursor);
    }
    if (timeSyncCursor && localTimeRecords.length) {
      const delta = timeResponse.data || {};
      applyTimeDelta(delta.records || [], delta.deleted_ids || [], delta.cursor || timeSyncCursor);
    } else {
      const rows = Array.isArray(timeResponse.data) ? timeResponse.data : [];
      writeLiveStateRowsToStorage("time_records", TIME_RECORDS_KEY, rows);
      if (timeResponse.cursor) localStorage.setItem(TIME_SYNC_CURSOR_KEY, String(timeResponse.cursor));
    }
    if (auditResponse && auditSyncCursor && localAuditLogs.length) {
      const delta = auditResponse.data || {};
      applyAuditDelta(delta.records || [], delta.cursor || auditSyncCursor);
    } else if (auditResponse) {
      const rows = Array.isArray(auditResponse.data) ? auditResponse.data : [];
      writeLiveStateRowsToStorage("audit_logs", AUDIT_LOG_KEY, rows);
      if (auditResponse.cursor) localStorage.setItem(AUDIT_SYNC_CURSOR_KEY, String(auditResponse.cursor));
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

function cloudQuotaErrorMessage(error) {
  if (Number(error?.status) !== 402) return "";
  return "Supabase ใช้โควต้า Bandwidth หมดแล้ว ระบบ Cloud ถูกจำกัดชั่วคราว จึงยังเข้าสู่ระบบไม่ได้ กรุณาอัปเกรด Supabase Pro หรือรอ quota reset รอบถัดไป";
}

async function syncAccountsToCloud(accounts = getAccountUsers()) {
  if (!canManageAccountUsers(getSession()?.user)) return [];
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

async function updateCloudWageRate(id, payload) {
  const data = await cloudApiRequest("/api/wage-rates", {
    method: "PUT",
    body: JSON.stringify({ ...payload, id })
  });
  const updated = Array.isArray(data.data) ? data.data.map(normalizeCloudWageRate) : [];
  if (updated.length) {
    const updatedRate = updated[0];
    saveWageRates(getWageRates().map((rate) => (Number(rate.id) === Number(id) ? updatedRate : rate)));
    return updatedRate;
  }
  return null;
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
    recruitment_group: employee.recruitment_group,
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
  if (typeId === DAILY_OT_OVERRIDE_TYPE) return "ปรับ OT รายวัน";
  return deductionTypeOptions.find((item) => item.id === typeId)?.label || typeId || "-";
}

function normalizeDeductionKind(value) {
  return value === "time" ? "time" : "production";
}

function normalizeDeductionRecord(record) {
  const now = new Date().toISOString();
  const startDate = String(record?.start_date || record?.deduction_date || localDateInputValue());
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

async function updateCloudDeductionApplication(id, payload) {
  const data = await cloudApiRequest("/api/deduction-applications", {
    method: "PUT",
    body: JSON.stringify({ id, ...payload })
  });
  const updated = Array.isArray(data.data) ? data.data.map(normalizeDeductionApplication) : [];
  return updated[0] || null;
}

async function deleteCloudDeductionApplication(id) {
  await cloudApiRequest("/api/deduction-applications", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
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

function isDailyOtOverrideRecord(record) {
  return String(record?.deduction_type || "") === DAILY_OT_OVERRIDE_TYPE;
}

function employeeReferenceMatches(record, employee) {
  if (!record || !employee) return false;
  const recordId = String(record.employee_id || "");
  const employeeId = String(employee.id || employee.employee_id || "");
  if (recordId && employeeId) return recordId === employeeId;
  return Boolean(record.emp_code && employee.emp_code) && String(record.emp_code) === String(employee.emp_code);
}

function getDailyOtOverride(employee, recordDate) {
  if (!employee || !recordDate) return null;
  const match = getDeductionRecords().filter((record) => (
    isDailyOtOverrideRecord(record) && record.status === "Active" &&
    record.start_date <= recordDate && (record.end_date || record.start_date) >= recordDate &&
    employeeReferenceMatches(record, employee)
  )).sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))[0];
  return match ? Number(match.amount) || null : null;
}

function getAdjustmentRecordsForRange(kind, startDate, endDate, employee = null) {
  const normalizedKind = normalizeDeductionKind(kind);
  const bonuses = getDeductionRecords().filter((record) => {
    if (!isAttendanceBonusRecord(record) || record.status !== "Active") return false;
    if (record.employee_kind !== normalizedKind) return false;
    if (!deductionRangesOverlap(record, startDate, endDate)) return false;
    if (!employee) return true;
    return employeeReferenceMatches(record, employee);
  });
  const appliedDeductions = deductionApplications
    .filter((application) => {
      if (application.status !== "Applied" || application.employee_kind !== normalizedKind) return false;
      if (application.applied_date < startDate || application.applied_date > endDate) return false;
      if (!employee) return true;
      return employeeReferenceMatches(application, employee);
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
  const dailyOtOverrides = getDeductionRecords().filter((record) => isDailyOtOverrideRecord(record) && record.status === "Active");
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
  return [...bonuses, ...dailyOtOverrides, ...deductions];
}

function getAppliedTotalForDeduction(deductionId) {
  return deductionApplications
    .filter((record) => record.status === "Applied" && Number(record.deduction_id) === Number(deductionId))
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

function getAppliedTotalForDeductionExcept(deductionId, applicationId) {
  return deductionApplications
    .filter((record) =>
      record.status === "Applied" &&
      Number(record.deduction_id) === Number(deductionId) &&
      Number(record.id) !== Number(applicationId)
    )
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

function approvedDeductionAuditDiff(before, after) {
  const fields = [
    ["applied_date", "วันที่อนุมัติ"],
    ["amount", "ยอดที่อนุมัติหัก"],
    ["note", "หมายเหตุ"]
  ];
  return fields
    .filter(([key]) => String(before?.[key] ?? "") !== String(after?.[key] ?? ""))
    .map(([key, label]) => {
      const beforeValue = key === "amount" ? money(before?.[key] || 0) : (before?.[key] || "-");
      const afterValue = key === "amount" ? money(after?.[key] || 0) : (after?.[key] || "-");
      return `${label}: "${beforeValue}" -> "${afterValue}"`;
    })
    .join(" | ");
}

async function apiUpdateApprovedDeductionApplication(id, payload, actor) {
  const existing = deductionApplications.find((record) => Number(record.id) === Number(id));
  if (!existing || existing.status !== "Applied") throw new Error("ไม่พบรายการอนุมัติแล้วนี้");
  if (!canEditApprovedDeductionApplication(actor, existing)) {
    throw new Error("บัญชีนี้ไม่มีสิทธิ์แก้ไขรายการนี้: C5 ขึ้นไปแก้ได้ตลอด ส่วน C4 แก้ได้ภายใน 15 นาทีหลังบันทึกเท่านั้น");
  }
  const source = getDeductionRecords().find((record) => Number(record.id) === Number(existing.deduction_id));
  const nextAmount = Number(payload.amount || 0);
  if (!payload.applied_date) throw new Error("กรุณาเลือกวันที่อนุมัติ");
  if (nextAmount <= 0) throw new Error("ยอดที่อนุมัติหักต้องมากกว่า 0");
  if (source) {
    const otherApplied = getAppliedTotalForDeductionExcept(existing.deduction_id, existing.id);
    if (otherApplied + nextAmount > Number(source.amount || 0) + 0.004) {
      throw new Error(`ยอดรวมที่อนุมัติหักแล้วห้ามเกินยอดตั้งต้น ${money(source.amount || 0)}`);
    }
  }
  const before = { ...existing };
  const updated = await updateCloudDeductionApplication(id, {
    applied_date: payload.applied_date,
    amount: nextAmount,
    note: payload.note || "",
    updated_by: actor?.fullname || actor?.username || ""
  });
  if (!updated) throw new Error("ไม่สามารถแก้ไขรายการอนุมัติแล้วได้");
  deductionApplications = deductionApplications.map((record) =>
    Number(record.id) === Number(id) ? updated : record
  );
  const diff = approvedDeductionAuditDiff(before, updated);
  addAuditLog(
    actor,
    "UPDATE_APPROVED_DEDUCTION",
    `แก้ไขรายการอนุมัติหักเงิน #${id} (${existing.emp_code} ${existing.employee_name}) รายการ: ${source?.deduction_label || "-"} | ${diff || "ไม่มีค่าที่เปลี่ยน"}`
  );
  return updated;
}

async function apiDeleteApprovedDeductionApplication(id, actor) {
  const existing = deductionApplications.find((record) => Number(record.id) === Number(id));
  if (!existing || existing.status !== "Applied") throw new Error("ไม่พบรายการอนุมัติแล้วนี้");
  if (!canDeleteApprovedDeductionApplication(actor, existing)) {
    throw new Error("บัญชีนี้ไม่มีสิทธิ์ลบรายการนี้: C5 ขึ้นไปลบได้ตลอด ส่วน C4 ลบได้เฉพาะรายการที่ตัวเองบันทึก");
  }
  const source = getDeductionRecords().find((record) => Number(record.id) === Number(existing.deduction_id));
  await deleteCloudDeductionApplication(id);
  deductionApplications = deductionApplications.filter((record) => Number(record.id) !== Number(id));
  addAuditLog(
    actor,
    "DELETE_APPROVED_DEDUCTION",
    `ลบรายการอนุมัติหักเงิน #${id} (${existing.emp_code} ${existing.employee_name}) รายการ: ${source?.deduction_label || "-"} | วันที่อนุมัติ: "${existing.applied_date || "-"}" | ยอดที่ลบ: "${money(existing.amount || 0)}" | หมายเหตุเดิม: "${existing.note || "-"}"`
  );
}

function getDeductionsForRange(kind, startDate, endDate, employee = null) {
  return getAdjustmentRecordsForRange(kind, startDate, endDate, employee).filter((record) => !isAttendanceBonusRecord(record) && !isDailyOtOverrideRecord(record));
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
  const otOverrideMode = payload.deduction_type === DAILY_OT_OVERRIDE_TYPE;
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
    client_uid: payload.client_uid || createProductionClientUid(),
    status: bonusMode || otOverrideMode ? "Active" : "Pending",
    created_by: actor?.fullname || ""
  });
  const created = await createCloudDeduction(baseRecord);
  if (!created) throw new Error(`ไม่สามารถบันทึก${bonusMode ? "เบี้ยขยัน" : "รายการหักเงิน"}ลงฐานข้อมูลกลางได้`);
  const existingRecords = getDeductionRecords();
  const existingIndex = existingRecords.findIndex((record) => Number(record.id) === Number(created.id));
  if (existingIndex >= 0) {
    saveDeductionRecords(existingRecords.map((record, index) => index === existingIndex ? created : record));
  } else {
    saveDeductionRecords([...existingRecords, created]);
  }
  addAuditLog(actor, bonusMode ? "CREATE_ATTENDANCE_BONUS" : otOverrideMode ? "CREATE_DAILY_OT_OVERRIDE" : "CREATE_DEDUCTION", `Added ${created.deduction_label} ${created.emp_code} ${created.amount}`);
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
  const appliedTotal = isAttendanceBonusRecord(existing) || isDailyOtOverrideRecord(existing) ? 0 : getAppliedTotalForDeduction(id);
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
    status: isAttendanceBonusRecord(existing) || isDailyOtOverrideRecord(existing) ? "Active" : (amount <= appliedTotal ? "Completed" : "Pending"),
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
  const existingAccount = existingId
    ? getAccountUsers().find((accountUser) => Number(accountUser.id) === Number(existingId))
    : null;
  const fullname = String(payload.fullname || "").trim();
  const phone = String(payload.phone || existingAccount?.phone || "").trim();
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "");
  const confirmPassword = String(payload.confirm_password || "");
  const roleKey = String(payload.role_key || "").trim();
  const customRoleLabel = normalizeCustomAccountRoleLabel(payload.custom_role_label);
  let roleOption = accountRoleOptionByKey(roleKey);
  const level = String(payload.level || "C1").toUpperCase();

  if (!fullname || !username || (!existingId && !phone)) {
    throw new Error("กรุณากรอกชื่อ-นามสกุล เบอร์โทร และ Username ให้ครบ");
  }

  if (!phone) {
    throw new Error("บัญชีนี้ยังไม่มีเบอร์โทรเดิม กรุณากรอกเบอร์โทรก่อนบันทึก");
  }

  if (roleKey === NEW_ACCOUNT_ROLE_KEY) {
    if (customRoleLabel.length < 2 || customRoleLabel.length > 60) {
      throw new Error("ชื่อตำแหน่งใหม่ต้องมีความยาว 2-60 ตัวอักษร");
    }
    const duplicateRole = [...accountRoleOptions, developerRoleOption].some((option) =>
      option.label.toLocaleLowerCase("th-TH") === customRoleLabel.toLocaleLowerCase("th-TH")
    );
    if (duplicateRole) {
      throw new Error("ตำแหน่งนี้มีอยู่แล้ว กรุณาเลือกจากรายการ Role");
    }
    const existingCustomRole = accountRoleOptionsForForm(existingAccount).find((option) =>
      option.isCustom &&
      option.label.toLocaleLowerCase("th-TH") === customRoleLabel.toLocaleLowerCase("th-TH")
    );
    if (existingCustomRole) {
      throw new Error("ตำแหน่งนี้เคยเพิ่มแล้ว กรุณาเลือกจากรายการ Role");
    }
    roleOption = createCustomAccountRoleOption(customRoleLabel);
  }

  if (!roleOption || roleOption.role === developerRoleOption.role) {
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
  if (!canManageAccountUsers(actor)) throw new Error("สร้างบัญชีได้เฉพาะ HR ระดับ C4 ขึ้นไป หรือผู้ดูแลระบบ");
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
  if (!canManageAccountUsers(actor)) throw new Error("แก้ไขบัญชีได้เฉพาะ HR ระดับ C4 ขึ้นไป หรือผู้ดูแลระบบ");
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
  if (!isTopLevelUser(actor)) throw new Error("ลบบัญชีได้เฉพาะผู้ดูแลระบบ");
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

function getProductionWithholdingTaxGroups() {
  const raw = localStorage.getItem(WITHHOLDING_TAX_GROUPS_KEY);
  if (!raw) return [...defaultProductionWithholdingTaxGroups];
  try {
    const groups = JSON.parse(raw);
    if (!Array.isArray(groups)) return [...defaultProductionWithholdingTaxGroups];
    return [...new Set(groups.map(normalizeEmployeePayGroupValue).filter(Boolean))];
  } catch {
    localStorage.removeItem(WITHHOLDING_TAX_GROUPS_KEY);
    return [...defaultProductionWithholdingTaxGroups];
  }
}

function saveProductionWithholdingTaxGroups(groups) {
  const normalizedGroups = [...new Set((groups || []).map(normalizeEmployeePayGroupValue).filter(Boolean))];
  localStorage.setItem(WITHHOLDING_TAX_GROUPS_KEY, JSON.stringify(normalizedGroups));
}

function getProductionWithholdingTax(payGroup, amount) {
  const normalizedGroup = normalizeEmployeePayGroupValue(payGroup);
  if (!getProductionWithholdingTaxGroups().includes(normalizedGroup)) return 0;
  return Math.round((Math.max(0, Number(amount) || 0) * PRODUCTION_WITHHOLDING_TAX_RATE + Number.EPSILON) * 100) / 100;
}

function getEmployeePayGroups() {
  const employeeGroups = getEmployees()
    .map((employee) => normalizeEmployeePayGroupValue(employee.pay_group))
    .filter(Boolean);
  const customGroups = [...new Set(employeeGroups)]
    .filter((group) => !primaryPayGroups.includes(group))
    .sort((a, b) => a.localeCompare(b, "th"));
  return [...primaryPayGroups, ...customGroups];
}

function normalizeNewPayGroupName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
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
  if (typeOption.category === "office") return "กลุ่ม Office";
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
    recruitment_group: normalizeTimeRecruitmentGroup(employee?.recruitment_group),
    daily_wage: typeOption.dailyWage,
    ot_hourly_rate: typeOption.category === "office" ? 0 : Number.isFinite(otHourlyRate) && otHourlyRate > 0 ? otHourlyRate : TIME_OT_HOURLY_RATE,
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
  return employees[(currentIndex >= 0 ? currentIndex + 1 : 0) % employees.length].emp_code;
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
    recruitment_group: normalizeTimeRecruitmentGroup(payload.recruitment_group),
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
    recruitment_group: normalizeTimeRecruitmentGroup(payload.recruitment_group === undefined
      ? employees.find((employee) => employee.id === id)?.recruitment_group
      : payload.recruitment_group),
    daily_wage: typeOption.dailyWage,
    ot_hourly_rate: otHourlyRate,
    status: "Active"
  });
  if (!updatedEmployee) throw new Error("ไม่สามารถแก้ไขพนักงานตามเวลาในฐานข้อมูลกลางได้");
  saveTimeEmployees(
    employees.map((employee) => (employee.id === id ? updatedEmployee : employee))
  );
}

let timeEmployeeManageGroup = "";

function timeEmployeeNumberGroup(employee) {
  const code = String(employee.emp_code);
  const prefix = code.length > 2 ? code.slice(0, -2) : "";
  return { key: `${normalizeTimeEmployeeType(employee.employee_type)}:${prefix}`, prefix };
}

function buildTimeEmployeeRenumberPlan(selectedIds) {
  const selectedIdSet = new Set(selectedIds.map(Number));
  const selectedEmployees = getTimeEmployees()
    .filter((employee) => selectedIdSet.has(employee.id))
    .sort((a, b) => Number(a.emp_code) - Number(b.emp_code));
  if (selectedEmployees.length < 2) throw new Error("เลือกพนักงานอย่างน้อย 2 คนเพื่อจัดลำดับเลข");
  if (selectedEmployees.some((employee) => !/^\d+$/.test(employee.emp_code))) {
    throw new Error("กลุ่มที่เลือกมีหมายเลขพนักงานที่ไม่ใช่ตัวเลข");
  }
  const groups = new Set(selectedEmployees.map((employee) => timeEmployeeNumberGroup(employee).key));
  if (groups.size !== 1) throw new Error("เลือกพนักงานประเภทเดียวกันและชุดรหัสเดียวกันเท่านั้น เพื่อไม่ให้เลขข้ามกลุ่ม");
  const startNumber = Number(selectedEmployees[0].emp_code);
  const codeWidth = Math.max(2, selectedEmployees[0].emp_code.length);
  const plan = selectedEmployees.map((employee, index) => ({
    employee,
    oldCode: employee.emp_code,
    newCode: String(startNumber + index).padStart(codeWidth, "0")
  }));
  const occupiedOutsideSelection = new Set(
    getTimeEmployees().filter((employee) => !selectedIdSet.has(employee.id)).map((employee) => employee.emp_code)
  );
  const conflictingCode = plan.find((item) => occupiedOutsideSelection.has(item.newCode))?.newCode;
  if (conflictingCode) {
    throw new Error(`ไม่สามารถจัดลำดับได้ เพราะหมายเลข ${conflictingCode} ถูกใช้โดยพนักงานนอกกลุ่มที่เลือก`);
  }
  return plan;
}

async function apiRenumberTimeEmployees(plan) {
  const changedItems = plan.filter((item) => item.oldCode !== item.newCode);
  for (const item of changedItems) {
    const employee = getTimeEmployees().find((candidate) => candidate.id === item.employee.id) || item.employee;
    await apiUpdateTimeEmployee(employee.id, { ...employee, emp_code: item.newCode });
  }
  return changedItems.length;
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

async function apiUpdateWageRate(id, payload, updatedBy) {
  const itemType = String(payload.item_type);
  const rate = Number(payload.rate);
  const effectiveDate = String(payload.effective_date);
  const validItemTypes = getWageRateTypeOptions().map((option) => option.value);

  if (!Number(id)) throw new Error("ไม่พบรายการอัตราค่าจ้างที่ต้องการแก้ไข");
  if (!validItemTypes.includes(itemType)) {
    throw new Error("กรุณาเลือกชนิดงานค่าจ้างที่มีอยู่ในระบบ");
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Rate must be greater than 0.");
  }
  if (!effectiveDate) {
    throw new Error("Effective date is required.");
  }

  const updatedCloudRate = await updateCloudWageRate(id, {
    item_type: itemType,
    rate,
    effective_date: effectiveDate,
    updated_by: updatedBy
  });
  if (!updatedCloudRate) throw new Error("แก้ไขอัตราค่าจ้างลงฐานข้อมูลไม่สำเร็จ");
  return updatedCloudRate;
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

function saveAuditLogs(logs, options = {}) {
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  if (options.sync !== false) queueLiveStateSync("audit_logs", { delayMs: AUDIT_LOG_SYNC_DELAY_MS });
}

function addAuditLog(user, action, detail, options = {}) {
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
  ], { sync: options.sync !== false });
}

function productionRecordsForActiveSession() {
  lockExpiredProductionRecords();
  const fruitId = getSelectedProductionFruitId();
  return getProductionRecords().filter(
    (record) => getRecordDate(record) === productionRecordDate && productionFruitTypeForRecord(record) === fruitId
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
  return summaryDate || localDateInputValue();
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

async function exportScaleEmployeeFile(rosterKind = "production") {
  // Fetch the complete central roster, independent of search and browser cache.
  const requestedRosters = rosterKind === "all"
    ? [["production", "/api/employees"], ["time", "/api/time-employees"]]
    : [[rosterKind, rosterKind === "time" ? "/api/time-employees" : "/api/employees"]];
  const responses = await Promise.all(requestedRosters.map(async ([kind, endpoint]) => ({
    kind,
    response: await cloudApiRequest(endpoint)
  })));
  if (responses.some(({ response }) => response.error || !Array.isArray(response.data))) {
    throw new Error('ไม่มีรายชื่อจากฐานกลางให้ส่งออก กรุณาตรวจการเชื่อมต่อ');
  }
  const rosterRows = responses.flatMap(({ kind, response }) => response.data.map((employee) => ({ kind, employee })));
  if (!rosterRows.length) throw new Error('ไม่มีรายชื่อจากฐานกลางให้ส่งออก กรุณาตรวจการเชื่อมต่อ');
  const ids = new Set();
  const codes = new Set();
  const employees = rosterRows.map(({ kind, employee }) => {
    const isTimeRoster = kind === "time";
    const rawId = String(employee.id ?? '').trim();
    const id = isTimeRoster ? `time-${rawId}` : rawId;
    const emp_code = String(employee.emp_code ?? '').trim();
    const fullname = String(employee.fullname ?? '').trim();
    if (!id || !emp_code || !fullname || ids.has(id) || codes.has(emp_code) ||
        !rawId || (typeof employee.id === 'number' && !Number.isSafeInteger(employee.id))) {
      throw new Error('รายชื่อสองฐานมีรหัสซ้ำ หรือมีข้อมูลไม่ครบ กรุณาตรวจรายชื่อก่อนดาวน์โหลด');
    }
    ids.add(id); codes.add(emp_code);
    return { id, emp_code, fullname, status: employee.status || 'Active' };
  });
  const exported_at = new Date().toISOString();
  const rosterLabel = rosterKind === "all" ? "all-employees" : rosterKind === "time" ? "time-employees" : "weight-employees";
  downloadTextFile(`Pff-${rosterLabel}-${exported_at.slice(0,10)}.json`, JSON.stringify({
    schema: 'pff.employees.v1', complete: true, exported_at,
    source: REPORT_API_BASE, roster_kind: rosterKind, employees
  }, null, 2), 'application/json;charset=utf-8');
  return employees.length;
}

async function exportTimeEmployeeXml() {
  return HipRoster.open({
    load: async () => {
      const response = await cloudApiRequest('/api/time-employees');
      if (response.error || !Array.isArray(response.data)) throw Error('โหลดรายชื่อรายวันล่าสุดไม่สำเร็จ');
      return response.data;
    },
    map: ScannerImport.rosterMap
  });
}

function getDesktopCatalogPayload() {
  const fruits = productionFruitOptions
    .filter((fruit) => productionFruitFieldLabels[fruit.id])
    .map((fruit) => ({ id: fruit.id, name: fruit.label, active: true }));
  const weighing_types = fruits.flatMap((fruit) => {
    const labels = getProductionFieldLabels(fruit.id);
    if (labels.mode === "single") {
      return [{ id: `${fruit.id}:weight`, fruit_id: fruit.id, name: labels.weight, active: true, unit: "kg", color: "green", position: 0 }];
    }
    return [
      { id: `${fruit.id}:water`, fruit_id: fruit.id, name: labels.water, active: true, unit: "kg", color: "blue", position: 0 },
      { id: `${fruit.id}:flower`, fruit_id: fruit.id, name: labels.flower, active: true, unit: "kg", color: "purple", position: 1 }
    ];
  });
  const piles = getFruitPiles().map((pile) => ({
    number: pile.number,
    name: pile.name,
    active: pile.visible,
    color: pile.color
  }));
  return { schema: "pff.catalog.v1", exported_at: new Date().toISOString(), source: REPORT_API_BASE, fruits, weighing_types, piles };
}

function exportDesktopCatalogFile() {
  const payload = getDesktopCatalogPayload();
  downloadTextFile(`Pff-catalog-${payload.exported_at.slice(0, 10)}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  return payload;
}

function desktopKindField(record, fruitId) {
  const labels = getProductionFieldLabels(fruitId);
  const kindId = String(record.kind_id || "").trim();
  const kindName = String(record.kind_name || "").trim();
  const compactKind = kindName.replaceAll("น้ำหนัก", "").replaceAll("มะม่วง", "").trim();
  if (labels.mode === "single") {
    const compactWeight = String(labels.weight || "").replaceAll("น้ำหนัก", "").trim();
    return kindId === `${fruitId}:weight` || kindName === labels.weight || compactKind === compactWeight || compactKind === productionFruitOptions.find((fruit) => fruit.id === fruitId)?.label ? "weight" : "";
  }
  const compactWater = String(labels.water || "").replaceAll("น้ำหนัก", "").replaceAll("มะม่วง", "").trim();
  const compactFlower = String(labels.flower || "").replaceAll("น้ำหนัก", "").replaceAll("มะม่วง", "").trim();
  if (kindId === `${fruitId}:water` || kindName === labels.water || compactKind === compactWater || (fruitId === "mango" && compactKind === "หั่นฝา")) return "water";
  if (kindId === `${fruitId}:flower` || kindName === labels.flower || compactKind === compactFlower) return "flower";
  return "";
}

function prepareDesktopWeighingImport(payload) {
  if (!payload || payload.schema !== "pff.weighing.v1" || !Array.isArray(payload.records)) {
    throw new Error("ไฟล์ต้องเป็น pff.weighing.v1 และมีรายการ records");
  }
  if (payload.simulated === true) throw new Error("ไม่รับไฟล์จากโหมดจำลอง (simulation)");
  if (!payload.records.length) throw new Error("ไฟล์นี้ไม่มีรายการชั่ง");
  if (payload.records.length > 5000) throw new Error("หนึ่งไฟล์รองรับไม่เกิน 5,000 รายการ");

  const accepted = [];
  const rejected = [];
  payload.records.forEach((source, index) => {
    const rowNo = index + 1;
    try {
      if (!source || typeof source !== "object") throw new Error("รูปแบบรายการไม่ถูกต้อง");
      const recordId = String(source.id || "").trim();
      if (!/^[A-Za-z0-9._:-]{8,160}$/.test(recordId)) throw new Error("รหัสรายการว่างหรือไม่ถูกต้อง");
      if (source.simulated === true || Number(source.simulated) === 1) throw new Error("เป็นข้อมูลจากโหมดจำลอง");
      if (source.void_at || source.void_reason) throw new Error("รายการถูกยกเลิก ต้องตรวจสอบแยกก่อนนำเข้า");
      const sourceFruitId = String(source.fruit_id || "").trim();
      const fruitId = productionFruitFieldLabels[sourceFruitId]
        ? sourceFruitId
        : productionFruitOptions.find((fruit) => fruit.label === String(source.fruit_name || "").trim() && productionFruitFieldLabels[fruit.id])?.id;
      if (!fruitId) throw new Error(`ไม่พบผลไม้ ${source.fruit_name || sourceFruitId || "-"} ในเว็บ`);
      const field = desktopKindField(source, fruitId);
      if (!field) throw new Error(`ประเภทน้ำหนัก ${source.kind_name || source.kind_id || "-"} ไม่ตรงกับผลไม้ในเว็บ`);
      const employeeCode = String(source.employee_code || "").trim();
      const employee = getEmployees().find((item) => item.status === "Active" && String(item.emp_code) === employeeCode);
      if (!employee) throw new Error(`ไม่พบพนักงานรหัส ${employeeCode || "-"} หรือพนักงานไม่ได้ใช้งาน`);
      if (String(source.employee_id || "") && String(source.employee_id) !== String(employee.id)) throw new Error("รหัสอ้างอิงพนักงานไม่ตรงกับฐานเว็บ");
      const recordDate = String(source.record_date || "").trim();
      if (!isValidProductionRecordDate(recordDate)) throw new Error("วันที่ชั่งไม่ถูกต้องหรือเป็นวันที่อนาคต");
      const recordedAt = new Date(source.recorded_at);
      if (!source.recorded_at || Number.isNaN(recordedAt.getTime()) || String(source.recorded_at).slice(0, 10) !== recordDate) throw new Error("เวลาและวันที่ชั่งไม่สอดคล้องกัน");
      const tenths = Number(source.tenths);
      const weight = Number(source.weight_kg);
      if (!Number.isSafeInteger(tenths) || tenths <= 0 || !Number.isFinite(weight) || Math.abs(weight - tenths / 10) > 0.0001) throw new Error("น้ำหนักไม่ตรงกับหน่วยทศนิยมของเครื่องชั่ง");
      const rawKg = Number(source.raw_kg);
      if (!Number.isFinite(rawKg) || Math.trunc((rawKg + Number.EPSILON) * 10) !== tenths) throw new Error("น้ำหนักดิบไม่สอดคล้องกับน้ำหนักที่ส่งมาคิดเงิน");
      const pileNo = normalizeProductionPileNumber(source.pile_no ?? source.pile);
      if (!pileNo || !isConfiguredFruitPile(pileNo, true)) throw new Error(`ไม่พบกอง ${source.pile_no ?? source.pile ?? "-"} หรือกองไม่ได้เปิดใช้งานในเว็บ`);
      const recordTime = recordedAt.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" });
      const basePayload = { employee, fruit_type: fruitId, pile_no: pileNo, record_date: recordDate, entry_mode: "desktop-import" };
      if (field === "weight") basePayload.durian_weight = weight;
      else {
        basePayload.water_weight = field === "water" ? weight : 0;
        basePayload.flower_weight = field === "flower" ? weight : 0;
      }
      const built = buildProductionRecord(basePayload, { fullname: "Import" });
      accepted.push({
        ...built,
        client_uid: `pff:${recordId}`,
        batch_uid: `pff-export:${String(payload.export_id || "unknown").slice(0, 120)}`,
        record_time: recordTime,
        created_by: "Import",
        updated_by: "Import",
        desktop_import: {
          schema: payload.schema, export_id: payload.export_id || "", station_id: payload.station_id || "",
          record_id: recordId, capture_id: source.capture_id || "", recorded_at: source.recorded_at,
          raw_kg: source.raw_kg, tenths, device: source.device || "", raw_frame: source.raw_frame || "", stability: source.stability || ""
        }
      });
    } catch (error) {
      rejected.push({ row: rowNo, id: String(source?.id || "-"), reason: error.message });
    }
  });
  return { payload, accepted, rejected };
}

async function submitDesktopWeighingImport(user, confirmOverlap = false) {
  if (!canImportDesktopWeighing(getSession()?.user)) {
    desktopImportPreview = null;
    desktopImportMessage = "การนำเข้าข้อมูลชั่งใช้สิทธิ์ C6 ขึ้นไป บัญชี C4–C5 ดูและส่งออกข้อมูลหลักได้";
    desktopImportMessageType = "error";
    render();
    return;
  }
  if (!desktopImportPreview?.accepted.length || desktopImportBusy) return;
  desktopImportBusy = true;
  desktopImportMessage = "กำลังส่งรายการเข้าคิวฐานข้อมูลกลาง...";
  desktopImportMessageType = "success";
  render();
  try {
    const response = await cloudApiRequest("/api/desktop-import/enqueue-file", {
      method: "POST",
      body: JSON.stringify({
        file_name: desktopImportPreview.fileName,
        records: desktopImportPreview.accepted,
        ...(confirmOverlap ? { review_token: desktopImportPreview.review?.review_token } : {})
      }),
      timeoutMs: 60000
    });
    const queues = response.queues || [];
    if (!response.accepted || !queues.length) throw new Error("ฐานกลางยังไม่ยืนยันการรับไฟล์");
    for (const queue of queues) {
      const item = acceptProductionQueueResult(queue);
      if (item?.id) trackProductionQueueItem(item.id);
    }
    addAuditLog(user, "IMPORT_DESKTOP_WEIGHING", `Accepted file ${desktopImportPreview.fileName}: ${response.record_count} records into ${queues.length} queues`);
    desktopImportMessage = `รับไฟล์เข้าคิวแล้ว ${response.record_count.toLocaleString("th-TH")} รายการ · ${queues.length.toLocaleString("th-TH")} คิว รอฐานข้อมูลยืนยันการบันทึกครบ น้ำหนักเท่ากันคนละรอบจะไม่ถูกตัดทิ้ง`;
    desktopImportMessageType = "success";
    desktopImportPreview = null;
  } catch (error) {
    if (error.data?.code === "desktop_file_review") {
      desktopImportPreview.review = error.data;
    } else if (error.data?.code === "desktop_file_duplicate") {
      desktopImportPreview.review = null;
      desktopImportPreview.blocked = true;
    }
    desktopImportMessage = `นำเข้าไม่สำเร็จ: ${error.message}`;
    desktopImportMessageType = "error";
  } finally {
    desktopImportBusy = false;
    render();
  }
}

function getPileSummaries(records) {
  const summaries = new Map();

  records.forEach((record) => {
    const pile = normalizeProductionPileNumber(record.pile_no ?? record.pile) ?? "-";
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

  return Array.from(summaries.values()).sort((a, b) => {
    if (a.pile === "-") return 1;
    if (b.pile === "-") return -1;
    return a.pile - b.pile;
  });
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
  if (Array.isArray(productionRecordsMemory)) return productionRecordsMemory;
  const raw = localStorage.getItem(PRODUCTION_RECORDS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    productionRecordsMemory = Array.isArray(parsed) ? parsed : [];
    return productionRecordsMemory;
  } catch {
    localStorage.removeItem(PRODUCTION_RECORDS_KEY);
    productionRecordsMemory = [];
    return [];
  }
}

function saveProductionRecords(records, options = {}) {
  writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, records);
  if (options.sync !== false) queueLiveStateSync("production_records");
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

function resolveTimeRecordEmployee(record, employees) {
  // Employee numbers can change or be reused; the permanent id is authoritative.
  const employee = record.employee_id
    ? employees.find((item) => String(item.id) === String(record.employee_id))
    : employees.find((item) => String(item.emp_code).trim() === String(record.emp_code || "").trim());
  if (!employee) return record;
  return { ...record, recorded_emp_code: record.recorded_emp_code || record.emp_code,
    emp_code: String(employee.emp_code), fullname: employee.fullname || record.fullname };
}

function getTimeRecords() {
  const raw = localStorage.getItem(TIME_RECORDS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const employees = getTimeEmployees();
    return parsed.map((record) => {
      const wageNormalizedRecord = normalizeTimeRecordWage(resolveTimeRecordEmployee(record, employees));
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

function saveTimeRecordsLocal(records) {
  localStorage.setItem(TIME_RECORDS_KEY, JSON.stringify(records));
}

async function refreshSavedRecordView(mode = "time") {
  if (liveStateRefreshInFlight || liveStateSyncInFlight.size || liveStateSyncTimers.size || timeRecordSaving) {
    throw new Error("กำลังซิงก์หรือบันทึกข้อมูล กรุณารอสักครู่แล้วรีเฟรชอีกครั้ง");
  }
  liveStateRefreshInFlight = true;
  const version = getLiveStateVersionSignature();
  try {
    const table = mode === "time" ? "time" : "production";
    const [response] = await Promise.all([
      cloudApiRequest(`/api/${table}-records/snapshot`),
      table === "time" ? hydrateTimeEmployeesFromCloud() : hydrateEmployeesFromCloud()
    ]);
    if (!Array.isArray(response.data)) throw new Error("ข้อมูลจากฐานกลางไม่สมบูรณ์ กรุณาลองใหม่");
    if (version !== getLiveStateVersionSignature() || liveStateSyncInFlight.size || liveStateSyncTimers.size || timeRecordSaving) {
      throw new Error("มีการบันทึกระหว่างรีเฟรช กรุณาลองอีกครั้ง");
    }
    if (table === "time") {
      saveTimeRecordsLocal(response.data);
      localStorage.setItem(TIME_SYNC_CURSOR_KEY, String(response.cursor || ""));
    } else {
      await replaceProductionIndexedDb(response.data, response.cursor || "");
      writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, response.data);
      productionSyncCursor = String(response.cursor || "");
    }
  } finally {
    liveStateRefreshInFlight = false;
  }
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
    daily_wage: employee.employee_type === "office_347" ? 0 : employee.daily_wage || TIME_DAILY_WAGE,
    normal_hourly_rate: employee.employee_type === "office_347" ? 0 : (employee.daily_wage || TIME_DAILY_WAGE) / TIME_STANDARD_HOURS,
    ot_hourly_rate: employee.employee_type === "office_347" ? 0 : Number(employee.ot_hourly_rate) || TIME_OT_HOURLY_RATE,
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

function getTimeRecordInterval(clockIn, clockOut) {
  const start = parseTimeToMinutes(clockIn);
  const rawEnd = parseTimeToMinutes(clockOut);
  if (start === null || rawEnd === null) return null;
  return { start, end: rawEnd <= start ? rawEnd + 24 * 60 : rawEnd };
}

function timeRecordIntervalsOverlap(firstClockIn, firstClockOut, secondClockIn, secondClockOut) {
  const first = getTimeRecordInterval(firstClockIn, firstClockOut);
  const second = getTimeRecordInterval(secondClockIn, secondClockOut);
  if (!first || !second) return false;
  return first.start < second.end && second.start < first.end;
}

function findConflictingTimeRecord(empCode, recordDate, clockIn, clockOut, excludeId = null) {
  const normalizedCode = normalizeTimeEmployeeCodeInput(empCode);
  return getTimeRecords().find((record) => (
    (excludeId === null || Number(record.id) !== Number(excludeId)) &&
    normalizeTimeEmployeeCodeInput(record.emp_code || "") === normalizedCode &&
    record.record_date === recordDate &&
    timeRecordIntervalsOverlap(clockIn, clockOut, record.clock_in, record.clock_out)
  )) || null;
}

function assertNoConflictingTimeRecord(empCode, recordDate, clockIn, clockOut, excludeId = null) {
  const conflict = findConflictingTimeRecord(empCode, recordDate, clockIn, clockOut, excludeId);
  if (conflict) {
    throw new Error(
      `เวลาของพนักงานรหัส ${empCode} ทับกับรายการเดิม ${conflict.clock_in}-${conflict.clock_out} ` +
      `วันที่ ${recordDate} กรุณาตรวจสอบหรือแก้ไขรายการเดิม`
    );
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

async function apiCreateTimeRecord(payload, user) {
  const recordDate = String(payload.record_date || "").trim();
  const empCode = normalizeTimeEmployeeCodeInput(payload.emp_code);
  const record = buildTimeRecord(payload, user);
  assertNoConflictingTimeRecord(empCode, recordDate, record.clock_in, record.clock_out);
  const queueItem = await enqueueTimeRows([record], "insert");
  return { ...record, queue_item: queueItem };
}

async function apiCreateTimeRecords(payloads, user) {
  const pendingRecords = payloads.map((payload) => buildTimeRecord(payload, user));
  pendingRecords.forEach((record, index) => {
    assertNoConflictingTimeRecord(
      record.emp_code,
      record.record_date,
      record.clock_in,
      record.clock_out
    );
    const batchConflict = pendingRecords.slice(0, index).find((other) => (
      other.emp_code === record.emp_code &&
      other.record_date === record.record_date &&
      timeRecordIntervalsOverlap(record.clock_in, record.clock_out, other.clock_in, other.clock_out)
    ));
    if (batchConflict) {
      throw new Error(
        `เวลาของพนักงานรหัส ${record.emp_code} วันที่ ${record.record_date} ` +
        `ทับกันภายในชุด ${batchConflict.clock_in}-${batchConflict.clock_out}`
      );
    }
  });

  const queueItem = await enqueueTimeRows(pendingRecords, "insert");
  return { records: pendingRecords, queue_item: queueItem };
}

async function apiUpdateTimeRecord(id, payload, user) {
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
  assertNoConflictingTimeRecord(
    nextRecord.emp_code,
    nextRecord.record_date,
    nextRecord.clock_in,
    nextRecord.clock_out,
    id
  );

  nextRecord.audit_required = shouldAuditTimeRecordEdit(existingRecord);
  nextRecord.audit_before = {
    record_date: existingRecord.record_date,
    emp_code: existingRecord.emp_code,
    clock_in: existingRecord.clock_in,
    clock_out: existingRecord.clock_out
  };
  const queueItem = await enqueueTimeRows([nextRecord], "update");
  return { ...nextRecord, queue_item: queueItem };
}

async function apiDeleteTimeRecord(id, user) {
  const records = getTimeRecords();
  const record = records.find((item) => item.id === id);
  await deleteTimeRecordFromCloud(id);
  saveTimeRecordsLocal(records.filter((item) => item.id !== id));
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

function addDaysToDateSafe(dateValue, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || ""))) return "";
  return addDaysToDate(dateValue, days);
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
    { id: "weekly", label: "บันทึกรายสัปดาห์", description: "เลือกพนักงานและกรอกเวลาแบบ 7 วัน" },
    { id: "data", label: "รายการข้อมูล", description: "นำเข้าข้อมูลจากเครื่องสแกนและตรวจรายการเวลา" }
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
  const today = localDateInputValue();
  return getProductionRecords()
    .filter((record) => record.record_date === today)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

function apiCheckProductionDuplicate(
  employeeId,
  now = new Date(),
  fruitId = getSelectedProductionFruitId(),
  recordDate = productionRecordDate
) {
  const oneMinuteAgo = now.getTime() - 60 * 1000;

  return (
    getProductionRecords()
      .filter(
        (record) =>
          record.employee_id === employeeId &&
          productionFruitTypeForRecord(record) === fruitId &&
          getRecordDate(record) === recordDate
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .find((record) => new Date(record.created_at).getTime() >= oneMinuteAgo) ||
    null
  );
}

function getProductionPayloadPileSummary(payload) {
  const pile = String(normalizeProductionPileNumber(payload.pile_no ?? payload.pile) || "");
  const fruitId = payload.fruit_type || getSelectedProductionFruitId();
  if (isSingleWeightFruit(fruitId)) {
    const directWeight = Number(payload.durian_weight ?? payload.total_weight);
    const total = Number.isFinite(directWeight) && directWeight > 0
      ? directWeight
      : getDurianGradeTotal(payload.grade_weights || {});
    return { pile, water: 0, flower: 0, total };
  }
  const water = Number(payload.water_weight ?? payload.water ?? 0) || 0;
  const flower = Number(payload.flower_weight ?? payload.flower ?? 0) || 0;
  return { pile, water, flower, total: water + flower };
}

function summarizeProductionPayloadGroups(payloads) {
  const byPile = new Map();
  payloads.forEach((payload) => {
    const item = getProductionPayloadPileSummary(payload);
    if (!item.pile || item.total <= 0) return;
    const existing = byPile.get(item.pile) || { pile: item.pile, water: 0, flower: 0, total: 0 };
    existing.water += item.water;
    existing.flower += item.flower;
    existing.total += item.total;
    byPile.set(item.pile, existing);
  });
  return Array.from(byPile.values()).sort((a, b) => Number(a.pile) - Number(b.pile));
}

function summarizeExistingProductionGroups(employee, recordDate, fruitId) {
  const byPile = new Map();
  getProductionRecords()
    .filter((record) => {
      const sameEmployee =
        (employee?.id && Number(record.employee_id) === Number(employee.id)) ||
        String(record.emp_code || "").padStart(2, "0") === String(employee?.emp_code || "").padStart(2, "0");
      return sameEmployee && getRecordDate(record) === recordDate && productionFruitTypeForRecord(record) === fruitId;
    })
    .forEach((record) => {
      const item = getProductionPayloadPileSummary(record);
      if (!item.pile || item.total <= 0) return;
      const existing = byPile.get(item.pile) || { pile: item.pile, water: 0, flower: 0, total: 0, records: 0 };
      existing.water += item.water;
      existing.flower += item.flower;
      existing.total += item.total;
      existing.records += 1;
      byPile.set(item.pile, existing);
    });
  return Array.from(byPile.values()).sort((a, b) => Number(a.pile) - Number(b.pile));
}

function productionSimilarityRatio(a, b) {
  const larger = Math.max(Math.abs(a), Math.abs(b));
  if (larger <= 0) return 1;
  return Math.min(Math.abs(a), Math.abs(b)) / larger;
}

function productionDuplicateWeightChannels(group, fruitId) {
  if (isSingleWeightFruit(fruitId)) return group.total > 0 ? ["total"] : [];
  return ["water", "flower"].filter((channel) => Number(group[channel] || 0) > 0);
}

function getPotentialProductionDuplicateWarning(employee, payloads, recordDate, fruitId) {
  const incomingGroups = summarizeProductionPayloadGroups(payloads);
  const existingGroups = summarizeExistingProductionGroups(employee, recordDate, fruitId);
  if (!incomingGroups.length || incomingGroups.length !== existingGroups.length) return "";

  const existingByPile = new Map(existingGroups.map((group) => [group.pile, group]));
  if (!incomingGroups.every((group) => existingByPile.has(group.pile))) return "";

  const comparisons = incomingGroups.map((group) => ({
    group,
    existing: existingByPile.get(group.pile),
    channels: productionDuplicateWeightChannels(group, fruitId)
  }));
  // Water and flower are separate production types. Only compare the type
  // being entered with the same type already stored for that pile.
  if (comparisons.some(({ existing, channels }) =>
    !channels.length || channels.some((channel) => Number(existing?.[channel] || 0) <= 0)
  )) return "";

  const incomingTotal = comparisons.reduce((sum, item) =>
    sum + item.channels.reduce((channelSum, channel) => channelSum + Number(item.group[channel] || 0), 0), 0
  );
  const existingTotal = comparisons.reduce((sum, item) =>
    sum + item.channels.reduce((channelSum, channel) => channelSum + Number(item.existing[channel] || 0), 0), 0
  );
  const sameExact = incomingGroups.every((group) => {
    const existing = existingByPile.get(group.pile);
    return productionDuplicateWeightChannels(group, fruitId).every(
      (channel) => Math.abs(Number(group[channel] || 0) - Number(existing[channel] || 0)) < 0.05
    );
  });
  const totalSimilarity = productionSimilarityRatio(incomingTotal, existingTotal);
  if (!sameExact && totalSimilarity < 0.5) return "";

  const labels = getProductionFieldLabels(fruitId);
  const incomingLines = incomingGroups.map((group) => {
    const existing = existingByPile.get(group.pile);
    const channels = productionDuplicateWeightChannels(group, fruitId);
    const incomingWeight = channels.reduce((sum, channel) => sum + Number(group[channel] || 0), 0);
    const existingWeight = channels.reduce((sum, channel) => sum + Number(existing[channel] || 0), 0);
    return `กอง ${group.pile}: กำลังกรอก ${numberText(incomingWeight)} กก. / มีประเภทเดียวกันอยู่แล้ว ${numberText(existingWeight)} กก.`;
  });
  return [
    `อาจมีข้อมูลซ้ำของรหัส ${employee.emp_code} วันที่ ${recordDate}`,
    `จำนวนกองตรงกัน ${incomingGroups.length} กอง และยอดใกล้กัน ${Math.round(totalSimilarity * 100)}%`,
    ...incomingLines,
    "",
    `กด OK/ยืนยัน เพื่อบันทึกต่อ`,
    `กด Cancel/ยกเลิก เพื่อกลับไปตรวจสอบ โดยข้อมูลที่กรอกไว้จะยังอยู่`,
    labels.mode === "grades" ? "" : "ตรวจแยกประเภทน้ำหนัก ไม่เปรียบเทียบน้ำกับดอกข้ามกัน"
  ].filter((line) => line !== "").join("\n");
}

function createProductionClientUid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `production-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function createProductionBatchUid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `production-batch-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function isValidProductionRecordDate(value) {
  const date = String(value || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= localDateInputValue();
}

function buildProductionRecord(payload, user, existingRecord = null) {
  const now = new Date();
  const recordDate = payload.record_date || existingRecord?.record_date || localDateInputValue(now);
  const recordTime = existingRecord?.record_time || now.toTimeString().slice(0, 8);
  const fruitType = payload.fruit_type || existingRecord?.fruit_type || "mangosteen";
  const labels = getProductionFieldLabels(fruitType);
  const base = existingRecord || {};
  const pileNo = normalizeProductionPileNumber(payload.pile_no ?? existingRecord?.pile_no);
  if (pileNo === null) throw new Error("เลขกองต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป");

  if (isSingleWeightFruit(fruitType)) {
    const legacyWeights = normalizeDurianGradeWeights(payload.grade_weights || existingRecord?.grade_weights);
    const durianWeight = Number(
      payload.durian_weight ?? (payload.grade_weights ? getDurianGradeTotal(payload.grade_weights) : getRecordDurianWeight(existingRecord))
    );
    const rateRecord =
      apiGetCurrentProductionRate(fruitType, "weight", recordDate) ||
      apiGetCurrentProductionRate(fruitType, "grade_A", recordDate);
    const existingTotalWeight = getRecordDurianWeight(existingRecord);
    const derivedExistingRate = existingTotalWeight > 0
      ? Number(existingRecord?.total_amount || existingRecord?.grand_total || 0) / existingTotalWeight
      : 0;
    const preservedRate = Number(existingRecord?.durian_rate || derivedExistingRate || existingRecord?.grade_rates?.A);
    const rateMayBePending = fruitType === "pomelo" || fruitType === "coconut";
    const durianRate = rateRecord ? Number(rateRecord.rate) : (Number.isFinite(preservedRate) ? preservedRate : 0);
    if (!Number.isFinite(durianWeight) || durianWeight <= 0) {
      throw new Error(`กรุณากรอก${labels.weight}มากกว่า 0`);
    }
    if ((!Number.isFinite(durianRate) || durianRate <= 0) && !rateMayBePending) {
      throw new Error(
        `ยังไม่ได้ตั้งอัตราค่าจ้างสำหรับ${labels.weight} ` +
        `(วันที่เริ่มใช้ต้องไม่เกิน ${recordDate}) ตั้งเพียงครั้งเดียวแล้วระบบจะใช้ต่อเนื่องจนกว่าจะเปลี่ยนเรท`
      );
    }
    const gradeWeights = { ...legacyWeights, A: durianWeight, B: 0, C: 0, D: 0, E: 0 };
    const effectiveRate = Number.isFinite(durianRate) && durianRate > 0 ? durianRate : 0;
    const gradeRates = { A: effectiveRate, B: 0, C: 0, D: 0, E: 0 };
    const totalAmount = durianWeight * effectiveRate;
    const gradeAmounts = { A: totalAmount, B: 0, C: 0, D: 0, E: 0 };
    return {
      ...base,
      id: existingRecord?.id,
      client_uid: existingRecord?.client_uid || createProductionClientUid(),
      batch_uid: existingRecord?.batch_uid || payload.batch_uid || createProductionBatchUid(),
      session_id: payload.session_id || existingRecord?.session_id || 0,
      fruit_type: fruitType,
      production_mode: "single",
      employee_id: payload.employee.id,
      emp_code: payload.employee.emp_code,
      employee_name: payload.employee.fullname,
      fullname: payload.employee.fullname,
      pay_group: payload.employee.pay_group || existingRecord?.pay_group || "",
      pile_no: pileNo,
      pile: pileNo,
      date: recordDate,
      record_date: recordDate,
      record_time: recordTime,
      shift: payload.shift || existingRecord?.shift || "",
      durian_weight: durianWeight,
      durian_rate: effectiveRate,
      durian_amount: totalAmount,
      grade_weights: gradeWeights,
      grade_rates: gradeRates,
      grade_amounts: gradeAmounts,
      total_weight: durianWeight,
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
      entry_mode: payload.entry_mode || existingRecord?.entry_mode || "single",
      raw_weight_entries: payload.raw_weight_entries || existingRecord?.raw_weight_entries || [],
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

  const waterRate = waterRateRecord ? Number(waterRateRecord.rate) : Number(existingRecord?.water_rate);
  const flowerRate = flowerRateRecord ? Number(flowerRateRecord.rate) : Number(existingRecord?.flower_rate);
  const hasWaterRate = Number.isFinite(waterRate) && waterRate > 0;
  const hasFlowerRate = Number.isFinite(flowerRate) && flowerRate > 0;

  if (!hasWaterRate || !hasFlowerRate) {
    const missing = [
      !hasWaterRate ? labels.water : "",
      !hasFlowerRate ? labels.flower : ""
    ].filter(Boolean).join(", ");
    throw new Error(
      `ยังไม่ได้ตั้งอัตราค่าจ้างสำหรับ ${missing} ` +
      `(วันที่เริ่มใช้ต้องไม่เกิน ${recordDate}) ตั้งเพียงครั้งเดียวแล้วระบบจะใช้ต่อเนื่องจนกว่าจะเปลี่ยนเรท`
    );
  }

  const waterWeight = Number(payload.water_weight);
  const flowerWeight = Number(payload.flower_weight);
  const waterAmount = waterWeight * waterRate;
  const flowerAmount = flowerWeight * flowerRate;
  const totalWeight = waterWeight + flowerWeight;

  return {
    ...base,
    id: existingRecord?.id,
    client_uid: existingRecord?.client_uid || createProductionClientUid(),
    batch_uid: existingRecord?.batch_uid || payload.batch_uid || createProductionBatchUid(),
    session_id: payload.session_id || existingRecord?.session_id || 0,
    fruit_type: fruitType,
    production_mode: "dual",
    employee_id: payload.employee.id,
    emp_code: payload.employee.emp_code,
    employee_name: payload.employee.fullname,
    fullname: payload.employee.fullname,
    pay_group: payload.employee.pay_group || existingRecord?.pay_group || "",
    pile_no: pileNo,
    date: recordDate,
    shift: payload.shift || existingRecord?.shift || "",
    pile: pileNo,
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
    total_weight: totalWeight,
    total_amount: waterAmount + flowerAmount,
    grand_total: waterAmount + flowerAmount,
    entry_mode: payload.entry_mode || existingRecord?.entry_mode || "single",
    raw_weight_entries: payload.raw_weight_entries || existingRecord?.raw_weight_entries || [],
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

function apiCreateProductionRecord(payload, user, options = {}) {
  const records = getProductionRecords();
  const nextId = records.length
    ? Math.max(...records.map((record) => record.id)) + 1
    : 1;
  const record = {
    ...buildProductionRecord({ ...payload, batch_uid: payload.batch_uid || createProductionBatchUid() }, user),
    id: nextId
  };

  saveProductionRecords([...records, record], { sync: options.sync !== false });
  addAuditLog(
    user,
    "INSERT_PRODUCTION",
    isDurianFruit(record.fruit_type)
      ? `Added ${record.emp_code} pile ${record.pile_no} durian grades ${JSON.stringify(record.grade_weights)}`
      : `Added ${record.emp_code} pile ${record.pile_no} water ${record.water_weight} flower ${record.flower_weight}`,
    { sync: options.sync !== false }
  );
  return record;
}

function apiCreateProductionRecordsBatch(payloads, user, options = {}) {
  const records = getProductionRecords();
  let nextId = records.length ? Math.max(...records.map((record) => Number(record.id) || 0)) + 1 : 1;
  const batchUid = createProductionBatchUid();
  const createdRecords = payloads.map((payload) => ({
    ...buildProductionRecord({ ...payload, batch_uid: payload.batch_uid || batchUid }, user),
    id: nextId++
  }));

  saveProductionRecords([...records, ...createdRecords], { sync: options.sync !== false });
  createdRecords.forEach((record) => {
    addAuditLog(
      user,
      "INSERT_PRODUCTION",
      isDurianFruit(record.fruit_type)
        ? `Added ${record.emp_code} pile ${record.pile_no} durian grades ${JSON.stringify(record.grade_weights)}`
        : `Added ${record.emp_code} pile ${record.pile_no} water ${record.water_weight} flower ${record.flower_weight}`,
      { sync: options.sync !== false }
    );
  });
  return createdRecords;
}

function apiUpdateProductionRecord(id, payload, user, options = {}) {
  const records = getProductionRecords();
  const existingRecord = records.find((record) => record.id === id);

  if (!existingRecord) {
    throw new Error("Existing production record was not found.");
  }

  const updatedRecord = buildProductionRecord(payload, user, existingRecord);
  saveProductionRecords(
    records.map((record) => (record.id === id ? updatedRecord : record)),
    { sync: options.sync !== false }
  );
  addAuditLog(
    user,
    "UPDATE_PRODUCTION",
    `Updated ${updatedRecord.emp_code} record #${updatedRecord.id}`
  );
  return updatedRecord;
}

function rateMoney(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
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
    time_employees: getTimeEmployees(),
    production_records: getProductionRecords(),
    time_records: getTimeRecords(),
    deduction_records: getReportAdjustmentRecords()
  };
}

async function syncReportData() {
  const response = await fetch(`${REPORT_API_BASE}/reports/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Token": getSession()?.token || "" },
    body: JSON.stringify(buildReportPayload())
  });

  if (!response.ok) {
    throw new Error("Could not sync report data.");
  }
}

async function downloadReport(url, options = {}) {
  let response;
  const headers = new Headers(options.headers || {});
  headers.set("X-Session-Token", getSession()?.token || "");
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    throw new Error("เชื่อมต่อระบบรายงานไม่สำเร็จ กรุณาลอง Export อีกครั้งเมื่อเครือข่ายพร้อม");
  }

  if (!response.ok) {
    let detail = "";
    if ((response.headers.get("Content-Type") || "").includes("application/json")) {
      const body = await response.json().catch(() => ({}));
      if (typeof body.error === "string") detail = body.error.slice(0, 500);
    }
    const messages = {
      401: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่แล้ว Export อีกครั้ง",
      403: "บัญชีนี้ไม่มีสิทธิ์ส่งออกรายงานที่เลือก",
      413: "ข้อมูลรายงานเกินขนาดที่รองรับ กรุณาลดช่วงวันที่แล้ว Export อีกครั้ง",
      502: "ระบบรายงานยังไม่พร้อม กรุณาลองอีกครั้ง",
      503: "ระบบรายงานกำลังเริ่มทำงาน กรุณาลองอีกครั้ง"
    };
    throw new Error(`${messages[response.status] || detail || "สร้างรายงานไม่สำเร็จ"} (HTTP ${response.status})`);
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

function render(force = false) {
  const session = getSession();
  const route = location.hash.replace("#/", "") || "login";
  const stockMountKey = `${session?.user?.username || ""}:${canWriteStock(session?.user)}`;
  if (stockLedgerController && (stockLedgerMountedRoute !== route || stockLedgerMountKey !== stockMountKey || !session || !canOpen(session.user, route))) {
    stockLedgerController.destroy();
    stockLedgerController = null;
    stockLedgerMountedRoute = "";
  }
  const routeChanged = Boolean(lastRenderedRoute && lastRenderedRoute !== route);
  const personalFilter = document.activeElement;
  if (force !== true && session && !routeChanged && route === "summary-person" &&
      personalFilter?.matches?.("#personalReportForm select, #personalReportForm input")) {
    // Bootstrap and notification callbacks must not replace an open native picker.
    if (!personalFilter.dataset.pendingReportRender) {
      personalFilter.dataset.pendingReportRender = "1";
      personalFilter.addEventListener("blur", () => {
        window.setTimeout(() => {
          if (location.hash === "#/summary-person") render();
        }, 0);
      }, {once: true});
    }
    return;
  }

  if (route !== "dashboard") stopHomeStorageUsageRefresh();

  if (lastRenderedRoute === "audit-log" && route !== "audit-log") {
    auditLogUnlocked = false;
    auditLogMessage = "";
  }
  if (lastRenderedRoute === "backup" && route !== "backup") {
    resetBackupSecurityState();
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
  if (routeChanged) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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
    <main class="fresh-login">
      <header class="fresh-login-header">
        <div class="fresh-login-brand">
          
          <div><strong>APWS Web</strong><small>AUTOMATIC PRODUCTION WEIGHING SYSTEM</small></div>
        </div>
      </header>
      <div class="fresh-login-main">
        <section class="fresh-login-copy" aria-labelledby="loginWelcome">
          <h1 id="loginWelcome">เริ่มต้นวันดี ๆ<br />ไปด้วยกัน</h1>
          <p>บันทึกผลผลิตและดูแลทุกค่าจ้าง<br />ให้เป็นเรื่องง่ายในทุกวัน</p>
          <div class="fresh-login-art" aria-hidden="true"><img src="assets/login-fruits.png" alt="" width="1536" height="1024" /></div>
        </section>
        <form class="fresh-login-form" id="loginForm" aria-labelledby="loginHeading">
          <h2 id="loginHeading">เข้าสู่ระบบ</h2>
          <p class="fresh-login-hint">ใช้บัญชีพนักงานของคุณเพื่อเริ่มทำงาน</p>
          ${errorMessage ? `<div class="fresh-login-error" role="alert">${escapeHtml(errorMessage)}</div>` : ""}
          <label class="fresh-login-field" for="username"><span>ชื่อผู้ใช้งาน</span>
            <input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="กรอกชื่อผู้ใช้งาน" required />
          </label>
          <div class="fresh-login-field">
            <label for="password" style="display:block;margin-bottom:10px">รหัสผ่าน</label>
            <div class="fresh-login-password">
              <input id="password" name="password" type="password" autocomplete="current-password" placeholder="กรอกรหัสผ่าน" required />
              <button class="fresh-login-reveal" id="toggleLoginPassword" type="button" aria-label="แสดงรหัสผ่าน" aria-controls="password" aria-pressed="false">แสดง</button>
            </div>
          </div>
          <label class="fresh-login-remember"><input name="remember_session" type="checkbox" /><span>จดจำการเข้าสู่ระบบ</span></label>
          <button class="fresh-login-submit" type="submit">เข้าสู่ระบบ</button>
          <button class="fresh-login-help" id="loginHelp" type="button" aria-expanded="false" aria-controls="loginHelpMessage">ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ</button>
          <p class="fresh-login-feedback" id="loginHelpMessage" role="status" hidden>กรุณาติดต่อผู้ดูแลบัญชีของโรงงาน พร้อมแจ้งชื่อผู้ใช้งาน เพื่อขอตั้งรหัสผ่านใหม่</p>
        </form>
      </div>
      <footer class="fresh-login-footer">© 2026 โครงงานระบบชั่งน้ำหนักผลผลิตอัตโนมัติ</footer>
    </main>
  `;
  document.querySelector("#loginForm")?.addEventListener("submit", handleLogin);
  document.querySelector("#toggleLoginPassword")?.addEventListener("click", (event) => {
    const password = document.querySelector("#password");
    const showPassword = password.type === "password";
    password.type = showPassword ? "text" : "password";
    event.currentTarget.textContent = showPassword ? "ซ่อน" : "แสดง";
    event.currentTarget.setAttribute("aria-label", showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน");
    event.currentTarget.setAttribute("aria-pressed", String(showPassword));
  });
  document.querySelector("#loginHelp")?.addEventListener("click", (event) => {
    const message = document.querySelector("#loginHelpMessage");
    message.hidden = !message.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!message.hidden));
  });
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
    sessionStorage.setItem("apws_contest_welcome_user", cloudUser.username);
    hydrateAccountsFromCloud().catch(() => {});
    const nextRoute = getDefaultRouteForUser(cloudUser);
    if (location.hash === `#/${nextRoute}`) {
      render();
    } else {
      location.hash = `#/${nextRoute}`;
    }
    return;
  } catch (cloudError) {
    const quotaMessage = cloudQuotaErrorMessage(cloudError);
    if (quotaMessage) {
      renderLogin(quotaMessage);
      return;
    }
    if ((cloudError?.status >= 400 && cloudError?.status < 500) || location.protocol !== "file:") {
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
  sessionStorage.setItem("apws_contest_welcome_user", user.username);
  const nextRoute = getDefaultRouteForUser(user);
  if (location.hash === `#/${nextRoute}`) {
    render();
  } else {
    location.hash = `#/${nextRoute}`;
  }
}

function getPfAccountingWeeklyRows(startDate, endDate) {
  const range = normalizeDateRange(startDate, endDate);
  const rows = new Map();
  const productionEmployees = getEmployees().filter((employee) => employee.status === "Active");
  const productionById = new Map(productionEmployees.map((employee) => [String(employee.id), employee]));
  const productionByCode = new Map(productionEmployees.map((employee) => [String(employee.emp_code), employee]));
  productionEmployees.forEach((employee) => {
    const employeeKey = `production:${employee.id || employee.emp_code}`;
    rows.set(employeeKey, {
      employee_key: employeeKey,
      employee_kind: "production",
      employee_id: employee.id,
      emp_code: employee.emp_code || "-",
      fullname: employee.fullname || "-",
      group_label: getEmployeePayGroup(employee) || "ไม่ระบุกลุ่ม",
      gross_amount: 0,
      bonus_amount: 0,
      deduction_amount: 0,
      withholding_tax_amount: 0,
      net_amount: 0,
      metric_weight: 0,
      metric_hours: 0
    });
  });

  getProductionRecords()
    .filter((record) => {
      const date = getRecordDate(record);
      return date >= range.startDate && date <= range.endDate;
    })
    .forEach((record) => {
      const employee = productionById.get(String(record.employee_id || "")) || productionByCode.get(String(record.emp_code || ""));
      if (!employee) return;
      const employeeKey = `production:${employee.id || employee.emp_code}`;
      if (!rows.has(employeeKey)) {
        rows.set(employeeKey, {
          employee_key: employeeKey,
          employee_kind: "production",
          employee_id: employee.id,
          emp_code: employee.emp_code || "-",
          fullname: employee.fullname || "-",
          group_label: getEmployeePayGroup(employee) || "พนักงานงานน้ำหนัก",
          gross_amount: 0,
          bonus_amount: 0,
          deduction_amount: 0,
          withholding_tax_amount: 0,
          net_amount: 0,
          metric_weight: 0,
          metric_hours: 0
        });
      }
      rows.get(employeeKey).gross_amount += Number(record.total_amount || record.grand_total || 0);
      rows.get(employeeKey).metric_weight += Number(getRecordTotalWeight(record) || 0);
    });

  rows.forEach((row) => {
    if (row.employee_kind !== "production") return;
    const employee = productionById.get(String(row.employee_id || "")) || productionByCode.get(String(row.emp_code || ""));
    const bonusRecords = getBonusesForRange("production", range.startDate, range.endDate, employee || row);
    const deductionRecords = getDeductionsForRange("production", range.startDate, range.endDate, employee || row);
    row.bonus_items = bonusRecords.map((record) => ({ label: record.deduction_label || "เงินเพิ่ม", amount: Number(record.amount || 0), note: record.note || "", start_date: record.start_date || "", end_date: record.end_date || record.start_date || "", created_by: record.created_by || "" }));
    row.deduction_items = deductionRecords.map((record) => ({ label: record.deduction_label || "รายการหัก", amount: Number(record.amount || 0), note: record.note || "", start_date: record.start_date || "", end_date: record.end_date || record.start_date || "", created_by: record.created_by || "" }));
    row.bonus_amount = sumDeductions(bonusRecords);
    row.deduction_amount = sumDeductions(deductionRecords);
    row.withholding_tax_amount = getProductionWithholdingTax(row.group_label, row.gross_amount);
    if (row.withholding_tax_amount > 0) row.deduction_items.push({ label: "หัก ณ ที่จ่าย 3%", amount: row.withholding_tax_amount, note: `คำนวณจากยอดค่าแรงของกลุ่ม ${row.group_label}`, start_date: range.startDate, end_date: range.endDate, created_by: "ระบบ" });
    row.net_amount = Math.max(0, row.gross_amount + row.bonus_amount - row.deduction_amount - row.withholding_tax_amount);
  });

  const timeEmployees = getTimeEmployees().filter((employee) => employee.status === "Active");
  const timeById = new Map(timeEmployees.map((employee) => [String(employee.id), employee]));
  const timeByCode = new Map(timeEmployees.map((employee) => [String(employee.emp_code), employee]));
  timeEmployees.forEach((employee) => {
    const type = getTimeEmployeeTypeOption(employee.employee_type);
    const employeeKey = `time:${employee.id || employee.emp_code}`;
    rows.set(employeeKey, {
      employee_key: employeeKey,
      employee_kind: "time",
      employee_id: employee.id,
      emp_code: employee.emp_code || "-",
      fullname: employee.fullname || "-",
      group_label: type.category === "special" ? "กลุ่มพิเศษ" : "กลุ่มปกติ",
      gross_amount: 0,
      bonus_amount: 0,
      deduction_amount: 0,
      withholding_tax_amount: 0,
      net_amount: 0,
      metric_weight: 0,
      metric_hours: 0
    });
  });
  const timeRecords = getTimeRecords().filter((record) => (record.record_date || "") >= range.startDate && (record.record_date || "") <= range.endDate);
  combineTimeRecordsByEmployeeDate(timeRecords).forEach((record) => {
    const employee = record.employee_id ? timeById.get(String(record.employee_id)) : timeByCode.get(String(record.emp_code || ""));
    if (!employee) return;
    const type = getTimeEmployeeTypeOption(employee.employee_type || record.employee_type);
    const employeeKey = `time:${employee.id || employee.emp_code}`;
    if (!rows.has(employeeKey)) {
      rows.set(employeeKey, {
        employee_key: employeeKey,
        employee_kind: "time",
        employee_id: employee.id,
        emp_code: employee.emp_code || "-",
        fullname: employee.fullname || "-",
        group_label: type.category === "office" ? "กลุ่ม Office" : type.category === "special" ? "กลุ่มพิเศษ" : "กลุ่มปกติ",
        gross_amount: 0,
        bonus_amount: 0,
        deduction_amount: 0,
        withholding_tax_amount: 0,
        net_amount: 0,
        metric_weight: 0,
        metric_hours: 0
      });
    }
    const receipt = getTimeReceiptRow({ ...record, daily_wage: Number(employee.daily_wage || record.daily_wage || type.dailyWage), ot_hourly_rate: Number(employee.ot_hourly_rate || record.ot_hourly_rate || TIME_OT_HOURLY_RATE) });
    rows.get(employeeKey).gross_amount += Number(receipt.totalAmount || 0);
    rows.get(employeeKey).metric_hours += Number(receipt.normalHours || 0) + Number(receipt.otHours || 0);
  });

  rows.forEach((row) => {
    if (row.employee_kind !== "time") return;
    const employee = row.employee_id ? timeById.get(String(row.employee_id)) : timeByCode.get(String(row.emp_code || ""));
    if (employee?.employee_type === "office_347") {
      row.gross_amount = 0;
      row.net_amount = 0;
      return;
    }
    const bonusRecords = getBonusesForRange("time", range.startDate, range.endDate, employee || row);
    const deductionRecords = getDeductionsForRange("time", range.startDate, range.endDate, employee || row);
    row.bonus_items = bonusRecords.map((record) => ({ label: record.deduction_label || "เงินเพิ่ม", amount: Number(record.amount || 0), note: record.note || "", start_date: record.start_date || "", end_date: record.end_date || record.start_date || "", created_by: record.created_by || "" }));
    row.deduction_items = deductionRecords.map((record) => ({ label: record.deduction_label || "รายการหัก", amount: Number(record.amount || 0), note: record.note || "", start_date: record.start_date || "", end_date: record.end_date || record.start_date || "", created_by: record.created_by || "" }));
    row.bonus_amount = sumDeductions(bonusRecords);
    row.deduction_amount = sumDeductions(deductionRecords);
    row.net_amount = Math.max(0, row.gross_amount + row.bonus_amount - row.deduction_amount);
  });

  return Array.from(rows.values()).sort((a, b) => `${a.group_label} ${a.emp_code}`.localeCompare(`${b.group_label} ${b.emp_code}`, "th", { numeric: true }));
}

async function getPfPaymentAllocations(startDate, endDate) {
  const query = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const response = await cloudApiRequest(`/api/accounting/payment-allocations?${query.toString()}`);
  const allocations = {};
  (response.data || []).forEach((row) => {
    allocations[row.employee_key] = { payment_method: row.payment_method, net_amount: Number(row.net_amount || 0) };
  });
  return allocations;
}

async function savePfPaymentAllocations(payload) {
  return cloudApiRequest("/api/accounting/payment-allocations", { method: "PUT", body: JSON.stringify(payload) });
}

async function exportPfPayments(format, method, payload) {
  return downloadReport(`${REPORT_API_BASE}/reports/accounting-payments-${format}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(getSession()?.token ? { "X-Session-Token": getSession().token } : {}) },
    body: JSON.stringify({ ...payload, payment_method: method })
  });
}

function normalizePfCostFruit(value) {
  const text = String(value || "").trim().toLocaleLowerCase("th-TH");
  if (text.includes("มังคุด") || text.includes("mangosteen")) return "mangosteen";
  if (text.includes("ทุเรียน") || text.includes("durian")) return "durian";
  if (text.includes("มะม่วง") || text.includes("mango")) return "mango";
  if (text.includes("มะพร้าว") || text.includes("coconut")) return "coconut";
  return text || "other";
}

async function getPfCostAnalysis(startDate, endDate) {
  const range = normalizeDateRange(startDate, endDate);
  await loadInboundData();
  const fruitNameById = new Map(inboundData.fruits.map((fruit) => [String(fruit.id), fruit.name || fruit.label || `ผลไม้ ${fruit.id}`]));
  const labels = new Map(productionFruitOptions.map((fruit) => [fruit.id, fruit.label]));
  const rows = new Map();
  const ensure = (fruitId, label = "ผลไม้อื่น") => {
    if (!rows.has(fruitId)) rows.set(fruitId, { fruit_id: fruitId, fruit_label: label, inbound_weight: 0, inbound_cost: 0, output_weight: 0, production_labor: 0, time_labor_allocated: 0, total_estimated_cost: 0, yield_percent: 0, raw_cost_per_output_kg: 0, total_cost_per_output_kg: 0 });
    return rows.get(fruitId);
  };

  inboundData.receipts.filter((receipt) => {
    const date = String(receipt.received_at || receipt.receipt_date || "").slice(0, 10);
    return date >= range.startDate && date <= range.endDate;
  }).forEach((receipt) => {
    const inboundLabel = fruitNameById.get(String(receipt.fruit_id)) || receipt.fruit_name || "ผลไม้อื่น";
    const fruitId = normalizePfCostFruit(inboundLabel);
    const row = ensure(fruitId, labels.get(fruitId) || inboundLabel);
    row.inbound_weight += Number(receipt.weight_kg || 0);
    row.inbound_cost += Number(receipt.total_amount || (Number(receipt.weight_kg || 0) * Number(receipt.price_per_kg || 0)) || 0);
  });

  getProductionRecords().filter((record) => {
    const date = getRecordDate(record);
    return date >= range.startDate && date <= range.endDate;
  }).forEach((record) => {
    const fruitId = productionFruitTypeForRecord(record);
    const row = ensure(fruitId, labels.get(fruitId) || fruitId);
    row.output_weight += getRecordTotalWeight(record);
    row.production_labor += Number(record.total_amount || record.grand_total || 0);
  });

  const payrollRows = getPfAccountingWeeklyRows(range.startDate, range.endDate);
  const timeLabor = payrollRows.filter((row) => row.employee_kind === "time").reduce((total, row) => total + Number(row.gross_amount || 0) + Number(row.bonus_amount || 0), 0);
  const totalOutput = Array.from(rows.values()).reduce((total, row) => total + row.output_weight, 0);
  rows.forEach((row) => {
    row.time_labor_allocated = totalOutput > 0 ? timeLabor * (row.output_weight / totalOutput) : 0;
    row.total_estimated_cost = row.inbound_cost + row.production_labor + row.time_labor_allocated;
    row.yield_percent = row.inbound_weight > 0 ? (row.output_weight / row.inbound_weight) * 100 : 0;
    row.raw_cost_per_output_kg = row.output_weight > 0 ? row.inbound_cost / row.output_weight : 0;
    row.total_cost_per_output_kg = row.output_weight > 0 ? row.total_estimated_cost / row.output_weight : 0;
  });
  const detail = Array.from(rows.values()).sort((a, b) => b.inbound_cost - a.inbound_cost || a.fruit_label.localeCompare(b.fruit_label, "th"));
  return {
    start_date: range.startDate,
    end_date: range.endDate,
    rows: detail,
    totals: {
      inbound_weight: detail.reduce((total, row) => total + row.inbound_weight, 0),
      inbound_cost: detail.reduce((total, row) => total + row.inbound_cost, 0),
      output_weight: detail.reduce((total, row) => total + row.output_weight, 0),
      production_labor: detail.reduce((total, row) => total + row.production_labor, 0),
      time_labor: timeLabor,
      total_estimated_cost: detail.reduce((total, row) => total + row.total_estimated_cost, 0)
    }
  };
}

async function getPfComparisonDashboard(startDate, endDate) {
  const range = normalizeDateRange(startDate, endDate);
  const cost = await getPfCostAnalysis(range.startDate, range.endDate);
  const productionEmployees = getEmployees().filter((employee) => employee.status === "Active");
  const timeEmployees = getTimeEmployees().filter((employee) => employee.status === "Active");
  const timeById = new Map(timeEmployees.map((employee) => [String(employee.id), employee]));
  const timeByCode = new Map(timeEmployees.map((employee) => [String(employee.emp_code), employee]));
  const hourGroups = new Map();
  combineTimeRecordsByEmployeeDate(getTimeRecords().filter((record) => (record.record_date || "") >= range.startDate && (record.record_date || "") <= range.endDate)).forEach((record) => {
    const employee = record.employee_id ? timeById.get(String(record.employee_id)) : timeByCode.get(String(record.emp_code || ""));
    const type = getTimeEmployeeTypeOption(employee?.employee_type || record.employee_type);
    const label = type.category === "special" ? "กลุ่มพิเศษ" : "กลุ่มปกติ";
    const receipt = getTimeReceiptRow(record);
    if (!hourGroups.has(label)) hourGroups.set(label, { label, regular: 0, overtime: 0, value: 0 });
    const item = hourGroups.get(label);
    item.regular += Number(receipt.normalHours || 0);
    item.overtime += Number(receipt.otHours || 0);
    item.value += Number(receipt.normalHours || 0) + Number(receipt.otHours || 0);
  });

  const employeeGroups = new Map();
  productionEmployees.forEach((employee) => {
    const label = getEmployeePayGroup(employee) || "ไม่ระบุกลุ่ม";
    const key = `production::${label}`;
    if (!employeeGroups.has(key)) employeeGroups.set(key, { kind: "production", kind_label: "พนักงานเหมา", label, value: 0 });
    employeeGroups.get(key).value += 1;
  });
  timeEmployees.forEach((employee) => {
    const type = getTimeEmployeeTypeOption(employee.employee_type);
    const label = type.category === "special" ? "กลุ่มพิเศษ" : "กลุ่มปกติ";
    const key = `time::${label}`;
    if (!employeeGroups.has(key)) employeeGroups.set(key, { kind: "time", kind_label: "พนักงานเวลา", label, value: 0 });
    employeeGroups.get(key).value += 1;
  });

  const payrollRows = getPfAccountingWeeklyRows(range.startDate, range.endDate);
  let stored = {};
  try { stored = await getPfPaymentAllocations(range.startDate, range.endDate); } catch (error) { console.warn("PF comparison uses live payroll because saved allocations are unavailable.", error); }
  const payments = payrollRows.map((row) => {
    const saved = stored[row.employee_key];
    const finalAmount = saved && typeof saved === "object" ? Number(saved.net_amount || 0) : Number(row.net_amount || 0);
    return { ...row, final_amount: finalAmount, adjustment: finalAmount - Number(row.net_amount || 0), payment_method: saved?.payment_method || "cash" };
  });
  const paymentGroups = ["production", "time"].map((kind) => {
    const items = payments.filter((row) => row.employee_kind === kind);
    return { label: kind === "production" ? "พนักงานเหมา" : "พนักงานเวลา", value: items.reduce((sum, row) => sum + row.final_amount, 0), base: items.reduce((sum, row) => sum + Number(row.net_amount || 0), 0), adjustment: items.reduce((sum, row) => sum + row.adjustment, 0) };
  });
  const totalHours = Array.from(hourGroups.values()).reduce((sum, item) => sum + item.value, 0);
  const totalPayment = payments.reduce((sum, row) => sum + row.final_amount, 0);
  return {
    start_date: range.startDate,
    end_date: range.endDate,
    totals: { hours: totalHours, weight: Number(cost.totals.output_weight || 0), employees: productionEmployees.length + timeEmployees.length, payment: totalPayment },
    hours: Array.from(hourGroups.values()),
    weights: cost.rows.map((row) => ({ label: row.fruit_label, value: Number(row.output_weight || 0), inbound: Number(row.inbound_weight || 0), output: Number(row.output_weight || 0) })),
    employees: Array.from(employeeGroups.values()),
    payments: paymentGroups
  };
}

let stockLedgerController = null;
let stockLedgerMountedRoute = "";
let stockLedgerMountKey = "";

let pfAccountingInitialView = "allocation";

function renderApp(user, route) {
  if (route !== "secret-room") window.SecretRoom?.stop?.();
  window.SecretRoom?.startNotifications?.();
  startIssueNotifications();
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
      if (["dashboard", "employees", "production-employees", "time-employees", "production", "time-report", "compare-data", "summary-person", "summary-all", "summary-main", "settings", "accounting-control"].includes(currentRoute)) {
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
      if (["compare-data", "summary-person", "summary-all", "summary-main", "summary-group-report", "summary-time-overview", "accounting-control"].includes(currentRoute)) {
        render();
      }
    }).catch((error) => {
      console.warn("Deduction cloud bootstrap failed.", error);
    });
  }

  if (route === "compare-data") {
    const sidebarScroll = app.querySelector(".acr-stable-rail")?.scrollTop || 0;
    const deductionModule = modules.find((item) => item.id === "compare-data");
    app.innerHTML = `<main class="acr-shell" data-pf-deductions>${window.AccountingControl.sidebar({ user, deductionTab: deductionActiveTab, accounting: canOpen(user, "accounting-control") })}<div class="acr-workspace">${renderDeductionEntry(user, deductionModule)}</div></main>`;
    app.querySelector(".acr-stable-rail").scrollTop = sidebarScroll;
    window.AccountingControl.bindSidebar(app);
    app.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { pfAccountingInitialView = button.dataset.view; location.hash = "#/accounting-control"; }));
    app.querySelector("[data-ac-exit]")?.addEventListener("click", () => { location.hash = "#/dashboard"; });
    bindDeductionEvents(user);
    return;
  }

  if (route === "accounting-control" && window.AccountingControl) {
    // Background bootstrap tasks can call render() several seconds after this
    // workspace opens. Keep the mounted controller so its selected view,
    // filters and scroll position are not reset to their initial values.
    if (app.querySelector(".acr-shell:not([data-pf-deductions])")) return;
    window.AccountingControl.render(app, user, {
      onExit: () => { location.hash = "#/dashboard"; },
      onAudit: (action, description) => addAuditLog(user, action, description),
      initialView: pfAccountingInitialView,
      stockRequest: (path, settings = {}) => cloudApiRequest(path, { ...settings, ...(settings.body ? { body: JSON.stringify(settings.body) } : {}) }),
      onOpenDeductions: canOpen(user, "compare-data") ? (tab) => { deductionActiveTab = tab || "production"; editingDeductionId = null; location.hash = "#/compare-data"; } : null,
      getWeeklyRows: getPfAccountingWeeklyRows,
      loadAllocations: getPfPaymentAllocations,
      saveAllocations: savePfPaymentAllocations,
      exportPayments: exportPfPayments,
      getCostAnalysis: getPfCostAnalysis,
      getComparisonDashboard: getPfComparisonDashboard
    });
    return;
  }

  // Keep the cold-room prototype mounted across background cloud renders.
  // Leaving this route still unmounts its explicitly temporary sample data.
  if (route === "stock-cold-room" && app.querySelector("[data-stock-cold-workspace]")?.dataset.stockWrite === String(canWriteStock(user))) return;
  if (stockCategoryForRoute(route) && stockLedgerController && stockLedgerMountedRoute === route && app.querySelector("[data-stock-ledger-workspace]")) return;
  const moduleItem = modules.find((item) => item.id === route) || modules[0];
  const visibleModules = visibleNavModulesForUser(user);
  const navOrder = ["dashboard", "production", "stock", "time-report", "compare-data", "summary-person", "summary-all", "reports", "accounting-control", "secret-room", "record-report", "settings"];
  visibleModules.sort((a, b) => navOrder.indexOf(a.id) - navOrder.indexOf(b.id));
  const shouldShowWelcome = sessionStorage.getItem("apws_contest_welcome_user") === user.username;
  const secretUnreadCount = Number(window.SecretRoom?.getUnreadCount?.() || 0);
  const secretUnreadLabel = secretUnreadCount > 99 ? "99+" : String(secretUnreadCount);
  const issueUnreadCount = canReceiveIssueNotifications(user) ? issueNotificationUnreadCount : 0;
  const issueUnreadLabel = issueNotificationLabel(issueUnreadCount);

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
              <b class="mobile-notification-badge" data-secret-unread-badge ${secretUnreadCount ? "" : "hidden"}>${escapeHtml(secretUnreadLabel)}</b>
            </button>
            <div>
              <p class="eyebrow">โครงงานระบบชั่งน้ำหนักผลผลิตอัตโนมัติ</p>
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
            <button class="btn btn-small btn-outline" id="manualCloudRefresh" type="button" title="ดึงข้อมูลล่าสุดจาก Cloud แบบเต็ม">รีเฟรช Cloud</button>
            <div class="user-meta">
              <strong>${escapeHtml(user.fullname)}</strong>
              <span>${escapeHtml(user.role_label || user.role)}</span>
            </div>
          </div>
        </div>
      </header>
      <section class="content">
        <aside class="sidebar">
          <button class="sidebar-brand" data-route="dashboard" type="button" aria-label="กลับหน้า Home">
            
            <span>ระบบชั่งน้ำหนักผลผลิตอัตโนมัติ</span>
          </button>
          <nav class="nav-stack">
            ${visibleModules
              .map(
                (item) => `
                  <button class="nav-button ${item.id === route || (item.id === "stock" && isStockRoute(route)) ? "active" : ""} ${item.locked ? "locked" : ""} ${(item.id === "secret-room" && secretUnreadCount) || (item.id === "record-report" && issueUnreadCount) ? "has-notification" : ""}" data-route="${item.id}" type="button">
                    <span class="nav-label">
                      <span class="nav-icon">${escapeHtml(item.icon || "•")}</span>
                      ${escapeHtml(item.label)}
                    </span>
                    ${item.locked ? `<span class="nav-lock">ล็อก</span>` : ""}
                    ${item.id === "secret-room" ? `<span class="nav-notification-badge" data-secret-unread-badge ${secretUnreadCount ? "" : "hidden"}>${escapeHtml(secretUnreadLabel)}</span>` : ""}
                    ${item.id === "record-report" && canReceiveIssueNotifications(user) ? `<span class="nav-notification-badge" data-issue-unread-badge ${issueUnreadCount ? "" : "hidden"}>${escapeHtml(issueUnreadLabel)}</span>` : ""}
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
    sessionStorage.removeItem("apws_contest_welcome_user");
    window.setTimeout(() => {
      const toast = document.querySelector(".welcome-toast");
      toast?.classList.add("welcome-toast-hide");
      window.setTimeout(() => toast?.remove(), 280);
    }, 3200);
  }

  bindAppEvents(user, moduleItem);
  window.SecretRoom?.startNotifications?.();
  startIssueNotifications();
}
function isStockRoute(route) {
  return ["stock", "inbound", "inbound-fruits", "inbound-history", "stock-cold-room", "stock-packaging", "stock-supplies", "stock-office"].includes(route);
}

function stockCategoryForRoute(route) {
  return ({"stock-packaging": "packaging", "stock-supplies": "supplies", "stock-office": "office"})[route] || "";
}

function renderStockNavigation(active = "home") {
  return `<nav class="stock-section-nav" aria-label="หมวด Stock">
    <button type="button" data-route="stock" class="${active === "home" ? "is-active" : ""}" ${active === "home" ? 'aria-current="page"' : ""}>Stock ทั้งหมด</button>
    <button type="button" data-route="inbound" class="${active === "general" ? "is-active" : ""}" ${active === "general" ? 'aria-current="page"' : ""}>Stock ผลไม้</button>
    <button type="button" data-route="stock-cold-room" class="${active === "cold" ? "is-active" : ""}" ${active === "cold" ? 'aria-current="page"' : ""}>Stock ห้องเย็น</button>
    ${[["packaging", "บรรจุภัณฑ์"], ["supplies", "เบ็ดเตล็ด"], ["office", "สำนักงาน"]].map(([category, label]) => `<button type="button" data-route="stock-${category}" class="${active === category ? "is-active" : ""}" ${active === category ? 'aria-current="page"' : ""}>Stock ${label}</button>`).join("")}
  </nav>`;
}

function renderStockHub() {
  return `${renderStockNavigation()}<section class="stock-hub">
    <p class="eyebrow">PF STOCK MANAGEMENT</p><h2>Stock</h2>
    <p>เลือกส่วนงานที่ต้องการจัดการ แยกผลไม้ ห้องเย็น บรรจุภัณฑ์ ของใช้โรงงาน และวัสดุสำนักงาน</p>
    <div class="stock-choice-grid">
      <button class="stock-choice" data-route="inbound" type="button">
        <span class="stock-choice-icon" aria-hidden="true">⇩</span><span class="stock-choice-status">ใช้งานข้อมูลรับเข้าเดิม</span>
        <strong>Stock ผลไม้</strong><p>รับเข้าผลไม้จากผู้ส่ง บันทึกน้ำหนัก ราคาซื้อจริง และต้นทุนของแต่ละรายการ</p>
        <ul><li>บันทึกรับเข้าผลไม้</li><li>จัดการชนิดผลไม้และราคาแนะนำ</li><li>ประวัติรับเข้า พิมพ์ และส่งออก Excel / PDF</li><li>จัดการข้อมูลสินค้าและผู้ส่ง</li></ul>
        <span class="stock-choice-cta">เปิด Stock ผลไม้ →</span>
      </button>
      <button class="stock-choice is-cold" data-route="stock-cold-room" type="button">
        <span class="stock-choice-icon" aria-hidden="true">❄</span><span class="stock-choice-status">รับเข้า · ย้าย · จ่ายออก · ข้อมูลจริง</span>
        <strong>Stock ห้องเย็น</strong><p>ตรวจรับสินค้าที่แปรรูปแล้วเข้าห้องเย็น 2 ห้อง จัดเก็บเป็นพาเลตและกล่องรอส่งลูกค้า</p>
        <ul><li>ผังห้องเย็น 2D มองจากด้านบน</li><li>กล่องละ 20 กก. ปรับจำนวนกล่องต่อพาเลตได้</li><li>แยกสีสินค้าของเราและสินค้าฝากแช่ พร้อมชื่อเจ้าของ</li><li>รับเข้า ย้ายตำแหน่ง จ่ายออก และดูยอดสรุป</li></ul>
        <span class="stock-choice-cta">เปิด Stock ห้องเย็น →</span>
      </button>
      ${[
        {id: "packaging", label: "บรรจุภัณฑ์", icon: "▧", description: "กล่อง ถุง และบรรจุภัณฑ์ แยกตามชนิด ขนาด และหน่วยนับ", details: ["รับเข้าพร้อมราคาต่อหน่วยและเลขใบส่งของ", "เบิกใช้พร้อมผู้รับและหมายเหตุ", "ยอดคงเหลือและประวัติรับเข้า–เบิกออก"]},
        {id: "supplies", label: "เบ็ดเตล็ด", icon: "⚒", description: "ของใช้ในโรงงาน เช่น ถุงมือยาง ถุงมือผ้า น้ำยา และสารเคมี", details: ["แยกรายการ ขนาด/รุ่น และหน่วยนับ", "บันทึกรับเข้าและเบิกของใช้โรงงาน", "ตรวจยอดคงเหลือและประวัติย้อนหลัง"]},
        {id: "office", label: "สำนักงาน", icon: "▤", description: "วัสดุ Office เช่น หมึก กระดาษ และอุปกรณ์สำนักงาน", details: ["รับเข้าพร้อมราคาและเอกสารอ้างอิง", "เบิกจ่ายระบุผู้รับหรือแผนก", "ยอดคงเหลือและประวัติการเคลื่อนไหว"]}
      ].map(category => `<button class="stock-choice is-${category.id}" data-route="stock-${category.id}" type="button"><span class="stock-choice-icon" aria-hidden="true">${category.icon}</span><span class="stock-choice-status">รับเข้า / เบิกออก / คงเหลือ</span><strong>Stock ${category.label}</strong><p>${category.description}</p><ul>${category.details.map(detail => `<li>${detail}</li>`).join("")}</ul><span class="stock-choice-cta">เปิด Stock ${category.label} →</span></button>`).join("")}
    </div>
    <div class="stock-hub-note">C4 ขึ้นไปเข้าใช้งานและบันทึกรับเข้า/เบิกออกได้ · บัญชีและค่าแรง อยู่ในเมนูเดิมสำหรับเรื่องเงิน · Stock ผลไม้ยังเป็นข้อมูลรับซื้อ ส่วน Stock ห้องเย็นยังเป็นโหมดทดลอง</div>
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
  if (moduleItem.id === "stock-cold-room") return `${renderStockNavigation("cold")}<section class="stock-cold-workspace" data-stock-cold-workspace data-stock-write="${canWriteStock(user)}"><iframe src="stock-cold-room.html?v=20261103-sales${canWriteStock(user) ? "" : "&readonly=1"}" title="Stock ห้องเย็น 2D — ข้อมูลจริง" class="stock-cold-frame"></iframe></section>`;
  if (stockCategoryForRoute(moduleItem.id)) return `${renderStockNavigation(stockCategoryForRoute(moduleItem.id))}<section data-stock-ledger-workspace aria-label="${escapeHtml(moduleItem.label)}"></section>`;
  if (moduleItem.id === "inbound") return `<div class="stock-ledger sl-fruit">${renderInboundEntry(user)}</div>`;
  if (moduleItem.id === "inbound-fruits") return `<div class="stock-ledger sl-fruit">${renderInboundFruitManagement(user)}</div>`;
  if (moduleItem.id === "inbound-history") return `<div class="stock-ledger sl-fruit">${renderInboundHistory(user)}</div>`;
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

function bindAppEvents(user, moduleItem) {
  const stockCategory = stockCategoryForRoute(moduleItem.id);
  if (stockCategory && !window.StockLedger) {
    const stockRoot = document.querySelector("[data-stock-ledger-workspace]");
    if (stockRoot) stockRoot.innerHTML = '<div class="alert alert-error" role="alert">โหลดหน้าสต็อกไม่ครบ กรุณารีเฟรชหน้าเว็บเพื่อลองใหม่</div>';
  }
  if (stockCategory && window.StockLedger) {
    stockLedgerController?.destroy();
    stockLedgerMountedRoute = moduleItem.id;
    stockLedgerMountKey = `${user.username || ""}:${canWriteStock(user)}`;
    stockLedgerController = window.StockLedger.mount(document.querySelector("[data-stock-ledger-workspace]"), {
      category: stockCategory,
      canWrite: canWriteStock(user),
      request: (path, options = {}) => cloudApiRequest(path, {timeoutMs: 20000, ...options, ...(options.body ? {body: JSON.stringify(options.body)} : {})})
    });
  }
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => {
      document.body.classList.remove("drawer-open");
      const nextRoute = button.dataset.route;
      if (button.dataset.dashboardFruit) {
        setSelectedProductionFruit(button.dataset.dashboardFruit);
      }
      if (nextRoute === "summary-main") {
        summaryDate = localDateInputValue();
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
  if (moduleItem.id === "pf-desktop-app") {
    document.querySelector("#desktopImportFile")?.addEventListener("change", async (event) => {
      if (!canImportDesktopWeighing(getSession()?.user)) {
        event.currentTarget.value = "";
        desktopImportPreview = null;
        desktopImportMessage = "การนำเข้าข้อมูลชั่งใช้สิทธิ์ C6 ขึ้นไป บัญชี C4–C5 ดูและส่งออกข้อมูลหลักได้";
        desktopImportMessageType = "error";
        render();
        return;
      }
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        if (file.size > 10_000_000) throw new Error("ไฟล์ใหญ่เกิน 10 MB");
        const payload = JSON.parse(await file.text());
        desktopImportPreview = prepareDesktopWeighingImport(payload);
        desktopImportPreview.fileName = file.name;
        desktopImportMessage = desktopImportPreview.rejected.length
          ? `ตรวจไฟล์แล้ว พบ ${desktopImportPreview.rejected.length.toLocaleString("th-TH")} รายการที่ยังไม่นำเข้า`
          : "ตรวจไฟล์ผ่าน พร้อมยืนยันนำเข้า";
        desktopImportMessageType = desktopImportPreview.rejected.length ? "error" : "success";
      } catch (error) {
        desktopImportPreview = null;
        desktopImportMessage = `อ่านไฟล์ไม่ได้: ${error.message}`;
        desktopImportMessageType = "error";
      }
      render();
    });
    document.querySelector("#desktopImportConfirm")?.addEventListener("click", () => submitDesktopWeighingImport(user));
    document.querySelector("#desktopImportOverlapConfirm")?.addEventListener("click", () => submitDesktopWeighingImport(user, true));
    document.querySelector("#desktopImportCancel")?.addEventListener("click", () => {
      desktopImportPreview = null;
      desktopImportMessage = "ยกเลิกไฟล์นี้แล้ว ยังไม่ได้รับเข้าคิว";
      desktopImportMessageType = "success";
      render();
    });
    document.querySelector("#desktopExportCatalog")?.addEventListener("click", () => {
      const payload = exportDesktopCatalogFile();
      desktopImportMessage = `ดาวน์โหลดข้อมูลหลักแล้ว ${payload.fruits.length} ผลไม้ · ${payload.weighing_types.length} ประเภทน้ำหนัก`;
      desktopImportMessageType = "success";
      render();
    });
    document.querySelector("#desktopExportEmployees")?.addEventListener("click", async () => {
      try {
        const count = await exportScaleEmployeeFile("production");
        desktopImportMessage = `ดาวน์โหลดรหัสพนักงานแล้ว ${count.toLocaleString("th-TH")} คน`;
        desktopImportMessageType = "success";
      } catch (error) {
        desktopImportMessage = error.message;
        desktopImportMessageType = "error";
      }
      render();
    });
    return;
  }
  document.querySelector("#manualCloudRefresh")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = "กำลังรีเฟรช...";
    await refreshLiveStateFromCloud({ renderWhenIdle: false, force: true });
    button.textContent = oldText || "รีเฟรช Cloud";
    button.disabled = false;
    render();
  });
  document.querySelector("#logoutButton")?.addEventListener("click", () => {
    auditLogUnlocked = false;
    auditLogMessage = "";
    resetBackupSecurityState();
    issueReports = [];
    issueReportsLoaded = false;
    issueReportSelectedId = null;
    issueReportAttachment = null;
    stopHomeStorageUsageRefresh();
    window.SecretRoom?.stopNotifications?.();
    stopIssueNotifications();
    clearSession();
    onlineUserCount = 0;
    updateOnlineUserBadges();
    location.hash = "#/login";
  });

  if (moduleItem.id === "production") bindProductionManagementEvents(user);
  if (["inbound", "inbound-fruits", "inbound-history"].includes(moduleItem.id)) bindInboundEvents(user, moduleItem.id);
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
  if (moduleItem.id === "settings-pile-summary") bindSettingsPileSummaryEvents(user);
  if (moduleItem.id === "account-management") bindAccountManagementEvents(user);
  if (moduleItem.id === "backup") bindBackupEvents(user);
  if (moduleItem.id === "record-report") {
    markIssueNotificationsRead();
    bindIssueReportEvents(user);
  }
  if (moduleItem.id === "dashboard") bindHomeStorageUsageEvents();
  if (moduleItem.id === "pile-management") bindPileManagementEvents(user);
  if (moduleItem.id === "audit-log") bindAuditLogPasswordEvents();
  if (moduleItem.id === "secret-room") window.SecretRoom?.bind?.();
}

function renderLegacyDashboard(moduleItem) {
  const records = getProductionRecords();
  const today = localDateInputValue();
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
          <p class="eyebrow">โครงงานระบบชั่งน้ำหนักผลผลิตอัตโนมัติ</p>
          <h2>ระบบบันทึกผลผลิตและค่าแรงประจำวัน</h2>
          <p>ศูนย์ควบคุมงานบันทึกผลผลิต ตรวจสอบข้อมูลพนักงาน และดูภาพรวมผลผลิตของโรงงาน</p>
          <div class="factory-hero-actions">
            <button class="btn btn-primary" type="button" data-route="production">บันทึกผลผลิต</button>
            <button class="btn btn-outline" type="button" data-route="summary-all">ดูสรุปข้อมูลทั้งหมด</button>
          </div>
        </div>
        <div class="factory-hero-brand">
          
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
          <p class="eyebrow">โครงงานระบบชั่งน้ำหนักผลผลิตอัตโนมัติ</p>
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
            <strong>APWS Web</strong>
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
              <span><i class="legend-durian"></i>น้ำหนักทุเรียน</span>
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
                <th>น้ำหนักทุเรียน</th>
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
    summaryDate = event.target.value || localDateInputValue();
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
  const startDate = summaryReportExportStartDate || localDateInputValue();
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
    summaryReportExportStartDate = String(formData.get("start_date") || localDateInputValue());
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

function isDailyOtOverrideTab() {
  return deductionActiveTab === "daily-ot";
}

function getActiveAdjustmentEmployeeKind() {
  if (isDailyOtOverrideTab()) return "time";
  if (isAttendanceBonusTab()) return deductionBonusEmployeeKind;
  if (isDeductionApprovalTab()) return deductionApprovalEmployeeKind;
  return normalizeDeductionKind(deductionActiveTab);
}

function getCurrentDeductionContext() {
  const selectedDate = deductionStartDate || localDateInputValue();
  const employeeKind = getActiveAdjustmentEmployeeKind();
  const bonusMode = isAttendanceBonusTab();
  const otOverrideMode = isDailyOtOverrideTab();
  const range = otOverrideMode
    ? normalizeDateRange(selectedDate, deductionEndDate || selectedDate)
    : { startDate: selectedDate, endDate: selectedDate };
  deductionStartDate = range.startDate;
  deductionEndDate = range.endDate;
  const employees = getDeductionEmployeeOptions(employeeKind);
  const selectedEmployeeId = employees.some((employee) => String(employee.id) === String(deductionEmployeeId))
    ? deductionEmployeeId
    : employees[0]?.id || "";
  deductionEmployeeId = selectedEmployeeId ? String(selectedEmployeeId) : "";
  const selectedEmployee = employees.find((employee) => String(employee.id) === String(selectedEmployeeId)) || null;
  const records = (otOverrideMode
    ? getDeductionRecords().filter((record) => (
      isDailyOtOverrideRecord(record) && record.employee_kind === "time" &&
      deductionRangesOverlap(record, range.startDate, range.endDate) &&
      (!selectedEmployee || employeeReferenceMatches(record, selectedEmployee))
    ))
    : bonusMode
    ? getBonusesForRange(employeeKind, range.startDate, range.endDate)
    : getDeductionRecords().filter((record) => (
      !isAttendanceBonusRecord(record) &&
      record.employee_kind === employeeKind &&
      deductionRangesOverlap(record, range.startDate, range.endDate)
    )))
    .sort((a, b) => `${a.start_date} ${a.emp_code} ${a.deduction_label}`.localeCompare(`${b.start_date} ${b.emp_code} ${b.deduction_label}`, "th", { numeric: true }));
  const editingRecord = records.find((record) => Number(record.id) === Number(editingDeductionId)) || null;
  return { range, employees, selectedEmployee, records, editingRecord, employeeKind, bonusMode, otOverrideMode };
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
  const appliedTotal = isAttendanceBonusRecord(record) || isDailyOtOverrideRecord(record) ? 0 : getAppliedTotalForDeduction(record.id);
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

function getApprovedDeductionRows(kind) {
  const normalizedKind = normalizeDeductionKind(kind);
  const deductionMap = new Map(getDeductionRecords().map((record) => [Number(record.id), record]));
  return deductionApplications
    .filter((application) => application.status === "Applied" && application.employee_kind === normalizedKind)
    .map((application) => {
      const source = deductionMap.get(Number(application.deduction_id));
      return {
        ...application,
        deduction_label: source?.deduction_label || getDeductionTypeLabel(source?.deduction_type || "advance"),
        source_amount: Number(source?.amount || 0),
        source_start_date: source?.start_date || "",
        remaining_amount: source
          ? Math.max(0, Number(source.amount || 0) - getAppliedTotalForDeduction(source.id))
          : 0,
        note: application.note || source?.note || ""
      };
    })
    .sort((a, b) =>
      `${b.applied_date} ${b.emp_code} ${b.id}`.localeCompare(`${a.applied_date} ${a.emp_code} ${a.id}`, "th", { numeric: true })
    );
}

function renderDeductionApproval(user, moduleItem) {
  const rows = getPendingDeductionRows(deductionApprovalEmployeeKind);
  const approvedRows = getApprovedDeductionRows(deductionApprovalEmployeeKind);
  const showingApproved = deductionApprovalView === "approved";
  const visibleEmployeeCount = new Set((showingApproved ? approvedRows : rows).map((row) => `${row.employee_kind}-${row.employee_id || row.emp_code}`)).size;
  const remainingTotal = rows.reduce((sum, row) => sum + row.remaining_amount, 0);
  const approvedTotal = approvedRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const kindLabel = deductionApprovalEmployeeKind === "time" ? "พนักงานรายวัน" : "พนักงานเหมา";
  return `
    <section class="summary-page deduction-page deduction-approval-page deduction-minimal deduction-refined">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>

        </div>

      </div>

      ${deductionMessage ? `<div class="alert ${deductionMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(deductionMessage)}</div>` : ""}
      <section class="panel deduction-approval-toolbar">
        <div class="deduction-kind-switch" role="group" aria-label="ประเภทพนักงานที่อนุมัติหักเงิน">
          <span>ประเภทพนักงาน</span>
          <button class="${deductionApprovalEmployeeKind === "production" ? "active" : ""}" type="button" data-approval-employee-kind="production">พนักงานเหมา</button>
          <button class="${deductionApprovalEmployeeKind === "time" ? "active" : ""}" type="button" data-approval-employee-kind="time">พนักงานรายวัน</button>
        </div>
        <div class="deduction-kind-switch deduction-approval-view-switch" role="group" aria-label="มุมมองรายการอนุมัติหักเงิน">
          <span>เมนู</span>
          <button class="${!showingApproved ? "active" : ""}" type="button" data-approval-view="pending">รออนุมัติ</button>
          <button class="${showingApproved ? "active" : ""}" type="button" data-approval-view="approved">รายการอนุมัติแล้ว</button>
        </div>
        <label class="field deduction-approval-date">
          <span>วันที่นำยอดไปหัก</span>
          <input id="deductionApprovalDate" type="date" value="${escapeHtml(deductionStartDate)}" required />
        </label>
      </section>
      <div class="summary-metrics deduction-metrics">
        <div class="metric-card metric-blue"><span>${showingApproved ? "รายการอนุมัติแล้ว" : "รายการรอหัก"}</span><strong>${(showingApproved ? approvedRows.length : rows.length).toLocaleString("th-TH")} รายการ</strong><small>${kindLabel}</small></div>
        <div class="metric-card metric-green"><span>จำนวนพนักงาน</span><strong>${visibleEmployeeCount.toLocaleString("th-TH")} คน</strong><small>${showingApproved ? "ที่ถูกอนุมัติหักแล้ว" : "ที่ยังมียอดคงเหลือ"}</small></div>
        <div class="metric-card metric-orange"><span>${showingApproved ? "ยอดที่อนุมัติหักแล้ว" : "ยอดคงเหลือทั้งหมด"}</span><strong>${money(showingApproved ? approvedTotal : remainingTotal)}</strong><small>${showingApproved ? "รวมจากประวัติที่ยืนยันแล้ว" : "ยังไม่กระทบยอดสุทธิจนกว่าจะยืนยัน"}</small></div>
      </div>
      ${showingApproved ? `
        <section class="table-card deduction-approval-table-card">
          <div class="table-heading deduction-table-heading">
            <div><strong>รายการอนุมัติแล้ว</strong><span>${kindLabel} แสดงตามวันที่อนุมัติล่าสุดก่อน</span></div>
            <span class="deduction-table-total">รวม ${money(approvedTotal)}</span>
          </div>
          <div class="table-scroll">
            <table>
              <thead><tr><th>วันที่อนุมัติ</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>รายการ</th><th>ยอดตั้งต้น</th><th>ยอดที่อนุมัติหัก</th><th>คงเหลือ</th><th>ผู้อนุมัติ</th><th>จัดการ</th></tr></thead>
              <tbody>
                ${approvedRows.length ? approvedRows.map((row) => `
                  <tr>
                    <td>${editingApprovedDeductionApplicationId === row.id ? `<input class="deduction-approved-edit-input" form="approvedDeductionEditForm-${row.id}" name="applied_date" type="date" value="${escapeHtml(row.applied_date)}" required />` : `<span class="deduction-date-cell">${escapeHtml(row.applied_date)}</span>`}</td>
                    <td><strong>${escapeHtml(row.emp_code)}</strong></td>
                    <td>${escapeHtml(row.employee_name)}</td>
                    <td>${escapeHtml(row.deduction_label)}</td>
                    <td>${money(row.source_amount || 0)}</td>
                    <td>${editingApprovedDeductionApplicationId === row.id ? `<input class="deduction-approved-edit-input" form="approvedDeductionEditForm-${row.id}" name="amount" type="number" min="0.01" step="0.01" value="${Number(row.amount || 0)}" required />` : `<strong>${money(row.amount || 0)}</strong>`}</td>
                    <td>${money(row.remaining_amount || 0)}</td>
                    <td>${escapeHtml(row.created_by || "-")}</td>
                    <td>
                      ${editingApprovedDeductionApplicationId === row.id ? `
                        <form class="table-actions" id="approvedDeductionEditForm-${row.id}" data-approved-deduction-edit="${row.id}">
                          <button class="btn btn-small btn-primary" type="submit">บันทึก</button>
                          <button class="btn btn-small btn-outline" type="button" data-cancel-approved-deduction-edit>ยกเลิก</button>
                        </form>
                      ` : `
                        <div class="table-actions">
                          ${canEditApprovedDeductionApplication(user, row)
                            ? `<button class="btn btn-small btn-outline" type="button" data-edit-approved-deduction="${row.id}">แก้ไข</button>`
                            : ""}
                          ${canDeleteApprovedDeductionApplication(user, row)
                            ? `<button class="btn btn-small btn-danger" type="button" data-delete-approved-deduction="${row.id}">ลบ</button>`
                            : ""}
                          ${canEditApprovedDeductionApplication(user, row) || canDeleteApprovedDeductionApplication(user, row)
                            ? ""
                            : `<span class="badge badge-muted">ไม่มีสิทธิ์</span>`}
                        </div>
                      `}
                    </td>
                  </tr>
                  ${editingApprovedDeductionApplicationId === row.id ? `
                    <tr class="deduction-approved-note-row">
                      <td colspan="9">
                        <label class="field">
                          <span>หมายเหตุ</span>
                          <input form="approvedDeductionEditForm-${row.id}" name="note" value="${escapeHtml(row.note || "")}" placeholder="เหตุผลหรือรายละเอียดการแก้ไข" />
                        </label>
                      </td>
                    </tr>
                  ` : ""}`).join("") : `<tr><td colspan="9" class="empty-cell">ยังไม่มีรายการอนุมัติแล้วสำหรับ${kindLabel}</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      ` : `
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
      </form>`}
    </section>`;
}

const deductionEntryDrafts = {};

function renderDeductionWorkspace() {
  const date = deductionStartDate || localDateInputValue();
  const columns = ["production", "time"].map((kind) => {
    const title = kind === "production" ? "พนักงานเหมา" : "พนักงานรายวัน";
    const employees = getDeductionEmployeeOptions(kind);
    const records = getDeductionRecords().filter((row) => row.employee_kind === kind && !isAttendanceBonusRecord(row) && !isDailyOtOverrideRecord(row) && deductionRangesOverlap(row, date, date));
    const editing = records.find((row) => Number(row.id) === Number(editingDeductionId));
    const draft = deductionEntryDrafts[kind];
    const values = draft && String(draft.id || "") === String(editing?.id || "") ? draft : (editing || {});
    return `<section class="deduction-entry-column" aria-label="${title}">
      <header><div><span class="deduction-entry-kicker">${kind === "production" ? "PRODUCTION" : "DAILY"}</span><h3>${title}</h3></div><span class="deduction-entry-count">${records.length} รายการ</span></header>
      <form data-deduction-entry-form="${kind}" class="deduction-entry-fields">
        <input type="hidden" name="id" value="${editing?.id || ""}"><input type="hidden" name="employee_kind" value="${kind}">
        <label class="field deduction-entry-wide"><span>พนักงาน</span><select name="employee_id" required ${employees.length ? "" : "disabled"}>${renderDeductionEmployeeOptions(employees, values.employee_id || "")}</select></label>
        <label class="field"><span>วันที่บันทึก</span><input type="date" name="start_date" value="${escapeHtml(values.start_date || date)}" required></label>
        <label class="field"><span>รายการหัก</span><select name="deduction_type" required>${renderDeductionTypeOptions(values.deduction_type || "advance")}</select></label>
        <label class="field"><span>ยอดตั้งต้น (บาท)</span><input type="number" name="amount" min="0.01" step="0.01" value="${escapeHtml(values.amount ?? "")}" placeholder="0.00" required></label>
        <label class="field"><span>รายละเอียด / หมายเหตุ</span><input name="note" value="${escapeHtml(values.note || "")}" placeholder="ระบุเพิ่มเติม หรือกลับมาแก้ภายหลัง"></label>
        <div class="deduction-entry-wide deduction-entry-actions">${editing ? `<button class="btn btn-outline" type="button" data-cancel-deduction-edit="${kind}">ยกเลิกแก้ไข</button>` : ""}<button class="btn btn-primary" type="submit" ${employees.length ? "" : "disabled"}>${editing ? "บันทึกการแก้ไข" : "บันทึกรายการหัก"}</button></div>
      </form>
      <div class="deduction-entry-ledger"><div class="deduction-entry-ledger-heading"><strong>รายการวันที่เลือก</strong><span>${money(sumDeductions(records))}</span></div>
      ${records.length ? records.map((row) => `<article class="deduction-entry-record"><div><strong>${escapeHtml(row.emp_code)} · ${escapeHtml(row.employee_name)}</strong><span>${escapeHtml(row.deduction_label || getDeductionTypeLabel(row.deduction_type))}</span>${row.note ? `<small>${escapeHtml(row.note)}</small>` : ""}</div><div class="deduction-entry-record-end"><strong>${money(row.amount)}</strong><div><button class="deduction-entry-link" type="button" data-edit-deduction="${row.id}">แก้ไข</button><button class="deduction-entry-link" type="button" data-delete-deduction="${row.id}">ลบ</button></div></div></article>`).join("") : '<p class="deduction-entry-empty">ยังไม่มีรายการในวันที่เลือก</p>'}
      </div>
    </section>`;
  });
  return `<section class="summary-page deduction-page deduction-minimal"><div class="summary-header"><div><h2>บันทึกหักเงิน / เบี้ยขยัน</h2></div></div>

    ${deductionMessage ? `<div class="alert ${deductionMessageType === "error" ? "alert-error" : "alert-success"}" role="status">${escapeHtml(deductionMessage)}</div>` : ""}
    <div class="deduction-entry-toolbar"><form id="deductionFilterForm"><label class="field"><span>ดูรายการตามวันที่</span><input type="date" name="start_date" value="${escapeHtml(date)}" required></label><button class="btn btn-outline" type="submit">แสดงรายการ</button></form><p>บันทึกยอดตั้งต้นไว้ก่อน · หักเงินจริงเมื่ออนุมัติ</p></div>
    <div class="deduction-entry-columns">${columns.join("")}</div></section>`;
}

function renderDeductionEntry(user, moduleItem) {
  if (isDeductionApprovalTab()) return renderDeductionApproval(user, moduleItem);
  if (["production", "time"].includes(deductionActiveTab)) return renderDeductionWorkspace();
  const context = getCurrentDeductionContext();
  const editing = context.editingRecord;
  const formEmployeeId = editing?.employee_id || context.selectedEmployee?.id || "";
  const formStartDate = editing?.start_date || context.range.startDate;
  const totalAmount = sumDeductions(context.records);
  const employeeCount = new Set(context.records.map((record) => record.employee_id || record.emp_code)).size;
  const actionLabel = context.bonusMode ? "เบี้ยขยัน" : "รายการหัก";
  const effectiveActionLabel = context.otOverrideMode ? "ปรับ OT รายวัน" : actionLabel;
  const employeeKindLabel = context.employeeKind === "time" ? "พนักงานรายวัน" : "พนักงานเหมา";

  return `
    <section class="summary-page deduction-page deduction-minimal deduction-refined">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>

        </div>

      </div>



      ${context.bonusMode ? `
        <div class="deduction-kind-switch" role="group" aria-label="ประเภทพนักงานสำหรับเบี้ยขยัน">
          <span>ประเภทพนักงาน</span>
          <button class="${context.employeeKind === "production" ? "active" : ""}" type="button" data-bonus-employee-kind="production">พนักงานเหมา</button>
          <button class="${context.employeeKind === "time" ? "active" : ""}" type="button" data-bonus-employee-kind="time">พนักงานรายวัน</button>
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
          <span>เลือกวันที่ที่ต้องการตรวจสอบหรือเพิ่ม${context.otOverrideMode ? "อัตรา OT เฉพาะวัน" : context.bonusMode ? "เบี้ยขยัน" : "รายการหักเงิน"}</span>
        </div>
        <form class="deduction-filter-form" id="deductionFilterForm">
          ${context.otOverrideMode ? `<label class="field">
            <span>พนักงานที่ต้องการดู</span>
            <select name="employee_id" required>${renderDeductionEmployeeOptions(context.employees, context.selectedEmployee?.id || "")}</select>
          </label>` : ""}
          <label class="field">
            <span>${context.otOverrideMode ? "วันที่เริ่ม" : context.bonusMode ? "วันที่ลงเบี้ยขยัน" : "วันที่หักเงิน"}</span>
            <input name="start_date" type="date" value="${escapeHtml(context.range.startDate)}" required />
          </label>
          ${context.otOverrideMode ? `<label class="field">
            <span>วันที่สิ้นสุด</span>
            <input name="end_date" type="date" value="${escapeHtml(context.range.endDate)}" min="${escapeHtml(context.range.startDate)}" required />
          </label>` : ""}
          <button class="btn btn-outline deduction-load-button" type="submit">แสดงรายการ</button>
        </form>
      </section>

      <div class="deduction-export-note">

        <div>
          <strong>${context.otOverrideMode ? "ระบบจะใช้อัตรานี้เฉพาะวันที่กำหนด" : context.bonusMode ? "ระบบจะบวกเบี้ยขยันให้อัตโนมัติ" : "รายการหักจะถูกพักไว้ก่อน"}</strong>
          <span>${context.otOverrideMode ? "วันอื่นจะใช้อัตรา OT ปัจจุบันจากข้อมูลการเงินของพนักงาน" : context.bonusMode ? `เมื่อช่วงวันที่ Export ครอบคลุมวันที่ ${escapeHtml(context.range.startDate)} ยอดนี้จะถูกบวกในการคำนวณทันที` : "ยอดจะยังไม่ถูกหักจากเงิน จนกว่าจะเลือกและยืนยันในแท็บอนุมัติหักเงิน"}</span>
        </div>
      </div>
      <div class="summary-metrics deduction-metrics">
        <div class="metric-card metric-blue"><span>${effectiveActionLabel}</span><strong>${context.records.length.toLocaleString("th-TH")} รายการ</strong><small>ประจำวันที่ ${escapeHtml(context.range.startDate)}</small></div>
        <div class="metric-card metric-green"><span>จำนวนพนักงาน</span><strong>${employeeCount.toLocaleString("th-TH")} คน</strong><small>${employeeKindLabel}</small></div>
        <div class="metric-card ${context.bonusMode ? "metric-green" : "metric-orange"}"><span>${context.bonusMode ? "ยอดเบี้ยขยันรวมวันนี้" : "ยอดตั้งต้นรวมวันนี้"}</span><strong>${money(totalAmount)}</strong><small>${context.bonusMode ? "เงินเพิ่มก่อนคำนวณยอดสุทธิ" : "รออนุมัติก่อนนำไปหักเงินจริง"}</small></div>
      </div>

      <div class="deduction-refined-layout">
      <section class="panel deduction-form-panel">
        <div class="section-title-row">
          <div>
            <h3>${editing ? `แก้ไข${effectiveActionLabel}` : `เพิ่ม${effectiveActionLabel}`}</h3>
            <p class="muted-text">${context.otOverrideMode ? "กำหนดอัตรา OT เฉพาะวันที่เลือก (บาท/ชั่วโมง)" : context.bonusMode ? "เพิ่มยอดเงินตามวันที่เลือก" : "บันทึกยอดตั้งต้นไว้รออนุมัติ"}</p>
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
            <span>${context.otOverrideMode ? "วันที่ปรับ OT" : context.bonusMode ? "วันที่ลงเบี้ยขยัน" : "วันที่หักเงิน"}</span>
            <input name="start_date" type="date" value="${escapeHtml(formStartDate)}" required />
          </label>
          ${context.otOverrideMode ? `
            <input type="hidden" name="deduction_type" value="${DAILY_OT_OVERRIDE_TYPE}" />
          ` : context.bonusMode ? `
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
            <span>${context.otOverrideMode ? "อัตรา OT (บาท/ชม.)" : "จำนวนเงิน"}</span>
            <input name="amount" type="number" min="0" step="1" value="${editing ? Number(editing.amount || 0) : ""}" placeholder="0" required />
          </label>
          <label class="field">
            <span>หมายเหตุ</span>
            <input name="note" value="${escapeHtml(editing?.note || "")}" placeholder="รายละเอียดเพิ่มเติมถ้ามี" />
          </label>
          <button class="btn ${context.bonusMode || context.otOverrideMode ? "btn-success" : "btn-primary"} deduction-submit-button" type="submit" ${context.employees.length ? "" : "disabled"}>${editing ? "บันทึกการแก้ไข" : `บันทึก${effectiveActionLabel}`}</button>
        </form>
      </section>

      <section class="table-card">
        <div class="table-heading deduction-table-heading">
          <div>
            <strong>${context.otOverrideMode ? `${effectiveActionLabel} ${escapeHtml(context.range.startDate)} ถึง ${escapeHtml(context.range.endDate)}` : `${effectiveActionLabel}ประจำวันที่ ${escapeHtml(context.range.startDate)}`}</strong>
            <span>${context.otOverrideMode && context.selectedEmployee ? `${escapeHtml(context.selectedEmployee.emp_code)} - ${escapeHtml(context.selectedEmployee.fullname)}` : employeeKindLabel}</span>
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
                <th>${context.otOverrideMode ? "ประเภท" : context.bonusMode ? "ประเภทเงินเพิ่ม" : "รายการหัก"}</th>
                <th>${context.otOverrideMode ? "OT บาท/ชม." : context.bonusMode ? "จำนวนเงิน" : "ยอดตั้งต้น"}</th>
                <th>หมายเหตุ</th>
                <th>ผู้บันทึก</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${context.records.length ? context.records.map(renderDeductionRow).join("") : `<tr><td colspan="8" class="empty-cell">ยังไม่มี${effectiveActionLabel}${context.otOverrideMode ? "ของพนักงานคนนี้ในช่วงวันที่เลือก" : "ในวันนี้"}</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </section>
  `;
}

function bindDeductionEvents(user) {
  document.querySelectorAll("[data-deduction-entry-form]").forEach((form) => {
    form.addEventListener("input", () => { deductionEntryDrafts[form.dataset.deductionEntryForm] = Object.fromEntries(new FormData(form)); });
  });
  document.querySelectorAll("[data-cancel-deduction-edit]").forEach((button) => button.addEventListener("click", () => {
    delete deductionEntryDrafts[button.dataset.cancelDeductionEdit];
    editingDeductionId = null;
    render();
  }));
  document.querySelectorAll("[data-deduction-tab]").forEach((button) => {
    button.addEventListener("click", async () => {
      const requestedTab = button.dataset.deductionTab;
      deductionActiveTab = ["bonus", "approval", "daily-ot"].includes(requestedTab) ? requestedTab : normalizeDeductionKind(requestedTab);
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
            hydrateDeductionsFromCloud({ ...(["production", "time"].includes(deductionActiveTab) ? {} : { employee_kind: employeeKind }), start_date: deductionStartDate, end_date: deductionEndDate }),
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

  document.querySelectorAll("[data-approval-view]").forEach((button) => {
    button.addEventListener("click", () => {
      deductionApprovalView = button.dataset.approvalView === "approved" ? "approved" : "pending";
      editingApprovedDeductionApplicationId = null;
      setDeductionMessage("");
      render();
    });
  });

  document.querySelectorAll("[data-edit-approved-deduction]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.editApprovedDeduction || 0);
      const row = deductionApplications.find((record) => Number(record.id) === id);
      if (!canEditApprovedDeductionApplication(user, row)) {
        setDeductionMessage("บัญชีนี้ไม่มีสิทธิ์แก้ไขรายการนี้: C5 ขึ้นไปแก้ได้ตลอด ส่วน C4 แก้ได้ภายใน 15 นาทีหลังบันทึกเท่านั้น", "error");
        render();
        return;
      }
      editingApprovedDeductionApplicationId = id;
      setDeductionMessage("");
      render();
    });
  });

  document.querySelectorAll("[data-cancel-approved-deduction-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      editingApprovedDeductionApplicationId = null;
      setDeductionMessage("");
      render();
    });
  });

  document.querySelectorAll("[data-approved-deduction-edit]").forEach((formElement) => {
    formElement.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = Number(formElement.dataset.approvedDeductionEdit || 0);
      const form = new FormData(formElement);
      try {
        await apiUpdateApprovedDeductionApplication(id, {
          applied_date: String(form.get("applied_date") || ""),
          amount: Number(form.get("amount") || 0),
          note: String(form.get("note") || "")
        }, user);
        editingApprovedDeductionApplicationId = null;
        await Promise.all([hydrateDeductionsFromCloud(), hydrateDeductionApplicationsFromCloud()]);
        setDeductionMessage("แก้ไขรายการอนุมัติแล้วและบันทึก Audit Log เรียบร้อยแล้ว");
      } catch (error) {
        setDeductionMessage(error instanceof Error ? error.message : "แก้ไขรายการอนุมัติแล้วไม่สำเร็จ", "error");
      }
      render();
    });
  });

  document.querySelectorAll("[data-delete-approved-deduction]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.deleteApprovedDeduction || 0);
      const row = deductionApplications.find((record) => Number(record.id) === id);
      if (!canDeleteApprovedDeductionApplication(user, row)) {
        setDeductionMessage("บัญชีนี้ไม่มีสิทธิ์ลบรายการนี้: C5 ขึ้นไปลบได้ตลอด ส่วน C4 ลบได้เฉพาะรายการที่ตัวเองบันทึก", "error");
        render();
        return;
      }
      if (!window.confirm(`ยืนยันลบรายการอนุมัติหักเงินของ ${row?.emp_code || "-"} ${row?.employee_name || ""} ยอด ${money(row?.amount || 0)} ?`)) return;
      try {
        await apiDeleteApprovedDeductionApplication(id, user);
        editingApprovedDeductionApplicationId = null;
        await Promise.all([hydrateDeductionsFromCloud(), hydrateDeductionApplicationsFromCloud()]);
        setDeductionMessage("ลบรายการอนุมัติแล้วและบันทึก Audit Log เรียบร้อยแล้ว");
      } catch (error) {
        setDeductionMessage(error instanceof Error ? error.message : "ลบรายการอนุมัติแล้วไม่สำเร็จ", "error");
      }
      render();
    });
  });

  document.querySelector("#deductionFilterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const requestedRange = normalizeDateRange(
      String(form.get("start_date") || deductionStartDate),
      isDailyOtOverrideTab() ? String(form.get("end_date") || deductionEndDate || deductionStartDate) : String(form.get("start_date") || deductionStartDate)
    );
    deductionStartDate = requestedRange.startDate;
    deductionEndDate = requestedRange.endDate;
    if (isDailyOtOverrideTab()) deductionEmployeeId = String(form.get("employee_id") || deductionEmployeeId);
    editingDeductionId = null;
    setDeductionMessage(isDailyOtOverrideTab() ? "กำลังโหลดรายการปรับ OT จากฐานกลาง..." : "กำลังโหลดรายการหักเงินจากฐานกลาง...");
    render();
    try {
      await hydrateDeductionsFromCloud({ ...(["production", "time"].includes(deductionActiveTab) ? {} : { employee_kind: getActiveAdjustmentEmployeeKind() }), start_date: deductionStartDate, end_date: deductionEndDate });
      setDeductionMessage(isDailyOtOverrideTab() ? "โหลดรายการปรับ OT ตามพนักงานและช่วงวันที่เรียบร้อยแล้ว" : "โหลดรายการหักเงินจากฐานกลางเรียบร้อยแล้ว");
    } catch (error) {
      setDeductionMessage(`${error instanceof Error ? error.message : "โหลดรายการหักเงินไม่สำเร็จ"} กรุณาตรวจสอบ Supabase`, "error");
    }
    render();
  });

  document.querySelectorAll("#deductionForm, [data-deduction-entry-form]").forEach((entryForm) => entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = Number(form.get("id") || 0);
    const bonusMode = isAttendanceBonusTab();
    const otOverrideMode = isDailyOtOverrideTab();
    const payload = {
      employee_kind: normalizeDeductionKind(form.get("employee_kind") || getActiveAdjustmentEmployeeKind()),
      employee_id: Number(form.get("employee_id") || 0),
      start_date: String(form.get("start_date") || deductionStartDate),
      end_date: String(form.get("start_date") || deductionStartDate),
      deduction_type: bonusMode ? ATTENDANCE_BONUS_TYPE : otOverrideMode ? DAILY_OT_OVERRIDE_TYPE : String(form.get("deduction_type") || "advance"),
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
      if (!otOverrideMode) {
        deductionStartDate = payload.start_date;
        deductionEndDate = payload.end_date;
      } else {
        deductionStartDate = deductionStartDate < payload.start_date ? deductionStartDate : payload.start_date;
        deductionEndDate = deductionEndDate > payload.end_date ? deductionEndDate : payload.end_date;
      }
      deductionEmployeeId = String(payload.employee_id);
      editingDeductionId = null;
      delete deductionEntryDrafts[payload.employee_kind];
      await hydrateDeductionsFromCloud({ ...(["production", "time"].includes(deductionActiveTab) ? {} : { employee_kind: payload.employee_kind }), start_date: deductionStartDate, end_date: deductionEndDate });
    } catch (error) {
      setDeductionMessage(`${error instanceof Error ? error.message : "บันทึกรายการหักเงินไม่สำเร็จ"} กรุณาตรวจสอบ Supabase`, "error");
    }
    render();
  }));

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

const issueReportStatusMeta = {
  received: { label: "รับเรื่องแล้ว", className: "is-received" },
  investigating: { label: "กำลังตรวจสอบ", className: "is-investigating" },
  resolved: { label: "แก้ไขแล้ว", className: "is-resolved" }
};

const issueReportPriorityLabels = {
  normal: "ทั่วไป",
  urgent: "เร่งด่วน",
  blocking: "กระทบการทำงาน"
};

function canManageIssueReports(user) {
  return Number(String(getUserLevel(user)).replace(/\D/g, "") || 1) >= 5;
}

function canViewAllIssueReports(user) {
  return canOpen(user, "record-report");
}

function canReceiveIssueNotifications(user) {
  return ["C6", "C7"].includes(getUserLevel(user));
}

function issueNotificationStorageKey() {
  return `pismai-issue-notification-last-read:${issueNotificationUsername}`;
}

function issueNotificationLabel(count) {
  return count > 99 ? "99+" : String(count);
}

function publishIssueNotificationCount(value, { notify = false, latestId } = {}) {
  const nextCount = Math.max(0, Number(value) || 0);
  const previousCount = issueNotificationUnreadCount;
  issueNotificationUnreadCount = nextCount;
  if (latestId !== undefined) issueNotificationLatestId = Math.max(0, Number(latestId) || 0);
  document.querySelectorAll("[data-issue-unread-badge]").forEach((badge) => {
    badge.textContent = issueNotificationLabel(nextCount);
    badge.hidden = nextCount === 0;
    badge.closest(".nav-button")?.classList.toggle("has-notification", nextCount > 0);
  });
  if (notify && issueNotificationInitialized && nextCount > previousCount) {
    document.querySelector("[data-issue-notification-toast]")?.remove();
    const toast = document.createElement("button");
    toast.type = "button";
    toast.className = "issue-notification-toast";
    toast.dataset.issueNotificationToast = "";
    toast.innerHTML = `<span class="issue-notification-dot"></span><span><strong>มีการแจ้งปัญหาใหม่</strong><small>${issueNotificationLabel(nextCount)} รายการรอตรวจสอบ</small></span>`;
    toast.addEventListener("click", () => {
      toast.remove();
      location.hash = "#/record-report";
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 220);
    }, 6500);
  }
  issueNotificationInitialized = true;
}

async function refreshIssueNotifications({ notify = true } = {}) {
  const user = getSession()?.user;
  if (!canReceiveIssueNotifications(user)) return;
  const lastReadId = Math.max(0, Number(localStorage.getItem(issueNotificationStorageKey())) || 0);
  try {
    const response = await cloudApiRequest(`/api/issue-reports/notifications?after_id=${lastReadId}`, { timeoutMs: 12000 });
    publishIssueNotificationCount(response?.data?.unread_count, { notify, latestId: response?.data?.latest_id });
    if (location.hash.replace("#/", "") === "record-report") markIssueNotificationsRead();
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) stopIssueNotifications();
    else console.warn("Issue report notification refresh failed.", error);
  }
}

function startIssueNotifications() {
  const user = getSession()?.user;
  const username = String(user?.username || "").toLowerCase();
  if (!username || !canReceiveIssueNotifications(user)) return stopIssueNotifications();
  if (issueNotificationUsername !== username) {
    stopIssueNotifications();
    issueNotificationUsername = username;
  }
  if (issueNotificationTimer) return publishIssueNotificationCount(issueNotificationUnreadCount);
  refreshIssueNotifications({ notify: false });
  issueNotificationTimer = window.setInterval(() => refreshIssueNotifications(), 60000);
}

function stopIssueNotifications() {
  if (issueNotificationTimer) window.clearInterval(issueNotificationTimer);
  issueNotificationTimer = null;
  issueNotificationUsername = "";
  issueNotificationInitialized = false;
  issueNotificationLatestId = 0;
  publishIssueNotificationCount(0);
  document.querySelector("[data-issue-notification-toast]")?.remove();
}

function markIssueNotificationsRead() {
  if (!issueNotificationUsername || !issueNotificationLatestId) return;
  localStorage.setItem(issueNotificationStorageKey(), String(issueNotificationLatestId));
  publishIssueNotificationCount(0);
}

function issueTicketNumber(report) {
  return `WEB-${String(Number(report?.id) || 0).padStart(4, "0")}`;
}

function formatIssueReportDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function filteredIssueReports() {
  const search = issueReportSearch.trim().toLocaleLowerCase("th-TH");
  return issueReports.filter((report) => {
    if (issueReportStatusFilter !== "all" && report.status !== issueReportStatusFilter) return false;
    if (!search) return true;
    return [issueTicketNumber(report), report.title, report.description, report.page_name, report.reporter_fullname, report.reporter_username]
      .some((value) => String(value || "").toLocaleLowerCase("th-TH").includes(search));
  });
}

function renderIssueReportSummary() {
  const counts = issueReports.reduce((result, report) => {
    result.total += 1;
    if (result[report.status] !== undefined) result[report.status] += 1;
    return result;
  }, { total: 0, received: 0, investigating: 0, resolved: 0 });
  return `
    <div class="issue-summary-strip" aria-label="สรุปรายงานปัญหา">
      <div><span>ทั้งหมด</span><strong>${counts.total.toLocaleString("th-TH")}</strong></div>
      <div><span>รับเรื่องแล้ว</span><strong>${counts.received.toLocaleString("th-TH")}</strong></div>
      <div><span>กำลังตรวจสอบ</span><strong>${counts.investigating.toLocaleString("th-TH")}</strong></div>
      <div><span>แก้ไขแล้ว</span><strong>${counts.resolved.toLocaleString("th-TH")}</strong></div>
    </div>`;
}

function renderIssueReportCard(report, user) {
  const status = issueReportStatusMeta[report.status] || issueReportStatusMeta.received;
  const selected = Number(issueReportSelectedId) === Number(report.id);
  return `
    <article class="issue-report-card ${selected ? "is-open" : ""}">
      <div class="issue-report-card-head">
        <div>
          <span class="issue-ticket">#${issueTicketNumber(report)}</span>
          <h3>${escapeHtml(report.title)}</h3>
        </div>
        <span class="issue-status ${status.className}">${status.label}</span>
      </div>
      <div class="issue-report-meta">
        <span>${escapeHtml(report.reporter_fullname || report.reporter_username || "-")}</span>
        <span>${formatIssueReportDate(report.created_at)}</span>
        <span>${escapeHtml(report.page_name || "-")}</span>
        <span>${escapeHtml(issueReportPriorityLabels[report.priority] || "ทั่วไป")}</span>
      </div>
      ${selected ? `
        <div class="issue-report-detail">
          <p>${escapeHtml(report.description).replaceAll("\n", "<br>")}</p>
          ${report.attachment_data ? `<a href="${report.attachment_data}" download="${escapeHtml(report.attachment_name || `${issueTicketNumber(report)}.png`)}">ดูหรือดาวน์โหลดภาพหน้าจอ</a>` : ""}
          ${canManageIssueReports(user) ? `
            <label class="field issue-status-field">
              <span>อัปเดตสถานะ</span>
              <select data-issue-status-id="${Number(report.id)}">
                ${Object.entries(issueReportStatusMeta).map(([key, item]) => `<option value="${key}" ${report.status === key ? "selected" : ""}>${item.label}</option>`).join("")}
              </select>
            </label>` : ""}
        </div>` : ""}
      <button class="issue-detail-button" type="button" data-issue-detail="${Number(report.id)}">${selected ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}</button>
    </article>`;
}

function renderIssueReportPage(user, moduleItem) {
  const reports = filteredIssueReports();
  return `
    <section class="issue-report-page">
      <header class="issue-page-head">
        <div>
          <p class="eyebrow">WEBSITE SUPPORT</p>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="issue-access-note">${canViewAllIssueReports(user) ? "รายงานทั้งหมด" : "รายงานของฉัน"}</span>
      </header>
      ${renderIssueReportSummary()}
      ${issueReportMessage ? `<div class="issue-message ${issueReportMessageType === "error" ? "is-error" : "is-success"}" role="alert">${escapeHtml(issueReportMessage)}</div>` : ""}
      <div class="issue-workspace">
        <section class="issue-form-panel" aria-labelledby="issueFormTitle">
          <div class="issue-section-head"><h3 id="issueFormTitle">แจ้งปัญหาใหม่</h3><p>กรอกรายละเอียดเพื่อให้ตรวจสอบได้รวดเร็ว</p></div>
          <form id="issueReportForm" class="issue-report-form">
            <label class="field"><span>หัวข้อปัญหา</span><input name="title" maxlength="160" required placeholder="สรุปปัญหาที่พบ" /></label>
            <div class="issue-form-row">
              <label class="field"><span>ประเภทปัญหา</span><select name="category" required><option value="system">การใช้งานระบบ</option><option value="data">ข้อมูลไม่ถูกต้อง</option><option value="display">การแสดงผล</option><option value="performance">ความเร็วของระบบ</option><option value="other">อื่นๆ</option></select></label>
              <label class="field"><span>หน้าที่พบปัญหา</span><input name="page_name" maxlength="120" required placeholder="เช่น บันทึกผลผลิต" /></label>
            </div>
            <fieldset class="issue-priority"><legend>ความเร่งด่วน</legend><div>
              <label><input type="radio" name="priority" value="normal" checked /><span>ทั่วไป</span></label>
              <label><input type="radio" name="priority" value="urgent" /><span>เร่งด่วน</span></label>
              <label><input type="radio" name="priority" value="blocking" /><span>กระทบการทำงาน</span></label>
            </div></fieldset>
            <label class="field"><span>รายละเอียดปัญหา</span><textarea name="description" maxlength="5000" required placeholder="อธิบายสิ่งที่เกิดขึ้น ขั้นตอนก่อนพบปัญหา และผลที่คาดหวัง"></textarea></label>
            <label class="issue-attachment">
              <input id="issueAttachmentInput" type="file" accept="image/png,image/jpeg" />
              <span><strong id="issueAttachmentLabel">${issueReportAttachment ? escapeHtml(issueReportAttachment.name) : "แนบภาพหน้าจอ"}</strong><small>PNG หรือ JPG ขนาดไม่เกิน 2 MB</small></span>
            </label>
            <div class="issue-form-actions"><button class="btn btn-primary" type="submit" ${issueReportsLoading ? "disabled" : ""}>ส่งรายงานปัญหา</button><button class="btn btn-outline" id="issueReportReset" type="reset">ล้างข้อมูล</button></div>
          </form>
        </section>
        <section class="issue-list-panel" aria-labelledby="issueListTitle">
          <div class="issue-section-head"><h3 id="issueListTitle">รายงานล่าสุด</h3><p>${canViewAllIssueReports(user) ? "รายการจากผู้ใช้งานทั้งหมด" : "ติดตามเรื่องที่คุณแจ้งไว้"}</p></div>
          <form id="issueReportFilter" class="issue-report-filter">
            <input name="search" value="${escapeHtml(issueReportSearch)}" placeholder="ค้นหาเลขที่ หัวข้อ หรือหน้า" aria-label="ค้นหารายงาน" />
            <select name="status" aria-label="กรองตามสถานะ"><option value="all">ทุกสถานะ</option>${Object.entries(issueReportStatusMeta).map(([key, item]) => `<option value="${key}" ${issueReportStatusFilter === key ? "selected" : ""}>${item.label}</option>`).join("")}</select>
          </form>
          <div class="issue-report-list">
            ${issueReportsLoading && !issueReportsLoaded ? `<div class="issue-empty">กำลังโหลดรายงาน...</div>` : reports.length ? reports.map((report) => renderIssueReportCard(report, user)).join("") : `<div class="issue-empty">ยังไม่พบรายงานปัญหา</div>`}
          </div>
        </section>
      </div>
    </section>`;
}

async function loadIssueReports() {
  if (issueReportsLoading) return;
  issueReportsLoading = true;
  try {
    const response = await cloudApiRequest("/api/issue-reports", { timeoutMs: 12000 });
    issueReports = Array.isArray(response.data) ? response.data : [];
    issueReportsLoaded = true;
  } catch (error) {
    issueReportsLoaded = true;
    issueReportMessage = error?.status === 401
      ? "เซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบอีกครั้ง"
      : error instanceof Error ? error.message : "โหลดรายงานไม่สำเร็จ";
    issueReportMessageType = "error";
  } finally {
    issueReportsLoading = false;
  }
}

function readIssueAttachment(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) return reject(new Error("รองรับเฉพาะภาพ PNG หรือ JPG"));
    if (file.size > 2 * 1024 * 1024) return reject(new Error("ภาพหน้าจอต้องมีขนาดไม่เกิน 2 MB"));
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, data: String(reader.result || "") });
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ภาพได้"));
    reader.readAsDataURL(file);
  });
}

function bindIssueReportEvents(user) {
  if (!issueReportsLoaded && !issueReportsLoading) {
    loadIssueReports().then(render);
  }
  document.querySelector("#issueAttachmentInput")?.addEventListener("change", async (event) => {
    try {
      issueReportAttachment = await readIssueAttachment(event.currentTarget.files?.[0]);
      issueReportMessage = "";
      event.currentTarget.setCustomValidity("");
      const label = document.querySelector("#issueAttachmentLabel");
      if (label) label.textContent = issueReportAttachment?.name || "แนบภาพหน้าจอ";
    } catch (error) {
      issueReportAttachment = null;
      event.currentTarget.value = "";
      event.currentTarget.setCustomValidity(error instanceof Error ? error.message : "แนบภาพไม่สำเร็จ");
      event.currentTarget.reportValidity();
    }
  });
  document.querySelector("#issueReportReset")?.addEventListener("click", () => {
    issueReportAttachment = null;
    issueReportMessage = "";
    const label = document.querySelector("#issueAttachmentLabel");
    if (label) label.textContent = "แนบภาพหน้าจอ";
  });
  document.querySelector("#issueReportForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    issueReportsLoading = true;
    issueReportMessage = "";
    render();
    try {
      await cloudApiRequest("/api/issue-reports", {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title") || ""),
          category: String(form.get("category") || "system"),
          page_name: String(form.get("page_name") || ""),
          priority: String(form.get("priority") || "normal"),
          description: String(form.get("description") || ""),
          attachment_name: issueReportAttachment?.name || "",
          attachment_data: issueReportAttachment?.data || ""
        }),
        timeoutMs: 20000
      });
      issueReportAttachment = null;
      issueReportMessage = "ส่งรายงานเรียบร้อยแล้ว ระบบได้รับเรื่องของคุณแล้ว";
      issueReportMessageType = "success";
      issueReportsLoaded = false;
    } catch (error) {
      issueReportMessage = error instanceof Error ? error.message : "ส่งรายงานไม่สำเร็จ";
      issueReportMessageType = "error";
    } finally {
      issueReportsLoading = false;
      await loadIssueReports();
      render();
    }
  });
  document.querySelector("#issueReportFilter")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    issueReportSearch = String(form.get("search") || "");
    render();
  });
  document.querySelector("#issueReportFilter select")?.addEventListener("change", (event) => {
    issueReportStatusFilter = event.currentTarget.value;
    issueReportSearch = document.querySelector("#issueReportFilter input")?.value || "";
    render();
  });
  document.querySelectorAll("[data-issue-detail]").forEach((button) => button.addEventListener("click", () => {
    const id = Number(button.dataset.issueDetail);
    issueReportSelectedId = Number(issueReportSelectedId) === id ? null : id;
    render();
  }));
  if (canManageIssueReports(user)) {
    document.querySelectorAll("[data-issue-status-id]").forEach((select) => select.addEventListener("change", async () => {
      issueReportsLoading = true;
      try {
        await cloudApiRequest("/api/issue-reports/status", {
          method: "POST",
          body: JSON.stringify({ id: Number(select.dataset.issueStatusId), status: select.value }),
          timeoutMs: 12000
        });
        issueReportsLoaded = false;
        issueReportMessage = "อัปเดตสถานะรายงานแล้ว";
        issueReportMessageType = "success";
      } catch (error) {
        issueReportMessage = error instanceof Error ? error.message : "อัปเดตสถานะไม่สำเร็จ";
        issueReportMessageType = "error";
      } finally {
        issueReportsLoading = false;
        await loadIssueReports();
        render();
      }
    }));
  }
}

function renderSettingsBackBar() {
  return `
    <section class="settings-back-bar">
      <button class="btn btn-outline" type="button" data-route="settings">← กลับหน้าตั้งค่า</button>
    </section>
  `;
}

function getDetailedSettingsPileSummaries(records) {
  const summaries = new Map(
    getFruitPiles().map((pileConfig) => [
      pileConfig.number,
      {
        pile: pileConfig.number,
        config: pileConfig,
        water: 0,
        flower: 0,
        fieldTotalsByFruit: {},
        grades: createEmptyDurianGradeWeights(0),
        gradeTotal: 0,
        total: 0,
        amount: 0,
        count: 0,
        employees: new Set(),
        fruits: new Set()
      }
    ])
  );

  records.forEach((record) => {
    const pile = normalizeProductionPileNumber(record.pile_no ?? record.pile) ?? "-";
    const summary = summaries.get(pile) || {
      pile,
      water: 0,
      flower: 0,
      fieldTotalsByFruit: {},
      grades: createEmptyDurianGradeWeights(0),
      gradeTotal: 0,
      total: 0,
      amount: 0,
      count: 0,
      employees: new Set(),
      fruits: new Set()
    };
    const gradeWeights = getRecordGradeWeights(record);
    const fruitId = productionFruitTypeForRecord(record);
    const waterWeight = Number(record.water_weight || record.water || 0);
    const flowerWeight = Number(record.flower_weight || record.flower || 0);
    summary.water += waterWeight;
    summary.flower += flowerWeight;
    if (!isDurianFruit(fruitId)) {
      summary.fieldTotalsByFruit[fruitId] ||= { water: 0, flower: 0 };
      summary.fieldTotalsByFruit[fruitId].water += waterWeight;
      summary.fieldTotalsByFruit[fruitId].flower += flowerWeight;
    }
    DURIAN_GRADES.forEach((grade) => {
      summary.grades[grade] += gradeWeights[grade];
    });
    summary.gradeTotal += getDurianGradeTotal(gradeWeights);
    summary.total += getRecordTotalWeight(record);
    summary.amount += Number(record.total_amount || record.grand_total || 0);
    summary.count += 1;
    summary.employees.add(record.employee_id || record.emp_code || record.employee_name || "-");
    summary.fruits.add(productionFruitTypeForRecord(record));
    summaries.set(pile, summary);
  });

  return [...summaries.values()].sort((a, b) => {
    if (a.pile === "-") return 1;
    if (b.pile === "-") return -1;
    return Number(a.pile) - Number(b.pile);
  });
}

function settingsPileFruitLabel(fruitId) {
  if (!fruitId || fruitId === "all") return "ทุกผลไม้";
  return productionFruitOptions.find((fruit) => fruit.id === fruitId)?.label || fruitId;
}

function renderSettingsPileWeightRows(summary, selectedFruit) {
  const fruitIds = Object.keys(summary.fieldTotalsByFruit);
  if (!fruitIds.length && selectedFruit !== "all" && !isDurianFruit(selectedFruit)) {
    fruitIds.push(selectedFruit);
  }
  if (!fruitIds.length && selectedFruit === "all") fruitIds.push("mangosteen");

  return fruitIds.flatMap((fruitId) => {
    const labels = getProductionFieldLabels(fruitId);
    const totals = summary.fieldTotalsByFruit[fruitId] || { water: 0, flower: 0 };
    return [
      `<div><span>${escapeHtml(labels.water)}</span><strong>${numberText(totals.water)} กก.</strong></div>`,
      `<div><span>${escapeHtml(labels.flower)}</span><strong>${numberText(totals.flower)} กก.</strong></div>`
    ];
  }).join("");
}

function renderSettingsPileCard(summary, selectedFruit) {
  const hasGrades = summary.gradeTotal > 0;
  const config = summary.config || fruitPileByNumber(summary.pile);
  const displayName = config?.name || `กอง ${summary.pile}`;
  const color = config?.color || "#64748b";
  return `
    <article class="settings-pile-card ${summary.count ? "" : "is-empty"} ${config?.visible === false ? "is-hidden" : ""}" style="--fruit-pile-accent:${color}">
      <div class="settings-pile-card-glow"></div>
      <div class="settings-pile-card-head">
        <div><span>PILE ${escapeHtml(summary.pile)}</span><h3>${escapeHtml(displayName)}</h3></div>
        <div class="settings-pile-card-status"><i style="background:${color}"></i>${config?.visible === false ? "ซ่อนอยู่" : "แสดงในหน้ากรอก"}</div>
      </div>
      <div class="settings-pile-total">
        <span>น้ำหนักรวม</span>
        <strong>${numberText(summary.total)} <small>กก.</small></strong>
      </div>
      <div class="settings-pile-breakdown">
        ${renderSettingsPileWeightRows(summary, selectedFruit)}
        ${hasGrades || isDurianFruit(selectedFruit) ? `<div><span>น้ำหนักทุเรียน</span><strong>${numberText(summary.gradeTotal)} กก.</strong></div>` : ""}
        <div><span>พนักงาน</span><strong>${summary.count ? summary.employees.size : 0} คน</strong></div>
      </div>
      ${hasGrades ? `<div class="settings-pile-grades"><span>ทุเรียนรวม <strong>${numberText(summary.gradeTotal)}</strong> กก.</span></div>` : ""}
      <div class="settings-pile-amount"><span>ยอดเงินกองนี้</span><strong>${money(summary.amount)}</strong></div>
      ${config ? `<div class="settings-pile-card-actions"><button type="button" data-pile-edit="${config.number}">แก้ไข</button><button type="button" data-pile-toggle="${config.number}">${config.visible ? "ปิดการแสดง" : "เปิดการแสดง"}</button><button class="danger" type="button" data-pile-delete="${config.number}">ลบกอง</button></div>` : `<div class="settings-pile-history-note">ข้อมูลเก่าถูกเก็บไว้ และจะเชื่อมกลับเมื่อสร้างกองเลขนี้อีกครั้ง</div>`}
    </article>
  `;
}

function settingsPileRecordBreakdown(record) {
  const fruitId = productionFruitTypeForRecord(record);
  if (isDurianFruit(fruitId)) {
    return formatDurianGradeBreakdown(record);
  }
  const labels = getProductionFieldLabels(fruitId);
  return `${labels.water}: ${numberText(record.water_weight || record.water || 0)} กก. · ${labels.flower}: ${numberText(record.flower_weight || record.flower || 0)} กก.`;
}

function repairLegacyThaiText(value) {
  const text = String(value || "");
  if (!/(?:à¸|à¹|Ã|Â)/.test(text) || ![...text].every((character) => character.charCodeAt(0) <= 255)) return text;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from([...text], (character) => character.charCodeAt(0))
    );
    return /[ก-๙]/.test(decoded) ? decoded : text;
  } catch (_error) {
    return text;
  }
}

function getSettingsPileAbsenceGroups(employees, dayRecords) {
  const presentEmployeeIds = new Set(dayRecords.map((record) => String(record.employee_id || "")).filter(Boolean));
  const presentEmployeeCodes = new Set(dayRecords.map((record) => String(record.emp_code || "").trim()).filter(Boolean));

  const employeeGroups = employees.map(getEmployeePayGroup).filter(Boolean);
  const customGroups = [...new Set(employeeGroups)]
    .filter((group) => !primaryPayGroups.includes(group))
    .sort((a, b) => a.localeCompare(b, "th"));
  return [...primaryPayGroups, ...customGroups].map((payGroup) => {
    const groupEmployees = employees.filter(
      (employee) => employee.status === "Active" && getEmployeePayGroup(employee) === payGroup
    );
    const absentCodes = groupEmployees
      .filter((employee) => {
        const id = String(employee.id || "");
        const code = String(employee.emp_code || "").trim();
        return !(id && presentEmployeeIds.has(id)) && !(code && presentEmployeeCodes.has(code));
      })
      .map((employee) => String(employee.emp_code || "-").trim() || "-")
      .sort((a, b) => a.localeCompare(b, "th", { numeric: true }));
    return { payGroup, employeeCount: groupEmployees.length, absentCodes };
  });
}

function renderSettingsPileAbsenceGroup(group) {
  const status = !group.employeeCount
    ? `<span class="settings-pile-roster-empty">ยังไม่มีรายชื่อ</span>`
    : group.absentCodes.length
      ? `<div class="settings-pile-absent-codes">${group.absentCodes.map((code) => `<span>${escapeHtml(code)}</span>`).join("")}</div>`
      : `<span class="settings-pile-complete">ครบ</span>`;
  return `
    <div class="settings-pile-absence-group">
      <div><strong>${escapeHtml(group.payGroup)}</strong><small>${group.employeeCount.toLocaleString("th-TH")} คน</small></div>
      ${status}
    </div>
  `;
}

function renderSettingsPileSummary(user, moduleItem) {
  const allRecords = getProductionRecords();
  const dayRecords = allRecords.filter((record) => getRecordDate(record) === settingsPileSummaryDate);
  const records = filterProductionRecordsByFruit(
    dayRecords,
    settingsPileSummaryFruit
  ).sort((a, b) => {
    const pileCompare = Number(a.pile_no || a.pile || 0) - Number(b.pile_no || b.pile || 0);
    return pileCompare || String(a.record_time || "").localeCompare(String(b.record_time || ""));
  });
  const summaries = getDetailedSettingsPileSummaries(records);
  const totalWeight = records.reduce((sum, record) => sum + getRecordTotalWeight(record), 0);
  const totalAmount = records.reduce((sum, record) => sum + Number(record.total_amount || record.grand_total || 0), 0);
  const employeeCount = new Set(records.map((record) => record.employee_id || record.emp_code || record.employee_name).filter(Boolean)).size;
  const employees = getEmployees();
  const employeeById = new Map(employees.map((employee) => [String(employee.id), employee]));
  const employeeByCode = new Map(employees.map((employee) => [String(employee.emp_code || "").trim(), employee]));
  const absenceGroups = getSettingsPileAbsenceGroups(employees, dayRecords);
  const pileConfigs = getFruitPiles();
  const editingPile = pileConfigs.find((pile) => pile.number === Number(editingFruitPileNumber));
  const fruitOptions = [
    { id: "all", label: "ทุกผลไม้" },
    ...productionFruitOptions
      .filter((fruit) => productionFruitFieldLabels[fruit.id])
      .map((fruit) => ({ id: fruit.id, label: fruit.label }))
  ];

  return `
    <section class="settings-pile-page">
      <section class="panel settings-pile-header">
        <div class="settings-pile-title-row">
          <div>
            <p class="eyebrow">FRUIT PILE CONTROL CENTER</p>
            <h2>${escapeHtml(moduleItem.label)}</h2>
            <p>สร้าง จัดสี และควบคุมกองที่จะแสดงในหน้าบันทึกผลผลิต โดยไม่กระทบข้อมูลย้อนหลัง</p>
          </div>
          <div class="settings-pile-export-actions">
            <button class="btn btn-outline" id="settingsPileExportExcel" type="button" ${records.length ? "" : "disabled"}>Export Excel</button>
            <button class="btn btn-primary" id="settingsPileExportPdf" type="button" ${records.length ? "" : "disabled"}>Export PDF</button>
          </div>
        </div>
        <div class="settings-pile-controls">
          <label class="field">
            <span>วันที่ต้องการดู</span>
            <input id="settingsPileDate" type="date" value="${escapeHtml(settingsPileSummaryDate)}" />
          </label>
          <label class="field">
            <span>ผลไม้</span>
            <select id="settingsPileFruit">
              ${fruitOptions.map((fruit) => `<option value="${escapeHtml(fruit.id)}" ${settingsPileSummaryFruit === fruit.id ? "selected" : ""}>${escapeHtml(fruit.label)}</option>`).join("")}
            </select>
          </label>
          <div class="settings-pile-current-filter">
            <span>กำลังแสดง</span>
            <strong>${escapeHtml(settingsPileSummaryDate)}</strong>
            <small>${escapeHtml(settingsPileFruitLabel(settingsPileSummaryFruit))}</small>
          </div>
        </div>
      </section>

      <section class="settings-pile-command-deck">
        <div class="settings-pile-command-copy">
          <span>PILE OPERATIONS</span>
          <h3>ควบคุมกองผลไม้</h3>
          <p>${pileConfigs.filter((pile) => pile.visible).length} กองกำลังแสดง · ${pileConfigs.filter((pile) => !pile.visible).length} กองถูกซ่อน · ประวัติผลผลิตจะไม่ถูกลบ</p>
        </div>
        <button class="settings-pile-create-button" id="openFruitPileForm" type="button">＋ สร้างกองใหม่</button>
      </section>

      ${(fruitPileFormOpen || editingPile) ? `
        <section class="settings-pile-editor" style="--editor-accent:${editingPile?.color || "#0f766e"}">
          <div class="settings-pile-editor-head"><div><span>${editingPile ? "EDIT PILE" : "NEW PILE"}</span><h3>${editingPile ? `แก้ไข ${escapeHtml(editingPile.name)}` : "สร้างกองผลไม้"}</h3></div><button id="closeFruitPileForm" type="button" aria-label="ปิด">×</button></div>
          <form id="fruitPileForm">
            <label><span>หมายเลขกอง</span><input name="number" type="number" min="1" max="99" value="${editingPile?.number || ""}" ${editingPile ? "readonly" : ""} required /></label>
            <label><span>ชื่อที่แสดง</span><input name="name" maxlength="40" value="${escapeHtml(editingPile?.name || "")}" placeholder="เช่น กองมังคุด A" required /></label>
            <label class="settings-pile-color-field"><span>สีกอง</span><input name="color" type="color" value="${editingPile?.color || "#0f766e"}" /><b>${editingPile?.color || "#0f766e"}</b></label>
            <label class="settings-pile-visibility-field"><input name="visible" type="checkbox" ${editingPile?.visible !== false ? "checked" : ""} /><span>แสดงในหน้ากรอกผลผลิต</span></label>
            <button class="btn btn-primary" type="submit">${editingPile ? "บันทึกการแก้ไข" : "สร้างกอง"}</button>
          </form>
        </section>
      ` : ""}

      ${settingsPileSummaryMessage ? `<div class="alert ${settingsPileSummaryMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(settingsPileSummaryMessage)}</div>` : ""}

      <section class="settings-pile-metrics">
        <div><span>น้ำหนักรวม</span><strong>${numberText(totalWeight)} กก.</strong><small>รวมทุกกองตามตัวกรอง</small></div>
        <div><span>ยอดเงินรวม</span><strong>${money(totalAmount)}</strong><small>คำนวณจากรายการจริง</small></div>
        <div><span>จำนวนรายการ</span><strong>${records.length.toLocaleString("th-TH")}</strong><small>รายการในวันที่เลือก</small></div>
        <div><span>พนักงาน</span><strong>${employeeCount.toLocaleString("th-TH")} คน</strong><small>ไม่นับรหัสซ้ำ</small></div>
      </section>

      <section>
        <div class="section-title-row settings-pile-section-title">
          <div><h3>กองที่จัดการอยู่</h3><p class="muted-text">เปลี่ยนชื่อ สี สถานะ หรือลบตัวกองได้โดยข้อมูลผลผลิตเดิมยังอยู่ครบ</p></div>
          <span class="badge badge-success">${pileConfigs.length} กอง</span>
        </div>
        <div class="settings-pile-grid">${summaries.map((summary) => renderSettingsPileCard(summary, settingsPileSummaryFruit)).join("")}</div>
      </section>

      <section class="settings-pile-bottom-grid">
      <section class="table-card settings-pile-detail-card">
        <div class="table-heading">
          <div><strong>รายละเอียดรายการตามกอง</strong><span>${records.length.toLocaleString("th-TH")} รายการ</span></div>
        </div>
        <div class="table-scroll">
          <table class="settings-pile-table">
            <thead>
              <tr><th>กอง</th><th>เวลา</th><th>ผลไม้</th><th>พนักงาน</th><th>รายละเอียดน้ำหนัก</th><th>รวม</th><th>ยอดเงิน</th><th>ผู้บันทึก</th></tr>
            </thead>
            <tbody>
              ${
                records.length
                  ? records.map((record) => {
                      const employee = employeeById.get(String(record.employee_id)) || employeeByCode.get(String(record.emp_code || "").trim());
                      const employeeName = repairLegacyThaiText(employee?.fullname || record.employee_name || "");
                      return `
                        <tr>
                          <td data-label="กอง"><span class="settings-pile-number">กอง ${escapeHtml(record.pile_no || record.pile || "-")}</span></td>
                          <td data-label="เวลา">${escapeHtml(record.record_time || "-")}</td>
                          <td data-label="ผลไม้">${escapeHtml(settingsPileFruitLabel(productionFruitTypeForRecord(record)))}</td>
                          <td data-label="พนักงาน"><strong>${escapeHtml(record.emp_code || "-")}</strong><span class="settings-pile-employee-name">${escapeHtml(employeeName)}</span></td>
                          <td class="settings-pile-weight-detail" data-label="รายละเอียดน้ำหนัก">${escapeHtml(settingsPileRecordBreakdown(record))}</td>
                          <td data-label="รวม"><strong>${numberText(getRecordTotalWeight(record))} กก.</strong></td>
                          <td data-label="ยอดเงิน"><strong>${money(record.total_amount || record.grand_total || 0)}</strong></td>
                          <td data-label="ผู้บันทึก">${escapeHtml(record.created_by || "-")}</td>
                        </tr>
                      `;
                    }).join("")
                  : `<tr><td colspan="8" class="empty-cell">ยังไม่มีข้อมูลผลผลิตในวันที่และผลไม้ที่เลือก</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
      <aside class="panel settings-pile-absence-panel">
        <div class="settings-pile-absence-head">
          <span>ตรวจสอบการมา</span>
          <h3>ผู้ที่ยังไม่มีรายการวันนี้</h3>
          <p>อ้างอิงรายการทุกผลไม้ วันที่ ${escapeHtml(settingsPileSummaryDate)}</p>
        </div>
        <div class="settings-pile-absence-list">${absenceGroups.map(renderSettingsPileAbsenceGroup).join("")}</div>
        <p class="settings-pile-absence-note">แสดงเฉพาะพนักงานสถานะ Active ที่ยังไม่มีรายการบันทึกในวันนี้</p>
      </aside>
      </section>
    </section>
  `;
}

async function exportSettingsPileSummary(user, format) {
  const records = filterProductionRecordsByFruit(
    getProductionRecords().filter((record) => getRecordDate(record) === settingsPileSummaryDate),
    settingsPileSummaryFruit
  );
  if (!records.length) {
    settingsPileSummaryMessage = "ไม่มีข้อมูลในวันที่และผลไม้ที่เลือก จึงยัง Export ไม่ได้";
    settingsPileSummaryMessageType = "error";
    render();
    return;
  }

  const endpoint = format === "excel" ? "production-summary-excel" : "production-summary-pdf";
  settingsPileSummaryMessage = `กำลังสร้างไฟล์ ${format === "excel" ? "Excel" : "PDF"}...`;
  settingsPileSummaryMessageType = "success";
  render();

  try {
    await downloadReport(`${REPORT_API_BASE}/reports/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: settingsPileSummaryDate,
        end_date: settingsPileSummaryDate,
        fruit_type: settingsPileSummaryFruit,
        ...getProductionReportCatalog(),
        printed_by: user?.fullname || "System Admin",
        printed_by_position: getExportPositionLabel(user),
        employees: getEmployees(),
        production_records: records,
        export_sections: { overview: true, piles: true, details: true }
      })
    });
    settingsPileSummaryMessage = `Export ${format === "excel" ? "Excel" : "PDF"} สรุปตามกองวันที่ ${settingsPileSummaryDate} เรียบร้อยแล้ว`;
    settingsPileSummaryMessageType = "success";
    addAuditLog(user, format === "excel" ? "EXPORT_PILE_SUMMARY_EXCEL" : "EXPORT_PILE_SUMMARY_PDF", `Exported pile summary for ${settingsPileSummaryDate}`);
  } catch (error) {
    settingsPileSummaryMessage = `${error instanceof Error ? error.message : "Export ไม่สำเร็จ"} (${REPORT_API_BASE})`;
    settingsPileSummaryMessageType = "error";
  }
  render();
}

function bindSettingsPileSummaryEvents(user) {
  document.querySelector("#openFruitPileForm")?.addEventListener("click", () => {
    editingFruitPileNumber = null;
    fruitPileFormOpen = true;
    render();
  });
  document.querySelector("#closeFruitPileForm")?.addEventListener("click", () => {
    editingFruitPileNumber = null;
    fruitPileFormOpen = false;
    render();
  });
  document.querySelector("#fruitPileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = Number(form.get("number"));
    const piles = getFruitPiles();
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      settingsPileSummaryMessage = "หมายเลขกองต้องเป็นเลข 1-99";
      settingsPileSummaryMessageType = "error";
      render();
      return;
    }
    if (!editingFruitPileNumber && piles.some((pile) => pile.number === number)) {
      settingsPileSummaryMessage = `กองหมายเลข ${number} มีอยู่แล้ว กรุณาแก้ไขกองเดิม`;
      settingsPileSummaryMessageType = "error";
      render();
      return;
    }
    const nextPile = normalizeFruitPile({ number, name: form.get("name"), color: form.get("color"), visible: form.get("visible") === "on" });
    const next = piles.filter((pile) => pile.number !== number);
    next.push(nextPile);
    if (!await saveSharedFruitPiles(next)) return;
    settingsPileSummaryMessage = editingFruitPileNumber ? `บันทึกการแก้ไข ${nextPile.name} แล้ว` : `สร้าง ${nextPile.name} แล้ว ข้อมูลเก่าของกองหมายเลขนี้เชื่อมต่อให้อัตโนมัติ`;
    settingsPileSummaryMessageType = "success";
    addAuditLog(user, editingFruitPileNumber ? "UPDATE_FRUIT_PILE" : "CREATE_FRUIT_PILE", `${nextPile.name} (#${number})`);
    editingFruitPileNumber = null;
    fruitPileFormOpen = false;
    render();
  });
  document.querySelectorAll("[data-pile-edit]").forEach((button) => button.addEventListener("click", () => {
    editingFruitPileNumber = Number(button.dataset.pileEdit);
    fruitPileFormOpen = false;
    render();
  }));
  document.querySelectorAll("[data-pile-toggle]").forEach((button) => button.addEventListener("click", async () => {
    const number = Number(button.dataset.pileToggle);
    const piles = getFruitPiles();
    const target = piles.find((pile) => pile.number === number);
    if (!target) return;
    if (target.visible && piles.filter((pile) => pile.visible).length === 1) {
      settingsPileSummaryMessage = "ต้องเปิดใช้งานอย่างน้อย 1 กอง เพื่อให้ระบบบันทึกผลผลิตทำงานได้";
      settingsPileSummaryMessageType = "error";
      render();
      return;
    }
    target.visible = !target.visible;
    if (!await saveSharedFruitPiles(piles)) return;
    settingsPileSummaryMessage = `${target.name} ${target.visible ? "เปิดแสดงในหน้ากรอกผลผลิตแล้ว" : "ถูกซ่อนจากหน้ากรอกผลผลิตแล้ว"}`;
    settingsPileSummaryMessageType = "success";
    addAuditLog(user, target.visible ? "SHOW_FRUIT_PILE" : "HIDE_FRUIT_PILE", `${target.name} (#${number})`);
    render();
  }));
  document.querySelectorAll("[data-pile-delete]").forEach((button) => button.addEventListener("click", async () => {
    const number = Number(button.dataset.pileDelete);
    const target = fruitPileByNumber(number);
    if (target?.visible && getVisibleFruitPiles().length === 1) {
      settingsPileSummaryMessage = "ลบกองสุดท้ายที่เปิดใช้งานไม่ได้ กรุณาสร้างหรือเปิดกองอื่นก่อน";
      settingsPileSummaryMessageType = "error";
      render();
      return;
    }
    if (!target || !window.confirm(`ลบ ${target.name} ออกจากรายการกอง? ข้อมูลผลผลิตเดิมจะยังอยู่ครบ`)) return;
    if (!await saveSharedFruitPiles(getFruitPiles().filter((pile) => pile.number !== number))) return;
    settingsPileSummaryMessage = `ลบ ${target.name} แล้ว ข้อมูลผลผลิตเดิมยังคงอยู่และพร้อมเชื่อมกลับเมื่อสร้างกอง ${number} ใหม่`;
    settingsPileSummaryMessageType = "success";
    addAuditLog(user, "DELETE_FRUIT_PILE", `${target.name} (#${number}); production history preserved`);
    render();
  }));
  document.querySelector('input[name="color"]')?.addEventListener("input", (event) => {
    const editor = document.querySelector(".settings-pile-editor");
    const label = event.currentTarget.parentElement?.querySelector("b");
    if (editor) editor.style.setProperty("--editor-accent", event.currentTarget.value);
    if (label) label.textContent = event.currentTarget.value;
  });
  document.querySelector("#settingsPileDate")?.addEventListener("change", (event) => {
    settingsPileSummaryDate = event.target.value || localDateInputValue();
    settingsPileSummaryMessage = "";
    render();
  });
  document.querySelector("#settingsPileFruit")?.addEventListener("change", (event) => {
    settingsPileSummaryFruit = event.target.value || "all";
    settingsPileSummaryMessage = "";
    render();
  });
  document.querySelector("#settingsPileExportPdf")?.addEventListener("click", () => {
    exportSettingsPileSummary(user, "pdf");
  });
  document.querySelector("#settingsPileExportExcel")?.addEventListener("click", () => {
    exportSettingsPileSummary(user, "excel");
  });
}

function renderFullSettingsModule(user) {
  const employees = getEmployees();
  const activeEmployees = employees.filter((employee) => employee.status === "Active").length;
  const rates = getWageRates();
  const accounts = getAccountUsers();
  const logs = getAuditLogs();
  const canViewAuditLog = canOpen(user, "audit-log");
  const settingsTiles = [
    { route: "employees", icon: "EM", tone: "green", title: "จัดการพนักงาน", description: "พนักงานเหมาน้ำหนักและพนักงานตามเวลา" },
    { route: "settings-pile-summary", icon: "PL", tone: "orange", title: "กองผลไม้", description: "สร้าง แก้ไขสี ซ่อน และจัดการกอง" },
    { route: "wage-rates", icon: "฿", tone: "blue", title: "อัตราค่าจ้าง", description: "กำหนดอัตราและตรวจสอบประวัติย้อนหลัง" },
    { route: "account-management", icon: "ID", tone: "purple", title: "บัญชีเข้าใช้งาน", description: "สร้างบัญชีและกำหนดสิทธิ์เข้าเว็บ" },
    { route: "audit-log", icon: "LG", tone: "slate", title: "Audit Log", description: "ตรวจสอบกิจกรรมและประวัติระบบ" },
    { route: "backup", icon: "BK", tone: "cyan", title: "สำรองข้อมูล", description: "ส่งออก นำเข้า และดูแลฐานข้อมูล" },
    { route: "pf-desktop-app", icon: "APWS", tone: "green", title: "APWS Desktop", description: "รับข้อมูลชั่งและส่งข้อมูลหลักให้เครื่องชั่ง" }
  ].filter((item) => canOpen(user, item.route));

  return `
    <div class="settings-control-page">
    <section class="panel settings-control-hero">
      <div class="settings-control-head">
        <div>
          <span class="settings-control-eyebrow">ADMIN CONTROL</span>
          <h2>ตั้งค่า</h2>
          <p>ศูนย์ควบคุมข้อมูล พนักงาน บัญชี และระบบ</p>
        </div>
        <span class="settings-control-role">Admin</span>
      </div>
      <div class="settings-control-stats">
        <div><span>พนักงานใช้งาน</span><strong>${activeEmployees.toLocaleString("th-TH")}</strong><small>/ ${employees.length.toLocaleString("th-TH")} คน</small></div>
        <div><span>อัตราค่าจ้าง</span><strong>${rates.length.toLocaleString("th-TH")}</strong><small>รายการ</small></div>
        <div><span>บัญชีระบบ</span><strong>${accounts.length.toLocaleString("th-TH")}</strong><small>บัญชี</small></div>
        ${canViewAuditLog ? `<div><span>Audit Log</span><strong>${logs.length.toLocaleString("th-TH")}</strong><small>รายการ</small></div>` : ""}
      </div>
    </section>

    <section class="panel settings-control-menu">
      <div class="settings-control-menu-head">
        <div><h3>เมนูตั้งค่า</h3><p>เลือกส่วนที่ต้องการจัดการ</p></div>
        <span>${settingsTiles.length.toLocaleString("th-TH")} เมนู</span>
      </div>
      <div class="settings-control-grid">
        ${
          settingsTiles.length
            ? settingsTiles
                .map(
                  (item) =>
                    `<button class="settings-control-tile settings-control-${item.tone}" data-route="${item.route}" type="button"><span class="settings-control-icon">${item.icon}</span><span class="settings-control-copy"><strong>${item.title}</strong><small>${item.description}</small></span><span class="settings-control-arrow" aria-hidden="true">→</span></button>`
                )
                .join("")
            : `<div class="empty-state">ระดับ ${escapeHtml(getUserLevel(user))} ยังไม่มีเมนูตั้งค่าที่เปิดให้ใช้งาน</div>`
        }
      </div>
    </section>
    </div>
  `;
}

function renderPfDesktopApp(user, moduleItem) {
  const catalog = getDesktopCatalogPayload();
  const employees = getEmployees().filter((employee) => employee.status === "Active");
  const canImport = canImportDesktopWeighing(user);
  const preview = canImport ? desktopImportPreview : null;
  return `
    <section class="pf-desktop-page">
      <div class="pf-desktop-hero">
        <div><span class="settings-control-eyebrow">DATA BRIDGE</span><h2>${escapeHtml(moduleItem.label)}</h2><p>ตรวจประวัติชื่อไฟล์และข้อมูลทั้งชุดก่อนรับเข้า การชั่งน้ำหนักเท่ากันภายในไฟล์จะบันทึกครบทุกครั้ง</p></div>
        <span class="pf-desktop-status">พร้อมเชื่อมต่อ</span>
      </div>
      ${desktopImportMessage ? `<div class="alert ${desktopImportMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(desktopImportMessage)}</div>` : ""}
      <div class="pf-desktop-split">
        <section class="panel pf-desktop-zone pf-desktop-receive">
          <div class="pf-desktop-zone-head"><span class="pf-zone-icon">IN</span><div><h3>รับข้อมูลชั่ง</h3><p>ไฟล์ JSON จากเมนู “ส่งออกไปเว็บ / คิดเงิน” ใน Desktop app</p></div></div>
          ${!canImport ? '<div class="alert alert-error">การนำเข้าข้อมูลชั่งใช้สิทธิ์ C6 ขึ้นไป บัญชี C4–C5 ดูและส่งออกข้อมูลหลักได้</div>' : ""}
          <label class="pf-upload-box" for="desktopImportFile"><strong>เลือกไฟล์ pff.weighing.v1</strong><small>รับทุกกองและทุกพนักงานจากไฟล์ · JSON ไม่เกิน 10 MB · ไม่รับข้อมูล Simulation</small><input id="desktopImportFile" type="file" accept="application/json,.json" ${!canImport || desktopImportBusy ? "disabled" : ""} /></label>
          ${preview ? `
            <p>ไฟล์: <strong>${escapeHtml(preview.fileName || "")}</strong></p>
            <div class="pf-import-summary"><div><span>พร้อมนำเข้า</span><strong>${preview.accepted.length.toLocaleString("th-TH")}</strong></div><div><span>ไม่ผ่านตรวจ</span><strong>${preview.rejected.length.toLocaleString("th-TH")}</strong></div><div><span>กองในไฟล์</span><strong>${new Set(preview.accepted.map((record) => record.pile_no)).size.toLocaleString("th-TH")}</strong></div></div>
            ${preview.rejected.length ? `<details class="pf-import-errors"><summary>ดูรายการที่ไม่ผ่าน (${preview.rejected.length})</summary><ul>${preview.rejected.slice(0, 50).map((item) => `<li>แถว ${item.row} · ${escapeHtml(item.id)} — ${escapeHtml(item.reason)}</li>`).join("")}</ul></details>` : ""}
            ${preview.review ? `<div class="alert alert-error"><strong>พักรอตรวจสอบ — ยังไม่ได้รับไฟล์เข้าคิว</strong><ul>${preview.review.matches.map((match) => `<li>ตรงกับ ${escapeHtml(match.file_name)} จำนวน ${match.matched} จาก ${match.total} รายการ (${match.percent}%)</li>`).join("")}</ul><p>หากยืนยัน จะรับทั้งไฟล์ รวมรายการส่วนที่ตรงกับไฟล์เก่าและนับยอดเพิ่มด้วย</p><button class="btn btn-primary" id="desktopImportOverlapConfirm" type="button" ${desktopImportBusy ? "disabled" : ""}>ตรวจสอบแล้ว ยืนยันรับทั้งไฟล์</button><button class="btn btn-outline" id="desktopImportCancel" type="button" ${desktopImportBusy ? "disabled" : ""}>ยกเลิกไฟล์นี้</button></div>` : `<button class="btn btn-primary pf-desktop-main-action" id="desktopImportConfirm" type="button" ${!preview.accepted.length || desktopImportBusy || preview.blocked ? "disabled" : ""}>${desktopImportBusy ? "กำลังตรวจและรับไฟล์..." : `ยืนยันนำเข้า ${preview.accepted.length.toLocaleString("th-TH")} รายการ`}</button>`}
          ` : `<div class="pf-zone-note"><strong>ลำดับการทำงาน</strong><span>เลือกไฟล์ → ระบบแยกกองและพนักงาน → ตรวจผล → ยืนยันเข้าคิว</span></div>`}
          <div class="pf-zone-note"><strong>ตรวจซ้ำทั้งไฟล์</strong><span>เหมือน 100% ไม่รับซ้ำ แม้เปลี่ยนชื่อไฟล์ · ตั้งแต่ 90% พักให้ตรวจสอบ · ต่ำกว่า 90% รับทั้งไฟล์ รวมส่วนที่ตรงกับไฟล์เก่า</span></div>
        </section>

        <section class="panel pf-desktop-zone pf-desktop-send">
          <div class="pf-desktop-zone-head"><span class="pf-zone-icon">OUT</span><div><h3>ส่งข้อมูลหลักให้ Desktop app</h3><p>ให้เครื่องชั่งใช้รหัสชุดเดียวกับเว็บก่อนเริ่มบันทึก</p></div></div>
          <div class="pf-master-list"><div><span>ผลไม้ที่ใช้งาน</span><strong>${catalog.fruits.length.toLocaleString("th-TH")}</strong><small>${catalog.fruits.map((item) => escapeHtml(item.name)).join(" · ")}</small></div><div><span>ประเภทน้ำหนัก</span><strong>${catalog.weighing_types.length.toLocaleString("th-TH")}</strong><small>${catalog.weighing_types.map((item) => escapeHtml(item.name)).join(" · ")}</small></div><div><span>กองผลไม้</span><strong>${catalog.piles.length.toLocaleString("th-TH")}</strong><small>${catalog.piles.map((item) => escapeHtml(item.name)).join(" · ")}</small></div><div><span>รหัสพนักงานใช้งาน</span><strong>${employees.length.toLocaleString("th-TH")}</strong><small>รายชื่อพนักงานเหมาน้ำหนักจากฐานกลาง</small></div></div>
          <div class="pf-desktop-actions"><button class="btn btn-primary" id="desktopExportCatalog" type="button">ดาวน์โหลดผลไม้และประเภทน้ำหนัก</button><button class="btn btn-outline" id="desktopExportEmployees" type="button">ดาวน์โหลดรหัสพนักงาน</button></div>
          <div class="pf-zone-note"><strong>ใช้ที่ Desktop app</strong><span>นำเข้าไฟล์ Catalog และ Employees ที่เมนูรับข้อมูล ก่อนเริ่มชั่ง</span></div>
        </section>
      </div>
    </section>`;
}
function renderAccountManagement(user, moduleItem) {
  const accounts = apiGetAccountUsers(accountSearch);
  const editingAccount = editingAccountUserId
    ? getAccountUsers().find((accountUser) => accountUser.id === editingAccountUserId)
    : null;
  const allAccounts = getAccountUsers();
  const roleUsage = accountRoleOptionsForForm(editingAccount).map((option) => ({
    ...option,
    count: allAccounts.filter((account) => account.role_key === option.key).length
  }));

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge badge-success">HR C4+ / ผู้ดูแลระบบ</span>
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
      <div class="account-role-overview">
        <div class="account-role-overview-copy">
          <strong>ตำแหน่งที่ใช้งานในระบบ</strong>
          <span>Role ใช้ระบุชื่อตำแหน่ง ส่วนสิทธิ์เข้าเมนูควบคุมด้วย Level C1-C6</span>
        </div>
        <div class="account-role-chips">
          ${roleUsage.map((option) => `
            <span class="account-role-chip ${option.isCustom ? "is-custom" : ""}">
              ${escapeHtml(option.label)} <b>${option.count.toLocaleString("th-TH")}</b>
            </span>
          `).join("")}
        </div>
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
  const roleOptions = accountRoleOptionsForForm(accountUser);
  const selectedRoleKey = accountUser?.role_key || "general_staff";
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
          <input name="phone" value="${isEditing ? escapeHtml(accountUser.phone) : ""}" placeholder="${isEditing ? "เว้นว่างเพื่อใช้เบอร์เดิม" : ""}" ${isEditing ? "" : "required"} />
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
          <span>Role / ตำแหน่ง</span>
          <select name="role_key" id="accountRoleSelect" required>
            ${roleOptions
              .map(
                (option) =>
                  `<option value="${escapeHtml(option.key)}" ${selectedRoleKey === option.key ? "selected" : ""}>${escapeHtml(option.label)}${option.isCustom ? " · เพิ่มเอง" : ""}</option>`
              )
              .join("")}
            <option value="${NEW_ACCOUNT_ROLE_KEY}">+ เพิ่มตำแหน่งใหม่...</option>
          </select>
          <small>การเปลี่ยนตำแหน่งจะไม่เปลี่ยนสิทธิ์ Level</small>
        </label>
        <label class="field account-custom-role-field" id="accountCustomRoleField" hidden>
          <span>ชื่อตำแหน่งใหม่</span>
          <input name="custom_role_label" id="accountCustomRoleInput" maxlength="60" placeholder="เช่น หัวหน้าคลังสินค้า" />
          <small>ตำแหน่งนี้จะปรากฏในรายการสำหรับบัญชีถัดไปโดยอัตโนมัติ</small>
        </label>
        <label class="field">
          <span>Level / ระดับสิทธิ์</span>
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
            locked || accountUser.id === currentUser.id || !isTopLevelUser(currentUser)
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
  const roleSelect = document.querySelector("#accountRoleSelect");
  const customRoleField = document.querySelector("#accountCustomRoleField");
  const customRoleInput = document.querySelector("#accountCustomRoleInput");
  const syncCustomRoleField = () => {
    const isAddingRole = roleSelect?.value === NEW_ACCOUNT_ROLE_KEY;
    if (customRoleField) customRoleField.hidden = !isAddingRole;
    if (customRoleInput) {
      customRoleInput.required = isAddingRole;
      if (!isAddingRole) customRoleInput.value = "";
    }
  };
  roleSelect?.addEventListener("change", syncCustomRoleField);
  syncCustomRoleField();

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
      custom_role_label: String(form.get("custom_role_label") || ""),
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
    UPDATE_APPROVED_DEDUCTION: "แก้ไขรายการอนุมัติหักเงิน",
    DELETE_APPROVED_DEDUCTION: "ลบรายการอนุมัติหักเงิน",
    DELETE_DEDUCTION: "ลบรายการหักเงิน",
    APPLY_DEDUCTION_BATCH: "นำรายการหักเงินไปใช้",
    UPDATE_WITHHOLDING_TAX_GROUPS: "ตั้งค่าหัก ณ ที่จ่าย 3%",
    REGISTER_ACCOUNT: "สร้างบัญชีเข้าใช้งาน",
    UPDATE_ACCOUNT: "แก้ไขบัญชีเข้าใช้งาน",
    DELETE_ACCOUNT: "ลบบัญชีเข้าใช้งาน",
    START_SESSION: "เริ่มกองงาน",
    UPDATE_PRODUCTION: "แก้ไขข้อมูลผลผลิต",
    BATCH_UPDATE_PRODUCTION_DATE: "แก้วันที่ผลผลิตหลายรายการ",
    DELETE_PRODUCTION: "ลบข้อมูลผลผลิต",
    UPDATE_TIME_RECORD: "แก้ไขเวลาทำงาน",
    DELETE_TIME_RECORD: "ลบเวลาทำงาน",
    EXPORT_DATABASE_BACKUP: "ส่งออกข้อมูลสำรอง",
    EXPORT_DATABASE_MIGRATION: "ย้ายฐานข้อมูลทั้งหมด",
    IMPORT_DATABASE_BACKUP: "นำเข้าข้อมูลสำรอง",
    BACKUP_CLEAR_MAIN: "Backup และเคลียร์ข้อมูลธุรกรรม",
    BACKUP_CLEAR_QUEUE: "Backup และเคลียร์ประวัติคิว",
    EXPORT_PILE_SUMMARY: "ส่งออกสรุปกอง",
    EXPORT_PILE_SUMMARY_PDF: "ส่งออกสรุปกอง PDF",
    EXPORT_PILE_SUMMARY_EXCEL: "ส่งออกสรุปกอง Excel"
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
        <span class="badge audit-level-badge">เฉพาะ C5-C7</span>
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

const BACKUP_DATA_KEYS = [
  "inbound_fruits",
  "inbound_fruit_prices",
  "inbound_receipts",
  "account_users",
  "employees",
  "time_employees",
  "wage_rates",
  "production_sessions",
  "production_records",
  "time_records",
  "deduction_records",
  "deduction_applications",
  "production_save_queue",
  "production_save_queue_events",
  "time_save_queue",
  "time_save_queue_events",
  "issue_reports",
  "audit_logs",
  "community_posts",
  "secret_messages"
];
const SUPABASE_DATABASE_INCLUDED_BYTES = 8 * 1024 * 1024 * 1024;
const SUPABASE_BANDWIDTH_INCLUDED_BYTES = 250 * 1024 * 1024 * 1024;
const BACKUP_STORAGE_WARNING_PERCENT = 85;

function resetBackupSecurityState() {
  backupUnlocked = false;
  backupAccessCode = "";
  backupActiveTab = "backup";
  backupSnapshot = null;
  backupSnapshotLoading = false;
  backupSelectedFile = null;
  backupSelectedData = null;
  backupFileValidation = null;
  backupRestoreConfirmOpen = false;
  backupClearConfirmOpen = false;
  backupClearScope = "main";
  backupBusy = false;
  backupMessage = "";
}

function backupPayloadData(payload = backupSnapshot) {
  return payload?.data && typeof payload.data === "object" ? payload.data : {};
}

function backupRows(data, key) {
  return Array.isArray(data?.[key]) ? data[key] : [];
}

function backupGroupSummaries(data = backupPayloadData()) {
  return [
    {
      label: "ผลผลิตและเวลาทำงาน",
      detail: "รายการผลิต กองงาน และบันทึกเวลา",
      count:
        backupRows(data, "production_records").length +
        backupRows(data, "production_sessions").length +
        backupRows(data, "time_records").length,
      icon: "ข้อมูล"
    },
    {
      label: "คิวการบันทึก",
      detail: "คิวผลผลิต คิวเวลา สถานะ และเหตุการณ์ตรวจสอบย้อนหลัง",
      count:
        backupRows(data, "production_save_queue").length +
        backupRows(data, "production_save_queue_events").length +
        backupRows(data, "time_save_queue").length +
        backupRows(data, "time_save_queue_events").length,
      icon: "คิว"
    },
    {
      label: "รายงานปัญหาของเว็บ",
      detail: "รายละเอียด สถานะ และภาพหน้าจอที่แนบมากับรายงาน",
      count: backupRows(data, "issue_reports").length,
      icon: "เว็บ"
    },
    {
      label: "รายการหักเงิน อนุมัติ และเบี้ยขยัน",
      detail: "ข้อมูลรายการหักและการอนุมัติครบทั้งวงจร",
      count:
        backupRows(data, "deduction_records").length +
        backupRows(data, "deduction_applications").length,
      icon: "เงิน"
    }
  ];
}

function backupTotalRows(data = backupPayloadData()) {
  return BACKUP_DATA_KEYS.reduce((sum, key) => sum + backupRows(data, key).length, 0);
}

function formatBackupFileSize(bytes) {
  const size = Number(bytes || 0);
  if (size >= 1024 * 1024 * 1024) return `${(size / (1024 * 1024 * 1024)).toLocaleString("th-TH", { maximumFractionDigits: 1 })} GB`;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toLocaleString("th-TH", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.ceil(size / 1024)).toLocaleString("th-TH")} KB`;
}

function getBackupStorageUsage() {
  const serverUsage = backupSnapshot?.storage_usage;
  const usedBytes = Number(serverUsage?.used_bytes) || new Blob([JSON.stringify(backupSnapshot || {})]).size;
  const limitBytes = Number(serverUsage?.limit_bytes) || SUPABASE_DATABASE_INCLUDED_BYTES;
  const warningPercent = Number(serverUsage?.warning_percent) || BACKUP_STORAGE_WARNING_PERCENT;
  const percent = Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100));
  const level = percent >= warningPercent ? "critical" : percent >= 70 ? "watch" : percent >= 45 ? "moderate" : "healthy";
  return {
    usedBytes,
    limitBytes,
    remainingBytes: Math.max(0, limitBytes - usedBytes),
    warningPercent,
    percent,
    level,
    label: level === "critical" ? "ถึงระดับสำรองและเคลียร์" : level === "watch" ? "ใกล้ระดับแจ้งเตือน" : level === "moderate" ? "ใช้งานปานกลาง" : "พื้นที่พร้อมใช้งาน"
  };
}

function renderBackupStorageMeter() {
  const usage = getBackupStorageUsage();
  const displayPercent = usage.percent < 0.1 && usage.usedBytes > 0 ? "< 0.1" : usage.percent.toLocaleString("th-TH", { maximumFractionDigits: 1 });
  const fillPercent = Math.max(usage.percent > 0 ? 1.2 : 0, usage.percent);
  return `
    <section class="backup-storage-card is-${usage.level}" aria-label="สถานะพื้นที่ฐานข้อมูล Supabase">
      <div class="backup-storage-card-head">
        <div>
          <span class="backup-storage-kicker"><i></i> SUPABASE PRO DATABASE</span>
          <h3>สถานะพื้นที่ฐานข้อมูล</h3>
          <p>ติดตามขนาดข้อมูลเทียบพื้นที่ฐานข้อมูล Pro 8 GB</p>
        </div>
        <div class="backup-storage-score"><strong>${displayPercent}%</strong><span>${escapeHtml(usage.label)}</span></div>
      </div>
      <div class="backup-storage-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(usage.percent)}">
        <span class="backup-storage-fill" style="width:${fillPercent}%"></span>
        <i class="backup-storage-threshold" style="left:${usage.warningPercent}%"><b>${usage.warningPercent}%</b></i>
      </div>
      <div class="backup-storage-scale"><span>0</span><span>ระดับเตือน ${usage.warningPercent}%</span><span>${formatBackupFileSize(usage.limitBytes)}</span></div>
      <div class="backup-storage-facts">
        <div><span>ข้อมูลปัจจุบัน</span><strong>${formatBackupFileSize(usage.usedBytes)}</strong></div>
        <div><span>พื้นที่คงเหลือ</span><strong>${formatBackupFileSize(usage.remainingBytes)}</strong></div>
        <div><span>จำนวนข้อมูล</span><strong>${backupTotalRows().toLocaleString("th-TH")} รายการ</strong></div>
      </div>
      <div class="backup-storage-advice">
        <span>${usage.level === "critical" ? "!" : "✓"}</span>
        <p><strong>${usage.level === "critical" ? "ควร Backup / เคลียร์ข้อมูลเก่าแล้ว" : "สถานะยังปลอดภัย"}</strong><small>${usage.level === "critical" ? "ระบบแตะเกณฑ์ 85% ที่กำหนด กรุณาสำรอง ตรวจสอบไฟล์ และเคลียร์ตามขั้นตอน" : `ระบบจะแจ้งเตือนเมื่อข้อมูลถึง ${usage.warningPercent}% หรือประมาณ ${formatBackupFileSize(usage.limitBytes * usage.warningPercent / 100)}`}</small></p>
      </div>
      <small class="backup-storage-note">* เป็นขนาดข้อมูลเชิงตรรกะจาก Snapshot ล่าสุด ไม่รวมดัชนีและ overhead ภายใน PostgreSQL ควรตรวจเทียบ Dashboard เป็นระยะ</small>
    </section>`;
}

function formatBackupDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function getBackupHistory() {
  return getAuditLogs()
    .filter((log) => ["EXPORT_DATABASE_BACKUP", "EXPORT_DATABASE_MIGRATION", "IMPORT_DATABASE_BACKUP", "BACKUP_CLEAR_MAIN", "BACKUP_CLEAR_QUEUE"].includes(String(log.action || "").toUpperCase()))
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 12);
}

function validateBackupPayload(parsed, file) {
  const errors = [];
  const data = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
  const version = Number(parsed?.version || 1);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    errors.push("ไฟล์ไม่มีโครงสร้างข้อมูลสำรองที่รองรับ");
  }
  if (![1, 2, 3].includes(version)) {
    errors.push(`เวอร์ชันไฟล์ ${version} ยังไม่รองรับ`);
  }
  if (Number(file?.size || 0) > 100 * 1024 * 1024) {
    errors.push("ไฟล์มีขนาดเกิน 100 MB");
  }

  const includedKeys = BACKUP_DATA_KEYS.filter((key) => Array.isArray(data?.[key]));
  if (!includedKeys.length) errors.push("ไม่พบชุดข้อมูลที่ระบบรู้จัก");
  includedKeys.forEach((key) => {
    if (data[key].some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
      errors.push(`ข้อมูลในชุด ${key} มีรูปแบบไม่ถูกต้อง`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length ? null : data,
    version,
    includedKeys,
    totalRows: includedKeys.reduce((sum, key) => sum + data[key].length, 0)
  };
}

async function exportDatabaseBackup(accessCode) {
  return cloudApiRequest("/api/backup", {
    headers: { "X-Backup-Code": accessCode }
  });
}

async function verifyBackupAccessCode(accessCode) {
  return cloudApiRequest("/api/backup/verify", {
    headers: { "X-Backup-Code": accessCode },
    timeoutMs: 10000
  });
}

async function exportQueueBackup(accessCode) {
  return cloudApiRequest("/api/backup/queue", {
    headers: { "X-Backup-Code": accessCode }
  });
}

async function exportDatabaseMigration(migrationCode) {
  return cloudApiRequest("/api/backup/migrate", {
    headers: { "X-Migration-Code": migrationCode },
    timeoutMs: 120000
  });
}

async function backupAndClearDatabase(accessCode, scope) {
  return cloudApiRequest("/api/backup/clear", {
    method: "POST",
    headers: { "X-Backup-Code": accessCode },
    body: JSON.stringify({ scope, confirmation: "BACKUP_CLEAR" }),
    timeoutMs: 120000
  });
}

function downloadBackupPayload(backup, scope = "main") {
  const content = JSON.stringify(backup, null, 2);
  const timestamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
  const scopeLabel = scope === "queue" ? "production-queue" : scope === "migration" ? "full-database-migration" : "operations";
  downloadTextFile(`pismai-${scopeLabel}-backup-${timestamp}.json`, content, "application/json;charset=utf-8");
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

function renderBackupPasswordGate(user, moduleItem) {
  return `
    <section class="backup-gate" aria-labelledby="backupGateTitle">
      <div class="backup-gate-assurance">
        <div class="backup-progress" aria-label="ขั้นตอนเข้าสู่เมนูสำรองข้อมูล">
          <span>ตั้งค่า</span><i></i><strong>สำรองข้อมูล</strong><i></i><span>ยืนยันสิทธิ์</span>
        </div>
        <div class="backup-gate-copy">
          <p class="eyebrow">SECURE DATABASE ACCESS</p>
          <h2 id="backupGateTitle">ยืนยันก่อนเข้าสำรองข้อมูล</h2>
          <p>ไฟล์สำรองมีข้อมูลสำคัญขององค์กร ระบบจึงต้องตรวจสอบสิทธิ์ก่อนเปิดเครื่องมือจัดการฐานข้อมูล</p>
        </div>
        <div class="backup-assurance-list">
          <div><span class="backup-assurance-icon">✓</span><div><strong>เชื่อมต่อฐานข้อมูลส่วนกลาง</strong><small>ตรวจสอบรหัสกับระบบ Backup บนเซิร์ฟเวอร์โดยตรง</small></div></div>
          <div><span class="backup-assurance-icon">✓</span><div><strong>บันทึกผู้ดำเนินการทุกครั้ง</strong><small>การสร้างไฟล์และ Import จะถูกบันทึกใน Audit Log</small></div></div>
        </div>
      </div>
      <div class="backup-gate-auth">
        <div>
          <span class="backup-security-mark">ข้อมูลส่วนกลาง</span>
          <h3>รหัสผ่านสำรองข้อมูล</h3>
          <p>กรอกรหัส 4 หลักเพื่อเข้าสู่เมนูสำรองข้อมูล</p>
        </div>
        ${backupMessage ? `<div class="backup-inline-message ${backupMessageType === "error" ? "is-error" : "is-success"}" role="alert">${escapeHtml(backupMessage)}</div>` : ""}
        <form id="backupGateForm" class="backup-gate-form">
          <label>
            <span>รหัสรักษาความปลอดภัย</span>
            <div class="backup-password-control">
              <input id="backupGateCode" name="backupGateCode" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••" aria-label="รหัสสำรองข้อมูล 4 หลัก" />
              <button id="backupTogglePassword" type="button" title="แสดงหรือซ่อนรหัส" aria-label="แสดงหรือซ่อนรหัส">◉</button>
            </div>
          </label>
          <button class="btn btn-primary backup-gate-submit" type="submit" ${backupBusy ? "disabled" : ""}>${backupBusy ? "กำลังตรวจสอบ..." : "เข้าสู่เมนูสำรองข้อมูล"}</button>
        </form>
        <button class="btn btn-outline backup-gate-back" data-route="settings" type="button">← กลับหน้าตั้งค่า</button>
        <div class="backup-connection-line"><span></span> ระบบพร้อมตรวจสอบกับ Supabase</div>
        <div class="backup-gate-user"><strong>${escapeHtml(user?.fullname || user?.username || "ผู้ดูแลระบบ")}</strong><span>${escapeHtml(getUserLevel(user))}</span></div>
      </div>
    </section>
  `;
}

function renderBackupOverview(user) {
  const groups = backupGroupSummaries();
  const estimatedBytes = new Blob([JSON.stringify(backupSnapshot || {})]).size;
  const canClear = canManageAllProductionRecords(user);
  return `
    ${renderBackupStorageMeter()}
    <section class="backup-workspace-grid">
      <div class="backup-primary-workspace">
        <div class="backup-section-heading">
          <div class="backup-section-icon">⇩</div>
          <div><h3>สร้างไฟล์สำรองใหม่</h3><p>รวบรวมข้อมูลล่าสุดจาก Supabase เป็นไฟล์ JSON สำหรับกู้คืนผ่านระบบนี้</p></div>
        </div>
        <div class="backup-dataset-list">
          ${groups.map((group) => `
            <div class="backup-dataset-row">
              <span class="backup-dataset-icon">${escapeHtml(group.icon)}</span>
              <div><strong>${escapeHtml(group.label)}</strong><small>${escapeHtml(group.detail)}</small></div>
              <b>${group.count.toLocaleString("th-TH")} รายการ</b>
              <span class="backup-ready">พร้อม</span>
            </div>
          `).join("")}
        </div>
        <div class="backup-download-bar">
          <div><span>ขนาดไฟล์โดยประมาณ</span><strong>${formatBackupFileSize(estimatedBytes)}</strong><small>${backupTotalRows().toLocaleString("th-TH")} รายการจากฐานข้อมูลกลาง</small></div>
          <div class="backup-action-buttons">
            <button class="btn btn-primary" id="exportBackup" type="button" ${backupBusy ? "disabled" : ""}>${backupBusy ? "กำลังสร้างไฟล์..." : "Backup"}</button>
            <button class="btn backup-clear-button" data-open-backup-clear="main" type="button" ${backupBusy || !canClear ? "disabled" : ""}>Backup / เคลียร์</button>
            <button class="btn btn-outline" id="exportDatabaseMigration" type="button" ${backupBusy ? "disabled" : ""}>ย้ายฐานข้อมูล</button>
          </div>
        </div>
        <div class="backup-warning">Backup จะดาวน์โหลดเฉพาะผลผลิต เวลาทำงาน คิว รายการหัก/อนุมัติ/เบี้ยขยัน และรายงานปัญหา ส่วน Backup / เคลียร์ จะดาวน์โหลดชุดเดียวกันแล้วลบออก โดยจะเก็บบัญชีผู้ใช้ พนักงาน อัตราค่าจ้าง และ Audit Log ไว้เสมอ ปุ่มย้ายฐานข้อมูลเท่านั้นที่ส่งออกข้อมูลทั้งหมด</div>
      </div>
      ${renderBackupStatusRail()}
    </section>
  `;
}

function renderQueueBackupOverview(user) {
  const data = backupPayloadData();
  const queues = backupRows(data, "production_save_queue");
  const events = backupRows(data, "production_save_queue_events");
  const clearable = queues.filter((row) => ["succeeded", "cancelled"].includes(String(row.status || ""))).length;
  const protectedCount = queues.length - clearable;
  const canClear = canManageAllProductionRecords(user);
  return `
    <section class="backup-workspace-grid">
      <div class="backup-primary-workspace">
        <div class="backup-section-heading">
          <div class="backup-section-icon">คิว</div>
          <div><h3>สำรองประวัติคิวการบันทึก</h3><p>เก็บรายการคิว สถานะ เหตุการณ์ ผู้บันทึก และเลขรายการผลผลิตจริงสำหรับตรวจสอบย้อนหลัง</p></div>
        </div>
        <div class="backup-queue-summary">
          <div><span>คิวทั้งหมด</span><strong>${queues.length.toLocaleString("th-TH")}</strong><small>รายการ</small></div>
          <div><span>เหตุการณ์ในคิว</span><strong>${events.length.toLocaleString("th-TH")}</strong><small>เหตุการณ์</small></div>
          <div><span>เคลียร์ได้</span><strong>${clearable.toLocaleString("th-TH")}</strong><small>สำเร็จ/ยกเลิก</small></div>
          <div><span>ระบบจะเก็บไว้</span><strong>${protectedCount.toLocaleString("th-TH")}</strong><small>คิวยังไม่จบ</small></div>
        </div>
        <div class="backup-download-bar">
          <div><span>ขอบเขตไฟล์</span><strong>ประวัติคิวทั้งหมด</strong><small>การเคลียร์ไม่กระทบข้อมูลจริงใน production_records</small></div>
          <div class="backup-action-buttons">
            <button class="btn btn-primary" id="exportQueueBackup" type="button" ${backupBusy ? "disabled" : ""}>${backupBusy ? "กำลังสร้างไฟล์..." : "Backup"}</button>
            <button class="btn backup-clear-button" data-open-backup-clear="queue" type="button" ${backupBusy || !clearable || !canClear ? "disabled" : ""}>Backup / เคลียร์</button>
          </div>
        </div>
        <div class="backup-warning">คิวรอ คิวกำลังบันทึก คิวต้องตรวจสอบ และคิวล้มเหลวจะไม่ถูกลบ แม้เลือก Backup / เคลียร์</div>
      </div>
      ${renderBackupStatusRail()}
    </section>`;
}

function renderBackupImport() {
  const validation = backupFileValidation;
  const hasFile = Boolean(backupSelectedFile);
  return `
    <section class="backup-workspace-grid">
      <div class="backup-primary-workspace">
        <div class="backup-section-heading">
          <div class="backup-section-icon">⇧</div>
          <div><h3>Import และกู้คืนข้อมูล</h3><p>นำไฟล์สำรอง JSON กลับเข้าสู่ฐานข้อมูลส่วนกลาง โดยตรวจสอบไฟล์ก่อนทุกครั้ง</p></div>
        </div>
        <label class="backup-dropzone ${hasFile ? "has-file" : ""}" id="backupDropzone" for="importBackupFile">
          <span class="backup-upload-icon">⇧</span>
          <strong>${hasFile ? "เปลี่ยนไฟล์สำรอง" : "เลือกไฟล์สำรอง .JSON"}</strong>
          <small>ลากไฟล์มาวาง หรือกดเพื่อเลือกไฟล์ ขนาดไม่เกิน 100 MB</small>
        </label>
        <input id="importBackupFile" type="file" accept="application/json,.json" hidden />
        ${hasFile ? `
          <div class="backup-selected-file ${validation?.valid ? "is-valid" : "is-invalid"}">
            <span class="backup-file-icon">JSON</span>
            <div><strong>${escapeHtml(backupSelectedFile.name)}</strong><small>${formatBackupFileSize(backupSelectedFile.size)} · เวอร์ชัน ${validation?.version || "-"}</small></div>
            <b>${validation?.valid ? "ไฟล์ถูกต้อง" : "ตรวจไม่ผ่าน"}</b>
          </div>
          <div class="backup-validation-list">
            <div><span>${validation?.includedKeys?.length ? "✓" : "!"}</span><strong>รูปแบบไฟล์และเวอร์ชัน</strong><b>${validation?.includedKeys?.length ? "ผ่าน" : "ไม่ผ่าน"}</b></div>
            <div><span>${validation?.valid ? "✓" : "!"}</span><strong>จำนวนชุดข้อมูล</strong><b>${validation?.includedKeys?.length || 0} ชุด</b></div>
            <div><span>${validation?.valid ? "✓" : "!"}</span><strong>ความสมบูรณ์ของข้อมูล</strong><b>${validation?.valid ? `${validation.totalRows.toLocaleString("th-TH")} รายการ` : "ไม่ผ่าน"}</b></div>
          </div>
          ${validation?.errors?.length ? `<div class="backup-validation-errors">${validation.errors.map((error) => `<span>${escapeHtml(error)}</span>`).join("")}</div>` : ""}
          <div class="backup-import-actions">
            <button class="btn btn-outline" id="recheckBackupFile" type="button">ตรวจสอบไฟล์อีกครั้ง</button>
            <button class="btn backup-restore-button" id="openBackupRestoreConfirm" type="button" ${validation?.valid && !backupBusy ? "" : "disabled"}>เริ่มกู้คืนข้อมูล</button>
          </div>
        ` : `<div class="backup-import-empty">ยังไม่ได้เลือกไฟล์ ระบบจะไม่เปิดการกู้คืนจนกว่าไฟล์จะผ่านการตรวจสอบ</div>`}
        <div class="backup-warning is-danger">การ Import จะเขียนทับข้อมูลที่มี ID เดียวกัน ระบบจะให้กรอกรหัสยืนยันอีกครั้งก่อนดำเนินการ</div>
      </div>
      ${renderBackupStatusRail()}
    </section>
  `;
}

function renderBackupHistory() {
  const history = getBackupHistory();
  return `
    <section class="backup-history-panel">
      <div class="backup-section-heading">
        <div class="backup-section-icon">◷</div>
        <div><h3>ประวัติการสำรองและกู้คืน</h3><p>แสดงกิจกรรม Backup และ Import ที่บันทึกไว้ใน Audit Log</p></div>
      </div>
      <div class="backup-history-table-wrap">
        <table class="backup-history-table">
          <thead><tr><th>วันที่และเวลา</th><th>การดำเนินการ</th><th>ผู้ดำเนินการ</th><th>รายละเอียด</th><th>สถานะ</th></tr></thead>
          <tbody>
            ${history.length ? history.map((log) => `
              <tr>
                <td data-label="วันที่และเวลา">${escapeHtml(formatBackupDateTime(log.created_at))}</td>
                <td data-label="การดำเนินการ"><strong>${escapeHtml(getAuditLogActionLabel(log.action))}</strong></td>
                <td data-label="ผู้ดำเนินการ">${escapeHtml(log.user_fullname || log.created_by || log.username || "-")}</td>
                <td data-label="รายละเอียด">${escapeHtml(log.detail || "-")}</td>
                <td data-label="สถานะ"><span class="backup-ready">สำเร็จ</span></td>
              </tr>
            `).join("") : `<tr><td class="empty-cell" colspan="5">ยังไม่มีประวัติ Backup หรือ Import</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderBackupStatusRail() {
  const history = getBackupHistory();
  const latestExport = history.find((log) => ["EXPORT_DATABASE_BACKUP", "BACKUP_CLEAR_MAIN", "BACKUP_CLEAR_QUEUE"].includes(String(log.action).toUpperCase()));
  const latestImport = history.find((log) => String(log.action).toUpperCase() === "IMPORT_DATABASE_BACKUP");
  return `
    <aside class="backup-status-rail">
      <h3>สถานะระบบ</h3>
      <div class="backup-status-item"><span class="backup-status-icon">DB</span><div><strong>การเชื่อมต่อฐานข้อมูล</strong><small>Supabase (Primary)</small><b>● เชื่อมต่อปกติ</b></div></div>
      <div class="backup-status-item"><span class="backup-status-icon">◷</span><div><strong>สำรองข้อมูลล่าสุด</strong><small>${latestExport ? formatBackupDateTime(latestExport.created_at) : "ยังไม่มีประวัติในเครื่องนี้"}</small><b>${latestExport ? "● สำเร็จ" : "รอการสำรอง"}</b></div></div>
      <div class="backup-status-item"><span class="backup-status-icon">✓</span><div><strong>การตรวจสอบไฟล์</strong><small>${backupSelectedFile ? backupSelectedFile.name : "ยังไม่ได้เลือกไฟล์"}</small><b>${backupFileValidation?.valid ? "● ผ่าน" : "รอตรวจสอบ"}</b></div></div>
      <div class="backup-recent-activity">
        <h4>กิจกรรมล่าสุด</h4>
        ${history.slice(0, 2).map((log) => `<div><span></span><p><strong>${escapeHtml(getAuditLogActionLabel(log.action))}</strong><small>${escapeHtml(formatBackupDateTime(log.created_at))}</small></p></div>`).join("") || `<p class="muted-text">ยังไม่มีกิจกรรมล่าสุด</p>`}
        ${latestImport ? `<small class="backup-last-import">Import ล่าสุด ${escapeHtml(formatBackupDateTime(latestImport.created_at))}</small>` : ""}
      </div>
    </aside>
  `;
}

function renderBackupRestoreConfirm() {
  if (!backupRestoreConfirmOpen) return "";
  return `
    <div class="backup-modal-backdrop" role="presentation">
      <section class="backup-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="backupConfirmTitle">
        <span class="backup-confirm-icon">!</span>
        <h3 id="backupConfirmTitle">ยืนยันการกู้คืนข้อมูล</h3>
        <p>ข้อมูลจาก <strong>${escapeHtml(backupSelectedFile?.name || "ไฟล์สำรอง")}</strong> จะถูกเขียนกลับเข้าสู่ Supabase โปรดกรอกรหัส 4 หลักอีกครั้ง</p>
        <form id="backupRestoreConfirmForm">
          <label><span>รหัสยืนยัน</span><input id="backupRestoreCode" name="backupRestoreCode" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••" /></label>
          <div class="backup-confirm-actions">
            <button class="btn btn-outline" id="cancelBackupRestore" type="button">ยกเลิก</button>
            <button class="btn backup-restore-button" type="submit" ${backupBusy ? "disabled" : ""}>${backupBusy ? "กำลังกู้คืน..." : "ยืนยันและกู้คืนข้อมูล"}</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderBackupClearConfirm() {
  if (!backupClearConfirmOpen) return "";
  const queueScope = backupClearScope === "queue";
  return `
    <div class="backup-modal-backdrop" role="presentation">
      <section class="backup-confirm-modal backup-clear-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="backupClearConfirmTitle">
        <span class="backup-confirm-icon">!</span>
        <h3 id="backupClearConfirmTitle">ยืนยัน Backup / เคลียร์${queueScope ? "ประวัติคิว" : "ข้อมูลธุรกรรม"}</h3>
        <p>${queueScope
          ? "ระบบจะสร้างไฟล์ เก็บสำเนา Private และตรวจสอบก่อนลบเฉพาะคิวที่สำเร็จหรือยกเลิกแล้ว ข้อมูลผลผลิตจริงจะไม่ถูกลบ"
          : "ระบบจะสำรองเฉพาะผลผลิต เวลา รายการหัก/อนุมัติ/เบี้ยขยัน คิว และรายงานปัญหา ก่อนลบข้อมูลชุดนี้ โดยเก็บบัญชี พนักงาน อัตราค่าจ้าง การตั้งค่า และ Audit Log ไว้"}</p>
        <div class="backup-clear-safety-list">
          <span>1. สร้าง Snapshot พร้อม checksum</span>
          <span>2. เก็บและตรวจสอบ Private Archive</span>
          <span>3. ลบเฉพาะ ID ที่อยู่ใน Snapshot</span>
        </div>
        <form id="backupClearConfirmForm">
          <input type="hidden" name="scope" value="${backupClearScope}" />
          <label><span>รหัส Backup 4 หลัก</span><input id="backupClearCode" name="backupClearCode" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••" required /></label>
          <label class="backup-clear-checkbox"><input name="accepted" type="checkbox" value="yes" required /><span>ยืนยันว่าได้อ่านขอบเขตข้อมูลที่จะเคลียร์แล้ว</span></label>
          <div class="backup-confirm-actions">
            <button class="btn btn-outline" id="cancelBackupClear" type="button">ยกเลิก</button>
            <button class="btn backup-clear-button" type="submit" ${backupBusy ? "disabled" : ""}>${backupBusy ? "กำลังสำรองและตรวจสอบ..." : "ยืนยัน Backup / เคลียร์"}</button>
          </div>
        </form>
      </section>
    </div>`;
}

function renderBackupModule(user, moduleItem) {
  if (!backupUnlocked) return renderBackupPasswordGate(user, moduleItem);
  const latestExport = getBackupHistory().find((log) => ["EXPORT_DATABASE_BACKUP", "BACKUP_CLEAR_MAIN", "BACKUP_CLEAR_QUEUE"].includes(String(log.action).toUpperCase()));
  return `
    <section class="backup-center">
      <header class="backup-center-header">
        <div>
          <p class="eyebrow">DATABASE PROTECTION</p>
          <h2>ศูนย์สำรองข้อมูล</h2>
        </div>
        <div class="backup-center-meta">
          <span class="backup-live-status"><i></i> เชื่อมต่อ Supabase แล้ว</span>
          <span><b>สำรองข้อมูลล่าสุด</b>${latestExport ? formatBackupDateTime(latestExport.created_at) : "ยังไม่มีประวัติ"}</span>
        </div>
      </header>
      <nav class="backup-tabs" aria-label="เครื่องมือสำรองข้อมูล">
        <button class="${backupActiveTab === "backup" ? "active" : ""}" data-backup-tab="backup" type="button">▱ สำรองข้อมูล</button>
        <button class="${backupActiveTab === "queue" ? "active" : ""}" data-backup-tab="queue" type="button">คิวการบันทึก</button>
        <button class="${backupActiveTab === "import" ? "active" : ""}" data-backup-tab="import" type="button">↻ Import / กู้คืนข้อมูล</button>
        <button class="${backupActiveTab === "history" ? "active" : ""}" data-backup-tab="history" type="button">◷ ประวัติ</button>
      </nav>
      ${backupMessage ? `<div class="backup-inline-message ${backupMessageType === "error" ? "is-error" : "is-success"}" role="alert">${escapeHtml(backupMessage)}</div>` : ""}
      ${backupSnapshotLoading ? `<div class="backup-sync-status" role="status"><span></span><div><strong>เข้าสู่เมนูแล้ว</strong><small>กำลังโหลดตัวเลขสรุปล่าสุดจาก Supabase เบื้องหลัง</small></div></div>` : ""}
      ${backupActiveTab === "backup" ? renderBackupOverview(user) : backupActiveTab === "queue" ? renderQueueBackupOverview(user) : backupActiveTab === "import" ? renderBackupImport() : renderBackupHistory()}
    </section>
    ${renderBackupRestoreConfirm()}
    ${renderBackupClearConfirm()}
  `;
}

async function processBackupFile(file) {
  backupSelectedFile = file || null;
  backupSelectedData = null;
  backupFileValidation = null;
  backupMessage = "";
  if (!file) {
    render();
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    backupFileValidation = validateBackupPayload(parsed, file);
    backupSelectedData = backupFileValidation.valid ? backupFileValidation.data : null;
    if (!backupFileValidation.valid) setBackupMessage("ไฟล์สำรองไม่ผ่านการตรวจสอบ กรุณาตรวจสอบรายละเอียด", "error");
  } catch (_error) {
    backupFileValidation = { valid: false, errors: ["ไม่สามารถอ่านไฟล์ JSON ได้"], includedKeys: [], totalRows: 0, version: "-" };
    setBackupMessage("ไฟล์ที่เลือกไม่ใช่ JSON ที่ถูกต้อง", "error");
  }
  render();
}

async function refreshAppDataAfterRestore() {
  await Promise.all([
    bootstrapLiveStateFromCloud(),
    hydrateAccountsFromCloud(),
    hydrateWageRatesFromCloud(),
    bootstrapEmployeesWithCloud(),
    hydrateDeductionsFromCloud(),
    hydrateDeductionApplicationsFromCloud()
  ]);
}

function bindBackupEvents(user) {
  const gateCodeInput = document.querySelector("#backupGateCode");
  gateCodeInput?.addEventListener("input", () => {
    gateCodeInput.value = gateCodeInput.value.replace(/\D/g, "").slice(0, 4);
  });
  document.querySelector("#backupTogglePassword")?.addEventListener("click", () => {
    if (!gateCodeInput) return;
    gateCodeInput.type = gateCodeInput.type === "password" ? "text" : "password";
    gateCodeInput.focus();
  });
  document.querySelector("#backupGateForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("backupGateCode") || "");
    if (code.length !== 4) {
      setBackupMessage("กรุณากรอกรหัสสำรองข้อมูลให้ครบ 4 หลัก", "error");
      render();
      return;
    }
    backupBusy = true;
    backupMessage = "";
    render();
    try {
      await verifyBackupAccessCode(code);
      backupAccessCode = code;
      backupUnlocked = true;
      backupBusy = false;
      backupSnapshotLoading = true;
      render();
      exportDatabaseBackup(code)
        .then((snapshot) => {
          if (!backupUnlocked || backupAccessCode !== code) return;
          backupSnapshot = snapshot;
          backupSnapshotLoading = false;
          render();
        })
        .catch((error) => {
          if (!backupUnlocked || backupAccessCode !== code) return;
          backupSnapshotLoading = false;
          setBackupMessage(error instanceof Error ? `เข้าสู่เมนูแล้ว แต่โหลดข้อมูลสรุปไม่สำเร็จ: ${error.message}` : "เข้าสู่เมนูแล้ว แต่โหลดข้อมูลสรุปไม่สำเร็จ", "error");
          render();
        });
    } catch (error) {
      backupBusy = false;
      setBackupMessage(error?.status === 403 ? "รหัสสำรองข้อมูลไม่ถูกต้อง" : error instanceof Error ? error.message : "ไม่สามารถตรวจสอบสิทธิ์ได้", "error");
      render();
    }
  });

  document.querySelectorAll("[data-backup-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      backupActiveTab = button.dataset.backupTab || "backup";
      backupMessage = "";
      backupRestoreConfirmOpen = false;
      backupClearConfirmOpen = false;
      render();
    });
  });

  document.querySelector("#exportBackup")?.addEventListener("click", async () => {
    backupBusy = true;
    backupMessage = "";
    render();
    try {
      const backup = await exportDatabaseBackup(backupAccessCode);
      backupSnapshot = backup;
      downloadBackupPayload(backup, "main");
      addAuditLog(user, "EXPORT_DATABASE_BACKUP", `Exported ${backupTotalRows(backupPayloadData(backup))} Supabase rows`);
      backupBusy = false;
      setBackupMessage("สร้างและดาวน์โหลดไฟล์สำรองเรียบร้อยแล้ว");
      render();
    } catch (error) {
      backupBusy = false;
      if (error?.status === 403) resetBackupSecurityState();
      setBackupMessage(error instanceof Error ? error.message : "สร้างไฟล์สำรองไม่สำเร็จ", "error");
      render();
    }
  });

  document.querySelector("#exportDatabaseMigration")?.addEventListener("click", async () => {
    const migrationCode = window.prompt("กรอกรหัสย้ายฐานข้อมูล 4 หลัก");
    if (migrationCode === null) return;
    if (!/^\d{4}$/.test(migrationCode)) {
      setBackupMessage("กรุณากรอกรหัสย้ายฐานข้อมูลให้ครบ 4 หลัก", "error");
      render();
      return;
    }
    backupBusy = true;
    backupMessage = "";
    render();
    try {
      const backup = await exportDatabaseMigration(migrationCode);
      downloadBackupPayload(backup, "migration");
      addAuditLog(user, "EXPORT_DATABASE_MIGRATION", `Exported full database migration (${backup?.total_rows || 0} rows)`);
      backupBusy = false;
      setBackupMessage("สร้างและดาวน์โหลดไฟล์ย้ายฐานข้อมูลทั้งหมดเรียบร้อยแล้ว");
    } catch (error) {
      backupBusy = false;
      setBackupMessage(error?.status === 403 ? "รหัสย้ายฐานข้อมูลไม่ถูกต้อง" : error instanceof Error ? error.message : "สร้างไฟล์ย้ายฐานข้อมูลไม่สำเร็จ", "error");
    }
    render();
  });

  document.querySelector("#exportQueueBackup")?.addEventListener("click", async () => {
    backupBusy = true;
    backupMessage = "";
    render();
    try {
      const backup = await exportQueueBackup(backupAccessCode);
      downloadBackupPayload(backup, "queue");
      addAuditLog(user, "EXPORT_DATABASE_BACKUP", `Exported ${backupTotalRows(backupPayloadData(backup))} queue rows`);
      backupBusy = false;
      setBackupMessage("สร้างและดาวน์โหลดไฟล์สำรองคิวเรียบร้อยแล้ว");
    } catch (error) {
      backupBusy = false;
      if (error?.status === 403) resetBackupSecurityState();
      setBackupMessage(error instanceof Error ? error.message : "สร้างไฟล์สำรองคิวไม่สำเร็จ", "error");
    }
    render();
  });

  document.querySelectorAll("[data-open-backup-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      backupClearScope = button.dataset.openBackupClear === "queue" ? "queue" : "main";
      backupClearConfirmOpen = true;
      backupMessage = "";
      render();
      window.setTimeout(() => document.querySelector("#backupClearCode")?.focus(), 0);
    });
  });

  document.querySelector("#cancelBackupClear")?.addEventListener("click", () => {
    backupClearConfirmOpen = false;
    render();
  });

  const backupClearCode = document.querySelector("#backupClearCode");
  backupClearCode?.addEventListener("input", () => {
    backupClearCode.value = backupClearCode.value.replace(/\D/g, "").slice(0, 4);
  });

  document.querySelector("#backupClearConfirmForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("backupClearCode") || "");
    const scope = form.get("scope") === "queue" ? "queue" : "main";
    if (code.length !== 4 || form.get("accepted") !== "yes") {
      setBackupMessage("กรุณากรอกรหัสและยืนยันขอบเขตการเคลียร์ข้อมูล", "error");
      render();
      return;
    }
    backupBusy = true;
    backupClearConfirmOpen = true;
    backupMessage = "";
    render();
    try {
      const result = await backupAndClearDatabase(code, scope);
      if (!result?.backup || !result?.archive?.verified) {
        throw new Error("เซิร์ฟเวอร์ไม่ได้ยืนยัน Private Archive จึงไม่สามารถรับรองการเคลียร์ข้อมูลได้");
      }
      downloadBackupPayload(result.backup, scope);
      backupClearConfirmOpen = false;
      backupBusy = false;
      if (result.clear_complete && result.audit_saved) {
        setBackupMessage(`Backup / เคลียร์สำเร็จ ลบข้อมูลที่สำรองแล้ว ${Object.values(result.cleared || {}).reduce((sum, value) => sum + Number(value || 0), 0).toLocaleString("th-TH")} รายการ`);
      } else if (result.clear_complete) {
        setBackupMessage("Backup และเคลียร์สำเร็จ พร้อมเก็บ Private Archive แล้ว แต่บันทึก Audit Log ไม่สำเร็จ กรุณาแจ้งผู้ดูแลระบบ", "error");
      } else {
        setBackupMessage(`ไฟล์และ Private Archive ถูกสร้างแล้ว แต่เคลียร์ได้ไม่ครบ กรุณาตรวจ Audit Log และอย่ากดซ้ำ`, "error");
      }
      backupSnapshot = await exportDatabaseBackup(backupAccessCode);
      await refreshAppDataAfterRestore();
      await refreshProductionQueue({ renderAfter: false });
    } catch (error) {
      backupBusy = false;
      backupClearConfirmOpen = false;
      if (error?.status === 403) resetBackupSecurityState();
      const stoppedBeforeClear = ["snapshot", "archive_upload", "archive_verify"].includes(error?.data?.stage);
      setBackupMessage(
        stoppedBeforeClear
          ? `${error instanceof Error ? error.message : "Backup / เคลียร์ไม่สำเร็จ"} ระบบหยุดก่อนเริ่มลบข้อมูล`
          : `${error instanceof Error ? error.message : "ยังยืนยันผล Backup / เคลียร์ไม่ได้"} กรุณาตรวจประวัติ Backup หรือ Private Archive ก่อน และอย่ากดซ้ำ`,
        "error"
      );
    }
    render();
  });

  document.querySelector("#importBackupFile")?.addEventListener("change", (event) => {
    processBackupFile(event.target.files?.[0] || null);
  });
  const dropzone = document.querySelector("#backupDropzone");
  dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("is-dragging"));
  dropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
    processBackupFile(event.dataTransfer?.files?.[0] || null);
  });
  document.querySelector("#recheckBackupFile")?.addEventListener("click", () => processBackupFile(backupSelectedFile));
  document.querySelector("#openBackupRestoreConfirm")?.addEventListener("click", () => {
    if (!backupFileValidation?.valid || !backupSelectedData) return;
    backupRestoreConfirmOpen = true;
    backupMessage = "";
    render();
  });
  document.querySelector("#cancelBackupRestore")?.addEventListener("click", () => {
    backupRestoreConfirmOpen = false;
    render();
  });
  const restoreCodeInput = document.querySelector("#backupRestoreCode");
  restoreCodeInput?.addEventListener("input", () => {
    restoreCodeInput.value = restoreCodeInput.value.replace(/\D/g, "").slice(0, 4);
  });
  document.querySelector("#backupRestoreConfirmForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const confirmationCode = String(new FormData(event.currentTarget).get("backupRestoreCode") || "");
    if (confirmationCode.length !== 4) {
      setBackupMessage("กรุณากรอกรหัสยืนยันให้ครบ 4 หลัก", "error");
      backupRestoreConfirmOpen = false;
      render();
      return;
    }
    backupBusy = true;
    render();
    try {
      const result = await restoreDatabaseBackup(confirmationCode, { data: backupSelectedData });
      addAuditLog(user, "IMPORT_DATABASE_BACKUP", `Imported ${backupSelectedFile?.name || "backup file"} (${backupFileValidation.totalRows} rows)`);
      await refreshAppDataAfterRestore();
      backupSnapshot = await exportDatabaseBackup(backupAccessCode);
      backupBusy = false;
      backupRestoreConfirmOpen = false;
      backupSelectedFile = null;
      backupSelectedData = null;
      backupFileValidation = null;
      setBackupMessage(`กู้คืนข้อมูลสำเร็จ ${Object.values(result?.data?.restored || {}).reduce((sum, count) => sum + Number(count || 0), 0).toLocaleString("th-TH")} รายการ`);
      render();
    } catch (error) {
      backupBusy = false;
      backupRestoreConfirmOpen = false;
      setBackupMessage(error?.status === 403 ? "รหัสยืนยันไม่ถูกต้อง" : error instanceof Error ? error.message : "กู้คืนข้อมูลไม่สำเร็จ", "error");
      render();
    }
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
  const rows = [1, 2, 3, 4, 5, 6].map((pileNo) => {
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
          <p>ตรวจสอบกองงาน 1-6 จากรายการผลิตจริง โดยหน้านี้ไม่แก้ข้อมูลผลผลิต</p>
        </div>
        <span class="badge badge-success">${activePileCount}/6 Active</span>
      </div>
      <div class="metrics-grid metrics-spaced">
        <div class="metric-card"><span>กองที่มีข้อมูล</span><strong>${activePileCount.toLocaleString("th-TH")}</strong><small>จากทั้งหมด 6 กอง</small></div>
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
    [1, 2, 3, 4, 5, 6].forEach((pileNo) => {
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
    downloadTextFile(`pile-summary-${localDateInputValue()}.csv`, csv);
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
  if (!canEditProductionRecords(user)) {
    productionEditorOpen = false;
    if (["desktop-pull", "queue"].includes(productionView)) productionView = "fast-entry";
  }
  if (productionView === "desktop-pull") {
    return window.ProductionPull.render({ date: localDateInputValue(), escape: escapeHtml,
      canImport: canImportDesktopWeighing(user), fruits: productionFruitOptions,
      preview: desktopImportPreview, importMessage: desktopImportMessage, importBusy: desktopImportBusy });
  }
  if (productionEditorOpen) {
    return renderProductionEditor(user, moduleItem);
  }
  if (productionView === "queue") {
    return renderProductionQueuePage(user, moduleItem);
  }
  const selectedFruit = productionFruitOptions.find((fruit) => fruit.id === selectedProductionFruit);

  if (!selectedFruit) {
    return renderProductionFruitMenu(user);
  }

  if (!productionFruitFieldLabels[selectedFruit.id]) {
    return renderProductionFruitPlaceholder(selectedFruit);
  }

  const labels = getProductionFieldLabels(selectedFruit.id);
  const visibleViews = [
    ["fast-entry", "กรอกเร็ว"],
    ["batch-entry", "กรอกแบบชุด"],
    ["summary", "สรุปวันที่เลือก"]
  ];
  const currentView = visibleViews.some(([id]) => id === productionView)
    ? productionView
    : "fast-entry";
  const artworkFruit = ["mangosteen", "durian", "mango", "pomelo", "coconut"].includes(selectedFruit.id)
    ? selectedFruit.id
    : "mangosteen";

  return `
    <section class="panel production-workspace-header">
      <div class="panel-head">
        <div>
          <span class="production-eyebrow">PRODUCTION WORKSPACE</span>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(labels.description)}</p>
        </div>
        <div class="production-hero-fruit production-hero-fruit-${artworkFruit}" aria-hidden="true"></div>
        <div class="panel-actions">
          ${canEditProductionRecords(user) ? `<button class="btn btn-outline production-queue-open-button" data-open-production-queue type="button">คิวการบันทึก <span class="production-queue-count" data-production-queue-count ${productionQueueItems.some((item) => ["queued", "processing"].includes(item.status)) ? "" : "hidden"}>${productionQueueItems.filter((item) => ["queued", "processing"].includes(item.status)).length}</span></button>` : ""}
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
    ${renderProductionPullEntry(user)}
  `;
}

function productionQueueStatusMeta(item) {
  const status = String(item?.status || "queued");
  if (status === "processing") return { label: "กำลังบันทึก", detail: "กำลังตรวจสอบและเขียนฐานข้อมูล", className: "processing", icon: "◌" };
  if (status === "succeeded") return { label: "บันทึกสำเร็จ", detail: item.result_record_ids?.length ? `รายการจริง ${item.result_record_ids.map((id) => `#${id}`).join(", ")}` : "ฐานข้อมูลยืนยันแล้ว", className: "succeeded", icon: "✓" };
  if (status === "needs_review") {
    const notFound = item.error_code === "not_found";
    return { label: notFound ? "ไม่พบข้อมูลในฐาน" : "ต้องตรวจสอบ", detail: item.error_message || "ระบบหยุดรายการไว้เพื่อความปลอดภัย", className: "review", icon: "!" };
  }
  if (status === "failed") return { label: "บันทึกไม่สำเร็จ", detail: item.error_message || "รอตรวจสอบ", className: "failed", icon: "×" };
  if (status === "cancelled") return { label: "ยกเลิกแล้ว", detail: `ยกเลิกโดย ${item.cancelled_by || "ผู้ใช้งาน"}`, className: "cancelled", icon: "−" };
  return { label: "รอคิว", detail: `ลำดับรอ ${Math.max(1, productionQueueItems.filter((row) => row.status === "queued" && Number(row.id) < Number(item.id)).length + 1)}`, className: "queued", icon: "○" };
}

function formatProductionQueueDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "-";
  return `${match[3]}/${match[2]}/${Number(match[1]) + 543}`;
}

function formatProductionQueueDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "-" };
  return {
    date: date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  };
}

function productionQueueFruitLabel(fruitType) {
  return productionFruitOptions.find((fruit) => fruit.id === fruitType)?.label || fruitType || "ผลผลิต";
}

function productionQueueWeightDetails(item) {
  const fruitType = item?.fruit_type || "mangosteen";
  const labels = getProductionFieldLabels(fruitType);
  const details = item?.weight_details && typeof item.weight_details === "object" ? item.weight_details : {};
  const rows = labels.mode === "single"
    ? [[labels.weightShort || labels.weight || "น้ำหนัก", details.weight ?? item?.total_weight]]
    : [
        [labels.waterShort || labels.water || "น้ำ", details.water],
        [labels.flowerShort || labels.flower || "ดอก", details.flower]
      ];
  const available = rows.filter(([, value]) => Number(value) > 0);
  if (!available.length) return `<span class="production-queue-weight-total">รวม ${numberText(item?.total_weight)} กก.</span>`;
  return `${available.map(([label, value]) => `<span class="production-queue-weight-chip"><b>${escapeHtml(label)}</b> ${numberText(value)} กก.</span>`).join("")}<span class="production-queue-weight-total">รวม ${numberText(item?.total_weight)} กก.</span>`;
}

function productionQueueCanAct(user, item) {
  const identities = [user?.username, user?.fullname].map((value) => String(value || "").trim().toLocaleLowerCase("th-TH"));
  return canManageAllProductionRecords(user) || identities.includes(String(item?.created_by || "").trim().toLocaleLowerCase("th-TH"));
}

function renderProductionQueueActions(user, item) {
  const busy = Number(productionQueueActionId) === Number(item.id);
  if (busy) return `<button class="btn btn-small btn-outline" type="button" disabled>กำลังตรวจสอบ...</button>`;
  const canAct = productionQueueCanAct(user, item);
  if (item.status === "succeeded" && item.desktop_import && canManageAllProductionRecords(user)) {
    return `<button class="btn btn-small btn-outline" data-queue-verify="${item.id}" type="button">ตรวจรายการจริงอีกครั้ง</button>`;
  }
  if (item.status === "needs_review" || item.status === "failed") {
    const candidateIds = Array.isArray(item.duplicate_details?.existing_ids) ? item.duplicate_details.existing_ids : [];
    const linkButton = canManageAllProductionRecords(user) && item.error_code !== "not_found" && candidateIds.length
      ? `<button class="btn btn-small btn-primary" data-queue-link="${item.id}" data-record-ids="${escapeHtml(candidateIds.join(","))}" type="button">ใช้รายการเดิม</button>`
      : "";
    const retryButton = canAct && item.error_code === "not_found"
      ? `<button class="btn btn-small btn-primary" data-queue-retry="${item.id}" type="button">บันทึกใหม่</button>`
      : "";
    const confirmSaveButton = canManageAllProductionRecords(user)
      ? `<button class="btn btn-small btn-primary production-queue-confirm-save" data-queue-confirm-save="${item.id}" onclick="runProductionQueueAction(${Number(item.id)}, 'confirm-save', { manually_reviewed: true })" type="button">ยืนยันกรอกข้อมูล</button>`
      : "";
    const cancelButton = canAct
      ? `<button class="btn btn-small btn-outline" data-queue-cancel="${item.id}" type="button">ยกเลิก</button>`
      : "";
    return `<div class="production-queue-row-actions"><button class="btn btn-small btn-outline" data-queue-verify="${item.id}" type="button">ตรวจสอบ</button>${confirmSaveButton}${retryButton}${linkButton}${cancelButton}</div>`;
  }
  if (item.status === "queued" && canAct) {
    return `<button class="btn btn-small btn-outline" data-queue-cancel="${item.id}" type="button">ยกเลิก</button>`;
  }
  return `<span class="production-queue-locked">${item.status === "succeeded" ? "เก็บในประวัติ" : "-"}</span>`;
}

function renderProductionQueueRow(user, item) {
  const status = productionQueueStatusMeta(item);
  const submitted = formatProductionQueueDateTime(item.created_at);
  const elapsedMs = item.finished_at && item.created_at
    ? Math.max(0, new Date(item.finished_at).getTime() - new Date(item.created_at).getTime())
    : item.created_at ? Math.max(0, Date.now() - new Date(item.created_at).getTime()) : 0;
  const elapsedText = Number.isFinite(elapsedMs) ? `${(elapsedMs / 1000).toLocaleString("th-TH", { maximumFractionDigits: 1 })} วิ.` : "-";
  return `
    <article class="production-queue-row status-${status.className}" data-queue-search-row>
      <div class="production-queue-cell queue-number"><span>คิว</span><strong>#${escapeHtml(productionQueueNumber(item))}</strong><small>${item.record_count || 1} รายการ</small></div>
      <div class="production-queue-cell queue-production"><span>ข้อมูลผลผลิต</span><strong>${escapeHtml(productionQueueFruitLabel(item.fruit_type))}</strong><small>${escapeHtml(item.emp_code || "-")} · ${escapeHtml(item.employee_name || "-")}</small></div>
      <div class="production-queue-cell queue-amount"><span>จำนวนที่บันทึก</span><div class="production-queue-weight-details">${productionQueueWeightDetails(item)}</div><small>${money(item.total_amount || 0)}</small></div>
      <div class="production-queue-cell queue-date"><span>วันที่ลงผลงาน</span><strong>${escapeHtml(formatProductionQueueDate(item.record_date))}</strong><small>ส่งเข้าคิวจริง ${escapeHtml(submitted.date)} · ${escapeHtml(submitted.time)} น.</small></div>
      <div class="production-queue-cell queue-actor"><span>บัญชีผู้กรอก</span><strong>${escapeHtml(item.created_by || "-")}</strong><small>กรอกจริง ${escapeHtml(submitted.date)} ${escapeHtml(submitted.time)} น. · ลองแล้ว ${Number(item.attempt_count || 0)} ครั้ง</small></div>
      <div class="production-queue-cell queue-status"><span>สถานะ · ${escapeHtml(elapsedText)}</span><div class="production-queue-status ${status.className}"><i>${status.icon}</i><strong>${escapeHtml(status.label)}</strong></div><small>${escapeHtml(status.detail)} · ผู้บันทึก ${escapeHtml(item.created_by || "-")}</small></div>
      <div class="production-queue-cell queue-actions"><span>จัดการ</span>${renderProductionQueueActions(user, item)}</div>
    </article>`;
}

function renderProductionQueuePage(user, moduleItem) {
  const search = productionQueueSearch.trim().toLocaleLowerCase("th-TH");
  const matchesFilter = (item) => {
    if (productionQueueFilter === "active") return ["queued", "processing"].includes(item.status);
    if (productionQueueFilter === "review") return ["needs_review", "failed"].includes(item.status);
    if (productionQueueFilter === "done") return ["succeeded", "cancelled"].includes(item.status);
    return true;
  };
  const filtered = productionQueueItems.filter((item) => {
    if (!matchesFilter(item)) return false;
    if (!search) return true;
    return [productionQueueNumber(item), item.emp_code, item.employee_name, item.created_by, productionQueueFruitLabel(item.fruit_type)]
      .some((value) => String(value || "").toLocaleLowerCase("th-TH").includes(search));
  });
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  productionQueuePage = Math.min(Math.max(1, productionQueuePage), totalPages);
  const visible = filtered.slice((productionQueuePage - 1) * pageSize, productionQueuePage * pageSize);
  const activeCount = productionQueueItems.filter((item) => ["queued", "processing"].includes(item.status)).length;
  const successToday = productionQueueItems.filter((item) => item.status === "succeeded" && String(item.finished_at || "").slice(0, 10) === localDateInputValue()).length;
  const reviewCount = productionQueueItems.filter((item) => ["needs_review", "failed"].includes(item.status)).length;
  const completedTimes = productionQueueItems
    .filter((item) => item.status === "succeeded" && item.created_at && item.finished_at)
    .map((item) => new Date(item.finished_at).getTime() - new Date(item.created_at).getTime())
    .filter((value) => Number.isFinite(value) && value >= 0)
    .slice(0, 20);
  const averageSeconds = completedTimes.length ? completedTimes.reduce((sum, value) => sum + value, 0) / completedTimes.length / 1000 : 0;
  return `
    <section class="production-queue-page">
      <header class="production-queue-header">
        <div><div class="production-queue-breadcrumb">${escapeHtml(moduleItem.label)} <b>/</b> คิวการบันทึก</div><h2>คิวการบันทึกผลผลิต</h2><p>รับข้อมูลเข้าฐานกลางก่อน แล้วประมวลผลต่อโดยไม่ขัดจังหวะการกรอกงาน</p></div>
        <div class="production-queue-header-actions"><span class="production-queue-online"><i></i> Supabase พร้อมใช้งาน</span><button class="btn btn-outline" data-close-production-queue type="button">กลับหน้าบันทึก</button></div>
      </header>
      ${productionQueueMessage ? `<div class="alert ${productionQueueMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(productionQueueMessage)}</div>` : ""}
      <section class="production-queue-metrics">
        <div><span>กำลังทำงาน</span><strong>${activeCount}</strong><small>รอคิวและกำลังบันทึก</small></div>
        <div><span>สำเร็จวันนี้</span><strong>${successToday}</strong><small>ฐานข้อมูลยืนยันแล้ว</small></div>
        <div><span>ต้องตรวจสอบ</span><strong>${reviewCount}</strong><small>ระบบหยุดไว้เพื่อความปลอดภัย</small></div>
        <div><span>เวลาเฉลี่ย</span><strong>${averageSeconds ? `${averageSeconds.toLocaleString("th-TH", { maximumFractionDigits: 1 })} วิ.` : "-"}</strong><small>20 รายการล่าสุด</small></div>
      </section>
      <section class="panel production-queue-panel">
        <div class="production-queue-toolbar">
          <div class="module-tabs">
            ${[["all", "ทั้งหมด"], ["active", "กำลังทำงาน"], ["review", "ต้องตรวจสอบ"], ["done", "สำเร็จ/ยกเลิก"]].map(([id, label]) => `<button class="module-tab ${productionQueueFilter === id ? "active" : ""}" data-queue-filter="${id}" type="button">${label}</button>`).join("")}
          </div>
          <label class="field compact-field production-queue-search"><span>ค้นหา</span><input id="productionQueueSearch" type="search" value="${escapeHtml(productionQueueSearch)}" placeholder="เลขคิว รหัส ชื่อ หรือผู้บันทึก" autocomplete="off" /></label>
        </div>
        <div class="production-queue-columns" aria-hidden="true"><span>คิว</span><span>ข้อมูลผลผลิต</span><span>จำนวน</span><span>วันที่งาน / เวลากรอกจริง</span><span>บัญชีผู้กรอก</span><span>สถานะ</span><span>จัดการ</span></div>
        <div class="production-queue-list">${productionQueueLoading && !productionQueueItems.length ? `<div class="empty-cell">กำลังโหลดคิวจากฐานข้อมูลกลาง...</div>` : visible.length ? visible.map((item) => renderProductionQueueRow(user, item)).join("") : `<div class="empty-cell">ยังไม่มีรายการตามตัวกรอง</div>`}</div>
        <footer class="production-queue-pagination"><span>แสดง ${visible.length} จาก ${filtered.length} รายการ</span><div><button class="btn btn-small btn-outline" data-queue-page="${productionQueuePage - 1}" type="button" ${productionQueuePage <= 1 ? "disabled" : ""}>ก่อนหน้า</button><strong>หน้า ${productionQueuePage} / ${totalPages}</strong><button class="btn btn-small btn-outline" data-queue-page="${productionQueuePage + 1}" type="button" ${productionQueuePage >= totalPages ? "disabled" : ""}>ถัดไป</button></div><span class="production-queue-history-note">รายการสำเร็จไม่ถูกลบจากประวัติ</span></footer>
      </section>
    </section>`;
}

function renderProductionPullEntry(user = getSession()?.user) {
  if (!canEditProductionRecords(user)) return "";
  return `<div class="production-pull-entry"><button type="button" data-open-production-pull>${window.ProductionPull.icon("monitor")}ดึงข้อมูล</button></div>`;
}

function renderProductionFruitMenu(user) {
  return `
    <section class="panel production-fruit-menu-panel">
      <div class="panel-head">
        <div>
          <h2>เลือกผลไม้สำหรับบันทึกผลผลิต</h2>
          <p>แต่ละผลไม้สามารถมีฟอร์มและข้อมูลที่ต้องเก็บต่างกัน เลือกผลไม้ก่อนเริ่มบันทึก</p>
        </div>
        <div class="panel-actions production-fruit-menu-actions">${canEditProductionRecords(user) ? `<button class="btn btn-outline production-queue-open-button" data-open-production-queue type="button">คิวการบันทึก <span class="production-queue-count" data-production-queue-count ${productionQueueItems.some((item) => ["queued", "processing"].includes(item.status)) ? "" : "hidden"}>${productionQueueItems.filter((item) => ["queued", "processing"].includes(item.status)).length}</span></button>` : ""}${canEditProductionRecords(user) ? `<button class="btn btn-outline" data-open-production-editor type="button">แก้ไขข้อมูลผลผลิต</button>` : ""}${canManageAllProductionRecords(user) ? `<button class="btn btn-primary" data-open-fruit-creator type="button">+ เพิ่มผลไม้</button>` : ""}</div>
      </div>
      ${productionFruitCreatorOpen ? `
        <section class="production-fruit-creator">
          <div><h3>เพิ่มผลไม้สำหรับบันทึกผลผลิต</h3><p>กำหนดรูปแบบน้ำหนักและชื่อช่องที่ใช้กรอก</p></div>
          <form id="productionFruitCreatorForm">
            <label class="field"><span>ชื่อผลไม้</span><input name="label" maxlength="40" placeholder="เช่น ลำไย" required /></label>
            <div class="production-fruit-category-editor">
              <span>ประเภทน้ำหนัก</span>
              <div data-fruit-category-list>
                <div class="production-fruit-category-row"><input name="categories" maxlength="50" placeholder="เช่น น้ำหนักรวม หรือ เกรดดี" required /><button class="btn btn-outline" data-remove-fruit-category type="button" aria-label="ลบประเภท">ลบ</button></div>
              </div>
              <button class="btn btn-outline" data-add-fruit-category type="button">+ เพิ่มประเภทน้ำหนัก</button>
              <small>เพิ่มได้หลายประเภทและตั้งชื่อได้อย่างอิสระ แต่ละประเภทจะแยกเป็นตัวเลือกบันทึกเพื่อไม่ให้ข้อมูลปะปนกัน</small>
            </div>
            <div class="production-fruit-creator-actions"><button class="btn btn-primary" type="submit">สร้างผลไม้</button><button class="btn btn-outline" data-close-fruit-creator type="button">ยกเลิก</button></div>
          </form>
        </section>` : ""}
      <div class="production-fruit-grid">
        ${productionFruitOptions
          .map(
            (fruit) => `
              <button class="production-fruit-card" data-production-fruit="${fruit.id}" type="button">
                <i class="production-fruit-card-art production-hero-fruit-${["mangosteen", "durian", "mango", "pomelo", "coconut"].includes(fruit.id) ? fruit.id : "mangosteen"}" aria-hidden="true"></i>
                <span>${escapeHtml(fruit.status)}</span>
                <strong>${escapeHtml(fruit.label)}</strong>
                <small>${escapeHtml(fruit.description)}</small>
              </button>
            `
          )
          .join("")}
      </div>
      ${renderProductionPullEntry(user)}
    </section>
  `;
}

function getProductionEditorRecords(user) {
  const search = productionEditorEmployeeSearch.trim().toLocaleLowerCase("th-TH");
  return getProductionRecords()
    .filter((record) => {
      if (!canEditProductionRecord(user, record)) return false;
      if (getRecordDate(record) !== productionEditorDate) return false;
      if (productionFruitTypeForRecord(record) !== productionEditorFruit) return false;
      if (!search) return true;
      const employee = getEmployees().find((item) => Number(item.id) === Number(record.employee_id));
      return [record.emp_code, record.employee_name, employee?.fullname, record.created_by]
        .some((value) => String(value || "").toLocaleLowerCase("th-TH").includes(search));
    })
    .sort((a, b) => {
      const timeCompare = String(a.record_time || "").localeCompare(String(b.record_time || ""));
      if (timeCompare) return timeCompare;
      const codeCompare = String(a.emp_code || "").localeCompare(String(b.emp_code || ""), undefined, { numeric: true });
      if (codeCompare) return codeCompare;
      return (normalizeProductionPileNumber(a.pile_no ?? a.pile) || 0) - (normalizeProductionPileNumber(b.pile_no ?? b.pile) || 0);
    });
}

function renderProductionEditor(user, moduleItem) {
  if (!canEditProductionRecords(user)) {
    return `<section class="panel"><div class="alert alert-error">กรุณาเข้าสู่ระบบก่อนแก้ไขข้อมูลผลผลิต</div></section>`;
  }

  const canManageAll = canManageAllProductionRecords(user);
  const records = getProductionEditorRecords(user);
  const visibleRecordIds = new Set(records.map((record) => Number(record.id)));
  productionEditorSelectedIds = productionEditorSelectedIds.filter((id) => visibleRecordIds.has(Number(id)));
  const selectedIdSet = new Set(productionEditorSelectedIds.map(Number));
  const allVisibleSelected = records.length > 0 && records.every((record) => selectedIdSet.has(Number(record.id)));
  const editingRecord = getProductionRecords().find(
    (record) => Number(record.id) === Number(editingProductionRecordId) && canEditProductionRecord(user, record)
  );
  const deletingRecord = canDeleteProductionRecords(user)
    ? getProductionRecords().find((record) => Number(record.id) === Number(deletingProductionRecordId))
    : null;
  const labels = getProductionFieldLabels(productionEditorFruit);
  const isDurian = isSingleWeightFruit(productionEditorFruit);
  const employees = getEmployees().slice().sort((a, b) => String(a.emp_code).localeCompare(String(b.emp_code), undefined, { numeric: true }));
  const editEmployeeId = editingRecord
    ? employees.find((employee) => String(employee.emp_code) === String(editingRecord.emp_code))?.id || editingRecord.employee_id
    : "";

  return `
    <section class="summary-page production-editor-page">
      <div class="summary-header">
        <div>
          <h2>แก้ไขข้อมูลผลผลิต</h2>
          <p>${canManageAll
            ? "C4 ขึ้นไปแก้ไขรายการของทุกคนได้ตลอดเวลา และลบรายการได้"
            : "C1-C3 แก้ไขได้เฉพาะรายการที่ตนเองบันทึก ภายใน 5 นาทีหลังบันทึก"} ทุกการแก้ไขถูกบันทึกค่าเดิมกับค่าใหม่ใน Audit Log</p>
        </div>
        <button class="btn btn-outline" data-close-production-editor type="button">กลับหน้าเลือกผลไม้</button>
      </div>

      ${productionEditorMessage ? `<div class="alert ${productionEditorMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(productionEditorMessage)}</div>` : ""}

      <section class="panel production-editor-filters">
        <label class="field compact-field">
          <span>วันที่</span>
          <input id="productionEditorDate" type="date" max="${localDateInputValue()}" value="${escapeHtml(productionEditorDate)}" />
        </label>
        <label class="field compact-field">
          <span>ผลไม้</span>
          <select id="productionEditorFruit">
            ${productionFruitOptions.filter((fruit) => productionFruitFieldLabels[fruit.id]).map((fruit) => `<option value="${escapeHtml(fruit.id)}" ${fruit.id === productionEditorFruit ? "selected" : ""}>${escapeHtml(fruit.label)}</option>`).join("")}
          </select>
        </label>
        <label class="field compact-field production-editor-search">
          <span>ค้นหาพนักงานหรือผู้บันทึก</span>
          <input id="productionEditorSearch" type="search" value="${escapeHtml(productionEditorEmployeeSearch)}" placeholder="รหัส ชื่อ หรือผู้บันทึก" autocomplete="off" />
        </label>
        <span class="summary-mode-pill">${records.length.toLocaleString("th-TH")} รายการ</span>
      </section>

      ${editingRecord ? `
        <section class="panel production-edit-panel">
          <div class="panel-head">
            <div>
              <h3>แก้ไขรายการ #${editingRecord.id}</h3>
              <p>ข้อมูลเดิมบันทึกโดย ${escapeHtml(editingRecord.created_by || "-")} เวลา ${escapeHtml(editingRecord.record_time || "-")}</p>
            </div>
            <button class="btn btn-outline btn-small" data-cancel-production-edit type="button">ยกเลิก</button>
          </div>
          <form id="productionEditForm" class="production-edit-form">
            <label class="field compact-field"><span>วันที่ผลผลิต</span><input name="record_date" type="date" max="${localDateInputValue()}" value="${escapeHtml(getRecordDate(editingRecord))}" required /></label>
            <label class="field compact-field"><span>พนักงาน</span><select name="employee_id" required>${employees.map((employee) => `<option value="${employee.id}" ${Number(employee.id) === Number(editEmployeeId) ? "selected" : ""}>${escapeHtml(employee.emp_code)} - ${escapeHtml(employee.fullname)}</option>`).join("")}</select></label>
            <label class="field compact-field"><span>กอง</span><select name="pile_no">${fruitPileOptionMarkup(editingRecord.pile_no ?? editingRecord.pile)}</select></label>
            ${isDurian
              ? `<label class="field compact-field"><span>${escapeHtml(labels.weight)} (กก.)</span><input name="durian_weight" type="number" min="0" step="0.1" value="${Number(getRecordDurianWeight(editingRecord) || 0)}" required /></label>`
              : `<label class="field compact-field"><span>${escapeHtml(labels.water)} (กก.)</span><input name="water_weight" type="number" min="0" step="0.1" value="${Number(editingRecord.water_weight || editingRecord.water || 0)}" required /></label><label class="field compact-field"><span>${escapeHtml(labels.flower)} (กก.)</span><input name="flower_weight" type="number" min="0" step="0.1" value="${Number(editingRecord.flower_weight || editingRecord.flower || 0)}" required /></label>`}
            <label class="field production-edit-reason"><span>เหตุผลการแก้ไข</span><textarea name="reason" rows="2" minlength="3" placeholder="ระบุสาเหตุเพื่อบันทึกใน Log" required></textarea></label>
            <button class="btn btn-primary production-edit-submit" type="submit" ${productionEditorSaving ? "disabled" : ""}>${productionEditorSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>
          </form>
        </section>` : ""}

      ${canManageAll && deletingRecord ? `
        <section class="panel production-delete-panel">
          <div class="panel-head">
            <div>
              <h3>ยืนยันลบรายการ #${deletingRecord.id}</h3>
              <p>รหัส ${escapeHtml(deletingRecord.emp_code || "-")} · ${escapeHtml(deletingRecord.employee_name || "-")} · กอง ${normalizeProductionPileNumber(deletingRecord.pile_no ?? deletingRecord.pile) || "-"}</p>
            </div>
            <button class="btn btn-outline btn-small" data-cancel-production-delete type="button">ยกเลิก</button>
          </div>
          <form id="productionDeleteForm" class="production-delete-form">
            <label class="field production-edit-reason"><span>เหตุผลที่ลบ</span><textarea name="reason" rows="2" minlength="3" placeholder="เช่น กรอกซ้ำกับรายการ #..." required></textarea></label>
            <button class="btn btn-danger production-edit-submit" type="submit" ${productionEditorSaving ? "disabled" : ""}>${productionEditorSaving ? "กำลังลบ..." : "ยืนยันลบรายการ"}</button>
          </form>
        </section>` : ""}

      <section class="panel production-batch-edit-panel">
        <div class="production-batch-edit-head">
          <div>
            <span>แก้ไขแบบหลายรายการ</span>
            <h3>เปลี่ยนวันที่พร้อมกัน</h3>
            <p>เลือก checkbox จากตาราง แล้วกำหนดวันที่ใหม่ ระบบจะเปลี่ยนเฉพาะวันที่และบันทึก Audit Log</p>
          </div>
          <strong>${productionEditorSelectedIds.length.toLocaleString("th-TH")} รายการที่เลือก</strong>
        </div>
        <form id="productionBatchDateForm" class="production-batch-date-form">
          <label class="field compact-field">
            <span>วันที่ใหม่</span>
            <input name="record_date" type="date" max="${localDateInputValue()}" value="${escapeHtml(productionEditorBatchDate || productionEditorDate)}" required />
          </label>
          <label class="field production-batch-reason">
            <span>เหตุผลการแก้ไข</span>
            <input name="reason" minlength="3" placeholder="เช่น เลือกวันที่ผลผลิตผิด" required />
          </label>
          <button class="btn btn-primary" type="submit" ${productionEditorSaving || !productionEditorSelectedIds.length ? "disabled" : ""}>${productionEditorSaving ? "กำลังเปลี่ยนวันที่..." : "เปลี่ยนวันที่รายการที่เลือก"}</button>
          <button class="btn btn-outline" data-clear-production-selection type="button" ${productionEditorSelectedIds.length ? "" : "disabled"}>ล้างที่เลือก</button>
        </form>
      </section>

      <section class="table-card">
        <div class="table-heading production-editor-table-heading"><span>รายการ${escapeHtml(getProductionFruitLabel(productionEditorFruit))} วันที่ ${escapeHtml(productionEditorDate)}</span><strong>${productionEditorSelectedIds.length.toLocaleString("th-TH")} รายการที่เลือก</strong></div>
        <div class="table-scroll">
          <table class="production-editor-table">
            <thead><tr><th class="production-editor-check-cell"><input data-select-all-production-editor type="checkbox" aria-label="เลือกทุกรายการที่แสดง" ${allVisibleSelected ? "checked" : ""} ${records.length ? "" : "disabled"} /></th><th>เวลา</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>กอง</th><th>${isDurian ? "น้ำหนักทุเรียน" : `${escapeHtml(labels.water)} / ${escapeHtml(labels.flower)}`}</th><th>รวมเงิน</th><th>ผู้บันทึก</th><th>จัดการ</th></tr></thead>
            <tbody>${records.length ? records.map((record) => {
              const employee = employees.find((item) => Number(item.id) === Number(record.employee_id));
              const weights = isDurian
                ? `${numberText(getRecordDurianWeight(record))} กก.`
                : `${numberText(record.water_weight || record.water || 0)} / ${numberText(record.flower_weight || record.flower || 0)}`;
              const activeClass = Number(record.id) === Number(editingProductionRecordId)
                ? "is-editing"
                : Number(record.id) === Number(deletingProductionRecordId) ? "is-deleting" : "";
              const remainingMinutes = Math.max(1, Math.ceil(getProductionRecordEditRemainingMs(record) / 60000));
              const editLabel = canManageAll ? "แก้ไข" : `แก้ไข (เหลือ ${remainingMinutes} นาที)`;
              const deleteButton = canManageAll
                ? `<button class="btn btn-small btn-danger" data-select-production-delete="${record.id}" type="button">ลบ</button>`
                : "";
              const selected = selectedIdSet.has(Number(record.id));
              return `<tr class="${activeClass} ${selected ? "is-batch-selected" : ""}"><td class="production-editor-check-cell"><input data-production-editor-select="${record.id}" type="checkbox" aria-label="เลือกรายการ ${record.id}" ${selected ? "checked" : ""} /></td><td>${escapeHtml(record.record_time || "-")}</td><td><strong>${escapeHtml(record.emp_code || "-")}</strong></td><td>${escapeHtml(record.employee_name || employee?.fullname || "-")}</td><td>${normalizeProductionPileNumber(record.pile_no ?? record.pile) || "-"}</td><td>${escapeHtml(weights)}</td><td><strong>${money(record.total_amount || record.grand_total || 0)}</strong></td><td>${escapeHtml(record.created_by || "-")}</td><td><div class="production-row-actions"><button class="btn btn-small btn-outline" data-select-production-edit="${record.id}" type="button">${editLabel}</button>${deleteButton}</div></td></tr>`;
            }).join("") : `<tr><td colspan="9" class="empty-cell">ไม่พบข้อมูลตามตัวกรอง</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </section>
  `;
}

async function deleteProductionEditorRecord(user, formElement) {
  if (!canDeleteProductionRecords(user)) {
    productionEditorMessage = "เฉพาะบัญชีระดับ C4 ขึ้นไปเท่านั้นที่ลบข้อมูลผลผลิตได้";
    productionEditorMessageType = "error";
    render();
    return;
  }
  const existingRecord = getProductionRecords().find((record) => Number(record.id) === Number(deletingProductionRecordId));
  const reason = String(new FormData(formElement).get("reason") || "").trim();
  if (!existingRecord || reason.length < 3) {
    productionEditorMessage = existingRecord ? "กรุณาระบุเหตุผลที่ลบอย่างน้อย 3 ตัวอักษร" : "ไม่พบรายการที่ต้องการลบ กรุณาโหลดข้อมูลใหม่";
    productionEditorMessageType = "error";
    render();
    return;
  }

  try {
    productionEditorSaving = true;
    productionEditorMessage = `กำลังลบรายการ #${existingRecord.id}...`;
    productionEditorMessageType = "success";
    render();
    await cloudApiRequest(`/api/production-records/${existingRecord.id}/delete`, {
      method: "POST",
      body: JSON.stringify({
        reason,
        expected_updated_at: existingRecord.updated_at || existingRecord.created_at
      })
    });
    applyingCloudState = true;
    writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY,
      getProductionRecords().filter((record) => Number(record.id) !== Number(existingRecord.id))
    );
    applyingCloudState = false;
    await refreshLiveStateFromCloud({ renderWhenIdle: false, force: true });
    deletingProductionRecordId = null;
    productionEditorMessage = `ลบรายการ #${existingRecord.id} และบันทึก Audit Log แล้ว`;
    productionEditorMessageType = "success";
  } catch (error) {
    productionEditorMessage = error instanceof Error ? error.message : "ลบรายการไม่สำเร็จ";
    productionEditorMessageType = "error";
  } finally {
    productionEditorSaving = false;
    applyingCloudState = false;
    render();
  }
}

async function saveProductionEditorRecord(user, formElement) {
  const existingRecord = getProductionRecords().find((record) => Number(record.id) === Number(editingProductionRecordId));
  if (!existingRecord) {
    productionEditorMessage = "ไม่พบรายการที่ต้องการแก้ไข กรุณาโหลดข้อมูลใหม่";
    productionEditorMessageType = "error";
    render();
    return;
  }
  if (!canEditProductionRecord(user, existingRecord)) {
    productionEditorMessage = "C1-C3 แก้ไขได้เฉพาะรายการที่ตนเองบันทึกและยังไม่เกิน 5 นาที";
    productionEditorMessageType = "error";
    editingProductionRecordId = null;
    render();
    return;
  }

  const form = new FormData(formElement);
  const employee = getEmployees().find((item) => Number(item.id) === Number(form.get("employee_id")));
  const reason = String(form.get("reason") || "").trim();
  const recordDate = String(form.get("record_date") || "");
  const pileNo = Number(form.get("pile_no"));
  if (!employee || !isValidProductionRecordDate(recordDate) || !isConfiguredFruitPile(pileNo, true) || reason.length < 3) {
    productionEditorMessage = "กรุณาตรวจสอบวันที่ พนักงาน กอง และระบุเหตุผลอย่างน้อย 3 ตัวอักษร";
    productionEditorMessageType = "error";
    render();
    return;
  }

  const fruitType = productionFruitTypeForRecord(existingRecord);
  const payload = { employee, fruit_type: fruitType, record_date: recordDate, pile_no: pileNo };
  if (isSingleWeightFruit(fruitType)) {
    const raw = String(form.get("durian_weight") ?? "").trim();
    if (!isOneDecimalWeightInput(raw) || Number(raw) <= 0) {
      productionEditorMessage = `${getProductionFieldLabels(fruitType).weight}ต้องมากกว่า 0 และมีทศนิยมไม่เกิน 1 ตำแหน่ง`;
      productionEditorMessageType = "error";
      render();
      return;
    }
    payload.durian_weight = Number(raw);
  } else {
    const waterRaw = String(form.get("water_weight") ?? "").trim();
    const flowerRaw = String(form.get("flower_weight") ?? "").trim();
    if (!isOneDecimalWeightInput(waterRaw) || !isOneDecimalWeightInput(flowerRaw) || Number(waterRaw) < 0 || Number(flowerRaw) < 0) {
      productionEditorMessage = "น้ำหนักต้องเป็นเลขไม่ติดลบและมีทศนิยมไม่เกิน 1 ตำแหน่ง";
      productionEditorMessageType = "error";
      render();
      return;
    }
    payload.water_weight = Number(waterRaw);
    payload.flower_weight = Number(flowerRaw);
  }

  try {
    const updatedRecord = buildProductionRecord(payload, user, existingRecord);
    productionEditorSaving = true;
    productionEditorMessage = `กำลังบันทึกการแก้ไขรายการ #${existingRecord.id}...`;
    productionEditorMessageType = "success";
    render();
    const response = await cloudApiRequest(`/api/production-records/${existingRecord.id}`, {
      method: "POST",
      body: JSON.stringify({
        record: updatedRecord,
        reason,
        expected_updated_at: existingRecord.updated_at || existingRecord.created_at,
        actor_fullname: user.fullname
      })
    });
    if (Number(response.data?.id) !== Number(existingRecord.id) || getProductionClientUid(response.data) !== getProductionClientUid(existingRecord)) {
      throw new Error("Cloud ส่งตัวตนรายการกลับมาไม่ตรง ระบบจึงไม่รับผลการแก้ไข");
    }
    const existingUid = getProductionClientUid(existingRecord);
    const merged = [
      ...getProductionRecords().filter((record) => (
        Number(record.id) !== Number(existingRecord.id) &&
        (!existingUid || getProductionClientUid(record) !== existingUid)
      )),
      response.data
    ].sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    applyingCloudState = true;
    writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, merged);
    applyingCloudState = false;
    await refreshLiveStateFromCloud({ renderWhenIdle: false, force: true });
    productionEditorDate = getRecordDate(response.data);
    productionEditorFruit = productionFruitTypeForRecord(response.data);
    editingProductionRecordId = null;
    productionEditorMessage = `บันทึกการแก้ไขรายการ #${existingRecord.id} และ Audit Log แล้ว`;
    productionEditorMessageType = "success";
  } catch (error) {
    productionEditorMessage = error instanceof Error ? error.message : "บันทึกการแก้ไขไม่สำเร็จ";
    productionEditorMessageType = "error";
  } finally {
    productionEditorSaving = false;
    applyingCloudState = false;
    render();
  }
}

async function saveProductionEditorBatchDate(user, formElement) {
  const selectedIds = [...new Set(productionEditorSelectedIds.map(Number).filter(Boolean))];
  const selectedRecords = selectedIds
    .map((id) => getProductionRecords().find((record) => Number(record.id) === id))
    .filter(Boolean);
  if (!selectedIds.length || selectedRecords.length !== selectedIds.length) {
    productionEditorMessage = "ไม่พบรายการที่เลือกครบ กรุณาโหลดข้อมูลใหม่แล้วเลือกอีกครั้ง";
    productionEditorMessageType = "error";
    productionEditorSelectedIds = [];
    render();
    return;
  }
  const forbidden = selectedRecords.find((record) => !canEditProductionRecord(user, record));
  if (forbidden) {
    productionEditorMessage = `ไม่มีสิทธิ์แก้ไขรายการ #${forbidden.id} หรือระยะเวลาแก้ไขหมดแล้ว`;
    productionEditorMessageType = "error";
    productionEditorSelectedIds = productionEditorSelectedIds.filter((id) => Number(id) !== Number(forbidden.id));
    render();
    return;
  }

  const form = new FormData(formElement);
  const recordDate = String(form.get("record_date") || "").trim();
  const reason = String(form.get("reason") || "").trim();
  productionEditorBatchDate = recordDate;
  if (!isValidProductionRecordDate(recordDate) || reason.length < 3) {
    productionEditorMessage = "กรุณาเลือกวันที่ใหม่และระบุเหตุผลอย่างน้อย 3 ตัวอักษร";
    productionEditorMessageType = "error";
    render();
    return;
  }
  if (selectedRecords.every((record) => getRecordDate(record) === recordDate)) {
    productionEditorMessage = "รายการที่เลือกใช้วันที่นี้อยู่แล้ว กรุณาเลือกวันที่ใหม่";
    productionEditorMessageType = "error";
    render();
    return;
  }
  if (!window.confirm(`ยืนยันเปลี่ยนวันที่ ${selectedRecords.length} รายการเป็น ${recordDate}?`)) return;

  try {
    productionEditorSaving = true;
    productionEditorMessage = `กำลังเปลี่ยนวันที่ ${selectedRecords.length} รายการ...`;
    productionEditorMessageType = "success";
    render();
    const response = await cloudApiRequest("/api/production-records/batch-date", {
      method: "POST",
      body: JSON.stringify({
        records: selectedRecords.map((record) => ({
          id: Number(record.id),
          expected_updated_at: record.updated_at || record.created_at
        })),
        record_date: recordDate,
        reason,
        actor_fullname: user.fullname
      })
    });
    const updatedRows = Array.isArray(response.data) ? response.data : [];
    const returnedIds = updatedRows.map((record) => Number(record.id)).sort((a, b) => a - b);
    const expectedIds = [...selectedIds].sort((a, b) => a - b);
    if (
      updatedRows.length !== selectedRecords.length
      || returnedIds.some((id, index) => id !== expectedIds[index])
      || updatedRows.some((record) => getRecordDate(record) !== recordDate)
    ) {
      throw new Error("Cloud ส่งผลการแก้ไขแบบชุดกลับมาไม่ครบ กรุณารีเฟรชเพื่อตรวจสอบก่อนทำรายการต่อ");
    }
    const updatedById = new Map(updatedRows.map((record) => [Number(record.id), record]));
    const merged = getProductionRecords().map((record) => updatedById.get(Number(record.id)) || record);
    applyingCloudState = true;
    writeLiveStateRowsToStorage("production_records", PRODUCTION_RECORDS_KEY, merged);
    applyingCloudState = false;
    await refreshLiveStateFromCloud({ renderWhenIdle: false, force: true });
    productionEditorSelectedIds = [];
    productionEditorDate = recordDate;
    productionEditorBatchDate = recordDate;
    editingProductionRecordId = null;
    deletingProductionRecordId = null;
    productionEditorMessage = `เปลี่ยนวันที่ ${updatedRows.length} รายการเป็น ${recordDate} และบันทึก Audit Log แล้ว`;
    productionEditorMessageType = "success";
  } catch (error) {
    productionEditorMessage = error instanceof Error ? error.message : "เปลี่ยนวันที่แบบชุดไม่สำเร็จ";
    productionEditorMessageType = "error";
  } finally {
    productionEditorSaving = false;
    applyingCloudState = false;
    render();
  }
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
  if (view === "summary") return renderProductionSummary(user);
  return renderProductionFast(user, {
    label: "กรอกเร็ว",
    description: "บันทึกผลผลิตประจำวัน"
  });
}

function renderBatchEntry() {
  if (isSingleWeightFruit()) return renderDurianBatchEntry();
  batchGridState.flower_pile_no = effectiveVisibleFruitPileNumber(batchGridState.flower_pile_no);
  batchGridState.water_pile_no = effectiveVisibleFruitPileNumber(batchGridState.water_pile_no);
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
    <section class="panel production-entry-panel" id="productionBatchEntry">
      <div class="panel-head">
        <div>
          <h2>กรอกแบบชุด</h2>
          <p>กรอกรหัสพนักงาน แล้วใส่น้ำหนักฝั่งละ ${BATCH_WEIGHT_INPUT_COUNT} ช่อง</p>
        </div>
      </div>
      <div class="batch-employee-row">
        <label class="field">
          <span>วันที่บันทึกผลผลิต</span>
          <input id="batchRecordDate" type="date" max="${localDateInputValue()}" value="${escapeHtml(productionRecordDate)}" />
        </label>
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
        <section class="batch-side ${productionPileToneClass(batchGridState.flower_pile_no)}" ${fruitPileToneStyle(batchGridState.flower_pile_no)}>
          <div class="batch-side-head">
            <h3>${escapeHtml(labels.flower)}</h3>
            <label class="compact-field">
              <span>กอง</span>
              <select id="batchFlowerPile" class="production-pile-select">
                ${fruitPileOptionMarkup(batchGridState.flower_pile_no)}
              </select>
            </label>
          </div>
          <div class="batch-weight-grid">${renderWeightInputs("flower", getBatchPileWeights("flower"))}</div>
        </section>
        <section class="batch-side ${productionPileToneClass(batchGridState.water_pile_no)}" ${fruitPileToneStyle(batchGridState.water_pile_no)}>
          <div class="batch-side-head">
            <h3>${escapeHtml(labels.water)}</h3>
            <label class="compact-field">
              <span>กอง</span>
              <select id="batchWaterPile" class="production-pile-select">
                ${fruitPileOptionMarkup(batchGridState.water_pile_no)}
              </select>
            </label>
          </div>
          <div class="batch-weight-grid">${renderWeightInputs("water", getBatchPileWeights("water"))}</div>
        </section>
      </div>
      <div class="batch-actions">
        <button class="btn btn-primary report-primary-button" id="saveBatchEntry" type="button" ${productionSaving ? "disabled" : ""}>${productionSaving ? "กำลังรับเข้าคิว..." : "บันทึกชุดนี้"}</button>
        <button class="btn btn-outline" id="clearBatchEntry" type="button" ${productionSaving ? "disabled" : ""}>ล้างข้อมูล</button>
      </div>
      <p class="demo-note">คีย์ลัด: Shift+Enter บันทึกชุดนี้ · ↑/↓ เปลี่ยนกองของช่องที่กำลังกรอก · ←/→ สลับดอก/น้ำช่องเดียวกัน</p>
    </section>
  `;
}

function renderDurianBatchEntry() {
  batchGridState.durian_pile_no = effectiveVisibleFruitPileNumber(batchGridState.durian_pile_no);
  const employeeName = batchGridState.employee
    ? batchGridState.employee.fullname
    : "รอกรอกรหัสพนักงานอย่างน้อย 2 หลัก";
  const labels = getProductionFieldLabels();
  const fruitLabel = productionQueueFruitLabel(getSelectedProductionFruitId());
  const renderInputs = () => getBatchPileWeights("durian", batchGridState.durian_pile_no).map((value, index) => `
    <label class="batch-weight-cell">
      <span>${index + 1}</span>
      <input data-durian-batch-weight data-batch-index="${index}" inputmode="decimal" type="number" min="0" step="0.1" value="${escapeHtml(value)}" />
    </label>`).join("");
  return `
    <section class="panel production-entry-panel" id="productionBatchEntry">
      <div class="panel-head"><div><h2>กรอก${escapeHtml(fruitLabel)}แบบชุด</h2><p>กรอกรหัสพนักงาน แล้วใส่${escapeHtml(labels.weight)}แยกตามกอง กองละ ${BATCH_WEIGHT_INPUT_COUNT} ช่อง</p></div></div>
      <div class="batch-employee-row">
        <label class="field"><span>วันที่บันทึกผลผลิต</span><input id="batchRecordDate" type="date" max="${localDateInputValue()}" value="${escapeHtml(productionRecordDate)}" /></label>
        <label class="field"><span>รหัสพนักงาน</span><input id="batchEmpCode" inputmode="numeric" maxlength="8" value="${escapeHtml(batchGridState.emp_code)}" autocomplete="off" /></label>
        <div class="employee-result"><span>พนักงาน</span><strong>${escapeHtml(employeeName)}</strong></div>
      </div>
      <div class="durian-batch-grid">
        <section class="batch-side durian-grade-side ${productionPileToneClass(batchGridState.durian_pile_no)}" ${fruitPileToneStyle(batchGridState.durian_pile_no)}>
          <div class="batch-side-head">
            <h3>${escapeHtml(labels.weight)}</h3>
            <label class="compact-field"><span>กอง</span><select id="batchDurianPile" class="production-pile-select">
              ${fruitPileOptionMarkup(batchGridState.durian_pile_no)}
            </select></label>
          </div>
          <div class="batch-weight-grid">${renderInputs()}</div>
        </section>
      </div>
      <div class="batch-actions"><button class="btn btn-primary report-primary-button" id="saveBatchEntry" type="button" ${productionSaving ? "disabled" : ""}>${productionSaving ? "กำลังรับเข้าคิว..." : "บันทึกชุดนี้"}</button><button class="btn btn-outline" id="clearBatchEntry" type="button" ${productionSaving ? "disabled" : ""}>ล้างข้อมูล</button></div>
      <p class="demo-note">คีย์ลัด: Enter ไปช่องถัดไป · Shift+Enter บันทึกชุดนี้ · ↑/↓ เปลี่ยนกองของช่องที่กำลังกรอก</p>
    </section>`;
}

function renderProductionSummary(user) {
  const labels = getProductionFieldLabels();
  const records = productionRecordsForActiveSession();
  const totals = getProductionTotals(records);
  const employeeMap = new Map(getEmployees().map((employee) => [employee.id, employee]));

  const durianMode = isSingleWeightFruit();
  const durianTotal = durianMode
    ? records.reduce((sum, record) => sum + getRecordDurianWeight(record), 0)
    : 0;
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>สรุปการผลิต</h2>
          <p>${durianMode ? `น้ำหนักทุเรียน ${numberText(durianTotal)} กก.` : `${labels.waterShort} ${numberText(totals.water)} กก., ${labels.flowerShort} ${numberText(totals.flower)} กก.`}, ${totals.people.size} คน</p>
        </div>
        <span class="badge badge-success">${money(totals.amount)}</span>
      </div>
    </section>
    ${renderProductionRecordsTable(
      records.map((record) => ({
        ...record,
        employee_name: employeeMap.get(record.employee_id)?.fullname || ""
      })),
      user
    )}
  `;
}

function renderProductionRecordsTable(records, editUser = null) {
  const labels = getProductionFieldLabels();
  const durianMode = isSingleWeightFruit();
  return `
    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>เวลา</th><th>รหัส</th><th>ชื่อ</th><th>กอง</th>${durianMode ? `<th>น้ำหนักทุเรียน</th>` : `<th>${escapeHtml(labels.water)}</th><th>${escapeHtml(labels.flower)}</th>`}<th>รวมเงิน</th><th>สถานะ</th><th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length
                ? records.map((record) => renderProductionManagementRow(record, editUser)).join("")
                : `<tr><td colspan="${durianMode ? 8 : 9}" class="empty-cell">ยังไม่มีรายการผลผลิตวันที่ ${escapeHtml(productionRecordDate)}</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderProductionManagementRow(record, editUser) {
  const employee = getEmployees().find((item) => item.id === record.employee_id);
  const locked = isProductionRecordLocked(record);
  const showEdit = editUser ? canEditProductionRecord(editUser, record) : false;

  return `
    <tr>
      <td>${escapeHtml(record.record_time || "")}</td>
      <td><strong>${escapeHtml(record.emp_code)}</strong></td>
      <td>${escapeHtml(record.employee_name || employee?.fullname || "")}</td>
      <td>${record.pile_no}</td>
      ${isDurianFruit(productionFruitTypeForRecord(record))
        ? `<td>${numberText(getRecordDurianWeight(record))}</td>`
        : `<td>${numberText(record.water_weight)}</td><td>${numberText(record.flower_weight)}</td>`}
      <td><strong>${money(record.total_amount)}</strong></td>
      <td><span class="badge ${locked ? "badge-danger" : "badge-success"}">${locked ? "Locked" : "Open"}</span></td>
      <td>${showEdit ? `<button class="btn btn-small btn-outline" data-edit-production="${record.id}" type="button">Edit</button>` : ""}</td>
    </tr>
  `;
}

function renderProductionFast(user, moduleItem) {
  if (isSingleWeightFruit()) return renderDurianFast(user, moduleItem);
  syncFastInputStateForSelectedFruit();
  fastInputState.pile_no = effectiveVisibleFruitPileNumber(fastInputState.pile_no);
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
    <section class="panel fast-input-panel production-entry-panel">
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

      <form class="fast-input-form ${productionPileToneClass(fastInputState.pile_no)}" ${fruitPileToneStyle(fastInputState.pile_no)} id="productionFastForm">
        <label class="field">
          <span>วันที่</span>
          <input id="fastRecordDate" type="date" max="${localDateInputValue()}" value="${escapeHtml(productionRecordDate)}" required />
        </label>
        <label class="field">
          <span>กอง</span>
          <select name="pile_no" id="fastPileNo" class="production-pile-select" required>
            ${fruitPileOptionMarkup(fastInputState.pile_no)}
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
            class="production-pile-weight"
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
            class="production-pile-weight"
            required
          />
        </label>

        <button class="btn btn-primary form-submit" type="submit" ${productionSaving ? "disabled" : ""}>${productionSaving ? "กำลังรับเข้าคิว..." : "บันทึก"}</button>
      </form>

      <p class="demo-note">
        กด Enter เพื่อไปช่องถัดไป, Ctrl+S เพื่อบันทึก, Esc เพื่อล้างฟอร์ม
      </p>
    </section>

    <section class="table-card production-latest-table">
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
                : `<tr><td colspan="10" class="empty-cell">ยังไม่มีรายการผลผลิตวันที่ ${escapeHtml(productionRecordDate)}</td></tr>`
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
      <td>${record.water_weight.toLocaleString("th-TH")} x ${rateMoney(record.water_rate)}</td>
      <td>${record.flower_weight.toLocaleString("th-TH")} x ${rateMoney(record.flower_rate)}</td>
      <td><strong>${money(record.total_amount)}</strong></td>
      <td><span class="badge badge-warning">${escapeHtml(record.status)}</span></td>
      <td>${escapeHtml(record.created_by)}</td>
    </tr>
  `;
}

function renderDurianFast(user, moduleItem) {
  syncFastInputStateForSelectedFruit();
  fastInputState.pile_no = effectiveVisibleFruitPileNumber(fastInputState.pile_no);
  if (fastInputState.emp_code) updateFastEmployeeFromCode(fastInputState.emp_code);
  const latestRecords = productionRecordsForActiveSession().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);
  const employeeName = getEmployeeLookupText(fastInputState.employee, fastInputState.emp_code);
  const labels = getProductionFieldLabels();
  const fruitLabel = productionQueueFruitLabel(getSelectedProductionFruitId());
  return `
    <section class="panel fast-input-panel production-entry-panel durian-fast-panel">
      <div class="panel-head"><div><h2>${escapeHtml(moduleItem.label)} - ${escapeHtml(fruitLabel)}</h2><p>บันทึก${escapeHtml(labels.weight)}รวมในแต่ละกอง</p></div><span class="badge badge-success">กรอกเร็ว</span></div>
      ${fastInputState.message ? `<div class="alert ${fastInputState.messageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(fastInputState.message)}</div>` : ""}
      <form class="fast-input-form durian-fast-form ${productionPileToneClass(fastInputState.pile_no)}" ${fruitPileToneStyle(fastInputState.pile_no)} id="productionFastForm">
        <label class="field"><span>วันที่</span><input id="fastRecordDate" type="date" max="${localDateInputValue()}" value="${escapeHtml(productionRecordDate)}" required /></label>
        <label class="field"><span>กอง</span><select name="pile_no" id="fastPileNo" class="production-pile-select" required>${fruitPileOptionMarkup(fastInputState.pile_no)}</select></label>
        <label class="field"><span>รหัสพนักงาน</span><input name="emp_code" id="fastEmpCode" inputmode="numeric" maxlength="8" value="${escapeHtml(fastInputState.emp_code)}" autocomplete="off" required /></label>
        <div class="employee-result"><span>พนักงาน</span><strong>${escapeHtml(employeeName)}</strong></div>
        <label class="field"><span>${escapeHtml(labels.weight)} (กก.)</span><input id="fastDurianWeight" class="production-pile-weight" type="number" min="0" step="0.1" value="${escapeHtml(fastInputState.durian_weight || "")}" placeholder="0.0" required /></label>
        <button class="btn btn-primary form-submit" type="submit" ${productionSaving ? "disabled" : ""}>${productionSaving ? "กำลังรับเข้าคิว..." : "บันทึก"}</button>
      </form>
      <p class="demo-note">กด Enter เพื่อไปช่องถัดไป, Ctrl+S เพื่อบันทึก, Esc เพื่อล้างฟอร์ม</p>
    </section>
    <section class="table-card production-latest-table"><div class="table-scroll"><table>
      <thead><tr><th>เลขที่</th><th>วันที่</th><th>เวลา</th><th>กอง</th><th>รหัส</th><th>${escapeHtml(labels.weight)}</th><th>อัตรา</th><th>รวมเงิน</th><th>สถานะ</th><th>ผู้บันทึก</th></tr></thead>
      <tbody>${latestRecords.length ? latestRecords.map(renderDurianRecordRow).join("") : `<tr><td colspan="10" class="empty-cell">ยังไม่มีรายการ${escapeHtml(fruitLabel)}วันนี้</td></tr>`}</tbody>
    </table></div></section>`;
}

function renderDurianRecordRow(record) {
  const weight = getRecordDurianWeight(record);
  const rate = Number(record.durian_rate || (weight > 0 ? Number(record.total_amount || 0) / weight : 0));
  return `<tr>
    <td>${record.id}</td><td>${escapeHtml(record.record_date)}</td><td>${escapeHtml(record.record_time)}</td><td>${record.pile_no}</td><td><strong>${escapeHtml(record.emp_code)}</strong></td>
    <td>${numberText(weight)} กก.</td><td>${rateMoney(rate)}</td>
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
    durian_weight: "",
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

async function saveProductionFastForm(user) {
  if (productionSaving) return;
  syncFastInputStateForSelectedFruit();
  if (isSingleWeightFruit()) {
    await saveDurianFastForm(user);
    return;
  }
  const pileInput = document.querySelector("#fastPileNo");
  const dateInput = document.querySelector("#fastRecordDate");
  const empInput = document.querySelector("#fastEmpCode");
  const waterInput = document.querySelector("#fastWaterWeight");
  const flowerInput = document.querySelector("#fastFlowerWeight");

  if (pileInput) fastInputState.pile_no = pileInput.value;
  if (!isConfiguredFruitPile(fastInputState.pile_no, true)) {
    setFastInputMessage("ยังไม่มีกองผลไม้ที่เปิดใช้งาน กรุณาเปิดกองในเมนู ตั้งค่า > กองผลไม้", "error");
    render();
    return;
  }
  if (dateInput?.value) productionRecordDate = dateInput.value;
  if (!isValidProductionRecordDate(productionRecordDate)) {
    setFastInputMessage("กรุณาเลือกวันที่บันทึกที่ถูกต้องและไม่เกินวันนี้", "error");
    render();
    return;
  }
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
    record_date: productionRecordDate,
    fruit_type: getSelectedProductionFruitId(),
    pile_no: fastInputState.pile_no,
    water_weight: waterWeight,
    flower_weight: flowerWeight
  };
  const duplicateWarning = getPotentialProductionDuplicateWarning(
    employee,
    [payload],
    productionRecordDate,
    getSelectedProductionFruitId()
  );
  if (duplicateWarning && !window.confirm(duplicateWarning)) {
    setFastInputMessage(`ยกเลิกบันทึก รหัส ${employee.emp_code} ข้อมูลที่กรอกไว้ยังอยู่`, "error");
    render();
    focusFastEmployeeCode();
    return;
  }

  try {
    productionSaving = true;
    setFastInputMessage("กำลังส่งเข้าคิวกลาง... กรุณารอสักครู่", "success");
    render();
    const record = buildProductionRecord({ ...payload, batch_uid: createProductionBatchUid() }, user);
    const queueItem = await enqueueProductionRows(record, {
      onStatus: (message) => {
        setFastInputMessage(message, "success");
        render();
      }
    });
    setFastInputMessage(`รับเข้าคิว #${productionQueueNumber(queueItem)} แล้ว: รหัส ${employee.emp_code} กอง ${payload.pile_no} รวม ${numberText(waterWeight + flowerWeight)} กก. สามารถกรอกรายการถัดไปได้ทันที`);
    clearFastInputForm(true);
  } catch (error) {
    setFastInputMessage(
      error instanceof Error ? error.message : "บันทึกขึ้น Cloud ไม่สำเร็จ",
      "error"
    );
  } finally {
    productionSaving = false;
    render();
    focusFastEmployeeCode();
  }
}

async function saveDurianFastForm(user) {
  if (productionSaving) return;
  const pileInput = document.querySelector("#fastPileNo");
  const dateInput = document.querySelector("#fastRecordDate");
  const empInput = document.querySelector("#fastEmpCode");
  if (pileInput) fastInputState.pile_no = pileInput.value;
  if (!isConfiguredFruitPile(fastInputState.pile_no, true)) {
    setFastInputMessage("ยังไม่มีกองผลไม้ที่เปิดใช้งาน กรุณาเปิดกองในเมนู ตั้งค่า > กองผลไม้", "error");
    render();
    return;
  }
  if (dateInput?.value) productionRecordDate = dateInput.value;
  if (!isValidProductionRecordDate(productionRecordDate)) {
    setFastInputMessage("กรุณาเลือกวันที่บันทึกที่ถูกต้องและไม่เกินวันนี้", "error");
    render();
    return;
  }
  if (empInput) updateFastEmployeeFromCode(empInput.value);
  const weightInput = document.querySelector("#fastDurianWeight");
  if (weightInput) fastInputState.durian_weight = weightInput.value;
  const employee = fastInputState.emp_code.length >= 2 ? apiGetEmployeeByCode(fastInputState.emp_code) : null;
  fastInputState.employee = employee;
  if (!employee) {
    setFastInputMessage("ต้องกรอกรหัสพนักงานที่มีอยู่และยังใช้งานอยู่", "error");
    render(); focusFastEmployeeCode(); return;
  }
  const labels = getProductionFieldLabels();
  const fruitType = getSelectedProductionFruitId();
  const fruitLabel = productionQueueFruitLabel(fruitType);
  const rawWeight = String(fastInputState.durian_weight || "").trim();
  const totalWeight = Number(rawWeight);
  if (!isOneDecimalWeightInput(rawWeight) || !Number.isFinite(totalWeight)) {
    setFastInputMessage(`${labels.weight}ต้องเป็นทศนิยมได้ไม่เกิน 1 ตำแหน่ง`, "error");
    render(); return;
  }
  if (totalWeight <= 0) {
    setFastInputMessage(`กรุณากรอก${labels.weight}มากกว่า 0`, "error");
    render(); return;
  }
  if (totalWeight > 500 && !window.confirm(`${labels.weight}รวมเกิน 500 กก. ต้องการบันทึกต่อหรือไม่?`)) return;
  const payload = { employee, record_date: productionRecordDate, fruit_type: fruitType, pile_no: fastInputState.pile_no, durian_weight: totalWeight };
  const duplicateWarning = getPotentialProductionDuplicateWarning(employee, [payload], productionRecordDate, fruitType);
  if (duplicateWarning && !window.confirm(duplicateWarning)) {
    setFastInputMessage(`ยกเลิกบันทึก${fruitLabel} รหัส ${employee.emp_code} ข้อมูลที่กรอกไว้ยังอยู่`, "error");
    render(); focusFastEmployeeCode(); return;
  }
  try {
    productionSaving = true;
    setFastInputMessage(`กำลังส่ง${fruitLabel}เข้าคิวกลาง... กรุณารอสักครู่`, "success");
    render();
    const record = buildProductionRecord({ ...payload, batch_uid: createProductionBatchUid() }, user);
    const queueItem = await enqueueProductionRows(record, {
      onStatus: (message) => {
        setFastInputMessage(message, "success");
        render();
      }
    });
    setFastInputMessage(`รับเข้าคิว #${productionQueueNumber(queueItem)} แล้ว: ${fruitLabel}รหัส ${employee.emp_code} กอง ${payload.pile_no} รวม ${numberText(totalWeight)} กก. สามารถกรอกรายการถัดไปได้ทันที`);
    clearFastInputForm(true);
  } catch (error) {
    setFastInputMessage(error instanceof Error ? error.message : `บันทึก${fruitLabel}ขึ้น Cloud ไม่สำเร็จ`, "error");
  } finally {
    productionSaving = false;
    render(); focusFastEmployeeCode();
  }
}

function bindProductionFastEvents(user) {
  syncFastInputStateForSelectedFruit();
  const form = document.querySelector("#productionFastForm");
  const dateInput = document.querySelector("#fastRecordDate");
  const pileInput = document.querySelector("#fastPileNo");
  const empInput = document.querySelector("#fastEmpCode");
  const waterInput = document.querySelector("#fastWaterWeight");
  const flowerInput = document.querySelector("#fastFlowerWeight");
  const durianWeightInput = document.querySelector("#fastDurianWeight");
  const orderedInputs = [dateInput, pileInput, empInput, waterInput, flowerInput, durianWeightInput].filter(Boolean);

  focusFastEmployeeCode();
  if (empInput?.value) {
    updateFastEmployeeFromCode(empInput.value);
    empInput.value = fastInputState.emp_code;
    updateFastEmployeeResultText();
  }

  pileInput?.addEventListener("change", (event) => {
    fastInputState.pile_no = event.target.value;
    applyProductionPileTone(form, event.target.value);
  });

  dateInput?.addEventListener("change", (event) => {
    productionRecordDate = event.target.value || localDateInputValue();
    render();
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

  durianWeightInput?.addEventListener("input", (event) => {
    fastInputState.durian_weight = event.target.value;
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProductionFastForm(user);
  });

  form?.addEventListener("keydown", (event) => {
    if (productionSaving) {
      event.preventDefault();
      return;
    }
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
  window.ProductionPull?.bind({
    cloudRequest: cloudApiRequest,
    canImport: () => canImportDesktopWeighing(getSession()?.user), refresh: render,
    isImportBusy: () => desktopImportBusy,
    loadMasters: async () => {
      const response = await cloudApiRequest('/api/employees');
      if (!Array.isArray(response.data) || !response.data.length) throw Error('ไม่พบรายชื่อพนักงานในเว็บ');
      return { employees: response.data.map(e => ({ id: String(e.id), emp_code: e.emp_code, fullname: e.fullname, status: e.status })), catalog: getDesktopCatalogPayload() };
    },
    clearPreview: () => { desktopImportPreview = null; desktopImportMessage = ""; },
    preview: (payload) => {
      desktopImportPreview = prepareDesktopWeighingImport(payload);
      desktopImportPreview.fileName = payload.file_name;
      desktopImportMessage = payload.demo_records ? `ข้อมูลทดสอบจากเครื่องชั่งจำลอง ${payload.demo_records} รายการ · ใช้สำหรับโครงงานประกวดเท่านั้น · ยังไม่ได้ส่งเข้าคิว` : "ตรวจรายการจากเครื่องต้นทางแล้ว ยังไม่ได้ส่งเข้าคิว";
    },
    confirm: () => submitDesktopWeighingImport(getSession()?.user, Boolean(desktopImportPreview?.review))
  });
  document.querySelector("[data-open-production-pull]")?.addEventListener("click", () => {
    if (!canEditProductionRecords(getSession()?.user)) return;
    productionView = "desktop-pull";
    render();
    document.querySelector("#productionPullTitle")?.focus();
  });
  document.querySelector("[data-close-production-pull]")?.addEventListener("click", () => {
    productionView = "fast-entry";
    render();
    document.querySelector("[data-open-production-pull]")?.focus();
  });
  document.querySelector("[data-open-fruit-creator]")?.addEventListener("click", () => {
    productionFruitCreatorOpen = true;
    render();
  });
  document.querySelector("[data-close-fruit-creator]")?.addEventListener("click", () => {
    productionFruitCreatorOpen = false;
    render();
  });
  document.querySelector("[data-add-fruit-category]")?.addEventListener("click", () => {
    const list = document.querySelector("[data-fruit-category-list]");
    if (!list) return;
    list.insertAdjacentHTML("beforeend", `<div class="production-fruit-category-row"><input name="categories" maxlength="50" placeholder="ชื่อประเภทน้ำหนัก" required /><button class="btn btn-outline" data-remove-fruit-category type="button" aria-label="ลบประเภท">ลบ</button></div>`);
    list.lastElementChild?.querySelector("input")?.focus();
  });
  document.querySelector("[data-fruit-category-list]")?.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-fruit-category]");
    if (!removeButton) return;
    const rows = document.querySelectorAll(".production-fruit-category-row");
    if (rows.length <= 1) {
      rows[0]?.querySelector("input")?.focus();
      return;
    }
    removeButton.closest(".production-fruit-category-row")?.remove();
  });
  document.querySelector("#productionFruitCreatorForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label = String(form.get("label") || "").trim();
    const categories = form.getAll("categories").map((value) => String(value || "").trim()).filter(Boolean);
    if (!label || !categories.length) {
      setProductionMessage("กรุณากรอกชื่อผลไม้และประเภทน้ำหนักอย่างน้อย 1 ประเภท", "error");
      render();
      return;
    }
    const uniqueCategories = [...new Set(categories)];
    const createdAt = Date.now();
    const configs = uniqueCategories.map((category, index) => ({
      id: `custom-fruit-${createdAt}-${index + 1}`,
      label: uniqueCategories.length === 1 ? label : `${label} - ${category}`,
      mode: "single",
      weight: category,
      parent_label: label,
      weight_category: category
    }));
    configs.forEach(saveCustomProductionFruit);
    productionFruitCreatorOpen = false;
    setProductionMessage(`เพิ่ม${label} ${configs.length} ประเภทแล้ว กรุณาตั้งอัตราค่าจ้างก่อนเริ่มบันทึก`, "success");
    setSelectedProductionFruit(configs[0].id);
    render();
  });

  document.querySelector("[data-open-production-editor]")?.addEventListener("click", () => {
    if (!canEditProductionRecords(user)) {
      setProductionMessage("กรุณาเข้าสู่ระบบก่อนแก้ไขข้อมูลผลผลิต", "error");
      render();
      return;
    }
    productionEditorOpen = true;
    productionEditorDate = productionRecordDate || localDateInputValue();
    productionEditorFruit = selectedProductionFruit || "mangosteen";
    productionEditorSelectedIds = [];
    productionEditorBatchDate = productionEditorDate;
    editingProductionRecordId = null;
    deletingProductionRecordId = null;
    productionEditorMessage = "";
    render();
  });

  document.querySelector("[data-close-production-editor]")?.addEventListener("click", () => {
    productionEditorOpen = false;
    productionEditorSelectedIds = [];
    productionEditorBatchDate = "";
    editingProductionRecordId = null;
    deletingProductionRecordId = null;
    productionEditorMessage = "";
    setSelectedProductionFruit("");
    render();
  });

  document.querySelector("#productionEditorDate")?.addEventListener("change", (event) => {
    productionEditorDate = event.target.value || localDateInputValue();
    productionEditorSelectedIds = [];
    productionEditorBatchDate = productionEditorDate;
    editingProductionRecordId = null;
    deletingProductionRecordId = null;
    productionEditorMessage = "";
    render();
  });

  document.querySelector("#productionEditorFruit")?.addEventListener("change", (event) => {
    productionEditorFruit = event.target.value || "mangosteen";
    productionEditorSelectedIds = [];
    editingProductionRecordId = null;
    deletingProductionRecordId = null;
    productionEditorMessage = "";
    render();
  });

  const productionEditorSearchInput = document.querySelector("#productionEditorSearch");
  productionEditorSearchInput?.addEventListener("input", (event) => {
    productionEditorEmployeeSearch = event.target.value;
  });
  productionEditorSearchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    editingProductionRecordId = null;
    deletingProductionRecordId = null;
    render();
  });
  productionEditorSearchInput?.addEventListener("change", () => {
    editingProductionRecordId = null;
    deletingProductionRecordId = null;
    render();
  });

  const selectAllProductionEditor = document.querySelector("[data-select-all-production-editor]");
  if (selectAllProductionEditor) {
    const visibleIds = getProductionEditorRecords(user).map((record) => Number(record.id));
    const selectedVisibleCount = visibleIds.filter((id) => productionEditorSelectedIds.includes(id)).length;
    selectAllProductionEditor.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
    selectAllProductionEditor.addEventListener("change", () => {
      const visibleIdSet = new Set(visibleIds);
      const preserved = productionEditorSelectedIds.filter((id) => !visibleIdSet.has(Number(id)));
      productionEditorSelectedIds = selectAllProductionEditor.checked ? [...preserved, ...visibleIds] : preserved;
      editingProductionRecordId = null;
      deletingProductionRecordId = null;
      productionEditorMessage = "";
      render();
    });
  }

  document.querySelectorAll("[data-production-editor-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const recordId = Number(checkbox.dataset.productionEditorSelect);
      if (checkbox.checked) {
        productionEditorSelectedIds = [...new Set([...productionEditorSelectedIds, recordId])];
      } else {
        productionEditorSelectedIds = productionEditorSelectedIds.filter((id) => Number(id) !== recordId);
      }
      editingProductionRecordId = null;
      deletingProductionRecordId = null;
      productionEditorMessage = "";
      render();
    });
  });

  document.querySelector("[data-clear-production-selection]")?.addEventListener("click", () => {
    productionEditorSelectedIds = [];
    productionEditorMessage = "";
    render();
  });

  document.querySelector("#productionBatchDateForm input[name='record_date']")?.addEventListener("change", (event) => {
    productionEditorBatchDate = event.target.value;
  });

  document.querySelector("#productionBatchDateForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (productionEditorSaving) return;
    saveProductionEditorBatchDate(user, event.currentTarget);
  });

  document.querySelectorAll("[data-select-production-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const recordId = Number(button.dataset.selectProductionEdit);
      const record = getProductionRecords().find((item) => Number(item.id) === recordId);
      if (!canEditProductionRecord(user, record)) {
        productionEditorMessage = "สิทธิ์แก้ไขรายการนี้หมดเวลาแล้ว หรือไม่ใช่รายการที่คุณบันทึก";
        productionEditorMessageType = "error";
        render();
        return;
      }
      editingProductionRecordId = recordId;
      deletingProductionRecordId = null;
      productionEditorMessage = "";
      render();
      window.setTimeout(() => document.querySelector("#productionEditForm")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    });
  });

  document.querySelector("[data-cancel-production-edit]")?.addEventListener("click", () => {
    editingProductionRecordId = null;
    productionEditorMessage = "";
    render();
  });

  document.querySelectorAll("[data-select-production-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canDeleteProductionRecords(user)) return;
      deletingProductionRecordId = Number(button.dataset.selectProductionDelete);
      editingProductionRecordId = null;
      productionEditorMessage = "";
      render();
      window.setTimeout(() => document.querySelector("#productionDeleteForm")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    });
  });

  document.querySelector("[data-cancel-production-delete]")?.addEventListener("click", () => {
    deletingProductionRecordId = null;
    productionEditorMessage = "";
    render();
  });

  document.querySelector("#productionEditForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProductionEditorRecord(user, event.currentTarget);
  });

  document.querySelector("#productionDeleteForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    deleteProductionEditorRecord(user, event.currentTarget);
  });

  if (productionEditorOpen) return;

  document.querySelectorAll("[data-open-production-queue]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canEditProductionRecords(getSession()?.user)) return;
      productionView = "queue";
      productionQueueMessage = "";
      productionQueuePage = 1;
      render();
      refreshProductionQueue();
      scheduleProductionQueueRefresh();
    });
  });

  document.querySelector("[data-close-production-queue]")?.addEventListener("click", () => {
    if (productionQueuePollTimer) window.clearTimeout(productionQueuePollTimer);
    productionQueuePollTimer = null;
    productionView = "fast-entry";
    productionQueueMessage = "";
    render();
  });

  if (productionView === "queue") {
    document.querySelectorAll("[data-queue-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        productionQueueFilter = button.dataset.queueFilter || "all";
        productionQueuePage = 1;
        render();
      });
    });
    const queueSearch = document.querySelector("#productionQueueSearch");
    queueSearch?.addEventListener("input", (event) => {
      productionQueueSearch = event.target.value;
    });
    queueSearch?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      productionQueuePage = 1;
      render();
    });
    queueSearch?.addEventListener("change", () => {
      productionQueuePage = 1;
      render();
    });
    document.querySelectorAll("[data-queue-page]").forEach((button) => {
      button.addEventListener("click", () => {
        productionQueuePage = Math.max(1, Number(button.dataset.queuePage) || 1);
        render();
      });
    });
    document.querySelectorAll("[data-queue-verify]").forEach((button) => button.addEventListener("click", () => runProductionQueueAction(Number(button.dataset.queueVerify), "verify")));
    document.querySelectorAll("[data-queue-retry]").forEach((button) => button.addEventListener("click", () => {
      if (!window.confirm("ยืนยันส่งข้อมูลต้นฉบับเดิมกลับเข้าคิวอีกครั้ง? ระบบจะตรวจข้อมูลซ้ำก่อนบันทึก")) return;
      runProductionQueueAction(Number(button.dataset.queueRetry), "retry");
    }));
    document.querySelectorAll("[data-queue-cancel]").forEach((button) => button.addEventListener("click", () => {
      const reason = window.prompt("ระบุเหตุผลที่ยกเลิกคิวนี้");
      if (reason === null) return;
      if (reason.trim().length < 3) {
        productionQueueMessage = "กรุณาระบุเหตุผลการยกเลิกอย่างน้อย 3 ตัวอักษร";
        productionQueueMessageType = "error";
        render();
        return;
      }
      runProductionQueueAction(Number(button.dataset.queueCancel), "cancel", { reason: reason.trim() });
    }));
    document.querySelectorAll("[data-queue-link]").forEach((button) => button.addEventListener("click", () => {
      const recordIds = String(button.dataset.recordIds || "").split(",").map(Number).filter((id) => id > 0);
      if (!recordIds.length || !window.confirm(`ยืนยันเชื่อมคิวนี้กับรายการเดิม ${recordIds.map((id) => `#${id}`).join(", ")}?`)) return;
      runProductionQueueAction(Number(button.dataset.queueLink), "link-existing", { record_ids: recordIds });
    }));
    updateProductionQueueBadges();
    scheduleProductionQueueRefresh();
    return;
  }

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

  document.querySelector("#batchRecordDate")?.addEventListener("change", (event) => {
    productionRecordDate = event.target.value || localDateInputValue();
  });

  document.querySelector("#batchFlowerPile")?.addEventListener("change", (event) => {
    batchGridState.flower_pile_no = event.target.value;
    render();
    window.setTimeout(() => focusBatchWeightInput("flower"), 0);
  });

  document.querySelector("#batchWaterPile")?.addEventListener("change", (event) => {
    batchGridState.water_pile_no = event.target.value;
    render();
    window.setTimeout(() => focusBatchWeightInput("water"), 0);
  });

  document.querySelector("#batchDurianPile")?.addEventListener("change", (event) => {
    batchGridState.durian_pile_no = event.target.value;
    render();
    window.setTimeout(() => focusBatchWeightInput("durian"), 0);
  });

  document.querySelectorAll("[data-batch-weight]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const type = event.target.dataset.batchWeight;
      const index = Number(event.target.dataset.batchIndex);
      const values = getBatchPileWeights(type);
      values[index] = event.target.value;
    });
    input.addEventListener("keydown", handleBatchWeightShortcut);
  });

  document.querySelectorAll("[data-durian-batch-weight]").forEach((input) => {
    input.addEventListener("keydown", handleBatchWeightShortcut);
    input.addEventListener("input", (event) => {
      const index = Number(event.target.dataset.batchIndex);
      getBatchPileWeights("durian")[index] = event.target.value;
    });
  });

  const batchInputs = [
    document.querySelector("#batchRecordDate"),
    document.querySelector("#batchEmpCode"),
    ...document.querySelectorAll("[data-batch-weight='flower']"),
    ...document.querySelectorAll("[data-batch-weight='water']")
    ,...document.querySelectorAll("[data-durian-batch-weight]")
  ].filter(Boolean);

  document.querySelector("#productionBatchEntry")?.addEventListener("keydown", (event) => {
    if (!isBatchProductionSaveShortcut(event)) return;
    event.preventDefault();
    if (productionSaving) return;
    saveBatchEntries(user);
  });

  batchInputs.forEach((input, index) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (productionSaving) return;
      if (isBatchProductionSaveShortcut(event)) {
        event.stopPropagation();
        if (!productionSaving) saveBatchEntries(user);
        return;
      }
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
    if (productionSaving) return;
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
      const record = getProductionRecords().find((item) => Number(item.id) === Number(button.dataset.editProduction));
      if (!canEditProductionRecord(user, record)) {
        setProductionMessage("C1-C3 แก้ไขได้เฉพาะรายการที่ตนเองบันทึกภายใน 5 นาที", "error");
        render();
        return;
      }
      productionEditorOpen = true;
      productionEditorDate = getRecordDate(record);
      productionEditorFruit = productionFruitTypeForRecord(record);
      editingProductionRecordId = record.id;
      deletingProductionRecordId = null;
      productionEditorMessage = "";
      render();
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
    if (!isConfiguredFruitPile(pileNo, true)) {
      errors.push(`แถว ${rowNo}: ไม่พบกองนี้หรือกองถูกปิดการแสดงผล`);
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
    flower_pile_no: "1",
    water_pile_no: "1",
    durian_pile_no: "1",
    flower_weights_by_pile: createBatchPileWeightMap(),
    water_weights_by_pile: createBatchPileWeightMap(),
    durian_weights_by_pile: createBatchPileWeightMap()
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
  const entries = [];

  values.forEach((value, index) => {
    const raw = String(value).trim();
    if (!raw) return;

    const weight = Number(raw);
    if (!isOneDecimalWeightInput(raw) || !Number.isFinite(weight) || weight < 0) {
      errors.push(`${label} ช่อง ${index + 1} ต้องเป็นตัวเลขทศนิยมได้ไม่เกิน 1 ตำแหน่ง เช่น 0.5 หรือ 1.9`);
      return;
    }
    weights.push(weight);
    entries.push({ input_no: index + 1, value: weight });
  });

  return { errors, weights, entries };
}

function addBatchGroup(groups, pileNo, water, flower) {
  const existing = groups.get(pileNo) || { pileNo, water: 0, flower: 0 };
  existing.water += water;
  existing.flower += flower;
  groups.set(pileNo, existing);
}

function getNextBatchWeightInputIndex(type) {
  const values = getBatchPileWeights(type);
  const emptyIndex = values.findIndex((value) => String(value ?? "").trim() === "");
  if (emptyIndex >= 0) return emptyIndex;
  return Math.max(0, values.length - 1);
}

function focusBatchWeightInput(type, index = null) {
  const targetIndex = Number.isInteger(index) ? index : getNextBatchWeightInputIndex(type);
  const selector = type === "durian" ? "[data-durian-batch-weight]" : `[data-batch-weight='${type}']`;
  const input = document.querySelector(`${selector}[data-batch-index='${targetIndex}']`)
    || document.querySelector(selector);
  if (!input) return;
  input.focus();
  input.select?.();
}

function changeBatchPile(type, direction) {
  const field = type === "durian" ? "durian_pile_no" : type === "flower" ? "flower_pile_no" : "water_pile_no";
  const visiblePileNumbers = getVisibleFruitPiles().map((pile) => pile.number);
  if (!visiblePileNumbers.length) return;
  const currentIndex = Math.max(0, visiblePileNumbers.indexOf(Number(batchGridState[field])));
  const nextIndex = Math.min(visiblePileNumbers.length - 1, Math.max(0, currentIndex + direction));
  if (nextIndex === currentIndex) return;
  batchGridState[field] = String(visiblePileNumbers[nextIndex]);
  render();
  window.setTimeout(() => focusBatchWeightInput(type), 0);
}

function handleBatchWeightShortcut(event) {
  if (productionSaving) {
    event.preventDefault();
    return;
  }
  const type = event.currentTarget.dataset.batchWeight || "durian";
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    changeBatchPile(type, event.key === "ArrowUp" ? -1 : 1);
  } else if (type !== "durian" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    event.preventDefault();
    focusBatchWeightInput(type === "flower" ? "water" : "flower");
  }
}

async function saveBatchEntries(user) {
  if (!getVisibleFruitPiles().length) {
    setProductionMessage("ยังไม่มีกองผลไม้ที่เปิดใช้งาน กรุณาเปิดกองในเมนู ตั้งค่า > กองผลไม้", "error");
    render();
    return;
  }
  if (productionSaving) return;
  if (isSingleWeightFruit()) {
    await saveDurianBatchEntries(user);
    return;
  }
  syncBatchEmployeeFromInput();
  const selectedDate = document.querySelector("#batchRecordDate")?.value;
  if (selectedDate) productionRecordDate = selectedDate;
  if (!isValidProductionRecordDate(productionRecordDate)) {
    setProductionMessage("กรุณาเลือกวันที่บันทึกที่ถูกต้องและไม่เกินวันนี้", "error");
    render();
    return;
  }
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

  getVisibleFruitPiles().forEach(({ number: pileNo }) => {
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
      groups.get(pileNo).raw_weight_entries = [
        ...waterResult.entries.map((entry) => ({ ...entry, weight_type: "water" })),
        ...flowerResult.entries.map((entry) => ({ ...entry, weight_type: "flower" }))
      ];
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
  const batchPayloads = Array.from(groups.values()).map((group) => ({
    employee,
    record_date: productionRecordDate,
    fruit_type: getSelectedProductionFruitId(),
    pile_no: group.pileNo,
    water_weight: group.water,
    flower_weight: group.flower,
    entry_mode: "batch",
    raw_weight_entries: group.raw_weight_entries
  }));
  const duplicateWarning = getPotentialProductionDuplicateWarning(
    employee,
    batchPayloads,
    productionRecordDate,
    getSelectedProductionFruitId()
  );
  if (duplicateWarning && !window.confirm(duplicateWarning)) {
    setProductionMessage(`ยกเลิกบันทึกชุด รหัส ${employee.emp_code} ข้อมูลในตารางยังอยู่ กรุณาตรวจสอบอีกครั้ง`, "error");
    render();
    window.setTimeout(() => document.querySelector("#batchEmpCode")?.focus(), 0);
    return;
  }

  try {
    productionSaving = true;
    setProductionMessage("กำลังส่งชุดนี้เข้าคิวกลาง... กรุณารอสักครู่");
    render();
    const batchUid = createProductionBatchUid();
    const createdRecords = batchPayloads.map((payload) => buildProductionRecord({ ...payload, batch_uid: batchUid }, user));
    var queueItem = await enqueueProductionRows(createdRecords, {
      onStatus: (message) => {
        setProductionMessage(message);
        render();
      }
    });
  } catch (error) {
    setProductionMessage(
      error instanceof Error ? error.message : "บันทึกผลผลิตแบบชุดขึ้น Cloud ไม่สำเร็จ",
      "error"
    );
    productionSaving = false;
    render();
    return;
  }

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
  const successMessage = `รับชุดนี้เข้าคิว #${productionQueueNumber(queueItem)} แล้ว: รหัส ${employee.emp_code}\nรวม ${batchPayloads.length} รายการ\n${summaryLines.join("\n")}\nน้ำหนักทั้งหมด ${numberText(grandTotal)} กก.\nสามารถกรอกพนักงานคนถัดไปได้ทันที`;

  clearBatchGridState();
  setProductionMessage(successMessage, "success");
  productionSaving = false;
  render();
  window.setTimeout(() => document.querySelector("#batchEmpCode")?.focus(), 0);
}

async function saveDurianBatchEntries(user) {
  if (!getVisibleFruitPiles().length) {
    setProductionMessage("ยังไม่มีกองผลไม้ที่เปิดใช้งาน กรุณาเปิดกองในเมนู ตั้งค่า > กองผลไม้", "error");
    render();
    return;
  }
  if (productionSaving) return;
  syncBatchEmployeeFromInput();
  const selectedDate = document.querySelector("#batchRecordDate")?.value;
  if (selectedDate) productionRecordDate = selectedDate;
  if (!isValidProductionRecordDate(productionRecordDate)) {
    setProductionMessage("กรุณาเลือกวันที่บันทึกที่ถูกต้องและไม่เกินวันนี้", "error");
    render();
    return;
  }
  const employee = batchGridState.employee;
  const labels = getProductionFieldLabels();
  const fruitType = getSelectedProductionFruitId();
  const fruitLabel = productionQueueFruitLabel(fruitType);
  if (!employee) {
    setProductionMessage("กรุณากรอกรหัสพนักงานที่มีอยู่และยังใช้งานอยู่", "error");
    render();
    window.setTimeout(() => document.querySelector("#batchEmpCode")?.focus(), 0);
    return;
  }
  const groups = new Map();
  const errors = [];
  getVisibleFruitPiles().forEach(({ number: pileNo }) => {
    const result = readBatchWeightValues(getBatchPileWeights("durian", pileNo), `${labels.weight} กอง ${pileNo}`);
    errors.push(...result.errors);
    const total = result.weights.reduce((sum, weight) => sum + weight, 0);
    if (total > 0) groups.set(pileNo, {
      pileNo,
      durian_weight: total,
      raw_weight_entries: result.entries.map((entry) => ({ ...entry, weight_type: fruitType }))
    });
  });
  if (errors.length) {
    setProductionMessage(errors.join("\n"), "error"); render(); return;
  }
  if (!groups.size) {
    setProductionMessage(`กรุณากรอก${labels.weight}อย่างน้อย 1 ช่อง`, "error"); render(); return;
  }
  const overLimit = [...groups.values()].some((group) => group.durian_weight > 500);
  if (overLimit && !window.confirm("ผลรวมน้ำหนักทุเรียนบางกองเกิน 500 กก. ต้องการบันทึกต่อหรือไม่?")) return;
  const batchPayloads = [...groups.values()].map((group) => ({
    employee,
    record_date: productionRecordDate,
    fruit_type: fruitType,
    pile_no: group.pileNo,
    durian_weight: group.durian_weight,
    entry_mode: "batch",
    raw_weight_entries: group.raw_weight_entries
  }));
  const duplicateWarning = getPotentialProductionDuplicateWarning(employee, batchPayloads, productionRecordDate, fruitType);
  if (duplicateWarning && !window.confirm(duplicateWarning)) {
    setProductionMessage(`ยกเลิกบันทึก${fruitLabel}ชุด รหัส ${employee.emp_code} ข้อมูลในตารางยังอยู่ กรุณาตรวจสอบอีกครั้ง`, "error");
    render();
    window.setTimeout(() => document.querySelector("#batchEmpCode")?.focus(), 0);
    return;
  }
  try {
    productionSaving = true;
    setProductionMessage(`กำลังส่ง${fruitLabel}ชุดนี้เข้าคิวกลาง... กรุณารอสักครู่`);
    render();
    const batchUid = createProductionBatchUid();
    const createdRecords = batchPayloads.map((payload) => buildProductionRecord({ ...payload, batch_uid: batchUid }, user));
    var queueItem = await enqueueProductionRows(createdRecords, {
      onStatus: (message) => {
        setProductionMessage(message);
        render();
      }
    });
  } catch (error) {
    setProductionMessage(error instanceof Error ? error.message : `บันทึก${fruitLabel}แบบชุดขึ้น Cloud ไม่สำเร็จ`, "error");
    productionSaving = false;
    render();
    return;
  }
  const lines = [...groups.values()].sort((a,b) => a.pileNo-b.pileNo).map((group) =>
    `กอง ${group.pileNo}: ${numberText(group.durian_weight)} กก.`
  );
  const grandTotal = [...groups.values()].reduce((sum, group) => sum + group.durian_weight, 0);
  const message = `รับ${fruitLabel}แบบชุดเข้าคิว #${productionQueueNumber(queueItem)} แล้ว: รหัส ${employee.emp_code}\nรวม ${batchPayloads.length} รายการ\n${lines.join("\n")}\nน้ำหนักรวม ${numberText(grandTotal)} กก.\nสามารถกรอกพนักงานคนถัดไปได้ทันที`;
  clearBatchGridState();
  setProductionMessage(message);
  productionSaving = false;
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
    const weight = window.prompt("น้ำหนักทุเรียน", String(getRecordDurianWeight(record)));
    if (weight === null) return;
    if (
      !isConfiguredFruitPile(pileNo, true) ||
      !isOneDecimalWeightInput(weight) ||
      Number(weight) <= 0
    ) {
      setProductionMessage("กรุณาเลือกกองที่เปิดใช้งาน และน้ำหนักทุเรียนต้องมากกว่า 0 โดยมีทศนิยมไม่เกิน 1 ตำแหน่ง", "error");
      render();
      return;
    }
    try {
      apiUpdateProductionRecord(record.id, {
        employee,
        fruit_type: "durian",
        pile_no: pileNo,
        durian_weight: Number(weight)
      }, user);
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
    !isConfiguredFruitPile(pileNo, true) ||
    !Number.isFinite(waterWeight) ||
    !Number.isFinite(flowerWeight) ||
    waterWeight < 0 ||
    flowerWeight < 0
  ) {
    setProductionMessage(`กรุณาเลือกกองที่เปิดใช้งาน และ${labels.water}/${labels.flower}ต้องเป็นตัวเลขไม่ติดลบ`, "error");
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

function renderWageRateForm(user) {
  const wageRateTypeOptions = getWageRateTypeOptions();
  const rates = apiGetWageRates(wageRateFilter);
  const allRates = apiGetWageRates("all");
  const canManage = canManageWageRates(user);
  const editingRate = editingWageRateId
    ? allRates.find((rate) => Number(rate.id) === Number(editingWageRateId))
    : null;
  const latestByType = new Map();
  wageRateTypeOptions.forEach((option) => {
    latestByType.set(option.value, allRates.find((rate) => rate.item_type === option.value) || null);
  });
  const latestPreviewOptions = wageRateTypeOptions.slice(0, 3);

  return `
    <div class="wage-rate-page">
    <section class="panel wage-rate-hero">
      <div class="wage-rate-head">
        <div>
          <span class="wage-rate-eyebrow">WAGE SETTINGS</span>
          <h2>ตั้งค่าอัตราค่าจ้าง</h2>
          <p>กำหนดอัตราใหม่โดยเก็บประวัติเดิมไว้สำหรับตรวจสอบย้อนหลัง</p>
        </div>
        <span class="wage-rate-count">${allRates.length.toLocaleString("th-TH")} รายการ</span>
      </div>
      <div class="wage-rate-latest">
        ${latestPreviewOptions
          .map((option) => {
            const latestRate = latestByType.get(option.value);
            return `<div><span>${escapeHtml(option.label)}</span><strong>${latestRate ? rateMoney(latestRate.rate) : "-"}</strong><small>${latestRate ? `เริ่มใช้ ${escapeHtml(latestRate.effective_date)}` : "ยังไม่มีข้อมูล"}</small></div>`;
          })
          .join("")}
      </div>
    </section>

    <section class="panel wage-rate-editor">
      <div class="wage-rate-editor-head">
        <div><span>${editingRate ? "EDIT RATE" : "NEW RATE"}</span><h3>${editingRate ? `แก้ไขอัตรา #${editingRate.id}` : "เพิ่มอัตราใหม่"}</h3></div>
        <p>${canManage ? "สิทธิ์ C4 ขึ้นไป" : "ดูข้อมูลเท่านั้น"}</p>
      </div>
      <form class="rate-form" id="wageRateForm">
        <label class="field">
          <span>ชนิดงาน / ผลไม้</span>
          <select name="item_type" required ${canManage ? "" : "disabled"}>
            ${wageRateTypeOptions
              .map((option) => `<option value="${escapeHtml(option.value)}" ${editingRate?.item_type === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
              .join("")}
          </select>
        </label>

        <label class="field">
          <span>อัตราค่าจ้างต่อหน่วย</span>
          <input name="rate" type="number" min="0.01" step="0.01" value="${editingRate ? escapeHtml(String(editingRate.rate)) : ""}" required ${canManage ? "" : "disabled"} />
        </label>

        <label class="field">
          <span>วันที่เริ่มใช้ (ใช้ต่อเนื่อง)</span>
          <input name="effective_date" type="date" value="${escapeHtml(editingRate?.effective_date || currentRateDate)}" required ${canManage ? "" : "disabled"} />
        </label>

        <button class="btn btn-primary form-submit" type="submit" ${canManage ? "" : "disabled"}>${editingRate ? "บันทึกการแก้ไข" : "เพิ่มอัตรา"}</button>
        ${editingRate ? `<button class="btn btn-outline" id="cancelWageRateEdit" type="button">ยกเลิกแก้ไข</button>` : ""}
      </form>
    </section>

    <section class="table-card wage-rate-history">
      <div class="wage-rate-history-head">
        <div><h3>ประวัติอัตราค่าจ้าง</h3><p>แสดง ${rates.length.toLocaleString("th-TH")} จาก ${allRates.length.toLocaleString("th-TH")} รายการ</p></div>
        <div class="wage-rate-filters">
          <label><span>ประเภท</span><select id="wageRateFilter">${[["all", "ทั้งหมด"], ...wageRateTypeOptions.map((option) => [option.value, option.label])].map(([value, label]) => `<option value="${value}" ${wageRateFilter === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
          <label><span>วันที่เริ่มต้น</span><input id="currentRateDate" type="date" value="${escapeHtml(currentRateDate)}" /></label>
        </div>
      </div>
      <div class="table-scroll">
        <table class="wage-rate-table">
          <thead>
            <tr><th>ID</th><th>ชนิดงาน</th><th>อัตรา</th><th>วันที่เริ่มใช้</th><th>บันทึกโดย</th><th>วันที่บันทึก</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            ${rates.length ? rates.map((rate) => renderWageRateRow(rate, canManage)).join("") : `<tr><td colspan="7" class="empty-cell">ยังไม่มีประวัติอัตราค่าจ้าง</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
    </div>
  `;
}
function renderWageRateRow(wageRate, canManage = false) {
  return `
    <tr>
      <td>${wageRate.id}</td>
      <td><span class="badge badge-warning">${escapeHtml(wageRateTypeLabel(wageRate.item_type))}</span></td>
      <td><strong>${rateMoney(wageRate.rate)}</strong></td>
      <td>${escapeHtml(wageRate.effective_date)}</td>
      <td>${escapeHtml(wageRate.created_by)}</td>
      <td>${formatDate(wageRate.created_at)}</td>
      <td>${canManage ? `<button class="btn btn-small btn-outline" data-edit-wage-rate="${wageRate.id}" type="button">แก้ไข</button>` : `<span class="muted-text">C4+</span>`}</td>
    </tr>
  `;
}

function bindWageRateEvents(user) {
  document.querySelector("#currentRateDate")?.addEventListener("change", (event) => {
    currentRateDate = event.target.value || localDateInputValue();
    render();
  });

  document.querySelector("#wageRateFilter")?.addEventListener("change", (event) => {
    wageRateFilter = event.target.value;
    render();
  });

  document.querySelectorAll("[data-edit-wage-rate]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canManageWageRates(user)) {
        window.alert("บัญชี C4 ขึ้นไปเท่านั้นที่แก้ไขอัตราค่าจ้างได้");
        return;
      }
      editingWageRateId = Number(button.dataset.editWageRate);
      render();
    });
  });

  document.querySelector("#cancelWageRateEdit")?.addEventListener("click", () => {
    editingWageRateId = null;
    render();
  });

  document.querySelector("#wageRateForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!canManageWageRates(user)) {
      window.alert("บัญชี C4 ขึ้นไปเท่านั้นที่เพิ่มหรือแก้ไขอัตราค่าจ้างได้");
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      item_type: String(form.get("item_type")),
      rate: String(form.get("rate")),
      effective_date: String(form.get("effective_date"))
    };

    try {
      if (editingWageRateId) {
        await apiUpdateWageRate(editingWageRateId, payload, user.fullname);
        editingWageRateId = null;
      } else {
        await apiCreateWageRate(payload, user.fullname);
      }
      render();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Save failed.");
    }
  });
}

function normalizeDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    const today = localDateInputValue();
    return { startDate: today, endDate: today };
  }

  const start = startDate || endDate;
  const end = endDate || startDate;
  return start <= end
    ? { startDate: start, endDate: end }
    : { startDate: end, endDate: start };
}

function recordsForPersonalReport(employeeId, startDate, endDate, fruitId = "all") {
  const range = normalizeDateRange(startDate, endDate);
  return getProductionRecords()
    .filter((record) => {
      const recordDate = record.record_date || record.date || "";
      return (
        Number(record.employee_id) === Number(employeeId) &&
        recordDate >= range.startDate &&
        recordDate <= range.endDate &&
        (fruitId === "all" || productionFruitTypeForRecord(record) === fruitId)
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
    const pile = normalizeProductionPileNumber(record.pile_no ?? record.pile);
    const pileKey = pile ?? "-";
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

  return Array.from(summaries.values()).sort((a, b) => {
    if (a.pile === "-") return 1;
    if (b.pile === "-") return -1;
    return a.pile - b.pile;
  });
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
                <th>น้ำหนักทุเรียน</th>
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
                <th>น้ำหนักทุเรียน</th>
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

function renderPersonalDailyRow(item, fruitId = personalReportFruitFilter) {
  const isSingleWeight = isSingleWeightFruit(fruitId);
  return `
    <tr>
      <td><strong>${escapeHtml(item.date)}</strong></td>
      ${isSingleWeight
        ? `<td>${numberText(item.total)}</td>`
        : `<td>${numberText(item.water)}</td><td>${numberText(item.flower)}</td>`}
      <td><strong>${numberText(item.total)}</strong></td>
      <td><strong>${money(item.amount)}</strong></td>
    </tr>
  `;
}

function renderPersonalPileRow(item, fruitId = personalReportFruitFilter) {
  const isSingleWeight = isSingleWeightFruit(fruitId);
  return `
    <tr>
      <td><strong>กอง ${escapeHtml(item.pile)}</strong></td>
      <td>${item.count.toLocaleString("th-TH")}</td>
      ${isSingleWeight
        ? `<td>${numberText(item.total)}</td>`
        : `<td>${numberText(item.water)}</td><td>${numberText(item.flower)}</td>`}
      <td><strong>${numberText(item.total)}</strong></td>
      <td><strong>${money(item.amount)}</strong></td>
    </tr>
  `;
}

function buildPersonalReportPayload() {
  const range = normalizeDateRange(personalReportStartDate, personalReportEndDate);
  const user = getSession()?.user;
  return {
    employee_id: Number(personalReportEmployeeId),
    start_date: range.startDate,
    end_date: range.endDate,
    fruit_type: personalReportFruitFilter,
    employees: getEmployees(),
    production_records: recordsForPersonalReport(personalReportEmployeeId, range.startDate, range.endDate, personalReportFruitFilter),
    ...getProductionReportCatalog(),
    deduction_records: getAdjustmentRecordsForRange("production", range.startDate, range.endDate),
    printed_by: user?.fullname || user?.username || "ระบบรายงาน",
    printed_by_position: getExportPositionLabel(user)
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
    if (target.id === "personalReportFruit") {
      personalReportFruitFilter = target.value || "mangosteen";
    }
    if (target.id === "personalReportStartDate") {
      personalReportStartDate = target.value || localDateInputValue();
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

function getTimeQueueReason(item) {
  const reasonByCode = {
    time_overlap: ["ช่วงเวลาทับกับข้อมูลเดิม", "เวลาเข้า-ออกชนกับรายการของพนักงานคนเดียวกันในวันเดียวกัน"],
    invalid_time: ["วันที่หรือเวลาไม่เข้าเงื่อนไข", "วันที่ รหัสพนักงาน หรือรูปแบบเวลาเข้า-ออกไม่ถูกต้อง กรุณากดแก้ไขก่อนส่งใหม่"],
    employee_invalid: ["ข้อมูลพนักงานไม่พร้อมใช้งาน", "ไม่พบพนักงานตามเวลาหรือพนักงานถูกปิดใช้งานในฐานกลาง"],
    invalid_payload: ["ข้อมูลคิวไม่ครบ", "จำนวนรายการไม่ตรงกับข้อมูลที่ฐานกลางรับไว้"],
    payload_hash_mismatch: ["ข้อมูลคิวไม่ผ่านการตรวจความถูกต้อง", "ข้อมูลเปลี่ยนไประหว่างทาง ระบบจึงหยุดเพื่อป้องกันข้อมูลเสียหาย"],
    audit_log_failed: ["บันทึกประวัติไม่สำเร็จ", "ข้อมูลเวลาถูกเก็บไว้แล้ว แต่ระบบยังปิดคิวไม่ได้จนกว่า Audit Log จะครบ"],
    lookup_failed: ["ตรวจข้อมูลเดิมไม่ได้", "ฐานข้อมูลตอบกลับผิดปกติระหว่างตรวจการบันทึกซ้ำ"],
    conflict_check_failed: ["ตรวจเงื่อนไขเวลาไม่ได้", "ฐานข้อมูลขัดข้องระหว่างตรวจช่วงเวลาทับกัน"],
    employee_lookup_failed: ["ตรวจพนักงานไม่ได้", "ฐานข้อมูลพนักงานตอบกลับชั่วคราวผิดปกติ"],
    temporary_cloud_error: ["Cloud ขัดข้องชั่วคราว", "ระบบจะลองบันทึกใหม่โดยใช้ข้อมูลคิวเดิม"],
    save_failed: ["บันทึกข้อมูลเวลาไม่สำเร็จ", "ฐานข้อมูลปฏิเสธรายการ กรุณาตรวจรายละเอียดก่อนส่งใหม่"],
    worker_exception: ["Worker ทำงานผิดพลาด", "ระบบหยุดคิวไว้โดยไม่ลบข้อมูลเพื่อรอการตรวจสอบ"],
    verification_failed: ["ตรวจสอบคิวไม่สำเร็จ", "ยังยืนยันไม่ได้ว่ารายการนี้ผ่านเงื่อนไขการบันทึก"],
    retry_limit_reached: ["ลองอัตโนมัติครบจำนวนแล้ว", "ระบบหยุดไว้เพื่อป้องกันการบันทึกซ้ำ ข้อมูลคิวยังอยู่ครบ"],
    stale_worker_recovered: ["กู้คิวจาก Worker ที่หยุดตอบสนอง", "ระบบนำคิวเดิมกลับมาทำงานต่อโดยไม่สร้างข้อมูลชุดใหม่"]
  };
  if (item.status === "queued") {
    const ageMs = Date.now() - new Date(item.created_at || Date.now()).getTime();
    return ageMs > 15000
      ? ["Worker ยังไม่รับคิว", "คิวรอนานกว่าปกติ ข้อมูลยังอยู่ในฐานกลางและสามารถกดตรวจสอบหรือบันทึกซ้ำได้"]
      : ["รอ Worker รับคิว", "ข้อมูลถูกเก็บในฐานกลางแล้ว กำลังรอประมวลผล"];
  }
  if (item.status === "processing") return ["กำลังตรวจและบันทึก", "Worker กำลังตรวจพนักงาน เวลาทับ และความถูกต้องของข้อมูล"];
  if (item.status === "succeeded" && item.error_code === "audit_log_pending") {
    return ["บันทึกข้อมูลสำเร็จ", "ข้อมูลเวลาอยู่ในฐานและใช้ในรายงานได้แล้ว ส่วน Audit Log ถูกแยกไว้รอซ่อม"];
  }
  if (item.status === "succeeded") return ["บันทึกสำเร็จ", "ตรวจพบข้อมูลครบใน time_records แล้ว"];
  return reasonByCode[item.error_code] || ["ต้องตรวจสอบ", item.error_message || "ระบบหยุดคิวไว้เพื่อป้องกันข้อมูลผิดพลาด"];
}

function renderTimeQueueEditor() {
  if (!editingTimeQueueItem) return "";
  const rows = Array.isArray(editingTimeQueueItem.payload) ? editingTimeQueueItem.payload : [];
  return `
    <section class="panel time-queue-editor">
      <div class="time-queue-head"><div><span>แก้ไขคิวเดิม</span><h3>${escapeHtml(timeQueueNumber(editingTimeQueueItem))}</h3><p>แก้วันที่หรือเวลาแล้วส่งคิวเดิมอีกครั้ง ประวัติก่อนแก้ยังถูกเก็บใน Log</p></div><button class="btn btn-outline" data-close-time-queue-editor type="button">ยกเลิก</button></div>
      <form id="timeQueueEditForm">
        <div class="time-queue-edit-grid">
          ${rows.map((row, index) => {
            const raw = row.raw_payload && typeof row.raw_payload === "object" ? row.raw_payload : row;
            return `<section class="time-queue-edit-row">
              <input type="hidden" name="id_${index}" value="${escapeHtml(row.id || raw.id || "")}" />
              <label class="field"><span>วันที่</span><input name="date_${index}" type="date" value="${escapeHtml(row.work_date || raw.record_date || "")}" required /></label>
              <label class="field"><span>รหัสพนักงาน</span><input value="${escapeHtml(row.emp_code || raw.emp_code || "")}" disabled /></label>
              <label class="field"><span>เวลาเข้า</span><input name="in_${index}" type="text" inputmode="numeric" maxlength="5" value="${escapeHtml(row.check_in || raw.clock_in || "")}" required /></label>
              <label class="field"><span>เวลาออก</span><input name="out_${index}" type="text" inputmode="numeric" maxlength="5" value="${escapeHtml(row.check_out || raw.clock_out || "")}" required /></label>
            </section>`;
          }).join("")}
        </div>
        <div class="time-queue-editor-actions"><button class="btn btn-primary" type="submit">บันทึกการแก้ไขและส่งคิวเดิม</button></div>
      </form>
    </section>`;
}

function renderTimeQueuePage() {
  const active = timeQueueItems.filter((item) => ["queued", "processing"].includes(item.status)).length;
  const review = timeQueueItems.filter((item) => ["needs_review", "failed"].includes(item.status)).length;
  const filtered = timeQueueItems.filter((item) => {
    if (timeQueueFilter === "active") return ["queued", "processing"].includes(item.status);
    if (timeQueueFilter === "review") return ["needs_review", "failed"].includes(item.status);
    if (timeQueueFilter === "done") return item.status === "succeeded";
    return true;
  });
  const statusMeta = (status) => ({
    queued: ["รอคิว", "queued"],
    processing: ["กำลังบันทึก", "processing"],
    succeeded: ["บันทึกสำเร็จ", "succeeded"],
    needs_review: ["ต้องตรวจสอบ", "review"],
    failed: ["ไม่สำเร็จ", "review"]
  }[status] || [status || "-", "queued"]);
  return `
    ${renderTimeQueueEditor()}
    ${timeRecordMessage ? `<div class="alert ${timeRecordMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(timeRecordMessage)}</div>` : ""}
    <section class="panel time-queue-panel time-queue-page">
      <div class="time-queue-head">
        <div><span>Save Queue</span><h3>คิวบันทึกเวลา</h3><p>รายการทุกชิ้นถูกเก็บไว้ในฐานกลางและไม่ถูกลบหลังประมวลผล</p></div>
        <div class="time-queue-metrics"><span><b>${active}</b> กำลังทำงาน</span><span class="${review ? "has-review" : ""}"><b>${review}</b> ต้องตรวจ</span><button class="btn btn-small btn-outline" data-refresh-time-queue type="button">รีเฟรช</button></div>
      </div>
      <div class="time-queue-filters">${[["all", "ทั้งหมด"], ["active", "กำลังทำงาน"], ["review", "ต้องตรวจสอบ"], ["done", "สำเร็จ"]].map(([id, label]) => `<button class="module-tab ${timeQueueFilter === id ? "active" : ""}" data-time-queue-filter="${id}" type="button">${label}</button>`).join("")}</div>
      <div class="time-queue-list">
        ${timeQueueLoadError ? `<div class="alert alert-error">${escapeHtml(timeQueueLoadError)} · กรุณารันไฟล์ supabase_time_save_queue_migration.sql ใน Supabase</div>` : ""}
        ${timeQueueLoading && !filtered.length ? `<div class="empty-cell">กำลังโหลดคิว...</div>` : filtered.length ? filtered.map((item) => {
          const [label, className] = statusMeta(item.status);
          const [reasonTitle, reasonDetail] = getTimeQueueReason(item);
          const busy = Number(timeQueueActionId) === Number(item.id);
          const canReview = item.status !== "succeeded";
          return `<article class="time-queue-row ${className}">
            <div><small>เลขคิว</small><strong>${escapeHtml(timeQueueNumber(item))}</strong></div>
            <div><small>พนักงาน</small><strong>${escapeHtml(item.emp_code || "-")} · ${escapeHtml(item.employee_name || "-")}</strong></div>
            <div><small>วันที่ / จำนวน</small><strong>${escapeHtml(item.first_work_date || "-")}${item.last_work_date && item.last_work_date !== item.first_work_date ? ` ถึง ${escapeHtml(item.last_work_date)}` : ""} · ${item.record_count || 1} รายการ</strong></div>
            <div><small>ผู้บันทึก</small><strong>${escapeHtml(item.created_by || "-")}</strong></div>
            <div class="time-queue-status"><span>${escapeHtml(label)}</span><strong>${escapeHtml(reasonTitle)}</strong><small>${escapeHtml(reasonDetail)}</small>${item.error_message ? `<small class="time-queue-technical">${escapeHtml(item.error_message)}</small>` : ""}</div>
            <div class="time-queue-actions">${canReview ? `<button class="btn btn-small btn-outline" data-time-queue-verify="${item.id}" type="button" ${busy ? "disabled" : ""}>ตรวจสอบอีกครั้ง</button><button class="btn btn-small btn-primary" data-time-queue-retry="${item.id}" type="button" ${busy ? "disabled" : ""}>บันทึกซ้ำ</button><button class="btn btn-small btn-outline" data-time-queue-edit="${item.id}" type="button" ${busy ? "disabled" : ""}>แก้ไข</button>` : ""}</div>
          </article>`;
        }).join("") : `<div class="empty-cell">ยังไม่มีประวัติคิวบันทึกเวลา</div>`}
      </div>
    </section>
  `;
}

function bindReportEvents() {
  document.querySelector("#reportDate")?.addEventListener("change", (event) => {
    reportDate = event.target.value || localDateInputValue();
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
  return `
    <section class="time-page">
      <section class="time-hero panel">
        <div>
          <p class="eyebrow">Attendance Management</p>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>บันทึกเวลาเข้า-ออก ปัดเวลาตามช่วงครึ่งชั่วโมง และคำนวณค่าแรงตามกติกาของโรงงาน</p>
        </div>
        <div class="time-hero-actions">
          <div class="time-hero-status">
            <span>วันที่ปฏิบัติงาน</span>
            <strong>${escapeHtml(timeRecordDate)}</strong>
          </div>
          <button class="btn ${timeView === "queue" ? "btn-outline" : "btn-primary"}" ${timeView === "queue" ? "data-close-time-queue" : "data-open-time-queue"} type="button">
            ${timeView === "queue" ? "กลับหน้าบันทึกเวลา" : `เปิดคิวบันทึก${timeQueueItems.filter((item) => ["queued", "processing", "needs_review", "failed"].includes(item.status)).length ? ` (${timeQueueItems.filter((item) => ["queued", "processing", "needs_review", "failed"].includes(item.status)).length})` : ""}`}
          </button>
        </div>
      </section>

      ${timeView === "queue" ? renderTimeQueuePage() : `
      ${renderTimeModeSelector()}

      ${
        timeRecordMessage
          ? `<div class="alert ${timeRecordMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(timeRecordMessage)}</div>`
          : ""
      }

      ${timeEntryMode === "data" ? renderTimeDataPanel() : renderWeeklyTimeEntry(user)}
      `}
    </section>
  `;
}

function renderTimeDataPanel() {
  const records = apiGetTimeRecordsForDate(timeRecordDate);
  const employees = new Set(records.map(record => String(record.employee_id || record.emp_code)));
  return `
    <section class="panel time-data-panel">
      <div class="time-data-heading">
        <div><span class="eyebrow">ATTENDANCE DATA</span><h3>รายการข้อมูล</h3><p>รับข้อมูลจากเครื่องสแกน ตรวจสอบเวลา และติดตามรายการที่บันทึกแล้ว</p></div>
        <label class="field time-data-date"><span>วันที่แสดงรายการ</span><input id="timeDataDate" type="date" value="${escapeHtml(timeRecordDate)}" /></label>
      </div>
      <div class="time-data-tools">
        <article class="time-data-tool"><span class="time-data-icon" aria-hidden="true">⇧</span><h4>นำเข้าไฟล์จากเครื่อง</h4><p>เลือกไฟล์จาก USB ตรวจรายการและเติมเวลาที่ขาดก่อนบันทึก</p><button class="btn btn-outline time-data-button" id="openScannerImport" type="button">นำเข้าไฟล์ USB</button></article>
        <article class="time-data-tool"><span class="time-data-icon" aria-hidden="true">↻</span><h4>ข้อมูลล่าสุด</h4><p>อัปเดตรายการที่บันทึกจากฐานข้อมูลกลางเพื่อดูข้อมูลล่าสุด</p><button class="btn btn-outline time-data-button" id="refreshTimeSavedRecords" type="button">รีเฟรชข้อมูล</button></article>
        <article class="time-data-tool"><span class="time-data-icon" aria-hidden="true">⇄</span><h4>เชื่อมต่อเครื่องสแกน <span class="time-remote-badge">ผ่านคอมในโรงงาน</span></h4><p>อ่านรายการตามช่วงวันที่ผ่านตัวเชื่อม HIP บนคอม แล้วตรวจข้อมูลก่อนส่งเข้าคิว</p><button class="btn btn-outline time-data-button" id="openScannerRemote" type="button">ดึงข้อมูลระยะไกล</button></article>
      </div>
      <div class="time-data-summary"><span>วันที่ ${escapeHtml(timeRecordDate)}</span><strong>${records.length} รายการ</strong><span>พนักงาน ${employees.size} คน</span><small>รายการที่ส่งเข้าคิวแล้ว ติดตามสถานะได้ที่ “เปิดคิวบันทึก”</small></div>
    </section>
    ${renderDailyTimeRecordTable(records)}
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
  const weeklyEdit = editingTimeRecordId ? getTimeRecords().find(r => r.id === editingTimeRecordId) : null;
  const activeEmployees = getOrderedActiveTimeEmployees();
  const selectedEmployeeCode = weeklyTimeEmployeeCode || activeEmployees[0]?.emp_code || "";
  const selectedEmployee = activeEmployees.find((employee) => String(employee.emp_code) === String(selectedEmployeeCode));
  const weeklyRecords = getTimeRecords()
    .filter((record) => {
      const recordDate = record.record_date || "";
      const matchDate = recordDate >= weekDates[0] && recordDate <= weekDates[6];
      const matchEmployee = !selectedEmployeeCode || (record.employee_id
        ? String(record.employee_id) === String(selectedEmployee?.id)
        : String(record.emp_code) === String(selectedEmployeeCode));
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
            <select name="emp_code" required ${weeklyEdit ? "disabled" : ""}>
              ${renderWeeklyTimeEmployeeOptions(activeEmployees, selectedEmployeeCode)}
            </select>
          </label>
          <label class="field">
            <span>วันที่เริ่มต้น</span>
            <input id="weeklyStartDate" name="start_date" type="date" value="${escapeHtml(timeRecordDate)}" required ${weeklyEdit ? "disabled" : ""} />
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
                      <input data-weekly-clock-in="${index}" name="clock_in_${index}" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="0800" value="${escapeHtml(weeklyTimeDraft[index]?.clock_in || "")}" ${weeklyEdit && weeklyEdit.record_date !== dateValue ? "disabled" : ""} />
                    </label>
                    <label>
                      <span>ออก</span>
                      <input data-weekly-clock-out="${index}" name="clock_out_${index}" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="1700" value="${escapeHtml(weeklyTimeDraft[index]?.clock_out || "")}" ${weeklyEdit && weeklyEdit.record_date !== dateValue ? "disabled" : ""} />
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
            <div><span>กันกรอกซ้ำ</span><strong>วันเดียวกันบันทึกได้หลายรอบเมื่อเวลาไม่ทับกัน · ช่วงเวลาที่เหลื่อมกันจะไม่ถูกบันทึก</strong></div>
          </div>
          <div class="weekly-actions">
            <button class="btn btn-outline" id="clearWeeklyTime" type="button">ล้างตาราง</button>
            ${weeklyEdit ? '<button class="btn btn-outline" id="cancelWeeklyTimeEdit" type="button">ยกเลิกแก้ไข</button>' : ""}
            <button class="btn btn-primary report-primary-button" type="submit" ${timeRecordSaving ? "disabled" : ""}>${timeRecordSaving ? "กำลังบันทึก..." : weeklyEdit ? "บันทึกแก้ไข" : "บันทึกทั้งสัปดาห์"}</button>
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
  document.querySelector("#timeDataDate")?.addEventListener("change", (event) => {
    if (!event.target.value) return;
    timeRecordDate = event.target.value;
    timeRecordMessage = "";
    render();
  });
  const scannerAdapter = {
      actor: user.fullname,
      exists: code => Boolean(apiGetTimeEmployeeByCode(code)),
      prepare: (payload, source) => {
        const record = buildTimeRecord(payload, user);
        assertNoConflictingTimeRecord(record.emp_code, record.record_date, record.clock_in, record.clock_out);
        return { ...record, scanner_import: source };
      },
      send: record => enqueueTimeRows([record], "insert")
    };
  async function openScannerWithLatestRoster(event, remote) {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const response = await cloudApiRequest('/api/time-employees');
      if (response.error || !Array.isArray(response.data)) throw Error('โหลดรายชื่อรายวันล่าสุดไม่สำเร็จ กรุณาลองใหม่');
      let mapping = remote ? null : ScannerImport.rosterMap(response.data);
      saveTimeEmployees(response.data.map(normalizeCloudTimeEmployee));
      const adapter = {...scannerAdapter,
        resolveScannerCode: id => {
          mapping ||= ScannerImport.rosterMap(response.data);
          return mapping.get(String(Number(id)))?.emp_code || '';
        }
      };
      if (remote) ScannerImport.openRemote(timeRecordDate, adapter);
      else ScannerImport.open(adapter);
    } catch (error) { window.alert(error.message); }
    finally { button.disabled = false; }
  }
  document.querySelector("#openScannerRemote")?.addEventListener("click", event => openScannerWithLatestRoster(event, true));
  document.querySelector("#openScannerImport")?.addEventListener("click", event => openScannerWithLatestRoster(event, false));
  document.querySelector("#refreshTimeSavedRecords")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try {
      await refreshSavedRecordView("time");
      setTimeRecordMessage("รีเฟรชข้อมูลเวลาจากฐานกลางแล้ว");
    } catch (error) {
      setTimeRecordMessage(error.message || "รีเฟรชไม่สำเร็จ", "error");
    }
    render();
  });
  if (!timeQueueLoadedOnce && !timeQueueLoading) refreshTimeQueue({ renderAfter: true });
  document.querySelector("[data-open-time-queue]")?.addEventListener("click", () => {
    timeView = "queue";
    editingTimeQueueItem = null;
    render();
    refreshTimeQueue({ renderAfter: true });
  });
  document.querySelector("[data-close-time-queue]")?.addEventListener("click", () => {
    timeView = "entry";
    editingTimeQueueItem = null;
    render();
  });
  document.querySelector("[data-refresh-time-queue]")?.addEventListener("click", () => refreshTimeQueue({ renderAfter: true }));
  document.querySelectorAll("[data-time-queue-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      timeQueueFilter = button.dataset.timeQueueFilter || "all";
      render();
    });
  });
  document.querySelectorAll("[data-time-queue-verify]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await runTimeQueueAction(Number(button.dataset.timeQueueVerify), "verify");
        setTimeRecordMessage("ตรวจสอบคิวและส่งดำเนินการต่อแล้ว");
        await refreshTimeQueue();
      } catch (error) {
        setTimeRecordMessage(error instanceof Error ? error.message : "ตรวจสอบคิวไม่สำเร็จ", "error");
      } finally {
        render();
      }
    });
  });
  document.querySelectorAll("[data-time-queue-retry]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("ยืนยันส่งข้อมูลคิวเดิมให้ระบบบันทึกอีกครั้ง? ระบบจะตรวจข้อมูลซ้ำก่อนเสมอ")) return;
      try {
        await runTimeQueueAction(Number(button.dataset.timeQueueRetry), "retry");
        setTimeRecordMessage("ส่งคิวเดิมให้บันทึกใหม่แล้ว");
        await refreshTimeQueue();
      } catch (error) {
        setTimeRecordMessage(error instanceof Error ? error.message : "ส่งคิวใหม่ไม่สำเร็จ", "error");
      } finally {
        render();
      }
    });
  });
  document.querySelectorAll("[data-time-queue-edit]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await loadTimeQueueForEdit(Number(button.dataset.timeQueueEdit));
      } catch (error) {
        setTimeRecordMessage(error instanceof Error ? error.message : "โหลดข้อมูลคิวไม่สำเร็จ", "error");
      }
      render();
    });
  });
  document.querySelector("[data-close-time-queue-editor]")?.addEventListener("click", () => {
    editingTimeQueueItem = null;
    render();
  });
  document.querySelector("#timeQueueEditForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!editingTimeQueueItem || timeQueueActionId) return;
    const form = new FormData(event.currentTarget);
    const sourceRows = Array.isArray(editingTimeQueueItem.payload) ? editingTimeQueueItem.payload : [];
    try {
      const records = sourceRows.map((row, index) => {
        const raw = row.raw_payload && typeof row.raw_payload === "object" ? row.raw_payload : row;
        const clockIn = normalizeClockText(form.get(`in_${index}`));
        const clockOut = normalizeClockText(form.get(`out_${index}`));
        if (!clockIn || !clockOut) throw new Error(`รายการที่ ${index + 1} ต้องมีเวลาเข้าและออกครบ`);
        return {
          ...raw,
          ...(row.id || raw.id ? { id: row.id || raw.id } : {}),
          record_date: String(form.get(`date_${index}`) || ""),
          emp_code: row.emp_code || raw.emp_code,
          clock_in: clockIn,
          clock_out: clockOut
        };
      });
      await runTimeQueueAction(Number(editingTimeQueueItem.id), "edit-retry", records);
      editingTimeQueueItem = null;
      setTimeRecordMessage("แก้ไขข้อมูลและส่งคิวเดิมให้ตรวจบันทึกแล้ว");
      await refreshTimeQueue();
    } catch (error) {
      setTimeRecordMessage(error instanceof Error ? error.message : "แก้ไขคิวไม่สำเร็จ", "error");
    } finally {
      render();
    }
  });

  if (timeView === "queue") return;
  document.querySelectorAll("[data-time-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      if (timeRecordSaving) return;
      if (timeEntryMode === "weekly") syncWeeklyDraftFromForm();
      timeEntryMode = button.dataset.timeMode || "weekly";
      timeRecordMessage = "";
      editingTimeRecordId = null;
      render();
    });
  });

  document.querySelector("#weeklyStartDate")?.addEventListener("change", (event) => {
    syncWeeklyDraftFromForm();
    timeRecordDate = event.target.value || localDateInputValue();
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
    if (timeRecordSaving) return;
    clearWeeklyTimeDraft();
    document.querySelectorAll("[data-weekly-clock-in], [data-weekly-clock-out]").forEach((input) => {
      input.value = "";
    });
    updateWeeklyDayTotals();
  });

  document.querySelector("#weeklyTimeForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (timeRecordSaving) return;
    syncWeeklyDraftFromForm();
    const form = new FormData(event.currentTarget);
    if (editingTimeRecordId) {
      const record = getTimeRecords().find(r => r.id === editingTimeRecordId);
      if (!record) { setTimeRecordMessage("ไม่พบรายการที่กำลังแก้ไข", "error"); render(); return; }
      const index = Array.from({length: 7}, (_, i) => addDaysToDate(timeRecordDate, i)).indexOf(record.record_date);
      if (index < 0) { setTimeRecordMessage("วันที่แก้ไขอยู่นอกตาราง กรุณาเลือกแก้ไขอีกครั้ง", "error"); render(); return; }
      const payload = {record_date: record.record_date, emp_code: record.emp_code,
        clock_in: normalizeClockText(form.get(`clock_in_${index}`)),
        clock_out: normalizeClockText(form.get(`clock_out_${index}`))};
      try {
        timeRecordSaving = true;
        const accepted = await apiUpdateTimeRecord(editingTimeRecordId, payload, user);
        editingTimeRecordId = null;
        clearWeeklyTimeDraft();
        setTimeRecordMessage(`รับแก้ไขวันที่ ${record.record_date} เข้าคิว ${timeQueueNumber(accepted.queue_item)} แล้ว · กรอกรายการถัดไปได้ ตารางจะอัปเดตเมื่อฐานข้อมูลยืนยัน`);
      } catch (error) { setTimeRecordMessage(error.message || "บันทึกแก้ไขไม่สำเร็จ", "error"); }
      finally { timeRecordSaving = false; render(); }
      return;
    }
    const empCode = String(form.get("emp_code") || "").trim();
    weeklyTimeEmployeeCode = empCode;
    const errors = [];
    const payloads = [];

    if (!empCode) {
      setTimeRecordMessage("กรุณาเลือกพนักงานสำหรับบันทึกรายสัปดาห์", "error");
      render();
      return;
    }

    timeRecordSaving = true;
    setTimeRecordMessage("กำลังบันทึกรายสัปดาห์ขึ้น Cloud... กรุณารอสักครู่");
    render();

    for (let index = 0; index < 7; index += 1) {
      const clockIn = normalizeClockText(form.get(`clock_in_${index}`));
      const clockOut = normalizeClockText(form.get(`clock_out_${index}`));
      const recordDate = String(form.get(`record_date_${index}`) || "").trim();

      if (!clockIn && !clockOut) continue;
      if (!clockIn || !clockOut) {
        errors.push(`${recordDate}: กรุณากรอกเวลาเข้าและออกให้ครบ`);
        continue;
      }

      payloads.push({ record_date: recordDate, emp_code: empCode, clock_in: clockIn, clock_out: clockOut });
    }

    if (!payloads.length && !errors.length) {
      timeRecordSaving = false;
      setTimeRecordMessage("กรุณากรอกเวลาอย่างน้อย 1 วัน", "error");
      render();
      return;
    }

    if (errors.length) {
      timeRecordSaving = false;
      setTimeRecordMessage(`ยังไม่บันทึก กรุณาแก้ไข ${errors.length} วัน: ${errors.join(" | ")}`, "error");
      render();
      return;
    }

    try {
      const queuedBatch = await apiCreateTimeRecords(payloads, user);
      const nextEmployeeCode = getNextAvailableTimeEntryEmployeeCode(empCode, timeRecordDate);
      clearWeeklyTimeDraft();
      weeklyTimeEmployeeCode = nextEmployeeCode;
      setTimeRecordMessage(
        `รับเข้าคิว ${timeQueueNumber(queuedBatch.queue_item)} แล้ว ${queuedBatch.records.length} วัน` +
        `${nextEmployeeCode ? ` · เลื่อนไปพนักงาน ${nextEmployeeCode} แล้ว` : ""}`
      );
      setTimeSummaryRangeToCurrentWeek();
    } catch (error) {
      setTimeRecordMessage(error instanceof Error ? error.message : "บันทึกรายสัปดาห์ไม่สำเร็จ", "error");
    } finally {
      timeRecordSaving = false;
      render();
    }
  });

  if (document.querySelector("#weeklyTimeForm")) {
    updateWeeklyDayTotals();
  }

  document.querySelectorAll("[data-edit-time-record]").forEach((button) => {
    button.addEventListener("click", () => {
      if (timeRecordSaving) return;
      const id = Number(button.dataset.editTimeRecord);
      const record = getTimeRecords().find((item) => item.id === id);
      if (!record) {
        setTimeRecordMessage("ไม่พบรายการเวลาที่ต้องการแก้ไข", "error");
        render();
        return;
      }
      editingTimeRecordId = id;
      timeEntryMode = "weekly";
      {
        weeklyTimeEmployeeCode = record.emp_code || "";
        let index = Array.from({length: 7}, (_, i) => addDaysToDate(timeRecordDate, i)).indexOf(record.record_date);
        if (index < 0) { timeRecordDate = record.record_date; index = 0; }
        clearWeeklyTimeDraft();
        weeklyTimeDraft[index] = {clock_in: record.clock_in || "", clock_out: record.clock_out || ""};
        setTimeRecordMessage(`กำลังแก้ไขวันที่ ${record.record_date} แก้เวลาในตารางด้านบนแล้วกดบันทึกแก้ไข`);
        render();
        const input = document.querySelector(`[data-weekly-clock-in="${index}"]`);
        input?.scrollIntoView({block: "center", behavior: "smooth"});
        input?.focus();
        return;
      }
    });
  });

  document.querySelectorAll("[data-delete-time-record]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (timeRecordSaving) return;
      const id = Number(button.dataset.deleteTimeRecord);
      if (!window.confirm("ยืนยันลบรายการเวลานี้?")) return;
      try {
        timeRecordSaving = true;
        setTimeRecordMessage("กำลังลบรายการเวลาจาก Cloud... กรุณารอสักครู่");
        render();
        await apiDeleteTimeRecord(id, user);
        if (editingTimeRecordId === id) editingTimeRecordId = null;
        setTimeRecordMessage("ลบรายการเวลาเรียบร้อยแล้ว");
      } catch (error) {
        setTimeRecordMessage(error instanceof Error ? error.message : "ลบรายการเวลาไม่สำเร็จ", "error");
      } finally {
        timeRecordSaving = false;
        render();
      }
    });
  });

  document.querySelector("#cancelWeeklyTimeEdit")?.addEventListener("click", () => {
    if (timeRecordSaving) return;
    editingTimeRecordId = null;
    clearWeeklyTimeDraft();
    setTimeRecordMessage("ยกเลิกแก้ไขแล้ว");
    render();
  });

}

function renderEmployeeManagementHub(user, moduleItem) {
  const weightEmployees = getEmployees();
  const timeEmployees = getTimeEmployees();
  const activeWeightEmployees = weightEmployees.filter((employee) => employee.status === "Active").length;
  const activeTimeEmployees = timeEmployees.filter((employee) => employee.status === "Active").length;

  return `
    <div class="employee-hub-page">
    <section class="panel employee-hub-hero">
      <div class="employee-hub-head">
        <div>
          <span class="employee-hub-eyebrow">EMPLOYEE DATABASE</span>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>เลือกฐานพนักงานที่ต้องการดูหรือจัดการ</p>
        </div>
        <span class="employee-hub-status">2 ฐานข้อมูล</span>
      </div>
      <div class="employee-hub-summary">
        <div><span>ใช้งานรวม</span><strong>${(activeWeightEmployees + activeTimeEmployees).toLocaleString("th-TH")}</strong><small>คน</small></div>
        <div><span>เหมาน้ำหนัก</span><strong>${activeWeightEmployees.toLocaleString("th-TH")}</strong><small>/ ${weightEmployees.length.toLocaleString("th-TH")}</small></div>
        <div><span>ตามเวลา</span><strong>${activeTimeEmployees.toLocaleString("th-TH")}</strong><small>/ ${timeEmployees.length.toLocaleString("th-TH")}</small></div>
        <div><span>ฐานรายวัน</span><strong>${TIME_DAILY_WAGE.toLocaleString("th-TH")}</strong><small>บาท</small></div>
      </div>
    </section>

    <section class="panel employee-hub-menu">
      <div class="employee-hub-menu-head">
        <div><h3>เลือกประเภทพนักงาน</h3><p>ข้อมูลสองกลุ่มแยกจากกันและใช้วิธีคำนวณต่างกัน</p></div>
      </div>
      <div class="employee-hub-grid">
        <button class="employee-hub-card employee-hub-weight" data-route="production-employees" type="button">
          <span class="employee-hub-card-icon">KG</span>
          <span class="employee-hub-card-copy"><strong>พนักงานเหมาน้ำหนัก</strong><small>จัดการรายชื่อ กลุ่มรับเงิน และสถานะพนักงาน</small><b>${activeWeightEmployees.toLocaleString("th-TH")} คนใช้งาน</b></span>
          <span class="employee-hub-arrow">→</span>
        </button>
        <button class="employee-hub-card employee-hub-time" data-route="time-employees" type="button">
          <span class="employee-hub-card-icon">HR</span>
          <span class="employee-hub-card-copy"><strong>พนักงานตามเวลา</strong><small>จัดการรายชื่อ ฐานรายวัน ค่า OT และลำดับเลข</small><b>${activeTimeEmployees.toLocaleString("th-TH")} คนใช้งาน</b></span>
          <span class="employee-hub-arrow">→</span>
        </button>
      </div>
    </section>
    </div>
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

  if (employeePageMode === "editor" && canManage) {
    return `<div class="time-employees-page time-employee-subpage">
      <button class="time-employee-back" id="backToEmployeeList" type="button">← กลับไปรายชื่อพนักงาน</button>
      ${employeeMessage ? `<div class="alert ${employeeMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(employeeMessage)}</div>` : ""}
      ${renderEmployeeForm(editingEmployee)}
    </div>`;
  }

  if (employeePageMode === "manage" && canManage) {
    return `<div class="time-employees-page time-employee-subpage">
      <button class="time-employee-back" id="backToEmployeeList" type="button">← กลับไปรายชื่อพนักงาน</button>
      <section class="panel time-employee-workspace">
        <div class="time-employee-workspace-head">
          <div><span class="time-employee-step">Edit</span><h2>จัดการพนักงานเหมาน้ำหนัก</h2><p>แก้ไขข้อมูล กลุ่มรับเงิน สถานะ หรือลบพนักงานจากรายการนี้</p></div>
          <button class="btn btn-primary" id="addEmployee" type="button">+ เพิ่มพนักงาน</button>
        </div>
        <div class="table-scroll"><table class="time-employee-table">
          <thead><tr><th>รหัสพนักงาน</th><th>ชื่อพนักงาน</th><th>แผนก</th><th>กลุ่มรับเงิน</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
          <tbody>${employees.length ? employees.map((employee) => {
            const statusClass = employee.status === "Active" ? "badge-success" : "badge-danger";
            return `<tr><td><strong>${escapeHtml(employee.emp_code)}</strong></td><td>${escapeHtml(employee.fullname)}</td><td>${escapeHtml(employee.department)}</td><td>${renderPayGroupBadge(getEmployeePayGroup(employee))}</td><td><span class="badge ${statusClass}">${escapeHtml(employee.status)}</span></td><td><div class="row-actions"><button class="btn btn-small btn-outline" data-edit-employee="${employee.id}" type="button">แก้ไข</button>${canDelete ? `<button class="btn btn-small btn-danger" data-delete-employee="${employee.id}" type="button">ลบ</button>` : ""}</div></td></tr>`;
          }).join("") : `<tr><td colspan="6" class="empty-cell">ยังไม่มีพนักงานเหมาน้ำหนัก</td></tr>`}</tbody>
        </table></div>
      </section>
    </div>`;
  }

  return `
    <div class="time-employees-page">
    <section class="panel time-employees-hero">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge ${canManage ? "badge-success" : "badge-warning"}">
          ${canManage ? "เพิ่มและแก้ไขได้" : "ดูข้อมูลเท่านั้น"}
        </span>
      </div>
      <div class="time-employee-overview">
        <div class="metric-card metric-green"><span>พนักงานทั้งหมด</span><strong>${allEmployees.length.toLocaleString("th-TH")}</strong><small>ฐานพนักงานเหมาน้ำหนัก</small></div>
        <div class="metric-card metric-blue"><span>ใช้งานอยู่</span><strong>${activeEmployees.toLocaleString("th-TH")}</strong><small>พร้อมเลือกในหน้าผลผลิต</small></div>
        <div class="metric-card metric-purple"><span>กลุ่มรับเงิน</span><strong>${payGroups.size.toLocaleString("th-TH")}</strong><small>กลุ่มที่ใช้อยู่</small></div>
      </div>

      <div class="toolbar">
        <form class="search-form" id="employeeSearchForm">
          <label class="search-box">
            <span>ค้นหาพนักงาน</span>
            <input
              id="employeeSearch"
              name="employeeSearch"
              placeholder="ค้นหารหัสหรือชื่อพนักงาน"
              value="${escapeHtml(employeeSearch)}"
            />
          </label>
          <button class="btn btn-primary" type="submit">ค้นหา</button>
          <button class="btn btn-outline" id="clearEmployeeSearch" type="button">ล้าง</button>
        </form>
        <button class="btn btn-outline" data-export-scale-employees="production" type="button">ดาวน์โหลดรายชื่อพนักงานเหมาสำหรับแอปเครื่องชั่ง</button>
      </div>
    </section>

    ${
      employeeMessage
        ? `<div class="alert ${employeeMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(employeeMessage)}</div>`
        : ""
    }

    <section class="table-card time-employee-table-card">
      <div class="time-employee-table-head">
        <div><h3>รายชื่อพนักงาน</h3><p>พบ ${employees.length.toLocaleString("th-TH")} คน${employeeSearch ? ` จากคำค้น “${escapeHtml(employeeSearch)}”` : ""}</p></div>
        ${canManage ? `<div class="time-employee-head-actions"><button class="btn btn-outline" id="goToEmployeeManage" type="button">Edit</button><button class="btn btn-primary" id="addEmployee" type="button">+ เพิ่มพนักงาน</button></div>` : ""}
      </div>
      <div class="table-scroll">
        <table class="time-employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>รหัสพนักงาน</th>
              <th>ชื่อพนักงาน</th>
              <th>แผนก</th>
              <th>กลุ่มรับเงิน</th>
              <th>สถานะ</th>
              <th>วันที่สร้าง</th>
              <th>แก้ไขล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            ${
              employees.length
                ? employees
                    .map((employee) =>
                      renderEmployeeRow(employee, false, false)
                    )
                    .join("")
                : `<tr><td colspan="8" class="empty-cell">ยังไม่มีพนักงานเหมาน้ำหนัก</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
    </div>
  `;
}

function renderEmployeeForm(employee) {
  const currentPayGroup = employee ? getEmployeePayGroup(employee) : primaryPayGroups[0];
  const selectedPayGroup = currentPayGroup || primaryPayGroups[0];
  const payGroups = [...new Set([...getEmployeePayGroups(), selectedPayGroup])];

  return `
    <section class="panel time-employee-editor">
      <div class="time-employee-editor-head">
        <span class="time-employee-step">ข้อมูลพนักงาน</span>
        <h2>${employee ? "แก้ไขพนักงานเหมาน้ำหนัก" : "เพิ่มพนักงานเหมาน้ำหนัก"}</h2>
        <p>${employee ? `กำลังแก้ไข ${escapeHtml(employee.emp_code)} · ${escapeHtml(employee.fullname)}` : "กรอกข้อมูลพนักงานและกลุ่มรับเงินให้ครบถ้วน"}</p>
      </div>
      <form class="employee-form" id="employeeForm">
        <input type="hidden" name="id" value="${employee ? employee.id : ""}" />

        <label class="field">
          <span>รหัสพนักงาน</span>
          <input name="emp_code" inputmode="numeric" maxlength="8" pattern="[0-9]{2,8}" value="${employee ? escapeHtml(employee.emp_code) : ""}" required />
        </label>

        <label class="field">
          <span>ชื่อพนักงาน</span>
          <input name="fullname" value="${employee ? escapeHtml(employee.fullname) : ""}" required />
        </label>

        <label class="field">
          <span>แผนก</span>
          <input name="department" value="${employee ? escapeHtml(employee.department) : ""}" required />
        </label>

        <div class="field employee-pay-group-field">
          <span>กลุ่มรับเงิน</span>
          <div class="employee-pay-group-control">
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
            <button class="btn btn-outline employee-pay-group-add" id="openPayGroupCreator" type="button" aria-expanded="false" aria-controls="payGroupCreator">
              <span aria-hidden="true">+</span> เพิ่มกลุ่ม
            </button>
          </div>
        </div>

        <div class="employee-pay-group-creator" id="payGroupCreator" hidden>
          <label for="newPayGroupName">ชื่อกลุ่มรับเงินใหม่</label>
          <div>
            <input id="newPayGroupName" maxlength="50" placeholder="เช่น เหมาคัดเกรด" autocomplete="off" />
            <button class="btn btn-primary" id="confirmNewPayGroup" type="button">สร้างและเลือก</button>
            <button class="btn btn-outline" id="cancelNewPayGroup" type="button">ยกเลิก</button>
          </div>
          <small>กลุ่มจะบันทึกลงฐานข้อมูลกลางพร้อมพนักงานคนนี้ และใช้เลือกกับคนอื่นได้ในครั้งถัดไป</small>
          <span class="employee-pay-group-error" id="newPayGroupError" role="alert"></span>
        </div>

        <label class="field">
          <span>สถานะ</span>
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
          ${employee ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน"}
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
      ${canManage || canDelete ? `<td>
        <div class="row-actions">
          ${
            canManage
              ? `<button class="btn btn-small btn-outline" data-edit-employee="${employee.id}" type="button">Edit</button>`
              : ""
          }
          ${
            canDelete
              ? `<button class="btn btn-small btn-danger" data-delete-employee="${employee.id}" type="button">Delete</button>`
              : ""
          }
        </div>
      </td>` : ""}
    </tr>
  `;
}

function updatePayGroupSelectTone(select) {
  [...select.classList]
    .filter((className) => className.startsWith("pay-group-") && className !== "pay-group-select")
    .forEach((className) => select.classList.remove(className));
  select.classList.add(getPayGroupToneClass(select.value));
}

function bindEmployeeEvents(user) {
  document.querySelector("#backToEmployeeList")?.addEventListener("click", () => {
    employeePageMode = "list";
    editingEmployeeId = null;
    employeeMessage = "";
    render();
  });
  document.querySelector("#goToEmployeeManage")?.addEventListener("click", () => {
    employeePageMode = "manage";
    employeeMessage = "";
    render();
  });
  document.querySelectorAll("#addEmployee").forEach((button) => button.addEventListener("click", () => {
    editingEmployeeId = null;
    employeePageMode = "editor";
    employeeMessage = "";
    render();
  }));
  document.querySelectorAll("[data-pay-group-select]").forEach((select) => {
    updatePayGroupSelectTone(select);
    select.addEventListener("change", () => updatePayGroupSelectTone(select));
  });

  const payGroupSelect = document.querySelector("[data-pay-group-select]");
  const payGroupCreator = document.querySelector("#payGroupCreator");
  const payGroupInput = document.querySelector("#newPayGroupName");
  const payGroupError = document.querySelector("#newPayGroupError");
  const openPayGroupCreator = () => {
    if (!payGroupCreator) return;
    payGroupCreator.hidden = false;
    document.querySelector("#openPayGroupCreator")?.setAttribute("aria-expanded", "true");
    payGroupInput?.focus();
  };
  const closePayGroupCreator = () => {
    if (!payGroupCreator) return;
    payGroupCreator.hidden = true;
    document.querySelector("#openPayGroupCreator")?.setAttribute("aria-expanded", "false");
    if (payGroupInput) payGroupInput.value = "";
    if (payGroupError) payGroupError.textContent = "";
  };
  const createAndSelectPayGroup = () => {
    const groupName = normalizeNewPayGroupName(payGroupInput?.value);
    if (groupName.length < 2 || groupName.length > 50) {
      if (payGroupError) payGroupError.textContent = "ชื่อกลุ่มต้องมีความยาว 2-50 ตัวอักษร";
      payGroupInput?.focus();
      return false;
    }
    if (!payGroupSelect) return false;
    const existingOption = [...payGroupSelect.options].find(
      (option) => normalizeNewPayGroupName(option.value).toLocaleLowerCase("th-TH") === groupName.toLocaleLowerCase("th-TH")
    );
    const option = existingOption || new Option(groupName, groupName);
    if (!existingOption) payGroupSelect.add(option);
    payGroupSelect.value = option.value;
    updatePayGroupSelectTone(payGroupSelect);
    closePayGroupCreator();
    return true;
  };

  document.querySelector("#openPayGroupCreator")?.addEventListener("click", openPayGroupCreator);
  document.querySelector("#cancelNewPayGroup")?.addEventListener("click", closePayGroupCreator);
  document.querySelector("#confirmNewPayGroup")?.addEventListener("click", createAndSelectPayGroup);
  payGroupInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    createAndSelectPayGroup();
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

  document.querySelectorAll('[data-export-scale-employees="production"]').forEach((exportButton) => exportButton.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const count = await exportScaleEmployeeFile("production");
      employeeMessage = `ส่งออกพนักงานทั้งหมด ${count.toLocaleString('en-US')} คนแล้ว นำไฟล์ JSON เข้าแอปเครื่องชั่งได้ทุกเครื่อง`;
      employeeMessageType = 'success';
    } catch (error) {
      employeeMessage = error instanceof Error ? error.message : 'ส่งออกรายชื่อไม่สำเร็จ';
      employeeMessageType = 'error';
    } finally {
      button.disabled = false;
      render();
    }
  }));

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

    if (payGroupCreator && !payGroupCreator.hidden && normalizeNewPayGroupName(payGroupInput?.value)) {
      if (!createAndSelectPayGroup()) return;
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
      employeePageMode = "list";
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
      employeePageMode = "editor";
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

  if (timeEmployeePageMode === "editor" && canManage) {
    return `<div class="time-employees-page time-employee-subpage">
      <button class="time-employee-back" id="backToTimeEmployeeList" type="button">← กลับไปรายชื่อพนักงาน</button>
      ${timeEmployeeMessage ? `<div class="alert ${timeEmployeeMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(timeEmployeeMessage)}</div>` : ""}
      ${renderTimeEmployeeForm(editingEmployee)}
    </div>`;
  }

  if (timeEmployeePageMode === "manage" && canManage) {
    const numberGroups = new Map();
    allEmployees.forEach((employee) => {
      const group = timeEmployeeNumberGroup(employee);
      if (!numberGroups.has(group.key)) numberGroups.set(group.key, {
        label: `${getTimeEmployeeTypeOption(employee.employee_type).shortLabel} · ${group.prefix ? `รหัส ${group.prefix}xx` : "รหัส 2 หลัก"}`,
        employees: []
      });
      numberGroups.get(group.key).employees.push(employee);
    });
    const groupEmployees = (numberGroups.get(timeEmployeeManageGroup)?.employees || [])
      .slice().sort((a, b) => Number(a.emp_code) - Number(b.emp_code));
    return `<div class="time-employees-page time-employee-subpage">
      <button class="time-employee-back" id="backToTimeEmployeeList" type="button">← กลับไปรายชื่อพนักงาน</button>
      ${timeEmployeeMessage ? `<div role="status" class="alert ${timeEmployeeMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(timeEmployeeMessage)}</div>` : ""}
      <section class="panel time-employee-workspace">
        <div class="time-employee-workspace-head">
          <div><span class="time-employee-step">Edit</span><h2>จัดการรายชื่อพนักงาน</h2><p>เลือกพนักงานเพื่อจัดลำดับเลข หรือกดแก้ไขเพื่อเปลี่ยนข้อมูลรายบุคคล</p></div>
          <button class="btn btn-primary" id="openTimeEmployeeRenumber" type="button" disabled>ตรวจสอบและจัดเลข <span id="timeEmployeeSelectedCount">0</span> คน</button>
        </div>
        <div class="time-employee-selection-bar">
          <label>กลุ่มที่จะจัด <select id="timeEmployeeNumberGroup"><option value="">เลือกกลุ่มและชุดรหัสก่อน</option>${[...numberGroups].map(([key, group]) => `<option value="${escapeHtml(key)}" ${timeEmployeeManageGroup === key ? "selected" : ""}>${escapeHtml(group.label)} (${group.employees.length} คน)</option>`).join("")}</select></label>
          <label><input id="selectAllTimeEmployees" type="checkbox" ${groupEmployees.length ? "" : "disabled"} /> เลือกทุกคนในกลุ่มนี้</label>
          <span>คงเลขแรกของกลุ่มที่เลือก เช่น 201, 205 → 201, 202 ไม่เปลี่ยนกลุ่มอื่น</span>
        </div>
        <div class="table-scroll"><table class="time-employee-table time-employee-pick-table">
          <thead><tr><th class="select-column"></th><th>เลขพนักงาน</th><th>ชื่อพนักงาน</th><th>กลุ่ม</th><th>ฐานรายวัน</th><th>จัดการ</th></tr></thead>
          <tbody>${groupEmployees.length ? groupEmployees.map((employee) => {
            const type = getTimeEmployeeTypeOption(employee.employee_type);
            return `<tr><td class="select-column"><input class="time-employee-select" data-time-employee-select="${employee.id}" type="checkbox" aria-label="เลือก ${escapeHtml(employee.fullname)}" /></td><td><strong>${escapeHtml(employee.emp_code)}</strong></td><td>${escapeHtml(employee.fullname)}</td><td>${escapeHtml(type.shortLabel || type.label)}</td><td>${type.dailyWage.toLocaleString("th-TH")} บาท</td><td><div class="row-actions"><button class="btn btn-small btn-outline" data-edit-time-employee="${employee.id}" type="button">แก้ไข</button>${canDelete ? `<button class="btn btn-small btn-danger" data-delete-time-employee="${employee.id}" type="button">ลบ</button>` : ""}</div></td></tr>`;
          }).join("") : `<tr><td colspan="6" class="empty-cell">เลือกกลุ่มด้านบนเพื่อแสดงรายชื่อและจัดเลข</td></tr>`}</tbody>
        </table></div>
      </section>
    </div>`;
  }

  return `
    <div class="time-employees-page">
    <section class="panel time-employees-hero">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>${escapeHtml(moduleItem.description)}</p>
        </div>
        <span class="badge ${canManage ? "badge-success" : "badge-warning"}">
          ${canManage ? "Can add/edit" : "View only"}
        </span>
      </div>
      <div class="time-employee-overview">
        <div class="metric-card metric-green"><span>พนักงานทั้งหมด</span><strong>${allEmployees.length.toLocaleString("th-TH")}</strong><small>ฐานพนักงานตามเวลา</small></div>
        <div class="metric-card metric-blue"><span>ใช้งานอยู่</span><strong>${activeEmployees.toLocaleString("th-TH")}</strong><small>พร้อมบันทึกเวลา</small></div>
        <div class="metric-card metric-purple"><span>กลุ่มพิเศษ</span><strong>${specialEmployees.toLocaleString("th-TH")}</strong><small>ฐาน 347 / 365 / 500</small></div>
      </div>

      <div class="toolbar">
        <form class="search-form" id="timeEmployeeSearchForm">
          <label class="search-box">
            <span>ค้นหาพนักงาน</span>
            <input
              id="timeEmployeeSearch"
              name="timeEmployeeSearch"
              placeholder="ค้นหารหัส ชื่อ หรือประเภท"
              value="${escapeHtml(timeEmployeeSearch)}"
            />
          </label>
          <button class="btn btn-primary" type="submit">ค้นหา</button>
          <button class="btn btn-outline" id="clearTimeEmployeeSearch" type="button">ล้าง</button>
        </form>
        <button class="btn btn-outline" data-export-scale-employees="time" type="button">ดาวน์โหลดรายชื่อพนักงานรายวัน (JSON)</button>
        <button class="btn btn-outline" id="exportTimeEmployeeXml" type="button" aria-describedby="timeXmlNote">เลือกรายชื่อ / ดาวน์โหลด XML (ZIP)</button>
      </div>
      <p id="timeXmlNote">เลือกเฉพาะพนักงานที่ต้องการเพิ่ม แล้วดาวน์โหลด ENROLLDB.ZIP สำหรับเครื่อง HIP</p>
    </section>

    ${
      timeEmployeeMessage
        ? `<div class="alert ${timeEmployeeMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(timeEmployeeMessage)}</div>`
        : ""
    }

    <section class="table-card time-employee-table-card">
      <div class="time-employee-table-head">
        <div><h3>รายชื่อพนักงาน</h3><p>พบ ${employees.length.toLocaleString("th-TH")} คน${timeEmployeeSearch ? ` จากคำค้น “${escapeHtml(timeEmployeeSearch)}”` : ""}</p></div>
        ${canManage ? `<div class="time-employee-head-actions"><button class="btn btn-outline" id="goToTimeEmployeeManage" type="button">Edit</button><button class="btn btn-primary" id="addTimeEmployee" type="button">+ เพิ่มพนักงาน</button></div>` : ""}
      </div>
      <div class="table-scroll">
        <table class="time-employee-table">
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
            </tr>
          </thead>
          <tbody>
            ${
              employees.length
                ? employees.map((employee) => renderTimeEmployeeRow(employee, canManage, canDelete)).join("")
                : `<tr><td colspan="8" class="empty-cell">ยังไม่มีพนักงานตามเวลา</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
    </div>
  `;
}

function renderTimeEmployeeForm(employee) {
  const mode = employee ? "แก้ไขพนักงานตามเวลา" : "เพิ่มพนักงานตามเวลา";
  const selectedType = normalizeTimeEmployeeType(employee?.employee_type);
  return `
    <section class="panel time-employee-editor">
      <div class="time-employee-editor-head">
        <span class="time-employee-step">ข้อมูลพนักงาน</span>
        <h2>${mode}</h2>
        <p>${employee ? `กำลังแก้ไข ${escapeHtml(employee.emp_code)} · ${escapeHtml(employee.fullname)}` : "กรอกข้อมูลพนักงานตามเวลาให้ครบถ้วน"}</p>
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
          <span>กลุ่มสมัครงาน</span>
          <select name="recruitment_group" ${employee ? "" : "required"}>
            <option value="">${employee ? "ยังไม่ระบุกลุ่ม" : "เลือกกลุ่มสมัครงาน"}</option>
            ${timeRecruitmentGroupOptions.map((option) => `<option value="${option.id}" ${employee?.recruitment_group === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
          </select>
          <small>แยกจากกลุ่มที่ใช้คำนวณค่าแรง</small>
        </label>

        <label class="field" data-time-ot-rate ${selectedType === "office_347" ? "hidden" : ""}>
          <span>OT บาท/ชม.</span>
          <input name="ot_hourly_rate" type="number" min="0" step="1" value="${employee ? escapeHtml(String(employee.ot_hourly_rate || TIME_OT_HOURLY_RATE)) : TIME_OT_HOURLY_RATE}" required />
        </label>

        <button class="btn btn-primary form-submit" type="submit">
          ${employee ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน"}
        </button>
      </form>
    </section>
  `;
}

function renderTimeEmployeeRow(employee) {
  const typeOption = getTimeEmployeeTypeOption(employee.employee_type);
  return `
    <tr>
      <td>${employee.id}</td>
      <td><strong>${escapeHtml(employee.emp_code)}</strong></td>
      <td>${escapeHtml(employee.fullname)}</td>
      <td><span class="badge ${typeOption.category === "special" ? "badge-warning" : "badge-success"}">${escapeHtml(typeOption.shortLabel || typeOption.label)}</span></td>
      <td>${typeOption.category === "office" ? "—" : `${typeOption.dailyWage.toLocaleString("th-TH")} บาท`}</td>
      <td>${typeOption.category === "office" ? "—" : `${(Number(employee.ot_hourly_rate) || TIME_OT_HOURLY_RATE).toLocaleString("th-TH")} บาท/ชม.`}</td>
      <td>${formatDate(employee.created_at)}</td>
      <td>${formatDate(employee.updated_at)}</td>
    </tr>
  `;
}

function bindTimeEmployeeEvents(user) {
  document.querySelector('#exportTimeEmployeeXml')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try {
      await exportTimeEmployeeXml();
      timeEmployeeMessage = '';
      timeEmployeeMessageType = 'success';
    } catch (error) {
      timeEmployeeMessage = error.message || 'ดาวน์โหลด XML ไม่สำเร็จ';
      timeEmployeeMessageType = 'error';
    } finally { render(); }
  });
  document.querySelectorAll('[data-export-scale-employees="time"]').forEach((exportButton) => exportButton.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const count = await exportScaleEmployeeFile("time");
      timeEmployeeMessage = `ดาวน์โหลดพนักงานตามเวลาทั้งหมด ${count.toLocaleString("th-TH")} คนแล้ว เป็นไฟล์รายชื่อเว็บ ยังไม่ใช่ไฟล์ XML สำหรับอัปเข้าเครื่อง HIP`;
      timeEmployeeMessageType = "success";
    } catch (error) {
      timeEmployeeMessage = error instanceof Error ? error.message : "ดาวน์โหลดรายชื่อไม่สำเร็จ";
      timeEmployeeMessageType = "error";
    } finally {
      render();
    }
  }));
  document.querySelector("#timeEmployeeNumberGroup")?.addEventListener("change", (event) => {
    timeEmployeeManageGroup = event.target.value;
    timeEmployeeMessage = "";
    render();
  });
  document.querySelector("#backToTimeEmployeeList")?.addEventListener("click", () => {
    timeEmployeePageMode = "list";
    editingTimeEmployeeId = null;
    timeEmployeeMessage = "";
    render();
  });
  document.querySelector("#goToTimeEmployeeManage")?.addEventListener("click", () => {
    timeEmployeePageMode = "manage";
    timeEmployeeMessage = "";
    render();
  });
  document.querySelector("#addTimeEmployee")?.addEventListener("click", () => {
    editingTimeEmployeeId = null;
    timeEmployeePageMode = "editor";
    timeEmployeeMessage = "";
    render();
  });
  const selectionBoxes = [...document.querySelectorAll(".time-employee-select")];
  const selectAllBox = document.querySelector("#selectAllTimeEmployees");
  const renumberButton = document.querySelector("#openTimeEmployeeRenumber");
  const updateSelection = () => {
    const selectedCount = selectionBoxes.filter((box) => box.checked).length;
    const countLabel = document.querySelector("#timeEmployeeSelectedCount");
    if (countLabel) countLabel.textContent = String(selectedCount);
    if (renumberButton) renumberButton.disabled = selectedCount < 2;
    if (selectAllBox) {
      selectAllBox.checked = selectedCount > 0 && selectedCount === selectionBoxes.length;
      selectAllBox.indeterminate = selectedCount > 0 && selectedCount < selectionBoxes.length;
    }
  };
  selectionBoxes.forEach((box) => box.addEventListener("change", updateSelection));
  selectAllBox?.addEventListener("change", () => {
    selectionBoxes.forEach((box) => { box.checked = selectAllBox.checked; });
    updateSelection();
  });
  renumberButton?.addEventListener("click", async () => {
    if (!canManageEmployees(user)) return;
    const selectedIds = selectionBoxes.filter((box) => box.checked).map((box) => Number(box.dataset.timeEmployeeSelect));
    try {
      await hydrateTimeEmployeesFromCloud();
      const plan = buildTimeEmployeeRenumberPlan(selectedIds);
      const changes = plan.filter((item) => item.oldCode !== item.newCode);
      if (!changes.length) {
        timeEmployeeMessage = "กลุ่มที่เลือกมีหมายเลขเรียงต่อกันอยู่แล้ว";
        timeEmployeeMessageType = "success";
        render();
        return;
      }
      const preview = changes.slice(0, 8).map((item) => `${item.oldCode} → ${item.newCode}  ${item.employee.fullname}`).join("\n");
      const remaining = changes.length > 8 ? `\n...และอีก ${changes.length - 8} คน` : "";
      const confirmed = window.confirm(`ตรวจสอบลำดับเลขใหม่ (${changes.length} คน)\n\n${preview}${remaining}\n\nยืนยันจัดลำดับเลขเฉพาะกลุ่มที่เลือกหรือไม่?`);
      if (!confirmed) return;
      renumberButton.disabled = true;
      renumberButton.textContent = "กำลังจัดลำดับ...";
      const changedCount = await apiRenumberTimeEmployees(plan);
      timeEmployeeMessage = `จัดลำดับหมายเลขพนักงานสำเร็จ ${changedCount} คน`;
      timeEmployeeMessageType = "success";
      timeEmployeePageMode = "list";
      render();
    } catch (error) {
      timeEmployeeMessage = error instanceof Error ? error.message : "จัดลำดับหมายเลขพนักงานไม่สำเร็จ";
      timeEmployeeMessageType = "error";
      render();
    }
  });

  document.querySelector("#timeEmployeeSearchForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    timeEmployeeSearch = String(form.get("timeEmployeeSearch") || "");
    try {
      // Keep the complete cache: group selection and collision checks need all employees.
      const data = await cloudApiRequest("/api/time-employees");
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
  document.querySelector("#timeEmployeeForm select[name='employee_type']")?.addEventListener("change", (event) => {
    const field = document.querySelector("[data-time-ot-rate]");
    if (field) field.hidden = event.target.value === "office_347";
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
      recruitment_group: normalizeTimeRecruitmentGroup(form.get("recruitment_group")),
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
      timeEmployeePageMode = "list";
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
      timeEmployeePageMode = "editor";
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
                <th>น้ำหนักทุเรียน</th>
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

function renderDashboardBars(pileSummaries, fruitFilter = summaryFruitFilter) {
  const keys = fruitFilter === "all" || isSingleWeightFruit(fruitFilter)
    ? ["total"] : fruitFilter === "durian" ? ["gradeTotal"] : ["water", "flower"];
  const maxValue = Math.max(1, ...pileSummaries.flatMap((item) => keys.map((key) => Number(item[key]) || 0)));
  return pileSummaries.map((item) => '<div class="summary-bar-group"><div class="summary-bars">' +
    keys.map((key) => {
      const value = Number(item[key]) || 0;
      const color = key === "gradeTotal" ? "durian" : key === "flower" ? "flower" : "water";
      return '<div class="summary-bar ' + color + '" style="height:' + (value / maxValue * 100) + '%"><span>' + numberText(value) + '</span></div>';
    }).join("") + '</div><strong>กอง ' + escapeHtml(item.pile) + '</strong></div>').join("");
}

function renderPileSummaryRow(item, fruitFilter = summaryFruitFilter) {
  const showDurianWeight = fruitFilter === "all" || fruitFilter === "durian";
  const showStandardWeights = fruitFilter !== "durian" && (fruitFilter === "all" || !isSingleWeightFruit(fruitFilter));
  return `
    <tr>
      <td>กอง ${item.pile}</td>
      ${showStandardWeights ? `<td>${numberText(item.water)}</td><td>${numberText(item.flower)}</td>` : ""}
      ${showDurianWeight ? `<td>${numberText(getDurianGradeTotal(item.grades))}</td>` : ""}
      <td><strong>${numberText(item.total)}</strong></td>
      <td><strong>${money(item.amount)}</strong></td>
    </tr>
  `;
}

function renderDashboardDetailRow(record, fruitFilter = summaryFruitFilter) {
  const employee = getEmployees().find((item) => item.id === record.employee_id);
  const isDurian = isDurianFruit(productionFruitTypeForRecord(record));
  const showFruit = fruitFilter === "all";
  const showDurianWeight = fruitFilter === "all" || fruitFilter === "durian";
  const showStandardWeights = fruitFilter !== "durian" && (fruitFilter === "all" || !isSingleWeightFruit(fruitFilter));
  const pile = normalizeProductionPileNumber(record.pile_no ?? record.pile);

  return `
    <tr>
      <td>${escapeHtml(record.record_time || "")}</td>
      <td><strong>${escapeHtml(record.emp_code || "")}</strong></td>
      <td>${escapeHtml(record.employee_name || employee?.fullname || "")}</td>
      ${showFruit ? `<td>${escapeHtml(getProductionFruitLabel(productionFruitTypeForRecord(record)))}</td>` : ""}
      <td>${pile === null ? "-" : pile}</td>
      ${showStandardWeights ? `<td>${isDurian ? "-" : numberText(record.water_weight || record.water)}</td><td>${isDurian ? "-" : numberText(record.flower_weight || record.flower)}</td>` : ""}
      ${showDurianWeight ? `<td>${isDurian ? numberText(getRecordDurianWeight(record)) : "-"}</td>` : ""}
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
    lines.push(csvRow(["น้ำหนักทุเรียน (กก.)", getDurianGradeTotal(totals.grades)]));
    lines.push(csvRow(["ยอดเงินรวม", totals.amount]));
    lines.push(csvRow(["พนักงานที่มีรายการ", totals.people.size]));
    lines.push(csvRow(["จำนวนรายการ", records.length]));
    lines.push("");
  }

  if (summaryExportOptions.piles) {
    lines.push(csvRow(["สรุปตามกอง"]));
    lines.push(csvRow(["กอง", "น้ำหนักน้ำ (กก.)", "น้ำหนักดอก (กก.)", "น้ำหนักทุเรียน (กก.)", "รวม (กก.)", "รวมเงิน"]));
    pileSummaries.forEach((item) => {
      lines.push(csvRow([`กอง ${item.pile}`, item.water, item.flower, getDurianGradeTotal(item.grades), item.total, item.amount]));
    });
    lines.push("");
  }

  if (summaryExportOptions.details) {
    lines.push(csvRow(["รายละเอียด"]));
    lines.push(csvRow(["วันที่", "เวลา", "รหัสพนักงาน", "ชื่อพนักงาน", "กอง", "น้ำหนักน้ำ", "น้ำหนักดอก", "น้ำหนักทุเรียน", "น้ำหนักรวม", "รวมเงิน", "ผู้บันทึก"]));
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
          isDurianFruit(productionFruitTypeForRecord(record)) ? getRecordDurianWeight(record) : "-",
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

function getDashboardFruitIcon(fruitId) {
  return {
    mangosteen: "●",
    durian: "◆",
    mango: "◐",
    coconut: "◒"
  }[fruitId] || "●";
}

function renderHomeFruitCard(fruit, records) {
  const fruitRecords = records.filter(
    (record) => productionFruitTypeForRecord(record) === fruit.id
  );
  const totalWeight = fruitRecords.reduce(
    (total, record) => total + getRecordTotalWeight(record),
    0
  );
  const available = Boolean(productionFruitFieldLabels[fruit.id]);

  return `
    <button
      class="home-fruit-card ${available ? "" : "is-pending"}"
      type="button"
      ${available ? `data-route="production" data-dashboard-fruit="${escapeHtml(fruit.id)}"` : "disabled"}
    >
      <span class="home-fruit-visual home-fruit-${escapeHtml(fruit.id)}" aria-hidden="true">
        ${getDashboardFruitIcon(fruit.id)}
      </span>
      <span class="home-fruit-copy">
        <strong>${escapeHtml(fruit.label)}</strong>
        <small>${fruitRecords.length.toLocaleString("th-TH")} รายการ</small>
        <b>${numberText(totalWeight)} กก.</b>
      </span>
      <span class="home-fruit-status ${available ? "is-ready" : "is-waiting"}">
        ${available ? "พร้อมใช้งาน" : "เตรียมไว้ก่อน"}
      </span>
    </button>
  `;
}

function renderHomeRecentRow(record, employeeMap) {
  const employee = employeeMap.get(record.employee_id) || {};
  const fruit = productionFruitOptions.find(
    (item) => item.id === productionFruitTypeForRecord(record)
  );
  return `
    <tr>
      <td>${escapeHtml(record.record_time || "-")}</td>
      <td><strong>${escapeHtml(record.employee_name || employee.fullname || record.emp_code || "-")}</strong></td>
      <td>${escapeHtml(fruit?.label || "มังคุด")}</td>
      <td>กอง ${escapeHtml(record.pile_no || "-")}</td>
      <td><strong>${numberText(getRecordTotalWeight(record))} กก.</strong></td>
      <td>${escapeHtml(record.created_by || "-")}</td>
    </tr>
  `;
}

function renderHomePileRow(pile, maxWeight) {
  const width = maxWeight > 0 ? Math.max(8, (pile.weight / maxWeight) * 100) : 0;
  return `
    <div class="home-pile-row">
      <span>กอง ${escapeHtml(pile.number)}</span>
      <div class="home-pile-track"><i style="width:${width}%"></i></div>
      <strong>${numberText(pile.weight)} กก.</strong>
    </div>
  `;
}

function homeStorageUsageView() {
  const usedBytes = Number(homeStorageUsage?.used_bytes) || 0;
  const limitBytes = Number(homeStorageUsage?.limit_bytes) || SUPABASE_DATABASE_INCLUDED_BYTES;
  const remainingBytes = Math.max(0, Number(homeStorageUsage?.remaining_bytes) || limitBytes - usedBytes);
  const percent = Math.min(100, Math.max(0, Number(homeStorageUsage?.percent) || 0));
  const warningPercent = Number(homeStorageUsage?.warning_percent) || BACKUP_STORAGE_WARNING_PERCENT;
  const level = percent >= warningPercent ? "critical" : percent >= 70 ? "watch" : percent >= 45 ? "moderate" : "healthy";
  return { usedBytes, limitBytes, remainingBytes, percent, warningPercent, level };
}

function homeBandwidthUsageView() {
  const raw = homeStorageUsage?.bandwidth_usage || {};
  const usedBytes = Number(raw.used_bytes) || 0;
  const limitBytes = Number(raw.limit_bytes) || SUPABASE_BANDWIDTH_INCLUDED_BYTES;
  const remainingBytes = Math.max(0, Number(raw.remaining_bytes) || limitBytes - usedBytes);
  const percent = Math.min(100, Math.max(0, Number(raw.percent) || 0));
  const warningPercent = Number(raw.warning_percent) || BACKUP_STORAGE_WARNING_PERCENT;
  const configured = Boolean(raw.configured);
  const level = percent >= warningPercent ? "critical" : percent >= 70 ? "watch" : percent >= 45 ? "moderate" : "healthy";
  return { usedBytes, limitBytes, remainingBytes, percent, warningPercent, configured, level };
}

function renderHomeBandwidthUsage() {
  const bandwidth = homeBandwidthUsageView();
  const displayPercent = bandwidth.percent < 0.1 && bandwidth.usedBytes > 0
    ? "< 0.1"
    : bandwidth.percent.toLocaleString("th-TH", { maximumFractionDigits: 1 });
  const fillPercent = Math.max(bandwidth.percent > 0 ? 1 : 0, bandwidth.percent);
  const label = bandwidth.configured
    ? `${formatBackupFileSize(bandwidth.usedBytes)} / ${formatBackupFileSize(bandwidth.limitBytes)}`
    : "รอใส่ค่า SUPABASE_BANDWIDTH_USED_GB";
  return `
    <div class="home-storage-subusage is-${bandwidth.level}">
      <div class="home-storage-subusage-head">
        <span>Bandwidth / Egress</span>
        <strong>${bandwidth.configured ? `${displayPercent}%` : "ยังไม่ตั้งค่า"}</strong>
      </div>
      <div class="home-storage-subtrack" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(bandwidth.percent)}">
        <span style="width:${fillPercent}%"></span>
        <i style="left:${bandwidth.warningPercent}%"></i>
      </div>
      <small>${escapeHtml(label)} • โควตา Pro ${formatBackupFileSize(bandwidth.limitBytes)} / รอบบิล</small>
    </div>
  `;
}

function renderHomeStorageUsage() {
  const usage = homeStorageUsageView();
  const displayPercent = usage.percent < 0.1 && usage.usedBytes > 0
    ? "< 0.1"
    : usage.percent.toLocaleString("th-TH", { maximumFractionDigits: 1 });
  const fillPercent = Math.max(usage.percent > 0 ? 1 : 0, usage.percent);
  const statusText = usage.level === "critical"
    ? "ควรสำรองและจัดการข้อมูล"
    : usage.level === "watch"
      ? "ใกล้ระดับแจ้งเตือน"
      : usage.level === "moderate" ? "ใช้งานปานกลาง" : "พื้นที่พร้อมใช้งาน";
  const measuredAt = homeStorageUsage?.measured_at ? formatBackupDateTime(homeStorageUsage.measured_at) : "-";

  return `
    <section class="home-storage-card is-${usage.level}" aria-label="พื้นที่ฐานข้อมูล Supabase">
      <div class="home-storage-head">
        <div class="home-storage-title">
          <span class="home-storage-mark" aria-hidden="true">DB</span>
          <div><p>SUPABASE PRO DATABASE</p><h3>พื้นที่จัดเก็บข้อมูล</h3><small>พื้นที่ฐานข้อมูล 8 GB • Delta Sync ประหยัด Bandwidth • อัปเดตทุก 10 นาที</small></div>
        </div>
        <div class="home-storage-score"><strong>${homeStorageUsageLoading ? "..." : `${displayPercent}%`}</strong><span>${homeStorageUsageError ? "ยังอ่านข้อมูลไม่ได้" : statusText}</span></div>
      </div>
      <div class="home-storage-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(usage.percent)}">
        <span style="width:${fillPercent}%"></span>
        <i style="left:${usage.warningPercent}%"><b>${usage.warningPercent}%</b></i>
      </div>
      <div class="home-storage-scale"><span>0</span><span>ระดับแจ้งเตือน</span><span>${formatBackupFileSize(usage.limitBytes)}</span></div>
      ${renderHomeBandwidthUsage()}
      <div class="home-storage-details">
        <div><span>ใช้ไปแล้ว</span><strong>${homeStorageUsage ? formatBackupFileSize(usage.usedBytes) : "-"}</strong></div>
        <div><span>พื้นที่คงเหลือ</span><strong>${homeStorageUsage ? formatBackupFileSize(usage.remainingBytes) : "-"}</strong></div>
        <div><span>ข้อมูลในฐานข้อมูล</span><strong>${homeStorageUsage ? `${Number(homeStorageUsage.total_rows || 0).toLocaleString("th-TH")} รายการ` : "-"}</strong></div>
        <div><span>อัปเดตล่าสุด</span><strong>${measuredAt}</strong></div>
        <button class="home-storage-refresh" id="homeStorageRefresh" type="button" title="อ่านข้อมูลล่าสุดจาก Supabase" aria-label="อ่านข้อมูลพื้นที่ล่าสุด" ${homeStorageUsageLoading ? "disabled" : ""}>↻</button>
      </div>
      <div class="home-retention-note"><strong>นโยบายข้อมูล 6 เดือน</strong><span>สำรองและตรวจสอบก่อนลบข้อมูลเก่าทุกครั้ง เพื่อไม่ให้กระทบค่าแรงและรายงานย้อนหลัง</span></div>
      ${homeStorageUsageError ? `<p class="home-storage-error">${escapeHtml(homeStorageUsageError)}</p>` : ""}
    </section>`;
}

async function loadHomeStorageUsage(force = false) {
  if (homeStorageUsageLoading) return;
  homeStorageUsageLoading = true;
  homeStorageUsageError = "";
  try {
    const response = await cloudApiRequest(`/api/storage-usage${force ? "?refresh=1" : ""}`, { timeoutMs: 12000 });
    homeStorageUsage = response.data || null;
    homeStorageUsageLoaded = true;
    homeStorageUsageSetupMissing = false;
  } catch (error) {
    homeStorageUsageLoaded = true;
    const message = error instanceof Error ? error.message : "";
    homeStorageUsageSetupMissing = /get_database_storage_usage|schema cache/i.test(message);
    homeStorageUsageError = homeStorageUsageSetupMissing
      ? "ยังไม่ได้ติดตั้งตัวอ่านพื้นที่ฐานข้อมูล กรุณารันไฟล์ supabase_storage_usage_migration.sql ใน Supabase SQL Editor"
      : message || "ไม่สามารถอ่านพื้นที่ฐานข้อมูลได้";
  } finally {
    homeStorageUsageLoading = false;
  }
}

function updateHomeStorageCard() {
  const card = document.querySelector(".home-storage-card");
  if (!card || location.hash.replace("#/", "") !== "dashboard") return;
  card.outerHTML = renderHomeStorageUsage();
  bindHomeStorageRefreshButton();
}

function bindHomeStorageRefreshButton() {
  document.querySelector("#homeStorageRefresh")?.addEventListener("click", async () => {
    homeStorageUsageLoading = true;
    updateHomeStorageCard();
    await loadHomeStorageUsage(true);
    updateHomeStorageCard();
    startHomeStorageUsageRefresh();
  });
}

function startHomeStorageUsageRefresh() {
  if (homeStorageUsageTimer || homeStorageUsageSetupMissing || location.hash.replace("#/", "") !== "dashboard") return;
  homeStorageUsageTimer = window.setInterval(async () => {
    if (location.hash.replace("#/", "") !== "dashboard") {
      stopHomeStorageUsageRefresh();
      return;
    }
    await loadHomeStorageUsage();
    updateHomeStorageCard();
  }, HOME_STORAGE_REFRESH_INTERVAL_MS);
}

function stopHomeStorageUsageRefresh() {
  if (!homeStorageUsageTimer) return;
  window.clearInterval(homeStorageUsageTimer);
  homeStorageUsageTimer = null;
}

function bindHomeStorageUsageEvents() {
  if (!homeStorageUsageLoaded && !homeStorageUsageLoading) {
    loadHomeStorageUsage().then(() => {
      updateHomeStorageCard();
      startHomeStorageUsageRefresh();
    });
  }
  bindHomeStorageRefreshButton();
  startHomeStorageUsageRefresh();
}

function renderDashboard(user, moduleItem) {
  const today = localDateInputValue();
  const dateLabel = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());
  const canViewSummary = canOpen(user, "summary-all");
  const records = getDashboardRecordsForDate(today);
  const totals = getProductionTotals(records);
  const employeeMap = new Map(getEmployees().map((employee) => [employee.id, employee]));
  const latestRecords = [...records]
    .sort((a, b) =>
      `${b.record_date || ""} ${b.record_time || ""} ${b.created_at || ""}`.localeCompare(
        `${a.record_date || ""} ${a.record_time || ""} ${a.created_at || ""}`
      )
    )
    .slice(0, 5);
  const pilesByNumber = new Map();
  records.forEach((record) => {
    const pileNumber = String(record.pile_no || "-");
    pilesByNumber.set(
      pileNumber,
      (pilesByNumber.get(pileNumber) || 0) + getRecordTotalWeight(record)
    );
  });
  const pileSummaries = Array.from(pilesByNumber, ([number, weight]) => ({ number, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  const maxPileWeight = pileSummaries[0]?.weight || 0;

  return `
    <section class="factory-dashboard home-dashboard">
      <header class="home-welcome">
        <div>
          <p class="eyebrow">โครงงานระบบชั่งน้ำหนักผลผลิตอัตโนมัติ</p>
          <h2>ยินดีต้อนรับ คุณ ${escapeHtml(user.fullname)}</h2>
          <p>ภาพรวมการทำงานประจำวัน</p>
          <time datetime="${escapeHtml(today)}">${escapeHtml(dateLabel)}</time>
        </div>
        <div class="home-welcome-fruits" aria-hidden="true"></div>
        <div class="home-welcome-actions">
          <button class="btn btn-primary" type="button" data-route="production">
            <span aria-hidden="true">▣</span> บันทึกผลผลิต
          </button>
          ${canViewSummary
            ? `<button class="btn btn-outline" type="button" data-route="summary-all"><span aria-hidden="true">▤</span> ดูสรุปทั้งหมด</button>`
            : `<button class="btn btn-outline btn-locked" type="button" data-route="summary-all">สรุปข้อมูลถูกล็อก</button>`}
        </div>
      </header>

      <section class="home-kpi-strip" aria-label="ภาพรวมวันนี้">
        <div class="home-kpi home-kpi-weight"><span aria-hidden="true">▣</span><p>น้ำหนักรวมวันนี้<strong>${numberText(totals.total)} <small>กก.</small></strong></p></div>
        <div class="home-kpi home-kpi-money"><span aria-hidden="true">฿</span><p>ยอดเงินวันนี้<strong>${money(totals.amount)}</strong></p></div>
        <div class="home-kpi home-kpi-people"><span aria-hidden="true">●</span><p>พนักงานที่มีรายการ<strong>${totals.people.size.toLocaleString("th-TH")} <small>คน</small></strong></p></div>
        <div class="home-kpi home-kpi-piles"><span aria-hidden="true">▦</span><p>จำนวนกอง<strong>${pilesByNumber.size.toLocaleString("th-TH")} <small>กอง</small></strong></p></div>
      </section>

      ${renderHomeStorageUsage()}

      <section class="home-section home-fruit-section">
        <div class="home-section-heading">
          <div><h3>งานผลผลิตวันนี้</h3><p>เลือกผลไม้เพื่อไปยังหน้าบันทึกผลผลิต</p></div>
          <span>${records.length.toLocaleString("th-TH")} รายการ</span>
        </div>
        <div class="home-fruit-grid">
          ${productionFruitOptions.map((fruit) => renderHomeFruitCard(fruit, records)).join("")}
        </div>
      </section>

      <section class="home-lower-grid">
        <section class="home-section home-recent-card">
          <div class="home-section-heading">
            <div><h3>รายการล่าสุด</h3><p>ข้อมูลผลผลิตที่บันทึกในวันนี้</p></div>
            <button class="home-text-button" type="button" data-route="summary-all">ดูทั้งหมด</button>
          </div>
          <div class="table-scroll">
            <table class="home-recent-table">
              <thead><tr><th>เวลา</th><th>พนักงาน</th><th>ผลไม้</th><th>กอง</th><th>น้ำหนักรวม</th><th>ผู้บันทึก</th></tr></thead>
              <tbody>
                ${latestRecords.length
                  ? latestRecords.map((record) => renderHomeRecentRow(record, employeeMap)).join("")
                  : `<tr><td colspan="6" class="empty-cell">ยังไม่มีรายการผลผลิตในวันนี้</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>

        <section class="home-section home-pile-card">
          <div class="home-section-heading">
            <div><h3>สรุปตามกอง</h3><p>เรียงตามน้ำหนักรวมวันนี้</p></div>
            ${canViewSummary ? `<button class="home-text-button" type="button" data-route="summary-all">ดูทั้งหมด</button>` : ""}
          </div>
          <div class="home-pile-list">
            ${pileSummaries.length
              ? pileSummaries.map((pile) => renderHomePileRow(pile, maxPileWeight)).join("")
              : `<div class="home-empty">ยังไม่มีข้อมูลกองในวันนี้</div>`}
          </div>
        </section>
      </section>
    </section>
  `;
}

function getTimeSummaryRange() {
  const fallbackDate = localDateInputValue();
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
  if (record.employee_type === "office_347") return 0;
  return Number(record.normal_hourly_rate) || ((Number(record.daily_wage) || TIME_DAILY_WAGE) / TIME_STANDARD_HOURS);
}

function calculateTimeNormalWageAmount(normalHours, record = {}) {
  if (record.employee_type === "office_347") return 0;
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
  const timeEmployees = typeof getTimeEmployees === "function" ? getTimeEmployees() : [];
  const employee = timeEmployees.find((item) =>
    (record.employee_id && String(item.id) === String(record.employee_id)) ||
    (!record.employee_id && String(item.emp_code) === String(record.emp_code || ""))
  );
  const otHourlyRate = (typeof getDailyOtOverride === "function" ? getDailyOtOverride(employee || record, record.record_date) : null)
    || Number(employee?.ot_hourly_rate)
    || Number(record.ot_hourly_rate)
    || TIME_OT_HOURLY_RATE;
  const effectiveRecord = employee ? {
    ...record,
    employee_type: employee.employee_type,
    daily_wage: Number(employee.daily_wage) || Number(record.daily_wage),
    normal_hourly_rate: (Number(employee.daily_wage) || Number(record.daily_wage) || TIME_DAILY_WAGE) / TIME_STANDARD_HOURS
  } : record;
  const normalAmount = calculateTimeNormalWageAmount(normalHours, effectiveRecord);
  const otAmount = effectiveRecord.employee_type === "office_347" ? 0 : otHours * otHourlyRate;

  return {
    ...effectiveRecord,
    normalHours,
    otHours,
    normalAmount,
    otAmount,
    otHourlyRate,
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
  if (group.rows.every((row) => row.employee_type === "office_347")) {
    return `<section class="receipt-panel"><h2>รายงานเวลาทำงาน Office</h2><p>${escapeHtml(group.emp_code)} · ${escapeHtml(group.fullname)} · ${escapeHtml(range.startDate)} - ${escapeHtml(range.endDate)}</p><table class="receipt-table"><thead><tr><th>วันที่</th><th>เข้า</th><th>ออก</th><th>ชั่วโมงปกติ</th><th>ชั่วโมง OT</th></tr></thead><tbody>${group.rows.map((row) => `<tr><td>${escapeHtml(row.record_date)}</td><td>${escapeHtml(row.clock_in)}</td><td>${escapeHtml(row.clock_out)}</td><td>${numberText(row.normalHours)}</td><td>${numberText(row.otHours)}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="3">รวม</td><td>${numberText(totals.normalHours)}</td><td>${numberText(totals.otHours)}</td></tr></tfoot></table></section>`;
  }
  const receiptNo = timeReceiptNumber(group.emp_code, range);
  const issuedAt = formatLiveClock();

  return `
    <section class="receipt-panel ${copy ? "copy" : ""}">
      ${copy ? `<div class="copy-watermark">สำเนา</div>` : ""}
      <header class="receipt-header">
        
        <div>
          <h1>โครงงานระบบชั่งน้ำหนักผลผลิตอัตโนมัติ</h1>
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

async function getReceiptLogoDataUrl() { return ""; }

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
    timeSummaryStartDate = formData.get("start_date") || localDateInputValue();
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
  const wageRows = combineTimeRecordsByEmployeeDate(records).map(getTimeReceiptRow);
  const wageTotals = wageRows.reduce((totals, row) => ({
    normal: totals.normal + row.normalAmount,
    ot: totals.ot + row.otAmount,
    total: totals.total + row.totalAmount
  }), { normal: 0, ot: 0, total: 0 });
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
    csvRow(["ค่าแรงปกติ", wageTotals.normal]),
    csvRow(["ค่า OT", wageTotals.ot]),
    csvRow(["ค่าแรงรวม", wageTotals.total]),
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

  lines.push(csvRow([]));
  lines.push(csvRow(["สรุปค่าแรงและ OT รายวัน"]));
  lines.push(csvRow(["วันที่", "ชั่วโมงปกติ", "ชั่วโมง OT", "OT/ชม.", "เงินปกติ", "เงิน OT", "รวม"]));
  wageRows.forEach((row) => lines.push(csvRow([
    row.record_date || "", row.normalHours, row.otHours, row.otHourlyRate,
    row.normalAmount, row.otAmount, row.totalAmount
  ])));

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
  const selectedFruit = productionFruitOptions.find((fruit) => fruit.id === personalReportFruitFilter);
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

        ${
          personalReportActiveTab === "production"
            ? `
              <label class="field compact-field">
                <span>ผลไม้</span>
                <select id="personalReportFruit" name="fruit_type">
                  ${productionFruitOptions
                    .filter((fruit) => productionFruitFieldLabels[fruit.id])
                    .map((fruit) => `<option value="${escapeHtml(fruit.id)}" ${personalReportFruitFilter === fruit.id ? "selected" : ""}>${escapeHtml(fruit.label)}</option>`)
                    .join("")}
                </select>
              </label>`
            : ""
        }

        <label class="field compact-field">
          <span>วันที่เริ่ม</span>
          <input id="personalReportStartDate" name="start_date" type="date" value="${escapeHtml(context.range.startDate)}" />
        </label>

        <label class="field compact-field">
          <span>วันที่สิ้นสุด</span>
          <input id="personalReportEndDate" name="end_date" type="date" value="${escapeHtml(context.range.endDate)}" />
        </label>

        <div class="personal-report-actions">
          ${
            personalReportActiveTab === "production"
              ? `
              <button class="btn btn-outline" id="exportPersonalExcel" type="button" ${context.selectedEmployee ? "" : "disabled"}>
                Export Excel ${escapeHtml(selectedFruit?.label || "ผลผลิต")}
              </button>
              <button class="btn btn-primary report-primary-button" id="exportPersonalPdf" type="button" ${context.selectedEmployee ? "" : "disabled"}>
                Export ใบสรุป PDF ${escapeHtml(selectedFruit?.label || "ผลผลิต")}
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
        </div>
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
                      <strong>Export ใบสรุปผลผลิต</strong>
                      <span>ไฟล์ PDF A4 แนวนอน ซ้ายต้นฉบับ / ขวาสำเนาสำหรับเซ็นรับเงิน</span>
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
    ? recordsForPersonalReport(context.selectedEmployee.id, context.range.startDate, context.range.endDate, personalReportFruitFilter)
    : [];
  const totals = summarizePersonalRecords(records);
  const dailySummaries = getDailyPersonalSummaries(records);
  const pileSummaries = getPilePersonalSummaries(records);
  const isSingleWeight = isSingleWeightFruit(personalReportFruitFilter);
  const labels = getProductionFieldLabels(personalReportFruitFilter);
  const selectedFruitLabel = getProductionFruitLabel(personalReportFruitFilter);
  const dailyColumnCount = 4;
  const pileColumnCount = 5;

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
        <small>${isSingleWeight
          ? `${escapeHtml(labels.weightShort || selectedFruitLabel)} ${numberText(totals.total)}`
          : `${escapeHtml(labels.waterShort)} ${numberText(totals.water)} | ${escapeHtml(labels.flowerShort)} ${numberText(totals.flower)}`}</small>
      </div>
      <div class="metric-card metric-blue">
        <span>ยอดเงินรวม</span>
        <strong>${money(totals.amount)}</strong>
        <small>${escapeHtml(selectedFruitLabel)}ของพนักงานที่เลือก</small>
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
                ${isSingleWeight
                  ? `<th>${escapeHtml(labels.weight || `น้ำหนัก${selectedFruitLabel}`)}</th>`
                  : `<th>${escapeHtml(labels.water)}</th><th>${escapeHtml(labels.flower)}</th>`}
                <th>น้ำหนักรวม</th>
                <th>รวมเป็นเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${
                dailySummaries.length
                  ? dailySummaries.map((item) => renderPersonalDailyRow(item, personalReportFruitFilter)).join("")
                  : `<tr><td colspan="${dailyColumnCount}" class="empty-cell">ยังไม่มีข้อมูล${escapeHtml(selectedFruitLabel)}ในช่วงวันที่นี้</td></tr>`
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
                ${isSingleWeight
                  ? `<th>${escapeHtml(labels.weight || `น้ำหนัก${selectedFruitLabel}`)}</th>`
                  : `<th>${escapeHtml(labels.water)}</th><th>${escapeHtml(labels.flower)}</th>`}
                <th>น้ำหนักรวม</th>
                <th>รวมเป็นเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${
                pileSummaries.length
                  ? pileSummaries.map((item) => renderPersonalPileRow(item, personalReportFruitFilter)).join("")
                  : `<tr><td colspan="${pileColumnCount}" class="empty-cell">ยังไม่มีข้อมูล${escapeHtml(selectedFruitLabel)}ตามกองในช่วงวันที่นี้</td></tr>`
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
  const wageRows = combineTimeRecordsByEmployeeDate(records).map(getTimeReceiptRow);
  const wageTotals = wageRows.reduce((totals, row) => ({
    normalHours: totals.normalHours + row.normalHours,
    otHours: totals.otHours + row.otHours,
    normalAmount: totals.normalAmount + row.normalAmount,
    otAmount: totals.otAmount + row.otAmount,
    totalAmount: totals.totalAmount + row.totalAmount
  }), { normalHours: 0, otHours: 0, normalAmount: 0, otAmount: 0, totalAmount: 0 });

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
      ${renderTimeSummaryMetricCard("ค่า OT", money(wageTotals.otAmount), `${numberText(wageTotals.otHours)} ชม.`, "metric-purple")}
      ${renderTimeSummaryMetricCard("ค่าแรงรวม", money(wageTotals.totalAmount), `ปกติ ${money(wageTotals.normalAmount)} + OT ${money(wageTotals.otAmount)}`, "metric-green")}
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

    <section class="table-card">
      <div class="table-heading">สรุปค่าแรงและ OT รายวัน</div>
      <div class="table-scroll"><table>
        <thead><tr><th>วันที่</th><th>ชม.ปกติ</th><th>ชม.OT</th><th>OT/ชม.</th><th>เงินปกติ</th><th>เงิน OT</th><th>รวม</th></tr></thead>
        <tbody>${wageRows.map((row) => `<tr><td>${escapeHtml(row.record_date || "-")}</td><td>${numberText(row.normalHours)}</td><td>${numberText(row.otHours)}</td><td>${money(row.otHourlyRate)}</td><td>${money(row.normalAmount)}</td><td>${money(row.otAmount)}</td><td><strong>${money(row.totalAmount)}</strong></td></tr>`).join("")}</tbody>
      </table></div>
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
    if (target.id === "personalReportFruit") {
      personalReportFruitFilter = target.value || "mangosteen";
    }
    if (target.id === "personalReportStartDate") {
      personalReportStartDate = target.value || localDateInputValue();
      if (personalReportStartDate > personalReportEndDate) personalReportEndDate = personalReportStartDate;
    }
    if (target.id === "personalReportEndDate") {
      personalReportEndDate = target.value || personalReportStartDate;
      if (personalReportEndDate < personalReportStartDate) personalReportStartDate = personalReportEndDate;
    }
    personalReportMessage = "";
    if (target.id === "personalReportEmployee" || target.id === "personalReportFruit") {
      personalReportExportMenuOpen = false;
    }
    render(true);
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
        context.range.endDate,
        personalReportActiveTab === "production" ? personalReportFruitFilter : "all"
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
        context.range.endDate,
        "all"
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
      setPersonalReportMessage("ดาวน์โหลด PDF ใบสรุปผลผลิต ต้นฉบับ/สำเนาแล้ว");
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
      setPersonalReportMessage("ดาวน์โหลด PDF ใบสรุปผลผลิต ต้นฉบับ/สำเนาแล้ว");
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
    { key: "grades", label: "น้ำหนักทุเรียน" },
    { key: "amount", label: "ยอดเงินรวม" },
    { key: "employees", label: "พนักงานที่มีรายการ" },
    { key: "records", label: "จำนวนรายการ" }
  ],
  piles: [
    { key: "pile", label: "กอง" },
    { key: "water", label: "น้ำหนักน้ำ" },
    { key: "flower", label: "น้ำหนักดอก" },
    { key: "grades", label: "น้ำหนักทุเรียน" },
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
    { key: "grades", label: "น้ำหนักทุเรียน" },
    { key: "total", label: "น้ำหนักรวม" },
    { key: "amount", label: "รวมเงิน" },
    { key: "createdBy", label: "ผู้บันทึก" }
  ]
};

function hasSelectedSummaryExportFields(section) {
  return getSummaryExportFieldsForFruit(section).some(
    (field) => summaryExportFields[section]?.[field.key]
  );
}

function getSelectedSummaryExportSections() {
  return Object.entries(summaryExportOptions)
    .filter(([section, enabled]) => enabled && hasSelectedSummaryExportFields(section))
    .map(([section]) => section);
}

function renderSummaryFieldOptions(section, title) {
  const fields = getSummaryExportFieldsForFruit(section);
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

function getSummaryExportFieldsForFruit(section, fruitId = summaryFruitFilter) {
  const fields = summaryExportFieldGroups[section] || [];
  const labels = fruitId === "all"
    ? { water: "น้ำหนักช่อง 1", flower: "น้ำหนักช่อง 2" }
    : getProductionFieldLabels(fruitId);
  const visibleFields = fruitId !== "all" && isSingleWeightFruit(fruitId)
    ? fields.filter((field) => !["water", "flower", "grades"].includes(field.key))
    : fruitId === "durian"
    ? fields.filter((field) => !["water", "flower"].includes(field.key))
    : fruitId !== "all"
      ? fields.filter((field) => field.key !== "grades")
      : fields;

  return visibleFields.map((field) => {
    if (field.key === "water") return { ...field, label: labels.water || field.label };
    if (field.key === "flower") return { ...field, label: labels.flower || field.label };
    return field;
  });
}

function getSummaryExportFieldSelection() {
  const selection = JSON.parse(JSON.stringify(summaryExportFields));
  Object.keys(selection).forEach((section) => {
    const allowed = new Set(getSummaryExportFieldsForFruit(section).map((field) => field.key));
    Object.keys(selection[section]).forEach((field) => {
      if (!allowed.has(field)) selection[section][field] = false;
    });
  });
  return selection;
}

function getProductionReportCatalog() {
  return {
    fruit_labels: Object.fromEntries(productionFruitOptions.map((fruit) => [fruit.id, fruit.label])),
    fruit_fields: Object.fromEntries(productionFruitOptions.map((fruit) => [fruit.id, { ...getProductionFieldLabels(fruit.id) }]))
  };
}

function getSummaryExportPayload(user, format) {
  const exportRange = getSummaryExportRange();
  return {
    start_date: exportRange.startDate,
    end_date: exportRange.endDate,
    fruit_type: summaryFruitFilter,
    printed_by: user?.fullname || "System Admin",
    printed_by_position: getExportPositionLabel(user),
    employees: getEmployees(),
    production_records: filterProductionRecordsByFruit(
      getDashboardRecordsForRange(exportRange.startDate, exportRange.endDate), summaryFruitFilter
    ),
    ...getProductionReportCatalog(),
    deduction_records: getAdjustmentRecordsForRange("production", exportRange.startDate, exportRange.endDate),
    export_sections: { ...summaryExportOptions },
    export_fields: getSummaryExportFieldSelection(),
    export_format: format
  };
}

function renderSummaryAll(moduleItem) {
  const user = getSession()?.user;
  const exportRange = getSummaryExportRange();
  const rangeLabel =
    exportRange.startDate === exportRange.endDate
      ? exportRange.startDate
      : `${exportRange.startDate} ถึง ${exportRange.endDate}`;

  const records = filterProductionRecordsByFruit(
    getDashboardRecordsForRange(exportRange.startDate, exportRange.endDate),
    summaryFruitFilter
  );
  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);
  const showGrades = summaryFruitFilter === "all" || summaryFruitFilter === "durian";
  const showStandardWeights = summaryFruitFilter !== "durian" && (summaryFruitFilter === "all" || !isSingleWeightFruit(summaryFruitFilter));
  const showTotalWeight = summaryFruitFilter === "all" || isSingleWeightFruit(summaryFruitFilter);
  const showFruitColumn = summaryFruitFilter === "all";
  const fruitLabels = summaryFruitFilter === "all"
    ? { water: "น้ำหนักช่อง 1", flower: "น้ำหนักช่อง 2", waterShort: "ช่อง 1", flowerShort: "ช่อง 2" }
    : getProductionFieldLabels(summaryFruitFilter);
  const detailColumnCount = 7 + (showFruitColumn ? 1 : 0) + (showStandardWeights ? 2 : 0) + (showGrades ? 1 : 0);
  const pileColumnCount = 3 + (showStandardWeights ? 2 : 0) + (showGrades ? 1 : 0);

  return `
    <section class="summary-page">
      <div class="summary-header">
        <div>
          <h2>${escapeHtml(moduleItem.label)}</h2>
          <p>เลือกช่วงวันที่และผลไม้เพื่อดูข้อมูล กราฟ ตาราง และ Export ตามช่วงที่เลือก</p>
        </div>
      </div>

      ${
        summaryExportMessage
          ? `<div class="alert ${summaryExportMessageType === "error" ? "alert-error" : "alert-success"}">${escapeHtml(summaryExportMessage)}</div>`
          : ""
      }

      <section class="summary-export-panel summary-main-export-workspace">
        <div>
          <strong>ตัวกรองและ Export ข้อมูลสรุป</strong>
          <span>ข้อมูลบนหน้านี้จะแสดงตามช่วงวันที่และผลไม้ที่เลือก</span>
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
          <label>
            <span>ผลไม้</span>
            <select id="summaryFruitFilter">
              <option value="all" ${summaryFruitFilter === "all" ? "selected" : ""}>ทุกผลไม้</option>
              ${productionFruitOptions
                .filter((fruit) => productionFruitFieldLabels[fruit.id])
                .map((fruit) => `<option value="${escapeHtml(fruit.id)}" ${summaryFruitFilter === fruit.id ? "selected" : ""}>${escapeHtml(fruit.label)}</option>`)
                .join("")}
            </select>
          </label>
          <span class="summary-mode-pill">${records.length.toLocaleString("th-TH")} รายการ</span>
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
          <small>${showTotalWeight
            ? `น้ำหนักรวม ${numberText(totals.total)} กก.`
            : summaryFruitFilter === "durian"
            ? `ทุเรียน ${numberText(getDurianGradeTotal(totals.grades))} กก.`
            : `${escapeHtml(fruitLabels.waterShort || "น้ำ")} ${numberText(totals.water)} กก. | ${escapeHtml(fruitLabels.flowerShort || "ดอก")} ${numberText(totals.flower)} กก.${showGrades ? ` | ทุเรียน ${numberText(getDurianGradeTotal(totals.grades))} กก.` : ""}`}</small>
        </div>
        <div class="metric-card metric-blue">
          <span>ยอดเงินรวม</span>
          <strong>${money(totals.amount)}</strong>
          <small>จากช่วงวันที่เลือก</small>
        </div>
        <div class="metric-card metric-purple">
          <span>พนักงานทั้งหมด</span>
          <strong>${totals.people.size.toLocaleString("th-TH")} คน</strong>
          <small>พนักงานที่มีรายการ</small>
        </div>
        <div class="metric-card metric-orange">
          <span>จำนวนกอง</span>
          <strong>${pileSummaries.length.toLocaleString("th-TH")}</strong>
          <small>${escapeHtml(rangeLabel)}</small>
        </div>
      </div>

      <section class="summary-grid">
        <section class="panel chart-panel">
          <div class="section-title-row">
            <h3>กราฟเปรียบเทียบน้ำหนัก</h3>
            <div class="chart-legend">
              ${showTotalWeight ? `<span><i class="legend-water"></i>น้ำหนักรวม</span>` : ""}
              ${showStandardWeights && !showTotalWeight ? `<span><i class="legend-water"></i>${escapeHtml(fruitLabels.waterShort || "น้ำ")}</span><span><i class="legend-flower"></i>${escapeHtml(fruitLabels.flowerShort || "ดอก")}</span>` : ""}
              ${showGrades && !showTotalWeight ? `<span><i class="legend-durian"></i>น้ำหนักทุเรียน</span>` : ""}
            </div>
          </div>
          <div class="summary-chart">
            ${pileSummaries.length ? renderDashboardBars(pileSummaries, summaryFruitFilter) : `<div class="empty-state">ยังไม่มีข้อมูลสำหรับช่วงวันที่เลือก</div>`}
          </div>
        </section>

        <section class="table-card">
          <div class="table-heading">สรุปตามกอง</div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>กอง</th>
                  ${showStandardWeights ? `<th>${escapeHtml(fruitLabels.water || "น้ำหนักน้ำ")}</th><th>${escapeHtml(fruitLabels.flower || "น้ำหนักดอก")}</th>` : ""}
                  ${showGrades ? `<th>น้ำหนักทุเรียน</th>` : ""}
                  <th>รวม</th>
                  <th>รวมเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${
                  pileSummaries.length
                    ? pileSummaries.map((item) => renderPileSummaryRow(item, summaryFruitFilter)).join("")
                    : `<tr><td colspan="${pileColumnCount}" class="empty-cell">ยังไม่มีข้อมูลสำหรับช่วงวันที่เลือก</td></tr>`
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
                ${showFruitColumn ? "<th>ผลไม้</th>" : ""}
                <th>กอง</th>
                ${showStandardWeights ? `<th>${escapeHtml(fruitLabels.water || "น้ำหนักน้ำ")}</th><th>${escapeHtml(fruitLabels.flower || "น้ำหนักดอก")}</th>` : ""}
                ${showGrades ? `<th>น้ำหนักทุเรียน</th>` : ""}
                <th>น้ำหนักรวม</th>
                <th>รวมเงิน</th>
                <th>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>
              ${
                records.length
                  ? records.map((record) => renderDashboardDetailRow(record, summaryFruitFilter)).join("")
                  : `<tr><td colspan="${detailColumnCount}" class="empty-cell">ยังไม่มีข้อมูลสำหรับช่วงวันที่เลือก</td></tr>`
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

  const records = filterProductionRecordsByFruit(
    getDashboardRecordsForRange(exportRange.startDate, exportRange.endDate),
    summaryFruitFilter
  );
  if (!records.length) {
    setSummaryExportMessage("ไม่มีข้อมูลผลผลิต/น้ำหนักในช่วงวันที่เลือก จึงยัง Export ไม่ได้", "error");
    summaryMainExportMenuOpen = true;
    render();
    return;
  }

  const totals = getProductionTotals(records);
  const pileSummaries = getPileSummaries(records);
  const fruitLabels = summaryFruitFilter === "all"
    ? { water: "น้ำหนักช่อง 1", flower: "น้ำหนักช่อง 2" }
    : getProductionFieldLabels(summaryFruitFilter);
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
    const allowedOverviewFields = new Set(
      getSummaryExportFieldsForFruit("overview").map((field) => field.key)
    );
    const overviewRows = [
      ["totalWeight", "น้ำหนักรวมทั้งหมด (กก.)", totals.total],
      ["water", `${fruitLabels.water || "น้ำหนักน้ำ"} (กก.)`, totals.water],
      ["flower", `${fruitLabels.flower || "น้ำหนักดอก"} (กก.)`, totals.flower],
      ["grades", "น้ำหนักทุเรียน", numberText(getDurianGradeTotal(totals.grades))],
      ["amount", "ยอดเงินรวม", totals.amount],
      ["employees", "พนักงานที่มีรายการ", totals.people.size],
      ["records", "จำนวนรายการ", records.length]
    ].filter(([key]) => allowedOverviewFields.has(key) && summaryExportFields.overview[key]);
    lines.push(csvRow(["ภาพรวม"]));
    lines.push(csvRow(["หัวข้อ", "ค่า"]));
    overviewRows.forEach(([, label, value]) => lines.push(csvRow([label, value])));
    lines.push("");
  }

  if (selectedSections.includes("piles")) {
    const fields = getSummaryExportFieldsForFruit("piles").filter((field) => summaryExportFields.piles[field.key]);
    const getValue = {
      pile: (item) => item.pile,
      water: (item) => item.water,
      flower: (item) => item.flower,
      grades: (item) => numberText(getDurianGradeTotal(item.grades)),
      total: (item) => item.total,
      amount: (item) => item.amount
    };
    lines.push(csvRow(["สรุปตามกอง"]));
    lines.push(csvRow(fields.map((field) => field.label)));
    pileSummaries.forEach((item) => lines.push(csvRow(fields.map((field) => getValue[field.key](item)))));
    lines.push("");
  }

  if (selectedSections.includes("details")) {
    const fields = getSummaryExportFieldsForFruit("details").filter((field) => summaryExportFields.details[field.key]);
    const getValue = {
      date: (record) => getRecordDate(record),
      time: (record) => record.record_time || "",
      empCode: (record) => record.emp_code || "",
      employeeName: (record) => {
        const employee = getEmployees().find((item) => item.id === record.employee_id);
        return record.employee_name || employee?.fullname || "";
      },
      pile: (record) => normalizeProductionPileNumber(record.pile_no ?? record.pile) ?? "-",
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
    `summary-${summaryFruitFilter}-${exportRange.startDate}-to-${exportRange.endDate}.csv`,
    `\ufeff${lines.join("\r\n")}`
  );
  setSummaryExportMessage(`Export CSV ข้อมูลช่วงวันที่ ${rangeLabel} เรียบร้อยแล้ว`);
  summaryMainExportMenuOpen = false;
  render();
}

async function exportProductionSummaryReport(user, format) {
  const exportRange = getSummaryExportRange();
  const records = filterProductionRecordsByFruit(
    getDashboardRecordsForRange(exportRange.startDate, exportRange.endDate),
    summaryFruitFilter
  );
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
  document.querySelector("#summaryFruitFilter")?.addEventListener("change", (event) => {
    summaryFruitFilter = event.target.value || "mangosteen";
    summaryMainExportMenuOpen = false;
    summaryExportMessage = "";
    render();
  });

  document.querySelector("#summaryExportStart")?.addEventListener("change", (event) => {
    summaryExportStartDate = event.target.value || getSelectedSummaryDate();
    summaryExportEndDate = addDaysToDateSafe(summaryExportStartDate, 6) || summaryExportStartDate;
    summaryDate = summaryExportStartDate;
    summaryExportMessage = "";
    render();
  });

  document.querySelector("#summaryExportEnd")?.addEventListener("change", (event) => {
    summaryExportEndDate = event.target.value || summaryExportStartDate || getSelectedSummaryDate();
    summaryDate = summaryExportStartDate || summaryExportEndDate;
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

function normalizeGroupReportRange() {
  return normalizeDateRange(groupReportStartDate, groupReportEndDate);
}

function getProductionFruitLabel(fruitId) {
  if (!fruitId || fruitId === "all") return "ทั้งหมด";
  return productionFruitOptions.find((item) => item.id === fruitId)?.label || fruitId;
}

function getGroupReportPayGroups() {
  const employeeGroups = getEmployees()
    .filter((employee) => employee.status === "Active")
    .map((employee) => getEmployeePayGroup(employee))
    .filter(Boolean);
  const customGroups = [...new Set(employeeGroups)]
    .filter((group) => !primaryPayGroups.includes(group))
    .sort((a, b) => a.localeCompare(b, "th"));
  return [...primaryPayGroups, ...customGroups];
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
      if (!payGroup) return null;
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
  const adjustedEmployees = new Set();
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
    if (employeeKey && !adjustedEmployees.has(employeeKey)) {
      adjustedEmployees.add(employeeKey);
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
      const employee = record.employee_id
        ? employeeMap.get(String(record.employee_id))
        : employeeCodeMap.get(String(record.emp_code || ""));
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
    if (record.employee_type !== "office_347" && !summary.deductedEmployees.has(employeeKey)) {
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
    if (record.employee_type === "office_347") {
      row.amount = 0;
      row.bonus_amount = 0;
      row.deduction_amount = 0;
      row.net_amount = 0;
    }
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
  const showStandardWeights = groupReportFruit !== "durian";
  const showDurianWeight = groupReportFruit === "all" || groupReportFruit === "durian";
  return `
    <tr>
      <td><strong>${escapeHtml(row.pay_group)}</strong></td>
      ${showFruit ? `<td>${escapeHtml(row.fruit_label)}</td>` : ""}
      <td>${row.employees.size.toLocaleString("th-TH")}</td>
      <td>${row.records.toLocaleString("th-TH")}</td>
      ${showStandardWeights ? `<td>${compactNumberText(row.water)}</td><td>${compactNumberText(row.flower)}</td>` : ""}
      ${showDurianWeight ? `<td>${getDurianGradeTotal(row.grades) > 0 ? compactNumberText(getDurianGradeTotal(row.grades)) : "-"}</td>` : ""}
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
  const showStandardWeights = groupReportFruit !== "durian";
  const showDurianWeight = groupReportFruit === "all" || groupReportFruit === "durian";
  return `
    <tr>
      <td>${escapeHtml(row.pay_group)}</td>
      <td><strong>${escapeHtml(row.emp_code)}</strong></td>
      <td>${escapeHtml(row.fullname)}</td>
      <td>${row.records.toLocaleString("th-TH")}</td>
      ${showStandardWeights ? `<td>${numberText(row.water)}</td><td>${numberText(row.flower)}</td>` : ""}
      ${showDurianWeight ? `<td>${getDurianGradeTotal(row.grades) > 0 ? numberText(getDurianGradeTotal(row.grades)) : "-"}</td>` : ""}
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
  const showStandardWeights = groupReportFruit !== "durian";
  const showDurianWeight = groupReportFruit === "all" || groupReportFruit === "durian";
  return `
    <tr>
      <td>${escapeHtml(record.record_date || "-")}</td>
      <td>${escapeHtml(record.pay_group)}</td>
      <td>${escapeHtml(record.fruit_label)}</td>
      <td>${escapeHtml(record.emp_code || "-")}</td>
      <td>${escapeHtml(record.employee_name || record.employee?.fullname || "-")}</td>
      <td>${escapeHtml(record.pile_no || record.pile || "-")}</td>
      ${showStandardWeights ? `<td>${isDurianFruit(record.fruit_type) ? "-" : numberText(record.water_weight || record.water || 0)}</td><td>${isDurianFruit(record.fruit_type) ? "-" : numberText(record.flower_weight || record.flower || 0)}</td>` : ""}
      ${showDurianWeight ? `<td>${isDurianFruit(record.fruit_type) ? numberText(getRecordDurianWeight(record)) : "-"}</td>` : ""}
      <td><strong>${money(record.total_amount || record.grand_total || 0)}</strong></td>
    </tr>
  `;
}

function renderTimeGroupReportSummaryRow(row) {
  if (row.pay_group === "กลุ่ม Office") return `<tr><td>${escapeHtml(row.pay_group)}</td><td>${row.employees.size}</td><td>${row.records}</td><td>${escapeHtml(formatMinutesToHourText(row.net_minutes))}</td><td>${numberText(row.normal_hours)}</td><td>${numberText(row.ot_hours)}</td><td colspan="4">—</td></tr>`;
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
  if (row.pay_group === "กลุ่ม Office") return `<tr><td>${escapeHtml(row.pay_group)}</td><td>${escapeHtml(row.emp_code)}</td><td>${escapeHtml(row.fullname)}</td><td>${row.records}</td><td>${escapeHtml(formatMinutesToHourText(row.net_minutes))}</td><td>${numberText(row.normal_hours)}</td><td>${numberText(row.ot_hours)}</td><td colspan="4">—</td></tr>`;
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
  if (record.employee_type === "office_347") return `<tr><td>${escapeHtml(record.record_date)}</td><td>กลุ่ม Office</td><td>${escapeHtml(record.emp_code)}</td><td>${escapeHtml(record.fullname)}</td><td>${escapeHtml(record.clock_in)}</td><td>${escapeHtml(record.clock_out)}</td><td>ปกติ ${numberText(record.normal_hours)} ชม. · OT ${numberText(record.ot_hours)} ชม.</td><td colspan="2">—</td></tr>`;
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
  const showStandardWeights = groupReportFruit !== "durian";
  const showDurianWeight = groupReportFruit === "all" || groupReportFruit === "durian";
  const groupWeightLabels = groupReportFruit === "all"
    ? { water: "น้ำหนักช่อง 1", flower: "น้ำหนักช่อง 2" }
    : getProductionFieldLabels(groupReportFruit);
  const summaryColumnCount = 9 + (showStandardWeights ? 2 : 0) + (showDurianWeight ? 1 : 0);
  const fruitColumnCount = summaryColumnCount + 1;
  const employeeColumnCount = 10 + (showStandardWeights ? 2 : 0) + (showDurianWeight ? 1 : 0);
  const detailColumnCount = 7 + (showStandardWeights ? 2 : 0) + (showDurianWeight ? 1 : 0);

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
          <button class="btn btn-outline" id="refreshGroupReport" type="button">รีเฟรชข้อมูลจากฐานกลาง</button>
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
        ${isTimeReport ? "" : `<button class="btn btn-outline summary-export-button" id="exportGroupRawExcel" type="button">Export ข้อมูลดิบ</button>`}
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
              <thead><tr><th>กลุ่ม</th><th>คน</th><th>รายการ</th>${showStandardWeights ? `<th>${escapeHtml(groupWeightLabels.waterShort || groupWeightLabels.water || "ช่อง 1")}</th><th>${escapeHtml(groupWeightLabels.flowerShort || groupWeightLabels.flower || "ช่อง 2")}</th>` : ""}${showDurianWeight ? "<th>น้ำหนักทุเรียน</th>" : ""}<th>รวม</th><th>เงิน</th><th>เบี้ยขยัน</th><th>หักทั่วไป</th><th>หัก 3%</th><th>สุทธิ</th></tr></thead>
              <tbody>${groupRows.length ? groupRows.map((row) => renderGroupReportSummaryRow(row)).join("") : `<tr><td colspan="${summaryColumnCount}" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="table-card">
        <div class="table-heading">สรุปตามกลุ่มและผลไม้</div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>กลุ่ม</th><th>ผลไม้</th><th>จำนวนคน</th><th>รายการ</th>${showStandardWeights ? `<th>${escapeHtml(groupWeightLabels.water || "น้ำหนักช่อง 1")}</th><th>${escapeHtml(groupWeightLabels.flower || "น้ำหนักช่อง 2")}</th>` : ""}${showDurianWeight ? "<th>น้ำหนักทุเรียน</th>" : ""}<th>รวม</th><th>รวมเงิน</th><th>เบี้ยขยัน</th><th>หักทั่วไป</th><th>หัก 3%</th><th>สุทธิ</th></tr></thead>
            <tbody>${fruitRows.length ? fruitRows.map((row) => renderGroupReportSummaryRow(row, true)).join("") : `<tr><td colspan="${fruitColumnCount}" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
          </table>
        </div>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดพนักงานในกลุ่ม</div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>กลุ่ม</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>รายการ</th>${showStandardWeights ? `<th>${escapeHtml(groupWeightLabels.water || "น้ำหนักช่อง 1")}</th><th>${escapeHtml(groupWeightLabels.flower || "น้ำหนักช่อง 2")}</th>` : ""}${showDurianWeight ? "<th>น้ำหนักทุเรียน</th>" : ""}<th>รวม</th><th>รวมเงิน</th><th>เบี้ยขยัน</th><th>หักทั่วไป</th><th>หัก 3%</th><th>สุทธิ</th></tr></thead>
            <tbody>${employeeRows.length ? employeeRows.map(renderGroupReportEmployeeRow).join("") : `<tr><td colspan="${employeeColumnCount}" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
          </table>
        </div>
      </section>

      <section class="table-card">
        <div class="table-heading">รายละเอียดรายการ</div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>วันที่</th><th>กลุ่ม</th><th>ผลไม้</th><th>รหัส</th><th>ชื่อพนักงาน</th><th>กอง</th>${showStandardWeights ? `<th>${escapeHtml(groupWeightLabels.water || "น้ำหนักช่อง 1")}</th><th>${escapeHtml(groupWeightLabels.flower || "น้ำหนักช่อง 2")}</th>` : ""}${showDurianWeight ? "<th>น้ำหนักทุเรียน</th>" : ""}<th>รวมเงิน</th></tr></thead>
            <tbody>${records.length ? records.map(renderGroupReportDetailRow).join("") : `<tr><td colspan="${detailColumnCount}" class="empty-cell">ยังไม่มีข้อมูล</td></tr>`}</tbody>
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
    ...getProductionReportCatalog(),
    view_mode: groupReportView,
    export_options: { ...groupReportExportOptions },
    withholding_tax_groups: getProductionWithholdingTaxGroups(),
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

async function exportGroupRawExcel(user) {
  const records = getGroupReportRecords();
  if (!records.length) {
    groupReportMessage = "ไม่มีข้อมูลตามตัวกรองที่เลือก จึงยัง Export ข้อมูลดิบไม่ได้";
    groupReportMessageType = "error";
    render();
    return;
  }
  groupReportMessage = "กำลังสร้างไฟล์ Excel ข้อมูลดิบจากการกรอกแบบชุด...";
  groupReportMessageType = "success";
  render();
  try {
    await downloadReport(`${REPORT_API_BASE}/reports/group-report-raw-excel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getGroupReportPayload(user, "excel"))
    });
    groupReportMessage = "Export ข้อมูลดิบจากการกรอกแบบชุดเรียบร้อยแล้ว";
    groupReportMessageType = "success";
  } catch (error) {
    groupReportMessage = error instanceof Error ? error.message : "Export ข้อมูลดิบไม่สำเร็จ";
    groupReportMessageType = "error";
  }
  render();
}

function bindSummaryGroupReportEvents(user) {
  document.querySelector("#refreshGroupReport")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try {
      await refreshSavedRecordView(groupReportMode);
      groupReportMessage = "รีเฟรชข้อมูลจากฐานกลางแล้ว";
      groupReportMessageType = "success";
    } catch (error) {
      groupReportMessage = error.message || "รีเฟรชไม่สำเร็จ";
      groupReportMessageType = "error";
    }
    render();
  });
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
    groupReportStartDate = form.get("start_date") || localDateInputValue();
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
  document.querySelector("#exportGroupRawExcel")?.addEventListener("click", () => exportGroupRawExcel(user));
}

let inboundData = { fruits: [], prices: [], receipts: [] };
let inboundLoaded = false;
let inboundLoading = false;
let inboundMessage = "";
let inboundMessageType = "success";
let inboundConfirmPayload = null;
let inboundView = "overview";
let inboundEntryDraft = null;
let inboundInventory = { ready: false, balances: [], issues: [], error: "" };
let inboundIssueDraft = null;
let inboundIssuePending = null;
let inboundIssueBusy = false;
let inboundFilters = { from: "", to: "", supplier: "", fruit: "", search: "" };
let inboundSelectedReceiptIds = new Set();

function inboundMoney(value) {
  return Number(value || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function inboundLocalDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function inboundActiveFruits() {
  return inboundData.fruits.filter((fruit) => fruit.status === "Active");
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

async function loadInboundData(force = false) {
  if (inboundLoading || (inboundLoaded && !force)) return;
  inboundLoading = true;
  inboundInventory.ready = false;
  try {
    const result = await cloudApiRequest("/api/inbound/bootstrap", { timeoutMs: 20000 });
    inboundData = result.data || { fruits: [], prices: [], receipts: [] };
    const availableIds = new Set(inboundData.receipts.map((row) => Number(row.id)));
    inboundSelectedReceiptIds = new Set([...inboundSelectedReceiptIds].filter((id) => availableIds.has(id)));
    inboundLoaded = true;
    inboundMessage = "";
    try {
      const snapshot = (await cloudApiRequest("/api/inbound/inventory", { timeoutMs: 20000 })).data;
      if (!snapshot || !Array.isArray(snapshot.balances) || !Array.isArray(snapshot.issues)) throw new Error("ข้อมูลยอดคงเหลือไม่ครบ กรุณาโหลดใหม่");
      if (snapshot.issue_schema_version !== 2) throw new Error("กรุณารัน supabase_fruit_stock_issues_migration.sql ฉบับแก้ไขล่าสุด แล้วโหลดข้อมูลใหม่");
      inboundInventory = { ...snapshot, ready: true, error: "" };
    } catch (error) {
      inboundInventory = { ready: false, balances: [], issues: [], error: error.message || "โหลดสต็อกคงเหลือไม่สำเร็จ" };
    }
  } catch (error) {
    inboundMessage = error.message || "โหลดข้อมูลรับเข้าไม่สำเร็จ";
    inboundMessageType = "error";
  } finally {
    inboundLoading = false;
    const route = location.hash.replace("#/", "");
    if (["inbound", "inbound-fruits", "inbound-history"].includes(route)) render();
  }
}

function renderInboundHeader(title, subtitle, user, active = "entry") {
  const canManage = canOpen(user, "inbound-fruits");
  const selected = active === "entry" ? inboundView : active;
  return `${renderStockNavigation("general")}<header class="sl-header"><div class="sl-heading"><span class="sl-icon" aria-hidden="true">◉</span><div><p class="sl-eyebrow">PF STOCK / FRUIT</p><h2>Stock ผลไม้</h2><p>${escapeHtml(subtitle)}</p></div></div><div class="sl-header-actions"><span class="sl-access">รับเข้า · เบิกของ · ราคาซื้อจริง</span><button class="sl-button" data-inbound-refresh type="button" ${inboundLoading ? "disabled" : ""}>${inboundLoading ? "กำลังโหลด…" : "↻ โหลดข้อมูลใหม่"}</button></div></header>
    ${inboundLoaded ? renderInboundMetrics() : ""}
    <div class="sl-toolbar"><nav class="sl-tabs" aria-label="หน้าข้อมูล Stock ผลไม้">
      ${[["overview", "ภาพรวม"], ["entry", "รับเข้า"], ["issue", "เบิกของ"]].map(([view, label]) => `<button class="${selected === view ? "is-active" : ""}" data-inbound-view="${view}" type="button" ${selected === view ? 'aria-current="page"' : ""}>${label}</button>`).join("")}
      <button class="${selected === "history" ? "is-active" : ""}" data-route="inbound-history" type="button" ${selected === "history" ? 'aria-current="page"' : ""}>ประวัติทั้งหมด</button>
      <button class="${selected === "manage" ? "is-active" : ""}" data-route="inbound-fruits" type="button" ${selected === "manage" ? 'aria-current="page"' : ""} ${canManage ? "" : "disabled"}>ผลไม้ / ราคาแนะนำ</button>
    </nav>${canWriteStock(user) && canManage ? '<button class="sl-button is-primary" data-inbound-add-fruit type="button">+ เพิ่มรายการผลไม้</button>' : ""}</div>`;
}

function renderInboundMetrics() {
  const receipts = inboundData.receipts;
  const received = receipts.reduce((sum,row)=>sum+Number(row.weight_kg||0),0);
  const issued = inboundInventory.ready ? inboundInventory.balances.reduce((sum,row)=>sum+Number(row.issued_weight||0),0) : null;
  return `<div class="sl-metrics"><article><span>รายการผลไม้</span><strong>${inboundData.fruits.length} <small>ชนิด</small></strong></article><article><span>รับเข้าสะสม</span><strong>${inboundMoney(received)} <small>กก.</small></strong></article><article><span>เบิกสะสม</span><strong>${issued===null?'—':inboundMoney(issued)} <small>กก.</small></strong></article><article><span>คงเหลือ</span><strong>${inboundInventory.ready?inboundMoney(inboundInventory.balances.reduce((sum,row)=>sum+Number(row.balance_weight||0),0)):'—'} <small>กก.</small></strong></article></div>`;
}

function renderInboundOverview(user) {
  const rows = inboundInventory.ready ? inboundInventory.balances : inboundData.fruits.map(fruit=>({fruit_id:fruit.id,fruit_name:fruit.name,received_weight:inboundData.receipts.filter(r=>String(r.fruit_id)===String(fruit.id)).reduce((sum,r)=>sum+Number(r.weight_kg||0),0)}));
  return `${renderInboundHeader("Stock ผลไม้", "รับเข้า · เบิกของ · จำนวนคงเหลือ", user)}${renderInboundStatus()}${inboundInventory.ready?renderInboundBalances():`<section class="sl-panel"><h3>สรุปรับเข้าตามผลไม้</h3><p>${escapeHtml(inboundInventory.error||"ยังไม่มียอดคงเหลือที่ยืนยันได้")}</p><div class="sl-table-scroll"><table class="sl-table"><thead><tr><th>ผลไม้</th><th>รับเข้า (กก.)</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.fruit_name)}</td><td>${inboundMoney(r.received_weight)}</td></tr>`).join("")}</tbody></table></div></section>`}${renderInboundIssueHistory()}`;
}

function renderInboundStatus() {
  if (!inboundMessage) return "";
  return `<div class="inbound-alert ${inboundMessageType === "error" ? "is-error" : "is-success"}" role="alert">${escapeHtml(inboundMessage)}</div>`;
}

function renderInboundBalances() {
  return `<section class="sl-panel"><div class="sl-panel-head"><div><h3>ยอดคงเหลือผลไม้</h3><p>รวมรับเข้าและหักเบิกแล้ว · ตรวจสอบจำนวนตามล็อตที่เหลือ</p></div></div><div class="sl-table-scroll" tabindex="0"><table class="sl-table"><thead><tr><th>ผลไม้</th><th>รับเข้า (กก.)</th><th>เบิก (กก.)</th><th>คงเหลือ (กก.)</th></tr></thead><tbody>${inboundInventory.balances.map(row => `<tr><td>${escapeHtml(row.fruit_name)}</td><td>${inboundMoney(row.received_weight)}</td><td>${inboundMoney(row.issued_weight)}</td><td><strong class="sl-balance">${inboundMoney(row.balance_weight)}</strong></td></tr>`).join("") || '<tr><td colspan="4">ยังไม่มีรายการผลไม้</td></tr>'}</tbody></table></div></section>`;
}

function renderInboundIssueHistory() {
  if (!inboundInventory.ready) return "";
  return `<section class="sl-panel"><div class="sl-panel-head"><div><h3>ประวัติเบิกผลไม้</h3><p>รายการเบิกทั้งหมด · เก็บผู้รับ ผู้บันทึก และจำนวนที่เบิก</p></div></div><div class="sl-table-scroll" tabindex="0"><table class="sl-table"><thead><tr><th>เลขรายการ / วันที่</th><th>ผลไม้</th><th>ผู้รับ / แผนก</th><th>น้ำหนัก (กก.)</th><th>ผู้บันทึก</th><th>หมายเหตุ</th></tr></thead><tbody>${inboundInventory.issues.map(row => `<tr><td>#${escapeHtml(String(row.id))}<br>${escapeHtml(new Date(row.issued_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }))}</td><td>${escapeHtml(row.fruit_name)}</td><td>${escapeHtml(row.recipient)}</td><td>${inboundMoney(row.weight_kg)}</td><td>${escapeHtml(row.created_by || "—")}</td><td>${escapeHtml(row.note || "—")}</td></tr>`).join("") || '<tr><td colspan="6">ยังไม่มีรายการเบิก</td></tr>'}</tbody></table></div></section>`;
}

let inboundIssueOwner = "";
function inboundIssueStorageKey(user) {
  return `pismai-fruit-issue-pending:${user.id || user.username}`;
}

function renderInboundIssue(user) {
  const key = inboundIssueStorageKey(user);
  if (inboundIssueOwner !== key) {
    inboundIssueOwner = key;
    inboundIssueDraft = null;
    inboundIssuePending = null;
  }
  try { inboundIssuePending = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (_) { /* Keep an in-memory retry when storage is unavailable. */ }
  const draft = inboundIssuePending || inboundIssueDraft || {};
  const locked = inboundIssueBusy || !!inboundIssuePending;
  const disabled = !canWriteStock(user) || !inboundInventory.ready || inboundLoading || inboundIssueBusy;
  const fruits = inboundInventory.balances.filter(row => Number(row.balance_weight) > 0 || String(row.fruit_id) === String(draft.fruit_id));
  return `${renderInboundHeader("Stock ผลไม้", "เบิกผลไม้ให้ผู้รับหรือแผนก โดยตัดล็อตรับเข้าเก่าก่อน", user)}${renderInboundStatus()}
    ${!inboundInventory.ready ? `<div class="inbound-alert is-error" role="alert">${escapeHtml(inboundInventory.error || "กำลังโหลดสต็อกคงเหลือ")}</div>` : ""}
    ${inboundIssuePending ? '<div class="inbound-alert" role="status">มีรายการที่รอตรวจสอบผลบันทึก กดลองบันทึกเดิมอีกครั้ง ระบบใช้รหัสเดิมเพื่อไม่ตัดยอดซ้ำ</div>' : ""}
    ${canWriteStock(user) ? `<section class="panel inbound-entry-card"><h3>เบิกผลไม้</h3><form id="inboundIssueForm" class="inbound-entry-form">
      <label class="field"><span>วันที่เบิก</span><input name="issued_at" type="datetime-local" value="${escapeHtml(draft.issued_at ? inboundIssueLocalTime(draft.issued_at) : inboundLocalDateTime())}" required ${locked ? "disabled" : ""}></label>
      <label class="field"><span>ผู้รับ / แผนก</span><input name="recipient" maxlength="160" value="${escapeHtml(draft.recipient || "")}" required ${locked ? "disabled" : ""}></label>
      <label class="field"><span>ผลไม้</span><select name="fruit_id" required ${locked ? "disabled" : ""}><option value="">เลือกผลไม้</option>${fruits.map(row => `<option value="${escapeHtml(String(row.fruit_id))}" ${String(row.fruit_id) === String(draft.fruit_id) ? "selected" : ""}>${escapeHtml(row.fruit_name)} · เหลือ ${inboundMoney(row.balance_weight)} กก.</option>`).join("")}</select></label>
      <label class="field"><span>น้ำหนักเบิก (กก.)</span><input name="weight_kg" type="number" min="0.01" max="100000000" step="0.01" value="${escapeHtml(String(draft.weight_kg || ""))}" required ${locked ? "disabled" : ""}></label>
      <label class="field inbound-note"><span>หมายเหตุ / วัตถุประสงค์</span><textarea name="note" maxlength="1000" rows="3" ${locked ? "disabled" : ""}>${escapeHtml(draft.note || "")}</textarea></label>
      <p class="inbound-note">ตรวจยอดตามวันที่เบิกอีกครั้งก่อนบันทึก · ต้นทุนคำนวณจากล็อตรับเข้า ไม่เพิ่มค่าใช้จ่ายซ้ำใน บัญชีและค่าแรง</p>
      <div class="inbound-entry-actions"><button class="btn btn-primary" type="submit" ${disabled ? "disabled" : ""}>${inboundIssueBusy ? "กำลังบันทึก…" : inboundIssuePending ? "ลองบันทึกเดิมอีกครั้ง" : "บันทึกเบิกผลไม้"}</button></div>
    </form></section>` : '<p class="stock-hub-note">การเบิกผลไม้ใช้สิทธิ์ C4 ขึ้นไป</p>'}${renderInboundIssueHistory()}`;
}

function inboundIssueLocalTime(value) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function bindInboundIssueEvents(user) {
  const form = document.querySelector("#inboundIssueForm");
  if (!form || !canWriteStock(user)) return;
  form.addEventListener("input", () => { if (!inboundIssuePending) inboundIssueDraft = Object.fromEntries(new FormData(form)); });
  form.addEventListener("change", () => { if (!inboundIssuePending) inboundIssueDraft = Object.fromEntries(new FormData(form)); });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (inboundIssueBusy || inboundLoading || !inboundInventory.ready) return;
    const key = inboundIssueStorageKey(user);
    if (!inboundIssuePending) {
      const draft = Object.fromEntries(new FormData(form));
      const weight = Number(draft.weight_kg);
      const balance = inboundInventory.balances.find(row => String(row.fruit_id) === String(draft.fruit_id));
      inboundIssueDraft = draft;
      if (!balance || !Number.isFinite(weight) || weight <= 0 || weight > Number(balance.balance_weight)) {
        inboundMessage = "น้ำหนักเบิกต้องมากกว่า 0 และไม่เกินยอดคงเหลือ"; inboundMessageType = "error"; render(); return;
      }
      inboundIssuePending = { ...draft, fruit_id: Number(draft.fruit_id), weight_kg: weight, issued_at: new Date(draft.issued_at).toISOString(), client_uid: `fruit-issue-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16)).join("")}`}` };
      try { sessionStorage.setItem(key, JSON.stringify(inboundIssuePending)); } catch (_) { /* In-memory retries retain the same ID. */ }
    }
    const pending = { ...inboundIssuePending };
    inboundIssueBusy = true;
    render();
    try {
      await cloudApiRequest("/api/inbound/issues", { method: "POST", body: JSON.stringify(pending), timeoutMs: 20000 });
      try { sessionStorage.removeItem(key); } catch (_) { /* Storage may be unavailable. */ }
      inboundIssuePending = null;
      inboundIssueDraft = null;
      await loadInboundData(true);
      inboundMessage = "บันทึกเบิกผลไม้สำเร็จ";
      inboundMessageType = "success";
    } catch (error) {
      if ([400, 404, 409].includes(error.status)) {
        inboundIssueDraft = { ...pending, issued_at: inboundIssueLocalTime(pending.issued_at) };
        inboundIssuePending = null;
        try { sessionStorage.removeItem(key); } catch (_) { /* Storage may be unavailable. */ }
      }
      inboundMessage = error.message || "ยังตรวจสอบผลบันทึกไม่ได้ กรุณาลองรายการเดิมอีกครั้ง";
      inboundMessageType = "error";
    } finally {
      inboundIssueBusy = false;
      if (["inbound", "inbound-history", "inbound-fruits"].includes(location.hash.replace("#/", ""))) render();
    }
  });
}

function renderInboundEntry(user) {
  if (!inboundLoaded) {
    loadInboundData();
    return `${renderInboundHeader("Stock ผลไม้", "บันทึกผลไม้ น้ำหนัก ราคาจริง และต้นทุนของแต่ละรายการ", user)}<section class="panel inbound-loading">กำลังโหลดข้อมูลรับเข้า...</section>`;
  }
  if (inboundView === "overview") return renderInboundOverview(user);
  if (inboundView === "issue") return renderInboundIssue(user);
  if (!canWriteStock(user)) {
    const weight = inboundData.receipts.reduce((sum, row) => sum + Number(row.weight_kg || 0), 0);
    const amount = inboundData.receipts.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
    return `${renderInboundHeader("Stock ผลไม้", "ดูข้อมูลรับเข้าผลไม้ ผู้ส่ง น้ำหนัก และราคาจริง", user)}${renderInboundStatus()}<div class="stock-hub-note">สิทธิ์ C3 ดูข้อมูลและส่งออกรายงานได้ การรับเข้าหรือเปลี่ยนราคาใช้สิทธิ์ C4 ขึ้นไป</div><section class="inbound-metrics"><div><span>น้ำหนักรับเข้าสะสม</span><strong>${inboundMoney(weight)}</strong><small>กก. · ไม่ใช่ยอดคงเหลือหลังเบิกผลิต</small></div><div><span>รายการรับเข้า</span><strong>${inboundData.receipts.length.toLocaleString("th-TH")}</strong><small>รายการ</small></div></section>`;
  }
  const fruits = inboundActiveFruits();
  const suppliers = [...new Set(inboundData.receipts.map((row) => row.supplier_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));
  return `${renderInboundHeader("Stock ผลไม้", "รับเข้าผลไม้จากผู้ส่ง พร้อมน้ำหนัก ราคาจริง และต้นทุนที่เชื่อม บัญชีและค่าแรง", user)}${renderInboundStatus()}
    <section class="panel inbound-entry-card">
      <form id="inboundEntryForm" class="inbound-entry-form">
        <label class="field"><span>วันที่รับเข้า</span><input name="received_at" type="datetime-local" value="${inboundLocalDateTime()}" required /></label>
        <label class="field"><span>ชื่อผู้ส่ง</span><input name="supplier_name" list="inboundSupplierList" maxlength="160" placeholder="พิมพ์ชื่อผู้ที่มาส่ง" autocomplete="off" required /><datalist id="inboundSupplierList">${suppliers.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("")}</datalist></label>
        <label class="field"><span>ผลไม้</span><select name="fruit_id" required><option value="">เลือกผลไม้</option>${fruits.map((fruit) => `<option value="${fruit.id}">${escapeHtml(fruit.name)}</option>`).join("")}</select></label>
        <div class="inbound-price-hint" id="inboundPriceHint">เลือกผู้ส่งและผลไม้เพื่อดูราคาล่าสุดหรือราคาแนะนำ</div>
        <label class="field"><span>น้ำหนัก (กก.)</span><input name="weight_kg" type="number" min="0.01" max="100000000" step="0.01" inputmode="decimal" placeholder="0.00" required /></label>
        <label class="field"><span>ราคาต่อกิโล <small>แก้ไขได้</small></span><div class="inbound-price-input"><input name="price_per_kg" type="number" min="0.01" max="1000000" step="0.01" inputmode="decimal" placeholder="0.00" required /><b>ราคาของรายการนี้</b></div></label>
        <p class="inbound-note">กรอกราคาตามเอกสารรับเข้า ข้อมูลการเงินจะแสดงใน บัญชีและค่าแรง</p>
        <label class="field inbound-note"><span>หมายเหตุ</span><textarea name="note" maxlength="1000" rows="3" placeholder="รายละเอียดที่ต้องการจดจำ (ไม่บังคับ)"></textarea></label>
        <div class="inbound-entry-actions"><button class="btn btn-outline" type="reset">ล้างข้อมูล</button><button class="btn btn-primary" type="submit" ${fruits.length ? "" : "disabled"}>ตรวจสอบก่อนบันทึก</button></div>
      </form>
      ${fruits.length ? "" : `<div class="inbound-empty-callout">ยังไม่มีผลไม้ที่เปิดใช้งาน ผู้มีสิทธิ์ C4 ขึ้นไปต้องเพิ่มผลไม้และตั้งราคาแนะนำก่อน</div>`}
    </section>
    ${inboundConfirmPayload ? renderInboundConfirmation() : ""}`;
}

function renderInboundConfirmation() {
  const row = inboundConfirmPayload;
  return `<div class="inbound-modal-backdrop" data-close-inbound-confirm><section class="inbound-confirm" role="dialog" aria-modal="true" aria-labelledby="inboundConfirmTitle" data-inbound-confirm-panel>
    <button class="inbound-modal-close" data-close-inbound-confirm type="button">×</button><h3 id="inboundConfirmTitle">ตรวจสอบรายการ</h3><p>กรุณาตรวจสอบก่อนบันทึกลงฐานข้อมูลกลาง</p>
    <dl><div><dt>ผู้ส่ง</dt><dd>${escapeHtml(row.supplier_name)}</dd></div><div><dt>ผลไม้</dt><dd>${escapeHtml(row.fruit_name)}</dd></div><div><dt>น้ำหนัก</dt><dd>${inboundMoney(row.weight_kg)} กก.</dd></div></dl>
    <div class="inbound-lock-note">ราคานี้จะถูกเก็บถาวรกับรายการ และไม่เปลี่ยนตามราคาแนะนำในอนาคต</div>
    <div class="inbound-confirm-actions"><button class="btn btn-outline" data-close-inbound-confirm type="button">กลับไปแก้ไข</button><button class="btn btn-primary" id="confirmInboundSave" type="button">ยืนยันบันทึกรับเข้า</button></div>
  </section></div>`;
}

function renderInboundFruitManagement(user) {
  if (!inboundLoaded) { loadInboundData(); return `${renderInboundHeader("จัดการผลไม้ / ราคาแนะนำ", "ราคานี้เป็นค่าเริ่มต้นและผู้บันทึกแก้ราคาจริงได้", user, "manage")}<section class="panel inbound-loading">กำลังโหลดข้อมูล...</section>`; }
  if (!canWriteStock(user)) return `${renderInboundHeader("ผลไม้ / ราคาแนะนำ", "ดูราคาแนะนำปัจจุบัน การตั้งราคาใหม่ใช้สิทธิ์ C4 ขึ้นไป", user, "manage")}${renderInboundStatus()}<section class="panel"><div class="inbound-fruit-list">${inboundData.fruits.map(fruit => { const price = inboundRecommendedPrice(fruit.id); return `<article><strong>${escapeHtml(fruit.name)}</strong><small>${price ? `เริ่มใช้ ${escapeHtml(price.effective_date)}` : ""}</small></article>`; }).join("") || '<p class="empty-cell">ยังไม่มีผลไม้</p>'}</div></section>`;
  const fruits = inboundData.fruits;
  const today = localDateInputValue();
  return `${renderInboundHeader("จัดการผลไม้ / ราคาแนะนำ", "ราคาแนะนำช่วยกรอกเร็วขึ้น แต่ไม่บังคับราคาของรายการรับเข้า", user, "manage")}${renderInboundStatus()}
    <section class="inbound-management-grid">
      <div class="panel inbound-master-panel"><h3>เพิ่มผลไม้ใหม่</h3><form id="inboundFruitForm" class="inbound-inline-form"><label class="field"><span>ชื่อผลไม้</span><input name="name" maxlength="100" placeholder="เช่น มังคุด" required /></label><button class="btn btn-primary" type="submit">เพิ่มผลไม้</button></form>
        <div class="inbound-fruit-list"><h3>รายการผลไม้</h3>${fruits.map((fruit) => { const price = inboundRecommendedPrice(fruit.id, today); return `<article><div><strong>${escapeHtml(fruit.name)}</strong><span class="badge">${fruit.status === "Active" ? "ใช้งาน" : "เลิกใช้งาน"}</span></div><small>${price ? `เริ่มใช้ ${escapeHtml(price.effective_date)}` : "ตั้งราคาเพื่อช่วยกรอกอัตโนมัติ"}</small><button class="btn btn-outline" data-price-fruit="${fruit.id}" type="button">ตั้งราคาใหม่</button></article>`; }).join("") || `<p class="empty-cell">ยังไม่มีผลไม้</p>`}</div>
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

function inboundFilteredReceipts() {
  const search = inboundFilters.search.trim().toLocaleLowerCase("th-TH");
  return inboundData.receipts.filter((row) => {
    const day = String(row.received_at || "").slice(0, 10);
    return (!inboundFilters.from || day >= inboundFilters.from) && (!inboundFilters.to || day <= inboundFilters.to) &&
      (!inboundFilters.supplier || row.supplier_name === inboundFilters.supplier) && (!inboundFilters.fruit || String(row.fruit_id) === inboundFilters.fruit) &&
      (!search || `${row.supplier_name} ${row.fruit_name} ${row.note} ${row.created_by}`.toLocaleLowerCase("th-TH").includes(search));
  });
}

function renderInboundHistory(user) {
  if (!inboundLoaded) { loadInboundData(); return `${renderInboundHeader("รายการรับเข้า", "ตรวจสอบน้ำหนัก ราคาจริง และยอดเงินย้อนหลัง", user, "history")}<section class="panel inbound-loading">กำลังโหลดข้อมูล...</section>`; }
  const rows = inboundFilteredReceipts();
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.weight_kg || 0), 0);
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const suppliers = [...new Set(inboundData.receipts.map((row) => row.supplier_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));
  const selectedRows = inboundData.receipts.filter((row) => inboundSelectedReceiptIds.has(Number(row.id)));
  const allVisibleSelected = rows.length > 0 && rows.every((row) => inboundSelectedReceiptIds.has(Number(row.id)));
  return `${renderInboundHeader("รายการรับเข้า", "ตรวจสอบรายการรับเข้าผลไม้ ผู้ส่ง และจำนวนย้อนหลัง", user, "history")}${renderInboundStatus()}
    <section class="inbound-metrics"><div><span>น้ำหนักตามตัวกรอง</span><strong>${inboundMoney(totalWeight)}</strong><small>กก.</small></div><div><span>จำนวนรายการ</span><strong>${rows.length.toLocaleString("th-TH")}</strong><small>รายการ</small></div></section>
    <section class="panel inbound-history-panel"><form id="inboundFilterForm" class="inbound-filters"><label><span>จากวันที่</span><input name="from" type="date" value="${escapeHtml(inboundFilters.from)}" /></label><label><span>ถึงวันที่</span><input name="to" type="date" value="${escapeHtml(inboundFilters.to)}" /></label><label><span>ผู้ส่ง</span><select name="supplier"><option value="">ทั้งหมด</option>${suppliers.map((name) => `<option ${inboundFilters.supplier === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></label><label><span>ผลไม้</span><select name="fruit"><option value="">ทั้งหมด</option>${inboundData.fruits.map((fruit) => `<option value="${fruit.id}" ${inboundFilters.fruit === String(fruit.id) ? "selected" : ""}>${escapeHtml(fruit.name)}</option>`).join("")}</select></label><label class="is-search"><span>ค้นหา</span><input name="search" type="search" value="${escapeHtml(inboundFilters.search)}" placeholder="ชื่อผู้ส่ง หรือหมายเหตุ" /></label><button class="btn btn-primary" type="submit">ค้นหา</button><button class="btn btn-outline" id="clearInboundFilters" type="button">ล้างตัวกรอง</button></form>
      <div class="inbound-selection-bar"><div><strong>เลือกแล้ว <span id="inboundSelectedCount">${selectedRows.length.toLocaleString("th-TH")}</span> รายการ</strong><small>รายการที่ติ๊กจะถูกรวมอยู่ในฟอร์มเดียวกัน</small></div><div><button class="btn btn-outline" id="printSelectedInbound" type="button" ${selectedRows.length ? "" : "disabled"}>พิมพ์</button><button class="btn btn-outline" id="exportSelectedInboundExcel" type="button" ${selectedRows.length ? "" : "disabled"}>Excel</button><button class="btn btn-primary" id="exportSelectedInboundPdf" type="button" ${selectedRows.length ? "" : "disabled"}>PDF</button></div></div>
      <div class="inbound-info-strip">แสดงจำนวนรับเข้าและประวัติการทำงาน · รายละเอียดการเงินอยู่ใน บัญชีและค่าแรง</div>
      <div class="table-scroll"><table class="inbound-table"><thead><tr><th class="inbound-check-cell"><input id="selectAllInboundVisible" type="checkbox" ${allVisibleSelected ? "checked" : ""} aria-label="เลือกทุกรายการที่แสดง" /></th><th>วันเวลา</th><th>ผู้ส่ง</th><th>ผลไม้</th><th>น้ำหนัก</th><th>หมายเหตุ</th><th>ผู้บันทึก</th></tr></thead><tbody>${rows.map((row) => `<tr class="${inboundSelectedReceiptIds.has(Number(row.id)) ? "is-selected" : ""}"><td class="inbound-check-cell"><input class="inbound-row-check" type="checkbox" value="${Number(row.id)}" ${inboundSelectedReceiptIds.has(Number(row.id)) ? "checked" : ""} aria-label="เลือกรายการรับเข้า ${Number(row.id)}" /></td><td>${escapeHtml(new Date(row.received_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }))}</td><td><strong>${escapeHtml(row.supplier_name)}</strong></td><td>${escapeHtml(row.fruit_name)}</td><td class="number-cell">${inboundMoney(row.weight_kg)}</td><td>${escapeHtml(row.note || "-")}</td><td>${escapeHtml(row.created_by || "-")}</td></tr>`).join("") || `<tr><td colspan="7" class="empty-cell">ไม่พบรายการรับเข้า</td></tr>`}</tbody><tfoot><tr><th></th><th colspan="3">รวมทั้งหมด</th><th>${inboundMoney(totalWeight)} กก.</th><th colspan="2">${rows.length.toLocaleString("th-TH")} รายการ</th></tr></tfoot></table></div>
    </section>${renderInboundIssueHistory()}`;
}

function inboundSelectedRows() {
  return inboundData.receipts.filter((row) => inboundSelectedReceiptIds.has(Number(row.id)));
}

function printSelectedInboundReceipts() {
  const rows = inboundSelectedRows();
  if (!rows.length) return;
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.weight_kg || 0), 0);
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const popup = window.open("", "_blank");
  if (!popup) {
    inboundMessage = "เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up แล้วลองอีกครั้ง";
    inboundMessageType = "error";
    render();
    return;
  }
  popup.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>รายการรับเข้าที่เลือก</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:"Sarabun","Noto Sans Thai",sans-serif;color:#1f2937}h1{margin:0;color:#0f766e;font-size:22px}p{margin:4px 0 14px;color:#667085}table{width:100%;border-collapse:collapse;font-size:10px}th,td{padding:7px;border:1px solid #cfd6df;vertical-align:top}th{color:#fff;background:#0f766e}td.num{text-align:right}tfoot td{font-weight:700;background:#ecfdf3}.meta{display:flex;justify-content:space-between}.no-print{margin-bottom:12px}@media print{.no-print{display:none}}</style></head><body><button class="no-print" onclick="window.print()">พิมพ์เอกสาร</button><div class="meta"><div><h1>ฟอร์มรวมรายการรับเข้าที่เลือก</h1><p>โครงงานระบบชั่งน้ำหนักผลผลิตอัตโนมัติ • ${rows.length.toLocaleString("th-TH")} รายการ</p></div><p>พิมพ์เมื่อ ${escapeHtml(new Date().toLocaleString("th-TH"))}</p></div><table><thead><tr><th>#</th><th>วันเวลา</th><th>เลขที่</th><th>ผู้ส่ง</th><th>ผลไม้</th><th>น้ำหนัก</th><th>หมายเหตุ</th><th>ผู้บันทึก</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(new Date(row.received_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }))}</td><td>IN-${String(row.id).padStart(6, "0")}</td><td>${escapeHtml(row.supplier_name)}</td><td>${escapeHtml(row.fruit_name)}</td><td class="num">${inboundMoney(row.weight_kg)}</td><td>${escapeHtml(row.note || "-")}</td><td>${escapeHtml(row.created_by || "-")}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="5">รวม ${rows.length.toLocaleString("th-TH")} รายการ</td><td class="num">${inboundMoney(totalWeight)} กก.</td><td colspan="2"></td></tr></tfoot></table></body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
}

async function exportSelectedInbound(format) {
  const receiptIds = [...inboundSelectedReceiptIds];
  if (!receiptIds.length) return;
  const token = getSession()?.token || "";
  try {
    await downloadReport(`${REPORT_API_BASE}/reports/inbound-selected-${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "X-Session-Token": token } : {}) },
      body: JSON.stringify({ receipt_ids: receiptIds })
    });
    inboundMessage = `ดาวน์โหลด ${format === "excel" ? "Excel" : "PDF"} รวม ${receiptIds.length.toLocaleString("th-TH")} รายการแล้ว`;
    inboundMessageType = "success";
  } catch (error) {
    inboundMessage = error.message || "ส่งออกรายการรับเข้าไม่สำเร็จ";
    inboundMessageType = "error";
  }
  render();
}

function bindInboundEvents(user, route) {
  document.querySelector("[data-inbound-refresh]")?.addEventListener("click", () => loadInboundData(true));
  document.querySelectorAll("[data-inbound-view]").forEach(button => button.addEventListener("click", () => {
    inboundView = button.dataset.inboundView;
    if (location.hash === "#/inbound") render(); else location.hash = "#/inbound";
  }));
  document.querySelector("[data-inbound-add-fruit]")?.addEventListener("click", () => {
    if (route !== "inbound-fruits") location.hash = "#/inbound-fruits";
    else document.querySelector('#inboundFruitForm input[name="name"]')?.focus();
  });
  if (!inboundLoaded) return;
  if (!canWriteStock(user) && route !== "inbound-history") return;
  if (route === "inbound") {
    bindInboundIssueEvents(user);
    const form = document.querySelector("#inboundEntryForm");
    if (form && inboundEntryDraft) {
      Object.entries(inboundEntryDraft).forEach(([key, value]) => { if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value; });
      form.elements.price_per_kg.dataset.edited = "1";
    }
    const remember = () => { if (form) inboundEntryDraft = Object.fromEntries(new FormData(form)); };
    form?.addEventListener("input", remember);
    form?.addEventListener("change", () => queueMicrotask(remember));
    const calculate = () => {
      const weight = Number(form?.elements.weight_kg.value || 0), price = Number(form?.elements.price_per_kg.value || 0), total = Math.round(weight * price * 100) / 100;
      const totalNode = document.querySelector("#inboundCalculatedTotal"), formula = document.querySelector("#inboundFormula");
      if (totalNode) totalNode.textContent = inboundMoney(total); if (formula) formula.textContent = `${inboundMoney(weight)} กก. × ${inboundMoney(price)} บาท = ${inboundMoney(total)} บาท`;
    };
    calculate();
    const suggest = () => {
      if (!form) return;
      const hint = document.querySelector("#inboundPriceHint");
      if (hint) hint.textContent = "กรอกราคาจริงตามเอกสารของรายการนี้";
      calculate();
    };
    form?.elements.fruit_id.addEventListener("change", () => { form.elements.price_per_kg.dataset.edited = ""; suggest(); });
    form?.elements.supplier_name.addEventListener("change", suggest); form?.elements.received_at.addEventListener("change", suggest);
    form?.elements.weight_kg.addEventListener("input", calculate); form?.elements.price_per_kg.addEventListener("input", () => { form.elements.price_per_kg.dataset.edited = "1"; calculate(); });
    form?.addEventListener("reset", () => { inboundEntryDraft = null; window.setTimeout(() => { form.elements.received_at.value = inboundLocalDateTime(); form.elements.price_per_kg.dataset.edited = ""; calculate(); }, 0); });
    form?.addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(form), fruit = inboundData.fruits.find((item) => String(item.id) === String(data.get("fruit_id"))); const weight = Number(data.get("weight_kg")), price = Number(data.get("price_per_kg")); if (!fruit || !String(data.get("supplier_name")).trim() || weight <= 0 || price <= 0) return; inboundConfirmPayload = { received_at: new Date(String(data.get("received_at"))).toISOString(), supplier_name: String(data.get("supplier_name")).trim(), fruit_id: Number(fruit.id), fruit_name: fruit.name, weight_kg: weight, price_per_kg: price, total_amount: Math.round(weight * price * 100) / 100, note: String(data.get("note") || "") }; render(); });
    document.querySelectorAll("[data-close-inbound-confirm]").forEach((node) => node.addEventListener("click", (event) => { if (event.target.closest("[data-inbound-confirm-panel]") && !event.target.hasAttribute("data-close-inbound-confirm")) return; inboundConfirmPayload = null; render(); }));
    document.querySelector("#confirmInboundSave")?.addEventListener("click", async (event) => { const button = event.currentTarget; button.disabled = true; button.textContent = "กำลังบันทึก..."; try { const payload = { ...inboundConfirmPayload, client_uid: `inbound-${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}` }; delete payload.fruit_name; delete payload.total_amount; await cloudApiRequest("/api/inbound/receipts", { method: "POST", body: JSON.stringify(payload), timeoutMs: 20000 }); inboundConfirmPayload = null; inboundEntryDraft = null; inboundMessage = "บันทึกรายการรับเข้าสำเร็จ"; inboundMessageType = "success"; await loadInboundData(true); } catch (error) { inboundMessage = error.message; inboundMessageType = "error"; render(); } });
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

window.addEventListener("hashchange", render);
document.addEventListener("focusout", () => {
  window.setTimeout(() => {
    if (timeRenderPending && !isEditingFormField()) renderConfirmedTimeChange();
  }, 0);
});
window.addEventListener("focus", () => {
  refreshOnlineUsers();
  refreshSharedFruitPiles();
  refreshLiveStateFromCloud({ renderWhenIdle: true });
  window.SecretRoom?.refreshNotifications?.();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshOnlineUsers();
    refreshSharedFruitPiles();
    refreshLiveStateFromCloud({ renderWhenIdle: true });
    window.SecretRoom?.refreshNotifications?.();
  }
});
startLiveClock();
startTimeChangeWatch();
render();
