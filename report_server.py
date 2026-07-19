from __future__ import annotations

import json
import hashlib
import hmac
import base64
import math
import mimetypes
import os
import secrets
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

from openpyxl import Workbook
from openpyxl.drawing.image import Image as ExcelImage
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

HOST = os.environ.get("HOST") or ("0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
PORT = int(os.environ.get("PORT", "8787"))
BASE_DIR = Path(__file__).parent
DATA_FILE = Path(__file__).with_name("report_data.json")
COMPANY_NAME = "Pitsamai Frozen Fruits Co., Ltd."
SYSTEM_NAME = "SystemPro by Pitsamai Frozen Fruits"
BRAND_GREEN = "#0F7A3D"
THAI_FONT = "Helvetica"
THAI_FONT_BOLD = "Helvetica-Bold"
TIME_SPECIAL_DAILY_WAGE = 365
DURIAN_GRADES = ("A", "B", "C", "D", "E")
TIME_SPECIAL_WAGE_TABLE = {
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
    8: 365,
}
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BACKUP_ACCESS_CODE = os.environ.get("BACKUP_ACCESS_CODE", "1150")
SESSION_SIGNING_SECRET = os.environ.get("SESSION_SIGNING_SECRET") or SUPABASE_SERVICE_ROLE_KEY or secrets.token_hex(32)
ACCOUNTING_COMPANY_KEY = os.environ.get("ACCOUNTING_COMPANY_KEY", "pismai-main")
BACKUP_TABLES = [
    "account_users",
    "employees",
    "time_employees",
    "wage_rates",
    "production_sessions",
    "production_records",
    "time_records",
    "deduction_records",
    "deduction_applications",
    "audit_logs",
]
LIVE_STATE_TABLES = {
    "production_sessions",
    "production_records",
    "time_records",
    "audit_logs",
}
ONLINE_USER_TIMEOUT_SECONDS = 45
online_user_lock = threading.Lock()
online_user_sessions: dict[str, dict] = {}
SYSTEM_ACCOUNT_PROFILES = {
    "Santi": {
        "username": "Santi",
        "password": os.environ.get("SYSTEM_C7_PASSWORD", ""),
        "fullname": "Santi Khl.",
        "role": "developer",
        "user_level": "C7",
        "status": "Active",
        "created_by": "system",
    }
}
SYSTEM_ACCOUNT_USERNAMES = {username.lower() for username in SYSTEM_ACCOUNT_PROFILES}


def session_token(account: dict) -> str:
    payload = {
        "sub": str(account.get("id", "")),
        "username": str(account.get("username", "")),
        "level": str(account.get("user_level", "C1")),
        "role": str(account.get("role", "")),
        "exp": int(time.time()) + 12 * 60 * 60,
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(SESSION_SIGNING_SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"


def verify_session_token(token: str) -> dict | None:
    try:
        encoded, signature = token.split(".", 1)
        expected = hmac.new(SESSION_SIGNING_SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        padded = encoded + "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
        if int(payload.get("exp", 0)) <= int(time.time()):
            return None
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def accounting_actor(handler: BaseHTTPRequestHandler, minimum_level: int = 4) -> dict | None:
    actor = verify_session_token(handler.headers.get("X-Session-Token", ""))
    level = int("".join(filter(str.isdigit, str(actor.get("level", "C1")))) or "1") if actor else 0
    return actor if actor and level >= minimum_level else None


def validate_accounting_workspace(workspace: object) -> str | None:
    if not isinstance(workspace, dict):
        return "workspace must be an object"
    accounts = workspace.get("accounts", [])
    journals = workspace.get("journals", [])
    if not isinstance(accounts, list) or not isinstance(journals, list):
        return "accounts and journals must be arrays"
    account_ids = {str(row.get("id")) for row in accounts if isinstance(row, dict) and row.get("id")}
    codes = [str(row.get("code", "")).strip().lower() for row in accounts if isinstance(row, dict)]
    if not account_ids or any(not code for code in codes) or len(codes) != len(set(codes)):
        return "chart of accounts contains missing or duplicate account codes"
    for journal in journals:
        if not isinstance(journal, dict) or journal.get("status") not in {"draft", "posted", "reversed"}:
            return "journal status is invalid"
        lines = journal.get("lines", [])
        if not isinstance(lines, list):
            return "journal lines must be an array"
        debit = credit = 0.0
        for line in lines:
            if not isinstance(line, dict) or str(line.get("accountId")) not in account_ids:
                return "journal references an unknown account"
            line_debit = round(float(line.get("debit") or 0), 2)
            line_credit = round(float(line.get("credit") or 0), 2)
            if line_debit < 0 or line_credit < 0 or (line_debit and line_credit):
                return "journal line has an invalid debit or credit"
            debit += line_debit
            credit += line_credit
        if journal.get("status") in {"posted", "reversed"} and (len(lines) < 2 or debit <= 0 or abs(debit - credit) >= 0.005):
            return "posted journal is not balanced"
    return None


def register_thai_font() -> str:
    regular_paths = [
        BASE_DIR / "fonts" / "Sarabun-Regular.ttf",
        BASE_DIR / "fonts" / "NotoSansThai-Regular.ttf",
        BASE_DIR / "fonts" / "NotoSansThai.ttf",
        Path("C:/Windows/Fonts/Sarabun-Regular.ttf"),
        Path("C:/Windows/Fonts/THSarabunNew.ttf"),
        Path("C:/Windows/Fonts/tahoma.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/leelawui.ttf"),
    ]
    bold_paths = [
        BASE_DIR / "fonts" / "Sarabun-Bold.ttf",
        BASE_DIR / "fonts" / "NotoSansThai-Bold.ttf",
        Path("C:/Windows/Fonts/Sarabun-Bold.ttf"),
        Path("C:/Windows/Fonts/THSarabunNew Bold.ttf"),
        Path("C:/Windows/Fonts/tahomabd.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("C:/Windows/Fonts/leelauib.ttf"),
    ]
    registered_regular = ""
    for font_path in regular_paths:
        if font_path.exists():
            try:
                pdfmetrics.registerFont(TTFont("ThaiFont", str(font_path)))
                registered_regular = "ThaiFont"
                break
            except Exception:
                continue
    for font_path in bold_paths:
        if font_path.exists():
            try:
                pdfmetrics.registerFont(TTFont("ThaiFontBold", str(font_path)))
                globals()["THAI_FONT_BOLD"] = "ThaiFontBold"
                break
            except Exception:
                continue
    if registered_regular:
        return registered_regular
    return "Helvetica"


THAI_FONT = register_thai_font()


def load_data() -> dict:
    if not DATA_FILE.exists():
        return {"employees": [], "production_records": []}
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def save_data(data: dict) -> None:
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return f"pbkdf2_sha256$120000${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    parts = password_hash.split("$")
    if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
        try:
            iterations = int(parts[1])
            salt = parts[2]
            expected = parts[3]
        except ValueError:
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(digest.hex(), expected)
    return hmac.compare_digest(password, password_hash)


def account_from_payload(payload: dict, include_password: bool = True) -> dict:
    status = "Active" if payload.get("isActive", payload.get("status", "Active")) not in [False, "false", "Inactive"] else "Inactive"
    account = {
        "username": str(payload.get("username", "")).strip(),
        "fullname": str(payload.get("fullname", "")).strip(),
        "phone": str(payload.get("phone", "")).strip(),
        "role": str(payload.get("role_key") or payload.get("role") or "general_staff").strip(),
        "user_level": str(payload.get("level") or payload.get("user_level") or "C1").strip().upper(),
        "status": status,
        "created_by": str(payload.get("created_by", "")).strip() or None,
    }
    if include_password:
        password = str(payload.get("password", ""))
        if password:
            account["password_hash"] = hash_password(password)
    return account


def account_to_client(account: dict) -> dict:
    role_key = account.get("role") or "general_staff"
    username = str(account.get("username", ""))
    is_system_account = username.lower() in SYSTEM_ACCOUNT_USERNAMES
    return {
        "id": account.get("id"),
        "username": username,
        "fullname": account.get("fullname", ""),
        "phone": account.get("phone") or ("0943913997" if username.lower() == "santi" else ""),
        "role_key": role_key,
        "level": account.get("user_level") or "C1",
        "isActive": account.get("status", "Active") == "Active",
        "is_system": is_system_account,
        "created_at": account.get("created_at"),
        "updated_at": account.get("updated_at") or account.get("created_at"),
    }


def ensure_system_accounts() -> None:
    if not supabase_configured():
        return
    for profile in SYSTEM_ACCOUNT_PROFILES.values():
        if not profile.get("password"):
            continue
        username = profile["username"]
        account = {
            "username": username,
            "password_hash": hash_password(profile["password"]),
            "fullname": profile["fullname"],
            "role": profile["role"],
            "user_level": profile["user_level"],
            "status": profile["status"],
            "created_by": profile["created_by"],
        }
        status, existing = supabase_request(
            "GET",
            f"account_users?username=eq.{quote(username)}&select=id&limit=1",
        )
        if status >= 400:
            continue
        if isinstance(existing, list) and existing:
            supabase_request(
                "PATCH",
                f"account_users?username=eq.{quote(username)}",
                account,
                prefer="return=minimal",
            )
        else:
            supabase_request(
                "POST",
                "account_users",
                account,
                prefer="return=minimal",
            )


def employee_from_payload(payload: dict) -> dict:
    employee = {
        "emp_code": str(payload.get("emp_code", "")).strip(),
        "fullname": str(payload.get("fullname", "")).strip(),
        "department": str(payload.get("department", "")).strip(),
        "position": str(payload.get("position", "")).strip() or "-",
        "pay_group": str(payload.get("pay_group", "")).strip(),
        "status": str(payload.get("status", "Active")).strip() or "Active",
        "note": str(payload.get("note", "")).strip() or None,
        "created_by": str(payload.get("created_by", "")).strip() or None,
    }
    if payload.get("id") not in [None, ""]:
        employee["id"] = payload.get("id")
    return employee


def time_employee_from_payload(payload: dict) -> dict:
    employee_type = str(payload.get("employee_type", "normal")).strip() or "normal"
    employee_type_aliases = {
        "normal": "normal_347",
        "special": "special_365",
    }
    employee_type = employee_type_aliases.get(employee_type, employee_type)
    type_daily_wages = {
        "normal_347": 347,
        "special_365": 365,
        "special_347": 347,
        "special_500": 500,
    }
    daily_wage = payload.get("daily_wage", type_daily_wages.get(employee_type, 347))
    ot_hourly_rate = payload.get("ot_hourly_rate", 50)
    employee = {
        "emp_code": str(payload.get("emp_code", "")).strip(),
        "fullname": str(payload.get("fullname", "")).strip(),
        "employee_type": employee_type,
        "daily_wage": daily_wage,
        "ot_hourly_rate": ot_hourly_rate,
        "status": str(payload.get("status", "Active")).strip() or "Active",
        "note": str(payload.get("note", "")).strip() or None,
        "created_by": str(payload.get("created_by", "")).strip() or None,
    }
    if payload.get("id") not in [None, ""]:
        employee["id"] = payload.get("id")
    return employee


def deduction_from_payload(payload: dict) -> dict:
    start_date = str(payload.get("start_date", "")).strip()
    end_date = str(payload.get("end_date", start_date)).strip() or start_date
    deduction = {
        "employee_kind": str(payload.get("employee_kind", "production")).strip() or "production",
        "employee_id": payload.get("employee_id"),
        "emp_code": str(payload.get("emp_code", "")).strip(),
        "employee_name": str(payload.get("employee_name", "")).strip(),
        "start_date": start_date,
        "end_date": end_date,
        "deduction_type": str(payload.get("deduction_type", "")).strip(),
        "deduction_label": str(payload.get("deduction_label", "")).strip(),
        "amount": payload.get("amount", 0),
        "note": str(payload.get("note", "")).strip() or None,
        "status": str(payload.get("status", "Active")).strip() or "Active",
        "created_by": str(payload.get("created_by", "")).strip() or None,
        "updated_by": str(payload.get("updated_by", "")).strip() or None,
    }
    if payload.get("id") not in [None, ""]:
        deduction["id"] = payload.get("id")
    return deduction


def deduction_application_from_payload(payload: dict) -> dict:
    return {
        "deduction_id": payload.get("deduction_id"),
        "amount": payload.get("amount", 0),
        "note": str(payload.get("note", "")).strip() or None,
    }


def next_table_id(table: str) -> int:
    status, body = supabase_request("GET", f"{table}?select=id&order=id.desc&limit=1")
    if status < 400 and isinstance(body, list) and body:
        try:
            return int(body[0].get("id") or 0) + 1
        except (TypeError, ValueError):
            return 1
    return 1


def ensure_row_id(table: str, row: dict) -> dict:
    if row.get("id") in [None, ""]:
        return {**row, "id": next_table_id(table)}
    return row


def sync_rows_by_id(table: str, rows: list[dict]) -> tuple[int, dict]:
    synced = []
    next_id = None
    for row in rows:
        clean_row = dict(row)
        if clean_row.get("id") in [None, ""]:
            if next_id is None:
                next_id = next_table_id(table)
            clean_row["id"] = next_id
            next_id += 1
        row_id = clean_row.get("id")
        status, existing = supabase_request("GET", f"{table}?id=eq.{quote(str(row_id))}&select=id&limit=1")
        if status >= 400:
            return status, {"error": existing, "table": table}
        if isinstance(existing, list) and existing:
            status, body = supabase_request(
                "PATCH",
                f"{table}?id=eq.{quote(str(row_id))}",
                clean_row,
                prefer="return=representation",
            )
        else:
            status, body = supabase_request(
                "POST",
                table,
                clean_row,
                prefer="return=representation",
            )
        if status >= 400:
            return status, {"error": body, "table": table, "row": clean_row}
        if isinstance(body, list):
            synced.extend(body)
    return 200, {"synced": synced}


def live_state_row(table: str, payload: dict) -> dict:
    """Convert the browser cache shape to the stable Supabase shape."""
    row_id = payload.get("id")
    if table == "production_sessions":
        row = {
            "session_date": payload.get("session_date") or payload.get("date"),
            "fruit_type": payload.get("fruit_type") or "mangosteen",
            "status": payload.get("status") or "open",
            "created_by": payload.get("created_by"),
            "closed_by": payload.get("closed_by"),
            "opened_at": payload.get("opened_at") or payload.get("start_time") or datetime.utcnow().isoformat() + "Z",
            "closed_at": payload.get("closed_at") or payload.get("end_time") or None,
            "raw_payload": payload,
        }
    elif table == "production_records":
        water = payload.get("water_weight", payload.get("water", 0)) or 0
        flower = payload.get("flower_weight", payload.get("flower", 0)) or 0
        row = {
            "record_date": payload.get("record_date") or payload.get("date"),
            # Legacy browser ids belong to a different local database. Keep
            # them in raw_payload, rather than failing cloud migration on a
            # foreign-key mismatch.
            "session_id": None,
            "employee_id": None,
            "emp_code": payload.get("emp_code"),
            "employee_name": payload.get("employee_name") or payload.get("fullname"),
            "pay_group": payload.get("pay_group"),
            "fruit_type": payload.get("fruit_type") or "mangosteen",
            "pile_no": str(payload.get("pile_no", payload.get("pile", ""))) or None,
            "item_type": payload.get("item_type"),
            "water_weight": water,
            "flower_weight": flower,
            "grade_weights": payload.get("grade_weights") or {},
            "grade_rates": payload.get("grade_rates") or {},
            "grade_amounts": payload.get("grade_amounts") or {},
            "total_weight": payload.get("total_weight", float(water) + float(flower)),
            "rate": payload.get("rate", 0) or 0,
            "amount": payload.get("amount", payload.get("total_amount", payload.get("grand_total", 0))) or 0,
            "note": payload.get("note"),
            "created_by": payload.get("created_by"),
            "updated_by": payload.get("updated_by"),
            "created_at": payload.get("created_at") or datetime.utcnow().isoformat() + "Z",
            "updated_at": payload.get("updated_at") or payload.get("created_at") or datetime.utcnow().isoformat() + "Z",
            "raw_payload": payload,
        }
    elif table == "time_records":
        row = {
            "work_date": payload.get("work_date") or payload.get("record_date") or payload.get("date"),
            "employee_id": None,
            "emp_code": payload.get("emp_code"),
            "employee_name": payload.get("employee_name") or payload.get("fullname"),
            "check_in": payload.get("check_in") or payload.get("clock_in"),
            "check_out": payload.get("check_out") or payload.get("clock_out"),
            "break_minutes": payload.get("break_minutes", 0) or 0,
            "total_minutes": payload.get("total_minutes", payload.get("net_minutes", 0)) or 0,
            "note": payload.get("note"),
            "created_by": payload.get("created_by"),
            "updated_by": payload.get("updated_by"),
            "created_at": payload.get("created_at") or datetime.utcnow().isoformat() + "Z",
            "updated_at": payload.get("updated_at") or payload.get("created_at") or datetime.utcnow().isoformat() + "Z",
            "raw_payload": payload,
        }
    else:
        row = {
            "action": payload.get("action") or "UNKNOWN",
            "module": payload.get("module"),
            "description": payload.get("description") or payload.get("detail"),
            "created_by": payload.get("created_by"),
            "user_fullname": payload.get("user_fullname"),
            "created_at": payload.get("created_at") or datetime.utcnow().isoformat() + "Z",
            "metadata": payload,
        }
    if row_id not in [None, ""]:
        row["id"] = row_id
    return row


def live_state_to_client(table: str, row: dict) -> dict:
    raw = row.get("raw_payload") if table != "audit_logs" else row.get("metadata")
    if isinstance(raw, dict):
        return {**raw, "id": row.get("id", raw.get("id"))}
    return row


def supabase_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def online_user_snapshot(now: float | None = None) -> dict:
    current_time = now or time.time()
    cutoff = current_time - ONLINE_USER_TIMEOUT_SECONDS
    with online_user_lock:
        expired = [
            client_id
            for client_id, session in online_user_sessions.items()
            if float(session.get("last_seen", 0)) < cutoff
        ]
        for client_id in expired:
            online_user_sessions.pop(client_id, None)
        users = sorted(
            online_user_sessions.values(),
            key=lambda session: str(session.get("fullname") or session.get("username") or ""),
        )
        return {
            "count": len(users),
            "timeout_seconds": ONLINE_USER_TIMEOUT_SECONDS,
            "users": [
                {
                    "username": session.get("username", ""),
                    "fullname": session.get("fullname", ""),
                    "route": session.get("route", ""),
                    "last_seen": session.get("last_seen_iso", ""),
                }
                for session in users
            ],
        }


def register_online_user(payload: dict) -> dict:
    client_id = str(payload.get("client_id") or "").strip()
    username = str(payload.get("username") or "").strip()
    if not client_id:
        client_id = secrets.token_urlsafe(18)
    now = time.time()
    with online_user_lock:
        online_user_sessions[client_id] = {
            "client_id": client_id,
            "username": username,
            "fullname": str(payload.get("fullname") or username or "ผู้ใช้งาน"),
            "route": str(payload.get("route") or ""),
            "last_seen": now,
            "last_seen_iso": datetime.utcnow().isoformat() + "Z",
        }
    snapshot = online_user_snapshot(now)
    snapshot["client_id"] = client_id
    return snapshot


def supabase_request(
    method: str,
    path: str,
    payload: dict | list | None = None,
    prefer: str | None = None,
) -> tuple[int, dict | list | str | None]:
    if not supabase_configured():
        return 503, {"error": "Supabase environment variables are not configured."}

    url = f"{SUPABASE_URL}/rest/v1/{path.lstrip('/')}"
    data = None
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return response.status, None
            try:
                return response.status, json.loads(raw)
            except json.JSONDecodeError:
                return response.status, raw
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8")
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {"error": raw or error.reason}
        return error.code, body
    except Exception as error:
        return 500, {"error": str(error)}


def account_phone_column_missing(body: dict | list | str | None) -> bool:
    text = json.dumps(body, ensure_ascii=False).lower() if isinstance(body, (dict, list)) else str(body or "").lower()
    return "phone" in text and ("column" in text or "schema cache" in text or "pgrst" in text)


def supabase_account_write(
    method: str,
    path: str,
    account: dict,
    prefer: str = "return=representation",
) -> tuple[int, dict | list | str | None]:
    status, body = supabase_request(method, path, account, prefer=prefer)
    if status >= 400 and "phone" in account and account_phone_column_missing(body):
        fallback_account = {key: value for key, value in account.items() if key != "phone"}
        status, body = supabase_request(method, path, fallback_account, prefer=prefer)
        if status < 400:
            if isinstance(body, list):
                body = [{**row, "phone": account.get("phone", "")} if isinstance(row, dict) else row for row in body]
            elif isinstance(body, dict):
                body = {**body, "phone": account.get("phone", "")}
    return status, body


def supabase_account_bulk_write(
    method: str,
    path: str,
    accounts: list[dict],
    prefer: str,
) -> tuple[int, dict | list | str | None]:
    status, body = supabase_request(method, path, accounts, prefer=prefer)
    if status >= 400 and accounts and account_phone_column_missing(body):
        fallback_accounts = [
            {key: value for key, value in account.items() if key != "phone"}
            for account in accounts
        ]
        status, body = supabase_request(method, path, fallback_accounts, prefer=prefer)
    return status, body


def backup_authorized(handler: BaseHTTPRequestHandler) -> bool:
    provided = handler.headers.get("X-Backup-Code", "")
    return bool(BACKUP_ACCESS_CODE and hmac.compare_digest(provided, BACKUP_ACCESS_CODE))


def read_supabase_backup() -> tuple[int, dict]:
    backup_data = {}
    for table in BACKUP_TABLES:
        status, body = supabase_request("GET", f"{table}?select=*")
        if status >= 400:
            return status, {"error": body, "table": table}
        backup_data[table] = body if isinstance(body, list) else []
    return 200, backup_data


def restore_supabase_backup(data: dict) -> tuple[int, dict]:
    restored = {}
    for table in BACKUP_TABLES:
        rows = data.get(table)
        if not isinstance(rows, list):
            continue
        if not rows:
            restored[table] = 0
            continue
        status, body = supabase_request(
            "POST",
            f"{table}?on_conflict=id",
            rows,
            prefer="resolution=merge-duplicates,return=minimal",
        )
        if status >= 400:
            return status, {"error": body, "table": table}
        restored[table] = len(rows)
    return 200, {"restored": restored}


def find_employee(data: dict, employee_id: int) -> dict | None:
    return next(
        (employee for employee in data.get("employees", []) if employee.get("id") == employee_id),
        None,
    )


def employee_records(data: dict, date: str, employee_id: int) -> list[dict]:
    return [
        record
        for record in data.get("production_records", [])
        if (record.get("record_date") or record.get("date")) == date
        and record.get("employee_id") == employee_id
    ]


def employee_range_records(
    data: dict,
    start_date: str,
    end_date: str,
    employee_id: int,
) -> list[dict]:
    start, end = sorted([start_date, end_date])
    return sorted(
        [
            record
            for record in data.get("production_records", [])
            if record.get("employee_id") == employee_id
            and start <= (record.get("record_date") or record.get("date") or "") <= end
        ],
        key=lambda record: (
            record.get("record_date") or record.get("date") or "",
            record.get("record_time", ""),
        ),
    )


def employee_daily_summaries(records: list[dict]) -> list[dict]:
    summaries: dict[str, dict] = {}
    for record in records:
        record_date = record.get("record_date") or record.get("date") or ""
        water_weight = float(record.get("water_weight", 0) or 0)
        flower_weight = float(record.get("flower_weight", 0) or 0)
        total_amount = float(record.get("total_amount", 0) or 0)
        summary = summaries.setdefault(
            record_date,
            {
                "date": record_date,
                "water_weight": 0.0,
                "flower_weight": 0.0,
                "grade_weights": {grade: 0.0 for grade in DURIAN_GRADES},
                "total_weight": 0.0,
                "total_amount": 0.0,
            },
        )
        summary["water_weight"] += water_weight
        summary["flower_weight"] += flower_weight
        grade_weights = production_grade_weights(record)
        for grade in DURIAN_GRADES:
            summary["grade_weights"][grade] += grade_weights[grade]
        summary["total_weight"] += production_total_weight(record)
        summary["total_amount"] += total_amount

    return [summaries[date] for date in sorted(summaries)]


def daily_records(data: dict, date: str) -> list[dict]:
    return [
        record
        for record in data.get("production_records", [])
        if (record.get("record_date") or record.get("date")) == date
    ]


def range_records(
    data: dict,
    start_date: str,
    end_date: str,
    product: str = "all",
) -> list[dict]:
    start, end = sorted([start_date, end_date])
    product_key = (product or "all").strip()
    records = []
    for record in data.get("production_records", []):
        record_date = record.get("record_date") or record.get("date") or ""
        if not (start <= record_date <= end):
            continue
        if product_key != "all" and (record.get("fruit_type") or "mangosteen") != product_key:
            continue
        records.append(record)
    return records


def pile_summary_rows(records: list[dict]) -> list[dict]:
    summaries: dict[str, dict] = {}
    for record in records:
        pile = str(record.get("pile_no") or record.get("pile") or "-")
        is_durian = (record.get("fruit_type") or "mangosteen") == "durian"
        incoming = 0.0 if is_durian else float(record.get("water_weight", record.get("water", 0)) or 0)
        outgoing = 0.0 if is_durian else float(record.get("flower_weight", record.get("flower", 0)) or 0)
        amount = float(record.get("total_amount", record.get("grand_total", 0)) or 0)
        summary = summaries.setdefault(
            pile,
            {
                "pile": pile,
                "incoming": 0.0,
                "outgoing": 0.0,
                "balance": 0.0,
                "grades": {grade: 0.0 for grade in DURIAN_GRADES},
                "total_weight": 0.0,
                "amount": 0.0,
            },
        )
        summary["incoming"] += incoming
        summary["outgoing"] += outgoing
        summary["balance"] += incoming - outgoing
        grade_weights = production_grade_weights(record)
        for grade in DURIAN_GRADES:
            summary["grades"][grade] += grade_weights[grade]
        summary["total_weight"] += production_total_weight(record)
        summary["amount"] += amount

    def sort_key(item: dict) -> tuple[int, str]:
        pile = str(item["pile"])
        return (0, f"{int(pile):08d}") if pile.isdigit() else (1, pile)

    return sorted(summaries.values(), key=sort_key)


def summary_totals(rows: list[dict]) -> dict:
    return {
        "incoming": sum(row["incoming"] for row in rows),
        "outgoing": sum(row["outgoing"] for row in rows),
        "balance": sum(row["balance"] for row in rows),
        "grades": {grade: sum(row.get("grades", {}).get(grade, 0) for row in rows) for grade in DURIAN_GRADES},
        "total_weight": sum(row.get("total_weight", row["incoming"] + row["outgoing"]) for row in rows),
        "amount": sum(row["amount"] for row in rows),
    }


def format_report_date(value: str) -> str:
    try:
        return datetime.fromisoformat(value).strftime("%d/%m/%Y")
    except ValueError:
        return value or "-"


def format_report_datetime(value: datetime) -> tuple[str, str]:
    return value.strftime("%d/%m/%Y"), value.strftime("%H:%M:%S")


def clean_filename_date(value: str) -> str:
    return value or datetime.now().date().isoformat()


def money(value: float | int | str | None) -> str:
    try:
        return f"{float(value):,.2f}"
    except (TypeError, ValueError):
        return "0.00"


def number(value: float | int | str | None) -> str:
    try:
        return f"{float(value):,.2f}"
    except (TypeError, ValueError):
        return "0.00"


def build_employee_story(data: dict, date: str, employee: dict) -> list:
    records = employee_records(data, date, int(employee["id"]))
    total_water = sum(float(record.get("water_weight", 0)) for record in records)
    total_flower = sum(float(record.get("flower_weight", 0)) for record in records)
    total_amount = sum(float(record.get("total_amount", 0)) for record in records)
    recorder = records[-1].get("created_by", "-") if records else "-"

    title, normal, _, section = pdf_styles()
    payload = {
        "printed_by": "ระบบรายงาน",
        "printed_by_position": "ฝ่ายทรัพยากรบุคคล",
        "print_date": format_report_date(date),
        "print_time": "-",
    }
    story = report_header_story(
        "รายงานผลผลิตและค่าแรงประจำวัน",
        f"ประจำวันที่ {format_report_date(date)}",
        payload,
    )
    story[-1] = Spacer(1, 3 * mm)

    employee_info = Table(
        [[
            Paragraph(f"<b>รหัสพนักงาน</b><br/>{employee.get('emp_code', '-')}", normal),
            Paragraph(f"<b>ชื่อ-นามสกุล</b><br/>{employee.get('fullname', '-')}", normal),
            Paragraph(f"<b>จำนวนรายการ</b><br/>{len(records):,} รายการ", normal),
            Paragraph(f"<b>น้ำหนักรวม</b><br/>{number(total_water + total_flower)} กก.", normal),
            Paragraph(f"<b>ยอดเงินรวม</b><br/>{money(total_amount)} บาท", normal),
        ]],
        colWidths=[48 * mm, 72 * mm, 42 * mm, 50 * mm, 55 * mm],
    )
    employee_info.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F8F4")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(BRAND_GREEN)),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CFE3D6")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.extend([employee_info, Spacer(1, 5 * mm), Paragraph("รายละเอียดผลผลิต", section)])

    rows = [
        [
            "กองที่",
            "นน. น้ำ",
            "นน. ดอก",
            "เรทน้ำ",
            "เรทดอก",
            "เงินค่าน้ำ",
            "เงินค่าดอก",
            "นน. รวม",
            "เงินรวม",
        ]
    ]

    for record in sorted(records, key=lambda item: (item.get("pile_no", 0), item.get("record_time", ""))):
        water_weight = float(record.get("water_weight", 0))
        flower_weight = float(record.get("flower_weight", 0))
        rows.append(
            [
                record.get("pile_no", ""),
                number(water_weight),
                number(flower_weight),
                money(record.get("water_rate")),
                money(record.get("flower_rate")),
                money(record.get("water_amount")),
                money(record.get("flower_amount")),
                number(water_weight + flower_weight),
                money(record.get("total_amount")),
            ]
        )

    if len(rows) == 1:
        rows.append(["-", "0.00", "0.00", "-", "-", "0.00", "0.00", "0.00", "0.00"])

    rows.append(
        [
            "รวมทั้งสิ้น",
            number(total_water),
            number(total_flower),
            "",
            "",
            "",
            "",
            number(total_water + total_flower),
            money(total_amount),
        ]
    )

    table = Table(
        rows,
        repeatRows=1,
        colWidths=[20 * mm, 29 * mm, 29 * mm, 25 * mm, 25 * mm, 32 * mm, 32 * mm, 30 * mm, 35 * mm],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(BRAND_GREEN)),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), THAI_FONT_BOLD),
                ("FONTNAME", (0, 1), (-1, -1), THAI_FONT),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CFE3D6")),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("FONTNAME", (0, -1), (-1, -1), THAI_FONT_BOLD),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#DDEFE4")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F7FAF8")]),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )

    story.extend(
        [
            table,
            Spacer(1, 6 * mm),
            Paragraph(f"ผู้บันทึกข้อมูล: {recorder}", normal),
            Spacer(1, 2 * mm),
            Table(
                [
                    [
                        Paragraph("ลงชื่อ ..........................................................<br/>ผู้ตรวจสอบ", normal),
                        Paragraph("ลงชื่อ ..........................................................<br/>พนักงาน", normal),
                    ]
                ],
                colWidths=[130 * mm, 130 * mm],
                style=TableStyle([
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]),
            ),
        ]
    )
    return story


def build_pdf(data: dict, date: str, employee_ids: list[int]) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=10 * mm,
        bottomMargin=12 * mm,
    )
    story = []

    for index, employee_id in enumerate(employee_ids):
        employee = find_employee(data, employee_id)
        if not employee:
            continue
        if index:
            story.append(PageBreak())
        story.extend(build_employee_story(data, date, employee))

    if not story:
        styles = getSampleStyleSheet()
        story = [
            Paragraph(COMPANY_NAME, styles["Title"]),
            Paragraph("No employee report data found.", styles["Heading2"]),
        ]

    doc.build(story)
    return buffer.getvalue()


