#!/usr/bin/env bash
set -euo pipefail

CHANNEL_NAME="kycchannel"
CC_NAME="trustledger"
CC_VERSION="1.0"
CCAAS_SERVER_PORT=9999
FABRIC_NET="/mnt/d/LBG/Reboot-Hackathon-26/Trust-Ledger/fabric-network"
PEER_BIN="/home/asus/fabric-samples/bin"
FABRIC_CFG="/home/asus/fabric-samples/config"

export PATH="$PEER_BIN:$PATH"
export FABRIC_CFG_PATH="$FABRIC_CFG"

ORG1_TLS="$FABRIC_NET/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem"
ORG2_TLS="$FABRIC_NET/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem"
ORG1_MSP="$FABRIC_NET/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
ORG2_MSP="$FABRIC_NET/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
ORDERER_TLS="$FABRIC_NET/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

info(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[ OK ]${NC} $*"; }
fail(){ echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

setOrg1() {
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID=LloydsMSP
  export CORE_PEER_TLS_ROOTCERT_FILE="$ORG1_TLS"
  export CORE_PEER_MSPCONFIGPATH="$ORG1_MSP"
  export CORE_PEER_ADDRESS=localhost:7051
}

setOrg2() {
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID=HalifaxMSP
  export CORE_PEER_TLS_ROOTCERT_FILE="$ORG2_TLS"
  export CORE_PEER_MSPCONFIGPATH="$ORG2_MSP"
  export CORE_PEER_ADDRESS=localhost:9051
}

# ─── STEP 1: Create CCaaS package ─────────────────────────────────────────────
info "Creating CCaaS package..."
tempdir=$(mktemp -d)
mkdir -p "$tempdir/src" "$tempdir/pkg"

cat > "$tempdir/src/connection.json" <<CONN
{
  "address": "{{.peername}}_${CC_NAME}_ccaas:${CCAAS_SERVER_PORT}",
  "dial_timeout": "10s",
  "tls_required": false
}
CONN

cat > "$tempdir/pkg/metadata.json" <<META
{
    "type": "ccaas",
    "label": "${CC_NAME}_${CC_VERSION}"
}
META

tar -C "$tempdir/src" -czf "$tempdir/pkg/code.tar.gz" .
tar -C "$tempdir/pkg" -czf "$FABRIC_NET/${CC_NAME}_ccaas.tar.gz" metadata.json code.tar.gz
rm -rf "$tempdir"

CCAAS_PKG="$FABRIC_NET/${CC_NAME}_ccaas.tar.gz"
PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid "$CCAAS_PKG")
ok "Package ID: $PACKAGE_ID"

# ─── STEP 2: Install on peer0.org1 ────────────────────────────────────────────
info "Installing chaincode on peer0.org1 (LloydsMSP)..."
setOrg1
peer lifecycle chaincode install "$CCAAS_PKG" 2>&1
ok "Installed on peer0.org1"

# ─── STEP 3: Install on peer0.org2 ────────────────────────────────────────────
info "Installing chaincode on peer0.org2 (HalifaxMSP)..."
setOrg2
peer lifecycle chaincode install "$CCAAS_PKG" 2>&1
ok "Installed on peer0.org2"

# ─── STEP 4: Approve for org1 ─────────────────────────────────────────────────
info "Approving chaincode definition for org1..."
setOrg1
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --version "$CC_VERSION" \
  --package-id "$PACKAGE_ID" \
  --sequence 1 \
  --tls \
  --cafile "$ORDERER_TLS" 2>&1
ok "Approved for org1"

# ─── STEP 5: Approve for org2 ─────────────────────────────────────────────────
info "Approving chaincode definition for org2..."
setOrg2
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --version "$CC_VERSION" \
  --package-id "$PACKAGE_ID" \
  --sequence 1 \
  --tls \
  --cafile "$ORDERER_TLS" 2>&1
ok "Approved for org2"

# ─── STEP 6: Check commit readiness ───────────────────────────────────────────
info "Checking commit readiness..."
setOrg1
peer lifecycle chaincode checkcommitreadiness \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --version "$CC_VERSION" \
  --sequence 1 \
  --tls \
  --cafile "$ORDERER_TLS" \
  --output json 2>&1

# ─── STEP 7: Commit chaincode definition ──────────────────────────────────────
info "Committing chaincode definition..."
setOrg1
peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --version "$CC_VERSION" \
  --sequence 1 \
  --tls \
  --cafile "$ORDERER_TLS" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$ORG1_TLS" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$ORG2_TLS" 2>&1
ok "Chaincode committed!"

# ─── STEP 8: Start CCaaS containers ───────────────────────────────────────────
info "Starting CCaaS containers..."

# Stop any existing CCaaS containers
docker rm -f peer0org1_${CC_NAME}_ccaas peer0org2_${CC_NAME}_ccaas 2>/dev/null || true

docker run --rm -d \
  --name "peer0org1_${CC_NAME}_ccaas" \
  --network fabric_test \
  -e CHAINCODE_SERVER_ADDRESS=0.0.0.0:${CCAAS_SERVER_PORT} \
  -e CHAINCODE_ID="$PACKAGE_ID" \
  -e CORE_CHAINCODE_ID_NAME="$PACKAGE_ID" \
  ${CC_NAME}_ccaas_image:latest

docker run --rm -d \
  --name "peer0org2_${CC_NAME}_ccaas" \
  --network fabric_test \
  -e CHAINCODE_SERVER_ADDRESS=0.0.0.0:${CCAAS_SERVER_PORT} \
  -e CHAINCODE_ID="$PACKAGE_ID" \
  -e CORE_CHAINCODE_ID_NAME="$PACKAGE_ID" \
  ${CC_NAME}_ccaas_image:latest

ok "CCaaS containers started!"
docker ps --filter name=${CC_NAME}_ccaas

# ─── STEP 9: Query committed ───────────────────────────────────────────────────
info "Verifying committed chaincode..."
setOrg1
sleep 3
peer lifecycle chaincode querycommitted \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --tls \
  --cafile "$ORDERER_TLS" 2>&1

ok "=== CCaaS Deployment Complete ==="
echo "Chaincode: $CC_NAME  Channel: $CHANNEL_NAME  PackageID: $PACKAGE_ID"
