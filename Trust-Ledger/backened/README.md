# Trust Ledger Architecture

This document defines the overall architecture, network topology, ledger model, APIs, database schema, and end-to-end transaction flow for the **Trust Ledger** reusable KYC platform built using **Hyperledger Fabric**.

The goal is to design the system like a real banking solution while implementing only the components required for the hackathon. The architecture is intentionally modular so additional banks can be onboarded in the future without redesigning the blockchain network or chaincode.

---

# Overall Architecture

```text
                    +----------------------+
                    |     React UI         |
                    +----------+-----------+
                               |
                        REST APIs
                               |
                    +----------v-----------+
                    |     NestJS API       |
                    |  Fabric Gateway SDK  |
                    +----------+-----------+
                               |
                 ==============================
                 Hyperledger Fabric Network
                 ==============================

         +----------------+     +----------------+
         |   Lloyds Org   |     | Halifax Org    |
         |                |     |                |
         | Peer0          |     | Peer0          |
         | CouchDB        |     | CouchDB        |
         +--------+-------+     +-------+--------+
                  \               /
                   \             /
                    \           /
                +---------------------+
                |    RAFT Orderer     |
                +---------------------+

                               |

                 PostgreSQL (Off-chain DB)

                 Encrypted Customer Documents
                 Consent History
                 Audit Logs
                 Application Metadata
```

---

# 1. Organization Structure

We'll keep **2 organizations**.

```text
Organizations

Org1
-----
Name : Lloyds

MSP ID :
LloydsMSP

Peer :
peer0.lloyds

Domain :
lloyds.com


---------------------------------

Org2
-----
Name :
Halifax

MSP ID :
HalifaxMSP

Peer :
peer0.halifax

Domain :
halifax.com


---------------------------------

Orderer

orderer.trustledger.com
```

### Why?

Simple.

Every transaction clearly crosses an organizational boundary.

---

# 2. Peer & Orderer Topology

```text
                     RAFT Orderer

                    orderer0

                        |

        -----------------------------------

        Lloyds Peer             Halifax Peer

        peer0                   peer0

        CouchDB                 CouchDB
```

For the hackathon:

* 1 Orderer
* 2 Peers
* 2 CouchDBs

No need for 3 RAFT orderers in a demo.

---

# 3. Network Layout

```text
Docker Network

trustledger-network

Containers

orderer

peer0.lloyds

couchdb.lloyds

peer0.halifax

couchdb.halifax

cli

nestjs

postgres

react
```

Everything runs inside Docker except React if we want local development.

---

# 4. Channel Configuration

One channel only.

```text
Channel

kycchannel
```

Both organizations join.

```text
Lloyds

    |

kycchannel

    |

Halifax
```

No multiple channels.

No private collections.

---

# 5. Ledger Schema

This is probably the most important decision.

## Asset Type

```text
KYCCredential
```

Ledger stores only the fingerprint.

```text
CredentialID

CustomerID

Hash

Issuer

IssueDate

ExpiryDate

Status

ConsentStatus

Version

TransactionID
```

### Example

```json
{
  "credentialId": "KYC-1001",
  "customerId": "CUST-001",
  "documentHash": "SHA256.....",
  "issuer": "Lloyds",
  "issueDate": "2026-07-20",
  "expiryDate": "2027-07-20",
  "status": "ACTIVE",
  "consent": true,
  "version": 1
}
```

### Notice

* No ID Proof
* No Address Proof
* No Passport
* No Name
* No Address

Exactly matching the privacy-first architecture.

---

# 6. Chaincode API

We will keep only business functions.

```text
InitLedger()

IssueKYC()

VerifyKYC()

VerifyClaim()

RevokeKYC()

UpdateConsent()

GetCredential()

GetHistory()

CredentialExists()
```

## IssueKYC()

### Input

```text
CustomerID

Hash

Issuer

Expiry
```

### Output

```text
CredentialID
```

---

## VerifyKYC()

### Input

```text
CredentialID
```

### Output

```text
Valid

Expired

Revoked

Issuer

Expiry
```

---

## VerifyClaim()

