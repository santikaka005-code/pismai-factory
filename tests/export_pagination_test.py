from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


def test_supabase_get_all_reads_past_first_100_rows():
    source = [{"id": index} for index in range(1, 251)]
    calls = []

    def fake_request(method, path, payload=None, prefer=None, timeout_seconds=20, extra_headers=None):
        calls.append((method, path, extra_headers))
        start, end = (int(value) for value in extra_headers["Range"].split("-"))
        return 200, source[start : end + 1]

    original = report_server.supabase_request
    report_server.supabase_request = fake_request
    try:
        status, rows = report_server.supabase_get_all("production_records?select=*&order=id.asc", page_size=100)
    finally:
        report_server.supabase_request = original

    assert status == 200
    assert rows == source
    assert [call[2]["Range"] for call in calls] == ["0-99", "100-199", "200-299"]


def test_supabase_get_all_stops_and_returns_database_error():
    calls = 0

    def fake_request(method, path, payload=None, prefer=None, timeout_seconds=20, extra_headers=None):
        nonlocal calls
        calls += 1
        if calls == 1:
            return 200, [{"id": index} for index in range(100)]
        return 503, {"error": "temporary failure"}

    original = report_server.supabase_request
    report_server.supabase_request = fake_request
    try:
        status, body = report_server.supabase_get_all("time_records?select=*", page_size=100)
    finally:
        report_server.supabase_request = original

    assert status == 503
    assert body == {"error": "temporary failure"}


def test_export_builders_do_not_silently_slice_rows():
    source = Path(report_server.__file__).read_text(encoding="utf-8")
    forbidden = ("records[:80]", "records[:100]", "employee_rows[:80]")
    assert not any(fragment in source for fragment in forbidden)

    app_source = Path(report_server.__file__).with_name("app.js").read_text(encoding="utf-8")
    assert "records.slice(0, 200).map(renderGroupReportDetailRow)" not in app_source


if __name__ == "__main__":
    test_supabase_get_all_reads_past_first_100_rows()
    test_supabase_get_all_stops_and_returns_database_error()
    test_export_builders_do_not_silently_slice_rows()
    print("Export pagination tests passed.")
