from __future__ import annotations

import json
from datetime import datetime, timezone
import secrets
from pathlib import Path
from typing import Any

from .config import Settings


DEFAULT_STATE = {
    "count": 0,
    "low_stock_threshold": 12,
    "history": [],
    "moods": [],
    "support": {
        "soft_daily_goal": 4,
    },
}

PACK_COUNT = 24
PACK_PRICE_PRE_TAX = 24.59
LOCAL_SALES_TAX_RATE = 0.095
PACK_PRICE = round(PACK_PRICE_PRE_TAX * (1 + LOCAL_SALES_TAX_RATE), 2)
UNIT_PRICE = round(PACK_PRICE / PACK_COUNT, 4)
NUTRITION_PER_CAN = {
    "calories": 100,
    "sodium_mg": 10,
    "carbs_g": 2,
    "sugars_g": 2,
    "protein_g": 0,
    "fat_g": 0,
}


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def generate_entry_id() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    return f"entry-{stamp}-{secrets.token_hex(2)}"


def clamp_int(value: object) -> int:
    try:
        return max(0, int(value))
    except (TypeError, ValueError):
        return 0


def tracker_day_key(value: object) -> str:
    if isinstance(value, dict):
        tracker_day = str(value.get("tracker_day", "") or "").strip()
        if tracker_day:
            return tracker_day[:10]
        return str(value.get("timestamp", "") or "")[:10]

    return str(value or "")[:10]


def enforce_single_last_call(history: list[dict[str, Any]]) -> None:
    latest_last_call_by_day: dict[str, str] = {}

    for entry in history:
        if str(entry.get("action", "note")) != "take" or not bool(entry.get("last_call", False)):
            continue
        latest_last_call_by_day[tracker_day_key(entry.get("timestamp"))] = str(entry.get("id", ""))

    for entry in history:
        if str(entry.get("action", "note")) != "take":
            continue

        winning_id = latest_last_call_by_day.get(tracker_day_key(entry.get("timestamp")))
        if winning_id and str(entry.get("id", "")) == winning_id:
            entry["last_call"] = True
            mood_value = entry.get("mood")
            entry["mood"] = mood_value if isinstance(mood_value, int) and 1 <= mood_value <= 5 else None
            continue

        entry["last_call"] = False
        entry["mood"] = None


def normalize_mood_entry(entry: dict[str, Any]) -> dict[str, Any] | None:
    if not isinstance(entry, dict) or "timestamp" not in entry:
        return None

    mood_value = entry.get("mood")
    return {
        "id": str(entry.get("id") or generate_entry_id()),
        "timestamp": str(entry.get("timestamp", iso_now())),
        "tracker_day": tracker_day_key(entry),
        "mood": mood_value if isinstance(mood_value, int) and 1 <= mood_value <= 5 else None,
        "last_call": bool(entry.get("last_call", False)),
        "note": str(entry.get("note", "")),
        "linked_take_entry_id": str(entry.get("linked_take_entry_id", "") or ""),
    }


