# Chaincode Design

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

The chaincode contains the business logic for managing reusable KYC credentials on the Hyperledger Fabric network.

It supports issuing, verifying, retrieving, and revoking KYC credentials.

---

# Chaincode Functions

| Function | Description |
|----------|-------------|
| `IssueKYC()` | Creates a new KYC credential |
| `VerifyKYC()` | Verifies whether a credential is valid |
| `GetCredential()` | Retrieves credential details |
| `RevokeKYC()` | Revokes an existing credential |
| `GetHistory()` | Returns transaction history |

---

# Workflow

```text
IssueKYC()
      │
      ▼
Store Credential
      │
      ▼
VerifyKYC()
      │
      ▼
Valid / Invalid
      │
      ▼
RevokeKYC() (if required)
```

---

# Business Rules

- Each credential must have a unique `credentialId`.
- Customer documents are never stored on-chain.
- Only active credentials can be verified.
- Revoked or expired credentials are considered invalid.
- Every transaction is permanently recorded on the ledger.

---

# Error Handling

| Scenario | Response |
|----------|----------|
| Credential already exists | Reject request |
| Credential not found | Return error |
| Credential revoked | Verification failed |
| Invalid input | Reject transaction |

---

# Summary

The chaincode acts as the core business layer of Trust Ledger, ensuring that all KYC operations are securely executed and permanently recorded on the blockchain.

---

**Next Document:** `08-REST-API-Design.md`