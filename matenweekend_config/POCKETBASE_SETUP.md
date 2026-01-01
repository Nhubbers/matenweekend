# PocketBase Setup from Config

## Option 1: Import Schema via Admin UI (Easiest)

1. Go to `https://matenweekend.nl/_/`
2. Create your superuser account (first time only)
3. Go to **Settings** (gear icon) → **Import collections**
4. Upload the `pb_schema.json` file
5. Review the changes and click **Confirm**

Done! All collections with fields and API rules are created.

---

## Option 2: Auto-setup via Migration File

Create this file on your server:

```bash
mkdir -p /opt/matenweekend/pb_migrations
nano /opt/matenweekend/pb_migrations/1704067200_init_schema.js
```

Paste the migration code (see `pb_migration_init.js` file).

Then update your `docker-compose.yml` to mount migrations:

```yaml
pocketbase:
  image: ghcr.io/muchobien/pocketbase:latest
  volumes:
    - ./pb_data:/pb_data
    - ./pb_hooks:/pb_hooks
    - ./pb_migrations:/pb_migrations  # Add this line
```

Restart PocketBase:
```bash
cd /opt/matenweekend
docker compose down
docker compose up -d
```

---

## IMPORTANT: Preventing Data Loss

### Why did you lose data?

The `pb_data` folder contains EVERYTHING:
- Database (SQLite)
- Uploaded files
- Settings

If you deleted the container AND the `pb_data` volume, everything is gone.

### How to prevent this:

#### 1. Never delete pb_data

```bash
# SAFE - just restarts containers:
docker compose restart

# SAFE - stops and removes containers (data preserved):
docker compose down

# DANGEROUS - removes volumes too:
docker compose down -v  # <-- NEVER DO THIS
```

#### 2. Backup pb_data regularly

Add this backup script:

```bash
cat > /opt/matenweekend/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Stop pocketbase briefly for consistent backup
cd /opt/matenweekend
docker compose stop pocketbase

# Backup entire pb_data directory
tar -czf $BACKUP_DIR/matenweekend_$DATE.tar.gz pb_data pb_hooks

# Start pocketbase again
docker compose start pocketbase

# Keep only last 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: matenweekend_$DATE.tar.gz"
EOF

chmod +x /opt/matenweekend/backup.sh
```

Run daily via cron:
```bash
crontab -e
# Add this line:
0 3 * * * /opt/matenweekend/backup.sh >> /var/log/backup.log 2>&1
```

#### 3. Use Hetzner Snapshots (before major changes)

1. Go to Hetzner Cloud Console
2. Select your server
3. Go to **Snapshots**
4. Click **Create Snapshot**

This creates a full server image you can restore from.

---

## Restore from Backup

If things go wrong:

```bash
cd /opt/matenweekend

# Stop everything
docker compose down

# Restore from backup
tar -xzf /opt/backups/matenweekend_YYYYMMDD_HHMMSS.tar.gz

# Start again
docker compose up -d
```

---

## File Structure Reference

Your `/opt/matenweekend/` should look like:

```
/opt/matenweekend/
├── docker-compose.yml
├── Caddyfile
├── backup.sh
├── pb_data/              # ⚠️ NEVER DELETE - contains database
│   ├── data.db          # SQLite database
│   ├── storage/         # Uploaded files
│   └── types.d.ts
├── pb_hooks/
│   └── main.pb.js       # Server-side hooks
└── pb_migrations/        # Optional - auto-setup migrations
    └── 1704067200_init_schema.js
```

---

## Quick Recovery Checklist

If you need to set up from scratch again:

1. [ ] Create server & install Docker
2. [ ] Create directory: `mkdir -p /opt/matenweekend/{pb_data,pb_hooks}`
3. [ ] Copy `docker-compose.yml` and `Caddyfile`
4. [ ] Copy `pb_hooks/main.pb.js`
5. [ ] Run `docker compose up -d`
6. [ ] Import `pb_schema.json` via Admin UI
7. [ ] Create admin user with `isAdmin: true`
8. [ ] Set up backup script

All these files should be kept in your GitHub repo or backed up somewhere safe!
