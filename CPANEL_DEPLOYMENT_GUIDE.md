# cPanel Deployment Guide

## Overview
This guide covers deploying the ALO Education platform to a cPanel/shared hosting environment.

## Prerequisites
- cPanel access with Terminal enabled
- Node.js 22+ (via cPanel Setup Node.js App)
- SQLite or MySQL database access
- SSL certificate (Let's Encrypt via cPanel)

## Step 1: Upload Source
1. Log into cPanel File Manager
2. Navigate to your domain's document root (e.g., `public_html/`)
3. Upload `ALO_EDUCATION_PRODUCTION_DEPLOYMENT.tar.gz`
4. Extract the archive

## Step 2: Setup Node.js App
1. In cPanel, go to **Software → Setup Node.js App**
2. Click **Create Application**
3. Set:
   - Node.js version: 22
   - Application mode: Production
   - Application root: `/home/username/alo-english`
   - Application URL: `english.aloeducation.com`
   - Application startup file: `server.js`

## Step 3: Install Dependencies
```bash
cd /home/username/alo-english
bun install --frozen-lockfile
```

## Step 4: Environment Configuration
```bash
cp .env.example .env
nano .env  # Set AUTH_SECRET, DATABASE_URL, etc.
```

Generate AUTH_SECRET:
```bash
openssl rand -base64 48
```

## Step 5: Database Setup
```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

## Step 6: Build
```bash
bun run build
```

## Step 7: Configure Passenger
Create `.htaccess` in `public_html`:
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

## Step 8: SSL
1. cPanel → SSL/TLS → Manage SSL sites
2. Select `english.aloeducation.com`
3. Issue Let's Encrypt certificate
4. Auto-renew: enable

## Step 9: Verify
```bash
curl https://english.aloeducation.com/api/health
```

## Troubleshooting
- **502 Bad Gateway**: Check Node.js app is running in cPanel
- **Database error**: Verify DATABASE_URL path
- **Build fails**: Check Node.js version (must be 22+)
