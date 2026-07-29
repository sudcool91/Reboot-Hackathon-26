#!/usr/bin/env bash
#
# TrustLedger Enhanced Start Script
#
# This script starts the complete TrustLedger development environment with:
# - Automatic CRLF fixes
# - Environment variable setup
# - PostgreSQL database
# - Hyperledger Fabric network
# - Chaincode deployment
# - Backend and Frontend services
#
set -Eeuo pipefail

# WSL + Docker Desktop: auto-detect docker socket
if ! docker info >/dev/null 2>&1; then
  if [ -S /var/run/docker.sock ]; then
    export DOCKER_HOST=unix:///var/run/docker.sock
  elif [ -S /run/docker.sock ]; then
    export DOCKER_HOST=unix:///run/docker.sock
  fi
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FABRIC_DIR="${PROJECT_ROOT}/fabric-network"
LOG_DIR="${PROJECT_ROOT}/logs"
mkdir -p "$LOG_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[ OK ]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }
fail(){ echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

banner() {
cat <<EOF
====================================================
         TrustLedger Development Environment
====================================================
EOF
}

banner

# ============================================
# 1. Pre-flight Checks
# ============================================
info "Running pre-flight checks..."

# Check if running in WSL/Linux
if [[ "$OSTYPE" != linux* ]]; then
  fail "This script must run in WSL or Linux, not Windows directly."
fi

# Check Docker - try multiple socket paths for WSL + Docker Desktop
if ! docker info >/dev/null 2>&1; then
  if DOCKER_HOST=unix:///var/run/docker.sock docker info >/dev/null 2>&1; then
    export DOCKER_HOST=unix:///var/run/docker.sock
  elif DOCKER_HOST=unix:///run/docker.sock docker info >/dev/null 2>&1; then
    export DOCKER_HOST=unix:///run/docker.sock
  else
    fail "Docker daemon is not running. Start Docker Desktop and try again."
  fi
fi
ok "Docker daemon is running."

# Validate directory structure
[[ -d "$FABRIC_DIR" ]] || fail "fabric-network directory not found."
[[ -f "$PROJECT_ROOT/docker-compose.yml" ]] || fail "docker-compose.yml missing."

# Check required tools
for cmd in jq go node npm docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "$cmd is not installed. Run ./scripts/setupnew.sh first."
  fi
done
ok "All required tools are installed."

# ============================================
# 2. Fix CRLF Line Endings (Just in Case)
# ============================================
info "Ensuring proper line endings..."
cd "$PROJECT_ROOT"

# Fix all shell scripts
find . -type f -name "*.sh" -exec sed -i 's/\r$//' {} \; 2>/dev/null || true

# Fix network.config and other config files
if [[ -f "fabric-network/network.config" ]]; then
  sed -i 's/\r$//' fabric-network/network.config
fi
find fabric-network -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.config" \) -exec sed -i 's/\r$//' {} \; 2>/dev/null || true

ok "Line endings verified."

# ============================================
# 3. Set Up Environment Variables
# ============================================
info "Setting up environment variables..."

# Append Fabric bin AFTER system PATH so system docker takes priority
export PATH="$PATH:${PROJECT_ROOT}/bin"
export FABRIC_CFG_PATH="${PROJECT_ROOT}/config"

# Verify config files exist
if [[ ! -f "$FABRIC_CFG_PATH/core.yaml" ]]; then
  fail "FABRIC_CFG_PATH is set but core.yaml not found. Run ./scripts/setupnew.sh first."
fi

ok "Environment variables configured."
ok "  PATH includes: ${PROJECT_ROOT}/bin"
ok "  FABRIC_CFG_PATH: ${FABRIC_CFG_PATH}"

# ============================================
# 4. Start PostgreSQL Database
# ============================================
info "Starting PostgreSQL database..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d postgres pgadmin

info "Waiting for PostgreSQL to be ready..."
POSTGRES_READY=false
for i in {1..30}; do
  if docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres pg_isready >/dev/null 2>&1; then
    POSTGRES_READY=true
    break
  fi
  sleep 2
done

if [[ "$POSTGRES_READY" == "true" ]]; then
  ok "PostgreSQL is ready."
else
  warn "PostgreSQL took longer than expected but may still be starting..."
fi

# ============================================
# 5. Start Hyperledger Fabric Network
# ============================================
info "Starting Hyperledger Fabric network..."
cd "$FABRIC_DIR"

# Clean any corrupt artifacts from previous failed runs
if [[ -d "channel-artifacts" ]]; then
  warn "Removing potentially corrupt channel artifacts..."
  # Remove files with \r in the name
  find channel-artifacts -name "*"$'\r'"*" -delete 2>/dev/null || true
fi

# Make all scripts executable
find . -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# Start network first (idempotent)
info "Bringing up Fabric network with Certificate Authorities..."
if ! ./network.sh up -ca; then
  fail "Failed to start Fabric network. Check logs above."
fi
ok "Fabric network is up."

# Create/join channel only if needed. On reruns, existing ledgers can make
# createChannel return non-zero even though the network is healthy.
info "Ensuring channel 'kycchannel' exists and peers are joined..."
set +e
CHANNEL_OUTPUT="$(./network.sh createChannel 2>&1)"
CHANNEL_EXIT=$?
set -e
if [[ $CHANNEL_EXIT -ne 0 ]]; then
  if echo "$CHANNEL_OUTPUT" | grep -qiE "channel already exists|ledger \[kycchannel\] already exists with state \[ACTIVE\]|cannot join: channel already exists"; then
    warn "Channel already exists. Continuing with existing channel state."
  else
    echo "$CHANNEL_OUTPUT"
    fail "Failed to create/join channel. Check logs above."
  fi
fi

ok "Fabric network and channel are ready."

# Verify channel was created
cd "$FABRIC_DIR"
export PATH="${PROJECT_ROOT}/bin:$PATH"
export FABRIC_CFG_PATH="${PROJECT_ROOT}/config"
export VERBOSE=false
source scripts/envVar.sh
setGlobals 1

CHANNELS=$(peer channel list 2>/dev/null | grep -E "^Channels peers has joined:" -A 10 | grep -v "^Channels" | tr -d ' ')
if [[ "$CHANNELS" == *"kycchannel"* ]]; then
  ok "Channel 'kycchannel' verified."
else
  warn "Channel may not be joined properly. Continuing anyway..."
fi

# ============================================
# 6. Deploy TrustLedger Chaincode
# ============================================
info "Deploying TrustLedger chaincode..."
cd "$FABRIC_DIR"

set +e
CC_OUTPUT="$(./network.sh deployCC \
  -ccn trustledger \
  -ccp ../chaincode/trustledger \
  -ccl go 2>&1)"
CC_EXIT=$?
set -e
if [[ $CC_EXIT -ne 0 ]]; then
  if echo "$CC_OUTPUT" | grep -qiE "requested sequence .* must be larger|already successfully committed|chaincode definition for .* exists"; then
    warn "Chaincode definition already committed. Continuing."
  else
    echo "$CC_OUTPUT"
    fail "Failed to deploy chaincode. Check logs above."
  fi
fi
ok "Chaincode 'trustledger' is ready."

# ============================================
# 7. Start Backend Service
# ============================================
if [[ -f "$PROJECT_ROOT/backend/package.json" ]]; then
  info "Setting up backend service..."
  cd "$PROJECT_ROOT/backend"
  
  # Install dependencies if needed
  if [[ ! -d "node_modules" ]]; then
    info "Installing backend dependencies (this may take a while)..."
    npm install
  else
    ok "Backend dependencies already installed."
  fi
  
  # Stop any existing backend process
  if [[ -f "$LOG_DIR/backend.pid" ]]; then
    OLD_PID=$(cat "$LOG_DIR/backend.pid")
    if ps -p "$OLD_PID" >/dev/null 2>&1; then
      info "Stopping existing backend process (PID: $OLD_PID)..."
      kill "$OLD_PID" 2>/dev/null || true
      sleep 2
    fi
  fi
  
  # Start backend
  info "Starting backend service..."
  nohup npm run start:dev >"$LOG_DIR/backend.log" 2>&1 &
  echo $! >"$LOG_DIR/backend.pid"
  ok "Backend started (PID: $(cat $LOG_DIR/backend.pid))."
  ok "  Log file: logs/backend.log"
else
  warn "Backend package.json not found, skipping backend startup."
fi

# ============================================
# 8. Start Frontend Service
# ============================================
if [[ -f "$PROJECT_ROOT/frontend/package.json" ]]; then
  info "Setting up frontend service..."
  cd "$PROJECT_ROOT/frontend"
  
  # Install dependencies if needed
  if [[ ! -d "node_modules" ]]; then
    info "Installing frontend dependencies (this may take a while)..."
    npm install
  else
    ok "Frontend dependencies already installed."
  fi
  
  # Stop any existing frontend process
  if [[ -f "$LOG_DIR/frontend.pid" ]]; then
    OLD_PID=$(cat "$LOG_DIR/frontend.pid")
    if ps -p "$OLD_PID" >/dev/null 2>&1; then
      info "Stopping existing frontend process (PID: $OLD_PID)..."
      kill "$OLD_PID" 2>/dev/null || true
      sleep 2
    fi
  fi
  
  # Start frontend
  info "Starting frontend service..."
  nohup npm run dev >"$LOG_DIR/frontend.log" 2>&1 &
  echo $! >"$LOG_DIR/frontend.pid"
  ok "Frontend started (PID: $(cat $LOG_DIR/frontend.pid))."
  ok "  Log file: logs/frontend.log"
else
  warn "Frontend package.json not found, skipping frontend startup."
fi

# ============================================
# 9. Final Status Summary
# ============================================
cd "$PROJECT_ROOT"

cat <<EOF

====================================================
    TrustLedger Started Successfully ✓
====================================================

Services:
  Backend API   : http://localhost:3001
  Frontend UI   : http://localhost:5173
  PostgreSQL    : localhost:5432 (user: trustledger)
  pgAdmin       : http://localhost:5050

Hyperledger Fabric:
  Channel       : kycchannel
  Chaincode     : trustledger
  Organizations : LloydsMSP, HalifaxMSP

Logs:
  Backend       : logs/backend.log
  Frontend      : logs/frontend.log
  
Check Status:
  docker ps
  tail -f logs/backend.log
  tail -f logs/frontend.log

Stop Services:
  ./scripts/stop.sh

====================================================

Tip: Wait 10-20 seconds for backend and frontend to fully start.
     Check the log files if services don't respond.

====================================================
EOF

ok "All services started successfully!"
