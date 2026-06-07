# Wing⚡Boss Phase 7 — Testing and QA Package

**Generated:** 2026-06-07  
**Status:** Prepared  
**Execution status:** Not run  
**Live Telegram tests:** Not run  
**Deployment tests:** Not run

This package provides the QA layer for the Wing⚡Boss Telegram Mini App and bot backend.

## Contents

- `manual-test-matrix.json` — full manual QA matrix.
- `payload-fixtures/` — valid, invalid, malformed, and heat-threshold payload fixtures.
- `heat-economy-test-spec.json` — locked Heat Economy QA rules and calculation cases.
- `integration-checklist.json` — frontend/backend/data integration checklist.
- `security-qa-checklist.json` — security and privacy QA checklist.
- `deployment-preflight-checklist.md` — launch preflight.
- `qa-execution-log-template.md` — copy/paste result log.
- `scripts/verify-phase7.py` — static verification for this QA package.
- `reference/` — copied Phase 3/5/6 reference files.

## Verification

Run:

```bash
python3 scripts/verify-phase7.py
```

This verifies package integrity only. It does not run Telegram, npm, or deployment tests.

## Non-negotiable pass criteria

- Customer can submit pickup order.
- Customer can submit delivery order only with address.
- Staff group receives readable kitchen summary.
- Missing prices display `Staff will confirm`, not fake totals.
- Heat Points are awarded only after paid + completed + not refunded.
- Staff/admin actions are protected.
- Bot token is not in frontend code.
- Unavailable items are blocked or clearly flagged.