def _build_employee_range_pdf_legacy(
    data: dict,
    start_date: str,
    end_date: str,
    employee_id: int,
) -> bytes:
    employee = find_employee(data, employee_id)
    records = employee_range_records(data, start_date, end_date, employee_id)
    daily_summaries = employee_daily_summaries(records)
    total_water = sum(summary["water_weight"] for summary in daily_summaries)
    total_flower = sum(summary["flower_weight"] for summary in daily_summaries)
    total_amount = sum(summary["total_amount"] for summary in daily_summaries)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
    )
    styles = getSampleStyleSheet()
    for style_name in ["Title", "Heading2", "Normal"]:
        styles[style_name].fontName = THAI_FONT
    story = [
        Paragraph(COMPANY_NAME, styles["Title"]),
        Paragraph("รายงานสรุปรายบุคคล", styles["Heading2"]),
        Spacer(1, 5 * mm),
        Paragraph(
            f"ชื่อ: {employee.get('emp_code', '-') if employee else '-'} - "
            f"{employee.get('fullname', '-') if employee else '-'}",
            styles["Normal"],
        ),
        Paragraph(f"ช่วงวันที่: {start_date} ถึง {end_date}", styles["Normal"]),
        Spacer(1, 5 * mm),
    ]

    rows = [
        [
            "วันที่",
            "น้ำหนักดอก",
            "น้ำหนักน้ำ",
            "รวมเป็นเงิน",
        ]
    ]

    for summary in daily_summaries:
        rows.append(
            [
                summary["date"],
                number(summary["flower_weight"]),
                number(summary["water_weight"]),
                money(summary["total_amount"]),
            ]
        )

    if len(rows) == 1:
        rows.append(["-", "0.00", "0.00", "0.00"])

    rows.append(
        [
            "รวม",
            number(total_flower),
            number(total_water),
            money(total_amount),
        ]
    )

    table = Table(rows, repeatRows=1, colWidths=[55 * mm, 55 * mm, 55 * mm, 65 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E6F4F1")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("FONTNAME", (0, 0), (-1, -1), THAI_FONT),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F7FAFC")),
            ]
        )
    )

    story.append(table)
    doc.build(story)
    return buffer.getvalue()


