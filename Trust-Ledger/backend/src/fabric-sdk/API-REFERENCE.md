# Fabric SDK API Reference

Quick reference for all SDK endpoints and methods.

## REST API Endpoints

**Base URL:** `http://localhost:3000/fabric-sdk`

### Health & Information

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/health` | Check SDK and network health | `{ healthy: boolean, details: {...} }` |
| GET | `/info` | Get network configuration info | `{ channelName, chaincodeName, mspId, ... }` |

### Customer Management

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/customers` | Create new customer | `CreateCustomerDTO` |
| GET | `/customers` | Get all customers | - |
| GET | `/customers/:customerID` | Get specific customer | - |
| PUT | `/customers/:customerID` | Update customer | `Partial<UpdateCustomerDTO>` |
| DELETE | `/customers/:customerID` | Delete customer | - |
| GET | `/customers/:customerID/exists` | Check if customer exists | - |
| GET | `/customers/:customerID/history` | Get customer modification history | - |

### KYC Management

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/kyc/:customerID/issue` | Issue KYC verification | - |
| POST | `/kyc/verify` | Verify KYC from another bank | `{ customerID, requestingBank }` |

### Consent Management

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/consent/grant` | Grant KYC sharing consent | `{ customerID }` |
| POST | `/consent/revoke` | Revoke KYC sharing consent | `{ customerID }` |

### Utility

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/init-ledger` | Initialize ledger with sample data | - |

## TypeScript SDK Methods

### FabricSDK (Main Class)

```typescript
// Initialize SDK
await sdk.initialize(): Promise<void>

// Get contract service
sdk.getContractService(): FabricContractService

// Get managers
sdk.getWalletManager(): FabricWalletManager
sdk.getGatewayManager(): FabricGatewayManager
sdk.getConnectionManager(): FabricConnectionManager

// Status checks
sdk.isInitialized(): boolean
sdk.getNetworkInfo(): object

// Lifecycle
await sdk.disconnect(): Promise<void>
await sdk.reconnect(): Promise<void>
await sdk.healthCheck(): Promise<{ healthy: boolean, details: any }>
```

### FabricContractService (Chaincode Interactions)

#### Customer Methods

```typescript
// Create customer
await contractService.createCustomer(data: CreateCustomerDTO): Promise<TransactionResultDTO>

// Read customer
await contractService.readCustomer(customerID: string): Promise<QueryResultDTO<CustomerDTO>>

// Update customer
await contractService.updateCustomer(data: UpdateCustomerDTO): Promise<TransactionResultDTO>

// Delete customer
await contractService.deleteCustomer(customerID: string): Promise<TransactionResultDTO>

// Check existence
await contractService.customerExists(customerID: string): Promise<QueryResultDTO<boolean>>
```

#### KYC Methods

```typescript
// Issue KYC
await contractService.issueKYC(customerID: string): Promise<TransactionResultDTO>

// Verify KYC
await contractService.verifyKYC(data: KYCVerificationDTO): Promise<TransactionResultDTO>
```

#### Consent Methods

```typescript
// Grant consent
await contractService.grantConsent(data: ConsentDTO): Promise<TransactionResultDTO>

// Revoke consent
await contractService.revokeConsent(data: ConsentDTO): Promise<TransactionResultDTO>
```

#### Query Methods

```typescript
// Get all customers
await contractService.getAllCustomers(): Promise<QueryResultDTO<CustomerDTO[]>>

// Get customer history
await contractService.getCustomerHistory(customerID: string): Promise<QueryResultDTO<CustomerHistoryDTO[]>>
```

#### Utility Methods

```typescript
// Initialize ledger
await contractService.initLedger(): Promise<TransactionResultDTO>

// Execute custom function
await contractService.executeFunction(functionName: string, ...args: string[]): Promise<TransactionResultDTO>

// Query custom function
await contractService.queryFunction(functionName: string, ...args: string[]): Promise<QueryResultDTO<any>>
```

### FabricWalletManager

```typescript
// Initialize wallet
await walletManager.initialize(): Promise<void>

// Get wallet
walletManager.getWallet(): Wallet

// Identity operations
await walletManager.identityExists(userId: string): Promise<boolean>
await walletManager.getIdentity(userId: string): Promise<Identity | undefined>
await walletManager.importAdminIdentity(): Promise<void>
await walletManager.importUserIdentity(userId: string, certificate: string, privateKey: string): Promise<void>
await walletManager.removeIdentity(userId: string): Promise<void>
await walletManager.listIdentities(): Promise<string[]>
```

### FabricGatewayManager

```typescript
// Connect to network
await gatewayManager.connect(): Promise<void>

// Get instances
gatewayManager.getGateway(): Gateway
gatewayManager.getNetwork(): Network
gatewayManager.getContract(): Contract

// Status
gatewayManager.isConnected(): boolean
gatewayManager.getCurrentIdentity(): string
gatewayManager.getCurrentMSPId(): string

// Lifecycle
await gatewayManager.disconnect(): Promise<void>
await gatewayManager.reconnect(): Promise<void>
```

### FabricConnectionManager

```typescript
// Load connection profile
connectionManager.loadConnectionProfile(): ConnectionProfile
connectionManager.getConnectionProfile(): ConnectionProfile

// TLS credentials
connectionManager.loadTLSCredentials(): grpc.ChannelCredentials

// Peer endpoint
connectionManager.getPeerEndpoint(): { url: string, tlsCACerts: Buffer, hostnameOverride: string }

