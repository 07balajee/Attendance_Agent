"""
config.py — POC configuration.
Reads from the SAME .env as the main project. Never imports from hrms.*.
All settings are accessed via the `settings` singleton at the bottom.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from THIS folder first (for standalone zip distribution),
# then fall back to parent folder (when running inside the main project).
_here = Path(__file__).resolve().parent
if (_here / ".env").exists():
    load_dotenv(_here / ".env", override=False)
else:
    load_dotenv(_here.parent / ".env", override=False)


class Settings:
    # ── Supabase ──────────────────────────────────────────────────────────
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_KEY: str = (
        os.getenv("SUPABASE_KEY")
        or SUPABASE_SERVICE_ROLE_KEY
        or os.getenv("SUPABASE_SERVICE_KEY")
        or SUPABASE_ANON_KEY
        or ""
    )

    # ── JWT (read-only — POC issues its own demo tokens) ─────────────────
    JWT_SECRET: str = os.getenv("JWT_SECRET", "poc-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    # ── Gemini (Node 5 LLM) ───────────────────────────────────────────────
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # ── POC server ────────────────────────────────────────────────────────
    POC_PORT: int = int(os.getenv("POC_PORT", "8001"))
    POC_HOST: str = os.getenv("POC_HOST", "127.0.0.1")

    # ── Agent tunables ────────────────────────────────────────────────────
    # How many days a leave/OT/expense can sit Pending before a warning note
    SLA_WARNING_DAYS: int = int(os.getenv("AGENT_SLA_WARNING_DAYS", "2"))
    # How many days before SLA is considered breached
    SLA_BREACH_DAYS: int = int(os.getenv("AGENT_SLA_BREACH_DAYS", "5"))
    # Hour (24h) after which an open sign-in is auto-closed by Node 1
    AUTO_CLOSE_HOUR: int = int(os.getenv("AGENT_AUTO_CLOSE_HOUR", "21"))
    # Rolling window (days) for Node 5 anomaly detection
    ANOMALY_WINDOW_DAYS: int = int(os.getenv("AGENT_ANOMALY_WINDOW_DAYS", "30"))

    # ── Safety ────────────────────────────────────────────────────────────
    # When True, agents only READ — no writes to Supabase (safe demo mode)
    # DEFAULT IS TRUE — must explicitly set AGENT_DRY_RUN=false to write
    DRY_RUN: bool = os.getenv("AGENT_DRY_RUN", "true").lower() == "true"

    @property
    def supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY)

    @property
    def gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY)


settings = Settings()
