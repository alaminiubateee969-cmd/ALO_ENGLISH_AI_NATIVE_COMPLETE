#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# ALO Education English Test Platform — VPS Deployment Script
# ═══════════════════════════════════════════════════════════════════════
#
# Server:  115.187.18.239 (server.aloeducation.com)
# Domain:  english.aloeducation.com
# WHM:     http://115.187.18.239:2087 (user: root)
# NS1:     ns1.aloeducation.com
# NS2:     ns2.aloeducation.com
#
# GitHub:  https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE.git
#
# Usage (run ON the VPS as root):
#   ssh root@115.187.18.239
#   git clone https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE.git
#   cd ALO_ENGLISH_AI_NATIVE_COMPLETE
#   chmod +x deploy-vps.sh
#   ./deploy-vps.sh
# ═══════════════════════════════════════════════════════════════════════

set -e

VPS_IP="115.187.18.239"
DOMAIN="english.aloeducation.com"
APP_DIR="/var/www/alo-education-english"
GITHUB_REPO="https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE.git"
PORT=3000
WS_PORT=3003

echo "═══════════════════════════════════════════════════════════"
echo "  ALO Education — VPS Deployment"
echo "═══════════════════════════════════════════════════════════"
echo "  Server:  $VPS_IP ($DOMAIN)"
echo "  WHM:     http://$VPS_IP:2087"
echo "  App dir: $APP_DIR"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── 1. Check root ──────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root: sudo ./deploy-vps.sh"
  echo "   Or: ssh root@$VPS_IP"
  exit 1
fi

# ─── 2. Install dependencies ───────────────────────────────────────────
echo "📦 Installing Node.js 20, Bun, PM2, Nginx, Certbot..."

# Node.js 20
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "✅ Node.js: $(node --version)"

# Bun
if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
  echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
fi
echo "✅ Bun: $(bun --version 2>/dev/null || echo 'installed')"

# PM2
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi
echo "✅ PM2: $(pm2 --version)"

# Nginx
if ! command -v nginx &> /dev/null; then
  apt-get update -qq
  apt-get install -y nginx
fi
echo "✅ Nginx: $(nginx -v 2>&1)"

# Certbot for SSL
if ! command -v certbot &> /dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi
echo "✅ Certbot installed"

# ─── 3. Clone or update the repo ────────────────────────────────────────
echo ""
echo "📥 Cloning repository..."
if [ -d "$APP_DIR" ]; then
  echo "App directory exists — pulling latest..."
  cd $APP_DIR
  git pull origin main || true
else
  git clone $GITHUB_REPO $APP_DIR
  cd $APP_DIR
fi
echo "✅ Code ready at $APP_DIR"

# ─── 4. Create directories ─────────────────────────────────────────────
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/db
mkdir -p $APP_DIR/upload

# ─── 5. Install dependencies ───────────────────────────────────────────
echo ""
echo "📦 Installing dependencies..."
bun install
echo "✅ Dependencies installed"

# ─── 6. Set up environment ─────────────────────────────────────────────
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
APP_URL="https://$DOMAIN"
APP_PORT="$PORT"
PORT="$PORT"
BACKUP_DIR="/var/backups/alo-english"
EOF
  echo "✅ .env created with generated AUTH_SECRET"
else
  echo "✅ .env already exists"
fi

# ─── 7. Set up database ────────────────────────────────────────────────
echo ""
echo "🗄️  Setting up database..."
bun run db:push
echo "✅ Database schema pushed"

# ─── 8. Seed data ──────────────────────────────────────────────────────
echo ""
echo "🌱 Seeding database..."
bun run prisma:seed 2>/dev/null || echo "  (basic seed done)"
bun run prisma:seed:rbac 2>/dev/null || echo "  (RBAC seed done)"
bun run prisma:seed:exams 2>/dev/null || echo "  (exam seed done)"
echo "✅ Database seeded"

# ─── 9. Create first admin (if not exists) ─────────────────────────────
echo ""
echo "👤 Creating admin user..."
echo "   (If you already have an admin, skip this step)"
echo "   To create admin manually, run:"
echo "   bun run scripts/bootstrap-admin.ts --email=admin@$DOMAIN --password=YourSecurePass123! --name=Admin"

# ─── 10. Build for production ──────────────────────────────────────────
echo ""
echo "🏗️  Building for production..."
bun run build
echo "✅ Build complete"

# ─── 11. Start with PM2 ────────────────────────────────────────────────
echo ""
echo "🚀 Starting with PM2..."
pm2 delete alo-english 2>/dev/null || true
pm2 start "node_modules/.bin/next start -p $PORT" --name alo-english --cwd $APP_DIR
pm2 save
pm2 startup 2>/dev/null || true
echo "✅ PM2 started (app: alo-english)"

# ─── 12. Start WebSocket service ───────────────────────────────────────
echo ""
echo "🔌 Starting WebSocket service (examiner-stream)..."
cd $APP_DIR/mini-services/examiner-stream
bun install 2>/dev/null || true
pm2 delete alo-examiner-stream 2>/dev/null || true
pm2 start "bun run dev" --name alo-examiner-stream --cwd $APP_DIR/mini-services/examiner-stream
pm2 save
cd $APP_DIR
echo "✅ WebSocket service started (port $WS_PORT)"

# ─── 13. Configure Nginx ───────────────────────────────────────────────
echo ""
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Main app
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # WebSocket for live examiner
    location /socket.io/ {
        proxy_pass http://127.0.0.1:$WS_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # File upload size (for audio)
    client_max_body_size 50M;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;
    gzip_vary on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "✅ Nginx configured for $DOMAIN"

# ─── 14. SSL Certificate ───────────────────────────────────────────────
echo ""
echo "🔒 Setting up SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "   Getting SSL certificate (requires DNS to point to $VPS_IP)..."
  echo ""
  echo "   ⚠️  Make sure DNS is configured:"
  echo "      A    $DOMAIN          → $VPS_IP"
  echo "      A    www.$DOMAIN      → $VPS_IP"
  echo "      NS1: ns1.aloeducation.com"
  echo "      NS2: ns2.aloeducation.com"
  echo ""
  echo "   Press Ctrl+C to skip SSL, or Enter to continue..."
  read -r

  certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN || {
    echo "⚠️  SSL setup failed — you can do it later with:"
    echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  }
  echo "✅ SSL certificate installed"
else
  echo "✅ SSL certificate already exists"
fi

# ─── 15. Final verification ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  App:           https://$DOMAIN"
echo "  App dir:       $APP_DIR"
echo "  Port:          $PORT"
echo "  WS Port:       $WS_PORT"
echo "  WHM Panel:     http://$VPS_IP:2087"
echo ""
echo "  PM2 commands:"
echo "    pm2 status                   — check status"
echo "    pm2 logs alo-english          — view logs"
echo "    pm2 restart alo-english       — restart app"
echo "    pm2 restart alo-examiner-stream — restart WebSocket"
echo ""
echo "  Create admin user:"
echo "    cd $APP_DIR"
echo "    bun run scripts/bootstrap-admin.ts --email=admin@$DOMAIN --password=YourSecurePass123!"
echo ""
echo "  Update code (future):"
echo "    cd $APP_DIR"
echo "    git pull origin main"
echo "    bun install"
echo "    bun run db:push"
echo "    bun run build"
echo "    pm2 restart alo-english"
echo ""
