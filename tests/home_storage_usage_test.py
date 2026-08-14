import unittest
from pathlib import Path
from unittest.mock import patch
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


class HomeStorageUsageTests(unittest.TestCase):
    def setUp(self):
        self.assertEqual(report_server.STORAGE_USAGE_CACHE_SECONDS, 15)
        report_server.storage_usage_cache["expires_at"] = 0
        report_server.storage_usage_cache["data"] = None

    def test_usage_calculates_remaining_space_and_warning(self):
        raw = {
            "used_bytes": 450 * 1024 * 1024,
            "limit_bytes": 500 * 1024 * 1024,
            "total_rows": 1234,
        }
        with patch.object(report_server, "supabase_request", return_value=(200, raw)):
            status, usage = report_server.read_database_storage_usage()
        self.assertEqual(status, 200)
        self.assertEqual(usage["remaining_bytes"], 50 * 1024 * 1024)
        self.assertEqual(usage["percent"], 90)
        self.assertTrue(usage["warning"])

    def test_usage_is_cached_for_home_refreshes(self):
        raw = {"used_bytes": 1, "limit_bytes": 100, "total_rows": 2}
        with patch.object(report_server, "supabase_request", return_value=(200, raw)) as request:
            report_server.read_database_storage_usage()
            report_server.read_database_storage_usage()
        request.assert_called_once()


if __name__ == "__main__":
    unittest.main()
