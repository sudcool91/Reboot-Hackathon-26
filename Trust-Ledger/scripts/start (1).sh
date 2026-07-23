#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FABRIC_DIR="${PROJECT_ROOT}/fabric-network"
LOG_DIR="${PROJECT_ROOT}/logs"
mkdir -p "$LOG_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

info(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[ OK ]${NC} $*"; }
fail(){ echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

banner() {
cat <<EOF
====================================================
         TrustLedger Development Environment
====================================================
EOF
}

banner

docker info >/dev/null 2>&1 || fail "Docker daemon is not running."

[[ -d "$FABRIC_DIR" ]] || fail "fabric-network directory not found."
[[ -f "$PROJECT_ROOT/docker-compose.yml" ]] || fail "docker-compose.yml missing."

info "Starting PostgreSQL..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d postgres pgadmin

info "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres pg_isready >/dev/null 2>&1; then
        ok "PostgreSQL is ready."
        break
    fi
    sleep 2
done

info "Starting Hyperledger Fabric..."
(
cd "$FABRIC_DIR"
./network.sh up createChannel -ca
)

info "Deploying TrustLedger chaincode..."
(
cd "$FABRIC_DIR"
./network.sh deployCC \
    -ccn trustledger \
    -ccp ../chaincode/trustledger \
    -ccl go
)

if [[ -f "$PROJECT_ROOT/backend/package.json" ]]; then
    info "Installing backend dependencies..."
    cd "$PROJECT_ROOT/backend"
    [[ -d node_modules ]] || npm install
    nohup npm run start:dev >"$LOG_DIR/backend.log" 2>&1 &
    echo $! >"$LOG_DIR/backend.pid"
    ok "Backend started."
fi

if [[ -f "$PROJECT_ROOT/frontend/package.json" ]]; then
    info "Installing frontend dependencies..."
    cd "$PROJECT_ROOT/frontend"
    [[ -d node_modules ]] || npm install
    nohup npm run dev >"$LOG_DIR/frontend.log" 2>&1 &
    echo $! >"$LOG_DIR/frontend.pid"
    ok "Frontend started."
fi

cat <<EOF

====================================================
TrustLedger Started Successfully
====================================================

Backend   : http://localhost:3000
Frontend  : http://localhost:5173
Postgres  : localhost:5432
pgAdmin   : http://localhost:5050

Channel   : kycchannel
Chaincode : trustledger

Backend Log : logs/backend.log
Frontend Log: logs/frontend.log

====================================================
EOF
