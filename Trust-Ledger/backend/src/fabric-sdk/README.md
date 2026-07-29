# Fabric SDK Integration Guide

## Overview

This Fabric SDK module provides a clean, type-safe TypeScript interface to interact with the TrustLedger Hyperledger Fabric chaincode. It's organized into distinct layers for maintainability and testability.

## Architecture

```
fabric-sdk/
├── config/                    # Network configuration
│   └── fabric-sdk.config.ts
├── dto/                       # Data Transfer Objects
│   └── fabric-sdk.dto.ts
├── wallet/                    # Identity management
│   └── fabric-wallet.manager.ts
├── connection/                # Connection profiles & TLS
│   └── fabric-connection.manager.ts
├── gateway/                   # Network gateway management
│   └── fabric-gateway.manager.ts
├── contract/                  # Chaincode interaction
│   └── fabric-contract.service.ts
├── fabric-sdk.ts              # Main SDK orchestrator
└── index.ts                   # Public exports
```

## Components

### 1. Configuration (`config/`)

Manages network configuration for different organizations:

```typescript
import { getFabricConfig } from './fabric-sdk';

const lloydsCon fig = getFabricConfig('lloyds');
const halifaxConfig = getFabricConfig('halifax');
```

**Key Settings:**
- Channel name (`kycchannel`)
- Chaincode name (`trustledger`)
- MSP IDs (`LloydsMSP`, `HalifaxMSP`)
- Peer endpoints and TLS certificates
- Wallet paths

### 2. Data Transfer Objects (`dto/`)

Type-safe interfaces matching the chaincode model:

```typescript
interface CustomerDTO {
  customerID: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  nationalID: string;
  issuingBank: string;
  kycStatus: KYCStatus;
  consentGranted: boolean;
  documentHash: string;
  createdAt: string;
  updatedAt: string;
}
```

**Available DTOs:**
- `CustomerDTO` - Full customer data
- `CreateCustomerDTO` - Customer creation payload
- `UpdateCustomerDTO` - Customer update payload
- `KYCVerificationDTO` - KYC verification request
- `ConsentDTO` - Consent grant/revoke payload
- `QueryResultDTO<T>` - Query response wrapper
- `TransactionResultDTO` - Transaction response wrapper

### 3. Wallet Manager (`wallet/`)

Manages Fabric identities and X.509 certificates:

```typescript
const walletManager = new FabricWalletManager(config);
await walletManager.initialize();

// Import admin identity
await walletManager.importAdminIdentity();

// Check if identity exists
const exists = await walletManager.identityExists('admin');

// List all identities
const identities = await walletManager.listIdentities();
```

**Features:**
- File system wallet storage
- Admin identity import from cryptographic material
- User identity management
- Identity existence checks

### 3. Connection Manager (`connection/`)

Handles connection profiles and TLS credentials:

```typescript
const connectionManager = new FabricConnectionManager(config);

// Load connection profile
const profile = connectionManager.loadConnectionProfile();

// Load TLS credentials
const tlsCredentials = connectionManager.loadTLSCredentials();

// Validate configuration
const isValid = connectionManager.validateConnectionProfile();
```

**Features:**
- Connection profile loading from JSON
- TLS certificate management
- Peer endpoint configuration
- Profile validation

### 5. Gateway Manager (`gateway/`)

Manages gateway connections to the Fabric network:

```typescript
const gatewayManager = new FabricGatewayManager(
  config,
  walletManager,
  connectionManager
);

// Connect to network
await gatewayManager.connect();

// Get network and contract instances
const network = gatewayManager.getNetwork();
const contract = gatewayManager.getContract();

// Check connection status
const connected = gatewayManager.isConnected();

// Disconnect
await gatewayManager.disconnect();
```

**Features:**
- Automatic identity loading
- Network discovery
- Contract (chaincode) access
- Connection lifecycle management

### 6. Contract Service (`contract/`)

Type-safe wrapper for all chaincode functions:

```typescript
const contractService = new FabricContractService(contract);

// Customer operations
await contractService.createCustomer(customerData);
const customer = await contractService.readCustomer('CUST001');
await contractService.updateCustomer(updateData);
await contractService.deleteCustomer('CUST001');

// KYC operations
await contractService.issueKYC('CUST001');
await contractService.verifyKYC({ customerID: 'CUST001', requestingBank: 'HALIFAX' });

// Consent operations
await contractService.grantConsent({ customerID: 'CUST001' });
await contractService.revokeConsent({ customerID: 'CUST001' });

// Query operations
const allCustomers = await contractService.getAllCustomers();
const history = await contractService.getCustomerHistory('CUST001');
```

