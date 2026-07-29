# Fabric SDK Setup Guide

## Quick Start

### 1. Install Required Dependencies

In the backend directory, install Fabric SDK dependencies:

```bash
cd backend
npm install fabric-network @grpc/grpc-js
```

### 2. Verify Fabric Network is Running

```bash
cd ../fabric-network
./network.sh up createChannel -ca
```

### 3. Set Environment Variable

Add to `backend/.env`:

```env
FABRIC_GATEWAY_MODE=sdk
```

### 4. Start Backend

```bash
cd backend
npm run start:dev
```

### 5. Test SDK Connection

```bash
# Health check
curl http://localhost:3000/fabric-sdk/health

# Should return:
# {
#   "healthy": true,
#   "details": {
#     "initialized": true,
#     "connected": true,
#     "channelName": "kycchannel",
#     "chaincodeName": "trustledger",
#     "mspId": "LloydsMSP",
#     "chaincodeAccessible": true
#   }
# }
```

## Detailed Setup

### Prerequisites

- Hyperledger Fabric network running (via `./network.sh up createChannel -ca`)
- Node.js 18+ installed
- Backend dependencies installed

### Step-by-Step Configuration

#### 1. Install NPM Dependencies

```bash
cd backend
npm install --save fabric-network @grpc/grpc-js
```

**Packages:**
- `fabric-network` - Hyperledger Fabric Node.js SDK
- `@grpc/grpc-js` - gRPC implementation for Node.js

#### 2. Verify Network Structure

Ensure the following files exist:

```
fabric-network/
└── organizations/
    └── peerOrganizations/
        ├── org1.example.com/
        │   ├── connection-org1.json
        │   ├── users/
        │   │   └── Admin@org1.example.com/
        │   │       └── msp/
        │   │           ├── signcerts/cert.pem
        │   │           └── keystore/*.pem
        │   └── tlsca/
        │       └── tlsca.org1.example.com-cert.pem
        └── org2.example.com/
            └── ... (similar structure)
```

If files are missing, regenerate network:

```bash
cd fabric-network
./network.sh down
./network.sh up createChannel -ca
```

#### 3. Configure Environment Variables

Create or update `backend/.env`:

```env
# Fabric Configuration
FABRIC_GATEWAY_MODE=sdk
FABRIC_WALLET_PATH=./wallet
FABRIC_CHANNEL=kycchannel
FABRIC_CHAINCODE=trustledger

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=trustledger
DB_PASS=trustledger123
DB_NAME=trustledger
```

#### 4. Verify Configuration

The SDK will use these default paths (relative to backend/):

- **Connection Profile:** `../fabric-network/organizations/peerOrganizations/org1.example.com/connection-org1.json`
- **TLS Certificate:** `../fabric-network/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem`
- **Admin Certificates:** `../fabric-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/`

If your paths differ, update `fabric-sdk.config.ts`.

#### 5. Start Backend

```bash
cd backend
npm run start:dev
```

Watch for initialization logs:

```
[FabricWalletManager] Wallet initialized at ./wallet
[FabricConnectionManager] Connection profile loaded
[FabricGatewayManager] Connected to Fabric gateway as admin (LloydsMSP)
[FabricGatewayManager] Connected to channel: kycchannel
[FabricGatewayManager] Connected to chaincode: trustledger
[SdkFabricGateway] Fabric SDK initialized successfully
```

#### 6. Test Endpoints

##### Health Check
```bash
curl http://localhost:3000/fabric-sdk/health
```

Expected response:
```json
{
  "healthy": true,
  "details": {
    "initialized": true,
    "connected": true,
    "channelName": "kycchannel",
    "chaincodeName": "trustledger",
    "mspId": "LloydsMSP",
    "userId": "admin",
    "chaincodeAccessible": true
  }
}
```

##### Initialize Ledger (first time only)
```bash
curl -X POST http://localhost:3000/fabric-sdk/init-ledger
```

##### Create Customer
```bash
curl -X POST http://localhost:3000/fabric-sdk/customers \
  -H "Content-Type: application/json" \
  -d '{
    "customerID": "CUST001",
    "fullName": "Alice Johnson",
    "dateOfBirth": "1990-06-15",
    "email": "alice@example.com",
    "phone": "1234567890",
    "address": "123 Main Street, London",
    "nationalID": "AA123456",
    "issuingBank": "LLOYDS",
    "documentHash": "0x1234567890abcdef"
  }'
```

##### Get All Customers
```bash
curl http://localhost:3000/fabric-sdk/customers
```

##### Get Specific Customer
```bash
curl http://localhost:3000/fabric-sdk/customers/CUST001
```

## Troubleshooting