def build_employee_range_pdf(
    data: dict,
    start_date: str,
    end_date: str,
    employee_id: int,
) -> bytes:
    employee = find_employee(data, employee_id)
    records = employee_range_records(data, start_date, end_date, employee_id)
    daily_summaries = employee_daily_summaries(records)
    total_water = sum(item["water_weight"] for item in daily_summaries)
    total_flower = sum(item["flower_weight"] for item in daily_summaries)
    total_weight = sum(item.get("total_weight", item["water_weight"] + item["flower_weight"]) for item in daily_summaries)
    total_amount = sum(item["total_amount"] for item in daily_summaries)
    deduction_rows = deduction_records_for(
        data,
        "production",
        employee_id,
        (employee or {}).get("emp_code"),
        start_date,
        end_date,
    )
    bonus_rows = bonus_records_for(
        data,
        "production",
        employee_id,
        (employee or {}).get("emp_code"),
        start_date,
        end_date,
    )
    deduction_amount = deduction_total(deduction_rows)
    bonus_amount = deduction_total(bonus_rows)
    net_amount = max(0, total_amount + bonus_amount - deduction_amount)
    _, _, normal, section = pdf_styles()
    payload = {
        "printed_by": "ระบบรายงาน",
        "printed_by_position": "ฝ่ายทรัพยากรบุคคล",
        "print_date": format_report_date(datetime.now().strftime("%Y-%m-%d")),
        "print_time": datetime.now().strftime("%H:%M"),
    }

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=10 * mm,
        bottomMargin=13 * mm,
    )
    story = report_header_story(
        "รายงานสรุปผลผลิตรายบุคคล",
        f"ช่วงวันที่ {format_report_date(start_date)} ถึง {format_report_date(end_date)}",
        payload,
    )
    story[-1] = Spacer(1, 3 * mm)

    info = Table(
        [[
            Paragraph(f"<b>รหัสพนักงาน</b><br/>{employee.get('emp_code', '-') if employee else '-'}", normal),
            Paragraph(f"<b>ชื่อ-นามสกุล</b><br/>{employee.get('fullname', '-') if employee else '-'}", normal),
            Paragraph(f"<b>จำนวนวันทำงาน</b><br/>{len(daily_summaries):,} วัน", normal),
            Paragraph(f"<b>น้ำหนักรวม</b><br/>{number(total_weight)} กก.", normal),
            Paragraph(f"<b>รายได้รวม</b><br/>{money(total_amount)} บาท", normal),
        ]],
        colWidths=[48 * mm, 72 * mm, 42 * mm, 50 * mm, 55 * mm],
    )
    info.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F8F4")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(BRAND_GREEN)),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CFE3D6")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.extend([info, Spacer(1, 5 * mm)])
    money_summary = Table(
        [[
            Paragraph(f"<b>รวมก่อนปรับยอด</b><br/>{money(total_amount)} บาท", normal),
            Paragraph(f"<b>เบี้ยขยัน</b><br/>{money(bonus_amount)} บาท", normal),
            Paragraph(f"<b>หัก</b><br/>{money(deduction_amount)} บาท", normal),
            Paragraph(f"<b>สุทธิ</b><br/>{money(net_amount)} บาท", normal),
        ]],
        colWidths=[52 * mm, 52 * mm, 52 * mm, 52 * mm],
    )
    money_summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF7ED")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#FDBA74")),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#FED7AA")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.extend([money_summary, Spacer(1, 5 * mm)])
    adjustment_rows = [
        ["เงินเพิ่ม", row.get("deduction_label", "เบี้ยขยัน"), money(row.get("amount", 0)), row.get("note") or "-"]
        for row in bonus_rows
    ] + [
        ["รายการหัก", row.get("deduction_label", "-"), money(row.get("amount", 0)), row.get("note") or "-"]
        for row in deduction_rows
    ]
    if adjustment_rows:
        adjustment_table = Table(
            [["ประเภท", "รายการ", "จำนวนเงิน", "หมายเหตุ"]] + adjustment_rows,
            repeatRows=1,
            colWidths=[38 * mm, 64 * mm, 38 * mm, 65 * mm],
        )
        set_pdf_table_style(adjustment_table, 1)
        story.extend([Paragraph("รายการปรับยอด", section), adjustment_table, Spacer(1, 4 * mm)])
    story.extend([Paragraph("สรุปผลผลิตรายวัน", section)])

    rows = [["วันที่", "น้ำหนักน้ำ (กก.)", "น้ำหนักดอก (กก.)", "ทุเรียนเกรด A-E", "น้ำหนักรวม (กก.)", "รายได้รวม (บาท)"]]
    for item in daily_summaries:
        rows.append([
            format_report_date(item["date"]),
            number(item["water_weight"]),
            number(item["flower_weight"]),
            grade_totals_text(item.get("grade_weights")),
            number(item.get("total_weight", item["water_weight"] + item["flower_weight"])),
            money(item["total_amount"]),
        ])
    if len(rows) == 1:
        rows.append(["-", "0.00", "0.00", "-", "0.00", "0.00"])
    total_grades = {grade: sum(item.get("grade_weights", {}).get(grade, 0) for item in daily_summaries) for grade in DURIAN_GRADES}
    rows.append(["รวมทั้งสิ้น", number(total_water), number(total_flower), grade_totals_text(total_grades), number(total_weight), money(total_amount)])
    if bonus_amount:
        rows.append(["เบี้ยขยัน", "", "", "", "", money(bonus_amount)])
    if deduction_amount:
        rows.append(["หัก", "", "", "", "", money(deduction_amount)])
    if bonus_amount or deduction_amount:
        rows.append(["สุทธิ", "", "", "", "", money(net_amount)])

    table = Table(rows, repeatRows=1, colWidths=[38 * mm, 35 * mm, 35 * mm, 70 * mm, 40 * mm, 49 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(BRAND_GREEN)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), THAI_FONT_BOLD),
        ("FONTNAME", (0, 1), (-1, -1), THAI_FONT),
        ("FONTNAME", (0, -1), (-1, -1), THAI_FONT_BOLD),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CFE3D6")),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F7FAF8")]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#DDEFE4")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.extend([
        table,
        Spacer(1, 8 * mm),
        Table(
            [[
                Paragraph("ลงชื่อ ..........................................................<br/>ผู้จัดทำรายงาน", normal),
                Paragraph("ลงชื่อ ..........................................................<br/>ผู้ตรวจสอบ", normal),
            ]],
            colWidths=[130 * mm, 130 * mm],
            style=TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]),
        ),
    ])

    def draw_footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#D6E5DB"))
        canvas.line(15 * mm, 10 * mm, 282 * mm, 10 * mm)
        canvas.setFont(THAI_FONT, 8)
        canvas.setFillColor(colors.HexColor("#667085"))
        canvas.drawString(15 * mm, 5.5 * mm, "รายงานสรุปผลผลิตรายบุคคล - เอกสารภายในบริษัท")
        canvas.drawRightString(282 * mm, 5.5 * mm, f"หน้า {document.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)
    return buffer.getvalue()


def _build_daily_excel_legacy(data: dict, date: str) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Daily Production"

    title = f"{COMPANY_NAME} - Daily Production Wage Report"
    sheet["A1"] = title
    sheet["A2"] = f"Date: {date}"
    sheet["A1"].font = Font(bold=True, size=14)
    sheet["A2"].font = Font(bold=True)

    headers = [
        "ID",
        "Date",
        "Time",
        "Employee Code",
        "Employee Fullname",
        "Pile",
        "Water Weight",
        "Flower Weight",
        "Water Rate",
        "Flower Rate",
        "Water Amount",
        "Flower Amount",
        "Total Weight",
        "Total Amount",
        "Recorder",
        "Status",
    ]
    sheet.append([])
    sheet.append(headers)
    header_row = 4

    employee_by_id = {employee["id"]: employee for employee in data.get("employees", [])}

    for record in sorted(daily_records(data, date), key=lambda item: (item.get("emp_code", ""), item.get("record_time", ""))):
        employee = employee_by_id.get(record.get("employee_id"), {})
        water_weight = float(record.get("water_weight", 0))
        flower_weight = float(record.get("flower_weight", 0))
        sheet.append(
            [
                record.get("id"),
                record.get("record_date"),
                record.get("record_time"),
                record.get("emp_code"),
                employee.get("fullname", ""),
                record.get("pile_no"),
                water_weight,
                flower_weight,
                record.get("water_rate"),
                record.get("flower_rate"),
                record.get("water_amount"),
                record.get("flower_amount"),
                water_weight + flower_weight,
                record.get("total_amount"),
                record.get("created_by"),
                record.get("status"),
            ]
        )

    for cell in sheet[header_row]:
        cell.font = Font(bold=True)
        cell.fill = PatternFill("solid", fgColor="E6F4F1")
        cell.alignment = Alignment(horizontal="center")

    for row in sheet.iter_rows(min_row=header_row + 1):
        for cell in row:
            if isinstance(cell.value, (int, float)):
                cell.number_format = "#,##0.00"

    for column_cells in sheet.columns:
        max_length = max(len(str(cell.value or "")) for cell in column_cells)
        sheet.column_dimensions[get_column_letter(column_cells[0].column)].width = min(max_length + 3, 28)

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def build_daily_excel(data: dict, date: str) -> bytes:
    records = sorted(
        daily_records(data, date),
        key=lambda item: (str(item.get("emp_code", "")), str(item.get("record_time", ""))),
    )
    employees = {employee["id"]: employee for employee in data.get("employees", [])}
    total_weight = sum(production_total_weight(record) for record in records)
    total_amount = sum(safe_float(record.get("total_amount")) for record in records)
    employee_count = len({record.get("employee_id") for record in records if record.get("employee_id") is not None})

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "รายงานผลผลิตรายวัน"
    sheet.sheet_view.showGridLines = False
    sheet.freeze_panes = "A8"

    green = "0F7A3D"
    dark_green = "075E2E"
    light_green = "EAF5EE"
    pale_green = "F7FAF8"
    border_color = "CFE3D6"
    white = "FFFFFF"
    text_color = "1F2937"
    thin = Side(style="thin", color=border_color)
    medium = Side(style="medium", color=green)

    sheet.merge_cells("A1:O1")
    sheet["A1"] = COMPANY_NAME
    sheet["A1"].font = Font(name="Sarabun", bold=True, size=12, color=dark_green)
    sheet["A1"].alignment = Alignment(vertical="center")
    sheet.merge_cells("A2:O2")
    sheet["A2"] = "รายงานผลผลิตและค่าแรงประจำวัน"
    sheet["A2"].font = Font(name="Sarabun", bold=True, size=22, color=green)
    sheet["A2"].alignment = Alignment(vertical="center")
    sheet.merge_cells("A3:O3")
    sheet["A3"] = f"ประจำวันที่ {format_report_date(date)} | สร้างรายงาน {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    sheet["A3"].font = Font(name="Sarabun", size=10, color="667085")

    logo_path = Path(__file__).with_name("assets") / "pitsamai-logo.png"
    if logo_path.exists():
        try:
            logo = ExcelImage(str(logo_path))
            logo.width = 82
            logo.height = 82
            sheet.add_image(logo, "O1")
        except Exception:
            pass

    cards = [
        ("A4:D5", "จำนวนพนักงาน", f"{employee_count:,} คน"),
        ("E4:H5", "จำนวนรายการ", f"{len(records):,} รายการ"),
        ("I4:L5", "น้ำหนักรวม", f"{total_weight:,.2f} กก."),
        ("M4:P5", "ยอดเงินรวม", f"{total_amount:,.2f} บาท"),
    ]
    for cell_range, label, value in cards:
        sheet.merge_cells(cell_range)
        cell = sheet[cell_range.split(":")[0]]
        cell.value = f"{label}\n{value}"
        cell.font = Font(name="Sarabun", bold=True, size=12, color=green)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.fill = PatternFill("solid", fgColor=light_green)
        cell.border = Border(left=medium, right=medium, top=medium, bottom=medium)

    headers = [
        "ลำดับ", "วันที่", "เวลา", "รหัสพนักงาน", "ชื่อ-นามสกุล", "กองที่",
        "นน. น้ำ", "นน. ดอก", "เรทน้ำ", "เรทดอก", "เงินค่าน้ำ", "เงินค่าดอก",
        "ทุเรียนเกรด A-E", "นน. รวม", "เงินรวม", "ผู้บันทึก", "สถานะ",
    ]
    header_row = 7
    for column, header in enumerate(headers, 1):
        cell = sheet.cell(header_row, column, header)
        cell.font = Font(name="Sarabun", bold=True, color=white, size=10)
        cell.fill = PatternFill("solid", fgColor=green)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = Border(left=thin, right=thin, top=thin, bottom=thin)

    for index, record in enumerate(records, 1):
        row = header_row + index
        employee = employees.get(record.get("employee_id"), {})
        water_weight = safe_float(record.get("water_weight"))
        flower_weight = safe_float(record.get("flower_weight"))
        raw_date = record.get("record_date") or date
        try:
            date_value = datetime.strptime(str(raw_date), "%Y-%m-%d").date()
        except ValueError:
            date_value = str(raw_date)
        values = [
            index,
            date_value,
            record.get("record_time", ""),
            record.get("emp_code") or employee.get("emp_code", ""),
            employee.get("fullname", ""),
            record.get("pile_no", ""),
            water_weight,
            flower_weight,
            safe_float(record.get("water_rate")),
            safe_float(record.get("flower_rate")),
            safe_float(record.get("water_amount")),
            safe_float(record.get("flower_amount")),
            production_grade_text(record) if (record.get("fruit_type") or "mangosteen") == "durian" else "-",
            production_total_weight(record),
            safe_float(record.get("total_amount")),
            record.get("created_by", ""),
            "อนุมัติแล้ว" if str(record.get("status", "")).lower() == "approved" else record.get("status", ""),
        ]
        for column, value in enumerate(values, 1):
            cell = sheet.cell(row, column, value)
            cell.font = Font(name="Sarabun", size=10, color=text_color)
            cell.fill = PatternFill("solid", fgColor=white if index % 2 else pale_green)
            cell.border = Border(left=thin, right=thin, top=thin, bottom=thin)
            cell.alignment = Alignment(
                horizontal="left" if column in (4, 5, 13, 16, 17) else "center" if column in (1, 2, 3, 6) else "right",
                vertical="center",
            )
        sheet.cell(row, 2).number_format = "dd/mm/yyyy"
        for column in list(range(7, 13)) + [14, 15]:
            sheet.cell(row, column).number_format = "#,##0.00"
        if str(values[16]) == "อนุมัติแล้ว":
            sheet.cell(row, 17).font = Font(name="Sarabun", bold=True, size=10, color=green)

    total_row = header_row + len(records) + 1
    sheet.merge_cells(start_row=total_row, start_column=1, end_row=total_row, end_column=6)
    sheet.cell(total_row, 1, "รวมทั้งสิ้น")
    sheet.cell(total_row, 7, sum(safe_float(record.get("water_weight")) for record in records))
    sheet.cell(total_row, 8, sum(safe_float(record.get("flower_weight")) for record in records))
    total_grades = {grade: sum(production_grade_weights(record)[grade] for record in records) for grade in DURIAN_GRADES}
    sheet.cell(total_row, 13, grade_totals_text(total_grades))
    sheet.cell(total_row, 14, total_weight)
    sheet.cell(total_row, 15, total_amount)
    for column in range(1, 18):
        cell = sheet.cell(total_row, column)
        cell.font = Font(name="Sarabun", bold=True, size=10, color=dark_green)
        cell.fill = PatternFill("solid", fgColor="DDEFE4")
        cell.border = Border(top=medium, bottom=medium)
        cell.alignment = Alignment(horizontal="right" if column >= 7 else "left", vertical="center")
        if column >= 7:
            cell.number_format = "#,##0.00"

    widths = [8, 13, 10, 15, 25, 9, 12, 12, 11, 11, 14, 14, 28, 13, 15, 20, 14]
    for column, width in enumerate(widths, 1):
        sheet.column_dimensions[get_column_letter(column)].width = width
    sheet.row_dimensions[1].height = 20
    sheet.row_dimensions[2].height = 31
    sheet.row_dimensions[3].height = 19
    sheet.row_dimensions[4].height = 24
    sheet.row_dimensions[5].height = 24
    sheet.row_dimensions[7].height = 28
    for row in range(8, total_row + 1):
        sheet.row_dimensions[row].height = 21

    sheet.auto_filter.ref = f"A7:Q{total_row - 1}"
    sheet.print_title_rows = "1:7"
    sheet.print_area = f"A1:Q{total_row}"
    sheet.page_setup.orientation = "landscape"
    sheet.page_setup.paperSize = sheet.PAPERSIZE_A4
    sheet.page_setup.fitToWidth = 1
    sheet.page_setup.fitToHeight = 0
    sheet.sheet_properties.pageSetUpPr.fitToPage = True
    sheet.oddFooter.center.text = "รายงานผลผลิตและค่าแรงประจำวัน"
    sheet.oddFooter.right.text = "หน้า &P จาก &N"
    sheet.oddFooter.left.text = SYSTEM_NAME
    sheet.sheet_view.zoomScale = 80

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def build_employee_range_excel(
    data: dict,
    start_date: str,
    end_date: str,
    employee_id: int,
) -> bytes:
    employee = find_employee(data, employee_id) or {}
    records = employee_range_records(data, start_date, end_date, employee_id)
    daily_summaries = employee_daily_summaries(records)
    deduction_rows = deduction_records_for(
        data,
        "production",
        employee_id,
        employee.get("emp_code"),
        start_date,
        end_date,
    )
    bonus_rows = bonus_records_for(
        data,
        "production",
        employee_id,
        employee.get("emp_code"),
        start_date,
        end_date,
    )
    deduction_amount = deduction_total(deduction_rows)
    bonus_amount = deduction_total(bonus_rows)
    gross_amount = sum(summary["total_amount"] for summary in daily_summaries)
    net_amount = max(0, gross_amount + bonus_amount - deduction_amount)
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "สรุปรายบุคคล"

    sheet["A1"] = f"{COMPANY_NAME} - รายงานสรุปรายบุคคล"
    sheet["A2"] = f"ชื่อ: {employee.get('emp_code', '-')} - {employee.get('fullname', '-')}"
    sheet["A3"] = f"ช่วงวันที่: {start_date} ถึง {end_date}"
    for cell_ref in ["A1", "A2", "A3"]:
        sheet[cell_ref].font = Font(bold=True, size=14 if cell_ref == "A1" else 11)

    headers = [
        "วันที่",
        "น้ำหนักดอก",
        "น้ำหนักน้ำ",
        "ทุเรียนเกรด A-E",
        "น้ำหนักรวม",
        "รวมเป็นเงิน",
    ]
    sheet.append([])
    sheet.append(headers)
    header_row = 5

    for summary in daily_summaries:
        sheet.append(
            [
                summary["date"],
                summary["flower_weight"],
                summary["water_weight"],
                grade_totals_text(summary.get("grade_weights")),
                summary.get("total_weight", summary["flower_weight"] + summary["water_weight"]),
                summary["total_amount"],
            ]
        )

    total_row = sheet.max_row + 1
    sheet.cell(total_row, 1, "รวม")
    sheet.cell(total_row, 2, sum(summary["flower_weight"] for summary in daily_summaries))
    sheet.cell(total_row, 3, sum(summary["water_weight"] for summary in daily_summaries))
    total_grades = {grade: sum(summary.get("grade_weights", {}).get(grade, 0) for summary in daily_summaries) for grade in DURIAN_GRADES}
    sheet.cell(total_row, 4, grade_totals_text(total_grades))
    sheet.cell(total_row, 5, sum(summary.get("total_weight", summary["flower_weight"] + summary["water_weight"]) for summary in daily_summaries))
    sheet.cell(total_row, 6, gross_amount)
    bonus_row = total_row + 1
    sheet.cell(bonus_row, 1, "เบี้ยขยัน")
    sheet.cell(bonus_row, 6, bonus_amount)
    deduct_row = total_row + 2
    sheet.cell(deduct_row, 1, "หัก")
    sheet.cell(deduct_row, 6, deduction_amount)
    net_row = total_row + 3
    sheet.cell(net_row, 1, "สุทธิ")
    sheet.cell(net_row, 6, net_amount)

    if deduction_rows:
        detail_start = net_row + 2
        sheet.cell(detail_start, 1, "รายการหัก")
        sheet.cell(detail_start, 2, "จำนวนเงิน")
        sheet.cell(detail_start, 3, "หมายเหตุ")
        for index, deduction in enumerate(deduction_rows, 1):
            row_index = detail_start + index
            sheet.cell(row_index, 1, deduction.get("deduction_label", "-"))
            sheet.cell(row_index, 2, safe_float(deduction.get("amount")))
            sheet.cell(row_index, 3, deduction.get("note") or "-")

    if bonus_rows:
        bonus_detail_start = sheet.max_row + 2
        sheet.cell(bonus_detail_start, 1, "รายการเบี้ยขยัน")
        sheet.cell(bonus_detail_start, 2, "จำนวนเงิน")
        sheet.cell(bonus_detail_start, 3, "หมายเหตุ")
        for index, bonus in enumerate(bonus_rows, 1):
            row_index = bonus_detail_start + index
            sheet.cell(row_index, 1, bonus.get("deduction_label", "เบี้ยขยัน"))
            sheet.cell(row_index, 2, safe_float(bonus.get("amount")))
            sheet.cell(row_index, 3, bonus.get("note") or "-")

    for cell in sheet[header_row]:
        cell.font = Font(bold=True)
        cell.fill = PatternFill("solid", fgColor="E6F4F1")
        cell.alignment = Alignment(horizontal="center")

    for row_index in [total_row, deduct_row, net_row]:
        for cell in sheet[row_index]:
            cell.font = Font(bold=True)
            cell.fill = PatternFill("solid", fgColor="F7FAFC")

    for row in sheet.iter_rows(min_row=header_row + 1):
        for cell in row:
            if isinstance(cell.value, (int, float)):
                cell.number_format = "#,##0.00"

    for column_cells in sheet.columns:
        max_length = max(len(str(cell.value or "")) for cell in column_cells)
        sheet.column_dimensions[get_column_letter(column_cells[0].column)].width = min(max_length + 3, 30)

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_footer(page_count)
            super().showPage()
        super().save()

    def draw_page_footer(self, page_count: int):
        width, _ = A4
        page_number = self._pageNumber
        self.setStrokeColor(colors.HexColor(BRAND_GREEN))
        self.setLineWidth(0.6)
        self.line(15 * mm, 24 * mm, width - 15 * mm, 24 * mm)
        self.setFont(THAI_FONT_BOLD, 9)
        self.setFillColor(colors.HexColor(BRAND_GREEN))
        self.drawString(16 * mm, 16 * mm, COMPANY_NAME)
        self.setFont(THAI_FONT, 8)
        self.setFillColor(colors.HexColor("#111827"))
        self.drawString(16 * mm, 11 * mm, SYSTEM_NAME)
        self.setFont(THAI_FONT, 9)
        self.drawRightString(width - 16 * mm, 13 * mm, f"Page {page_number} / {page_count}")


def report_number(value: float | int | str | None, digits: int = 2) -> str:
    try:
        numeric = float(value or 0)
    except (TypeError, ValueError):
        numeric = 0.0
    text = f"{numeric:,.{digits}f}"
    return text.rstrip("0").rstrip(".") if "." in text else text


def build_summary_by_pile_pdf(data: dict, payload: dict) -> bytes:
    now = datetime.now()
    start_date = payload.get("start_date", now.date().isoformat())
    end_date = payload.get("end_date", start_date)
    product = payload.get("product", "all")
    product_label = payload.get("product_label") or "ทั้งหมด"
    product_type = payload.get("product_type") or "ทั้งหมด"
    printed_by = payload.get("printed_by") or "System Admin"
    print_date, print_time = format_report_datetime(now)
    rows = pile_summary_rows(range_records(data, start_date, end_date, product))
    totals = summary_totals(rows)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=14 * mm,
        bottomMargin=30 * mm,
    )
    styles = getSampleStyleSheet()
    for style_name in ["Title", "Heading1", "Heading2", "Normal"]:
        styles[style_name].fontName = THAI_FONT
    title_style = styles["Title"].clone("SummaryReportTitle")
    title_style.fontName = THAI_FONT_BOLD
    title_style.fontSize = 17
    title_style.leading = 21
    title_style.textColor = colors.HexColor(BRAND_GREEN)
    title_style.spaceAfter = 2
    subtitle_style = styles["Normal"].clone("SummaryReportSubtitle")
    subtitle_style.fontSize = 10
    subtitle_style.leading = 13
    section_style = styles["Heading2"].clone("SummaryReportSection")
    section_style.fontName = THAI_FONT_BOLD
    section_style.fontSize = 13
    section_style.textColor = colors.HexColor(BRAND_GREEN)
    section_style.spaceAfter = 6

    logo_path = Path(__file__).with_name("assets") / "pitsamai-logo.png"
    logo = Image(str(logo_path), width=22 * mm, height=22 * mm) if logo_path.exists() else Paragraph("SP", title_style)
    title_block = [
        Paragraph(COMPANY_NAME, subtitle_style),
        Paragraph("รายงานสรุปน้ำหนักตามกอง", title_style),
    ]
    meta_rows = [
        ["ช่วงวันที่", f"{format_report_date(start_date)} - {format_report_date(end_date)}"],
        ["สินค้า", product_label],
        ["ประเภทสินค้า", product_type],
        ["ผู้พิมพ์", printed_by],
        ["วันที่พิมพ์", print_date],
        ["เวลา", print_time],
    ]
    meta_table = Table(meta_rows, colWidths=[23 * mm, 37 * mm])
    meta_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), THAI_FONT),
                ("FONTNAME", (0, 0), (0, -1), THAI_FONT_BOLD),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#111827")),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    header = Table([[logo, title_block, meta_table]], colWidths=[24 * mm, 96 * mm, 60 * mm])
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    green_line = Table([[""]], colWidths=[180 * mm], rowHeights=[1.1 * mm])
    green_line.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(BRAND_GREEN))]))

    table_rows = [["กอง", "น้ำหนักเข้า (ตัน)", "น้ำหนักออก (ตัน)", "น้ำหนักคงเหลือ", "รวมเงิน"]]
    for item in rows:
        table_rows.append(
            [
                f"กอง {item['pile']}",
                report_number(item["incoming"]),
                report_number(item["outgoing"]),
                report_number(item["balance"]),
                report_number(item["amount"], 0),
            ]
        )
    if len(table_rows) == 1:
        table_rows.append(["-", "0", "0", "0", "0"])
    table_rows.append(
        [
            "รวมทั้งหมด",
            report_number(totals["incoming"]),
            report_number(totals["outgoing"]),
            report_number(totals["balance"]),
            report_number(totals["amount"], 0),
        ]
    )

    summary_table = Table(
        table_rows,
        repeatRows=1,
        colWidths=[36 * mm, 36 * mm, 36 * mm, 36 * mm, 36 * mm],
        hAlign="LEFT",
    )
    table_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(BRAND_GREEN)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), THAI_FONT_BOLD),
        ("FONTNAME", (0, 1), (-1, -1), THAI_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CDD6DF")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E9F5EE")),
        ("FONTNAME", (0, -1), (-1, -1), THAI_FONT_BOLD),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#064E25")),
    ]
    for row_index in range(1, len(table_rows) - 1):
        if row_index % 2 == 0:
            table_style.append(("BACKGROUND", (0, row_index), (-1, row_index), colors.HexColor("#F7FAF8")))
    summary_table.setStyle(TableStyle(table_style))

    note_box = Table(
        [[Paragraph("<b>หมายเหตุ</b><br/>หน่วยน้ำหนัก : ตัน", styles["Normal"])]],
        colWidths=[180 * mm],
    )
    note_box.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), THAI_FONT),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#CDD6DF")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )

    story = [
        header,
        Spacer(1, 6 * mm),
        green_line,
        Spacer(1, 10 * mm),
        Paragraph("สรุปตามกอง (ตัน)", section_style),
        KeepTogether([summary_table, Spacer(1, 8 * mm), note_box]),
    ]
    doc.build(story, canvasmaker=NumberedCanvas)
    return buffer.getvalue()


def build_summary_by_pile_excel(data: dict, payload: dict) -> bytes:
    now = datetime.now()
    start_date = payload.get("start_date", now.date().isoformat())
    end_date = payload.get("end_date", start_date)
    product = payload.get("product", "all")
    product_label = payload.get("product_label") or "ทั้งหมด"
    product_type = payload.get("product_type") or "ทั้งหมด"
    printed_by = payload.get("printed_by") or "System Admin"
    print_date, print_time = format_report_datetime(now)
    rows = pile_summary_rows(range_records(data, start_date, end_date, product))
    totals = summary_totals(rows)

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Summary By Pile"
    sheet.page_setup.paperSize = sheet.PAPERSIZE_A4
    sheet.page_setup.orientation = "portrait"
    sheet.page_margins.left = 0.45
    sheet.page_margins.right = 0.45
    sheet.page_margins.top = 0.55
    sheet.page_margins.bottom = 0.55

    green_fill = PatternFill("solid", fgColor="0F7A3D")
    light_green_fill = PatternFill("solid", fgColor="E9F5EE")
    zebra_fill = PatternFill("solid", fgColor="F7FAF8")
    thin_green = Side(style="thin", color="0F7A3D")
    thin_gray = Side(style="thin", color="CDD6DF")
    table_border = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)
    sarabun = "Sarabun"

    sheet.merge_cells("A1:E1")
    sheet["A1"] = COMPANY_NAME
    sheet["A1"].font = Font(name=sarabun, bold=True, size=11, color="0F7A3D")
    sheet.merge_cells("A2:E2")
    sheet["A2"] = "รายงานสรุปน้ำหนักตามกอง"
    sheet["A2"].font = Font(name=sarabun, bold=True, size=20, color="0F7A3D")
    sheet.merge_cells("A3:E3")
    sheet["A3"] = f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)} | สินค้า {product_label} | ประเภทสินค้า {product_type}"
    sheet["A3"].font = Font(name=sarabun, size=10, color="111827")
    sheet.merge_cells("A4:E4")
    sheet["A4"] = f"ผู้พิมพ์ {printed_by} | วันที่พิมพ์ {print_date} | เวลา {print_time}"
    sheet["A4"].font = Font(name=sarabun, size=10, color="111827")
    for cell in sheet[5]:
        cell.fill = green_fill
        cell.border = Border(bottom=thin_green)
    sheet.row_dimensions[5].height = 4

    headers = ["กอง", "น้ำหนักเข้า (ตัน)", "น้ำหนักออก (ตัน)", "น้ำหนักคงเหลือ", "รวมเงิน"]
    header_row = 7
    for column_index, value in enumerate(headers, start=1):
        cell = sheet.cell(header_row, column_index, value)
        cell.fill = green_fill
        cell.font = Font(name=sarabun, bold=True, color="FFFFFF", size=11)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = table_border

    row_index = header_row + 1
    for item in rows:
        values = [
            f"กอง {item['pile']}",
            item["incoming"],
            item["outgoing"],
            item["balance"],
            item["amount"],
        ]
        for column_index, value in enumerate(values, start=1):
            cell = sheet.cell(row_index, column_index, value)
            cell.font = Font(name=sarabun, size=11)
            cell.border = table_border
            cell.alignment = Alignment(horizontal="left" if column_index == 1 else "right", vertical="center")
            if column_index > 1:
                cell.number_format = "#,##0.00"
            if row_index % 2 == 1:
                cell.fill = zebra_fill
        row_index += 1

    if not rows:
        for column_index, value in enumerate(["-", 0, 0, 0, 0], start=1):
            cell = sheet.cell(row_index, column_index, value)
            cell.font = Font(name=sarabun, size=11)
            cell.border = table_border
            cell.alignment = Alignment(horizontal="left" if column_index == 1 else "right")
            if column_index > 1:
                cell.number_format = "#,##0.00"
        row_index += 1

    total_values = ["รวมทั้งหมด", totals["incoming"], totals["outgoing"], totals["balance"], totals["amount"]]
    for column_index, value in enumerate(total_values, start=1):
        cell = sheet.cell(row_index, column_index, value)
        cell.fill = light_green_fill
        cell.font = Font(name=sarabun, bold=True, color="064E25", size=11)
        cell.border = table_border
        cell.alignment = Alignment(horizontal="left" if column_index == 1 else "right", vertical="center")
        if column_index > 1:
            cell.number_format = "#,##0.00"

    note_row = row_index + 3
    sheet.merge_cells(start_row=note_row, start_column=1, end_row=note_row + 1, end_column=5)
    note_cell = sheet.cell(note_row, 1, "หมายเหตุ\nหน่วยน้ำหนัก : ตัน")
    note_cell.font = Font(name=sarabun, size=11)
    note_cell.alignment = Alignment(wrap_text=True, vertical="center")
    note_cell.border = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)

    footer_row = note_row + 5
    sheet.merge_cells(start_row=footer_row, start_column=1, end_row=footer_row, end_column=3)
    sheet.cell(footer_row, 1, SYSTEM_NAME)
    sheet.cell(footer_row, 1).font = Font(name=sarabun, bold=True, color="0F7A3D", size=10)
    sheet.cell(footer_row, 5, "Page 1 / 1")
    sheet.cell(footer_row, 5).alignment = Alignment(horizontal="right")

    widths = [22, 20, 20, 20, 18]
    for index, width in enumerate(widths, start=1):
        sheet.column_dimensions[get_column_letter(index)].width = width
    sheet.freeze_panes = "A7"
    sheet.print_area = f"A1:E{footer_row}"

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def normalized_range(payload: dict) -> tuple[str, str]:
    today = datetime.now().date().isoformat()
    start_date = payload.get("start_date") or today
    end_date = payload.get("end_date") or start_date
    return tuple(sorted([start_date, end_date]))


def deduction_records_for(payload: dict, employee_kind: str, employee_id: object, emp_code: object, start_date: str, end_date: str) -> list[dict]:
    employee_id_text = str(employee_id or "")
    emp_code_text = str(emp_code or "")
    rows = []
    for record in payload.get("deduction_records", []) or []:
        if str(record.get("deduction_type") or "") == "attendance_bonus":
            continue
        if str(record.get("status") or "Active") != "Active":
            continue
        if str(record.get("employee_kind") or "production") != employee_kind:
            continue
        record_start = str(record.get("start_date") or "")
        record_end = str(record.get("end_date") or record_start)
        if record_start > end_date or record_end < start_date:
            continue
        same_employee = (
            employee_id_text and str(record.get("employee_id") or "") == employee_id_text
        ) or (
            emp_code_text and str(record.get("emp_code") or "") == emp_code_text
        )
        if same_employee:
            rows.append(record)
    return rows


def bonus_records_for(payload: dict, employee_kind: str, employee_id: object, emp_code: object, start_date: str, end_date: str) -> list[dict]:
    employee_id_text = str(employee_id or "")
    emp_code_text = str(emp_code or "")
    rows = []
    for record in payload.get("deduction_records", []) or []:
        if str(record.get("deduction_type") or "") != "attendance_bonus":
            continue
        if str(record.get("status") or "Active") != "Active":
            continue
        if str(record.get("employee_kind") or "production") != employee_kind:
            continue
        record_start = str(record.get("start_date") or "")
        record_end = str(record.get("end_date") or record_start)
        if record_start > end_date or record_end < start_date:
            continue
        same_employee = (
            employee_id_text and str(record.get("employee_id") or "") == employee_id_text
        ) or (
            emp_code_text and str(record.get("emp_code") or "") == emp_code_text
        )
        if same_employee:
            rows.append(record)
    return rows


def deduction_total(records: list[dict]) -> float:
    return sum(safe_float(record.get("amount")) for record in records)


def full_export_records(payload: dict) -> tuple[list[dict], list[dict]]:
    start_date, end_date = normalized_range(payload)
    department = payload.get("department") or "all"
    production_records = [
        record
        for record in payload.get("production_records", [])
        if start_date <= (record.get("record_date") or record.get("date") or "") <= end_date
    ]
    time_records = [
        record
        for record in payload.get("time_records", [])
        if start_date <= (record.get("record_date") or "") <= end_date
        and (department == "all" or record.get("department") == department)
    ]
    return production_records, time_records


