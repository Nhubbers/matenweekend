#!/bin/bash
# Matenweekend Infrastructure Setup Script
# Usage: ./setup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "============================================"
echo "  Matenweekend Infrastructure Setup"
echo "============================================"
echo -e "${NC}"

# Check prerequisites
echo "Checking prerequisites..."

command -v terraform >/dev/null 2>&1 || { 
    echo -e "${RED}Error: terraform is not installed${NC}"
    echo "Install with: brew install terraform"
    exit 1
}

command -v ansible-playbook >/dev/null 2>&1 || { 
    echo -e "${RED}Error: ansible is not installed${NC}"
    echo "Install with: brew install ansible"
    exit 1
}

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Check for terraform.tfvars
if [ ! -f "$SCRIPT_DIR/terraform/terraform.tfvars" ]; then
    echo -e "${YELLOW}terraform.tfvars not found!${NC}"
    echo ""
    echo "Please create terraform/terraform.tfvars with your configuration."
    echo "You can copy from terraform.tfvars.example:"
    echo ""
    echo "  cd terraform"
    echo "  cp terraform.tfvars.example terraform.tfvars"
    echo "  nano terraform.tfvars"
    echo ""
    exit 1
fi

echo "Configuration found. Starting deployment..."
echo ""

# Step 1: Terraform
echo -e "${YELLOW}Step 1/4: Creating infrastructure with Terraform...${NC}"
cd "$SCRIPT_DIR/terraform"
terraform init -input=false
terraform apply -auto-approve

# Get the server IP
SERVER_IP=$(terraform output -raw server_ip)
echo -e "${GREEN}✓ Server created: ${SERVER_IP}${NC}"
echo ""

# Step 2: Update Ansible inventory
echo -e "${YELLOW}Step 2/4: Updating Ansible inventory...${NC}"
cd "$SCRIPT_DIR/ansible"
sed -i.bak "s/YOUR_SERVER_IP/${SERVER_IP}/g" inventory.ini
rm -f inventory.ini.bak
echo -e "${GREEN}✓ Inventory updated${NC}"
echo ""

# Step 3: Wait for server to be ready
echo -e "${YELLOW}Step 3/4: Waiting for server to be ready...${NC}"
echo "This may take 2-3 minutes for cloud-init to complete..."
sleep 30

# Check if SSH is available
MAX_ATTEMPTS=20
ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${SERVER_IP} "echo 'SSH ready'" 2>/dev/null; then
        break
    fi
    echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting..."
    sleep 10
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo -e "${RED}Error: Could not connect to server via SSH${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Server is ready${NC}"
echo ""

# Step 4: Run Ansible
echo -e "${YELLOW}Step 4/4: Deploying with Ansible...${NC}"
ansible-playbook -i inventory.ini playbook.yml

echo ""
echo -e "${GREEN}"
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo -e "${NC}"
echo ""
echo "Server IP: ${SERVER_IP}"
echo ""
echo "URLs (may take a few minutes for SSL):"
echo "  - Main App:        https://matenweekend.nl"
echo "  - PocketBase Admin: https://matenweekend.nl/_/"
echo "  - Portainer:        https://portainer.matenweekend.nl"
echo ""
echo "Next Steps:"
echo "  1. Configure DNS (if not using Cloudflare):"
echo "     Add A records for matenweekend.nl -> ${SERVER_IP}"
echo ""
echo "  2. Create PocketBase admin account:"
echo "     Go to https://matenweekend.nl/_/"
echo ""
echo "  3. Import database schema:"
echo "     Settings -> Import collections -> pb_schema.json"
echo ""
echo "SSH Access:"
echo "  ssh root@${SERVER_IP}"
echo ""