### Issue: "Wallet not initialized"

**Solution:**
```bash
# Remove old wallet and restart
rm -rf backend/wallet
# Restart backend - it will auto-create wallet
npm run start:dev
```

### Issue: "Connection profile not found"

**Solution:**
```bash
# Verify file exists
ls ../fabric-network/organizations/peerOrganizations/org1.example.com/connection-org1.json

# If missing, regenerate
cd ../fabric-network
./network.sh up createChannel -ca
```

### Issue: "Failed to connect to peer"

**Causes & Solutions:**

1. **Network not running:**
   ```bash
   cd fabric-network
   docker ps  # Check containers are running
   ./network.sh up createChannel -ca
   ```

2. **Wrong peer endpoint:**
   Check `fabric-sdk.config.ts` matches your Docker setup:
   ```typescript
   peerEndpoint: 'localhost:7051',  // Default for org1
   ```

3. **TLS certificate mismatch:**
   Regenerate certificates:
   ```bash
   cd fabric-network
   ./network.sh down
   rm -rf organizations/peerOrganizations organizations/ordererOrganizations
   ./network.sh up createChannel -ca
   ```

### Issue: "Chaincode not accessible"

**Solution:**
```bash
# Redeploy chaincode
cd fabric-network
./network.sh deployCC -ccn trustledger -ccp ../chaincode/trustledger -ccl go
```

### Issue: "Identity not found in wallet"

**Solution:**

The SDK auto-imports admin identity on first connection. If it fails:

```typescript
// Manual identity import (in code or via endpoint)
const sdk = new FabricSDK(config);
await sdk.initialize();
await sdk.getWalletManager().importAdminIdentity();
```

### Issue: SDK logs show errors

**Check backend logs:**
```bash
tail -f logs/backend.log | grep -E "FabricSDK|FabricGateway|FabricWallet|FabricContract"
```

**Enable verbose logging:**

In `fabric-sdk.config.ts`, the gateway uses discovery mode. If issues persist, try disabling:

```typescript
const gatewayOptions: GatewayOptions = {
  wallet: this.walletManager.getWallet(),
  identity: this.config.userId,
  discovery: {
    enabled: false,  // Disable for troubleshooting
    asLocalhost: true,
  },
};
```

## Multi-Organization Setup

To connect as **Halifax** instead of **Lloyds**:

### Option 1: Environment Variable (Coming Soon)

```env
FABRIC_ORG=halifax
```

### Option 2: Code Configuration

In `backend/src/fabric/gateways/sdk-fabric.gateway.ts`:

```typescript
constructor() {
  // Change 'lloyds' to 'halifax'
  const config = getFabricConfig('halifax');
  this.sdk = new FabricSDK(config);
}
```

## Development Workflow

### Complete Restart

```bash
# 1. Stop everything
cd fabric-network
./network.sh down

# 2. Clean artifacts
rm -rf channel-artifacts/* organizations/peerOrganizations organizations/ordererOrganizations

# 3. Remove wallet
cd ../backend
rm -rf wallet

# 4. Restart network
cd ../fabric-network
./network.sh up createChannel -ca
./network.sh deployCC -ccn trustledger -ccp ../chaincode/trustledger -ccl go

# 5. Restart backend
cd ../backend
npm run start:dev
```

### Quick Restart (Keep Data)

```bash
# Restart backend only
cd backend
# Ctrl+C to stop
npm run start:dev
```

## Performance Tips

1. **Connection Pooling:** SDK maintains persistent connections - reuse the instance
2. **Caching:** Consider caching frequently accessed data
3. **Batch Queries:** Use `getAllCustomers()` instead of multiple `readCustomer()` calls
4. **Async/Await:** All SDK methods are async - use proper async handling

## Security Considerations

1. **Private Keys:** Never commit wallet directory to git
2. **Environment Variables:** Use `.env` for sensitive configuration
3. **TLS:** Always use TLS in production (enabled by default)
4. **Identity Management:** Rotate identities periodically
5. **Access Control:** Implement authorization layer above SDK

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment
3. ✅ Test connection
4. 🔄 Integrate with frontend
5. 🔄 Add authentication/authorization
6. 🔄 Implement event listeners
7. 🔄 Add caching layer
8. 🔄 Deploy to staging/production

## Resources

- [Fabric SDK Node Documentation](https://hyperledger.github.io/fabric-sdk-node/)
- [Fabric Gateway API](https://hyperledger.github.io/fabric-gateway/)
- [TrustLedger README](../README.md)
- [Chaincode Documentation](../../chaincode/trustledger/README.md)

---

**Last Updated:** 2026-07-24  
**SDK Version:** 1.0.0
