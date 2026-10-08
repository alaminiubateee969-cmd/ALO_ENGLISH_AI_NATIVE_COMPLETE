#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# git-push.sh — verify, then push the branch you are on.
#
# WHAT CHANGED AND WHY
#   This script used to bootstrap a delivery: `git init` if needed, `git add -A`,
#   commit everything under a canned "production ready" message, and
#   `git push -u origin main`. On a repository where a push to main triggers a
#   production deploy, that is a script for shipping unreviewed code straight to
#   live. Its secret check also never ran — `grep -q FILE | grep -v PATTERN`
#   tests the exit status of the SECOND grep, which always receives empty input,
#   so the guard was permanently false. And it appended `.env` to `.gitignore`
#   on every run, which is wrong now that `.env` is tracked deliberately.
#
#   It now does the three things a maintainer actually needs before a push:
#   runs the dependency-free gates, scans what is about to be pushed for
#   secrets, and says out loud that main auto-deploys.
#
# USAGE
#   ./git-push.sh              verify + push the current branch
#   ./git-push.sh --full       also lint, typecheck and build first
#   ./git-push.sh --dry-run    verify and scan, push nothing
#   ./git-push.sh --yes        skip the confirmation prompt
#
# It never runs `git add`, never commits, never force-pushes, and never switches
# branches. Commit your work first; this pushes what you committed.
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

REMOTE="origin"
FULL=0
DRY_RUN=0
ASSUME_YES=0

for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --yes|-y) ASSUME_YES=1 ;;
    --help|-h)
      sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)" >&2
      exit 2
      ;;
  esac
done

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "✗ Detached HEAD — check out a branch before pushing." >&2
  exit 1
fi

UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
if [[ -n "$UPSTREAM" ]]; then
  RANGE="${UPSTREAM}..HEAD"
else
  # No upstream yet: everything not already on the remote's default branch.
  RANGE="${REMOTE}/HEAD..HEAD"
fi

echo "═══════════════════════════════════════════════════════════"
echo "  ALO English — pre-push verification"
echo "═══════════════════════════════════════════════════════════"
echo "  branch:  $BRANCH"
echo "  range:   $RANGE"
echo ""

fail() {
  echo ""
  echo "✗ $1" >&2
  exit 1
}

# ─── 1. Is there anything to push? ────────────────────────────────────────

if ! git rev-parse --verify -q HEAD >/dev/null; then
  fail "no commits yet on $BRANCH"
fi

COMMITS="$(git rev-list --count "$RANGE" 2>/dev/null || echo 0)"

if [[ "$COMMITS" -eq 0 ]]; then
  echo "ℹ Nothing to push: $BRANCH has no commits ahead of the remote."
  [[ "$DRY_RUN" -eq 1 ]] && exit 0
  git push -u "$REMOTE" "$BRANCH"
  exit 0
fi

echo "▸ $COMMITS commit(s) to push"
git log --oneline "$RANGE" | sed 's/^/    /'
echo ""

# ─── 2. Uncommitted work ─────────────────────────────────────────────────
# Not fatal — you may be pushing deliberately from a dirty tree — but you
# should know that what you push is not what is on your disk.

if ! git diff --quiet || ! git diff --cached --quiet; then
  DIRTY=$(git status --porcelain | wc -l | tr -d ' ')
  echo "⚠ $DIRTY uncommitted change(s). They will NOT be pushed."
  git status --porcelain | head -10 | sed 's/^/    /'
  echo ""
fi

# ─── 3. Repository gates (no dependencies, no engine, no database) ────────

echo "▸ Repository gates"
node scripts/check-manifest.mjs >/dev/null || fail "scripts/check-manifest.mjs — see its output above"
echo "  ✓ manifest preflight"
node scripts/check-schema-migrations.mjs >/dev/null || fail "scripts/check-schema-migrations.mjs"
echo "  ✓ schema/migration parity"

if [[ "$FULL" -eq 1 ]]; then
  echo "▸ Full gates (--full)"
  npm run lint >/dev/null || fail "npm run lint"
  echo "  ✓ lint"
  npm run typecheck >/dev/null || fail "npm run typecheck"
  echo "  ✓ typecheck"
  npm run build >/dev/null || fail "npm run build"
  echo "  ✓ build"
  node scripts/smoke-standalone.mjs >/dev/null || fail "scripts/smoke-standalone.mjs"
  echo "  ✓ artifact smoke test"
fi
echo ""