def build_time_full_export_excel(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    production_records, time_records = full_export_records(payload)
    employees = payload.get("employees", [])
    printed_by = payload.get("printed_by") or "System Admin"
    department = payload.get("department") or "all"
    now = datetime.now()
    print_date, print_time = format_report_datetime(now)

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Overview"
    green_fill = PatternFill("solid", fgColor="0F7A3D")
    light_green_fill = PatternFill("solid", fgColor="E9F5EE")
    zebra_fill = PatternFill("solid", fgColor="F7FAF8")
    thin_gray = Side(style="thin", color="CDD6DF")
    table_border = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)
    font_name = "Sarabun"

    def style_header(row):
        for cell in row:
            cell.fill = green_fill
            cell.font = Font(name=font_name, bold=True, color="FFFFFF")
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = table_border

    def style_table(sheet_obj, header_row: int):
        style_header(sheet_obj[header_row])
        for row_index, row in enumerate(sheet_obj.iter_rows(min_row=header_row + 1), start=header_row + 1):
            for cell in row:
                cell.border = table_border
                cell.alignment = Alignment(vertical="center", wrap_text=True)
                cell.font = Font(name=font_name, size=10)
                if isinstance(cell.value, (int, float)):
                    cell.number_format = "#,##0.00"
                    cell.alignment = Alignment(horizontal="right", vertical="center")
                if row_index % 2 == 0:
                    cell.fill = zebra_fill

    def autosize(sheet_obj):
        for column_cells in sheet_obj.columns:
            max_length = max(len(str(cell.value or "")) for cell in column_cells)
            sheet_obj.column_dimensions[get_column_letter(column_cells[0].column)].width = min(max_length + 3, 34)

    sheet.merge_cells("A1:H1")
    sheet["A1"] = COMPANY_NAME
    sheet["A1"].font = Font(name=font_name, bold=True, size=18, color="0F7A3D")
    sheet.merge_cells("A2:H2")
    sheet["A2"] = "Export รายละเอียดทั้งหมด"
    sheet["A2"].font = Font(name=font_name, bold=True, size=16, color="111827")
    sheet.merge_cells("A3:H3")
    sheet["A3"] = f"ช่วงวันที่ {start_date} ถึง {end_date} | แผนก {department if department != 'all' else 'ทุกแผนก'}"
    sheet.merge_cells("A4:H4")
    sheet["A4"] = f"ผู้ Export {printed_by} | วันที่ {print_date} | เวลา {print_time}"
    for ref in ["A3", "A4"]:
        sheet[ref].font = Font(name=font_name, size=11, color="344054")

    logo_path = Path(__file__).with_name("assets") / "pitsamai-logo.png"
    if logo_path.exists():
        try:
            logo = ExcelImage(str(logo_path))
            logo.width = 70
            logo.height = 70
            sheet.add_image(logo, "I1")
        except Exception:
            pass

    total_weight = sum(production_total_weight(record) for record in production_records)
    total_production_amount = sum(float(record.get("total_amount", record.get("grand_total", 0)) or 0) for record in production_records)
    total_time_minutes = sum(float(record.get("net_minutes", 0) or 0) for record in time_records)
    overview_rows = [
        ["หัวข้อ", "ค่า"],
        ["จำนวนรายการผลผลิต", len(production_records)],
        ["น้ำหนักผลผลิตรวม", total_weight],
        ["ยอดเงินผลผลิตรวม", total_production_amount],
        ["จำนวนรายการเวลา", len(time_records)],
        ["ชั่วโมงทำงานรวม", total_time_minutes / 60],
        ["จำนวนพนักงานทั้งหมด", len(employees)],
    ]
    for row in overview_rows:
        sheet.append(row)
    style_table(sheet, 6)
    autosize(sheet)

    prod_sheet = workbook.create_sheet("Production Details")
    prod_headers = [
        "วันที่",
        "เวลา",
        "รหัสพนักงาน",
        "ชื่อพนักงาน",
        "สินค้า",
        "กอง",
        "น้ำหนักน้ำ",
        "น้ำหนักดอก",
        "เกรดทุเรียน A-E",
        "น้ำหนักรวม",
        "รวมเงิน",
        "ผู้บันทึก",
    ]
    prod_sheet.append(prod_headers)
    for record in sorted(production_records, key=lambda item: ((item.get("record_date") or item.get("date") or ""), item.get("record_time", ""), item.get("emp_code", ""))):
        prod_sheet.append(
            [
                record.get("record_date") or record.get("date") or "",
                record.get("record_time", ""),
                record.get("emp_code", ""),
                record.get("employee_name", ""),
                record.get("fruit_type", "mangosteen"),
                record.get("pile_no") or record.get("pile", ""),
                float(record.get("water_weight", record.get("water", 0)) or 0),
                float(record.get("flower_weight", record.get("flower", 0)) or 0),
                production_grade_text(record) if (record.get("fruit_type") or "mangosteen") == "durian" else "-",
                production_total_weight(record),
                float(record.get("total_amount", record.get("grand_total", 0)) or 0),
                record.get("created_by", ""),
            ]
        )
    style_table(prod_sheet, 1)
    autosize(prod_sheet)

    time_sheet = workbook.create_sheet("Time Details")
    time_headers = ["วันที่", "รหัสพนักงาน", "ชื่อพนักงาน", "แผนก", "เข้า", "ออก", "พัก(นาที)", "สุทธิ(นาที)", "ชั่วโมง", "ผู้บันทึก"]
    time_sheet.append(time_headers)
    for record in sorted(time_records, key=lambda item: (item.get("record_date", ""), item.get("emp_code", ""), item.get("clock_in", ""))):
        net_minutes = float(record.get("net_minutes", 0) or 0)
        time_sheet.append(
            [
                record.get("record_date", ""),
                record.get("emp_code", ""),
                record.get("fullname", ""),
                record.get("department", ""),
                record.get("clock_in", ""),
                record.get("clock_out", ""),
                float(record.get("break_minutes", 0) or 0),
                net_minutes,
                net_minutes / 60,
                record.get("created_by", ""),
            ]
        )
    style_table(time_sheet, 1)
    autosize(time_sheet)

    summary_sheet = workbook.create_sheet("Time Summary")
    summary_sheet.append(["รหัสพนักงาน", "ชื่อพนักงาน", "แผนก", "จำนวนวัน", "จำนวนรายการ", "ชั่วโมงรวม"])
    grouped: dict[str, dict] = {}
    for record in time_records:
        key = str(record.get("employee_id") or record.get("emp_code") or record.get("fullname") or "")
        item = grouped.setdefault(
            key,
            {
                "emp_code": record.get("emp_code", ""),
                "fullname": record.get("fullname", ""),
                "department": record.get("department", ""),
                "days": set(),
                "records": 0,
                "minutes": 0.0,
            },
        )
        item["days"].add(record.get("record_date", ""))
        item["records"] += 1
        item["minutes"] += float(record.get("net_minutes", 0) or 0)
    for item in sorted(grouped.values(), key=lambda value: (value["emp_code"], value["fullname"])):
        summary_sheet.append([item["emp_code"], item["fullname"], item["department"], len(item["days"]), item["records"], item["minutes"] / 60])
    style_table(summary_sheet, 1)
    autosize(summary_sheet)

    deduction_sheet = workbook.create_sheet("Adjustments")
    deduction_sheet.append(["ประเภทรายการ", "ประเภทพนักงาน", "วันที่เริ่ม", "วันที่สิ้นสุด", "รหัส", "ชื่อพนักงาน", "รายการ", "จำนวนเงิน", "หมายเหตุ", "ผู้บันทึก"])
    deduction_rows = [
        record
        for record in payload.get("deduction_records", []) or []
        if str(record.get("status", "Active")) == "Active"
        and str(record.get("start_date", "")) <= end_date
        and str(record.get("end_date", record.get("start_date", ""))) >= start_date
    ]
    for record in sorted(deduction_rows, key=lambda item: (item.get("employee_kind", ""), item.get("start_date", ""), item.get("emp_code", ""))):
        deduction_sheet.append([
            "เบี้ยขยัน" if record.get("deduction_type") == "attendance_bonus" else "รายการหัก",
            "พนักงานเหมาเวลา" if record.get("employee_kind") == "time" else "พนักงานเหมาน้ำหนัก",
            record.get("start_date", ""),
            record.get("end_date", ""),
            record.get("emp_code", ""),
            record.get("employee_name", ""),
            record.get("deduction_label", ""),
            safe_float(record.get("amount")),
            record.get("note", ""),
            record.get("created_by", ""),
        ])
    style_table(deduction_sheet, 1)
    autosize(deduction_sheet)

    for sheet_obj in workbook.worksheets:
        sheet_obj.freeze_panes = "A2"
        sheet_obj.page_setup.paperSize = sheet_obj.PAPERSIZE_A4
        sheet_obj.page_setup.orientation = "landscape"

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def time_receipt_groups(payload: dict) -> list[dict]:
    start_date, end_date = normalized_range(payload)
    department = payload.get("department") or "all"
    records = [
        record
        for record in payload.get("time_records", [])
        if start_date <= (record.get("record_date") or "") <= end_date
        and (department == "all" or record.get("department") == department)
    ]
    daily_wage = float(payload.get("daily_wage", 347) or 347)
    standard_hours = float(payload.get("standard_hours", 8) or 8)
    normal_rate = daily_wage / standard_hours
    ot_rate = float(payload.get("ot_hourly_rate", 50) or 50)
    daily_records: dict[tuple[str, str], dict] = {}
    for record in sorted(records, key=lambda item: (item.get("record_date", ""), item.get("clock_in", ""))):
        key = str(record.get("employee_id") or record.get("emp_code") or record.get("fullname") or "")
        date_key = record.get("record_date", "-")
        daily_key = (key, date_key)
        if daily_key not in daily_records:
            daily_records[daily_key] = {
                **record,
                "clock_ins": [],
                "clock_outs": [],
                "net_minutes": 0.0,
            }
        daily_record = daily_records[daily_key]
        daily_record["clock_ins"].append(record.get("clock_in", "-"))
        daily_record["clock_outs"].append(record.get("clock_out", "-"))
        daily_record["net_minutes"] += float(record.get("net_minutes", 0) or 0)

    groups: dict[str, dict] = {}
    for record in daily_records.values():
        key = str(record.get("employee_id") or record.get("emp_code") or record.get("fullname") or "")
        group = groups.setdefault(
            key,
            {
                "employee_id": record.get("employee_id"),
                "emp_code": record.get("emp_code", "-"),
                "fullname": record.get("fullname", "-"),
                "department": record.get("department", "-"),
                "rows": [],
                "normal_hours": 0.0,
                "ot_hours": 0.0,
                "normal_amount": 0.0,
                "ot_amount": 0.0,
                "deduction_amount": 0.0,
                "deductions": [],
                "bonus_amount": 0.0,
                "bonuses": [],
            },
        )
        net_minutes = float(record.get("net_minutes", 0) or 0)
        normal_minutes = min(net_minutes, standard_hours * 60)
        ot_minutes = max(0, net_minutes - normal_minutes)
        normal_hours = normal_minutes / 60
        ot_hours = ot_minutes / 60
        record_daily_wage = float(record.get("daily_wage") or daily_wage)
        record_normal_rate = float(record.get("normal_hourly_rate") or (record_daily_wage / standard_hours))
        record_ot_rate = float(record.get("ot_hourly_rate") or ot_rate)
        # The factory wage table rounds each day's proportional normal wage
        # to the nearest whole baht (0.50 rounds up) before employee totals.
        rounded_half_hour = round(normal_hours * 2) / 2
        if int(record_daily_wage) == TIME_SPECIAL_DAILY_WAGE and rounded_half_hour in TIME_SPECIAL_WAGE_TABLE:
            normal_amount = TIME_SPECIAL_WAGE_TABLE[rounded_half_hour]
        elif normal_hours >= standard_hours:
            normal_amount = record_daily_wage
        else:
            normal_amount = math.floor((normal_hours * record_normal_rate) + 0.5)
        ot_amount = ot_hours * record_ot_rate
        group["normal_hours"] += normal_hours
        group["ot_hours"] += ot_hours
        group["normal_amount"] += normal_amount
        group["ot_amount"] += ot_amount
        group["rows"].append(
            {
                "date": record.get("record_date", "-"),
                "clock_in": " / ".join(record.get("clock_ins", [])),
                "clock_out": " / ".join(record.get("clock_outs", [])),
                "normal_hours": normal_hours,
                "ot_hours": ot_hours,
                "normal_amount": normal_amount,
                "ot_amount": ot_amount,
                "total_amount": normal_amount + ot_amount,
            }
        )
    for group in groups.values():
        group["rows"].sort(key=lambda item: (item["date"], item["clock_in"]))
        group["deductions"] = deduction_records_for(
            payload,
            "time",
            group.get("employee_id"),
            group.get("emp_code"),
            start_date,
            end_date,
        )
        group["deduction_amount"] = deduction_total(group["deductions"])
        group["bonuses"] = bonus_records_for(
            payload,
            "time",
            group.get("employee_id"),
            group.get("emp_code"),
            start_date,
            end_date,
        )
        group["bonus_amount"] = deduction_total(group["bonuses"])
        group["gross_amount"] = group["normal_amount"] + group["ot_amount"]
        group["total_amount"] = max(0, group["gross_amount"] + group["bonus_amount"] - group["deduction_amount"])
    return sorted(groups.values(), key=lambda item: (str(item["emp_code"]), str(item["fullname"])))


def build_time_receipts_pdf(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    groups = time_receipt_groups(payload)
    printed_by = payload.get("printed_by") or "System Admin"
    printed_by_position = payload.get("printed_by_position") or ""
    printed_by_text = f"{printed_by} {printed_by_position}".strip()
    now = datetime.now()
    buffer = BytesIO()
    page_width, page_height = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    logo_path = Path(__file__).with_name("assets") / "pitsamai-logo.png"
    margin = 8 * mm
    gap = 7 * mm
    divider_x = page_width / 2
    panel_width = (page_width - (margin * 2) - gap) / 2
    panel_height = page_height - (margin * 2)

    def text(x, y, value, size=8, bold=False, fill="#111827"):
        c.setFillColor(colors.HexColor(fill))
        c.setFont(THAI_FONT_BOLD if bold else THAI_FONT, size)
        c.drawString(x, y, str(value))

    def right_text(x, y, value, size=8, bold=False, fill="#111827"):
        c.setFillColor(colors.HexColor(fill))
        c.setFont(THAI_FONT_BOLD if bold else THAI_FONT, size)
        c.drawRightString(x, y, str(value))

    def draw_panel(x, y, group, is_copy=False):
        c.setStrokeColor(colors.HexColor("#0F7A3D"))
        c.setLineWidth(1)
        c.roundRect(x, y, panel_width, panel_height, 6, stroke=1, fill=0)
        if is_copy:
            c.saveState()
            c.translate(x + panel_width / 2, y + panel_height / 2)
            c.rotate(30)
            c.setFillColor(colors.Color(0.06, 0.48, 0.24, alpha=0.08))
            c.setFont(THAI_FONT_BOLD, 58)
            c.drawCentredString(0, 0, "สำเนา")
            c.restoreState()

        cursor_y = y + panel_height - 12 * mm
        if logo_path.exists():
            try:
                c.drawImage(str(logo_path), x + 5 * mm, cursor_y - 3 * mm, width=17 * mm, height=17 * mm, preserveAspectRatio=True, mask="auto")
            except Exception:
                pass
        text(x + 25 * mm, cursor_y + 6 * mm, COMPANY_NAME, 11, True, "#0F7A3D")
        text(x + 25 * mm, cursor_y, "ใบเสร็จเวลาและค่าแรง", 10, True, "#0F7A3D")
        text(x + 25 * mm, cursor_y - 5 * mm, "ต้นฉบับ" if not is_copy else "สำเนา", 8, True, "#667085")
        c.setStrokeColor(colors.HexColor("#B8D8D1"))
        c.line(x + 5 * mm, cursor_y - 9 * mm, x + panel_width - 5 * mm, cursor_y - 9 * mm)

        meta_y = cursor_y - 17 * mm
        text(x + 5 * mm, meta_y, f"เลขที่: TR-{start_date.replace('-', '')}-{group['emp_code']}", 7.5, True)
        text(x + 5 * mm, meta_y - 5 * mm, f"ช่วงวันที่: {start_date} - {end_date}", 7.5)
        right_text(x + panel_width - 5 * mm, meta_y, f"ออกโดย: {printed_by_text}", 7.5)
        right_text(x + panel_width - 5 * mm, meta_y - 5 * mm, now.strftime("%d/%m/%Y %H:%M"), 7.5)

        employee_y = meta_y - 15 * mm
        text(x + 5 * mm, employee_y, f"รหัสพนักงาน: {group['emp_code']}", 8, True)
        text(x + 48 * mm, employee_y, f"ชื่อ: {group['fullname']}", 8, True)
        text(x + 5 * mm, employee_y - 5 * mm, f"แผนก: {group['department']}", 8)

        table_y = employee_y - 13 * mm
        col_widths = [20, 13, 13, 16, 13, 19, 17, 18]
        headers = ["วันที่", "เข้า", "ออก", "ปกติ", "OT", "เงินปกติ", "เงิน OT", "รวม"]
        c.setFillColor(colors.HexColor("#0F7A3D"))
        c.rect(x + 5 * mm, table_y, panel_width - 10 * mm, 7 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont(THAI_FONT_BOLD, 6.5)
        col_x = x + 6 * mm
        for header, width in zip(headers, col_widths):
            c.drawString(col_x, table_y + 2.2 * mm, header)
            col_x += width * mm

        row_y = table_y - 6 * mm
        c.setFont(THAI_FONT, 6.2)
        c.setFillColor(colors.HexColor("#111827"))
        for row in group["rows"][:10]:
            c.setStrokeColor(colors.HexColor("#D8E5E1"))
            c.line(x + 5 * mm, row_y - 1 * mm, x + panel_width - 5 * mm, row_y - 1 * mm)
            values = [
                row["date"],
                row["clock_in"],
                row["clock_out"],
                report_number(row["normal_hours"]),
                report_number(row["ot_hours"]),
                report_number(row["normal_amount"], 0),
                report_number(row["ot_amount"], 0),
                report_number(row["total_amount"], 0),
            ]
            col_x = x + 6 * mm
            for value, width in zip(values, col_widths):
                c.drawString(col_x, row_y + 1 * mm, str(value))
                col_x += width * mm
            row_y -= 5.5 * mm
        if len(group["rows"]) > 10:
            text(x + 6 * mm, row_y + 1 * mm, f"มีรายการเพิ่มเติม {len(group['rows']) - 10} รายการ รวมอยู่ในยอดด้านล่าง", 6.2, False, "#667085")

        summary_y = y + 35 * mm
        c.setFillColor(colors.HexColor("#E9F5EE"))
        c.roundRect(x + 5 * mm, summary_y, panel_width - 10 * mm, 18 * mm, 4, stroke=0, fill=1)
        text(x + 8 * mm, summary_y + 12 * mm, f"ชั่วโมงปกติ {report_number(group['normal_hours'])} ชม.", 7.5, True, "#064E25")
        text(x + 8 * mm, summary_y + 7 * mm, f"OT {report_number(group['ot_hours'])} ชม.", 7.5, True, "#064E25")
        text(x + 55 * mm, summary_y + 12 * mm, f"เงินปกติ {report_number(group['normal_amount'], 0)} บาท", 7.5, True, "#064E25")
        text(x + 55 * mm, summary_y + 7 * mm, f"เงิน OT {report_number(group['ot_amount'], 0)} บาท", 7.5, True, "#064E25")
        right_text(x + panel_width - 8 * mm, summary_y + 12 * mm, f"รวม {report_number(group.get('gross_amount', group['total_amount']), 0)} บาท", 8, True, "#064E25")
        right_text(x + panel_width - 8 * mm, summary_y + 7 * mm, f"เบี้ยขยัน {report_number(group.get('bonus_amount', 0), 0)} | หัก {report_number(group.get('deduction_amount', 0), 0)} บาท", 7.2, True, "#166534")
        right_text(x + panel_width - 8 * mm, summary_y + 2 * mm, f"สุทธิ {report_number(group['total_amount'], 0)} บาท", 10.5, True, "#064E25")

        deduction_y = y + 28 * mm
        if group.get("deductions"):
            text(x + 6 * mm, deduction_y, "รายการหัก", 6.6, True, "#B42318")
            for index, deduction in enumerate(group.get("deductions", [])[:3]):
                text(
                    x + 26 * mm,
                    deduction_y - (index * 4 * mm),
                    f"{deduction.get('deduction_label', '-')} {report_number(deduction.get('amount'), 0)} บาท",
                    6.3,
                    False,
                    "#7A271A",
                )

        sign_y = y + 12 * mm
        c.setStrokeColor(colors.HexColor("#111827"))
        c.line(x + 14 * mm, sign_y + 5 * mm, x + 54 * mm, sign_y + 5 * mm)
        c.line(x + panel_width - 54 * mm, sign_y + 5 * mm, x + panel_width - 14 * mm, sign_y + 5 * mm)
        text(x + 25 * mm, sign_y, "ผู้รับเงิน", 7, False)
        text(x + panel_width - 43 * mm, sign_y, "ผู้จ่ายเงิน", 7, False)

    if not groups:
        groups = [{"emp_code": "-", "fullname": "-", "department": "-", "rows": [], "normal_hours": 0, "ot_hours": 0, "normal_amount": 0, "ot_amount": 0, "deduction_amount": 0, "deductions": [], "bonus_amount": 0, "bonuses": [], "gross_amount": 0, "total_amount": 0}]

    for group in groups:
        draw_panel(margin, margin, group, False)
        c.setDash(3, 3)
        c.setStrokeColor(colors.HexColor("#667085"))
        c.line(divider_x, margin, divider_x, page_height - margin)
        c.setDash()
        draw_panel(divider_x + gap / 2, margin, group, True)
        c.showPage()

    c.save()
    return buffer.getvalue()


def safe_float(value: float | int | str | None) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def production_grade_weights(record: dict) -> dict[str, float]:
    source = record.get("grade_weights") if isinstance(record.get("grade_weights"), dict) else {}
    return {grade: safe_float(source.get(grade, source.get(grade.lower(), 0))) for grade in DURIAN_GRADES}


def production_grade_total(record: dict) -> float:
    return sum(production_grade_weights(record).values())


def production_total_weight(record: dict) -> float:
    if (record.get("fruit_type") or "mangosteen") == "durian":
        return production_grade_total(record)
    explicit = record.get("total_weight")
    if explicit not in [None, ""] and safe_float(explicit) > 0:
        return safe_float(explicit)
    return safe_float(record.get("water_weight", record.get("water", 0))) + safe_float(record.get("flower_weight", record.get("flower", 0)))


def production_grade_text(record: dict) -> str:
    weights = production_grade_weights(record)
    return " | ".join(f"{grade} {report_number(weights[grade])}" for grade in DURIAN_GRADES)


def grade_totals_text(weights: dict | None) -> str:
    source = weights if isinstance(weights, dict) else {}
    return " | ".join(f"{grade} {report_number(source.get(grade, 0))}" for grade in DURIAN_GRADES)


def minutes_text(value: float | int | str | None) -> str:
    minutes = int(round(safe_float(value)))
    hours, remain = divmod(minutes, 60)
    return f"{hours} ชม. {remain} นาที"


def is_late_time(value: str | None) -> bool:
    if not value:
        return False
    try:
        hour, minute = [int(part) for part in str(value).split(":")[:2]]
        return hour * 60 + minute > 8 * 60
    except (TypeError, ValueError):
        return False


def is_early_out_time(value: str | None) -> bool:
    if not value:
        return False
    try:
        hour, minute = [int(part) for part in str(value).split(":")[:2]]
        return hour * 60 + minute < 17 * 60
    except (TypeError, ValueError):
        return False


def filtered_production_records(payload: dict) -> list[dict]:
    start_date, end_date = normalized_range(payload)
    return sorted(
        [
            record
            for record in payload.get("production_records", [])
            if start_date <= (record.get("record_date") or record.get("date") or "") <= end_date
        ],
        key=lambda record: (
            record.get("record_date") or record.get("date") or "",
            record.get("record_time", ""),
            str(record.get("pile_no") or record.get("pile") or ""),
            str(record.get("emp_code") or ""),
        ),
    )


def filtered_time_records(payload: dict) -> list[dict]:
    start_date, end_date = normalized_range(payload)
    department = payload.get("department") or "all"
    return sorted(
        [
            record
            for record in payload.get("time_records", [])
            if start_date <= (record.get("record_date") or "") <= end_date
            and (department == "all" or record.get("department") == department)
        ],
        key=lambda record: (
            record.get("record_date", ""),
            str(record.get("emp_code") or ""),
            record.get("clock_in", ""),
        ),
    )


def export_meta_text(payload: dict) -> str:
    printed_by = payload.get("printed_by") or "System Admin"
    printed_by_position = payload.get("printed_by_position") or ""
    print_date, print_time = format_report_datetime(datetime.now())
    return f"ออกโดย {printed_by} {printed_by_position} | วันที่ {print_date} | เวลา {print_time}".strip()


def add_excel_logo(sheet, cell: str = "H1") -> None:
    logo_path = Path(__file__).with_name("assets") / "pitsamai-logo.png"
    if not logo_path.exists():
        return
    try:
        logo = ExcelImage(str(logo_path))
        logo.width = 72
        logo.height = 72
        sheet.add_image(logo, cell)
    except Exception:
        pass


def style_excel_report_sheet(sheet, header_rows: list[int], widths: list[int]) -> None:
    font_name = "Sarabun"
    green_fill = PatternFill("solid", fgColor="0F7A3D")
    zebra_fill = PatternFill("solid", fgColor="F7FAF8")
    thin_gray = Side(style="thin", color="CDD6DF")
    table_border = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)
    for header_row in header_rows:
        for cell in sheet[header_row]:
            if cell.value is None:
                continue
            cell.fill = green_fill
            cell.font = Font(name=font_name, bold=True, color="FFFFFF", size=10)
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = table_border
    for row_index, row in enumerate(sheet.iter_rows(), start=1):
        if row_index in header_rows or row_index < min(header_rows, default=1):
            continue
        for cell in row:
            if cell.value is None:
                continue
            cell.font = Font(name=font_name, size=10)
            cell.border = table_border
            cell.alignment = Alignment(vertical="center", wrap_text=True)
            if isinstance(cell.value, (int, float)):
                cell.number_format = "#,##0.00"
                cell.alignment = Alignment(horizontal="right", vertical="center")
            if row_index % 2 == 0:
                cell.fill = zebra_fill
    for index, width in enumerate(widths, start=1):
        sheet.column_dimensions[get_column_letter(index)].width = width
    sheet.page_setup.paperSize = sheet.PAPERSIZE_A4
    sheet.page_setup.orientation = "landscape"
    sheet.freeze_panes = f"A{max(header_rows) + 1}" if header_rows else None


def build_production_summary_excel(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    records = filtered_production_records(payload)
    rows = pile_summary_rows(records)
    totals = summary_totals(rows)
    total_records = len(records)
    employee_count = len({record.get("employee_id") or record.get("emp_code") or record.get("employee_name") for record in records})

    workbook = Workbook()
    overview = workbook.active
    overview.title = "Production Summary"
    overview.merge_cells("A1:G1")
    overview["A1"] = COMPANY_NAME
    overview["A1"].font = Font(name="Sarabun", bold=True, size=18, color="0F7A3D")
    overview.merge_cells("A2:G2")
    overview["A2"] = "รายงานสรุปผลผลิตและน้ำหนัก"
    overview["A2"].font = Font(name="Sarabun", bold=True, size=16, color="111827")
    overview.merge_cells("A3:G3")
    overview["A3"] = f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)}"
    overview.merge_cells("A4:G4")
    overview["A4"] = export_meta_text(payload)
    add_excel_logo(overview, "H1")
    overview.append([])
    overview.append(["หัวข้อ", "ค่า"])
    overview.append(["จำนวนรายการ", total_records])
    overview.append(["จำนวนพนักงาน", employee_count])
    overview.append(["น้ำหนักเข้า", totals["incoming"]])
    overview.append(["น้ำหนักออก", totals["outgoing"]])
    overview.append(["น้ำหนักคงเหลือ", totals["balance"]])
    overview.append(["ยอดเงินรวม", totals["amount"]])
    style_excel_report_sheet(overview, [6], [28, 22, 14, 14, 14, 14, 14, 14])

    pile_sheet = workbook.create_sheet("Pile Summary")
    pile_sheet.append(["กอง", "น้ำหนักเข้า", "น้ำหนักออก", "น้ำหนักคงเหลือ", "ยอดเงิน"])
    for row in rows:
        pile_sheet.append([row["pile"], row["incoming"], row["outgoing"], row["balance"], row["amount"]])
    pile_sheet.append(["รวม", totals["incoming"], totals["outgoing"], totals["balance"], totals["amount"]])
    style_excel_report_sheet(pile_sheet, [1], [18, 18, 18, 18, 18])

    detail_sheet = workbook.create_sheet("Details")
    detail_sheet.append(["วันที่", "เวลา", "รหัสพนักงาน", "ชื่อพนักงาน", "สินค้า", "กอง", "น้ำหนักน้ำ", "น้ำหนักดอก", "ยอดเงิน", "ผู้บันทึก"])
    for record in records:
        detail_sheet.append(
            [
                record.get("record_date") or record.get("date") or "",
                record.get("record_time", ""),
                record.get("emp_code", ""),
                record.get("employee_name", ""),
                record.get("fruit_type", ""),
                record.get("pile_no") or record.get("pile", ""),
                safe_float(record.get("water_weight", record.get("water", 0))),
                safe_float(record.get("flower_weight", record.get("flower", 0))),
                safe_float(record.get("total_amount", record.get("grand_total", 0))),
                record.get("created_by", ""),
            ]
        )
    style_excel_report_sheet(detail_sheet, [1], [14, 12, 16, 24, 16, 10, 14, 14, 14, 20])

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def pdf_styles() -> tuple:
    styles = getSampleStyleSheet()
    for style_name in ["Title", "Heading1", "Heading2", "Normal", "BodyText"]:
        styles[style_name].fontName = THAI_FONT
    title = styles["Title"].clone("PismaiReportTitle")
    title.fontName = THAI_FONT_BOLD
    title.fontSize = 17
    title.leading = 22
    title.textColor = colors.HexColor(BRAND_GREEN)
    normal = styles["Normal"].clone("PismaiReportNormal")
    normal.fontName = THAI_FONT
    normal.fontSize = 9
    normal.leading = 12
    section = styles["Heading2"].clone("PismaiReportSection")
    section.fontName = THAI_FONT_BOLD
    section.fontSize = 12
    section.leading = 16
    section.textColor = colors.HexColor(BRAND_GREEN)
    return styles, title, normal, section


