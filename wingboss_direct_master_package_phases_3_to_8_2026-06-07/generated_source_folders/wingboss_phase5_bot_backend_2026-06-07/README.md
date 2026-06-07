# Wing⚡Boss Phase 5 — Telegram Bot Backend

Status: Prepared. This package patches/builds the Telegram bot backend for the Phase 4 React + Vite Telegram Mini App payload.

## What this backend does

- Launches the Telegram Mini App with `/start` and `/menu`.
- Receives `web_app_data` payloads from the TMA.
- Validates and normalizes `wingboss_tma_order_v1` orders.
- Sends a short customer confirmation.
- Sends a kitchen-readable staff summary to the staff group.
- Tracks order lifecycle with staff inline buttons.
- Applies the locked Heat Economy rule: Heat Points are awarded only when the order is paid, completed, and not refunded.
- Stores persistent JSON in `apps/bot/data` using atomic writes.

## What this backend does not claim

- It has not been deployed.
- It has not been tested live against Telegram in this environment.
- It does not invent missing menu prices.
- It does not store payment-card data.

## Setup

```bash
cd apps/bot
cp .env.example .env
npm install
npm run check
npm run verify
npm start
```

## Required environment variables

```env
BOT_TOKEN=REQUIRED_FROM_BOTFATHER
STAFF_GROUP_ID=-1003653716341
OWNER_TELEGRAM_ID=5500590901
STAFF_TELEGRAM_IDS=5500590901
MINI_APP_URL=https://YOUR_STATIC_FRONTEND_URL_HERE
NODE_ENV=development
TIMEZONE=Asia/Phnom_Penh
USD_KHR_RATE=4100
```

## Staff lifecycle

Staff group buttons:

- Confirmed / Paid
- Need Info
- Cooking
- Ready
- Completed
- Cancelled
- Refunded

Heat Points are awarded only after:

```text
paymentStatus = paid
fulfillmentStatus = completed
refunded = false
```

## Legacy patch note

The uploaded legacy `index.js` is preserved in `docs/legacy-index.reference.js` for comparison. It should not be used as the production backend without fixing heat-point timing and callback-scope issues.
