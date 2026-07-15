# ALO English Test Platform — Complete Production Deployment Guide
## english.aloeducation.com

## What This Platform Is

**Public website** (english.aloeducation.com): A premium English exam practice platform with 32 computer-based exam types, 120+ original questions, timed mock tests with real exam interface, scoring, results, certificates, student/admin/examiner/ambassador portals.

**Hidden AI OS** (only Super Admin + Country Manager): The entire English exam system is powered by the AI Education, Research & Media OS — 15 AI modules that generate questions, evaluate writing/speaking, create videos, manage marketing, automate social media, and run analytics. No one except the 2 authorized people can see or access the AI OS.

---

## HOW to Publish (Step-by-Step)

### Step 1: Prepare the Server
```
Server: Ubuntu 22.04 LTS
User: aloedu
Path: /var/www/english-aloeducation
Port: 3002 (internal)
Public: https://english.aloeducation.com
```

### Step 2: Install Dependencies
```bash
# Install Node.js 20+ and Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install Nginx
sudo apt update && sudo apt install -y nginx

# Install MariaDB
sudo apt install -y mariadb-server
sudo systemctl start mariadb
sudo mysql_secure_installation
```

### Step 3: Create Database
```sql
CREATE DATABASE english_aloeducation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aloedu'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON english_aloeducation.* TO 'aloedu'@'localhost';
FLUSH PRIVILEGES;
```

### Step 4: Deploy the Code
```bash
cd /var/www/english-aloeducation

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="mysql://aloedu:YOUR_PASSWORD@localhost:3306/english_aloeducation"
NEXTAUTH_URL="https://english.aloeducation.com"
NEXTAUTH_SECRET="YOUR_32_CHAR_RANDOM_SECRET"
NODE_ENV=production
PORT=3002
HOSTNAME=127.0.0.1
EOF

# Install dependencies
bun install

# Build the project
bun run build

# Create uploads directory
mkdir -p uploads
chown -R aloedu:aloedu uploads
```

