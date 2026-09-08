"""
database.py — Thin Supabase REST wrapper for the POC.

Deliberately does NOT import anything from hrms.*. Uses supabase-py directly
against the same project the main app uses. All writes are guarded by the
DRY_RUN flag in config — set AGENT_DRY_RUN=true in .env to make the POC
completely read-only.
"""
import logging
from typing import Any, Dict, List, Optional

from supabase import create_client, Client
from config import settings

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_client() -> Client:
    """Return a cached supabase-py client pointed at the real project DB."""
    global _client
    if _client is None:
        if not settings.supabase_configured:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY are not set in .env. "
                "The POC needs real Supabase credentials to run."
            )
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info("POC Supabase client initialised → %s", settings.SUPABASE_URL)
    return _client


# ── Convenience helpers ───────────────────────────────────────────────────────

def fetch_all(table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
    """SELECT * FROM table WHERE filters."""
    db = get_client()
    q = db.table(table).select("*")
    for col, val in (filters or {}).items():
        q = q.eq(col, val)
    res = q.execute()
    return res.data or []


def fetch_one(table: str, filters: Dict[str, Any]) -> Optional[Dict]:
    rows = fetch_all(table, filters)
    return rows[0] if rows else None


def patch(table: str, record_id: str, payload: Dict[str, Any]) -> Optional[Dict]:
    """UPDATE table SET payload WHERE id = record_id.
    Respects DRY_RUN — logs the intended write but does nothing."""
    if settings.DRY_RUN:
        logger.info("[DRY_RUN] PATCH %s id=%s payload=%s", table, record_id, payload)
        return {"id": record_id, **payload, "_dry_run": True}
    db = get_client()
    res = db.table(table).update(payload).eq("id", record_id).execute()
    return res.data[0] if res.data else None


def patch_filter(table: str, filters: Dict[str, Any], payload: Dict[str, Any]) -> List[Dict]:
    """UPDATE table SET payload WHERE filters (multi-row)."""
    if settings.DRY_RUN:
        logger.info("[DRY_RUN] PATCH_FILTER %s filters=%s payload=%s", table, filters, payload)
        return [{"_dry_run": True, **payload}]
    db = get_client()
    q = db.table(table).update(payload)
    for col, val in filters.items():
        q = q.eq(col, val)
    res = q.execute()
    return res.data or []


def insert(table: str, payload: Dict[str, Any]) -> Optional[Dict]:
    """INSERT INTO table VALUES payload."""
    if settings.DRY_RUN:
        logger.info("[DRY_RUN] INSERT %s payload=%s", table, payload)
        return {"_dry_run": True, **payload}
    db = get_client()
    res = db.table(table).insert([payload]).execute()
    return res.data[0] if res.data else None


def fetch_gte(table: str, col: str, val: str, extra_filters: Optional[Dict] = None) -> List[Dict]:
    """SELECT * FROM table WHERE col >= val AND extra_filters."""
    db = get_client()
    q = db.table(table).select("*").gte(col, val)
    for k, v in (extra_filters or {}).items():
        q = q.eq(k, v)
    res = q.execute()
    return res.data or []


def fetch_range(table: str, date_col: str, from_date: str, to_date: str,
                extra_filters: Optional[Dict] = None) -> List[Dict]:
    """SELECT * FROM table WHERE date_col BETWEEN from_date AND to_date."""
    db = get_client()
    q = db.table(table).select("*").gte(date_col, from_date).lte(date_col, to_date)
    for k, v in (extra_filters or {}).items():
        q = q.eq(k, v)
    res = q.execute()
    return res.data or []
