import base64
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


class IssueReportServerTests(unittest.TestCase):
    def valid_payload(self):
        return {
            "title": "Save button is slow",
            "category": "performance",
            "page_name": "Production entry",
            "priority": "urgent",
            "description": "The save action takes longer than expected.",
        }

    def test_issue_reports_are_backed_up_but_not_cleared(self):
        self.assertIn("issue_reports", report_server.BACKUP_TABLES)
        self.assertNotIn("issue_reports", report_server.MAIN_CLEAR_TABLES)

    def test_valid_png_attachment_is_preserved(self):
        payload = self.valid_payload()
        payload.update({
            "attachment_name": "screen.png",
            "attachment_data": "data:image/png;base64," + base64.b64encode(b"png-data").decode(),
        })
        normalized, error = report_server.validate_issue_report_payload(payload)
        self.assertIsNone(error)
        self.assertEqual(normalized["attachment_name"], "screen.png")
        self.assertEqual(normalized["attachment_type"], "image/png")
        self.assertEqual(normalized["attachment_data"], payload["attachment_data"])

    def test_non_image_attachment_is_rejected(self):
        payload = self.valid_payload()
        payload["attachment_data"] = "data:text/plain;base64,SGVsbG8="
        normalized, error = report_server.validate_issue_report_payload(payload)
        self.assertIsNone(normalized)
        self.assertIn("PNG or JPG", error)


if __name__ == "__main__":
    unittest.main()
