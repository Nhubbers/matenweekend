#!/bin/bash
# Matenweekend Infrastructure Destroy Script
# Usage: ./destroy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}"
echo "============================================"
echo "  WARNING: This will DESTROY everything!"
echo "============================================"
echo -e "${NC}"
echo ""
echo "This will delete:"
echo "  - Hetzner server"
echo "  - All data on the server"
echo "  - Firewall rules"
echo "  - SSH keys (from Hetzner)"
echo ""
echo -e "${YELLOW}Make sure you have backups before proceeding!${NC}"
echo ""

read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Destroying infrastructure..."
cd "$SCRIPT_DIR/terraform"
terraform destroy -auto-approve

echo ""
echo -e "${GREEN}Infrastructure destroyed.${NC}"
echo ""
echo "To recreate, run: ./setup.sh"
