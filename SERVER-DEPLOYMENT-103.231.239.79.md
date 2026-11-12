# Production Deployment Guide
## Server: 103.231.239.79 · Domain: english.aloeducation.com

---

## Architecture

| Component | Value |
|---|---|
| Server IP | 103.231.239.79 |
| Domain | english.aloeducation.com |
| WWW | www.english.aloeducation.com |
| OS | Ubuntu 24.04 LTS |
| Runtime | Node.js 22 LTS |
| Package Manager | Bun |
| Framework | Next.js 16 standalone |
| Database | SQLite via Prisma ORM |
| Reverse Proxy | Caddy (automatic HTTPS) |
| Process Manager | systemd |
| App User | aloenglish |
| App Port | 3000 |
| Service Name | alo-english.service |

---

## Step 1: SSH into your server

```bash
ssh root@103.231.239.79
```

## Step 2: Install Node.js 22 + Bun

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

Verify:
```bash
node --version   # should show v22.x
bun --version    # should show 1.x
```

## Step 3: Create application user

```bash
sudo useradd -r -m -d /opt/alo-english -s /bin/bash aloenglish
sudo mkdir -p /opt/alo-english/{releases,shared/db,shared/uploads,shared/logs}
sudo chown -R aloenglish:aloenglish /opt/alo-english
```

## Step 4: Upload the source package

From your local machine:
```bash
scp dist/ALO_EDUCATION_COMPLETE_SOURCE.tar.gz root@103.231.239.79:/opt/alo-english/
```

On the server:
```bash
cd /opt/alo-english
tar -xzf ALO_EDUCATION_COMPLETE_SOURCE.tar.gz
mv alo-education-complete-source source
chown -R aloenglish:aloenglish /opt/alo-english
```

## Step 5: Create production .env

```bash
cp /opt/alo-english/source/.env.example /opt/alo-english/shared/.env

# Generate AUTH_SECRET
openssl rand -base64 48

# Edit the .env file
nano /opt/alo-english/shared/.env
```

Set these values:
```ini
NODE_ENV=production
APP_URL=https://english.aloeducation.com
DATABASE_URL=file:/opt/alo-english/shared/db/app.db
AUTH_SECRET=<paste the openssl output here>
ADMIN_SEED_EMAIL=admin@aloeducation.com
```

Secure the file:
```bash
chmod 600 /opt/alo-english/shared/.env
chown aloenglish:aloenglish /opt/alo-english/shared/.env
```

## Step 6: Install dependencies + build + migrate

```bash
sudo -u aloenglish bash -c '
cd /opt/alo-english/source
bun install --frozen-lockfile
bun run db:generate
bun run db:migrate
bun run db:seed
bun run build
'
```

**Save the admin password** printed by the seed command.

## Step 7: Copy build output to release directory

```bash
RELEASE_DIR="/opt/alo-english/releases/$(date +%Y%m%d%H%M%S)"
sudo -u aloenglish bash -c "
mkdir -p $RELEASE_DIR
cp -r /opt/alo-english/source/.next/standalone $RELEASE_DIR/
cp -r /opt/alo-english/source/.next/static $RELEASE_DIR/.next/static
cp -r /opt/alo-english/source/public $RELEASE_DIR/public
cp -r /opt/alo-english/source/prisma $RELEASE_DIR/prisma
cp /opt/alo-english/source/package.json $RELEASE_DIR/
ln -sfn $RELEASE_DIR /opt/alo-english/current
"
```

## Step 8: Install systemd service

```bash
cat > /etc/systemd/system/alo-english.service << 'EOF'
[Unit]
Description=ALO Education Platform (Next.js standalone)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=aloenglish
Group=aloenglish
WorkingDirectory=/opt/alo-english/current
EnvironmentFile=/opt/alo-english/shared/.env
ExecStart=/usr/bin/node /opt/alo-english/current/standalone/server.js
Restart=always
RestartSec=5

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/alo-english/shared
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable alo-english
systemctl start alo-english
```

## Step 9: Install + configure Caddy (HTTPS reverse proxy)

```bash
apt install -y caddy

cat > /etc/caddy/Caddyfile << 'EOF'
english.aloeducation.com, www.english.aloeducation.com {
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    encode gzip zstd

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        Permissions-Policy camera=(), microphone=(), geolocation=()
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }

    log {
        output file /var/log/caddy/english.aloeducation.com.log
        format json
    }
}
EOF

systemctl reload caddy
```

## Step 10: Configure firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Step 11: Verify deployment

```bash
# Check service is running
systemctl status alo-english

# Check local health
curl http://localhost:3000/api/health

# Check public HTTPS (after DNS propagates)
curl -s -o /dev/null -w "%{http_code}" https://english.aloeducation.com/api/health

# Check homepage
curl -s -o /dev/null -w "%{http_code}" https://english.aloeducation.com/
```

Expected results:
- `systemctl status` → active (running)
- `/api/health` → `{"status":"healthy",...}`
- `/` → HTTP 200

## Step 12: Set up backup cron

```bash
crontab -u aloenglish -e
```

Add:
```cron
0 2 * * * cd /opt/alo-english/source && bash scripts/backup.sh >> /opt/alo-english/shared/logs/backup.log 2>&1
```

---

## Post-Deployment Checklist

- [ ] DNS A records point to 103.231.239.79 (you confirmed this)
- [ ] `https://english.aloeducation.com/` loads (homepage)
- [ ] `https://english.aloeducation.com/api/health` returns healthy JSON
- [ ] `https://english.aloeducation.com/login` loads
- [ ] `https://english.aloeducation.com/register` loads
- [ ] Login with admin credentials works
- [ ] Admin dashboard at `/admin/dashboard` loads
- [ ] SSL certificate is valid (Caddy auto-provisions via Let's Encrypt)
- [ ] Firewall allows only 22, 80, 443

## Common Issues

### Caddy not getting SSL certificate
- Ensure ports 80+443 are open: `ufw allow 80,443/tcp`
- Check DNS: `dig english.aloeducation.com` should return 103.231.239.79
- Check Caddy logs: `journalctl -u caddy -f`

### Service won't start
- Check logs: `journalctl -u alo-english -n 50`
- Verify .env exists: `ls -la /opt/alo-english/shared/.env`
- Verify build exists: `ls -la /opt/alo-english/current/standalone/server.js`

### Database connection error
- Check DATABASE_URL in .env points to `/opt/alo-english/shared/db/app.db`
- Run migration: `cd /opt/alo-english/source && bun run db:migrate`
