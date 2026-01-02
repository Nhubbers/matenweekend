# Matenweekend Infrastructure as Code

This repository contains everything needed to create the Matenweekend infrastructure from scratch.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure as Code                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Terraform         → Creates Hetzner server + firewall   │
│                                                             │
│  2. Ansible           → Installs Docker, deploys services   │
│                                                             │
│  3. PocketBase Schema → Configures database collections     │
│                                                             │
│  4. GitHub Actions    → CI/CD for frontend deployment       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Install these tools on your local machine:

```bash
# Terraform
brew install terraform        # macOS
# or: https://terraform.io/downloads

# Ansible
brew install ansible          # macOS
pip install ansible          # or via pip

# Optional: Hetzner CLI
brew install hcloud          # macOS
```

## Quick Start (5 commands)

```bash
# 1. Configure Terraform
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 2. Create server
terraform init
terraform apply

# 3. Update Ansible inventory with server IP
cd ../ansible
# Edit inventory.ini with the IP from terraform output

# 4. Deploy everything
ansible-playbook -i inventory.ini playbook.yml

# 5. Import PocketBase schema (manual step)
# Go to https://matenweekend.nl/_/ -> Settings -> Import collections
```

---

## Detailed Instructions

### Step 1: Get API Tokens

#### Hetzner Cloud API Token
1. Go to [console.hetzner.cloud](https://console.hetzner.cloud)
2. Select your project (or create one)
3. Go to **Security** → **API Tokens**
4. Click **Generate API Token**
5. Give it a name and select **Read & Write**
6. Copy the token (you won't see it again!)

#### (Optional) Cloudflare API Token
If you want automatic DNS management:
1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Create a token with **Zone:DNS:Edit** permission
3. Get your Zone ID from the domain overview page

### Step 2: Configure Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
hcloud_token = "your-hetzner-api-token-here"

ssh_public_key = "ssh-rsa AAAA... your@email.com"

# Optional: for automatic DNS
cloudflare_api_token = "your-cloudflare-token"
cloudflare_zone_id   = "your-zone-id"
```

### Step 3: Create Infrastructure

```bash
cd terraform

# Initialize Terraform
terraform init

# Preview what will be created
terraform plan

# Create the infrastructure
terraform apply
```

Terraform will output:
- Server IP address
- SSH command
- DNS instructions (if not using Cloudflare)

### Step 4: Configure DNS (if not using Cloudflare)

Add these DNS records at your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 300 |
| A | www | YOUR_SERVER_IP | 300 |
| A | portainer | YOUR_SERVER_IP | 300 |

Wait 5-10 minutes for DNS propagation.

### Step 5: Deploy with Ansible

```bash
cd ansible

# Update inventory with server IP
nano inventory.ini
# Change YOUR_SERVER_IP to actual IP

# Run the playbook
ansible-playbook -i inventory.ini playbook.yml
```

This will:
- Install Docker
- Configure firewall
- Copy all configuration files
- Start all containers
- Set up daily backups

### Step 6: Configure PocketBase

1. Go to `https://matenweekend.nl/_/`
2. Create your superuser account
3. Go to **Settings** → **Import collections**
4. Upload `pb_schema.json` (located in `ansible/files/`)
5. Click **Confirm**

### Step 7: Create First User

1. In PocketBase Admin, go to **users** collection
2. Click **+ New record**
3. Create your admin user with `isAdmin: true`

---

## File Structure

```
infrastructure/
├── README.md                 # This file
├── terraform/
│   ├── main.tf              # Terraform configuration
│   ├── terraform.tfvars.example
│   └── .gitignore
└── ansible/
    ├── inventory.ini        # Server inventory
    ├── playbook.yml         # Main playbook
    ├── templates/
    │   └── Caddyfile.j2    # Caddyfile template
    └── files/
        ├── docker-compose.yml
        ├── main.pb.js       # PocketBase hooks
        ├── pb_schema.json   # Database schema
        └── backup.sh        # Backup script
```

---

## Common Operations

### Destroy Everything
```bash
cd terraform
terraform destroy
```

### Recreate Server Only
```bash
cd terraform
terraform destroy -target=hcloud_server.matenweekend
terraform apply
cd ../ansible
ansible-playbook -i inventory.ini playbook.yml
```

### Update Configuration
```bash
cd ansible
# Edit files in files/ or templates/
ansible-playbook -i inventory.ini playbook.yml
```

### SSH into Server
```bash
ssh root@$(cd terraform && terraform output -raw server_ip)
```

### View Container Logs
```bash
ssh root@YOUR_IP "cd /opt/matenweekend && docker compose logs -f"
```

---

## Backup & Restore

### Manual Backup
```bash
ssh root@YOUR_IP "/opt/matenweekend/backup.sh"
```

### Restore from Backup
```bash
ssh root@YOUR_IP
cd /opt/matenweekend
docker compose down
tar -xzf /opt/backups/matenweekend_YYYYMMDD_HHMMSS.tar.gz
docker compose up -d
```

### Download Backup Locally
```bash
scp root@YOUR_IP:/opt/backups/latest.tar.gz ./backup.tar.gz
```

---

## Estimated Costs

| Resource | Monthly Cost |
|----------|--------------|
| Hetzner CPX11 (2 vCPU, 2GB) | ~€4.35 |
| Domain (matenweekend.nl) | ~€1.00 |
| Backblaze B2 (10GB free) | €0.00 |
| **Total** | **~€5.35** |

---

## Troubleshooting

### Terraform: "unauthorized"
- Check your `hcloud_token` is correct
- Token must have Read & Write permissions

### Ansible: "unreachable"
- Wait 2-3 minutes after Terraform for cloud-init to complete
- Check SSH key is correct
- Verify firewall allows port 22

### SSL Certificate Issues
- Wait 5-10 minutes after DNS changes
- Check DNS propagation: `dig matenweekend.nl`
- Check Caddy logs: `docker logs caddy`

### PocketBase: "hooks not loading"
- Check file encoding is UTF-8
- Check logs: `docker logs pocketbase`
- Restart: `docker compose restart pocketbase`

---

## Security Notes

1. **Never commit** `terraform.tfvars` (contains secrets)
2. **Use strong passwords** for PocketBase admin
3. **Keep backups** offsite (Backblaze B2 or similar)
4. **Update regularly**: `docker compose pull && docker compose up -d`

---

## Next Steps

After infrastructure is set up:

1. Set up PocketBase API rules (see main project documentation)
2. Deploy frontend via GitHub Actions
3. Test all functionality
4. Create user accounts for friends
