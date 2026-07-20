import unittest
import sys
from pathlib import Path

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

    def test_route_requires_c4_and_creates_audit_before_success(self):
        source = Path("report_server.py").read_text(encoding="utf-8")
        route = source[source.index('production_record_match = re.fullmatch'):source.index('if parsed.path == "/api/state"')]

        self.assertIn("accounting_actor(self, 4)", route)
        self.assertIn('"action": "UPDATE_PRODUCTION"', route)
        self.assertIn("expected_updated_at", route)
        self.assertIn("production change was rolled back", route)

    def test_delete_route_requires_c4_logs_and_restores_on_audit_failure(self):
        source = Path("report_server.py").read_text(encoding="utf-8")
        route = source[source.index('production_delete_match = re.fullmatch'):source.index('production_record_match = re.fullmatch')]

        self.assertIn("accounting_actor(self, 4)", route)
        self.assertIn('"action": "DELETE_PRODUCTION"', route)
        self.assertIn("expected_updated_at", route)
        self.assertIn('"POST",\n                    "production_records"', route)
        self.assertIn("deleted production record was restored", route)


if __name__ == "__main__":
    unittest.main()
