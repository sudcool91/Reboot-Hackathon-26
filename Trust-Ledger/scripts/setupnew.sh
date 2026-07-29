#!/usr/bin/env bash
#
# TrustLedger Enhanced Setup Script
#
# This script handles common issues when setting up on WSL/Linux:
# - Fixes Windows CRLF line endings
# - Installs missing dependencies (Go, Node, npm, jq)
# - Downloads Hyperledger Fabric binaries
# - Validates Docker setup
#
set -Eeuo pipefail

# WSL + Docker Desktop: auto-detect docker socket and context
unset DOCKER_HOST 2>/dev/null || true
docker context use desktop-linux >/dev/null 2>&1 || true
# Add user to docker group if not already
if ! groups | grep -q docker; then
  sudo usermod -aG docker "$USER" 2>/dev/null || true
fi
# Try known socket paths
for sock in /run/docker.sock /var/run/docker.sock /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/docker.sock; do
  if [ -S "$sock" ]; then
    export DOCKER_HOST=unix://$sock
    break
  fi
done

FABRIC_VERSION="2.5.12"
CA_VERSION="1.5.15"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[ OK ]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }
err(){ echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FABRIC_SAMPLES="${HOME}/fabric-samples"

# ============================================
# 1. Platform Check
# ============================================
if [[ "$OSTYPE" != linux* ]]; then
  err "Run this script from Linux or WSL, not Windows directly."
fi

if grep -qi microsoft /proc/version 2>/dev/null; then
  ok "Running under WSL."
else
  ok "Running on native Linux."
fi

# ============================================
# 2. Fix CRLF Line Endings (Critical!)
# ============================================
info "Fixing Windows CRLF line endings in all shell scripts..."
cd "$PROJECT_ROOT"

# Fix all .sh files recursively
find . -type f -name "*.sh" -exec sed -i 's/\r$//' {} \; 2>/dev/null || true

# Fix network.config specifically
if [[ -f "fabric-network/network.config" ]]; then
  sed -i 's/\r$//' fabric-network/network.config
fi

# Fix any other config files that might have CRLF
find fabric-network -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.config" \) -exec sed -i 's/\r$//' {} \; 2>/dev/null || true

ok "Line endings fixed."

# ============================================
# 3. Install Missing System Dependencies
# ============================================
info "Checking and installing system dependencies..."

# Update package list once
sudo apt update -qq

# Install jq (JSON processor - required by Fabric scripts)
if ! command -v jq >/dev/null 2>&1; then
  info "Installing jq..."
  sudo apt install -y jq
  ok "jq installed: $(jq --version)"
else
  ok "jq already installed: $(jq --version)"
fi

# Install Go
if ! command -v go >/dev/null 2>&1; then
  info "Installing Go..."
  sudo apt install -y golang-go
  ok "Go installed: $(go version)"
else
  ok "Go already installed: $(go version)"
fi

# Install Node.js and npm
if ! command -v node >/dev/null 2>&1; then
  info "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  ok "Node.js installed: $(node -v)"
  ok "npm installed: $(npm -v)"
else
  ok "Node.js already installed: $(node -v)"
  ok "npm already installed: $(npm -v)"
fi

# Check for other required tools
for cmd in git docker curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "$cmd is not installed. Please install it manually."
  fi
  ok "$cmd is available."
done

# ============================================
# 4. Docker Check
# ============================================
info "Checking Docker daemon..."
# In WSL with Docker Desktop, try multiple socket paths
if ! docker info >/dev/null 2>&1; then
  if DOCKER_HOST=unix:///var/run/docker.sock docker info >/dev/null 2>&1; then
    export DOCKER_HOST=unix:///var/run/docker.sock
    ok "Docker daemon is running (via /var/run/docker.sock)."
  elif DOCKER_HOST=unix:///run/docker.sock docker info >/dev/null 2>&1; then
    export DOCKER_HOST=unix:///run/docker.sock
    ok "Docker daemon is running (via /run/docker.sock)."
  else
    err "Docker daemon is not running. Start Docker Desktop and try again."
  fi
else
  ok "Docker daemon is running."
fi

# ============================================
# 5. Validate Project Structure
# ============================================
info "Validating project structure..."
for d in backend frontend chaincode fabric-network scripts; do
  [[ -e "${PROJECT_ROOT}/${d}" ]] || err "Missing directory: ${d}"
done
ok "All required directories exist."

[[ -f "${PROJECT_ROOT}/docker-compose.yml" ]] || err "Missing docker-compose.yml"
ok "docker-compose.yml found."

# Validate docker-compose.yml syntax
if ! docker compose -f "${PROJECT_ROOT}/docker-compose.yml" config >/dev/null 2>&1; then
  err "docker-compose.yml has syntax errors."
fi
ok "docker-compose.yml is valid."

# ============================================
# 6. Download Hyperledger Fabric Binaries
# ============================================
if [[ ! -d "${FABRIC_SAMPLES}/.git" ]]; then
  info "Cloning fabric-samples repository..."
  git clone https://github.com/hyperledger/fabric-samples.git "${FABRIC_SAMPLES}"
  ok "fabric-samples cloned."
else
  ok "fabric-samples already exists."
fi

if [[ ! -f "${FABRIC_SAMPLES}/bin/peer" ]]; then
  info "Downloading Hyperledger Fabric ${FABRIC_VERSION} and CA ${CA_VERSION}..."
  info "This may take a few minutes..."
  (
    cd "${FABRIC_SAMPLES}"
    curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh \
      | bash -s -- "${FABRIC_VERSION}" "${CA_VERSION}"
  )
  ok "Fabric binaries downloaded."
else
  ok "Fabric binaries already exist."
fi

# ============================================
# 7. Create Symlinks for Fabric Tools
# ============================================
info "Creating symlinks to Fabric binaries and config..."
ln -snf "${FABRIC_SAMPLES}/bin" "${PROJECT_ROOT}/bin"
ln -snf "${FABRIC_SAMPLES}/config" "${PROJECT_ROOT}/config"
ok "Symlinks created."

# ============================================
# 8. Make All Scripts Executable
# ============================================
info "Making all shell scripts executable..."
find "${PROJECT_ROOT}" -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
ok "Scripts are now executable."

# ============================================
# 9. Validate Fabric Binaries
# ============================================
info "Validating Fabric peer binary..."
export PATH="${PROJECT_ROOT}/bin:$PATH"
export FABRIC_CFG_PATH="${PROJECT_ROOT}/config"

if ! "${FABRIC_SAMPLES}/bin/peer" version >/dev/null 2>&1; then
  err "peer binary validation failed."
fi
ok "peer binary validated successfully."

# ============================================
# 10. Environment Setup Verification
# ============================================
info "Verifying environment variables..."
ok "PATH includes: ${PROJECT_ROOT}/bin"
ok "FABRIC_CFG_PATH: ${FABRIC_CFG_PATH}"

# ============================================
# Summary
# ============================================
cat <<EOF

============================================
 TrustLedger Environment Ready ✓
============================================

Fabric Version : ${FABRIC_VERSION}
Fabric CA      : ${CA_VERSION}
Go Version     : $(go version | awk '{print $3}')
Node Version   : $(node -v)
npm Version    : $(npm -v)
jq Version     : $(jq --version)

Fixes Applied:
  ✓ CRLF line endings converted to LF
  ✓ All dependencies installed
  ✓ Fabric binaries downloaded
  ✓ Scripts made executable
  ✓ Symlinks created
  ✓ Docker validated

Next Steps:

    cd fabric-network
    ./network.sh up createChannel -ca
    ./network.sh deployCC -ccn trustledger -ccp ../chaincode/trustledger -ccl go

  OR use the convenience script:

    ./scripts/start.sh

============================================

EOF

ok "Setup completed successfully!"
