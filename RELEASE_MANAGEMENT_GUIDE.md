# Release Management Guide

## Development Workflow
1. Feature branch
2. Run: bun run lint && bun run typecheck && bun test
3. Pull request
4. CI pipeline runs
5. Merge to main

## Deployment
1. CI passes
2. Archive: make archive
3. Upload to server
4. Deploy: bash scripts/install.sh
5. Verify: bash scripts/healthcheck.sh

## Rollback
bash scripts/rollback.sh --list
bash scripts/rollback.sh

## Versioning
Semantic versioning (MAJOR.MINOR.PATCH)
