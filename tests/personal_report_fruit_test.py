from io import BytesIO
from pathlib import Path
import sys

from openpyxl import load_workbook

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


DATA = {
    "employees": [{"id": 1, "emp_code": "02", "fullname": "Test Employee"}],
    "production_records": [
        {
            "employee_id": 1,
            "record_date": "2026-07-20",
            "fruit_type": "mangosteen",
            "pile_no": 1,
            "water_weight": 10,
            "flower_weight": 5,
            "total_weight": 15,
            "total_amount": 90,
        },
        {
            "employee_id": 1,
            "record_date": "2026-07-20",
            "fruit_type": "durian",
            "pile_no": 2,
            "grade_weights": {"A": 8, "B": 2},
            "total_weight": 10,
            "total_amount": 40,
        },
    ],
    "deduction_records": [],
}


def workbook_headers(content):
    workbook = load_workbook(BytesIO(content))
    return [cell.value for cell in workbook.active[5]]


def test_personal_records_are_filtered_by_fruit():
    mangosteen = report_server.employee_range_records(
        DATA, "2026-07-20", "2026-07-20", 1, "mangosteen"
    )
    durian = report_server.employee_range_records(
        DATA, "2026-07-20", "2026-07-20", 1, "durian"
    )
    assert len(mangosteen) == 1
    assert mangosteen[0]["total_amount"] == 90
    assert len(durian) == 1
    assert durian[0]["total_amount"] == 40


def test_personal_exports_use_selected_fruit_columns():
    mangosteen_excel = report_server.build_employee_range_excel(
        DATA, "2026-07-20", "2026-07-20", 1, "mangosteen"
    )
    durian_excel = report_server.build_employee_range_excel(
        DATA, "2026-07-20", "2026-07-20", 1, "durian"
    )
    mangosteen_headers = workbook_headers(mangosteen_excel)
    durian_headers = workbook_headers(durian_excel)
    assert "ทุเรียนเกรด A-E" not in mangosteen_headers
    assert "น้ำหนักน้ำ" in mangosteen_headers
    assert "เกรด A" in durian_headers
    assert "น้ำหนักน้ำ" not in durian_headers

    mangosteen_pdf = report_server.build_employee_range_pdf(
        DATA, "2026-07-20", "2026-07-20", 1, "mangosteen"
    )
    durian_pdf = report_server.build_employee_range_pdf(
        DATA, "2026-07-20", "2026-07-20", 1, "durian"
    )
    assert mangosteen_pdf.startswith(b"%PDF")
    assert durian_pdf.startswith(b"%PDF")


if __name__ == "__main__":
    test_personal_records_are_filtered_by_fruit()
    test_personal_exports_use_selected_fruit_columns()
    print("Personal report fruit separation tests passed.")
