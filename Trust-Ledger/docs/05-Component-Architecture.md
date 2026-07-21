# Component Architecture

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

Trust Ledger follows a modular architecture where each component has a specific responsibility, making the solution secure, scalable, and easy to maintain.

---

# Component Diagram

```text
+----------------------+
|   React Frontend     |
+----------+-----------+
           |
        REST APIs
           |
+----------v-----------+
|   NestJS Backend     |
+----------+-----------+
           |
   Fabric Gateway SDK
           |
+----------v-----------+
| Hyperledger Fabric   |
|  - Chaincode         |
|  - Ledger            |
+----------+-----------+
           |
+----------v-----------+
| PostgreSQL Database  |
+----------------------+
```

---

# Components

## React Frontend

Provides the user interface for:

- Issue KYC
- Verify KYC
- Revoke KYC
- View Credential Details

---

## NestJS Backend

Handles business logic and API requests.

Responsibilities:

- Request validation
- Blockchain communication
- Database operations
- Response handling

---

## Hyperledger Fabric

Acts as the trusted ledger.

Responsibilities:

- Store KYC credentials
- Verify credentials
- Revoke credentials
- Maintain transaction history

---

## Chaincode

Implements business rules.

Main Functions:

- IssueKYC()
- VerifyKYC()
- RevokeKYC()
- GetCredential()

---

## PostgreSQL

Stores off-chain application data.

Examples:

- Customer records
- Consent records
- Audit logs
- Document metadata

---

# Component Interaction

```text
User
 │
 ▼
React UI
 │
 ▼
NestJS API
 │
 ▼
Hyperledger Fabric
 │
 ▼
Ledger Updated
 │
 ▼
Response to User
```

---

# Summary

Each component has a clearly defined responsibility. The frontend handles user interactions, the backend manages business logic, Hyperledger Fabric provides trusted credential management, and PostgreSQL stores off-chain application data.

---

**Next Document:** `06-Ledger-Data-Model.md`