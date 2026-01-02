#!/bin/bash
# Matenweekend Backup Script
# Run daily via cron: 0 3 * * * /opt/matenweekend/backup.sh >> /var/log/backup.log 2>&1

set -e

BACKUP_DIR="/opt/backups"
PROJECT_DIR="/opt/matenweekend"
DATE=$(date +%Y%m%d_%H%M%S)

echo "[$DATE] Starting backup..."

mkdir -p $BACKUP_DIR

cd $PROJECT_DIR

# Option 1: Hot backup using SQLite backup command (no downtime)
# This is safer for production
if command -v sqlite3 &> /dev/null; then
    echo "Using SQLite hot backup..."
    sqlite3 pb_data/data.db ".backup '$BACKUP_DIR/data_$DATE.db'"
    tar -czf $BACKUP_DIR/matenweekend_$DATE.tar.gz \
        -C $BACKUP_DIR data_$DATE.db \
        -C $PROJECT_DIR pb_hooks pb_migrations Caddyfile docker-compose.yml 2>/dev/null || true
    rm $BACKUP_DIR/data_$DATE.db
else
    # Option 2: Stop PocketBase briefly for consistent backup
    echo "Stopping PocketBase for backup..."
    docker compose stop pocketbase
    
    # Backup entire pb_data directory plus config files
    tar -czf $BACKUP_DIR/matenweekend_$DATE.tar.gz \
        pb_data pb_hooks pb_migrations Caddyfile docker-compose.yml 2>/dev/null || true
    
    # Start pocketbase again
    docker compose start pocketbase
fi

# Keep only last 7 backups locally
ls -t $BACKUP_DIR/matenweekend_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm

echo "[$DATE] Backup completed: matenweekend_$DATE.tar.gz"
echo "[$DATE] Backup size: $(du -h $BACKUP_DIR/matenweekend_$DATE.tar.gz | cut -f1)"