**All Available Methods:**

#### Customer Management
- `createCustomer(data: CreateCustomerDTO)` - Create new customer
- `readCustomer(customerID: string)` - Get customer details
- `updateCustomer(data: UpdateCustomerDTO)` - Update customer
- `deleteCustomer(customerID: string)` - Delete customer
- `customerExists(customerID: string)` - Check if exists

#### KYC Management
- `issueKYC(customerID: string)` - Issue KYC verification
- `verifyKYC(data: KYCVerificationDTO)` - Verify KYC from another bank

#### Consent Management
- `grantConsent(data: ConsentDTO)` - Grant KYC sharing consent
- `revokeConsent(data: ConsentDTO)` - Revoke consent

#### Queries
- `getAllCustomers()` - Get all customers
- `getCustomerHistory(customerID: string)` - Get modification history

#### Utilities
- `initLedger()` - Initialize with sample data
- `executeFunction(name, ...args)` - Custom function execution
- `queryFunction(name, ...args)` - Custom query execution

### 7. Main SDK Class (`fabric-sdk.ts`)

Orchestrates all components:

```typescript
import { FabricSDK, getFabricConfig } from './fabric-sdk';

// Initialize SDK
const config = getFabricConfig('lloyds');
const sdk = new FabricSDK(config);
await sdk.initialize();

// Get contract service
const contractService = sdk.getContractService();

// Use contract methods
const result = await contractService.createCustomer({
  customerID: 'CUST123',
  fullName: 'John Doe',
  // ... other fields
});

// Health check
const health = await sdk.healthCheck();

// Get network info
const info = sdk.getNetworkInfo();

// Disconnect when done
await sdk.disconnect();
```

## Integration with Backend

The SDK is integrated into the NestJS backend via:

### 1. SDK Fabric Gateway

Located at `backend/src/fabric/gateways/sdk-fabric.gateway.ts`, this implements the `FabricGateway` interface and initializes on module load.

### 2. Fabric SDK Controller

Located at `backend/src/fabric/fabric-sdk.controller.ts`, this provides REST API endpoints:

**Base URL:** `/fabric-sdk`

#### Health & Info
- `GET /fabric-sdk/health` - Health check
- `GET /fabric-sdk/info` - Network information

#### Customer Endpoints
- `POST /fabric-sdk/customers` - Create customer
- `GET /fabric-sdk/customers` - Get all customers
- `GET /fabric-sdk/customers/:customerID` - Get customer
- `PUT /fabric-sdk/customers/:customerID` - Update customer
- `DELETE /fabric-sdk/customers/:customerID` - Delete customer
- `GET /fabric-sdk/customers/:customerID/exists` - Check exists
- `GET /fabric-sdk/customers/:customerID/history` - Get history

#### KYC Endpoints
- `POST /fabric-sdk/kyc/:customerID/issue` - Issue KYC
- `POST /fabric-sdk/kyc/verify` - Verify KYC

#### Consent Endpoints
- `POST /fabric-sdk/consent/grant` - Grant consent
- `POST /fabric-sdk/consent/revoke` - Revoke consent

#### Utility Endpoints
- `POST /fabric-sdk/init-ledger` - Initialize ledger

## Usage Examples

### Creating a Customer

```typescript
// Via SDK directly
const sdk = new FabricSDK(getFabricConfig('lloyds'));
await sdk.initialize();

const result = await sdk.getContractService().createCustomer({
  customerID: 'CUST001',
  fullName: 'Alice Smith',
  dateOfBirth: '1990-05-15',
  email: 'alice@email.com',
  phone: '1234567890',
  address: '123 Main St, London',
  nationalID: 'AB123456',
  issuingBank: 'LLOYDS',
  documentHash: 'hash123456',
});

// Via REST API
const response = await fetch('http://localhost:3000/fabric-sdk/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerID: 'CUST001',
    fullName: 'Alice Smith',
    // ... other fields
  }),
});
```

### Querying Customer Data