def synthesize_legacy_moods(history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    moods: list[dict[str, Any]] = []
    for entry in history:
        if str(entry.get("action", "note")) != "take":
            continue
        if not bool(entry.get("last_call", False)) and not isinstance(entry.get("mood"), int):
            continue
        moods.append({
            "id": f"mood-legacy-{entry.get('id') or generate_entry_id()}",
            "timestamp": str(entry.get("timestamp", iso_now())),
            "tracker_day": tracker_day_key(entry),
            "mood": entry.get("mood") if isinstance(entry.get("mood"), int) and 1 <= int(entry.get("mood")) <= 5 else None,
            "last_call": bool(entry.get("last_call", False)),
            "note": str(entry.get("note", "")),
            "linked_take_entry_id": str(entry.get("id", "")),
        })
    return moods


def enforce_single_last_call_moods(moods: list[dict[str, Any]]) -> None:
    latest_last_call_by_day: dict[str, str] = {}

    for entry in moods:
        if not bool(entry.get("last_call", False)):
            continue
        latest_last_call_by_day[tracker_day_key(entry)] = str(entry.get("id", ""))

    for entry in moods:
        winning_id = latest_last_call_by_day.get(tracker_day_key(entry))
        entry["last_call"] = bool(winning_id and str(entry.get("id", "")) == winning_id)


def collapse_daily_tally_entries(history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    latest_tally_by_day: dict[str, str] = {}

    for entry in history:
        if str(entry.get("action", "note")) != "daily_tally":
            continue
        latest_tally_by_day[tracker_day_key(entry)] = str(entry.get("id", ""))

    return [
        entry
        for entry in history
        if str(entry.get("action", "note")) != "daily_tally"
        or latest_tally_by_day.get(tracker_day_key(entry)) == str(entry.get("id", ""))
    ]


def resolve_mood_entry_for_day_save(
    moods: list[dict[str, Any]],
    entry_id: str,
    timestamp: str,
) -> dict[str, Any] | None:
    target_day = tracker_day_key(timestamp)
    by_id = next((entry for entry in moods if str(entry.get("id", "")) == entry_id), None) if entry_id else None

    if by_id and tracker_day_key(by_id) == target_day:
        return by_id

    return next((entry for entry in moods if tracker_day_key(entry) == target_day), None)


def normalize_state(raw: dict[str, Any] | None) -> dict[str, Any]:
    raw = raw or {}
    count = clamp_int(raw.get("count", 0))
    low_stock_threshold = clamp_int(raw.get("low_stock_threshold", 12))
    support_raw = raw.get("support") if isinstance(raw.get("support"), dict) else {}
    history_raw = raw.get("history") if isinstance(raw.get("history"), list) else []
    moods_raw = raw.get("moods") if isinstance(raw.get("moods"), list) else []

    history: list[dict[str, Any]] = []
    for entry in history_raw:
        if not isinstance(entry, dict) or "timestamp" not in entry:
            continue

        normalized_entry: dict[str, Any] = {
            "id": str(entry.get("id") or generate_entry_id()),
            "timestamp": str(entry["timestamp"]),
            "tracker_day": tracker_day_key(entry),
            "action": str(entry.get("action", "note")),
            "amount": clamp_int(entry.get("amount", 0)),
            "note": str(entry.get("note", "")),
            "count": clamp_int(entry.get("count", count)),
        }

        if (
            normalized_entry["action"] == "reset_count"
            and normalized_entry["amount"] > 0
            and normalized_entry["count"] > 0
        ):
            normalized_entry["action"] = "set_count"
            normalized_entry["amount"] = normalized_entry["count"]

        if normalized_entry["action"] == "add":
            normalized_entry["money_spent"] = float(entry.get("money_spent", 0))
            normalized_entry["unit_price"] = float(entry.get("unit_price", 0))
        elif normalized_entry["action"] in ("take", "daily_tally"):
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
            if normalized_entry["action"] == "take":
                normalized_entry["last_call"] = bool(entry.get("last_call", False))
                mood_value = entry.get("mood")
                normalized_entry["mood"] = mood_value if isinstance(mood_value, int) and 1 <= mood_value <= 5 else None

        history.append(normalized_entry)

    moods = [normalized for normalized in (normalize_mood_entry(entry) for entry in moods_raw) if normalized]
    if not moods:
        moods = synthesize_legacy_moods(history)

    return {
        "count": count,
        "low_stock_threshold": low_stock_threshold,
        "history": history,
        "moods": moods,
        "support": {
            "soft_daily_goal": clamp_int(support_raw.get("soft_daily_goal", 4)),
        },
    }


def replay_history(state: dict[str, Any]) -> dict[str, Any]:
    current_count = 0
    current_threshold = clamp_int(state.get("low_stock_threshold", 12))
    history = collapse_daily_tally_entries(sorted(state.get("history", []), key=lambda item: str(item.get("timestamp", ""))))
    moods = sorted(state.get("moods", []), key=lambda item: str(item.get("timestamp", "")))

    enforce_single_last_call(history)
    enforce_single_last_call_moods(moods)

    for entry in history:
        action = str(entry.get("action", "note"))
        amount = clamp_int(entry.get("amount", 0))
        if action == "init":
            current_count = clamp_int(entry.get("count", amount))
        elif action == "add":
            current_count += amount
        elif action in ("take", "daily_tally"):
            current_count = max(0, current_count - amount)
            if action == "daily_tally":
                entry.pop("last_call", None)
                entry.pop("mood", None)
        elif action == "set_count":
            current_count = amount
        elif action == "reset_count":
            current_count = 0
            entry["amount"] = 0
        elif action == "set_threshold":
            current_threshold = amount
        entry["count"] = current_count

    state["history"] = history
    state["moods"] = moods
    state["count"] = current_count
    state["low_stock_threshold"] = current_threshold
    return state


class TrackerStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def ensure_state_file(self) -> None:
        state_file = self.settings.state_file
        state_file.parent.mkdir(parents=True, exist_ok=True)
        if state_file.exists():
            return

        sample_file = self.settings.sample_file
        if sample_file.exists():
            state_file.write_text(sample_file.read_text(encoding="utf-8"), encoding="utf-8")
            return

        state_file.write_text(json.dumps(DEFAULT_STATE, indent=2), encoding="utf-8")

    def read_state(self) -> dict[str, Any]:
        self.ensure_state_file()
        raw = json.loads(self.settings.state_file.read_text(encoding="utf-8"))
        return replay_history(normalize_state(raw))

    def write_state(self, payload: dict[str, Any], actor_role: str) -> dict[str, Any]:
        normalized = replay_history(normalize_state(payload))
        self.settings.state_file.write_text(json.dumps(normalized, indent=2), encoding="utf-8")
        self.append_audit_event("state_write", actor_role, {"count": normalized["count"]})
        return normalized

    def log_take(self, amount: int, note: str, actor_role: str) -> dict[str, Any]:
        return self.log_take_with_mood(amount, note, False, None, actor_role)

    def log_take_with_mood(
        self,
        amount: int,
        note: str,
        last_call: bool,
        mood: int | None,
        actor_role: str,
    ) -> dict[str, Any]:
        state = self.read_state()
        safe_amount = clamp_int(amount)
        if safe_amount <= 0:
            return state

        safe_mood = mood if isinstance(mood, int) and 1 <= mood <= 5 else None

        state["count"] = max(0, clamp_int(state.get("count", 0)) - safe_amount)
        entry = {
            "id": generate_entry_id(),
            "timestamp": iso_now(),
            "tracker_day": iso_now()[:10],
            "action": "take",
            "amount": safe_amount,
            "note": note,
            "count": state["count"],
            "money_value": round(safe_amount * UNIT_PRICE, 2),
            "unit_price": UNIT_PRICE,
            "last_call": bool(last_call),
            "mood": safe_mood if bool(last_call) else None,
            "nutrition": {
                key: clamp_int(value * safe_amount)
                for key, value in NUTRITION_PER_CAN.items()
            },
        }
        state.setdefault("history", []).append(entry)
        if bool(last_call) or safe_mood is not None:
            state.setdefault("moods", []).append({
                "id": generate_entry_id(),
                "timestamp": entry["timestamp"],
                "tracker_day": tracker_day_key(entry),
                "mood": safe_mood,
                "last_call": bool(last_call),
                "note": note,
                "linked_take_entry_id": entry["id"],
            })
        state = replay_history(state)
        self.settings.state_file.write_text(json.dumps(state, indent=2), encoding="utf-8")
        self.append_audit_event(
            "log_take",
            actor_role,
            {"amount": safe_amount, "count": state["count"], "last_call": bool(last_call), "mood": safe_mood},
        )
        return state

    def upsert_mood_entry(
        self,
        entry_id: str,
        timestamp: str,
        note: str,
        last_call: bool,
        mood: int | None,
        actor_role: str,
    ) -> dict[str, Any]:
        state = self.read_state()
        safe_mood = mood if isinstance(mood, int) and 1 <= mood <= 5 else None
        mood_entries = state.setdefault("moods", [])
        target_entry = resolve_mood_entry_for_day_save(mood_entries, entry_id, timestamp or iso_now())

        if target_entry:
            target_entry["timestamp"] = timestamp or target_entry.get("timestamp", iso_now())
            target_entry["tracker_day"] = tracker_day_key(target_entry)
            target_entry["note"] = note
            target_entry["last_call"] = bool(last_call)
            target_entry["mood"] = safe_mood
            state = replay_history(state)
            self.settings.state_file.write_text(json.dumps(state, indent=2), encoding="utf-8")
            self.append_audit_event(
                "upsert_mood_entry",
                actor_role,
                {"entry_id": str(target_entry.get("id", entry_id)), "last_call": bool(last_call), "mood": safe_mood},
            )
            return state

        new_entry = {
            "id": generate_entry_id(),
            "timestamp": timestamp or iso_now(),
            "tracker_day": tracker_day_key(timestamp or iso_now()),
            "mood": safe_mood,
            "last_call": bool(last_call),
            "note": note,
            "linked_take_entry_id": "",
        }
        mood_entries.append(new_entry)
        state = replay_history(state)
        self.settings.state_file.write_text(json.dumps(state, indent=2), encoding="utf-8")
        self.append_audit_event(
            "upsert_mood_entry",
            actor_role,
            {"entry_id": new_entry["id"], "last_call": bool(last_call), "mood": safe_mood},
        )
        return state

    def append_audit_event(self, event_type: str, actor_role: str, details: dict[str, Any]) -> None:
        audit_file = self.settings.audit_file
        audit_file.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "timestamp": iso_now(),
            "event": event_type,
            "actor_role": actor_role,
            "details": details,
        }
        with audit_file.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record) + "\n")
