# System Architecture

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

Trust Ledger follows a simple layered architecture where users interact with a web application, business logic is handled by a backend service, and trusted KYC credentials are managed on a Hyperledger Fabric network.

```text
+----------------------+
|    React Frontend    |
+----------+-----------+
           |
           | REST API
           |
+----------v-----------+
|    NestJS Backend    |
| Fabric Gateway SDK   |
+----------+-----------+
           |
           |
+----------v-----------------------------+
|      Hyperledger Fabric Network        |
|----------------------------------------|
| Lloyds Org | Halifax Org | Orderer     |
+----------+-----------------------------+
           |
           |
+----------v-----------+
| PostgreSQL Database  |
| Document Storage     |
+----------------------+
```

---

# Architecture Components

## React Frontend

The frontend provides a simple user interface for banking users to:

- Issue KYC credentials
- Verify KYC credentials
- Revoke credentials
- View credential history

---

## NestJS Backend

The backend acts as the gateway between the frontend and the blockchain.

Responsibilities:

- Expose REST APIs
- Validate requests
- Connect to Hyperledger Fabric
- Store application data in PostgreSQL
- Handle business logic

---

## Hyperledger Fabric Network

The blockchain network maintains trusted KYC credentials.

Organizations:

- Lloyds
- Halifax

The ledger stores:

- Credential ID
- Customer Identity ID
- Document Hash
- Credential Status
- Issue Date
- Expiry Date

No customer documents are stored on-chain.

---

## PostgreSQL

PostgreSQL stores application data that should not be placed on the blockchain.

Examples:

- Customer profile
- Document metadata
- Consent records
- Audit logs

Actual customer documents remain securely stored outside the blockchain.

---

# Architecture Flow

```text
Customer
    │
    ▼
React UI
    │
    ▼
NestJS API
    │
    ▼
Fabric Gateway SDK
    │
    ▼
Hyperledger Fabric
    │
    ▼
Ledger Updated
```

---

# KYC Issuance Flow

```text
Customer
    │
    ▼
Lloyds Verifies Documents
    │
    ▼
SHA-256 Hash Generated
    │
    ▼
IssueKYC()
    │
    ▼
Credential Stored on Ledger
```

---

# KYC Verification Flow

```text
Customer Gives Consent
          │
          ▼
Halifax Requests Verification
          │
          ▼
VerifyKYC()
          │
          ▼
Ledger Returns Credential
          │
          ▼
Verification Successful
```

---

# KYC Revocation Flow

```text
Lloyds
   │
   ▼
RevokeKYC()
   │
   ▼
Ledger Updates Status
   │
   ▼
Future Verification Fails
```

---

# Design Principles

- Permissioned blockchain network
- No PII stored on-chain
- Immutable transaction history
- Secure identity verification
- Customer consent before sharing
- Modular architecture
- Easy to extend with additional banks

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React |
| Backend | NestJS |
| Blockchain | Hyperledger Fabric 2.x |
| Smart Contracts | Go Chaincode |
| Database | PostgreSQL |
| State Database | CouchDB |
| Containers | Docker |

---

# Summary

The Trust Ledger architecture separates presentation, business logic, blockchain, and data storage into independent layers. This provides a secure, scalable, and maintainable solution for reusable KYC verification while ensuring customer privacy.

---

**Next Document:** `04-Network-Topology.md`