### Input

```text
CredentialID

ClaimType
```

Example:

```text
kyc_active
```

Returns:

```text
true
```

or

```text
false
```

No extra data is returned.

---

## RevokeKYC()

### Input

```text
CredentialID

Reason
```

### Output

```text
Revoked
```

---

## GetHistory()

Uses the Fabric History API.

Returns:

```text
Issue

Verify

Revoke

Updates
```

This is an excellent demo feature because judges love seeing immutable history.

---

# 7. REST API Contract

```text
POST /api/kyc/issue

POST /api/kyc/verify

POST /api/kyc/verify-claim

POST /api/kyc/revoke

GET /api/kyc/:credentialId

GET /api/kyc/history/:credentialId
```

---

# 8. PostgreSQL Schema

Blockchain should never become your database.

We'll store business data off-chain.

## customers

```text
customer_id

first_name

last_name

email

phone

dob

created_at
```

---

## documents

```text
document_id

customer_id

document_type

encrypted_path

hash

uploaded_at
```

---

## credentials

```text
credential_id

customer_id

issuer

status

expiry
```

---

## consent

```text
consent_id

customer_id

requested_by

approved

timestamp
```

---

## audit_logs

```text
event

actor

timestamp

remarks
```

---

# 9. Folder Structure

```text
trust-ledger/

├── fabric-network/
│
├── chaincode/
│     └── kyc/
│
├── backend/
│     └── nestjs/
│
├── frontend/
│     └── react/
│
├── postgres/
│
├── docs/
│
├── scripts/
│
├── docker-compose.yml
│
└── README.md
```

Inside chaincode:

```text
chaincode/

kyc/

    main.go

    contract.go

    models.go

    utils.go
```

---

# 10. End-to-End Transaction Flow

```text
Customer

↓

Lloyds Branch

↓

Officer verifies documents

↓

SHA256 Generated

↓

IssueKYC()

↓

Fabric Ledger

↓

Credential Created

↓

-------------------------

Customer visits Halifax

↓

Mortgage Application

↓

Halifax API

↓

VerifyKYC()

↓

Ledger

↓

ACTIVE

↓

Proceed
```

No documents are moved.

Only the document fingerprint is verified.

---

# 11. Demo Scenario

We'll make the demo feel like a real banking journey.

## Step 1 – Lloyds

Officer uploads:

* Passport
* Driving Licence
* Address Proof

Backend computes:

```text
SHA256
```

Stores encrypted documents in PostgreSQL/file storage.

Calls:

```text
IssueKYC()
```

Ledger now contains only:

```text
CredentialID

Hash

Issuer

Status
```

---

## Step 2 – Halifax

Customer applies for a mortgage.

Halifax requests consent.

Customer approves.

Halifax calls:

```text
VerifyClaim("kyc_active")
```

Ledger returns:

```text
true
```

Halifax skips document upload.

---

## Step 3 – Lloyds

Suppose fraud is detected.

Officer clicks:

```text
Revoke
```

Chaincode executes:

```text
RevokeKYC()
```

---

## Step 4 – Halifax

Customer reapplies.

```text
VerifyClaim()
```

Returns:

```text
false
```

Application stops automatically.

---

# Future Enhancement

Introduce a **Network Identity** instead of tying the ledger directly to a customer ID.

Instead of:

```text
CustomerID
```

Use:

```text
NetworkIdentityID
```

Example:

```text
NID-1A9F8D23
```

Then map it off-chain:

```text
NetworkIdentityID
      ↓
CustomerID
      ↓
Customer Profile
      ↓
Encrypted Documents
```

The blockchain never stores a bank-specific customer identifier. If another Lloyds Banking Group brand joins later, it only needs to understand the shared `NetworkIdentityID`, making the ledger more privacy-preserving and extensible while keeping the off-chain mapping within each institution.

I genuinely think this architecture is strong enough to stand up to technical questions from judges while still being achievable within a 48-hour implementation window.

The next step would be to design the **ledger data models (Go structs), transaction payloads, endorsement policy, and Docker/Fabric topology** in detail before writing the first line of code.
