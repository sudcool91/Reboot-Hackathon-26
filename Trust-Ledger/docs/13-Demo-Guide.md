# Demo Guide

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Objective

Demonstrate how a KYC credential can be **issued once**, **verified across organizations**, and **revoked** using Hyperledger Fabric.

---

# Demo Flow

## Step 1 - Issue KYC

**Actor:** Lloyds

- Open the application
- Fill customer KYC details
- Click **Issue KYC**

**Expected Result**

- Credential created
- Transaction committed to blockchain

---

## Step 2 - Verify KYC

**Actor:** Halifax

- Enter the Credential ID
- Click **Verify KYC**

**Expected Result**

- Credential status: **Active**
- No document re-upload required

---

## Step 3 - View Credential

Retrieve the credential details from the blockchain.

**Expected Result**

- Credential ID
- Issuer
- Status
- Issue Date
- Expiry Date

---

## Step 4 - Revoke KYC

**Actor:** Lloyds

- Select the credential
- Click **Revoke KYC**

**Expected Result**

- Credential status updated to **Revoked**

---

## Step 5 - Verify Again

**Actor:** Halifax

Verify the same credential after revocation.

**Expected Result**

- Verification Failed
- Status: **Revoked**

---

# Demo Workflow

```text
Lloyds
   │
Issue KYC
   │
   ▼
Blockchain
   │
   ▼
Halifax Verifies
   │
   ▼
Success
   │
Lloyds Revokes
   │
   ▼
Blockchain Updated
   │
   ▼
Halifax Verifies Again
   │
   ▼
Verification Failed
```

---

# Expected Outcome

- Reusable KYC successfully issued
- Cross-organization verification completed
- Credential revocation reflected immediately
- Complete transaction history available on the blockchain

---

# Summary

This demo showcases the complete lifecycle of a reusable KYC credential using Hyperledger Fabric, highlighting secure issuance, verification, and revocation across participating organizations.

---

**Next Document:** `14-Future-Roadmap.md`