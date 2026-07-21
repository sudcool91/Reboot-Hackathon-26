# Business Problem

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Background

Banks are required to perform **Know Your Customer (KYC)** verification before providing financial services such as savings accounts, loans, credit cards, and mortgages.

Although customers may already be verified by one bank within the same banking group, they are often required to repeat the entire KYC process when applying for another product or service.

This results in unnecessary duplication, increased operational costs, and a poor customer experience.

---

# Current Process

```text
Customer
    │
    ▼
Submit Documents
    │
    ▼
Bank Verifies Identity
    │
    ▼
KYC Approved

Customer Applies at Another Bank
    │
    ▼
Submit Same Documents Again
    │
    ▼
Verification Repeated
```

---

# Problems

## Repeated KYC Verification

Customers must upload the same identity documents multiple times across different banking brands.

---

## Slow Customer Onboarding

Manual verification increases the time required to approve applications.

---

## Higher Operational Costs

Banks spend time and resources verifying information that has already been validated.

---

## Poor Customer Experience

Repeated document submission creates frustration and increases application abandonment.

---

## Siloed Identity Data

Each bank maintains its own verification records, making trusted identity sharing difficult.

---

# Business Impact

| Challenge | Impact |
|-----------|--------|
| Duplicate verification | Increased operational cost |
| Manual processing | Longer onboarding time |
| Document resubmission | Poor customer experience |
| Isolated systems | No reusable identity |
| Repeated verification | Reduced operational efficiency |

---

# Proposed Solution

Trust Ledger introduces a **Reusable KYC Platform** built on **Hyperledger Fabric**.

Instead of sharing customer documents, participating banks share a trusted KYC credential stored on a permissioned blockchain.

```text
Customer
    │
    ▼
Lloyds Verifies KYC
    │
    ▼
Credential Issued
    │
    ▼
Stored on Hyperledger Fabric
    │
    ▼
Halifax Verifies Credential
    │
    ▼
No Document Re-upload Required
```

---

# Why Hyperledger Fabric?

Hyperledger Fabric is well suited for this use case because it provides:

- Permissioned network
- Identity-based access control
- Immutable audit trail
- Secure smart contracts
- High transaction throughput
- Privacy between participating organizations

---

# Expected Benefits

## For Customers

- Faster onboarding
- One-time KYC verification
- No repeated document uploads
- Better digital banking experience

---

## For Banks

- Reduced verification effort
- Lower operational costs
- Improved compliance
- Faster customer acquisition
- Trusted audit history

---

# Project Scope

### Included

- Lloyds Organization
- Halifax Organization
- Reusable KYC Credentials
- Credential Verification
- Credential Revocation
- Consent-based Verification

### Not Included

- Cross-bank payments
- Digital Currency
- Loan Processing
- Fabric CA
- Mobile Wallet
- Zero Knowledge Proofs

---

# Success Metrics

The solution will be considered successful if it can:

- Issue a reusable KYC credential
- Verify credentials across organizations
- Eliminate repeated document uploads
- Support credential revocation
- Maintain an immutable audit trail

---

# Summary

Trust Ledger addresses the inefficiencies of traditional KYC by enabling trusted, reusable identity verification across participating banks.

The solution reduces duplicate work, improves customer experience, and demonstrates how Hyperledger Fabric can modernize digital identity management within the banking ecosystem.

---

**Next Document:** `03-System-Architecture.md`