#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FABRIC_DIR="${PROJECT_ROOT}/fabric-network"
LOG_DIR="${PROJECT_ROOT}/logs"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[ OK ]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }

echo "===================================================="
echo "        TrustLedger Environment Cleanup"
echo "===================================================="

read -rp "This will remove generated artifacts. Continue? (y/N): " ans
[[ "$ans" =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 0; }

# Stop everything first if possible
if [[ -f "${PROJECT_ROOT}/scripts/stop.sh" ]]; then
    info "Stopping running services..."
    bash "${PROJECT_ROOT}/scripts/stop.sh" || true
fi

# Remove logs
if [[ -d "$LOG_DIR" ]]; then
    info "Removing logs..."
    rm -rf "$LOG_DIR"
    ok "Logs removed."
fi

# Remove backend/frontend dependencies (optional)
for d in backend frontend; do
    if [[ -d "${PROJECT_ROOT}/${d}/node_modules" ]]; then
        info "Removing ${d}/node_modules..."
        rm -rf "${PROJECT_ROOT}/${d}/node_modules"
    fi
done

# Remove Fabric generated artifacts
if [[ -d "$FABRIC_DIR" ]]; then
    info "Cleaning Hyperledger Fabric..."
    (
        cd "$FABRIC_DIR"
        ./network.sh down || true
        rm -rf organizations channel-artifacts system-genesis-block \
               docker docker-compose-test-net.yaml \
               log.txt *.tar.gz 2>/dev/null || true
    )
    ok "Fabric artifacts removed."
fi

# Remove docker volumes
if [[ -f "${PROJECT_ROOT}/docker-compose.yml" ]]; then
    info "Removing Docker containers and volumes..."
    docker compose -f "${PROJECT_ROOT}/docker-compose.yml" down -v --remove-orphans || true
    ok "Docker resources cleaned."
fi


echo
echo "===================================================="
echo "Cleanup Complete"
echo "===================================================="
echo
echo "Environment reset."
echo
echo "Run:"
echo "    ./scripts/start.sh"
echo
