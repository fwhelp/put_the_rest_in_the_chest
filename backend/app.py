from __future__ import annotations

import secrets
from http import HTTPStatus
from typing import Literal

from fastapi import FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import load_settings
from .store import TrackerStore


settings = load_settings()
store = TrackerStore(settings)
SESSIONS: dict[str, str] = {}

app = FastAPI(title="Put The Rest In The Chest API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Tracker-Read", "X-Tracker-Edit"],
)


class PasswordPayload(BaseModel):
    password: str


class SessionPayload(BaseModel):
    access: str


class TakePayload(BaseModel):
    amount: int
    note: str = ""
    last_call: bool = False
    mood: int | None = None


class MoodPayload(BaseModel):
    entry_id: str = ""
    timestamp: str
    note: str = ""
    last_call: bool = False
    mood: int | None = None


@app.middleware("http")
async def no_store_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    return response


def get_cookie_role(request: Request) -> str | None:
    token = request.cookies.get(settings.session_cookie, "")
    return SESSIONS.get(token) if token else None


def get_header_role(x_tracker_read: str | None, x_tracker_edit: str | None) -> str | None:
    if x_tracker_edit == settings.edit_password:
        return "edit"
    if x_tracker_read == settings.read_password:
        return "read"
    return None


def get_effective_role(
    request: Request,
    x_tracker_read: str | None = None,
    x_tracker_edit: str | None = None,
) -> str | None:
    return get_cookie_role(request) or get_header_role(x_tracker_read, x_tracker_edit)


def require_access(
    request: Request,
    required_role: Literal["read", "edit"],
    x_tracker_read: str | None = None,
    x_tracker_edit: str | None = None,
) -> str:
    role = get_effective_role(request, x_tracker_read, x_tracker_edit)
    if role == "edit":
        return "edit"
    if required_role == "read" and role == "read":
        return "read"
    raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Access denied")


def set_session_cookie(response: Response, role: str) -> None:
    token = secrets.token_urlsafe(24)
    SESSIONS[token] = role
    response.set_cookie(
        key=settings.session_cookie,
        value=token,
        httponly=True,
        samesite="strict",
        secure=True,
        path="/",
    )


def clear_session_cookie(request: Request, response: Response) -> None:
    token = request.cookies.get(settings.session_cookie, "")
    if token:
        SESSIONS.pop(token, None)
    response.delete_cookie(settings.session_cookie, path="/")


@app.get("/api/session")
def get_session(
    request: Request,
    x_tracker_read: str | None = Header(default=None),
    x_tracker_edit: str | None = Header(default=None),
) -> SessionPayload:
    access = get_effective_role(request, x_tracker_read, x_tracker_edit) or "none"
    return SessionPayload(access=access)


@app.post("/api/auth/read")
def auth_read(payload: PasswordPayload, request: Request, response: Response) -> SessionPayload:
    if payload.password != settings.read_password:
        store.append_audit_event("auth_failure", "none", {"kind": "read"})
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Incorrect password")

    current_role = get_cookie_role(request)
    final_role = "edit" if current_role == "edit" else "read"
    set_session_cookie(response, final_role)
    store.append_audit_event("auth_success", final_role, {"kind": "read"})
    return SessionPayload(access=final_role)


@app.post("/api/auth/edit")
def auth_edit(payload: PasswordPayload, response: Response) -> SessionPayload:
    if payload.password != settings.edit_password:
        store.append_audit_event("auth_failure", "none", {"kind": "edit"})
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Incorrect password")

    set_session_cookie(response, "edit")
    store.append_audit_event("auth_success", "edit", {"kind": "edit"})
    return SessionPayload(access="edit")


@app.post("/api/logout")
def logout(request: Request, response: Response) -> SessionPayload:
    clear_session_cookie(request, response)
    return SessionPayload(access="none")


@app.get("/api/state")
def get_state(
    request: Request,
    x_tracker_read: str | None = Header(default=None),
    x_tracker_edit: str | None = Header(default=None),
):
    require_access(request, "read", x_tracker_read, x_tracker_edit)
    return store.read_state()


@app.post("/api/state")
def post_state(
    payload: dict,
    request: Request,
    x_tracker_read: str | None = Header(default=None),
    x_tracker_edit: str | None = Header(default=None),
):
    actor_role = require_access(request, "edit", x_tracker_read, x_tracker_edit)
    return store.write_state(payload, actor_role)


@app.post("/api/log-take")
def post_log_take(
    payload: TakePayload,
    request: Request,
    x_tracker_read: str | None = Header(default=None),
    x_tracker_edit: str | None = Header(default=None),
):
    actor_role = require_access(request, "read", x_tracker_read, x_tracker_edit)
    return store.log_take_with_mood(
        payload.amount,
        payload.note.strip(),
        payload.last_call,
        payload.mood,
        actor_role,
    )


@app.post("/api/mood-entry")
def post_mood_entry(
    payload: MoodPayload,
    request: Request,
    x_tracker_read: str | None = Header(default=None),
    x_tracker_edit: str | None = Header(default=None),
):
    actor_role = require_access(request, "read", x_tracker_read, x_tracker_edit)
    return store.upsert_mood_entry(
        payload.entry_id.strip(),
        payload.timestamp.strip(),
        payload.note.strip(),
        payload.last_call,
        payload.mood,
        actor_role,
    )
