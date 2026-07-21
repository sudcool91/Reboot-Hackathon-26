# Ledger Data Model

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

The blockchain ledger stores reusable KYC credentials. Only credential metadata and document hashes are stored on-chain. Customer documents remain securely stored off-chain.

---

# Ledger Asset

The primary asset stored on the blockchain is a **KYCCredential**.

| Field | Type | Description |
|--------|------|-------------|
| credentialId | String | Unique credential identifier |
| networkIdentityId | String | Unique customer identity |
| documentHash | String | SHA-256 hash of KYC documents |
| issuer | String | Issuing organization (e.g., Lloyds) |
| issueDate | String | Credential issue date |
| expiryDate | String | Credential expiry date |
| status | String | Active / Revoked / Expired |

---

# Sample Asset

```json
{
  "credentialId": "KYC-1001",
  "networkIdentityId": "NID-001",
  "documentHash": "9f2a8d7c4b5...",
  "issuer": "Lloyds",
  "issueDate": "2026-07-21",
  "expiryDate": "2031-07-21",
  "status": "Active"
}
```

---

# Asset Lifecycle

```text
Issue Credential
       │
       ▼
     Active
       │
       ├────────► Revoked
       │
       └────────► Expired
```

---

# Ledger Operations

| Operation | Description |
|-----------|-------------|
| IssueKYC | Create a new credential |
| VerifyKYC | Verify an existing credential |
| GetCredential | Retrieve credential details |
| RevokeKYC | Mark a credential as revoked |
| GetHistory | View credential transaction history |

---

# Design Principles

- No customer documents stored on-chain
- Immutable transaction history
- SHA-256 document integrity
- Unique identity for each customer
- Simple and scalable asset model

---

# Summary

The ledger stores trusted KYC credentials that can be securely verified across participating organizations while ensuring customer privacy and data integrity.

---

**Next Document:** `07-Chaincode-Design.md`