from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def _env_path(name: str, default: Path) -> Path:
    value = os.getenv(name, "").strip()
    return Path(value).expanduser().resolve() if value else default.resolve()


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    state_file: Path
    sample_file: Path
    audit_file: Path
    session_cookie: str
    read_password: str
    edit_password: str


def load_settings() -> Settings:
    return Settings(
        host=os.getenv("TRACKER_HOST", "127.0.0.1"),
        port=int(os.getenv("TRACKER_PORT", "8787")),
        state_file=_env_path("TRACKER_STATE_FILE", BASE_DIR / "drink_tracker_state.json"),
        sample_file=_env_path("TRACKER_SAMPLE_FILE", BASE_DIR / "drink_tracker_state.sample.json"),
        audit_file=_env_path("TRACKER_AUDIT_FILE", BASE_DIR / "drink_tracker_audit.jsonl"),
        session_cookie=os.getenv("TRACKER_SESSION_COOKIE", "tracker_session"),
        read_password=os.getenv("TRACKER_READ_PASSWORD", "4359"),
        edit_password=os.getenv("TRACKER_EDIT_PASSWORD", "4096"),
    )

