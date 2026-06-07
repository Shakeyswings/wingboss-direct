# Wing⚡Boss Direct — Master Package

Generated: 2026-06-07

This master ZIP contains all generated project packages for the Wing⚡Boss Telegram Mini App / Telegram Bot ordering system.

## Contents

### original_uploads/
- `WingBoss_Bot_JSON_Package.zip` — original uploaded JSON package used as source/reference.
- `legacy-index.js` — uploaded legacy bot file used as reference only.

### phase_packages/
- Phase 3 — app-ready JSON data
- Phase 4 — React + Vite Telegram Mini App frontend
- Phase 5 — Telegram Bot backend
- Phase 6 — Staff Academy + SOP package
- Phase 7 — Testing + QA package
- Phase 8 — Final implementation instructions

### generated_source_folders/
Expanded versions of the generated phase folders for easier browsing and upload to Codex/GitHub.

## Recommended Codex flow

1. Upload this ZIP into a private GitHub repo or extract it locally.
2. Ask Codex to assemble the final monorepo from `generated_source_folders/`.
3. Treat `original_uploads/legacy-index.js` as reference only.
4. Do not commit `.env` files or real bot tokens.
5. Run frontend/backend checks before live Telegram testing.

## Critical rules

- Do not invent prices.
- Keep `PRICE_REQUIRED_FROM_MENU` where source data is missing.
- Bot token must remain backend-only.
- Heat Points must only be awarded after order is paid, completed, and not refunded.
- Deployment and live Telegram testing have not been performed inside this package.
