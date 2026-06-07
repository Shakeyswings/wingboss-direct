# Codex Handoff Prompt

You are working on the Wing⚡Boss Telegram Mini App ordering system.

Goal: assemble the provided Phase 3–8 packages into one runnable monorepo with:

1. React + Vite Telegram Mini App frontend
2. Node.js Telegram bot backend
3. JSON-driven menu/flavor/add-on/staff academy data
4. TMA order submission using Telegram WebApp.sendData
5. Bot receiving web_app_data payloads
6. Staff group kitchen summary
7. Customer confirmation
8. Heat Economy rules
9. Manual reward redemption
10. Safe local JSON persistence

Critical rules:
- Do not invent prices.
- Keep PRICE_REQUIRED_FROM_MENU where data is missing.
- Bot token must never be exposed in frontend.
- Staff group ID and owner/admin IDs must stay in backend .env only.
- Heat Points are awarded only when paymentStatus = paid, fulfillmentStatus = completed, refunded = false.
- Do not award Heat Points at order submission.
- Use original_uploads/legacy-index.js only as reference. Do not preserve unsafe or conflicting heat logic.
- Do not require paid services for MVP.
- Do not remove Staff Academy or testing docs.

Tasks:
1. Create final monorepo structure: apps/miniapp, apps/bot, shared, docs.
2. Move latest Phase 3 JSON data into apps/miniapp/src/data and apps/bot/menu.
3. Ensure frontend can run: cd apps/miniapp && npm install && npm run build.
4. Ensure bot can run: cd apps/bot && npm install && npm run check && npm run verify && npm start.
5. Add or update root README.md with exact setup steps.
6. Add .env.example for backend with BOT_TOKEN, STAFF_GROUP_ID, OWNER_TELEGRAM_ID, STAFF_TELEGRAM_IDS, MINI_APP_URL, TIMEZONE, USD_KHR_RATE.
7. Run static checks where possible.
8. Report files changed, commands run, passing checks, failing checks, missing env vars, and manual Telegram tests still required.

Do not claim deployment or live Telegram testing unless actually performed.
