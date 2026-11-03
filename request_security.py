"""Small, bounded request controls shared by the HTTP handler."""
import json
import math
import threading
import time
from collections import OrderedDict, deque


class RequestError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


class LoginLimiter:
    def __init__(self, limit=20):
        self.limit = limit
        self.lock = threading.Lock()
        self.attempts = OrderedDict()

    def allow(self, address):
        now = time.monotonic()
        with self.lock:
            attempts = self.attempts.pop(address, deque())
            while attempts and attempts[0] < now - 300:
                attempts.popleft()
            allowed = len(attempts) < self.limit
            if allowed:
                attempts.append(now)
            self.attempts[address] = attempts
            while len(self.attempts) > 10000:
                self.attempts.popitem(last=False)
            return allowed


login_limiter = LoginLimiter()
login_address_limiter = LoginLimiter(200)


def read_object(handler):
    get_all = getattr(handler.headers, 'get_all', None)
    if get_all and len(get_all('Content-Length') or []) > 1:
        raise RequestError('Multiple Content-Length headers are not supported.')
    if handler.headers.get('Transfer-Encoding'):
        raise RequestError('Transfer-Encoding is not supported.')
    try:
        length = int(handler.headers.get('Content-Length', '0'))
    except (ValueError, TypeError):
        raise RequestError('Invalid Content-Length.')
    if length < 0 or length > 12_000_000:
        raise RequestError('Request exceeds the 12 MB limit.', 413)
    if not length:
        return {}
    if handler.headers.get('Content-Type', '').split(';')[0].strip().lower() != 'application/json':
        raise RequestError('Content-Type must be application/json.', 415)
    def constant(value):
        raise ValueError('Non-finite number')
    def unique_pairs(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('Duplicate JSON key')
            result[key] = value
        return result
    try:
        content = handler.rfile.read(length)
        if len(content) != length:
            raise ValueError('Incomplete body')
        value = json.loads(content.decode('utf-8'), parse_constant=constant, object_pairs_hook=unique_pairs)
        if not isinstance(value, dict):
            raise ValueError('Object required')
        def finite(item):
            if isinstance(item, float) and not math.isfinite(item):
                raise ValueError('Non-finite number')
            if isinstance(item, dict):
                for child in item.values(): finite(child)
            elif isinstance(item, list):
                for child in item: finite(child)
        finite(value)
        return value
    except (UnicodeError, ValueError, RecursionError):
        raise RequestError('Invalid JSON object.')
