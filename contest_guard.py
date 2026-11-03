"""Fail closed before cloud access until a separate contest database is verified."""
import json
from pathlib import Path
from urllib.parse import urlsplit

def verify_database_url(url):
    if not url:
        return
    config = json.loads(Path(__file__).with_name('contest-environment.json').read_text(encoding='utf-8'))
    ref = config.get('supabase_project_ref')
    parsed = urlsplit(url)
    if not ref or parsed.scheme != 'https' or parsed.netloc != f'{ref}.supabase.co' or parsed.path not in ('', '/'):
        raise RuntimeError('APWS: database is not the verified contest project; refusing cloud access')
