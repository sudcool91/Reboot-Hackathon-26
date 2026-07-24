#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FABRIC_DIR="${PROJECT_ROOT}/fabric-network"
CHAINCODE_NAME="trustledger"
CHAINCODE_PATH="../chaincode/trustledger"
CHANNEL_NAME="kycchannel"

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
          TrustLedger Chaincode Deployment
====================================================
EOF
}

banner

docker info >/dev/null 2>&1 || fail "Docker daemon is not running."
[[ -d "$FABRIC_DIR" ]] || fail "fabric-network directory not found."
[[ -d "${PROJECT_ROOT}/chaincode/trustledger" ]] || fail "Chaincode directory missing."

cd "$FABRIC_DIR"

info "Checking Fabric network..."
docker ps >/dev/null || fail "Docker is unavailable."

info "Deploying chaincode: ${CHAINCODE_NAME}"

./network.sh deployCC \
    -ccn "${CHAINCODE_NAME}" \
    -ccp "${CHAINCODE_PATH}" \
    -ccl go

info "Verifying committed chaincode..."

if peer lifecycle chaincode querycommitted -C "${CHANNEL_NAME}" 2>/dev/null | grep -q "${CHAINCODE_NAME}"; then
    ok "Chaincode successfully committed."
else
    echo
    echo "Unable to verify automatically."
    echo "Run manually:"
    echo
    echo "peer lifecycle chaincode querycommitted -C ${CHANNEL_NAME}"
fi

cat <<EOF

====================================================
Deployment Complete
====================================================

Chaincode : ${CHAINCODE_NAME}
Channel   : ${CHANNEL_NAME}

If you changed only chaincode code,
this is the only script you need:

    ./scripts/deploy.sh

====================================================
EOF