```typescript
// Via SDK
const customer = await sdk.getContractService().readCustomer('CUST001');

if (customer.success) {
  console.log('Customer:', customer.data);
} else {
  console.error('Error:', customer.error);
}

// Via REST API
const response = await fetch('http://localhost:3000/fabric-sdk/customers/CUST001');
const customer = await response.json();
```

### KYC Workflow

```typescript
// 1. Issue KYC (Lloyds)
await contractService.issueKYC('CUST001');

// 2. Grant consent (Customer)
await contractService.grantConsent({ customerID: 'CUST001' });

// 3. Verify KYC (Halifax)
await contractService.verifyKYC({
  customerID: 'CUST001',
  requestingBank: 'HALIFAX',
});

// 4. Revoke consent (Customer)
await contractService.revokeConsent({ customerID: 'CUST001' });
```

## Environment Configuration

Add to your `.env` file:

```env
# Fabric Gateway Mode (inmemory or sdk)
FABRIC_GATEWAY_MODE=sdk

# Optional: Override default paths
FABRIC_WALLET_PATH=./wallet
FABRIC_CONNECTION_PROFILE=../fabric-network/organizations/peerOrganizations/org1.example.com/connection-org1.json
```

## Error Handling

All SDK methods return structured responses:

```typescript
interface TransactionResultDTO {
  success: boolean;
  txId: string;
  message: string;
  data?: any;
}

interface QueryResultDTO<T> {
  success: boolean;
  data?: T;
  error?: string;
  txId?: string;
}
```

Always check the `success` flag:

```typescript
const result = await contractService.createCustomer(data);

if (result.success) {
  console.log('Transaction ID:', result.txId);
  console.log('Message:', result.message);
} else {
  console.error('Error:', result.message);
}
```

## Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:3000/fabric-sdk/health

# Create customer
curl -X POST http://localhost:3000/fabric-sdk/customers \
  -H "Content-Type: application/json" \
  -d '{
    "customerID": "CUST123",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Street",
    "nationalID": "AB123456",
    "issuingBank": "LLOYDS",
    "documentHash": "hash123"
  }'

# Get all customers
curl http://localhost:3000/fabric-sdk/customers

# Get specific customer
curl http://localhost:3000/fabric-sdk/customers/CUST123
```

## Troubleshooting

### SDK Not Connecting

1. **Check Fabric network is running:**
   ```bash
   cd fabric-network
   ./network.sh up createChannel -ca
   ```

2. **Verify connection profile exists:**
   ```bash
   ls ../fabric-network/organizations/peerOrganizations/org1.example.com/connection-org1.json
   ```

3. **Check wallet directory:**
   ```bash
   ls -la ./wallet
   ```

4. **View SDK logs in backend:**
   ```bash
   tail -f logs/backend.log | grep "FabricSDK\|FabricGateway\|FabricContract"
   ```

### Identity Issues

If you see "identity not found" errors:

```typescript
// Manually import admin identity
const sdk = new FabricSDK(config);
await sdk.initialize();
await sdk.getWalletManager().importAdminIdentity();
```

### Connection Profile Issues

Ensure the connection profile path is correct:

```typescript
const config = {
  ...getFabricConfig('lloyds'),
  connectionProfilePath: path.resolve(__dirname, '../fabric-network/...'),
};
```

## Best Practices

1. **Initialize once**: Create SDK instance once and reuse it
2. **Handle errors**: Always check `success` flag in responses
3. **Use DTOs**: Leverage TypeScript types for safety
4. **Connection pooling**: SDK maintains persistent connections
5. **Logging**: Enable debug logs for troubleshooting
6. **Disconnect**: Call `sdk.disconnect()` on app shutdown

## Future Enhancements

- [ ] Event listening for chaincode events
- [ ] Transaction retry logic
- [ ] Connection pooling for multiple peers
- [ ] Automatic failover
- [ ] Caching layer for queries
- [ ] Batch operations support
- [ ] User enrollment via CA
- [ ] Multi-org transaction support

## Support

For issues or questions:
1. Check backend logs: `logs/backend.log`
2. Verify Fabric network status: `docker ps`
3. Test chaincode directly: `cd fabric-network && ./network.sh deployCC ...`

---

**Created:** 2026-07-24  
**Version:** 1.0.0  
**Author:** TrustLedger Team
