# ═══════════════════════════════════════════════════════════════════════
# Makefile — ALO English Test Platform workflow shortcuts.
#
# Usage:
#   make help         — show all commands
#   make install      — install dependencies
#   make dev          — start dev server
#   make build        — production build
#   make verify       — run full verification gate
#   make deploy       — staged deployment (run on the server)
#   make rollback     — roll back to previous release
#   make backup       — create a backup
#   make health       — check health endpoint
#
# Every command prints WHAT/WHY/EXPECTED before running.
# ═══════════════════════════════════════════════════════════════════════

.PHONY: help install dev build start lint typecheck test verify preflight smoke inventories deploy rollback backup restore health db-setup db-seed db-reset clean archive

# Default shell — fail fast on errors.
SHELL := /usr/bin/env bash
.SHELLFLAGS := -Eeuo pipefail

# ─── Help ──────────────────────────────────────────────────────────────
help: ## Show all available commands
	@echo ""
	@echo "ALO English Test Platform — Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ─── Setup ─────────────────────────────────────────────────────────────
install: ## Install dependencies (bun for dev and CI; the host uses npm install)
	@echo "▸ Installing dependencies…"
	bun install --frozen-lockfile
	@echo "✓ Dependencies installed"

# ─── Development ───────────────────────────────────────────────────────
dev: ## Start the dev server on port 3000
	@echo "▸ Starting dev server…"
	bun run dev

build: ## Production build (standalone)
	@echo "▸ Building production bundle…"
	bun run build
	@echo "✓ Build complete: .next/standalone/server.js"

start: ## Start the production server
	@echo "▸ Starting production server…"
	bun run start

# ─── Quality ───────────────────────────────────────────────────────────
lint: ## Run ESLint
	@echo "▸ Linting…"
	bun run lint
	@echo "✓ Lint clean"

typecheck: ## Run TypeScript type check
	@echo "▸ Type checking…"
	bun run typecheck
	@echo "✓ Type check clean"

test: ## Run smoke tests
	@echo "▸ Running tests…"
	bun test tests/
	@echo "✓ Tests pass"

verify: ## Run the full verification gate (files, schema, lint, types, artifact, live boot)
	@echo "▸ Running verification gate…"
	bash scripts/verify.sh

# ─── Database ──────────────────────────────────────────────────────────
db-setup: ## Generate Prisma client + apply migrations + seed
	@echo "▸ Setting up database…"
	bun run db:generate
	bun run db:migrate
	bun run db:seed
	@echo "✓ Database ready"

db-seed: ## Seed the database
	@echo "▸ Seeding database…"
	bun run db:seed

db-reset: ## Reset the database (DESTRUCTIVE)
	@echo "⚠  Resetting database (all data will be lost)…"
	bun run db:reset

# ─── Deployment ────────────────────────────────────────────────────────
preflight: ## Dependency-free gates: manifest + schema/migration parity + inventories
	@echo "▸ Repository preflight…"
	node scripts/check-manifest.mjs
	node scripts/check-schema-migrations.mjs
	node scripts/generate-inventories.mjs --check
	@echo "✓ Preflight clean"

smoke: ## Boot the built artifact and assert it serves traffic (needs `make build` first)
	@echo "▸ Booting .next/standalone and probing it…"
	node scripts/smoke-standalone.mjs

inventories: ## Regenerate the four root inventory CSVs from source
	@echo "▸ Regenerating inventories…"
	node scripts/generate-inventories.mjs

deploy: ## OPTIONAL self-managed VPS release (scripts/install.sh). NOT production — see HOSTINGER_DEPLOYMENT.md
	@echo "⚠ This is the optional self-managed path. Production deploys automatically from main on Hostinger."
	@echo "  Read HOSTINGER_DEPLOYMENT.md before running this against the production domain."
	bash scripts/install.sh

rollback: ## Roll back to the previous release
	@echo "▸ Rolling back…"
	bash scripts/rollback.sh

# ─── Backup / Restore ──────────────────────────────────────────────────
backup: ## Create a database + uploads backup
	@echo "▸ Creating backup…"
	bash scripts/backup.sh

restore: ## Restore from a backup (interactive)
	@echo "▸ Restore (pass archive path: make restore FILE=xxx)"
	@if [ -z "$(FILE)" ]; then echo "ERROR: make restore FILE=path/to/backup.tar.gz"; exit 1; fi
	bash scripts/restore.sh "$(FILE)" --confirm

# ─── Health ────────────────────────────────────────────────────────────
health: ## Check the local health endpoint
	@echo "▸ Checking health…"
	bash scripts/healthcheck.sh

# ─── Clean ─────────────────────────────────────────────────────────────
clean: ## Remove build artifacts
	@echo "▸ Cleaning build artifacts…"
	rm -rf .next dist
	@echo "✓ Clean"

# ─── Archive ───────────────────────────────────────────────────────────
archive: ## Create the source archive + checksum
	@echo "▸ Creating source archive…"
	mkdir -p dist
	tar -czf dist/alo-english-source.tar.gz \
		--exclude='node_modules' --exclude='.next' --exclude='.git' \
		--exclude='dist' --exclude='*.log' --exclude='*.db' --exclude='.env' \
		--exclude='cpanel-production' --exclude='english-aloeducation' \
		--exclude='skills' --exclude='mini-services' --exclude='examples' \
		--exclude='tool-results' --exclude='worklog.md' \
		--transform='s,^\.,alo-english-test-platform,' \
		.
	sha256sum dist/alo-english-source.tar.gz > dist/alo-english-source.tar.gz.sha256
	@echo "✓ Archive: dist/alo-english-source.tar.gz"
	@cat dist/alo-english-source.tar.gz.sha256

# ─── All-in-one ────────────────────────────────────────────────────────
ci: preflight lint typecheck test build smoke ## Run all CI checks locally
	@echo "✓ All CI checks passed"

precommit: lint typecheck ## Pre-commit hook (lint + typecheck)
	@echo "✓ Pre-commit checks passed"
