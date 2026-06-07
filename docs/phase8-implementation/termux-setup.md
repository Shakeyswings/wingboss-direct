# Termux Setup Guide

## 1. Install packages

```bash
pkg update && pkg upgrade
pkg install nodejs git unzip nano
node -v
npm -v
```

## 2. Create project folder

```bash
mkdir -p ~/wingboss-direct
cd ~/wingboss-direct
```

## 3. Unzip backend

```bash
unzip wingboss_phase5_bot_backend_2026-06-07.zip
cd wingboss_phase5_bot_backend_2026-06-07/apps/bot
```

## 4. Configure backend

```bash
cp .env.example .env
nano .env
```

Set:

```env
BOT_TOKEN=YOUR_REAL_TOKEN
STAFF_GROUP_ID=-1003653716341
OWNER_TELEGRAM_ID=5500590901
STAFF_TELEGRAM_IDS=5500590901
MINI_APP_URL=https://YOUR_FRONTEND_URL
TIMEZONE=Asia/Phnom_Penh
USD_KHR_RATE=4100
```

## 5. Install and run

```bash
npm install
npm run check
npm run verify
npm start
```

## 6. Termux uptime warning

Termux is acceptable for testing and short-term operation, but it is not ideal as the final production host unless the phone is always powered, online, unlocked enough to keep background services alive, and protected from battery optimization.

For stable production, move the backend to a persistent host.
