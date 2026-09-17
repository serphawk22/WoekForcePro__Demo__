"""
Vercel Serverless Functions entry point for the WorkForce Pro FastAPI backend.

The Next.js frontend is deployed as a separate Vercel project (root directory:
`frontend`). This project hosts the Python serverless functions that serve the
FastAPI application for that frontend.

Related:
- `vercel.json` (repo root) routes every request to this function.
- `requirements.txt` (repo root) pins the Python deps for the serverless build.

Vercel's Python runtime detects an ASGI application exported as `app`, so the
name here is important — do not rename it.
"""
import os
import sys
from pathlib import Path

# Make `backend` importable — Vercel executes this file from the repository root.
_BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

# Signal that we run inside a Vercel serverless function so the app can
# disable long-running background work (APScheduler) and skip the heavy
# startup bootstrap migrations (see backend/app/main.py).
if os.getenv("VERCEL") is None:
    os.environ["VERCEL"] = "1"

from app.main import app  # noqa: E402