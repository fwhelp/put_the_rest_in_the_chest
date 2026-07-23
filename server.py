from __future__ import annotations

import json
import secrets
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "127.0.0.1"
PORT = 8000
BASE_DIR = Path(__file__).resolve().parent
STATE_FILE = BASE_DIR / "drink_tracker_state.json"
SAMPLE_FILE = BASE_DIR / "drink_tracker_state.sample.json"
SESSION_COOKIE = "tracker_session"
READ_PASSWORD = "4359"
EDIT_PASSWORD = "4096"
SESSIONS: dict[str, str] = {}

DEFAULT_STATE = {
    "count": 0,
    "low_stock_threshold": 12,
    "history": [],
    "support": {
        "soft_daily_goal": 4,
    },
}


def ensure_state_file() -> None:
    if STATE_FILE.exists():
        return

    if SAMPLE_FILE.exists():
        STATE_FILE.write_text(SAMPLE_FILE.read_text(encoding="utf-8"), encoding="utf-8")
        return

    STATE_FILE.write_text(json.dumps(DEFAULT_STATE, indent=2), encoding="utf-8")


def read_state() -> dict:
    ensure_state_file()
    raw = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return normalize_state(raw)


def write_state(payload: dict) -> dict:
    normalized = normalize_state(payload)
    STATE_FILE.write_text(json.dumps(normalized, indent=2), encoding="utf-8")
    return normalized


def normalize_state(raw: dict | None) -> dict:
    raw = raw or {}
    count = clamp_int(raw.get("count", 0))
    low_stock_threshold = clamp_int(raw.get("low_stock_threshold", 12))
    support_raw = raw.get("support") if isinstance(raw.get("support"), dict) else {}
    history_raw = raw.get("history") if isinstance(raw.get("history"), list) else []

    history = []
    for entry in history_raw:
        if not isinstance(entry, dict) or "timestamp" not in entry:
            continue

        normalized_entry = {
            "timestamp": str(entry["timestamp"]),
            "action": str(entry.get("action", "note")),
            "amount": clamp_int(entry.get("amount", 0)),
            "note": str(entry.get("note", "")),
            "count": clamp_int(entry.get("count", count)),
        }

        if normalized_entry["action"] == "add":
            normalized_entry["money_spent"] = float(entry.get("money_spent", 0))
            normalized_entry["unit_price"] = float(entry.get("unit_price", 0))
        elif normalized_entry["action"] == "take":
            normalized_entry["money_value"] = float(entry.get("money_value", 0))
            normalized_entry["unit_price"] = float(entry.get("unit_price", 0))
            nutrition = entry.get("nutrition") if isinstance(entry.get("nutrition"), dict) else {}
            normalized_entry["nutrition"] = {
                "calories": clamp_int(nutrition.get("calories", 0)),
                "sodium_mg": clamp_int(nutrition.get("sodium_mg", 0)),
                "carbs_g": clamp_int(nutrition.get("carbs_g", 0)),
                "sugars_g": clamp_int(nutrition.get("sugars_g", 0)),
                "protein_g": clamp_int(nutrition.get("protein_g", 0)),
                "fat_g": clamp_int(nutrition.get("fat_g", 0)),
            }

        history.append(normalized_entry)

    return {
        "count": count,
        "low_stock_threshold": low_stock_threshold,
        "history": history,
        "support": {
            "soft_daily_goal": clamp_int(support_raw.get("soft_daily_goal", 4)),
        },
    }


def clamp_int(value: object) -> int:
    try:
        return max(0, int(value))
    except (TypeError, ValueError):
        return 0


class TrackerHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/api/session":
            self.send_json({"access": self.get_access_role() or "none"})
            return

        if self.path == "/api/state":
            if not self.require_access("read"):
                return
            self.send_json(read_state())
            return

        super().do_GET()

    def do_POST(self) -> None:
        if self.path == "/api/auth/read":
            self.handle_auth(READ_PASSWORD, "read")
            return

        if self.path == "/api/auth/edit":
            self.handle_auth(EDIT_PASSWORD, "edit")
            return

        if self.path == "/api/logout":
            self.clear_session()
            self.send_json({"access": "none"})
            return

        if self.path == "/api/state":
            if not self.require_access("edit"):
                return
            payload = self.read_json_body()
            if payload is None:
                return
            saved = write_state(payload)
            self.send_json(saved)
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    def handle_auth(self, expected_password: str, granted_role: str) -> None:
        payload = self.read_json_body()
        if payload is None:
            return

        if str(payload.get("password", "")) != expected_password:
            self.send_error(HTTPStatus.FORBIDDEN, "Incorrect password")
            return

        role = self.get_access_role()
        final_role = "edit" if role == "edit" or granted_role == "edit" else "read"
        self.set_session(final_role)
        self.send_json({"access": final_role})

    def require_access(self, required_role: str) -> bool:
        role = self.get_access_role()
        if role is None:
            role = self.get_header_access_role()
        if role == "edit":
            return True
        if required_role == "read" and role == "read":
            return True
        self.send_error(HTTPStatus.FORBIDDEN, "Access denied")
        return False

    def read_json_body(self) -> dict | None:
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)

        try:
            return json.loads(body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(HTTPStatus.BAD_REQUEST, "Invalid JSON payload")
            return None

    def get_access_role(self) -> str | None:
        cookie_header = self.headers.get("Cookie", "")
        cookie = SimpleCookie()
        cookie.load(cookie_header)
        morsel = cookie.get(SESSION_COOKIE)
        if not morsel:
            return None
        return SESSIONS.get(morsel.value)

    def get_header_access_role(self) -> str | None:
        edit_value = self.headers.get("X-Tracker-Edit", "")
        if edit_value == EDIT_PASSWORD:
            return "edit"
        read_value = self.headers.get("X-Tracker-Read", "")
        if read_value == READ_PASSWORD:
            return "read"
        return None

    def set_session(self, role: str) -> None:
        token = secrets.token_urlsafe(24)
        SESSIONS[token] = role
        self._pending_cookie = f"{SESSION_COOKIE}={token}; Path=/; HttpOnly; SameSite=Strict"

    def clear_session(self) -> None:
        cookie_header = self.headers.get("Cookie", "")
        cookie = SimpleCookie()
        cookie.load(cookie_header)
        morsel = cookie.get(SESSION_COOKIE)
        if morsel:
            SESSIONS.pop(morsel.value, None)
        self._pending_cookie = f"{SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"

    def send_json(self, payload: dict) -> None:
        response = json.dumps(payload).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        pending_cookie = getattr(self, "_pending_cookie", None)
        if pending_cookie:
            self.send_header("Set-Cookie", pending_cookie)
            self._pending_cookie = None
        super().end_headers()


if __name__ == "__main__":
    ensure_state_file()
    server = ThreadingHTTPServer((HOST, PORT), TrackerHandler)
    print(f"Serving Put The Rest In The Chest at http://{HOST}:{PORT}")
    server.serve_forever()
