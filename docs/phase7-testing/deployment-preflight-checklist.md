# Wing⚡Boss Phase 7 — Deployment Preflight Checklist

**Status:** Prepared  
**Execution status:** Not run

## 1. Data preflight

- [ ] `menu.json` parses.
- [ ] `flavors.json` parses.
- [ ] `addons.json` parses.
- [ ] `heat-system.json` parses.
- [ ] `staff-academy-expanded.json` parses.
- [ ] No missing price is displayed as `$0.00`.
- [ ] Every unknown price displays `Staff will confirm`.
- [ ] Unavailable items are disabled or blocked.

## 2. Frontend preflight

```bash
cd wingboss_phase4_tma_frontend_2026-06-07/apps/miniapp
npm install
npm run build
```

Manual checks:

- [ ] Opens on Android Telegram.
- [ ] Opens in normal browser with safe fallback.
- [ ] Start Order works.
- [ ] Order Again works after one saved order.
- [ ] Staff Academy opens.
- [ ] Language fallback works.
- [ ] Heat meter appears.
- [ ] Bottle suggestion appears only at threshold.

## 3. Bot backend preflight

```bash
cd wingboss_phase5_bot_backend_2026-06-07/apps/bot
cp .env.example .env
npm install
npm run check
npm run verify
npm start
```

Manual checks:

- [ ] `/start` works.
- [ ] Mini App button opens correct URL.
- [ ] Valid TMA payload creates order.
- [ ] Staff group receives order.
- [ ] Malformed payload is rejected.
- [ ] Staff buttons require staff/admin authorization.
- [ ] Heat Points are not awarded on submit.
- [ ] Heat Points are awarded only after paid + completed + not refunded.

## 4. Launch go/no-go

Do **not** launch if any are true:

- [ ] Staff group does not receive orders.
- [ ] Missing prices show fake totals.
- [ ] Staff cannot identify item/flavor/add-ons quickly.
- [ ] Bot token appears in frontend.
- [ ] Heat Points award before completion.
- [ ] Customer can send delivery without address.
- [ ] Unavailable items can be ordered without warning.