def report_header_story(title_text: str, subtitle: str, payload: dict, page_width_mm: int = 267) -> list:
    _, title, normal, _ = pdf_styles()
    logo_path = Path(__file__).with_name("assets") / "pitsamai-logo.png"
    logo = Image(str(logo_path), width=20 * mm, height=20 * mm) if logo_path.exists() else Paragraph("SP", title)
    title_block = [Paragraph(COMPANY_NAME, normal), Paragraph(title_text, title), Paragraph(subtitle, normal)]
    meta = Paragraph(export_meta_text(payload), normal)
    header = Table([[logo, title_block, meta]], colWidths=[24 * mm, (page_width_mm - 94) * mm, 70 * mm])
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    line = Table([[""]], colWidths=[page_width_mm * mm], rowHeights=[1 * mm])
    line.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(BRAND_GREEN))]))
    return [header, Spacer(1, 5 * mm), line, Spacer(1, 7 * mm)]


def set_pdf_table_style(table: Table, numeric_from: int = 1) -> None:
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(BRAND_GREEN)),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), THAI_FONT_BOLD),
                ("FONTNAME", (0, 1), (-1, -1), THAI_FONT),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (numeric_from, 1), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CDD6DF")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAF8")]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )


def build_production_summary_pdf(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    records = filtered_production_records(payload)
    pile_rows = pile_summary_rows(records)
    totals = summary_totals(pile_rows)
    employee_count = len({record.get("employee_id") or record.get("emp_code") or record.get("employee_name") for record in records})
    _, _, _, section = pdf_styles()
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
    )
    story = report_header_story(
        "รายงานสรุปผลผลิตและน้ำหนัก",
        f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)}",
        payload,
    )
    overview = Table(
        [
            ["จำนวนรายการ", "จำนวนพนักงาน", "น้ำหนักเข้า", "น้ำหนักออก", "คงเหลือ", "ยอดเงินรวม"],
            [
                report_number(len(records), 0),
                report_number(employee_count, 0),
                report_number(totals["incoming"]),
                report_number(totals["outgoing"]),
                report_number(totals["balance"]),
                money(totals["amount"]),
            ],
        ],
        colWidths=[35 * mm, 35 * mm, 42 * mm, 42 * mm, 42 * mm, 42 * mm],
    )
    set_pdf_table_style(overview, 0)
    story += [Paragraph("ภาพรวม", section), overview, Spacer(1, 7 * mm)]

    pile_table_rows = [["กอง", "น้ำหนักเข้า", "น้ำหนักออก", "คงเหลือ", "ยอดเงิน"]]
    for row in pile_rows:
        pile_table_rows.append([row["pile"], report_number(row["incoming"]), report_number(row["outgoing"]), report_number(row["balance"]), money(row["amount"])])
    if len(pile_table_rows) == 1:
        pile_table_rows.append(["-", "0", "0", "0", "0"])
    pile_table_rows.append(["รวม", report_number(totals["incoming"]), report_number(totals["outgoing"]), report_number(totals["balance"]), money(totals["amount"])])
    pile_table = Table(pile_table_rows, repeatRows=1, colWidths=[45 * mm, 48 * mm, 48 * mm, 48 * mm, 48 * mm])
    set_pdf_table_style(pile_table)
    story += [Paragraph("สรุปตามกอง", section), pile_table, Spacer(1, 7 * mm)]

    detail_rows = [["วันที่", "เวลา", "รหัส", "ชื่อพนักงาน", "สินค้า", "กอง", "น้ำหนักน้ำ", "น้ำหนักดอก", "ยอดเงิน"]]
    for record in records[:80]:
        detail_rows.append(
            [
                format_report_date(record.get("record_date") or record.get("date") or ""),
                record.get("record_time", ""),
                record.get("emp_code", ""),
                record.get("employee_name", ""),
                record.get("fruit_type", ""),
                record.get("pile_no") or record.get("pile", ""),
                report_number(record.get("water_weight", record.get("water", 0))),
                report_number(record.get("flower_weight", record.get("flower", 0))),
                money(record.get("total_amount", record.get("grand_total", 0))),
            ]
        )
    detail_table = Table(detail_rows, repeatRows=1, colWidths=[24 * mm, 18 * mm, 22 * mm, 45 * mm, 26 * mm, 14 * mm, 30 * mm, 30 * mm, 28 * mm])
    set_pdf_table_style(detail_table, 6)
    story += [Paragraph("รายละเอียดรายการ", section), detail_table]
    doc.build(story)
    return buffer.getvalue()


def selected_export_sections(payload: dict) -> dict:
    sections = payload.get("export_sections") or {}
    return {
        "overview": bool(sections.get("overview", True)),
        "piles": bool(sections.get("piles", True)),
        "details": bool(sections.get("details", True)),
    }


def selected_export_fields(payload: dict, section: str, definitions: list[tuple[str, str, object]]) -> list[tuple[str, str, object]]:
    fields = payload.get("export_fields") or {}
    section_fields = fields.get(section) or {}
    if not section_fields:
        return definitions
    return [definition for definition in definitions if bool(section_fields.get(definition[0]))]


def employee_name_for_record(payload: dict, record: dict) -> str:
    if record.get("employee_name"):
        return str(record.get("employee_name"))
    employees = payload.get("employees") or []
    employee_id = record.get("employee_id")
    for employee in employees:
        if employee.get("id") == employee_id or str(employee.get("emp_code")) == str(record.get("emp_code")):
            return str(employee.get("fullname") or "")
    return ""


def production_summary_context(payload: dict) -> tuple[str, str, list[dict], list[dict], dict, int]:
    start_date, end_date = normalized_range(payload)
    records = filtered_production_records(payload)
    pile_rows = pile_summary_rows(records)
    totals = summary_totals(pile_rows)
    total_weight = totals["total_weight"]
    totals = {**totals, "total_weight": total_weight}
    employee_count = len(
        {record.get("employee_id") or record.get("emp_code") or record.get("employee_name") for record in records}
    )
    return start_date, end_date, records, pile_rows, totals, employee_count


def build_production_summary_excel(payload: dict) -> bytes:
    start_date, end_date, records, pile_rows, totals, employee_count = production_summary_context(payload)
    sections = selected_export_sections(payload)
    workbook = Workbook()
    overview = workbook.active
    overview.title = "Production Summary"
    overview.merge_cells("A1:G1")
    overview["A1"] = COMPANY_NAME
    overview["A1"].font = Font(name="Sarabun", bold=True, size=18, color="0F7A3D")
    overview.merge_cells("A2:G2")
    overview["A2"] = "รายงานสรุปผลผลิตและน้ำหนัก"
    overview["A2"].font = Font(name="Sarabun", bold=True, size=16, color="111827")
    overview.merge_cells("A3:G3")
    overview["A3"] = f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)}"
    overview.merge_cells("A4:G4")
    overview["A4"] = export_meta_text(payload)
    add_excel_logo(overview, "H1")

    overview_fields = selected_export_fields(
        payload,
        "overview",
        [
            ("totalWeight", "น้ำหนักรวมทั้งหมด (กก.)", totals["total_weight"]),
            ("water", "น้ำหนักน้ำ (กก.)", totals["incoming"]),
            ("flower", "น้ำหนักดอก (กก.)", totals["outgoing"]),
            ("grades", "ทุเรียนเกรด A-E", grade_totals_text(totals.get("grades"))),
            ("amount", "ยอดเงินรวม", totals["amount"]),
            ("employees", "พนักงานที่มีรายการ", employee_count),
            ("records", "จำนวนรายการ", len(records)),
        ],
    )
    overview.append([])
    if sections["overview"] and overview_fields:
        overview.append(["หัวข้อ", "ค่า"])
        for _, label, value in overview_fields:
            overview.append([label, value])
        style_excel_report_sheet(overview, [6], [30, 22, 14, 14, 14, 14, 14, 14])

    if sections["piles"]:
        pile_defs = selected_export_fields(
            payload,
            "piles",
            [
                ("pile", "กอง", lambda row: row["pile"]),
                ("water", "น้ำหนักน้ำ (กก.)", lambda row: row["incoming"]),
                ("flower", "น้ำหนักดอก (กก.)", lambda row: row["outgoing"]),
                ("grades", "ทุเรียนเกรด A-E", lambda row: grade_totals_text(row.get("grades"))),
                ("total", "รวม (กก.)", lambda row: row.get("total_weight", row["incoming"] + row["outgoing"])),
                ("amount", "รวมเงิน", lambda row: row["amount"]),
            ],
        )
        if pile_defs:
            pile_sheet = workbook.create_sheet("Pile Summary")
            pile_sheet.append([label for _, label, _ in pile_defs])
            for row in pile_rows:
                pile_sheet.append([getter(row) for _, _, getter in pile_defs])
            total_row = {
                "pile": "รวม",
                "incoming": totals["incoming"],
                "outgoing": totals["outgoing"],
                "grades": totals.get("grades", {}),
                "total_weight": totals["total_weight"],
                "amount": totals["amount"],
            }
            pile_sheet.append([getter(total_row) for _, _, getter in pile_defs])
            style_excel_report_sheet(pile_sheet, [1], [18] * max(1, len(pile_defs)))

    if sections["details"]:
        detail_defs = selected_export_fields(
            payload,
            "details",
            [
                ("date", "วันที่", lambda record: record.get("record_date") or record.get("date") or ""),
                ("time", "เวลา", lambda record: record.get("record_time", "")),
                ("empCode", "รหัสพนักงาน", lambda record: record.get("emp_code", "")),
                ("employeeName", "ชื่อพนักงาน", lambda record: employee_name_for_record(payload, record)),
                ("pile", "กอง", lambda record: record.get("pile_no") or record.get("pile", "")),
                ("water", "น้ำหนักน้ำ (กก.)", lambda record: safe_float(record.get("water_weight", record.get("water", 0)))),
                ("flower", "น้ำหนักดอก (กก.)", lambda record: safe_float(record.get("flower_weight", record.get("flower", 0)))),
                ("grades", "ทุเรียนเกรด A-E", lambda record: production_grade_text(record) if (record.get("fruit_type") or "mangosteen") == "durian" else "-"),
                ("total", "น้ำหนักรวม (กก.)", lambda record: production_total_weight(record)),
                ("amount", "รวมเงิน", lambda record: safe_float(record.get("total_amount", record.get("grand_total", 0)))),
                ("createdBy", "ผู้บันทึก", lambda record: record.get("created_by", "")),
            ],
        )
        if detail_defs:
            detail_sheet = workbook.create_sheet("Details")
            detail_sheet.append([label for _, label, _ in detail_defs])
            for record in records:
                detail_sheet.append([getter(record) for _, _, getter in detail_defs])
            style_excel_report_sheet(detail_sheet, [1], [16] * max(1, len(detail_defs)))

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def build_production_summary_pdf(payload: dict) -> bytes:
    start_date, end_date, records, pile_rows, totals, employee_count = production_summary_context(payload)
    sections = selected_export_sections(payload)
    _, _, _, section = pdf_styles()
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
    )
    story = report_header_story(
        "รายงานสรุปผลผลิตและน้ำหนัก",
        f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)}",
        payload,
    )

    overview_fields = selected_export_fields(
        payload,
        "overview",
        [
            ("totalWeight", "น้ำหนักรวมทั้งหมด (กก.)", report_number(totals["total_weight"])),
            ("water", "น้ำหนักน้ำ (กก.)", report_number(totals["incoming"])),
            ("flower", "น้ำหนักดอก (กก.)", report_number(totals["outgoing"])),
            ("grades", "ทุเรียนเกรด A-E", grade_totals_text(totals.get("grades"))),
            ("amount", "ยอดเงินรวม", money(totals["amount"])),
            ("employees", "พนักงานที่มีรายการ", report_number(employee_count, 0)),
            ("records", "จำนวนรายการ", report_number(len(records), 0)),
        ],
    )
    if sections["overview"] and overview_fields:
        overview = Table(
            [["หัวข้อ", "ค่า"], *[[label, value] for _, label, value in overview_fields]],
            colWidths=[78 * mm, 45 * mm],
        )
        set_pdf_table_style(overview, 1)
        story += [Paragraph("ภาพรวม", section), overview, Spacer(1, 7 * mm)]

    if sections["piles"]:
        pile_defs = selected_export_fields(
            payload,
            "piles",
            [
                ("pile", "กอง", lambda row: row["pile"]),
                ("water", "น้ำหนักน้ำ (กก.)", lambda row: report_number(row["incoming"])),
                ("flower", "น้ำหนักดอก (กก.)", lambda row: report_number(row["outgoing"])),
                ("grades", "ทุเรียนเกรด A-E", lambda row: grade_totals_text(row.get("grades"))),
                ("total", "รวม (กก.)", lambda row: report_number(row.get("total_weight", row["incoming"] + row["outgoing"]))),
                ("amount", "รวมเงิน", lambda row: money(row["amount"])),
            ],
        )
        if pile_defs:
            pile_table_rows = [[label for _, label, _ in pile_defs]]
            for row in pile_rows:
                pile_table_rows.append([getter(row) for _, _, getter in pile_defs])
            total_row = {"pile": "รวม", "incoming": totals["incoming"], "outgoing": totals["outgoing"], "grades": totals.get("grades", {}), "total_weight": totals["total_weight"], "amount": totals["amount"]}
            pile_table_rows.append([getter(total_row) for _, _, getter in pile_defs])
            col_width = (267 / len(pile_defs)) * mm
            pile_table = Table(pile_table_rows, repeatRows=1, colWidths=[col_width] * len(pile_defs))
            set_pdf_table_style(pile_table, 1)
            story += [Paragraph("สรุปตามกอง", section), pile_table, Spacer(1, 7 * mm)]

    if sections["details"]:
        detail_defs = selected_export_fields(
            payload,
            "details",
            [
                ("date", "วันที่", lambda record: format_report_date(record.get("record_date") or record.get("date") or "")),
                ("time", "เวลา", lambda record: record.get("record_time", "")),
                ("empCode", "รหัสพนักงาน", lambda record: record.get("emp_code", "")),
                ("employeeName", "ชื่อพนักงาน", lambda record: employee_name_for_record(payload, record)),
                ("pile", "กอง", lambda record: record.get("pile_no") or record.get("pile", "")),
                ("water", "น้ำหนักน้ำ (กก.)", lambda record: report_number(record.get("water_weight", record.get("water", 0)))),
                ("flower", "น้ำหนักดอก (กก.)", lambda record: report_number(record.get("flower_weight", record.get("flower", 0)))),
                ("grades", "ทุเรียนเกรด A-E", lambda record: production_grade_text(record) if (record.get("fruit_type") or "mangosteen") == "durian" else "-"),
                ("total", "น้ำหนักรวม (กก.)", lambda record: report_number(production_total_weight(record))),
                ("amount", "รวมเงิน", lambda record: money(record.get("total_amount", record.get("grand_total", 0)))),
                ("createdBy", "ผู้บันทึก", lambda record: record.get("created_by", "")),
            ],
        )
        if detail_defs:
            detail_rows = [[label for _, label, _ in detail_defs]]
            for record in records[:100]:
                detail_rows.append([getter(record) for _, _, getter in detail_defs])
            col_width = (267 / len(detail_defs)) * mm
            detail_table = Table(detail_rows, repeatRows=1, colWidths=[col_width] * len(detail_defs))
            set_pdf_table_style(detail_table, max(1, len(detail_defs) - 3))
            story += [Paragraph("รายละเอียดรายการ", section), detail_table]

    if len(story) <= 4:
        story.append(Paragraph("ไม่มีฟิลด์ที่เลือกสำหรับรายงานนี้", section))

    doc.build(story)
    return buffer.getvalue()


def employee_lookup_maps(payload: dict) -> tuple[dict[str, dict], dict[str, dict]]:
    employees = payload.get("employees") or []
    by_id = {str(employee.get("id")): employee for employee in employees}
    by_code = {str(employee.get("emp_code")): employee for employee in employees}
    return by_id, by_code


GROUP_REPORT_PAY_GROUPS = ["เหมาโรงงาน", "เหมา(นนท์)", "เหมาปุ้ย"]
PRODUCTION_WITHHOLDING_TAX_RATE = 0.03
PRODUCTION_WITHHOLDING_TAX_GROUPS = {"เหมา(นนท์)", "เหมาปุ้ย"}
GROUP_REPORT_LEGACY_MAP = {
    "กลุ่ม A": "เหมาโรงงาน",
    "กลุ่ม B": "เหมา(นนท์)",
    "กลุ่ม C": "เหมาปุ้ย",
    "กลุ่ม D": "เหมาปุ้ย",
}


def normalize_group_report_pay_group(value: str) -> str:
    pay_group = str(value or "").strip()
    if pay_group in GROUP_REPORT_LEGACY_MAP:
        return GROUP_REPORT_LEGACY_MAP[pay_group]
    if pay_group in GROUP_REPORT_PAY_GROUPS:
        return pay_group
    return ""


def production_withholding_tax(pay_group: str, amount: float | int | str | None) -> float:
    if normalize_group_report_pay_group(pay_group) not in PRODUCTION_WITHHOLDING_TAX_GROUPS:
        return 0.0
    return round(max(0.0, safe_float(amount)) * PRODUCTION_WITHHOLDING_TAX_RATE + 1e-9, 2)


def production_fruit_id(record: dict) -> str:
    return record.get("fruit_type") or "mangosteen"


def production_fruit_label(payload: dict, fruit_id: str) -> str:
    if fruit_id == "all":
        return "ทั้งหมด"
    labels = {
        "mangosteen": "มังคุด",
        "durian": "ทุเรียน",
        "mango": "มะม่วง",
    }
    return (payload.get("fruit_labels") or {}).get(fruit_id) or labels.get(fruit_id, fruit_id)


