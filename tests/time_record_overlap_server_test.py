import unittest
from unittest.mock import patch

import report_server


class TimeRecordOverlapServerTest(unittest.TestCase):
    def validate(self, incoming, existing):
        with patch.object(report_server, "supabase_request", return_value=(200, existing)):
            return report_server.validate_time_record_conflicts([incoming])

    def test_allows_second_non_overlapping_shift(self):
        status, error = self.validate(
            {"work_date": "2026-08-06", "emp_code": "201", "check_in": "12:54", "check_out": "16:43"},
            [{"id": 1, "work_date": "2026-08-06", "emp_code": "201", "check_in": "07:52", "check_out": "11:35"}],
        )
        self.assertEqual((status, error), (200, None))

    def test_rejects_overlapping_shift(self):
        status, error = self.validate(
            {"work_date": "2026-08-06", "emp_code": "201", "check_in": "11:00", "check_out": "16:43"},
            [{"id": 1, "work_date": "2026-08-06", "emp_code": "201", "check_in": "07:52", "check_out": "11:35"}],
        )
        self.assertEqual(status, 409)
        self.assertIn("07:52-11:35", error["error"])

    def test_update_excludes_itself(self):
        status, error = self.validate(
            {"id": 7, "work_date": "2026-08-06", "emp_code": "201", "check_in": "08:00", "check_out": "12:00"},
            [{"id": 7, "work_date": "2026-08-06", "emp_code": "201", "check_in": "07:52", "check_out": "11:35"}],
        )
        self.assertEqual((status, error), (200, None))

    def test_unchanged_legacy_row_does_not_block_bulk_sync(self):
        status, error = self.validate(
            {"id": 7, "work_date": "2026-08-06", "emp_code": "201", "check_in": "08:00", "check_out": "12:00"},
            [
                {"id": 7, "work_date": "2026-08-06", "emp_code": "201", "check_in": "08:00", "check_out": "12:00"},
                {"id": 8, "work_date": "2026-08-06", "emp_code": "201", "check_in": "11:00", "check_out": "13:00"},
            ],
        )
        self.assertEqual((status, error), (200, None))


if __name__ == "__main__":
    unittest.main()
