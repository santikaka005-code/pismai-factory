"""File-level Desktop imports. Pure preparation; network supplied by the server."""
import hashlib
import json
import math
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime
from decimal import Decimal, InvalidOperation


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def digest(value):
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()


def raw_record(row):
    return row.get('raw_payload') if isinstance(row.get('raw_payload'), dict) else row


def is_desktop(row):
    raw = raw_record(row)
    return raw.get('import_source') == 'pf-desktop-app' and isinstance(raw.get('desktop_import'), dict)


def row_identity(row):
    """Ignore filename/export time, wages and server IDs; retain weighing facts."""
    raw = raw_record(row)
    meta = raw.get('desktop_import') or {}
    return {
        'station': str(meta.get('station_id') or ''),
        'record': str(meta.get('record_id') or ''),
        'capture': str(meta.get('capture_id') or ''),
        'at': str(meta.get('recorded_at') or ''),
        'date': str(raw.get('record_date') or row.get('record_date') or ''),
        'employee': str(raw.get('emp_code') or row.get('emp_code') or ''),
        'fruit': str(raw.get('fruit_type') or row.get('fruit_type') or ''),
        'pile': int(raw.get('pile_no') or row.get('pile_no') or 0),
        'water': float(raw.get('water_weight') or 0),
        'flower': float(raw.get('flower_weight') or 0),
        'weight': float(raw.get('total_weight') or row.get('total_weight') or 0),
        'raw_kg': str(Decimal(str(meta.get('raw_kg'))).normalize()),
        'tenths': int(meta.get('tenths')),
    }


def file_manifest(rows, filename=''):
    counts = Counter(digest(row_identity(r)) for r in rows)
    dates = sorted({row_identity(r)['date'] for r in rows})
    return {'hash': digest(sorted(counts.items())), 'rows': dict(counts),
            'count': len(rows), 'dates': dates, 'name': filename}


def validate_records(records):
    if not isinstance(records, list) or not 1 <= len(records) <= 5000:
        raise ValueError('หนึ่งไฟล์ต้องมีรายการที่นำเข้าได้ 1–5,000 รายการ')
    identities = set()
    captures = set()
    for index, row in enumerate(records, 1):
        if not isinstance(row, dict):
            raise ValueError(f'แถว {index}: รูปแบบรายการไม่ถูกต้อง')
        meta = row.get('desktop_import')
        if not isinstance(meta, dict):
            raise ValueError(f'แถว {index}: ไม่มีข้อมูลอ้างอิงจากเครื่องชั่ง')
        try:
            ident = row_identity(row)
            day = date.fromisoformat(ident['date'])
            captured = datetime.fromisoformat(ident['at'])
            tenths = meta.get('tenths')
            kg = Decimal(str(meta.get('raw_kg')))
            values = [ident[k] for k in ('water', 'flower', 'weight')]
            valid = (
                meta.get('schema') == 'pff.weighing.v1'
                and ident['station'] and ident['record'] and ident['capture']
                and ident['at'][:10] == day.isoformat()
                and captured.tzinfo is not None
                and ident['employee'] and ident['fruit'] and 1 <= ident['pile'] <= 99
                and type(tenths) is int and tenths > 0
                and kg.is_finite() and kg > 0 and int(kg * 10) == tenths
                and all(math.isfinite(v) and v >= 0 for v in values)
                and abs(ident['weight'] - tenths / 10) < 0.00001
                and not row.get('simulated') and not row.get('void_at') and not row.get('void_reason')
            )
        except (ValueError, TypeError, OverflowError, InvalidOperation):
            valid = False
        if not valid:
            raise ValueError(f'แถว {index}: ข้อมูลเครื่องชั่ง วันที่ หรือค่าน้ำหนักไม่สอดคล้องกัน')
        event = (ident['station'], ident['record'])
        capture = (ident['station'], ident['capture'])
        if event in identities or capture in captures:
            raise ValueError(f'แถว {index}: รหัสรายการหรือรอบชั่งซ้ำในไฟล์ กรุณาตรวจต้นฉบับ')
        identities.add(event)
        captures.add(capture)


