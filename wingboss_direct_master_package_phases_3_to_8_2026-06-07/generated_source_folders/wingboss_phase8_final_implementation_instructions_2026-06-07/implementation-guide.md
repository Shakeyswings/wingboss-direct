# Final Implementation Guide

## 1. Assemble source packages

Create a working folder:

```bash
mkdir -p ~/wingboss-direct-build
cd ~/wingboss-direct-build
```

Copy or download these packages into that folder:

```text
wingboss_phase4_tma_frontend_2026-06-07.zip
wingboss_phase5_bot_backend_2026-06-07.zip
wingboss_phase6_staff_academy_sop_2026-06-07.zip
wingboss_phase7_testing_qa_package_2026-06-07.zip
```

Unzip:

```bash
unzip wingboss_phase4_tma_frontend_2026-06-07.zip
unzip wingboss_phase5_bot_backend_2026-06-07.zip
unzip wingboss_phase6_staff_academy_sop_2026-06-07.zip
unzip wingboss_phase7_testing_qa_package_2026-06-07.zip
```

## 2. Frontend package path

```bash
cd ~/wingboss-direct-build/wingboss_phase4_tma_frontend_2026-06-07/apps/miniapp
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build static frontend:

```bash
npm run build
```

Expected output:

```text
dist/
```

If `npm run build` fails, do not deploy. Fix the build first.

## 3. Backend package path

```bash
cd ~/wingboss-direct-build/wingboss_phase5_bot_backend_2026-06-07/apps/bot
```

Create environment file:

```bash
cp .env.example .env
nano .env
```

Required values:

```env
BOT_TOKEN=YOUR_BOTFATHER_TOKEN
STAFF_GROUP_ID=-1003653716341
OWNER_TELEGRAM_ID=5500590901
STAFF_TELEGRAM_IDS=5500590901
MINI_APP_URL=https://YOUR_DEPLOYED_FRONTEND_URL
NODE_ENV=development
TIMEZONE=Asia/Phnom_Penh
USD_KHR_RATE=4100
```

Install backend dependencies:

```bash
npm install
```

Check syntax and package files:

```bash
npm run check
npm run verify
```

Start bot:

```bash
npm start
```

## 4. Staff Academy update path

Copy the expanded Staff Academy files into the frontend/backend menu data location if needed:

```bash
cp ../../wingboss_phase6_staff_academy_sop_2026-06-07/staff-academy-expanded.json \
  ../wingboss_phase4_tma_frontend_2026-06-07/apps/miniapp/src/data/staff-academy.json
```

Use the actual path on your machine. The point is: replace the smaller Phase 3 `staff-academy.json` with the expanded Phase 6 one when ready.

## 5. Launch sequence

1. Build frontend successfully.
2. Deploy frontend.
3. Copy deployed URL.
4. Add deployed URL to backend `.env` as `MINI_APP_URL`.
5. Configure Telegram BotFather Mini App / Web App button.
6. Start backend bot.
7. Run `/start` in Telegram.
8. Open Mini App.
9. Submit a test order.
10. Confirm staff group receives order.
11. Confirm staff buttons work.
12. Confirm customer receives status update.

## 6. Go-live rule

Do not announce public launch until:

- one pickup test works
- one delivery test works
- one missing-price test works
- one unavailable-item test works
- one staff status update works
- Heat Points are not awarded on order submit
- Heat Points are awarded only after paid + completed + not refunded
