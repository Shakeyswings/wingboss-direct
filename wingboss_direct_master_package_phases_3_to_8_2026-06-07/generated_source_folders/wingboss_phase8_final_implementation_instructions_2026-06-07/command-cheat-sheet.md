# Command Cheat Sheet

## Frontend

```bash
cd wingboss_phase4_tma_frontend_2026-06-07/apps/miniapp
npm install
npm run dev
npm run build
```

## Backend

```bash
cd wingboss_phase5_bot_backend_2026-06-07/apps/bot
cp .env.example .env
nano .env
npm install
npm run check
npm run verify
npm start
```

## JSON validate

```bash
python3 -m json.tool apps/miniapp/src/data/menu.json > /dev/null
python3 -m json.tool apps/bot/menu/menu.json > /dev/null
```

## Termux keepalive note

Use Termux for testing. For production, prefer a persistent backend host.
