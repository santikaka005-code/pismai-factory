import unittest
from unittest.mock import patch
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


class BackupClearServerTests(unittest.TestCase):
    def test_main_clear_keeps_master_and_audit_tables(self):
        for table in ["account_users", "employees", "time_employees", "wage_rates", "audit_logs", "issue_reports"]:
            self.assertNotIn(table, report_server.MAIN_CLEAR_TABLES)
        for table in ["production_records", "time_records", "deduction_records", "deduction_applications"]:
            self.assertIn(table, report_server.MAIN_CLEAR_TABLES)
        self.assertIn("inbound_receipts", report_server.MAIN_CLEAR_TABLES)
        self.assertNotIn("inbound_fruits", report_server.MAIN_CLEAR_TABLES)
        self.assertNotIn("inbound_fruit_prices", report_server.MAIN_CLEAR_TABLES)
        self.assertLess(
            report_server.BACKUP_TABLES.index("production_save_queue"),
            report_server.BACKUP_TABLES.index("production_save_queue_events"),
        )

    def test_queue_clear_only_deletes_finished_queue_ids_and_their_events(self):
        data = {
            "production_save_queue": [
                {"id": 1, "status": "succeeded"},
                {"id": 2, "status": "processing"},
                {"id": 3, "status": "cancelled"},
                {"id": 4, "status": "needs_review"},
            ],
            "production_save_queue_events": [
                {"id": 11, "queue_id": 1},
                {"id": 12, "queue_id": 2},
                {"id": 13, "queue_id": 3},
                {"id": 14, "queue_id": 4},
            ],
        }
        deleted_paths = []

        def fake_request(method, path, **_kwargs):
            self.assertEqual(method, "DELETE")
            deleted_paths.append(path)
            ids = [int(value) for value in re.search(r"id=in\.\(([^)]+)\)", path).group(1).split(",")]
            return 200, [{"id": value} for value in ids]

        with patch.object(report_server, "supabase_request", side_effect=fake_request):
            complete, cleared, error = report_server.delete_backup_snapshot_rows(data, "queue")

        self.assertTrue(complete)
        self.assertIsNone(error)
        self.assertEqual(cleared["production_save_queue_events"], 2)
        self.assertEqual(cleared["production_save_queue"], 2)
        self.assertIn("production_save_queue_events?id=in.(11,13)", deleted_paths)
        self.assertIn("production_save_queue?id=in.(1,3)", deleted_paths)
        self.assertFalse(any("2" in path.split("in.(", 1)[1] for path in deleted_paths))
        self.assertFalse(any("4" in path.split("in.(", 1)[1] for path in deleted_paths))

    def test_archive_checksum_detects_changed_content(self):
        payload = report_server.backup_snapshot_payload("queue", "admin", {"production_save_queue": [{"id": 1}]})
        content = report_server.backup_archive_bytes(payload)
        self.assertEqual(report_server.backup_archive_checksum(content), report_server.backup_archive_checksum(content))
        self.assertNotEqual(report_server.backup_archive_checksum(content), report_server.backup_archive_checksum(content + b"changed"))


if __name__ == "__main__":
    unittest.main()
