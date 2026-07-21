# Executive Summary

**Project:** Trust Ledger  
**Event:** Lloyds Technology Centre Designathon 2026  
**Version:** 1.0

---

# Overview

Trust Ledger is a reusable KYC platform built on **Hyperledger Fabric** that enables customers to complete KYC once and securely reuse their verified identity across participating banks within the Lloyds Banking Group.

Instead of sharing sensitive customer documents, the platform stores only cryptographic proofs (SHA-256 hashes) and credential metadata on a permissioned blockchain. All personal information remains securely stored off-chain.

---

# Problem Statement

Customers are often required to submit the same KYC documents multiple times when applying for products across different banking brands.

This results in:

- Duplicate verification effort
- Higher operational costs
- Slower customer onboarding
- Poor customer experience

---

# Proposed Solution

Trust Ledger enables participating banks to issue and verify reusable KYC credentials.

Workflow:

1. Customer completes KYC at Lloyds.
2. Documents remain encrypted off-chain.
3. A SHA-256 hash is generated.
4. Credential metadata is stored on Hyperledger Fabric.
5. Halifax verifies the credential instead of requesting documents again.
6. Customer consent is required before verification.
7. Credentials can be revoked if required.

---

# Key Features

- Reusable KYC credentials
- Permissioned blockchain network
- Customer consent management
- Immutable audit trail
- Credential revocation
- Secure off-chain document storage

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React |
| Backend | NestJS |
| Blockchain | Hyperledger Fabric 2.x |
| Smart Contract | Go Chaincode |
| Database | PostgreSQL |
| State Database | CouchDB |
| Containers | Docker |

---

# High-Level Architecture

```text
React UI
    │
NestJS API
    │
Fabric Gateway SDK
    │
+---------------------------+
| Hyperledger Fabric        |
|---------------------------|
| Lloyds | Halifax | Orderer|
+---------------------------+
    │
PostgreSQL + Document Store
```

---

# Business Benefits

- Faster customer onboarding
- Reduced KYC processing cost
- Improved customer experience
- Trusted identity verification
- Secure and auditable transactions

---

# Scope

### Included

- Two organizations (Lloyds & Halifax)
- One Fabric channel
- RAFT ordering service
- KYC issuance
- KYC verification
- Credential revocation
- REST APIs
- React dashboard

### Future Enhancements

- MBNA onboarding
- Bank of Scotland onboarding
- DID & Verifiable Credentials
- Zero Knowledge Proofs
- Fabric CA
- Private Data Collections

---

# Success Criteria

The PoC is successful if it demonstrates:

- Lloyds issues a KYC credential
- Halifax verifies it without document upload
- Customer consent is enforced
- Lloyds revokes the credential
- Halifax detects the revocation
- All transactions are recorded on the blockchain

---

# Conclusion

Trust Ledger demonstrates how Hyperledger Fabric can simplify customer onboarding by enabling secure, reusable KYC across trusted banking institutions.

The solution improves customer experience, reduces operational effort, and provides a scalable foundation for future digital identity services.

---

**Next Document:** `02-Business-Problem.md`