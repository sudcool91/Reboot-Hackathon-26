#!/usr/bin/env bash
#
# TrustLedger setup.sh
#
# NOTE:
# This is a bootstrap template generated from the chat.
# It includes the core structure, validations, and pinned versions.
# Extend project-specific commands as needed.
#
set -Eeuo pipefail

FABRIC_VERSION="2.5.12"
CA_VERSION="1.5.15"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[OK]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }
err(){ echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FABRIC_SAMPLES="${HOME}/fabric-samples"

for c in git docker curl go node npm; do
  command -v "$c" >/dev/null 2>&1 || err "$c is not installed."
done

docker info >/dev/null 2>&1 || err "Docker daemon is not running."

if [[ "$OSTYPE" != linux* ]]; then
  err "Run this script from Linux or WSL."
fi

if grep -qi microsoft /proc/version 2>/dev/null; then
  ok "Running under WSL."
else
  ok "Running on Linux."
fi

for d in backend frontend chaincode fabric-network scripts; do
  [[ -e "${PROJECT_ROOT}/${d}" ]] || err "Missing ${d}"
done

[[ -f "${PROJECT_ROOT}/docker-compose.yml" ]] || err "Missing docker-compose.yml"

docker compose -f "${PROJECT_ROOT}/docker-compose.yml" config >/dev/null || err "docker-compose.yml is invalid"

if [[ ! -d "${FABRIC_SAMPLES}/.git" ]]; then
  info "Cloning fabric-samples..."
  git clone https://github.com/hyperledger/fabric-samples.git "${FABRIC_SAMPLES}"
fi

if [[ ! -f "${FABRIC_SAMPLES}/bin/peer" ]]; then
  info "Downloading Hyperledger Fabric ${FABRIC_VERSION}"
  (
    cd "${FABRIC_SAMPLES}"
    curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh \
      | bash -s -- "${FABRIC_VERSION}" "${CA_VERSION}"
  )
fi

ln -snf "${FABRIC_SAMPLES}/bin" "${PROJECT_ROOT}/bin"
ln -snf "${FABRIC_SAMPLES}/config" "${PROJECT_ROOT}/config"

chmod +x "${PROJECT_ROOT}"/scripts/*.sh 2>/dev/null || true

"${FABRIC_SAMPLES}/bin/peer" version || err "peer binary validation failed"

cat <<EOF

============================================
 TrustLedger Environment Ready
============================================

Fabric Version : ${FABRIC_VERSION}
Fabric CA      : ${CA_VERSION}

Next:

    ./scripts/start.sh

============================================

EOF
