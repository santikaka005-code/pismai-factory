import unittest
import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


class ProductionEditorServerTest(unittest.TestCase):
    def test_audit_rows_expose_canonical_database_fields(self):
        row = {
            "id": 9,
            "action": "UPDATE_PRODUCTION",
            "module": "production",
            "description": "edited record",
            "created_by": "admin",
            "user_fullname": "Admin User",
            "created_at": "2026-07-20T10:00:00Z",
            "metadata": {"reason": "correct weight"},
        }

        result = report_server.live_state_to_client("audit_logs", row)

        self.assertEqual(result["action"], "UPDATE_PRODUCTION")
        self.assertEqual(result["detail"], "edited record")
        self.assertEqual(result["created_by"], "admin")
        self.assertEqual(result["reason"], "correct weight")

    def test_edit_route_allows_signed_in_users_and_enforces_self_edit_window(self):
        source = Path("report_server.py").read_text(encoding="utf-8")
        route = source[source.index('production_record_match = re.fullmatch'):source.index('if parsed.path == "/api/state"')]

        self.assertIn("accounting_actor(self, 1)", route)
        self.assertIn("production_record_within_self_edit_window", route)
        self.assertIn("actor_level < 4", route)
        self.assertIn('"action": "UPDATE_PRODUCTION"', route)
        self.assertIn("expected_updated_at", route)
        self.assertIn("production change was rolled back", route)

    def test_c1_to_c3_can_edit_only_their_own_record_within_five_minutes(self):
        actor = {"username": "operator", "level": "C2"}
        account = {"username": "operator", "fullname": "Operator One", "user_level": "C2"}
        now = datetime(2026, 7, 25, 10, 5, tzinfo=timezone.utc)

        self.assertTrue(report_server.production_record_within_self_edit_window(
            {"created_by": "Operator One", "created_at": "2026-07-25T10:00:01Z"},
            actor,
            account,
            now,
        ))
        self.assertFalse(report_server.production_record_within_self_edit_window(
            {"created_by": "Other User", "created_at": "2026-07-25T10:04:30Z"},
            actor,
            account,
            now,
        ))
        self.assertFalse(report_server.production_record_within_self_edit_window(
            {"created_by": "Operator One", "created_at": "2026-07-25T09:59:59Z"},
            actor,
            account,
            now,
        ))

    def test_delete_route_requires_c4_logs_and_restores_on_audit_failure(self):
        source = Path("report_server.py").read_text(encoding="utf-8")
        route = source[source.index('production_delete_match = re.fullmatch'):source.index('production_record_match = re.fullmatch')]

        self.assertIn("accounting_actor(self, 4)", route)
        self.assertIn('"action": "DELETE_PRODUCTION"', route)
        self.assertIn("expected_updated_at", route)
        self.assertIn('"POST",\n                    "production_records"', route)
        self.assertIn("deleted production record was restored", route)

    def test_audit_insert_retries_without_legacy_missing_columns(self):
        responses = [
            (400, {"message": "ip_address column missing"}),
            (201, [{"id": 12}]),
        ]
        with patch.object(report_server, "supabase_request", side_effect=responses) as request:
            status, result = report_server.insert_audit_log_compatible({
                "action": "DELETE_PRODUCTION",
                "metadata": {"before": {"id": 5}},
                "ip_address": "127.0.0.1",
                "user_fullname": "Admin",
            })

        self.assertEqual(status, 201)
        self.assertEqual(result[0]["id"], 12)
        self.assertEqual(request.call_count, 2)
        self.assertNotIn("ip_address", request.call_args_list[1].args[2])
        self.assertIn("metadata", request.call_args_list[1].args[2])

    def test_audit_insert_recovers_from_an_identity_sequence_collision(self):
        responses = [
            (409, {"message": "duplicate key value violates unique constraint"}),
            (409, {"message": "duplicate key value violates unique constraint"}),
            (409, {"message": "duplicate key value violates unique constraint"}),
            (200, [{"id": 243}]),
            (201, [{"id": 244}]),
        ]
        with patch.object(report_server, "supabase_request", side_effect=responses) as request:
            status, result = report_server.insert_audit_log_compatible({
                "action": "UPDATE_PRODUCTION",
                "metadata": {"before": {"id": 243}, "after": {"id": 243}},
                "ip_address": "127.0.0.1",
                "user_fullname": "Admin",
            })

        self.assertEqual(status, 201)
        self.assertEqual(result[0]["id"], 244)
        self.assertEqual(request.call_args_list[3].args[0], "GET")
        self.assertEqual(request.call_args_list[4].args[2]["id"], 244)


if __name__ == "__main__":
    unittest.main()
