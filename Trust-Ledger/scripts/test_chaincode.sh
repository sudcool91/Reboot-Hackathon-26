#!/usr/bin/env bash
export PATH=/home/asus/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=/home/asus/fabric-samples/config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=LloydsMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/mnt/d/LBG/Reboot-Hackathon-26/Trust-Ledger/fabric-network/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_MSPCONFIGPATH=/mnt/d/LBG/Reboot-Hackathon-26/Trust-Ledger/fabric-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
ORDERER_TLS=/mnt/d/LBG/Reboot-Hackathon-26/Trust-Ledger/fabric-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

echo "--- QueryAllCredentials ---"
peer chaincode query -C kycchannel -n trustledger -c '{"Args":["QueryAllCredentials"]}' --tls --cafile $ORDERER_TLS 2>&1

echo "--- InitLedger ---"
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_TLS \
  -C kycchannel -n trustledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE \
  -c '{"Args":["InitLedger"]}' 2>&1

sleep 3
echo "--- QueryAllCredentials after Init ---"
peer chaincode query -C kycchannel -n trustledger -c '{"Args":["QueryAllCredentials"]}' --tls --cafile $ORDERER_TLS 2>&1