# ─── 4. Secret scan over what is about to be pushed ──────────────────────
#
# Scans the diff, not the working tree, so it only reports secrets that would
# actually leave this machine. The tracked `.env` and `.env.example` hold
# documented placeholders; those are allow-listed by value, not by filename, so
# a real secret dropped into either file is still caught.

echo "▸ Secret scan"

PLACEHOLDERS='REPLACE_WITH_RANDOM_32_CHAR_STRING|change-me-in-hostinger-panel|://user:password@|user:password@localhost|GENERATE_WITH_openssl_rand_base64_48|ci-test-secret-not-for-production-use|smoke-test-secret-not-used-in-production|your-strong-password|CONFIGURE_IN_HOSTINGER_PANEL|SET_AN_ABSOLUTE_PATH_IN_THE_PANEL|<openssl rand -base64 48>|xxxxxxxxxxxx'

DIFF_FILE="$(mktemp)"
trap 'rm -f "$DIFF_FILE"' EXIT
git diff "$RANGE" > "$DIFF_FILE" 2>/dev/null || true

# Only added lines can introduce a secret.
ADDED="$(grep -E '^\+' "$DIFF_FILE" | grep -vE '^\+\+\+' || true)"

scan() {
  local label="$1" pattern="$2"
  local hits
  hits=$(printf '%s\n' "$ADDED" | grep -E "$pattern" | grep -Ev "$PLACEHOLDERS" || true)
  if [[ -n "$hits" ]]; then
    echo ""
    echo "✗ Possible $label in what you are about to push:"
    printf '%s\n' "$hits" | head -5 | sed 's/^/    /'
    echo ""
    echo "  Remove it, rotate it, and keep it in the host's environment panel."
    echo "  If this is a false positive, the value is on the line above — inspect it."
    exit 1
  fi
  echo "  ✓ no $label"
}

scan "private keys"          'BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY'
scan "GitHub tokens"         '\bgh[pousr]_[A-Za-z0-9]{30,}'
scan "AWS keys"              '\b(AKIA|ASIA)[0-9A-Z]{16}\b'
scan "Slack tokens"          '\bxox[baprs]-[A-Za-z0-9-]{10,}'
scan "credential-bearing connection strings" '^[+].*(mysql|postgres(ql)?|mongodb(\+srv)?|redis|amqp)://[^/[:space:]]+:[^@[:space:]]+@'
scan "hardcoded secrets"     '(AUTH_SECRET|SECRET_KEY|API_KEY|APIKEY|ACCESS_TOKEN|PRIVATE_KEY|PASSWORD|PASSWD)[[:space:]]*[:=][[:space:]]*["'"'"']?[A-Za-z0-9+/_=-]{24,}'
echo ""

# ─── 5. Production warning ───────────────────────────────────────────────

if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "═══════════════════════════════════════════════════════════"
  echo "  ⚠ $BRANCH IS PRODUCTION"
  echo "═══════════════════════════════════════════════════════════"
  echo "  Hostinger deploys automatically from $BRANCH. Pushing starts"
  echo "  a production build within seconds: npm install, npm run build,"
  echo "  then the app restarts on https://english.aloeducation.com."
  echo ""
  echo "  There is no approval step and no staging environment."
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  if [[ "$ASSUME_YES" -ne 1 && "$DRY_RUN" -ne 1 ]]; then
    read -r -p "  Push $COMMITS commit(s) to $BRANCH and trigger a production deploy? [y/N] " reply
    case "$reply" in
      y|Y|yes|YES) ;;
      *) echo "  Aborted. Nothing was pushed."; exit 0 ;;
    esac
  fi
fi

# ─── 6. Push ─────────────────────────────────────────────────────────────

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "▸ --dry-run: verified and scanned, pushing nothing."
  exit 0
fi

echo "▸ Pushing $BRANCH → $REMOTE"
if [[ -n "$UPSTREAM" ]]; then
  git push "$REMOTE" "$BRANCH"
else
  git push -u "$REMOTE" "$BRANCH"
fi

echo ""
echo "✓ Pushed."
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo ""
  echo "  Watch the deploy:"
  echo "    https://github.com/$(git config --get remote.origin.url | sed -E 's#(https://github.com/|git@github.com:)##; s#\.git$##')/actions"
  echo "  Then verify:"
  echo "    curl https://english.aloeducation.com/api/health"
  echo ""
  echo "  See HOSTINGER_DEPLOYMENT.md → \"Verify a release\"."
fi
