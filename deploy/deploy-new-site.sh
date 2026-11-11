#!/bin/bash
# The host's generic new-site deploy helper (kept in-repo for documentation).
# Usage: ./deploy-new-site.sh <project-name> <domain> <port>
# Example: ./deploy-new-site.sh blog blog.alolabs.net 3062
set -e
APP=$1
DOMAIN=$2
PORT=$3
if [ -z "$APP" ] || [ -z "$DOMAIN" ] || [ -z "$PORT" ]; then
  echo "Usage: $0 <app-name> <domain> <port>"
  exit 1
fi

echo "🚀 Deploying $APP → $DOMAIN on port $PORT"

# 1. Build project
cd ~/projects/$APP
npm install
npm run build

# 2. Start with PM2
PORT=$PORT pm2 start npm --name "$APP" -- start
pm2 save

# 3. Create Nginx config
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 4. Enable site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ Deployed! Now:"
echo "   1. Add Cloudflare DNS: A record '$DOMAIN' → 103.231.239.79 (Proxied)"
echo "   2. Test: curl -I http://127.0.0.1:$PORT"
echo "   3. Test: curl -I https://$DOMAIN"
