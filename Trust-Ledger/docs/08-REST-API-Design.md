# REST API Design

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

The backend exposes REST APIs for issuing, verifying, retrieving, and revoking reusable KYC credentials.

**Base URL**

```
/api/v1/kyc
```

---

# API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/issue` | Issue a new KYC credential |
| POST | `/verify` | Verify a KYC credential |
| GET | `/{credentialId}` | Get credential details |
| POST | `/revoke` | Revoke a credential |
| GET | `/history/{credentialId}` | Get credential history |

---

# 1. Issue KYC

**POST** `/api/v1/kyc/issue`

### Request

```json
{
  "networkIdentityId": "NID-001",
  "documentHash": "9f2a8d7c4b5...",
  "issuer": "Lloyds"
}
```

### Response

```json
{
  "message": "KYC Credential Issued",
  "credentialId": "KYC-1001"
}
```

---

# 2. Verify KYC

**POST** `/api/v1/kyc/verify`

### Request

```json
{
  "credentialId": "KYC-1001"
}
```

### Response

```json
{
  "status": "Active",
  "verified": true
}
```

---

# 3. Get Credential

**GET** `/api/v1/kyc/{credentialId}`

### Response

```json
{
  "credentialId": "KYC-1001",
  "networkIdentityId": "NID-001",
  "issuer": "Lloyds",
  "status": "Active"
}
```

---

# 4. Revoke KYC

**POST** `/api/v1/kyc/revoke`

### Request

```json
{
  "credentialId": "KYC-1001"
}
```

### Response

```json
{
  "message": "Credential Revoked"
}
```

---

# 5. Get History

**GET** `/api/v1/kyc/history/{credentialId}`

### Response

```json
[
  {
    "action": "Issued",
    "timestamp": "2026-07-21T10:00:00Z"
  },
  {
    "action": "Revoked",
    "timestamp": "2026-08-15T09:30:00Z"
  }
]
```

---

# HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Resource Created |
| 400 | Bad Request |
| 404 | Credential Not Found |
| 409 | Credential Already Exists |
| 500 | Internal Server Error |

---

# Summary

The REST APIs provide a simple interface for interacting with the Hyperledger Fabric network, allowing applications to issue, verify, retrieve, revoke, and audit reusable KYC credentials.

---

**Next Document:** `09-Database-Design.md`