def prepare_file(records, filename, actor, convert, validate, payload_hash, weight_total):
    filename = unicodedata.normalize('NFC', str(filename or '').replace('\\', '/').split('/')[-1]).strip()
    if not filename or len(filename) > 255:
        raise ValueError('กรุณาระบุชื่อไฟล์ที่นำเข้า')
    validate_records(records)
    manifest = file_manifest(records, filename)
    file_hash = manifest['hash']
    groups = defaultdict(list)
    # Canonical order makes renamed/reordered files and network retries identical.
    for index, record in enumerate(sorted(records, key=lambda r: canonical(row_identity(r)))):
        raw = dict(record)
        raw.pop('id', None)
        meta = dict(raw['desktop_import'])
        meta.update(file_hash=file_hash, file_name=filename,
                    file_name_key=filename.casefold(), file_start=manifest['dates'][0],
                    file_end=manifest['dates'][-1], file_policy='whole-file-v1', file_row=index)
        event_uid = 'pff-event:' + digest([meta['station_id'], meta['capture_id']])
        raw.update(client_uid=event_uid,
                   import_source='pf-desktop-app', imported_by=actor,
                   created_by='Import', updated_by='Import', desktop_import=meta)
        groups[(raw['record_date'], str(raw['emp_code']), raw['fruit_type'])].append(raw)
    jobs = []
    for key in sorted(groups):
        source_rows = groups[key]
        for offset in range(0, len(source_rows), 100):
            queue_uid = f'pff-file:{file_hash}:q{len(jobs)}'
            converted = []
            for raw in source_rows[offset:offset + 100]:
                raw['batch_uid'] = queue_uid
                row = convert('production_records', raw)
                row.pop('id', None)
                row['queue_dedupe_key'] = digest(['desktop-event', raw['client_uid']])
                converted.append(row)
            if not jobs:
                converted[0]['raw_payload']['desktop_import']['file_manifest'] = manifest
            error = validate(converted)
            if error:
                raise ValueError(error)
            first = converted[0]
            jobs.append(dict(queue_uid=queue_uid, batch_uid=queue_uid, payload=converted,
                             payload_hash=payload_hash(converted), record_count=len(converted),
                             fruit_type=key[2], record_date=key[0], employee_id=first.get('employee_id'),
                             emp_code=key[1], employee_name=first.get('employee_name', ''),
                             total_weight=round(sum(weight_total(r) for r in converted), 3),
                             total_amount=round(sum(float(r.get('amount') or 0) for r in converted), 2),
                             status='queued', created_by=actor))
    return manifest, jobs


def compare_files(incoming, previous):
    """Multiset overlap / larger file: preserve repeated occurrences and split files."""
    a = Counter(incoming['rows'])
    result = []
    seen = set()
    for old in previous:
        if old['hash'] in seen:
            continue
        seen.add(old['hash'])
        b = Counter(old['rows'])
        matches = sum((a & b).values())
        denominator = max(sum(a.values()), sum(b.values()))
        if not denominator:
            continue
        exact = a == b
        if exact or matches * 10 >= denominator * 9:
            result.append({'hash': old['hash'], 'file_name': old.get('name') or 'ไฟล์นำเข้ารุ่นเดิม',
                           'matched': matches, 'total': denominator,
                           'percent': round(matches / denominator * 100, 2), 'exact': exact})
    return sorted(result, key=lambda item: (not item['exact'], -item['percent'], item['hash']))


def load_history(manifest, get_all):
    """Use durable queue metadata as the file ledger; no browser-local history."""
    base = 'production_save_queue?select=id,file_meta:payload->0->raw_payload->desktop_import'
    base += '&payload->0->raw_payload->desktop_import->file_manifest=not.is.null'
    from urllib.parse import quote
    # Filename is checked first, but never establishes a duplicate by itself.
    queries = [base + '&payload->0->raw_payload->desktop_import->>file_name_key=eq.' + quote(manifest['name'].casefold(), safe=''),
               base + '&payload->0->raw_payload->desktop_import->>file_start=lte.' + manifest['dates'][-1]
               + '&payload->0->raw_payload->desktop_import->>file_end=gte.' + manifest['dates'][0]]
    found = []
    for query in queries:
        status, rows = get_all(query)
        if status >= 400 or not isinstance(rows, list):
            raise RuntimeError('ตรวจประวัติไฟล์จากฐานกลางไม่สำเร็จ ยังไม่รับไฟล์เพื่อป้องกันการบันทึกซ้ำ')
        for row in rows:
            meta = row.get('file_meta') or {}
            if isinstance(meta.get('file_manifest'), dict):
                found.append(meta['file_manifest'])
    # Old Desktop queues retain their original payload even when the old worker
    # collapsed equal weights. Reconstruct complete old files by export_id.
    status, legacy = get_all('production_save_queue?select=id,payload'
        '&payload->0->raw_payload->>import_source=eq.pf-desktop-app'
        '&payload->0->raw_payload->desktop_import->>file_hash=is.null')
    if status >= 400 or not isinstance(legacy, list):
        raise RuntimeError('ตรวจประวัติไฟล์นำเข้ารุ่นเดิมไม่สำเร็จ')
    exports = defaultdict(dict)
    for job in legacy:
        for row in job.get('payload') or []:
            raw = raw_record(row)
            meta = raw.get('desktop_import') or {}
            if meta.get('export_id'):
                exports[(meta.get('station_id'), meta['export_id'])][meta.get('record_id')] = row
    for rows in exports.values():
        try:
            found.append(file_manifest(list(rows.values())))
        except (ValueError, TypeError, InvalidOperation):
            raise RuntimeError('ประวัติไฟล์เดิมมีข้อมูลไม่ครบ ต้องตรวจสอบก่อนนำเข้า')
    return found
