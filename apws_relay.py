"""Bounded, transient contest relay. No database writes or automatic imports.

Stations consent by starting a connection and sharing its single-use code.
Only the claiming C6+ account may request data. Restarting the service or app
requires pairing again; snapshots exist only during a bounded request.
"""
import secrets
import threading
import time
import uuid


class RelayError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


class Relay:
    def __init__(self):
        self.cv = threading.Condition()
        self.stations = {}
        self.attempts = {}

    def limit(self, key, maximum):
        now = time.monotonic()
        self.attempts = {k: v for k, v in self.attempts.items() if v[0] > now - 600}
        since, count = self.attempts.get(key, (now, 0))
        if count >= maximum:
            raise RelayError('ลองเชื่อมหลายครั้งเกินไป กรุณารอ 10 นาที', 429)
        self.attempts[key] = since, count + 1

    def station(self, body):
        item = self.stations.get(str(body.get('device_id', '')))
        if not item or not secrets.compare_digest(item['token'], str(body.get('token', ''))):
            raise RelayError('การเชื่อมหมดอายุ กรุณาเชื่อมใหม่', 401)
        return item

    def call(self, action, body, owner='', address=''):
        with self.cv:
            now = time.monotonic()
            self.stations = {k: v for k, v in self.stations.items() if now - v['seen'] < 600}
            if action == 'register':
                self.limit(('register', address), 20)
                if len(self.stations) >= 64:
                    raise RelayError('ตัวเชื่อมเต็ม กรุณาลองใหม่ภายหลัง', 503)
                device_id, token = str(uuid.uuid4()), secrets.token_urlsafe(32)
                code = str(secrets.randbelow(9000000000) + 1000000000)
                while any(s['code'] == code for s in self.stations.values()):
                    code = str(secrets.randbelow(9000000000) + 1000000000)
                self.stations[device_id] = dict(token=token, code=code, code_until=now+600,
                    name=str(body.get('name') or 'APWS')[:80], seen=now, owner='', pending=None)
                return dict(device_id=device_id, token=token, code=code)
            if action in ('poll', 'reply', 'disconnect'):
                station = self.station(body)
                if action == 'disconnect':
                    del self.stations[body['device_id']]
                    self.cv.notify_all()
                    return dict(ok=True)
                station['seen'] = now
                if not station['owner'] and now > station['code_until']:
                    del self.stations[body['device_id']]
                    raise RelayError('รหัสหมดอายุ กรุณาสร้างรหัสใหม่', 401)
                pending = station['pending']
                if action == 'reply':
                    if pending and pending['id'] == body.get('request_id') and now < pending['expires']:
                        pending['reply'] = body.get('result')
                        pending['error'] = str(body.get('error') or '')[:500]
                        pending['done'] = True
                        self.cv.notify_all()
                    return dict(ok=True)
                command = None
                if pending and not pending['sent'] and now < pending['expires']:
                    pending['sent'] = True
                    command = {k: pending[k] for k in ('id', 'action', 'body')}
                return dict(paired=bool(station['owner']), command=command)
            if not owner:
                raise RelayError('ต้องเข้าสู่ระบบด้วยสิทธิ์ C6 ขึ้นไป', 403)
            if action == 'claim':
                self.limit(('claim', owner), 10)
                code = str(body.get('code', '')).replace(' ', '').replace('-', '')
                station = next((s for s in self.stations.values() if s['code'] == code and not s['owner'] and now < s['code_until'] and now-s['seen'] < 20), None)
                if not station:
                    raise RelayError('รหัสไม่ถูกต้องหรือหมดอายุ ตรวจรหัสจาก APWS เครื่องชั่ง')
                station['owner'] = owner
                station['code'] = ''
                return dict(paired=True)
            if action == 'discover':
                return dict(devices=[dict(device_id=k, name=s['name'], host='ผ่านเว็บประกวด', online=now-s['seen'] < 20, paired=True)
                    for k, s in self.stations.items() if s['owner'] == owner])
            if action not in ('pull', 'masters'):
                raise RelayError('ไม่พบคำสั่ง', 404)
            station = self.stations.get(str(body.get('device_id', '')))
            if not station or station['owner'] != owner:
                raise RelayError('ไม่พบเครื่องที่เชื่อมกับบัญชีนี้', 404)
            if now-station['seen'] >= 20:
                raise RelayError('เครื่องชั่งออฟไลน์ เปิด APWS และเชื่อมอินเทอร์เน็ตก่อน', 409)
            if station['pending']:
                raise RelayError('เครื่องกำลังทำรายการอื่น กรุณารอสักครู่', 409)
            command = dict(id=secrets.token_urlsafe(18), action=action,
                body={k: v for k, v in body.items() if k in ('start','end','fruit','pile','employees','catalog')},
                expires=now+35, sent=False, done=False)
            station['pending'] = command
            try:
                while not command['done'] and time.monotonic() < command['expires']:
                    self.cv.wait(timeout=min(1, max(0, command['expires']-time.monotonic())))
                if not command['done']:
                    raise RelayError('เครื่องชั่งไม่ตอบกลับ กรุณาตรวจ APWS แล้วลองใหม่', 504)
                if command.get('error'):
                    raise RelayError(command['error'], 409)
                if not isinstance(command.get('reply'), dict):
                    raise RelayError('ข้อมูลตอบกลับไม่ถูกต้อง', 502)
                return command['reply']
            finally:
                station['pending'] = None


relay = Relay()
