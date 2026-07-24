#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FABRIC_DIR="${PROJECT_ROOT}/fabric-network"
LOG_DIR="${PROJECT_ROOT}/logs"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[ OK ]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }

echo "===================================================="
echo "          TrustLedger Shutdown"
echo "===================================================="

# Stop Backend
if [[ -f "${LOG_DIR}/backend.pid" ]]; then
    PID=$(cat "${LOG_DIR}/backend.pid")
    if kill -0 "$PID" >/dev/null 2>&1; then
        info "Stopping Backend..."
        kill "$PID"
        rm -f "${LOG_DIR}/backend.pid"
        ok "Backend stopped."
    fi
fi

# Stop Frontend
if [[ -f "${LOG_DIR}/frontend.pid" ]]; then
    PID=$(cat "${LOG_DIR}/frontend.pid")
    if kill -0 "$PID" >/dev/null 2>&1; then
        info "Stopping Frontend..."
        kill "$PID"
        rm -f "${LOG_DIR}/frontend.pid"
        ok "Frontend stopped."
    fi
fi

# Stop Fabric Network
if [[ -d "${FABRIC_DIR}" ]]; then
    info "Stopping Hyperledger Fabric..."
    (
        cd "${FABRIC_DIR}"
        ./network.sh down || true
    )
    ok "Fabric network stopped."
fi

# Stop Docker Services
if [[ -f "${PROJECT_ROOT}/docker-compose.yml" ]]; then
    info "Stopping PostgreSQL and pgAdmin..."
    docker compose -f "${PROJECT_ROOT}/docker-compose.yml" stop postgres pgadmin >/dev/null 2>&1 || true
    ok "Docker services stopped."
fi

echo
echo "===================================================="
echo "TrustLedger stopped successfully."
echo "===================================================="
