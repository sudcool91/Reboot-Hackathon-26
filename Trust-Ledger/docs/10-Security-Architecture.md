# Security Architecture

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

Trust Ledger follows a **security-first** approach by combining Hyperledger Fabric's permissioned blockchain with secure off-chain storage. Customer privacy is maintained by ensuring that sensitive data is never stored on the blockchain.

---

# Security Principles

- Permissioned blockchain network
- No Personally Identifiable Information (PII) stored on-chain
- Secure identity management using X.509 certificates
- Immutable transaction history
- Customer consent before verification

---

# Security Layers

```text
+---------------------------+
|      React Frontend       |
+------------+--------------+
             |
         HTTPS / TLS
             |
+------------v--------------+
|      NestJS Backend       |
+------------+--------------+
             |
     Fabric Gateway SDK
             |
+------------v--------------+
|   Hyperledger Fabric      |
|  MSP • TLS • Chaincode    |
+------------+--------------+
             |
+------------v--------------+
| PostgreSQL & Documents    |
+---------------------------+
```

---

# Security Features

| Feature | Description |
|---------|-------------|
| Permissioned Network | Only authorized organizations can participate |
| MSP | Authenticates network members |
| X.509 Certificates | Secure identity for users and peers |
| TLS | Encrypts communication between components |
| SHA-256 | Protects document integrity |
| Immutable Ledger | Prevents transaction tampering |

---

# Data Protection

| On Blockchain | Off Blockchain |
|--------------|----------------|
| Credential ID | Customer Details |
| Document Hash | KYC Documents |
| Issue Date | Personal Information |
| Expiry Date | Contact Information |
| Status | Consent Records |

---

# Access Control

Only authorized participants can perform blockchain operations.

| Role | Permissions |
|------|-------------|
| Lloyds | Issue, Verify, Revoke |
| Halifax | Verify |
| Customer | Provide Consent |

---

# Summary

Trust Ledger protects customer privacy by storing only cryptographic proofs on the blockchain while keeping sensitive information securely off-chain. Hyperledger Fabric's built-in security features ensure trusted, authenticated, and tamper-proof KYC verification.

---

**Next Document:** `11-Transaction-Flow.md`