def group_report_records(payload: dict) -> list[dict]:
    start_date, end_date = normalized_range(payload)
    selected_group = payload.get("pay_group") or "all"
    selected_fruit = payload.get("fruit_type") or "all"
    by_id, by_code = employee_lookup_maps(payload)
    rows = []
    adjusted_employee_keys = set()
    for record in payload.get("production_records", []):
        record_date = record.get("record_date") or record.get("date") or ""
        if not (start_date <= record_date <= end_date):
            continue
        employee = by_id.get(str(record.get("employee_id") or "")) or by_code.get(str(record.get("emp_code") or ""))
        pay_group = normalize_group_report_pay_group((employee or {}).get("pay_group") or record.get("pay_group"))
        fruit_id = production_fruit_id(record)
        if not pay_group:
            continue
        if selected_group != "all" and pay_group != selected_group:
            continue
        if selected_fruit != "all" and fruit_id != selected_fruit:
            continue
        employee_key = str((employee or {}).get("id") or record.get("employee_id") or record.get("emp_code") or "")
        record_deduction = 0
        record_bonus = 0
        if employee_key and employee_key not in adjusted_employee_keys:
            adjusted_employee_keys.add(employee_key)
            record_deduction = deduction_total(
                deduction_records_for(
                    payload,
                    "production",
                    (employee or {}).get("id") or record.get("employee_id"),
                    (employee or {}).get("emp_code") or record.get("emp_code"),
                    start_date,
                    end_date,
                )
            )
            record_bonus = deduction_total(
                bonus_records_for(
                    payload,
                    "production",
                    (employee or {}).get("id") or record.get("employee_id"),
                    (employee or {}).get("emp_code") or record.get("emp_code"),
                    start_date,
                    end_date,
                )
            )
        rows.append(
            {
                **record,
                "record_date": record_date,
                "employee": employee or {},
                "pay_group": pay_group,
                "fruit_type": fruit_id,
                "fruit_label": production_fruit_label(payload, fruit_id),
                "employee_name": record.get("employee_name") or (employee or {}).get("fullname") or "",
                "deduction_amount": record_deduction,
                "bonus_amount": record_bonus,
            }
        )
    return sorted(rows, key=lambda item: (item["pay_group"], item["fruit_label"], item["record_date"], str(item.get("emp_code", ""))))


def summarize_group_report(records: list[dict], mode: str = "group") -> list[dict]:
    summaries: dict[str, dict] = {}
    for record in records:
        key = record["pay_group"] if mode == "group" else f"{record['pay_group']}__{record['fruit_type']}"
        row = summaries.setdefault(
            key,
            {
                "pay_group": record["pay_group"],
                "fruit_label": record["fruit_label"] if mode == "fruit" else "ทั้งหมด",
                "employees": set(),
                "records": 0,
                "water": 0.0,
                "flower": 0.0,
                "grades": {grade: 0.0 for grade in DURIAN_GRADES},
                "total": 0.0,
                "amount": 0.0,
                "deduction_amount": 0.0,
                "withholding_tax_amount": 0.0,
                "bonus_amount": 0.0,
                "net_amount": 0.0,
            },
        )
        water = safe_float(record.get("water_weight", record.get("water", 0)))
        flower = safe_float(record.get("flower_weight", record.get("flower", 0)))
        row["employees"].add(record.get("employee_id") or record.get("emp_code") or record.get("employee_name") or "")
        row["records"] += 1
        row["water"] += water
        row["flower"] += flower
        grade_weights = production_grade_weights(record)
        for grade in DURIAN_GRADES:
            row["grades"][grade] += grade_weights[grade]
        row["total"] += production_total_weight(record)
        row["amount"] += safe_float(record.get("total_amount", record.get("grand_total", 0)))
        row["deduction_amount"] += safe_float(record.get("deduction_amount"))
        row["bonus_amount"] += safe_float(record.get("bonus_amount"))
        row["withholding_tax_amount"] = production_withholding_tax(row["pay_group"], row["amount"])
        row["net_amount"] = max(
            0,
            row["amount"] + row["bonus_amount"] - row["deduction_amount"] - row["withholding_tax_amount"],
        )
    return sorted(summaries.values(), key=lambda item: (item["pay_group"], item["fruit_label"]))


def group_report_employee_rows(records: list[dict]) -> list[dict]:
    rows: dict[str, dict] = {}
    for record in records:
        key = str(record.get("employee_id") or record.get("emp_code") or record.get("employee_name") or "")
        row = rows.setdefault(
            key,
            {
                "pay_group": record["pay_group"],
                "emp_code": record.get("emp_code") or record.get("employee", {}).get("emp_code") or "-",
                "fullname": record.get("employee_name") or record.get("employee", {}).get("fullname") or "-",
                "records": 0,
                "water": 0.0,
                "flower": 0.0,
                "grades": {grade: 0.0 for grade in DURIAN_GRADES},
                "total": 0.0,
                "amount": 0.0,
                "deduction_amount": 0.0,
                "withholding_tax_amount": 0.0,
                "bonus_amount": 0.0,
                "net_amount": 0.0,
            },
        )
        water = safe_float(record.get("water_weight", record.get("water", 0)))
        flower = safe_float(record.get("flower_weight", record.get("flower", 0)))
        row["records"] += 1
        row["water"] += water
        row["flower"] += flower
        grade_weights = production_grade_weights(record)
        for grade in DURIAN_GRADES:
            row["grades"][grade] += grade_weights[grade]
        row["total"] += production_total_weight(record)
        row["amount"] += safe_float(record.get("total_amount", record.get("grand_total", 0)))
        row["deduction_amount"] += safe_float(record.get("deduction_amount"))
        row["bonus_amount"] += safe_float(record.get("bonus_amount"))
        row["withholding_tax_amount"] = production_withholding_tax(row["pay_group"], row["amount"])
        row["net_amount"] = max(
            0,
            row["amount"] + row["bonus_amount"] - row["deduction_amount"] - row["withholding_tax_amount"],
        )
    return sorted(rows.values(), key=lambda item: (item["pay_group"], item["emp_code"]))


def group_report_options(payload: dict) -> dict:
    options = payload.get("export_options") or {}
    return {
        "summary": bool(options.get("summary", True)),
        "fruit": bool(options.get("fruit", True)),
        "employees": bool(options.get("employees", True)),
        "details": bool(options.get("details", False)),
    }


def build_group_report_excel(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    records = group_report_records(payload)
    options = group_report_options(payload)
    group_rows = summarize_group_report(records, "group")
    fruit_rows = summarize_group_report(records, "fruit")
    employee_rows = group_report_employee_rows(records)
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Group Report"
    sheet.merge_cells("A1:H1")
    sheet["A1"] = COMPANY_NAME
    sheet["A1"].font = Font(name="Sarabun", bold=True, size=18, color="0F7A3D")
    sheet.merge_cells("A2:H2")
    sheet["A2"] = "รายงานแบบกลุ่ม"
    sheet["A2"].font = Font(name="Sarabun", bold=True, size=16, color="111827")
    sheet.merge_cells("A3:H3")
    sheet["A3"] = f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)} | กลุ่ม {payload.get('group_label', 'ทุกกลุ่ม')} | ผลไม้ {payload.get('fruit_label', 'ทั้งหมด')}"
    sheet.merge_cells("A4:H4")
    sheet["A4"] = export_meta_text(payload)
    sheet.append([])
    style_excel_report_sheet(sheet, [1], [18, 18, 18, 18, 18, 18, 18, 18])

    if options["summary"]:
        summary = workbook.create_sheet("Summary By Group")
        summary.append(["กลุ่ม", "จำนวนคน", "รายการ", "น้ำหนักน้ำ", "น้ำหนักดอก", "เกรดทุเรียน A-E", "รวม", "รวมเงิน", "เบี้ยขยัน", "หักทั่วไป", "หัก ณ ที่จ่าย 3%", "สุทธิ"])
        for row in group_rows:
            summary.append([row["pay_group"], len(row["employees"]), row["records"], row["water"], row["flower"], grade_totals_text(row.get("grades")), row["total"], row["amount"], row.get("bonus_amount", 0), row.get("deduction_amount", 0), row.get("withholding_tax_amount", 0), row.get("net_amount", row["amount"])])
        style_excel_report_sheet(summary, [1], [20, 12, 12, 14, 14, 22, 14, 16, 14, 14, 18, 16])

    if options["fruit"]:
        fruit = workbook.create_sheet("Group By Fruit")
        fruit.append(["กลุ่ม", "ผลไม้", "จำนวนคน", "รายการ", "น้ำหนักน้ำ", "น้ำหนักดอก", "เกรดทุเรียน A-E", "รวม", "รวมเงิน", "เบี้ยขยัน", "หักทั่วไป", "หัก ณ ที่จ่าย 3%", "สุทธิ"])
        for row in fruit_rows:
            fruit.append([row["pay_group"], row["fruit_label"], len(row["employees"]), row["records"], row["water"], row["flower"], grade_totals_text(row.get("grades")), row["total"], row["amount"], row.get("bonus_amount", 0), row.get("deduction_amount", 0), row.get("withholding_tax_amount", 0), row.get("net_amount", row["amount"])])
        style_excel_report_sheet(fruit, [1], [20, 16, 12, 12, 14, 14, 22, 14, 16, 14, 14, 18, 16])

    if options["employees"]:
        employees = workbook.create_sheet("Employees")
        employees.append(["กลุ่ม", "รหัส", "ชื่อพนักงาน", "รายการ", "น้ำหนักน้ำ", "น้ำหนักดอก", "เกรดทุเรียน A-E", "รวม", "รวมเงิน", "เบี้ยขยัน", "หักทั่วไป", "หัก ณ ที่จ่าย 3%", "สุทธิ"])
        for row in employee_rows:
            employees.append([row["pay_group"], row["emp_code"], row["fullname"], row["records"], row["water"], row["flower"], grade_totals_text(row.get("grades")), row["total"], row["amount"], row.get("bonus_amount", 0), row.get("deduction_amount", 0), row.get("withholding_tax_amount", 0), row.get("net_amount", row["amount"])])
        style_excel_report_sheet(employees, [1], [20, 14, 26, 12, 14, 14, 22, 14, 16, 14, 14, 18, 16])

    if options["details"]:
        details = workbook.create_sheet("Details")
        details.append(["วันที่", "กลุ่ม", "ผลไม้", "รหัส", "ชื่อพนักงาน", "กอง", "น้ำหนักน้ำ", "น้ำหนักดอก", "เกรดทุเรียน A-E", "น้ำหนักรวม", "รวมเงิน"])
        for record in records:
            details.append([record["record_date"], record["pay_group"], record["fruit_label"], record.get("emp_code", ""), record.get("employee_name", ""), record.get("pile_no") or record.get("pile", ""), safe_float(record.get("water_weight", record.get("water", 0))), safe_float(record.get("flower_weight", record.get("flower", 0))), production_grade_text(record) if record.get("fruit_type") == "durian" else "-", production_total_weight(record), safe_float(record.get("total_amount", record.get("grand_total", 0)))])
        style_excel_report_sheet(details, [1], [14, 20, 16, 14, 26, 10, 14, 14, 16])

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def build_group_report_pdf(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    records = group_report_records(payload)
    options = group_report_options(payload)
    group_rows = summarize_group_report(records, "group")
    fruit_rows = summarize_group_report(records, "fruit")
    employee_rows = group_report_employee_rows(records)
    _, _, pdf_normal, section = pdf_styles()
    grade_style = pdf_normal.clone("GroupReportGradeCell")
    grade_style.fontSize = 6
    grade_style.leading = 7
    grade_style.alignment = 1

    def grade_cell(weights: dict | None):
        values = weights or {}
        if not any(safe_float(values.get(grade)) for grade in DURIAN_GRADES):
            return "-"
        first = " / ".join(f"{grade}:{report_number(values.get(grade), 0)}" for grade in DURIAN_GRADES[:3])
        second = " / ".join(f"{grade}:{report_number(values.get(grade), 0)}" for grade in DURIAN_GRADES[3:])
        return Paragraph(f"{first}<br/>{second}", grade_style)
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), leftMargin=15 * mm, rightMargin=15 * mm, topMargin=14 * mm, bottomMargin=16 * mm)
    story = report_header_story(
        "รายงานแบบกลุ่ม",
        f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)} | กลุ่ม {payload.get('group_label', 'ทุกกลุ่ม')} | ผลไม้ {payload.get('fruit_label', 'ทั้งหมด')}",
        payload,
    )

    def add_table(title: str, headers: list[str], rows: list[list], widths: list[float] | None = None):
        table_rows = [headers] + rows
        if len(table_rows) == 1:
            table_rows.append(["-" for _ in headers])
        col_widths = widths or [(267 / len(headers)) * mm for _ in headers]
        table = Table(table_rows, repeatRows=1, colWidths=col_widths)
        set_pdf_table_style(table, 1)
        story.extend([Paragraph(title, section), table, Spacer(1, 7 * mm)])

    if options["summary"]:
        add_table(
            "สรุปตามกลุ่ม",
            ["กลุ่ม", "คน", "รายการ", "น้ำ", "ดอก", "ทุเรียน A-E", "รวม", "เงิน", "เบี้ยขยัน", "หักทั่วไป", "หัก 3%", "สุทธิ"],
            [[row["pay_group"], len(row["employees"]), row["records"], report_number(row["water"]), report_number(row["flower"]), grade_cell(row.get("grades")), report_number(row["total"]), money(row["amount"]), money(row.get("bonus_amount", 0)), money(row.get("deduction_amount", 0)), money(row.get("withholding_tax_amount", 0)), money(row.get("net_amount", row["amount"]))] for row in group_rows],
        )

    if options["fruit"]:
        add_table(
            "สรุปตามกลุ่มและผลไม้",
            ["กลุ่ม", "ผลไม้", "คน", "รายการ", "น้ำ", "ดอก", "ทุเรียน A-E", "รวม", "เงิน", "เบี้ยขยัน", "หักทั่วไป", "หัก 3%", "สุทธิ"],
            [[row["pay_group"], row["fruit_label"], len(row["employees"]), row["records"], report_number(row["water"]), report_number(row["flower"]), grade_cell(row.get("grades")), report_number(row["total"]), money(row["amount"]), money(row.get("bonus_amount", 0)), money(row.get("deduction_amount", 0)), money(row.get("withholding_tax_amount", 0)), money(row.get("net_amount", row["amount"]))] for row in fruit_rows],
        )

    if options["employees"]:
        add_table(
            "รายละเอียดพนักงานในกลุ่ม",
            ["กลุ่ม", "รหัส", "ชื่อ", "รายการ", "น้ำ", "ดอก", "ทุเรียน A-E", "รวม", "เงิน", "เบี้ยขยัน", "หักทั่วไป", "หัก 3%", "สุทธิ"],
            [[row["pay_group"], row["emp_code"], row["fullname"], row["records"], report_number(row["water"]), report_number(row["flower"]), grade_cell(row.get("grades")), report_number(row["total"]), money(row["amount"]), money(row.get("bonus_amount", 0)), money(row.get("deduction_amount", 0)), money(row.get("withholding_tax_amount", 0)), money(row.get("net_amount", row["amount"]))] for row in employee_rows[:80]],
        )

    if options["details"]:
        add_table(
            "รายละเอียดรายการ",
            ["วันที่", "กลุ่ม", "ผลไม้", "รหัส", "ชื่อ", "กอง", "น้ำหนักน้ำ", "น้ำหนักดอก", "ทุเรียน A-E", "รวม", "รวมเงิน"],
            [[format_report_date(record["record_date"]), record["pay_group"], record["fruit_label"], record.get("emp_code", ""), record.get("employee_name", ""), record.get("pile_no") or record.get("pile", ""), report_number(record.get("water_weight", record.get("water", 0))), report_number(record.get("flower_weight", record.get("flower", 0))), production_grade_text(record) if record.get("fruit_type") == "durian" else "-", report_number(production_total_weight(record)), money(record.get("total_amount", record.get("grand_total", 0)))] for record in records[:100]],
        )

    if len(story) <= 4:
        story.append(Paragraph("ไม่มีส่วนรายงานที่เลือก", section))
    def draw_footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#D6E5DB"))
        canvas.line(15 * mm, 11 * mm, 282 * mm, 11 * mm)
        canvas.setFont(THAI_FONT, 8)
        canvas.setFillColor(colors.HexColor("#667085"))
        canvas.drawString(15 * mm, 6.5 * mm, "เอกสารสร้างจากระบบบริหารจัดการผลผลิต บริษัท พิศมัย ฟรุตส์ จำกัด")
        canvas.drawRightString(282 * mm, 6.5 * mm, f"หน้า {document.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)
    return buffer.getvalue()


def time_group_report_options(payload: dict) -> dict:
    options = payload.get("export_options") or {}
    return {
        "summary": bool(options.get("summary", True)),
        "employees": bool(options.get("employees", True)),
        "details": bool(options.get("details", False)),
    }


def build_time_group_report_excel(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    options = time_group_report_options(payload)
    group_rows = payload.get("time_group_rows", []) or []
    employee_rows = payload.get("time_employee_rows", []) or []
    records = payload.get("time_group_records", []) or []
    workbook = Workbook()
    overview = workbook.active
    overview.title = "Time Group Report"
    overview.merge_cells("A1:H1")
    overview["A1"] = COMPANY_NAME
    overview["A1"].font = Font(name="Sarabun", bold=True, size=18, color="0F7A3D")
    overview.merge_cells("A2:H2")
    overview["A2"] = "Time Group Report"
    overview["A2"].font = Font(name="Sarabun", bold=True, size=16, color="111827")
    overview.merge_cells("A3:H3")
    overview["A3"] = f"Date range {format_report_date(start_date)} - {format_report_date(end_date)} | Group {payload.get('group_label', 'All groups')}"
    overview.merge_cells("A4:H4")
    overview["A4"] = export_meta_text(payload)
    overview.append([])
    style_excel_report_sheet(overview, [1], [22, 16, 16, 18, 14, 14, 16, 16])

    if options["summary"]:
        summary = workbook.create_sheet("Summary By Group")
        summary.append(["Group", "Employees", "Records", "Net time", "Normal hours", "OT hours", "Normal amount", "OT amount", "Total amount", "Attendance bonus", "Deduct", "Net amount"])
        for row in group_rows:
            summary.append([
                row.get("pay_group", "-"),
                row.get("employees", 0),
                row.get("records", 0),
                minutes_text(row.get("net_minutes", 0)),
                safe_float(row.get("normal_hours")),
                safe_float(row.get("ot_hours")),
                safe_float(row.get("normal_amount")),
                safe_float(row.get("ot_amount")),
                safe_float(row.get("amount")),
                safe_float(row.get("bonus_amount")),
                safe_float(row.get("deduction_amount")),
                safe_float(row.get("net_amount", row.get("amount"))),
            ])
        style_excel_report_sheet(summary, [1], [20, 12, 12, 16, 14, 14, 16, 16, 16, 16, 14, 16])

    if options["employees"]:
        employees = workbook.create_sheet("Employees")
        employees.append(["Group", "Emp code", "Fullname", "Days", "Net time", "Normal hours", "OT hours", "Total amount", "Attendance bonus", "Deduct", "Net amount"])
        for row in employee_rows:
            employees.append([
                row.get("pay_group", "-"),
                row.get("emp_code", "-"),
                row.get("fullname", "-"),
                row.get("records", 0),
                minutes_text(row.get("net_minutes", 0)),
                safe_float(row.get("normal_hours")),
                safe_float(row.get("ot_hours")),
                safe_float(row.get("amount")),
                safe_float(row.get("bonus_amount")),
                safe_float(row.get("deduction_amount")),
                safe_float(row.get("net_amount", row.get("amount"))),
            ])
        style_excel_report_sheet(employees, [1], [20, 14, 28, 10, 16, 14, 14, 16, 16, 14, 16])

    if options["details"]:
        details = workbook.create_sheet("Details")
        details.append(["Date", "Group", "Emp code", "Fullname", "Clock in", "Clock out", "Net time", "OT rate", "Total amount"])
        for record in records:
            details.append([
                record.get("record_date", ""),
                record.get("employee_type_label", ""),
                record.get("emp_code", ""),
                record.get("fullname", ""),
                record.get("clock_in", ""),
                record.get("clock_out", ""),
                minutes_text(record.get("net_minutes", 0)),
                safe_float(record.get("ot_hourly_rate")),
                safe_float(record.get("total_amount")),
            ])
        style_excel_report_sheet(details, [1], [14, 18, 14, 28, 12, 12, 16, 12, 16])

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def build_time_group_report_pdf(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    options = time_group_report_options(payload)
    group_rows = payload.get("time_group_rows", []) or []
    employee_rows = payload.get("time_employee_rows", []) or []
    records = payload.get("time_group_records", []) or []
    _, _, _, section = pdf_styles()
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
    )
    story = report_header_story(
        "Time Group Report",
        f"Date range {format_report_date(start_date)} - {format_report_date(end_date)} | Group {payload.get('group_label', 'All groups')}",
        payload,
    )

    def add_table(title: str, headers: list[str], rows: list[list], widths: list[float] | None = None):
        table_rows = [headers] + rows
        if len(table_rows) == 1:
            table_rows.append(["-" for _ in headers])
        col_widths = widths or [(267 / len(headers)) * mm for _ in headers]
        table = Table(table_rows, repeatRows=1, colWidths=col_widths)
        set_pdf_table_style(table, 1)
        story.extend([Paragraph(title, section), table, Spacer(1, 7 * mm)])

    if options["summary"]:
        add_table(
            "Summary By Group",
            ["Group", "Employees", "Records", "Net time", "Normal", "OT", "Total", "Bonus", "Deduct", "Net"],
            [[
                row.get("pay_group", "-"),
                report_number(row.get("employees", 0), 0),
                report_number(row.get("records", 0), 0),
                minutes_text(row.get("net_minutes", 0)),
                report_number(row.get("normal_hours", 0)),
                report_number(row.get("ot_hours", 0)),
                money(row.get("amount", 0)),
                money(row.get("bonus_amount", 0)),
                money(row.get("deduction_amount", 0)),
                money(row.get("net_amount", row.get("amount", 0))),
            ] for row in group_rows],
        )

    if options["employees"]:
        add_table(
            "Employee Details",
            ["Group", "Code", "Name", "Days", "Net time", "Normal", "OT", "Total", "Bonus", "Deduct", "Net"],
            [[
                row.get("pay_group", "-"),
                row.get("emp_code", "-"),
                row.get("fullname", "-"),
                report_number(row.get("records", 0), 0),
                minutes_text(row.get("net_minutes", 0)),
                report_number(row.get("normal_hours", 0)),
                report_number(row.get("ot_hours", 0)),
                money(row.get("amount", 0)),
                money(row.get("bonus_amount", 0)),
                money(row.get("deduction_amount", 0)),
                money(row.get("net_amount", row.get("amount", 0))),
            ] for row in employee_rows],
        )

    if options["details"]:
        add_table(
            "Time Records",
            ["Date", "Group", "Code", "Name", "In", "Out", "Net", "OT rate", "Total"],
            [[
                record.get("record_date", ""),
                record.get("employee_type_label", ""),
                record.get("emp_code", ""),
                record.get("fullname", ""),
                record.get("clock_in", ""),
                record.get("clock_out", ""),
                minutes_text(record.get("net_minutes", 0)),
                report_number(record.get("ot_hourly_rate", 0), 0),
                money(record.get("total_amount", 0)),
            ] for record in records],
        )

    if len(story) <= 4:
        story.append(Paragraph("No selected report sections.", section))
    doc.build(story)
    return buffer.getvalue()


def summarize_time(records: list[dict]) -> tuple[dict, list[dict], list[dict]]:
    summary = {
        "records": len(records),
        "employees": len({record.get("employee_id") or record.get("emp_code") or record.get("fullname") for record in records}),
        "days": len({record.get("record_date") for record in records}),
        "raw_minutes": sum(safe_float(record.get("raw_minutes")) for record in records),
        "break_minutes": sum(safe_float(record.get("break_minutes")) for record in records),
        "net_minutes": sum(safe_float(record.get("net_minutes")) for record in records),
        "late": sum(1 for record in records if is_late_time(record.get("clock_in"))),
        "early": sum(1 for record in records if is_early_out_time(record.get("clock_out"))),
    }
    by_date: dict[str, dict] = {}
    by_employee: dict[str, dict] = {}
    for record in records:
        date_key = record.get("record_date") or "-"
        daily = by_date.setdefault(date_key, {"date": date_key, "records": 0, "employees": set(), "net_minutes": 0.0, "late": 0, "early": 0})
        daily["records"] += 1
        daily["employees"].add(record.get("employee_id") or record.get("emp_code") or record.get("fullname") or "")
        daily["net_minutes"] += safe_float(record.get("net_minutes"))
        daily["late"] += 1 if is_late_time(record.get("clock_in")) else 0
        daily["early"] += 1 if is_early_out_time(record.get("clock_out")) else 0

        employee_key = str(record.get("employee_id") or record.get("emp_code") or record.get("fullname") or "")
        employee = by_employee.setdefault(
            employee_key,
            {
                "emp_code": record.get("emp_code", "-"),
                "fullname": record.get("fullname", "-"),
                "department": record.get("department", "-"),
                "records": 0,
                "days": set(),
                "net_minutes": 0.0,
                "late": 0,
                "early": 0,
                "first_in": record.get("clock_in") or "-",
                "last_out": record.get("clock_out") or "-",
            },
        )
        employee["records"] += 1
        employee["days"].add(date_key)
        employee["net_minutes"] += safe_float(record.get("net_minutes"))
        employee["late"] += 1 if is_late_time(record.get("clock_in")) else 0
        employee["early"] += 1 if is_early_out_time(record.get("clock_out")) else 0
        if record.get("clock_in") and (employee["first_in"] == "-" or record["clock_in"] < employee["first_in"]):
            employee["first_in"] = record["clock_in"]
        if record.get("clock_out") and (employee["last_out"] == "-" or record["clock_out"] > employee["last_out"]):
            employee["last_out"] = record["clock_out"]

    daily_rows = sorted(by_date.values(), key=lambda item: item["date"])
    employee_rows = sorted(by_employee.values(), key=lambda item: (str(item["emp_code"]), str(item["fullname"])))
    return summary, daily_rows, employee_rows


def build_time_summary_excel(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    records = filtered_time_records(payload)
    summary, daily_rows, employee_rows = summarize_time(records)
    department_label = payload.get("department_label") or payload.get("department") or "ทุกแผนก"
    workbook = Workbook()
    overview = workbook.active
    overview.title = "Time Summary"
    overview.merge_cells("A1:H1")
    overview["A1"] = COMPANY_NAME
    overview["A1"].font = Font(name="Sarabun", bold=True, size=18, color="0F7A3D")
    overview.merge_cells("A2:H2")
    overview["A2"] = "รายงานสรุปเวลาเข้างาน"
    overview["A2"].font = Font(name="Sarabun", bold=True, size=16, color="111827")
    overview.merge_cells("A3:H3")
    overview["A3"] = f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)} | แผนก {department_label}"
    overview.merge_cells("A4:H4")
    overview["A4"] = export_meta_text(payload)
    add_excel_logo(overview, "I1")
    overview.append([])
    overview.append(["หัวข้อ", "ค่า"])
    overview.append(["จำนวนรายการ", summary["records"]])
    overview.append(["จำนวนพนักงาน", summary["employees"]])
    overview.append(["จำนวนวัน", summary["days"]])
    overview.append(["เวลาทำงานสุทธิ", summary["net_minutes"] / 60])
    overview.append(["เวลาพักรวม", summary["break_minutes"] / 60])
    overview.append(["มาสาย", summary["late"]])
    overview.append(["ออกก่อน", summary["early"]])
    style_excel_report_sheet(overview, [6], [30, 22, 14, 14, 14, 14, 14, 14, 14])

    daily = workbook.create_sheet("Daily Summary")
    daily.append(["วันที่", "จำนวนรายการ", "จำนวนพนักงาน", "ชั่วโมงสุทธิ", "มาสาย", "ออกก่อน"])
    for row in daily_rows:
        daily.append([row["date"], row["records"], len(row["employees"]), row["net_minutes"] / 60, row["late"], row["early"]])
    style_excel_report_sheet(daily, [1], [15, 16, 18, 16, 12, 12])

    employee_sheet = workbook.create_sheet("Employee Summary")
    employee_sheet.append(["รหัสพนักงาน", "ชื่อพนักงาน", "แผนก", "จำนวนวัน", "จำนวนรายการ", "ชั่วโมงสุทธิ", "มาสาย", "ออกก่อน", "เข้าเร็วสุด", "ออกช้าสุด"])
    for row in employee_rows:
        employee_sheet.append([row["emp_code"], row["fullname"], row["department"], len(row["days"]), row["records"], row["net_minutes"] / 60, row["late"], row["early"], row["first_in"], row["last_out"]])
    style_excel_report_sheet(employee_sheet, [1], [16, 25, 16, 12, 14, 14, 12, 12, 14, 14])

    detail = workbook.create_sheet("Details")
    detail.append(["วันที่", "รหัสพนักงาน", "ชื่อพนักงาน", "แผนก", "เข้า", "ออก", "พัก(นาที)", "สุทธิ(นาที)", "ชั่วโมง", "ผู้บันทึก"])
    for record in records:
        net_minutes = safe_float(record.get("net_minutes"))
        detail.append([record.get("record_date", ""), record.get("emp_code", ""), record.get("fullname", ""), record.get("department", ""), record.get("clock_in", ""), record.get("clock_out", ""), safe_float(record.get("break_minutes")), net_minutes, net_minutes / 60, record.get("created_by", "")])
    style_excel_report_sheet(detail, [1], [14, 16, 25, 16, 12, 12, 12, 14, 12, 20])

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def build_time_summary_pdf(payload: dict) -> bytes:
    start_date, end_date = normalized_range(payload)
    records = filtered_time_records(payload)
    summary, daily_rows, employee_rows = summarize_time(records)
    department_label = payload.get("department_label") or payload.get("department") or "ทุกแผนก"
    _, _, _, section = pdf_styles()
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
    )
    story = report_header_story(
        "รายงานสรุปเวลาเข้างาน",
        f"ช่วงวันที่ {format_report_date(start_date)} - {format_report_date(end_date)} | แผนก {department_label}",
        payload,
    )
    overview = Table(
        [
            ["รายการ", "พนักงาน", "จำนวนวัน", "เวลาสุทธิ", "เวลาพัก", "มาสาย", "ออกก่อน"],
            [
                report_number(summary["records"], 0),
                report_number(summary["employees"], 0),
                report_number(summary["days"], 0),
                minutes_text(summary["net_minutes"]),
                minutes_text(summary["break_minutes"]),
                report_number(summary["late"], 0),
                report_number(summary["early"], 0),
            ],
        ],
        colWidths=[28 * mm, 28 * mm, 28 * mm, 43 * mm, 43 * mm, 28 * mm, 28 * mm],
    )
    set_pdf_table_style(overview, 0)
    story += [Paragraph("ภาพรวม", section), overview, Spacer(1, 7 * mm)]

    daily_table_rows = [["วันที่", "รายการ", "พนักงาน", "เวลาสุทธิ", "มาสาย", "ออกก่อน"]]
    for row in daily_rows:
        daily_table_rows.append([format_report_date(row["date"]), report_number(row["records"], 0), report_number(len(row["employees"]), 0), minutes_text(row["net_minutes"]), report_number(row["late"], 0), report_number(row["early"], 0)])
    if len(daily_table_rows) == 1:
        daily_table_rows.append(["-", "0", "0", "0 ชม. 0 นาที", "0", "0"])
    daily_table = Table(daily_table_rows, repeatRows=1, colWidths=[38 * mm, 32 * mm, 35 * mm, 55 * mm, 32 * mm, 32 * mm])
    set_pdf_table_style(daily_table, 1)
    story += [Paragraph("สรุปรายวัน", section), daily_table, Spacer(1, 7 * mm)]

    employee_table_rows = [["รหัส", "ชื่อพนักงาน", "แผนก", "วัน", "รายการ", "เวลาสุทธิ", "สาย", "ออกก่อน"]]
    for row in employee_rows[:80]:
        employee_table_rows.append([row["emp_code"], row["fullname"], row["department"], report_number(len(row["days"]), 0), report_number(row["records"], 0), minutes_text(row["net_minutes"]), report_number(row["late"], 0), report_number(row["early"], 0)])
    if len(employee_table_rows) == 1:
        employee_table_rows.append(["-", "-", "-", "0", "0", "0 ชม. 0 นาที", "0", "0"])
    employee_table = Table(employee_table_rows, repeatRows=1, colWidths=[24 * mm, 48 * mm, 34 * mm, 20 * mm, 25 * mm, 45 * mm, 20 * mm, 25 * mm])
    set_pdf_table_style(employee_table, 3)
    story += [Paragraph("สรุปรายพนักงาน", section), employee_table]
    doc.build(story)
    return buffer.getvalue()


