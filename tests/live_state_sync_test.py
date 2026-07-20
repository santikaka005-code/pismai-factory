from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


def run_collision_case(incoming, existing, expected_method):
    calls = []

    def fake_request(method, path, payload=None, prefer=""):
        calls.append((method, path, payload))
        if method == "GET" and "order=id.desc" in path:
            return 200, [{"id": 42}]
        if method == "GET":
            return 200, existing
        return 200, [{**(payload or {})}]

    original = report_server.supabase_request
    report_server.supabase_request = fake_request
    try:
        status, _ = report_server.sync_rows_by_id("production_records", [incoming])
    finally:
        report_server.supabase_request = original

    assert status == 200
    write_call = calls[-1]
    assert write_call[0] == expected_method
    if expected_method == "POST":
        assert write_call[2]["id"] == 43


def test_browser_id_collision_allocates_central_id():
    run_collision_case(
        {"id": 7, "raw_payload": {"client_uid": "new"}},
        [{"id": 7, "raw_payload": {"client_uid": "other"}}],
        "POST",
    )


def test_same_record_updates_without_duplication():
    run_collision_case(
        {"id": 7, "raw_payload": {"client_uid": "same"}},
        [{"id": 7, "raw_payload": {"client_uid": "same"}}],
        "PATCH",
    )


if __name__ == "__main__":
    test_browser_id_collision_allocates_central_id()
    test_same_record_updates_without_duplication()
    print("Multi-browser central sync tests passed.")
