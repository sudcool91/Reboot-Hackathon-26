#!/usr/bin/env bash
#
# TrustLedger Enhanced Stop Script
#
# Cleanly stops all TrustLedger services:
# - Backend and Frontend Node.js processes
# - Hyperledger Fabric network
# - PostgreSQL database
#
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

banner() {
cat <<EOF
====================================================
      Stopping TrustLedger Environment
====================================================
EOF
}

banner

# ============================================
# 1. Stop Backend Service
# ============================================
if [[ -f "$LOG_DIR/backend.pid" ]]; then
  BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
  if ps -p "$BACKEND_PID" >/dev/null 2>&1; then
    info "Stopping backend service (PID: $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    if ps -p "$BACKEND_PID" >/dev/null 2>&1; then
      warn "Backend didn't stop gracefully, force killing..."
      kill -9 "$BACKEND_PID" 2>/dev/null || true
    fi
    ok "Backend stopped."
  else
    info "Backend not running (stale PID file)."
  fi
  rm -f "$LOG_DIR/backend.pid"
else
  info "No backend PID file found."
fi

# ============================================
# 2. Stop Frontend Service
# ============================================
if [[ -f "$LOG_DIR/frontend.pid" ]]; then
  FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
  if ps -p "$FRONTEND_PID" >/dev/null 2>&1; then
    info "Stopping frontend service (PID: $FRONTEND_PID)..."
    kill "$FRONTEND_PID" 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    if ps -p "$FRONTEND_PID" >/dev/null 2>&1; then
      warn "Frontend didn't stop gracefully, force killing..."
      kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi
    ok "Frontend stopped."
  else
    info "Frontend not running (stale PID file)."
  fi
  rm -f "$LOG_DIR/frontend.pid"
else
  info "No frontend PID file found."
fi

# ============================================
# 3. Stop Hyperledger Fabric Network
# ============================================
if [[ -d "$FABRIC_DIR" ]]; then
  info "Stopping Hyperledger Fabric network..."
  cd "$FABRIC_DIR"
  
  # Fix CRLF just in case
  find . -type f -name "*.sh" -exec sed -i 's/\r$//' {} \; 2>/dev/null || true
  
  # Make scripts executable
  chmod +x network.sh 2>/dev/null || true
  
  if ./network.sh down; then
    ok "Fabric network stopped."
  else
    warn "Fabric network shutdown had warnings (check above)."
  fi
else
  warn "fabric-network directory not found."
fi

# ============================================
# 4. Stop PostgreSQL Database
# ============================================
if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
  info "Stopping PostgreSQL and pgAdmin..."
  cd "$PROJECT_ROOT"
  
  docker compose -f docker-compose.yml down
  ok "PostgreSQL stopped."
else
  warn "docker-compose.yml not found."
fi

# ============================================
# 5. Cleanup Check
# ============================================
info "Checking for remaining containers..."
REMAINING=$(docker ps -q --filter "label=service=hyperledger-fabric" 2>/dev/null || true)
if [[ -n "$REMAINING" ]]; then
  warn "Some Fabric containers are still running:"
  docker ps --filter "label=service=hyperledger-fabric"
  info "Run 'docker rm -f \$(docker ps -aq --filter label=service=hyperledger-fabric)' to force remove them."
else
  ok "No Fabric containers running."
fi

# ============================================
# Summary
# ============================================
cat <<EOF

====================================================
    TrustLedger Stopped Successfully ✓
====================================================

Services Stopped:
  ✓ Backend service
  ✓ Frontend service
  ✓ Hyperledger Fabric network
  ✓ PostgreSQL database

Logs Preserved:
  - logs/backend.log
  - logs/frontend.log

To restart:
  ./scripts/startnew.sh

To clean everything:
  cd fabric-network
  ./network.sh down
  rm -rf channel-artifacts/* organizations/peerOrganizations organizations/ordererOrganizations
  docker volume prune

====================================================
EOF

ok "Shutdown complete!"
