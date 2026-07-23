from __future__ import annotations

import uvicorn

from backend.app import app, settings, store


if __name__ == "__main__":
    store.ensure_state_file()
    uvicorn.run(app, host=settings.host, port=settings.port)

