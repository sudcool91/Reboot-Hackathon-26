# TrustLedger - Hyperledger Fabric Network Setup Guide

This document explains how to set up the complete Hyperledger Fabric network required for the TrustLedger project on a new machine.

Following this guide should allow any developer to clone the repository and run the blockchain network successfully.

---

# Table of Contents

1. Prerequisites
2. Install Required Software
3. Clone Repository
4. Download Hyperledger Fabric Binaries
5. Configure the Project
6. Start Fabric Network
7. Deploy Chaincode
8. Verify Deployment
9. Test the Chaincode
10. Restart Network
11. Stop Network
12. Clean Network
13. Troubleshooting

---

# 1. Prerequisites

The following software must already be installed.

## Git

Verify:

```bash
git --version
```

Expected:

```
git version 2.x.x
```

---

## Docker Desktop

Install Docker Desktop.

Verify:

```bash
docker --version
docker compose version
```

Docker Desktop must be running before continuing.

---

## Go

Required because the chaincode is written in Go.

Verify:

```bash
go version
```

Recommended:

```
Go 1.24+
```

---

## Node.js

Required for Fabric CLI scripts.

Verify:

```bash
node -v
npm -v
```

Recommended:

```
Node.js 20+
```

---

## cURL

Verify:

```bash
curl --version
```

---

## WSL2 (Windows Users)

Recommended.

Ubuntu 22.04 LTS or newer.

---

# 2. Clone Repository

Clone the project.

```bash
git clone <https://github.com/sudcool91/Reboot-Hackathon-26.git>
```

Open the project.

```bash
cd Trust-Ledger
```

---

# 3. Download Hyperledger Fabric Binaries

Create a workspace.

Example:

```bash
mkdir -p ~/blockchain
cd ~/blockchain
```

Clone Fabric Samples.

```bash
git clone https://github.com/hyperledger/fabric-samples.git
```

Move inside.

```bash
cd fabric-samples
```

Download binaries.

```bash
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s
```

The following directories should now exist:

```
fabric-samples
│
├── bin
├── config
├── test-network
```

---

# 4. Configure the Project

Go to the repository.

```
Trust-Ledger/
```

Create symbolic links.

Linux / WSL

```bash
ln -s ~/blockchain/fabric-samples/bin bin
ln -s ~/blockchain/fabric-samples/config config
```

Verify.

```bash
ls -l
```

Expected:

```
bin -> /home/<user>/blockchain/fabric-samples/bin
config -> /home/<user>/blockchain/fabric-samples/config
```

---

# 5. Start the Fabric Network

Move to the network folder.

```bash
cd fabric-network
```

Start the network.

```bash
./network.sh up createChannel -ca
```

This command performs:

- Starts all Docker containers
- Creates Certificate Authorities
- Creates the channel
- Joins peers
- Starts Orderer

Wait until the command completes successfully.

---

# 6. Deploy TrustLedger Chaincode

Deploy the chaincode.

```bash
./network.sh deployCC \
    -ccn trustledger \
    -ccp ../chaincode/trustledger \
    -ccl go
```

This command automatically:

- Packages chaincode
- Installs chaincode
- Approves chaincode
- Commits chaincode
- Initializes chaincode

---

# 7. Verify Deployment

List Docker containers.

```bash
docker ps
```

Expected containers include:

- peer0.org1
- peer0.org2
- orderer
- ca_org1
- ca_org2

Verify installed chaincode.

```bash
peer lifecycle chaincode queryinstalled
```

---

# 8. Test Chaincode

Invoke.

Example:

```bash
peer chaincode invoke ...
```

Query.

```bash
peer chaincode query ...
```

(Replace with actual TrustLedger commands.)

---

# 9. Restart Network

If Docker was stopped.

```bash
cd fabric-network

./network.sh up
```

---

# 10. Stop Network

```bash
./network.sh down
```

This removes:

- Peers
- Orderers
- CA Containers

---

# 11. Clean Network

If deployment becomes corrupted.

```bash
./network.sh down
```

Remove Docker artifacts.

```bash
docker system prune -f
```

Start again.

```bash
./network.sh up createChannel -ca
```

Deploy chaincode again.

```bash
./network.sh deployCC \
    -ccn trustledger \
    -ccp ../chaincode/trustledger \
    -ccl go
```

---

# Project Structure

```
Trust-Ledger
│
├── backend
├── frontend
├── chaincode
│   └── trustledger
├── fabric-network
│   ├── network.sh
│   └── organizations
├── docs
├── scripts
├── bin -> fabric-samples/bin
└── config -> fabric-samples/config
```

---

# Common Commands

Start network

```bash
./network.sh up createChannel -ca
```

Deploy chaincode

```bash
./network.sh deployCC \
    -ccn trustledger \
    -ccp ../chaincode/trustledger \
    -ccl go
```

Shutdown network

```bash
./network.sh down
```

List Docker containers

```bash
docker ps
```

Remove unused Docker resources

```bash
docker system prune -f
```

---

# Troubleshooting

## Docker is not running

Start Docker Desktop.

Verify:

```bash
docker ps
```

---

## network.sh permission denied

Run:

```bash
chmod +x network.sh
```

---

## Chaincode deployment fails

Ensure:

- Docker Desktop is running
- Go is installed
- `bin` symbolic link exists
- `config` symbolic link exists

Verify:

```bash
ls -l
```

---

## peer command not found

Ensure the Fabric binaries are linked correctly.

Expected:

```
bin -> fabric-samples/bin
```

---

## Network already exists

Run:

```bash
./network.sh down
```

Then:

```bash
./network.sh up createChannel -ca
```

---

# Notes

- Do not commit the `bin` and `config` symbolic links if your team prefers each developer to create them locally.
- Docker Desktop must always be running before executing any Fabric command.
- If chaincode source changes, redeploy it using the `deployCC` command.
- If network configuration changes, recreate the network using `./network.sh down` followed by `./network.sh up createChannel -ca`.

---

# Maintainers

TrustLedger Development Team

Reboot Hackathon 2026