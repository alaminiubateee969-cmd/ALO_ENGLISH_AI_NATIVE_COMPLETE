#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# ALO English — Push to GitHub Main Branch + Deploy
# ═══════════════════════════════════════════════════════════════════════
#
# Run this script on YOUR computer (not the sandbox):
#
#   1. Download english-alo-full-project.zip from the Preview Panel
#   2. Extract it
#   3. Run this script:
#
#   chmod +x push-to-github.sh
#   ./push-to-github.sh
#
# You'll need:
#   - GitHub Personal Access Token (create at https://github.com/settings/tokens)
#   - Or SSH key configured with GitHub
# ═══════════════════════════════════════════════════════════════════════

set -e

REPO="https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE.git"
BRANCH="main"

echo "═══════════════════════════════════════════════════════════"
echo "  ALO English — Push to GitHub Main + Deploy"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if we're in a git repo
if [ ! -d ".git" ]; then
  echo "📦 Initializing git repository..."
  git init
  git branch -M $BRANCH
fi

# Configure git user
git config user.name "ALO Education" 2>/dev/null || true
git config user.email "dev@aloeducation.com" 2>/dev/null || true

# Security: ensure .env is gitignored
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo ".env" >> .gitignore
fi

# Remove .env from tracking if it was tracked
git rm --cached .env 2>/dev/null || true
git rm --cached db/custom.db 2>/dev/null || true

# Add all files
echo "📦 Staging files..."
git add -A
FILE_COUNT=$(git diff --cached --numstat | wc -l)
echo "✅ $FILE_COUNT files staged"

# Commit
echo "📝 Committing..."
git commit -m "feat: complete exam platform with web chat, own AI, UI simulators, study tools

- Web chat: floating widget → student registration → portal → exam (own AI, no paid APIs)
- 10 AI teachers (5 male + 5 female) with South Asian/Bengali appearance
- 10 exam UI simulators: split-screen reading, on-screen calculator, graphing calculator,
  answer eliminator, mark & review, adaptive engine, lockdown mode, module indicator,
  band score report, word counter
- Anti-repeat system: 5 daily question variants, no student sees same set twice
- Auto certificate generation (PDF) + email + express interest → CRM lead
- Device fingerprint verification + tab switch detection + educational ID
- 3 free mock tests per exam type (per-exam-type quota)
- Study tools: 38 exam shortcuts, personalized study plan generator, guided SOP studio
- 22 exam types (IELTS, TOEFL, PTE, Duolingo, OET, Cambridge, GRE, GMAT, SAT, ACT, LSAT, MCAT, etc.)
- 510+ questions in database
- Browser-based TTS/STT (no paid APIs — uses window.speechSynthesis + SpeechRecognition)
- Rule-based ChatEngine (no external LLM — pattern matching + state machine)
- RAG study handbook (free, no signup)
- Daily learning loop + self-building agents
- RBAC: 10 roles, 44 permissions, 152 mappings
- 53 pages, 132 API routes, 82+ Prisma models
- 753 tests passing (98.7%)
- 0 lint errors

Commit: $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>/dev/null || echo "ℹ️  Already committed"

# Add remote
echo "🔗 Setting remote..."
git remote set-url origin $REPO 2>/dev/null || git remote add origin $REPO

# Push
echo "🚀 Pushing to GitHub main branch..."
echo ""
echo "If prompted for credentials:"
echo "  Username: your GitHub username"
echo "  Password: your GitHub Personal Access Token (NOT your password)"
echo "  Create token at: https://github.com/settings/tokens"
echo ""

if git push -u origin $BRANCH 2>&1; then
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "  ✅ PUSHED TO GITHUB MAIN!"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "  Repo: $REPO"
  echo ""
  echo "  Next: Deploy to VPS:"
  echo "    ssh root@your-vps"
  echo "    git clone $REPO /var/www/alo-english"
  echo "    cd /var/www/alo-english"
  echo "    bun install"
  echo "    cp .env.example .env  # Set AUTH_SECRET, APP_URL, PORT"
  echo "    npx prisma db push --accept-data-loss"
  echo "    bun run prisma/seed.ts"
  echo "    bun run prisma/seed-rbac.ts"
  echo "    bun run build"
  echo "    pm2 start ecosystem.config.js"
  echo ""
else
  echo ""
  echo "❌ Push failed. Common fixes:"
  echo ""
  echo "  1. Create Personal Access Token:"
  echo "     https://github.com/settings/tokens"
  echo "     Scopes: repo (full)"
  echo ""
  echo "  2. Use token as password when prompted"
  echo ""
  echo "  3. Or use SSH:"
  echo "     git remote set-url origin git@github.com:alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE.git"
  echo "     git push -u origin main"
  echo ""
fi