### Step 5: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/english-aloeducation
```
Paste:
```nginx
server {
    listen 80;
    server_name english.aloeducation.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name english.aloeducation.com;

    ssl_certificate /etc/letsencrypt/live/english.aloeducation.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/english.aloeducation.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /uploads/ {
        alias /var/www/english-aloeducation/uploads/;
        expires 30d;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/english-aloeducation /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Step 6: Get SSL Certificate
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d english.aloeducation.com
```

### Step 7: Create systemd Service
```bash
sudo nano /etc/systemd/system/english-aloeducation.service
```
Paste:
```ini
[Unit]
Description=English ALOEducation Web Platform
After=network.target mariadb.service

[Service]
Type=simple
User=aloedu
WorkingDirectory=/var/www/english-aloeducation
ExecStart=/home/aloedu/.bun/bin/bun run server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3002
Environment=HOSTNAME=127.0.0.1

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable english-aloeducation
sudo systemctl start english-aloeducation
```

### Step 8: Verify
```bash
# Check service is running
sudo systemctl status english-aloeducation

# Test internal
curl http://127.0.0.1:3002/

# Test public
curl https://english.aloeducation.com/
```

---

## WHAT Everyone Sees (Public)

### Pages
| Page | URL | Description |
|---|---|---|
| Home | `/` | Hero, 32 exam types, free quota, mock tests, pricing, ambassador, CRM, testimonials, FAQ, lead capture |
| Exam Catalog | `/#computer-based-exams` | All 32 exams with filters |
| Free Quota | `/#quota` | 3 free ALO / 1 free public |
| Mock Tests | `/#mock-tests` | Mock test engine preview |
| Pricing | `/#pricing` | 4 plans (Free, Single, Bundle, Prep Course) |
| Ambassador | `/#ambassador` | Referral program |
| FAQ | `/#faq` | 8 questions |
| Contact | `/#contact` | Lead capture form |
| Login | Modal | Student/Admin/Examiner/Ambassador auth |

### Exam Interface (Real Exam Simulation)
| Feature | Status |
|---|---|
| Setup screen with exam selector | ✅ |
| Instructions screen with rules | ✅ |
| System readiness check (browser, internet, mic, audio) | ✅ |
| Section-based timed exam | ✅ |
| Section tabs (Listening, Reading, Writing, Speaking) | ✅ |
| Sticky timer with color warnings (green/amber/red) | ✅ |
| Question palette with answered/flagged/unanswered status | ✅ |
| Flag for review | ✅ |
| Auto-save answers | ✅ |
| Anti-refresh protection (beforeunload warning) | ✅ |
| Tab switch detection (proctor logging) | ✅ |
| Pause/resume | ✅ |
| Auto-submit when timer expires | ✅ |
| Auto-advance to next section | ✅ |
| Review screen before final submit | ✅ |
| Score report with band/CEFR estimate | ✅ |
| Skill breakdown (6 skills) | ✅ |
| Question-by-question review with explanations | ✅ |
| Practice disclaimer | ✅ |
| PDF download button | ✅ |

### Question Types Supported
| Type | Status |
|---|---|
| Single choice MCQ | ✅ |
| Multi-select MCQ (sentence equivalence) | ✅ |
| True/False/Not Given | ✅ |
| Fill in the blanks | ✅ |
| Dropdown blanks (text completion) | ✅ |
| Short answer | ✅ |
| Essay/writing (with word count) | ✅ |
| Speaking (with microphone recorder) | ✅ |
| Numeric/grid-in | ✅ |
| Quantitative comparison (Quantity A vs B) | ✅ |
| Data sufficiency (5 options A-E) | ✅ |
| Reorder paragraphs | ✅ |
| Read aloud | ✅ |
| Repeat sentence | ✅ |
| Describe image | ✅ |

### Portals
| Portal | Pages | Status |
|---|---|---|
| Student | Dashboard, Practice Tests, Mock Test, Results, Vouchers, Feedback, Study Plan, Messages, Settings | ✅ |
| Admin | Dashboard, Students, Question Bank, AI Agents, Vouchers, CRM Sync, Audit Logs, Reports, Settings | ✅ |
| Examiner | Dashboard, Writing Queue, Speaking Queue, Review Screen, Results | ✅ |
| Ambassador | Dashboard, Referrals, Vouchers, Commission, Marketing Kit, Settings | ✅ |

---

## WHAT Only Super Admin & Country Manager See (Hidden AI OS)

### Access Method
1. On the public site, click "v11.0 · System Status" (bottom-right corner — looks like a version number)
2. Staff Portal login screen appears
3. Select role: Super Admin or Country Manager
4. Enter email + password
5. AI OS dashboard appears

### AI OS Modules (15)
| Module | Purpose |
|---|---|
| AI Agent Center | Create unlimited AI agents |
| Research Center | Literature review, gap analysis, proposals |
| Education Center | AI tutors, quizzes, certificates |
| Parenting Center | Baby learning, child development |
| Course Builder | Auto-generate courses |
| Video Generator | Educational videos with scripts |
| Avatar Studio | Talking AI presenter |
| Voice Studio | AI voices with emotion |
| Image Studio | Educational images |
| Presentation Studio | Auto-generate slides |
| Marketing Center | Posts, captions, emails |
| Social Automation | Schedule to 13+ platforms |
| Workflow Automation | Chain AI tasks |
| Analytics Dashboard | Usage, performance |
| Admin Dashboard | Users, roles, API keys |
| English Test Platform | Manage the exam system |

### Logout
Click "Sign out to English Platform" → returns to public site

---

## WHY This Architecture

| Decision | Reason |
|---|---|
| V11 as public | It's the complete, tested English exam platform |
| AI OS hidden | No one should know the exam system is AI-powered |
| "v11.0 · System Status" as login | Disguised as version number — not discoverable |
| Role-based access | Only 2 people can see the AI OS |
| Same codebase | English exam + AI OS in one deployment |

---

## WHERE to Edit Things

| What | File |
|---|---|
| Public website content | `src/components/alo/public-sections.tsx` |
| Exam catalog | `src/lib/exam-catalog.ts` |
| Question bank | `src/lib/question-bank.ts` |
| Mock test engine | `src/components/alo/mock-test-engine.tsx` |
| Student portal | `src/components/alo/student-portal.tsx` |
| Admin portal | `src/components/alo/portals.tsx` |
| AI OS modules | `src/components/ai-os/*.tsx` |
| Staff login | `src/app/page.tsx` (StaffLogin component) |
| Hidden login trigger | `src/app/page.tsx` (v11.0 · System Status button) |
| Brand colors | `src/app/globals.css` |
| Nginx config | `/etc/nginx/sites-available/english-aloeducation` |
| systemd service | `/etc/systemd/system/english-aloeducation.service` |
| Environment variables | `/var/www/english-aloeducation/.env` |

---

## Maintenance

### Daily
- Check service: `sudo systemctl status english-aloeducation`
- Check logs: `journalctl -u english-aloeducation -f`

### Weekly
- Renew SSL: `sudo certbot renew` (automatic)
- Update questions: Via AI OS → English Test Platform → Question Bank

### Monthly
- Backup database: `mysqldump -u aloedu -p english_aloeducation > backup.sql`
- Update packages: `sudo apt update && sudo apt upgrade`
- Check disk space: `df -h`

---

## Final Checklist Before Going Live

- [ ] Domain DNS points to server IP (103.231.239.79)
- [ ] Nginx config saved and tested
- [ ] SSL certificate issued
- [ ] systemd service running
- [ ] .env file configured with real DATABASE_URL and NEXTAUTH_SECRET
- [ ] `bun install` completed
- [ ] `bun run build` completed
- [ ] `curl https://english.aloeducation.com/` returns 200
- [ ] Exam catalog shows 32 exams
- [ ] Mock test engine works (setup → instructions → system check → exam → review → submit → score report)
- [ ] Student portal accessible
- [ ] Admin portal accessible
- [ ] "v11.0 · System Status" opens staff login
- [ ] Staff login works for Super Admin and Country Manager
- [ ] AI OS dashboard appears after login
- [ ] "Sign out" returns to public site
- [ ] No AI branding visible on public site
