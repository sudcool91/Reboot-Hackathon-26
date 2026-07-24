# TrustLedger - Quick Start Guide

This guide helps you set up and run TrustLedger on a fresh WSL/Linux system.

## Prerequisites

- **Windows Subsystem for Linux (WSL)** or native Linux
- **Docker Desktop** running with WSL integration enabled
- **Internet connection** for downloading dependencies

## First-Time Setup (Fresh System)

### Step 1: Clone the Repository

```bash
# Navigate to your workspace
cd ~/Downloads  # or wherever you want

# Clone or copy the TrustLedger repository
# (Assuming you already have it)
cd Trust-Ledger
```

### Step 2: Run Enhanced Setup Script

This script will:
- Fix Windows CRLF line endings
- Install missing dependencies (Go, Node.js, npm, jq)
- Download Hyperledger Fabric binaries
- Validate your environment

```bash
cd /path/to/Trust-Ledger
./scripts/setupnew.sh
```

**Expected output:**
```
✓ Running under WSL
✓ Line endings fixed
✓ jq installed
✓ Go installed
✓ Node.js installed
✓ npm installed
✓ Docker daemon is running
✓ All required directories exist
✓ Fabric binaries downloaded
✓ Setup completed successfully!
```

**Time required:** 5-10 minutes (depending on internet speed)

---

## Starting TrustLedger

After setup, use the enhanced start script:

```bash
cd /path/to/Trust-Ledger
./scripts/startnew.sh
```

**This script will:**
1. Fix any line ending issues (just in case)
2. Set up environment variables
3. Start PostgreSQL database
4. Start Hyperledger Fabric network
5. Create the `kycchannel` channel
6. Deploy the `trustledger` chaincode
7. Start backend API (NestJS)
8. Start frontend UI (React/Vite)

**Expected output:**
```
====================================================
    TrustLedger Started Successfully ✓
====================================================

Services:
  Backend API   : http://localhost:3000
  Frontend UI   : http://localhost:5173
  PostgreSQL    : localhost:5432
  pgAdmin       : http://localhost:5050

Hyperledger Fabric:
  Channel       : kycchannel
  Chaincode     : trustledger
```

**Time required:** 3-5 minutes

---

## Stopping TrustLedger

To cleanly shut down all services:

```bash
cd /path/to/Trust-Ledger
./scripts/stopnew.sh
```

**This will stop:**
- Backend service
- Frontend service
- Hyperledger Fabric network
- PostgreSQL database

Logs are preserved in the `logs/` directory.

---

## Troubleshooting

### Issue: "bash\r: No such file or directory"

**Cause:** Windows CRLF line endings

**Fix:**
```bash
cd /path/to/Trust-Ledger
find . -type f -name "*.sh" -exec sed -i 's/\r$//' {} \;
./scripts/setupnew.sh
```

---

### Issue: "jq: command not found" or "go: command not found"

**Cause:** Missing dependencies

**Fix:**
```bash
./scripts/setupnew.sh
```

The setup script will automatically install all missing dependencies.

---

### Issue: "Docker daemon is not running"

**Cause:** Docker Desktop is not started

**Fix:**
1. Open Docker Desktop
2. Wait for it to fully start (whale icon in system tray)
3. Run `docker ps` to verify
4. Retry `./scripts/startnew.sh`

---

### Issue: Channel creation fails or "NOT_FOUND" errors

**Cause:** Corrupt artifacts from previous failed runs

**Fix:**
```bash
cd fabric-network
./network.sh down
rm -rf channel-artifacts/*
rm -rf organizations/peerOrganizations organizations/ordererOrganizations
cd ..
./scripts/startnew.sh
```

---

### Issue: Backend or Frontend not starting

**Check logs:**
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

**Common fixes:**
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install

# Restart services
cd ..
./scripts/stopnew.sh
./scripts/startnew.sh
```

---

## Accessing Services

### Frontend
Open browser: **http://localhost:5173**

### Backend API
- Base URL: **http://localhost:3000**
- API docs: **http://localhost:3000/api** (if Swagger is configured)

### pgAdmin (Database UI)
- URL: **http://localhost:5050**
- Email: `admin@trustledger.com`
- Password: `admin123`

### PostgreSQL (Direct Connection)
- Host: `localhost`
- Port: `5432`
- Database: `trustledger`
- Username: `trustledger`
- Password: `trustledger123`

---

## Development Workflow

### Daily Workflow

```bash
# Start everything
./scripts/startnew.sh

# ... do your development work ...

# Stop everything
./scripts/stopnew.sh
```

### Deploying Updated Chaincode

```bash
cd fabric-network
./network.sh deployCC -ccn trustledger -ccp ../chaincode/trustledger -ccl go -ccv 2.0 -ccs 2
```

### Checking Logs

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Docker container logs
docker logs peer0.org1.example.com
docker logs orderer.example.com
```

### Checking Service Status

```bash
# Check all Docker containers
docker ps

# Check Node.js processes
ps aux | grep node

# Check if ports are in use
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
```

---

## Clean Slate (Complete Reset)

If you need to start fresh:

```bash
# Stop everything
./scripts/stopnew.sh

# Remove all Fabric artifacts
cd fabric-network
./network.sh down
rm -rf channel-artifacts/* 
rm -rf organizations/peerOrganizations organizations/ordererOrganizations
rm -rf system-genesis-block/*.block

# Remove Docker volumes
docker volume prune -f

# Remove node_modules (optional)
cd ../backend
rm -rf node_modules package-lock.json

cd ../frontend
rm -rf node_modules package-lock.json

# Start fresh
cd ..
./scripts/startnew.sh
```

---

## Comparison: Old vs New Scripts

### Setup Scripts

| Old (`setup.sh`) | New (`setupnew.sh`) |
|------------------|---------------------|
| Checks for tools | ✓ Checks AND installs missing tools |
| Downloads Fabric | ✓ Downloads Fabric |
| Basic validation | ✓ Comprehensive validation |
| ❌ No CRLF fix | ✓ Fixes CRLF automatically |
| ❌ No jq install | ✓ Installs jq |
| ❌ No Go install | ✓ Installs Go |
| ❌ No Node install | ✓ Installs Node.js/npm |

### Start Scripts

| Old (`start.sh`) | New (`startnew.sh`) |
|------------------|---------------------|
| Starts services | ✓ Starts all services |
| ❌ No CRLF fix | ✓ Fixes CRLF before starting |
| ❌ No env vars | ✓ Sets FABRIC_CFG_PATH & PATH |
| ❌ No validation | ✓ Pre-flight checks |
| ❌ No cleanup | ✓ Cleans corrupt artifacts |
| ❌ Basic output | ✓ Detailed status & URLs |

---

## Files Created

- **`scripts/setupnew.sh`** - Enhanced setup with auto-installation
- **`scripts/startnew.sh`** - Robust start with all fixes
- **`scripts/stopnew.sh`** - Clean shutdown of all services
- **`QUICKSTART.md`** - This guide

---

## Support

If you encounter issues not covered here:

1. Check the logs in `logs/` directory
2. Run `docker ps` to see container status
3. Verify Docker Desktop is running
4. Try a clean slate reset (see above)

---

**Happy coding! 🚀**
