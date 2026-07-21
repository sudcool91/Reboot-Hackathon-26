# Network Topology

**Project:** Trust Ledger  
**Document Version:** 1.0

---

# Overview

The Trust Ledger network is built on **Hyperledger Fabric** using a permissioned blockchain. For this Proof of Concept, the network consists of **two organizations**, one **RAFT Orderer**, and a **shared channel**.

---

# Network Components

| Component | Description |
|----------|-------------|
| Organization 1 | Lloyds |
| Organization 2 | Halifax |
| Orderer | RAFT Ordering Service |
| Channel | `kycchannel` |
| State Database | CouchDB |
| Smart Contract | Go Chaincode |

---

# Network Topology

```text
                    +------------------+
                    |  RAFT Orderer    |
                    +--------+---------+
                             |
          -----------------------------------------
          |                                       |
+---------v---------+                 +-----------v---------+
|    Lloyds Org     |                 |    Halifax Org      |
|-------------------|                 |---------------------|
| peer0             |                 | peer0               |
| CouchDB           |                 | CouchDB             |
+---------+---------+                 +-----------+---------+
          \_______________________________________/
                          |
                    Channel: kycchannel
```

---

# Organizations

## Lloyds

- MSP: `LloydsMSP`
- Peer: `peer0.lloyds`
- CouchDB

---

## Halifax

- MSP: `HalifaxMSP`
- Peer: `peer0.halifax`
- CouchDB

---

# Channel

- **Name:** `kycchannel`
- Shared between Lloyds and Halifax
- Stores reusable KYC credentials
- Enables secure communication between organizations

---

# Consensus

The network uses **RAFT Consensus**, providing:

- High availability
- Fault tolerance
- Distributed ordering
- Enterprise-grade reliability

---

# Security

- Permissioned network
- MSP-based identity management
- X.509 certificates
- TLS communication
- No customer data stored on-chain

---

# Summary

The Trust Ledger network is a simple two-organization Hyperledger Fabric setup designed to securely issue, verify, and revoke reusable KYC credentials while maintaining privacy and trust.

---

**Next Document:** `05-Component-Architecture.md`