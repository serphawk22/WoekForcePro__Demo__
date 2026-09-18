#!/bin/bash

# WorkForcePro Deployment Verification Script (Vercel + Railway ready)
# Helps confirm the repo is ready to deploy as:
#   1. Backend project  → repo root (Railway container OR Vercel Python Functions)
#   2. Frontend project → frontend/ (Next.js, deployed on Vercel)

echo "WorkForce Pro Deployment Verification (Vercel)"
echo "==============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
    else
        echo -e "${RED}✗${NC} $1 not found"
    fi
}

# Backend project (repo root) files
echo "Backend project (Vercel, repo root):"
check "api/index.py"
check "requirements.txt"
check "vercel.json"
check "backend/requirements.txt"
check "backend/.env.example"
echo ""

# Frontend project files
echo "Frontend project (Vercel, root directory=frontend):"
check "frontend/package.json"
check "frontend/vercel.json"
check "frontend/next.config.js"
check "frontend/.env.local.example"
echo ""

# CI
echo "CI:"
check ".github/workflows/ci.yml"
echo ""

# Git
if git remote get-url origin >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Git remote configured: $(git remote get-url origin)"
else
    echo -e "${YELLOW}⚠${NC} No Git remote configured"
fi
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${GREEN}✓${NC} No uncommitted changes"
else
    echo -e "${YELLOW}⚠${NC} You have uncommitted changes — commit before deploying"
fi
echo ""

# SECRET_KEY generator
echo "Generating a SECRET_KEY for production..."
if command_exists() { command -v "$1" >/dev/null 2>&1; } && command_exists openssl; then
    SECRET_KEY=$(openssl rand -hex 32)
    echo -e "${GREEN}✓${NC} Generated SECRET_KEY: ${SECRET_KEY}"
    echo "  Set this on the Vercel backend project env."
else
    echo -e "${YELLOW}⚠${NC} OpenSSL not found — use any long random string (32+ chars) as SECRET_KEY."
fi
echo ""

echo "======================================="
echo "Deploy checklist"
echo "======================================="
echo "  1. Backend project on Vercel (root dir = /):"
echo "     - Env: DATABASE_URL, SECRET_KEY, FRONTEND_URL, CRON_SECRET (for Vercel Cron)"
echo "     - First deploy: SKIP_STARTUP_BOOTSTRAP=0 (runs migrations once), then remove/set=1"
echo "  2. Frontend project on Vercel (root dir = frontend):"
echo "     - Env: BACKEND_API_URL and NEXT_PUBLIC_API_URL = <backend>.vercel.app"
echo "  3. Configure Vercel Cron Jobs with a Cron Secret equal to CRON_SECRET"
echo "See the README 'Deployment' section for full steps."