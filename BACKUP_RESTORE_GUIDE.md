# Backup and Restore Guide

## What to Back Up
- SQLite database file
- User uploads
- Environment file
- Server config

## Backup
Manual: bash scripts/backup.sh
Cron: 0 2 * * * cd /opt/alo-english/current && bash scripts/backup.sh

## Restore
bash scripts/restore.sh <archive> --confirm
- Checksum verified
- Current DB backed up before overwrite
- Requires confirmation

## Retention
- Default: 14 days (BACKUP_RETENTION_DAYS)
- Monthly: copy to offsite storage

## Recovery Objectives
- RPO: 24 hours (daily backup)
- RTO: 30 minutes
