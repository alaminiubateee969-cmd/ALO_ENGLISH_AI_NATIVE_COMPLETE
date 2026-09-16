# Contributing to ALO Education English Test Platform

Thank you for your interest in contributing! This document covers the process for contributing to our open-source English exam platform.

## Quick Start

```bash
# 1. Fork & clone the repo
git clone https://github.com/YOUR_USERNAME/alo-education-english.git
cd alo-education-english

# 2. Install dependencies
bun install

# 3. Set up environment
cp .env.example .env
# Generate AUTH_SECRET: openssl rand -base64 48
# Edit .env with your AUTH_SECRET

# 4. Set up database
bun run db:push
bun run prisma:seed
bun run prisma:seed:rbac
bun run prisma:seed:exams

# 5. Start dev server
bun run dev
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Changes

Follow these guidelines:
- **TypeScript** throughout — no `any` types unless absolutely necessary
- **ESLint** must pass: `bun run lint`
- **Typecheck** must pass: `npx tsc --noEmit`
- **Tests** must pass: `bun test tests/`
- Use **shadcn/ui** components — don't build UI from scratch
- Follow the existing code style (2-space indent, double quotes, semicolons)

### 3. Test Your Changes

```bash
# Lint
bun run lint

# Type check
npx tsc --noEmit

# Run tests
bun test tests/

# Start dev server and verify manually
bun run dev
```

### 4. Commit

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(exam): add IELTS listening section 4"
git commit -m "fix(auth): resolve session expiry edge case"
git commit -m "docs(readme): update deployment instructions"
git commit -m "refactor(rbac): optimize permission cache"
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`, `ci`

### 5. Push & Create PR

```bash
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title following conventional commits
- Description of what changed and why
- Link to any related issues
- Screenshots if UI changes

## Code Style

### TypeScript
- Use strict typing — no implicit `any`
- Use `interface` for object shapes, `type` for unions
- Prefer `const` over `let`, never use `var`
- Use async/await over `.then()`

### React/Next.js
- Use `"use client"` directive for client components
- Use Server Components by default
- Use `next/image` for images, not `<img>`
- Use `next/link` for navigation, not `<a>`

### API Routes
- Always use `withErrorHandler` wrapper
- Always call `requireAuth()` or `requireSession()` first
- Use Zod for input validation
- Return consistent response shape via `ok()`, `badRequest()`, etc.

### Database
- Always use Prisma Client (`db` from `@/lib/db`)
- Never use raw SQL unless absolutely necessary
- Add indexes for frequently queried fields
- Use `cuid()` for IDs (Prisma default)

## Areas for Contribution

### High Priority
- **New exam questions** — add more questions for any exam type
- **Bug fixes** — check [GitHub Issues](../../issues)
- **Security improvements** — audit and report security issues
- **Test coverage** — add tests for untested routes

### Medium Priority
- **New exam types** — add support for new English proficiency tests
- **UI/UX improvements** — better mobile experience, accessibility
- **Documentation** — improve guides, add code comments
- **Performance** — optimize queries, add caching

### Low Priority
- **Internationalization** — add multi-language support
- **Dark mode** — theme toggle
- **Offline support** — PWA features

## Reporting Issues

### Bug Reports

Use the Bug Report template and include:
1. **Description** — what happened?
2. **Steps to reproduce** — exact steps
3. **Expected behavior** — what should have happened?
4. **Actual behavior** — what actually happened
5. **Environment** — OS, browser, Node version
6. **Screenshots** — if applicable

### Feature Requests

Use the Feature Request template and include:
1. **Problem** — what problem does this solve?
2. **Proposed solution** — how would you solve it?
3. **Alternatives** — any alternatives considered?
4. **Additional context** — mockups, examples, etc.

### Security Issues

**Do NOT open a public issue for security vulnerabilities.**

Email: security@aloeducation.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Pull Request Guidelines

### Before Submitting
- [ ] Code passes `bun run lint`
- [ ] Code passes `npx tsc --noEmit`
- [ ] All tests pass `bun test tests/`
- [ ] You've added tests for new features
- [ ] You've updated documentation if needed
- [ ] You've not committed `.env` or secrets

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Test improvement

## Testing
How did you test these changes?

## Checklist
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] No secrets committed
```

## Code Review Process

1. **Automated checks** — CI runs lint, typecheck, tests
2. **Manual review** — a maintainer reviews your code
3. **Approval** — at least one maintainer must approve
4. **Merge** — squash-and-merge to main

Reviewers look for:
- Security issues
- Performance concerns
- Code style consistency
- Test coverage
- Documentation

## Development Tips

### Debug Mode
```bash
# Enable debug logging
DEBUG=* bun run dev
```

### Database Inspection
```bash
# Open Prisma Studio (GUI for database)
bunx prisma studio
```

### Reset Database
```bash
# WARNING: This deletes all data
bun run db:reset
bun run prisma:seed
bun run prisma:seed:rbac
bun run prisma:seed:exams
```

### Run Specific Tests
```bash
bun test tests/rbac.test.ts
bun test tests/smoke.test.ts
```

## Community

- **Issues** — [GitHub Issues](../../issues)
- **Discussions** — [GitHub Discussions](../../discussions)
- **Email** — dev@aloeducation.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
