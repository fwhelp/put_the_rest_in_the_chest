# Put The Rest In The Chest

A browser-based drink tracker built around the same inventory model as the original Python script:

- current stock count
- low-stock threshold
- history of stock added and drinks taken
- spend/value estimates
- nutrition totals
- a supportive, non-punitive progress layer

## State Shape

The app keeps JSON compatible with the Python tracker at its core:

```json
{
  "count": 14,
  "low_stock_threshold": 12,
  "history": []
}
```

The web app also stores a small optional support block:

```json
{
  "support": {
    "soft_daily_goal": 4
  }
}
```

Extra fields are ignored by the Python tracker, so exported JSON can still stay close to the original format.

## Main Features

- quick add / take / threshold / manual correction actions
- 14-day consumption chart
- 7-day, 30-day, and lifetime summaries
- cost and nutrition rollups
- export and import of tracker JSON
- JSON-backed persistence through a tiny local Python server
- read-only password gate for viewing
- separate edit password for any data-changing action

## Local Development

Run the local app server:

```powershell
python server.py
```

Then visit:

```text
http://127.0.0.1:8000/
```

## Files

- `server.py`: local web server with `/api/state`
- `drink_tracker_state.json`: live tracker data used by the web app
- `drink_tracker_state.sample.json`: starter sample data

## Deployable Backend

The production-friendly backend lives in:

- `backend/app.py`: FastAPI API app
- `backend/config.py`: environment-based settings
- `backend/store.py`: JSON persistence and audit log helpers
- `run_api.py`: Uvicorn entrypoint
- `requirements.txt`: deployable Python dependencies
- `.env.example`: backend configuration template
- `deploy/put-the-rest-in-the-chest.service`: `systemd` unit
- `deploy/nginx-casitadevatos.conf`: Nginx reverse-proxy example

### Production Backend Flow

1. Nginx serves the static frontend.
2. Nginx proxies `/api/*` to `127.0.0.1:8787`.
3. FastAPI reads and writes `drink_tracker_state.json`.
4. Audit events are appended to `drink_tracker_audit.jsonl`.

### Production Startup

Create a virtual environment and install dependencies:

```powershell
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

Run the API locally:

```powershell
.venv\Scripts\python run_api.py
```

On Linux server deployments, use the provided `systemd` unit and Nginx config snippet.

## Access Control

- Read-only password: `4359`
- Edit password: `4096`

Read-only access can view charts, history, and export JSON.
Edit access is required for any change to counts, thresholds, goals, imports, or saved tracker data.
