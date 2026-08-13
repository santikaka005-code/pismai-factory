import unittest
from unittest.mock import patch

import report_server


class TimeQueueServerTest(unittest.TestCase):
    def setUp(self):
        report_server.time_queue_last_recovery_at = 0.0

    def row(self, **overrides):
        row = {
            "work_date": "2026-08-13", "emp_code": "201", "employee_name": "Worker",
            "check_in": "08:00", "check_out": "17:00", "queue_dedupe_key": "key-1",
            "raw_payload": {"record_date": "2026-08-13", "emp_code": "201", "clock_in": "08:00", "clock_out": "17:00"},
        }
        row.update(overrides)
        return row

    def job(self, rows, **overrides):
        job = {
            "id": 10, "operation": "insert", "status": "processing", "record_count": len(rows),
            "attempt_count": 1, "max_attempts": 3, "payload": rows,
            "payload_hash": report_server.production_queue_payload_hash(rows), "created_by": "tester",
        }
        job.update(overrides)
        return job

    def test_row_key_is_stable_and_unique_per_batch_position(self):
        self.assertEqual(report_server.time_queue_row_key("queue-a", 0), report_server.time_queue_row_key("queue-a", 0))
        self.assertNotEqual(report_server.time_queue_row_key("queue-a", 0), report_server.time_queue_row_key("queue-a", 1))

    def test_worker_recovers_already_inserted_queue_without_duplicate(self):
        rows = [self.row()]
        saved = [{**rows[0], "id": 81}]
        with (
            patch.object(report_server, "time_queue_existing_rows", return_value=(200, saved)),
            patch.object(report_server, "finish_time_queue") as finish,
            patch.object(report_server, "insert_time_records_compatible") as insert,
        ):
            report_server.process_time_save_queue_job(self.job(rows))
        insert.assert_not_called()
        finish.assert_called_once()
        self.assertEqual(finish.call_args.args[2], "idempotent_recovery")

    def test_existing_rows_recovers_exact_shift_when_old_row_has_no_dedupe_key(self):
        queued = self.row(queue_dedupe_key="queue-key")
        saved = {**queued, "id": 91, "queue_dedupe_key": None}
        with patch.object(
            report_server,
            "supabase_request",
            side_effect=[(200, []), (200, [saved])],
        ) as request:
            status, rows = report_server.time_queue_existing_rows([queued])
        self.assertEqual(status, 200)
        self.assertEqual([row["id"] for row in rows], [91])
        self.assertIn("work_date=eq.2026-08-13", request.call_args_list[1].args[1])
        self.assertIn("check_in=eq.08%3A00", request.call_args_list[1].args[1])

    def test_worker_stops_overlapping_time_for_review(self):
        rows = [self.row()]
        with (
            patch.object(report_server, "time_queue_existing_rows", return_value=(200, [])),
            patch.object(report_server, "supabase_request", return_value=(200, [{"id": 1}])),
            patch.object(report_server, "validate_time_record_conflicts", return_value=(409, {"error": "overlap"})),
            patch.object(report_server, "fail_time_queue") as fail,
            patch.object(report_server, "insert_time_records_compatible") as insert,
        ):
            report_server.process_time_save_queue_job(self.job(rows))
        insert.assert_not_called()
        fail.assert_called_once_with(self.job(rows), "time_overlap", "overlap")

    def test_update_uses_direct_patch_path(self):
        rows = [self.row(id=9, queue_dedupe_key=None)]
        updated = [{**rows[0], "id": 9}]
        with (
            patch.object(report_server, "time_queue_existing_rows", return_value=(200, [])),
            patch.object(report_server, "supabase_request", return_value=(200, [{"id": 1}])),
            patch.object(report_server, "validate_time_record_conflicts", return_value=(200, None)),
            patch.object(report_server, "update_time_records_compatible", return_value=(200, updated)) as update,
            patch.object(report_server, "finish_time_queue") as finish,
        ):
            report_server.process_time_save_queue_job(self.job(rows, operation="update"))
        update.assert_called_once_with(rows)
        finish.assert_called_once()

    def test_partial_weekly_recovery_inserts_only_missing_rows(self):
        first = self.row(queue_dedupe_key="key-1")
        second = self.row(work_date="2026-08-14", queue_dedupe_key="key-2",
                          raw_payload={"record_date": "2026-08-14", "emp_code": "201", "clock_in": "08:00", "clock_out": "17:00"})
        recovered = {**first, "id": 81}
        inserted = {**second, "id": 82}
        rows = [first, second]
        with (
            patch.object(report_server, "time_queue_existing_rows", return_value=(200, [recovered])),
            patch.object(report_server, "supabase_request", return_value=(200, [{"id": 1}])),
            patch.object(report_server, "validate_time_record_conflicts", return_value=(200, None)) as validate,
            patch.object(report_server, "insert_time_records_compatible", return_value=(201, [inserted])) as insert,
            patch.object(report_server, "finish_time_queue") as finish,
        ):
            report_server.process_time_save_queue_job(self.job(rows))
        validate.assert_called_once_with([second])
        insert.assert_called_once_with([second])
        self.assertEqual(finish.call_args.args[1], [recovered, inserted])
        self.assertEqual(finish.call_args.args[2], "partial_recovery")

    def test_saved_queue_finishes_with_warning_when_audit_log_is_unavailable(self):
        rows = [{**self.row(), "id": 81}]
        job = self.job(rows, queue_uid="queue-a")
        with (
            patch.object(report_server, "supabase_request", return_value=(503, {"message": "offline"})),
            patch.object(report_server, "update_time_queue", return_value=(200, {"id": 10})) as update,
            patch.object(report_server, "time_queue_event") as event,
        ):
            report_server.finish_time_queue(job, rows)
        values = update.call_args.args[1]
        self.assertEqual(values["status"], "succeeded")
        self.assertEqual(values["error_code"], "audit_log_pending")
        event.assert_called_once()
        self.assertEqual(event.call_args.args[1], "succeeded_audit_pending")

    def test_fallback_claim_recovers_rpc_outage_without_changing_payload(self):
        queued = self.job([self.row()], status="queued", attempt_count=0)
        claimed = {**queued, "status": "processing", "attempt_count": 1}
        responses = [
            (204, None),
            (204, None),
            (200, [queued]),
            (200, [claimed]),
        ]
        with patch.object(report_server, "supabase_request", side_effect=responses) as request:
            status, result = report_server.claim_time_queue_fallback(queued["id"])
        self.assertEqual(status, 200)
        self.assertEqual(result["payload"], queued["payload"])
        self.assertEqual(result["attempt_count"], 1)
        self.assertIn("status=eq.queued", request.call_args_list[3].args[1])

    def test_fallback_moves_retry_limit_to_review_without_deleting_queue(self):
        queued = self.job([self.row()], status="queued", attempt_count=3, max_attempts=3)
        reviewed = {**queued, "status": "needs_review", "error_code": "retry_limit_reached"}
        responses = [(204, None), (204, None), (200, [queued]), (200, [reviewed])]
        with (
            patch.object(report_server, "supabase_request", side_effect=responses),
            patch.object(report_server, "time_queue_event") as event,
        ):
            status, result = report_server.claim_time_queue_fallback(queued["id"])
        self.assertEqual(status, 200)
        self.assertIsNone(result)
        event.assert_called_once()


if __name__ == "__main__":
    unittest.main()
