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

    def test_weekly_batch_checks_cloud_once_for_same_employee(self):
        rows = [
            {
                "work_date": f"2026-08-{day:02d}",
                "emp_code": "201",
                "check_in": "08:00",
                "check_out": "17:00",
            }
            for day in range(10, 17)
        ]
        with patch.object(report_server, "supabase_request", return_value=(200, [])) as request:
            status, error = report_server.validate_time_record_conflicts(rows)
        self.assertEqual((status, error), (200, None))
        self.assertEqual(request.call_count, 1)
        self.assertIn("work_date=in.(2026-08-10,2026-08-11", request.call_args.args[1])

    def test_time_update_patches_record_directly(self):
        row = {"id": 9, "work_date": "2026-08-13", "emp_code": "201", "check_in": "08:00", "check_out": "17:00"}
        with patch.object(report_server, "supabase_request", return_value=(200, [row])) as request:
            status, body = report_server.update_time_records_compatible([row])
        self.assertEqual(status, 200)
        self.assertEqual(body, [row])
        self.assertEqual(request.call_count, 1)
        self.assertEqual(request.call_args.args[0], "PATCH")
        self.assertIn("time_records?id=eq.9", request.call_args.args[1])


if __name__ == "__main__":
    unittest.main()
