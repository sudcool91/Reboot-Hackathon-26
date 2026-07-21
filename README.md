# Trust Ledger

> **Verify Once. Trust Everywhere.**

A reusable KYC platform built on **Hyperledger Fabric** that enables financial institutions to securely share customer KYC credentials, eliminating repetitive verification while maintaining privacy, security, and auditability.

---

## 🚀 Problem Statement

Banks repeatedly perform KYC verification whenever a customer opens a new account or applies for a financial product.

This results in:

* Duplicate KYC processes
* Increased operational costs
* Longer customer onboarding
* Poor customer experience
* Data inconsistency across institutions

---

## 💡 Solution

**Trust Ledger** provides a blockchain-based reusable KYC platform where:

* A customer completes KYC once.
* The issuing bank publishes a verified credential.
* Other authorized banks verify the credential instantly.
* Customer consent is maintained.
* Every transaction is securely recorded on the blockchain.

---

## 🏗️ Architecture

```text
                +----------------+
                |   React UI     |
                +----------------+
                        |
                        ▼
               +-----------------+
               | NestJS Backend  |
               +-----------------+
                        |
                        ▼
          +---------------------------+
          | Hyperledger Fabric Network|
          +---------------------------+
              |                   |
        +-----------+       +-----------+
        | Lloyds    |       | Halifax   |
        +-----------+       +-----------+
              |                   |
           CouchDB             CouchDB
                        |
                        ▼
                  PostgreSQL
```

---

## ✨ Features

* Reusable KYC Credentials
* Blockchain-based Verification
* Immutable Audit Trail
* Credential Revocation
* SHA-256 Document Hashing
* Multi-Organization Support
* REST APIs
* Modern Web Interface

---

## 🛠️ Technology Stack

| Layer            | Technology         |
| ---------------- | ------------------ |
| Frontend         | React              |
| Backend          | NestJS             |
| Blockchain       | Hyperledger Fabric |
| Chaincode        | Go                 |
| Database         | PostgreSQL         |
| State Database   | CouchDB            |
| Containerization | Docker             |

---

## 👥 Network Participants

* Lloyds
* Halifax

Consensus Mechanism:

* RAFT

Channel:

* `kycchannel`

---

## 📂 Project Structure

```text
Reboot-Hackathon-26/
│
├── frontend/
├── backend/
├── chaincode/
├── fabric-network/
├── docs/
├── docker/
├── scripts/
└── README.md
```

---

## 🔄 KYC Lifecycle

```text
Issue KYC
     │
     ▼
Store on Blockchain
     │
     ▼
Verify by Another Bank
     │
     ▼
Reuse Credential
     │
     ▼
Revoke if Required
```

---

## 📖 Documentation

Project documentation includes:

* Executive Summary
* Business Problem
* System Architecture
* Network Topology
* Component Architecture
* Ledger Data Model
* Chaincode Design
* REST API Design
* Database Design
* Security Architecture
* Transaction Flow
* Deployment Guide
* Demo Guide
* Future Roadmap

---

## 🎯 Hackathon Highlights

* Hyperledger Fabric based solution
* Secure & permissioned blockchain
* Enterprise-ready architecture
* Modular backend services
* REST API integration
* Reusable digital identity model

---

## 👨‍💻 Team

**Trust Ledger**

Built for **Reboot Hackathon 2026**

---

## 📜 License

This project is created for educational and hackathon purposes.
