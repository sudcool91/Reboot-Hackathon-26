# Deployment Guide

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

This guide explains how to deploy the Trust Ledger Proof of Concept using Docker and Hyperledger Fabric.

---

# Prerequisites

- Docker
- Docker Compose
- Node.js (v20+)
- Go (v1.22+)
- Hyperledger Fabric Samples & Binaries

---

# Project Structure

```text
trust-ledger/
├── fabric-network/
├── chaincode/
├── backend/
├── frontend/
├── scripts/
└── docker-compose.yml
```

---

# Deployment Steps

## 1. Clone the Repository

```bash
git clone <repository-url>
cd trust-ledger
```

---

## 2. Start the Fabric Network

```bash
cd fabric-network
./network.sh up
```

---

## 3. Deploy Chaincode

```bash
./network.sh deployCC
```

---

## 4. Start Backend

```bash
cd backend
npm install
npm run start
```

---

## 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 6. Verify Deployment

Open the application:

```
http://localhost:3000
```

Verify that you can:

- Issue a KYC Credential
- Verify a Credential
- Revoke a Credential
- View Credential Details

---

# Deployment Architecture

```text
React Frontend
        │
NestJS Backend
        │
Hyperledger Fabric
        │
PostgreSQL
```

---

# Stop the Application

Stop Fabric Network:

```bash
./network.sh down
```

Stop Backend and Frontend:

```bash
Ctrl + C
```

---

# Summary

After completing the above steps, the Trust Ledger application will be ready for demonstrating reusable KYC issuance, verification, and revocation on a Hyperledger Fabric network.

---

**Next Document:** `13-Demo-Guide.md`