class ReportHandler(BaseHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Backup-Code, X-Session-Token")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        payload = self.read_json()

        if parsed.path == "/api/online-users":
            self.send_json({"data": register_online_user(payload)})
            return

        if parsed.path == "/api/accounting/journals":
            actor = accounting_actor(self)
            if not actor:
                self.send_json({"error": "Accounting session is missing or expired."}, 401)
                return
            lines = payload.get("lines", [])
            if not isinstance(lines, list):
                self.send_json({"error": "Journal lines must be an array."}, 400)
                return
            rpc_payload = {
                "p_company_key": ACCOUNTING_COMPANY_KEY,
                "p_entry_date": payload.get("date"),
                "p_journal_type": payload.get("journal_type", "general"),
                "p_reference": payload.get("reference", ""),
                "p_description": payload.get("description", ""),
                "p_document_no": payload.get("document_no", ""),
                "p_lines": [
                    {
                        "account_id": line.get("accountId") or line.get("account_id"),
                        "description": line.get("memo") or line.get("description", ""),
                        "debit": line.get("debit", 0),
                        "credit": line.get("credit", 0),
                        "partner_id": line.get("partner_id"),
                        "due_date": line.get("due_date"),
                        "tax_code": line.get("tax_code"),
                        "cost_center": line.get("cost_center"),
                        "production_batch": line.get("production_batch"),
                        "project_code": line.get("project_code"),
                    }
                    for line in lines if isinstance(line, dict)
                ],
                "p_actor": actor.get("username", "unknown"),
                "p_submit": payload.get("intent") != "draft",
            }
            status, body = supabase_request("POST", "rpc/ac_create_journal", rpc_payload)
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path in {"/api/accounting/journals/approve", "/api/accounting/journals/reject"}:
            actor = accounting_actor(self, 5)
            if not actor:
                self.send_json({"error": "C5 or higher accounting session is required."}, 403)
                return
            journal_id = str(payload.get("journal_id", "")).strip()
            if not journal_id:
                self.send_json({"error": "journal_id is required."}, 400)
                return
            if parsed.path.endswith("/approve"):
                rpc_name = "rpc/ac_approve_journal"
                rpc_payload = {"p_journal_id": journal_id, "p_actor": actor.get("username"), "p_actor_level": actor.get("level")}
            else:
                rpc_name = "rpc/ac_reject_journal"
                rpc_payload = {"p_journal_id": journal_id, "p_actor": actor.get("username"), "p_actor_level": actor.get("level"), "p_reason": payload.get("reason", "")}
            status, body = supabase_request("POST", rpc_name, rpc_payload)
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/accounting/periods/close":
            actor = accounting_actor(self, 5)
            if not actor:
                self.send_json({"error": "C5 or higher accounting session is required."}, 403)
                return
            status, body = supabase_request("POST", "rpc/ac_close_period", {"p_period_id": payload.get("period_id"), "p_actor": actor.get("username")})
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/accounting/accounts":
            actor = accounting_actor(self, 5)
            if not actor:
                self.send_json({"error": "C5 or higher accounting session is required."}, 403)
                return
            company_status, companies = supabase_request("GET", f"ac_companies?company_key=eq.{quote(ACCOUNTING_COMPANY_KEY)}&select=id&limit=1")
            if company_status >= 400 or not isinstance(companies, list) or not companies:
                self.send_json({"error": companies if company_status >= 400 else "Accounting company is not initialized."}, company_status if company_status >= 400 else 404)
                return
            account_type = str(payload.get("type", ""))
            if account_type not in {"asset", "liability", "equity", "revenue", "expense"}:
                self.send_json({"error": "Invalid account type."}, 422)
                return
            normal_side = "debit" if account_type in {"asset", "expense"} else "credit"
            if bool(payload.get("contra")):
                normal_side = "credit" if normal_side == "debit" else "debit"
            row = {"company_id": companies[0]["id"], "code": str(payload.get("code", "")).strip(), "name_th": str(payload.get("name", "")).strip(), "account_type": account_type, "normal_side": normal_side, "is_contra": bool(payload.get("contra")), "active": True, "system_account": False}
            if not row["code"] or not row["name_th"]:
                self.send_json({"error": "Account code and name are required."}, 400)
                return
            status, body = supabase_request("POST", "ac_accounts", row, prefer="return=representation")
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/reports/sync":
            save_data(payload)
            self.send_json({"status": "ok"})
            return

        if parsed.path == "/api/cleanup-test-data":
            # These codes belong solely to the original demo dataset. They
            # were never created as central employee records and must not be
            # mixed into payroll or production history.
            demo_codes = "10001,10002,10003,10021,10025,10031,10044,10052,10067"
            results = {}
            for table in ("production_records", "time_records"):
                status, body = supabase_request(
                    "DELETE",
                    f"{table}?emp_code=in.({demo_codes})",
                    prefer="return=representation",
                )
                if status >= 400:
                    self.send_json({"error": body, "table": table}, status)
                    return
                results[table] = len(body) if isinstance(body, list) else 0
            self.send_json({"deleted": results})
            return

        if parsed.path == "/api/state":
            table = str(payload.get("table", "")).strip()
            rows = payload.get("rows", [])
            if table not in LIVE_STATE_TABLES or not isinstance(rows, list):
                self.send_json({"error": "Invalid live-state table or rows."}, 400)
                return
            converted = [live_state_row(table, row) for row in rows if isinstance(row, dict)]
            status, body = sync_rows_by_id(table, converted)
            if status < 400:
                ids = [str(row.get("id")) for row in converted if row.get("id") not in [None, ""]]
                delete_path = table if not ids else f"{table}?id=not.in.({','.join(quote(value) for value in ids)})"
                delete_status, delete_body = supabase_request("DELETE", delete_path, prefer="return=minimal")
                if delete_status >= 400:
                    self.send_json({"error": delete_body}, delete_status)
                    return
            self.send_json({"data": body.get("synced", []) if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/backup/restore":
            if not backup_authorized(self):
                self.send_json({"error": "Backup code is required."}, 403)
                return
            data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
            if not isinstance(data, dict):
                self.send_json({"error": "Invalid backup payload."}, 400)
                return
            status, body = restore_supabase_backup(data)
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/auth/login":
            ensure_system_accounts()
            username = str(payload.get("username", "")).strip()
            password = str(payload.get("password", ""))
            if not username or not password:
                self.send_json({"error": "Username and password are required."}, 400)
                return
            status, body = supabase_request(
                "GET",
                f"account_users?username=eq.{quote(username)}&select=*&limit=1",
            )
            if status >= 400:
                self.send_json({"error": body}, status)
                return
            account = body[0] if isinstance(body, list) and body else None
            if not account:
                self.send_json({"error": "ไม่พบบัญชีนี้ในฐานข้อมูลกลาง"}, 404)
                return
            if account.get("status") != "Active":
                self.send_json({"error": "บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ"}, 403)
                return
            if not verify_password(password, str(account.get("password_hash", ""))):
                self.send_json({"error": "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"}, 401)
                return
            supabase_request(
                "PATCH",
                f"account_users?id=eq.{account.get('id')}",
                {"last_login_at": datetime.utcnow().isoformat() + "Z"},
                prefer="return=minimal",
            )
            self.send_json({"user": account_to_client(account), "token": session_token(account)})
            return

        if parsed.path == "/api/accounts/sync":
            accounts = payload.get("accounts", [])
            if not isinstance(accounts, list):
                self.send_json({"error": "accounts must be a list"}, 400)
                return
            cloud_accounts = []
            for account_payload in accounts:
                if not isinstance(account_payload, dict):
                    continue
                account = account_from_payload(account_payload)
                if account.get("user_level") == "C7" or account.get("role") == "developer":
                    continue
                if account["username"] and account["fullname"] and account.get("password_hash"):
                    cloud_accounts.append(account)
            if not cloud_accounts:
                self.send_json({"data": []})
                return
            status, body = supabase_account_bulk_write(
                "POST",
                "account_users?on_conflict=username",
                cloud_accounts,
                prefer="resolution=merge-duplicates,return=representation",
            )
            self.send_json({"data": body if status < 400 else [], "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/accounts":
            account = account_from_payload(payload)
            if not account["username"] or not account["fullname"] or not account.get("password_hash"):
                self.send_json({"error": "Username, fullname, and password are required."}, 400)
                return
            if account.get("user_level") == "C7" or account.get("role") == "developer":
                self.send_json({"error": "C7/developer accounts can only be managed by the system."}, 403)
                return
            status, body = supabase_account_write(
                "POST",
                "account_users",
                account,
                prefer="return=representation",
            )
            data = [account_to_client(item) for item in body] if status < 400 and isinstance(body, list) else None
            self.send_json({"data": data, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/employees/sync":
            employees_payload = payload.get("employees", [])
            if not isinstance(employees_payload, list):
                self.send_json({"error": "employees must be a list"}, 400)
                return
            employees = []
            for employee_payload in employees_payload:
                if not isinstance(employee_payload, dict):
                    continue
                employee = employee_from_payload(employee_payload)
                required = ["emp_code", "fullname", "department", "pay_group"]
                if all(employee.get(key) not in [None, ""] for key in required):
                    employees.append(employee)
            if not employees:
                self.send_json({"data": []})
                return
            status, body = sync_rows_by_id("employees", employees)
            synced = body.get("synced", []) if status < 400 and isinstance(body, dict) else []
            self.send_json({"data": synced, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/time-employees/sync":
            employees_payload = payload.get("employees", [])
            if not isinstance(employees_payload, list):
                self.send_json({"error": "employees must be a list"}, 400)
                return
            employees = []
            for employee_payload in employees_payload:
                if not isinstance(employee_payload, dict):
                    continue
                employee = time_employee_from_payload(employee_payload)
                required = ["emp_code", "fullname", "employee_type", "daily_wage"]
                if all(employee.get(key) not in [None, ""] for key in required):
                    employees.append(employee)
            if not employees:
                self.send_json({"data": []})
                return
            status, body = sync_rows_by_id("time_employees", employees)
            synced = body.get("synced", []) if status < 400 and isinstance(body, dict) else []
            self.send_json({"data": synced, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/employees":
            employee = ensure_row_id("employees", employee_from_payload(payload))
            required = ["emp_code", "fullname", "department", "pay_group"]
            missing = [key for key in required if not employee[key]]
            if missing:
                self.send_json({"error": f"Missing required fields: {', '.join(missing)}"}, 400)
                return
            status, body = supabase_request(
                "POST",
                "employees",
                employee,
                prefer="return=representation",
            )
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/time-employees":
            employee = ensure_row_id("time_employees", time_employee_from_payload(payload))
            required = ["emp_code", "fullname", "employee_type", "daily_wage"]
            missing = [key for key in required if employee.get(key) in [None, ""]]
            if missing:
                self.send_json({"error": f"Missing required fields: {', '.join(missing)}"}, 400)
                return
            status, body = supabase_request(
                "POST",
                "time_employees",
                employee,
                prefer="return=representation",
            )
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/deductions":
            deduction = ensure_row_id("deduction_records", deduction_from_payload(payload))
            required = ["employee_kind", "employee_id", "emp_code", "employee_name", "start_date", "end_date", "deduction_type", "deduction_label", "amount"]
            missing = [key for key in required if deduction.get(key) in [None, ""]]
            if missing:
                self.send_json({"error": f"Missing required fields: {', '.join(missing)}"}, 400)
                return
            status, body = supabase_request(
                "POST",
                "deduction_records",
                deduction,
                prefer="return=representation",
            )
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/deduction-applications/apply":
            applied_date = str(payload.get("applied_date", "")).strip()
            items = payload.get("items", [])
            if not applied_date or not isinstance(items, list) or not items:
                self.send_json({"error": "applied_date and items are required."}, 400)
                return
            clean_items = [deduction_application_from_payload(item) for item in items if isinstance(item, dict)]
            if not clean_items:
                self.send_json({"error": "No valid deduction items."}, 400)
                return
            status, body = supabase_request(
                "POST",
                "rpc/apply_deduction_batch",
                {
                    "p_applied_date": applied_date,
                    "p_created_by": str(payload.get("created_by", "")).strip(),
                    "p_items": clean_items,
                },
                prefer="return=representation",
            )
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/wage-rates":
            wage_rate = {
                "item_type": str(payload.get("item_type", "")).strip(),
                "rate": payload.get("rate", 0),
                "effective_date": str(payload.get("effective_date", "")).strip(),
                "note": str(payload.get("note", "")).strip() or None,
                "created_by": str(payload.get("created_by", "")).strip() or None,
            }
            if not wage_rate["item_type"] or not wage_rate["effective_date"]:
                self.send_json({"error": "item_type and effective_date are required."}, 400)
                return
            status, body = supabase_request(
                "POST",
                "wage_rates",
                wage_rate,
                prefer="return=representation",
            )
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/reports/selected-employees-pdf":
            data = {
                "employees": payload.get("employees", []),
                "production_records": payload.get("production_records", []),
            }
            date = payload.get("date", datetime.now().date().isoformat())
            employee_ids = [int(value) for value in payload.get("employee_ids", [])]
            content = build_pdf(data, date, employee_ids)
            self.send_file(
                content,
                "application/pdf",
                f"selected-employees-{date}.pdf",
            )
            return

        if parsed.path == "/reports/employee-range-pdf":
            data = {
                "employees": payload.get("employees", []),
                "production_records": payload.get("production_records", []),
            }
            start_date = payload.get("start_date", datetime.now().date().isoformat())
            end_date = payload.get("end_date", start_date)
            employee_id = int(payload.get("employee_id", 0))
            content = build_employee_range_pdf(data, start_date, end_date, employee_id)
            self.send_file(
                content,
                "application/pdf",
                f"employee-{employee_id}-{start_date}-to-{end_date}.pdf",
            )
            return

        if parsed.path == "/reports/employee-range-excel":
            data = {
                "employees": payload.get("employees", []),
                "production_records": payload.get("production_records", []),
            }
            start_date = payload.get("start_date", datetime.now().date().isoformat())
            end_date = payload.get("end_date", start_date)
            employee_id = int(payload.get("employee_id", 0))
            content = build_employee_range_excel(data, start_date, end_date, employee_id)
            self.send_file(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"employee-{employee_id}-{start_date}-to-{end_date}.xlsx",
            )
            return

        if parsed.path == "/reports/summary-by-pile-pdf":
            data = {
                "employees": payload.get("employees", []),
                "production_records": payload.get("production_records", []),
            }
            start_date = payload.get("start_date", datetime.now().date().isoformat())
            content = build_summary_by_pile_pdf(data, payload)
            self.send_file(
                content,
                "application/pdf",
                f"Summary_ByPile_{clean_filename_date(start_date)}.pdf",
            )
            return

        if parsed.path == "/reports/summary-by-pile-excel":
            data = {
                "employees": payload.get("employees", []),
                "production_records": payload.get("production_records", []),
            }
            start_date = payload.get("start_date", datetime.now().date().isoformat())
            content = build_summary_by_pile_excel(data, payload)
            self.send_file(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"Summary_ByPile_{clean_filename_date(start_date)}.xlsx",
            )
            return

        if parsed.path == "/reports/time-full-export-excel":
            start_date = payload.get("start_date", datetime.now().date().isoformat())
            end_date = payload.get("end_date", start_date)
            content = build_time_full_export_excel(payload)
            self.send_file(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"Full_Details_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.xlsx",
            )
            return

        if parsed.path == "/reports/time-receipts-pdf":
            start_date = payload.get("start_date", datetime.now().date().isoformat())
            end_date = payload.get("end_date", start_date)
            content = build_time_receipts_pdf(payload)
            self.send_file(
                content,
                "application/pdf",
                f"Time_Receipts_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.pdf",
            )
            return

        if parsed.path == "/reports/production-summary-pdf":
            start_date, end_date = normalized_range(payload)
            content = build_production_summary_pdf(payload)
            self.send_file(
                content,
                "application/pdf",
                f"Production_Summary_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.pdf",
            )
            return

        if parsed.path == "/reports/production-summary-excel":
            start_date, end_date = normalized_range(payload)
            content = build_production_summary_excel(payload)
            self.send_file(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"Production_Summary_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.xlsx",
            )
            return

        if parsed.path == "/reports/group-report-pdf":
            start_date, end_date = normalized_range(payload)
            content = build_group_report_pdf(payload)
            self.send_file(
                content,
                "application/pdf",
                f"Group_Report_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.pdf",
            )
            return

        if parsed.path == "/reports/group-report-excel":
            start_date, end_date = normalized_range(payload)
            content = build_group_report_excel(payload)
            self.send_file(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"Group_Report_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.xlsx",
            )
            return

        if parsed.path == "/reports/time-group-report-pdf":
            start_date, end_date = normalized_range(payload)
            content = build_time_group_report_pdf(payload)
            self.send_file(
                content,
                "application/pdf",
                f"Time_Group_Report_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.pdf",
            )
            return

        if parsed.path == "/reports/time-group-report-excel":
            start_date, end_date = normalized_range(payload)
            content = build_time_group_report_excel(payload)
            self.send_file(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"Time_Group_Report_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.xlsx",
            )
            return

        if parsed.path == "/reports/time-summary-pdf":
            start_date, end_date = normalized_range(payload)
            content = build_time_summary_pdf(payload)
            self.send_file(
                content,
                "application/pdf",
                f"Time_Summary_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.pdf",
            )
            return

        if parsed.path == "/reports/time-summary-excel":
            start_date, end_date = normalized_range(payload)
            content = build_time_summary_excel(payload)
            self.send_file(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"Time_Summary_{clean_filename_date(start_date)}_to_{clean_filename_date(end_date)}.xlsx",
            )
            return

        self.send_error(404, "Not found")

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        payload = self.read_json()

        if parsed.path == "/api/accounting/workspace":
            actor = accounting_actor(self)
            if not actor:
                self.send_json({"error": "Accounting session is missing or expired."}, 401)
                return
            workspace = payload.get("workspace")
            validation_error = validate_accounting_workspace(workspace)
            if validation_error:
                self.send_json({"error": validation_error}, 422)
                return
            expected_revision = int(payload.get("revision") or 0)
            status, existing_rows = supabase_request(
                "GET",
                f"accounting_workspaces?company_key=eq.{quote(ACCOUNTING_COMPANY_KEY)}&select=*",
            )
            if status >= 400:
                self.send_json({"error": existing_rows}, status)
                return
            existing = existing_rows[0] if isinstance(existing_rows, list) and existing_rows else None
            current_revision = int(existing.get("revision", 0)) if existing else 0
            if expected_revision != current_revision:
                self.send_json({"error": "Accounting workspace revision conflict.", "data": existing}, 409)
                return
            if existing:
                old_workspace = existing.get("workspace") if isinstance(existing.get("workspace"), dict) else {}
                old_periods = old_workspace.get("periods", {}) if isinstance(old_workspace.get("periods"), dict) else {}
                new_periods = workspace.get("periods", {}) if isinstance(workspace.get("periods"), dict) else {}
                for period, period_row in old_periods.items():
                    if not isinstance(period_row, dict) or period_row.get("status") != "closed":
                        continue
                    old_journals = [row for row in old_workspace.get("journals", []) if str(row.get("date", "")).startswith(period)]
                    new_journals = [row for row in workspace.get("journals", []) if str(row.get("date", "")).startswith(period)]
                    reopened = isinstance(new_periods.get(period), dict) and new_periods[period].get("status") == "open"
                    actor_level = int("".join(filter(str.isdigit, str(actor.get("level", "C1")))) or "1")
                    if old_journals != new_journals and not (reopened and actor_level >= 5):
                        self.send_json({"error": f"Closed accounting period {period} is immutable."}, 423)
                        return
            next_revision = current_revision + 1
            row = {
                "company_key": ACCOUNTING_COMPANY_KEY,
                "revision": next_revision,
                "workspace": workspace,
                "updated_by": actor.get("username", "unknown"),
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }
            if existing:
                save_status, saved = supabase_request(
                    "PATCH",
                    f"accounting_workspaces?company_key=eq.{quote(ACCOUNTING_COMPANY_KEY)}&revision=eq.{current_revision}",
                    row,
                    prefer="return=representation",
                )
                if save_status < 400 and (not isinstance(saved, list) or not saved):
                    self.send_json({"error": "Accounting workspace revision conflict."}, 409)
                    return
            else:
                save_status, saved = supabase_request("POST", "accounting_workspaces", row, prefer="return=representation")
            if save_status >= 400:
                self.send_json({"error": saved}, save_status)
                return
            workspace_hash = hashlib.sha256(json.dumps(workspace, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
            supabase_request(
                "POST",
                "accounting_change_log",
                {"company_key": ACCOUNTING_COMPANY_KEY, "revision": next_revision, "action": "WORKSPACE_SAVE", "actor_username": actor.get("username", "unknown"), "actor_level": actor.get("level", "C1"), "workspace_hash": workspace_hash, "metadata": {"journal_count": len(workspace.get("journals", [])), "account_count": len(workspace.get("accounts", []))}},
                prefer="return=minimal",
            )
            self.send_json({"data": {"revision": next_revision, "updated_at": row["updated_at"]}})
            return

        if parsed.path == "/api/employees":
            employee_id = payload.get("id")
            if employee_id in [None, ""]:
                self.send_json({"error": "id is required."}, 400)
                return
            employee = employee_from_payload(payload)
            employee["updated_at"] = datetime.utcnow().isoformat() + "Z"
            status, body = supabase_request(
                "PATCH",
                f"employees?id=eq.{quote(str(employee_id))}",
                employee,
                prefer="return=representation",
            )
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/accounts":
            account_id = payload.get("id")
            if account_id in [None, ""]:
                self.send_json({"error": "id is required."}, 400)
                return
            existing_status, existing_rows = supabase_request(
                "GET",
                f"account_users?id=eq.{quote(str(account_id))}&select=id,username,role,user_level&limit=1",
            )
            if existing_status >= 400:
                self.send_json({"error": existing_rows}, existing_status)
                return
            if not isinstance(existing_rows, list) or not existing_rows:
                self.send_json({"error": "Account not found."}, 404)
                return
            existing = existing_rows[0]
            existing_username = str(existing.get("username", "")).lower()
            existing_level = str(existing.get("user_level", "")).upper()
            existing_role = str(existing.get("role", ""))
            if existing_username in SYSTEM_ACCOUNT_USERNAMES or existing_level == "C7" or existing_role == "developer":
                self.send_json({"error": "C7/developer account cannot be edited."}, 403)
                return
            account = account_from_payload(payload, include_password=bool(str(payload.get("password", ""))))
            if account.get("user_level") == "C7" or account.get("role") == "developer":
                self.send_json({"error": "C7/developer accounts can only be managed by the system."}, 403)
                return
            if not account["username"] or not account["fullname"]:
                self.send_json({"error": "Username and fullname are required."}, 400)
                return
            account["updated_at"] = datetime.utcnow().isoformat() + "Z"
            status, body = supabase_account_write(
                "PATCH",
                f"account_users?id=eq.{quote(str(account_id))}",
                account,
                prefer="return=representation",
            )
            data = [account_to_client(item) for item in body] if status < 400 and isinstance(body, list) else None
            self.send_json({"data": data, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/time-employees":
            employee_id = payload.get("id")
            if employee_id in [None, ""]:
                self.send_json({"error": "id is required."}, 400)
                return
            employee = time_employee_from_payload(payload)
            employee["updated_at"] = datetime.utcnow().isoformat() + "Z"
            status, body = supabase_request(
                "PATCH",
                f"time_employees?id=eq.{quote(str(employee_id))}",
                employee,
                prefer="return=representation",
            )
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/deductions":
            deduction_id = payload.get("id")
            if deduction_id in [None, ""]:
                self.send_json({"error": "id is required."}, 400)
                return
            existing_status, existing_rows = supabase_request(
                "GET",
                f"deduction_records?id=eq.{quote(str(deduction_id))}&select=employee_id,start_date,deduction_type,amount&limit=1",
            )
            if existing_status >= 400 or not isinstance(existing_rows, list) or not existing_rows:
                self.send_json({"error": existing_rows if existing_status >= 400 else "Deduction not found."}, existing_status if existing_status >= 400 else 404)
                return
            status_check, applications = supabase_request(
                "GET",
                f"deduction_applications?deduction_id=eq.{quote(str(deduction_id))}&status=eq.Applied&select=amount",
            )
            if status_check >= 400:
                self.send_json({"error": applications}, status_check)
                return
            applied_total = sum(float(row.get("amount") or 0) for row in applications) if isinstance(applications, list) else 0
            requested_amount = float(payload.get("amount") or 0)
            if requested_amount + 0.00001 < applied_total:
                self.send_json({"error": "Amount cannot be lower than the amount already deducted."}, 409)
                return
            existing = existing_rows[0]
            immutable_changed = (
                abs(requested_amount - float(existing.get("amount") or 0)) > 0.00001
                or str(payload.get("start_date") or "") != str(existing.get("start_date") or "")
                or str(payload.get("employee_id") or "") != str(existing.get("employee_id") or "")
                or str(payload.get("deduction_type") or "") != str(existing.get("deduction_type") or "")
            )
            if applied_total > 0 and immutable_changed:
                self.send_json({"error": "A deduction with payment history cannot change its original details."}, 409)
                return
            deduction = deduction_from_payload(payload)
            if applied_total > 0 and deduction.get("status") not in ["Cancelled"]:
                deduction["status"] = "Completed" if requested_amount <= applied_total + 0.00001 else "Pending"
            deduction["updated_at"] = datetime.utcnow().isoformat() + "Z"
            status, body = supabase_request(
                "PATCH",
                f"deduction_records?id=eq.{quote(str(deduction_id))}",
                deduction,
                prefer="return=representation",
            )
            self.send_json({"data": body if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        self.send_error(404, "Not found")

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        payload = self.read_json()

        if parsed.path == "/api/accounts":
            account_id = payload.get("id")
            username = str(payload.get("username", "")).strip()
            protected_username = username.lower()
            if account_id not in [None, ""]:
                status, existing = supabase_request(
                    "GET",
                    f"account_users?id=eq.{quote(str(account_id))}&select=username,user_level&limit=1",
                )
                if status >= 400:
                    self.send_json({"error": existing}, status)
                    return
                existing_account = existing[0] if isinstance(existing, list) and existing else {}
                protected_username = str(existing_account.get("username", "")).lower()
                protected_level = str(existing_account.get("user_level", "")).upper()
                filter_path = f"account_users?id=eq.{quote(str(account_id))}"
            elif username:
                status, existing = supabase_request(
                    "GET",
                    f"account_users?username=eq.{quote(username)}&select=username,user_level&limit=1",
                )
                if status >= 400:
                    self.send_json({"error": existing}, status)
                    return
                existing_account = existing[0] if isinstance(existing, list) and existing else {}
                protected_level = str(existing_account.get("user_level", "")).upper()
                filter_path = f"account_users?username=eq.{quote(username)}"
            else:
                self.send_json({"error": "id or username is required."}, 400)
                return
            if protected_username in SYSTEM_ACCOUNT_USERNAMES or protected_level == "C7":
                self.send_json({"error": "C7/developer account cannot be deleted."}, 403)
                return
            status, body = supabase_request("DELETE", filter_path, prefer="return=minimal")
            self.send_json({"data": {"deleted": True} if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/employees":
            employee_id = payload.get("id")
            if employee_id in [None, ""]:
                self.send_json({"error": "id is required."}, 400)
                return
            status, body = supabase_request(
                "DELETE",
                f"employees?id=eq.{quote(str(employee_id))}",
                prefer="return=minimal",
            )
            self.send_json({"data": {"deleted": True} if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/time-employees":
            employee_id = payload.get("id")
            if employee_id in [None, ""]:
                self.send_json({"error": "id is required."}, 400)
                return
            status, body = supabase_request(
                "DELETE",
                f"time_employees?id=eq.{quote(str(employee_id))}",
                prefer="return=minimal",
            )
            self.send_json({"data": {"deleted": True} if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/deductions":
            deduction_id = payload.get("id")
            if deduction_id in [None, ""]:
                self.send_json({"error": "id is required."}, 400)
                return
            status_check, applications = supabase_request(
                "GET",
                f"deduction_applications?deduction_id=eq.{quote(str(deduction_id))}&status=eq.Applied&select=id&limit=1",
            )
            if status_check >= 400:
                self.send_json({"error": applications}, status_check)
                return
            if isinstance(applications, list) and applications:
                self.send_json({"error": "A deduction with payment history cannot be deleted."}, 409)
                return
            status, body = supabase_request(
                "DELETE",
                f"deduction_records?id=eq.{quote(str(deduction_id))}",
                prefer="return=minimal",
            )
            self.send_json({"data": {"deleted": True} if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        self.send_error(404, "Not found")

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)

        if parsed.path == "/api/online-users":
            self.send_json({"data": online_user_snapshot()})
            return

        if parsed.path == "/api/accounting/workspace":
            actor = accounting_actor(self)
            if not actor:
                self.send_json({"error": "Accounting session is missing or expired."}, 401)
                return
            status, rows = supabase_request(
                "GET",
                f"accounting_workspaces?company_key=eq.{quote(ACCOUNTING_COMPANY_KEY)}&select=revision,workspace,updated_by,updated_at&limit=1",
            )
            if status >= 400:
                self.send_json({"error": rows}, status)
                return
            if not isinstance(rows, list) or not rows:
                self.send_json({"error": "Accounting workspace has not been initialized."}, 404)
                return
            self.send_json({"data": rows[0]})
            return

        if parsed.path == "/api/accounting/bootstrap":
            actor = accounting_actor(self)
            if not actor:
                self.send_json({"error": "Accounting session is missing or expired."}, 401)
                return
            company_status, companies = supabase_request("GET", f"ac_companies?company_key=eq.{quote(ACCOUNTING_COMPANY_KEY)}&select=*&limit=1")
            if company_status >= 400 or not isinstance(companies, list) or not companies:
                self.send_json({"error": companies if company_status >= 400 else "Accounting company is not initialized."}, company_status if company_status >= 400 else 404)
                return
            company = companies[0]
            company_id = quote(str(company.get("id")))
            datasets = {}
            queries = {
                "accounts": f"ac_accounts?company_id=eq.{company_id}&select=*&order=code.asc",
                "periods": f"ac_periods?company_id=eq.{company_id}&select=*&order=start_date.desc",
                "journals": f"ac_journal_entries?company_id=eq.{company_id}&select=*&order=entry_date.desc,created_at.desc&limit=500",
                "partners": f"ac_partners?company_id=eq.{company_id}&select=*&active=eq.true&order=partner_code.asc",
            }
            for key, path in queries.items():
                status, rows = supabase_request("GET", path)
                if status >= 400:
                    self.send_json({"error": rows, "dataset": key}, status)
                    return
                datasets[key] = rows if isinstance(rows, list) else []
            journal_ids = [str(row.get("id")) for row in datasets["journals"] if row.get("id")]
            if journal_ids:
                status, lines = supabase_request("GET", f"ac_journal_lines?journal_id=in.({','.join(quote(value) for value in journal_ids)})&select=*&order=journal_id.asc,line_no.asc")
                if status >= 400:
                    self.send_json({"error": lines, "dataset": "journal_lines"}, status)
                    return
                datasets["journal_lines"] = lines if isinstance(lines, list) else []
            else:
                datasets["journal_lines"] = []
            self.send_json({"data": {"company": company, **datasets}})
            return

        if parsed.path == "/api/health":
            status, body = supabase_request("GET", "employees?select=id&limit=1")
            time_status, time_body = supabase_request("GET", "time_employees?select=id&limit=1")
            self.send_json(
                {
                    "status": "ok" if status < 400 and time_status < 400 else "error",
                    "server": "ready",
                    "supabase_configured": supabase_configured(),
                    "supabase_status": status,
                    "supabase_response": body,
                    "time_employees_status": time_status,
                    "time_employees_response": time_body,
                },
                200 if status < 500 and time_status < 500 else max(status, time_status),
            )
            return

        if parsed.path == "/api/state":
            state = {}
            for table in LIVE_STATE_TABLES:
                status, body = supabase_request("GET", f"{table}?select=*&order=id.asc")
                if status >= 400:
                    self.send_json({"error": body, "table": table}, status)
                    return
                state[table] = [live_state_to_client(table, row) for row in body]
            self.send_json({"data": state})
            return

        if parsed.path == "/api/employees":
            search = query.get("search", [""])[0].strip()
            params = "select=*&order=emp_code.asc"
            if search:
                escaped = search.replace("*", "").replace(",", " ")
                params += (
                    "&or=("
                    f"emp_code.ilike.*{escaped}*,"
                    f"fullname.ilike.*{escaped}*,"
                    f"department.ilike.*{escaped}*,"
                    f"position.ilike.*{escaped}*,"
                    f"pay_group.ilike.*{escaped}*"
                    ")"
                )
            status, body = supabase_request("GET", f"employees?{params}")
            self.send_json({"data": body if status < 400 else [], "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/wage-rates/sync":
            rows = payload.get("rows", [])
            if not isinstance(rows, list):
                self.send_json({"error": "rows must be a list"}, 400)
                return
            rates = []
            for item in rows:
                if not isinstance(item, dict):
                    continue
                row = {
                    "item_type": str(item.get("item_type", "")).strip(),
                    "rate": item.get("rate", 0),
                    "effective_date": item.get("effective_date"),
                    "note": item.get("note") or None,
                    "created_by": item.get("created_by") or None,
                }
                if item.get("id") not in [None, ""]:
                    row["id"] = item.get("id")
                if row["item_type"] and row["effective_date"]:
                    rates.append(row)
            status, body = sync_rows_by_id("wage_rates", rates)
            self.send_json({"data": body.get("synced", []) if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/deductions/sync":
            rows = payload.get("rows", [])
            if not isinstance(rows, list):
                self.send_json({"error": "rows must be a list"}, 400)
                return
            deductions = [deduction_from_payload(item) for item in rows if isinstance(item, dict)]
            status, body = sync_rows_by_id("deduction_records", deductions)
            self.send_json({"data": body.get("synced", []) if status < 400 else None, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/time-employees":
            search = query.get("search", [""])[0].strip()
            params = "select=*&order=emp_code.asc"
            if search:
                escaped = search.replace("*", "").replace(",", " ")
                params += (
                    "&or=("
                    f"emp_code.ilike.*{escaped}*,"
                    f"fullname.ilike.*{escaped}*,"
                    f"employee_type.ilike.*{escaped}*"
                    ")"
                )
            status, body = supabase_request("GET", f"time_employees?{params}")
            self.send_json({"data": body if status < 400 else [], "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/deductions":
            employee_kind = query.get("employee_kind", [""])[0].strip()
            start_date = query.get("start_date", [""])[0].strip()
            end_date = query.get("end_date", [""])[0].strip()
            params = "select=*&order=start_date.desc,emp_code.asc,created_at.desc"
            if employee_kind:
                params += f"&employee_kind=eq.{quote(employee_kind)}"
            if start_date:
                params += f"&end_date=gte.{quote(start_date)}"
            if end_date:
                params += f"&start_date=lte.{quote(end_date)}"
            status, body = supabase_request("GET", f"deduction_records?{params}")
            self.send_json({"data": body if status < 400 else [], "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/deduction-applications":
            employee_kind = query.get("employee_kind", [""])[0].strip()
            start_date = query.get("start_date", [""])[0].strip()
            end_date = query.get("end_date", [""])[0].strip()
            params = "select=*&status=eq.Applied&order=applied_date.desc,created_at.desc"
            if employee_kind:
                params += f"&employee_kind=eq.{quote(employee_kind)}"
            if start_date:
                params += f"&applied_date=gte.{quote(start_date)}"
            if end_date:
                params += f"&applied_date=lte.{quote(end_date)}"
            status, body = supabase_request("GET", f"deduction_applications?{params}")
            self.send_json({"data": body if status < 400 else [], "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/accounts":
            ensure_system_accounts()
            search = query.get("search", [""])[0].strip()
            params = "select=*&order=id.asc"
            if search:
                escaped = quote(search.replace("*", "").replace(",", " "))
                params += (
                    "&or=("
                    f"username.ilike.*{escaped}*,"
                    f"fullname.ilike.*{escaped}*,"
                    f"role.ilike.*{escaped}*,"
                    f"user_level.ilike.*{escaped}*"
                    ")"
                )
            status, body = supabase_request("GET", f"account_users?{params}")
            data = [account_to_client(item) for item in body] if status < 400 and isinstance(body, list) else []
            self.send_json({"data": data, "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/wage-rates":
            item_type = query.get("item_type", ["all"])[0].strip()
            params = "select=*&order=effective_date.desc,created_at.desc"
            if item_type and item_type != "all":
                params += f"&item_type=eq.{quote(item_type)}"
            status, body = supabase_request("GET", f"wage_rates?{params}")
            self.send_json({"data": body if status < 400 else [], "error": body if status >= 400 else None}, status)
            return

        if parsed.path == "/api/backup":
            if not backup_authorized(self):
                self.send_json({"error": "Backup code is required."}, 403)
                return
            status, body = read_supabase_backup()
            self.send_json(
                {
                    "exported_at": datetime.utcnow().isoformat() + "Z",
                    "app": "Pismai Factory Wage",
                    "version": 2,
                    "source": "supabase",
                    "data": body if status < 400 else None,
                    "error": body if status >= 400 else None,
                },
                status,
            )
            return

        if parsed.path == "/reports/employee-daily-pdf":
            data = load_data()
            date = query.get("date", [datetime.now().date().isoformat()])[0]
            employee_id = int(query.get("employee_id", ["0"])[0])
            content = build_pdf(data, date, [employee_id])
            self.send_file(content, "application/pdf", f"employee-{employee_id}-{date}.pdf")
            return

        if parsed.path == "/reports/daily-excel":
            data = load_data()
            date = query.get("date", [datetime.now().date().isoformat()])[0]
            content = build_daily_excel(data, date)
            self.send_file(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"daily-production-{date}.xlsx",
            )
            return

        if self.send_static_file(parsed.path):
            return

        self.send_error(404, "Not found")

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def send_json(self, payload: dict, status: int = 200) -> None:
        content = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_file(self, content: bytes, content_type: str, filename: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_static_file(self, request_path: str) -> bool:
        safe_path = request_path.split("?", 1)[0].lstrip("/")
        if not safe_path:
            safe_path = "index.html"
        file_path = (BASE_DIR / safe_path).resolve()
        if not str(file_path).startswith(str(BASE_DIR.resolve())):
            return False
        if not file_path.is_file():
            return False

        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        if file_path.name in {"index.html", "app.js", "styles.css"}:
            self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)
        return True


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), ReportHandler)
    try:
        print(f"Report server running at http://{HOST}:{PORT}", flush=True)
    except Exception:
        pass
    server.serve_forever()


if __name__ == "__main__":
    main()
