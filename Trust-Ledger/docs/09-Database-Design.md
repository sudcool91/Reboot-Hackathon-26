# Database Design

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

PostgreSQL is used to store application data that should not be stored on the blockchain, such as customer information, consent records, and document metadata.

> **Note:** Customer documents are stored securely off-chain. Only their SHA-256 hash is recorded on the blockchain.

---

# Database Tables

| Table | Purpose |
|--------|---------|
| customers | Customer information |
| credentials | KYC credential details |
| documents | Document metadata |
| consent | Customer consent records |
| audit_logs | Application audit logs |

---

# Entity Relationship

```text
+-------------+
|  Customers  |
+------+------+
       |
       | 1:N
       |
+------+------+
| Credentials |
+------+------+
       |
       | 1:N
       |
+------+------+
| Documents   |
+-------------+

Customers
    |
    +-------> Consent

Credentials
    |
    +-------> Audit Logs
```

---

# Table Summary

## Customers

Stores basic customer details.

Example fields:

- customerId
- networkIdentityId
- fullName
- email
- phone

---

## Credentials

Stores credential information linked to the blockchain.

Example fields:

- credentialId
- customerId
- blockchainTxId
- status
- issueDate
- expiryDate

---

## Documents

Stores document metadata.

Example fields:

- documentId
- credentialId
- documentType
- documentHash
- storageLocation

---

## Consent

Stores customer consent for credential verification.

Example fields:

- consentId
- customerId
- requestedBy
- consentStatus
- timestamp

---

## Audit Logs

Stores application events.

Example fields:

- logId
- action
- performedBy
- timestamp

---

# Security

- Sensitive customer data stored off-chain
- Blockchain stores only document hashes
- Database access restricted to backend services
- All communication secured using TLS

---

# Summary

PostgreSQL complements the blockchain by storing application-specific data while Hyperledger Fabric maintains an immutable record of KYC credentials.

---

**Next Document:** `10-Security-Architecture.md`