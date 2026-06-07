# Backend Deployment Guide

## Backend must be persistent

The bot backend must stay running to receive Telegram updates.

Termux is acceptable for testing. For production, use a persistent host when possible.

## Option A — Termux testing

See `termux-setup.md`.

## Option B — Render-style Node service

General steps:

1. Push Phase 5 backend to GitHub.
2. Create a new web service.
3. Set root directory:

```text
apps/bot
```

4. Build command:

```bash
npm install
```

5. Start command:

```bash
npm start
```

6. Add environment variables from `.env.example`.

## Option C — VPS

```bash
sudo apt update
sudo apt install nodejs npm git unzip
cd /opt
sudo mkdir wingboss-direct
sudo chown $USER:$USER wingboss-direct
cd wingboss-direct
unzip wingboss_phase5_bot_backend_2026-06-07.zip
cd wingboss_phase5_bot_backend_2026-06-07/apps/bot
cp .env.example .env
nano .env
npm install
npm run verify
npm start
```

For process persistence use `pm2`:

```bash
npm install -g pm2
pm2 start src/index.js --name wingboss-bot
pm2 save
pm2 status
```

## Backend post-deploy checklist

- Bot starts without missing env errors.
- `/start` responds.
- Mini App button uses correct deployed URL.
- Test payload reaches bot.
- Staff group receives message.
- Staff action buttons work.
- Owner/admin IDs are enforced.
