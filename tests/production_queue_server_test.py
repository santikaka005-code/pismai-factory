import unittest
from unittest.mock import patch
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


class ProductionQueueServerTests(unittest.TestCase):
    @staticmethod
    def valid_row(**overrides):
        row = {
            "record_date": "2026-08-04",
            "emp_code": "28",
            "fruit_type": "mangosteen",
            "pile_no": "1",
            "water_weight": 17.7,
            "flower_weight": 8.7,
            "amount": 211.2,
            "raw_payload": {
                "client_uid": "queue-row-28",
                "water_rate": 8,
                "flower_rate": 8,
            },
        }
        row.update(overrides)
        return row

    def test_payload_hash_is_stable_for_object_key_order(self):
        first = [{"emp_code": "28", "water_weight": 17.7, "record_date": "2026-08-04"}]
        second = [{"record_date": "2026-08-04", "water_weight": 17.7, "emp_code": "28"}]
        self.assertEqual(
            report_server.production_queue_payload_hash(first),
            report_server.production_queue_payload_hash(second),
        )

    def test_dedupe_key_is_stable_for_same_production_signature(self):
        first = self.valid_row()
        second = self.valid_row(raw_payload={**self.valid_row()["raw_payload"], "client_uid": "another-client"})
        self.assertEqual(
            report_server.production_queue_dedupe_key(first),
            report_server.production_queue_dedupe_key(second),
        )

    def test_exact_duplicate_is_confirmed_without_new_insert(self):
        incoming = {
            "record_date": "2026-08-04",
            "emp_code": "28",
            "fruit_type": "mangosteen",
            "pile_no": "1",
            "water_weight": 17.7,
            "flower_weight": 8.7,
            "raw_payload": {"client_uid": "queue-row-28"},
        }
        existing = {**incoming, "id": 386}
        with patch.object(report_server, "production_duplicate_lookup_rows", return_value=(200, [existing])):
            match_type, rows, details = report_server.inspect_production_queue_rows([incoming])
        self.assertEqual(match_type, "exact")
        self.assertEqual(rows[0]["id"], 386)
        self.assertEqual(details["match_count"], 1)

    def test_worker_rejects_changed_payload_before_insert(self):
        accepted = [{"record_date": "2026-08-04", "emp_code": "28"}]
        changed = [{"record_date": "2026-08-04", "emp_code": "29"}]
        job = {
            "id": 51,
            "status": "processing",
            "record_count": 1,
            "payload": changed,
            "payload_hash": report_server.production_queue_payload_hash(accepted),
        }
        updates = []
        with (
            patch.object(report_server, "update_production_queue", side_effect=lambda queue_id, values, **kwargs: (200, updates.append(values) or values)),
            patch.object(report_server, "production_queue_event"),
            patch.object(report_server, "insert_production_records_compatible") as insert_mock,
        ):
            report_server.process_production_save_queue_job(job)
        insert_mock.assert_not_called()
        self.assertEqual(updates[0]["status"], "needs_review")
        self.assertEqual(updates[0]["error_code"], "payload_hash_mismatch")

    def test_worker_saves_once_and_records_real_ids(self):
        rows = [self.valid_row()]
        job = {
            "id": 53,
            "status": "processing",
            "record_count": 1,
            "attempt_count": 1,
            "max_attempts": 3,
            "payload": rows,
            "payload_hash": report_server.production_queue_payload_hash(rows),
        }
        inserted = [{**rows[0], "id": 501}]
        updates = []
        with (
            patch.object(report_server, "supabase_request", return_value=(200, [{"id": 28, "emp_code": "28"}])),
            patch.object(report_server, "insert_production_records_compatible", return_value=(201, inserted)) as insert_mock,
            patch.object(report_server, "update_production_queue", side_effect=lambda queue_id, values, **kwargs: (200, updates.append(values) or values)),
            patch.object(report_server, "production_queue_event"),
        ):
            report_server.process_production_save_queue_job(job)
        insert_mock.assert_called_once_with(rows)
        self.assertEqual(updates[0]["status"], "succeeded")
        self.assertEqual(updates[0]["result_record_ids"], [501])

    def test_validation_rejects_tampered_amount(self):
        row = self.valid_row(amount=999)
        self.assertIn("rate or amount", report_server.validate_production_queue_rows([row]))

    def test_worker_does_not_insert_for_missing_employee(self):
        rows = [self.valid_row()]
        job = {
            "id": 54,
            "status": "processing",
            "record_count": 1,
            "attempt_count": 1,
            "max_attempts": 3,
            "payload": rows,
            "payload_hash": report_server.production_queue_payload_hash(rows),
        }
        updates = []
        with (
            patch.object(report_server, "supabase_request", return_value=(200, [])),
            patch.object(report_server, "update_production_queue", side_effect=lambda queue_id, values, **kwargs: (200, updates.append(values) or values)),
            patch.object(report_server, "production_queue_event"),
            patch.object(report_server, "insert_production_records_compatible") as insert_mock,
        ):
            report_server.process_production_save_queue_job(job)
        insert_mock.assert_not_called()
        self.assertEqual(updates[0]["status"], "needs_review")
        self.assertEqual(updates[0]["error_code"], "validation_failed")

    def test_worker_links_record_inserted_by_concurrent_worker(self):
        rows = [self.valid_row()]
        existing = [{**rows[0], "id": 777}]
        job = {
            "id": 55,
            "status": "processing",
            "record_count": 1,
            "attempt_count": 1,
            "max_attempts": 3,
            "payload": rows,
            "payload_hash": report_server.production_queue_payload_hash(rows),
        }
        updates = []
        with (
            patch.object(report_server, "supabase_request", return_value=(200, [{"id": 28, "emp_code": "28"}])),
            patch.object(report_server, "insert_production_records_compatible", return_value=(409, {"message": "duplicate key"})),
            patch.object(report_server, "inspect_production_queue_rows", return_value=("exact", existing, {"match_count": 1})),
            patch.object(report_server, "update_production_queue", side_effect=lambda queue_id, values, **kwargs: (200, updates.append(values) or values)),
            patch.object(report_server, "production_queue_event"),
        ):
            report_server.process_production_save_queue_job(job)
        self.assertEqual(updates[0]["status"], "succeeded")
        self.assertEqual(updates[0]["result_record_ids"], [777])


if __name__ == "__main__":
    unittest.main()
