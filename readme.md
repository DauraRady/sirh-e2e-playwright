![Playwright Tests](https://github.com/DauraRady/Playwright-OrangeHRM/actions/workflows/playwright.yml/badge.svg)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red.svg)
![Playwright](https://img.shields.io/badge/Playwright-1.53-45ba4b.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)
![Node](https://img.shields.io/badge/Node-20.x-339933.svg)
![Tests](https://img.shields.io/badge/Tests-20-brightgreen.svg)

# OrangeHRM — Playwright E2E Test Suite

Production-grade end-to-end tests for [OrangeHRM](https://opensource-demo.orangehrmlive.com), built with **Playwright** and **TypeScript**.

This project applies a **Risk-Based Testing** strategy — we don't test everything, we target critical business risks with deterministic, maintainable tests. The full rationale is documented in the [QA Risk Analysis](Docs/qa-risk-analysis-orangehrm.md).

## Quick Start

```bash
git clone https://github.com/DauraRady/Playwright-OrangeHRM.git
cd Playwright-OrangeHRM
npm install
npx playwright install chromium
cp .env.example .env
npx playwright test
```

## Test Coverage

| Priority | Module | Tests | What it validates |
|----------|--------|-------|-------------------|
| P0 | Auth | 5 | Login, invalid credentials, empty fields |
| P0 | Security | 3 | Unauthorized access redirect, role enforcement |
| P1 | Admin | 4 | User CRUD — create, search, delete with cleanup |
| P1 | PIM | 1 | Employee creation with detail verification |
| P1 | Leave | 2 | Leave page + mocked server error |
| P2 | Time | 1 | Punch in/out page |
| | **Total** | **17** | |

## Key Patterns

| Pattern | Why |
|---------|-----|
| `test.extend()` | POM injection — replaces `beforeEach`, type-safe and lazy |
| `test.step()` | Readable trace output for debugging in CI |
| `Promise.all` | Prevents race conditions between clicks and API responses |
| `Promise.race` | Detects success vs error after form submissions |
| `try/finally` | Guaranteed cleanup even when tests crash |
| `expect.poll()` | Deterministic data waits instead of `networkidle` |
| `page.route()` | API mocking for edge cases impossible to reproduce on shared demo |
| `storageState` | Login once, reuse session across all authenticated tests |

## Useful Commands

```bash
npx playwright test                          # Run all tests
npx playwright test --project=admin-tests    # Run one module
npx playwright test --grep "should redirect" # Run by test name
npx playwright test --headed --debug         # Debug with visible browser
npx playwright test --workers=1              # Sequential (like CI)
npx playwright show-report                   # Open HTML report
```

## CI/CD

Tests run on every push and PR via [GitHub Actions](.github/workflows/playwright.yml). Branch `master` is protected — CI must pass before merging. Reports and traces are uploaded as artifacts on failure.

## Documentation

- [QA Risk Analysis](Docs/qa-risk-analysis-orangehrm.md) — Risk matrix, audit, test selection rationale

## Author

[DauraRady](https://github.com/DauraRady)
