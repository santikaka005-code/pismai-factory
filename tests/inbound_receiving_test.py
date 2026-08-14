import unittest
from pathlib import Path

import report_server


ROOT = Path(__file__).resolve().parents[1]


class InboundReceivingTests(unittest.TestCase):
    def test_receipts_are_backed_up_and_cleared_but_master_data_is_retained(self):
        self.assertIn("inbound_fruits", report_server.BACKUP_TABLES)
        self.assertIn("inbound_fruit_prices", report_server.BACKUP_TABLES)
        self.assertIn("inbound_receipts", report_server.BACKUP_TABLES)
        self.assertIn("inbound_receipts", report_server.MAIN_CLEAR_TABLES)
        self.assertNotIn("inbound_fruits", report_server.MAIN_CLEAR_TABLES)
        self.assertNotIn("inbound_fruit_prices", report_server.MAIN_CLEAR_TABLES)

    def test_server_computes_receipt_total_and_does_not_accept_client_total(self):
        source = (ROOT / "report_server.py").read_text(encoding="utf-8")
        self.assertIn("total = round(weight * price + 1e-9, 2)", source)
        self.assertIn('"total_amount": total', source)
        inbound_block = source[source.index('if parsed.path == "/api/inbound/receipts"'):source.index('if parsed.path == "/api/online-users"')]
        self.assertNotIn('payload.get("total_amount")', inbound_block)

    def test_ui_distinguishes_recommended_and_actual_transaction_price(self):
        source = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("ราคาของรายการนี้", source)
        self.assertIn("ราคานี้จะถูกเก็บถาวรกับรายการ", source)
        self.assertIn("inboundLatestSupplierReceipt", source)

    def test_inbound_is_hidden_below_c5_and_server_enforces_the_same_level(self):
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        server_source = (ROOT / "report_server.py").read_text(encoding="utf-8")
        for level in ["C1", "C2", "C3"]:
            access_line = next(line for line in app_source.splitlines() if line.strip().startswith(f"{level}:"))
            self.assertNotIn('"inbound"', access_line)
        c4_block = app_source[app_source.index("  C4: ["):app_source.index("  C5:")]
        self.assertNotIn('"inbound"', c4_block)
        self.assertIn('item.id !== "inbound" || canOpen(user, "inbound")', app_source)
        self.assertIn('account_level_number(actor.get("level")) >= 5', server_source)
        self.assertEqual(server_source.count("actor = inbound_authorized_actor(self)"), 4)

    def test_migration_has_snapshot_fields_and_positive_constraints(self):
        sql = (ROOT / "supabase_inbound_receiving_migration.sql").read_text(encoding="utf-8")
        for field in ["supplier_name", "fruit_name", "weight_kg", "price_per_kg", "total_amount", "client_uid"]:
            self.assertIn(field, sql)
        self.assertIn("check (weight_kg > 0)", sql)
        self.assertIn("check (price_per_kg > 0)", sql)


if __name__ == "__main__":
    unittest.main()
