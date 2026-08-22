const assert = require("node:assert/strict");
const fs = require("node:fs");

const room = fs.readFileSync("secret-room.js", "utf8");
const server = fs.readFileSync("report_server.py", "utf8");

assert.match(room, /image\/png,image\/jpeg,image\/webp,application\/pdf/);
assert.match(room, /ไฟล์แนบต้องมีขนาดไม่เกิน 5 MB/);
assert.match(room, /attachment_data: attachment\?\.data/);
assert.match(room, /message-attachment-image/);
assert.match(room, /message-file-card/);
assert.match(server, /SECRET_CHAT_ATTACHMENT_BUCKET = "secret-chat-attachments"/);
assert.match(server, /SECRET_CHAT_ATTACHMENT_MAX_BYTES = 5 \* 1024 \* 1024/);
assert.match(server, /account_level_number/);
assert.match(server, /sign_secret_chat_attachment/);

console.log("Secret chat attachment UI tests passed.");
