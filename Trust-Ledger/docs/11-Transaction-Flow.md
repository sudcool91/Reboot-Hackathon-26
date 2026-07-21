# Transaction Flow

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

This document describes the end-to-end transaction flow for issuing, verifying, and revoking reusable KYC credentials.

---

# 1. Issue KYC

A customer completes KYC verification at Lloyds.

```text
Customer
    │
    ▼
Lloyds Verifies Documents
    │
    ▼
Generate SHA-256 Hash
    │
    ▼
IssueKYC()
    │
    ▼
Credential Stored on Ledger
```

---

# 2. Verify KYC

Halifax verifies the customer's KYC without requesting documents again.

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
Ledger Checks Credential
          │
          ▼
Verification Result
```

---

# 3. Revoke KYC

If a credential becomes invalid, Lloyds can revoke it.

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
Credential Marked as Revoked
```

---

# End-to-End Flow

```text
Customer
    │
    ▼
Lloyds Issues KYC
    │
    ▼
Credential Stored on Blockchain
    │
    ▼
Customer Applies at Halifax
    │
    ▼
Halifax Verifies Credential
    │
    ▼
Application Approved
```

---

# Transaction Summary

| Transaction | Performed By | Result |
|-------------|-------------|--------|
| IssueKYC | Lloyds | Creates credential |
| VerifyKYC | Halifax | Validates credential |
| GetCredential | Any Authorized Bank | Retrieves credential |
| RevokeKYC | Lloyds | Revokes credential |
| GetHistory | Any Authorized Bank | Returns audit history |

---

# Summary

Trust Ledger enables trusted KYC sharing by allowing credentials to be issued once, verified across organizations, and revoked when necessary, while maintaining an immutable audit trail on Hyperledger Fabric.

---

**Next Document:** `12-Deployment-Guide.md`