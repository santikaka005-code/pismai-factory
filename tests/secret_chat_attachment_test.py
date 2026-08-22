import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_server


class SecretChatAttachmentTests(unittest.TestCase):
    def test_plain_message_remains_compatible(self):
        self.assertEqual(report_server.parse_secret_chat_content("hello"), {"content": "hello"})

    def test_attachment_metadata_is_hidden_from_message_text(self):
        stored = report_server.SECRET_CHAT_ATTACHMENT_PREFIX + json.dumps({
            "text": "เอกสารครับ",
            "name": "report.pdf",
            "type": "application/pdf",
            "size": 1200,
            "path": "user/2026/08/token-report.pdf",
        })
        parsed = report_server.parse_secret_chat_content(stored)
        self.assertEqual(parsed["content"], "เอกสารครับ")
        self.assertEqual(parsed["attachment_name"], "report.pdf")
        self.assertEqual(parsed["attachment_type"], "application/pdf")
        self.assertEqual(parsed["attachment_size"], 1200)

    @patch.object(report_server, "sign_secret_chat_attachment", return_value="https://signed.example/file")
    def test_client_message_gets_temporary_attachment_url(self, _sign):
        stored = report_server.SECRET_CHAT_ATTACHMENT_PREFIX + json.dumps({
            "text": "",
            "name": "photo.webp",
            "type": "image/webp",
            "size": 50,
            "path": "user/photo.webp",
        })
        result = report_server.secret_chat_message_to_client({"id": 1, "content": stored})
        self.assertEqual(result["attachment_url"], "https://signed.example/file")
        self.assertNotIn("attachment_path", result)


if __name__ == "__main__":
    unittest.main()
