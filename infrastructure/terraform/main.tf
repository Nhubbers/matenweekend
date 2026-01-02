# Matenweekend Infrastructure - Terraform

terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.0"
}

# Variables
variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for server access"
  type        = string
}

variable "ssh_private_key_path" {
  description = "Path to SSH private key for provisioning"
  type        = string
  default     = "~/.ssh/id_rsa"
}

# Optional: Cloudflare for DNS management
variable "cloudflare_api_token" {
  description = "Cloudflare API Token (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for matenweekend.nl (optional)"
  type        = string
  default     = ""
}

variable "domain" {
  description = "Domain name"
  type        = string
  default     = "matenweekend.nl"
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "cpx11"  # 2 vCPU, 2GB RAM, ~€4.35/month
}

variable "server_location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "fsn1"  # Falkenstein, Germany
}

# Provider configuration
provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# SSH Key
resource "hcloud_ssh_key" "default" {
  name       = "matenweekend-key"
  public_key = var.ssh_public_key
}

# Firewall
resource "hcloud_firewall" "matenweekend" {
  name = "matenweekend-firewall"

  # SSH
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow all outbound
  rule {
    direction = "out"
    protocol  = "tcp"
    port      = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "out"
    protocol  = "udp"
    port      = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "out"
    protocol  = "icmp"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

# Server
resource "hcloud_server" "matenweekend" {
  name        = "matenweekend"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.server_location

  ssh_keys = [hcloud_ssh_key.default.id]

  firewall_ids = [hcloud_firewall.matenweekend.id]

  labels = {
    project = "matenweekend"
    env     = "production"
  }

  # Cloud-init for initial setup
  user_data = <<-EOF
    #cloud-config
    package_update: true
    package_upgrade: true
    packages:
      - curl
      - git
      - sqlite3
    
    runcmd:
      # Install Docker
      - curl -fsSL https://get.docker.com | sh
      
      # Create project directory
      - mkdir -p /opt/matenweekend/{pb_data,pb_hooks,pb_migrations}
      
      # Set timezone
      - timedatectl set-timezone Europe/Amsterdam
  EOF
}

# DNS Records (only if Cloudflare is configured)
resource "cloudflare_record" "root" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = hcloud_server.matenweekend.ipv4_address
  type    = "A"
  ttl     = 300
  proxied = false
}

resource "cloudflare_record" "www" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = hcloud_server.matenweekend.ipv4_address
  type    = "A"
  ttl     = 300
  proxied = false
}

resource "cloudflare_record" "portainer" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "portainer"
  value   = hcloud_server.matenweekend.ipv4_address
  type    = "A"
  ttl     = 300
  proxied = false
}

# Outputs
output "server_ip" {
  description = "Server IPv4 address"
  value       = hcloud_server.matenweekend.ipv4_address
}

output "server_ipv6" {
  description = "Server IPv6 address"
  value       = hcloud_server.matenweekend.ipv6_address
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh root@${hcloud_server.matenweekend.ipv4_address}"
}

output "dns_instructions" {
  description = "DNS configuration instructions"
  value       = var.cloudflare_zone_id != "" ? "DNS records created automatically" : "Manually add A records for ${var.domain} pointing to ${hcloud_server.matenweekend.ipv4_address}"
}
