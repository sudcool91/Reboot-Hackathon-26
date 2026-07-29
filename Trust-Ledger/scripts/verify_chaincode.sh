#!/usr/bin/env bash
export PATH=/home/asus/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=/home/asus/fabric-samples/config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=LloydsMSP
FN=/mnt/d/LBG/Reboot-Hackathon-26/Trust-Ledger/fabric-network
export CORE_PEER_TLS_ROOTCERT_FILE=$FN/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_MSPCONFIGPATH=$FN/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
ORDERER_TLS=$FN/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

echo "=== GetAllCustomers ==="
peer chaincode query -C kycchannel -n trustledger \
  -c '{"Args":["GetAllCustomers"]}' \
  --tls --cafile "$ORDERER_TLS" 2>&1

echo ""
echo "=== IssueKYC Test ==="
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$ORDERER_TLS" \
  -C kycchannel -n trustledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$CORE_PEER_TLS_ROOTCERT_FILE" \
  -c '{"Args":["IssueKYC","CUST001","LloydsMSP","PASS"]}' 2>&1
