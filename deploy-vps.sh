#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# ALO Education English Test Platform — VPS Deployment Script
# ═══════════════════════════════════════════════════════════════════════
# Server: 115.187.18.239 (server.aloeducation.com)
# Domain: english.aloeducation.com
#
# Usage:
#   chmod +x deploy-vps.sh
#   ./deploy-vps.sh
# ═══════════════════════════════════════════════════════════════════════

set -e

DOMAIN="english.aloeducation.com"
APP_DIR="/var/www/alo-education-english"
PORT=3000
WS_PORT=3003

echo "═══════════════════════════════════════════════════════════"
echo "  ALO Education English Test Platform — VPS Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── 1. Check root ──────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root: sudo ./deploy-vps.sh"
  exit 1
fi

# ─── 2. Install dependencies ───────────────────────────────────────────
echo "📦 Installing Node.js, Bun, PM2, Nginx..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
fi

if ! command -v certbot &> /dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi

echo "✅ Dependencies installed"

# ─── 3. Create app directory ───────────────────────────────────────────
echo ""
echo "📁 Creating app directory: $APP_DIR"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/db
mkdir -p $APP_DIR/upload

# ─── 4. Set up environment ─────────────────────────────────────────────
echo ""
echo "🔐 Setting up environment..."
if [ ! -f "$APP_DIR/.env" ]; then
  AUTH_SECRET=$(openssl rand -base64 48)
  cat > $APP_DIR/.env << EOF
DATABASE_URL="file:$APP_DIR/db/custom.db"
AUTH_SECRET="$AUTH_SECRET"
BCRYPT_COST="12"
AI_ENABLED="false"
NODE_ENV="production"
PORT="$PORT"
EOF
  echo "✅ .env created with generated AUTH_SECRET"
else
  echo "✅ .env already exists"
fi

# ─── 5. Set up Nginx ───────────────────────────────────────────────────
echo ""
echo "🌐 Setting up Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name english.aloeducation.com www.english.aloeducation.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
nginx -t
systemctl reload nginx
echo "✅ Nginx configured"

# ─── 6. Set up PM2 ─────────────────────────────────────────────────────
echo ""
echo "🚀 Setting up PM2..."
cd $APP_DIR

if pm2 describe alo-english &> /dev/null; then
  pm2 restart alo-english
  echo "✅ PM2 restarted"
else
  pm2 start "node_modules/.bin/next start -p $PORT" --name alo-english
  pm2 save
  pm2 startup
  echo "✅ PM2 started"
fi

# ─── 7. SSL Certificate ────────────────────────────────────────────────
echo ""
echo "🔒 Setting up SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "Getting SSL certificate (make sure DNS is pointing to this server first)..."
  certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@aloeducation.com
  echo "✅ SSL certificate installed"
else
  echo "✅ SSL certificate already exists"
fi

# ─── 8. Done ────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  App:        https://$DOMAIN"
echo "  App dir:    $APP_DIR"
echo "  Port:       $PORT"
echo "  WS Port:    $WS_PORT"
echo ""
echo "  Commands:"
echo "    pm2 status              — check app status"
echo "    pm2 logs alo-english    — view logs"
echo "    pm2 restart alo-english — restart app"
echo ""
echo "  Next steps:"
echo "    1. Upload your project files to: $APP_DIR"
echo "    2. Run: cd $APP_DIR && bun install && bun run db:push && bun run prisma:seed"
echo "    3. Build: cd $APP_DIR && bun run build"
echo "    4. Restart: pm2 restart alo-english"
echo ""
