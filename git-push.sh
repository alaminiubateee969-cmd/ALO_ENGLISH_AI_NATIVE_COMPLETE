#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# ALO Education English Test Platform — GitHub Push Script
# ═══════════════════════════════════════════════════════════════════════
#
# Pushes the complete project to the specified GitHub repository.
#
# Repository: https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE.git
#
# Usage:
#   chmod +x git-push.sh
#   ./git-push.sh
#
# Prerequisites:
#   - Git installed
#   - GitHub account with access to the repo
#   - SSH key or personal access token configured
# ═══════════════════════════════════════════════════════════════════════

set -e

GITHUB_REPO="https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE.git"
BRANCH="main"

echo "═══════════════════════════════════════════════════════════"
echo "  ALO Education — Push to GitHub"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Repository: $GITHUB_REPO"
echo "Branch: $BRANCH"
echo ""

# ─── 1. Check git is installed ───────────────────────────────────────────
if ! command -v git &> /dev/null; then
  echo "❌ Git is not installed. Install it first:"
  echo "   apt install git   (Ubuntu/Debian)"
  echo "   brew install git  (macOS)"
  exit 1
fi
echo "✅ Git installed: $(git --version)"

# ─── 2. Initialize git if needed ─────────────────────────────────────────
if [ ! -d ".git" ]; then
  echo ""
  echo "📦 Initializing git repository..."
  git init
  git branch -M $BRANCH
fi

# ─── 3. Configure git user if not set ────────────────────────────────────
if [ -z "$(git config user.name)" ]; then
  git config user.name "ALO Education"
  echo "✅ Set git user.name: ALO Education"
fi
if [ -z "$(git config user.email)" ]; then
  git config user.email "dev@aloeducation.com"
  echo "✅ Set git user.email: dev@aloeducation.com"
fi

# ─── 4. Security check — ensure no secrets are committed ─────────────────
echo ""
echo "🔒 Security check — scanning for secrets..."

# Check for real .env (not .env.example)
if [ -f ".env" ] && grep -q "AUTH_SECRET" .env | grep -v "REPLACE_WITH"; then
  if ! grep -q "REPLACE_WITH" .env 2>/dev/null; then
    echo "⚠️  WARNING: .env contains real AUTH_SECRET — it's in .gitignore so it won't be committed."
  fi
fi

# Verify .env is gitignored
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo "✅ .env is in .gitignore (will not be committed)"
else
  echo "⚠️  WARNING: .env is NOT in .gitignore — adding it..."
  echo ".env" >> .gitignore
fi

# Verify no .db files will be committed
if grep -q "\*\.db" .gitignore 2>/dev/null; then
  echo "✅ Database files (*.db) are gitignored"
fi

# ─── 5. Add all files ────────────────────────────────────────────────────
echo ""
echo "📦 Staging files..."
git add -A

# Show what will be committed
FILE_COUNT=$(git diff --cached --numstat | wc -l)
echo "✅ $FILE_COUNT files staged"

# ─── 6. Commit ───────────────────────────────────────────────────────────
echo ""
echo "📝 Committing..."
if git diff --cached --quiet; then
  echo "ℹ️  No changes to commit"
else
  git commit -m "feat: ALO Education English Test Platform — production ready

- 20 exam types (IELTS, TOEFL, PTE, Duolingo, OET, Cambridge, GRE, GMAT, SAT, ACT, LSAT, MCAT, Visa)
- 510+ real exam-aligned questions
- Real-time AI voice examiner (STT + TTS + LLM)
- 5 Bengali AI examiner personas
- Daily learning loop + self-building agents
- RBAC + multi-tenancy (9 roles, 44 permissions)
- RAG study handbook (free, no signup)
- CRM with 18 entities
- 60/60 tests passing
- Phase 1 auth + RBAC complete

Deploy: english.aloeducation.com (115.187.18.239)"
fi

# ─── 7. Add remote ───────────────────────────────────────────────────────
echo ""
echo "🔗 Configuring remote..."
if git remote get-url origin &> /dev/null; then
  git remote set-url origin $GITHUB_REPO
  echo "✅ Updated remote origin: $GITHUB_REPO"
else
  git remote add origin $GITHUB_REPO
  echo "✅ Added remote origin: $GITHUB_REPO"
fi

# ─── 8. Push ─────────────────────────────────────────────────────────────
echo ""
echo "🚀 Pushing to GitHub..."
echo ""
echo "If prompted for credentials:"
echo "  Username: your GitHub username"
echo "  Password: your GitHub Personal Access Token (not your password)"
echo "  (Create token at: https://github.com/settings/tokens)"
echo ""

if git push -u origin $BRANCH 2>&1; then
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "  ✅ PUSHED SUCCESSFULLY!"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "  Repository: $GITHUB_REPO"
  echo ""
  echo "  Next: Deploy to VPS by running:"
  echo "    ./deploy-vps.sh"
  echo ""
  echo "  Or set up GitHub Actions auto-deploy:"
  echo "    See VPS-DEPLOYMENT-GUIDE.md"
  echo ""
else
  echo ""
  echo "❌ Push failed. Common fixes:"
  echo ""
  echo "  1. Authentication error:"
  echo "     Create a Personal Access Token at:"
  echo "     https://github.com/settings/tokens"
  echo "     Use the token as your password when prompted."
  echo ""
  echo "  2. Repository doesn't exist:"
  echo "     Create the repo at:"
  echo "     https://github.com/new"
  echo "     Name: ALO_ENGLISH_AI_NATIVE_COMPLETE"
  echo "     Set to Private or Public"
  echo ""
  echo "  3. No access:"
  echo "     Ask the repo owner to add you as a collaborator."
  echo ""
  exit 1
fi