// Validation
connectionManager.validateConnectionProfile(): boolean
```

## Data Transfer Objects (DTOs)

### CreateCustomerDTO

```typescript
{
  customerID: string;
  fullName: string;
  dateOfBirth: string;  // Format: YYYY-MM-DD
  email: string;
  phone: string;
  address: string;
  nationalID: string;
  issuingBank: string;  // "LLOYDS" or "HALIFAX"
  documentHash: string;
}
```

### UpdateCustomerDTO

```typescript
{
  customerID: string;
  fullName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentHash?: string;
}
```

### CustomerDTO (Response)

```typescript
{
  customerID: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  nationalID: string;
  issuingBank: string;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  consentGranted: boolean;
  documentHash: string;
  createdAt: string;
  updatedAt: string;
}
```

### KYCVerificationDTO

```typescript
{
  customerID: string;
  requestingBank: string;  // "LLOYDS" or "HALIFAX"
}
```

### ConsentDTO

```typescript
{
  customerID: string;
}
```

### TransactionResultDTO (Response)

```typescript
{
  success: boolean;
  txId: string;
  message: string;
  data?: any;
}
```

### QueryResultDTO<T> (Response)

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  txId?: string;
}
```

### CustomerHistoryDTO

```typescript
{
  txId: string;
  timestamp: string;
  isDelete: boolean;
  customer: CustomerDTO;
}
```

## cURL Examples

### Create Customer

```bash
curl -X POST http://localhost:3000/fabric-sdk/customers \
  -H "Content-Type: application/json" \
  -d '{
    "customerID": "CUST001",
    "fullName": "Alice Johnson",
    "dateOfBirth": "1990-05-15",
    "email": "alice@example.com",
    "phone": "1234567890",
    "address": "123 Main Street, London",
    "nationalID": "AA123456",
    "issuingBank": "LLOYDS",
    "documentHash": "0x1234567890abcdef"
  }'
```

### Get All Customers

```bash
curl http://localhost:3000/fabric-sdk/customers
```

### Get Customer

```bash
curl http://localhost:3000/fabric-sdk/customers/CUST001
```

### Update Customer

```bash
curl -X PUT http://localhost:3000/fabric-sdk/customers/CUST001 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "phone": "9876543210"
  }'
```

### Delete Customer

```bash
curl -X DELETE http://localhost:3000/fabric-sdk/customers/CUST001
```

### Issue KYC

```bash
curl -X POST http://localhost:3000/fabric-sdk/kyc/CUST001/issue
```

### Verify KYC

```bash
curl -X POST http://localhost:3000/fabric-sdk/kyc/verify \
  -H "Content-Type: application/json" \
  -d '{
    "customerID": "CUST001",
    "requestingBank": "HALIFAX"
  }'
```

### Grant Consent

```bash
curl -X POST http://localhost:3000/fabric-sdk/consent/grant \
  -H "Content-Type: application/json" \
  -d '{ "customerID": "CUST001" }'
```

### Revoke Consent

```bash
curl -X POST http://localhost:3000/fabric-sdk/consent/revoke \
  -H "Content-Type: application/json" \
  -d '{ "customerID": "CUST001" }'
```

### Customer History

```bash
curl http://localhost:3000/fabric-sdk/customers/CUST001/history
```

### Health Check

```bash
curl http://localhost:3000/fabric-sdk/health
```

### Network Info

```bash
curl http://localhost:3000/fabric-sdk/info
```

### Initialize Ledger

```bash
curl -X POST http://localhost:3000/fabric-sdk/init-ledger
```

## JavaScript/Fetch Examples

### Create Customer

```javascript
const response = await fetch('http://localhost:3000/fabric-sdk/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerID: 'CUST001',
    fullName: 'Alice Johnson',
    dateOfBirth: '1990-05-15',
    email: 'alice@example.com',
    phone: '1234567890',
    address: '123 Main Street, London',
    nationalID: 'AA123456',
    issuingBank: 'LLOYDS',
    documentHash: '0x1234567890abcdef',
  }),
});

const result = await response.json();
console.log(result);
```

### Get All Customers

```javascript
const response = await fetch('http://localhost:3000/fabric-sdk/customers');
const result = await response.json();

if (result.success) {
  console.log('Customers:', result.data);
}
```

### Issue and Verify KYC Workflow

```javascript
// 1. Create customer
await fetch('http://localhost:3000/fabric-sdk/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* customer data */ }),
});

// 2. Issue KYC (Lloyds)
await fetch('http://localhost:3000/fabric-sdk/kyc/CUST001/issue', {
  method: 'POST',
});

// 3. Grant consent
await fetch('http://localhost:3000/fabric-sdk/consent/grant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customerID: 'CUST001' }),
});

// 4. Verify KYC (Halifax)
await fetch('http://localhost:3000/fabric-sdk/kyc/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerID: 'CUST001',
    requestingBank: 'HALIFAX',
  }),
});
```

## Response Status Codes

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 200 | Success | Query successful |
| 201 | Created | Customer created |
| 400 | Bad Request | Invalid data format |
| 404 | Not Found | Customer doesn't exist |
| 500 | Internal Server Error | Network or chaincode error |

## Error Handling

All SDK responses include a `success` field:

```typescript
// Success
{
  success: true,
  data: { /* result */ },
  txId: "abc123"
}

// Error
{
  success: false,
  error: "Customer already exists",
  message: "Failed to create customer"
}
```

Always check the `success` flag before using data:

```javascript
const result = await contractService.readCustomer('CUST001');

if (result.success) {
  console.log('Customer data:', result.data);
} else {
  console.error('Error:', result.error);
}
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-07-24
