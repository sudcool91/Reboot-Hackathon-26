#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHANNEL="kycchannel"
CHAINCODE="trustledger"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
    if eval "$2" >/dev/null 2>&1; then
        echo -e "${GREEN}[PASS]${NC} $1"
        PASS=$((PASS+1))
    else
        echo -e "${RED}[FAIL]${NC} $1"
        FAIL=$((FAIL+1))
    fi
}

echo "============================================"
echo " TrustLedger Environment Verification"
echo "============================================"

check "Docker daemon" "docker info"

check "PostgreSQL Container" \
"docker compose -f ${PROJECT_ROOT}/docker-compose.yml ps postgres | grep Up"

check "pgAdmin Container" \
"docker compose -f ${PROJECT_ROOT}/docker-compose.yml ps pgadmin | grep Up"

check "Backend Running" \
"curl -fs http://localhost:3000/health"

check "Frontend Running" \
"curl -fs http://localhost:5173"

check "Fabric Peer CLI" \
"peer version"

check "Fabric Network" \
"docker ps | grep peer0"

check "Chaincode Committed" \
"peer lifecycle chaincode querycommitted -C ${CHANNEL} | grep ${CHAINCODE}"

check "Backend Logs Exist" \
"test -f ${PROJECT_ROOT}/logs/backend.log"

check "Frontend Logs Exist" \
"test -f ${PROJECT_ROOT}/logs/frontend.log"

echo
echo "============================================"

echo "Passed : $PASS"
echo "Failed : $FAIL"

echo "============================================"

if [[ $FAIL -eq 0 ]]; then
cat <<EOF

Everything looks healthy.

Backend  : http://localhost:3000
Frontend : http://localhost:5173
pgAdmin  : http://localhost:5050

EOF
else
cat <<EOF

Some checks failed.

Review the failed services above.

EOF
fi
